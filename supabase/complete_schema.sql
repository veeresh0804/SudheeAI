-- ==========================================
-- SudheeAI Complete Database Schema
-- Last Updated: 2026-02-13
-- ==========================================
-- This is the COMPLETE schema for fresh Supabase setup
-- Run this in Supabase SQL Editor for new projects

-- ==========================================
-- 1. CORE TABLES
-- ==========================================

-- Profiles (Main user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'recruiter')),
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  institution TEXT,
  degree TEXT,
  branch TEXT,
  graduation_year INTEGER,
  company_name TEXT,
  designation TEXT,
  company_website TEXT,
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Student Profiles (Extended student data)
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  leetcode_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  leetcode_data JSONB DEFAULT '{}'::jsonb,
  github_data JSONB DEFAULT '{}'::jsonb,
  linkedin_data JSONB DEFAULT '{}'::jsonb,
  resume_data JSONB DEFAULT '{}'::jsonb,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  extracted_skills TEXT[] DEFAULT '{}',
  profile_strength INTEGER DEFAULT 0,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Student External Profiles (Platform links)
CREATE TABLE IF NOT EXISTS public.student_external_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'github', 'leetcode', 'linkedin'
    url TEXT NOT NULL,
    username TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, platform)
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  company_name TEXT NOT NULL DEFAULT '',
  location TEXT DEFAULT 'Remote',
  job_type TEXT DEFAULT 'Full-time',
  experience_required TEXT DEFAULT '0-2 years',
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  role_type TEXT DEFAULT 'SDE',
  salary_range TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  weight_skill INTEGER DEFAULT NULL,
  weight_project INTEGER DEFAULT NULL,
  weight_trust INTEGER DEFAULT NULL
);

-- Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'shortlisted', 'rejected', 'interview_scheduled')),
  match_score INTEGER,
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  recruiter_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  ai_score INTEGER DEFAULT NULL,
  component_scores_json JSONB DEFAULT '{}',
  composite_score INTEGER DEFAULT NULL,
  trust_score INTEGER DEFAULT 70,
  UNIQUE(job_id, student_id)
);

-- ==========================================
-- 2. AI/INTELLIGENCE TABLES
-- ==========================================

-- Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Learning Roadmaps
CREATE TABLE IF NOT EXISTS public.learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  roadmap JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Skill Velocity Tracking
CREATE TABLE IF NOT EXISTS public.skill_velocity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  velocity_score NUMERIC(5,2) DEFAULT 0.0,
  snapshot_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, skill_name)
);

-- ==========================================
-- 3. INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_student_external_profiles_student ON public.student_external_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_student ON public.learning_roadmaps(student_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_job ON public.learning_roadmaps(job_id);

-- ==========================================
-- 4. FUNCTIONS
-- ==========================================

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')
  );
  RETURN NEW;
END;
$$;

-- ==========================================
-- 5. TRIGGERS
-- ==========================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_student_profiles_updated_at 
BEFORE UPDATE ON public.student_profiles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_student_external_profiles_updated_at 
BEFORE UPDATE ON public.student_external_profiles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_jobs_updated_at 
BEFORE UPDATE ON public.jobs 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_applications_updated_at 
BEFORE UPDATE ON public.applications 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_external_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_velocity ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can edit own profile" 
  ON public.profiles FOR ALL 
  USING (auth.uid() = user_id);

-- Student Profiles Policies
CREATE POLICY "Students can manage their own profile" 
  ON public.student_profiles FOR ALL 
  USING (auth.uid() = user_id);

-- Student External Profiles Policies
CREATE POLICY "Students can manage their own profile links"
    ON public.student_external_profiles
    FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- Jobs Policies
CREATE POLICY "Anyone can view active jobs" 
  ON public.jobs FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Recruiters can manage their own jobs" 
  ON public.jobs FOR ALL 
  USING (auth.uid() = recruiter_id);

-- Applications Policies
CREATE POLICY "Students can view own applications" 
  ON public.applications FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create applications" 
  ON public.applications FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Recruiters can view applications to their jobs" 
  ON public.applications FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can update applications to their jobs" 
  ON public.applications FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- Roadmaps Policies
CREATE POLICY "Students can manage their own roadmaps"
    ON public.learning_roadmaps
    FOR ALL
    USING (auth.uid() = student_id);

-- Skill Velocity Policies
CREATE POLICY "Students can manage their own skill velocity"
    ON public.skill_velocity
    FOR ALL
    USING (auth.uid() = student_id);

-- ==========================================
-- 7. INITIAL DATA
-- ==========================================

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_name, enabled, description) VALUES
  ('ai_scoring', true, 'Enable AI-powered candidate scoring'),
  ('trust_engine', true, 'Enable trust score calculation'),
  ('skill_velocity', true, 'Enable skill velocity tracking'),
  ('fraud_detection', true, 'Enable fraud detection algorithms')
ON CONFLICT (flag_name) DO NOTHING;

-- ==========================================
-- SCHEMA COMPLETE
-- ==========================================

COMMENT ON TABLE public.profiles IS 'Main user profiles for students and recruiters';
COMMENT ON TABLE public.student_profiles IS 'Extended student profile data including platform links and AI analysis';
COMMENT ON TABLE public.student_external_profiles IS 'Stores persistent links to external platforms like GitHub, LeetCode, etc.';
COMMENT ON TABLE public.jobs IS 'Job postings created by recruiters';
COMMENT ON TABLE public.applications IS 'Student applications to jobs with AI scoring';
COMMENT ON TABLE public.learning_roadmaps IS 'AI-generated learning roadmaps for students';
COMMENT ON TABLE public.skill_velocity IS 'Tracks student skill development velocity over time';
