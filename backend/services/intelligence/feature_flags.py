import os

class FeatureFlags:
    # Phase 1 flags
    ENABLE_AI_SCORING = os.getenv("ENABLE_AI_SCORING", "true").lower() == "true"
    ENABLE_TRUST_SCORE = os.getenv("ENABLE_TRUST_SCORE", "true").lower() == "true"
    ENABLE_REJECTION_PORTAL = os.getenv("ENABLE_REJECTION_PORTAL", "true").lower() == "true"
    
    # Phase 2 flags (default OFF for safety)
    ENABLE_FRAUD_ENGINE = os.getenv("ENABLE_FRAUD_ENGINE", "false").lower() == "true"
    ENABLE_VELOCITY = os.getenv("ENABLE_VELOCITY", "false").lower() == "true"
    ENABLE_CODING_DNA = os.getenv("ENABLE_CODING_DNA", "false").lower() == "true"
    ENABLE_TRAJECTORY = os.getenv("ENABLE_TRAJECTORY", "false").lower() == "true"

feature_flags = FeatureFlags()
