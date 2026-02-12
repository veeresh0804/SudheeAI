import os
import logging
from fastapi import APIRouter, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from services.intelligence.ai_scoring import score_candidate_with_gemini
from services.intelligence.trust_engine import calculate_trust_score
from services.intelligence.composite_engine import calculate_composite_score
from services.intelligence.rejection_engine import generate_ai_rejection
from services.intelligence.velocity_engine import analyze_multi_skill_velocity
from services.intelligence.dna_engine import analyze_coding_dna
from services.intelligence.trajectory_engine import predict_talent_trajectory
from services.intelligence.feature_flags import feature_flags
from models.schemas import (
    ScoreRequest, RejectionRequest, CandidateScore, RejectionFeedback,
    DNAAnalysisRequest, DNAAnalysisResponse, TrajectoryRequest, TrajectoryResponse,
    PlatformVerifyRequest, PlatformVerifyResponse
)
from services.integrations.platform_orchestrator import PlatformOrchestrator
from config.settings import settings

router = APIRouter(prefix="/intelligence", tags=["intelligence"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger("sudhee-ai-intelligence")
platform_orchestrator = PlatformOrchestrator()

@router.post("/score_candidate", response_model=CandidateScore)
@limiter.limit("10/minute")
async def score_candidate(request: Request, payload: ScoreRequest):
    """Calculate AI score, trust score, and composite score."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.error("GEMINI_API_KEY not found in environment")
        return _get_fallback_score(0, "AI Service Unavailable")

    ai_result = await score_candidate_with_gemini(
        profile_data=payload.profile_data,
        job_data=payload.job_data,
        api_key=api_key,
        legacy_score=payload.profile_data.get("legacy_score", 0)
    )

    trust_score = calculate_trust_score(payload.profile_data)
    
    velocity_score = None
    if feature_flags.ENABLE_VELOCITY:
        skill_histories = payload.profile_data.get("skill_histories", {})
        if skill_histories:
            velocity_data = analyze_multi_skill_velocity(payload.candidate_id, skill_histories)
            velocity_score = velocity_data.get("overall_velocity", 0)
    
    dna_score = None
    if feature_flags.ENABLE_CODING_DNA:
        github_username = payload.profile_data.get("github_username")
        repositories = payload.profile_data.get("github_data", {}).get("repositories", [])
        if github_username and repositories:
            dna_result = await analyze_coding_dna(github_username, repositories)
            dna_score = (dna_result["abstraction_score"] + dna_result["architecture_score"] + dna_result["code_quality_score"]) // 3

    composite_score = calculate_composite_score(
        skill_match_score=ai_result.skill_match_score,
        project_score=ai_result.project_score,
        trust_score=trust_score,
        weight_skill=payload.job_data.get("weight_skill"),
        weight_project=payload.job_data.get("weight_project"),
        weight_trust=payload.job_data.get("weight_trust"),
        overall_reasoning_score=ai_result.overall_reasoning_score,
        velocity_score=velocity_score,
        dna_score=dna_score,
        weight_velocity=payload.job_data.get("weight_velocity"),
        weight_dna=payload.job_data.get("weight_dna")
    )

    # Persist score to Supabase
    await _persist_score_to_supabase(
        student_id=payload.candidate_id,
        job_id=payload.job_id,
        application_id=payload.application_id,
        score=ai_result,
        legacy_score=payload.legacy_score or 0,
        custom_weights=payload.custom_weights
    )

    return ai_result

@router.post("/generate_rejection", response_model=RejectionFeedback)
@limiter.limit("10/minute")
async def generate_rejection(request: Request, payload: RejectionRequest):
    """Generate AI-powered rejection feedback."""
    result = await generate_ai_rejection(
        student_profile=payload.reason_json.get("profile_data", {}),
        job_data=payload.reason_json.get("job_data", {}),
        api_key=settings.GEMINI_API_KEY
    )
    
    # Persist rejection to Supabase
    await _persist_rejection_to_supabase(
        application_id=payload.application_id if hasattr(payload, 'application_id') else payload.reason_json.get("application_id"),
        student_id=payload.student_id,
        job_id=payload.job_id,
        rejection=result
    )
    
    return result

@router.post("/verify_platform", response_model=PlatformVerifyResponse)
@limiter.limit("5/minute")
async def verify_platform(request: Request, payload: PlatformVerifyRequest):
    """Verify and scrape a single platform (GitHub, LeetCode, etc.)"""
    platform = payload.platform.lower()
    username = payload.username
    
    if not username and payload.url:
        import re
        if platform == "github":
            match = re.search(r"github\.com/([a-zA-Z0-9_-]+)", payload.url)
            if match: username = match.group(1)
        elif platform == "leetcode":
            match = re.search(r"leetcode\.com/(?:u/)?([a-zA-Z0-9_-]+)/?", payload.url)
            if match: username = match.group(1)
        elif platform == "linkedin":
            match = re.search(r"linkedin\.com/in/([a-zA-Z0-9_-]+)", payload.url)
            if match: username = match.group(1)
    
    if not username:
        return PlatformVerifyResponse(status="failed", error="Could not extract username from URL")
        
    success, data, error = await platform_orchestrator.scrape_single_platform(platform, username)
    
    # Optional: Persist to Supabase if student_id is known (would need student_id in request)
    return PlatformVerifyResponse(status="success" if success else "failed", data=data, error=error)

async def _persist_score_to_supabase(
    student_id: str,
    job_id: str,
    application_id: Optional[str],
    score: CandidateScore,
    legacy_score: float,
    custom_weights: Optional[dict]
):
    """Persist intelligence score to Supabase"""
    if not supabase:
        return
        
    try:
        data = {
            "student_id": student_id,
            "job_id": job_id,
            "application_id": application_id,
            "legacy_score": legacy_score,
            "skill_match_score": score.skill_match_score,
            "project_score": score.project_score,
            "growth_score": score.growth_score,
            "trust_score": score.trust_score,
            "dna_score": score.dna_score,
            "overall_reasoning_score": score.overall_reasoning_score,
            "eligible": score.eligible,
            "explanation": score.explanation,
            "component_scores_json": score.component_scores_json,
            "custom_weights": custom_weights,
            "composite_score": score.overall_reasoning_score # Simplified for now
        }
        supabase.table("intelligence_scores").insert(data).execute()
        logger.info(f"Score persisted to Supabase for student {student_id}")
    except Exception as e:
        logger.error(f"Failed to persist score to Supabase: {str(e)}")
async def _persist_rejection_to_supabase(
    application_id: str,
    student_id: str,
    job_id: str,
    rejection: RejectionFeedback
):
    """Persist rejection report to Supabase"""
    if not supabase or not application_id:
        return
        
    try:
        data = {
            "application_id": application_id,
            "student_id": student_id,
            "job_id": job_id,
            "reason": rejection.reason,
            "skill_gaps": rejection.skill_gaps,
            "roadmap": rejection.roadmap,
            "timeline_weeks": rejection.timeline_weeks,
            "target_score": rejection.target_score
        }
        supabase.table("ai_rejection_reports").insert(data).execute()
        logger.info(f"Rejection report persisted for student {student_id}")
    except Exception as e:
        logger.error(f"Failed to persist rejection: {str(e)}")

async def _persist_dna_to_supabase(
    student_id: str,
    dna: dict
):
    """Persist DNA analysis to Supabase"""
    if not supabase:
        return
        
    try:
        data = {
            "student_id": student_id,
            "abstraction_score": dna.get("abstraction_score", 0),
            "architecture_score": dna.get("architecture_score", 0),
            "maturity_score": dna.get("code_quality_score", 0), # Mapping quality to maturity
            "patterns_detected": dna.get("analysis_details", {}).get("languages_used", []),
            "analysis_json": dna,
            "status": "completed",
            "updated_at": "now()"
        }
        supabase.table("coding_dna_analyses").upsert(data, on_conflict="student_id").execute()
        logger.info(f"DNA analysis persisted for student {student_id}")
    except Exception as e:
        logger.error(f"Failed to persist DNA: {str(e)}")

async def _persist_trajectory_to_supabase(
    student_id: str,
    trajectory: dict
):
    """Persist trajectory prediction to Supabase"""
    if not supabase:
        return
        
    try:
        data = {
            "student_id": student_id,
            "projected_role": trajectory.get("projected_role"),
            "forecast_6_month": trajectory.get("forecast_6_month"),
            "forecast_12_month": trajectory.get("forecast_12_month"),
            "probability": trajectory.get("probability", 0),
            "input_snapshot": trajectory.get("input_scores", {}),
            "updated_at": "now()"
        }
        supabase.table("talent_trajectory_predictions").upsert(data, on_conflict="student_id").execute()
        logger.info(f"Trajectory persisted for student {student_id}")
    except Exception as e:
        logger.error(f"Failed to persist trajectory: {str(e)}")

@router.post("/analyze_dna", response_model=DNAAnalysisResponse)
async def analyze_dna_endpoint(payload: DNAAnalysisRequest):
    if not feature_flags.ENABLE_CODING_DNA:
        return DNAAnalysisResponse(abstraction_score=0, architecture_score=0, code_quality_score=0, maturity_level="Disabled", analysis_details={})
    result = await analyze_coding_dna(payload.github_username, payload.repositories)
    
    # Persist DNA analysis to Supabase
    await _persist_dna_to_supabase(
        student_id=payload.student_id,
        dna=result
    )
    
    return DNAAnalysisResponse(**result)

@router.post("/predict_trajectory", response_model=TrajectoryResponse)
async def predict_trajectory_endpoint(payload: TrajectoryRequest):
    if not feature_flags.ENABLE_TRAJECTORY:
        return TrajectoryResponse(projected_role="Disabled", forecast_6_month="N/A", forecast_12_month="N/A", probability=0.0, talent_index=0.0)
    trajectory_data = predict_talent_trajectory(
        trust_score=payload.trust_score, growth_velocity=payload.growth_velocity,
        dna_score=payload.dna_score, skill_coverage=payload.skill_coverage, current_role=payload.current_role
    )
    
    # Persist trajectory prediction to Supabase
    await _persist_trajectory_to_supabase(
        student_id=payload.student_id,
        trajectory=trajectory_data
    )
    
    return TrajectoryResponse(**trajectory_data)

def _get_fallback_score(legacy_score: float, reason: str) -> CandidateScore:
    return CandidateScore(
        skill_match_score=legacy_score, project_score=legacy_score,
        overall_reasoning_score=legacy_score, eligible=legacy_score > 70, explanation=reason
    )
