import json
import logging
import google.generativeai as genai
from typing import Optional
from models.schemas import CandidateScore
from services.intelligence.feature_flags import feature_flags
from services.intelligence.ai_orchestrator import AIOrchestrator
from services.intelligence.cost_protector import cost_protector

logger = logging.getLogger("sudhee-ai-intelligence")

async def score_candidate_with_gemini(
    profile_data: dict,
    job_data: dict,
    api_key: str,
    legacy_score: Optional[float] = 0,
    user_id: str = "unknown"
) -> CandidateScore:
    """
    Scores a candidate against a job description using Gemini.
    
    Phase 3: Now uses AIOrchestrator for:
    - Response sanitization
    - Strict validation
    - Retry logic
    - Cost protection
    - Token tracking
    """
    if not feature_flags.ENABLE_AI_SCORING:
        return _get_fallback_score(legacy_score, "AI scoring disabled")
    
    # Check cost protection
    can_call, denial_reason = cost_protector.can_make_ai_call(user_id, "score_candidate")
    if not can_call:
        logger.warning(f"AI call denied: {denial_reason}")
        return _get_fallback_score(legacy_score, denial_reason)
    
    # Check cache
    cache_key = cost_protector.generate_cache_key("score_candidate", {
        "job_id": job_data.get("id"),
        "candidate_id": profile_data.get("id")
    })
    
    cached_response = cost_protector.get_cached_response(cache_key)
    if cached_response:
        logger.info("Using cached AI score")
        return CandidateScore(**cached_response)
    
    # Build prompt
    prompt = f"""
    You are a Senior Technical Recruiter. Grade the candidate fit for this job.
    
    Job Description:
    {json.dumps(job_data)}
    
    Candidate Profile:
    {json.dumps(profile_data)}
    
    Return STRICT JSON with these fields:
    - skill_match_score (0-100)
    - project_score (0-100)
    - overall_reasoning_score (0-100)
    - eligible (boolean)
    - explanation (string)
    
    No markdown wrappers. No extra text.
    """
    
    # Use AI orchestrator
    orchestrator = AIOrchestrator(api_key)
    
    success, validated_data, metadata = await orchestrator.generate_with_validation(
        prompt=prompt,
        schema=CandidateScore,
        context="candidate_scoring",
        fallback_data={
            "skill_match_score": legacy_score,
            "project_score": legacy_score,
            "overall_reasoning_score": legacy_score,
            "eligible": legacy_score > 70,
            "explanation": "Fallback score used"
        },
        max_retries=1
    )
    
    # Track usage
    cost_protector.track_ai_usage(
        user_id=user_id,
        endpoint="score_candidate",
        tokens_used=metadata.get("tokens_used", 0),
        latency_ms=metadata.get("latency_ms", 0),
        status="success" if success else "fallback"
    )
    
    if success and validated_data:
        # Cache successful response
        cost_protector.cache_response(cache_key, validated_data.dict())
        return validated_data
    else:
        logger.warning("AI scoring failed, using fallback")
        return _get_fallback_score(legacy_score, "AI failed after retries")

def _get_fallback_score(legacy_score: Optional[float], reason: str) -> CandidateScore:
    return CandidateScore(
        skill_match_score=legacy_score or 0,
        project_score=legacy_score or 0,
        overall_reasoning_score=legacy_score or 0,
        eligible=True if (legacy_score or 0) > 70 else False,
        explanation=reason
    )
