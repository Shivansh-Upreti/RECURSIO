import advdp from './advdp.js';
import { collect } from './common.js';

/* Frame viz: { rows:[label], cols:[label], cells:[[number|null]], cur:[r,c]|null, deps:[[r,c]], path:[[r,c]], formula, answer, corner? }
   null = not computed yet. Infinity is shown as ∞. */

const LCS = `function lcs(X, Y) {
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (X[i - 1] === Y[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];   // walk back from here to recover the subsequence
}`;

const KNAP = `function knapsack(w, v, W) {
  const dp = Array(n + 1).fill().map(() => Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let c = 0; c <= W; c++) {
      dp[i][c] = dp[i - 1][c];                  // skip item i
      if (w[i - 1] <= c)
        dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - w[i - 1]] + v[i - 1]);   // take item i
    }
  }
  return dp[n][W];
}`;

const COINS = `function minCoins(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`;

const copy = (g) => g.map((r) => [...r]);

function lcs({ a, b }) {
  const X = [...String(a).toUpperCase()].slice(0, 8), Y = [...String(b).toUpperCase()].slice(0, 8), m = X.length, n = Y.length;
  return collect((F) => {
    const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 || j === 0 ? 0 : null)));
    const v = (extra) => ({ rows: ['', ...X], cols: ['', ...Y], cells: copy(dp), cur: null, deps: [], path: [], formula: '', answer: null, ...extra });
    F.add(2, `Table dp[i][j] = length of the LCS of the first i letters of X and first j letters of Y. Row 0 and column 0 are 0 (an empty prefix).`, 'info', v());
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      if (X[i - 1] === Y[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        F.add(5, `X[${i}] = "${X[i - 1]}" equals Y[${j}] = "${Y[j - 1]}": extend the diagonal. dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]}.`, 'match', v({ cur: [i, j], deps: [[i - 1, j - 1]], formula: `${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}` }));
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        F.add(6, `"${X[i - 1]}" ≠ "${Y[j - 1]}": take the better of skipping a letter of X (above) or of Y (left). max(${dp[i - 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}.`, 'compare', v({ cur: [i, j], deps: [[i - 1, j], [i, j - 1]], formula: `max(${dp[i - 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}` }));
      }
    }
    F.add(9, `Table complete. The LCS length is dp[${m}][${n}] = ${dp[m][n]}. Now walk back to recover the letters.`, 'done', v({ cur: [m, n], answer: dp[m][n] }));
    let i = m, j = n; const path = [[i, j]], letters = [];
    while (i > 0 && j > 0) {
      if (X[i - 1] === Y[j - 1]) { letters.unshift(X[i - 1]); i--; j--; }
      else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
      path.push([i, j]);
      F.add(9, `Walking back: ${path.length > 1 && letters.length ? 'letters so far "' + letters.join('') + '"' : 'no letters yet'}.`, 'trace', v({ cur: [i, j], path: path.map((p) => [...p]), answer: dp[m][n] }));
    }
    F.add(9, `LCS = "${letters.join('')}" (length ${dp[m][n]}).`, 'done', v({ path, answer: dp[m][n] }));
  });
}

