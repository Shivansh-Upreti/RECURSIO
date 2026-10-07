import { collect } from './common.js';

/* Frame viz: { xmax, ymax, n:number|null, series:[{id,label,tone,ys[1..xmax]}], band:{lo:[],hi:[]}|null, table:[[label,value]], mode }
   ys are sampled at x = 1..xmax (index 0 -> x=1). Values above ymax are clipped by the chart. */

const GROWTH = `// operations performed as the input size n grows
f1(n): return 1                       // O(1)        constant
f2(n): halve n until it reaches 1     // O(log n)    logarithmic
f3(n): for i in 1..n: work()          // O(n)        linear
f4(n): for i in 1..n: halving loop    // O(n log n)  linearithmic
f5(n): for i in 1..n: for j in 1..n   // O(n²)       quadratic
f6(n): try every subset of n items    // O(2ⁿ)       exponential
f7(n): try every ordering of n items  // O(n!)       factorial`;

const THETA = `// f(n) = a·n² + b·n   with a, b > 0
// O:  f(n) ≤ c₂·g(n) for all n ≥ n₀      (upper bound)
// Ω:  f(n) ≥ c₁·g(n) for all n ≥ n₀      (lower bound)
// Θ:  both hold with the SAME g(n)       (tight bound)
g(n) = n²  → c₁ = a, c₂ = a + b, n₀ = 1   so f ∈ Θ(n²)
g(n) = n   → f outgrows c·n for any c     so f ∉ O(n)
g(n) = n³  → f ≤ (a+b)·n³                 true, but a loose bound`;

const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const FN = {
  c: { label: 'O(1)', tone: 'sky', f: () => 1 },
  log: { label: 'O(log n)', tone: 'green', f: (n) => Math.log2(n) },
  lin: { label: 'O(n)', tone: 'teal', f: (n) => n },
  nlog: { label: 'O(n log n)', tone: 'amber', f: (n) => n * Math.log2(n) },
  sq: { label: 'O(n²)', tone: 'orange', f: (n) => n * n },
  exp: { label: 'O(2ⁿ)', tone: 'rose', f: (n) => 2 ** n },
  fact: { label: 'O(n!)', tone: 'violet', f: (n) => fact(n) },
};
const ORDER = ['c', 'log', 'lin', 'nlog', 'sq', 'exp', 'fact'];
const sample = (f, xmax) => Array.from({ length: xmax }, (_, i) => f(i + 1));
const fmt = (v) => (v >= 1e6 ? v.toExponential(1) : Number.isInteger(v) ? String(v) : v.toFixed(1));

function growth({ xmax }) {
  return collect((F) => {
    const ymax = xmax * xmax;
    const mk = (ids, n, mode = 'curves') => ({
      xmax, ymax, n, mode, band: null,
      series: ids.map((id) => ({ id, label: FN[id].label, tone: FN[id].tone, ys: sample(FN[id].f, xmax) })),
      table: n === null ? [] : ids.map((id) => [FN[id].label, fmt(FN[id].f(n))]),
    });
    F.add(1, `Each curve shows how many basic operations an algorithm performs for input size n (1 to ${xmax}).`, 'info', mk([], null));
    const shown = [];
    const notes = [
      'Constant time: the cost never changes, however large n gets. Array index lookup is an example.',
      'Logarithmic: doubling n adds just one step. Binary search lives here.',
      'Linear: double the input, double the work. A single loop over the data.',
      'Linearithmic: slightly worse than linear. This is the best a comparison sort can do (merge sort).',
      'Quadratic: double the input, FOUR times the work. Nested loops (bubble sort).',
      `Exponential: adding ONE item doubles the work. The curve leaves the chart almost at once (it reaches ${fmt(2 ** xmax)} at n = ${xmax}).`,
      `Factorial: every ordering is tried. It escapes even faster (${xmax}! = ${fmt(fact(xmax))}).`,
    ];
    ORDER.forEach((id, i) => { shown.push(id); F.add(i + 2, notes[i], 'info', mk(shown, null)); });
    for (let n = 2; n <= xmax; n += xmax > 12 ? 2 : 1) {
      F.add(1, `At n = ${n}: ${ORDER.map((id) => `${FN[id].label} = ${fmt(FN[id].f(n))}`).join(', ')}.`, 'compare', mk(ORDER, n));
    }
    F.add(1, 'The gap between the polynomial curves and the exponential ones is why algorithm choice matters more than faster hardware.', 'done', mk(ORDER, xmax));
  });
}

