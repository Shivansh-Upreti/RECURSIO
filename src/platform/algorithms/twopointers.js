import { collect } from './common.js';

/* Frame viz: { cells:[v], L, R, mode:'cells'|'bars', verdict:'match'|'miss'|null, water?:{h,from,to}, info?:string } */

const TWO_SUM = `function twoSumSorted(a, target) {
  let l = 0, r = a.length - 1;
  while (l < r) {
    const sum = a[l] + a[r];
    if (sum === target) return [l, r];
    if (sum < target) l++;      // need a bigger sum
    else r--;                   // need a smaller sum
  }
  return null;
}`;

const PALINDROME = `function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return false;
    l++; r--;
  }
  return true;
}`;

const WATER = `function maxArea(h) {
  let l = 0, r = h.length - 1, best = 0;
  while (l < r) {
    const area = Math.min(h[l], h[r]) * (r - l);
    best = Math.max(best, area);
    if (h[l] < h[r]) l++;     // move the shorter wall
    else r--;
  }
  return best;
}`;

function twoSum({ arr, target }) {
  const a = [...arr].sort((x, y) => x - y);
  return collect((F) => {
    let l = 0, r = a.length - 1;
    const v = (extra) => ({ cells: a, L: l, R: r, mode: 'cells', verdict: null, ...extra });
    F.add(2, `Sorted array, target ${target}. Put one pointer at each end: l = 0, r = ${r}.`, 'info', v());
    while (l < r) {
      const sum = a[l] + a[r];
      F.add(4, `sum = a[${l}] + a[${r}] = ${a[l]} + ${a[r]} = ${sum}.`, 'compare', v({ info: `${a[l]} + ${a[r]} = ${sum}` }));
      if (sum === target) { F.add(5, `${sum} equals the target ${target}. Found the pair at indices (${l}, ${r}).`, 'done', v({ verdict: 'match', info: `${a[l]} + ${a[r]} = ${sum}` })); return; }
      if (sum < target) { F.add(6, `${sum} < ${target}: the sum is too small. Only moving l right can make it bigger (r is already the largest option for this l).`, 'move', v({ info: `${sum} < ${target}` })); l++; }
      else { F.add(7, `${sum} > ${target}: the sum is too big. Only moving r left can make it smaller.`, 'move', v({ info: `${sum} > ${target}` })); r--; }
    }
    F.add(9, 'The pointers met without finding a pair: no two items sum to the target.', 'fail', v({ verdict: 'miss' }));
  });
}

function palindrome({ text }) {
  const all = [...String(text).toLowerCase().replace(/[^a-z0-9]/g, '')], s = all.slice(0, 18);
  return collect((F) => {
    let l = 0, r = s.length - 1;
    const v = (extra) => ({ cells: s, L: l, R: r, mode: 'cells', verdict: null, ...extra });
    F.add(2, `Check whether "${s.join('')}" reads the same both ways (letters and digits only${all.length > s.length ? `; only the first ${s.length} characters are used` : ''}).`, 'info', v());
    while (l < r) {
      F.add(4, `Compare s[${l}] = "${s[l]}" with s[${r}] = "${s[r]}".`, 'compare', v());
      if (s[l] !== s[r]) { F.add(4, `"${s[l]}" ≠ "${s[r]}": not a palindrome.`, 'fail', v({ verdict: 'miss' })); return; }
      F.add(5, 'They match. Move both pointers inward.', 'move', v());
      l++; r--;
    }
    F.add(7, 'All pairs matched: it is a palindrome.', 'done', v({ verdict: 'match' }));
  });
}

function water({ arr }) {
  const h = arr.map((x) => Math.max(0, x));
  return collect((F) => {
    let l = 0, r = h.length - 1, best = 0;
    const v = (extra) => ({ cells: h, L: l, R: r, mode: 'bars', verdict: null, best, ...extra });
    F.add(2, 'Walls of the given heights. Find two walls that hold the most water.', 'info', v());
    while (l < r) {
      const hh = Math.min(h[l], h[r]), area = hh * (r - l);
      F.add(4, `Water level = min(${h[l]}, ${h[r]}) = ${hh}; width = ${r - l}; area = ${area}.`, 'compare', v({ water: { h: hh, from: l, to: r } }));
      const prev = best; best = Math.max(best, area);
      F.add(5, area > prev ? `New best area: ${best}.` : `Best stays ${best}.`, area > prev ? 'pick' : 'info', v({ water: { h: hh, from: l, to: r } }));
      if (h[l] < h[r]) { F.add(6, `The left wall (${h[l]}) is shorter. Moving the taller wall could never help (width shrinks, height is still capped by ${h[l]}), so move l.`, 'move', v({ water: { h: hh, from: l, to: r } })); l++; }
      else { F.add(7, `The right wall (${h[r]}) is the shorter (or equal). Move r inward.`, 'move', v({ water: { h: hh, from: l, to: r } })); r--; }
    }
    F.add(9, `Pointers met. The largest area is ${best}.`, 'done', v({ verdict: 'match' }));
  });
}

export default {
  id: 'twopointers', title: 'Two Pointers', branch: 'Tier 1 · Data Structures', viz: 'pointers',
  tagline: 'Two indices walk toward each other. See why discarding one side at a time is always safe.',
  params: [{ key: 'arr', label: 'Array (up to 14)', type: 'numlist', def: '1, 3, 4, 6, 8, 11, 15', max: 14, wide: true }, { key: 'target', label: 'Target sum', type: 'int', def: 14, min: -999, max: 999 }],
  algos: [
    { id: 'twosum', title: 'Two-sum (sorted)', code: TWO_SUM, run: twoSum, type: 'Opposite-end pointers', complexity: { time: 'O(n)', space: 'O(1)', best: 'Brute force is O(n²)' },
      idea: 'In a sorted array a too-small sum can only be fixed by a larger left item; a too-big sum only by a smaller right item. Each step safely discards one candidate.',
      think: ['Why can we discard a[l] when the sum is too small?', 'What breaks if the array is not sorted?'], pitfalls: ['Requires sorted input (this page sorts it for you).'] },
    { id: 'palindrome', title: 'Palindrome', code: PALINDROME, run: palindrome, type: 'Opposite-end pointers', complexity: { time: 'O(n)', space: 'O(1)', best: 'Exits at the first mismatch' },
      idea: 'A palindrome mirrors itself, so compare the outermost characters and move inward.', params: [{ key: 'text', label: 'Text (first 18 letters/digits)', type: 'text', def: 'A Santa at NASA', maxLen: 40, wide: true }],
      think: ['How many comparisons for a string of length n?', 'What if the pointers cross?'], pitfalls: ['Real inputs need case and punctuation normalisation first.'] },
    { id: 'water', title: 'Most water', code: WATER, run: water, type: 'Greedy pointer movement', complexity: { time: 'O(n)', space: 'O(1)', best: 'Brute force is O(n²)' },
      idea: 'The area is limited by the shorter wall. Moving the taller wall can only shrink the width without raising the limit, so always move the shorter one.', params: [{ key: 'arr', label: 'Heights (up to 14)', type: 'numlist', def: '1, 8, 6, 2, 5, 4, 8, 3, 7', max: 14, wide: true }],
      think: ['Prove why moving the shorter wall never skips the optimum.', 'What happens with two equal walls?'], pitfalls: ['The greedy argument is the whole algorithm; without it this looks like guesswork.'] },
  ],
};
