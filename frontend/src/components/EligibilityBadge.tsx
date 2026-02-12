import React from 'react';
import { EligibilityDecision } from '@/types';
import { Check, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EligibilityBadgeProps {
  decision: EligibilityDecision;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EligibilityBadge: React.FC<EligibilityBadgeProps> = ({ decision, size = 'md', className }) => {
  const config = {
    APPLY: {
      label: 'Ready to Apply',
      icon: Check,
      badgeClassName: 'bg-success/20 text-success border-success/30',
      iconClassName: 'text-success'
    },
    IMPROVE: {
      label: 'Needs Improvement',
      icon: AlertTriangle,
      badgeClassName: 'bg-warning/20 text-warning border-warning/30',
      iconClassName: 'text-warning'
    },
    NOT_READY: {
      label: 'Not Ready Yet',
      icon: X,
      badgeClassName: 'bg-destructive/20 text-destructive border-destructive/30',
      iconClassName: 'text-destructive'
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-3'
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24
  };

  const { label, icon: Icon, badgeClassName, iconClassName } = config[decision];

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        badgeClassName,
        sizeClasses[size],
        className
      )}
    >
      <Icon size={iconSizes[size]} className={iconClassName} />
      <span>{label}</span>
    </div>
  );
};

export default EligibilityBadge;
