
-- Fix 1: Replace overly permissive student_profiles recruiter policy
DROP POLICY IF EXISTS "Recruiters can view student profiles" ON public.student_profiles;

CREATE POLICY "Recruiters can view applicant profiles" 
ON public.student_profiles FOR SELECT 
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.student_id = student_profiles.user_id
    AND j.recruiter_id = auth.uid()
  )
);

-- Fix 2: Replace overly permissive resume storage policy
DROP POLICY IF EXISTS "Recruiters can view applicant resumes" ON storage.objects;

CREATE POLICY "Recruiters can view applicant resumes" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'resumes' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.student_id::text = (storage.foldername(name))[1]
      AND j.recruiter_id = auth.uid()
    )
  )
);
