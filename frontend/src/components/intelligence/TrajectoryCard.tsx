import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, TrendingUp, Calendar } from 'lucide-react';

interface TrajectoryCardProps {
  prediction: {
    projected_role?: string;
    forecast_6_month?: { role_readiness?: number; key_milestones?: string[] };
    forecast_12_month?: { role_readiness?: number; key_milestones?: string[] };
    probability?: number;
  };
}

const TrajectoryCard: React.FC<TrajectoryCardProps> = ({ prediction }) => {
  return (
    <Card className="glass-card border-emerald-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Rocket className="w-5 h-5 text-emerald-500" />
          Career Trajectory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {prediction.projected_role && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Projected Role</p>
            <p className="text-lg font-semibold">{prediction.projected_role}</p>
            {prediction.probability !== undefined && (
              <Badge variant="secondary" className="mt-1">{Math.round(prediction.probability)}% confidence</Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {prediction.forecast_6_month && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1 text-sm font-medium mb-2">
                <Calendar className="w-3 h-3" /> 6 Months
              </div>
              <div className="text-2xl font-bold text-emerald-500">
                {prediction.forecast_6_month.role_readiness || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Role Readiness</p>
              {prediction.forecast_6_month.key_milestones?.slice(0, 2).map((m, i) => (
                <p key={i} className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 shrink-0" /> {m}
                </p>
              ))}
            </div>
          )}

          {prediction.forecast_12_month && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1 text-sm font-medium mb-2">
                <Calendar className="w-3 h-3" /> 12 Months
              </div>
              <div className="text-2xl font-bold text-blue-500">
                {prediction.forecast_12_month.role_readiness || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Role Readiness</p>
              {prediction.forecast_12_month.key_milestones?.slice(0, 2).map((m, i) => (
                <p key={i} className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 shrink-0" /> {m}
                </p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrajectoryCard;
