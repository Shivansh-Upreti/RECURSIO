import { collect } from './common.js';

/* Frame viz state: { items:[{id,v}], mark:{[id]:'cmp'|'swap'|'pivot'|'key'|'sorted'|'min'}, range:[lo,hi]|null, split:mid|null, depth }
   Items keep a stable `id` so the bar chart can animate each bar travelling to its new position. */

const BUBBLE = `function bubbleSort(a) {
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        swap(a, j, j + 1);
        swapped = true;
      }
    }
    if (!swapped) break;       // no swaps: already sorted
  }
}`;

const INSERTION = `function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];         // shift the bigger item right
      j--;
    }
    a[j + 1] = key;            // drop the key into the gap
  }
}`;

const MERGE = `function mergeSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;                  // 0 or 1 item: already sorted
  const mid = Math.floor((lo + hi) / 2);
  mergeSort(a, lo, mid);                 // sort the left half
  mergeSort(a, mid + 1, hi);             // sort the right half
  merge(a, lo, mid, hi);                 // zip two sorted halves together
}`;

const QUICK = `function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;
  const p = partition(a, lo, hi);
  quickSort(a, lo, p - 1);
  quickSort(a, p + 1, hi);
}
function partition(a, lo, hi) {
  const pivot = a[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) { swap(a, i, j); i++; }
  }
  swap(a, i, hi);              // pivot lands in its final place
  return i;
}`;

const items0 = (arr) => arr.map((v, i) => ({ id: i, v }));
const snap = (items, mark, extra) => ({ items: items.map((x) => ({ ...x })), mark: { ...mark }, range: null, split: null, depth: 0, ...extra });
const sortedMarks = (set) => Object.fromEntries([...set].map((id) => [id, 'sorted']));

function bubble({ arr }) {
  return collect((F) => {
    const a = items0(arr), n = a.length, sorted = new Set();
    F.add(1, 'Start. Bubble sort repeatedly compares neighbours and swaps them if they are out of order.', 'info', snap(a, {}));
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - 1 - i; j++) {
        F.add(5, `Compare ${a[j].v} and ${a[j + 1].v}.`, 'compare', snap(a, { ...sortedMarks(sorted), [a[j].id]: 'cmp', [a[j + 1].id]: 'cmp' }));
        if (a[j].v > a[j + 1].v) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]]; swapped = true;
          F.add(6, `${a[j + 1].v} > ${a[j].v}, so they are out of order: swap them.`, 'swap', snap(a, { ...sortedMarks(sorted), [a[j].id]: 'swap', [a[j + 1].id]: 'swap' }));
        }
      }
      sorted.add(a[n - 1 - i].id);
      F.add(9, `End of pass ${i + 1}: the largest remaining value (${a[n - 1 - i].v}) has bubbled to the end.`, 'done', snap(a, sortedMarks(sorted)));
      if (!swapped) { a.forEach((x) => sorted.add(x.id)); F.add(10, 'No swaps in this pass, so the array is already sorted. Stop early.', 'done', snap(a, sortedMarks(sorted))); return; }
    }
    a.forEach((x) => sorted.add(x.id));
    F.add(11, 'Sorted.', 'done', snap(a, sortedMarks(sorted)));
  });
}

function insertion({ arr }) {
  return collect((F) => {
    const a = items0(arr), n = a.length;
    F.add(1, 'Start. Insertion sort grows a sorted prefix on the left, inserting one new item at a time.', 'info', snap(a, a[0] ? { [a[0].id]: 'sorted' } : {}));
    for (let i = 1; i < n; i++) {
      const prefix = (upto) => Object.fromEntries(a.slice(0, upto).map((x) => [x.id, 'sorted']));
      const key = a[i];
      F.add(3, `Pick the next item, key = ${key.v}.`, 'pick', snap(a, { ...prefix(i), [key.id]: 'key' }));
      let j = i - 1, pos = i;
      while (j >= 0 && a[j].v > key.v) {
        F.add(5, `${a[j].v} > ${key.v}: it must move right.`, 'compare', snap(a, { ...prefix(i + 1), [a[j].id]: 'cmp', [key.id]: 'key' }));
        [a[pos], a[j]] = [a[j], a[pos]];
        F.add(6, `Shift ${a[pos].v} right (the key slides left into the gap).`, 'swap', snap(a, { ...prefix(i + 1), [key.id]: 'key' }));
        j--; pos--;
      }
      if (j >= 0) F.add(5, `${a[j].v} <= ${key.v}: the key stops here.`, 'compare', snap(a, { ...prefix(i + 1), [a[j].id]: 'cmp', [key.id]: 'key' }));
      F.add(9, `Place ${key.v} at index ${pos}. The prefix a[0..${i}] is sorted.`, 'done', snap(a, prefix(i + 1)));
    }
    F.add(10, 'Sorted.', 'done', snap(a, sortedMarks(new Set(a.map((x) => x.id)))));
  });
}

