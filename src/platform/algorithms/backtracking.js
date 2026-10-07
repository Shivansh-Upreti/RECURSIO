import { collect } from './common.js';

/* Frame viz: { n, queens:[col or -1 per row], trying:{r,c}|null, attacker:{r,c}|null, status, placed, backtracks, solutions:[[...]]} */

const QUEENS = `function solve(row) {
  if (row === n) return true;               // all queens placed
  for (let col = 0; col < n; col++) {
    if (isSafe(row, col)) {                 // conflict check
      place(row, col);                      // choose
      if (solve(row + 1)) return true;      // explore
      remove(row, col);                     // un-choose: BACKTRACK
    }
  }
  return false;                             // dead end: retreat a row
}`;

function nQueens({ n, mode }) {
  const all = mode === 'all';
  return collect((F) => {
    const q = Array(n).fill(-1), solutions = [];
    let placed = 0, backtracks = 0;
    const v = (extra) => ({ n, queens: [...q], trying: null, attacker: null, placed, backtracks, solutions: solutions.map((s) => [...s]), ...extra });
    const clash = (r, c) => {
      for (let i = 0; i < r; i++) if (q[i] === c || Math.abs(q[i] - c) === r - i) return { r: i, c: q[i] };
      return null;
    };
    F.add(1, `Place ${n} queens so none attack each other. Rows are filled top to bottom; each row gets exactly one queen.`, 'info', v());
    const solve = (row) => {
      if (row === n) {
        solutions.push([...q]);
        F.add(2, `All ${n} queens are placed safely: solution #${solutions.length} found!`, 'done', v({ status: 'solved' }));
        return !all;
      }
      F.add(3, `Row ${row}: try each column from left to right.`, 'info', v());
      for (let col = 0; col < n; col++) {
        const bad = clash(row, col);
        if (bad) {
          F.add(4, `Try (row ${row}, col ${col}): CONFLICT. The queen at (row ${bad.r}, col ${bad.c}) attacks it${bad.c === col ? ' along the column' : ' along a diagonal'}.`, 'conflict', v({ trying: { r: row, c: col }, attacker: bad }));
          continue;
        }
        q[row] = col; placed++;
        F.add(5, `Try (row ${row}, col ${col}): safe. PLACE a queen here and move on to row ${row + 1}.`, 'place', v({ trying: { r: row, c: col } }));
        if (solve(row + 1)) return true;
        q[row] = -1; backtracks++;
        F.add(7, `Row ${row + 1} had no safe square, so REMOVE the queen at (row ${row}, col ${col}) and try the next column. This is backtracking.`, 'remove', v({ trying: { r: row, c: col } }));
      }
      F.add(10, `Row ${row}: every column failed. Dead end, so retreat to row ${row - 1}.`, 'deadend', v({ status: 'deadend' }));
      return false;
    };
    solve(0);
    if (!solutions.length) F.add(10, `No arrangement of ${n} queens exists.`, 'fail', v({ status: 'none' }));
    else if (all) F.add(10, `Search complete: ${solutions.length} solution(s) for n = ${n}.`, 'done', v({ status: 'complete' }));
  });
}

export default {
  id: 'backtracking', title: 'Backtracking', branch: 'Tier 2 · Core Paradigms', viz: 'board',
  tagline: 'Choose, explore, and undo. Watch conflicts get detected and wrong choices get taken back.',
  params: [
    { key: 'n', label: 'Board size (4–8)', type: 'int', def: 5, min: 4, max: 8 },
    { key: 'mode', label: 'Search', type: 'select', def: 'first', options: [{ v: 'first', l: 'Stop at first solution' }, { v: 'all', l: 'Find all solutions' }] },
  ],
  algos: [
    { id: 'nqueens', title: 'N-Queens', code: QUEENS, run: nQueens, type: 'Backtracking · constraint satisfaction', complexity: { time: 'O(n!) worst case, far less with pruning', space: 'O(n) recursion depth', best: 'Pruning cuts most branches early' },
      idea: 'Build the answer one row at a time. The moment a partial placement cannot be extended, undo the last choice and try the next option. Pruning invalid partial solutions is what separates this from brute force.',
      think: ['Why does the algorithm need the "remove" step at all?', 'How many placements did it need for n = 6 vs n = 8? What does that say about pruning?'], pitfalls: ['Forgetting to undo state (the remove step) corrupts later branches.', 'Without early conflict checks the search explodes.'] },
  ],
};
