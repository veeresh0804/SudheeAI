import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dna, Layers, Building2, Sparkles } from 'lucide-react';

interface CodingDnaCardProps {
  analysis: {
    abstraction_score?: number;
    architecture_score?: number;
    maturity_score?: number;
    patterns_detected?: string[];
    summary?: string;
  };
}

const CodingDnaCard: React.FC<CodingDnaCardProps> = ({ analysis }) => {
  const avg = Math.round(
    ((analysis.abstraction_score || 0) + (analysis.architecture_score || 0) + (analysis.maturity_score || 0)) / 3
  );

  return (
    <Card className="glass-card border-indigo-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Dna className="w-5 h-5 text-indigo-500" />
          Coding DNA
          <Badge variant="secondary" className="ml-auto">{avg}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Abstraction</span>
              <span>{analysis.abstraction_score || 0}%</span>
            </div>
            <Progress value={analysis.abstraction_score || 0} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> Architecture</span>
              <span>{analysis.architecture_score || 0}%</span>
            </div>
            <Progress value={analysis.architecture_score || 0} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Maturity</span>
              <span>{analysis.maturity_score || 0}%</span>
            </div>
            <Progress value={analysis.maturity_score || 0} className="h-2" />
          </div>
        </div>

        {analysis.patterns_detected?.length ? (
          <div>
            <p className="text-sm font-medium mb-2">Patterns Detected</p>
            <div className="flex flex-wrap gap-1">
              {analysis.patterns_detected.map((p, i) => (
                <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
              ))}
            </div>
          </div>
        ) : null}

        {analysis.summary && (
          <p className="text-sm text-muted-foreground border-t pt-3">{analysis.summary}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CodingDnaCard;
