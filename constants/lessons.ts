import { WEEKS_DATA } from './challenges';
import { DailyMission, Lesson, LessonTrack, LessonTrackId, QuestDefinition } from '../types';

export const LESSON_TRACKS: LessonTrack[] = [
  {
    id: 'csc231',
    title: 'CSC 231',
    tagline: 'Core course path',
    color: 'cyan',
    description: 'Existing CSC 231 content, now represented as micro-lessons.',
  },
  {
    id: 'dsa',
    title: 'DSA Basics',
    tagline: 'Think in steps',
    color: 'emerald',
    description: 'Big-O, arrays, stacks, queues, hashing basics, sorting, recursion.',
  },
  {
    id: 'secure-networking',
    title: 'Secure Coding + Networking',
    tagline: 'Defensive mindset',
    color: 'amber',
    description: 'HTTP basics, safe requests, secrets handling, hashing concepts, OWASP habits.',
  },
  {
    id: 'automation',
    title: 'Automation / Scripting',
    tagline: 'Save repetitive time',
    color: 'blue',
    description: 'Files, JSON/CSV, CLI patterns, and environment-based automation.',
  },
  {
    id: 'data-ai',
    title: 'Data / AI Starter',
    tagline: 'Data to insight',
    color: 'rose',
    description: 'Pandas basics, plotting ideas, and simple toy data workflows.',
  },
  {
    id: 'freestyle',
    title: 'Freestyle Animations Lab',
    tagline: 'Build and share',
    color: 'fuchsia',
    description: 'ASCII animations, text effects, and challenge cards for 2-3 minute runs.',
  },
];

const toMicroLesson = (
  week: number,
  weekTitle: string,
  challenge: (typeof WEEKS_DATA)[number]['challenges'][number]
): Lesson => {
  const quizPrompt = challenge.tasks[0] ?? challenge.description;
  const output = challenge.exampleOutput?.trim();

  return {
    id: challenge.id,
    track: 'csc231',
    title: challenge.title,
    summary: challenge.description,
    difficulty: week <= 3 ? 'beginner' : week <= 7 ? 'intermediate' : 'advanced',
    estimatedMinutes: challenge.type === 'project' ? 5 : 3,
    prerequisites: [],
    contentBlocks: [
      { type: 'text', title: `Week ${week}: ${weekTitle}`, body: challenge.description },
      { type: 'list', title: 'Mission Briefing', items: challenge.tasks },
      ...(challenge.breakdown?.length
        ? [{ type: 'list' as const, title: 'Problem Breakdown', items: challenge.breakdown }]
        : []),
      ...(challenge.hints?.length
        ? [{ type: 'list' as const, title: 'Starter Hints', items: challenge.hints }]
        : []),
      ...(challenge.starterCode
        ? [{ type: 'code' as const, title: 'Starter Code', code: challenge.starterCode }]
        : []),
    ],
    quiz: [
      {
        id: `${challenge.id}-quiz-1`,
        question: `What should you do first for "${challenge.title}"?`,
        options: [
          quizPrompt,
          'Skip planning and print random output.',
          'Avoid writing any Python and submit immediately.',
        ],
        answerIndex: 0,
        explanation: 'This option directly maps to the lesson task.',
      },
    ],
    practicePrompt: challenge.tasks[0] ?? challenge.description,
    expectedOutput: output,
    tags: ['csc231', `week-${week}`, challenge.type],
    evaluationType: output ? 'stdout' : 'concept',
    starterCode: challenge.starterCode ?? '# Write your solution here',
    legacyWeek: week,
    legacyType: challenge.type,
  };
};

const CSC231_LESSONS: Lesson[] = WEEKS_DATA.flatMap((week) =>
  week.challenges.map((challenge) => toMicroLesson(week.week, week.title, challenge))
);

