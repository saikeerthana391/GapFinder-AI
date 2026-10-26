import { Topic, TopicMastery, RevisionPlan, RevisionTask, TaskPriority, LearningActivity } from '@/types';

export interface PlannerInput {
  userId: string;
  topics: Topic[];
  masteries: TopicMastery[];
  targetExamDate?: string; // YYYY-MM-DD
  dailyStudyMinutes?: number;
  preferredStudyDays?: string[];
  existingTasks?: RevisionTask[];
}

export class RevisionPlanner {
  /**
   * Adaptive algorithm to generate realistic, prioritized day-by-day revision schedules
   */
  static generatePlan(input: PlannerInput): RevisionPlan {
    const dailyMinutes = input.dailyStudyMinutes || 60;
    const preferredDays = input.preferredStudyDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // 1. Calculate available days until target exam
    const today = new Date();
    let totalDays = 7;
    if (input.targetExamDate) {
      const examDate = new Date(input.targetExamDate);
      const diffTime = examDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        totalDays = Math.min(diffDays, 30); // Plan within reasonable horizon up to 30 days
      }
    }

    // 2. Map topics to their mastery records
    const masteryMap = new Map<string, TopicMastery>();
    input.masteries.forEach(m => masteryMap.set(m.topicId, m));

    // 3. Compute Urgency & Priority Score for each topic
    // Weak: highest priority (weight 100 - masteryPercentage)
    // Medium: secondary priority (weight 80 - masteryPercentage)
    // Untested: moderate priority to establish baseline
    // Strong: maintenance priority
    interface TopicWithPriority {
      topic: Topic;
      mastery: TopicMastery | undefined;
      urgencyScore: number;
      priority: TaskPriority;
      recommendedDuration: number;
      activity: LearningActivity;
      rationale: string;
    }

    const evaluatedTopics: TopicWithPriority[] = input.topics.map(topic => {
      const mastery = masteryMap.get(topic.id);
      const status = mastery ? mastery.status : 'untested';
      const score = mastery ? mastery.masteryPercentage : 0;

      let urgency = 0;
      let priority: TaskPriority = 'low';
      let recommendedDuration = 30;
      let activity: LearningActivity = 'concept_review';
      let rationale = '';

      if (status === 'weak') {
        urgency = 100 - score + 50; // 50 to 100+
        priority = 'high';
        recommendedDuration = 45;
        activity = 'concept_review';
        const mistakesText = mastery?.repeatedMistakes?.length
          ? ` Specific struggles with: ${mastery.repeatedMistakes.slice(0, 2).join(', ')}.`
          : '';
        rationale = `Critical gap (${score}% mastery). High likelihood of exam penalty.${mistakesText}`;
      } else if (status === 'medium') {
        urgency = 80 - score + 25; // 25 to 55
        priority = 'medium';
        recommendedDuration = 30;
        activity = 'practice_problems';
        rationale = `Borderline proficiency (${score}% mastery). Requires problem-solving drills to lock in retention.`;
      } else if (status === 'untested') {
        urgency = 40;
        priority = 'medium';
        recommendedDuration = 25;
        activity = 'self_quiz';
        rationale = 'No diagnostic evidence on record. Diagnostic self-assessment required to gauge proficiency.';
      } else {
        // Strong
        urgency = 10;
        priority = 'low';
        recommendedDuration = 15;
        activity = 'deep_dive';
        rationale = `High proficiency (${score}% mastery). Brief refresher recommended to sustain long-term memory.`;
      }

      return {
        topic,
        mastery,
        urgencyScore: urgency,
        priority,
        recommendedDuration,
        activity,
        rationale
      };
    });

    // Sort by urgency descending
    evaluatedTopics.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // 4. Preserve completed tasks from previous runs
    const completedTasksMap = new Map<string, RevisionTask>();
    if (input.existingTasks) {
      input.existingTasks.filter(t => t.isCompleted).forEach(t => {
        completedTasksMap.set(t.topicId, t);
      });
    }

    // 5. Schedule tasks into day slots
    const tasks: RevisionTask[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let currentDayIndex = 1;
    let currentDayAccumulatedMinutes = 0;
    let scheduledDate = new Date(today);
    scheduledDate.setDate(scheduledDate.getDate() + 1); // Start tomorrow

    let totalRequiredMinutes = 0;

    for (const item of evaluatedTopics) {
      totalRequiredMinutes += item.recommendedDuration;

      // If user has already completed a task for this topic recently, keep it preserved
      const existingCompleted = completedTasksMap.get(item.topic.id);
      if (existingCompleted) {
        tasks.push(existingCompleted);
        continue;
      }

      // Check daily budget
      if (currentDayAccumulatedMinutes + item.recommendedDuration > dailyMinutes) {
        currentDayIndex++;
        currentDayAccumulatedMinutes = 0;
        scheduledDate.setDate(scheduledDate.getDate() + 1);

        // Skip non-preferred study days if specified
        while (!preferredDays.includes(dayNames[scheduledDate.getDay()])) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }
      }

      const taskDateString = scheduledDate.toISOString().split('T')[0];

      tasks.push({
        id: `task-${item.topic.id}-${currentDayIndex}`,
        planId: `plan-${input.userId}`,
        userId: input.userId,
        topicId: item.topic.id,
        topicTitle: item.topic.title,
        dayNumber: currentDayIndex,
        scheduledDate: taskDateString,
        priority: item.priority,
        durationMinutes: item.recommendedDuration,
        learningActivity: item.activity,
        activityTitle: `${item.activity === 'concept_review' ? 'Review & Notes' : item.activity === 'practice_problems' ? 'Practice Exercises' : 'Diagnostic Self-Quiz'}: ${item.topic.title}`,
        rationale: item.rationale,
        followUpQuizTopicId: item.topic.id,
        isCompleted: false
      });

      currentDayAccumulatedMinutes += item.recommendedDuration;
    }

    // Check if available study time is insufficient
    const totalAvailableMinutes = totalDays * dailyMinutes;
    let warningNotice: string | undefined = undefined;

    if (totalRequiredMinutes > totalAvailableMinutes) {
      const deficitHours = ((totalRequiredMinutes - totalAvailableMinutes) / 60).toFixed(1);
      warningNotice = `Warning: Scheduled review requires ~${(totalRequiredMinutes / 60).toFixed(1)} hrs, but your ${totalDays}-day timetable provides only ${(totalAvailableMinutes / 60).toFixed(1)} hrs (${deficitHours} hrs deficit). Priority has been assigned strictly to weak and borderline topics. Consider increasing your daily study time by 30 minutes.`;
    }

    return {
      id: `plan-${input.userId}`,
      userId: input.userId,
      examDate: input.targetExamDate,
      dailyStudyMinutes: dailyMinutes,
      totalDays: Math.max(currentDayIndex, totalDays),
      totalRequiredMinutes,
      warningNotice,
      tasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}
