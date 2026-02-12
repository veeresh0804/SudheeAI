import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, Sparkles, Download, Filter, Eye,
  CheckCircle2, XCircle, Award, Loader2, Brain, Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { intelligenceService } from '@/services/intelligenceService';
import { useToast } from '@/hooks/use-toast';

interface RankedApp {
  id: string;
  student_id: string;
  student_name: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  ai_summary: string | null;
  status: string | null;
  rank: number;
}

const CandidateRankingPage: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { flags } = useFeatureFlags();
  
  const [isLoading, setIsLoading] = useState(true);
  const [rankedCandidates, setRankedCandidates] = useState<RankedApp[]>([]);
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [job, setJob] = useState<any>(null);
  const [isRanking, setIsRanking] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!jobId) return;

      // Fetch job
      const { data: jobData } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
      if (!jobData) { setIsLoading(false); return; }
      setJob(jobData);

      // Fetch applications with student info
      const { data: apps } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .order('match_score', { ascending: false });

      if (apps && apps.length > 0) {
        const studentIds = [...new Set(apps.map(a => a.student_id))];
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', studentIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

        // For apps without match scores, run AI matching
        const needsScoring = apps.filter(a => a.match_score === null);
        if (needsScoring.length > 0) {
          setIsRanking(true);
          for (const app of needsScoring) {
            try {
              const { data: sp } = await supabase.from('student_profiles').select('*').eq('user_id', app.student_id).maybeSingle();
              if (sp) {
                const { data: matchResult } = await supabase.functions.invoke('analyze-profile', {
                  body: {
                    profileData: { leetcode: sp.leetcode_data, github: sp.github_data, linkedin: sp.linkedin_data, skills: sp.extracted_skills },
                    jobData: { title: jobData.title, required_skills: jobData.required_skills, preferred_skills: jobData.preferred_skills, role_type: jobData.role_type },
                    analysisType: 'match',
                  },
                });
                if (matchResult?.analysis) {
                  const a = matchResult.analysis;
                  await supabase.from('applications').update({
                    match_score: a.overall_match_percentage || 0,
                    matched_skills: a.matched_skills || [],
                    missing_skills: a.missing_skills || [],
                    ai_summary: a.explanation || null,
                  }).eq('id', app.id);
                  app.match_score = a.overall_match_percentage || 0;
                  app.matched_skills = a.matched_skills || [];
                  app.missing_skills = a.missing_skills || [];
                  app.ai_summary = a.explanation || null;
                }
              }
            } catch (err) {
              console.warn('AI scoring failed for', app.id, err);
            }
          }
          setIsRanking(false);
        }

        // Sort by score descending and assign ranks
        const sorted = apps.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        const ranked: RankedApp[] = sorted.map((app, i) => ({
          id: app.id,
          student_id: app.student_id,
          student_name: profileMap.get(app.student_id)?.full_name || 'Student',
          match_score: app.match_score || 0,
          matched_skills: app.matched_skills || [],
          missing_skills: app.missing_skills || [],
          ai_summary: app.ai_summary,
          status: app.status,
          rank: i + 1,
        }));
        setRankedCandidates(ranked);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [jobId]);

  if (!job && !isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center"><h2 className="text-2xl font-bold mb-2">Job not found</h2><Link to="/recruiter/dashboard"><Button>Back to Dashboard</Button></Link></div>
      </div>
    );
  }

  const filteredCandidates = rankedCandidates.filter(c => c.match_score >= minScoreFilter);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
    if (rank === 3) return 'bg-amber-600/20 text-amber-600 border-amber-600/30';
    return 'bg-muted text-muted-foreground';
  };

  const handleShortlist = async (appId: string) => {
    await supabase.from('applications').update({ status: 'shortlisted' }).eq('id', appId);
    setRankedCandidates(prev => prev.map(c => c.id === appId ? { ...c, status: 'shortlisted' } : c));
  };

  const handleReject = async (candidate: RankedApp) => {
    setRejectingId(candidate.id);
    try {
      await supabase.from('applications').update({ status: 'rejected' }).eq('id', candidate.id);
      setRankedCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: 'rejected' } : c));

      if (flags.ENABLE_REJECTION_PORTAL && jobId) {
        await intelligenceService.generateRejection({
          applicationId: candidate.id,
          studentId: candidate.student_id,
          jobId,
          jobData: job ? { title: job.title, required_skills: job.required_skills } : undefined,
        });
        toast({ title: 'Rejection report generated', description: 'The student will receive improvement feedback.' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setRejectingId(null);
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/recruiter/dashboard')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="w-8 h-8 text-primary" /> AI-Ranked Candidates</h1>
              {job && <p className="text-muted-foreground mt-1">For: {job.title} at {job.company_name}</p>}
            </div>
          </div>
        </div>

        {isLoading || isRanking ? (
          <LoadingSpinner text={isRanking ? "Running AI analysis on candidates..." : "Loading candidates..."} />
        ) : (
          <>
            {rankedCandidates.length > 0 && (
              <Card className="glass-card mb-8 border-2 border-primary/30">
                <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Top Candidate</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white text-2xl font-bold">{rankedCandidates[0].student_name.charAt(0)}</div>
                      <div>
                        <h3 className="text-xl font-bold">{rankedCandidates[0].student_name}</h3>
                        {rankedCandidates[0].ai_summary && <p className="text-muted-foreground text-sm">{rankedCandidates[0].ai_summary}</p>}
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="text-center"><div className="text-2xl font-bold text-primary">{rankedCandidates[0].match_score}%</div><p className="text-xs text-muted-foreground">Overall Score</p></div>
                      <div className="text-center"><div className="text-2xl font-bold">{rankedCandidates[0].matched_skills.length}</div><p className="text-xs text-muted-foreground">Matched Skills</p></div>
                      <div className="text-center"><div className="text-2xl font-bold">{rankedCandidates[0].missing_skills.length}</div><p className="text-xs text-muted-foreground">Missing Skills</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="glass-card mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">Minimum Score:</span><span className="text-sm text-primary font-bold w-12">{minScoreFilter}%</span></div>
                  <div className="flex-1"><Slider value={[minScoreFilter]} onValueChange={(v) => setMinScoreFilter(v[0])} max={100} step={5} /></div>
                  <p className="text-sm text-muted-foreground">Showing {filteredCandidates.length} of {rankedCandidates.length} candidates</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium text-muted-foreground">Rank</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Candidate</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Match Score</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Skills Match</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map(candidate => (
                        <tr key={candidate.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-4"><Badge className={getRankBadge(candidate.rank)}>#{candidate.rank}</Badge></td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">{candidate.student_name.charAt(0)}</div>
                              <div>
                                <p className="font-medium">{candidate.student_name}</p>
                                {candidate.ai_summary && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{candidate.ai_summary}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24"><Progress value={candidate.match_score} className="h-2" /></div>
                              <span className="font-bold text-sm">{candidate.match_score}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-success" /><span className="text-sm">{candidate.matched_skills.length}</span>
                              <span className="text-muted-foreground mx-1">/</span>
                              <XCircle className="w-4 h-4 text-destructive" /><span className="text-sm">{candidate.missing_skills.length}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={candidate.status === 'shortlisted' ? 'default' : 'secondary'}>{candidate.status || 'pending'}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <Button size="sm" className="btn-primary" onClick={() => handleShortlist(candidate.id)} disabled={candidate.status === 'shortlisted' || candidate.status === 'rejected'}>
                                {candidate.status === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(candidate)} disabled={candidate.status === 'rejected' || rejectingId === candidate.id}>
                                {rejectingId === candidate.id ? <Loader2 className="w-3 h-3 animate-spin" /> : candidate.status === 'rejected' ? 'Rejected' : 'Reject'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredCandidates.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No candidates match the filter</h3>
                    <p className="text-muted-foreground text-sm">Try lowering the minimum score threshold</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default CandidateRankingPage;