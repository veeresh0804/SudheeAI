import logging
from typing import Dict, List
from datetime import datetime, timedelta

logger = logging.getLogger("sudhee-ai-intelligence")

def detect_student_fraud(student_data: dict, activity_logs: List[dict]) -> Dict:
    """
    Comprehensive fraud detection for students.
    Returns fraud indicators and confidence scores.
    """
    fraud_report = {
        "leetcode_velocity_flag": False,
        "github_velocity_flag": False,
        "plagiarism_flag": False,
        "confidence_score": 0.0,
        "flags": []
    }
    
    try:
        # 1. LeetCode Velocity Spike Detection
        leetcode_stats = student_data.get("leetcode_data", {})
        solved_last_7_days = leetcode_stats.get("solved_last_7_days", 0)
        
        if solved_last_7_days > 80:
            fraud_report["leetcode_velocity_flag"] = True
            fraud_report["flags"].append("Abnormal LeetCode solving rate (>80 in 7 days)")
            fraud_report["confidence_score"] += 0.3
            logger.warning(f"LeetCode velocity spike detected", extra={
                "props": {"solved_7_days": solved_last_7_days}
            })
        
        # 2. GitHub Commit Pattern Analysis
        github_stats = student_data.get("github_data", {})
        commits_last_30_days = github_stats.get("commits_last_30_days", 0)
        
        # Suspicious if too many commits in short time (>200/month = ~7/day)
        if commits_last_30_days > 200:
            fraud_report["github_velocity_flag"] = True
            fraud_report["flags"].append("Abnormal GitHub commit rate (>200 in 30 days)")
            fraud_report["confidence_score"] += 0.25
            logger.warning(f"GitHub velocity spike detected", extra={
                "props": {"commits_30_days": commits_last_30_days}
            })
        
        # 3. Activity Pattern Analysis
        # Check for suspicious patterns in activity logs
        if activity_logs:
            suspicious_patterns = _analyze_activity_patterns(activity_logs)
            if suspicious_patterns:
                fraud_report["flags"].extend(suspicious_patterns)
                fraud_report["confidence_score"] += 0.2
        
        # 4. Plagiarism Indicators (would be enhanced with actual plagiarism detection)
        # For now, just placeholder logic
        resume_data = student_data.get("resume_data", {})
        if resume_data.get("plagiarism_detected", False):
            fraud_report["plagiarism_flag"] = True
            fraud_report["flags"].append("Potential plagiarism detected in resume")
            fraud_report["confidence_score"] += 0.25
        
        # Clamp confidence between 0-1
        fraud_report["confidence_score"] = min(1.0, fraud_report["confidence_score"])
        
    except Exception as e:
        logger.error(f"Error in fraud detection: {str(e)}")
    
    return fraud_report

def detect_recruiter_fraud(recruiter_data: dict, job_postings: List[dict]) -> Dict:
    """
    Fraud detection for recruiters.
    Detects fake job postings and suspicious patterns.
    """
    fraud_report = {
        "job_posting_velocity_flag": False,
        "fake_job_flag": False,
        "confidence_score": 0.0,
        "flags": []
    }
    
    try:
        # 1. Job Posting Velocity
        recent_jobs = [j for j in job_postings if _is_recent(j.get("created_at"), days=7)]
        
        if len(recent_jobs) > 20:
            fraud_report["job_posting_velocity_flag"] = True
            fraud_report["flags"].append("Abnormal job posting rate (>20 in 7 days)")
            fraud_report["confidence_score"] += 0.4
            logger.warning("Recruiter job posting velocity spike", extra={
                "props": {"recent_jobs": len(recent_jobs)}
            })
        
        # 2. Fake Job Detection Heuristics
        fake_indicators = 0
        for job in job_postings:
            # Check for common fake job patterns
            if not job.get("company_name") or job.get("company_name") == "":
                fake_indicators += 1
            if job.get("salary_range") and "negotiable" in job.get("salary_range", "").lower() and len(job.get("required_skills", [])) < 2:
                fake_indicators += 1
        
        if fake_indicators > len(job_postings) * 0.3:  # >30% suspicious
            fraud_report["fake_job_flag"] = True
            fraud_report["flags"].append("High proportion of suspicious job postings")
            fraud_report["confidence_score"] += 0.3
        
        fraud_report["confidence_score"] = min(1.0, fraud_report["confidence_score"])
        
    except Exception as e:
        logger.error(f"Error in recruiter fraud detection: {str(e)}")
    
    return fraud_report

def _analyze_activity_patterns(activity_logs: List[dict]) -> List[str]:
    """Analyze activity logs for suspicious patterns."""
    suspicious = []
    
    if not activity_logs:
        return suspicious

    # Check for rapid-fire activity (many actions in short window)
    # Filter logs from the last hour
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    
    recent_actions = 0
    for log in activity_logs:
        try:
            log_time = datetime.fromisoformat(log.get("created_at", "").replace("Z", "+00:00"))
            if log_time > one_hour_ago:
                recent_actions += 1
        except:
            continue
            
    if recent_actions > 50:
        suspicious.append(f"High frequency activity detected: {recent_actions} actions in 60m")
    
    return suspicious

def _is_recent(timestamp_str: str, days: int = 7) -> bool:
    """Check if timestamp is within the last N days."""
    try:
        if not timestamp_str:
            return False
            
        # Handle Supabase style timestamps
        clean_ts = timestamp_str.replace("Z", "+00:00")
        ts = datetime.fromisoformat(clean_ts)
        
        now = datetime.utcnow().replace(tzinfo=ts.tzinfo)
        return ts >= (now - timedelta(days=days))
    except Exception as e:
        logger.error(f"Error parsing timestamp {timestamp_str}: {str(e)}")
        return False
