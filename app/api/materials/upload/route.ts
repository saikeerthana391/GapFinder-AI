import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';
import { DocumentProcessor } from '@/lib/document-processor';
import { RagService } from '@/lib/rag-service';
import { Material, MaterialType } from '@/types';

export const maxDuration = 60; // Allow sufficient time for document chunking & embeddings

export async function POST(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || (file ? file.name : 'Untitled Material');
    const fileType = (formData.get('fileType') as MaterialType) || 'notes';

    if (!file) {
      return NextResponse.json({ error: 'No file provided in upload request.' }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum 10MB limit.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extract text
    const { text, pageCount } = await DocumentProcessor.extractText(buffer, file.name);

    // 2. Create Material record
    const materialId = `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const material: Material = {
      id: materialId,
      userId,
      title,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      status: 'ready',
      chunkCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 3. Chunk text with preserved headings and page indicators
    const rawChunks = DocumentProcessor.chunkText(text, materialId, {
      chunkSize: 600,
      overlap: 100
    });

    material.chunkCount = rawChunks.length;
    DataStore.addMaterial(material);

    // 4. Generate embeddings and save chunks
    for (const ch of rawChunks) {
      const chunkId = `chunk-${materialId}-${ch.chunkIndex}`;
      DataStore.addChunk({
        id: chunkId,
        materialId,
        userId,
        content: ch.content,
        chunkIndex: ch.chunkIndex,
        pageNumber: ch.pageNumber,
        sectionHeading: ch.sectionHeading,
        tokenCount: ch.tokenCount,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, material });
  } catch (error: any) {
    console.error('Material upload processing error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during file extraction and vector processing.' },
      { status: 500 }
    );
  }
}
