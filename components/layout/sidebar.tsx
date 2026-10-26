'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬜' },
  { href: '/materials', label: 'Materials', icon: '📄' },
  { href: '/topics', label: 'Topics', icon: '🗂️' },
  { href: '/quiz', label: 'Quiz', icon: '✏️' },
  { href: '/report', label: 'Gap Report', icon: '📊' },
  { href: '/planner', label: 'Planner', icon: '📅' },
  { href: '/explain', label: 'Explain', icon: '💬' },
  { href: '/progress', label: 'Progress', icon: '📈' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-52 min-h-screen border-r border-slate-200 bg-slate-50 py-4 shrink-0">
      <nav className="space-y-0.5 px-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
