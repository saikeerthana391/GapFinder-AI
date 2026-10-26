import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;

    // Profile from memory/supabase
    const profile = {
      id: userId,
      email: 'student@gapfinder.edu',
      fullName: 'Alex Chen (Demo Student)',
      targetExamDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
      dailyStudyMinutes: 60,
      preferredStudyDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    };

    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve profile.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;

    const body = await req.json();
    const { fullName, examDate, dailyStudyMinutes, preferredStudyDays } = body;

    const updatedProfile = {
      id: userId,
      email: 'student@gapfinder.edu',
      fullName: fullName || 'Alex Chen',
      targetExamDate: examDate,
      dailyStudyMinutes: Number(dailyStudyMinutes) || 60,
      preferredStudyDays: Array.isArray(preferredStudyDays) ? preferredStudyDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings.' }, { status: 500 });
  }
}
