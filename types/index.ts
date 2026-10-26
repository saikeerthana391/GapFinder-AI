export type MasteryLevel = 'weak' | 'medium' | 'strong' | 'untested';
export type MaterialType = 'syllabus' | 'textbook' | 'notes' | 'exam_paper';
export type ProcessingStatus = 'processing' | 'ready' | 'error';
export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'mixed';
export type QuestionType = 'multiple_choice' | 'short_answer';
export type AnswerStatus = 'correct' | 'partially_correct' | 'incorrect';
export type TaskPriority = 'high' | 'medium' | 'low';
export type LearningActivity = 'concept_review' | 'practice_problems' | 'deep_dive' | 'self_quiz';

export interface SourceCitation {
  materialId?: string;
  fileName: string;
  pageNumber?: number | string;
  sectionHeading?: string;
  excerpt: string;
  relevanceScore?: number;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  targetExamDate?: string;
  dailyStudyMinutes: number;
  preferredStudyDays: string[]; // e.g. ['Monday', 'Tuesday', ...]
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileType: MaterialType;
  fileSize: number;
  storagePath?: string;
  status: ProcessingStatus;
  errorMessage?: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  materialId: string;
  userId: string;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  sectionHeading?: string;
  tokenCount?: number;
  createdAt: string;
}

export interface Topic {
  id: string;
  userId: string;
  title: string;
  code: string;
  description: string;
  parentUnit: string;
  orderIndex: number;
  sourceMaterialIds: string[];
  prerequisites?: string[];
  createdAt: string;
  // Dynamic or joined
  mastery?: TopicMastery;
}

export interface TopicMastery {
  id: string;
  userId: string;
  topicId: string;
  masteryPercentage: number;
  status: MasteryLevel;
  questionsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  repeatedMistakes: string[];
  explanation: string;
  lastAttemptAt?: string;
  updatedAt: string;
  // Joined
  topicTitle?: string;
}

export interface QuizQuestionClient {
  id: string;
  quizId: string;
  topicId: string;
  topicTitle?: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[]; // empty for short_answer
  points: number;
  difficulty: QuizDifficulty;
  sourceCitation?: SourceCitation;
}

export interface QuizQuestionServer extends QuizQuestionClient {
  correctAnswer: string;
  explanation: string;
  rubricCriteria?: string[];
}

export interface Quiz {
  id: string;
  userId: string;
  title: string;
  topicId?: string;
  quizType: 'topic' | 'mixed_diagnostic';
  difficulty: QuizDifficulty;
  totalQuestions: number;
  totalPoints: number;
  createdAt: string;
  questions?: QuizQuestionClient[];
}

export interface StudentAnswerSubmission {
  questionId: string;
  answerText: string;
}

export interface EvaluatedAnswerResult {
  questionId: string;
  studentAnswer: string;
  status: AnswerStatus;
  marksEarned: number;
  maxMarks: number;
  expectedAnswer: string;
  explanation: string;
  mistakesIdentified: string[];
  conceptsToRevise: string[];
  sourceCitation?: SourceCitation;
}

export interface QuizAttemptResult {
  attemptId: string;
  quizId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  answers: EvaluatedAnswerResult[];
  topicMasteryUpdates: {
    topicId: string;
    topicTitle: string;
    previousScore?: number;
    newScore: number;
    status: MasteryLevel;
    explanation: string;
  }[];
}

export interface RevisionTask {
  id: string;
  planId: string;
  userId: string;
  topicId: string;
  topicTitle: string;
  dayNumber: number;
  scheduledDate: string;
  priority: TaskPriority;
  durationMinutes: number;
  learningActivity: LearningActivity;
  activityTitle: string;
  rationale: string;
  sourceCitation?: SourceCitation;
  followUpQuizTopicId?: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface RevisionPlan {
  id: string;
  userId: string;
  examDate?: string;
  dailyStudyMinutes: number;
  totalDays: number;
  totalRequiredMinutes: number;
  warningNotice?: string;
  tasks: RevisionTask[];
  createdAt: string;
  updatedAt: string;
}

export interface TopicExplanationMessage {
  id: string;
  userId: string;
  topicId?: string;
  role: 'user' | 'assistant';
  content: string;
  citations: SourceCitation[];
  createdAt: string;
}

export interface DashboardMetrics {
  totalMaterials: number;
  totalTopics: number;
  topicsWithEvidence: number;
  weakCount: number;
  mediumCount: number;
  strongCount: number;
  untestedCount: number;
  averageMastery: number;
  completedQuizzesCount: number;
  recentAttempts: {
    id: string;
    quizTitle: string;
    percentage: number;
    completedAt: string;
  }[];
  masteryTrend: {
    topicId: string;
    topicTitle: string;
    percentage: number;
    status: MasteryLevel;
    trend: 'improved' | 'declined' | 'stable';
  }[];
  revisionStats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    currentPriorities: {
      topicTitle: string;
      activityTitle: string;
      durationMinutes: number;
      priority: TaskPriority;
    }[];
  };
}
