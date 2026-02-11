import { GeminiValidationResult, HintTier } from '../types';

const REVIEW_CACHE_KEY = 'pythonic.gemini.review.v1';
const HINT_CACHE_KEY = 'pythonic.gemini.hints.v1';

type ReviewCacheMap = Record<string, GeminiValidationResult>;
type HintCacheMap = Record<string, string>;

const readJson = <T>(key: string): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local storage quota issues.
  }
};

const reviewKey = (lessonId: string, codeHash: string): string => `${lessonId}:${codeHash}`;
const hintKey = (lessonId: string, codeHash: string, tier: HintTier): string => `${lessonId}:${codeHash}:${tier}`;

export const getCachedReview = (lessonId: string, codeHash: string): GeminiValidationResult | null => {
  const cache = readJson<ReviewCacheMap>(REVIEW_CACHE_KEY);
  return cache[reviewKey(lessonId, codeHash)] ?? null;
};

export const setCachedReview = (lessonId: string, codeHash: string, value: GeminiValidationResult): void => {
  const cache = readJson<ReviewCacheMap>(REVIEW_CACHE_KEY);
  cache[reviewKey(lessonId, codeHash)] = value;
  writeJson(REVIEW_CACHE_KEY, cache);
};

export const getCachedHint = (lessonId: string, codeHash: string, tier: HintTier): string | null => {
  const cache = readJson<HintCacheMap>(HINT_CACHE_KEY);
  return cache[hintKey(lessonId, codeHash, tier)] ?? null;
};

export const setCachedHint = (lessonId: string, codeHash: string, tier: HintTier, value: string): void => {
  const cache = readJson<HintCacheMap>(HINT_CACHE_KEY);
  cache[hintKey(lessonId, codeHash, tier)] = value;
  writeJson(HINT_CACHE_KEY, cache);
};

