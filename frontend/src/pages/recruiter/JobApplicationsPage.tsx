import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Sparkles, Eye, CheckCircle2,
  XCircle, Clock, Filter, Download, Mail, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
  under_review: { label: 'Under Review', color: 'bg-yellow-500/20 text-yellow-500' },
  shortlisted: { label: 'Shortlisted', color: 'bg-success/20 text-success' },
  rejected: { label: 'Rejected', color: 'bg-destructive/20 text-destructive' },
  interview_scheduled: { label: 'Interview', color: 'bg-blue-500/20 text-blue-500' },
};

interface AppRow {
  id: string;
  student_id: string;
  status: string | null;
  match_score: number | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  ai_summary: string | null;
  created_at: string | null;
  student_name: string;
  student_email: string;
}

const JobApplicationsPage: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!jobId) return;
      
      // Fetch job
      const { data: jobData } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
      setJob(jobData);

      // Fetch applications
      const { data: apps } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (apps && apps.length > 0) {
        // Fetch student profiles
        const studentIds = [...new Set(apps.map(a => a.student_id))];
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', studentIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

        const merged: AppRow[] = apps.map(app => {
          const profile = profileMap.get(app.student_id);
          return {
            id: app.id,
            student_id: app.student_id,
            status: app.status,
            match_score: app.match_score,
            matched_skills: app.matched_skills,
            missing_skills: app.missing_skills,
            ai_summary: app.ai_summary,
            created_at: app.created_at,
            student_name: profile?.full_name || 'Unknown Student',
            student_email: profile?.email || '',
          };
        });
        setApplications(merged);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [jobId]);

  const filteredApps = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const handleBulkAction = async (action: 'shortlisted' | 'rejected') => {
    for (const appId of selectedApps) {
      await supabase.from('applications').update({ status: action }).eq('id', appId);
    }
    setApplications(prev => prev.map(a => selectedApps.includes(a.id) ? { ...a, status: action } : a));
    toast({ title: `Candidates ${action}`, description: `${selectedApps.length} candidates have been ${action}.` });
    setSelectedApps([]);
  };

  const toggleSelect = (appId: string) => {
    setSelectedApps(prev => prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <div className="min-h-screen pt-20 pb-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!job) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center"><h2 className="text-2xl font-bold mb-2">Job not found</h2><Link to="/recruiter/dashboard"><Button>Back to Dashboard</Button></Link></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link to="/recruiter/dashboard"><Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Button></Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <p className="text-muted-foreground mt-1">{applications.length} total applications</p>
            </div>
            <Link to={`/recruiter/jobs/${jobId}/rank`}>
              <Button className="btn-primary"><Sparkles className="w-4 h-4 mr-2" /> AI Rank All Candidates</Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedApps.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedApps.length} selected</span>
              <Button size="sm" variant="outline" className="text-success border-success" onClick={() => handleBulkAction('shortlisted')}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Shortlist
              </Button>
              <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => handleBulkAction('rejected')}>
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
            </div>
          )}
        </div>

        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Applications ({filteredApps.length})</CardTitle></CardHeader>
          <CardContent>
            {filteredApps.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No applications yet</h3>
                <p className="text-muted-foreground">Applications will appear here when students apply</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map(app => {
                  const config = statusConfig[app.status || 'pending'] || statusConfig.pending;
                  return (
                    <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Checkbox checked={selectedApps.includes(app.id)} onCheckedChange={() => toggleSelect(app.id)} />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {app.student_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{app.student_name}</h3>
                          <Badge className={config.color}>{config.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Applied {formatDate(app.created_at)}</span>
                          {app.ai_summary && <span className="truncate max-w-[200px]">{app.ai_summary}</span>}
                        </div>
                      </div>
                      {app.match_score && (
                        <div className="text-center px-4">
                          <p className={`text-xl font-bold ${app.match_score >= 80 ? 'text-success' : app.match_score >= 60 ? 'text-warning' : 'text-muted-foreground'}`}>{app.match_score}%</p>
                          <p className="text-xs text-muted-foreground">Match</p>
                        </div>
                      )}
                      <Button variant="ghost" size="icon"><Mail className="w-4 h-4" /></Button>
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

export default JobApplicationsPage;