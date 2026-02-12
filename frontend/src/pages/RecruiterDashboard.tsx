import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Sparkles, CheckSquare, Square, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import JDInputForm from '@/components/JDInputForm';
import SkillExtractionCard from '@/components/SkillExtractionCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { analyzeJobDescription } from '@/services/nlpProcessor';
import { AnalyzedJD } from '@/types';
import { mockCandidates } from '@/data/mockCandidates';
import { mockJobDescriptions } from '@/data/mockJobDescriptions';

const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedJD, setAnalyzedJD] = useState<AnalyzedJD | null>(null);
  const [jdText, setJdText] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [rankAll, setRankAll] = useState(true);

  const handleAnalyzeJD = async (text: string) => {
    setIsAnalyzing(true);
    setJdText(text);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = analyzeJobDescription(text);
    setAnalyzedJD(result);
    setIsAnalyzing(false);
    setStep(2);
  };

  const handleUseSampleJD = (jd: typeof mockJobDescriptions[0]) => {
    handleAnalyzeJD(jd.description);
  };

  const toggleCandidate = (id: number) => {
    setSelectedCandidates(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
    setRankAll(false);
  };

  const handleRankCandidates = () => {
    const candidateIds = rankAll ? [] : selectedCandidates;
    const allSkills = [...(analyzedJD?.skills.mandatory || []), ...(analyzedJD?.skills.optional || [])];
    
    navigate('/ranking-results', {
      state: {
        jdSkills: allSkills,
        roleType: analyzedJD?.roleType,
        candidateIds,
        jdText
      }
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Candidate Ranking</span> System
          </h1>
          <p className="text-muted-foreground text-lg">
            Evidence-based hiring in 3 simple steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { num: 1, label: 'Analyze JD' },
            { num: 2, label: 'Review Skills' },
            { num: 3, label: 'Rank Candidates' }
          ].map((s, index) => (
            <React.Fragment key={s.num}>
              <div className={`
                flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                ${step >= s.num 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold
                  ${step >= s.num 
                    ? 'bg-primary text-white' 
                    : 'bg-muted-foreground/30 text-muted-foreground'
                  }
                `}>
                  {s.num}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
              </div>
              {index < 2 && (
                <div className={`w-12 h-0.5 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: JD Input */}
        <div className={`space-y-6 ${step !== 1 && analyzedJD ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Step 1: Paste Job Description</h2>
              <p className="text-sm text-muted-foreground">Or select a sample JD below</p>
            </div>
          </div>

          {/* Sample JDs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {mockJobDescriptions.map((jd) => (
              <Button
                key={jd.id}
                variant="outline"
                size="sm"
                onClick={() => handleUseSampleJD(jd)}
                disabled={isAnalyzing}
                className="text-xs"
              >
                {jd.title}
              </Button>
            ))}
          </div>

          <JDInputForm onAnalyze={handleAnalyzeJD} isLoading={isAnalyzing} />
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="mt-8">
            <LoadingSpinner text="Analyzing job description with AI..." />
          </div>
        )}

        {/* Step 2: Skill Extraction */}
        {analyzedJD && !isAnalyzing && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Step 2: Extracted Skills</h2>
                <p className="text-sm text-muted-foreground">Review the skills detected from the JD</p>
              </div>
            </div>

            <SkillExtractionCard analyzedJD={analyzedJD} />

            {/* Step 3: Candidate Selection */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Step 3: Select Candidates</h2>
                  <p className="text-sm text-muted-foreground">Choose candidates to rank or rank all</p>
                </div>
              </div>

              {/* Rank All Toggle */}
              <div 
                className="glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => {
                  setRankAll(!rankAll);
                  if (!rankAll) setSelectedCandidates([]);
                }}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={rankAll} />
                  <span className="font-medium">Rank All Candidates</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {mockCandidates.length} candidates available
                </span>
              </div>

              {/* Individual Candidate Selection */}
              {!rankAll && (
                <div className="glass-card p-4 space-y-2 max-h-64 overflow-y-auto scrollbar-thin animate-fade-in">
                  {mockCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => toggleCandidate(candidate.id)}
                    >
                      <Checkbox checked={selectedCandidates.includes(candidate.id)} />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">
                        {candidate.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground">
                          LC: {candidate.leetcode.problemsSolved} • GH: {candidate.github.relevantRepos.length} repos
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={handleRankCandidates}
                disabled={!rankAll && selectedCandidates.length === 0}
                className="btn-primary w-full py-6 text-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Rank {rankAll ? 'All' : selectedCandidates.length} Candidate{(rankAll || selectedCandidates.length > 1) ? 's' : ''}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
