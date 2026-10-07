import { collect } from './common.js';

/* A* flagship. Frame viz: { rows, cols, walls:Set-like [[r,c]], start, goal, info:{"r,c":{g,h,f,s}}, cur, openList:[{r,c,g,h,f}], path:[[r,c]], expanded, heuristic } */

const ASTAR = `A_star(start, goal):
  open = PriorityQueue();  open.push(start, f = h(start))
  g[start] = 0
  while open is not empty:
    cur = open.popMin()                    // smallest f = g + h
    if cur == goal: return reconstruct(cur)
    closed.add(cur)
    for nb in neighbors(cur):
      if nb is a wall or nb in closed: continue
      tentative = g[cur] + 1
      if tentative < g[nb]:                // found a cheaper way to nb
        parent[nb] = cur;  g[nb] = tentative
        open.push(nb, f = g[nb] + h(nb))
  return FAILURE                           // open list ran dry`;

const AOSTAR = `AOStar(graph, start):
  while start is not SOLVED and cost(start) < FUTILITY:
    expand the best partial solution graph: pick an unexpanded node n on it
    generate n's successors (OR choices; AND groups)
    S = { n }
    while S is not empty:
      pick m from S with no descendant in S
      for each arc of m: cost(arc) = sum(edgeCost + cost(child)) over its AND children
      cost(m) = min cost(arc);  mark the minimising arc as m's best
      if every child on m's best arc is SOLVED: mark m SOLVED
      if cost(m) changed or m became SOLVED: add m's parents to S   // back-propagate`;

const MAPS = {
  open: { rows: ['.........', '.........', '.........', '.........', '.........', '.........', '.........'], start: [3, 1], goal: [3, 7], label: 'Open field' },
  wall: { rows: ['....#....', '....#....', '....#....', '....#....', '....#....', '....#....', '.........'], start: [3, 1], goal: [3, 7], label: 'Wall with a gap at the bottom' },
  trap: { rows: ['.........', '..#####..', '......#..', '......#..', '......#..', '..#####..', '.........'], start: [3, 4], goal: [3, 8], label: 'Dead-end trap (cup)' },
};
const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];

function astar({ map, heur }) {
  const M = MAPS[map] || MAPS.open, R = M.rows.length, C = M.rows[0].length;
  const wall = (r, c) => M.rows[r][c] === '#';
  const h = (r, c) => (heur === 'zero' ? 0 : Math.abs(r - M.goal[0]) + Math.abs(c - M.goal[1]));
  const key = (r, c) => r + ',' + c;
  return collect((F) => {
    const g = new Map(), parent = new Map(), info = {}, closed = new Set();
    let open = [], seq = 0, expanded = 0;
    const walls = []; M.rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') walls.push([r, c]); }));
    const sorted = () => [...open].sort((a, b) => a.f - b.f || a.h - b.h || a.seq - b.seq);
    const v = (extra) => ({ rows: R, cols: C, walls, start: M.start, goal: M.goal, info: JSON.parse(JSON.stringify(info)), cur: null, openList: sorted().map(({ r, c, g: gg, h: hh, f }) => ({ r, c, g: gg, h: hh, f })), path: [], expanded, heuristic: heur, ...extra });
    const [sr, sc] = M.start;
    g.set(key(sr, sc), 0);
    open.push({ r: sr, c: sc, g: 0, h: h(sr, sc), f: h(sr, sc), seq: seq++ });
    info[key(sr, sc)] = { g: 0, h: h(sr, sc), f: h(sr, sc), s: 'open' };
    F.add(2, `Start: push S onto the open list with f = g + h = 0 + ${h(sr, sc)} = ${h(sr, sc)}. ${heur === 'zero' ? 'With h = 0 this is Dijkstra: it ignores the goal direction.' : 'h is the Manhattan distance to the goal G (an admissible estimate: it never overestimates on a 4-connected grid).'}`, 'info', v());
    while (open.length) {
      const ord = sorted(); const cur = ord[0];
      open = open.filter((o) => o !== cur);
      info[key(cur.r, cur.c)].s = 'current';
      F.add(5, `Pop the open node with the smallest f: (${cur.r},${cur.c}) with f = ${cur.g} + ${cur.h} = ${cur.f}${ord.length > 1 && ord[1].f === cur.f ? ' (tie broken by smaller h)' : ''}.`, 'pick', v({ cur: [cur.r, cur.c] }));
      if (cur.r === M.goal[0] && cur.c === M.goal[1]) {
        const path = []; let k = key(cur.r, cur.c);
        while (k) { const [pr, pc] = k.split(',').map(Number); path.unshift([pr, pc]); k = parent.get(k); }
        F.add(6, `Reached the goal G! Follow the parent links back to S: the path has ${path.length - 1} steps, and ${expanded} nodes were expanded to find it.`, 'done', v({ cur: [cur.r, cur.c], path }));
        return;
      }
      closed.add(key(cur.r, cur.c)); expanded++;
      info[key(cur.r, cur.c)].s = 'closed';
      F.add(7, `Close (${cur.r},${cur.c}): its best g is final. Now look at its neighbours.`, 'info', v({ cur: [cur.r, cur.c] }));
      for (const [dr, dc] of DIRS) {
        const nr = cur.r + dr, nc = cur.c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C || wall(nr, nc) || closed.has(key(nr, nc))) continue;
        const t = cur.g + 1, old = g.get(key(nr, nc));
        if (old === undefined || t < old) {
          g.set(key(nr, nc), t); parent.set(key(nr, nc), key(cur.r, cur.c));
          open = open.filter((o) => !(o.r === nr && o.c === nc));
          const hh = h(nr, nc);
          open.push({ r: nr, c: nc, g: t, h: hh, f: t + hh, seq: seq++ });
          info[key(nr, nc)] = { g: t, h: hh, f: t + hh, s: 'open' };
          F.add(12, old === undefined ? `Discover (${nr},${nc}): g = ${t}, h = ${hh}, so f = ${t + hh}. Push it on the open list.` : `Cheaper route to (${nr},${nc}): g improves from ${old} to ${t}. Update its f to ${t + hh}.`, old === undefined ? 'place' : 'pick', v({ cur: [cur.r, cur.c] }));
        }
      }
    }
    F.add(14, 'The open list is empty and the goal was never reached: no path exists.', 'fail', v());
  });
}

