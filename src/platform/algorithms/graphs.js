import { collect } from './common.js';

/* Frame viz: { graph:{nodes:[{id,x,y}], edges:[[u,v]]}, state:{[id]:'unseen'|'frontier'|'current'|'visited'}, treeEdges:[[u,v]],
   probe:[u,v]|null, struct:{name, items:[id]}, order:[id] }   (x,y are 0..100 layout coordinates) */

const GRAPHS = {
  campus: {
    nodes: [['A', 14, 18], ['B', 46, 8], ['C', 82, 18], ['D', 28, 52], ['E', 64, 50], ['F', 12, 86], ['G', 50, 88]],
    edges: [['A', 'B'], ['A', 'D'], ['B', 'C'], ['B', 'E'], ['C', 'E'], ['D', 'E'], ['D', 'F'], ['E', 'G'], ['F', 'G']],
  },
  tree: {
    nodes: [['A', 50, 10], ['B', 25, 40], ['C', 75, 40], ['D', 12, 78], ['E', 38, 78], ['F', 62, 78], ['G', 88, 78]],
    edges: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['C', 'G']],
  },
};

const BFS = `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const u = queue.shift();            // dequeue the OLDEST
    for (const v of graph[u]) {
      if (!visited.has(v)) {
        visited.add(v);
        queue.push(v);                  // enqueue at the back
      }
    }
  }
}`;

const DFS = `function dfs(graph, start) {
  const visited = new Set();
  const stack = [start];
  while (stack.length) {
    const u = stack.pop();              // take the NEWEST
    if (visited.has(u)) continue;
    visited.add(u);                     // visit
    for (const v of graph[u].slice().reverse()) {
      if (!visited.has(v)) stack.push(v);
    }
  }
}`;

function setup(p) {
  const g = GRAPHS[p.graph] || GRAPHS.campus;
  const nodes = g.nodes.map(([id, x, y]) => ({ id, x, y }));
  const adj = Object.fromEntries(nodes.map((n) => [n.id, []]));
  g.edges.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
  Object.values(adj).forEach((l) => l.sort());
  const start = nodes.some((n) => n.id === String(p.start).toUpperCase()) ? String(p.start).toUpperCase() : nodes[0].id;
  return { graph: { nodes, edges: g.edges }, adj, start };
}

function bfs(p) {
  const { graph, adj, start } = setup(p);
  return collect((F) => {
    const state = Object.fromEntries(graph.nodes.map((n) => [n.id, 'unseen'])), tree = [], order = [];
    const queue = [start];
    const v = (extra) => ({ graph, state: { ...state }, treeEdges: tree.map((e) => [...e]), probe: null, struct: { name: 'Queue (front → back)', items: [...queue] }, order: [...order], visited: Object.keys(state).filter((k) => state[k] !== 'unseen'), ...extra });
    state[start] = 'frontier';
    F.add(3, `Start at ${start}: add it to the visited set and put it in the queue. Nodes are added to the visited set when DISCOVERED, so none is ever queued twice.`, 'info', v());
    while (queue.length) {
      const u = queue.shift();
      state[u] = 'current'; order.push(u);
      F.add(5, `Dequeue ${u} (the item that has waited longest). Visit it.`, 'pick', v());
      for (const n of adj[u]) {
        F.add(6, `Look at neighbour ${n} of ${u}.`, 'compare', v({ probe: [u, n] }));
        if (state[n] === 'unseen') {
          state[n] = 'frontier'; queue.push(n); tree.push([u, n]);
          F.add(9, `${n} is not in the visited set: add it now and enqueue it at the back.`, 'place', v({ probe: [u, n] }));
        } else F.add(7, `${n} is already in the visited set, so skip it. Without this check, this edge could lead around a cycle forever.`, 'reject', v({ probe: [u, n] }));
      }
      state[u] = 'visited';
      F.add(4, `Finished ${u}. ${queue.length ? `Next in the queue: ${queue[0]}.` : 'The queue is empty.'}`, 'info', v());
    }
    F.add(11, `Done. BFS visits nodes level by level: ${order.join(' → ')}. It finds the fewest-edges path from ${start} to every node.`, 'done', v());
  });
}

