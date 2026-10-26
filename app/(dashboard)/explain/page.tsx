'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Topic, TopicExplanationMessage } from '@/types';

export default function ExplainPage() {
  const { user } = useAuth();
  const params = useSearchParams();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState(params.get('topicId') || '');
  const [messages, setMessages] = useState<TopicExplanationMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/topics', { headers: { 'X-User-Id': user.id } })
      .then((r) => r.json())
      .then((d) => { setTopics(d.topics || []); setHistoryLoading(false); });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!question.trim() || !user) return;
    const userMsg: TopicExplanationMessage = {
      id: `msg-${Date.now()}-user`,
      userId: user.id,
      topicId: topicId || undefined,
      role: 'user',
      content: question,
      citations: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const q = question;
    setQuestion('');
    setAsking(true);

    try {
      const r = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'X-User-Id': user.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, topicId: topicId || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setMessages((prev) => [...prev, d.message]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          userId: user.id,
          topicId: topicId || undefined,
          role: 'assistant',
          content: `Error: ${e.message}`,
          citations: [],
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl flex flex-col h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Explain This Topic</h1>
          <p className="text-sm text-slate-500 mt-1">Ask questions grounded in your uploaded study materials. Citations are shown for every answer.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any topic</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <Button onClick={() => setMessages([])} variant="ghost" size="sm">Clear</Button>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
        {historyLoading ? (
          <LoadingSpinner message="Loading..." className="py-10" />
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm font-medium text-slate-700">Ask anything about your study materials</p>
            <p className="text-xs text-slate-400 mt-1">Answers are grounded in your uploaded documents with citations.</p>
          </div>
        ) : null}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl rounded-xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 border-t border-slate-200 pt-2 space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Sources cited:</p>
                  {msg.citations.map((c, i) => (
                    <div key={i} className="text-xs text-slate-500 bg-white rounded px-2 py-1 border border-slate-200">
                      📄 <strong>{c.fileName}</strong>
                      {c.pageNumber ? ` · p${c.pageNumber}` : ''}
                      {c.sectionHeading ? ` · ${c.sectionHeading}` : ''}
                      {c.excerpt && <div className="mt-1 text-slate-400 italic truncate">&quot;{c.excerpt}&quot;</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {asking && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-xl px-4 py-3">
              <LoadingSpinner size="sm" message="Searching materials and generating answer..." />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask a question about your study materials... (Enter to send)"
          rows={2}
          className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <Button onClick={sendMessage} loading={asking} disabled={!question.trim()} variant="primary" size="md">
          Send
        </Button>
      </div>
    </div>
  );
}
