"""
Ranking Engine - Core algorithmic scoring and candidate ranking.

Combines platform-specific scores with Gemini AI analysis to rank candidates.
"""

import logging
from typing import List, Dict, Optional, Tuple
from utils.supabase import supabase

logger = logging.getLogger("sudhee-ai-intelligence")

# Dynamic weighting by job type
JOB_TYPE_WEIGHTS = {
    "AI Engineer": {"leetcode": 0.30, "github": 0.50, "linkedin": 0.20},
    "Backend Engineer": {"leetcode": 0.45, "github": 0.40, "linkedin": 0.15},
    "Frontend Developer": {"leetcode": 0.25, "github": 0.55, "linkedin": 0.20},
    "Full-Stack Developer": {"leetcode": 0.35, "github": 0.45, "linkedin": 0.20},
    "Data Scientist": {"leetcode": 0.30, "github": 0.45, "linkedin": 0.25},
    "DevOps Engineer": {"leetcode": 0.20, "github": 0.60, "linkedin": 0.20},
    "SDE": {"leetcode": 0.40, "github": 0.40, "linkedin": 0.20},  # Default
}

def calculate_leetcode_score(leetcode_data: dict) -> int:
    """
    Calculate LeetCode score (0-100).
    
    Formula:
    - Problems solved (total/500 * 50, max 50)
    - Difficulty distribution (medium ratio * 12 + hard ratio * 8, max 20)
    - Contest rating (rating/2000 * 15, max 15)
    - Consistency bonus (200+: 5, 300+: 5, 400+: 5, max 15)
    """
    if not leetcode_data or not leetcode_data.get("problems_solved"):
        return 20  # Minimum score if data exists but sparse
    
    score = 0
    problems = leetcode_data.get("problems_solved", {})
    total = problems.get("total", 0)
    easy = problems.get("easy", 0)
    medium = problems.get("medium", 0)
    hard = problems.get("hard", 0)
    
    # Problems solved component (max 50)
    score += min(50, (total / 500) * 50)
    
    # Difficulty distribution (max 20)
    if total > 0:
        medium_ratio = medium / total
        hard_ratio = hard / total
        score += medium_ratio * 12
        score += hard_ratio * 8
    
    # Contest rating (max 15)
    contest_rating = leetcode_data.get("contest_rating", 0)
    if contest_rating:
        score += min(15, (contest_rating / 2000) * 15)
    
    # Consistency bonus (max 15)
    if total >= 200:
        score += 5
    if total >= 300:
        score += 5
    if total >= 400:
        score += 5
    
    return int(min(100, score))

def calculate_github_score(github_data: dict, job_required_skills: List[str] = None) -> int:
    """
    Calculate GitHub score (0-100).
    
    Formula:
    - Repository count (count/20 * 15, max 15)
    - Average stars (avg/10 * 15, max 15)
    - Recent commits (commits_last_30_days/50 * 15, max 15)
    - Active repos (active/10 * 10, max 10)
    - Tech stack match (match ratio * 30, max 30)
    - Language diversity (languages/5 * 15, max 15)
    """
    if not github_data:
        return 20  # Minimum score if data exists but sparse
    
    score = 0
    
    # Repository count (max 15)
    repo_count = github_data.get("public_repos", 0)
    score += min(15, (repo_count / 20) * 15)
    
    # Average stars (max 15)
    stats = github_data.get("statistics", {})
    total_stars = stats.get("total_stars", 0)
    if repo_count > 0:
        avg_stars = total_stars / repo_count
        score += min(15, (avg_stars / 10) * 15)
    
    # Recent commits (max 15)
    recent_activity = stats.get("recent_activity", {})
    commits = recent_activity.get("commits_last_30_days", 0)
    score += min(15, (commits / 50) * 15)
    
    # Active repos (max 10)
    active_repos = stats.get("active_repos", 0)
    score += min(10, (active_repos / 10) * 10)
    
    # Tech stack match against job requirements (max 30)
    if job_required_skills:
        repo_languages = set()
        repo_topics = set()
        
        for repo in github_data.get("repositories", [])[:20]:
            for lang in repo.get("languages", []):
                repo_languages.add(lang.get("name", "").lower())
            for topic in repo.get("topics", []):
                repo_topics.add(topic.lower())
        
        tech_stack = repo_languages.union(repo_topics)
        required_skills_lower = set(skill.lower() for skill in job_required_skills)
        
        matches = tech_stack.intersection(required_skills_lower)
        if required_skills_lower:
            match_ratio = len(matches) / len(required_skills_lower)
            score += match_ratio * 30
        else:
            score += 15  # Neutral if no requirements
    else:
        score += 15  # Neutral if no requirements
    
    # Language diversity (max 15)
    top_languages = stats.get("top_languages", [])
    unique_languages = len(top_languages)
    score += min(15, (unique_languages / 5) * 15)
    
    return int(min(100, score))

