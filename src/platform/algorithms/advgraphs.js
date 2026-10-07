import { collect } from './common.js';
import heuristic from './heuristic.js';
import netflow from './netflow.js';

/* Advanced Graphs: Dijkstra (flagship, with the A* flagship and the previews merged in from heuristic.js / netflow.js).
   Dijkstra frame viz: { graph:{nodes,edges:[[u,v,w]]}, state, treeEdges, probe, struct:{name,items}, order, dist:{[id]:number|Infinity} } */

const GRAPH = {
  nodes: [['A', 10, 50], ['B', 32, 14], ['C', 34, 86], ['D', 68, 14], ['E', 90, 52], ['F', 66, 86]],
  edges: [['A', 'B', 7], ['A', 'C', 9], ['A', 'F', 14], ['B', 'C', 10], ['B', 'D', 15], ['C', 'D', 11], ['C', 'F', 2], ['D', 'E', 6], ['E', 'F', 9]],
};

const DIJKSTRA = `function dijkstra(graph, src) {
  const dist = {};  for (const v in graph) dist[v] = Infinity;
  dist[src] = 0;
  const pq = [[0, src]];                    // (distance, node)
  while (pq.length) {
    const [d, u] = popMin(pq);              // closest unsettled node
    if (d > dist[u]) continue;              // stale entry: skip
    for (const [v, w] of edges(u)) {
      if (d + w < dist[v]) {                // shorter path to v found
        dist[v] = d + w;                    // relax the edge
        pq.push([dist[v], v]);
      }
    }
  }
  return dist;
}`;

function dijkstra({ start }) {
  const nodes = GRAPH.nodes.map(([id, x, y]) => ({ id, x, y }));
  const adj = Object.fromEntries(nodes.map((n) => [n.id, []]));
  GRAPH.edges.forEach(([u, v, w]) => { adj[u].push([v, w]); adj[v].push([u, w]); });
  Object.values(adj).forEach((l) => l.sort((a, b) => (a[0] < b[0] ? -1 : 1)));
  const src = nodes.some((n) => n.id === String(start).toUpperCase()) ? String(start).toUpperCase() : 'A';
  return collect((F) => {
    const dist = Object.fromEntries(nodes.map((n) => [n.id, Infinity])), state = Object.fromEntries(nodes.map((n) => [n.id, 'unseen']));
    const prev = {}; let pq = [[0, src]]; const order = [];
    const tree = () => Object.entries(prev).map(([v, u]) => [u, v]);
    const v = (extra) => ({ graph: { nodes, edges: GRAPH.edges }, state: { ...state }, treeEdges: tree(), probe: null, struct: { name: 'Priority queue (smallest first)', items: [...pq].sort((a, b) => a[0] - b[0]).map(([d, id]) => `${id}:${d}`) }, order: [...order], dist: { ...dist }, ...extra });
    dist[src] = 0; state[src] = 'frontier';
    F.add(3, `Set every distance to ∞ except the source ${src} = 0, and put (0, ${src}) in the priority queue.`, 'info', v());
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : 1));
      const [d, u] = pq.shift();
      if (d > dist[u]) { F.add(7, `Pop (${d}, ${u}): a shorter distance (${dist[u]}) to ${u} is already known, so this entry is stale. Skip it.`, 'reject', v()); continue; }
      state[u] = 'current'; order.push(u);
      F.add(6, `Pop the closest unsettled node: ${u} at distance ${d}. Its distance is now final (all edge weights are non-negative).`, 'pick', v());
      for (const [nb, w] of adj[u]) {
        if (state[nb] === 'visited') continue;
        const cand = d + w;
        F.add(9, `Edge ${u}–${nb} (weight ${w}): going through ${u} costs ${d} + ${w} = ${cand}; current dist[${nb}] = ${dist[nb] === Infinity ? '∞' : dist[nb]}.`, 'compare', v({ probe: [u, nb] }));
        if (cand < dist[nb]) {
          const old = dist[nb];
          dist[nb] = cand; prev[nb] = u; pq.push([cand, nb]); if (state[nb] === 'unseen') state[nb] = 'frontier';
          F.add(10, `${cand} < ${old === Infinity ? '∞' : old}: relax the edge. dist[${nb}] = ${cand}; push (${cand}, ${nb}) on the queue.`, 'place', v({ probe: [u, nb] }));
        }
      }
      state[u] = 'visited';
      F.add(5, `Finished ${u}. ${pq.length ? 'Next, pop the smallest entry again.' : 'The queue is empty.'}`, 'info', v());
    }
    F.add(15, `Done. Shortest distances from ${src}: ${nodes.map((n) => `${n.id}=${dist[n.id]}`).join(', ')}. The green edges form the shortest-path tree.`, 'done', v());
  });
}

export default {
  id: 'advgraphs', title: 'Advanced Graphs', branch: 'Tier 3 · Intermediate & Advanced DAA', viz: 'graph', advanced: true,
  tagline: 'Weighted shortest paths, heuristic search and flow: watch the priority queue and the relaxed edges decide everything.',
  params: [{ key: 'start', label: 'Source node (A–F)', type: 'text', def: 'A', maxLen: 1 }],
  algos: [
    { id: 'dijkstra', title: "Dijkstra", code: DIJKSTRA, run: dijkstra, type: 'Greedy · priority queue · non-negative weights', complexity: { time: 'O((V + E) log V) with a binary heap', space: 'O(V)', best: 'O(V²) with a plain array' },
      think: ['Why is a popped node\'s distance final? What breaks with a negative edge?', 'Which entries in the queue are stale, and why are they harmless?'], pitfalls: ['Negative edge weights break the greedy argument (use Bellman–Ford).', 'Without the stale-entry check the same node can be expanded repeatedly.'] },
    ...heuristic.algos,
    ...netflow.algos,
  ],
};
