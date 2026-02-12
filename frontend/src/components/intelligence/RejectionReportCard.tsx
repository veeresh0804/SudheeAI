import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Target, ArrowRight } from 'lucide-react';

interface RejectionReportProps {
  report: {
    reason: string;
    skill_gaps: string[];
    roadmap: any[];
    timeline_weeks?: number;
    target_score?: number;
  };
}

const RejectionReportCard: React.FC<RejectionReportProps> = ({ report }) => {
  return (
    <Card className="glass-card border-orange-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-orange-500" />
          Improvement Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Feedback</p>
          <p className="text-sm text-muted-foreground">{report.reason}</p>
        </div>

        {report.skill_gaps?.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Skills to Develop</p>
            <div className="flex flex-wrap gap-1">
              {report.skill_gaps.map((gap, i) => (
                <Badge key={i} variant="outline" className="text-xs border-orange-500/30 text-orange-600">
                  {gap}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {report.timeline_weeks && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Estimated timeline: <strong>{report.timeline_weeks} weeks</strong></span>
          </div>
        )}

        {report.target_score && (
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span>Target score: <strong>{Math.round(report.target_score)}%</strong></span>
          </div>
        )}

        {report.roadmap?.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Learning Roadmap</p>
            <div className="space-y-2">
              {report.roadmap.slice(0, 5).map((step: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="w-3 h-3 mt-1 text-primary shrink-0" />
                  <span className="text-muted-foreground">{step.task || step.description || JSON.stringify(step)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RejectionReportCard;