def calculate_linkedin_score(linkedin_data: dict, job_requirements: dict = None) -> int:
    """
    Calculate LinkedIn score (0-100).
    
    Formula:
    - Skills match (match/required * 40, max 40)
    - Experience (each internship/job = 10, max 30)
    - Certifications (each = 5, max 20)
    - Profile completeness (10)
    """
    if not linkedin_data:
        return 30  # Minimum if any LinkedIn data exists
    
    score = 0
    
    # Skills match (max 40)
    linkedin_skills = set(skill.lower() for skill in linkedin_data.get("skills", []))
    if job_requirements and job_requirements.get("required_skills"):
        required = set(skill.lower() for skill in job_requirements["required_skills"])
        if required:
            matches = linkedin_skills.intersection(required)
            score += (len(matches) / len(required)) * 40
        else:
            score += 20
    else:
        score += 20  # Neutral if no requirements
    
    # Experience (max 30)
    experience = linkedin_data.get("experience", [])
    score += min(30, len(experience) * 10)
    
    # Certifications (max 20)
    certifications = linkedin_data.get("certifications", [])
    score += min(20, len(certifications) * 5)
    
    # Profile completeness (max 10)
    if linkedin_data.get("headline"):
        score += 3
    if linkedin_data.get("education"):
        score += 3
    if len(linkedin_skills) > 5:
        score += 4
    
    return int(min(100, score))

def calculate_overall_score(
    leetcode_score: int,
    github_score: int,
    linkedin_score: int,
    job_type: str = "SDE"
) -> int:
    """
    Calculate overall algorithmic score using dynamic weighting.
    """
    weights = JOB_TYPE_WEIGHTS.get(job_type, JOB_TYPE_WEIGHTS["SDE"])
    
    overall = (
        leetcode_score * weights["leetcode"] +
        github_score * weights["github"] +
        linkedin_score * weights["linkedin"]
    )
    
    return int(round(overall))

