'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import type { RevisionPlan, RevisionTask } from '@/types';

export default function PlannerPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<RevisionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchPlan = () => {
    if (!user) return;
    fetch('/api/planner', { headers: { 'X-User-Id': user.id } })
      .then((r) => r.json())
      .then((d) => setPlan(d.plan || null))
      .finally(() => setLoading(false));
  };

  useEffect(fetchPlan, [user]);

  const generatePlan = async () => {
    if (!user) return;
    setGenerating(true);
    setError('');
    try {
      const r = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'X-User-Id': user.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setPlan(d.plan);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!user) return;
    const r = await fetch(`/api/planner/task/${taskId}`, {
      method: 'PATCH',
      headers: { 'X-User-Id': user.id },
    });
    const d = await r.json();
    if (d.task && plan) {
      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) => t.id === taskId ? d.task : t),
        };
      });
    }
  };

  if (loading) return <LoadingSpinner message="Loading revision plan..." className="py-20" />;

  // Group tasks by day
  const byDay: Record<number, RevisionTask[]> = {};
  if (plan) {
    for (const task of plan.tasks) {
      if (!byDay[task.dayNumber]) byDay[task.dayNumber] = [];
      byDay[task.dayNumber].push(task);
    }
  }

  const completed = plan?.tasks.filter((t) => t.isCompleted).length || 0;
  const total = plan?.tasks.length || 0;

  const activityEmoji: Record<string, string> = {
    concept_review: '📖',
    practice_problems: '✏️',
    deep_dive: '🔍',
    self_quiz: '🧪',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revision Planner</h1>
          <p className="text-sm text-slate-500 mt-1">Adaptive day-by-day schedule prioritized by your knowledge gaps.</p>
        </div>
        <Button onClick={generatePlan} loading={generating} variant="primary">
          🔄 {plan ? 'Regenerate Plan' : 'Generate Plan'}
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {plan?.warningNotice && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-sm text-amber-800">
          ⚠️ {plan.warningNotice}
        </div>
      )}

      {!plan ? (
        <EmptyState
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          title="No revision plan yet"
          description="Generate a plan based on your current knowledge gap analysis. It adapts automatically after each quiz."
          action={{ label: 'Generate Revision Plan', onClick: generatePlan }}
        />
      ) : (
        <>
          {/* Progress summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Progress</p>
              <p className="text-2xl font-bold text-slate-900">{completed}/{total} tasks</p>
            </div>
            <div className="flex-1 min-w-32">
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{total > 0 ? Math.round((completed / total) * 100) : 0}% complete</p>
            </div>
            {plan.examDate && (
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Exam Date</p>
                <p className="text-sm font-bold text-slate-900">{new Date(plan.examDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Day-by-day tasks */}
          <div className="space-y-4">
            {Object.entries(byDay).sort(([a], [b]) => Number(a) - Number(b)).map(([day, tasks]) => (
              <div key={day}>
                <h2 className="text-sm font-semibold text-slate-500 mb-2">
                  Day {day} — {tasks[0].scheduledDate}
                </h2>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`bg-white border rounded-xl p-4 shadow-sm flex items-start gap-3 transition-opacity ${task.isCompleted ? 'opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-base">{activityEmoji[task.learningActivity]}</span>
                          <span className={`text-sm font-medium ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.topicTitle}
                          </span>
                          <Badge variant={task.priority === 'high' ? 'weak' : task.priority === 'medium' ? 'medium' : 'info'}>
                            {task.priority} priority
                          </Badge>
                          <Badge variant="default">{task.durationMinutes} min</Badge>
                        </div>
                        <p className="text-xs text-slate-500">{task.activityTitle}</p>
                        <p className="text-xs text-slate-400 mt-1 italic">{task.rationale}</p>
                      </div>
                      {task.followUpQuizTopicId && (
                        <Button href={`/quiz?topicId=${task.followUpQuizTopicId}`} variant="ghost" size="sm" className="shrink-0">
                          Quiz
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
