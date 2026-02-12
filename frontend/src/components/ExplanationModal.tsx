import React from 'react';
import { ExplanationData, Candidate } from '@/types';
import { X, CheckCircle2, XCircle, MessageSquare, Code2, Github, Linkedin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import FeatureContributionChart from './FeatureContributionChart';
import PlatformScoreCard from './PlatformScoreCard';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: ExplanationData | null;
  candidate: Candidate | null;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({
  isOpen,
  onClose,
  explanation,
  candidate
}) => {
  if (!explanation || !candidate) return null;

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent Match', color: 'text-success' };
    if (score >= 60) return { label: 'Good Match', color: 'text-primary' };
    if (score >= 40) return { label: 'Moderate Match', color: 'text-warning' };
    return { label: 'Needs Improvement', color: 'text-destructive' };
  };

  const scoreInfo = getScoreLabel(explanation.overallScore);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              Why <span className="gradient-text">{explanation.candidateName}</span> Ranked #{explanation.rank}
            </DialogTitle>
          </div>
          
          {/* Overall Score */}
          <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/30">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeDasharray={`${explanation.overallScore}, 100`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--secondary))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{explanation.overallScore}%</span>
              </div>
            </div>
            <div>
              <p className={`font-semibold text-lg ${scoreInfo.color}`}>{scoreInfo.label}</p>
              <p className="text-sm text-muted-foreground">Overall suitability score</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Feature Contribution */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
              Score Breakdown
            </h3>
            <div className="glass-card p-4">
              <FeatureContributionChart
                contributions={explanation.featureContributions}
                totalScore={explanation.overallScore}
              />
            </div>
          </div>

          {/* Skill Match */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched Skills */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-success">
                <CheckCircle2 className="w-4 h-4" />
                Matched Skills ({explanation.matchedSkills.length})
              </h3>
              <div className="glass-card p-4">
                <div className="flex flex-wrap gap-2">
                  {explanation.matchedSkills.map((skill, index) => (
                    <span key={index} className="skill-tag-matched">
                      {skill}
                    </span>
                  ))}
                  {explanation.matchedSkills.length === 0 && (
                    <p className="text-sm text-muted-foreground">No skills matched</p>
                  )}
                </div>
              </div>
            </div>

            {/* Missing Skills */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-destructive">
                <XCircle className="w-4 h-4" />
                Missing Skills ({explanation.missingSkills.length})
              </h3>
              <div className="glass-card p-4">
                <div className="flex flex-wrap gap-2">
                  {explanation.missingSkills.map((skill, index) => (
                    <span key={index} className="skill-tag-missing">
                      {skill}
                    </span>
                  ))}
                  {explanation.missingSkills.length === 0 && (
                    <p className="text-sm text-muted-foreground">All skills covered!</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Platform Details */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
              Platform Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PlatformScoreCard
                platform="leetcode"
                score={explanation.featureContributions.leetcode.score}
                details={{
                  primary: `${candidate.leetcode.problemsSolved} problems solved`,
                  secondary: `Rating: ${candidate.leetcode.contestRating}`,
                  tertiary: candidate.leetcode.topics.slice(0, 3).join(', ')
                }}
              />
              <PlatformScoreCard
                platform="github"
                score={explanation.featureContributions.github.score}
                details={{
                  primary: `${candidate.github.relevantRepos.length} relevant repos`,
                  secondary: `${candidate.github.totalCommitsLastMonth} commits/month`,
                  tertiary: candidate.github.languages.slice(0, 3).join(', ')
                }}
              />
              <PlatformScoreCard
                platform="linkedin"
                score={explanation.featureContributions.linkedin.score}
                details={{
                  primary: `${candidate.linkedin.skills.length} skills listed`,
                  secondary: `${candidate.linkedin.internships.length} internships`,
                  tertiary: `${candidate.linkedin.certifications.length} certifications`
                }}
              />
            </div>
          </div>

          {/* Natural Language Explanation */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              AI Summary
            </h3>
            <div className="glass-card p-4 border-l-4 border-primary">
              <p className="text-sm leading-relaxed">{explanation.naturalLanguageExplanation}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExplanationModal;