async def rank_candidates(
    job_id: str,
    use_gemini: bool = True,
    gemini_api_key: str = None
) -> List[Dict]:
    """
    Main ranking orchestrator.
    
    Steps:
    1. Fetch all applications for job
    2. For each candidate:
       a. Get StudentProfile
       b. Calculate platform scores
       c. Get Gemini match analysis (if enabled)
       d. Blend: 60% algorithmic + 40% Gemini
       e. Update application with match_analysis
    3. Sort by final_score descending
    4. Assign rank numbers
    5. Return ranked list
    
    Returns:
        List of ranked candidates with scores and analysis
    """
    if not supabase:
        raise Exception("Database not connected")
    
    try:
        # Fetch job
        job_response = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if not job_response.data:
            raise Exception("Job not found")
        
        job = job_response.data[0]
        job_type = job.get("role_type", "SDE")
        required_skills = job.get("required_skills", [])
        
        # Fetch all applications
        apps_response = supabase.table("applications").select("*").eq("job_id", job_id).execute()
        
        if not apps_response.data:
            return []
        
        ranked_candidates = []
        
        for app in apps_response.data:
            student_id = app["student_id"]
            
            # Fetch student profile
            profile_response = supabase.table("student_profiles").select("*").eq("user_id", student_id).execute()
            
            if not profile_response.data:
                logger.warning(f"No profile found for student {student_id}, skipping")
                continue
            
            profile = profile_response.data[0]
            
            # Calculate platform scores
            leetcode_score = calculate_leetcode_score(profile.get("leetcode_data", {}))
            github_score = calculate_github_score(profile.get("github_data", {}), required_skills)
            linkedin_score = calculate_linkedin_score(profile.get("linkedin_data", {}), {"required_skills": required_skills})
            
            # Calculate overall algorithmic score
            algorithmic_score = calculate_overall_score(
                leetcode_score,
                github_score,
                linkedin_score,
                job_type
            )
            
            # Get Gemini analysis
            gemini_score = algorithmic_score  # Default to algorithmic if Gemini disabled
            gemini_insights = {}
            
            if use_gemini and gemini_api_key:
                try:
                    from services.intelligence.ai_scoring import score_candidate_with_gemini
                    import json
                    
                    # Prepare data for Gemini
                    profile_data = {
                        "leetcode": profile.get("leetcode_data", {}),
                        "github": profile.get("github_data", {}),
                        "linkedin": profile.get("linkedin_data", {}),
                        "ai_analysis": profile.get("ai_analysis", {}),
                        "skills": profile.get("extracted_skills", [])
                    }
                    
                    job_data = {
                        "title": job.get("title"),
                        "description": job.get("description"),
                        "required_skills": required_skills,
                        "preferred_skills": job.get("preferred_skills", []),
                        "experience_required": job.get("experience_required"),
                        "role_type": job_type
                    }
                    
                    ai_result = await score_candidate_with_gemini(
                        profile_data=profile_data,
                        job_data=job_data,
                        api_key=gemini_api_key,
                        legacy_score=algorithmic_score,
                        user_id=student_id
                    )
                    
                    gemini_score = ai_result.overall_reasoning_score
                    gemini_insights = {
                        "recommendation": "STRONG_FIT" if gemini_score >= 80 else "MODERATE_FIT" if gemini_score >= 60 else "WEAK_FIT",
                        "explanation": ai_result.explanation,
                        "skill_match": ai_result.skill_match_score,
                        "project_score": ai_result.project_score,
                        "hiring_confidence": "High" if gemini_score >= 80 else "Medium" if gemini_score >= 60 else "Low"
                    }
                    
                except Exception as e:
                    logger.error(f"Gemini analysis failed for student {student_id}: {str(e)}")
                    gemini_score = algorithmic_score
            
            # Blend scores: 60% algorithmic + 40% Gemini
            final_score = int(round(algorithmic_score * 0.6 + gemini_score * 0.4))
            
            # Extract matched/missing skills
            student_skills_set = set(profile.get("extracted_skills", []))
            required_skills_set = set(required_skills)
            matched_skills = list(student_skills_set.intersection(required_skills_set))
            missing_skills = list(required_skills_set - student_skills_set)
            
            # Prepare match analysis
            match_analysis = {
                "overall_score": final_score,
                "algorithmic_score": algorithmic_score,
                "gemini_score": gemini_score,
                "platform_scores": {
                    "leetcode": leetcode_score,
                    "github": github_score,
                    "linkedin": linkedin_score
                },
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "gemini_insights": gemini_insights,
                "analyzed_at": None  # Will be set by database
            }
            
            # Update application with match analysis
            supabase.table("applications").update({
                "match_analysis": match_analysis,
                "match_score": final_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills
            }).eq("id", app["id"]).execute()
            
            # Fetch student info for response
            user_response = supabase.table("profiles").select("full_name, institution").eq("user_id", student_id).execute()
            user_info = user_response.data[0] if user_response.data else {}
            
            ranked_candidates.append({
                "application_id": app["id"],
                "student_id": student_id,
                "student_name": user_info.get("full_name", "Unknown"),
                "institution": user_info.get("institution", "N/A"),
                "final_score": final_score,
                "platform_scores": match_analysis["platform_scores"],
                "gemini_insights": gemini_insights,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "profile_links": {
                    "leetcode": profile.get("leetcode_url"),
                    "github": profile.get("github_url"),
                    "linkedin": profile.get("linkedin_url")
                }
            })
        
        # Sort by final_score descending
        ranked_candidates.sort(key=lambda x: x["final_score"], reverse=True)
        
        # Assign ranks
        for i, candidate in enumerate(ranked_candidates, 1):
            candidate["rank"] = i
            
            # Update rank in database
            supabase.table("applications").update({
                "rank": i
            }).eq("id", candidate["application_id"]).execute()
        
        logger.info(f"Ranked {len(ranked_candidates)} candidates for job {job_id}")
        
        return ranked_candidates
    
    except Exception as e:
        logger.error(f"Ranking failed for job {job_id}: {str(e)}")
        raise
