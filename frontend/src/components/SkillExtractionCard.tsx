import React from 'react';
import { AnalyzedJD } from '@/types';
import { Briefcase, CheckCircle2, Circle, Sparkles } from 'lucide-react';

interface SkillExtractionCardProps {
  analyzedJD: AnalyzedJD;
}

const SkillExtractionCard: React.FC<SkillExtractionCardProps> = ({ analyzedJD }) => {
  return (
    <div className="glass-card p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">JD Analysis Complete</h3>
            <p className="text-sm text-muted-foreground">
              {analyzedJD.totalSkills} skills extracted
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/20 border border-secondary/30">
          <Briefcase className="w-4 h-4 text-secondary" />
          <span className="font-medium text-secondary">{analyzedJD.roleType}</span>
        </div>
      </div>

      {/* Experience */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Circle className="w-3 h-3 fill-muted-foreground" />
        <span>Experience: {analyzedJD.experienceRequired}</span>
      </div>

      {/* Mandatory Skills */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Required Skills ({analyzedJD.skills.mandatory.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {analyzedJD.skills.mandatory.map((skill, index) => (
            <span
              key={index}
              className="skill-tag-mandatory animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Optional Skills */}
      {analyzedJD.skills.optional.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm text-muted-foreground">
              Nice to Have ({analyzedJD.skills.optional.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analyzedJD.skills.optional.map((skill, index) => (
              <span
                key={index}
                className="skill-tag-optional animate-scale-in"
                style={{ animationDelay: `${(analyzedJD.skills.mandatory.length + index) * 50}ms` }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillExtractionCard;
