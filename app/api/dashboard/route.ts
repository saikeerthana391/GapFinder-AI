import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;
    const metrics = DataStore.getDashboardMetrics(userId);
    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve dashboard metrics.' }, { status: 500 });
  }
}
