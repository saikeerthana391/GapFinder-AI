import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';

export async function POST(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    return NextResponse.json({ success: true, message: 'Demo data seeded successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to seed data.' }, { status: 500 });
  }
}
