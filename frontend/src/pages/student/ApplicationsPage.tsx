import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Clock, CheckCircle2, XCircle, Calendar,
  Building2, MapPin, ExternalLink, Filter, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AppWithJob {
  id: string;
  job_id: string;
  status: string | null;
  match_score: number | null;
  created_at: string | null;
  recruiter_feedback: string | null;
  job_title: string;
  company_name: string;
  location: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-yellow-500/20 text-yellow-500', icon: Clock },
  shortlisted: { label: 'Shortlisted', color: 'bg-success/20 text-success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-destructive/20 text-destructive', icon: XCircle },
  interview_scheduled: { label: 'Interview Scheduled', color: 'bg-blue-500/20 text-blue-500', icon: Calendar },
};

const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<AppWithJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) { setIsLoading(false); return; }
      
      const { data: apps, error } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !apps) { setIsLoading(false); return; }

      // Fetch job details for each application
      const jobIds = [...new Set(apps.map(a => a.job_id))];
      const { data: jobs } = await supabase.from('jobs').select('id, title, company_name, location').in('id', jobIds);
      const jobMap = new Map((jobs || []).map(j => [j.id, j]));

      const merged: AppWithJob[] = apps.map(app => {
        const job = jobMap.get(app.job_id);
        return {
          id: app.id,
          job_id: app.job_id,
          status: app.status,
          match_score: app.match_score,
          created_at: app.created_at,
          recruiter_feedback: app.recruiter_feedback,
          job_title: job?.title || 'Unknown Job',
          company_name: job?.company_name || 'Unknown Company',
          location: job?.location || null,
        };
      });

      setApplications(merged);
      setIsLoading(false);
    };
    fetchApplications();
  }, [user]);

  const filteredApplications = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending' || a.status === 'under_review').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted' || a.status === 'interview_scheduled').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (isLoading) {
    return <div className="min-h-screen pt-20 pb-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link to="/student/dashboard"><Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Button></Link>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-muted-foreground mt-1">Track the status of your job applications</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-yellow-500">{stats.pending}</p><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-success">{stats.shortlisted}</p><p className="text-sm text-muted-foreground">Shortlisted</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-destructive">{stats.rejected}</p><p className="text-sm text-muted-foreground">Rejected</p></CardContent></Card>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="glass-card">
          <CardHeader><CardTitle>Applications ({filteredApplications.length})</CardTitle></CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No applications found</p>
                <Link to="/student/jobs"><Button className="btn-secondary">Browse Jobs</Button></Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map(app => {
                  const config = statusConfig[app.status || 'pending'] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <div key={app.id} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{app.job_title}</h3>
                            <Badge className={config.color}><StatusIcon className="w-3 h-3 mr-1" />{config.label}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {app.company_name}</span>
                            {app.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {app.location}</span>}
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Applied {formatDate(app.created_at)}</span>
                          </div>
                          {app.recruiter_feedback && <p className="mt-2 text-sm text-muted-foreground italic">"{app.recruiter_feedback}"</p>}
                        </div>
                        <div className="flex items-center gap-4">
                          {app.match_score && (
                            <div className="text-center">
                              <p className={`text-xl font-bold ${app.match_score >= 80 ? 'text-success' : app.match_score >= 60 ? 'text-warning' : 'text-muted-foreground'}`}>{app.match_score}%</p>
                              <p className="text-xs text-muted-foreground">Match</p>
                            </div>
                          )}
                          <Link to={`/student/jobs/${app.job_id}`}>
                            <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 mr-1" /> View Job</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationsPage;