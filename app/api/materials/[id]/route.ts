import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;
    const materialId = params.id;

    const success = DataStore.deleteMaterial(materialId, userId);
    if (!success) {
      return NextResponse.json({ error: 'Material not found or unauthorized.' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete material.' }, { status: 500 });
  }
}