function theta({ a, b, xmax }) {
  return collect((F) => {
    const f = (n) => a * n * n + b * n;
    const ymax = Math.max(f(xmax) * 1.15, 10);
    const base = () => ({ xmax, ymax, n: null, mode: 'bounds', band: null, table: [] });
    const S = (id, label, tone, fn, extra) => ({ id, label, tone, ys: sample(fn, xmax), ...extra });
    const fS = S('f', `f(n) = ${a}n² + ${b}n`, 'green', f);
    const up = S('up', `c₂·n² = ${a + b}n²  (upper)`, 'rose', (n) => (a + b) * n * n, { dash: true });
    const lo = S('lo', `c₁·n² = ${a}n²  (lower)`, 'sky', (n) => a * n * n, { dash: true });
    F.add(1, `Take f(n) = ${a}n² + ${b}n. We want a simple function g(n) that describes how fast f grows.`, 'info', { ...base(), series: [fS] });
    F.add(2, `Big-O (upper bound): f(n) ≤ c₂·n² for all n ≥ 1 with c₂ = ${a + b}, because ${b}n ≤ ${b}n². The red curve stays above f.`, 'compare', { ...base(), series: [fS, up] });
    F.add(3, `Big-Omega (lower bound): f(n) ≥ c₁·n² with c₁ = ${a}, because the ${b}n term is non-negative. The blue curve stays below f.`, 'compare', { ...base(), series: [fS, up, lo] });
    F.add(4, `Big-Theta: f is squeezed between c₁·n² and c₂·n² (shaded). Same g(n) = n² on both sides, so f ∈ Θ(n²): a tight bound.`, 'done', { ...base(), series: [fS, up, lo], band: { lo: lo.ys, hi: up.ys } });
    const lin = S('lin', `c·n  (even with c = ${a + b})`, 'amber', (n) => (a + b) * n);
    F.add(6, `Try g(n) = n: no constant c keeps c·n above f(n) forever (the amber line is overtaken), since f/n = ${a}n + ${b} grows without bound. So f ∉ O(n). Too small to be an upper bound.`, 'fail', { ...base(), series: [fS, lin] });
    const cube = S('cube', `(${a + b})·n³`, 'violet', (n) => (a + b) * n ** 3);
    F.add(7, `Try g(n) = n³: f(n) ≤ ${a + b}·n³ is true, so f ∈ O(n³), but the bound is loose. Θ tells you the bound that is both true and tight.`, 'info', { ...base(), series: [fS, cube], ymax: Math.max(ymax, f(xmax) * 1.15) });
  });
}

export default {
  id: 'complexity', title: 'Complexity Analysis', branch: 'Tier 1 · Data Structures', viz: 'growth',
  tagline: 'See Big-O, Big-Omega and Big-Theta as curves you can compare, not symbols to memorise.',
  params: [{ key: 'xmax', label: 'Largest n (6–20)', type: 'int', def: 12, min: 6, max: 20 }],
  algos: [
    { id: 'growth', title: 'Growth rates', code: GROWTH, run: growth, type: 'Asymptotic analysis', complexity: { time: 'n/a (analysis tool)', space: 'n/a', best: 'Compare how cost scales, not exact timings' },
      think: ['Which curve would you pick for 1,000,000 items, and why?', 'Where does O(n²) overtake O(n log n) on the chart?'], pitfalls: ['Big-O hides constants: O(n) with a huge constant can lose to O(n²) at small n.', 'It describes growth, not speed on your machine.'] },
    { id: 'theta', title: 'Big-O · Ω · Θ', code: THETA, run: theta, type: 'Asymptotic notation',
      params: [{ key: 'a', label: 'a (1–5)', type: 'int', def: 3, min: 1, max: 5 }, { key: 'b', label: 'b (1–20)', type: 'int', def: 5, min: 1, max: 20 }, { key: 'xmax', label: 'Largest n (6–20)', type: 'int', def: 12, min: 6, max: 20 }],
      complexity: { time: 'f(n) = an² + bn ∈ Θ(n²)', space: 'n/a', best: 'O = ceiling, Ω = floor, Θ = both' },
      think: ['Why can we drop the bn term and the constant a?', 'Is f also O(n³)? Is it Θ(n³)?'], pitfalls: ['"Worst case" and "O" are different ideas: O bounds a function, the case is which input you analyse.'] },
  ],
};
