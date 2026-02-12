import logging
from typing import Dict, Tuple

logger = logging.getLogger("sudhee-ai-intelligence")

def predict_talent_trajectory(
    trust_score: int,
    growth_velocity: int,
    dna_score: int,
    skill_coverage: float,
    current_role: str = "Student"
) -> Dict:
    """
    ML-based career trajectory prediction.
    Predicts likely role progression over 6 and 12 months.
    
    Input scores should be normalized (0-100).
    """
    try:
        # Calculate composite talent index
        talent_index = _calculate_talent_index(
            trust_score, 
            growth_velocity, 
            dna_score, 
            skill_coverage
        )
        
        # Predict 6-month trajectory
        forecast_6m, prob_6m = _predict_6_month_role(talent_index, current_role)
        
        # Predict 12-month trajectory
        forecast_12m, prob_12m = _predict_12_month_role(talent_index, forecast_6m)
        
        # Determine projected role (most optimistic)
        projected_role = forecast_12m
        
        result = {
            "projected_role": projected_role,
            "forecast_6_month": forecast_6m,
            "forecast_12_month": forecast_12m,
            "probability": round((prob_6m + prob_12m) / 2, 2),
            "talent_index": round(talent_index, 2),
            "input_scores": {
                "trust": trust_score,
                "velocity": growth_velocity,
                "dna": dna_score,
                "coverage": skill_coverage
            }
        }
        
        logger.info("Trajectory prediction complete", extra={
            "props": {
                "projected_role": projected_role,
                "talent_index": talent_index
            }
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Error in trajectory prediction: {str(e)}")
        return _get_default_trajectory()

def _calculate_talent_index(trust: int, velocity: int, dna: int, coverage: float) -> float:
    """
    Calculate composite talent index from component scores.
    Weighted combination with emphasis on growth and DNA.
    """
    # Weights: trust (20%), velocity (30%), DNA (30%), coverage (20%)
    talent_index = (
        (trust * 0.20) +
        (velocity * 0.30) +
        (dna * 0.30) +
        (coverage * 100 * 0.20)
    )
    
    return min(100, max(0, talent_index))

def _predict_6_month_role(talent_index: float, current_role: str) -> Tuple[str, float]:
    """
    Predict role in 6 months based on talent index.
    Returns (predicted_role, probability).
    """
    if talent_index >= 85:
        return ("SDE-2 / Mid-Level Engineer", 0.85)
    elif talent_index >= 70:
        return ("SDE-1 / Junior Engineer", 0.80)
    elif talent_index >= 55:
        return ("Associate Engineer / Intern", 0.75)
    elif talent_index >= 40:
        return ("Engineering Intern", 0.65)
    else:
        return ("Skill Development Phase", 0.50)

def _predict_12_month_role(talent_index: float, six_month_role: str) -> Tuple[str, float]:
    """
    Predict role in 12 months based on talent index and 6-month trajectory.
    Assumes continued growth.
    """
    # Apply growth multiplier (assume 10% improvement)
    projected_index = talent_index * 1.1
    
    if projected_index >= 90:
        return ("SDE-2 / Senior Engineer", 0.80)
    elif projected_index >= 75:
        return ("SDE-2 / Mid-Level Engineer", 0.75)
    elif projected_index >= 60:
        return ("SDE-1 / Junior Engineer", 0.70)
    elif projected_index >= 45:
        return ("Associate Engineer", 0.65)
    else:
        return ("Entry-Level Role", 0.55)

def generate_trajectory_insights(trajectory_data: Dict) -> Dict:
    """
    Generate actionable insights from trajectory prediction.
    """
    talent_index = trajectory_data.get("talent_index", 0)
    
    insights = {
        "strengths": [],
        "improvement_areas": [],
        "recommended_actions": []
    }
    
    # Analyze input scores
    input_scores = trajectory_data.get("input_scores", {})
    trust = input_scores.get("trust", 0)
    velocity = input_scores.get("velocity", 0)
    dna = input_scores.get("dna", 0)
    coverage = input_scores.get("coverage", 0)
    
    # Identify strengths
    if trust >= 70:
        insights["strengths"].append("High trustworthiness and authenticity")
    if velocity >= 70:
        insights["strengths"].append("Strong skill growth velocity")
    if dna >= 70:
        insights["strengths"].append("Excellent coding practices and architecture")
    if coverage >= 0.7:
        insights["strengths"].append("Comprehensive skill coverage")
    
    # Identify improvement areas
    if trust < 60:
        insights["improvement_areas"].append("Build trust through consistent activity")
    if velocity < 60:
        insights["improvement_areas"].append("Accelerate skill development")
    if dna < 60:
        insights["improvement_areas"].append("Improve code quality and architecture")
    if coverage < 0.6:
        insights["improvement_areas"].append("Expand skill set breadth")
    
    # Recommend actions
    if velocity < 60:
        insights["recommended_actions"].append("Solve 5-10 coding problems weekly")
    if dna < 60:
        insights["recommended_actions"].append("Contribute to open source projects")
    if coverage < 0.6:
        insights["recommended_actions"].append("Learn in-demand technologies (React, Node.js, Python)")
    
    return insights

def _get_default_trajectory() -> Dict:
    """Fallback trajectory when prediction fails."""
    return {
        "projected_role": "Unable to predict",
        "forecast_6_month": "Insufficient data",
        "forecast_12_month": "Insufficient data",
        "probability": 0.0,
        "talent_index": 0.0,
        "input_scores": {}
    }
