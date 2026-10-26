import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-sm',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border-transparent',
  outline: 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-6 py-3 text-base font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  href,
  className,
  children,
}: ButtonProps) {
  const base = clsx(
    'inline-flex items-center justify-center gap-2 rounded-lg border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
    variantClasses[variant],
    sizeClasses[size],
    (disabled || loading) && 'opacity-60 cursor-not-allowed pointer-events-none',
    className
  );

  const content = (
    <>
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </>
  );

  if (href) {
    return <Link href={href} className={base}>{content}</Link>;
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={base}>
      {content}
    </button>
  );
}
