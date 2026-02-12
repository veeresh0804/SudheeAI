import React from 'react';
import { SkillGap } from '@/types';
import { AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface SkillGapChartProps {
  gaps: SkillGap[];
}

const SkillGapChart: React.FC<SkillGapChartProps> = ({ gaps }) => {
  const getPriorityConfig = (priority: SkillGap['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          icon: AlertTriangle,
          label: 'Critical',
          barColor: 'bg-destructive',
          gapColor: 'bg-destructive/30',
          textColor: 'text-destructive',
          badgeClass: 'badge-destructive'
        };
      case 'IMPORTANT':
        return {
          icon: AlertCircle,
          label: 'Important',
          barColor: 'bg-warning',
          gapColor: 'bg-warning/30',
          textColor: 'text-warning',
          badgeClass: 'badge-warning'
        };
      case 'POLISH':
        return {
          icon: Sparkles,
          label: 'Polish',
          barColor: 'bg-success',
          gapColor: 'bg-success/30',
          textColor: 'text-success',
          badgeClass: 'badge-success'
        };
    }
  };

  if (gaps.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="w-12 h-12 mx-auto text-success mb-4" />
        <h3 className="font-semibold text-lg">No Skill Gaps!</h3>
        <p className="text-muted-foreground">You meet all the required skill levels.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {gaps.map((gap, index) => {
        const config = getPriorityConfig(gap.priority);
        const Icon = config.icon;
        
        return (
          <div 
            key={gap.skill}
            className="glass-card p-4 space-y-3 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.textColor}`} />
                <span className="font-semibold">{gap.skill}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={config.badgeClass}>{config.label}</span>
                <span className="text-sm text-muted-foreground">~{gap.estimatedTime}</span>
              </div>
            </div>
            
            {/* Bar */}
            <div className="relative h-6 bg-muted/30 rounded-lg overflow-hidden">
              {/* Required level marker */}
              <div 
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-foreground/50 z-10"
                style={{ left: `${gap.requiredLevel}%` }}
              />
              
              {/* Current level */}
              <div 
                className={`absolute inset-y-0 left-0 ${config.barColor} rounded-l-lg transition-all duration-700`}
                style={{ width: `${gap.currentLevel}%` }}
              />
              
              {/* Gap area */}
              <div 
                className={`absolute inset-y-0 ${config.gapColor}`}
                style={{ 
                  left: `${gap.currentLevel}%`, 
                  width: `${gap.gap}%` 
                }}
              />
            </div>
            
            {/* Labels */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Current: <span className={config.textColor}>{gap.currentLevel}%</span></span>
              <span>Gap: <span className="text-foreground font-medium">{gap.gap}%</span></span>
              <span>Required: {gap.requiredLevel}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SkillGapChart;
