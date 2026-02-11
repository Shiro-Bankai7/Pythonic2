export interface Challenge {
  id: string;
  title: string;
  type: 'challenge' | 'project';
  description: string;
  tasks: string[];
  bonus?: string[];
  breakdown?: string[];
  hints?: string[];
  starterCode?: string;
  exampleOutput?: string;
}

export interface Week {
  week: number;
  title: string;
  description: string;
  challenges: Challenge[];
}

export interface ExecutionResult {
  output: string;
  error: string | null;
  durationMs?: number;
  timedOut?: boolean;
}

export interface AIReviewResult {
  is_correct: boolean;
  feedback: string;
  corrected_code: string;
}

export type OnUserInput = (prompt: string) => Promise<string>;

export type EvaluationType = 'stdout' | 'unit' | 'concept';

export type LessonTrackId =
  | 'csc231'
  | 'dsa'
  | 'secure-networking'
  | 'automation'
  | 'data-ai'
  | 'freestyle';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LessonContentBlock {
  type: 'text' | 'list' | 'code' | 'tip';
  title?: string;
  body?: string;
  items?: string[];
  code?: string;
}

export interface LessonQuizItem {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

export interface Lesson {
  id: string;
  track: LessonTrackId;
  title: string;
  summary: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  prerequisites: string[];
  contentBlocks: LessonContentBlock[];
  quiz: LessonQuizItem[];
  practicePrompt: string;
  expectedOutput?: string;
  tags: string[];
  videoUrl?: string;
  evaluationType: EvaluationType;
  starterCode: string;
  legacyWeek?: number;
  legacyType?: 'challenge' | 'project';
}

export interface LessonTrack {
  id: LessonTrackId;
  title: string;
  tagline: string;
  color: string;
  description: string;
}

export type ReviewVerdict = 'PASS' | 'FAIL';

export type HintTier = 'hint1' | 'hint2' | 'full';

export interface GeminiValidationError {
  line?: number;
  message: string;
}

export interface GeminiHintTiers {
  hint1: string;
  hint2: string;
  full: string;
}

export interface GeminiValidationResult {
  verdict: ReviewVerdict;
  errors: GeminiValidationError[];
  suggestions: string[];
  next_step: string;
  hint_tiers: GeminiHintTiers;
}

export interface AttemptRecordInput {
  lessonId: string;
  codeHash: string;
  verdict: ReviewVerdict;
  feedback: GeminiValidationResult;
  model?: string;
  estimatedTokens?: number;
  estimatedCostUsd?: number;
}

export interface DailyMission {
  id: string;
  dateKey: string;
  lessonId: string;
  quizId?: string;
  rewardXp: number;
  rewardCoins: number;
}

export interface DashboardStats {
  streak: number;
  coins: number;
  totalXp: number;
  weeklyXp: number;
  lessonsCompleted: number;
}

export interface LeaderboardRow {
  user_id: string;
  username: string;
  avatar?: string | null;
  streak: number;
  total_xp: number;
  weekly_xp: number;
  track_id?: string | null;
  rank: number;
}

export interface GroupSummary {
  id: string;
  name: string;
  join_code: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  badge: string;
  rule:
    | { type: 'track_lessons'; track: LessonTrackId; count: number }
    | { type: 'streak'; days: number }
    | { type: 'freestyle_runs'; count: number }
    | { type: 'lesson_ids'; lessonIds: string[] };
}
