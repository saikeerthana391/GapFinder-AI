'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { Quiz, QuizQuestionClient, QuizAttemptResult, Topic } from '@/types';

type Step = 'setup' | 'quiz' | 'results';

export default function QuizPage() {
  const { user } = useAuth();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>('setup');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState(params.get('topicId') || '');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'mixed'>('mixed');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/topics', { headers: { 'X-User-Id': user.id } })
      .then((r) => r.json())
      .then((d) => setTopics(d.topics || []));
  }, [user]);

  const generateQuiz = async () => {
    if (!user) return;
    setGenerating(true);
    setGenError('');
    try {
      const r = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'X-User-Id': user.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topicId || undefined, difficulty, count }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to generate quiz');
      setQuiz(d.quiz);
      setAnswers({});
      setCurrentQ(0);
      setStep('quiz');
    } catch (e: any) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const submitQuiz = async () => {
    if (!quiz || !user) return;
    setSubmitting(true);
    try {
      const submittedAnswers = (quiz.questions || []).map((q) => ({
        questionId: q.id,
        answerText: answers[q.id] || '',
      }));
      const r = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'X-User-Id': user.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz.id, answers: submittedAnswers }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Submission failed');
      setResult(d.result);
      setStep('results');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const questions: QuizQuestionClient[] = quiz?.questions || [];

  if (step === 'setup') {
    return (
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnostic Quiz</h1>
          <p className="text-sm text-slate-500 mt-1">Generate a grounded quiz from your uploaded materials.</p>
        </div>
        <Card title="Quiz Setup">
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Mixed Diagnostic (all topics)</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mixed">Mixed</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Number of Questions ({count})</label>
              <input
                type="range" min="3" max="10" value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>3</span><span>10</span></div>
            </div>
            {genError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{genError}</div>}
            <Button onClick={generateQuiz} loading={generating} variant="primary" size="lg">
              Generate Quiz
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (step === 'quiz' && quiz) {
    const q = questions[currentQ];
    const answered = Object.keys(answers).length;
    return (
      <div className="space-y-5 max-w-2xl">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-slate-900">{quiz.title}</h1>
            <Badge variant="info">{answered}/{questions.length} answered</Badge>
          </div>
          <ProgressBar percentage={Math.round((currentQ / questions.length) * 100)} size="sm" showLabel={false} />
          <p className="text-xs text-slate-400 mt-1">Question {currentQ + 1} of {questions.length}</p>
        </div>

        {/* Question navigator */}
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold border-2 transition-colors ${
                i === currentQ ? 'bg-blue-600 text-white border-blue-600' :
                answers[questions[i].id] ? 'bg-green-100 text-green-700 border-green-300' :
                'bg-white text-slate-500 border-slate-300 hover:border-blue-400'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Current question */}
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-2">
              <Badge variant="info">{q.difficulty}</Badge>
              <Badge variant="default">{q.questionType === 'multiple_choice' ? 'MCQ' : 'Short Answer'}</Badge>
            </div>
            <p className="text-base font-medium text-slate-900">{q.questionText}</p>

            {q.questionType === 'multiple_choice' && q.options && (
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-colors ${
                      answers[q.id] === opt
                        ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.questionType === 'short_answer' && (
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                rows={4}
                placeholder="Type your answer here..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            )}

            {q.sourceCitation && (
              <div className="text-xs text-slate-400 border-t pt-3">
                📄 Source: {q.sourceCitation.fileName}
                {q.sourceCitation.pageNumber ? ` · Page ${q.sourceCitation.pageNumber}` : ''}
                {q.sourceCitation.sectionHeading ? ` · ${q.sourceCitation.sectionHeading}` : ''}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button onClick={() => setCurrentQ((c) => Math.max(0, c - 1))} disabled={currentQ === 0} variant="secondary">← Previous</Button>
          {currentQ < questions.length - 1 ? (
            <Button onClick={() => setCurrentQ((c) => c + 1)} variant="primary">Next →</Button>
          ) : (
            <Button
              onClick={submitQuiz}
              loading={submitting}
              variant="primary"
              className="bg-green-600 border-green-600 hover:bg-green-700"
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'results' && result) {
    const pct = result.percentage;
    return (
      <div className="space-y-5 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quiz Results</h1>
          <p className="text-sm text-slate-500 mt-1">Completed {new Date(result.completedAt).toLocaleString()}</p>
        </div>

        {/* Score */}
        <div className={`rounded-xl p-6 border-2 text-center ${pct >= 80 ? 'bg-green-50 border-green-300' : pct >= 50 ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300'}`}>
          <p className="text-4xl font-bold text-slate-900">{pct}%</p>
          <p className="text-slate-600 mt-1">{result.totalScore} / {result.maxScore} marks</p>
          <Badge variant={pct >= 80 ? 'strong' : pct >= 50 ? 'medium' : 'weak'} className="mt-2">
            {pct >= 80 ? '🌟 Strong' : pct >= 50 ? '⚡ Developing' : '⚠️ Needs Review'}
          </Badge>
        </div>

        {/* Mastery updates */}
        {result.topicMasteryUpdates.length > 0 && (
          <Card title="Topic Mastery Updated">
            <CardBody className="space-y-2">
              {result.topicMasteryUpdates.map((u) => (
                <div key={u.topicId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-800">{u.topicTitle}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.status}>{u.newScore}%</Badge>
                    <Badge variant={u.status}>{u.status}</Badge>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        {/* Per-question results */}
        <Card title="Question-by-Question Breakdown">
          <CardBody className="space-y-4">
            {result.answers.map((a, i) => (
              <div key={a.questionId} className={`p-4 rounded-lg border ${a.status === 'correct' ? 'bg-green-50 border-green-200' : a.status === 'partially_correct' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-800">Q{i + 1}</span>
                  <Badge variant={a.status === 'correct' ? 'strong' : a.status === 'partially_correct' ? 'medium' : 'weak'}>
                    {a.marksEarned}/{a.maxMarks} pts · {a.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mb-1"><strong>Your answer:</strong> {a.studentAnswer || '(no answer)'}</p>
                <p className="text-xs text-slate-600 mb-1"><strong>Expected:</strong> {a.expectedAnswer}</p>
                <p className="text-xs text-slate-500 italic">{a.explanation}</p>
                {a.sourceCitation && (
                  <p className="text-xs text-slate-400 mt-1">📄 {a.sourceCitation.fileName}{a.sourceCitation.pageNumber ? ` · p${a.sourceCitation.pageNumber}` : ''}</p>
                )}
              </div>
            ))}
          </CardBody>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button href="/report" variant="primary">📊 View Gap Report</Button>
          <Button href="/planner" variant="secondary">📅 Update Revision Plan</Button>
          <Button onClick={() => { setStep('setup'); setResult(null); setQuiz(null); }} variant="ghost">Take Another Quiz</Button>
        </div>
      </div>
    );
  }

  return <LoadingSpinner message="Loading quiz..." className="py-20" />;
}
