-- Lesson catalog table + seed content for DSA Basics and Secure Coding tracks.

create table if not exists public.lessons (
  id text primary key,
  track_id text not null,
  title text not null,
  summary text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_minutes integer not null check (estimated_minutes between 1 and 30),
  prerequisites jsonb not null default '[]'::jsonb,
  content_blocks jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  practice_prompt text not null,
  expected_output text,
  tags text[] not null default '{}',
  video_url text,
  evaluation_type text not null check (evaluation_type in ('stdout', 'unit', 'concept')),
  starter_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lessons_track_id on public.lessons(track_id);
create index if not exists idx_lessons_difficulty on public.lessons(difficulty);

alter table public.lessons enable row level security;

drop policy if exists "lessons public read" on public.lessons;
create policy "lessons public read" on public.lessons for select using (true);

insert into public.lessons (
  id, track_id, title, summary, difficulty, estimated_minutes, prerequisites,
  content_blocks, quiz, practice_prompt, expected_output, tags, evaluation_type, starter_code
)
values
(
  'dsa-time-complexity-intuition-01',
  'dsa',
  'Understanding Time Complexity Intuition',
  'Recognize what Big O measures (growth), identify O(1)/O(n)/O(n^2) patterns, and reason about scale.',
  'beginner',
  4,
  '["dsa-big-o-01"]'::jsonb,
  $$[
    {"type":"list","title":"What you'll learn","items":[
      "Recognize what Big O notation measures (growth rate, not speed)",
      "Identify O(1), O(n), and O(n^2) patterns in code",
      "Understand why we care about scaling"
    ]},
    {"type":"text","title":"Concept","body":"Big O describes how runtime or space grows as input size increases. We ignore constants and lower-order terms because dominant growth matters at scale."},
    {"type":"code","title":"Example","code":"def get_first_item(items):\n    return items[0] if items else None\n\ndef find_item(items, target):\n    for item in items:\n        if item == target:\n            return True\n    return False\n\ndef find_pairs(items):\n    pairs = []\n    for i in range(len(items)):\n        for j in range(len(items)):\n            pairs.append((items[i], items[j]))\n    return pairs\n\ntest_data = list(range(100))\nprint(f\"O(1) on {len(test_data)} items: instant\")\nprint(f\"O(n) on {len(test_data)} items: ~{len(test_data)} operations\")\nprint(f\"O(n^2) on {len(test_data)} items: ~{len(test_data)**2:,} operations\")"},
    {"type":"list","title":"Hint Tiers","items":[
      "Hint 1: Think about what happens when n gets very large (like 1,000,000)",
      "Hint 2: Big O cares about growth rate, not absolute time",
      "Full Hint: O(100n) simplifies to O(n). For large n, O(n) grows slower than O(n^2)."
    ]}
  ]$$::jsonb,
  $$[
    {"id":"dsa-time-complexity-intuition-01-q1","question":"True or False: O(100n) is worse than O(n^2) for large n.","options":["False","True","It depends on language"],"answerIndex":0},
    {"id":"dsa-time-complexity-intuition-01-q2","question":"Why do we call O(1) constant time?","options":["Work does not grow with n","Because operation always takes 5ms","Because there is only one variable"],"answerIndex":0}
  ]$$::jsonb,
  'Modify find_pairs to avoid duplicate pairs where i != j. Observe that growth class stays O(n^2).',
  E'O(1) on 100 items: instant\nO(n) on 100 items: ~100 operations\nO(n^2) on 100 items: ~10,000 operations',
  array['big-o','time-complexity','algorithm-analysis','scalability'],
  'concept',
  E'def find_pairs(items):\n    pairs = []\n    for i in range(len(items)):\n        for j in range(len(items)):\n            if i != j:\n                pairs.append((items[i], items[j]))\n    return pairs\n'
),
(
  'dsa-arrays-vs-lists-memory-01',
  'dsa',
  'Arrays vs. Lists in Memory',
  'Understand how Python dynamic arrays behave in memory and why operation cost differs.',
  'beginner',
  4,
  '["dsa-time-complexity-intuition-01"]'::jsonb,
  $$[
    {"type":"list","title":"What you'll learn","items":[
      "Understand how Python lists are stored in memory",
      "Recognize performance impact of operations",
      "Choose operations based on memory layout"
    ]},
    {"type":"text","title":"Concept","body":"Python lists are dynamic arrays, not linked lists. Index access is O(1), append is amortized O(1), and insert at beginning is O(n)."},
    {"type":"code","title":"Example","code":"import time\nlarge_list = list(range(100000))\nstart = time.time(); _ = large_list[50000]; access = time.time() - start\nstart = time.time(); large_list.insert(0, -1); insert = time.time() - start\nstart = time.time(); large_list.append(100001); append = time.time() - start\nprint(f\"Direct access: {access:.6f}s\")\nprint(f\"Insert at beginning: {insert:.6f}s\")\nprint(f\"Append at end: {append:.6f}s\")"},
    {"type":"list","title":"Hint Tiers","items":[
      "Hint 1: Think about how arrays find elements",
      "Hint 2: Memory addresses are sequential",
      "Full Hint: Arrays use address arithmetic; resize copies data when full (amortized append)."
    ]}
  ]$$::jsonb,
  $$[
    {"id":"dsa-arrays-vs-lists-memory-01-q1","question":"Why is accessing my_list[99999] nearly instant?","options":["Direct index-to-address calculation","Python scans from beginning each time","Lists are linked lists"],"answerIndex":0},
    {"id":"dsa-arrays-vs-lists-memory-01-q2","question":"What happens when appending to a full list?","options":["Python allocates larger array and copies items","Append fails","List becomes a set"],"answerIndex":0}
  ]$$::jsonb,
  'Change insert position to insert(50000, -1) and compare timing to insert(0, -1).',
  null,
  array['arrays','lists','memory','performance','big-o','data-structures'],
  'concept',
  E'import time\n\ndef demonstrate_memory_behavior():\n    large_list = list(range(100000))\n    start = time.time(); _ = large_list[50000]; access = time.time() - start\n    start = time.time(); large_list.insert(0, -1); insert = time.time() - start\n    start = time.time(); large_list.append(100001); append = time.time() - start\n    print(access, insert, append)\n\ndemonstrate_memory_behavior()\n'
),
(
  'dsa-stacks-real-applications-01',
  'dsa',
  'Stacks in Real Applications',
  'Implement LIFO behavior and use stack-based bracket validation.',
  'beginner',
  4,
  '["dsa-arrays-vs-lists-memory-01"]'::jsonb,
  $$[
    {"type":"list","title":"What you'll learn","items":[
      "Identify stack use in real software",
      "Implement LIFO behavior",
      "Use Python list as stack correctly"
    ]},
    {"type":"text","title":"Concept","body":"Stacks are Last-In, First-Out. Real uses include function call stack, undo/redo, syntax validation, and backtracking."},
    {"type":"code","title":"Example","code":"def validate_parentheses(code_snippet):\n    stack = []\n    pairs = {')': '(', ']': '[', '}': '{'}\n    for ch in code_snippet:\n        if ch in '([{':\n            stack.append(ch)\n        elif ch in ')]}':\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return len(stack) == 0"},
    {"type":"list","title":"Hint Tiers","items":[
      "Hint 1: Think about operation order",
      "Hint 2: Consider list operation performance",
      "Full Hint: Undo is naturally LIFO; insert(0)/pop(0) are O(n) and inefficient for stacks."
    ]}
  ]$$::jsonb,
  $$[
    {"id":"dsa-stacks-real-applications-01-q1","question":"Why is a stack ideal for undo?","options":["Most recent action should be reversed first","It keeps data sorted","It hashes operations"],"answerIndex":0},
    {"id":"dsa-stacks-real-applications-01-q2","question":"What is wrong with insert(0,item)/pop(0) for stacks?","options":["They are O(n) due to shifting","They are invalid Python","They remove LIFO"],"answerIndex":0}
  ]$$::jsonb,
  'Extend validator to handle quote state (single/double) separately from bracket stack.',
  null,
  array['stacks','lifo','parentheses-matching','algorithms','data-structures'],
  'concept',
  E'def validate_parentheses(text):\n    stack = []\n    pairs = {\')\': \'(\', \']\': \'[\', \'}\': \'{\'}\n    for ch in text:\n        if ch in \'([{\':\n            stack.append(ch)\n        elif ch in \')]}\' and (not stack or stack.pop() != pairs[ch]):\n            return False\n    return len(stack) == 0\n'
),
(
  'dsa-hash-tables-dictionaries-01',
  'dsa',
  'Hash Tables and Python Dictionaries',
  'Learn how dictionaries achieve average O(1) lookup and why key hashability matters.',
  'beginner',
  4,
  '["dsa-stacks-real-applications-01"]'::jsonb,
  $$[
    {"type":"list","title":"What you'll learn","items":[
      "Understand O(1) average dictionary lookups",
      "Recognize proper/invalid key types",
      "Understand collision handling conceptually"
    ]},
    {"type":"text","title":"Concept","body":"Dictionaries hash keys to slots. Keys must be immutable/hashable; collisions are handled internally. Average lookup is O(1), worst case can degrade."},
    {"type":"code","title":"Example","code":"valid = {42:'integer', 'hello':'string', (1,2):'tuple', frozenset([1,2]):'frozen set'}\n# [1,2] cannot be key because list is mutable"},
    {"type":"list","title":"Hint Tiers","items":[
      "Hint 1: What if key changes after insertion?",
      "Hint 2: Python needs stable hash to locate value",
      "Full Hint: Mutable keys can move logically and break retrieval path."
    ]}
  ]$$::jsonb,
  $$[
    {"id":"dsa-hash-tables-dictionaries-01-q1","question":"Why must dict keys be hashable and immutable?","options":["Stable hash/location for lookup","To allow mutable values","To force sorted order"],"answerIndex":0},
    {"id":"dsa-hash-tables-dictionaries-01-q2","question":"What happens during my_dict[\"key\"] = \"value\"?","options":["Hash key, find index, store pair (handle collision)","Scan all keys linearly","Sort keys then append"],"answerIndex":0}
  ]$$::jsonb,
  'Implement a custom class with __hash__ and __eq__ and use it as dict key.',
  null,
  array['hash-tables','dictionaries','hashing','keys','performance','data-structures'],
  'concept',
  E'class Key:\n    def __init__(self, value):\n        self.value = value\n    def __hash__(self):\n        return hash(self.value)\n    def __eq__(self, other):\n        return isinstance(other, Key) and self.value == other.value\n'
),
(
  'dsa-sorting-tradeoffs-01',
  'dsa',
  'Why Multiple Sorting Algorithms Exist',
  'Understand sorting tradeoffs and why Python''s built-in sort is usually best in practice.',
  'beginner',
  4,
  '["dsa-hash-tables-dictionaries-01"]'::jsonb,
  $$[
    {"type":"list","title":"What you'll learn","items":[
      "Understand sorting algorithm tradeoffs",
      "Know when to use built-in sort",
      "Understand why multiple algorithms exist"
    ]},
    {"type":"text","title":"Concept","body":"Different algorithms optimize different goals (time, memory, stability, data shape). Python uses adaptive stable Timsort."},
    {"type":"code","title":"Example","code":"def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        swapped = False\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n                swapped = True\n        if not swapped:\n            break\n    return arr"},
    {"type":"list","title":"Hint Tiers","items":[
      "Hint 1: Educational value differs from practical value",
      "Hint 2: Think about equal-key ordering",
      "Full Hint: Stable sort preserves order of equal elements, important for multi-criteria sorting."
    ]}
  ]$$::jsonb,
  $$[
    {"id":"dsa-sorting-tradeoffs-01-q1","question":"Why is bubble sort still taught?","options":["Simple for learning mechanics","Fastest for large random data","Uses O(log n) time"],"answerIndex":0},
    {"id":"dsa-sorting-tradeoffs-01-q2","question":"What is a stable sort?","options":["Equal elements keep relative order","Sort never allocates","Sort works only on numbers"],"answerIndex":0}
  ]$$::jsonb,
  'Implement insertion sort and compare nearly sorted vs random data.',
  null,
  array['sorting','algorithms','timsort','bubble-sort','performance','tradeoffs'],
  'concept',
  E'def insertion_sort(arr):\n    for i in range(1, len(arr)):\n        key = arr[i]\n        j = i - 1\n        while j >= 0 and arr[j] > key:\n            arr[j + 1] = arr[j]\n            j -= 1\n        arr[j + 1] = key\n    return arr\n'
),
(
  'dsa-recursion-call-stack-01',
  'dsa',
  'Recursion Call Stack Visualization',
  'Visualize recursive calls, base cases, and memoization benefits.',
  'beginner',
  5,
  '["dsa-sorting-tradeoffs-01"]'::jsonb,
  $$[
    {"type":"list","title":"What you'll learn","items":[
      "Visualize recursion call stack",
      "Understand base and recursive cases",
      "Trace execution and memoization impact"
    ]},
    {"type":"text","title":"Concept","body":"Each recursive call adds a stack frame. Base case stops recursion. Memoization prevents repeated subproblem work."},
    {"type":"code","title":"Example","code":"def factorial(n, depth=0):\n    indent = '  ' * depth\n    print(f'{indent}factorial({n}) called')\n    if n <= 1:\n        print(f'{indent}Base case: returning 1')\n        return 1\n    result = n * factorial(n - 1, depth + 1)\n    print(f'{indent}Returning {result}')\n    return result"},
    {"type":"list","title":"Hint Tiers","items":[
      "Hint 1: Base case stops recursion",
      "Hint 2: fib(2) repeats often without memoization",
      "Full Hint: Missing base case risks stack overflow; memoization avoids exponential recomputation."
    ]}
  ]$$::jsonb,
  $$[
    {"id":"dsa-recursion-call-stack-01-q1","question":"What happens without a base case?","options":["Recursion may continue until stack overflow","Function becomes iterative","Complexity becomes O(1)"],"answerIndex":0},
    {"id":"dsa-recursion-call-stack-01-q2","question":"Why memoization helps Fibonacci?","options":["Caches repeated sub-results","Eliminates all recursion","Sorts inputs first"],"answerIndex":0}
  ]$$::jsonb,
  'Modify factorial to count how many recursive calls are made.',
  null,
  array['recursion','call-stack','memoization','fibonacci','factorial','algorithms'],
  'concept',
  E'def factorial(n, calls=0):\n    calls += 1\n    if n <= 1:\n        return 1, calls\n    value, calls = factorial(n - 1, calls)\n    return n * value, calls\n'
),
(
  'sec-never-store-passwords-plaintext-01',
  'secure-networking',
  'Never Store Passwords in Plaintext',
  'Learn why plaintext password storage is unsafe and how salted hashing mitigates risk.',
  'beginner',
  4,
  '["sec-hashing-01"]'::jsonb,
  $$[
    {"type":"list","title":"What you'll learn","items":[
      "Why plaintext passwords are dangerous",
      "What salted hashing provides",
      "Why bcrypt/argon2 are recommended"
    ]},
    {"type":"text","title":"Concept","body":"Store one-way password hashes with per-user salt. Avoid fast hash-only schemes for passwords."},
    {"type":"code","title":"Example","code":"import hashlib, secrets\npassword = 'MySecurePass123!'\nbad = hashlib.md5(password.encode()).hexdigest()\nsalt = secrets.token_bytes(16)\nbetter = hashlib.sha256(salt + password.encode()).hexdigest()\nprint('Use bcrypt/argon2 in production')"},
    {"type":"list","title":"Hint Tiers","items":[
      "Hint 1: Attackers can test huge password lists quickly",
      "Hint 2: Salt changes hash even for same password",
      "Full Hint: Slow salted hashing raises brute-force cost and blocks rainbow-table reuse."
    ]}
  ]$$::jsonb,
  $$[
    {"id":"sec-never-store-passwords-plaintext-01-q1","question":"Why are fast hashes like MD5 bad for passwords?","options":["They are too fast against brute-force attacks","They cannot hash strings","They are not deterministic"],"answerIndex":0},
    {"id":"sec-never-store-passwords-plaintext-01-q2","question":"What is salt for?","options":["Ensure identical passwords do not share identical stored hashes","Make hashes reversible","Replace hashing algorithm"],"answerIndex":0}
  ]$$::jsonb,
  'Explain what bcrypt work factor controls and why increasing it affects both security and login cost.',
  null,
  array['passwords','security','hashing','salts','authentication','best-practices'],
  'concept',
  E'# Never store plaintext passwords.\n# Mention salts and bcrypt/argon2 in your explanation.\n'
),
(
  'sec-input-validation-trust-boundaries-01',
  'secure-networking',
  'Input Validation and Trust Boundaries',
  'Validate untrusted input at system boundaries and use parameterized queries.',
  'beginner',
  5,
  '["sec-never-store-passwords-plaintext-01"]'::jsonb,
  $$[
    {"type":"list","title":"What you'll learn","items":[
      "Identify trust boundaries",
      "Validate and sanitize external input",
      "Avoid common injection-prone patterns"
    ]},
    {"type":"text","title":"Concept","body":"Everything outside your service boundary is untrusted. Validate format, range, and type before processing."},
    {"type":"code","title":"Example","code":"def validate_user_input(value, min_len=1, max_len=20):\n    if not value:\n        return ['required']\n    if len(value) < min_len or len(value) > max_len:\n        return ['invalid length']\n    return []\n\nquery = 'SELECT * FROM users WHERE username = ? AND id = ?'"},
    {"type":"list","title":"Hint Tiers","items":[
      "Hint 1: Client-side checks can be bypassed",
      "Hint 2: Trust boundaries are input entry points",
      "Full Hint: Validate at API/file/db boundaries and reject malformed values early."
    ]}
  ]$$::jsonb,
  $$[
    {"id":"sec-input-validation-trust-boundaries-01-q1","question":"Why validate on server if client also validates?","options":["Client validation can be bypassed","Server cannot validate","Client checks are cryptographically enforced"],"answerIndex":0},
    {"id":"sec-input-validation-trust-boundaries-01-q2","question":"What is a trust boundary?","options":["Where external data enters your system","A frontend component boundary","A test-only mock interface"],"answerIndex":0}
  ]$$::jsonb,
  'Add password strength checks: minimum 8 chars, one number, one uppercase, one special character.',
  null,
  array['validation','security','sql-injection','input-sanitization','trust-boundaries'],
  'concept',
  E'def validate_password_strength(password):\n    errors = []\n    # add required checks\n    return errors\n'
),
(
  'sec-safe-http-requests-error-handling-01',
  'secure-networking',
  'Safe HTTP Requests and Error Handling',
  'Use timeouts, status checks, TLS verification, and response validation for defensive HTTP handling.',
  'beginner',
  5,
  '["sec-input-validation-trust-boundaries-01"]'::jsonb,
  $$[
    {"type":"list","title":"What you'll learn","items":[
      "Make HTTP requests safely with timeouts",
      "Handle errors and unexpected responses",
      "Validate external API response shape"
    ]},
    {"type":"text","title":"Concept","body":"Assume remote services can be slow, unavailable, or malformed. Use timeout, TLS verify, size/status checks, and strict parsing."},
    {"type":"code","title":"Example","code":"import requests\n\ndef safe_http_request(url, timeout=10):\n    response = requests.get(url, timeout=timeout, verify=True)\n    if response.status_code != 200:\n        return False, f'HTTP {response.status_code}'\n    return True, response.text[:200]"},
    {"type":"code","title":"Expected Output","code":"Note: This example demonstrates safe patterns. Browser runner blocks network-focused imports by design."},
    {"type":"list","title":"Hint Tiers","items":[
      "Hint 1: Timeouts prevent hanging calls",
      "Hint 2: TLS verification helps prevent MITM",
      "Full Hint: Pair timeout + verify + status + size + parse checks with targeted exceptions."
    ]}
  ]$$::jsonb,
  $$[
    {"id":"sec-safe-http-requests-error-handling-01-q1","question":"Why set timeout on HTTP requests?","options":["Prevent resource exhaustion from hanging calls","Guarantee 200 status","Disable retries"],"answerIndex":0},
    {"id":"sec-safe-http-requests-error-handling-01-q2","question":"What does TLS certificate verification mitigate?","options":["Server impersonation / MITM risk","Python syntax errors","Array index bugs"],"answerIndex":0}
  ]$$::jsonb,
  'Add retry logic with exponential backoff for temporary failures (429/503).',
  E'Note: This example requires requests and network access.\nIn this browser runner, network-focused imports are intentionally blocked.',
  array['http','requests','security','error-handling','timeouts','ssl'],
  'concept',
  E'# Outline safe request flow:\n# timeout, verify TLS, check status, enforce size limits, parse safely, handle exceptions.\n'
)
on conflict (id) do update set
  track_id = excluded.track_id,
  title = excluded.title,
  summary = excluded.summary,
  difficulty = excluded.difficulty,
  estimated_minutes = excluded.estimated_minutes,
  prerequisites = excluded.prerequisites,
  content_blocks = excluded.content_blocks,
  quiz = excluded.quiz,
  practice_prompt = excluded.practice_prompt,
  expected_output = excluded.expected_output,
  tags = excluded.tags,
  evaluation_type = excluded.evaluation_type,
  starter_code = excluded.starter_code,
  updated_at = now();
