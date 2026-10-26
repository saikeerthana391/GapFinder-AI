import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';
import { RagService } from '@/lib/rag-service';
import { AiService } from '@/lib/ai-service';
import { TopicExplanationMessage } from '@/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;

    const body = await req.json();
    const { question, topicId } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question text is required.' }, { status: 400 });
    }

    const topics = DataStore.getTopics(userId);
    const matchedTopic = topicId ? topics.find(t => t.id === topicId) : undefined;

    // Retrieve relevant chunks filtered strictly by user authorized materials
    const userChunks = DataStore.getChunksByUserId(userId);
    const searchQuery = matchedTopic ? `${matchedTopic.title} ${question}` : question;

    const retrievedChunks = await RagService.retrieveRelevantChunks(userId, searchQuery, {
      topK: 4,
      localChunks: userChunks
    });

    // Explain with Gemini RAG pipeline
    const result = await AiService.explainTopic({
      question,
      topicTitle: matchedTopic?.title,
      retrievedChunks
    });

    const assistantMsg: TopicExplanationMessage = {
      id: `msg-${Date.now()}-assistant`,
      userId,
      topicId: matchedTopic?.id,
      role: 'assistant',
      content: result.answer,
      citations: result.citations,
      createdAt: new Date().toISOString()
    };

    DataStore.addChatMessage(assistantMsg);

    return NextResponse.json({ success: true, message: assistantMsg });
  } catch (error: any) {
    console.error('Explain topic API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to explain topic.' }, { status: 500 });
  }
}
