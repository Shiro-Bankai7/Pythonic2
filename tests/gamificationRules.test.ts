import { describe, expect, it } from 'vitest';
import { applyStreakUpdate, computeLessonRewards, HINT_TIER_COSTS } from '../services/gamificationRules';

describe('applyStreakUpdate', () => {
  it('starts streak at one when no prior completion exists', () => {
    const result = applyStreakUpdate({
      currentStreak: 0,
      lastCompletedAt: null,
      completedAt: '2026-02-11T10:00:00.000Z',
    });
    expect(result.streak).toBe(1);
    expect(result.usedFreeze).toBe(false);
  });

  it('increments streak for next day completion', () => {
    const result = applyStreakUpdate({
      currentStreak: 4,
      lastCompletedAt: '2026-02-10T09:00:00.000Z',
      completedAt: '2026-02-11T11:00:00.000Z',
    });
    expect(result.streak).toBe(5);
  });

  it('preserves streak if completion happens same day', () => {
    const result = applyStreakUpdate({
      currentStreak: 3,
      lastCompletedAt: '2026-02-11T08:00:00.000Z',
      completedAt: '2026-02-11T13:00:00.000Z',
    });
    expect(result.streak).toBe(3);
  });

  it('consumes streak freeze on large gap', () => {
    const result = applyStreakUpdate({
      currentStreak: 8,
      lastCompletedAt: '2026-02-01T09:00:00.000Z',
      completedAt: '2026-02-11T09:00:00.000Z',
      availableFreezes: 1,
    });
    expect(result.streak).toBe(9);
    expect(result.usedFreeze).toBe(true);
    expect(result.remainingFreezes).toBe(0);
  });
});

describe('computeLessonRewards', () => {
  it('awards base rewards for first completion', () => {
    const rewards = computeLessonRewards({
      firstCompletionToday: true,
      isDailyMission: false,
      streak: 1,
    });
    expect(rewards).toEqual({ xp: 25, coins: 10 });
  });

  it('adds daily mission and streak milestone bonuses', () => {
    const rewards = computeLessonRewards({
      firstCompletionToday: true,
      isDailyMission: true,
      streak: 7,
      questsCompletedCount: 1,
    });
    expect(rewards).toEqual({ xp: 115, coins: 70 });
  });

  it('awards nothing if not first completion of the day', () => {
    const rewards = computeLessonRewards({
      firstCompletionToday: false,
      isDailyMission: true,
      streak: 10,
    });
    expect(rewards).toEqual({ xp: 0, coins: 0 });
  });
});

describe('HINT_TIER_COSTS', () => {
  it('uses increasing costs by tier', () => {
    expect(HINT_TIER_COSTS.hint1).toBeLessThan(HINT_TIER_COSTS.hint2);
    expect(HINT_TIER_COSTS.hint2).toBeLessThan(HINT_TIER_COSTS.full);
  });
});

