import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';
import { RevisionPlanner } from '@/lib/revision-planner';

export async function GET(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;

    let plan = DataStore.getRevisionPlan(userId);
    if (!plan) {
      const topics = DataStore.getTopics(userId);
      const masteries = DataStore.getMasteries(userId);
      plan = RevisionPlanner.generatePlan({
        userId,
        topics,
        masteries
      });
      DataStore.setRevisionPlan(plan);
    }

    return NextResponse.json({ plan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve revision plan.' }, { status: 500 });
  }
}
