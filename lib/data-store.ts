import {
  Profile,
  Material,
  DocumentChunk,
  Topic,
  TopicMastery,
  Quiz,
  QuizQuestionServer,
  QuizQuestionClient,
  QuizAttemptResult,
  RevisionPlan,
  RevisionTask,
  TopicExplanationMessage,
  DashboardMetrics
} from '@/types';
import { SAMPLE_DOCUMENTS, INITIAL_TOPICS } from '@/sample-data/sample-curriculum';
import { DocumentProcessor } from './document-processor';
import { RagService } from './rag-service';
import { ScoringEngine } from './scoring-engine';

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

interface MemoryDB {
  profiles: Map<string, Profile>;
  materials: Map<string, Material>;
  chunks: Map<string, DocumentChunk>;
  topics: Map<string, Topic>;
  masteries: Map<string, TopicMastery>;
  quizzes: Map<string, Quiz>;
  questions: Map<string, QuizQuestionServer>;
  attempts: Map<string, QuizAttemptResult>;
  plans: Map<string, RevisionPlan>;
  tasks: Map<string, RevisionTask>;
  chatMessages: Map<string, TopicExplanationMessage>;
}

// Global persistence across Next.js dev reloads
declare global {
  var __GAPFINDER_DB__: MemoryDB | undefined;
}

if (!global.__GAPFINDER_DB__) {
  global.__GAPFINDER_DB__ = {
    profiles: new Map(),
    materials: new Map(),
    chunks: new Map(),
    topics: new Map(),
    masteries: new Map(),
    quizzes: new Map(),
    questions: new Map(),
    attempts: new Map(),
    plans: new Map(),
    tasks: new Map(),
    chatMessages: new Map()
  };
}

const db = global.__GAPFINDER_DB__;

