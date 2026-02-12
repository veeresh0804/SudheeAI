import json
import logging
import google.generativeai as genai
from models.schemas import RejectionFeedback
from services.intelligence.feature_flags import feature_flags
from services.intelligence.ai_orchestrator import AIOrchestrator
from services.intelligence.cost_protector import cost_protector

logger = logging.getLogger("sudhee-ai-intelligence")

async def generate_ai_rejection(
    student_profile: dict,
    job_data: dict,
    api_key: str,
    user_id: str = "unknown"
) -> RejectionFeedback:
    """
    Generates personalized rejection feedback using Gemini.
    
    Phase 3: Now uses AIOrchestrator for strict validation.
    """
    if not feature_flags.ENABLE_REJECTION_PORTAL:
        return _get_fallback_rejection("Rejection portal disabled")
    
    # Check cost protection
    can_call, denial_reason = cost_protector.can_make_ai_call(user_id, "generate_rejection")
    if not can_call:
        logger.warning(f"AI call denied: {denial_reason}")
        return _get_fallback_rejection(denial_reason)
    
    prompt = f"""
    You are a career coach giving empathetic but professional feedback to a rejected candidate.
    
    Job Description:
    {json.dumps(job_data)}
    
    Candidate Profile:
    {json.dumps(student_profile)}
    
    Return STRICT JSON with these fields:
    - reason (human readable explanation)
    - skill_gaps (list of missing skills)
    - roadmap (list of steps to improve)
    - timeline_weeks (number)
    - target_score (number, recommended score to reach)
    
    No markdown wrappers. No extra text.
    """
    
    # Use AI orchestrator
    orchestrator = AIOrchestrator(api_key)
    
    success, validated_data, metadata = await orchestrator.generate_with_validation(
        prompt=prompt,
        schema=RejectionFeedback,
        context="rejection_feedback",
        fallback_data={
            "reason": "AI failed to generate detailed feedback",
            "skill_gaps": [],
            "roadmap": ["Continue practicing coding problems", "Contribute to open source"],
            "timeline_weeks": 4,
            "target_score": 85
        },
        max_retries=1
    )
    
    # Track usage
    cost_protector.track_ai_usage(
        user_id=user_id,
        endpoint="generate_rejection",
        tokens_used=metadata.get("tokens_used", 0),
        latency_ms=metadata.get("latency_ms", 0),
        status="success" if success else "fallback"
    )
    
    if success and validated_data:
        return validated_data
    else:
        logger.warning("AI rejection generation failed, using fallback")
        return _get_fallback_rejection("AI failed after retries")

def _get_fallback_rejection(reason: str) -> RejectionFeedback:
    return RejectionFeedback(
        reason=reason,
        skill_gaps=[],
        roadmap=["Continue practicing coding problems", "Contribute to open source"],
        timeline_weeks=4,
        target_score=85
    )
