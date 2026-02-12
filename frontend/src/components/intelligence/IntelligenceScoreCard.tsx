import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Shield, TrendingUp, Code2, Target } from 'lucide-react';

interface IntelligenceScoreCardProps {
  scores: {
    skill_match_score?: number;
    project_score?: number;
    growth_score?: number;
    trust_score?: number;
    dna_score?: number;
    overall_reasoning_score?: number;
    composite_score?: number;
    eligible?: boolean;
    explanation?: string;
  };
  showTrust?: boolean;
  showDna?: boolean;
}

const ScoreRow = ({ label, value, icon: Icon, color }: { label: string; value?: number; icon: any; color: string }) => {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{Math.round(value)}%</span>
        </div>
        <Progress value={value} className="h-2" />
      </div>
    </div>
  );
};

const IntelligenceScoreCard: React.FC<IntelligenceScoreCardProps> = ({ scores, showTrust, showDna }) => {
  const compositeScore = scores.composite_score ?? scores.overall_reasoning_score ?? 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Intelligence Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold mb-1 ${compositeScore >= 80 ? 'text-green-500' : compositeScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
            {Math.round(compositeScore)}
          </div>
          <p className="text-sm text-muted-foreground">Composite Score</p>
          {scores.eligible !== undefined && (
            <Badge variant={scores.eligible ? 'default' : 'destructive'} className="mt-2">
              {scores.eligible ? 'Eligible' : 'Not Eligible'}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <ScoreRow label="Skill Match" value={scores.skill_match_score} icon={Target} color="text-blue-500" />
          <ScoreRow label="Projects" value={scores.project_score} icon={Code2} color="text-purple-500" />
          <ScoreRow label="Growth" value={scores.growth_score} icon={TrendingUp} color="text-green-500" />
          {showTrust && <ScoreRow label="Trust" value={scores.trust_score} icon={Shield} color="text-orange-500" />}
          {showDna && <ScoreRow label="Coding DNA" value={scores.dna_score} icon={Brain} color="text-indigo-500" />}
        </div>

        {scores.explanation && (
          <p className="text-sm text-muted-foreground border-t pt-3 mt-3">
            {scores.explanation}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default IntelligenceScoreCard;
