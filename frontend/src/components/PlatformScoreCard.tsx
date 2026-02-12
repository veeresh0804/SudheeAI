import React from 'react';
import { Code2, Github, Linkedin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PlatformScoreCardProps {
  platform: 'leetcode' | 'github' | 'linkedin';
  score: number;
  details?: {
    primary: string;
    secondary?: string;
    tertiary?: string;
  };
  compact?: boolean;
}

const PlatformScoreCard: React.FC<PlatformScoreCardProps> = ({
  platform,
  score,
  details,
  compact = false
}) => {
  const config = {
    leetcode: {
      name: 'LeetCode',
      icon: Code2,
      color: 'text-leetcode',
      bgColor: 'bg-leetcode/10',
      progressColor: 'bg-leetcode'
    },
    github: {
      name: 'GitHub',
      icon: Github,
      color: 'text-foreground',
      bgColor: 'bg-foreground/10',
      progressColor: 'bg-foreground'
    },
    linkedin: {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-linkedin',
      bgColor: 'bg-linkedin/10',
      progressColor: 'bg-linkedin'
    }
  };

  const { name, icon: Icon, color, bgColor, progressColor } = config[platform];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${bgColor}`}>
          <Icon size={14} className={color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{name}</span>
            <span className={`text-sm font-semibold ${color}`}>{score}</span>
          </div>
          <Progress value={score} className="h-1 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon size={20} className={color} />
          </div>
          <span className="font-semibold">{name}</span>
        </div>
        <div className={`text-2xl font-bold ${color}`}>{score}</div>
      </div>

      <Progress value={score} className="h-2" />

      {details && (
        <div className="space-y-1 text-sm">
          <p className="text-foreground">{details.primary}</p>
          {details.secondary && (
            <p className="text-muted-foreground">{details.secondary}</p>
          )}
          {details.tertiary && (
            <p className="text-muted-foreground text-xs">{details.tertiary}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformScoreCard;
