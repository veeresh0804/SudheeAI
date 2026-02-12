import React from 'react';
import { RankedCandidate } from '@/types';
import { Trophy, Medal, Award, Eye, TrendingUp, Code2, Github, Linkedin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface CandidateCardProps {
  candidate: RankedCandidate;
  showAnonymized?: boolean;
  onViewExplanation?: () => void;
  isHighlighted?: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  showAnonymized = false,
  onViewExplanation,
  isHighlighted = false
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default:
        return 'bg-muted border-border';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div 
      className={`
        glass-card-hover p-5 space-y-4
        ${isHighlighted ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Rank Badge */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg border ${getRankBadgeClass(candidate.rank)}`}>
            {getRankIcon(candidate.rank)}
          </div>
          
          {/* Name & Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
              {(showAnonymized ? candidate.anonymizedName : candidate.name).charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold">
                {showAnonymized ? candidate.anonymizedName : candidate.name}
              </h3>
              <p className="text-xs text-muted-foreground">{candidate.summary}</p>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(candidate.overallScore)}`}>
            {candidate.overallScore}%
          </div>
          <p className="text-xs text-muted-foreground">match</p>
        </div>
      </div>

      {/* Score Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Fit</span>
          <span>{candidate.overallScore}%</span>
        </div>
        <Progress value={candidate.overallScore} className="h-2" />
      </div>

      {/* Platform Scores */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Code2 className="w-4 h-4 text-leetcode" />
          <div className="text-sm">
            <span className="font-semibold">{candidate.platformScores.leetcode}</span>
            <span className="text-xs text-muted-foreground ml-1">LC</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Github className="w-4 h-4" />
          <div className="text-sm">
            <span className="font-semibold">{candidate.platformScores.github}</span>
            <span className="text-xs text-muted-foreground ml-1">GH</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Linkedin className="w-4 h-4 text-linkedin" />
          <div className="text-sm">
            <span className="font-semibold">{candidate.platformScores.linkedin}</span>
            <span className="text-xs text-muted-foreground ml-1">LI</span>
          </div>
        </div>
      </div>

      {/* Skills Preview */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {candidate.matchedSkills.slice(0, 4).map((skill, index) => (
            <span key={index} className="skill-tag-matched text-xs py-0.5">
              {skill}
            </span>
          ))}
          {candidate.matchedSkills.length > 4 && (
            <span className="skill-tag-muted text-xs py-0.5">
              +{candidate.matchedSkills.length - 4}
            </span>
          )}
        </div>
        {candidate.missingSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.missingSkills.slice(0, 2).map((skill, index) => (
              <span key={index} className="skill-tag-missing text-xs py-0.5">
                {skill}
              </span>
            ))}
            {candidate.missingSkills.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{candidate.missingSkills.length - 2} gaps
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      {onViewExplanation && (
        <Button
          variant="outline"
          size="sm"
          onClick={onViewExplanation}
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Explanation
        </Button>
      )}
    </div>
  );
};

export default CandidateCard;
