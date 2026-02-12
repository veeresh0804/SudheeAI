import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  text = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} rounded-full border-4 border-muted animate-pulse-ring`} />
        
        {/* Spinning gradient ring */}
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-4 border-transparent border-t-primary border-r-secondary animate-spin`}
          style={{ animationDuration: '1s' }}
        />
        
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-sm" />
      </div>
      
      {text && (
        <p className="text-muted-foreground text-sm animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