const ASTAR_PARAMS = [
    { key: 'map', label: 'Map', type: 'select', def: 'wall', options: Object.entries(MAPS).map(([v, m]) => ({ v, l: m.label })) },
    { key: 'heur', label: 'Heuristic h(n)', type: 'select', def: 'manhattan', options: [{ v: 'manhattan', l: 'Manhattan distance (A*)' }, { v: 'zero', l: 'h = 0 (Dijkstra)' }] },
  ];

export default {
  id: 'heuristic', title: 'Heuristic Search', branch: 'Tier 3 · Intermediate & Advanced DAA', viz: 'astar', advanced: true,
  tagline: 'Best-first search that blends the cost so far, g(n), with a guess of the cost to go, h(n). Watch f(n) = g(n) + h(n) steer the open list.',
  params: [],
  algos: [
    { id: 'astar', title: 'A* search', code: ASTAR, run: astar, viz: 'astar', params: ASTAR_PARAMS, type: 'Informed best-first search', complexity: { time: 'O(b^d) worst case; far fewer expansions with a good h', space: 'O(b^d) (keeps all generated nodes)', best: 'Optimal if h is admissible (and consistent for no re-expansions)' },
      think: ['Compare the expanded count with h = Manhattan versus h = 0 on the same map. What does the heuristic buy you?', 'On the dead-end trap, why does A* first walk into the cup?'], pitfalls: ['An inadmissible h (overestimates) can return a non-optimal path.', 'Memory, not time, is usually the limiting factor.'] },
    {
      id: 'aostar', title: 'AO* (preview)', code: AOSTAR, placeholder: true, type: 'AND-OR graph search · scaffold', params: [],
      complexity: { time: 'Depends on the graph; each revision is a bottom-up cost update', space: 'O(size of the explored AND-OR graph)', best: 'Finds a minimum-cost solution GRAPH, not a path' },
      lines: {
        1: 'AO* works on an AND-OR graph. An OR node needs ONE child solved; an AND arc needs ALL of its children solved.',
        2: 'Keep going until the start node is solved (or its cost becomes unacceptably high).',
        3: 'Only the currently best partial solution graph is expanded, never the whole graph.',
        4: 'Expanding a node reveals its alternatives: OR choices, each possibly an AND group of sub-problems.',
        5: 'S holds the nodes whose cost estimates may now be wrong and must be revised.',
        6: 'Revise until nothing is left to fix.',
        7: 'Pick a node in S that has no descendant in S, so its children are already up to date (bottom-up order).',
        8: 'An arc with several children is an AND arc: its cost is the sum of (edge cost + child cost) over all of them.',
        9: 'The node takes the cheapest of its arcs and remembers which one it is (its best arc).',
        10: 'A node is SOLVED once every child on its best arc is solved.',
        11: 'If the cost changed or the node became solved, its parents may now be wrong too, so they join S: this is the back-propagation of revisions.',
      },
      planned: 'An AND-OR tree where AND arcs are drawn as a distinct arc joining their children, with the best arc highlighted and each cost revision animating upward from the leaf to the root.',
      think: ['Why is the answer a graph (a set of sub-solutions) and not a single path?', 'Why can A* not solve an AND-OR problem directly?'], pitfalls: ['Cycles in the graph need special handling; classic AO* assumes an acyclic AND-OR graph.'],
    },
  ],
};
