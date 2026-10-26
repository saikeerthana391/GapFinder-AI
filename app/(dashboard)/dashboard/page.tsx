'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { DashboardMetrics, MasteryLevel } from '@/types';

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetch('/api/dashboard', { headers: { 'X-User-Id': user.id } })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || 'Failed to load dashboard');
        return r.json();
      })
      .then(setMetrics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner message="Loading your dashboard..." className="py-20" />;
  if (error) return <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>;
  if (!metrics) return null;

  const masteryStatusLabel: Record<MasteryLevel, string> = {
    weak: 'Weak (needs review)',
    medium: 'Developing',
    strong: 'Strong',
    untested: 'Not assessed',
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.fullName?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s your study health overview.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Materials" value={metrics.totalMaterials} sub="uploaded documents" />
        <StatCard label="Topics" value={metrics.totalTopics} sub="identified from syllabus" />
        <StatCard label="Assessed" value={metrics.topicsWithEvidence} sub="have diagnostic data" />
        <StatCard label="Avg. Mastery" value={`${metrics.averageMastery}%`} sub="across assessed topics" color={metrics.averageMastery >= 80 ? 'text-green-600' : metrics.averageMastery >= 50 ? 'text-amber-600' : 'text-red-600'} />
      </div>

      {/* Mastery breakdown + SVG ring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Topic Mastery Breakdown">
          <CardBody className="space-y-3">
            {[
              { label: 'Weak', count: metrics.weakCount, color: 'bg-red-500', status: 'weak' as MasteryLevel },
              { label: 'Medium', count: metrics.mediumCount, color: 'bg-amber-500', status: 'medium' as MasteryLevel },
              { label: 'Strong', count: metrics.strongCount, color: 'bg-green-500', status: 'strong' as MasteryLevel },
              { label: 'Untested', count: metrics.untestedCount, color: 'bg-slate-300', status: 'untested' as MasteryLevel },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                <span className="text-sm text-slate-700 flex-1">{item.label}</span>
                <span className="text-sm font-bold text-slate-900">{item.count}</span>
                <Badge variant={item.status}>{masteryStatusLabel[item.status]}</Badge>
              </div>
            ))}

            {metrics.topicsWithEvidence === 0 && (
              <p className="text-xs text-slate-400 pt-2">Complete your first quiz to see mastery data.</p>
            )}
          </CardBody>
        </Card>

        {/* Mastery SVG Ring */}
        <Card title="Mastery Distribution">
          <CardBody className="flex items-center justify-center py-4">
            {metrics.topicsWithEvidence === 0 ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <p className="text-sm text-slate-500">Take a quiz to see data here</p>
              </div>
            ) : (
              <MasteryRing weak={metrics.weakCount} medium={metrics.mediumCount} strong={metrics.strongCount} untested={metrics.untestedCount} />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent attempts */}
      <Card title="Recent Quiz Attempts">
        <CardBody>
          {metrics.recentAttempts.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400">No quiz attempts yet. <Link href="/quiz" className="text-blue-600 underline">Start your first quiz</Link>.</div>
          ) : (
            <div className="space-y-2">
              {metrics.recentAttempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700">{a.quizTitle}</span>
                  <div className="flex items-center gap-3">
                    <ProgressBar percentage={a.percentage} size="sm" showLabel={false} className="w-24" />
                    <Badge variant={a.percentage >= 80 ? 'strong' : a.percentage >= 50 ? 'medium' : 'weak'}>{a.percentage}%</Badge>
                    <span className="text-xs text-slate-400">{new Date(a.completedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Revision priorities */}
      {metrics.revisionStats.currentPriorities.length > 0 && (
        <Card title="Current Revision Priorities">
          <CardBody className="space-y-2">
            {metrics.revisionStats.currentPriorities.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Badge variant={p.priority === 'high' ? 'weak' : p.priority === 'medium' ? 'medium' : 'info'}>{p.priority}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.topicTitle}</p>
                  <p className="text-xs text-slate-500">{p.activityTitle} · {p.durationMinutes} min</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button href="/materials" variant="outline" size="md">📄 Upload Materials</Button>
        <Button href="/quiz" variant="primary" size="md">✏️ Start Diagnostic Quiz</Button>
        <Button href="/report" variant="secondary" size="md">📊 View Gap Report</Button>
        <Button href="/planner" variant="secondary" size="md">📅 Revision Plan</Button>
      </div>
    </div>
  );
}

function MasteryRing({ weak, medium, strong, untested }: { weak: number; medium: number; strong: number; untested: number }) {
  const total = weak + medium + strong + untested || 1;
  const pcts = [strong / total, medium / total, weak / total, untested / total];
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'];
  const labels = ['Strong', 'Medium', 'Weak', 'Untested'];
  const counts = [strong, medium, weak, untested];

  const r = 56;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const segments = pcts.map((pct, i) => {
    const dash = pct * circumference;
    const gap = circumference - dash;
    const seg = { dashOffset: -offset, dash, gap, color: colors[i] };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="20" />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="20"
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={seg.dashOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#0f172a">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#64748b">topics</text>
      </svg>
      <div className="space-y-2">
        {labels.map((l, i) => (
          <div key={l} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: colors[i] }} />
            <span className="text-slate-600">{l}</span>
            <span className="font-bold text-slate-800 ml-1">{counts[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
