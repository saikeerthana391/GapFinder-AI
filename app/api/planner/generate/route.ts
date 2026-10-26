import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';
import { RevisionPlanner } from '@/lib/revision-planner';

export async function POST(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;

    const topics = DataStore.getTopics(userId);
    const masteries = DataStore.getMasteries(userId);
    const existingPlan = DataStore.getRevisionPlan(userId);

    const plan = RevisionPlanner.generatePlan({
      userId,
      topics,
      masteries,
      existingTasks: existingPlan?.tasks
    });

    DataStore.setRevisionPlan(plan);
    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate revision plan.' }, { status: 500 });
  }
}
