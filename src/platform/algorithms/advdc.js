import { collect } from './common.js';
/* Tier 3 scaffold: annotated pseudo-code + explanations. `placeholder: true` algorithms get the interactive
   annotation UI in AlgoPage; add `run(params)` + a viz to promote one to a full animation. */


/* Strassen flagship on 2×2 scalar blocks (the one-level recipe that the recursion applies to n/2 × n/2 blocks).
   Frame viz: { A, B, M:[number|null ×7], formulas:[string ×7], C:[[number|null]], cur:number|null, mults:number, check:[[number]]|null } */
const STRASSEN_RUN = `function strassen2x2(A, B) {
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
}`;

function strassen({ m }) {
  const x = [1, 3, 7, 5, 6, 8, 4, 2].map((dflt, i) => (i < m.length ? Math.round(m[i]) : dflt));
  const [a, b, c, d, e, f, g, h] = x;
  const A = [[a, b], [c, d]], B = [[e, f], [g, h]];
  const defs = [
    ['M1 = (a + d)(e + h)', (a + d) * (e + h), `(${a} + ${d}) · (${e} + ${h})`],
    ['M2 = (c + d) e', (c + d) * e, `(${c} + ${d}) · ${e}`],
    ['M3 = a (f − h)', a * (f - h), `${a} · (${f} − ${h})`],
    ['M4 = d (g − e)', d * (g - e), `${d} · (${g} − ${e})`],
    ['M5 = (a + b) h', (a + b) * h, `(${a} + ${b}) · ${h}`],
    ['M6 = (c − a)(e + f)', (c - a) * (e + f), `(${c} − ${a}) · (${e} + ${f})`],
    ['M7 = (b − d)(g + h)', (b - d) * (g + h), `(${b} − ${d}) · (${g} + ${h})`],
  ];
  const M = defs.map((q) => q[1]);
  const C = [[M[0] + M[3] - M[4] + M[6], M[2] + M[4]], [M[1] + M[3], M[0] - M[1] + M[2] + M[5]]];
  const std = [[a * e + b * g, a * f + b * h], [c * e + d * g, c * f + d * h]];
  return collect((F) => {
    const Ms = Array(7).fill(null), Cs = [[null, null], [null, null]];
    const v = (extra) => ({ A, B, M: [...Ms], formulas: defs.map((q) => q[0]), C: Cs.map((r) => [...r]), cur: null, mults: Ms.filter((z) => z !== null).length, check: null, ...extra });
    F.add(2, 'Multiply two 2×2 matrices. The schoolbook method needs 8 multiplications; Strassen needs only 7 (plus extra additions).', 'info', v());
    defs.forEach((q, i) => {
      Ms[i] = q[1];
      F.add(3 + i, `${q[0]} = ${q[2]} = ${q[1]}. This is multiplication number ${i + 1} of 7.`, 'compare', v({ cur: i }));
    });
    const cf = [
      ['C11 = M1 + M4 − M5 + M7', `${M[0]} + ${M[3]} − ${M[4]} + ${M[6]}`, 0, 0, 10],
      ['C12 = M3 + M5', `${M[2]} + ${M[4]}`, 0, 1, 10],
      ['C21 = M2 + M4', `${M[1]} + ${M[3]}`, 1, 0, 11],
      ['C22 = M1 − M2 + M3 + M6', `${M[0]} − ${M[1]} + ${M[2]} + ${M[5]}`, 1, 1, 11],
    ];
    cf.forEach(([name, expr, r, c2, line]) => { Cs[r][c2] = C[r][c2]; F.add(line, `${name} = ${expr} = ${C[r][c2]}. Only additions and subtractions here, which are cheap.`, 'pick', v({ cur: null })); });
    const same = std.every((row, r) => row.every((val, c2) => val === C[r][c2]));
    F.add(11, `Check against the ordinary product: ${JSON.stringify(std)}. ${same ? 'They are identical' : 'MISMATCH'}, but Strassen used 7 multiplications instead of 8. Applied recursively to blocks, T(n) = 7T(n/2) + Θ(n²) = Θ(n^2.807).`, 'done', v({ check: std }));
  });
}

const CLOSEST = `closestPair(P):                         // P sorted by x
  if |P| <= 3: return bruteForce(P)
  mid = |P| / 2;  midX = P[mid].x
  dL = closestPair(P[0 .. mid))         // left half
  dR = closestPair(P[mid ..])           // right half
  d = min(dL, dR)
  strip = points with |x − midX| < d, sorted by y
  for each p in strip: compare p with the next ≤ 7 points in the strip
  return min(d, best distance found in the strip)`;

