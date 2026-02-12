-- Migration for SudheeAI Intelligence Upgrade
-- Date: 2026-02-11
-- Additive and non-breaking

-- Add custom weight fields to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS weight_skill INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS weight_project INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS weight_trust INTEGER DEFAULT NULL;

-- Add AI scoring and trust fields to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS component_scores_json JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS composite_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 70;

-- Create ai_rejection_reports table
CREATE TABLE IF NOT EXISTS ai_rejection_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id),
    job_id UUID REFERENCES jobs(id),
    reason_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for ai_rejection_reports
ALTER TABLE ai_rejection_reports ENABLE ROW LEVEL SECURITY;

-- Students can view their own rejection reports
CREATE POLICY student_view_rejection_reports ON ai_rejection_reports
    FOR SELECT USING (auth.uid() = student_id);

-- Recruiters can view rejection reports for their jobs
CREATE POLICY recruiter_view_rejection_reports ON ai_rejection_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = ai_rejection_reports.job_id 
            AND jobs.recruiter_id = auth.uid()
        )
    );

-- Add to current task summary
COMMENT ON TABLE ai_rejection_reports IS 'Stored AI-generated rejection feedback for candidates';
