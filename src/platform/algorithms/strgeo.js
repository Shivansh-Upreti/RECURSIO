import { collect } from './common.js';

/* KMP frame viz: { text:[ch], pat:[ch], i, j, offset, lps:[number|null], phase:'lps'|'search', lpsAt:number|null, found:[start,end]|null, bad:boolean } */

const KMP = `function kmpSearch(text, pat) {
  const lps = buildLPS(pat);             // longest proper prefix that is also a suffix
  let i = 0, j = 0;                      // i walks the text, j walks the pattern
  while (i < text.length) {
    if (text[i] === pat[j]) { i++; j++; }
    if (j === pat.length) return i - j;  // full match found
    else if (i < text.length && text[i] !== pat[j]) {
      if (j > 0) j = lps[j - 1];         // reuse what already matched: i never moves back
      else i++;
    }
  }
  return -1;
}`;

const RABIN = `rabinKarp(text, pat):                 // rolling hash
  h = hash(pat);  w = hash(text[0 .. m))
  for i = 0 .. n − m:
    if w == h and text[i .. i+m) == pat: return i      // verify: hashes can collide
    w = roll(w, text[i], text[i+m])      // drop the left char, add the right char in Θ(1)
  return −1`;

const HULL = `convexHull(P):                        // Andrew's monotone chain
  sort P by x (then y)
  lower = []
  for p in P:
    while |lower| ≥ 2 and cross(lower[−2], lower[−1], p) ≤ 0: lower.pop()
    lower.push(p)
  upper = [], and repeat the loop above over P in reverse
  return lower[0 .. −1] + upper[0 .. −1]  // drop the duplicated endpoints`;

function kmp({ text, pat }) {
  const T = [...String(text)].slice(0, 24), P = [...String(pat)].slice(0, 10);
  return collect((F) => {
    if (!P.length || !T.length) { F.add(1, 'Enter a text and a non-empty pattern.', 'fail', { text: T, pat: P, i: 0, j: 0, offset: 0, lps: [], phase: 'search', lpsAt: null, found: null, bad: false }); return; }
    const lps = Array(P.length).fill(null);
    const v = (extra) => ({ text: T, pat: P, i: 0, j: 0, offset: 0, lps: [...lps], phase: 'search', lpsAt: null, found: null, bad: false, ...extra });
    F.add(2, 'Step 1: precompute lps[k] = length of the longest proper prefix of pat[0..k] that is also its suffix. This tells us how far we can fall back after a mismatch.', 'info', v({ phase: 'lps' }));
    lps[0] = 0;
    F.add(2, 'lps[0] = 0 (a single character has no proper prefix).', 'pick', v({ phase: 'lps', lpsAt: 0 }));
    let len = 0, k = 1;
    while (k < P.length) {
      if (P[k] === P[len]) {
        len++; lps[k] = len;
        F.add(2, `pat[${k}] = "${P[k]}" equals pat[${len - 1}] = "${P[len - 1]}": the border grows. lps[${k}] = ${len}.`, 'match', v({ phase: 'lps', lpsAt: k })); k++;
      } else if (len > 0) {
        F.add(2, `pat[${k}] = "${P[k]}" ≠ pat[${len}] = "${P[len]}": fall back to the next shorter border, len = lps[${len - 1}] = ${lps[len - 1]}.`, 'compare', v({ phase: 'lps', lpsAt: k })); len = lps[len - 1];
      } else {
        lps[k] = 0;
        F.add(2, `pat[${k}] = "${P[k]}" matches no prefix: lps[${k}] = 0.`, 'reject', v({ phase: 'lps', lpsAt: k })); k++;
      }
    }
    F.add(3, `lps = [${lps.join(', ')}]. Now scan the text with i (text) and j (pattern); i never moves backwards.`, 'info', v());
    let i = 0, j = 0;
    while (i < T.length) {
      F.add(5, `Compare text[${i}] = "${T[i]}" with pat[${j}] = "${P[j]}".`, 'compare', v({ i, j, offset: i - j }));
      if (T[i] === P[j]) {
        i++; j++;
        F.add(5, `Match. Advance both: i = ${i}, j = ${j}.`, 'match', v({ i, j, offset: i - j }));
        if (j === P.length) { F.add(6, `j reached the pattern length ${P.length}: the pattern occurs at index ${i - j}.`, 'done', v({ i, j, offset: i - j, found: [i - j, i - 1] })); return; }
      } else if (j > 0) {
        const nj = lps[j - 1];
        F.add(8, `Mismatch after ${j} matched characters. Instead of restarting, set j = lps[${j - 1}] = ${nj}: the last ${nj} matched characters are already a prefix of the pattern. i stays at ${i}.`, 'conflict', v({ i, j, offset: i - j, bad: true }));
        j = nj;
      } else {
        F.add(9, `Mismatch with nothing matched yet (j = 0): just advance the text pointer to i = ${i + 1}.`, 'reject', v({ i, j, offset: i - j, bad: true }));
        i++;
      }
    }
    F.add(12, 'The text is exhausted without a full match: return −1.', 'fail', v({ i, j, offset: i - j }));
  });
}