const FFT = `FFT(a):                                 // length n, a power of 2
  if n == 1: return a
  a_even = [a0, a2, a4, ...];  a_odd = [a1, a3, a5, ...]
  y_even = FFT(a_even);  y_odd = FFT(a_odd)
  ω = e^(2πi / n)
  for k = 0 .. n/2 − 1:
    t = ω^k · y_odd[k]
    y[k]       = y_even[k] + t              // "butterfly"
    y[k + n/2] = y_even[k] − t
  return y`;

export default {
  id: 'advdc', title: 'Advanced Divide & Conquer', branch: 'Tier 3 · Intermediate & Advanced DAA', viz: 'strassen', advanced: true,
  tagline: 'Divide, conquer, and combine cleverly: do less work than the obvious method. Strassen is animated; FFT and closest pair are annotated previews.',
  params: [],
  algos: [
    { id: 'strassen', title: "Strassen's matrix", code: STRASSEN_RUN, run: strassen, type: 'Divide & conquer · algebraic trick',
      params: [{ key: 'm', label: 'A = [a b; c d], B = [e f; g h] (8 numbers)', type: 'numlist', def: '1, 3, 7, 5, 6, 8, 4, 2', max: 8, wide: true }],
      complexity: { time: 'Θ(n^log₂7) ≈ Θ(n^2.807)', space: 'Θ(n²)', best: 'Beats the Θ(n³) schoolbook method for large n' },
      think: ['If you could only reduce the number of recursive calls, what does T(n) = aT(n/2) + n² give for a = 8 vs a = 7?', 'Why is the extra memory and numerical stability a practical concern?'], pitfalls: ['Constant factors and extra additions make Strassen slower than the classic method for small matrices; real libraries switch back below a cutoff size.'] },
    { id: 'closest', title: 'Closest pair of points', code: CLOSEST, placeholder: true, type: 'Divide & conquer · geometric', params: [],
      complexity: { time: 'Θ(n log n)', space: 'Θ(n)', best: 'Brute force is Θ(n²)' },
      lines: {
        1: 'Find the two nearest points among n points in the plane. Sort once by x so that halves are easy to take.',
        2: 'Small problems are solved directly by comparing all pairs.',
        3: 'Draw a vertical line through the median point; half the points lie on each side.',
        4: 'Recursively find the closest pair entirely in the left half.',
        5: 'Recursively find the closest pair entirely in the right half.',
        6: 'd is the best distance found so far. The only pairs we have not examined straddle the dividing line.',
        7: 'A straddling pair can only beat d if both points lie within d of the line, so only that narrow strip matters.',
        8: 'Packing argument: inside the strip, each point has at most a constant number of neighbours (at most 7 following it in y order) within distance d, so this scan is linear.',
        9: 'The answer is the better of d and the best straddling pair. T(n) = 2T(n/2) + Θ(n) gives Θ(n log n) when the strip is kept sorted by y via merging.',
      },
      planned: 'Points on a plane with the median line, the shrinking strip of width 2d, and the 2d × d boxes showing why only a constant number of neighbours need checking.',
      think: ['Why is it enough to look at points within d of the dividing line?', 'What breaks if you re-sort the strip from scratch on every call?'], pitfalls: ['Sorting the strip by y at every level gives Θ(n log² n), not Θ(n log n).'] },
    { id: 'fft', title: 'Fast Fourier Transform', code: FFT, placeholder: true, type: 'Divide & conquer · algebraic', params: [],
      complexity: { time: 'Θ(n log n)', space: 'Θ(n)', best: 'Naive DFT is Θ(n²)' },
      lines: {
        1: 'FFT evaluates a degree-(n−1) polynomial (coefficients a) at the n complex n-th roots of unity, in Θ(n log n) instead of Θ(n²).',
        2: 'One coefficient: the polynomial is a constant.',
        3: 'Split by index parity: P(x) = P_even(x²) + x·P_odd(x²).',
        4: 'Two half-size problems, because squaring the n-th roots of unity gives only n/2 distinct values (the (n/2)-th roots).',
        5: 'ω is the principal n-th root of unity.',
        6: 'Combine the two half results for each k in the first half.',
        7: 't = ω^k · y_odd[k] is the odd part scaled by the twiddle factor.',
        8: 'Butterfly: y[k] = y_even[k] + t.',
        9: 'Because ω^(k+n/2) = −ω^k, the partner value is y_even[k] − t, for free.',
        10: 'T(n) = 2T(n/2) + Θ(n) = Θ(n log n). Multiplying polynomials becomes: FFT both, multiply pointwise, inverse FFT.',
      },
      planned: 'The recursion tree of even/odd splits, then the butterfly network that merges results, with roots of unity drawn on the unit circle.',
      think: ['Why does the algorithm need n to be a power of two (or padding)?', 'How does FFT turn polynomial multiplication from Θ(n²) into Θ(n log n)?'], pitfalls: ['Floating-point error accumulates; exact work needs the number-theoretic transform.'] },
  ],
};
