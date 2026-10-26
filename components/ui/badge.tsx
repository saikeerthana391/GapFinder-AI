import React from 'react';
import { clsx } from 'clsx';
import type { MasteryLevel } from '@/types';

type BadgeVariant = MasteryLevel | 'info' | 'default' | 'processing' | 'error' | 'ready';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  weak: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  strong: 'bg-green-100 text-green-700 border-green-200',
  untested: 'bg-slate-100 text-slate-600 border-slate-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  ready: 'bg-green-100 text-green-700 border-green-200',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
