import { MasteryLevel, AnswerStatus, EvaluatedAnswerResult } from '@/types';

export interface TopicScoreInput {
  topicId: string;
  topicTitle: string;
  totalQuestions: number;
  correctCount: number;
  totalPointsEarned: number;
  maxPointsPossible: number;
  identifiedMistakes: string[];
}

export interface CalculatedTopicMastery {
  topicId: string;
  topicTitle: string;
  masteryPercentage: number;
  status: MasteryLevel;
  questionsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  repeatedMistakes: string[];
  explanation: string;
}

export class ScoringEngine {
  /**
   * Configurable mastery cutoffs
   */
  static readonly WEAK_THRESHOLD = 50; // Below 50%
  static readonly MEDIUM_THRESHOLD = 80; // 50% to below 80%
  static readonly MINIMUM_EVIDENCE_QUESTIONS = 2; // Threshold for sufficient diagnostic evidence

  /**
   * Deterministic evaluation of multiple-choice answers
   */
  static evaluateMultipleChoice(
    studentChoice: string,
    correctAnswer: string,
    points: number
  ): {
    status: AnswerStatus;
    marksEarned: number;
    explanation: string;
  } {
    const cleanStudent = studentChoice.trim().toLowerCase();
    const cleanCorrect = correctAnswer.trim().toLowerCase();

    // Check exact match, letter match (e.g. 'A' vs 'A) Option'), or content match
    const isExact = cleanStudent === cleanCorrect;
    const isLetterMatch =
      (cleanStudent.length === 1 && cleanCorrect.startsWith(cleanStudent)) ||
      (cleanCorrect.length === 1 && cleanStudent.startsWith(cleanCorrect));

    if (isExact || isLetterMatch) {
      return {
        status: 'correct',
        marksEarned: points,
        explanation: 'Selected answer matches the verified key exactly.'
      };
    }

    return {
      status: 'incorrect',
      marksEarned: 0,
      explanation: `Selected '${studentChoice}' does not match expected answer '${correctAnswer}'.`
    };
  }

  /**
   * Determine mastery classification based on percentage and evidence
   */
  static determineMasteryStatus(
    percentage: number,
    questionsAttempted: number
  ): MasteryLevel {
    if (questionsAttempted === 0) {
      return 'untested';
    }
    if (percentage < this.WEAK_THRESHOLD) {
      return 'weak';
    }
    if (percentage < this.MEDIUM_THRESHOLD) {
      return 'medium';
    }
    return 'strong';
  }

  /**
   * Calculate mastery metrics and diagnostic explanations for a topic
   */
  static calculateTopicMastery(
    existing: {
      questionsAttempted: number;
      correctAnswers: number;
      incorrectAnswers: number;
      totalPointsEarned: number;
      maxPointsPossible: number;
      repeatedMistakes: string[];
    } | null,
    newAttempt: {
      topicId: string;
      topicTitle: string;
      answers: EvaluatedAnswerResult[];
    }
  ): CalculatedTopicMastery {
    const prevAttempts = existing?.questionsAttempted || 0;
    const prevCorrect = existing?.correctAnswers || 0;
    const prevIncorrect = existing?.incorrectAnswers || 0;
    const prevPointsEarned = existing?.totalPointsEarned || 0;
    const prevMaxPoints = existing?.maxPointsPossible || 0;
    const prevMistakes = existing?.repeatedMistakes || [];

    const newAttempts = newAttempt.answers.length;
    const newCorrect = newAttempt.answers.filter(a => a.status === 'correct').length;
    const newIncorrect = newAttempt.answers.filter(a => a.status === 'incorrect').length;
    const newPointsEarned = newAttempt.answers.reduce((sum, a) => sum + a.marksEarned, 0);
    const newMaxPoints = newAttempt.answers.reduce((sum, a) => sum + a.maxMarks, 0);

    const totalAttempts = prevAttempts + newAttempts;
    const totalCorrect = prevCorrect + newCorrect;
    const totalIncorrect = prevIncorrect + newIncorrect;
    const totalEarned = prevPointsEarned + newPointsEarned;
    const totalPossible = prevMaxPoints + newMaxPoints;

    const percentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
    const status = this.determineMasteryStatus(percentage, totalAttempts);

    // Aggregate repeated mistakes
    const recentMistakes = newAttempt.answers.flatMap(a => a.mistakesIdentified);
    const combinedMistakes = Array.from(new Set([...prevMistakes, ...recentMistakes])).slice(0, 5);

    // Generate clear, verifiable diagnostic rationale
    let explanation = '';
    if (totalAttempts < this.MINIMUM_EVIDENCE_QUESTIONS) {
      explanation = `Tentative assessment (${percentage}% across ${totalAttempts} question). More diagnostic questions recommended for robust statistical certainty.`;
    } else if (status === 'weak') {
      explanation = `Identified critical knowledge gaps (${percentage}% accuracy). Common difficulties: ${
        combinedMistakes.length > 0 ? combinedMistakes.slice(0, 2).join('; ') : 'fundamental concept application'
      }. Needs prioritized review.`;
    } else if (status === 'medium') {
      explanation = `Moderate proficiency (${percentage}% accuracy). Core principles understood, but needs targeted practice on edge cases and complex problems.`;
    } else {
      explanation = `Strong mastery demonstrated (${percentage}% accuracy across ${totalAttempts} questions). Consistently applies principles accurately.`;
    }

    return {
      topicId: newAttempt.topicId,
      topicTitle: newAttempt.topicTitle,
      masteryPercentage: percentage,
      status,
      questionsAttempted: totalAttempts,
      correctAnswers: totalCorrect,
      incorrectAnswers: totalIncorrect,
      repeatedMistakes: combinedMistakes,
      explanation
    };
  }
}
