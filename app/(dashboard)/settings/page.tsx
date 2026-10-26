'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [examDate, setExamDate] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [studyDays, setStudyDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch('/api/settings', { headers: { 'X-User-Id': user.id } })
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setFullName(d.profile.fullName || user.fullName);
          setExamDate(d.profile.targetExamDate || '');
          setDailyMinutes(d.profile.dailyStudyMinutes || 60);
          setStudyDays(d.profile.preferredStudyDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
        }
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'X-User-Id': user.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, examDate: examDate || null, dailyStudyMinutes: dailyMinutes, preferredStudyDays: studyDays }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleDay = (day: string) => {
    setStudyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences and study schedule.</p>
      </div>

      <Card title="Profile & Study Preferences">
        <CardBody>
          <form onSubmit={handleSave} className="space-y-4">
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email (read-only)</label>
              <input value={user?.email || ''} readOnly className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Daily Study Time: {dailyMinutes} minutes</label>
              <input type="range" min="15" max="240" step="15" value={dailyMinutes} onChange={(e) => setDailyMinutes(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>15 min</span><span>4 hrs</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Study Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors ${
                      studyDays.includes(day)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">✅ Settings saved successfully!</div>}
            <Button type="submit" loading={saving} variant="primary">Save Settings</Button>
          </form>
        </CardBody>
      </Card>

      <Card title="Demo Account Info">
        <CardBody>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Running in Demo Mode</p>
            <p>Data is stored in server memory and resets on restart. To use persistent storage, configure Supabase credentials in <code className="bg-blue-100 px-1 rounded">.env.local</code>.</p>
            <p className="mt-2">Your current session: <strong>{user?.email}</strong></p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
