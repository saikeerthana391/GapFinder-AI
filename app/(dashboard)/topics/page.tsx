'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { Topic } from '@/types';

export default function TopicsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchTopics = () => {
    if (!user) return;
    fetch('/api/topics', { headers: { 'X-User-Id': user.id } })
      .then((r) => r.json())
      .then((d) => setTopics(d.topics || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchTopics, [user]);

  const generateTopics = async () => {
    if (!user) return;
    setGenerating(true);
    setError('');
    try {
      const r = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'X-User-Id': user.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setTopics(d.topics || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  // Group by parent unit
  const grouped: Record<string, Topic[]> = {};
  for (const t of topics) {
    if (!grouped[t.parentUnit]) grouped[t.parentUnit] = [];
    grouped[t.parentUnit].push(t);
  }

  const statusBorder: Record<string, string> = {
    weak: 'border-l-red-500',
    medium: 'border-l-amber-500',
    strong: 'border-l-green-500',
    untested: 'border-l-slate-300',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Topic Map</h1>
          <p className="text-sm text-slate-500 mt-1">Your curriculum organized by unit with mastery status.</p>
        </div>
        <Button onClick={generateTopics} loading={generating} variant="outline" size="md">
          🔄 Refresh Topics
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {loading ? (
        <LoadingSpinner message="Loading topic map..." className="py-16" />
      ) : topics.length === 0 ? (
        <EmptyState
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          title="No topics yet"
          description="Upload a syllabus and click 'Refresh Topics' to extract the topic hierarchy."
          action={{ label: 'Generate Topics from Syllabus', onClick: generateTopics }}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([unit, unitTopics]) => (
            <div key={unit}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{unit}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {unitTopics.map((topic) => {
                  const mastery = topic.mastery;
                  const status = mastery?.status || 'untested';
                  return (
                    <div
                      key={topic.id}
                      className={`bg-white border border-slate-200 border-l-4 ${statusBorder[status]} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-400">{topic.code}</span>
                            <Badge variant={status as any}>
                              {status === 'untested' ? 'Not assessed' : `${mastery?.masteryPercentage}%`}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900">{topic.title}</h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{topic.description}</p>
                        </div>
                      </div>
                      {mastery && mastery.status !== 'untested' && (
                        <div className="mt-3">
                          <ProgressBar percentage={mastery.masteryPercentage} size="sm" />
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <Button
                          href={`/quiz?topicId=${topic.id}`}
                          variant="outline"
                          size="sm"
                        >
                          Quiz This Topic
                        </Button>
                        <Button
                          href={`/explain?topicId=${topic.id}`}
                          variant="ghost"
                          size="sm"
                        >
                          Explain
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
