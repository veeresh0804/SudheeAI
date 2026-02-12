import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Briefcase, Users, Clock, Eye, MoreVertical,
  Building2, MapPin, Calendar, ChevronRight, FileText, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JobRow {
  id: string;
  title: string;
  company_name: string;
  location: string | null;
  job_type: string | null;
  experience_required: string | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  role_type: string | null;
  salary_range: string | null;
  status: string | null;
  created_at: string | null;
  deadline: string | null;
}

const RecruiterDashboardNew: React.FC = () => {
  const navigate = useNavigate();
  const { recruiterProfile, user } = useAuth();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) { setIsLoading(false); return; }
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        toast({ title: 'Error loading jobs', description: error.message, variant: 'destructive' });
      } else {
        setJobs(data || []);
        // Fetch application counts for each job
        if (data && data.length > 0) {
          const counts: Record<string, number> = {};
          for (const job of data) {
            const { count } = await supabase
              .from('applications')
              .select('*', { count: 'exact', head: true })
              .eq('job_id', job.id);
            counts[job.id] = count || 0;
          }
          setAppCounts(counts);
        }
      }
      setIsLoading(false);
    };
    fetchJobs();
  }, [user]);

  const totalJobs = jobs.length;
  const totalApplications = Object.values(appCounts).reduce((s, c) => s + c, 0);
  const activeJobs = jobs.filter(j => j.status === 'active').length;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCloseJob = async (jobId: string) => {
    const { error } = await supabase.from('jobs').update({ status: 'closed' }).eq('id', jobId);
    if (!error) {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'closed' } : j));
      toast({ title: 'Job closed' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {recruiterProfile?.recruiterName || 'Recruiter'}! 👋</h1>
            <p className="text-muted-foreground mt-1">{recruiterProfile?.companyName || 'Your Company'} • Manage your job postings and candidates</p>
          </div>
          <Link to="/recruiter/post-job">
            <Button className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Post New Job</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-500/20"><Briefcase className="w-6 h-6 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">Total Jobs Posted</p><p className="text-2xl font-bold">{totalJobs}</p></div></div></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-green-500/20"><Users className="w-6 h-6 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Total Applications</p><p className="text-2xl font-bold">{totalApplications}</p></div></div></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-purple-500/20"><Clock className="w-6 h-6 text-purple-500" /></div><div><p className="text-sm text-muted-foreground">Active Jobs</p><p className="text-2xl font-bold">{activeJobs}</p></div></div></CardContent></Card>
        </div>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Your Job Postings</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No jobs posted yet</h3>
                <p className="text-muted-foreground mb-4">Post your first job and start receiving applications</p>
                <Link to="/recruiter/post-job"><Button className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Post Your First Job</Button></Link>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <div key={job.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>{job.status}</Badge>
                        {job.role_type && <Badge variant="outline">{job.role_type}</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.company_name}</span>
                        {job.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>}
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Posted {formatDate(job.created_at)}</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {appCounts[job.id] || 0} applications</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/recruiter/jobs/${job.id}/applications`}>
                        <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-2" /> View Applications</Button>
                      </Link>
                      <Link to={`/recruiter/jobs/${job.id}/rank`}>
                        <Button className="btn-primary" size="sm">AI Rank<ChevronRight className="w-4 h-4 ml-1" /></Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCloseJob(job.id)} className="text-destructive">Close Job</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecruiterDashboardNew;