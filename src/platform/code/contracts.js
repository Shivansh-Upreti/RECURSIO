/* Contracts for the "My code" workspace. A contract says: which function the learner must define, what inputs to call
   it with, and how to judge the result (using a trusted reference implementation that runs on the main thread).
   Learner code itself only ever runs inside the sandbox worker. Keyed by algorithm id. */

const sortedCopy = (a) => [...a].sort((x, y) => x - y);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* deterministic pseudo-random numbers so stress tests are reproducible */
function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const randArr = (n, seed, max = 1000) => { const r = rng(seed); return Array.from({ length: n }, () => Math.floor(r() * max)); };

/* ---------- reference helpers ---------- */
function bst(values) {
  let root = null;
  for (const v of values) {
    const node = { val: v, left: null, right: null };
    if (!root) { root = node; continue; }
    let c = root;
    for (;;) { if (v < c.val) { if (c.left) c = c.left; else { c.left = node; break; } } else if (c.right) c = c.right; else { c.right = node; break; } }
  }
  return root;
}
const pre = (n, o = []) => { if (n) { o.push(n.val); pre(n.left, o); pre(n.right, o); } return o; };
const ino = (n, o = []) => { if (n) { ino(n.left, o); o.push(n.val); ino(n.right, o); } return o; };
const post = (n, o = []) => { if (n) { post(n.left, o); post(n.right, o); o.push(n.val); } return o; };
const level = (n) => { const o = [], q = n ? [n] : []; while (q.length) { const x = q.shift(); o.push(x.val); if (x.left) q.push(x.left); if (x.right) q.push(x.right); } return o; };

const GRAPH = { A: ['B', 'D'], B: ['A', 'C', 'E'], C: ['B', 'E'], D: ['A', 'E', 'F'], E: ['B', 'C', 'D', 'G'], F: ['D', 'G'], G: ['E', 'F'] };
const refBfs = (g, s) => { const seen = new Set([s]), q = [s], o = []; while (q.length) { const u = q.shift(); o.push(u); for (const v of g[u]) if (!seen.has(v)) { seen.add(v); q.push(v); } } return o; };
const refDfs = (g, s) => { const seen = new Set(), o = []; const go = (u) => { seen.add(u); o.push(u); for (const v of g[u]) if (!seen.has(v)) go(v); }; go(s); return o; };

const WG = { A: { B: 7, C: 9, F: 14 }, B: { A: 7, C: 10, D: 15 }, C: { A: 9, B: 10, D: 11, F: 2 }, D: { B: 15, C: 11, E: 6 }, E: { D: 6, F: 9 }, F: { A: 14, C: 2, E: 9 }, Z: {} };
function refDijkstra(g, s) {
  const d = {}; for (const v in g) d[v] = Infinity; d[s] = 0; const done = new Set();
  for (;;) { let u = null; for (const v in d) if (!done.has(v) && (u === null || d[v] < d[u])) u = v; if (u === null || d[u] === Infinity) break; done.add(u); for (const [v, w] of Object.entries(g[u])) d[v] = Math.min(d[v], d[u] + w); }
  return d;
}
const refQueens = (n) => { let c = 0; const cols = [], go = (r) => { if (r === n) { c++; return; } for (let k = 0; k < n; k++) { if (cols.every((x, i) => x !== k && Math.abs(x - k) !== r - i)) { cols[r] = k; go(r + 1); cols.length = r; } } }; go(0); return c; };
const refActs = (acts) => { const s = [...acts].sort((a, b) => a[1] - b[1]); let last = -Infinity, n = 0; for (const [a, b] of s) if (a >= last) { n++; last = b; } return n; };
const refKnap = (w, v, W) => { const dp = Array(W + 1).fill(0); w.forEach((wi, i) => { for (let c = W; c >= wi; c--) dp[c] = Math.max(dp[c], dp[c - wi] + v[i]); }); return dp[W]; };
const refLcs = (x, y) => { const dp = Array.from({ length: x.length + 1 }, () => Array(y.length + 1).fill(0)); for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) dp[i][j] = x[i - 1] === y[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]); return dp[x.length][y.length]; };
const refCoins = (c, a) => { const dp = Array(a + 1).fill(Infinity); dp[0] = 0; for (let i = 1; i <= a; i++) for (const k of c) if (k <= i) dp[i] = Math.min(dp[i], dp[i - k] + 1); return dp[a] === Infinity ? -1 : dp[a]; };
const refMcm = (p) => { const n = p.length - 1, dp = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0)); for (let len = 2; len <= n; len++) for (let i = 1; i + len - 1 <= n; i++) { const j = i + len - 1; dp[i][j] = Infinity; for (let k = i; k < j; k++) dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j]); } return dp[1][n]; };
const refKmp = (t, p) => t.indexOf(p);
const refMul = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
const refArea = (h) => { let b = 0; for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) b = Math.max(b, Math.min(h[i], h[j]) * (j - i)); return b; };

