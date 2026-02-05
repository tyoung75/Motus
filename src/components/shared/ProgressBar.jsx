import React from 'react';

export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  showLabel = false,
  size = 'md',
  className = '',
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colors = {
    primary: 'bg-accent-primary',
    secondary: 'bg-text-secondary',
    success: 'bg-accent-success',
    warning: 'bg-accent-warning',
    danger: 'bg-accent-danger',
    gold: 'bg-gradient-to-r from-accent-primaryMuted via-accent-primary to-accent-primaryHover',
  };

  const sizes = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-dark-700 rounded-full ${sizes[size]} overflow-hidden`}>
        <div
          className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5 text-sm">
          <span className="text-text-secondary">{value}</span>
          <span className="text-text-muted">{max}</span>
        </div>
      )}
    </div>
  );
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  color = 'primary',
  showValue = true,
  label,
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colors = {
    primary: '#D4A853',  // Gold
    secondary: '#A3A3A3',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
  };

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#262626"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span className="font-display text-xl font-bold text-white tracking-tight">
            {Math.round(percentage)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-text-muted mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
}

// Segmented progress for multi-step flows
export function SegmentedProgress({ current, total, className = '' }) {
  return (
    <div className={`flex gap-1.5 ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`
            flex-1 h-1 rounded-full transition-all duration-300
            ${i < current ? 'bg-accent-primary' : 'bg-dark-600'}
          `}
        />
      ))}
    </div>
  );
}

export default ProgressBar;
