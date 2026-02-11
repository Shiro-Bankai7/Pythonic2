import { LESSONS_BY_ID, QUESTS } from '../constants/lessons';
import { LessonTrackId, QuestDefinition } from '../types';

export interface QuestProgress {
  id: string;
  title: string;
  description: string;
  badge: string;
  progress: number;
  target: number;
  completed: boolean;
}

const countTrackLessons = (completedLessonIds: string[], track: LessonTrackId): number =>
  completedLessonIds.reduce((total, lessonId) => total + (LESSONS_BY_ID[lessonId]?.track === track ? 1 : 0), 0);

const progressForQuest = (
  quest: QuestDefinition,
  completedLessonIds: string[],
  streak: number,
  freestyleRuns: number
): QuestProgress => {
  if (quest.rule.type === 'track_lessons') {
    const progress = countTrackLessons(completedLessonIds, quest.rule.track);
    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      badge: quest.badge,
      progress,
      target: quest.rule.count,
      completed: progress >= quest.rule.count,
    };
  }

  if (quest.rule.type === 'streak') {
    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      badge: quest.badge,
      progress: streak,
      target: quest.rule.days,
      completed: streak >= quest.rule.days,
    };
  }

  if (quest.rule.type === 'freestyle_runs') {
    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      badge: quest.badge,
      progress: freestyleRuns,
      target: quest.rule.count,
      completed: freestyleRuns >= quest.rule.count,
    };
  }

  const completedCount = quest.rule.lessonIds.filter((lessonId) => completedLessonIds.includes(lessonId)).length;
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    badge: quest.badge,
    progress: completedCount,
    target: quest.rule.lessonIds.length,
    completed: completedCount >= quest.rule.lessonIds.length,
  };
};

export const computeQuestProgress = (
  completedLessonIds: string[],
  streak: number,
  freestyleRuns: number
): QuestProgress[] => QUESTS.map((quest) => progressForQuest(quest, completedLessonIds, streak, freestyleRuns));

