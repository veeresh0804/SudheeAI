import logging
from typing import Dict, List, Tuple
from datetime import datetime

logger = logging.getLogger("sudhee-ai-intelligence")

def calculate_skill_velocity(skill_history: List[Dict]) -> Dict:
    """
    Calculate skill growth velocity from historical data.
    
    Returns:
    - growth_slope: Rate of skill improvement
    - acceleration: Rate of change in growth
    - plateau_detected: Whether skill growth has stagnated
    - velocity_score: Overall velocity metric (0-100)
    """
    if not skill_history or len(skill_history) < 2:
        return {
            "growth_slope": 0,
            "acceleration": 0,
            "plateau_detected": False,
            "velocity_score": 0,
            "status": "insufficient_data"
        }
    
    try:
        # Sort by date
        sorted_history = sorted(skill_history, key=lambda x: x.get("snapshot_date", ""))
        
        # Extract proficiency scores
        scores = [h.get("proficiency_score", 0) for h in sorted_history]
        
        # 1. Calculate Growth Slope (linear regression approximation)
        slope = _calculate_slope(scores)
        
        # 2. Calculate Acceleration (second derivative)
        acceleration = _calculate_acceleration(scores)
        
        # 3. Detect Plateau
        plateau_detected = _detect_plateau(scores, window=5)
        
        # 4. Calculate Velocity Score (0-100)
        velocity_score = _calculate_velocity_score(slope, acceleration, plateau_detected)
        
        logger.info("Velocity calculation complete", extra={
            "props": {
                "slope": slope,
                "acceleration": acceleration,
                "plateau": plateau_detected,
                "velocity_score": velocity_score
            }
        })
        
        return {
            "growth_slope": round(slope, 2),
            "acceleration": round(acceleration, 2),
            "plateau_detected": plateau_detected,
            "velocity_score": int(velocity_score),
            "status": "calculated"
        }
        
    except Exception as e:
        logger.error(f"Error calculating velocity: {str(e)}")
        return {
            "growth_slope": 0,
            "acceleration": 0,
            "plateau_detected": False,
            "velocity_score": 0,
            "status": "error"
        }

def _calculate_slope(scores: List[int]) -> float:
    """
    Calculate linear slope using simple linear regression.
    Positive slope = improvement, negative = decline.
    """
    n = len(scores)
    if n < 2:
        return 0
    
    x = list(range(n))
    y = scores
    
    # Simple linear regression: slope = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(x[i] * y[i] for i in range(n))
    sum_x_squared = sum(xi ** 2 for xi in x)
    
    denominator = n * sum_x_squared - sum_x ** 2
    if denominator == 0:
        return 0
    
    slope = (n * sum_xy - sum_x * sum_y) / denominator
    return slope

def _calculate_acceleration(scores: List[int]) -> float:
    """
    Calculate acceleration (rate of change of slope).
    Positive = accelerating growth, negative = slowing growth.
    """
    if len(scores) < 3:
        return 0
    
    # Split into two halves and compare slopes
    mid = len(scores) // 2
    first_half = scores[:mid]
    second_half = scores[mid:]
    
    slope_first = _calculate_slope(first_half)
    slope_second = _calculate_slope(second_half)
    
    acceleration = slope_second - slope_first
    return acceleration

def _detect_plateau(scores: List[int], window: int = 5) -> bool:
    """
    Detect if skill growth has plateaued.
    Returns True if last 'window' scores show minimal change.
    """
    if len(scores) < window:
        return False
    
    recent_scores = scores[-window:]
    score_range = max(recent_scores) - min(recent_scores)
    
    # If range is less than 5 points in the window, consider it a plateau
    return score_range < 5

def _calculate_velocity_score(slope: float, acceleration: float, plateau: bool) -> float:
    """
    Convert slope and acceleration into a 0-100 velocity score.
    Higher is better.
    """
    # Base score from slope (normalized)
    base_score = min(50, max(0, slope * 10))  # slope of 5 = 50 points
    
    # Acceleration bonus/penalty
    accel_bonus = min(30, max(-30, acceleration * 5))
    
    # Plateau penalty
    plateau_penalty = -20 if plateau else 0
    
    velocity_score = base_score + accel_bonus + plateau_penalty + 50  # +50 baseline
    
    return max(0, min(100, velocity_score))

def analyze_multi_skill_velocity(student_id: str, all_skill_histories: Dict[str, List[Dict]]) -> Dict:
    """
    Analyze velocity across all skills for a student.
    Returns aggregate velocity metrics.
    """
    if not all_skill_histories:
        return {"overall_velocity": 0, "skills_analyzed": 0}
    
    velocities = []
    skill_reports = {}
    
    for skill_name, history in all_skill_histories.items():
        velocity_data = calculate_skill_velocity(history)
        velocities.append(velocity_data["velocity_score"])
        skill_reports[skill_name] = velocity_data
    
    overall_velocity = sum(velocities) / len(velocities) if velocities else 0
    
    return {
        "overall_velocity": int(overall_velocity),
        "skills_analyzed": len(velocities),
        "skill_details": skill_reports,
        "top_growing_skill": max(skill_reports.items(), key=lambda x: x[1]["velocity_score"])[0] if skill_reports else None
    }
