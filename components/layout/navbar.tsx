'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { clsx } from 'clsx';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/materials', label: 'Materials' },
  { href: '/topics', label: 'Topics' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/report', label: 'Gap Report' },
  { href: '/planner', label: 'Planner' },
  { href: '/explain', label: 'Explain' },
  { href: '/progress', label: 'Progress' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-sm">GapFinder AI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User area */}
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:block text-xs text-slate-500 truncate max-w-32">{user.email}</span>
            )}
            <button
              onClick={logout}
              className="text-xs text-slate-600 hover:text-red-600 font-medium hidden sm:block transition-colors"
            >
              Logout
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={clsx(
                'block px-3 py-2 rounded-md text-sm font-medium',
                pathname.startsWith(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs text-slate-400 px-3 mb-1">{user?.email}</span>
            <button onClick={logout} className="block px-3 py-2 text-sm text-red-600 font-medium">Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
}