export default {
  id: 'strgeo', title: 'String & Geometric', branch: 'Tier 3 · Intermediate & Advanced DAA', viz: 'strmatch', advanced: true,
  tagline: 'Matching text in linear time and wrapping points in a hull: watch how precomputed knowledge avoids repeated work.',
  params: [],
  algos: [
    { id: 'kmp', title: 'KMP', code: KMP, run: kmp, type: 'String matching · failure function', complexity: { time: 'Θ(n + m)', space: 'Θ(m) for the lps table', best: 'Naive matching is Θ(n·m)' },
      params: [{ key: 'text', label: 'Text (up to 24)', type: 'text', def: 'ABABDABACDABABCABAB', maxLen: 24, wide: true }, { key: 'pat', label: 'Pattern (up to 10)', type: 'text', def: 'ABABCABAB', maxLen: 10 }],
      think: ['After a mismatch, why is it safe not to re-compare the characters that matched?', 'Compute lps for "AAAB" by hand, then check it against the animation.'], pitfalls: ['A subtle off-by-one in the lps fallback (lps[j-1] vs lps[j]) is the classic bug.'] },
    { id: 'rabinkarp', title: 'Rabin–Karp (preview)', code: RABIN, placeholder: true, type: 'Rolling hash · string matching', params: [],
      complexity: { time: 'Θ(n + m) expected, Θ(nm) worst case (many collisions)', space: 'Θ(1)', best: 'Good for matching many patterns at once' },
      lines: {
        1: 'Compare a numeric fingerprint (hash) of the pattern with the fingerprint of each window of the text.',
        2: 'Hash the pattern and the first window of m characters. Use a polynomial hash modulo a large prime.',
        3: 'Slide the window one character at a time across the text.',
        4: 'Equal hashes do not prove equal strings (collisions exist), so verify the characters before reporting a match.',
        5: 'The rolling update removes the contribution of the left character and adds the new right one in constant time instead of rehashing m characters.',
        6: 'No window matched.',
      },
      planned: 'The text with a sliding window, the numeric hash of the window updating digit by digit, and collision cases highlighted when equal hashes hide different strings.',
      think: ['Why must a hash match be verified?', 'How would you match many patterns at once?'], pitfalls: ['A weak or small modulus produces many false positives and degrades toward Θ(nm).'] },
    { id: 'hull', title: 'Convex hull (preview)', code: HULL, placeholder: true, type: 'Geometry · Andrew monotone chain', params: [],
      complexity: { time: 'Θ(n log n) (sorting dominates)', space: 'Θ(n)', best: 'Output-sensitive Θ(n log h) algorithms exist' },
      lines: {
        1: 'The convex hull is the smallest convex polygon containing all points: imagine a rubber band stretched around nails.',
        2: 'Sort the points left to right. This costs Θ(n log n) and makes the rest linear.',
        3: 'Build the lower hull first, left to right.',
        4: 'Consider each point in sorted order.',
        5: 'The cross product tells whether the last two hull points and the new point make a counter-clockwise turn. If not (≤ 0), the middle point lies inside, so remove it.',
        6: 'Push the new point.',
        7: 'The upper hull is built the same way going right to left.',
        8: 'Concatenate both chains, dropping the duplicated endpoints.',
      },
      planned: 'Points on a plane with a sweeping line, the growing hull as a stack, and a highlighted turn test (cross product sign) each time a point is popped.',
      think: ['Why is the cross-product sign enough to detect a non-convex turn?', 'Why does each point get pushed and popped at most once?'], pitfalls: ['Collinear points need a deliberate policy (≤ 0 vs < 0); floating-point cross products can mis-classify near-collinear points.'] },
  ],
};