function knapsack({ w, v: vals, cap }) {
  const n = Math.min(w.length, vals.length, 5), W = cap;
  const wt = w.slice(0, n).map((x) => Math.max(1, Math.floor(x))), val = vals.slice(0, n);
  return collect((F) => {
    const dp = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: W + 1 }, (_, c) => (i === 0 ? 0 : null)));
    const vz = (extra) => ({ rows: ['none', ...wt.map((x, i) => `item ${i + 1} (w${x}, v${val[i]})`)], cols: Array.from({ length: W + 1 }, (_, c) => String(c)), cells: copy(dp), cur: null, deps: [], path: [], formula: '', answer: null, ...extra });
    F.add(2, `dp[i][c] = best value using the first i items with capacity c. Row 0 (no items) is all zeros.`, 'info', vz());
    for (let i = 1; i <= n; i++) for (let c = 0; c <= W; c++) {
      const skip = dp[i - 1][c];
      dp[i][c] = skip;
      if (wt[i - 1] <= c) {
        const take = dp[i - 1][c - wt[i - 1]] + val[i - 1];
        dp[i][c] = Math.max(skip, take);
        F.add(7, `Item ${i} fits (w=${wt[i - 1]} ≤ ${c}). Skip = ${skip}, Take = dp[${i - 1}][${c - wt[i - 1]}] + ${val[i - 1]} = ${take}. Best = ${dp[i][c]}.`, take > skip ? 'pick' : 'compare', vz({ cur: [i, c], deps: [[i - 1, c], [i - 1, c - wt[i - 1]]], formula: `max(${skip}, ${take}) = ${dp[i][c]}` }));
      } else {
        F.add(5, `Item ${i} is too heavy for capacity ${c} (w=${wt[i - 1]}). Copy the value from above: ${skip}.`, 'reject', vz({ cur: [i, c], deps: [[i - 1, c]], formula: `${skip}` }));
      }
    }
    F.add(10, `Maximum value with capacity ${W}: dp[${n}][${W}] = ${dp[n][W]}. Trace back to see which items were taken.`, 'done', vz({ cur: [n, W], answer: dp[n][W] }));
    let c = W; const taken = [], path = [[n, W]];
    for (let i = n; i >= 1; i--) {
      if (dp[i][c] !== dp[i - 1][c]) { taken.push(i); c -= wt[i - 1]; }
      path.push([i - 1, c]);
      F.add(10, taken.includes(i) ? `dp[${i}] differs from the row above: item ${i} was TAKEN. Remaining capacity ${c}.` : `Same as the row above: item ${i} was NOT taken.`, 'trace', vz({ cur: [i - 1, c], path: path.map((p) => [...p]), answer: dp[n][W] }));
    }
    F.add(10, `Take items ${taken.sort((a, b) => a - b).join(', ') || '(none)'} for a total value of ${dp[n][W]}.`, 'done', vz({ path, answer: dp[n][W] }));
  });
}

function coins({ coins: cs, amount }) {
  const coinsArr = cs.map((x) => Math.floor(x)).filter((x) => x > 0).slice(0, 4);
  return collect((F) => {
    const dp = Array(amount + 1).fill(null); dp[0] = 0;
    const vz = (extra) => ({ rows: ['fewest coins'], cols: Array.from({ length: amount + 1 }, (_, a) => String(a)), cells: [[...dp]], cur: null, deps: [], path: [], formula: '', answer: null, ...extra });
    F.add(3, `dp[a] = fewest coins to make amount a. dp[0] = 0 (no coins). Everything else starts unknown (∞).`, 'info', vz());
    for (let a = 1; a <= amount; a++) {
      let best = Infinity;
      dp[a] = Infinity;
      for (const c of coinsArr) {
        if (c > a) { F.add(6, `Coin ${c} is bigger than ${a}: skip.`, 'reject', vz({ cur: [0, a], formula: `dp[${a}] = ${best === Infinity ? '∞' : best}` })); continue; }
        const cand = dp[a - c] + 1;
        best = Math.min(best, cand); dp[a] = best;
        F.add(6, `Use coin ${c}: dp[${a - c}] + 1 = ${dp[a - c] === Infinity ? '∞' : cand}. Best so far for ${a}: ${best === Infinity ? '∞' : best}.`, cand <= best ? 'pick' : 'compare', vz({ cur: [0, a], deps: [[0, a - c]], formula: `min(…, ${dp[a - c] === Infinity ? '∞' : dp[a - c]} + 1) = ${best === Infinity ? '∞' : best}` }));
      }
    }
    F.add(9, dp[amount] === Infinity ? `Amount ${amount} cannot be made with these coins.` : `The fewest coins for ${amount} is ${dp[amount]}.`, 'done', vz({ cur: [0, amount], answer: dp[amount] === Infinity ? '∞' : dp[amount] }));
  });
}