const sortTests = () => [[5, 2, 9, 1, 7, 3], [], [1], [3, 3, 1, 2, 3], [9, 8, 7, 6, 5, 4, 3, 2, 1], [1, 2, 3, 4, 5], [-4, 10, 0, -4, 7]].map((a) => ({ label: JSON.stringify(a), args: [a], expectedArgs: sortedCopy(a) }));
const sortCheck = (got, args, test, after) => { const r = Array.isArray(got) ? got : after[0]; return { ok: same(r, test.expectedArgs), expected: test.expectedArgs }; };

const mk = (fn, starter, tests, check, extra) => ({ fn, starter, tests, check, examples: [], ...extra });

export const CONTRACTS = {
  bubble: mk('bubbleSort', `function bubbleSort(a) {
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return a;
}`, sortTests(), sortCheck, { examples: [
    { label: 'Bug: sorts descending', code: `function bubbleSort(a) {
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] < a[j + 1]) {
        const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
      }
    }
  }
  return a;
}` },
    { label: 'Works, but wasteful', code: `function bubbleSort(a) {
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1; j++) {
      if (a[j] > a[j + 1]) {
        const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
      }
    }
  }
  return a;
}` }] }),
  insertion: mk('insertionSort', `function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
  return a;
}`, sortTests(), sortCheck, { examples: [{ label: 'Bug: never inserts at index 0', code: `function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j > 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
  return a;
}` }] }),
  merge: mk('mergeSort', `function mergeSort(a) {
  if (a.length <= 1) return a;
  const mid = Math.floor(a.length / 2);
  const left = mergeSort(a.slice(0, mid));
  const right = mergeSort(a.slice(mid));
  const out = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) out.push(left[i++]); else out.push(right[j++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}`, sortTests(), sortCheck, { examples: [{ label: 'Bug: base case too small', code: `function mergeSort(a) {
  if (a.length < 1) return a;
  const mid = Math.floor(a.length / 2);
  const left = mergeSort(a.slice(0, mid));
  const right = mergeSort(a.slice(mid));
  const out = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) out.push(left[i++]); else out.push(right[j++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}` }] }),
  quick: mk('quickSort', `function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return a;
  const pivot = a[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }
  }
  [a[i], a[hi]] = [a[hi], a[i]];
  quickSort(a, lo, i - 1);
  quickSort(a, i + 1, hi);
  return a;
}`, sortTests(), sortCheck, { examples: [{ label: 'Bug: pivot included in recursion', code: `function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return a;
  const pivot = a[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }
  }
  [a[i], a[hi]] = [a[hi], a[i]];
  quickSort(a, lo, i);
  quickSort(a, i + 1, hi);
  return a;
}` }] }),

  binary: mk('binarySearch', `function binarySearch(a, target) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (a[mid] === target) return mid;
    if (a[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`, [[[2, 5, 8, 12, 16, 23, 38, 56], 23], [[2, 5, 8, 12, 16, 23, 38, 56], 2], [[2, 5, 8, 12, 16, 23, 38, 56], 56], [[2, 5, 8, 12, 16, 23, 38, 56], 7], [[], 3], [[4], 4], [[4], 5], [[1, 3, 5, 7, 9, 11], 11]].map(([a, t]) => ({ label: `${JSON.stringify(a)} find ${t}`, args: [a, t] })),
  (got, args) => { const [a, t] = args; const present = a.includes(t); return { ok: present ? (Number.isInteger(got) && a[got] === t) : got === -1, expected: present ? `an index i with a[i] = ${t}` : -1 }; },
  { stress: { build: () => { const a = Array.from({ length: 200000 }, (_, i) => i * 2); return { args: [a, 399998], repeat: 2500 }; }, slowMs: 150, hint: 'binary search should finish 2,500 lookups in 200,000 items almost instantly' },
    examples: [
      { label: 'Bugs: off-by-one', code: `function binarySearch(a, target) {
  let lo = 0, hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) / 2;
    if (a[mid] === target) return mid;
    if (a[mid] < target) lo = mid;
    else hi = mid;
  }
  return -1;
}` },
      { label: 'Works, but linear (slow)', code: `function binarySearch(a, target) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === target) return i;
  }
  return -1;
}` }] }),
  linear: mk('linearSearch', `function linearSearch(a, target) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === target) return i;
  }
  return -1;
}`, [[[4, 8, 15, 16, 23, 42], 23], [[4, 8, 15, 16, 23, 42], 4], [[4, 8, 15, 16, 23, 42], 99], [[], 1], [[7, 7, 7], 7]].map(([a, t]) => ({ label: `${JSON.stringify(a)} find ${t}`, args: [a, t] })),
  (got, args) => ({ ok: got === args[0].indexOf(args[1]), expected: args[0].indexOf(args[1]) }),
  { examples: [{ label: 'Bug: reads past the end', code: `function linearSearch(a, target) {
  for (let i = 0; i <= a.length; i++) {
    if (a[i] === target) return i;
  }
  return -1;
}` }] }),

  twosum: mk('twoSumSorted', `function twoSumSorted(a, target) {
  let l = 0, r = a.length - 1;
  while (l < r) {
    const sum = a[l] + a[r];
    if (sum === target) return [l, r];
    if (sum < target) l++;
    else r--;
  }
  return null;
}`, [[[1, 3, 4, 6, 8, 11, 15], 14], [[1, 3, 4, 6, 8, 11, 15], 100], [[2, 7, 11, 15], 9], [[5], 10], [[3, 3], 6], [[1, 2, 3, 4, 5], 8]].map(([a, t]) => ({ label: `${JSON.stringify(a)} sum ${t}`, args: [a, t] })),
  (got, args) => { const [a, t] = args; let exists = false; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] + a[j] === t) exists = true;
    if (!exists) return { ok: got === null || got === undefined || (Array.isArray(got) && !got.length) || got === -1 || got === false, expected: 'no pair (null)' };
    return { ok: Array.isArray(got) && got.length === 2 && got[0] !== got[1] && a[got[0]] + a[got[1]] === t, expected: `indices of a pair summing to ${t}` }; },
  { examples: [
    { label: 'Bug: pointers move the wrong way', code: `function twoSumSorted(a, target) {
  let l = 0, r = a.length - 1;
  while (l < r) {
    const sum = a[l] + a[r];
    if (sum === target) return [l, r];
    if (sum < target) r--;
    else l++;
  }
  return null;
}` },
    { label: 'Bug: l <= r reuses an element', code: `function twoSumSorted(a, target) {
  let l = 0, r = a.length - 1;
  while (l <= r) {
    const sum = a[l] + a[r];
    if (sum === target) return [l, r];
    if (sum < target) l++;
    else r--;
  }
  return null;
}` }] }),
  palindrome: mk('isPalindrome', `function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return false;
    l++; r--;
  }
  return true;
}`, ['racecar', 'abba', 'abc', '', 'a', 'abca'].map((s) => ({ label: JSON.stringify(s), args: [s] })), (got, args) => { const s = args[0]; const exp = s === [...s].reverse().join(''); return { ok: got === exp, expected: exp }; }),
  water: mk('maxArea', `function maxArea(h) {
  let l = 0, r = h.length - 1, best = 0;
  while (l < r) {
    best = Math.max(best, Math.min(h[l], h[r]) * (r - l));
    if (h[l] < h[r]) l++;
    else r--;
  }
  return best;
}`, [[1, 8, 6, 2, 5, 4, 8, 3, 7], [1, 1], [4, 3, 2, 1, 4], [1, 2, 1], [5]].map((h) => ({ label: JSON.stringify(h), args: [h] })), (got, args) => ({ ok: got === refArea(args[0]), expected: refArea(args[0]) })),

  inorder: mk('inorder', `function inorder(root) {
  if (!root) return [];
  return [...inorder(root.left), root.val, ...inorder(root.right)];
}`, [[50, 30, 70, 20, 40, 60, 80], [5], [], [3, 1, 2], [1, 2, 3, 4]].map((v) => ({ label: 'BST of ' + JSON.stringify(v), args: [bst(v)] })), (got, args) => ({ ok: same(got, ino(args[0])), expected: ino(args[0]) })),
  preorder: mk('preorder', `function preorder(root) {
  if (!root) return [];
  return [root.val, ...preorder(root.left), ...preorder(root.right)];
}`, [[50, 30, 70, 20, 40, 60, 80], [5], [], [3, 1, 2], [1, 2, 3, 4]].map((v) => ({ label: 'BST of ' + JSON.stringify(v), args: [bst(v)] })), (got, args) => ({ ok: same(got, pre(args[0])), expected: pre(args[0]) })),
  postorder: mk('postorder', `function postorder(root) {
  if (!root) return [];
  return [...postorder(root.left), ...postorder(root.right), root.val];
}`, [[50, 30, 70, 20, 40, 60, 80], [5], [], [3, 1, 2], [1, 2, 3, 4]].map((v) => ({ label: 'BST of ' + JSON.stringify(v), args: [bst(v)] })), (got, args) => ({ ok: same(got, post(args[0])), expected: post(args[0]) })),
  levelorder: mk('levelOrder', `function levelOrder(root) {
  const out = [], queue = root ? [root] : [];
  while (queue.length) {
    const node = queue.shift();
    out.push(node.val);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return out;
}`, [[50, 30, 70, 20, 40, 60, 80], [5], [], [3, 1, 2], [1, 2, 3, 4]].map((v) => ({ label: 'BST of ' + JSON.stringify(v), args: [bst(v)] })), (got, args) => ({ ok: same(got, level(args[0])), expected: level(args[0]) })),

  bfs: mk('bfs', `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const order = [];
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const v of graph[u]) {
      if (!visited.has(v)) {
        visited.add(v);
        queue.push(v);
      }
    }
  }
  return order;
}`, ['A', 'E', 'G'].map((s) => ({ label: 'campus graph from ' + s, args: [GRAPH, s] })), (got, args) => ({ ok: same(got, refBfs(...args)), expected: refBfs(...args) }), { examples: [{ label: 'Bug: no visited set (cycles!)', code: `function bfs(graph, start) {
  const queue = [start];
  const order = [];
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const v of graph[u]) queue.push(v);
  }
  return order;
}` }] }),
  dfs: mk('dfs', `function dfs(graph, start) {
  const visited = new Set();
  const order = [];
  function go(u) {
    visited.add(u);
    order.push(u);
    for (const v of graph[u]) {
      if (!visited.has(v)) go(v);
    }
  }
  go(start);
  return order;
}`, ['A', 'E', 'G'].map((s) => ({ label: 'campus graph from ' + s, args: [GRAPH, s] })), (got, args) => ({ ok: same(got, refDfs(...args)), expected: refDfs(...args) })),

  nqueens: mk('countQueens', `function countQueens(n) {
  const cols = [];
  let count = 0;
  function safe(row, col) {
    for (let r = 0; r < row; r++) {
      if (cols[r] === col || Math.abs(cols[r] - col) === row - r) return false;
    }
    return true;
  }
  function place(row) {
    if (row === n) { count++; return; }
    for (let col = 0; col < n; col++) {
      if (safe(row, col)) {
        cols[row] = col;      // choose
        place(row + 1);       // explore
        cols.pop();           // un-choose (backtrack)
      }
    }
  }
  place(0);
  return count;
}`, [1, 4, 5, 6, 8].map((n) => ({ label: `n = ${n}`, args: [n] })), (got, args) => ({ ok: got === refQueens(args[0]), expected: refQueens(args[0]) }), { examples: [
    { label: 'Bug: forgets to backtrack', code: `function countQueens(n) {
  const queens = [];            // queens[r] = column of the queen in row r
  let count = 0;
  function safe(col) {
    const row = queens.length;
    for (let r = 0; r < queens.length; r++) {
      if (queens[r] === col || Math.abs(queens[r] - col) === row - r) return false;
    }
    return true;
  }
  function place(row) {
    if (row === n) { count++; return; }
    for (let col = 0; col < n; col++) {
      if (safe(col)) {
        queens.push(col);
        place(row + 1);
      }
    }
  }
  place(0);
  return count;
}` },
    { label: 'Bug: ignores diagonals', code: `function countQueens(n) {
  const cols = [];
  let count = 0;
  function safe(row, col) {
    for (let r = 0; r < row; r++) {
      if (cols[r] === col) return false;
    }
    return true;
  }
  function place(row) {
    if (row === n) { count++; return; }
    for (let col = 0; col < n; col++) {
      if (safe(row, col)) {
        cols[row] = col;
        place(row + 1);
        cols.pop();
      }
    }
  }
  place(0);
  return count;
}` }] }),
  activity: mk('maxActivities', `function maxActivities(acts) {
  const sorted = [...acts].sort((a, b) => a[1] - b[1]);   // earliest finish first
  let count = 0, last = -Infinity;
  for (const [start, finish] of sorted) {
    if (start >= last) {
      count++;
      last = finish;
    }
  }
  return count;
}`, [[[1, 4], [3, 5], [0, 6], [5, 7], [3, 9], [5, 9], [6, 10], [8, 11], [8, 12], [2, 14], [12, 16]], [[1, 2], [2, 3], [3, 4]], [[1, 10], [2, 3], [4, 5]], [], [[5, 6]]].map((a) => ({ label: JSON.stringify(a), args: [a] })), (got, args) => ({ ok: got === refActs(args[0]), expected: refActs(args[0]) }), { examples: [
    { label: 'Bug: sorted by start time', code: `function maxActivities(acts) {
  const sorted = [...acts].sort((a, b) => a[0] - b[0]);
  let count = 0, last = -Infinity;
  for (const [start, finish] of sorted) {
    if (start >= last) {
      count++;
      last = finish;
    }
  }
  return count;
}` },
    { label: 'Bug: strict > on touching intervals', code: `function maxActivities(acts) {
  const sorted = [...acts].sort((a, b) => a[1] - b[1]);
  let count = 0, last = -Infinity;
  for (const [start, finish] of sorted) {
    if (start > last) {
      count++;
      last = finish;
    }
  }
  return count;
}` }] }),

  knapsack: mk('knapsack', `function knapsack(w, v, W) {
  const n = w.length;
  const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let c = 0; c <= W; c++) {
      dp[i][c] = dp[i - 1][c];                                         // skip item i
      if (w[i - 1] <= c) dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - w[i - 1]] + v[i - 1]);   // take item i
    }
  }
  return dp[n][W];
}`, [[[1, 3, 4, 5], [1, 4, 5, 7], 7], [[10, 20, 30], [60, 100, 120], 50], [[5], [10], 4], [[2, 2], [3, 3], 4], [[], [], 5]].map(([w, v, W]) => ({ label: `w${JSON.stringify(w)} v${JSON.stringify(v)} W${W}`, args: [w, v, W] })), (got, args) => ({ ok: got === refKnap(...args), expected: refKnap(...args) }), { examples: [{ label: 'Bug: item can be reused (unbounded)', code: `function knapsack(w, v, W) {
  const n = w.length;
  const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let c = 0; c <= W; c++) {
      dp[i][c] = dp[i - 1][c];
      if (w[i - 1] <= c) dp[i][c] = Math.max(dp[i][c], dp[i][c - w[i - 1]] + v[i - 1]);
    }
  }
  return dp[n][W];
}` }] }),
  lcs: mk('lcs', `function lcs(X, Y) {
  const m = X.length, n = Y.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (X[i - 1] === Y[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}`, [['ABCBDAB', 'BDCABA'], ['', 'ABC'], ['ABC', 'ABC'], ['AXYT', 'AYZX'], ['ABC', 'DEF']].map((a) => ({ label: a.map((s) => JSON.stringify(s)).join(' vs '), args: a })), (got, args) => ({ ok: got === refLcs(...args), expected: refLcs(...args) })),
  coins: mk('minCoins', `function minCoins(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`, [[[1, 5, 6], 10], [[2], 3], [[1, 2, 5], 11], [[3, 7], 0], [[5, 10], 7]].map(([c, a]) => ({ label: `coins ${JSON.stringify(c)} amount ${a}`, args: [c, a] })), (got, args) => ({ ok: got === refCoins(...args), expected: refCoins(...args) }), { examples: [{ label: 'Bug: dp initialised with 0', code: `function minCoins(coins, amount) {
  const dp = Array(amount + 1).fill(0);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}` }] }),
  mcm: mk('matrixChain', `function matrixChain(p) {
  const n = p.length - 1;
  const dp = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
  for (let len = 2; len <= n; len++) {
    for (let i = 1; i + len - 1 <= n; i++) {
      const j = i + len - 1;
      dp[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j];
        if (cost < dp[i][j]) dp[i][j] = cost;
      }
    }
  }
  return n < 1 ? 0 : dp[1][n];
}`, [[10, 30, 5, 60], [10, 30, 5, 60, 20], [40, 20, 30, 10, 30], [5, 10], [3, 4, 5]].map((p) => ({ label: 'p = ' + JSON.stringify(p), args: [p] })), (got, args) => ({ ok: got === refMcm(args[0]), expected: refMcm(args[0]) })),

  dijkstra: mk('dijkstra', `function dijkstra(graph, src) {
  const dist = {};
  for (const v in graph) dist[v] = Infinity;
  dist[src] = 0;
  const done = new Set();
  while (true) {
    let u = null;
    for (const v in dist) if (!done.has(v) && (u === null || dist[v] < dist[u])) u = v;
    if (u === null || dist[u] === Infinity) break;
    done.add(u);
    for (const [v, w] of Object.entries(graph[u])) {
      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
  }
  return dist;
}`, ['A', 'E', 'F'].map((s) => ({ label: 'roads graph from ' + s + ' (Z is unreachable)', args: [WG, s] })), (got, args) => { const e = refDijkstra(...args); return { ok: Object.keys(e).every((k) => got && got[k] === e[k]), expected: e }; }),

  kmp: mk('kmpSearch', `function kmpSearch(text, pat) {
  if (pat.length === 0) return 0;
  const lps = Array(pat.length).fill(0);
  for (let k = 1, len = 0; k < pat.length;) {
    if (pat[k] === pat[len]) lps[k++] = ++len;
    else if (len > 0) len = lps[len - 1];
    else lps[k++] = 0;
  }
  let i = 0, j = 0;
  while (i < text.length) {
    if (text[i] === pat[j]) { i++; j++; }
    if (j === pat.length) return i - j;
    if (i < text.length && text[i] !== pat[j]) {
      if (j > 0) j = lps[j - 1];
      else i++;
    }
  }
  return -1;
}`, [['ABABDABACDABABCABAB', 'ABABCABAB'], ['AAAAAB', 'AAB'], ['hello world', 'o w'], ['abc', 'd'], ['aaa', 'aaaa'], ['abc', '']].map(([t, p]) => ({ label: `${JSON.stringify(t)} / ${JSON.stringify(p)}`, args: [t, p] })), (got, args) => ({ ok: got === refKmp(...args), expected: refKmp(...args) })),

  strassen: mk('strassen2x2', `function strassen2x2(A, B) {
  const [[a, b], [c, d]] = A, [[e, f], [g, h]] = B;
  const M1 = (a + d) * (e + h);
  const M2 = (c + d) * e;
  const M3 = a * (f - h);
  const M4 = d * (g - e);
  const M5 = (a + b) * h;
  const M6 = (c - a) * (e + f);
  const M7 = (b - d) * (g + h);
  return [[M1 + M4 - M5 + M7, M3 + M5],
          [M2 + M4, M1 - M2 + M3 + M6]];
}`, [[[[1, 3], [7, 5]], [[6, 8], [4, 2]]], [[[1, 0], [0, 1]], [[9, 8], [7, 6]]], [[[2, -1], [0, 3]], [[1, 4], [-2, 5]]]].map(([A, B]) => ({ label: `${JSON.stringify(A)} × ${JSON.stringify(B)}`, args: [A, B] })), (got, args) => ({ ok: same(got, refMul(...args)), expected: refMul(...args) })),
};

/** Algorithms without a contract still get a plain "run my code" scratchpad. */
export const GENERIC_STARTER = `// No automatic tests exist for this algorithm yet.
// Write any JavaScript here and press Run; print(...) shows output.
function demo() {
  return 1 + 1;
}
print(demo());
`;
