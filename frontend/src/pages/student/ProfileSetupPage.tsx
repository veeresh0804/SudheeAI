import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Github, Linkedin, Code2, ArrowRight, ArrowLeft,
  CheckCircle2, Loader2, AlertCircle, Sparkles, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { fetchGitHubProfile, GitHubProfile } from '@/services/githubService';
import { supabase } from '@/integrations/supabase/client';
import ResumeUpload from '@/components/student/ResumeUpload';
import { apiFetch } from '@/utils/api';

interface PlatformStatus {
  url: string;
  status: 'idle' | 'verifying' | 'verified' | 'error';
  data?: any;
  error?: string;
}

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateStudentProfile, studentProfile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  const [leetcode, setLeetcode] = useState<PlatformStatus>({ url: '', status: 'idle' });
  const [github, setGithub] = useState<PlatformStatus>({ url: '', status: 'idle' });
  const [linkedin, setLinkedin] = useState<PlatformStatus>({ url: '', status: 'idle' });

  // Initialize from existing data
  React.useEffect(() => {
    if (studentProfile?.platformLinks) {
      if (studentProfile.platformLinks.leetcode && leetcode.status === 'idle') {
        setLeetcode({
          url: studentProfile.platformLinks.leetcode,
          status: 'verified',
          data: studentProfile.extractedData?.leetcode
        });
      }
      if (studentProfile.platformLinks.github && github.status === 'idle') {
        setGithub({
          url: studentProfile.platformLinks.github,
          status: 'verified',
          data: studentProfile.extractedData?.github
        });
      }
      if (studentProfile.platformLinks.linkedin && linkedin.status === 'idle') {
        setLinkedin({
          url: studentProfile.platformLinks.linkedin,
          status: 'verified',
          data: studentProfile.extractedData?.linkedin
        });
      }
    }
    if (studentProfile?.resumeUrl && !resumeUrl) {
      setResumeUrl(studentProfile.resumeUrl);
    }
  }, [studentProfile]);

  const verifyLeetCode = async () => {
    if (!leetcode.url) return;
    setLeetcode(prev => ({ ...prev, status: 'verifying' }));

    try {
      const result = await apiFetch('/intelligence/verify_platform', {
        method: 'POST',
        body: JSON.stringify({ platform: 'leetcode', url: leetcode.url }),
      });

      if (result.status === 'success' && result.data) {
        setLeetcode({
          url: leetcode.url,
          status: 'verified',
          data: {
            username: result.data.username,
            problemsSolved: result.data.profile_data?.total_solved || 0,
            easy: result.data.activity_metrics?.easy_solved || 0,
            medium: result.data.activity_metrics?.medium_solved || 0,
            hard: result.data.activity_metrics?.hard_solved || 0,
            rating: result.data.profile_data?.ranking || 0,
          },
        });
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (err: any) {
      setLeetcode({ url: leetcode.url, status: 'error', error: err.message || 'Could not verify LeetCode profile.' });
    }
  };

  const verifyGitHub = async () => {
    if (!github.url) return;
    setGithub(prev => ({ ...prev, status: 'verifying' }));

    try {
      const result = await apiFetch('/intelligence/verify_platform', {
        method: 'POST',
        body: JSON.stringify({ platform: 'github', url: github.url }),
      });

      if (result.status === 'success' && result.data) {
        setGithub({
          url: github.url,
          status: 'verified',
          data: {
            login: result.data.username,
            name: result.data.profile_data?.name,
            publicRepos: result.data.profile_data?.repos_count || 0,
            totalStars: result.data.activity_metrics?.total_stars || 0,
            topLanguages: result.data.activity_metrics?.languages_used || [],
            avatarUrl: result.data.profile_data?.avatar_url,
          }
        });
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (err: any) {
      setGithub({ url: github.url, status: 'error', error: err.message || 'Could not verify GitHub profile.' });
    }
  };

  const verifyLinkedIn = async () => {
    if (!linkedin.url) return;
    setLinkedin(prev => ({ ...prev, status: 'verifying' }));

    try {
      const result = await apiFetch('/intelligence/verify_platform', {
        method: 'POST',
        body: JSON.stringify({ platform: 'linkedin', url: linkedin.url }),
      });

      if (result.status === 'success') {
        setLinkedin({
          url: linkedin.url,
          status: 'verified',
          data: result.data || { url: linkedin.url, note: 'LinkedIn profile linked.' },
        });
      } else {
        // LinkedIn might return "not_implemented" placeholder, we'll still mark as verified if a URL is provided
        setLinkedin({
          url: linkedin.url,
          status: 'verified',
          data: { url: linkedin.url, note: 'LinkedIn profile linked (Data extraction limited).' },
        });
      }
    } catch {
      setLinkedin({
        url: linkedin.url,
        status: 'verified', // Fallback to just linking the URL even if backend fails
        data: { url: linkedin.url, note: 'LinkedIn profile linked.' },
      });
    }
  };

  const handleAnalyzeProfile = async () => {
    setIsAnalyzing(true);

    try {
      // Call AI analysis edge function
      const profileData = {
        leetcode: leetcode.data,
        github: github.data,
        linkedin: linkedin.data,
        hasResume: !!resumeUrl,
      };

      let aiAnalysis: any = null;
      try {
        const { data, error } = await supabase.functions.invoke('analyze-profile', {
          body: { profileData, analysisType: 'profile' },
        });
        if (!error && data?.analysis) aiAnalysis = data.analysis;
      } catch (err) {
        console.warn('AI analysis failed, continuing with rule-based:', err);
      }

      // Save to student_profiles if authenticated
      if (user) {
        const extractedSkills = aiAnalysis?.technical_skills ||
          [...(github.data?.topLanguages || []), ...(leetcode.data ? ['DSA', 'Problem Solving'] : [])];

        const { error: upsertError } = await supabase
          .from('student_profiles')
          .upsert({
            user_id: user.id,
            leetcode_url: leetcode.url || null,
            github_url: github.url || null,
            linkedin_url: linkedin.url || null,
            resume_url: resumeUrl,
            leetcode_data: leetcode.data || {},
            github_data: github.data || {},
            linkedin_data: linkedin.data || {},
            ai_analysis: aiAnalysis || {},
            extracted_skills: extractedSkills,
            profile_strength: aiAnalysis?.profile_strength || 70,
            last_analyzed_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (upsertError) console.error('Error saving student profile:', upsertError);

        // Also save to student_external_profiles for backend compatibility
        const platforms = [];
        if (leetcode.url) platforms.push({ student_id: user.id, platform: 'leetcode', url: leetcode.url, username: leetcode.data?.username || leetcode.url.split('/').pop() });
        if (github.url) platforms.push({ student_id: user.id, platform: 'github', url: github.url, username: github.data?.login || github.url.split('/').pop() });
        if (linkedin.url) platforms.push({ student_id: user.id, platform: 'linkedin', url: linkedin.url });

        if (platforms.length > 0) {
          await (supabase.from('student_external_profiles' as any)).upsert(platforms, { onConflict: 'student_id,platform' });
        }

        // Mark profile as complete
        await supabase
          .from('profiles')
          .update({ profile_complete: true })
          .eq('user_id', user.id);
      }

      await refreshProfile(); // Refresh AuthContext to reflect changes

      toast({ title: 'Profile complete!', description: 'Your profile has been analyzed. Start applying to jobs!' });
      navigate('/student/dashboard');
    } catch (err) {
      console.error('Profile analysis error:', err);
      toast({ title: 'Analysis complete', description: 'Profile saved with available data.' });
      navigate('/student/dashboard');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return leetcode.status === 'verified';
      case 2: return github.status === 'verified';
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  const renderVerificationButton = (platform: PlatformStatus, onVerify: () => void) => {
    if (platform.status === 'verified') {
      return (
        <Button variant="outline" disabled className="gap-2 text-success border-success">
          <CheckCircle2 className="w-4 h-4" /> Verified
        </Button>
      );
    }
    if (platform.status === 'verifying') {
      return (
        <Button variant="outline" disabled className="gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
        </Button>
      );
    }
    return <Button onClick={onVerify} disabled={!platform.url}>Verify Link</Button>;
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/student/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1">Link your coding profiles and upload your resume</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
            <React.Fragment key={step}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                ${currentStep > step ? 'bg-success text-success-foreground' : currentStep === step ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
              </div>
              {index < totalSteps - 1 && (
                <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-success' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card className="glass-card">
          {/* Step 1: LeetCode */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-leetcode" /> Link Your LeetCode Profile
                </CardTitle>
                <CardDescription>We'll extract your problem-solving stats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>LeetCode Profile URL</Label>
                  <div className="flex gap-2">
                    <Input placeholder="https://leetcode.com/username" value={leetcode.url}
                      onChange={(e) => setLeetcode({ ...leetcode, url: e.target.value, status: 'idle' })} />
                    {renderVerificationButton(leetcode, verifyLeetCode)}
                  </div>
                  {leetcode.status === 'error' && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {leetcode.error}
                    </p>
                  )}
                </div>
                {leetcode.status === 'verified' && leetcode.data && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg space-y-2 animate-fade-in">
                    <p className="font-medium text-success flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Profile verified!
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Problems Solved: <span className="font-semibold">{leetcode.data.problemsSolved}</span></div>
                      <div>Contest Rating: <span className="font-semibold">{leetcode.data.rating}</span></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* Step 2: GitHub */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="w-5 h-5" /> Link Your GitHub Profile
                </CardTitle>
                <CardDescription>We'll analyze your repositories and activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>GitHub Profile URL</Label>
                  <div className="flex gap-2">
                    <Input placeholder="https://github.com/username" value={github.url}
                      onChange={(e) => setGithub({ ...github, url: e.target.value, status: 'idle' })} />
                    {renderVerificationButton(github, verifyGitHub)}
                  </div>
                  {github.status === 'error' && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {github.error}
                    </p>
                  )}
                </div>
                {github.status === 'verified' && github.data && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg space-y-2 animate-fade-in">
                    <p className="font-medium text-success flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Profile verified!
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Public Repos: <span className="font-semibold">{github.data.publicRepos}</span></div>
                      <div>Total Stars: <span className="font-semibold">{github.data.totalStars}</span></div>
                    </div>
                    <div className="text-sm">
                      Top Languages: <span className="font-semibold">{github.data.topLanguages.slice(0, 4).join(', ')}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* Step 3: LinkedIn */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Linkedin className="w-5 h-5 text-linkedin" /> Link Your LinkedIn (Optional)
                </CardTitle>
                <CardDescription>Add your LinkedIn for certification verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>LinkedIn Profile URL</Label>
                  <div className="flex gap-2">
                    <Input placeholder="https://linkedin.com/in/username" value={linkedin.url}
                      onChange={(e) => setLinkedin({ ...linkedin, url: e.target.value, status: 'idle' })} />
                    {renderVerificationButton(linkedin, verifyLinkedIn)}
                  </div>
                </div>
                {linkedin.status === 'verified' && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg animate-fade-in">
                    <p className="font-medium text-success flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> LinkedIn profile linked!
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">You can skip this step.</p>
              </CardContent>
            </>
          )}

          {/* Step 4: Resume Upload */}
          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Upload Your Resume
                </CardTitle>
                <CardDescription>Upload your resume for AI skill extraction and recruiter access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResumeUpload onUploadComplete={setResumeUrl} existingUrl={resumeUrl || undefined} />
                <p className="text-sm text-muted-foreground">
                  Your resume will be analyzed by AI to extract skills and experience. You can skip this step.
                </p>
              </CardContent>
            </>
          )}

          {/* Step 5: Analyze */}
          {currentStep === 5 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Analyze Your Profile
                </CardTitle>
                <CardDescription>We'll build your skill profile using AI analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { icon: Code2, label: 'LeetCode', detail: `${leetcode.data?.problemsSolved || 0} problems solved`, verified: leetcode.status === 'verified', iconClass: 'text-leetcode' },
                    { icon: Github, label: 'GitHub', detail: `${github.data?.publicRepos || 0} repositories`, verified: github.status === 'verified', iconClass: '' },
                    { icon: Linkedin, label: 'LinkedIn', detail: linkedin.status === 'verified' ? 'Connected' : 'Not connected', verified: linkedin.status === 'verified', iconClass: 'text-linkedin' },
                    { icon: FileText, label: 'Resume', detail: resumeUrl ? 'Uploaded' : 'Not uploaded', verified: !!resumeUrl, iconClass: 'text-primary' },
                  ].map(({ icon: Icon, label, detail, verified, iconClass }) => (
                    <div key={label} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Icon className={`w-5 h-5 ${iconClass}`} />
                      <div className="flex-1">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">{detail}</p>
                      </div>
                      {verified ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Optional</span>
                      )}
                    </div>
                  ))}
                </div>

                {isAnalyzing ? (
                  <div className="p-6 bg-muted/30 rounded-lg text-center space-y-4 animate-fade-in">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Analyzing your profiles with AI...</p>
                  </div>
                ) : (
                  <Button onClick={handleAnalyzeProfile} className="btn-secondary w-full">
                    <Sparkles className="w-4 h-4 mr-2" /> Analyze My Profile
                  </Button>
                )}
              </CardContent>
            </>
          )}

          {/* Navigation */}
          {!isAnalyzing && (
            <div className="p-6 pt-0 flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 1}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              {currentStep < totalSteps && (
                <Button onClick={() => setCurrentStep(prev => prev + 1)} disabled={!canProceed()} className="btn-secondary">
                  {currentStep === 3 || currentStep === 4 ? 'Continue' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
