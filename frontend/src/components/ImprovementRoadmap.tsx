import React from 'react';
import { ImprovementRoadmap as RoadmapType, RoadmapStep } from '@/types';
import { 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Code, 
  Video, 
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface ImprovementRoadmapProps {
  roadmap: RoadmapType;
}

const ImprovementRoadmapComponent: React.FC<ImprovementRoadmapProps> = ({ roadmap }) => {
  const getPriorityConfig = (priority: RoadmapStep['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          textColor: 'text-destructive',
          stepColor: 'bg-destructive'
        };
      case 'IMPORTANT':
        return {
          icon: AlertCircle,
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/30',
          textColor: 'text-warning',
          stepColor: 'bg-warning'
        };
      case 'POLISH':
        return {
          icon: Sparkles,
          bgColor: 'bg-success/10',
          borderColor: 'border-success/30',
          textColor: 'text-success',
          stepColor: 'bg-success'
        };
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return Video;
      case 'practice':
      case 'project':
        return Code;
      case 'book':
      case 'documentation':
      case 'tutorial':
      case 'course':
      default:
        return BookOpen;
    }
  };

  if (roadmap.steps.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-4" />
        <h3 className="font-semibold text-lg">You're All Set!</h3>
        <p className="text-muted-foreground">No improvement roadmap needed - you meet all requirements.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Time Estimate */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Estimated Time to Ready</p>
            <p className="text-sm text-muted-foreground">Based on 2-3 hours daily practice</p>
          </div>
        </div>
        <div className="text-2xl font-bold gradient-text">
          {roadmap.totalEstimatedTime}
        </div>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {roadmap.steps.map((step, index) => {
            const config = getPriorityConfig(step.priority);
            const PriorityIcon = config.icon;
            
            return (
              <div 
                key={step.stepNumber}
                className="relative pl-12 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Step number */}
                <div 
                  className={`absolute left-0 w-10 h-10 rounded-full ${config.stepColor} flex items-center justify-center text-white font-bold shadow-lg`}
                >
                  {step.stepNumber}
                </div>

                <div className={`glass-card p-5 border ${config.borderColor} space-y-4`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <PriorityIcon className={`w-5 h-5 ${config.textColor}`} />
                      <div>
                        <h4 className="font-semibold text-lg">{step.skill}</h4>
                        <span className={`text-sm ${config.textColor}`}>{step.priority}</span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {step.estimatedTime}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Tasks:</p>
                    <ul className="space-y-2">
                      {step.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Resources */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Resources:</p>
                    <div className="flex flex-wrap gap-2">
                      {step.resources.map((resource, resIndex) => {
                        const ResourceIcon = getResourceIcon(resource.type);
                        return (
                          <div
                            key={resIndex}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm hover:bg-muted transition-colors cursor-pointer group"
                          >
                            <ResourceIcon className="w-4 h-4 text-muted-foreground" />
                            <span>{resource.name}</span>
                            {resource.url && (
                              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ImprovementRoadmapComponent;
