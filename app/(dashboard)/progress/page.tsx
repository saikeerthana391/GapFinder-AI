'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import type { DashboardMetrics } from '@/types';

export default function ProgressPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/progress', { headers: { 'X-User-Id': user.id } })
      .then((r) => r.json())
      .then((d) => setMetrics(d.metrics || null))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner message="Loading progress..." className="py-20" />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Progress Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Data-driven view of your improvement over time.</p>
      </div>

      {!metrics || metrics.completedQuizzesCount === 0 ? (
        <EmptyState
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          title="No progress data yet"
          description="Complete your first quiz to start tracking your improvement over time."
          action={{ label: 'Start a Quiz', href: '/quiz' }}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-slate-900">{metrics.completedQuizzesCount}</p>
              <p className="text-xs text-slate-500 mt-1">Quizzes Taken</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-green-600">{metrics.strongCount}</p>
              <p className="text-xs text-slate-500 mt-1">Strong Topics</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.weakCount}</p>
              <p className="text-xs text-slate-500 mt-1">Weak Topics</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-blue-600">{metrics.averageMastery}%</p>
              <p className="text-xs text-slate-500 mt-1">Avg. Mastery</p>
            </div>
          </div>

          {/* Quiz history */}
          <Card title="Quiz Score History">
            <CardBody>
              <div className="space-y-2">
                {metrics.recentAttempts.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{a.quizTitle}</p>
                      <ProgressBar percentage={a.percentage} size="sm" showLabel={false} className="mt-1" />
                    </div>
                    <Badge variant={a.percentage >= 80 ? 'strong' : a.percentage >= 50 ? 'medium' : 'weak'}>{a.percentage}%</Badge>
                    <span className="text-xs text-slate-400">{new Date(a.completedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Topic mastery trends */}
          <Card title="Topic Mastery Trends">
            <CardBody>
              <div className="space-y-3">
                {metrics.masteryTrend.sort((a, b) => a.percentage - b.percentage).map((t) => (
                  <div key={t.topicId} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-slate-700 truncate">{t.topicTitle}</span>
                        <Badge variant={t.status}>{t.percentage}%</Badge>
                        <span className="text-xs">
                          {t.trend === 'improved' ? '📈' : t.trend === 'declined' ? '📉' : '➡️'}
                        </span>
                      </div>
                      <ProgressBar percentage={t.percentage} size="sm" showLabel={false} />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Revision completion */}
          <Card title="Revision Task Completion">
            <CardBody>
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{metrics.revisionStats.completedTasks}/{metrics.revisionStats.totalTasks}</p>
                  <p className="text-xs text-slate-500">Tasks completed</p>
                </div>
                <div className="flex-1">
                  <ProgressBar
                    percentage={metrics.revisionStats.totalTasks > 0 ? Math.round((metrics.revisionStats.completedTasks / metrics.revisionStats.totalTasks) * 100) : 0}
                    size="lg"
                  />
                </div>
              </div>
              <p className="text-sm text-slate-600">
                {metrics.revisionStats.pendingTasks} tasks remaining in your current revision plan.
              </p>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
