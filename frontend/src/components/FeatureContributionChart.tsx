import React from 'react';
import { Code2, Github, Linkedin } from 'lucide-react';

interface FeatureContribution {
  score: number;
  contribution: number;
  reason: string;
}

interface FeatureContributionChartProps {
  contributions: {
    leetcode: FeatureContribution;
    github: FeatureContribution;
    linkedin: FeatureContribution;
  };
  totalScore: number;
}

const FeatureContributionChart: React.FC<FeatureContributionChartProps> = ({
  contributions,
  totalScore
}) => {
  const platforms = [
    {
      key: 'leetcode',
      name: 'LeetCode',
      icon: Code2,
      color: 'bg-leetcode',
      textColor: 'text-leetcode',
      data: contributions.leetcode
    },
    {
      key: 'github',
      name: 'GitHub',
      icon: Github,
      color: 'bg-foreground',
      textColor: 'text-foreground',
      data: contributions.github
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-linkedin',
      textColor: 'text-linkedin',
      data: contributions.linkedin
    }
  ];

  const maxContribution = Math.max(
    contributions.leetcode.contribution,
    contributions.github.contribution,
    contributions.linkedin.contribution
  );

  return (
    <div className="space-y-6">
      {/* Horizontal Bar Chart */}
      <div className="space-y-4">
        {platforms.map((platform, index) => {
          const widthPercentage = (platform.data.contribution / Math.max(maxContribution, 1)) * 100;
          
          return (
            <div 
              key={platform.key} 
              className="space-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <platform.icon className={`w-4 h-4 ${platform.textColor}`} />
                  <span className="font-medium text-sm">{platform.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Score: <span className={`font-semibold ${platform.textColor}`}>{platform.data.score}</span>
                  </span>
                  <span className="font-bold">
                    +{platform.data.contribution.toFixed(1)} pts
                  </span>
                </div>
              </div>
              
              {/* Bar */}
              <div className="relative h-8 bg-muted/30 rounded-lg overflow-hidden">
                <div 
                  className={`absolute inset-y-0 left-0 ${platform.color} rounded-lg transition-all duration-700 ease-out`}
                  style={{ width: `${widthPercentage}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-medium text-white drop-shadow-sm">
                    {platform.data.contribution.toFixed(1)} points contribution
                  </span>
                </div>
              </div>
              
              {/* Reason */}
              <p className="text-xs text-muted-foreground pl-6">
                {platform.data.reason}
              </p>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total Score</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold gradient-text">{totalScore}%</span>
            <span className="text-sm text-muted-foreground">match</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureContributionChart;
