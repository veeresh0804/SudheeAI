import logging

logger = logging.getLogger("sudhee-ai-intelligence")

def calculate_trust_score(profile_data: dict) -> int:
    """
    Basic Trust Engine implementation.
    Starts with 70 and adjusts based on activity.
    """
    trust_score = 70
    
    try:
        # Check LeetCode activity
        # If LeetCode solved > 80 in 7 days (suspicious/prodigy but flag for review)
        leetcode_stats = profile_data.get("leetcode_data", {})
        recent_solved = leetcode_stats.get("solved_last_7_days", 0)
        if recent_solved > 80:
            trust_score -= 20
            logger.warning("Trust anomaly: High LeetCode activity detected", extra={"props": {"recent_solved": recent_solved}})

        # Check GitHub activity
        github_stats = profile_data.get("github_data", {})
        recent_commits = github_stats.get("commits_last_30_days", 0)
        if recent_commits == 0:
            trust_score -= 10
            logger.info("Trust adjustment: Zero GitHub activity in 30 days")

    except Exception as e:
        logger.error(f"Error calculating trust score: {str(e)}")
        # If calculation fails, return default
        return 70

    # Clamp between 0-100
    trust_score = max(0, min(100, trust_score))
    
    return trust_score
