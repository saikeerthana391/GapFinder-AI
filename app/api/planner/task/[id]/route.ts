import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;
    const taskId = params.id;

    const updatedTask = DataStore.toggleTaskCompletion(taskId, userId);
    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found or unauthorized.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update revision task.' }, { status: 500 });
  }
}
