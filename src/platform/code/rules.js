/* Suggestion & Correction rules.
   Each rule set inspects the learner's source TEXT for violations of the algorithm's invariants and returns findings:
     { sev: 'major' | 'minor' | 'opt', line (1-based), msg, fix?: (lineText) => newLineText }
   These are pattern checks (heuristics), not proofs: the real verdict on correctness comes from running the tests.
   They assume the common variable names (lo/hi/mid, l/r, i/j) and accept a few aliases. */

const LO = '(?:lo|low|left|start)', HI = '(?:hi|high|right|end)', MID = '(?:mid|middle)';
const re = (s, f = '') => new RegExp(s, f);

const stripComment = (t) => t.replace(/\/\/.*$/, '');

function eachLine(lines, fn) { const out = []; lines.forEach((t, i) => { const r = fn(stripComment(t), i + 1, t); if (r) (Array.isArray(r) ? r : [r]).forEach((x) => out.push(x)); }); return out; }
const has = (src, rx) => rx.test(src.split('\n').map(stripComment).join('\n'));

/* ---------------- Binary search ---------------- */
const binary = (L, src) => {
  const f = eachLine(L, (t, n, raw) => {
    const out = [];
    if (re('\\b' + MID + '\\s*=').test(t) && /\/\s*2/.test(t) && !/Math\.(floor|trunc)|>>|\|\s*0|~~|parseInt/.test(t)) {
      out.push({ sev: 'minor', line: n, msg: 'mid = (lo + hi) / 2 can be a fraction (e.g. 2.5), so a[mid] is undefined. Round down with Math.floor.', fix: (x) => x.replace(/=\s*(.+?\/\s*2)\s*;?\s*$/, '= Math.floor($1);') });
    }
    const lm = t.match(re('\\b(' + LO + ')\\s*=\\s*(' + MID + ')\\s*;'));
    if (lm) out.push({ sev: 'minor', line: n, msg: `${lm[1]} = ${lm[2]} never moves past ${lm[2]}: the window stops shrinking and the loop can run forever. Because ${lm[2]} was already checked, use ${lm[2]} + 1.`, fix: (x) => x.replace(re('\\b(' + LO + ')\\s*=\\s*(' + MID + ')\\s*;'), '$1 = $2 + 1;') });
    const hm = t.match(re('\\b(' + HI + ')\\s*=\\s*(' + MID + ')\\s*;'));
    if (hm) out.push({ sev: 'minor', line: n, msg: `${hm[1]} = ${hm[2]} keeps ${hm[2]} in the window although it was already checked, so the search can loop forever. Use ${hm[2]} - 1.`, fix: (x) => x.replace(re('\\b(' + HI + ')\\s*=\\s*(' + MID + ')\\s*;'), '$1 = $2 - 1;') });
    const wm = t.match(re('while\\s*\\(\\s*(' + LO + ')\\s*<\\s*(' + HI + ')\\s*\\)'));
    if (wm) out.push({ sev: 'minor', line: n, msg: `while (${wm[1]} < ${wm[2]}) stops when one candidate is left, so a window of size 1 is never examined. Use <=.`, fix: (x) => x.replace(re('while\\s*\\(\\s*(' + LO + ')\\s*<\\s*(' + HI + ')\\s*\\)'), 'while ($1 <= $2)') });
    const im = t.match(re('\\b(' + HI + ')\\s*=\\s*(\\w+)\\.length\\s*([;,])'));
    if (im) out.push({ sev: 'minor', line: n, msg: `${im[1]} = ${im[2]}.length points one past the last element. The last valid index is length - 1.`, fix: (x) => x.replace(re('\\b(' + HI + ')\\s*=\\s*(\\w+)\\.length\\s*([;,])'), '$1 = $2.length - 1$3') });
    void raw; return out;
  });
  if (!has(src, re('\\b' + MID + '\\b')) && has(src, /for\s*\(/)) f.push({ sev: 'opt', line: 1, msg: 'This scans the array one element at a time: O(n). Because the array is sorted, comparing with the middle element lets you discard half of it each step: O(log n).' });
  return f;
};

/* ---------------- Sorting ---------------- */
const bubble = (L, src) => {
  const outerVar = (src.match(/for\s*\(\s*let\s+(\w+)\s*=\s*0/) || [])[1] || 'i';
  const f = eachLine(L, (t, n) => {
    const out = [];
    if (/if\s*\(\s*(\w+)\[(\w+)\]\s*<\s*\1\[\2\s*\+\s*1\]\s*\)/.test(t)) out.push({ sev: 'major', line: n, msg: 'Swapping when a[j] < a[j + 1] moves the SMALLER value right, so this sorts in descending order. Swap when the left item is greater.', fix: (x) => x.replace(/(\]\s*)<(\s*\w+\[)/, '$1>$2') });
    const m = t.match(/for\s*\(\s*let\s+(\w+)\s*=\s*0\s*;\s*\1\s*(<=?)\s*(\w+)\.length\s*(-\s*1)?\s*;/);
    if (m && m[1] !== outerVar && new RegExp('\\[' + m[1] + '\\s*\\+\\s*1\\]').test(src)) {
      if (!m[4] || m[2] === '<=') out.push({ sev: 'minor', line: n, msg: `The loop reaches a[${m[1]} + 1] with ${m[1]} at the last index, which reads past the end of the array. Stop one earlier.`, fix: (x) => x.replace(/(\w+)\s*(<=?)\s*(\w+)\.length\s*(-\s*1)?\s*;/, '$1 < $3.length - 1;') });
      else if (!new RegExp('-\\s*' + outerVar + '\\b').test(t)) out.push({ sev: 'opt', line: n, msg: `After pass ${outerVar} the last ${outerVar} items are already in place, so this inner loop can stop earlier: j < a.length - 1 - ${outerVar}. Same result, about half the comparisons.`, fix: (x) => x.replace(/(\.length\s*-\s*1)\s*;/, `$1 - ${outerVar};`) });
    }
    return out;
  });
  if (!has(src, /swapped|sorted|flag|didSwap|noSwap|changed/i)) f.push({ sev: 'opt', line: 1, msg: 'Add an early exit: if a whole pass makes no swaps the array is already sorted. That turns the best case (already sorted input) from O(n²) into O(n).' });
  if (has(src, /\.sort\(/)) f.push({ sev: 'opt', line: 1, msg: 'Array.prototype.sort does the work for you. To practise the algorithm, implement the comparisons and swaps yourself.' });
  return f;
};
const insertion = (L, src) => {
  const f = eachLine(L, (t, n) => {
    const m = t.match(/while\s*\(\s*(\w+)\s*>\s*0\s*&&/);
    if (m) return { sev: 'minor', line: n, msg: `${m[1]} > 0 never lets the key slide into index 0, so the smallest item can end up in the wrong place. Use ${m[1]} >= 0.`, fix: (x) => x.replace(/while\s*\(\s*(\w+)\s*>\s*0\s*&&/, 'while ($1 >= 0 &&') };
    return null;
  });
  if (has(src, /\.sort\(/)) f.push({ sev: 'opt', line: 1, msg: 'Array.prototype.sort does the work for you. To practise the algorithm, implement the shifting yourself.' });
  return f;
};
const merge = (L, src) => {
  const f = eachLine(L, (t, n) => {
    const m = t.match(/if\s*\(\s*(\w+)\.length\s*(<\s*1|===?\s*0)\s*\)\s*return/);
    if (m) return { sev: 'minor', line: n, msg: `A one-element array must be a base case too. With "${m[2].trim()}" a single element is split into [] and itself forever, so the recursion never ends. Use <= 1.`, fix: (x) => x.replace(/(\w+)\.length\s*(<\s*1|===?\s*0)/, '$1.length <= 1') };
    const k = t.match(/if\s*\(\s*(\w+)\s*>\s*(\w+)\s*\)\s*return/);
    if (k && /\blo\b|\bleft\b|\bstart\b/.test(k[1])) return { sev: 'minor', line: n, msg: `Base case ${k[1]} > ${k[2]} lets ${k[1]} === ${k[2]} (one element) recurse forever. Use >=.`, fix: (x) => x.replace(/(\w+)\s*>\s*(\w+)\s*\)/, '$1 >= $2)') };
    return null;
  });
  if (has(src, /\.sort\(/)) f.push({ sev: 'opt', line: 1, msg: 'Array.prototype.sort does the work for you. To practise the algorithm, implement the splitting and merging yourself.' });
  return f;
};
const quick = (L, src) => {
  const f = eachLine(L, (t, n) => {
    const out = [];
    const a = t.match(/quickSort\(\s*(\w+)\s*,\s*(\w+)\s*,\s*(i|p|pi|idx|pivotIndex|pivotIdx)\s*\)/);
    if (a) out.push({ sev: 'minor', line: n, msg: `Recursing on [${a[2]}..${a[3]}] includes the pivot, which is already in its final place. If the pivot is the only element left the call repeats forever. Recurse on ${a[3]} - 1.`, fix: (x) => x.replace(/(quickSort\(\s*\w+\s*,\s*\w+\s*,\s*)(i|p|pi|idx|pivotIndex|pivotIdx)(\s*\))/, '$1$2 - 1$3') });
    const b = t.match(/quickSort\(\s*(\w+)\s*,\s*(i|p|pi|idx|pivotIndex|pivotIdx)\s*,\s*(\w+)\s*\)/);
    if (b) out.push({ sev: 'minor', line: n, msg: `Recursing on [${b[2]}..${b[3]}] includes the pivot again. Start at ${b[2]} + 1.`, fix: (x) => x.replace(/(quickSort\(\s*\w+\s*,\s*)(i|p|pi|idx|pivotIndex|pivotIdx)(\s*,\s*\w+\s*\))/, '$1$2 + 1$3') });
    return out;
  });
  if (has(src, /\.sort\(/)) f.push({ sev: 'opt', line: 1, msg: 'Array.prototype.sort does the work for you. To practise the algorithm, implement the partition yourself.' });
  return f;
};

/* ---------------- Searching ---------------- */
const linear = (L) => eachLine(L, (t, n) => {
  const m = t.match(/(\w+)\s*<=\s*(\w+)\.length\b(?!\s*-)/);
  if (m && /for\s*\(/.test(t)) return { sev: 'minor', line: n, msg: `${m[1]} <= ${m[2]}.length runs one step too far: index ${m[2]}.length does not exist. Use <.`, fix: (x) => x.replace(/(\w+)\s*<=\s*(\w+)\.length\b(?!\s*-)/, '$1 < $2.length') };
  return null;
});

/* ---------------- Two pointers ---------------- */
const twosum = (L) => {
  const f = eachLine(L, (t, n) => {
    const m = t.match(/while\s*\(\s*(\w+)\s*<=\s*(\w+)\s*\)/);
    if (m) return { sev: 'minor', line: n, msg: `${m[1]} <= ${m[2]} lets both pointers sit on the same element, so one value can be used twice. Use <.`, fix: (x) => x.replace(/(\w+)\s*<=\s*(\w+)\s*\)/, '$1 < $2)') };
    return null;
  });
  const names = { r: 'l', right: 'left', j: 'i', hi: 'lo', end: 'start' }, inv = Object.fromEntries(Object.entries(names).map(([k, v]) => [v, k]));
  const text = L.map(stripComment);
  const RIGHT_DEC = /\b(r|right|j|hi|end)\s*(--|-=\s*1)/, LEFT_INC = /\b(l|left|i|lo|start)\s*(\+\+|\+=\s*1)/;
  text.forEach((t, i) => {
    const small = /<\s*target/.test(t), big = />\s*target/.test(t);
    if (!small && !big) return;
    // walk the branch bodies that follow the condition: first the "then" part, then the "else" part
    let branch = 'then';
    for (let k = i; k <= Math.min(i + 3, text.length - 1); k++) {
      let seg = text[k];
      if (k === i) { const p = seg.search(/target\s*\)/); seg = p >= 0 ? seg.slice(seg.indexOf(')', p) + 1) : ''; }
      const pieces = seg.split(/\belse\b/);
      pieces.forEach((piece, pi) => {
        if (pi > 0) branch = 'else';
        // expected: sum too small -> then moves LEFT up, else moves RIGHT down (mirror when sum too big)
        const wantLeftInc = (small && branch === 'then') || (big && branch === 'else');
        const bad = wantLeftInc ? piece.match(RIGHT_DEC) : piece.match(LEFT_INC);
        if (bad) {
          const to = wantLeftInc ? `${names[bad[1]]}++` : `${inv[bad[1]]}--`;
          f.push({ sev: 'major', line: k + 1, msg: wantLeftInc ? 'The sum is too SMALL, so the LEFT pointer must move right to reach a bigger value. Moving the right pointer left makes the sum even smaller.' : 'The sum is too BIG, so the RIGHT pointer must move left to reach a smaller value. Moving the left pointer right makes the sum even bigger.', fix: (x) => x.replace(wantLeftInc ? RIGHT_DEC : LEFT_INC, to) });
        }
      });
    }
  });
  return f;
};

/* ---------------- Backtracking: N-Queens ---------------- */
const nqueens = (L, src) => {
  const f = [];
  const text = L.map(stripComment), joined = text.join('\n');
  const names = [...joined.matchAll(/function\s+(\w+)\s*\(/g)].map((m) => m[1]);
  let recLine = -1;
  for (const nm of names) {
    const calls = text.map((t, i) => ({ t, i })).filter(({ t }) => new RegExp('\\b' + nm + '\\s*\\(').test(t) && !new RegExp('function\\s+' + nm).test(t));
    if (calls.length && new RegExp('function\\s+' + nm + '[\\s\\S]*?\\b' + nm + '\\s*\\(').test(joined) && calls.some((c) => c.i > text.findIndex((q) => new RegExp('function\\s+' + nm).test(q)) && /\b(row|r|col|n|k|i)\b/.test(c.t))) {
      const dl = text.findIndex((q) => new RegExp('function\\s+' + nm).test(q));
      const inside = calls.find((c) => c.i > dl && /(row|r|k|i|depth)\s*\+\s*1|\+\+/.test(c.t));
      if (inside) { recLine = inside.i; break; }
    }
  }
  if (recLine >= 0) {
    const after = text.slice(recLine + 1, recLine + 5).join('\n');
    if (!/\.pop\(\)|\bdelete\b|\]\s*=\s*(-1|false|0|null|undefined)|\.splice\(|\.delete\(|\.length\s*=|--\s*;|-=\s*1|undo|remove|unplace/i.test(after)) {
      f.push({ sev: 'major', line: recLine + 1, msg: 'Missing the backtrack step. After the recursive call returns, the queen you placed must be removed (for example cols.pop() or board[row] = -1) before trying the next column. Otherwise earlier choices leak into later branches and valid placements are wrongly rejected.' });
    }
  }
  if (!/Math\.abs|diag|[-+]\s*(col|c)\b[^\n]*(===|==)|(row|r)\s*[-+]\s*(col|c)\b|(col|c)\s*[-+]\s*(row|r)\b/i.test(joined)) {
    f.push({ sev: 'major', line: Math.max(1, text.findIndex((t) => /safe|valid|ok|attack|conflict/i.test(t)) + 1), msg: 'Diagonal attacks are never checked. Two queens (r1, c1) and (r2, c2) attack diagonally when |r1 - r2| === |c1 - c2| (Math.abs(...)).' });
  }
  return f;
};

/* ---------------- Greedy: activity selection ---------------- */
const activity = (L, src) => {
  const f = eachLine(L, (t, n) => {
    const out = [];
    if (/\.sort\(/.test(t) && /\[0\]|start|\.s\b/.test(t) && !/\[1\]|finish|\.f\b|end/.test(t)) out.push({ sev: 'major', line: n, msg: 'Sorting by START time is not optimal: one long early activity can block many short ones. The greedy choice that provably works is the activity that FINISHES first.', fix: (x) => x.replace(/\[0\]/g, '[1]').replace(/\bstart\b/g, 'finish') });
    const m = t.match(/\b(start|s|\w+\[0\])\s*>\s*(last|prevEnd|lastEnd|lastFinish|prev|end)\b/);
    if (m) out.push({ sev: 'minor', line: n, msg: `An activity that starts exactly when the last one ends is compatible, but ${m[1]} > ${m[2]} rejects it. Use >=.`, fix: (x) => x.replace(/\b(start|s|\w+\[0\])\s*>\s*(last|prevEnd|lastEnd|lastFinish|prev|end)\b/, '$1 >= $2') });
    return out;
  });
  if (!has(src, /\.sort\(|sorted|sortBy/i)) f.push({ sev: 'major', line: 1, msg: 'The greedy rule needs the activities ordered by finish time first. Sort them (earliest finish first) before scanning.' });
  return f;
};

/* ---------------- Dynamic programming ---------------- */
const knapsack = (L, src) => {
  const f = eachLine(L, (t, n) => {
    const rhs = t.includes('=') ? t.slice(t.indexOf('=') + 1) : '';
    if (/dp\[\s*i\s*\]\s*\[[^\]]*-[^\]]*\]/.test(rhs)) {
      return { sev: 'major', line: n, msg: 'Reading dp[i][c - w] (the SAME row) lets item i be taken again and again: that is the unbounded knapsack. For 0/1, "take" must read the previous row: dp[i - 1][c - w].', fix: (x) => x.replace(/dp\[\s*i\s*\](\s*\[[^\]]*-)/g, 'dp[i - 1]$1') };
    }
    return null;
  });
  return f;
};
const coins = (L) => eachLine(L, (t, n) => {
  if (/Array\(\s*[\w\s+-]+\)\s*\.fill\(\s*0\s*\)/.test(t) && /amount|\+\s*1/.test(t)) return { sev: 'major', line: n, msg: 'dp starts at 0, so every amount looks free and Math.min can never improve it. "Unreachable so far" must be Infinity.', fix: (x) => x.replace(/\.fill\(\s*0\s*\)/, '.fill(Infinity)') };
  return null;
});

/* ---------------- Graphs ---------------- */
const bfs = (L, src) => (has(src, /visited|seen|\.has\(|includes\(|marked|discovered/i) ? [] : [{ sev: 'major', line: Math.max(1, L.findIndex((t) => /queue/i.test(t)) + 1), msg: 'There is no visited set. On a graph with cycles (like this one) the same nodes are queued again and again and the search never ends. Record each node when it is discovered and skip nodes already recorded.' }]);

/* ---------------- Generic checks (every algorithm) ---------------- */
function generic(L, src) {
  const f = [];
  const text = L.map(stripComment).join('\n');
  const loop = /while\s*\(\s*(true|1)\s*\)|for\s*\(\s*;\s*;\s*\)/.exec(text);
  if (loop && !/\bbreak\b|\breturn\b/.test(text)) f.push({ sev: 'major', line: L.findIndex((t) => /while\s*\(\s*(true|1)\s*\)|for\s*\(\s*;\s*;\s*\)/.test(t)) + 1, msg: 'This loop has no break or return, so it can never end. The tests will time out.' });
  return f;
}

const RULES = { binary, bubble, insertion, merge, quick, linear, twosum, nqueens, activity, knapsack, coins, bfs };

export function validate(algoId, code) {
  const L = String(code).split('\n');
  const specific = RULES[algoId];
  const all = [...generic(L, code), ...(specific ? specific(L, code) : [])];
  const rank = { major: 0, minor: 1, opt: 2 };
  return { findings: all.sort((a, b) => rank[a.sev] - rank[b.sev] || a.line - b.line), hasRules: !!specific };
}
