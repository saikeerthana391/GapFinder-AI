import { NextRequest, NextResponse } from 'next/server';
import { DataStore, DEMO_USER_ID } from '@/lib/data-store';
import { ScoringEngine } from '@/lib/scoring-engine';
import { AiService } from '@/lib/ai-service';
import { EvaluatedAnswerResult, QuizAttemptResult, StudentAnswerSubmission } from '@/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await DataStore.seedDemoDataIfEmpty();
    const userId = req.headers.get('x-user-id') || DEMO_USER_ID;

    const body = await req.json();
    const { quizId, answers } = body as {
      quizId: string;
      answers: StudentAnswerSubmission[];
    };

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid quiz submission payload.' }, { status: 400 });
    }

    // Retrieve server questions with secret answer keys
    const serverQuestions = DataStore.getServerQuestionsForQuiz(quizId);
    if (!serverQuestions || serverQuestions.length === 0) {
      return NextResponse.json({ error: 'Quiz not found or expired.' }, { status: 404 });
    }

    const questionMap = new Map(serverQuestions.map(q => [q.id, q]));
    const evaluatedAnswers: EvaluatedAnswerResult[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Per-topic groupings for mastery recalculation
    const topicAnswersMap = new Map<string, { topicTitle: string; answers: EvaluatedAnswerResult[] }>();

    for (const sub of answers) {
      const q = questionMap.get(sub.questionId);
      if (!q) continue;

      maxScore += q.points;
      const studentAnswer = (sub.answerText || '').trim();

      let evalResult: EvaluatedAnswerResult;

      if (q.questionType === 'multiple_choice') {
        const mcResult = ScoringEngine.evaluateMultipleChoice(studentAnswer, q.correctAnswer, q.points);
        totalScore += mcResult.marksEarned;

        evalResult = {
          questionId: q.id,
          studentAnswer,
          status: mcResult.status,
          marksEarned: mcResult.marksEarned,
          maxMarks: q.points,
          expectedAnswer: q.correctAnswer,
          explanation: q.explanation || mcResult.explanation,
          mistakesIdentified: mcResult.status === 'incorrect' ? ['Selected incorrect alternative'] : [],
          conceptsToRevise: mcResult.status === 'incorrect' ? [q.topicTitle || 'Core concept'] : [],
          sourceCitation: q.sourceCitation
        };
      } else {
        // Short answer semantic evaluation
        const saResult = await AiService.evaluateShortAnswer({
          questionText: q.questionText,
          expectedAnswer: q.correctAnswer,
          studentAnswer,
          maxPoints: q.points,
          sourceCitation: q.sourceCitation
        });

        totalScore += saResult.marksEarned;

        evalResult = {
          questionId: q.id,
          studentAnswer,
          status: saResult.status,
          marksEarned: saResult.marksEarned,
          maxMarks: q.points,
          expectedAnswer: q.correctAnswer,
          explanation: saResult.feedback || q.explanation,
          mistakesIdentified: saResult.mistakesIdentified,
          conceptsToRevise: saResult.conceptsToRevise,
          sourceCitation: q.sourceCitation
        };
      }

      evaluatedAnswers.push(evalResult);

      // Group by topic
      const tId = q.topicId;
      const tTitle = q.topicTitle || 'Course Topic';
      if (!topicAnswersMap.has(tId)) {
        topicAnswersMap.set(tId, { topicTitle: tTitle, answers: [] });
      }
      topicAnswersMap.get(tId)!.answers.push(evalResult);
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Recalculate and persist Topic Mastery
    const masteryUpdates: QuizAttemptResult['topicMasteryUpdates'] = [];

    for (const [tId, grp] of Array.from(topicAnswersMap.entries())) {
      const existingMasteries = DataStore.getMasteries(userId);
      const existing = existingMasteries.find(m => m.topicId === tId);

      const existingStats = existing
        ? {
            questionsAttempted: existing.questionsAttempted,
            correctAnswers: existing.correctAnswers,
            incorrectAnswers: existing.incorrectAnswers,
            totalPointsEarned: Math.round((existing.masteryPercentage / 100) * (existing.questionsAttempted * 10)),
            maxPointsPossible: existing.questionsAttempted * 10,
            repeatedMistakes: existing.repeatedMistakes
          }
        : null;

      const calc = ScoringEngine.calculateTopicMastery(existingStats, {
        topicId: tId,
        topicTitle: grp.topicTitle,
        answers: grp.answers
      });

      DataStore.setTopicMastery({
        id: existing?.id || `mastery-${tId}`,
        userId,
        topicId: tId,
        topicTitle: grp.topicTitle,
        masteryPercentage: calc.masteryPercentage,
        status: calc.status,
        questionsAttempted: calc.questionsAttempted,
        correctAnswers: calc.correctAnswers,
        incorrectAnswers: calc.incorrectAnswers,
        repeatedMistakes: calc.repeatedMistakes,
        explanation: calc.explanation,
        lastAttemptAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      masteryUpdates.push({
        topicId: tId,
        topicTitle: grp.topicTitle,
        previousScore: existing?.masteryPercentage,
        newScore: calc.masteryPercentage,
        status: calc.status,
        explanation: calc.explanation
      });
    }

    const attemptResult: QuizAttemptResult = {
      attemptId,
      quizId,
      totalScore,
      maxScore,
      percentage,
      completedAt: new Date().toISOString(),
      answers: evaluatedAnswers,
      topicMasteryUpdates: masteryUpdates
    };

    DataStore.addAttempt(attemptResult);

    return NextResponse.json({ success: true, result: attemptResult });
  } catch (error: any) {
    console.error('Quiz submission error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit and evaluate quiz.' }, { status: 500 });
  }
}
