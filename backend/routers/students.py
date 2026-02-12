import logging
import asyncio
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel, Field
from utils.supabase import supabase
from services.integrations.platform_orchestrator import PlatformOrchestrator
from services.intelligence.ai_scoring import score_candidate_with_gemini
from config.settings import settings
import google.generativeai as genai

router = APIRouter(prefix="/student", tags=["student"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger("sudhee-ai-intelligence")
platform_orchestrator = PlatformOrchestrator()

# Pydantic Models
class ProfileSetupRequest(BaseModel):
    student_id: str
    leetcode_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    linkedin_manual_data: Optional[dict] = None

class ProfileStatusResponse(BaseModel):
    status: str
    progress: int
    current_step: str
    platforms: dict
    errors: List[dict] = []
    completed_at: Optional[str] = None

class JobMatchResponse(BaseModel):
    id: str
    title: str
    company_name: str
    location: str
    job_type: str
    required_skills: List[str]
    match_percentage: int
    match_label: str
    matched_skills: List[str]
    missing_skills: List[str]
    created_at: str

class EligibilityRequest(BaseModel):
    student_id: str

class EligibilityResponse(BaseModel):
    fit_percentage: int
    decision: str  # APPLY, IMPROVE, NOT_READY
    decision_message: str
    strengths: List[dict]
    skill_gaps: List[dict]
    ai_recommendation: str
    action_items: List[dict]

class SkillGapResponse(BaseModel):
    current_fit: int
    target_fit: int
    skill_gaps: List[dict]
    roadmap: dict
    expected_outcome: dict

async def extract_profile_background(student_id: str, urls: dict, manual_data: dict = None):
    """
    Background task to extract student profile from platforms.
    """
    try:
        # Update status to in_progress
        logger.info(f"Starting profile extraction for student {student_id}")
        
        # Extract usernames from URLs
        import re
        usernames = {}
        
        if urls.get("github_url"):
            match = re.search(r"github\.com/([a-zA-Z0-9_-]+)", urls["github_url"])
            if match:
                usernames["github"] = match.group(1)
        
        if urls.get("leetcode_url"):
            match = re.search(r"leetcode\.com/(?:u/)?([a-zA-Z0-9_-]+)", urls["leetcode_url"])
            if match:
                usernames["leetcode"] = match.group(1)
        
        # Scrape platforms
        platform_data = await platform_orchestrator.scrape_all_platforms(
            student_id=student_id,
            usernames=usernames,
            force_refresh=True
        )
        
        # Add manual LinkedIn data if provided
        if manual_data:
            platform_data["linkedin"] = {
                "profile_url": urls.get("linkedin_url", ""),
                "skills": manual_data.get("skills", []),
                "experience": manual_data.get("experience", []),
                "certifications": manual_data.get("certifications", []),
                "data_source": "manual_entry",
                "extracted_at": datetime.utcnow().isoformat()
            }
        
        # Run Gemini AI analysis on complete profile
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-pro')
        
        import json
        prompt = f"""
        Analyze this student's technical profile and provide a comprehensive assessment.
        
        Profile Data:
        {json.dumps(platform_data, indent=2)}
        
        Return STRICT JSON with these fields:
        - overall_assessment (string, 2-3 sentences)
        - technical_skills (array of strings)
        - project_highlights (array of strings)
        - strengths (array of strings, specific and evidence-based)
        - areas_for_improvement (array of strings)
        - suitable_roles (array of strings)
        - skill_level (one of: Beginner, Intermediate, Advanced, Expert)
        - coding_proficiency (one of: Beginner, Intermediate, Advanced, Expert)
        - recommendation (string, detailed paragraph)
        - confidence_score (integer 0-100)
        
        No markdown. Pure JSON only.
        """
        
        response = model.generate_content(prompt)
        ai_text = response.text.strip()
        
        # Remove markdown if present
        ai_text = re.sub(r'^```json\s*', '', ai_text)
        ai_text = re.sub(r'\s*```$', '', ai_text)
        
        ai_analysis = json.loads(ai_text)
        
        # Calculate profile strength (0-100)
        profile_strength = 0
        if platform_data.get("github"):
            profile_strength += 35
        if platform_data.get("leetcode"):
            profile_strength += 35
        if platform_data.get("linkedin"):
            profile_strength += 30
        
        # Update student_profiles table
        profile_update = {
            "user_id": student_id,
            "leetcode_url": urls.get("leetcode_url"),
            "github_url": urls.get("github_url"),
            "linkedin_url": urls.get("linkedin_url"),
            "leetcode_data": platform_data.get("leetcode", {}),
            "github_data": platform_data.get("github", {}),
            "linkedin_data": platform_data.get("linkedin", {}),
            "ai_analysis": ai_analysis,
            "extracted_skills": ai_analysis.get("technical_skills", []),
            "profile_strength": profile_strength,
            "last_analyzed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("student_profiles").upsert(profile_update, on_conflict="user_id").execute()
        
        # Update profiles table
        supabase.table("profiles").update({"profile_complete": True}).eq("user_id", student_id).execute()
        
        logger.info(f"Profile extraction completed for student {student_id}")
        
    except Exception as e:
        logger.error(f"Profile extraction failed for {student_id}: {str(e)}")

@router.post("/profile/setup")
@limiter.limit("5/minute")
async def setup_profile(request: Request, background_tasks: BackgroundTasks, payload: ProfileSetupRequest):
    """
    Initiate student profile extraction from external platforms.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    if not payload.github_url and not payload.leetcode_url:
        raise HTTPException(status_code=400, detail="At least GitHub or LeetCode URL required")
    
    try:
        urls = {
            "github_url": payload.github_url,
            "leetcode_url": payload.leetcode_url,
            "linkedin_url": payload.linkedin_url
        }
        
        # Trigger background extraction
        background_tasks.add_task(
            extract_profile_background,
            payload.student_id,
            urls,
            payload.linkedin_manual_data
        )
        
        return {
            "status": "in_progress",
            "message": "Profile extraction started",
            "estimated_time": "1-2 minutes"
        }
    
    except Exception as e:
        logger.error(f"Profile setup failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile")
@limiter.limit("30/minute")
async def get_student_profile(request: Request, student_id: str):
    """Get complete student profile with AI analysis."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        # Fetch student profile
        profile_response = supabase.table("student_profiles").select("*").eq("user_id", student_id).execute()
        
        if not profile_response.data:
            return {
                "profile_complete": False,
                "message": "Profile not set up"
            }
        
        profile = profile_response.data[0]
        
        # Fetch basic info
        user_response = supabase.table("profiles").select("*").eq("user_id", student_id).execute()
        user_info = user_response.data[0] if user_response.data else {}
        
        return {
            "profile_complete": user_info.get("profile_complete", False),
            "profile_strength": profile.get("profile_strength", 0),
            "platform_links": {
                "leetcode": profile.get("leetcode_url"),
                "github": profile.get("github_url"),
                "linkedin": profile.get("linkedin_url")
            },
            "platforms_data": {
                "leetcode": profile.get("leetcode_data", {}),
                "github": profile.get("github_data", {}),
                "linkedin": profile.get("linkedin_data", {})
            },
            "ai_analysis": profile.get("ai_analysis", {}),
            "technical_skills": profile.get("extracted_skills", []),
            "last_analyzed": profile.get("last_analyzed_at")
        }
    
    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs", response_model=List[JobMatchResponse])
@limiter.limit("30/minute")
async def get_student_jobs(
    request: Request,
    student_id: str,
    job_type: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None
):
    """
    Browse jobs with personalized match percentages.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        # Fetch student profile
        profile_response = supabase.table("student_profiles").select("*").eq("user_id", student_id).execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=400, detail="Profile not set up")
        
        student_profile = profile_response.data[0]
        student_skills = set(student_profile.get("extracted_skills", []))
        
        # Fetch active jobs
        query = supabase.table("jobs").select("*").eq("status", "active")
        
        if job_type:
            query = query.eq("job_type", job_type)
        if location:
            query = query.eq("location", location)
        
        jobs_response = query.execute()
        
        if not jobs_response.data:
            return []
        
        # Calculate match percentage for each job
        matched_jobs = []
        for job in jobs_response.data:
            required_skills = set(job.get("required_skills", []))
            preferred_skills = set(job.get("preferred_skills", []))
            
            # Calculate match
            matched_required = student_skills.intersection(required_skills)
            matched_preferred = student_skills.intersection(preferred_skills)
            
            # Match percentage formula
            required_match = (len(matched_required) / len(required_skills) * 70) if required_skills else 0
            preferred_match = (len(matched_preferred) / len(preferred_skills) * 30) if preferred_skills else 30
            
            match_percentage = int(required_match + preferred_match)
            
            # Determine match label
            if match_percentage >= 80:
                match_label = "Excellent Match"
            elif match_percentage >= 60:
                match_label = "Good Match"
            elif match_percentage >= 40:
                match_label = "Moderate Match"
            else:
                match_label = "Low Match"
            
            missing_skills = list(required_skills - student_skills)
            
            matched_jobs.append(JobMatchResponse(
                id=job["id"],
                title=job["title"],
                company_name=job["company_name"],
                location=job["location"],
                job_type=job["job_type"],
                required_skills=list(required_skills),
                match_percentage=match_percentage,
                match_label=match_label,
                matched_skills=list(matched_required),
                missing_skills=missing_skills,
                created_at=job["created_at"]
            ))
        
        # Sort by match percentage
        matched_jobs.sort(key=lambda x: x.match_percentage, reverse=True)
        
        return matched_jobs
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jobs/{job_id}/apply")
@limiter.limit("10/minute")
async def apply_to_job(request: Request, job_id: str, student_id: str):
    """Submit application to a job."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        # Check if already applied
        existing = supabase.table("applications").select("id").eq("job_id", job_id).eq("student_id", student_id).execute()
        
        if existing.data:
            raise HTTPException(status_code=400, detail="Already applied to this job")
        
        # Create application
        app_data = {
            "job_id": job_id,
            "student_id": student_id,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("applications").insert(app_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to submit application")
        
        logger.info(f"Application submitted: student {student_id} -> job {job_id}")
        
        return {
            "application_id": response.data[0]["id"],
            "status": "pending",
            "message": "Application submitted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Application submission failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jobs/{job_id}/eligibility", response_model=EligibilityResponse)
@limiter.limit("5/minute")
async def check_eligibility(request: Request, job_id: str, payload: EligibilityRequest):
    """
    AI-powered eligibility check: "Can I apply?"
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    try:
        # Fetch job
        job_response = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if not job_response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        job = job_response.data[0]
        
        # Fetch student profile
        profile_response = supabase.table("student_profiles").select("*").eq("user_id", payload.student_id).execute()
        if not profile_response.data:
            raise HTTPException(status_code=400, detail="Profile not set up")
        
        profile = profile_response.data[0]
        
        # Use Gemini to analyze fit
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-pro')
        
        import json
        prompt = f"""
        Analyze if this student is eligible to apply for this job.
        
        Job:
        Title: {job['title']}
        Required Skills: {json.dumps(job.get('required_skills', []))}
        Preferred Skills: {json.dumps(job.get('preferred_skills', []))}
        Experience: {job.get('experience_required', 'Not specified')}
        
        Student Profile:
        Skills: {json.dumps(profile.get('extracted_skills', []))}
        AI Analysis: {json.dumps(profile.get('ai_analysis', {}))}
        LeetCode: {json.dumps(profile.get('leetcode_data', {}))}
        GitHub: {json.dumps(profile.get('github_data', {}))}
        
        Return STRICT JSON with:
        - fit_percentage (integer 0-100, be realistic)
        - decision (APPLY if >=80%, IMPROVE if 50-79%, NOT_READY if <50%)
        - strengths (array of objects with: category, detail, impact)
        - skill_gaps (array of objects with: skill, importance, current_level, required_level)
        - recommendation (string, personalized advice)
        - action_items (array of objects with: priority, action, reason, estimated_time)
        
        Pure JSON only.
        """
        
        response = model.generate_content(prompt)
        ai_text = response.text.strip()
        
        import re
        ai_text = re.sub(r'^```json\s*', '', ai_text)
        ai_text = re.sub(r'\s*```$', '', ai_text)
        
        result = json.loads(ai_text)
        
        # Determine decision message
        decision = result.get("decision", "IMPROVE")
        if decision == "APPLY":
            message = "You're a great fit! Apply now."
        elif decision == "IMPROVE":
            message = "Close to ready. Improve key skills and apply."
        else:
            message = "Build foundational skills first before applying."
        
        return EligibilityResponse(
            fit_percentage=result.get("fit_percentage", 50),
            decision=decision,
            decision_message=message,
            strengths=result.get("strengths", []),
            skill_gaps=result.get("skill_gaps", []),
            ai_recommendation=result.get("recommendation", ""),
            action_items=result.get("action_items", [])
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Eligibility check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/applications")
@limiter.limit("30/minute")
async def get_student_applications(request: Request, student_id: str):
    """Get all applications submitted by student."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        # Fetch applications
        apps_response = supabase.table("applications").select("*").eq("student_id", student_id).order("created_at", desc=True).execute()
        
        if not apps_response.data:
            return {"applications": [], "total": 0}
        
        # Enrich with job data
        applications = []
        for app in apps_response.data:
            job_response = supabase.table("jobs").select("title, company_name, location, job_type").eq("id", app["job_id"]).execute()
            
            job_info = job_response.data[0] if job_response.data else {}
            
            applications.append({
                "application_id": app["id"],
                "job": {
                    "id": app["job_id"],
                    "title": job_info.get("title", "Unknown"),
                    "company_name": job_info.get("company_name", "Unknown"),
                    "location": job_info.get("location", ""),
                    "job_type": job_info.get("job_type", "")
                },
                "applied_date": app["created_at"],
                "status": app["status"],
                "match_score": app.get("match_score"),
                "rank": app.get("rank")
            })
        
        # Calculate stats
        stats = {
            "total": len(applications),
            "pending": sum(1 for a in apps_response.data if a["status"] == "pending"),
            "under_review": sum(1 for a in apps_response.data if a["status"] == "under_review"),
            "shortlisted": sum(1 for a in apps_response.data if a["status"] == "shortlisted"),
            "rejected": sum(1 for a in apps_response.data if a["status"] == "rejected")
        }
        
        return {
            "applications": applications,
            "stats": stats
        }
    
    except Exception as e:
        logger.error(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jobs/{job_id}/skill-gap", response_model=SkillGapResponse)
@limiter.limit("3/minute")
async def generate_skill_gap_roadmap(request: Request, job_id: str, payload: EligibilityRequest):
    """
    ⭐ Generate personalized learning roadmap for skill gaps.
    
    Returns comprehensive roadmap with:
    - Learning phases
    - Skill deep dives
    - Hands-on projects
    - Weekly schedule
    - Progress tracking
    - Resources and timelines
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    try:
        # Fetch job
        job_response = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if not job_response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        job = job_response.data[0]
        
        # Fetch student profile
        profile_response = supabase.table("student_profiles").select("*").eq("user_id", payload.student_id).execute()
        if not profile_response.data:
            raise HTTPException(status_code=400, detail="Profile not set up")
        
        profile = profile_response.data[0]
        
        # Calculate missing skills
        student_skills = set(profile.get("extracted_skills", []))
        required_skills = set(job.get("required_skills", []))
        missing_skills = list(required_skills - student_skills)
        
        if not missing_skills:
            return SkillGapResponse(
                current_fit=100,
                target_fit=100,
                skill_gaps=[],
                roadmap={"message": "You already have all required skills!"},
                expected_outcome={"ready_to_apply": True}
            )
        
        # Import roadmap engine
        from services.intelligence.roadmap_engine import generate_learning_roadmap, format_roadmap_summary
        
        # Generate roadmap
        logger.info(f"Generating roadmap for student {payload.student_id}, job {job_id}")
        
        roadmap = await generate_learning_roadmap(
            student_profile={
                "user_id": payload.student_id,
                "extracted_skills": profile.get("extracted_skills", []),
                "ai_analysis": profile.get("ai_analysis", {}),
                "leetcode_data": profile.get("leetcode_data", {}),
                "github_data": profile.get("github_data", {})
            },
            job_requirements={
                "title": job.get("title"),
                "description": job.get("description"),
                "required_skills": job.get("required_skills", []),
                "preferred_skills": job.get("preferred_skills", []),
                "experience_required": job.get("experience_required"),
                "role_type": job.get("role_type", "SDE")
            },
            missing_skills=missing_skills,
            gemini_api_key=settings.GEMINI_API_KEY
        )
        
        # Extract summary
        summary = format_roadmap_summary(roadmap)
        
        logger.info(f"Roadmap generated: {summary['duration_weeks']} weeks, {summary['skills_to_learn']} skills")
        
        # Prepare skill gaps array for response
        skill_gaps_detailed = []
        for skill_dive in roadmap.get("skill_deep_dives", []):
            skill_gaps_detailed.append({
                "skill": skill_dive["skill"],
                "importance": skill_dive["importance"],
                "current_level": skill_dive["current_level"],
                "target_level": skill_dive["target_level"],
                "estimated_hours": sum(step.get("estimated_hours", 0) for step in skill_dive.get("learning_path", []))
            })
        
        return SkillGapResponse(
            current_fit=roadmap["current_fit_analysis"]["current_match_percentage"],
            target_fit=roadmap["target_outcome"]["target_match_percentage"],
            skill_gaps=skill_gaps_detailed,
            roadmap=roadmap,
            expected_outcome={
                "duration_weeks": summary["duration_weeks"],
                "improvement_percentage": summary["improvement"],
                "expected_role_readiness": roadmap["target_outcome"]["expected_role_readiness"],
                "projects_count": summary["projects_count"],
                "hours_per_week": summary["hours_per_week"]
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Roadmap generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")

