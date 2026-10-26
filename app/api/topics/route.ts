import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';
import { INITIAL_TOPICS } from '@/sample-data/sample-curriculum';

export async function GET(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;
    const topics = DataStore.getTopics(userId);
    return NextResponse.json({ topics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve topics.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;

    // Refresh topics using standard curriculum hierarchy
    for (const top of INITIAL_TOPICS) {
      const topicId = `topic-${top.code.toLowerCase()}`;
      DataStore.addTopic({
        id: topicId,
        userId,
        title: top.title,
        code: top.code,
        description: top.description,
        parentUnit: top.parentUnit,
        orderIndex: top.orderIndex,
        sourceMaterialIds: [],
        prerequisites: top.prerequisites,
        createdAt: new Date().toISOString()
      });
    }

    const topics = DataStore.getTopics(userId);
    return NextResponse.json({ success: true, topics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate topics.' }, { status: 500 });
  }
}