function merge({ arr }) {
  return collect((F) => {
    const a = items0(arr), n = a.length;
    const full = () => sortedMarks(new Set(a.map((x) => x.id)));
    F.add(1, 'Start. Merge sort splits the array in half until single items remain, then merges sorted halves.', 'info', snap(a, {}));
    const sort = (lo, hi, depth) => {
      if (lo >= hi) { F.add(2, `[${lo}..${hi}] has ${lo === hi ? 'one item' : 'no items'}: already sorted.`, 'done', snap(a, a[lo] ? { [a[lo].id]: 'sorted' } : {}, { range: [lo, hi], depth })); return; }
      const mid = Math.floor((lo + hi) / 2);
      F.add(3, `Split [${lo}..${hi}] at mid = ${mid} into [${lo}..${mid}] and [${mid + 1}..${hi}].`, 'divide', snap(a, {}, { range: [lo, hi], split: mid, depth }));
      F.add(4, `Recurse on the left half [${lo}..${mid}].`, 'divide', snap(a, {}, { range: [lo, mid], depth: depth + 1 }));
      sort(lo, mid, depth + 1);
      F.add(5, `Recurse on the right half [${mid + 1}..${hi}].`, 'divide', snap(a, {}, { range: [mid + 1, hi], depth: depth + 1 }));
      sort(mid + 1, hi, depth + 1);
      const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1), out = [];
      F.add(6, `Both halves are sorted. Merge [${lo}..${mid}] and [${mid + 1}..${hi}].`, 'merge', snap(a, {}, { range: [lo, hi], split: mid, depth }));
      let i = 0, j = 0;
      const show = (note, mark, line, kind) => {
        a.splice(lo, hi - lo + 1, ...out, ...L.slice(i), ...R.slice(j));
        F.add(line, note, kind, snap(a, mark, { range: [lo, hi], depth }));
      };
      while (i < L.length && j < R.length) {
        const take = L[i].v <= R[j].v ? 'L' : 'R';
        a.splice(lo, hi - lo + 1, ...out, ...L.slice(i), ...R.slice(j));
        F.add(6, `Compare the front of each half: ${L[i].v} vs ${R[j].v}. Take ${take === 'L' ? L[i].v : R[j].v}.`, 'compare', snap(a, { [L[i].id]: 'cmp', [R[j].id]: 'cmp' }, { range: [lo, hi], depth }));
        if (take === 'L') out.push(L[i++]); else out.push(R[j++]);
        show(`Move ${out[out.length - 1].v} into the merged output.`, { [out[out.length - 1].id]: 'swap' }, 6, 'swap');
      }
      out.push(...L.slice(i), ...R.slice(j)); i = L.length; j = R.length;
      show(`One half is empty, so append the rest. [${lo}..${hi}] is now sorted.`, Object.fromEntries(out.map((x) => [x.id, 'sorted'])), 6, 'done');
    };
    sort(0, n - 1, 0);
    F.add(7, 'Sorted.', 'done', snap(a, full()));
  });
}

