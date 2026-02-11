import { GoogleGenAI, Type } from '@google/genai';
import {
  AIReviewResult,
  Challenge,
  ExecutionResult,
  GeminiValidationResult,
  HintTier,
  Lesson,
} from '../types';
import { getCachedHint, getCachedReview, setCachedHint, setCachedReview } from './geminiCacheService';
import { hashCode } from './hashService';

let ai: GoogleGenAI | null = null;

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const FALLBACK_GEMINI_MODEL = 'gemini-2.0-flash-001';
const MAX_NETWORK_ATTEMPTS = 2;
const NETWORK_RETRY_DELAY_MS = 700;

const getApiKey = (): string => {
  const direct = import.meta.env.GEMINI_API_KEY;
  const vitePrefixed = import.meta.env.VITE_GEMINI_API_KEY;
  const key = typeof direct === 'string' && direct ? direct : vitePrefixed;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set in environment.');
  }
  return key;
};

const getAI = (): GoogleGenAI => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: getApiKey() });
  }
  return ai;
};

const getModelCandidates = (): string[] => {
  const direct = import.meta.env.GEMINI_MODEL;
  const vitePrefixed = import.meta.env.VITE_GEMINI_MODEL;
  const configured =
    typeof direct === 'string' && direct.trim().length > 0
      ? direct.trim()
      : typeof vitePrefixed === 'string' && vitePrefixed.trim().length > 0
        ? vitePrefixed.trim()
        : DEFAULT_GEMINI_MODEL;
  return Array.from(new Set([configured, FALLBACK_GEMINI_MODEL]));
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? 'Unknown error');
};

const isLikelyNetworkFailure = (error: unknown): boolean => {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('err_connection_closed') ||
    message.includes('networkerror') ||
    message.includes('network error') ||
    message.includes('load failed') ||
    message.includes('connection')
  );
};

const isLikelyModelAvailabilityIssue = (error: unknown): boolean => {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes('model') &&
    (message.includes('not found') ||
      message.includes('unsupported') ||
      message.includes('invalid') ||
      message.includes('not available') ||
      message.includes('404'))
  );
};

const fallbackErrorMessage = (error: unknown): string => {
  const message = errorMessage(error).toLowerCase();
  if (isLikelyNetworkFailure(error)) {
    return 'Gemini could not be reached (network blocked or closed). Disable blocker/VPN/firewall and retry.';
  }
  if (
    message.includes('api key') ||
    message.includes('permission') ||
    message.includes('forbidden') ||
    message.includes('403') ||
    message.includes('unauthorized')
  ) {
    return 'Gemini key rejected. Verify VITE_GEMINI_API_KEY and API key restrictions.';
  }
  return 'Evaluation failed. Please retry in a moment.';
};

const validationSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, description: 'PASS or FAIL' },
    errors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          line: { type: Type.NUMBER },
          message: { type: Type.STRING },
        },
        required: ['message'],
      },
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    next_step: { type: Type.STRING },
    hint_tiers: {
      type: Type.OBJECT,
      properties: {
        hint1: { type: Type.STRING },
        hint2: { type: Type.STRING },
        full: { type: Type.STRING },
      },
      required: ['hint1', 'hint2', 'full'],
    },
  },
  required: ['verdict', 'errors', 'suggestions', 'next_step', 'hint_tiers'],
};

const normalizeOutput = (value: string): string =>
  value
    .replace(/\r\n/g, '\n')
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

const fallbackResult = (message: string): GeminiValidationResult => ({
  verdict: 'FAIL',
  errors: [{ message }],
  suggestions: ['Run the code and check Python syntax.', 'Match the lesson output target exactly.'],
  next_step: 'Fix the first error, run again, then re-check.',
  hint_tiers: {
    hint1: 'Read the first task sentence and make sure your code does that one thing first.',
    hint2: 'Run incrementally: print intermediate values before final output.',
    full: 'Implement the smallest working version, verify output, then polish naming and style.',
  },
});

const sanitizeModelResponse = (result: Partial<GeminiValidationResult>): GeminiValidationResult => {
  const verdict = result.verdict === 'PASS' ? 'PASS' : 'FAIL';
  return {
    verdict,
    errors: Array.isArray(result.errors)
      ? result.errors.map((err) => ({
          line: typeof err?.line === 'number' ? err.line : undefined,
          message: String(err?.message ?? 'Unknown issue'),
        }))
      : [],
    suggestions: Array.isArray(result.suggestions)
      ? result.suggestions.map((item) => String(item)).slice(0, 5)
      : [],
    next_step: String(result.next_step ?? 'Run your code once more and refine it.'),
    hint_tiers: {
      hint1: String(result.hint_tiers?.hint1 ?? 'Focus on task #1 first.'),
      hint2: String(result.hint_tiers?.hint2 ?? 'Break the task into smaller prints and checks.'),
      full: String(result.hint_tiers?.full ?? 'Implement a full solution matching all lesson tasks.'),
    },
  };
};

interface EvaluateCodeInput {
  lesson: Lesson;
  code: string;
  execution: ExecutionResult | null;
}

export interface EvaluateCodeOutput {
  codeHash: string;
  result: GeminiValidationResult;
  fromCache: boolean;
  estimatedTokens?: number | null;
  estimatedCostUsd?: number | null;
}

const estimateCostUsd = (tokens: number | null | undefined): number | null => {
  if (!tokens || tokens <= 0) return null;
  const usdPerToken = 0.00000035;
  return Number((tokens * usdPerToken).toFixed(6));
};

