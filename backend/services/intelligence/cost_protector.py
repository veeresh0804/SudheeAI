import logging
from typing import Dict, Optional
from datetime import datetime, timedelta

logger = logging.getLogger("sudhee-ai-intelligence")

class CostProtector:
    """
    Cost and token protection mechanisms.
    
    Features:
    - Token usage tracking
    - Rate limiting per user
    - Cached response reuse
    - Quota protection
    - Usage warnings
    """
    
    # Token limits (monthly)
    MONTHLY_TOKEN_LIMIT = 1000000  # 1M tokens per month
    DAILY_TOKEN_LIMIT = 50000      # 50K tokens per day
    
    # AI call limits (per user)
    AI_CALLS_PER_HOUR = 10
    AI_CALLS_PER_DAY = 50
    
    # Cache duration for identical requests (minutes)
    CACHE_DURATION_MINUTES = 30
    
    def __init__(self):
        self.usage_cache = {}  # In-memory (would use ai_usage_logs table)
        self.response_cache = {}  # Cache AI responses
    
    def can_make_ai_call(
        self,
        user_id: str,
        endpoint: str
    ) -> tuple[bool, Optional[str]]:
        """
        Check if user can make an AI call based on rate limits.
        
        Returns:
            (allowed, reason_if_denied)
        """
        # Check hourly limit
        hour_key = f"{user_id}:hour:{datetime.utcnow().hour}"
        hourly_calls = self.usage_cache.get(hour_key, 0)
        
        if hourly_calls >= self.AI_CALLS_PER_HOUR:
            return (False, f"Hourly AI call limit reached ({self.AI_CALLS_PER_HOUR}/hour)")
        
        # Check daily limit
        day_key = f"{user_id}:day:{datetime.utcnow().date()}"
        daily_calls = self.usage_cache.get(day_key, 0)
        
        if daily_calls >= self.AI_CALLS_PER_DAY:
            return (False, f"Daily AI call limit reached ({self.AI_CALLS_PER_DAY}/day)")
        
        return (True, None)
    
    def track_ai_usage(
        self,
        user_id: str,
        endpoint: str,
        tokens_used: int,
        latency_ms: int,
        status: str = "success"
    ):
        """Track AI usage for a user."""
        # Update hourly counter
        hour_key = f"{user_id}:hour:{datetime.utcnow().hour}"
        self.usage_cache[hour_key] = self.usage_cache.get(hour_key, 0) + 1
        
        # Update daily counter
        day_key = f"{user_id}:day:{datetime.utcnow().date()}"
        self.usage_cache[day_key] = self.usage_cache.get(day_key, 0) + 1
        
        # Log for monitoring
        logger.info("AI usage tracked", extra={
            "props": {
                "user_id": user_id,
                "endpoint": endpoint,
                "tokens_used": tokens_used,
                "latency_ms": latency_ms,
                "status": status
            }
        })
        
        # In production, would write to ai_usage_logs table
    
    def get_cached_response(
        self,
        cache_key: str
    ) -> Optional[Dict]:
        """Get cached AI response if available and not expired."""
        cached = self.response_cache.get(cache_key)
        
        if not cached:
            return None
        
        # Check expiry
        cached_at = cached.get("cached_at")
        if cached_at:
            expiry_time = cached_at + timedelta(minutes=self.CACHE_DURATION_MINUTES)
            if datetime.utcnow() > expiry_time:
                # Expired
                del self.response_cache[cache_key]
                return None
        
        logger.info(f"Using cached AI response for {cache_key}")
        return cached.get("response")
    
    def cache_response(
        self,
        cache_key: str,
        response: Dict
    ):
        """Cache an AI response."""
        self.response_cache[cache_key] = {
            "response": response,
            "cached_at": datetime.utcnow()
        }
        
        logger.info(f"Cached AI response for {cache_key}")
    
    def generate_cache_key(
        self,
        endpoint: str,
        params: Dict
    ) -> str:
        """
        Generate deterministic cache key from endpoint and params.
        
        Only caches if params are identical (including order).
        """
        import hashlib
        import json
        
        key_data = f"{endpoint}:{json.dumps(params, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def check_token_quota(
        self,
        user_id: str,
        requested_tokens: int
    ) -> tuple[bool, Optional[str]]:
        """Check if user has sufficient token quota."""
        # In production, would query ai_usage_logs and calculate totals
        
        # Placeholder - always allow
        return (True, None)
    
    def log_anomaly(
        self,
        user_id: str,
        anomaly_type: str,
        details: Dict
    ):
        """Log cost or usage anomaly."""
        logger.warning("Cost anomaly detected", extra={
            "props": {
                "user_id": user_id,
                "anomaly_type": anomaly_type,
                "details": details
            }
        })
        
        # In production, would write to ai_anomaly_logs table

# Global instance
cost_protector = CostProtector()
