import React from 'react';
import { Progress } from './ui/progress';

interface ConfidenceIndicatorProps {
  confidence: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  label = 'Confidence',
  size = 'md',
  showPercentage = true,
  className = ''
}) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-green-600';
    if (conf >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (conf: number) => {
    if (conf >= 80) return 'bg-green-500';
    if (conf >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceIcon = (conf: number) => {
    if (conf >= 90) return '🔥';
    if (conf >= 80) return '💚';
    if (conf >= 70) return '✅';
    if (conf >= 60) return '⚠️';
    return '🔻';
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const progressHeight = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">{label}</span>
          <span className="text-xs">{getConfidenceIcon(confidence)}</span>
        </div>
        {showPercentage && (
          <span className={`font-medium ${getConfidenceColor(confidence)}`}>
            {confidence}%
          </span>
        )}
      </div>
      <div className="relative">
        <Progress 
          value={confidence} 
          className={`${progressHeight[size]} bg-gray-200`}
        />
        <div 
          className={`absolute top-0 left-0 ${progressHeight[size]} rounded-full transition-all duration-300 ${getProgressColor(confidence)}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
};

export default ConfidenceIndicator;