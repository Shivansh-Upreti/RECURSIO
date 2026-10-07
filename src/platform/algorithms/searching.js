import { collect } from './common.js';

/* Frame viz: { cells:[v], ptr:{lo,hi,mid,i}, gone:[bool], found: index | -1 | null, target } */

const BINARY = `function binarySearch(a, target) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (a[mid] === target) return mid;
    if (a[mid] < target) lo = mid + 1;   // target is to the right
    else hi = mid - 1;                   // target is to the left
  }
  return -1;
}`;

const LINEAR = `function linearSearch(a, target) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === target) return i;
  }
  return -1;
}`;

function binary({ arr, target }) {
  const a = [...arr].sort((x, y) => x - y);
  return collect((F) => {
    let lo = 0, hi = a.length - 1;
    const gone = () => a.map((_, k) => k < lo || k > hi);
    const v = (ptr, found = null) => ({ cells: a, ptr, gone: gone(), found, target });
    F.add(1, `Search for ${target} in the sorted array. Binary search needs sorted data (yours was sorted for you).`, 'info', v({ lo: null, hi: null, mid: null }));
    F.add(2, `Start with the whole array: lo = ${lo}, hi = ${hi}.`, 'info', v({ lo, hi, mid: null }));
    while (lo <= hi) {
      F.add(3, `lo (${lo}) <= hi (${hi}), so the window [${lo}..${hi}] is not empty.`, 'info', v({ lo, hi, mid: null }));
      const mid = Math.floor((lo + hi) / 2);
      F.add(4, `mid = floor((${lo} + ${hi}) / 2) = ${mid}. Look at a[${mid}] = ${a[mid]}.`, 'compare', v({ lo, hi, mid }));
      if (a[mid] === target) { F.add(5, `a[${mid}] = ${a[mid]} equals the target: found at index ${mid}.`, 'done', v({ lo, hi, mid }, mid)); return; }
      if (a[mid] < target) {
        F.add(6, `${a[mid]} < ${target}: everything at or left of mid is too small. Move lo to ${mid + 1}.`, 'discard', v({ lo, hi, mid }));
        lo = mid + 1;
      } else {
        F.add(7, `${a[mid]} > ${target}: everything at or right of mid is too big. Move hi to ${mid - 1}.`, 'discard', v({ lo, hi, mid }));
        hi = mid - 1;
      }
      F.add(3, `The window is now [${lo}..${hi}]: half of the remaining items were discarded in one step.`, 'info', v({ lo, hi, mid: null }));
    }
    F.add(9, `lo (${lo}) > hi (${hi}): the window is empty, so ${target} is not in the array. Return -1.`, 'fail', v({ lo, hi, mid: null }, -1));
  });
}

function linear({ arr, target }) {
  const a = arr;
  return collect((F) => {
    const v = (i, found = null) => ({ cells: a, ptr: { lo: null, hi: null, mid: null, i }, gone: a.map((_, k) => i !== null && k < i), found, target });
    F.add(1, `Search for ${target}, checking items one by one from the left.`, 'info', v(null));
    for (let i = 0; i < a.length; i++) {
      F.add(3, `Is a[${i}] = ${a[i]} equal to ${target}?`, 'compare', v(i));
      if (a[i] === target) { F.add(3, `Yes: found at index ${i} after ${i + 1} comparison(s).`, 'done', v(i, i)); return; }
    }
    F.add(5, `Checked all ${a.length} items without a match. Return -1.`, 'fail', v(a.length, -1));
  });
}

export default {
  id: 'searching', title: 'Searching', branch: 'Tier 1 · Data Structures', viz: 'cells',
  tagline: 'See the search window shrink. Binary search discards half of the remaining items with every comparison.',
  params: [
    { key: 'arr', label: 'Array (up to 14)', type: 'numlist', def: '4, 8, 15, 16, 23, 42, 57, 61, 78', max: 14, wide: true },
    { key: 'target', label: 'Target', type: 'int', def: 23, min: -999, max: 999 },
  ],
  algos: [
    { id: 'binary', title: 'Binary', code: BINARY, run: binary, type: 'Divide & conquer · needs sorted input', complexity: { time: 'O(log n)', space: 'O(1)', best: 'O(1) if mid hits the target' },
      idea: 'Compare with the middle. Because the array is sorted, one comparison eliminates half of the remaining candidates.',
      think: ['How many comparisons for 1,000,000 items at most?', 'What happens to lo and hi when the target is smaller than every item?'], pitfalls: ['Unsorted input gives wrong answers silently.', 'Computing mid as (lo+hi)/2 can overflow in fixed-width integer languages.'] },
    { id: 'linear', title: 'Linear', code: LINEAR, run: linear, type: 'Sequential scan · no ordering needed', complexity: { time: 'O(n)', space: 'O(1)', best: 'O(1) if first item matches' },
      idea: 'Check every item in turn. Slow, but it works on any data and is the baseline binary search must beat.',
      think: ['When is linear search actually the better choice?', 'Try the same target in both modes: compare the comparison counts.'], pitfalls: ['Cost grows linearly with data size.'] },
  ],
};
