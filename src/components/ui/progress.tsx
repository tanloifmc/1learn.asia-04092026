import React from 'react';

export function ProgressBar({ progress, color = 'var(--primary)', trackColor = 'var(--surface-alt)' }: { progress: number, color?: string, trackColor?: string }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: trackColor }}>
      <div 
        className="h-full rounded-full transition-all duration-500 ease-out" 
        style={{ width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: color }}
      ></div>
    </div>
  );
}

export function ProgressRing({ progress, size = 64, strokeWidth = 6, color = 'var(--primary)', trackColor = 'var(--surface-alt)' }: { progress: number, size?: number, strokeWidth?: number, color?: string, trackColor?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track */}
        <circle 
          stroke={trackColor} 
          fill="transparent" 
          strokeWidth={strokeWidth} 
          r={radius} 
          cx={size / 2} 
          cy={size / 2} 
        />
        {/* Fill */}
        <circle 
          stroke={color} 
          fill="transparent" 
          strokeWidth={strokeWidth} 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          r={radius} 
          cx={size / 2} 
          cy={size / 2} 
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary-dark">
        {Math.round(progress)}%
      </div>
    </div>
  );
}
