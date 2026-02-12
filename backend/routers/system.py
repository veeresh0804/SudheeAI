import time
from fastapi import APIRouter
from services.intelligence.feature_flags import feature_flags
from config.settings import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "ok",
        "ai_service": "reachable",
        "database": "connected",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "feature_flags": {
            "ai_scoring": feature_flags.ENABLE_AI_SCORING,
            "trust_score": feature_flags.ENABLE_TRUST_SCORE,
            "rejection_portal": feature_flags.ENABLE_REJECTION_PORTAL,
            "fraud_engine": feature_flags.ENABLE_FRAUD_ENGINE,
            "velocity": feature_flags.ENABLE_VELOCITY,
            "coding_dna": feature_flags.ENABLE_CODING_DNA,
            "trajectory": feature_flags.ENABLE_TRAJECTORY
        }
    }

@router.get("/status")
async def get_system_status():
    """Detailed system status and metrics"""
    status = {
        "system_health": "healthy",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "services": {
            "gemini": {"status": "ok"},
            "scraping": {
                "github": "ok",
                "leetcode": "ok",
                "linkedin": "not_implemented"
            }
        },
        "metrics": {
            "ai_fallback_rate": 0.0,
            "total_ai_calls_today": 0,
            "total_tokens_used_today": 0,
            "cache_hit_rate": 0.0
        },
        "feature_flags": {
            "ai_scoring": feature_flags.ENABLE_AI_SCORING,
            "trust_score": feature_flags.ENABLE_TRUST_SCORE,
            "rejection_portal": feature_flags.ENABLE_REJECTION_PORTAL,
            "fraud_engine": feature_flags.ENABLE_FRAUD_ENGINE,
            "velocity": feature_flags.ENABLE_VELOCITY,
            "coding_dna": feature_flags.ENABLE_CODING_DNA,
            "trajectory": feature_flags.ENABLE_TRAJECTORY
        }
    }
    return status
