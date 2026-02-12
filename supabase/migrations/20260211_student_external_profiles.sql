-- Migration for Student External Profile Persistence
-- Date: 2026-02-11
-- Description: Stores persistent links to GitHub, LeetCode, LinkedIn, etc.

-- Helper function for updated_at (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS public.student_external_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'github', 'leetcode', 'linkedin', etc.
    url TEXT NOT NULL,
    username TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one record per student per platform
    UNIQUE(student_id, platform)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_external_profiles_student ON public.student_external_profiles(student_id);

-- Enable RLS
ALTER TABLE public.student_external_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can manage their own profile links"
    ON public.student_external_profiles
    FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- Trigger for updated_at
CREATE TRIGGER update_student_external_profiles_updated_at 
BEFORE UPDATE ON public.student_external_profiles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.student_external_profiles IS 'Stores persistent links to external platforms like GitHub, LeetCode, etc.';
