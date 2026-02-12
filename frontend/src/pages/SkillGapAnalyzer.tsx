import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Target, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SkillGapChart from '@/components/SkillGapChart';
import ImprovementRoadmapComponent from '@/components/ImprovementRoadmap';
import LoadingSpinner from '@/components/LoadingSpinner';
import { analyzeSkillGaps, generateImprovementRoadmap } from '@/services/eligibilityEngine';
import { getCandidateById } from '@/services/rankingEngine';
import { mockJobs } from '@/data/mockJobs';
import { mockCandidates } from '@/data/mockCandidates';
import { SkillGap, ImprovementRoadmap, Candidate } from '@/types';

const SkillGapAnalyzer: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [roadmap, setRoadmap] = useState<ImprovementRoadmap | null>(null);
  const [student, setStudent] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<'gaps' | 'roadmap'>('gaps');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Get params from URL query or location state
  const queryJobId = searchParams.get('jobId');
  const { studentId: stateStudentId, jdSkills: stateJdSkills, roleType: stateRoleType } = location.state || {};

  // Default to demo student
  const demoStudent = mockCandidates[0];

  useEffect(() => {
    // If we have state from navigation, use that
    if (stateStudentId && stateJdSkills) {
      loadDataFromState();
    } else if (queryJobId) {
      // If we have a jobId from URL, set it and auto-analyze
      setSelectedJobId(queryJobId);
      const job = mockJobs.find(j => j.id === queryJobId);
      if (job) {
        analyzeJob(job);
      }
    }
  }, [stateStudentId, stateJdSkills, queryJobId]);

  const loadDataFromState = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const studentData = getCandidateById(stateStudentId);
    setStudent(studentData || null);

    const gapsData = analyzeSkillGaps(stateStudentId, stateJdSkills);
    setGaps(gapsData);

    const roadmapData = generateImprovementRoadmap(stateStudentId, stateJdSkills);
    setRoadmap(roadmapData);

    setIsLoading(false);
    setHasAnalyzed(true);
  };

  const analyzeJob = async (job: typeof mockJobs[0]) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setStudent(demoStudent);

    const gapsData = analyzeSkillGaps(demoStudent.id, job.requiredSkills);
    setGaps(gapsData);

    const roadmapData = generateImprovementRoadmap(demoStudent.id, job.requiredSkills);
    setRoadmap(roadmapData);

    setIsLoading(false);
    setHasAnalyzed(true);
  };

  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    setHasAnalyzed(false);
    setGaps([]);
    setRoadmap(null);
  };

  const handleAnalyze = () => {
    const job = mockJobs.find(j => j.id === selectedJobId);
    if (job) {
      analyzeJob(job);
    }
  };

  const selectedJob = mockJobs.find(j => j.id === selectedJobId);

  // Show job selection UI if no data
  if (!hasAnalyzed && !isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-8">
            <Link to="/student/dashboard">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Skill Gap Analyzer</h1>
            <p className="text-muted-foreground mt-1">
              Identify skill gaps and get a personalized improvement roadmap
            </p>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Select a Target Role
              </CardTitle>
              <CardDescription>
                Choose a job to analyze your skill gaps against its requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedJobId} onValueChange={handleJobChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {mockJobs.filter(j => j.status === 'active').map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} at {job.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedJob && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedJob.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedJob.company} • {selectedJob.location}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Required Skills: {selectedJob.requiredSkills.length}
                  </p>
                </div>
              )}

              <Button 
                onClick={handleAnalyze}
                disabled={!selectedJobId}
                className="btn-secondary w-full"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyze Skill Gaps
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner text="Generating personalized improvement roadmap..." size="lg" />
      </div>
    );
  }

  if (!student || !roadmap) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No data available</h2>
          <p className="text-muted-foreground mb-4">Please start from the student dashboard</p>
          <Link to="/student/dashboard">
            <Button>Go to Student Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const criticalGaps = gaps.filter(g => g.priority === 'CRITICAL').length;
  const importantGaps = gaps.filter(g => g.priority === 'IMPORTANT').length;
  const polishGaps = gaps.filter(g => g.priority === 'POLISH').length;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                <span className="gradient-text">Your Improvement Roadmap</span>
              </h1>
              <p className="text-muted-foreground">
                Personalized plan for <span className="text-primary">{student.name}</span>
                {selectedJob && <> • {selectedJob.title}</>}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold gradient-text">{gaps.length}</div>
            <div className="text-sm text-muted-foreground">Total Gaps</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{criticalGaps}</div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-warning">{importantGaps}</div>
            <div className="text-sm text-muted-foreground">Important</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-success">{polishGaps}</div>
            <div className="text-sm text-muted-foreground">Polish</div>
          </div>
        </div>

        {/* Time Estimate */}
        {roadmap.totalEstimatedTime && roadmap.totalEstimatedTime !== '0 weeks' && (
          <Card className="glass-card mb-8 animate-fade-in">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary" />
                <span>Estimated time to be job-ready:</span>
                <span className="font-bold text-primary">{roadmap.totalEstimatedTime}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 animate-fade-in">
          <Button
            variant={activeTab === 'gaps' ? 'default' : 'outline'}
            onClick={() => setActiveTab('gaps')}
            className={activeTab === 'gaps' ? 'bg-primary' : ''}
          >
            <Target className="w-4 h-4 mr-2" />
            Skill Gaps
          </Button>
          <Button
            variant={activeTab === 'roadmap' ? 'default' : 'outline'}
            onClick={() => setActiveTab('roadmap')}
            className={activeTab === 'roadmap' ? 'bg-primary' : ''}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Learning Roadmap
          </Button>
        </div>

        {/* Content */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {activeTab === 'gaps' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Skill Gap Analysis</h2>
                  <p className="text-sm text-muted-foreground">
                    Compare your current level with job requirements
                  </p>
                </div>
              </div>
              
              <SkillGapChart gaps={gaps} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Step-by-Step Learning Plan</h2>
                  <p className="text-sm text-muted-foreground">
                    Follow this roadmap to become job-ready
                  </p>
                </div>
              </div>
              
              <ImprovementRoadmapComponent roadmap={roadmap} />
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 glass-card p-6 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold text-lg mb-2">Ready to check another role?</h3>
          <p className="text-muted-foreground mb-4">
            Compare your profile against different job descriptions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline"
              onClick={() => {
                setHasAnalyzed(false);
                setSelectedJobId('');
                setGaps([]);
                setRoadmap(null);
              }}
            >
              Analyze Another Job
            </Button>
            <Link to="/student/eligibility">
              <Button className="btn-secondary">
                Check Eligibility
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillGapAnalyzer;