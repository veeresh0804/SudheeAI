import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel, Field
from utils.supabase import supabase
from services.intelligence.ai_orchestrator import AIOrchestrator
from config.settings import settings

router = APIRouter(prefix="/recruiter", tags=["recruiter"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger("sudhee-ai-intelligence")

# Pydantic Models
class JobCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=10)
    company_name: str = Field(..., min_length=1)
    location: str = Field(default="Remote")
    location_city: Optional[str] = None
    job_type: str = Field(default="Full-time")
    experience_required: str = Field(default="0-2 years")
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    role_type: str = Field(default="SDE")
    salary_range: Optional[str] = None
    deadline: Optional[str] = None
    department: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    title: str
    status: str
    company_name: str
    location: str
    job_type: str
    required_skills: List[str]
    preferred_skills: List[str]
    created_at: str
    applications_count: int = 0

class ExtractSkillsRequest(BaseModel):
    description: str

class ExtractSkillsResponse(BaseModel):
    skills: List[str]
    confidence: float

@router.post("/jobs", response_model=JobResponse)
@limiter.limit("10/minute")
async def create_job(request: Request, job: JobCreate, recruiter_id: str = None):
    """
    Create a new job posting.
    
    In production, recruiter_id should come from authenticated session.
    For now, accepting as parameter for testing.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    if not recruiter_id:
        raise HTTPException(status_code=401, detail="Recruiter ID required")
    
    try:
        job_data = {
            "recruiter_id": recruiter_id,
            "title": job.title,
            "description": job.description,
            "company_name": job.company_name,
            "location": job.location,
            "job_type": job.job_type,
            "experience_required": job.experience_required,
            "required_skills": job.required_skills,
            "preferred_skills": job.preferred_skills,
            "role_type": job.role_type,
            "salary_range": job.salary_range,
            "deadline": job.deadline,
            "status": "active",
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("jobs").insert(job_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create job")
        
        created_job = response.data[0]
        
        logger.info(f"Job created: {created_job['id']} by recruiter {recruiter_id}")
        
        return JobResponse(
            id=created_job["id"],
            title=created_job["title"],
            status=created_job["status"],
            company_name=created_job["company_name"],
            location=created_job["location"],
            job_type=created_job["job_type"],
            required_skills=created_job.get("required_skills", []),
            preferred_skills=created_job.get("preferred_skills", []),
            created_at=created_job["created_at"],
            applications_count=0
        )
    
    except Exception as e:
        logger.error(f"Error creating job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs", response_model=List[JobResponse])
@limiter.limit("30/minute")
async def get_recruiter_jobs(request: Request, recruiter_id: str):
    """
    Get all jobs posted by a recruiter.
    
    In production, recruiter_id should come from authenticated session.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        # Fetch jobs
        jobs_response = supabase.table("jobs").select("*").eq("recruiter_id", recruiter_id).order("created_at", desc=True).execute()
        
        if not jobs_response.data:
            return []
        
        jobs = []
        for job in jobs_response.data:
            # Count applications for this job
            app_count_response = supabase.table("applications").select("id", count="exact").eq("job_id", job["id"]).execute()
            app_count = app_count_response.count if app_count_response.count is not None else 0
            
            jobs.append(JobResponse(
                id=job["id"],
                title=job["title"],
                status=job["status"],
                company_name=job["company_name"],
                location=job["location"],
                job_type=job["job_type"],
                required_skills=job.get("required_skills", []),
                preferred_skills=job.get("preferred_skills", []),
                created_at=job["created_at"],
                applications_count=app_count
            ))
        
        return jobs
    
    except Exception as e:
        logger.error(f"Error fetching recruiter jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}")
@limiter.limit("30/minute")
async def get_job_details(request: Request, job_id: str, recruiter_id: str):
    """Get detailed information about a specific job."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        response = supabase.table("jobs").select("*").eq("id", job_id).eq("recruiter_id", recruiter_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Job not found or access denied")
        
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}/applications")
@limiter.limit("30/minute")
async def get_job_applications(request: Request, job_id: str, recruiter_id: str):
    """
    Get all applications for a specific job.
    
    Returns basic applicant information before AI ranking.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        # Verify job ownership
        job_response = supabase.table("jobs").select("id, title").eq("id", job_id).eq("recruiter_id", recruiter_id).execute()
        
        if not job_response.data:
            raise HTTPException(status_code=404, detail="Job not found or access denied")
        
        job = job_response.data[0]
        
        # Fetch applications with student profile info
        applications_response = supabase.table("applications").select(
            "id, student_id, status, created_at, match_score, rank"
        ).eq("job_id", job_id).order("created_at", desc=True).execute()
        
        if not applications_response.data:
            return {
                "job": job,
                "applications": [],
                "total_count": 0
            }
        
        # Enrich with student data
        applications = []
        for app in applications_response.data:
            # Fetch student profile
            student_response = supabase.table("profiles").select("full_name, institution, email").eq("user_id", app["student_id"]).execute()
            
            student_profile_response = supabase.table("student_profiles").select("leetcode_url, github_url, linkedin_url").eq("user_id", app["student_id"]).execute()
            
            student_info = student_response.data[0] if student_response.data else {}
            profile_links = student_profile_response.data[0] if student_profile_response.data else {}
            
            applications.append({
                "application_id": app["id"],
                "student_id": app["student_id"],
                "student_name": student_info.get("full_name", "Unknown"),
                "institution": student_info.get("institution", "N/A"),
                "email": student_info.get("email", ""),
                "applied_date": app["created_at"],
                "status": app["status"],
                "match_score": app.get("match_score"),
                "rank": app.get("rank"),
                "profile_links": {
                    "leetcode": profile_links.get("leetcode_url"),
                    "github": profile_links.get("github_url"),
                    "linkedin": profile_links.get("linkedin_url")
                }
            })
        
        return {
            "job": job,
            "applications": applications,
            "total_count": len(applications)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jobs/{job_id}/rank")
@limiter.limit("5/minute")
async def rank_job_candidates(request: Request, job_id: str, recruiter_id: str):
    """
    **CORE FEATURE: AI-Powered Candidate Ranking**
    
    Ranks all applicants for a job using:
    - Algorithmic scoring (LeetCode, GitHub, LinkedIn)
    - Gemini AI analysis
    - Score blending (60% algorithmic + 40% AI)
    
    Returns ranked candidate list sorted by final score.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        # Verify job ownership
        job_response = supabase.table("jobs").select("id, title").eq("id", job_id).eq("recruiter_id", recruiter_id).execute()
        
        if not job_response.data:
            raise HTTPException(status_code=404, detail="Job not found or access denied")
        
        # Import ranking engine
        from services.matching.ranking_engine import rank_candidates
        
        # Run ranking
        logger.info(f"Starting AI ranking for job {job_id}")
        
        ranked_list = await rank_candidates(
            job_id=job_id,
            use_gemini=True,
            gemini_api_key=settings.GEMINI_API_KEY
        )
        
        logger.info(f"Ranking completed for job {job_id}: {len(ranked_list)} candidates ranked")
        
        return {
            "status": "success",
            "job_id": job_id,
            "job_title": job_response.data[0]["title"],
            "total_candidates": len(ranked_list),
            "ranked_candidates": ranked_list
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ranking failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ranking failed: {str(e)}")

@router.get("/candidate/{student_id}/analysis")
@limiter.limit("30/minute")
async def get_candidate_analysis(request: Request, student_id: str, job_id: str, recruiter_id: str):
    """
    Get detailed candidate analysis for recruiter review.
    
    Returns comprehensive breakdown of:
    - All platform data (LeetCode, GitHub, LinkedIn)
    - Score breakdown
    - Gemini insights
    - Skills match analysis
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        # Verify job ownership
        job_response = supabase.table("jobs").select("*").eq("id", job_id).eq("recruiter_id", recruiter_id).execute()
        
        if not job_response.data:
            raise HTTPException(status_code=404, detail="Job not found or access denied")
        
        job = job_response.data[0]
        
        # Fetch application
        app_response = supabase.table("applications").select("*").eq("job_id", job_id).eq("student_id", student_id).execute()
        
        if not app_response.data:
            raise HTTPException(status_code=404, detail="Application not found")
        
        application = app_response.data[0]
        
        # Fetch student profile
        profile_response = supabase.table("student_profiles").select("*").eq("user_id", student_id).execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="Student profile not found")
        
        profile = profile_response.data[0]
        
        # Fetch student basic info
        user_response = supabase.table("profiles").select("*").eq("user_id", student_id).execute()
        user_info = user_response.data[0] if user_response.data else {}
        
        # Return comprehensive analysis
        return {
            "student_name": user_info.get("full_name", "Unknown"),
            "institution": user_info.get("institution", "N/A"),
            "email": user_info.get("email", ""),
            "job_title": job["title"],
            "final_score": application.get("match_score", 0),
            "rank": application.get("rank"),
            "score_breakdown": {
                "algorithmic_score": application.get("match_analysis", {}).get("algorithmic_score", 0),
                "gemini_score": application.get("match_analysis", {}).get("gemini_score", 0),
                "platform_scores": application.get("match_analysis", {}).get("platform_scores", {}),
            },
            "gemini_insights": application.get("match_analysis", {}).get("gemini_insights", {}),
            "skills_analysis": {
                "matched": application.get("matched_skills", []),
                "gaps": application.get("missing_skills", [])
            },
            "detailed_profile": {
                "leetcode": profile.get("leetcode_data", {}),
                "github": profile.get("github_data", {}),
                "linkedin": profile.get("linkedin_data", {}),
                "ai_analysis": profile.get("ai_analysis", {})
            },
            "profile_links": {
                "leetcode": profile.get("leetcode_url"),
                "github": profile.get("github_url"),
                "linkedin": profile.get("linkedin_url")
            },
            "application_status": application.get("status"),
            "applied_date": application.get("created_at")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching candidate analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jobs/extract-skills", response_model=ExtractSkillsResponse)

@limiter.limit("5/minute")
async def extract_skills_from_description(request: Request, payload: ExtractSkillsRequest):
    """
    AI-powered skill extraction from job description.
    
    Uses Gemini to analyze JD and extract technical skills.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    try:
        orchestrator = AIOrchestrator(settings.GEMINI_API_KEY)
        
        prompt = f"""
        Extract technical skills from this job description.
        Return ONLY a JSON array of skill strings.
        Focus on: programming languages, frameworks, databases, tools, platforms.
        
        Job Description:
        {payload.description}
        
        Return format: {{"skills": ["Python", "React", "PostgreSQL", ...]}}
        """
        
        # Use Gemini to extract skills
        from google.generativeai import GenerativeModel
        import google.generativeai as genai
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = GenerativeModel('gemini-pro')
        
        response = model.generate_content(prompt)
        
        # Parse response
        import json
        import re
        
        # Remove markdown code blocks if present
        text = response.text.strip()
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        
        result = json.loads(text)
        skills = result.get("skills", [])
        
        logger.info(f"Extracted {len(skills)} skills from job description")
        
        return ExtractSkillsResponse(
            skills=skills[:20],  # Limit to top 20 skills
            confidence=0.85
        )
    
    except Exception as e:
        logger.error(f"Skill extraction failed: {str(e)}")
        # Return empty on failure
        return ExtractSkillsResponse(skills=[], confidence=0.0)
