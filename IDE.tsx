import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LESSONS, LESSONS_BY_ID, LESSON_TRACKS, getDailyMission, getLessonsByTrack } from './constants/lessons';
import { getZenOfDay } from './constants/zen';
import {
  completeLesson,
  createGroup,
  fetchAuthIdentity,
  fetchCompletedLessonIds,
  fetchDashboard,
  fetchLeaderboardPage,
  fetchMyGroups,
  fetchTrackProgress,
  fetchUserBadges,
  joinGroupByCode,
  purchaseHint,
  purchaseStreakFreeze,
  recordAttempt,
  signInWithGoogle,
  signOut,
} from './services/progressionService';
import { evaluateCodeWithGemini, getHintForTier } from './services/geminiService';
import { outputToImage } from './services/freestyleExportService';
import { HINT_TIER_COSTS } from './services/gamificationRules';
import { hashCode } from './services/hashService';
import { computeQuestProgress } from './services/questService';
import { downloadDataUrl, generateShareCardDataUrl } from './services/shareCardService';
import { getSupabaseClient, hasSupabaseConfig } from './services/supabaseClient';
import { initPyodide, runPythonCode } from './services/pythonRunnerService';
import {
  DashboardStats,
  ExecutionResult,
  GeminiValidationResult,
  HintTier,
  LeaderboardRow,
  Lesson,
  LessonTrackId,
  OnUserInput,
} from './types';
import { RocketIcon, SparklesIcon } from './components/icons';

type Page = 'home' | 'tracks' | 'lesson' | 'leaderboards' | 'profile' | 'freestyle';
type LeaderboardScope = 'global' | 'weekly' | 'track' | 'group';

const HINT_SEQUENCE: HintTier[] = ['hint1', 'hint2', 'full'];
const STREAK_FREEZE_COST = 90;

const EMPTY_DASHBOARD: DashboardStats = {
  streak: 0,
  coins: 0,
  totalXp: 0,
  weeklyXp: 0,
  lessonsCompleted: 0,
};

const UserInputPrompt: React.FC<{ prompt: string; onSubmit: (value: string) => void }> = ({ prompt, onSubmit }) => {
  const [value, setValue] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-4">
      <form
        className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(value);
          setValue('');
        }}
      >
        <p className="text-blue-300 font-semibold mb-3">{prompt || 'Program Input'}</p>
        <input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md py-2">
          Submit Input
        </button>
      </form>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
      <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
    </div>
  );
};

const ScopeButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`rounded-md px-3 py-1.5 text-sm border ${
      active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-900'
    }`}
  >
    {label}
  </button>
);

const PYTHON_KEYWORDS = new Set([
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'False',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'None',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'True',
  'try',
  'while',
  'with',
  'yield',
]);

const PYTHON_BUILTINS = new Set([
  'abs',
  'all',
  'any',
  'dict',
  'enumerate',
  'filter',
  'float',
  'int',
  'len',
  'list',
  'map',
  'max',
  'min',
  'print',
  'range',
  'reversed',
  'set',
  'sorted',
  'str',
  'sum',
  'tuple',
  'type',
  'zip',
]);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const spanToken = (value: string, color: string, weight: 'normal' | '600' = 'normal', italic = false): string => {
  const style = `color:${color};font-weight:${weight};${italic ? 'font-style:italic;' : ''}`;
  return `<span style="${style}">${escapeHtml(value)}</span>`;
};

const highlightPythonCode = (source: string): string => {
  if (!source) return '';

  let html = '';
  let index = 0;
  let expectIdentifier: 'function' | 'class' | null = null;

  while (index < source.length) {
    const char = source[index];

    if (char === '#') {
      const start = index;
      while (index < source.length && source[index] !== '\n') index += 1;
      html += spanToken(source.slice(start, index), '#64748b', 'normal', true);
      continue;
    }

    if (char === '\'' || char === '"') {
      const quote = char;
      const isTriple = source.slice(index, index + 3) === quote.repeat(3);
      const start = index;
      index += isTriple ? 3 : 1;

      while (index < source.length) {
        if (isTriple && source.slice(index, index + 3) === quote.repeat(3)) {
          index += 3;
          break;
        }
        if (!isTriple && source[index] === quote && source[index - 1] !== '\\') {
          index += 1;
          break;
        }
        if (!isTriple && source[index] === '\\' && index + 1 < source.length) {
          index += 2;
          continue;
        }
        index += 1;
      }

      html += spanToken(source.slice(start, index), '#86efac');
      continue;
    }

    if (/[0-9]/.test(char)) {
      const start = index;
      while (index < source.length && /[0-9_\.]/.test(source[index])) index += 1;
      html += spanToken(source.slice(start, index), '#fca5a5');
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      const start = index;
      while (index < source.length && /[A-Za-z0-9_]/.test(source[index])) index += 1;
      const word = source.slice(start, index);

      if (expectIdentifier === 'function') {
        html += spanToken(word, '#60a5fa', '600');
        expectIdentifier = null;
        continue;
      }

      if (expectIdentifier === 'class') {
        html += spanToken(word, '#22d3ee', '600');
        expectIdentifier = null;
        continue;
      }

      if (PYTHON_KEYWORDS.has(word)) {
        if (word === 'def') expectIdentifier = 'function';
        if (word === 'class') expectIdentifier = 'class';
        html += spanToken(word, '#f59e0b', '600');
        continue;
      }

      if (PYTHON_BUILTINS.has(word)) {
        html += spanToken(word, '#a78bfa');
        continue;
      }

      let lookahead = index;
      while (lookahead < source.length && source[lookahead] === ' ') lookahead += 1;
      const nextChar = source[lookahead];
      const nextTwo = source.slice(lookahead, lookahead + 2);

      if (nextChar === '(') {
        html += spanToken(word, '#60a5fa');
      } else if (nextChar === '=' && nextTwo !== '==') {
        html += spanToken(word, '#93c5fd');
      } else {
        html += spanToken(word, '#cbd5e1');
      }
      continue;
    }

    html += escapeHtml(char);
    index += 1;
  }

  return html;
};

