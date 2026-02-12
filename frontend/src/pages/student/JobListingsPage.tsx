import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Building2, MapPin, Clock, Briefcase, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

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
}

const JobListingsPage: React.FC = () => {
  const [allJobs, setAllJobs] = useState<JobRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ jobType: 'all', location: 'all', roleType: 'all' });
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (!error) setAllJobs(data || []);
      setIsLoading(false);
    };
    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    let result = allJobs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(job =>
        job.title.toLowerCase().includes(q) ||
        job.company_name.toLowerCase().includes(q) ||
        (job.required_skills || []).some(s => s.toLowerCase().includes(q))
      );
    }
    if (filters.jobType !== 'all') result = result.filter(j => j.job_type === filters.jobType);
    if (filters.location !== 'all') result = result.filter(j => j.location?.includes(filters.location));
    if (filters.roleType !== 'all') result = result.filter(j => j.role_type === filters.roleType);
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    return result;
  }, [allJobs, searchQuery, filters, sortBy]);

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

  const clearFilters = () => { setFilters({ jobType: 'all', location: 'all', roleType: 'all' }); setSearchQuery(''); };
  const hasActiveFilters = searchQuery || filters.jobType !== 'all' || filters.location !== 'all' || filters.roleType !== 'all';

  if (isLoading) {
    return <div className="min-h-screen pt-20 pb-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Jobs</h1>
          <p className="text-muted-foreground">Find opportunities that match your skills</p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by title, company, or skill..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'bg-muted' : ''}>
                <Filter className="w-4 h-4 mr-2" /> Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card className="animate-fade-in">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Type</label>
                    <Select value={filters.jobType} onValueChange={(v) => setFilters(p => ({ ...p, jobType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Intern">Intern</SelectItem>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Select value={filters.location} onValueChange={(v) => setFilters(p => ({ ...p, location: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="Remote">Remote</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                        <SelectItem value="On-site">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role Type</label>
                    <Select value={filters.roleType} onValueChange={(v) => setFilters(p => ({ ...p, roleType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="AI">AI Engineer</SelectItem>
                        <SelectItem value="SDE">SDE</SelectItem>
                        <SelectItem value="Full-Stack">Full-Stack</SelectItem>
                        <SelectItem value="Data Analyst">Data Analyst</SelectItem>
                        <SelectItem value="ML Engineer">ML Engineer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-4"><X className="w-4 h-4 mr-1" /> Clear all filters</Button>}
              </CardContent>
            </Card>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4">{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found</p>

        <div className="space-y-4">
          {filteredJobs.map(job => (
            <Card key={job.id} className="glass-card-hover">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{job.title}</h3>
                      {job.job_type && <Badge variant="outline">{job.job_type}</Badge>}
                      {job.role_type && <Badge variant="secondary">{job.role_type}</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.company_name}</span>
                      {job.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>}
                      {job.experience_required && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.experience_required}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDate(job.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(job.required_skills || []).slice(0, 5).map(skill => <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>)}
                      {(job.required_skills || []).length > 5 && <Badge variant="secondary" className="text-xs">+{(job.required_skills || []).length - 5} more</Badge>}
                    </div>
                    {job.salary_range && <p className="text-sm text-muted-foreground">💰 {job.salary_range}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <Link to={`/student/jobs/${job.id}`}>
                      <Button className="btn-secondary">View Details<ChevronRight className="w-4 h-4 ml-1" /></Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button onClick={clearFilters} variant="outline">Clear all filters</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListingsPage;