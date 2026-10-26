'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'student@gapfinder.edu',
  fullName: 'Alex Chen (Demo Student)',
};

const STORAGE_KEY = 'gapfinder_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, _password: string): Promise<{ error?: string }> => {
    if (!email || !email.includes('@')) {
      return { error: 'Please enter a valid email address.' };
    }
    const sessionUser: AuthUser = {
      id: DEMO_USER.id,
      email,
      fullName: email.includes('demo') ? DEMO_USER.fullName : email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    // Seed demo data via API
    try {
      await fetch('/api/seed', { method: 'POST', headers: { 'X-User-Id': sessionUser.id } });
    } catch {
      // non-fatal
    }
    return {};
  };

  const register = async (email: string, _password: string, fullName: string): Promise<{ error?: string }> => {
    if (!email || !email.includes('@')) return { error: 'Please enter a valid email address.' };
    if (!fullName || fullName.trim().length < 2) return { error: 'Please enter your full name.' };
    const sessionUser: AuthUser = { id: DEMO_USER.id, email, fullName };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    try {
      await fetch('/api/seed', { method: 'POST', headers: { 'X-User-Id': sessionUser.id } });
    } catch {
      // non-fatal
    }
    return {};
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
