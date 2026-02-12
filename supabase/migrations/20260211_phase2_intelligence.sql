-- Migration for Phase 2: Advanced Intelligence Features
-- Date: 2026-02-11
-- Additive only - no destructive changes

-- ════════════════════════════════════════════════════════════
-- 1. STUDENT TRUST SCORES
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS student_trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) UNIQUE,
    trust_score INTEGER DEFAULT 70,
    leetcode_velocity_flag BOOLEAN DEFAULT false,
    github_velocity_flag BOOLEAN DEFAULT false,
    plagiarism_flag BOOLEAN DEFAULT false,
    last_calculated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 2. RECRUITER TRUST SCORES
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS recruiter_trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID REFERENCES auth.users(id) UNIQUE,
    trust_score INTEGER DEFAULT 70,
    job_posting_velocity_flag BOOLEAN DEFAULT false,
    fake_job_flag BOOLEAN DEFAULT false,
    last_calculated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 3. PLAGIARISM REPORTS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS plagiarism_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id),
    platform TEXT NOT NULL,
    detection_type TEXT NOT NULL,
    confidence_score FLOAT,
    evidence_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 4. ACTIVITY LOGS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    activity_type TEXT NOT NULL,
    platform TEXT,
    metadata_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 5. SKILL PROGRESS HISTORY
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS skill_progress_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id),
    skill_name TEXT NOT NULL,
    proficiency_score INTEGER,
    snapshot_date TIMESTAMPTZ DEFAULT now(),
    platform TEXT,
    metadata_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 6. CODING DNA SCORES
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS coding_dna_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) UNIQUE,
    abstraction_score INTEGER DEFAULT 0,
    architecture_score INTEGER DEFAULT 0,
    code_quality_score INTEGER DEFAULT 0,
    maturity_level TEXT,
    analysis_details_json JSONB DEFAULT '{}',
    analyzed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 7. TALENT TRAJECTORY PREDICTIONS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS talent_trajectory_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) UNIQUE,
    projected_role TEXT,
    forecast_6_month TEXT,
    forecast_12_month TEXT,
    probability FLOAT,
    input_scores_json JSONB DEFAULT '{}',
    predicted_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ════════════════════════════════════════════════════════════

-- Student Trust Scores
ALTER TABLE student_trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_view_own_trust ON student_trust_scores
    FOR SELECT USING (auth.uid() = student_id);

-- Recruiter Trust Scores
ALTER TABLE recruiter_trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY recruiter_view_own_trust ON recruiter_trust_scores
    FOR SELECT USING (auth.uid() = recruiter_id);

-- Plagiarism Reports
ALTER TABLE plagiarism_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_view_own_plagiarism ON plagiarism_reports
    FOR SELECT USING (auth.uid() = student_id);

-- Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_view_own_activity ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Skill Progress History
ALTER TABLE skill_progress_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_view_own_progress ON skill_progress_history
    FOR SELECT USING (auth.uid() = student_id);

-- Coding DNA Scores
ALTER TABLE coding_dna_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_view_own_dna ON coding_dna_scores
    FOR SELECT USING (auth.uid() = student_id);

-- Talent Trajectory Predictions
ALTER TABLE talent_trajectory_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_view_own_trajectory ON talent_trajectory_predictions
    FOR SELECT USING (auth.uid() = student_id);

-- ════════════════════════════════════════════════════════════
-- INDEXES for Performance
-- ════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_student_id ON skill_progress_history(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_skill_name ON skill_progress_history(skill_name);
CREATE INDEX IF NOT EXISTS idx_plagiarism_student_id ON plagiarism_reports(student_id);

COMMENT ON TABLE student_trust_scores IS 'Phase 2: Trust metrics for students';
COMMENT ON TABLE recruiter_trust_scores IS 'Phase 2: Trust metrics for recruiters';
COMMENT ON TABLE plagiarism_reports IS 'Phase 2: Plagiarism detection records';
COMMENT ON TABLE activity_logs IS 'Phase 2: User activity tracking';
COMMENT ON TABLE skill_progress_history IS 'Phase 2: Time-series skill data for velocity calculation';
COMMENT ON TABLE coding_dna_scores IS 'Phase 2: GitHub code analysis results';
COMMENT ON TABLE talent_trajectory_predictions IS 'Phase 2: ML-based career forecasts';
