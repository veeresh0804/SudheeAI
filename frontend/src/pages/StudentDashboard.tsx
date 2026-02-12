import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  FileText, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JDInputForm from '@/components/JDInputForm';
import EligibilityBadge from '@/components/EligibilityBadge';
import PlatformScoreCard from '@/components/PlatformScoreCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { analyzeJobDescription } from '@/services/nlpProcessor';
import { checkEligibility } from '@/services/eligibilityEngine';
import { mockCandidates } from '@/data/mockCandidates';
import { mockJobDescriptions } from '@/data/mockJobDescriptions';
import { AnalyzedJD, EligibilityResult, Candidate, RoleType } from '@/types';

const StudentDashboard: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [analyzedJD, setAnalyzedJD] = useState<AnalyzedJD | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Candidate | null>(null);

  const handleAnalyzeJD = async (text: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = analyzeJobDescription(text);
    setAnalyzedJD(result);
    setIsLoading(false);
    setStep(2);
  };

  const handleUseSampleJD = (jd: typeof mockJobDescriptions[0]) => {
    handleAnalyzeJD(jd.description);
  };

  const handleCheckEligibility = async () => {
    if (!selectedStudentId || !analyzedJD) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const student = mockCandidates.find(c => c.id === parseInt(selectedStudentId));
    setSelectedStudent(student || null);
    
    const allSkills = [...analyzedJD.skills.mandatory, ...analyzedJD.skills.optional];
    const result = checkEligibility(parseInt(selectedStudentId), allSkills, analyzedJD.roleType);
    
    setEligibilityResult(result);
    setIsLoading(false);
    setStep(3);
  };

  const getScoreColor = (level: number) => {
    if (level >= 70) return 'text-success';
    if (level >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
            <GraduationCap className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">For Students</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Career Readiness</span> Checker
          </h1>
          <p className="text-muted-foreground text-lg">
            Should you apply for this role? Find out with AI-powered analysis.
          </p>
        </div>

        {/* Step 1: JD Input */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${step >= 1 ? 'bg-primary/20' : 'bg-muted'}`}>
              <FileText className={`w-5 h-5 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Step 1: Select or Paste Job Description</h2>
              <p className="text-sm text-muted-foreground">Choose a sample JD or paste your own</p>
            </div>
          </div>

          {step === 1 && (
            <>
              {/* Sample JD Selection */}
              <div className="glass-card p-4">
                <p className="text-sm text-muted-foreground mb-3">Quick Select:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mockJobDescriptions.map((jd) => (
                    <Button
                      key={jd.id}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => handleUseSampleJD(jd)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{jd.title}</p>
                        <p className="text-xs text-muted-foreground">{jd.company} • {jd.roleType}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-4 text-sm text-muted-foreground">or paste your own</span>
                </div>
              </div>

              <JDInputForm onAnalyze={handleAnalyzeJD} isLoading={isLoading} />
            </>
          )}

          {step > 1 && analyzedJD && (
            <div className="glass-card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{analyzedJD.roleType} Role</p>
                <p className="text-sm text-muted-foreground">{analyzedJD.totalSkills} skills extracted</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Change
              </Button>
            </div>
          )}
        </div>

        {isLoading && step === 1 && (
          <LoadingSpinner text="Analyzing job description..." />
        )}

        {/* Step 2: Profile Selection */}
        {step >= 2 && analyzedJD && (
          <div className="space-y-6 mb-8 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${step >= 2 ? 'bg-primary/20' : 'bg-muted'}`}>
                <User className={`w-5 h-5 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Step 2: Select Your Profile</h2>
                <p className="text-sm text-muted-foreground">Choose a sample profile to check eligibility</p>
              </div>
            </div>

            {step === 2 && (
              <div className="glass-card p-6 space-y-4">
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCandidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{candidate.name}</span>
                          <span className="text-xs text-muted-foreground">
                            (LC: {candidate.leetcode.problemsSolved}, GH: {candidate.github.relevantRepos.length} repos)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleCheckEligibility}
                  disabled={!selectedStudentId || isLoading}
                  className="btn-primary w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Check My Eligibility
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {step > 2 && selectedStudent && (
              <div className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{selectedStudent.name}</p>
                    <p className="text-sm text-muted-foreground">Profile selected</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  Change
                </Button>
              </div>
            )}
          </div>
        )}

        {isLoading && step === 2 && (
          <LoadingSpinner text="Analyzing your profile against job requirements..." />
        )}

        {/* Step 3: Eligibility Results */}
        {step === 3 && eligibilityResult && selectedStudent && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Your Eligibility Results</h2>
                <p className="text-sm text-muted-foreground">Based on {analyzedJD?.roleType} role requirements</p>
              </div>
            </div>

            {/* Main Result Card */}
            <div className="glass-card p-8 text-center space-y-6">
              <EligibilityBadge decision={eligibilityResult.decision} size="lg" />
              
              {/* Fit Percentage Circle */}
              <div className="relative w-40 h-40 mx-auto">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 36 36">
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
                      eligibilityResult.decisionColor === 'green' 
                        ? 'hsl(var(--success))' 
                        : eligibilityResult.decisionColor === 'yellow' 
                        ? 'hsl(var(--warning))' 
                        : 'hsl(var(--destructive))'
                    }
                    strokeWidth="3"
                    strokeDasharray={`${eligibilityResult.fitPercentage}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{eligibilityResult.fitPercentage}%</span>
                  <span className="text-sm text-muted-foreground">ready</span>
                </div>
              </div>

              <p className="text-lg max-w-md mx-auto">{eligibilityResult.recommendation}</p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Strengths */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="font-semibold">Your Strengths</h3>
                </div>
                <div className="space-y-2">
                  {eligibilityResult.breakdown.strengths.slice(0, 4).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{skill.skill}</span>
                      <span className={`font-medium ${getScoreColor(skill.level)}`}>{skill.level}%</span>
                    </div>
                  ))}
                  {eligibilityResult.breakdown.strengths.length === 0 && (
                    <p className="text-sm text-muted-foreground">No strong matches yet</p>
                  )}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-semibold">Areas to Improve</h3>
                </div>
                <div className="space-y-2">
                  {eligibilityResult.breakdown.weaknesses.slice(0, 4).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{skill.skill}</span>
                      <span className={`font-medium ${getScoreColor(skill.level)}`}>{skill.level}%</span>
                    </div>
                  ))}
                  {eligibilityResult.breakdown.weaknesses.length === 0 && (
                    <p className="text-sm text-muted-foreground">No weak areas!</p>
                  )}
                </div>
              </div>

              {/* Missing */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-5 h-5" />
                  <h3 className="font-semibold">Missing Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {eligibilityResult.breakdown.missing.slice(0, 5).map((skill, index) => (
                    <span key={index} className="skill-tag-missing text-xs">
                      {skill.skill}
                    </span>
                  ))}
                  {eligibilityResult.breakdown.missing.length === 0 && (
                    <p className="text-sm text-muted-foreground">No missing skills!</p>
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            {(eligibilityResult.decision === 'IMPROVE' || eligibilityResult.decision === 'NOT_READY') && (
              <div className="glass-card p-6 text-center space-y-4">
                <h3 className="font-semibold text-lg">Want to bridge the gap?</h3>
                <p className="text-muted-foreground">
                  Get a personalized improvement roadmap with actionable steps and resources.
                </p>
                <Link 
                  to="/skill-gap"
                  state={{
                    studentId: selectedStudent.id,
                    jdSkills: [...(analyzedJD?.skills.mandatory || []), ...(analyzedJD?.skills.optional || [])],
                    roleType: analyzedJD?.roleType
                  }}
                >
                  <Button className="btn-primary">
                    View Improvement Roadmap
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
