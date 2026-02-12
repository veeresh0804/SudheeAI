
-- ═══════════════════════════════════
-- INTELLIGENCE LAYER - NEW TABLES ONLY
-- No existing tables are modified
-- ═══════════════════════════════════

-- 1. Feature Flags
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Seed default flags (all OFF)
INSERT INTO public.feature_flags (flag_name, enabled, description) VALUES
  ('ENABLE_TRUST_ENGINE', false, 'Trust & fraud detection engine'),
  ('ENABLE_COMPOSITE_SCORE', false, 'Composite intelligence scoring'),
  ('ENABLE_REJECTION_PORTAL', false, 'AI-powered rejection feedback'),
  ('ENABLE_CODING_DNA', false, 'Coding DNA analyzer'),
  ('ENABLE_TRAJECTORY', false, 'Talent trajectory prediction'),
  ('ENABLE_GROWTH_VELOCITY', false, 'Skill growth velocity tracking');

-- 2. Intelligence Scores (additive, never replaces legacy)
CREATE TABLE public.intelligence_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  legacy_score integer,
  composite_score numeric(5,2),
  skill_match_score numeric(5,2),
  project_score numeric(5,2),
  growth_score numeric(5,2),
  trust_score numeric(5,2),
  dna_score numeric(5,2),
  overall_reasoning_score numeric(5,2),
  component_scores_json jsonb DEFAULT '{}'::jsonb,
  custom_weights jsonb,
  eligible boolean,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intelligence_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own intelligence scores"
  ON public.intelligence_scores FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Recruiters can view scores for their jobs"
  ON public.intelligence_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = intelligence_scores.job_id
      AND j.recruiter_id = auth.uid()
    )
  );

-- 3. Student Trust Scores
CREATE TABLE public.student_trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  trust_score numeric(5,2) DEFAULT 50.0,
  velocity_index numeric(5,2) DEFAULT 0,
  anomaly_flags jsonb DEFAULT '[]'::jsonb,
  last_computed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.student_trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own trust score"
  ON public.student_trust_scores FOR SELECT
  USING (auth.uid() = student_id);

-- 4. Recruiter Trust Scores
CREATE TABLE public.recruiter_trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL,
  trust_score numeric(5,2) DEFAULT 50.0,
  anomaly_flags jsonb DEFAULT '[]'::jsonb,
  last_computed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(recruiter_id)
);

ALTER TABLE public.recruiter_trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own trust score"
  ON public.recruiter_trust_scores FOR SELECT
  USING (auth.uid() = recruiter_id);

-- 5. AI Rejection Reports
CREATE TABLE public.ai_rejection_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  skill_gaps text[] DEFAULT '{}',
  roadmap jsonb DEFAULT '[]'::jsonb,
  timeline_weeks integer,
  target_score numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_rejection_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own rejection reports"
  ON public.ai_rejection_reports FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Recruiters can view rejection reports for their jobs"
  ON public.ai_rejection_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = ai_rejection_reports.job_id
      AND j.recruiter_id = auth.uid()
    )
  );

-- 6. Skill Progress History
CREATE TABLE public.skill_progress_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  skill_name text NOT NULL,
  proficiency_score numeric(5,2) NOT NULL DEFAULT 0,
  source text DEFAULT 'manual',
  recorded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.skill_progress_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own skill history"
  ON public.skill_progress_history FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own skill history"
  ON public.skill_progress_history FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- 7. Coding DNA Analyses
CREATE TABLE public.coding_dna_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  abstraction_score numeric(5,2),
  architecture_score numeric(5,2),
  maturity_score numeric(5,2),
  patterns_detected text[] DEFAULT '{}',
  analysis_json jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.coding_dna_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own coding DNA"
  ON public.coding_dna_analyses FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Recruiters can view applicant coding DNA"
  ON public.coding_dna_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.student_id = coding_dna_analyses.student_id
      AND j.recruiter_id = auth.uid()
    )
  );

-- 8. Talent Trajectory Predictions
CREATE TABLE public.talent_trajectory_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  projected_role text,
  forecast_6_month jsonb DEFAULT '{}'::jsonb,
  forecast_12_month jsonb DEFAULT '{}'::jsonb,
  probability numeric(5,2),
  input_snapshot jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.talent_trajectory_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own trajectory"
  ON public.talent_trajectory_predictions FOR SELECT
  USING (auth.uid() = student_id);

-- 9. Activity Logs (for trust engine)
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_intelligence_scores_updated_at BEFORE UPDATE ON public.intelligence_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_student_trust_scores_updated_at BEFORE UPDATE ON public.student_trust_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_recruiter_trust_scores_updated_at BEFORE UPDATE ON public.recruiter_trust_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_coding_dna_updated_at BEFORE UPDATE ON public.coding_dna_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
