import logging
from typing import Optional
from .feature_flags import feature_flags

logger = logging.getLogger("sudhee-ai-intelligence")

def calculate_composite_score(
    skill_match_score: float,
    project_score: float,
    trust_score: float,
    weight_skill: Optional[int] = None,
    weight_project: Optional[int] = None,
    weight_trust: Optional[int] = None,
    overall_reasoning_score: float = 0,
    velocity_score: Optional[int] = None,
    dna_score: Optional[int] = None,
    weight_velocity: Optional[int] = None,
    weight_dna: Optional[int] = None
) -> int:
    """
    Calculates composite score based on recruiter weights.
    Phase 2: Now includes velocity and DNA scores if enabled.
    
    If weights are NULL, falls back to overall_reasoning_score.
    """
    
    # Check if any custom weights are provided
    has_basic_weights = any([weight_skill, weight_project, weight_trust])
    has_advanced_weights = any([weight_velocity, weight_dna])
    
    # If NO weights at all, use overall_reasoning_score as fallback
    if not has_basic_weights and not has_advanced_weights:
        logger.info("Using default overall reasoning score")
        return int(max(0, min(100, overall_reasoning_score)))

    # Initialize weights (0 for NULL values)
    w_skill = weight_skill or 0
    w_project = weight_project or 0
    w_trust = weight_trust or 0
    w_velocity = weight_velocity or 0
    w_dna = weight_dna or 0
    
    # Initialize scores
    v_score = velocity_score or 0
    d_score = dna_score or 0
    
    # Calculate total weight
    total_weight = w_skill + w_project + w_trust
    
    # Add advanced weights if features enabled
    if feature_flags.ENABLE_VELOCITY and velocity_score is not None:
        total_weight += w_velocity
    if feature_flags.ENABLE_CODING_DNA and dna_score is not None:
        total_weight += w_dna
    
    if total_weight == 0:
        logger.warning("Total weight is zero. Falling back to overall_reasoning_score.")
        return int(max(0, min(100, overall_reasoning_score)))

    # Calculate weighted average
    composite = (
        (w_skill * skill_match_score) +
        (w_project * project_score) +
        (w_trust * trust_score)
    )
    
    # Add velocity component if enabled
    if feature_flags.ENABLE_VELOCITY and velocity_score is not None and w_velocity > 0:
        composite += (w_velocity * v_score)
        logger.info("Velocity score included in composite")
    
    # Add DNA component if enabled
    if feature_flags.ENABLE_CODING_DNA and dna_score is not None and w_dna > 0:
        composite += (w_dna * d_score)
        logger.info("DNA score included in composite")
    
    composite = composite / total_weight
    
    logger.info("Custom weights used for composite score", extra={
        "props": {
            "w_skill": w_skill,
            "w_project": w_project,
            "w_trust": w_trust,
            "w_velocity": w_velocity,
            "w_dna": w_dna,
            "total_weight": total_weight
        }
    })
    
    return int(max(0, min(100, composite)))
