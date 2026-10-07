/* Curriculum catalogue (landing dashboard + navbar menu).
   status: 'live'    = at least one fully animated step engine
           'preview' = annotated pseudo-code + explanations, animation planned (UI scaffold ready for expansion) */
export const TIERS = [
  {
    id: 't1', title: 'Data Structures', kicker: 'Tier 1', advanced: false,
    blurb: 'The foundations: how to measure algorithms and how data is searched, ordered and walked.',
    topics: [
      { id: 'recursion', title: 'Recursion', hard: 'Call stacks and branching are invisible in memory.', status: 'live', tag: 'Call stack · Tree' },
      { id: 'sorting', title: 'Sorting', hard: 'Swaps and splits happen faster than you can follow.', status: 'live', tag: 'Merge · Quick · Bubble · Insertion' },
      { id: 'searching', title: 'Searching', hard: 'Shrinking search windows are hard to picture.', status: 'live', tag: 'Binary · Linear' },
      { id: 'twopointers', title: 'Two Pointers', hard: 'Why moving one pointer is safe is not obvious.', status: 'live', tag: 'Two-sum · Palindrome · Water' },
      { id: 'trees', title: 'Tree Traversals', hard: 'Which node comes next, and what is on the stack?', status: 'live', tag: 'In/Pre/Post-order · Level-order' },
      { id: 'graphs', title: 'Graph Traversals', hard: 'Cycles: how does the visited set save you?', status: 'live', tag: 'BFS · DFS · Visited set' },
      { id: 'complexity', title: 'Complexity Analysis', hard: 'Big-O, Ω and Θ are symbols until you see the curves.', status: 'live', tag: 'Growth curves · Θ bounds' },
    ],
  },
  {
    id: 't2', title: 'Core DAA', kicker: 'Tier 2', advanced: false,
    blurb: 'Two foundational strategies for designing algorithms, each with a flagship animation.',
    topics: [
      { id: 'backtracking', title: 'Backtracking', hard: 'The "undo" step is where learners get lost.', status: 'live', tag: 'N-Queens' },
      { id: 'greedy', title: 'Greedy Approach', hard: 'Why the local choice is globally safe.', status: 'live', tag: 'Activity selection' },
    ],
  },
  {
    id: 't3', title: 'Intermediate & Advanced DAA', kicker: 'Tier 3', advanced: true,
    blurb: 'Graduate-level techniques. One flagship per category is fully animated; the rest ship as annotated scaffolds.',
    topics: [
      { id: 'advdc', title: 'Advanced Divide & Conquer', hard: 'Why 7 multiplications beat 8.', status: 'live', tag: "Strassen (animated) · FFT · Closest pair" },
      { id: 'dp', title: 'Dynamic Programming', hard: 'Tables fill up, but what depends on what?', status: 'live', tag: '0/1 Knapsack · MCM · LCS · Bitmask' },
      { id: 'advgraphs', title: 'Advanced Graphs', hard: 'Priority queues, residual edges and low-links.', status: 'live', tag: "Dijkstra · A* (animated) · Tarjan · Max-flow" },
      { id: 'strgeo', title: 'String & Geometric', hard: 'KMP never moves backwards in the text. Why?', status: 'live', tag: 'KMP (animated) · Rabin-Karp · Convex hull' },
    ],
  },
];

export const ALL_TOPICS = TIERS.flatMap((t) => t.topics.map((x) => ({ ...x, tier: t.id, tierTitle: t.title, advanced: t.advanced })));
export const topicById = (id) => ALL_TOPICS.find((t) => t.id === id);