const MOD = {
  id: 'dp', title: 'Dynamic Programming', branch: 'Tier 3 · Intermediate & Advanced DAA', viz: 'table', advanced: true,
  tagline: 'Watch the table fill cell by cell, and see exactly which earlier cells each answer is built from.',
  params: [],
  algos: [
    { id: 'lcs', title: 'LCS', code: LCS, run: lcs, params: [{ key: 'a', label: 'String X (up to 8)', type: 'text', def: 'ABCBDAB', maxLen: 8 }, { key: 'b', label: 'String Y (up to 8)', type: 'text', def: 'BDCABA', maxLen: 8 }], type: '2-D DP · bottom-up', complexity: { time: 'O(m·n)', space: 'O(m·n)', best: 'Brute force is O(2ⁿ)' },
      idea: 'Solve every prefix pair once and store it. Each cell depends only on its left, upper and upper-left neighbours.',
      think: ['Which cells does each new cell read from? Watch the highlighted dependencies.', 'How does the traceback decide between going up and going left?'], pitfalls: ['Off-by-one between string indices (0-based) and table indices (1-based).'] },
    { id: 'knapsack', title: '0/1 Knapsack', code: KNAP, run: knapsack, type: '2-D DP · bottom-up', params: [{ key: 'w', label: 'Weights (up to 5)', type: 'numlist', def: '1, 3, 4, 5', max: 5 }, { key: 'v', label: 'Values (up to 5)', type: 'numlist', def: '1, 4, 5, 7', max: 5 }, { key: 'cap', label: 'Capacity (1–12)', type: 'int', def: 7, min: 1, max: 12 }],
      complexity: { time: 'O(n·W)', space: 'O(n·W)', best: 'Pseudo-polynomial in W' },
      idea: 'For each item decide: skip it (value from the row above) or take it (value of the smaller capacity plus its value). Keep the better.',
      think: ['Why does "take" look at the row above, not the current row?', 'What changes for the unbounded knapsack?'], pitfalls: ['Runtime depends on the numeric size of W, not just the number of items.'] },
    { id: 'coins', title: 'Coin change (fewest coins)', code: COINS, run: coins, type: '1-D DP · bottom-up', params: [{ key: 'coins', label: 'Coins (up to 4)', type: 'numlist', def: '1, 5, 6', max: 4 }, { key: 'amount', label: 'Amount (1–15)', type: 'int', def: 10, min: 1, max: 15 }],
      complexity: { time: 'O(amount × coins)', space: 'O(amount)', best: 'Greedy can fail here: try 1, 5, 6 and amount 10' },
      idea: 'The best way to make amount a is one coin plus the best way to make a minus that coin. Try every coin and keep the minimum.',
      think: ['With coins 1, 5, 6 and amount 10, what would a greedy "largest coin first" give? Compare with the table.', 'What does ∞ in a cell mean?'], pitfalls: ['Initialising with 0 instead of ∞ silently produces wrong answers.'] },
  ],
};

/* ---- Matrix chain multiplication (interval DP, full animation) ---- */
const MCM_CODE = `function matrixChain(p) {                // matrix i is p[i-1] × p[i]
  for (let len = 2; len <= n; len++) {
    for (let i = 1; i + len - 1 <= n; i++) {
      const j = i + len - 1;  dp[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j];
        if (cost < dp[i][j]) dp[i][j] = cost;
      }
    }
  }
  return dp[1][n];
}`;

