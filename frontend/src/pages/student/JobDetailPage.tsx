import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Building2, MapPin, Clock, Briefcase,
  CheckCircle2, XCircle, Send, TrendingUp, Users, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const JobDetailPage: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, studentProfile } = useAuth();
  
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
      if (error || !data) { setIsLoading(false); return; }
      setJob(data);

      // Check if already applied
      if (user) {
        const { data: app } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', jobId)
          .eq('student_id', user.id)
          .maybeSingle();
        if (app) setHasApplied(true);
      }

      // Run AI match if student has profile data
      if (user && studentProfile?.extractedData) {
        setIsMatching(true);
        try {
          const { data: matchResult } = await supabase.functions.invoke('analyze-profile', {
            body: {
              profileData: studentProfile.extractedData,
              jobData: { title: data.title, required_skills: data.required_skills, preferred_skills: data.preferred_skills, role_type: data.role_type },
              analysisType: 'match',
            },
          });
          if (matchResult?.analysis) setMatchData(matchResult.analysis);
        } catch (err) {
          console.warn('Match analysis failed:', err);
        }
        setIsMatching(false);
      }

      setIsLoading(false);
    };
    fetchJob();
  }, [jobId, user]);

  if (isLoading) {
    return <div className="min-h-screen pt-20 pb-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!job) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job not found</h2>
          <p className="text-muted-foreground mb-4">This job posting may have been removed.</p>
          <Link to="/student/jobs"><Button>Browse Jobs</Button></Link>
        </div>
      </div>
    );
  }

  const handleApply = async () => {
    if (!user) { toast({ title: 'Please log in', description: 'You need to be logged in to apply.', variant: 'destructive' }); return; }
    setIsApplying(true);
    try {
      const { error } = await supabase.from('applications').insert({
        job_id: job.id,
        student_id: user.id,
        match_score: matchData?.overall_match_percentage || null,
        matched_skills: matchData?.matched_skills || [],
        missing_skills: matchData?.missing_skills || [],
        ai_summary: matchData?.explanation || null,
        status: 'pending',
      });
      if (error) throw error;
      setHasApplied(true);
      toast({ title: 'Application submitted!', description: `You have applied to ${job.title} at ${job.company_name}.` });
    } catch (err: any) {
      toast({ title: 'Error applying', description: err.message, variant: 'destructive' });
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const matchScore = matchData?.overall_match_percentage || 0;
  const matchedSkills = matchData?.matched_skills || [];
  const missingSkills = matchData?.missing_skills || [];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs</Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.company_name}</span>
                      {job.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>}
                      {job.experience_required && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.experience_required}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {job.job_type && <Badge>{job.job_type}</Badge>}
                    {job.role_type && <Badge variant="secondary">{job.role_type}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Posted {formatDate(job.created_at)}</span>
                </div>
                {job.salary_range && <p className="mt-3 text-lg font-medium">💰 {job.salary_range}</p>}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{job.description}</pre>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle>Required Skills</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Must Have</p>
                  <div className="flex flex-wrap gap-2">
                    {(job.required_skills || []).map((skill: string) => (
                      <Badge key={skill} variant={matchedSkills.includes(skill) ? 'default' : 'secondary'}
                        className={matchedSkills.includes(skill) ? 'bg-success/20 text-success border-success/30' : ''}>
                        {matchedSkills.includes(skill) && <CheckCircle2 className="w-3 h-3 mr-1" />}{skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                {(job.preferred_skills || []).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Nice to Have</p>
                    <div className="flex flex-wrap gap-2">
                      {(job.preferred_skills || []).map((skill: string) => <Badge key={skill} variant="outline">{skill}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Match Card */}
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Your Fit Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isMatching ? (
                  <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" /><p className="text-sm text-muted-foreground">Analyzing match...</p></div>
                ) : matchData ? (
                  <>
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${matchScore >= 80 ? 'text-success' : matchScore >= 60 ? 'text-warning' : 'text-destructive'}`}>{matchScore}%</div>
                      <p className="text-sm text-muted-foreground">Match Score</p>
                    </div>
                    <div className="space-y-3">
                      {matchedSkills.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-success" /> Matched Skills</p>
                          <div className="flex flex-wrap gap-1">{matchedSkills.map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div>
                        </div>
                      )}
                      {missingSkills.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><XCircle className="w-4 h-4 text-destructive" /> Missing Skills</p>
                          <div className="flex flex-wrap gap-1">{missingSkills.map((s: string) => <Badge key={s} variant="outline" className="text-xs border-destructive/30 text-destructive">{s}</Badge>)}</div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Complete your profile to see fit analysis</p>
                )}
              </CardContent>
            </Card>

            {/* Apply Card */}
            <Card className="glass-card">
              <CardContent className="p-6">
                {hasApplied ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-3" />
                    <h3 className="font-semibold text-lg mb-1">Application Submitted!</h3>
                    <p className="text-sm text-muted-foreground mb-4">Track your application status in My Applications</p>
                    <Link to="/student/applications"><Button variant="outline" className="w-full">View My Applications</Button></Link>
                  </div>
                ) : (
                  <>
                    <Button onClick={handleApply} disabled={isApplying} className="btn-secondary w-full mb-3">
                      {isApplying ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Apply Now</>}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Your profile data will be shared with the recruiter</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;