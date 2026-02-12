import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, FileSearch, CheckCircle2, Clock, TrendingUp,
  ArrowRight, Building2, MapPin, Star, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const StudentDashboardNew: React.FC = () => {
  const { user, studentProfile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [appStats, setAppStats] = useState({ total: 0, pending: 0, shortlisted: 0 });
  const [profileStrength, setProfileStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch active jobs
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4);
      setJobs(jobData || []);

      // Fetch application stats
      if (user) {
        const { data: apps } = await supabase.from('applications').select('status').eq('student_id', user.id);
        if (apps) {
          setAppStats({
            total: apps.length,
            pending: apps.filter(a => a.status === 'pending' || a.status === 'under_review').length,
            shortlisted: apps.filter(a => a.status === 'shortlisted' || a.status === 'interview_scheduled').length,
          });
        }

        // Fetch profile strength
        const { data: sp } = await supabase.from('student_profiles').select('profile_strength').eq('user_id', user.id).maybeSingle();
        if (sp) setProfileStrength(sp.profile_strength || 0);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <div className="min-h-screen pt-20 pb-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {studentProfile?.name || 'Student'}! 👋</h1>
            <p className="text-muted-foreground mt-1">{studentProfile?.institution || 'Your Institution'} • Find your perfect role</p>
          </div>
          <div className="flex gap-2">
            {!studentProfile?.profileComplete && (
              <Link to="/student/profile-setup">
                <Button variant="outline" className="border-warning text-warning hover:bg-warning/10">
                  <AlertCircle className="w-4 h-4 mr-2" /> Complete Profile
                </Button>
              </Link>
            )}
            <Link to="/student/jobs"><Button className="btn-secondary"><FileSearch className="w-4 h-4 mr-2" /> Browse All Jobs</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-500/20"><Briefcase className="w-6 h-6 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">Jobs Applied</p><p className="text-2xl font-bold">{appStats.total}</p></div></div></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-500" /></div><div><p className="text-sm text-muted-foreground">Under Review</p><p className="text-2xl font-bold">{appStats.pending}</p></div></div></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-green-500/20"><CheckCircle2 className="w-6 h-6 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Shortlisted</p><p className="text-2xl font-bold">{appStats.shortlisted}</p></div></div></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-purple-500/20"><TrendingUp className="w-6 h-6 text-purple-500" /></div><div><p className="text-sm text-muted-foreground">Profile Strength</p><p className="text-2xl font-bold">{profileStrength}%</p></div></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Latest Jobs</CardTitle>
                <Link to="/student/jobs"><Button variant="ghost" size="sm">View All<ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No active jobs at the moment</p>
                ) : jobs.map(job => (
                  <div key={job.id} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{job.title}</h3>
                          {job.job_type && <Badge variant="outline" className="text-xs">{job.job_type}</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {job.company_name}</span>
                          {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(job.required_skills || []).slice(0, 4).map((skill: string) => <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>)}
                          {(job.required_skills || []).length > 4 && <Badge variant="secondary" className="text-xs">+{(job.required_skills || []).length - 4} more</Badge>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground mb-2">{formatDate(job.created_at)}</p>
                        <Link to={`/student/jobs/${job.id}`}><Button size="sm" className="btn-secondary">View</Button></Link>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Profile Strength</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-24 h-24 mx-auto">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" strokeDasharray={`${profileStrength}, 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold">{profileStrength}%</span></div>
                </div>
                <Link to="/student/profile-setup"><Button variant="outline" className="w-full">Improve Profile</Button></Link>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Link to="/student/applications" className="block"><Button variant="ghost" className="w-full justify-start"><Clock className="w-4 h-4 mr-2" /> Track Applications</Button></Link>
                <Link to="/student/eligibility" className="block"><Button variant="ghost" className="w-full justify-start"><CheckCircle2 className="w-4 h-4 mr-2" /> Check Eligibility</Button></Link>
                <Link to="/student/skill-gap" className="block"><Button variant="ghost" className="w-full justify-start"><TrendingUp className="w-4 h-4 mr-2" /> Skill Gap Analysis</Button></Link>
                <Link to="/student/intelligence" className="block"><Button variant="ghost" className="w-full justify-start"><TrendingUp className="w-4 h-4 mr-2" /> Intelligence Hub</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardNew;