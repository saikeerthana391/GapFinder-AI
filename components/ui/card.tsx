import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Card({ title, description, className, children }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {(title || description) && (
        <div className="px-5 py-4 border-b border-slate-100">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('px-5 py-4 border-b border-slate-100', className)}>{children}</div>;
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('px-5 py-4', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl', className)}>{children}</div>;
}
