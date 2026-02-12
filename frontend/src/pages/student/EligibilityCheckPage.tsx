import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockJobs, Job } from '@/data/mockJobs';
import { mockCandidates } from '@/data/mockCandidates';
import { checkEligibility } from '@/services/eligibilityEngine';
import { EligibilityResult } from '@/types';
import EligibilityBadge from '@/components/EligibilityBadge';
import LoadingSpinner from '@/components/LoadingSpinner';

const EligibilityCheckPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialJobId = searchParams.get('jobId');
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  
  const selectedJob = mockJobs.find(j => j.id === selectedJobId);
  
  // Use demo student (candidate 1)
  const demoStudent = mockCandidates[0];

  useEffect(() => {
    if (initialJobId && mockJobs.find(j => j.id === initialJobId)) {
      handleCheck(initialJobId);
    }
  }, [initialJobId]);

  const handleCheck = async (jobId?: string) => {
    const job = mockJobs.find(j => j.id === (jobId || selectedJobId));
    if (!job) return;

    setIsChecking(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const eligibilityResult = checkEligibility(
      demoStudent.id,
      job.requiredSkills,
      job.roleType as any
    );

    setResult(eligibilityResult);
    setIsChecking(false);
  };

  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    setResult(null);
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/student/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Eligibility Checker</h1>
          <p className="text-muted-foreground mt-1">
            Check if you're ready to apply for a specific role
          </p>
        </div>

        {/* Job Selection */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Select a Job
            </CardTitle>
            <CardDescription>
              Choose a job to check your eligibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedJobId} onValueChange={handleJobChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job to check eligibility" />
              </SelectTrigger>
              <SelectContent>
                {mockJobs.filter(j => j.status === 'active').map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} at {job.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedJob && !result && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2">{selectedJob.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedJob.company} • {selectedJob.location} • {selectedJob.jobType}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={() => handleCheck()}
              disabled={!selectedJobId || isChecking}
              className="btn-secondary w-full"
            >
              {isChecking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Check My Eligibility
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading */}
        {isChecking && (
          <LoadingSpinner text="Analyzing your profile against job requirements..." />
        )}

        {/* Results */}
        {result && selectedJob && !isChecking && (
          <div className="space-y-6 animate-fade-in">
            {/* Main Result */}
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <EligibilityBadge 
                  decision={result.decision}
                  size="lg"
                  className="mb-6"
                />

                <div className="mb-6">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={
                          result.decisionColor === 'green' ? 'hsl(var(--success))' :
                          result.decisionColor === 'yellow' ? 'hsl(var(--warning))' :
                          'hsl(var(--destructive))'
                        }
                        strokeWidth="3"
                        strokeDasharray={`${result.fitPercentage}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{result.fitPercentage}%</span>
                    </div>
                  </div>
                  <p className="text-lg">
                    You are <span className="font-bold">{result.fitPercentage}% ready</span> for this role
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg text-left">
                  <p className="text-sm">{result.recommendation}</p>
                </div>
              </CardContent>
            </Card>

            {/* Skills Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Strengths */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.breakdown.strengths.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No strong matches</p>
                    ) : (
                      result.breakdown.strengths.slice(0, 5).map((s) => (
                        <div key={s.skill} className="flex items-center justify-between">
                          <span className="text-sm">{s.skill}</span>
                          <Badge variant="secondary" className="text-xs">{s.level}%</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weaknesses */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-warning">
                    <AlertCircle className="w-4 h-4" />
                    Needs Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.breakdown.weaknesses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No weak areas</p>
                    ) : (
                      result.breakdown.weaknesses.slice(0, 5).map((s) => (
                        <div key={s.skill} className="flex items-center justify-between">
                          <span className="text-sm">{s.skill}</span>
                          <Badge variant="outline" className="text-xs">{s.level}%</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Missing */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <XCircle className="w-4 h-4" />
                    Missing Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.breakdown.missing.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No missing skills!</p>
                    ) : (
                      result.breakdown.missing.slice(0, 5).map((s) => (
                        <div key={s.skill} className="flex items-center justify-between">
                          <span className="text-sm">{s.skill}</span>
                          <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                            {s.level}%
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              {result.decision === 'APPLY' && (
                <Link to={`/student/jobs/${selectedJob.id}`} className="flex-1">
                  <Button className="btn-secondary w-full">
                    Apply Now
                  </Button>
                </Link>
              )}
              {(result.decision === 'IMPROVE' || result.decision === 'NOT_READY') && (
                <Link to={`/student/skill-gap?jobId=${selectedJob.id}`} className="flex-1">
                  <Button className="btn-secondary w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Improvement Roadmap
                  </Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                onClick={() => setResult(null)}
                className="flex-1"
              >
                Check Another Job
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibilityCheckPage;
