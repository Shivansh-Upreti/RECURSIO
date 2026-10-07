/* Tier 3 scaffold: annotated pseudo-code + explanations (see advdc.js for the placeholder contract). */

const TARJAN = `tarjan(u):
  index[u] = low[u] = ++counter;  push u on stack;  onStack[u] = true
  for each edge u → v:
    if v is unvisited:   tarjan(v);   low[u] = min(low[u], low[v])
    else if onStack[v]:               low[u] = min(low[u], index[v])
  if low[u] == index[u]:                  // u is the root of an SCC
    pop the stack down to u; those nodes form one strongly connected component`;

const JOHNSON = `johnson(G):
  add a new vertex s with 0-weight edges to every vertex
  h = BellmanFord(G', s);  if a negative cycle exists: report it and stop
  reweight every edge: w'(u, v) = w(u, v) + h[u] − h[v]      // now all ≥ 0
  for each vertex u: run Dijkstra(G, w', u)  →  d'(u, v)
  d(u, v) = d'(u, v) − h[u] + h[v]`;

const FORD = `fordFulkerson(G, s, t):
  flow = 0;  residual = copy of the capacities
  while there is an augmenting path P from s to t in the residual graph:
    b = min residual capacity along P                  // the bottleneck
    for each edge (u, v) on P:  residual[u][v] −= b;  residual[v][u] += b
    flow += b
  return flow`;

export default {
  id: 'netflow', title: 'Graph & Network Flow', branch: 'Tier 3 · Intermediate & Advanced DAA', viz: 'none', advanced: true,
  tagline: 'Components, shortest paths with negative edges, and maximum flow: the machinery behind routing, scheduling and matching.',
  params: [],
  algos: [
    { id: 'tarjan', title: "Tarjan's SCCs", code: TARJAN, placeholder: true, type: 'DFS · strongly connected components', params: [],
      complexity: { time: 'Θ(V + E)', space: 'Θ(V)', best: 'One DFS pass' },
      lines: {
        1: 'A strongly connected component (SCC) is a maximal set of vertices that can all reach each other. Tarjan finds all of them in one DFS.',
        2: 'index[u] is the discovery time. low[u] will be the smallest discovery time reachable from u\'s DFS subtree using at most one back edge to a node still on the stack.',
        3: 'Look at every outgoing edge of u.',
        4: 'Tree edge: recurse into v, then u can reach whatever v can reach, so take the smaller low.',
        5: 'Edge to a vertex still on the stack: it is in the same SCC as an ancestor. Use its discovery index.',
        6: 'If low[u] == index[u], nothing in u\'s subtree reaches above u: u is the root (head) of an SCC.',
        7: 'Everything above u on the stack, down to u, is exactly that SCC. Pop it.',
      },
      planned: 'A directed graph with index/low labels on each vertex, the stack drawn alongside, and each SCC colouring itself the moment its root pops it.',
      think: ['Why must a cross edge to a node NOT on the stack be ignored for low[u]?', 'How does the stack encode "the current candidate component"?'], pitfalls: ['Using index[v] vs low[v] in the back-edge case both work for correctness, but mixing them up in the tree-edge case does not.'] },
    { id: 'johnson', title: "Johnson's all-pairs", code: JOHNSON, placeholder: true, type: 'Reweighting · Bellman-Ford + Dijkstra', params: [],
      complexity: { time: 'O(V² log V + VE) with a Fibonacci heap (O(VE log V) with a binary heap)', space: 'Θ(V²) for the output', best: 'Beats Floyd–Warshall Θ(V³) on sparse graphs' },
      lines: {
        1: 'All-pairs shortest paths on a graph that may have negative edges (but no negative cycles). Dijkstra alone cannot handle negative edges.',
        2: 'Add a helper source s connected to every vertex with weight 0.',
        3: 'Bellman–Ford from s gives potentials h[v] = shortest distance from s. If it finds a negative cycle, shortest paths are undefined: stop.',
        4: 'New weights w\'(u,v) = w + h[u] − h[v] are all ≥ 0 because h obeys the triangle inequality. Every path from a to b changes by the same amount h[a] − h[b], so shortest paths are preserved.',
        5: 'With non-negative weights, run Dijkstra from every vertex.',
        6: 'Undo the reweighting to recover the true distances.',
      },
      planned: 'Side-by-side graphs, original and reweighted, with edge weights animating from negative to non-negative, then a distance matrix filling row by row.',
      think: ['Why does reweighting not change which path is shortest?', 'When would you choose Floyd–Warshall instead?'], pitfalls: ['A negative cycle makes the problem ill-defined; Bellman–Ford is the detector.'] },
    { id: 'fordfulkerson', title: 'Ford–Fulkerson max-flow', code: FORD, placeholder: true, type: 'Augmenting paths · residual graph', params: [],
      complexity: { time: 'O(E · f) for integer capacities (f = max flow); O(V·E²) with BFS paths (Edmonds–Karp)', space: 'Θ(V + E)', best: 'Max-flow = min-cut' },
      lines: {
        1: 'Find the largest amount of flow that can be sent from source s to sink t without exceeding any edge capacity.',
        2: 'Start with zero flow. The residual graph records how much more each edge can take.',
        3: 'Keep finding an augmenting path: any s→t path that still has spare capacity on every edge.',
        4: 'The bottleneck b is the smallest residual capacity on the path: that is how much we can push.',
        5: 'Push b along the path: reduce forward residuals and ADD backward residuals. The backward edges let later paths undo earlier mistakes.',
        6: 'Add b to the total flow.',
        7: 'When no augmenting path exists, the flow is maximum. The edges crossing from the reachable set form a minimum cut of equal value (max-flow min-cut theorem).',
      },
      planned: 'A flow network with capacity/flow labels on edges, the chosen augmenting path glowing, the residual graph beside it, and the min-cut revealed at the end.',
      think: ['Why are backward residual edges necessary?', 'What can go wrong with unlucky path choices and large capacities (and how does BFS fix it)?'], pitfalls: ['With irrational capacities and arbitrary path choice, Ford–Fulkerson may not terminate.'] },
  ],
};
