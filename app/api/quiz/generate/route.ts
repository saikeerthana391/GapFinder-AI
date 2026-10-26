import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';
import { RagService } from '@/lib/rag-service';
import { AiService } from '@/lib/ai-service';
import { Quiz } from '@/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;

    const body = await req.json().catch(() => ({}));
    const topicId = body.topicId || undefined;
    const difficulty = body.difficulty || 'mixed';
    const count = Math.min(10, Math.max(2, body.count || 5));

    // 1. Identify target topic
    const allTopics = DataStore.getTopics(userId);
    let targetTopic = topicId ? allTopics.find(t => t.id === topicId) : undefined;
    const isMixed = !targetTopic;

    // 2. Fetch user's chunks
    const userChunks = DataStore.getChunksByUserId(userId);
    if (!userChunks || userChunks.length === 0) {
      return NextResponse.json(
        { error: 'No study materials available. Please upload course materials first to generate grounded quiz questions.' },
        { status: 400 }
      );
    }

    // 3. RAG Retrieval for the query topic
    const query = targetTopic
      ? `${targetTopic.title} ${targetTopic.description}`
      : 'Python programming fundamentals control flow loops data structures functions';

    const retrieved = await RagService.retrieveRelevantChunks(userId, query, {
      topK: 6,
      localChunks: userChunks
    });

    if (!retrieved || retrieved.length === 0) {
      return NextResponse.json(
        { error: 'Could not find sufficient evidence in uploaded materials to ground quiz questions.' },
        { status: 400 }
      );
    }

    // 4. Grounded Question Generation
    const activeTopicId = targetTopic ? targetTopic.id : allTopics[0]?.id || 'topic-py-101';
    const activeTopicTitle = targetTopic ? targetTopic.title : 'Mixed Python Diagnostics';

    const generatedServerQuestions = await AiService.generateQuizQuestions({
      topicId: activeTopicId,
      topicTitle: activeTopicTitle,
      difficulty,
      count,
      retrievedChunks: retrieved
    });

    // 5. Store quiz and questions securely
    const quizId = `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newQuiz: Quiz = {
      id: quizId,
      userId,
      title: isMixed ? 'Mixed Diagnostic Assessment' : `Quiz: ${activeTopicTitle}`,
      topicId: targetTopic?.id,
      quizType: isMixed ? 'mixed_diagnostic' : 'topic',
      difficulty,
      totalQuestions: generatedServerQuestions.length,
      totalPoints: generatedServerQuestions.reduce((s, q) => s + q.points, 0),
      createdAt: new Date().toISOString()
    };

    // Attach quizId to each question
    const questionsWithQuizId = generatedServerQuestions.map((q, idx) => ({
      ...q,
      id: `q-${quizId}-${idx + 1}`,
      quizId
    }));

    DataStore.addQuiz(newQuiz, questionsWithQuizId);

    // 6. Return client-safe quiz (correct answer NOT exposed!)
    const clientQuiz = DataStore.getQuiz(quizId, userId);

    return NextResponse.json({ success: true, quiz: clientQuiz });
  } catch (error: any) {
    console.error('Quiz generation route error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate quiz.' }, { status: 500 });
  }
}
