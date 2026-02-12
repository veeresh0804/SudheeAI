from pydantic import BaseModel, Field
from typing import List, Optional

class CandidateScore(BaseModel):
    skill_match_score: float = Field(..., ge=0, le=100)
    project_score: float = Field(..., ge=0, le=100)
    growth_score: Optional[float] = Field(0, ge=0, le=100)
    trust_score: Optional[float] = Field(0, ge=0, le=100)
    dna_score: Optional[float] = Field(0, ge=0, le=100)
    overall_reasoning_score: float = Field(..., ge=0, le=100)
    eligible: bool
    explanation: str
    component_scores_json: Optional[dict] = {}

class RejectionFeedback(BaseModel):
    reason: str
    skill_gaps: List[str]
    roadmap: List[str]
    timeline_weeks: int
    target_score: int

class ScoreRequest(BaseModel):
    candidate_id: str
    job_id: str
    application_id: Optional[str] = None
    profile_data: dict
    job_data: dict
    legacy_score: Optional[float] = 0
    custom_weights: Optional[dict] = None

class RejectionRequest(BaseModel):
    student_id: str
    job_id: str
    reason_json: dict

# ════════════════════════════════════════════════════════════
# Phase 2 Models
# ════════════════════════════════════════════════════════════

class DNAAnalysisRequest(BaseModel):
    student_id: str
    github_username: str
    repositories: List[dict]

class DNAAnalysisResponse(BaseModel):
    abstraction_score: int
    architecture_score: int
    code_quality_score: int
    maturity_level: str
    analysis_details: dict

class TrajectoryRequest(BaseModel):
    student_id: str
    trust_score: int
    growth_velocity: int
    dna_score: int
    skill_coverage: float
    current_role: Optional[str] = "Student"

class TrajectoryResponse(BaseModel):
    projected_role: str
    forecast_6_month: str
    forecast_12_month: str
    probability: float
    talent_index: float

class FraudReportResponse(BaseModel):
    user_id: str
    fraud_flags: List[str]
    confidence_score: float
    trust_score: int
    detailed_report: dict

# ════════════════════════════════════════════════════════════
# Phase 4 Models (Persistence Layer)
# ════════════════════════════════════════════════════════════

class ExternalProfileLink(BaseModel):
    platform: str
    url: str
    username: Optional[str] = None
    last_updated: Optional[str] = None

class ExternalProfileRequest(BaseModel):
    student_id: str
    platform: str
    url: str
    username: Optional[str] = None

class PlatformVerifyRequest(BaseModel):
    platform: str
    url: Optional[str] = None
    username: Optional[str] = None

class PlatformVerifyResponse(BaseModel):
    status: str
    data: Optional[dict] = None
    error: Optional[str] = None