export const evaluateCodeWithGemini = async (input: EvaluateCodeInput): Promise<EvaluateCodeOutput> => {
  const codeHash = await hashCode(input.code);
  const cached = getCachedReview(input.lesson.id, codeHash);
  if (cached) {
    return { codeHash, result: cached, fromCache: true, estimatedTokens: null, estimatedCostUsd: null };
  }

  const expected = input.lesson.expectedOutput ?? '';
  const actualOutput = input.execution?.output ?? '';
  const runtimeError = input.execution?.error ?? '';

  if (input.lesson.evaluationType === 'stdout' && expected) {
    const matchesExpected =
      normalizeOutput(actualOutput) === normalizeOutput(expected) && runtimeError.trim().length === 0;
    if (matchesExpected) {
      const passResult: GeminiValidationResult = {
        verdict: 'PASS',
        errors: [],
        suggestions: ['Great work. Consider renaming variables for readability.'],
        next_step: 'Try the next lesson and aim for clean, readable code.',
        hint_tiers: {
          hint1: 'You already solved this one.',
          hint2: 'You can now optimize the solution style.',
          full: 'Challenge yourself: rewrite using a different Python construct.',
        },
      };
      setCachedReview(input.lesson.id, codeHash, passResult);
      return { codeHash, result: passResult, fromCache: false, estimatedTokens: 0, estimatedCostUsd: 0 };
    }
  }

  const prompt = `You are a strict Python evaluator for short lessons.

Return JSON only in the provided schema.
Do not include markdown.
Do not output any text outside JSON.

Lesson metadata:
- lesson_id: ${input.lesson.id}
- title: ${input.lesson.title}
- summary: ${input.lesson.summary}
- practice_prompt: ${input.lesson.practicePrompt}
- evaluation_type: ${input.lesson.evaluationType}
- expected_output: ${expected || 'N/A'}

Execution context:
- stdout: ${actualOutput || '(empty)'}
- stderr: ${runtimeError || '(empty)'}

Rules:
1) If stdout clearly matches expected_output (ignoring leading/trailing whitespace), verdict should be PASS unless code is unsafe.
2) If code is unsafe or unrelated to lesson goals, verdict is FAIL.
3) Suggestions must be short and actionable.
4) next_step must be one sentence.
5) hint_tiers must progressively reveal more help.

User code:
\`\`\`python
${input.code}
\`\`\`
`;

  try {
    const modelCandidates = getModelCandidates();
    let response: Awaited<ReturnType<GoogleGenAI['models']['generateContent']>> | null = null;
    let lastError: unknown = null;

    for (const model of modelCandidates) {
      for (let attempt = 1; attempt <= MAX_NETWORK_ATTEMPTS; attempt += 1) {
        try {
          response = await getAI().models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: validationSchema,
            },
          });
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          if (isLikelyNetworkFailure(error) && attempt < MAX_NETWORK_ATTEMPTS) {
            await sleep(NETWORK_RETRY_DELAY_MS * attempt);
            continue;
          }
          if (isLikelyModelAvailabilityIssue(error)) {
            break;
          }
          throw error;
        }
      }

      if (response) {
        break;
      }

      if (lastError && !isLikelyModelAvailabilityIssue(lastError)) {
        throw lastError;
      }
    }

    if (!response) {
      throw lastError ?? new Error('No Gemini response received.');
    }

    const rawJson = response.text?.trim();
    if (!rawJson) {
      throw new Error('Gemini returned an empty response.');
    }
    const parsed = sanitizeModelResponse(JSON.parse(rawJson) as Partial<GeminiValidationResult>);
    const estimatedTokens = Number((response as any)?.usageMetadata?.totalTokenCount ?? 0) || null;
    const estimatedCostUsd = estimateCostUsd(estimatedTokens);
    setCachedReview(input.lesson.id, codeHash, parsed);

    return { codeHash, result: parsed, fromCache: false, estimatedTokens, estimatedCostUsd };
  } catch (error) {
    console.error('Gemini evaluation failed:', error);
    const fallback = fallbackResult(fallbackErrorMessage(error));
    return { codeHash, result: fallback, fromCache: false, estimatedTokens: null, estimatedCostUsd: null };
  }
};

export const getHintForTier = async (
  lessonId: string,
  codeHash: string,
  tier: HintTier,
  review: GeminiValidationResult
): Promise<string> => {
  const cachedHint = getCachedHint(lessonId, codeHash, tier);
  if (cachedHint) {
    return cachedHint;
  }
  const hint = review.hint_tiers[tier];
  setCachedHint(lessonId, codeHash, tier, hint);
  return hint;
};

export const getAIReview = async (challenge: Challenge, userCode: string): Promise<AIReviewResult> => {
  const lessonLike: Lesson = {
    id: challenge.id,
    track: 'csc231',
    title: challenge.title,
    summary: challenge.description,
    difficulty: 'beginner',
    estimatedMinutes: 3,
    prerequisites: [],
    contentBlocks: [{ type: 'list', items: challenge.tasks }],
    quiz: [],
    practicePrompt: challenge.tasks[0] ?? challenge.description,
    expectedOutput: challenge.exampleOutput,
    tags: ['legacy'],
    evaluationType: challenge.exampleOutput ? 'stdout' : 'concept',
    starterCode: challenge.starterCode ?? '',
  };

  const { result } = await evaluateCodeWithGemini({
    lesson: lessonLike,
    code: userCode,
    execution: null,
  });

  return {
    is_correct: result.verdict === 'PASS',
    feedback: [result.next_step, ...result.suggestions].join('\n'),
    corrected_code: userCode,
  };
};
