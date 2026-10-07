import { collect } from './common.js';

/* Frame viz: { acts:[{id,s,f}], status:{[id]:'pending'|'considering'|'chosen'|'rejected'}, last, tmax, sorted } */

const ACTIVITY = `function selectActivities(acts) {
  acts.sort((a, b) => a.finish - b.finish);   // greedy key: earliest finish first
  const chosen = [acts[0]];
  let last = acts[0].finish;
  for (let i = 1; i < acts.length; i++) {
    if (acts[i].start >= last) {              // compatible with what we hold?
      chosen.push(acts[i]);                   // GREEDY CHOICE: take it
      last = acts[i].finish;
    }                                         // else: it overlaps, skip it
  }
  return chosen;
}`;

function parseActs(text) {
  return String(text).split(/[,;]+/).map((p) => p.trim().match(/^(\d+)\s*[-–:]\s*(\d+)$/)).filter(Boolean)
    .map((m) => ({ s: +m[1], f: +m[2] })).filter((a) => a.f > a.s && a.f <= 60).slice(0, 12).map((a, i) => ({ id: i, ...a }));
}

function activity({ acts: text }) {
  const raw = parseActs(text);
  if (!raw.length) return { frames: [{ line: 1, kind: 'fail', note: 'Enter activities like 1-4, 3-5, 0-6 (start-finish, finish > start).', acts: [], status: {}, last: null, tmax: 1, sorted: false }], truncated: false };
  return collect((F) => {
    const tmax = Math.max(...raw.map((a) => a.f));
    const status = {}; raw.forEach((a) => { status[a.id] = 'pending'; });
    let list = [...raw], last = null;
    const v = (sorted) => ({ acts: list.map((a) => ({ ...a })), status: { ...status }, last, tmax, sorted });
    F.add(1, 'Goal: attend as many non-overlapping activities as possible. Here they are, in input order.', 'info', v(false));
    list.sort((a, b) => a.f - b.f || a.s - b.s);
    F.add(2, 'Greedy rule: sort by FINISH time. Finishing early leaves the most room for what comes next.', 'info', v(true));
    status[list[0].id] = 'chosen'; last = list[0].f;
    F.add(3, `Take the first one, [${list[0].s}, ${list[0].f}). Nothing finishes earlier, so no better first choice exists. last = ${last}.`, 'pick', v(true));
    for (let i = 1; i < list.length; i++) {
      const a = list[i];
      status[a.id] = 'considering';
      F.add(6, `Consider [${a.s}, ${a.f}): does it start at or after last = ${last}? ${a.s} ${a.s >= last ? '>=' : '<'} ${last}.`, 'compare', v(true));
      if (a.s >= last) {
        status[a.id] = 'chosen'; last = a.f;
        F.add(7, `Compatible. It is the earliest-finishing compatible activity, so take it. last = ${last}.`, 'pick', v(true));
      } else {
        status[a.id] = 'rejected';
        F.add(9, `It overlaps the activity we already hold, so skip it.`, 'reject', v(true));
      }
    }
    const n = Object.values(status).filter((s) => s === 'chosen').length;
    F.add(11, `Done: ${n} activities selected. The earliest-finish rule is provably optimal for this problem (exchange argument).`, 'done', v(true));
  });
}

export default {
  id: 'greedy', title: 'Greedy Approach', branch: 'Tier 2 · Core Paradigms', viz: 'timeline',
  tagline: 'Make the best-looking choice now and never look back. See exactly which choice is made and why it is safe.',
  params: [{ key: 'acts', label: 'Activities (start-finish, comma separated)', type: 'text', def: '1-4, 3-5, 0-6, 5-7, 3-9, 5-9, 6-10, 8-11, 8-12, 2-14, 12-16', maxLen: 120, wide: true }],
  algos: [
    { id: 'activity', title: 'Interval scheduling', code: ACTIVITY, run: activity, type: 'Greedy · exchange argument', complexity: { time: 'O(n log n) for the sort', space: 'O(1) extra', best: 'The scan itself is O(n)' },
      idea: 'Pick the compatible activity that finishes first, then repeat. A greedy choice is only valid if you can argue it never hurts: any optimal schedule can be rewritten to start with it.',
      think: ['What goes wrong if you sort by start time, or by shortest duration? Try to construct a counter-example.', 'Why does finishing early dominate every alternative first choice?'], pitfalls: ['Greedy is not always optimal (e.g. coin change with odd denominations). The proof is part of the algorithm.'] },
  ],
};