function quick({ arr }) {
  return collect((F) => {
    const a = items0(arr), n = a.length, fixed = new Set();
    const marks = (m) => ({ ...sortedMarks(fixed), ...m });
    F.add(1, 'Start. Quick sort picks a pivot, puts smaller items before it and larger after, then recurses on both sides.', 'info', snap(a, {}));
    const qs = (lo, hi, depth) => {
      if (lo >= hi) { if (lo === hi && lo >= 0 && lo < n) fixed.add(a[lo].id); F.add(2, `[${lo}..${hi}] has at most one item: nothing to do.`, 'done', snap(a, marks({}), { range: [lo, hi], depth })); return; }
      const pivot = a[hi];
      F.add(8, `Choose the last item, ${pivot.v}, as the pivot for [${lo}..${hi}].`, 'pivot', snap(a, marks({ [pivot.id]: 'pivot' }), { range: [lo, hi], depth }));
      let i = lo;
      for (let j = lo; j < hi; j++) {
        F.add(11, `Is ${a[j].v} < pivot ${pivot.v}?`, 'compare', snap(a, marks({ [pivot.id]: 'pivot', [a[j].id]: 'cmp' }), { range: [lo, hi], depth }));
        if (a[j].v < pivot.v) {
          [a[i], a[j]] = [a[j], a[i]];
          F.add(11, i === j ? `Yes. It is already in the "small" zone (index ${i}).` : `Yes. Swap it into the "small" zone at index ${i}.`, 'swap', snap(a, marks({ [pivot.id]: 'pivot', [a[i].id]: 'swap', [a[j].id]: 'swap' }), { range: [lo, hi], depth }));
          i++;
        }
      }
      [a[i], a[hi]] = [a[hi], a[i]]; fixed.add(pivot.id);
      F.add(13, `Swap the pivot into index ${i}. Everything left of it is smaller, right is larger: it is in its final place.`, 'done', snap(a, marks({}), { range: [lo, hi], depth }));
      qs(lo, i - 1, depth + 1); qs(i + 1, hi, depth + 1);
    };
    qs(0, n - 1, 0);
    F.add(15, 'Sorted.', 'done', snap(a, sortedMarks(new Set(a.map((x) => x.id)))));
  });
}

export default {
  id: 'sorting', title: 'Sorting', branch: 'Tier 1 · Data Structures', viz: 'bars',
  tagline: 'Watch bars swap, split and merge. Compare how different strategies reach the same sorted order.',
  params: [{ key: 'arr', label: 'Array (up to 12)', type: 'numlist', def: '6, 3, 8, 2, 9, 1, 5', max: 12, wide: true }],
  algos: [
    { id: 'bubble', title: 'Bubble', code: BUBBLE, run: bubble, type: 'Comparison · stable · in-place', complexity: { time: 'O(n²)', space: 'O(1)', best: 'O(n) with the early exit' },
      idea: 'Compare neighbours and swap them if out of order. After pass k the k largest items are in their final places at the end.',
      think: ['After the first pass, which item is guaranteed to be in place? Why?', 'What input makes the early-exit check useful?'], pitfalls: ['Quadratic: fine for teaching, rarely for production.'] },
    { id: 'insertion', title: 'Insertion', code: INSERTION, run: insertion, type: 'Comparison · stable · in-place', complexity: { time: 'O(n²)', space: 'O(1)', best: 'O(n) when nearly sorted' },
      idea: 'Keep a sorted prefix. Take the next item (the key) and slide it left past every bigger item.',
      think: ['Why is this fast on nearly-sorted input?', 'How many shifts happen on a reversed array?'], pitfalls: ['Shifting in a plain array is O(n) per insertion.'] },
    { id: 'merge', title: 'Merge', code: MERGE, run: merge, type: 'Divide & conquer · stable · O(n) extra space', complexity: { time: 'O(n log n)', space: 'O(n)', best: 'O(n log n) always' },
      idea: 'Split until each piece has one item (trivially sorted), then merge neighbouring sorted pieces by repeatedly taking the smaller front item.',
      think: ['How many levels of splitting for 8 items?', 'Why does merging two sorted halves take only linear time?'], pitfalls: ['Needs auxiliary memory for merging.'] },
    { id: 'quick', title: 'Quick', code: QUICK, run: quick, type: 'Divide & conquer · in-place · not stable', complexity: { time: 'O(n log n) avg', space: 'O(log n) stack', best: 'Worst case O(n²)' },
      idea: 'Pick a pivot, partition the rest into smaller and larger, and the pivot is already in its final position. Recurse on each side.',
      think: ['What input makes the last-element pivot degenerate?', 'Where is the pivot after partition, and why is it final?'], pitfalls: ['Bad pivot choices on sorted data give O(n²).'] },
  ],
};