function dfs(p) {
  const { graph, adj, start } = setup(p);
  return collect((F) => {
    const state = Object.fromEntries(graph.nodes.map((n) => [n.id, 'unseen'])), tree = [], order = [], parent = {};
    const stack = [start];
    state[start] = 'frontier';
    const v = (extra) => ({ graph, state: { ...state }, treeEdges: tree.map((e) => [...e]), probe: null, struct: { name: 'Stack (bottom → top)', items: [...stack] }, order: [...order], visited: Object.keys(state).filter((k) => state[k] === 'visited' || state[k] === 'current'), ...extra });
    F.add(3, `Start at ${start}: push it on the stack.`, 'info', v());
    while (stack.length) {
      const u = stack.pop();
      F.add(5, `Pop ${u} (the most recently pushed).`, 'compare', v());
      if (state[u] === 'visited') { F.add(6, `${u} is already in the visited set: skip it. (This is how DFS avoids looping around cycles.)`, 'reject', v()); continue; }
      state[u] = 'current'; order.push(u);
      if (parent[u] !== undefined) tree.push([parent[u], u]);
      F.add(7, `Visit ${u}.`, 'pick', v());
      for (const n of [...adj[u]].reverse()) {
        if (state[n] !== 'visited') {
          if (state[n] === 'unseen') state[n] = 'frontier';
          parent[n] = u; stack.push(n);
          F.add(9, `Push neighbour ${n}. (Pushed in reverse so the alphabetically first neighbour is explored first.)`, 'place', v({ probe: [u, n] }));
        }
      }
      state[u] = 'visited';
      F.add(4, `Finished expanding ${u}. ${stack.length ? `Next to explore: ${stack[stack.length - 1]}, the newest.` : 'The stack is empty.'}`, 'info', v());
    }
    F.add(11, `Done. DFS dives as deep as possible before backing up: ${order.join(' → ')}.`, 'done', v());
  });
}

export default {
  id: 'graphs', title: 'Graph Traversals', branch: 'Tier 1 · Data Structures', viz: 'graph',
  tagline: 'The only difference between BFS and DFS is queue versus stack. Watch how that one choice changes everything.',
  params: [
    { key: 'graph', label: 'Graph', type: 'select', def: 'campus', options: [{ v: 'campus', l: 'Campus map (cycles)' }, { v: 'tree', l: 'Binary tree' }] },
    { key: 'start', label: 'Start node (A–G)', type: 'text', def: 'A', maxLen: 1 },
  ],
  algos: [
    { id: 'bfs', title: 'Breadth-first (BFS)', code: BFS, run: bfs, type: 'Queue · level by level', complexity: { time: 'O(V + E)', space: 'O(V)', best: 'Shortest paths in unweighted graphs' },
      idea: 'Explore everything at distance 1, then distance 2, and so on. A queue guarantees the oldest discovered node is expanded first.',
      think: ['Why does the queue produce level-by-level order?', 'On the binary tree, which traversal order does BFS give?'], pitfalls: ['Marking a node visited when it is dequeued (instead of when it is enqueued) enqueues duplicates.'] },
    { id: 'dfs', title: 'Depth-first (DFS)', code: DFS, run: dfs, type: 'Stack · dive then backtrack', complexity: { time: 'O(V + E)', space: 'O(V)', best: 'Cycle detection, topological order, components' },
      idea: 'Follow one path as deep as it goes, then back up to the most recent unexplored branch. A stack (or the call stack) gives that "newest first" behaviour.',
      think: ['Swap the stack for a queue in your head: what algorithm do you get?', 'How does this relate to the Recursion topic?'], pitfalls: ['Forgetting the visited check loops forever on graphs with cycles.'] },
  ],
};
