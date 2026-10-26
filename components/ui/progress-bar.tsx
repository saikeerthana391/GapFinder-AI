import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({ percentage, showLabel = true, size = 'md', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const color = clamped >= 80 ? 'bg-green-500' : clamped >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('w-full bg-slate-200 rounded-full overflow-hidden', heights[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-slate-600 mt-1 text-right font-medium">{clamped}%</div>
      )}
    </div>
  );
}