export class DataStore {
  /**
   * Seed demo profile & sample data if not already present
   */
  static async seedDemoDataIfEmpty(): Promise<void> {
    if (db.profiles.has(DEMO_USER_ID) && db.materials.size > 0) {
      return;
    }

    // 1. Demo Profile
    const demoProfile: Profile = {
      id: DEMO_USER_ID,
      email: 'student@gapfinder.edu',
      fullName: 'Alex Chen (Demo Student)',
      targetExamDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0], // 14 days out
      dailyStudyMinutes: 60,
      preferredStudyDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.profiles.set(DEMO_USER_ID, demoProfile);

    // 2. Initial Topics
    for (const top of INITIAL_TOPICS) {
      const topicId = `topic-${top.code.toLowerCase()}`;
      db.topics.set(topicId, {
        id: topicId,
        userId: DEMO_USER_ID,
        title: top.title,
        code: top.code,
        description: top.description,
        parentUnit: top.parentUnit,
        orderIndex: top.orderIndex,
        sourceMaterialIds: [],
        prerequisites: top.prerequisites,
        createdAt: new Date().toISOString()
      });

      // Default untested mastery
      db.masteries.set(`${DEMO_USER_ID}-${topicId}`, {
        id: `mastery-${topicId}`,
        userId: DEMO_USER_ID,
        topicId,
        topicTitle: top.title,
        masteryPercentage: 0,
        status: 'untested',
        questionsAttempted: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        repeatedMistakes: [],
        explanation: 'Not enough diagnostic evidence yet. Take a quiz to assess this topic.',
        updatedAt: new Date().toISOString()
      });
    }

    // 3. Process Sample Documents
    for (let i = 0; i < SAMPLE_DOCUMENTS.length; i++) {
      const doc = SAMPLE_DOCUMENTS[i];
      const matId = `mat-sample-${i + 1}`;

      const rawChunks = DocumentProcessor.chunkText(doc.content, matId);
      const chunksCount = rawChunks.length;

      db.materials.set(matId, {
        id: matId,
        userId: DEMO_USER_ID,
        title: doc.title,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: Buffer.byteLength(doc.content, 'utf8'),
        status: 'ready',
        chunkCount: chunksCount,
        createdAt: new Date(Date.now() - (SAMPLE_DOCUMENTS.length - i) * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      });

      for (const ch of rawChunks) {
        const chunkId = `chunk-${matId}-${ch.chunkIndex}`;
        const embedding = await RagService.generateEmbedding(ch.content);
        db.chunks.set(chunkId, {
          id: chunkId,
          materialId: matId,
          userId: DEMO_USER_ID,
          content: ch.content,
          chunkIndex: ch.chunkIndex,
          pageNumber: ch.pageNumber,
          sectionHeading: ch.sectionHeading,
          tokenCount: ch.tokenCount,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 4. Preload realistic initial benchmark data for a couple topics to show immediate dashboard insights
    const varTopicId = 'topic-py-101';
    const loopTopicId = 'topic-py-202';
    const dictTopicId = 'topic-py-402';

    // Topic 1: Variables (Strong)
    db.masteries.set(`${DEMO_USER_ID}-${varTopicId}`, {
      id: `mastery-${varTopicId}`,
      userId: DEMO_USER_ID,
      topicId: varTopicId,
      topicTitle: 'Variables and Data Types',
      masteryPercentage: 90,
      status: 'strong',
      questionsAttempted: 5,
      correctAnswers: 4,
      incorrectAnswers: 1,
      repeatedMistakes: ['Slight confusion on string immutability semantics'],
      explanation: 'Strong mastery demonstrated (90% accuracy across 5 questions). Demonstrates solid understanding of primitives and type conversion.',
      lastAttemptAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    });

    // Topic 2: Loops (Medium)
    db.masteries.set(`${DEMO_USER_ID}-${loopTopicId}`, {
      id: `mastery-${loopTopicId}`,
      userId: DEMO_USER_ID,
      topicId: loopTopicId,
      topicTitle: 'Loops and Iteration',
      masteryPercentage: 65,
      status: 'medium',
      questionsAttempted: 4,
      correctAnswers: 2,
      incorrectAnswers: 2,
      repeatedMistakes: ['Loop-else execution on break vs normal completion', 'Off-by-one errors in range(start, stop)'],
      explanation: 'Moderate proficiency (65% accuracy). Needs targeted review of break-else clause triggers and boundary indexing.',
      lastAttemptAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    });

    // Topic 3: Dictionaries (Weak)
    db.masteries.set(`${DEMO_USER_ID}-${dictTopicId}`, {
      id: `mastery-${dictTopicId}`,
      userId: DEMO_USER_ID,
      topicId: dictTopicId,
      topicTitle: 'Dictionaries and Sets',
      masteryPercentage: 40,
      status: 'weak',
      questionsAttempted: 5,
      correctAnswers: 2,
      incorrectAnswers: 3,
      repeatedMistakes: ['Using mutable list objects as dictionary keys', 'KeyError on direct subscription d[k]'],
      explanation: 'Identified critical knowledge gaps (40% accuracy). Consistently struggles with key hashability constraints and KeyError safety.',
      lastAttemptAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    });
  }

  // Materials
  static getMaterials(userId: string): Material[] {
    return Array.from(db.materials.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getMaterialById(id: string, userId: string): Material | undefined {
    const mat = db.materials.get(id);
    return mat && mat.userId === userId ? mat : undefined;
  }

  static addMaterial(material: Material): void {
    db.materials.set(material.id, material);
  }

  static deleteMaterial(id: string, userId: string): boolean {
    const mat = db.materials.get(id);
    if (!mat || mat.userId !== userId) return false;

    db.materials.delete(id);
    // Delete associated chunks
    for (const [chunkId, chunk] of db.chunks.entries()) {
      if (chunk.materialId === id) {
        db.chunks.delete(chunkId);
      }
    }
    return true;
  }

  // Chunks
  static addChunk(chunk: DocumentChunk): void {
    db.chunks.set(chunk.id, chunk);
  }

  static getChunksByUserId(userId: string): DocumentChunk[] {
    return Array.from(db.chunks.values()).filter(c => c.userId === userId);
  }

  // Topics
  static getTopics(userId: string): Topic[] {
    const topics = Array.from(db.topics.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return topics.map(t => {
      const mastery = db.masteries.get(`${userId}-${t.id}`);
      return {
        ...t,
        mastery
      };
    });
  }

  static getTopicById(id: string, userId: string): Topic | undefined {
    const top = db.topics.get(id);
    if (!top || top.userId !== userId) return undefined;
    const mastery = db.masteries.get(`${userId}-${id}`);
    return { ...top, mastery };
  }

  static addTopic(topic: Topic): void {
    db.topics.set(topic.id, topic);
  }

  // Mastery
  static getMasteries(userId: string): TopicMastery[] {
    return Array.from(db.masteries.values()).filter(m => m.userId === userId);
  }

  static setTopicMastery(mastery: TopicMastery): void {
    db.masteries.set(`${mastery.userId}-${mastery.topicId}`, mastery);
  }

  // Quizzes & Questions
  static addQuiz(quiz: Quiz, questions: QuizQuestionServer[]): void {
    db.quizzes.set(quiz.id, quiz);
    for (const q of questions) {
      db.questions.set(q.id, q);
    }
  }

  static getQuiz(quizId: string, userId: string): Quiz | undefined {
    const quiz = db.quizzes.get(quizId);
    if (!quiz || quiz.userId !== userId) return undefined;

    // Return client-safe questions without revealing correct answer!
    const questions: QuizQuestionClient[] = Array.from(db.questions.values())
      .filter(q => q.quizId === quizId)
      .map(q => ({
        id: q.id,
        quizId: q.quizId,
        topicId: q.topicId,
        topicTitle: q.topicTitle,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        points: q.points,
        difficulty: q.difficulty,
        sourceCitation: q.sourceCitation
      }));

    return {
      ...quiz,
      questions
    };
  }

  static getServerQuestionsForQuiz(quizId: string): QuizQuestionServer[] {
    return Array.from(db.questions.values()).filter(q => q.quizId === quizId);
  }

  // Attempts
  static addAttempt(attempt: QuizAttemptResult): void {
    db.attempts.set(attempt.attemptId, attempt);
  }

  static getAttempts(userId: string): QuizAttemptResult[] {
    return Array.from(db.attempts.values()).sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }

  // Revision Plan & Tasks
  static getRevisionPlan(userId: string): RevisionPlan | undefined {
    return db.plans.get(`plan-${userId}`);
  }

  static setRevisionPlan(plan: RevisionPlan): void {
    db.plans.set(plan.id, plan);
    for (const t of plan.tasks) {
      db.tasks.set(t.id, t);
    }
  }

  static toggleTaskCompletion(taskId: string, userId: string): RevisionTask | undefined {
    const task = db.tasks.get(taskId);
    if (!task || task.userId !== userId) return undefined;
    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date().toISOString() : undefined;
    db.tasks.set(taskId, task);

    // Update parent plan
    const plan = db.plans.get(task.planId);
    if (plan) {
      const idx = plan.tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        plan.tasks[idx] = task;
        plan.updatedAt = new Date().toISOString();
      }
    }
    return task;
  }

  // Topic Assistant Chat
  static getChatMessages(userId: string, topicId?: string): TopicExplanationMessage[] {
    return Array.from(db.chatMessages.values())
      .filter(m => m.userId === userId && (!topicId || m.topicId === topicId))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  static addChatMessage(message: TopicExplanationMessage): void {
    db.chatMessages.set(message.id, message);
  }

  // Dashboard Aggregates
  static getDashboardMetrics(userId: string): DashboardMetrics {
    const materials = this.getMaterials(userId);
    const topics = this.getTopics(userId);
    const attempts = this.getAttempts(userId);
    const plan = this.getRevisionPlan(userId);

    let weakCount = 0;
    let mediumCount = 0;
    let strongCount = 0;
    let untestedCount = 0;
    let totalScore = 0;
    let evaluatedCount = 0;

    const masteryTrend: DashboardMetrics['masteryTrend'] = [];

    for (const t of topics) {
      const m = t.mastery;
      if (!m || m.status === 'untested' || m.questionsAttempted === 0) {
        untestedCount++;
      } else {
        evaluatedCount++;
        totalScore += m.masteryPercentage;
        if (m.status === 'weak') weakCount++;
        else if (m.status === 'medium') mediumCount++;
        else if (m.status === 'strong') strongCount++;

        masteryTrend.push({
          topicId: t.id,
          topicTitle: t.title,
          percentage: m.masteryPercentage,
          status: m.status,
          trend: m.masteryPercentage >= 75 ? 'improved' : m.masteryPercentage <= 45 ? 'declined' : 'stable'
        });
      }
    }

    const avgMastery = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : 0;

    const allTasks = plan ? plan.tasks : Array.from(db.tasks.values()).filter(t => t.userId === userId);
    const completedTasks = allTasks.filter(t => t.isCompleted).length;
    const pendingTasks = allTasks.filter(t => !t.isCompleted).length;

    const currentPriorities = allTasks
      .filter(t => !t.isCompleted)
      .slice(0, 4)
      .map(t => ({
        topicTitle: t.topicTitle,
        activityTitle: t.activityTitle,
        durationMinutes: t.durationMinutes,
        priority: t.priority
      }));

    return {
      totalMaterials: materials.length,
      totalTopics: topics.length,
      topicsWithEvidence: evaluatedCount,
      weakCount,
      mediumCount,
      strongCount,
      untestedCount,
      averageMastery: avgMastery,
      completedQuizzesCount: attempts.length,
      recentAttempts: attempts.slice(0, 5).map(a => ({
        id: a.attemptId,
        quizTitle: 'Diagnostic Assessment',
        percentage: a.percentage,
        completedAt: a.completedAt
      })),
      masteryTrend,
      revisionStats: {
        totalTasks: allTasks.length,
        completedTasks,
        pendingTasks,
        currentPriorities
      }
    };
  }
}
