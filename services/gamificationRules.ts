import { HintTier } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export const HINT_TIER_COSTS: Record<HintTier, number> = {
  hint1: 15,
  hint2: 30,
  full: 50,
};

export interface StreakStateInput {
  currentStreak: number;
  lastCompletedAt?: string | null;
  completedAt: string;
  graceDays?: number;
  availableFreezes?: number;
}

export interface StreakStateOutput {
  streak: number;
  usedFreeze: boolean;
  remainingFreezes: number;
}

const toUtcMidnight = (dateValue: string): number => {
  const date = new Date(dateValue);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const dayDiff = (from: string, to: string): number => Math.round((toUtcMidnight(to) - toUtcMidnight(from)) / DAY_MS);

export const applyStreakUpdate = (input: StreakStateInput): StreakStateOutput => {
  const graceDays = input.graceDays ?? 1;
  const freezable = input.availableFreezes ?? 0;

  if (!input.lastCompletedAt) {
    return { streak: 1, usedFreeze: false, remainingFreezes: freezable };
  }

  const delta = dayDiff(input.lastCompletedAt, input.completedAt);

  if (delta <= 0) {
    return { streak: input.currentStreak, usedFreeze: false, remainingFreezes: freezable };
  }

  if (delta === 1) {
    return { streak: input.currentStreak + 1, usedFreeze: false, remainingFreezes: freezable };
  }

  if (delta <= graceDays + 1) {
    return { streak: input.currentStreak + 1, usedFreeze: false, remainingFreezes: freezable };
  }

  if (freezable > 0) {
    return { streak: input.currentStreak + 1, usedFreeze: true, remainingFreezes: freezable - 1 };
  }

  return { streak: 1, usedFreeze: false, remainingFreezes: freezable };
};

export interface RewardInput {
  firstCompletionToday: boolean;
  isDailyMission: boolean;
  questsCompletedCount?: number;
  streak: number;
}

export interface RewardOutput {
  xp: number;
  coins: number;
}

export const computeLessonRewards = (input: RewardInput): RewardOutput => {
  if (!input.firstCompletionToday) {
    return { xp: 0, coins: 0 };
  }

  let xp = 25;
  let coins = 10;

  if (input.isDailyMission) {
    xp += 20;
    coins += 15;
  }

  if (input.streak > 0 && input.streak % 7 === 0) {
    xp += 30;
    coins += 20;
  }

  if (input.questsCompletedCount) {
    xp += input.questsCompletedCount * 40;
    coins += input.questsCompletedCount * 25;
  }

  return { xp, coins };
};