const DSA_LESSONS: Lesson[] = [
  {
    id: 'dsa-big-o-01',
    track: 'dsa',
    title: 'Big-O in 3 Minutes',
    summary: 'Read small snippets and classify O(1), O(n), and O(n^2).',
    difficulty: 'beginner',
    estimatedMinutes: 3,
    prerequisites: [],
    contentBlocks: [
      { type: 'text', body: 'Big-O describes growth as input size increases.' },
      {
        type: 'list',
        title: 'Quick Guide',
        items: ['Single loop -> often O(n)', 'Nested loops -> often O(n^2)', 'Direct access -> often O(1)'],
      },
    ],
    quiz: [
      {
        id: 'dsa-big-o-01-quiz',
        question: 'What is a typical complexity for direct index access in a list?',
        options: ['O(1)', 'O(n)', 'O(n^2)'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Write code that accesses arr[3] and prints it.',
    expectedOutput: '7',
    tags: ['big-o', 'arrays'],
    evaluationType: 'stdout',
    starterCode: 'arr = [1, 3, 5, 7, 9]\n# Print arr[3]',
  },
  {
    id: 'dsa-stack-queue-01',
    track: 'dsa',
    title: 'Stacks vs Queues',
    summary: 'Model push/pop and enqueue/dequeue behavior with Python lists.',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    prerequisites: ['dsa-big-o-01'],
    contentBlocks: [
      {
        type: 'list',
        title: 'Concept',
        items: ['Stack: Last-In First-Out', 'Queue: First-In First-Out'],
      },
      { type: 'tip', body: 'Use append/pop for stack. For queues, pop(0) is simple for learning.' },
    ],
    quiz: [
      {
        id: 'dsa-stack-queue-01-quiz',
        question: 'Which structure removes the earliest inserted item first?',
        options: ['Queue', 'Stack', 'Set'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Simulate stack push [1,2,3] then pop once; print popped value.',
    expectedOutput: '3',
    tags: ['stack', 'queue'],
    evaluationType: 'stdout',
    starterCode: 'stack = []\nstack.append(1)\nstack.append(2)\nstack.append(3)\n# pop and print',
  },
  {
    id: 'dsa-recursion-01',
    track: 'dsa',
    title: 'Recursion Base Case',
    summary: 'Build a tiny recursive function with a safe base case.',
    difficulty: 'intermediate',
    estimatedMinutes: 5,
    prerequisites: ['dsa-stack-queue-01'],
    contentBlocks: [
      { type: 'text', body: 'Every recursive function must have a base case to stop calls.' },
      { type: 'tip', body: 'Test with small values first: 0, 1, 2, 3.' },
    ],
    quiz: [
      {
        id: 'dsa-recursion-01-quiz',
        question: 'What prevents infinite recursion?',
        options: ['A base case', 'A print statement', 'A list'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Write recursive factorial(4) and print it.',
    expectedOutput: '24',
    tags: ['recursion'],
    evaluationType: 'stdout',
    starterCode: 'def factorial(n):\n    # base case + recursive case\n    pass\n\nprint(factorial(4))',
  },
];

const SECURE_NETWORKING_LESSONS: Lesson[] = [
  {
    id: 'sec-http-01',
    track: 'secure-networking',
    title: 'HTTP Status Codes Fast',
    summary: 'Learn common 2xx/4xx/5xx codes and what to do defensively.',
    difficulty: 'beginner',
    estimatedMinutes: 3,
    prerequisites: [],
    contentBlocks: [
      {
        type: 'list',
        title: 'Core Codes',
        items: ['200 OK = successful response', '401/403 = auth/permission issue', '500 = server-side issue'],
      },
      {
        type: 'tip',
        body: 'Defensive approach: validate input, handle non-200 responses, and avoid leaking secrets in logs.',
      },
    ],
    quiz: [
      {
        id: 'sec-http-01-quiz',
        question: 'Which range usually indicates client-side request issues?',
        options: ['4xx', '2xx', '1xx'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Create variable status = 403 and print "retry auth" when status is 401 or 403.',
    expectedOutput: 'retry auth',
    tags: ['http', 'defensive'],
    evaluationType: 'stdout',
    starterCode: 'status = 403\n# your condition here',
  },
  {
    id: 'sec-secrets-01',
    track: 'secure-networking',
    title: 'Secrets Handling Basics',
    summary: 'Store secrets in environment variables, not hardcoded strings.',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    prerequisites: ['sec-http-01'],
    contentBlocks: [
      {
        type: 'list',
        title: 'Checklist',
        items: ['Never commit secrets', 'Use env vars', 'Rotate compromised keys quickly'],
      },
      { type: 'tip', body: 'In this app, API keys should come from `.env.local`.' },
    ],
    quiz: [
      {
        id: 'sec-secrets-01-quiz',
        question: 'Where should API keys live for an app like this?',
        options: ['Environment variables', 'Hardcoded in source', 'Inside commit messages'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Print "safe config loaded" only if token variable is not empty.',
    expectedOutput: 'safe config loaded',
    tags: ['secrets', 'owasp'],
    evaluationType: 'stdout',
    starterCode: 'token = "demo"\n# print safe config loaded if token is present',
  },
  {
    id: 'sec-hashing-01',
    track: 'secure-networking',
    title: 'Hashing Concepts (Defensive)',
    summary: 'Understand why password hashing differs from encryption.',
    difficulty: 'intermediate',
    estimatedMinutes: 4,
    prerequisites: ['sec-secrets-01'],
    contentBlocks: [
      {
        type: 'list',
        title: 'Principles',
        items: [
          'Hashing is one-way verification, not reversible storage.',
          'Use password hashing algorithms like bcrypt/argon2 in production.',
          'Never log raw passwords.',
        ],
      },
    ],
    quiz: [
      {
        id: 'sec-hashing-01-quiz',
        question: 'Which statement is correct?',
        options: [
          'Password hashes are used for verification without storing plaintext.',
          'Hashing is reversible with the same key.',
          'Plaintext passwords are safer for debugging.',
        ],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Create a comment that explains why plaintext password storage is unsafe.',
    tags: ['hashing', 'secure-coding'],
    evaluationType: 'concept',
    starterCode: '# Explain in one comment why plaintext password storage is unsafe.',
  },
];

const DSA_ADDED_LESSONS: Lesson[] = [
  {
    id: 'dsa-time-complexity-intuition-01',
    track: 'dsa',
    title: 'Understanding Time Complexity Intuition',
    summary: 'Learn Big O growth intuition and spot O(1), O(n), and O(n^2) patterns.',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    prerequisites: ['dsa-big-o-01'],
    contentBlocks: [
      {
        type: 'list',
        title: "What you'll learn",
        items: [
          'Big O measures growth rate, not milliseconds.',
          'Recognize O(1), O(n), and O(n^2) structures in code.',
          'Understand why scaling matters in real systems.',
        ],
      },
      {
        type: 'text',
        title: 'Concept',
        body: 'At large input sizes, dominant growth terms matter most. Constants are ignored in Big O.',
      },
      {
        type: 'code',
        title: 'Example',
        code:
          'def get_first_item(items):\n' +
          '    return items[0] if items else None\n\n' +
          'def find_item(items, target):\n' +
          '    for item in items:\n' +
          '        if item == target:\n' +
          '            return True\n' +
          '    return False\n\n' +
          'def find_pairs(items):\n' +
          '    pairs = []\n' +
          '    for i in range(len(items)):\n' +
          '        for j in range(len(items)):\n' +
          '            pairs.append((items[i], items[j]))\n' +
          '    return pairs\n',
      },
      {
        type: 'list',
        title: 'Hint Tiers',
        items: [
          'Hint 1: Think about n = 1,000,000.',
          'Hint 2: Big O compares growth, not absolute runtime.',
          'Full Hint: O(100n) simplifies to O(n), which scales better than O(n^2).',
        ],
      },
    ],
    quiz: [
      {
        id: 'dsa-time-complexity-intuition-01-q1',
        question: 'True or False: O(100n) is worse than O(n^2) for large n.',
        options: ['False', 'True', 'Sometimes'],
        answerIndex: 0,
      },
      {
        id: 'dsa-time-complexity-intuition-01-q2',
        question: 'Why do we call O(1) constant time?',
        options: [
          'The work does not grow with input size.',
          'It always takes exactly 5ms.',
          'It uses one variable.',
        ],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Modify find_pairs to avoid i == j duplicates and explain why complexity stays O(n^2).',
    expectedOutput:
      'O(1) on 100 items: instant\nO(n) on 100 items: ~100 operations\nO(n^2) on 100 items: ~10,000 operations',
    tags: ['big-o', 'time-complexity', 'algorithm-analysis', 'scalability'],
    evaluationType: 'concept',
    starterCode:
      'def find_pairs(items):\n' +
      '    pairs = []\n' +
      '    for i in range(len(items)):\n' +
      '        for j in range(len(items)):\n' +
      '            # skip i == j\n' +
      '            pass\n' +
      '    return pairs\n',
  },
  {
    id: 'dsa-arrays-vs-lists-memory-01',
    track: 'dsa',
    title: 'Arrays vs. Lists in Memory',
    summary: 'Understand Python list memory behavior and operation costs.',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    prerequisites: ['dsa-time-complexity-intuition-01'],
    contentBlocks: [
      {
        type: 'list',
        title: "What you'll learn",
        items: [
          'Python lists are dynamic arrays with contiguous memory.',
          'Index access is O(1), append is amortized O(1).',
          'Insert at start is O(n) because elements shift.',
        ],
      },
      {
        type: 'code',
        title: 'Example',
        code:
          'import time\n' +
          'large_list = list(range(100000))\n' +
          'start = time.time(); _ = large_list[50000]; access = time.time() - start\n' +
          'start = time.time(); large_list.insert(0, -1); insert = time.time() - start\n' +
          'start = time.time(); large_list.append(100001); append = time.time() - start\n' +
          'print(access, insert, append)\n',
      },
      {
        type: 'text',
        title: 'Try It Yourself',
        body: 'Try insert(50000, -1) and compare to insert(0, -1). Both are O(n), but shifts differ.',
      },
      {
        type: 'list',
        title: 'Hint Tiers',
        items: [
          'Hint 1: Arrays can compute element address from index.',
          'Hint 2: Sequential memory makes indexing fast.',
          'Full Hint: Appending to full capacity triggers resize and copy (amortized behavior).',
        ],
      },
    ],
    quiz: [
      {
        id: 'dsa-arrays-vs-lists-memory-01-q1',
        question: 'Why is my_list[99999] usually near-instant?',
        options: [
          'Direct address calculation from index.',
          'Python scans from index 0 each time.',
          'Lists are linked lists.',
        ],
        answerIndex: 0,
      },
      {
        id: 'dsa-arrays-vs-lists-memory-01-q2',
        question: 'What happens when appending to a full list?',
        options: [
          'A larger array is allocated and values copied.',
          'Append always fails.',
          'Python switches to set storage.',
        ],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Measure index access, insert at front, and append timing for a large list.',
    tags: ['arrays', 'lists', 'memory', 'performance', 'big-o', 'data-structures'],
    evaluationType: 'concept',
    starterCode:
      'import time\n' +
      'data = list(range(100000))\n' +
      '# Compare data[50000], data.insert(0, -1), data.append(1)\n',
  },
  {
    id: 'dsa-stacks-real-applications-01',
    track: 'dsa',
    title: 'Stacks in Real Applications',
    summary: 'Use stack LIFO behavior for syntax validation and similar real workflows.',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    prerequisites: ['dsa-arrays-vs-lists-memory-01'],
    contentBlocks: [
      {
        type: 'list',
        title: "What you'll learn",
        items: [
          'Where stacks appear in software (undo, call stack, validation).',
          'Why append/pop are right stack operations in Python.',
          'How to validate nested brackets using LIFO.',
        ],
      },
      {
        type: 'code',
        title: 'Example',
        code:
          'def validate_parentheses(text):\n' +
          '    stack = []\n' +
          "    pairs = {')': '(', ']': '[', '}': '{'}\n" +
          '    for ch in text:\n' +
          "        if ch in '([{':\n" +
          '            stack.append(ch)\n' +
          "        elif ch in ')]}':\n" +
          '            if not stack or stack.pop() != pairs[ch]:\n' +
          '                return False\n' +
          '    return len(stack) == 0\n',
      },
      {
        type: 'list',
        title: 'Hint Tiers',
        items: [
          'Hint 1: Undo uses "last action first".',
          'Hint 2: insert(0)/pop(0) are O(n) on list.',
          'Full Hint: append/pop from end are efficient stack operations.',
        ],
      },
    ],
    quiz: [
      {
        id: 'dsa-stacks-real-applications-01-q1',
        question: 'Why are stacks ideal for undo?',
        options: ['Most recent change is reversed first.', 'They sort operations.', 'They use hashes.'],
        answerIndex: 0,
      },
      {
        id: 'dsa-stacks-real-applications-01-q2',
        question: 'What is wrong with insert(0, item) for stack push?',
        options: ['It is O(n) due to shifts.', 'It is invalid syntax.', 'It causes recursion.'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Extend bracket validator to handle quote state separately.',
    tags: ['stacks', 'lifo', 'parentheses-matching', 'algorithms', 'data-structures'],
    evaluationType: 'concept',
    starterCode:
      'def validate_parentheses(text):\n' +
      '    stack = []\n' +
      '    # implement LIFO validation\n' +
      '    return True\n',
  },
  {
    id: 'dsa-hash-tables-dictionaries-01',
    track: 'dsa',
    title: 'Hash Tables and Python Dictionaries',
    summary: 'Understand hash-based dictionary lookups, key constraints, and collision intuition.',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    prerequisites: ['dsa-stacks-real-applications-01'],
    contentBlocks: [
      {
        type: 'text',
        title: 'Concept',
        body:
          'Dictionary keys are hashed into table slots. Keys must be hashable/immutable so location stays valid.',
      },
      {
        type: 'code',
        title: 'Example',
        code:
          'valid = {\n' +
          "    42: 'integer',\n" +
          "    'hello': 'string',\n" +
          "    (1, 2): 'tuple',\n" +
          "    frozenset([1,2]): 'frozen set'\n" +
          '}\n' +
          '# [1,2] cannot be a key because list is mutable\n',
      },
      {
        type: 'list',
        title: 'Hint Tiers',
        items: [
          'Hint 1: Imagine key value changed after insertion.',
          'Hint 2: Hash maps key to a location.',
          'Full Hint: Mutable key changes break stable lookup path.',
        ],
      },
    ],
    quiz: [
      {
        id: 'dsa-hash-tables-dictionaries-01-q1',
        question: 'Why must dictionary keys be immutable?',
        options: [
          'So hash/location remains stable after insertion.',
          'So values can be mutable.',
          'To make iteration faster only.',
        ],
        answerIndex: 0,
      },
      {
        id: 'dsa-hash-tables-dictionaries-01-q2',
        question: 'What happens during my_dict["k"] = "v"?',
        options: [
          'Python hashes key, finds slot, stores pair (with collision handling).',
          'Python sorts entire dictionary.',
          'Python converts key to integer only.',
        ],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Create a custom class with __hash__ and __eq__ to use as dictionary key.',
    tags: ['hash-tables', 'dictionaries', 'hashing', 'keys', 'performance', 'data-structures'],
    evaluationType: 'concept',
    starterCode:
      'class Key:\n' +
      '    def __init__(self, value):\n' +
      '        self.value = value\n' +
      '    # add __hash__ and __eq__\n',
  },
  {
    id: 'dsa-sorting-tradeoffs-01',
    track: 'dsa',
    title: 'Why Multiple Sorting Algorithms Exist',
    summary: 'Learn sorting tradeoffs and why built-in Timsort is usually preferred in Python.',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    prerequisites: ['dsa-hash-tables-dictionaries-01'],
    contentBlocks: [
      {
        type: 'text',
        title: 'Concept',
        body:
          'Algorithms trade off time, memory, stability, and behavior on data shapes. Python sorted() uses adaptive stable Timsort.',
      },
      {
        type: 'code',
        title: 'Example',
        code:
          'import random\n' +
          'def bubble_sort(a):\n' +
          '    for i in range(len(a)):\n' +
          '        swapped = False\n' +
          '        for j in range(0, len(a)-i-1):\n' +
          '            if a[j] > a[j+1]:\n' +
          '                a[j], a[j+1] = a[j+1], a[j]\n' +
          '                swapped = True\n' +
          '        if not swapped:\n' +
          '            break\n' +
          '    return a\n',
      },
      {
        type: 'list',
        title: 'Hint Tiers',
        items: [
          'Hint 1: Some algorithms are taught for clarity, not production use.',
          'Hint 2: Stability matters with equal keys.',
          'Full Hint: Stable sort preserves order of equal elements in multi-key workflows.',
        ],
      },
    ],
    quiz: [
      {
        id: 'dsa-sorting-tradeoffs-01-q1',
        question: 'Why is bubble sort still taught?',
        options: ['It is easy for learning fundamentals.', 'It is fastest in production.', 'It has O(log n) time.'],
        answerIndex: 0,
      },
      {
        id: 'dsa-sorting-tradeoffs-01-q2',
        question: 'What does stable sort mean?',
        options: [
          'Equal-key elements keep relative order.',
          'Sort uses no comparisons.',
          'Sort never allocates memory.',
        ],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Implement insertion sort and compare on nearly sorted versus random input.',
    tags: ['sorting', 'algorithms', 'timsort', 'bubble-sort', 'performance', 'tradeoffs'],
    evaluationType: 'concept',
    starterCode:
      'def insertion_sort(arr):\n' +
      '    # implement and compare with sorted(arr)\n' +
      '    return arr\n',
  },
  {
    id: 'dsa-recursion-call-stack-01',
    track: 'dsa',
    title: 'Recursion Call Stack Visualization',
    summary: 'Trace recursive frames, base case behavior, and memoization impact.',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    prerequisites: ['dsa-sorting-tradeoffs-01'],
    contentBlocks: [
      {
        type: 'text',
        title: 'Concept',
        body:
          'Each recursive call adds a frame. Base cases stop recursion. Memoization avoids repeated subproblem calls.',
      },
      {
        type: 'code',
        title: 'Example',
        code:
          'def factorial(n, depth=0):\n' +
          "    print('  ' * depth + f'factorial({n})')\n" +
          '    if n <= 1:\n' +
          '        return 1\n' +
          '    return n * factorial(n-1, depth+1)\n',
      },
      {
        type: 'list',
        title: 'Hint Tiers',
        items: [
          'Hint 1: Missing base case can cause stack overflow.',
          'Hint 2: Fibonacci repeats subproblems without cache.',
          'Full Hint: Memoization cuts repeated recursion and improves complexity.',
        ],
      },
    ],
    quiz: [
      {
        id: 'dsa-recursion-call-stack-01-q1',
        question: 'What if recursive function has no base case?',
        options: ['It can recurse until stack overflow.', 'It becomes iterative automatically.', 'It runs in O(1).'],
        answerIndex: 0,
      },
      {
        id: 'dsa-recursion-call-stack-01-q2',
        question: 'Why does memoization speed up Fibonacci?',
        options: ['It reuses previously computed values.', 'It removes recursion entirely.', 'It sorts inputs first.'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Add call counter to factorial and print number of recursive calls.',
    tags: ['recursion', 'call-stack', 'memoization', 'fibonacci', 'factorial', 'algorithms'],
    evaluationType: 'concept',
    starterCode:
      'def factorial(n, calls=0):\n' +
      '    # return tuple (value, calls)\n' +
      '    return 1, calls\n',
  },
];

const SECURE_ADDED_LESSONS: Lesson[] = [
  {
    id: 'sec-never-store-passwords-plaintext-01',
    track: 'secure-networking',
    title: 'Never Store Passwords in Plaintext',
    summary: 'Learn why plaintext is unsafe and why salted password hashing is required.',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    prerequisites: ['sec-hashing-01'],
    contentBlocks: [
      {
        type: 'list',
        title: "What you'll learn",
        items: [
          'Plaintext credentials are catastrophic in breaches.',
          'Salts prevent identical-password hash reuse.',
          'bcrypt/argon2 are preferred for password hashing.',
        ],
      },
      {
        type: 'code',
        title: 'Example',
        code:
          'import hashlib, secrets\n' +
          'pwd = "MySecurePass123!"\n' +
          'bad = hashlib.md5(pwd.encode()).hexdigest()\n' +
          'salt = secrets.token_bytes(16)\n' +
          'better = hashlib.sha256(salt + pwd.encode()).hexdigest()\n' +
          'print("Use bcrypt/argon2 in production")\n',
      },
      {
        type: 'list',
        title: 'Hint Tiers',
        items: [
          'Hint 1: Attackers optimize billions of guesses.',
          'Hint 2: Salt makes same passwords hash differently.',
          'Full Hint: Slow salted hashing raises attacker cost after breach.',
        ],
      },
    ],
    quiz: [
      {
        id: 'sec-never-store-passwords-plaintext-01-q1',
        question: 'Why is MD5 bad for password storage?',
        options: ['Too fast for brute-force defense.', 'Not deterministic.', 'Cannot hash strings.'],
        answerIndex: 0,
      },
      {
        id: 'sec-never-store-passwords-plaintext-01-q2',
        question: 'Why add salt to password hashing?',
        options: [
          'Prevent identical passwords from sharing same stored hash.',
          'Make passwords reversible.',
          'Avoid using hashing algorithm.',
        ],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Explain bcrypt work factor and its security/performance tradeoff.',
    tags: ['passwords', 'security', 'hashing', 'salts', 'authentication', 'best-practices'],
    evaluationType: 'concept',
    starterCode: '# Explain why plaintext passwords are unsafe and why salts matter.\n',
  },
  {
    id: 'sec-input-validation-trust-boundaries-01',
    track: 'secure-networking',
    title: 'Input Validation and Trust Boundaries',
    summary: 'Validate untrusted data at entry points and prevent injection-prone patterns.',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    prerequisites: ['sec-never-store-passwords-plaintext-01'],
    contentBlocks: [
      {
        type: 'text',
        title: 'Concept',
        body:
          'Everything outside your process is untrusted. Validate type, range, length, and format at boundaries.',
      },
      {
        type: 'code',
        title: 'Example',
        code:
          'def validate(value, min_len=1, max_len=20):\n' +
          '    if not value:\n' +
          "        return 'required'\n" +
          '    if len(value) < min_len or len(value) > max_len:\n' +
          "        return 'invalid length'\n" +
          "    return 'ok'\n\n" +
          '# Use parameterized SQL, never string concatenation.\n' +
          "query = 'SELECT * FROM users WHERE username = ? AND id = ?'\n",
      },
      {
        type: 'list',
        title: 'Hint Tiers',
        items: [
          'Hint 1: Client validation can be bypassed.',
          'Hint 2: Validate where data enters server logic.',
          'Full Hint: Trust boundaries include APIs, file uploads, env vars, and external services.',
        ],
      },
    ],
    quiz: [
      {
        id: 'sec-input-validation-trust-boundaries-01-q1',
        question: 'Why validate on server even with client checks?',
        options: ['Client checks are bypassable.', 'Server cannot validate.', 'Client checks are always enough.'],
        answerIndex: 0,
      },
      {
        id: 'sec-input-validation-trust-boundaries-01-q2',
        question: 'What is a trust boundary?',
        options: [
          'A point where untrusted data enters your system.',
          'A CSS layout rule.',
          'A build-time optimization pass.',
        ],
        answerIndex: 0,
      },
    ],
    practicePrompt:
      'Add password strength validation: min 8 chars, one number, one uppercase, one special character.',
    tags: ['validation', 'security', 'sql-injection', 'input-sanitization', 'trust-boundaries'],
    evaluationType: 'concept',
    starterCode: 'def validate_password_strength(password):\n    # add rules\n    return []\n',
  },
  {
    id: 'sec-safe-http-requests-error-handling-01',
    track: 'secure-networking',
    title: 'Safe HTTP Requests and Error Handling',
    summary:
      'Use defensive request patterns: timeouts, TLS verify, status checks, response-size limits, and parsing guards.',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    prerequisites: ['sec-input-validation-trust-boundaries-01'],
    contentBlocks: [
      {
        type: 'text',
        title: 'Concept',
        body:
          'Remote systems can fail or be hostile. Bound request time, validate responses, and handle errors explicitly.',
      },
      {
        type: 'code',
        title: 'Example',
        code:
          'import requests\n' +
          'def safe_get(url):\n' +
          '    response = requests.get(url, timeout=10, verify=True)\n' +
          '    if response.status_code != 200:\n' +
          "        return False, f'HTTP {response.status_code}'\n" +
          "    return True, response.text[:200]\n" +
          '# Add max-size checks and JSON validation in production.\n',
      },
      {
        type: 'code',
        title: 'Expected Output',
        code:
          "Note: this browser runner blocks network-focused imports by design.\n" +
          'Use this as defensive pattern guidance.',
      },
      {
        type: 'list',
        title: 'Hint Tiers',
        items: [
          'Hint 1: Timeouts prevent hangs.',
          'Hint 2: TLS verification prevents server impersonation.',
          'Full Hint: Combine timeout + status + size checks + strict parsing + targeted exception handling.',
        ],
      },
    ],
    quiz: [
      {
        id: 'sec-safe-http-requests-error-handling-01-q1',
        question: 'Why set HTTP timeouts?',
        options: [
          'Prevent hung requests from tying up resources.',
          'Make all responses successful.',
          'Disable TLS overhead.',
        ],
        answerIndex: 0,
      },
      {
        id: 'sec-safe-http-requests-error-handling-01-q2',
        question: 'What does SSL/TLS certificate verification help prevent?',
        options: ['Man-in-the-middle impersonation.', 'Syntax errors.', 'Incorrect list indexing.'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Add exponential backoff retry logic for temporary 429 or 503 errors.',
    tags: ['http', 'requests', 'security', 'error-handling', 'timeouts', 'ssl'],
    evaluationType: 'concept',
    starterCode: '# Outline safe HTTP request flow with timeout, verify, checks, and exception handling.\n',
  },
];

const AUTOMATION_LESSONS: Lesson[] = [
  {
    id: 'auto-json-01',
    track: 'automation',
    title: 'JSON Quick Parse',
    summary: 'Parse a tiny JSON string and print a field.',
    difficulty: 'beginner',
    estimatedMinutes: 3,
    prerequisites: [],
    contentBlocks: [{ type: 'text', body: 'Automation often starts with converting data between formats.' }],
    quiz: [
      {
        id: 'auto-json-01-quiz',
        question: 'Which module helps parse JSON?',
        options: ['json', 'math', 'random'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Parse {"name":"Ada"} and print name.',
    expectedOutput: 'Ada',
    tags: ['json', 'scripting'],
    evaluationType: 'stdout',
    starterCode: 'import json\nraw = \'{"name":"Ada"}\'\n# parse and print name',
  },
  {
    id: 'auto-cli-01',
    track: 'automation',
    title: 'CLI Args Pattern',
    summary: 'Read a simulated argv list and print a command summary.',
    difficulty: 'beginner',
    estimatedMinutes: 3,
    prerequisites: ['auto-json-01'],
    contentBlocks: [{ type: 'tip', body: 'Automations become reusable when they accept arguments.' }],
    quiz: [
      {
        id: 'auto-cli-01-quiz',
        question: 'What makes a script reusable across tasks?',
        options: ['Parameters/arguments', 'Hardcoded values', 'No output'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Given args=["backup","photos"], print: backup:photos',
    expectedOutput: 'backup:photos',
    tags: ['cli', 'automation'],
    evaluationType: 'stdout',
    starterCode: 'args = ["backup", "photos"]\n# print in format command:target',
  },
  {
    id: 'auto-csv-01',
    track: 'automation',
    title: 'CSV Rows Count',
    summary: 'Count CSV records quickly for a sanity check automation.',
    difficulty: 'intermediate',
    estimatedMinutes: 4,
    prerequisites: ['auto-cli-01'],
    contentBlocks: [{ type: 'text', body: 'Fast sanity checks prevent bad data from spreading in pipelines.' }],
    quiz: [
      {
        id: 'auto-csv-01-quiz',
        question: 'Why count rows early in a pipeline?',
        options: ['To validate expected input size', 'To avoid writing code', 'To slow down execution'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Given rows=["a,b","1,2","3,4"], print number of data rows (excluding header).',
    expectedOutput: '2',
    tags: ['csv', 'pipeline'],
    evaluationType: 'stdout',
    starterCode: 'rows = ["a,b", "1,2", "3,4"]\n# print number of data rows',
  },
];

const DATA_AI_LESSONS: Lesson[] = [
  {
    id: 'data-pandas-01',
    track: 'data-ai',
    title: 'Pandas DataFrame Intro',
    summary: 'Create a tiny DataFrame and print one column mean.',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    prerequisites: [],
    contentBlocks: [
      { type: 'text', body: 'Pandas helps inspect and transform tabular data quickly.' },
      { type: 'tip', body: 'Always inspect shape and sample values before deep analysis.' },
    ],
    quiz: [
      {
        id: 'data-pandas-01-quiz',
        question: 'Which library is standard for Python tabular data work?',
        options: ['pandas', 'flask', 'pytest'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Create a DataFrame with values [2, 4, 6] in col "x" and print mean.',
    expectedOutput: '4.0',
    tags: ['pandas', 'dataframe'],
    evaluationType: 'stdout',
    starterCode: 'import pandas as pd\n# create df and print df["x"].mean()',
  },
  {
    id: 'data-plot-01',
    track: 'data-ai',
    title: 'Plotting Mindset',
    summary: 'Pick chart type based on question: trend vs distribution.',
    difficulty: 'beginner',
    estimatedMinutes: 3,
    prerequisites: ['data-pandas-01'],
    contentBlocks: [
      {
        type: 'list',
        title: 'Chart Heuristics',
        items: ['Line: trends over time', 'Bar: compare categories', 'Histogram: value distribution'],
      },
    ],
    quiz: [
      {
        id: 'data-plot-01-quiz',
        question: 'Best chart for a monthly trend?',
        options: ['Line chart', 'Histogram', 'Pie chart'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Print the string "line-for-trend".',
    expectedOutput: 'line-for-trend',
    tags: ['plotting', 'visualization'],
    evaluationType: 'stdout',
    starterCode: '# print chart choice for trend',
  },
  {
    id: 'data-toy-ai-01',
    track: 'data-ai',
    title: 'Toy Model Vocabulary',
    summary: 'Understand features, labels, train/test split at a conceptual level.',
    difficulty: 'intermediate',
    estimatedMinutes: 4,
    prerequisites: ['data-plot-01'],
    contentBlocks: [
      {
        type: 'list',
        title: 'Core Terms',
        items: ['Features: input variables', 'Label: target output', 'Train/test split: estimate generalization'],
      },
    ],
    quiz: [
      {
        id: 'data-toy-ai-01-quiz',
        question: 'What is the label in supervised learning?',
        options: ['The target output', 'A chart title', 'A random seed'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Write one comment defining "feature" in ML.',
    tags: ['ml-basics'],
    evaluationType: 'concept',
    starterCode: '# A feature in ML is ...',
  },
];

const FREESTYLE_LESSONS: Lesson[] = [
  {
    id: 'free-ascii-rain-01',
    track: 'freestyle',
    title: 'ASCII Rain Card',
    summary: 'Print a short ASCII rain effect using loops.',
    difficulty: 'beginner',
    estimatedMinutes: 3,
    prerequisites: [],
    contentBlocks: [
      { type: 'text', body: 'Challenge Card: make a tiny text animation frame-by-frame.' },
      { type: 'tip', body: 'Use simple repeated prints first, then add variation.' },
    ],
    quiz: [
      {
        id: 'free-ascii-rain-01-quiz',
        question: 'What is the fastest way to fake animation in terminal output?',
        options: ['Print multiple frames sequentially', 'Use SQL joins', 'Disable loops'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Print three lines: ".", "..", "...".',
    expectedOutput: '.\n..\n...',
    tags: ['freestyle', 'ascii', 'challenge-card'],
    evaluationType: 'stdout',
    starterCode: '# print 3-frame tiny animation',
  },
  {
    id: 'free-text-glow-01',
    track: 'freestyle',
    title: 'Text Glow Card',
    summary: 'Create a text effect by alternating uppercase/lowercase outputs.',
    difficulty: 'beginner',
    estimatedMinutes: 2,
    prerequisites: ['free-ascii-rain-01'],
    contentBlocks: [{ type: 'text', body: 'Challenge Card: style a word in playful ways.' }],
    quiz: [
      {
        id: 'free-text-glow-01-quiz',
        question: 'What is the lesson focus here?',
        options: ['Creative string output', 'Database indexing', 'Network scanning'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Print PYTHONIC then pythonic on the next line.',
    expectedOutput: 'PYTHONIC\npythonic',
    tags: ['freestyle', 'text-effects', 'challenge-card'],
    evaluationType: 'stdout',
    starterCode: '# print two styled lines',
  },
  {
    id: 'free-wave-card-01',
    track: 'freestyle',
    title: 'Wave Pattern Card',
    summary: 'Use loops and spacing to print a small wave.',
    difficulty: 'intermediate',
    estimatedMinutes: 3,
    prerequisites: ['free-text-glow-01'],
    contentBlocks: [
      { type: 'text', body: 'Challenge Card: play with spaces and repeated symbols.' },
      { type: 'tip', body: 'Test one row at a time before building the full pattern.' },
    ],
    quiz: [
      {
        id: 'free-wave-card-01-quiz',
        question: 'What is the main technique for this card?',
        options: ['Looping with formatted spaces', 'Thread synchronization', 'Packet sniffing'],
        answerIndex: 0,
      },
    ],
    practicePrompt: 'Print a 3-line wave using "~" and spaces.',
    tags: ['freestyle', 'patterns'],
    evaluationType: 'concept',
    starterCode: '# build a mini wave pattern',
  },
];

export const LESSONS: Lesson[] = [
  ...CSC231_LESSONS,
  ...DSA_LESSONS,
  ...DSA_ADDED_LESSONS,
  ...SECURE_NETWORKING_LESSONS,
  ...SECURE_ADDED_LESSONS,
  ...AUTOMATION_LESSONS,
  ...DATA_AI_LESSONS,
  ...FREESTYLE_LESSONS,
];

export const LESSONS_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((lesson) => [lesson.id, lesson]));

export const getLessonsByTrack = (trackId: LessonTrackId): Lesson[] =>
  LESSONS.filter((lesson) => lesson.track === trackId);

export const getDateKey = (date: Date = new Date()): string => date.toISOString().slice(0, 10);

const stringHash = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getDailyMission = (date: Date = new Date()): DailyMission => {
  const dateKey = getDateKey(date);
  const index = stringHash(dateKey) % LESSONS.length;
  const lesson = LESSONS[index];

  return {
    id: `daily-${dateKey}`,
    dateKey,
    lessonId: lesson.id,
    quizId: lesson.quiz[0]?.id,
    rewardXp: 35,
    rewardCoins: 20,
  };
};

export const QUESTS: QuestDefinition[] = [
  {
    id: 'quest-dsa-3',
    title: 'DSA Warmup',
    description: 'Complete 3 DSA Basics lessons.',
    badge: 'Data Sprinter',
    rule: { type: 'track_lessons', track: 'dsa', count: 3 },
  },
  {
    id: 'quest-streak-7',
    title: 'Seven-Day Pulse',
    description: 'Maintain a 7-day streak.',
    badge: 'Rhythm Keeper',
    rule: { type: 'streak', days: 7 },
  },
  {
    id: 'quest-freestyle-5',
    title: 'Freestyle Flow',
    description: 'Finish 5 freestyle runs.',
    badge: 'Visual Coder',
    rule: { type: 'freestyle_runs', count: 5 },
  },
  {
    id: 'quest-csc-unit-1',
    title: 'CSC231 Unit One',
    description: 'Complete the first 5 CSC231 lessons.',
    badge: 'Course Ignition',
    rule: { type: 'lesson_ids', lessonIds: CSC231_LESSONS.slice(0, 5).map((lesson) => lesson.id) },
  },
];
