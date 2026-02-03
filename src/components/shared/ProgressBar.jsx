import React from 'react';

export function ProgressBar({ value, max = 100, color = 'primary', showLabel = false, size = 'md' }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const colors = { primary: 'bg-accent-primary', secondary: 'bg-accent-secondary', success: 'bg-accent-success', warning: 'bg-accent-warning', danger: 'bg-accent-danger' };
  const sizes = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className="w-full">
      <div className={`w-full bg-dark-600 rounded-full ${sizes[size]} overflow-hidden`}>
        <div className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
      {showLabel && <div className="flex justify-between mt-1 text-sm text-gray-400"><span>{value}</span><span>{max}</span></div>}
    </div>
  );
}

export function CircularProgress({ value, max = 100, size = 80, strokeWidth = 8, color = 'primary' }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const colors = { primary: '#6366f1', secondary: '#22d3ee', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#252532" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors[color]} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-white">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

export default ProgressBar;