function mcm({ dims }) {
  const p = dims.map((x) => Math.max(1, Math.floor(x))), n = p.length - 1;
  if (n < 2) return { frames: [{ line: 1, kind: 'fail', note: 'Enter at least three dimensions (two matrices), e.g. 10, 30, 5, 60.', rows: [], cols: [], cells: [], cur: null, deps: [], path: [], formula: '', answer: null }], truncated: false };
  return collect((F) => {
    const dp = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 || j === 0 || j < i ? '·' : i === j ? 0 : null)));
    const split = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
    const rows = Array.from({ length: n }, (_, i) => `A${i + 1} (${p[i]}×${p[i + 1]})`), cols = Array.from({ length: n }, (_, i) => String(i + 1));
    const v = (extra) => {
      const sh = (arr) => (arr || []).map(([r, c]) => [r - 1, c - 1]);
      return { rows, cols, cells: dp.slice(1).map((r) => r.slice(1)), cur: null, deps: [], path: [], formula: '', answer: null, ...extra, ...(extra && extra.cur ? { cur: [extra.cur[0] - 1, extra.cur[1] - 1] } : {}), ...(extra && extra.deps ? { deps: sh(extra.deps) } : {}), ...(extra && extra.path ? { path: sh(extra.path) } : {}) };
    };
    F.add(2, `${n} matrices with dimensions ${p.join(' × ')}. dp[i][j] = fewest scalar multiplications to multiply matrices i..j. A single matrix costs 0 (the diagonal).`, 'info', v());
    for (let len = 2; len <= n; len++) {
      for (let i = 1; i + len - 1 <= n; i++) {
        const j = i + len - 1; let best = Infinity;
        for (let k = i; k < j; k++) {
          const cost = dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j];
          F.add(6, `Split A${i}..A${j} after A${k}: dp[${i}][${k}] + dp[${k + 1}][${j}] + ${p[i - 1]}·${p[k]}·${p[j]} = ${dp[i][k]} + ${dp[k + 1][j]} + ${p[i - 1] * p[k] * p[j]} = ${cost}.`, cost < best ? 'pick' : 'compare', v({ cur: [i, j], deps: [[i, k], [k + 1, j]], formula: `${dp[i][k]} + ${dp[k + 1][j]} + ${p[i - 1] * p[k] * p[j]} = ${cost}` }));
          if (cost < best) { best = cost; split[i][j] = k; dp[i][j] = cost; }
        }
        F.add(7, `Cheapest split for A${i}..A${j} is after A${split[i][j]}: dp[${i}][${j}] = ${dp[i][j]}.`, 'done', v({ cur: [i, j], formula: `dp[${i}][${j}] = ${dp[i][j]}` }));
      }
    }
    const paren = (i, j) => (i === j ? `A${i}` : `(${paren(i, split[i][j])} × ${paren(split[i][j] + 1, j)})`);
    F.add(11, `The cheapest order costs dp[1][${n}] = ${dp[1][n]} multiplications: ${paren(1, n)}.`, 'done', v({ cur: [1, n], answer: dp[1][n] }));
  });
}

const MCM_ALGO = {
  id: 'mcm', title: 'Matrix chain (MCM)', code: MCM_CODE, run: mcm, type: '2-D interval DP · bottom-up',
  params: [{ key: 'dims', label: 'Dimensions p0, p1, … (3–6 numbers)', type: 'numlist', def: '10, 30, 5, 60, 20', max: 6, wide: true }],
  complexity: { time: 'Θ(n³)', space: 'Θ(n²)', best: 'The number of parenthesisations is exponential (Catalan)' },
  think: ['Why must chains be filled by increasing length?', 'How would you recover the parenthesisation without the extra split table?'], pitfalls: ['Matrix i has shape p[i-1] × p[i]: off-by-one in the dimension array is the classic bug.'],
};

MOD.algos = [...MOD.algos, MCM_ALGO, ...advdp.algos.filter((a) => a.id !== 'mcm')];
MOD.algos = ['knapsack', 'mcm', 'lcs', 'coins', 'bitmask', 'treedp'].map((id) => MOD.algos.find((a) => a.id === id));
MOD.tagline = 'Watch the table fill cell by cell, and see exactly which earlier cells each answer is built from.';
export default MOD;