const LeaderboardTable: React.FC<{ rows: LeaderboardRow[]; isLoading: boolean }> = ({ rows, isLoading }) => {
  if (isLoading) {
    return <p className="text-slate-400">Loading leaderboard...</p>;
  }

  if (!rows.length) {
    return <p className="text-slate-400">No leaderboard data yet.</p>;
  }

  return (
    <div className="overflow-x-auto border border-slate-700 rounded-xl">
      <table className="w-full min-w-[700px] text-left">
        <thead className="bg-slate-900">
          <tr>
            <th className="px-4 py-2 text-xs text-slate-400 uppercase">Rank</th>
            <th className="px-4 py-2 text-xs text-slate-400 uppercase">Learner</th>
            <th className="px-4 py-2 text-xs text-slate-400 uppercase">Total XP</th>
            <th className="px-4 py-2 text-xs text-slate-400 uppercase">Weekly XP</th>
            <th className="px-4 py-2 text-xs text-slate-400 uppercase">Streak</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.user_id}-${row.rank}`} className="border-t border-slate-800">
              <td className="px-4 py-2 font-semibold text-blue-300">#{row.rank}</td>
              <td className="px-4 py-2">{row.username}</td>
              <td className="px-4 py-2">{row.total_xp}</td>
              <td className="px-4 py-2">{row.weekly_xp}</td>
              <td className="px-4 py-2">{row.streak}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const IDE: React.FC = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState<Page>('home');
  const [selectedTrack, setSelectedTrack] = useState<LessonTrackId>('csc231');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);

  const [userCodeByLesson, setUserCodeByLesson] = useState<Record<string, string>>(
    Object.fromEntries(LESSONS.map((lesson) => [lesson.id, lesson.starterCode]))
  );
  const [executionByLesson, setExecutionByLesson] = useState<Record<string, ExecutionResult | null>>({});
  const [reviewByLesson, setReviewByLesson] = useState<Record<string, GeminiValidationResult | null>>({});
  const [revealedHintsByLesson, setRevealedHintsByLesson] = useState<Record<string, string[]>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [freestyleRuns, setFreestyleRuns] = useState(0);
  const [freestyleCode, setFreestyleCode] = useState<string>('print("Hello from Just Code!")');
  const [freestyleExecution, setFreestyleExecution] = useState<ExecutionResult | null>(null);
  const [isFreestyleRunning, setIsFreestyleRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastHintRequestAt, setLastHintRequestAt] = useState<number>(0);

  const [isRunnerReady, setIsRunnerReady] = useState(false);
  const [runnerStatusMessage, setRunnerStatusMessage] = useState('Loading Python environment...');
  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAwaitingInput, setIsAwaitingInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const inputResolverRef = useRef<((value: string) => void) | null>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const codeHighlightRef = useRef<HTMLPreElement | null>(null);

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [leaderboardScope, setLeaderboardScope] = useState<LeaderboardScope>('global');
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardTrack, setLeaderboardTrack] = useState<LessonTrackId>('csc231');
  const [leaderboardGroupId, setLeaderboardGroupId] = useState<string | undefined>(undefined);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [lessonMobileTab, setLessonMobileTab] = useState<'learn' | 'code' | 'result'>('code');

  const supabaseReady = hasSupabaseConfig();
  const dailyMission = useMemo(() => getDailyMission(), []);
  const zenOfDay = useMemo(() => getZenOfDay(), []);
  const dailyMissionLesson = LESSONS_BY_ID[dailyMission.lessonId];
  const selectedLesson = LESSONS_BY_ID[selectedLessonId] ?? LESSONS[0];

  const handleUserInputRequest = useCallback<OnUserInput>((promptText) => {
    setIsAwaitingInput(true);
    setInputPrompt(promptText);
    return new Promise((resolve) => {
      inputResolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    const loadRunner = async () => {
      try {
        await initPyodide((message) => setRunnerStatusMessage(message), handleUserInputRequest);
        setIsRunnerReady(true);
      } catch (runnerError) {
        console.error(runnerError);
        setError('Failed to initialize Python runner. Refresh and retry.');
      }
    };
    loadRunner();
  }, [handleUserInputRequest]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const clearOAuthHash = () => {
      const hash = window.location.hash;
      if (hash.includes('access_token=') || hash.includes('refresh_token=')) {
        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      setAuthUserId(data.session?.user?.id ?? null);
      clearOAuthHash();
    });
    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user?.id ?? null);
      clearOAuthHash();
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', authUserId],
    queryFn: fetchDashboard,
    enabled: Boolean(authUserId),
  });

  const completedLessonsQuery = useQuery({
    queryKey: ['completedLessons', authUserId],
    queryFn: fetchCompletedLessonIds,
    enabled: Boolean(authUserId),
  });

  const trackProgressQuery = useQuery({
    queryKey: ['trackProgress', authUserId],
    queryFn: fetchTrackProgress,
    enabled: Boolean(authUserId),
  });

  const badgesQuery = useQuery({
    queryKey: ['badges', authUserId],
    queryFn: fetchUserBadges,
    enabled: Boolean(authUserId),
  });

  const groupsQuery = useQuery({
    queryKey: ['groups', authUserId],
    queryFn: fetchMyGroups,
    enabled: Boolean(authUserId),
  });

  const identityQuery = useQuery({
    queryKey: ['identity', authUserId],
    queryFn: fetchAuthIdentity,
    enabled: Boolean(authUserId),
  });

  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard', authUserId, leaderboardScope, leaderboardTrack, leaderboardGroupId, leaderboardPage],
    queryFn: () =>
      fetchLeaderboardPage({
        scope: leaderboardScope,
        trackId: leaderboardScope === 'track' ? leaderboardTrack : undefined,
        groupId: leaderboardScope === 'group' ? leaderboardGroupId : undefined,
        page: leaderboardPage,
        pageSize: 15,
      }),
    enabled: Boolean(authUserId) && (leaderboardScope !== 'group' || Boolean(leaderboardGroupId)),
  });

  const signInMutation = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: () => setStatusMessage('Redirecting to Google sign-in...'),
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      setStatusMessage('Signed out.');
      setPage('home');
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const completeLessonMutation = useMutation({
    mutationFn: completeLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', authUserId] });
      queryClient.invalidateQueries({ queryKey: ['completedLessons', authUserId] });
      queryClient.invalidateQueries({ queryKey: ['trackProgress', authUserId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  const purchaseHintMutation = useMutation({
    mutationFn: purchaseHint,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard', authUserId] }),
  });

  const purchaseFreezeMutation = useMutation({
    mutationFn: () => purchaseStreakFreeze(STREAK_FREEZE_COST),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', authUserId] });
      setStatusMessage('Streak Freeze purchased.');
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: (group) => {
      setStatusMessage(`Group created. Join code: ${group.join_code}`);
      setGroupNameInput('');
      queryClient.invalidateQueries({ queryKey: ['groups', authUserId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const joinGroupMutation = useMutation({
    mutationFn: joinGroupByCode,
    onSuccess: () => {
      setStatusMessage('Joined group successfully.');
      setJoinCodeInput('');
      queryClient.invalidateQueries({ queryKey: ['groups', authUserId] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const dashboard = dashboardQuery.data ?? EMPTY_DASHBOARD;
  const identity = identityQuery.data ?? null;
  const completedLessonIds = completedLessonsQuery.data ?? [];
  const trackProgress = trackProgressQuery.data ?? {};
  const serverBadges = badgesQuery.data ?? [];
  const questProgress = useMemo(
    () => computeQuestProgress(completedLessonIds, dashboard.streak, freestyleRuns),
    [completedLessonIds, dashboard.streak, freestyleRuns]
  );
  const badges = Array.from(
    new Set([...serverBadges, ...questProgress.filter((quest) => quest.completed).map((quest) => quest.badge)])
  );
  const lessonCode = userCodeByLesson[selectedLesson.id] ?? selectedLesson.starterCode;
  const highlightedLessonCode = useMemo(() => highlightPythonCode(lessonCode), [lessonCode]);
  const executionResult = executionByLesson[selectedLesson.id] ?? null;
  const reviewResult = reviewByLesson[selectedLesson.id] ?? null;
  const revealedHints = revealedHintsByLesson[selectedLesson.id] ?? [];
  const lessonsInSelectedTrack = useMemo(() => getLessonsByTrack(selectedTrack), [selectedTrack]);
  const selectedLessonIndex = lessonsInSelectedTrack.findIndex((lesson) => lesson.id === selectedLesson.id);
  const previousLesson =
    selectedLessonIndex > 0 && selectedLessonIndex < lessonsInSelectedTrack.length
      ? lessonsInSelectedTrack[selectedLessonIndex - 1]
      : null;
  const nextLesson =
    selectedLessonIndex >= 0 && selectedLessonIndex + 1 < lessonsInSelectedTrack.length
      ? lessonsInSelectedTrack[selectedLessonIndex + 1]
      : null;
  const missionCompleted = completedLessonIds.includes(dailyMission.lessonId);

  useEffect(() => {
    if (!lessonsInSelectedTrack.some((lesson) => lesson.id === selectedLessonId) && lessonsInSelectedTrack[0]) {
      setSelectedLessonId(lessonsInSelectedTrack[0].id);
    }
  }, [lessonsInSelectedTrack, selectedLessonId]);

  useEffect(() => {
    if (!(selectedLesson.id in userCodeByLesson)) {
      setUserCodeByLesson((prev) => ({ ...prev, [selectedLesson.id]: selectedLesson.starterCode }));
    }
  }, [selectedLesson, userCodeByLesson]);

  const syncEditorScroll = useCallback(() => {
    const textarea = codeEditorRef.current;
    const highlight = codeHighlightRef.current;
    if (!textarea || !highlight) return;
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  }, []);

  const setLessonCodeAndCaret = useCallback(
    (nextCode: string, selectionStart: number, selectionEnd = selectionStart) => {
      const currentLessonId = selectedLesson.id;
      setUserCodeByLesson((prev) => ({ ...prev, [currentLessonId]: nextCode }));
      requestAnimationFrame(() => {
        const textarea = codeEditorRef.current;
        if (!textarea) return;
        textarea.focus();
        textarea.selectionStart = selectionStart;
        textarea.selectionEnd = selectionEnd;
        syncEditorScroll();
      });
    },
    [selectedLesson.id, syncEditorScroll]
  );

  const handleEditorChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextCode = event.target.value;
      const currentLessonId = selectedLesson.id;
      setUserCodeByLesson((prev) => ({ ...prev, [currentLessonId]: nextCode }));
      syncEditorScroll();
    },
    [selectedLesson.id, syncEditorScroll]
  );

  const handleEditorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = lessonCode;

      if (event.key === 'Tab') {
        event.preventDefault();

        if (start !== end) {
          const blockStart = value.lastIndexOf('\n', start - 1) + 1;
          const blockEndLookup = value.indexOf('\n', end);
          const blockEnd = blockEndLookup === -1 ? value.length : blockEndLookup;
          const block = value.slice(blockStart, blockEnd);
          const lines = block.split('\n');

          if (event.shiftKey) {
            let removedFromFirstLine = 0;
            let totalRemoved = 0;
            const updatedLines = lines.map((line, lineIndex) => {
              const removal = line.startsWith('    ') ? 4 : line.startsWith('\t') ? 1 : 0;
              if (lineIndex === 0) removedFromFirstLine = removal;
              totalRemoved += removal;
              return removal ? line.slice(removal) : line;
            });
            const updatedBlock = updatedLines.join('\n');
            const nextCode = value.slice(0, blockStart) + updatedBlock + value.slice(blockEnd);
            const nextStart = Math.max(blockStart, start - removedFromFirstLine);
            const nextEnd = Math.max(nextStart, end - totalRemoved);
            setLessonCodeAndCaret(nextCode, nextStart, nextEnd);
          } else {
            const updatedBlock = lines.map((line) => `    ${line}`).join('\n');
            const nextCode = value.slice(0, blockStart) + updatedBlock + value.slice(blockEnd);
            const nextStart = start + 4;
            const nextEnd = end + lines.length * 4;
            setLessonCodeAndCaret(nextCode, nextStart, nextEnd);
          }
          return;
        }

        if (event.shiftKey) {
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const beforeCaret = value.slice(lineStart, start);
          if (beforeCaret.endsWith('    ')) {
            const nextCode = value.slice(0, start - 4) + value.slice(end);
            setLessonCodeAndCaret(nextCode, start - 4);
          } else if (beforeCaret.endsWith('\t')) {
            const nextCode = value.slice(0, start - 1) + value.slice(end);
            setLessonCodeAndCaret(nextCode, start - 1);
          }
          return;
        }

        const nextCode = value.slice(0, start) + '    ' + value.slice(end);
        const nextCaret = start + 4;
        setLessonCodeAndCaret(nextCode, nextCaret);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = value.slice(lineStart, start);
        const baseIndent = currentLine.match(/^\s*/)?.[0] ?? '';
        const trimmedLine = currentLine.trimEnd();
        const nextIndent = trimmedLine.endsWith(':') ? `${baseIndent}    ` : baseIndent;
        const insertion = `\n${nextIndent}`;
        const nextCode = value.slice(0, start) + insertion + value.slice(end);
        const nextCaret = start + insertion.length;
        setLessonCodeAndCaret(nextCode, nextCaret);
        return;
      }

      if (event.key === 'Backspace' && start === end) {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const beforeCaret = value.slice(lineStart, start);
        if (/^\s+$/.test(beforeCaret) && beforeCaret.endsWith('    ')) {
          event.preventDefault();
          const nextCode = value.slice(0, start - 4) + value.slice(end);
          setLessonCodeAndCaret(nextCode, start - 4);
        }
      }
    },
    [lessonCode, setLessonCodeAndCaret]
  );

  const dismissNotices = () => {
    setStatusMessage(null);
    setError(null);
  };

  const openLesson = (lesson: Lesson) => {
    setSelectedTrack(lesson.track);
    setSelectedLessonId(lesson.id);
    setLessonMobileTab('code');
    setPage('lesson');
    dismissNotices();
  };

  const runCurrentCode = async (): Promise<ExecutionResult | null> => {
    if (!isRunnerReady) {
      setError('Python runner is still initializing.');
      return null;
    }

    setIsRunning(true);
    setError(null);
    try {
      const result = await runPythonCode(lessonCode);
      setExecutionByLesson((prev) => ({ ...prev, [selectedLesson.id]: result }));
      setLessonMobileTab('result');
      if (result.error) {
        setStatusMessage('Execution finished with errors. See output panel.');
      } else {
        const runtime = typeof result.durationMs === 'number' ? ` (${result.durationMs}ms)` : '';
        if ((result.output ?? '').trim().length === 0) {
          setStatusMessage(`Code executed successfully${runtime}. No output because nothing was printed.`);
        } else {
          setStatusMessage(`Code executed successfully${runtime}.`);
        }
      }
      if (selectedLesson.track === 'freestyle' && !result.error) {
        setFreestyleRuns((count) => count + 1);
      }
      return result;
    } catch (runnerError) {
      console.error(runnerError);
      setError('Code execution failed.');
      return null;
    } finally {
      setIsRunning(false);
    }
  };

  const checkCurrentCode = async () => {
    setIsChecking(true);
    setError(null);
    setStatusMessage(null);
    try {
      const existing = executionByLesson[selectedLesson.id] ?? null;
      const execution = existing ?? (await runCurrentCode());
      setLessonMobileTab('result');
      const evaluation = await evaluateCodeWithGemini({
        lesson: selectedLesson,
        code: lessonCode,
        execution,
      });
      setReviewByLesson((prev) => ({ ...prev, [selectedLesson.id]: evaluation.result }));

      if (authUserId) {
        await recordAttempt({
          lessonId: selectedLesson.id,
          codeHash: evaluation.codeHash,
          verdict: evaluation.result.verdict,
          feedbackJson: evaluation.result,
          estimatedTokens: evaluation.estimatedTokens ?? null,
          estimatedCostUsd: evaluation.estimatedCostUsd ?? null,
        }).catch((recordError) => {
          console.warn('Attempt logging failed', recordError);
        });
      }

      if (evaluation.result.verdict === 'PASS') {
        if (!authUserId) {
          setStatusMessage('Pass detected. Sign in to persist XP, streak, and coins.');
        } else {
          const reward = await completeLessonMutation.mutateAsync({
            lessonId: selectedLesson.id,
            trackId: selectedLesson.track,
            isDailyMission: selectedLesson.id === dailyMission.lessonId,
          });
          if (reward.xp_awarded > 0 || reward.coins_awarded > 0) {
            setStatusMessage(`Rewarded +${reward.xp_awarded} XP and +${reward.coins_awarded} coins.`);
          } else {
            setStatusMessage('Lesson validated. Rewards already claimed for today.');
          }
        }
      }
    } catch (checkError: any) {
      setError(String(checkError?.message ?? 'Validation failed.'));
    } finally {
      setIsChecking(false);
    }
  };

  const requestHint = async () => {
    const now = Date.now();
    if (now - lastHintRequestAt < 2500) {
      setError('Hint requests are throttled. Try again in a moment.');
      return;
    }
    setLastHintRequestAt(now);

    if (!authUserId) {
      setError('Sign in to spend coins on hints.');
      return;
    }

    const nextTier = HINT_SEQUENCE[revealedHints.length];
    if (!nextTier) {
      setStatusMessage('All hint tiers already unlocked for this code.');
      return;
    }

    const nextTierCost = HINT_TIER_COSTS[nextTier];
    if (dashboard.coins < nextTierCost) {
      setError(`You need ${nextTierCost} coins for ${nextTier}, but only have ${dashboard.coins}.`);
      return;
    }

    try {
      const currentReview =
        reviewByLesson[selectedLesson.id] ??
        (
          await evaluateCodeWithGemini({
            lesson: selectedLesson,
            code: lessonCode,
            execution: executionByLesson[selectedLesson.id] ?? null,
          })
        ).result;

      const codeHash = await hashCode(lessonCode);
      await purchaseHintMutation.mutateAsync({
        lessonId: selectedLesson.id,
        tier: nextTier,
        cost: nextTierCost,
      });
      const hint = await getHintForTier(selectedLesson.id, codeHash, nextTier, currentReview);
      setRevealedHintsByLesson((prev) => ({
        ...prev,
        [selectedLesson.id]: [...(prev[selectedLesson.id] ?? []), `[${nextTier}] ${hint}`],
      }));
      setStatusMessage(`Unlocked ${nextTier} for ${nextTierCost} coins.`);
    } catch (hintError: any) {
      setError(String(hintError?.message ?? 'Hint request failed.'));
    }
  };

  const onUserInput = (value: string) => {
    inputResolverRef.current?.(value);
    inputResolverRef.current = null;
    setInputPrompt('');
    setIsAwaitingInput(false);
  };

  const runFreestyleCode = async () => {
    if (!isRunnerReady) {
      setError('Python runner is still initializing.');
      return;
    }

    setIsFreestyleRunning(true);
    setError(null);
    try {
      const result = await runPythonCode(freestyleCode);
      setFreestyleExecution(result);
      setStatusMessage(result.error ? 'Just Code run finished with errors.' : 'Just Code run finished.');
    } catch (runError: any) {
      setError(String(runError?.message ?? 'Just Code execution failed.'));
    } finally {
      setIsFreestyleRunning(false);
    }
  };

  const quiz = selectedLesson.quiz[0];
  const quizAnswer = quizAnswers[selectedLesson.id];
  const quizWasSubmitted = Boolean(quizSubmitted[selectedLesson.id]);
  const quizIsCorrect = quiz ? quizAnswer === quiz.answerIndex : false;

  const navigateAndClose = (next: Page) => {
    setPage(next);
  };

  const renderLessonPage = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <p className="text-xs uppercase tracking-wider text-blue-300">{selectedLesson.track}</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-white">{selectedLesson.title}</h2>
            <p className="text-slate-300 mt-1">{selectedLesson.summary}</p>
          </div>
          <p className="text-xs text-slate-400 shrink-0">{selectedLesson.estimatedMinutes} min</p>
        </div>
      </div>

      <div className="md:hidden grid grid-cols-3 gap-2">
        <ScopeButton active={lessonMobileTab === 'learn'} onClick={() => setLessonMobileTab('learn')} label="Learn" />
        <ScopeButton active={lessonMobileTab === 'code'} onClick={() => setLessonMobileTab('code')} label="Code" />
        <ScopeButton active={lessonMobileTab === 'result'} onClick={() => setLessonMobileTab('result')} label="Result" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${lessonMobileTab === 'learn' ? 'block' : 'hidden'} md:block space-y-4`}>
          {selectedLesson.contentBlocks.map((block, index) => (
            <div key={`${selectedLesson.id}-block-${index}`} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              {block.title && <h3 className="font-semibold text-blue-300 mb-2">{block.title}</h3>}
              {block.type === 'text' || block.type === 'tip' ? <p className="text-slate-300">{block.body}</p> : null}
              {block.type === 'list' && block.items ? (
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {block.items.map((item, itemIndex) => (
                    <li key={`${selectedLesson.id}-item-${itemIndex}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {block.type === 'code' && block.code ? (
                <pre className="rounded-md bg-slate-950 border border-slate-800 p-3 text-xs overflow-x-auto text-slate-200">
                  <code>{block.code}</code>
                </pre>
              ) : null}
            </div>
          ))}

          {quiz ? (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h3 className="font-semibold text-blue-300 mb-2">Quick Quiz</h3>
              <p className="text-slate-300 mb-3">{quiz.question}</p>
              <div className="space-y-2">
                {quiz.options.map((option, optionIndex) => (
                  <label
                    key={`${quiz.id}-${optionIndex}`}
                    className="flex items-start gap-2 border border-slate-700 rounded-md px-3 py-2 hover:bg-slate-800"
                  >
                    <input
                      type="radio"
                      checked={quizAnswer === optionIndex}
                      onChange={() => setQuizAnswers((prev) => ({ ...prev, [selectedLesson.id]: optionIndex }))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <button
                className="mt-3 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm"
                onClick={() => setQuizSubmitted((prev) => ({ ...prev, [selectedLesson.id]: true }))}
              >
                Check Quiz
              </button>
              {quizWasSubmitted ? (
                <p className="mt-2 text-sm text-blue-200">
                  {quizIsCorrect ? 'Correct.' : `Not yet. ${quiz.explanation ?? 'Try again.'}`}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={`${lessonMobileTab === 'code' || lessonMobileTab === 'result' ? 'block' : 'hidden'} md:block space-y-4`}>
          <div className={`${lessonMobileTab === 'result' ? 'hidden md:block' : 'block'} rounded-xl border border-slate-700 bg-[#020617]`}>
            <div className="px-4 py-2 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              Python Terminal
            </div>
            <div className="relative h-[38vh] md:h-[420px]">
              <pre
                ref={codeHighlightRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 m-0 overflow-auto p-4 font-mono text-sm leading-6 whitespace-pre"
                dangerouslySetInnerHTML={{ __html: highlightedLessonCode || '&nbsp;' }}
              />
              {!lessonCode ? (
                <p className="pointer-events-none absolute left-4 top-4 font-mono text-sm text-slate-500">
                  # Write Python code here...
                </p>
              ) : null}
              <textarea
                ref={codeEditorRef}
                className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-blue-200 selection:bg-blue-500/30 p-4 font-mono text-sm leading-6 outline-none resize-none whitespace-pre"
                value={lessonCode}
                onChange={handleEditorChange}
                onKeyDown={handleEditorKeyDown}
                onScroll={syncEditorScroll}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>
          </div>

          <div className={`${lessonMobileTab === 'result' ? 'hidden md:flex' : 'flex'} flex-wrap gap-2`}>
            <button
              onClick={runCurrentCode}
              disabled={isRunning || isChecking || !isRunnerReady}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-4 py-2 rounded-md font-semibold text-white"
            >
              {isRunning ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={checkCurrentCode}
              disabled={isRunning || isChecking || !isRunnerReady}
              className={`px-4 py-2 rounded-md font-semibold text-white flex items-center gap-2 ${
                reviewResult?.verdict === 'PASS'
                  ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700'
                  : 'bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700'
              }`}
            >
              {isChecking ? (
                <>
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-100 border-t-transparent animate-spin" />
                  Checking...
                </>
              ) : reviewResult?.verdict === 'PASS' ? (
                <>
                  <span aria-hidden>✓</span>
                  Solved
                </>
              ) : (
                'Check'
              )}
            </button>
            <button
              onClick={requestHint}
              disabled={purchaseHintMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-4 py-2 rounded-md font-semibold text-white"
            >
              Hint ({HINT_SEQUENCE[Math.min(revealedHints.length, 2)] ? HINT_TIER_COSTS[HINT_SEQUENCE[Math.min(revealedHints.length, 2)]] : 'Done'})
            </button>
          </div>

          {!isRunnerReady ? <p className="text-xs text-slate-500">{runnerStatusMessage}</p> : null}

          <div className={`${lessonMobileTab === 'code' ? 'hidden md:block' : 'block'} space-y-4`}>
            {executionResult ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <h4 className="font-semibold text-blue-300 mb-2">Output</h4>
                <pre className="text-sm whitespace-pre-wrap text-slate-200">{executionResult.output || '(no stdout)'}</pre>
                {executionResult.error ? <pre className="mt-3 text-sm text-red-300 whitespace-pre-wrap">{executionResult.error}</pre> : null}
              </div>
            ) : null}

            {isChecking ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex items-center gap-3 text-blue-200">
                <span className="inline-block h-5 w-5 rounded-full border-2 border-blue-300 border-t-transparent animate-spin" />
                <p className="text-sm">Checking exercise...</p>
              </div>
            ) : null}

            {reviewResult ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-5 h-5 text-blue-300" />
                  <h4 className="font-semibold text-blue-300">Gemini Check</h4>
                  <span
                    className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full border ${
                      reviewResult.verdict === 'PASS'
                        ? 'border-emerald-500 text-emerald-300'
                        : 'border-red-500 text-red-300'
                    }`}
                  >
                    {reviewResult.verdict}
                  </span>
                </div>
                {reviewResult.errors.length ? (
                  <ul className="list-disc list-inside text-red-300 text-sm">
                    {reviewResult.errors.map((issue, idx) => (
                      <li key={`${selectedLesson.id}-err-${idx}`}>
                        {issue.line ? `Line ${issue.line}: ` : ''}
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <ul className="list-disc list-inside text-slate-300 text-sm mt-2">
                  {reviewResult.suggestions.map((suggestion, idx) => (
                    <li key={`${selectedLesson.id}-suggestion-${idx}`}>{suggestion}</li>
                  ))}
                </ul>
                <p className="text-blue-200 text-sm mt-3">Next step: {reviewResult.next_step}</p>
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                onClick={() => previousLesson && openLesson(previousLesson)}
                disabled={isRunning || isChecking || !previousLesson}
                className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-semibold px-4 py-2 rounded-md"
              >
                Previous Part
              </button>
              <button
                onClick={() => nextLesson && openLesson(nextLesson)}
                disabled={isRunning || isChecking || !nextLesson}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold px-4 py-2 rounded-md"
              >
                Next Part
              </button>
            </div>

            {revealedHints.length ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-2">
                <h4 className="font-semibold text-blue-300">Unlocked Hints</h4>
                {revealedHints.map((hint, index) => (
                  <p key={`${selectedLesson.id}-hint-${index}`} className="text-sm text-slate-200">
                    {hint}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHomePage = () => (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <p className="text-xs uppercase tracking-wider text-blue-300">Daily 3-Min Mission</p>
        <h2 className="text-xl md:text-2xl font-semibold text-white mt-2">{dailyMissionLesson.title}</h2>
        <p className="text-slate-300 mt-2">{dailyMissionLesson.summary}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-700">
            Reward: +{dailyMission.rewardXp} XP / +{dailyMission.rewardCoins} coins
          </span>
          <span className="px-3 py-1 rounded-full border border-slate-700 text-slate-200">
            {missionCompleted ? 'Completed today' : 'Ready now'}
          </span>
        </div>
        <button
          onClick={() => openLesson(dailyMissionLesson)}
          className="mt-4 bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-500"
        >
          Start Mission
        </button>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <p className="text-xs uppercase tracking-wider text-blue-300">Zen Of The Day</p>
        <p className="mt-2 text-slate-200">"{zenOfDay.line}"</p>
        <p className="mt-3 text-sm text-slate-400">
          Word of the day: <span className="text-blue-300 font-semibold">{zenOfDay.keyword}</span>
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard label="Current Streak" value={dashboard.streak} />
        <MetricCard label="Coin Balance" value={dashboard.coins} />
        <MetricCard label="Total XP" value={dashboard.totalXp} />
        <MetricCard label="Weekly XP" value={dashboard.weeklyXp} />
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="font-semibold text-blue-300">Continue Learning</h3>
        <p className="text-slate-300 mt-1">Jump back into your current track or explore a new one.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm"
            onClick={() => navigateAndClose('tracks')}
          >
            Open Tracks
          </button>
          <button
            className="rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm"
            onClick={() => openLesson(getLessonsByTrack('freestyle')[0])}
          >
            Freestyle Challenge
          </button>
        </div>
      </div>
    </div>
  );

  const renderTracksPage = () => (
    <div className="space-y-4">
      {LESSON_TRACKS.map((track) => {
        const total = LESSONS.filter((lesson) => lesson.track === track.id).length;
        const completed = trackProgress[track.id] ?? 0;
        const progress = total ? Math.round((completed / total) * 100) : 0;
        const isTrackCompleted = total > 0 && completed >= total;
        const trackLessons = getLessonsByTrack(track.id).slice(0, 5);
        return (
          <div key={track.id} className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-300">{track.tagline}</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{track.title}</h3>
                  {isTrackCompleted ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500 text-emerald-300">
                      Completed
                    </span>
                  ) : null}
                </div>
                <p className="text-slate-300 mt-1">{track.description}</p>
              </div>
              <button
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md"
                onClick={() => {
                  setSelectedTrack(track.id);
                  openLesson(getLessonsByTrack(track.id)[0]);
                }}
              >
                Enter Track
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {trackLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => openLesson(lesson)}
                  className="text-xs px-2.5 py-1 rounded-full border border-slate-700 hover:border-blue-500 hover:text-blue-200"
                >
                  {lesson.title}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>
                  {isTrackCompleted ? `Completed (${completed}/${total})` : `${completed}/${total} completed`}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderLeaderboardsPage = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ScopeButton active={leaderboardScope === 'global'} onClick={() => setLeaderboardScope('global')} label="Global" />
        <ScopeButton active={leaderboardScope === 'weekly'} onClick={() => setLeaderboardScope('weekly')} label="Weekly" />
        <ScopeButton active={leaderboardScope === 'track'} onClick={() => setLeaderboardScope('track')} label="Track" />
        <ScopeButton active={leaderboardScope === 'group'} onClick={() => setLeaderboardScope('group')} label="Group" />
      </div>

      {leaderboardScope === 'track' ? (
        <select
          value={leaderboardTrack}
          onChange={(event) => setLeaderboardTrack(event.target.value as LessonTrackId)}
          className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2"
        >
          {LESSON_TRACKS.map((track) => (
            <option key={track.id} value={track.id}>
              {track.title}
            </option>
          ))}
        </select>
      ) : null}

      {leaderboardScope === 'group' ? (
        <select
          value={leaderboardGroupId ?? ''}
          onChange={(event) => setLeaderboardGroupId(event.target.value || undefined)}
          className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2"
        >
          <option value="">Select group</option>
          {(groupsQuery.data ?? []).map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      ) : null}

      <LeaderboardTable rows={leaderboardQuery.data ?? []} isLoading={leaderboardQuery.isLoading} />

      <div className="flex gap-2">
        <button
          className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-40 text-white"
          onClick={() => setLeaderboardPage((pageNumber) => Math.max(1, pageNumber - 1))}
          disabled={leaderboardPage === 1}
        >
          Prev
        </button>
        <button
          className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white"
          onClick={() => setLeaderboardPage((pageNumber) => pageNumber + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderProfilePage = () => (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        {identity ? (
          <div className="flex items-center gap-4">
            {identity.avatarUrl ? (
              <img src={identity.avatarUrl} alt="Profile avatar" className="w-12 h-12 rounded-full border border-slate-700" />
            ) : (
              <div className="w-12 h-12 rounded-full border border-slate-700 bg-slate-800 text-blue-200 flex items-center justify-center font-semibold">
                {identity.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{identity.fullName}</p>
              <p className="text-sm text-slate-300">{identity.email || 'No email available'}</p>
              <p className="text-xs text-blue-300">{identity.username ? `@${identity.username}` : 'Username loading...'}</p>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Sign in to view profile details.</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Streak" value={dashboard.streak} />
        <MetricCard label="Coins" value={dashboard.coins} />
        <MetricCard label="Total XP" value={dashboard.totalXp} />
        <MetricCard label="Lessons Done" value={dashboard.lessonsCompleted} />
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-semibold text-blue-300">Streak Protection</h3>
          <button
            onClick={() => purchaseFreezeMutation.mutate()}
            disabled={purchaseFreezeMutation.isPending || !authUserId}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Buy Streak Freeze ({STREAK_FREEZE_COST} coins)
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="font-semibold text-blue-300 mb-3">Quests</h3>
        <div className="space-y-3">
          {questProgress.map((quest) => (
            <div key={quest.id} className="border border-slate-700 rounded-md p-3">
              <div className="flex justify-between gap-3">
                <p className="font-semibold">{quest.title}</p>
                <p className={`text-sm ${quest.completed ? 'text-blue-300' : 'text-slate-400'}`}>
                  {quest.progress}/{quest.target}
                </p>
              </div>
              <p className="text-sm text-slate-400">{quest.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="font-semibold text-blue-300 mb-3">Badges</h3>
        {badges.length ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span key={badge} className="px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-blue-100 text-sm">
                {badge}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Complete quests to unlock badges.</p>
        )}
        <button
          className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
          onClick={async () => {
            try {
              const cardUrl = await generateShareCardDataUrl({
                title: 'Learning Streak',
                subtitle: `${dashboard.lessonsCompleted} lessons completed`,
                streak: dashboard.streak,
                xp: dashboard.totalXp,
                badge: badges[0],
              });
              downloadDataUrl(cardUrl, `pythonic-win-${Date.now()}.png`);
              setStatusMessage('Share card generated.');
            } catch (shareError: any) {
              setError(String(shareError?.message ?? 'Share-card generation failed.'));
            }
          }}
        >
          Export Share Card
        </button>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3">
        <h3 className="font-semibold text-blue-300">Class Groups</h3>
        <div className="flex flex-wrap gap-2">
          <input
            value={groupNameInput}
            onChange={(event) => setGroupNameInput(event.target.value)}
            placeholder="New group name"
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2"
          />
          <button
            onClick={() => {
              if (!groupNameInput.trim()) return;
              createGroupMutation.mutate(groupNameInput.trim());
            }}
            disabled={!authUserId || createGroupMutation.isPending}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-md"
          >
            Create Group
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={joinCodeInput}
            onChange={(event) => setJoinCodeInput(event.target.value)}
            placeholder="Join code"
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2"
          />
          <button
            onClick={() => joinGroupMutation.mutate(joinCodeInput)}
            disabled={!authUserId || joinGroupMutation.isPending}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-md"
          >
            Join Group
          </button>
        </div>
        {(groupsQuery.data ?? []).length ? (
          <div className="pt-2 space-y-2">
            {(groupsQuery.data ?? []).map((group) => (
              <div key={group.id} className="border border-slate-700 rounded-md p-3 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-100">{group.name}</p>
                <p className="text-xs text-blue-300">Code: {group.join_code}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No groups yet.</p>
        )}
      </div>
    </div>
  );

  const renderFreestylePage = () => {
    const freestyleLessons = getLessonsByTrack('freestyle');

    return (
      <div className="space-y-4">
        <p className="text-slate-300">
          Challenge cards (2-3 mins each). Run outputs and export your result image for sharing.
        </p>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-white">Just Code</h3>
            <button
              onClick={runFreestyleCode}
              disabled={isFreestyleRunning || !isRunnerReady}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-md"
            >
              {isFreestyleRunning ? 'Running...' : 'Run Just Code'}
            </button>
          </div>
          <textarea
            value={freestyleCode}
            onChange={(event) => setFreestyleCode(event.target.value)}
            className="w-full h-48 rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-slate-100"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
          {freestyleExecution ? (
            <div className="rounded-md border border-slate-700 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-wider text-blue-300 mb-2">Output</p>
              <pre className="text-sm whitespace-pre-wrap text-slate-200">{freestyleExecution.output || '(no stdout)'}</pre>
              {freestyleExecution.error ? (
                <pre className="mt-2 text-sm text-red-300 whitespace-pre-wrap">{freestyleExecution.error}</pre>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {freestyleLessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => openLesson(lesson)}
              className="text-left rounded-xl border border-slate-700 hover:border-blue-500 p-4 bg-slate-900"
            >
              <p className="text-xs uppercase tracking-wider text-blue-300">Freestyle Card</p>
              <h3 className="text-lg font-semibold text-white mt-1">{lesson.title}</h3>
              <p className="text-sm text-slate-300 mt-2">{lesson.summary}</p>
            </button>
          ))}
        </div>
        <button
          onClick={async () => {
            if (!executionResult?.output) {
              setError('Run a freestyle lesson first to export output.');
              return;
            }
            try {
              const imageUrl = await outputToImage(selectedLesson.title, executionResult.output);
              downloadDataUrl(imageUrl, `freestyle-${Date.now()}.png`);
              setStatusMessage('Freestyle output exported.');
            } catch (exportError: any) {
              setError(String(exportError?.message ?? 'Freestyle export failed.'));
            }
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Export Latest Freestyle Output
        </button>
      </div>
    );
  };

  const pageContent = (() => {
    if (page === 'tracks') return renderTracksPage();
    if (page === 'lesson') return renderLessonPage();
    if (page === 'leaderboards') return renderLeaderboardsPage();
    if (page === 'profile') return renderProfilePage();
    if (page === 'freestyle') return renderFreestylePage();
    return renderHomePage();
  })();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {isAwaitingInput ? <UserInputPrompt prompt={inputPrompt} onSubmit={onUserInput} /> : null}

      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RocketIcon className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-300">Pythonic</p>
              <h1 className="text-lg font-black">Micro Lesson Engine</h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <ScopeButton active={page === 'home'} onClick={() => setPage('home')} label="Home" />
            <ScopeButton active={page === 'tracks'} onClick={() => setPage('tracks')} label="Tracks" />
            <ScopeButton active={page === 'lesson'} onClick={() => setPage('lesson')} label="Lesson" />
            <ScopeButton active={page === 'leaderboards'} onClick={() => setPage('leaderboards')} label="Leaderboards" />
            <ScopeButton active={page === 'profile'} onClick={() => setPage('profile')} label="Profile" />
            <ScopeButton active={page === 'freestyle'} onClick={() => setPage('freestyle')} label="Freestyle" />
          </nav>

          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700">Streak {dashboard.streak}</span>
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700">{dashboard.coins} coins</span>
          </div>

          <div className="flex items-center gap-3">
            {authUserId && identity ? (
              <div className="hidden md:block text-right">
                <p className="text-xs text-slate-300 leading-tight">{identity.fullName}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{identity.email}</p>
              </div>
            ) : null}
            {!supabaseReady ? (
              <span className="text-xs text-red-300">Supabase env missing</span>
            ) : authUserId ? (
              <button
                onClick={() => signOutMutation.mutate()}
                className="text-sm bg-blue-600 hover:bg-blue-500 rounded-md px-3 py-1.5 text-white"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => signInMutation.mutate()}
                disabled={signInMutation.isPending}
                className="text-sm bg-blue-600 hover:bg-blue-500 rounded-md px-3 py-1.5 text-white"
              >
                Continue with Google
              </button>
            )}
          </div>
        </div>
      </header>

      {(statusMessage || error) && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          {statusMessage ? (
            <div className="rounded-md border border-blue-500/30 bg-slate-900 text-blue-100 px-4 py-2 text-sm mb-2">
              {statusMessage}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md border border-red-400/40 bg-slate-900 text-red-200 px-4 py-2 text-sm">
              {error}
            </div>
          ) : null}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">{pageContent}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-slate-800 bg-slate-950 p-2">
        <div className="grid grid-cols-5 gap-1">
          <button onClick={() => setPage('home')} className={`text-xs py-2 rounded ${page === 'home' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>Home</button>
          <button onClick={() => setPage('tracks')} className={`text-xs py-2 rounded ${page === 'tracks' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>Tracks</button>
          <button onClick={() => setPage('lesson')} className={`text-xs py-2 rounded ${page === 'lesson' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>Lesson</button>
          <button onClick={() => setPage('leaderboards')} className={`text-xs py-2 rounded ${page === 'leaderboards' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>Ranks</button>
          <button onClick={() => setPage('profile')} className={`text-xs py-2 rounded ${page === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>Profile</button>
        </div>
      </nav>
    </div>
  );
};

export default IDE;

