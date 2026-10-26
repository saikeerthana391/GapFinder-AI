'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import type { TopicMastery } from '@/types';

export default function ReportPage() {
  const { user } = useAuth();
  const [masteries, setMasteries] = useState<TopicMastery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/report', { headers: { 'X-User-Id': user.id } })
      .then((r) => r.json())
      .then((d) => setMasteries(d.masteries || []))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner message="Loading gap report..." className="py-20" />;

  const assessed = masteries.filter((m) => m.status !== 'untested');
  const weak = masteries.filter((m) => m.status === 'weak');
  const medium = masteries.filter((m) => m.status === 'medium');
  const strong = masteries.filter((m) => m.status === 'strong');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Knowledge Gap Report</h1>
        <p className="text-sm text-slate-500 mt-1">Diagnostic analysis based on your quiz performance. Mastery thresholds: Weak &lt;50%, Medium 50–79%, Strong ≥80%.</p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
          <p className="text-xl font-bold text-red-700">{weak.length}</p>
          <p className="text-xs text-red-600">Weak Topics</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-center">
          <p className="text-xl font-bold text-amber-700">{medium.length}</p>
          <p className="text-xs text-amber-600">Medium Topics</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
          <p className="text-xl font-bold text-green-700">{strong.length}</p>
          <p className="text-xs text-green-600">Strong Topics</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-center">
          <p className="text-xl font-bold text-slate-600">{masteries.length - assessed.length}</p>
          <p className="text-xs text-slate-500">Untested</p>
        </div>
      </div>

      {masteries.length === 0 ? (
        <EmptyState
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          title="No diagnostic data yet"
          description="Complete at least one quiz to generate your knowledge gap report."
          action={{ label: 'Start Diagnostic Quiz', href: '/quiz' }}
        />
      ) : (
        <>
          {/* Weak topics first, then medium, then strong */}
          {['weak', 'medium', 'strong', 'untested'].map((status) => {
            const group = masteries.filter((m) => m.status === status);
            if (group.length === 0) return null;
            const titles: Record<string, string> = {
              weak: '⚠️ Weak Topics — Priority Review Needed',
              medium: '⚡ Developing Topics',
              strong: '✅ Strong Topics',
              untested: '❓ Not Yet Assessed',
            };
            return (
              <div key={status}>
                <h2 className="text-sm font-semibold text-slate-600 mb-3">{titles[status]}</h2>
                <div className="space-y-3">
                  {group.map((m) => (
                    <Card key={m.id}>
                      <CardBody className="space-y-3">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">{m.topicTitle}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {m.questionsAttempted} question{m.questionsAttempted !== 1 ? 's' : ''} attempted ·
                              {m.correctAnswers} correct · {m.incorrectAnswers} incorrect
                            </p>
                          </div>
                          <Badge variant={status as any}>
                            {status === 'untested' ? 'Not assessed' : `${m.masteryPercentage}% ${status}`}
                          </Badge>
                        </div>

                        {status !== 'untested' && (
                          <ProgressBar percentage={m.masteryPercentage} size="md" />
                        )}

                        <p className="text-sm text-slate-600 italic">
                          {m.questionsAttempted < 2 ? '⚠️ Not enough evidence — take more questions to get a reliable assessment.' : m.explanation}
                        </p>

                        {m.repeatedMistakes && m.repeatedMistakes.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">Repeated Mistakes:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {m.repeatedMistakes.map((mk, i) => (
                                <li key={i} className="text-xs text-red-700">{mk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button href={`/quiz?topicId=${m.topicId}`} variant="outline" size="sm">Retake Quiz</Button>
                          <Button href={`/explain?topicId=${m.topicId}`} variant="ghost" size="sm">Explain Topic</Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
