import { collect } from './common.js';

/* Reuses the graph viz. Frame viz: { graph:{nodes:[{id,x,y}], edges}, state, treeEdges:[], probe, struct:{name,items}, order, visited? } */

const INORDER = `function inorder(node) {
  if (node === null) return;
  inorder(node.left);        // 1) whole left subtree
  visit(node);               // 2) then the node itself
  inorder(node.right);       // 3) then the right subtree
}`;
const PREORDER = `function preorder(node) {
  if (node === null) return;
  visit(node);               // 1) the node first
  preorder(node.left);       // 2) then the left subtree
  preorder(node.right);      // 3) then the right subtree
}`;
const POSTORDER = `function postorder(node) {
  if (node === null) return;
  postorder(node.left);      // 1) left subtree
  postorder(node.right);     // 2) right subtree
  visit(node);               // 3) the node LAST
}`;
const LEVEL = `function levelOrder(root) {
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();       // dequeue the oldest
    visit(node);
    if (node.left)  queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
}`;

function buildTree(values) {
  let r = null; const seen = new Set();
  for (const v of values) {
    if (seen.has(v)) continue; seen.add(v);
    const n = { v, l: null, r: null };
    if (!r) { r = n; continue; }
    let c = r;
    for (;;) { if (v < c.v) { if (c.l) c = c.l; else { c.l = n; break; } } else if (c.r) c = c.r; else { c.r = n; break; } }
  }
  if (!r) return { r: null, nodes: [], edges: [] };
  let i = 0, maxD = 0; const nodes = [], edges = [];
  const place = (n, d) => { if (!n) return; place(n.l, d + 1); n.i = i++; n.d = d; maxD = Math.max(maxD, d); place(n.r, d + 1); };
  place(r, 0);
  const total = i, dy = Math.min(24, 76 / Math.max(1, maxD));
  const walk = (n) => { if (!n) return; nodes.push({ id: String(n.v), x: total === 1 ? 50 : 8 + (84 * n.i) / (total - 1), y: 12 + n.d * dy }); if (n.l) { edges.push([String(n.v), String(n.l.v)]); walk(n.l); } if (n.r) { edges.push([String(n.v), String(n.r.v)]); walk(n.r); } };
  walk(r);
  return { r, nodes, edges };
}

function dfsOrder(order, { values }) {
  const { r, nodes, edges } = buildTree(values);
  const L = order === 'in' ? { left: 3, visit: 4, right: 5 } : order === 'pre' ? { visit: 3, left: 4, right: 5 } : { left: 3, right: 4, visit: 5 };
  return collect((F) => {
    if (!r) { F.add(1, 'Enter some numbers to build a binary search tree.', 'fail', { graph: { nodes: [], edges: [] }, state: {}, treeEdges: [], probe: null, struct: { name: 'Call stack', items: [] }, order: [] }); return; }
    const state = Object.fromEntries(nodes.map((n) => [n.id, 'unseen'])), out = [], stack = [];
    const v = (extra) => ({ graph: { nodes, edges }, state: { ...state }, treeEdges: [], probe: null, struct: { name: 'Call stack (bottom → top)', items: stack.map((n) => String(n.v)) }, order: out.map(String), ...extra });
    const names = { in: 'inorder', pre: 'preorder', post: 'postorder' }[order];
    F.add(1, `${names} traversal of a binary search tree built from your numbers. The call stack on the right shows the pending calls.`, 'info', v());
    const go = (n, from) => {
      if (!n) return;
      stack.push(n); state[String(n.v)] = 'frontier';
      F.add(1, `Call ${names}(${n.v}). Push it on the call stack.`, 'place', v({ probe: from ? [String(from.v), String(n.v)] : null }));
      const child = (c, side, line) => {
        if (c) { F.add(line, `Go to the ${side} child of ${n.v}.`, 'compare', v()); go(c, n); }
        else F.add(2, `${n.v} has no ${side} child: ${names}(null) returns immediately (the base case).`, 'reject', v());
      };
      const steps = { left: () => child(n.l, 'left', L.left), right: () => child(n.r, 'right', L.right), visit: () => { state[String(n.v)] = 'current'; out.push(n.v); F.add(L.visit, `Visit ${n.v}: output it. Output so far: ${out.join(', ')}.`, 'pick', v()); state[String(n.v)] = 'visited'; } };
      (order === 'in' ? ['left', 'visit', 'right'] : order === 'pre' ? ['visit', 'left', 'right'] : ['left', 'right', 'visit']).forEach((k) => steps[k]());
      stack.pop();
      F.add(6, `Finished ${n.v}: pop it and return to ${stack.length ? stack[stack.length - 1].v : 'the caller'}.`, 'info', v());
    };
    go(r, null);
    F.add(6, `Done. ${names} order: ${out.join(' → ')}.${order === 'in' ? ' In-order on a BST yields the values in sorted order.' : ''}`, 'done', v());
  });
}

function levelOrder({ values }) {
  const { r, nodes, edges } = buildTree(values);
  return collect((F) => {
    if (!r) { F.add(1, 'Enter some numbers to build a binary search tree.', 'fail', { graph: { nodes: [], edges: [] }, state: {}, treeEdges: [], probe: null, struct: { name: 'Queue', items: [] }, order: [] }); return; }
    const state = Object.fromEntries(nodes.map((n) => [n.id, 'unseen'])), out = [], queue = [r];
    const v = (extra) => ({ graph: { nodes, edges }, state: { ...state }, treeEdges: [], probe: null, struct: { name: 'Queue (front → back)', items: queue.map((n) => String(n.v)) }, order: out.map(String), ...extra });
    state[String(r.v)] = 'frontier';
    F.add(2, `Put the root ${r.v} in the queue. A queue serves the oldest item first, which gives level-by-level order.`, 'info', v());
    while (queue.length) {
      const n = queue.shift();
      state[String(n.v)] = 'current'; out.push(n.v);
      F.add(4, `Dequeue ${n.v} and visit it. Output so far: ${out.join(', ')}.`, 'pick', v());
      for (const [c, line, side] of [[n.l, 6, 'left'], [n.r, 7, 'right']]) {
        if (c) { queue.push(c); state[String(c.v)] = 'frontier'; F.add(line, `Enqueue the ${side} child ${c.v} at the back.`, 'place', v({ probe: [String(n.v), String(c.v)] })); }
      }
      state[String(n.v)] = 'visited';
    }
    F.add(8, `Done. Level-order: ${out.join(' → ')}. Every node at depth d is visited before any node at depth d+1.`, 'done', v());
  });
}

export default {
  id: 'trees', title: 'Tree Traversals', branch: 'Tier 1 · Data Structures', viz: 'graph',
  tagline: 'Same tree, four different walks. Watch the call stack (depth-first) and the queue (breadth-first) decide the order.',
  params: [{ key: 'values', label: 'Insert into a BST (up to 9 numbers)', type: 'numlist', def: '50, 30, 70, 20, 40, 60, 80', max: 9, wide: true }],
  algos: [
    { id: 'inorder', title: 'In-order (DFS)', code: INORDER, run: (p) => dfsOrder('in', p), type: 'Depth-first · Left, Node, Right', complexity: { time: 'O(n)', space: 'O(h) call stack', best: 'h = tree height' },
      think: ['Why does in-order on a BST output sorted values?', 'What is the stack depth for a perfectly skewed tree?'], pitfalls: ['Recursion depth equals tree height: a degenerate tree can overflow the stack.'] },
    { id: 'preorder', title: 'Pre-order (DFS)', code: PREORDER, run: (p) => dfsOrder('pre', p), type: 'Depth-first · Node, Left, Right', complexity: { time: 'O(n)', space: 'O(h) call stack', best: 'Used to copy / serialise a tree' },
      think: ['Which traversal would you use to copy a tree? Why?', 'How does the visit position change the output but not the stack behaviour?'], pitfalls: ['Pre-order alone does not uniquely identify a tree; add in-order or null markers.'] },
    { id: 'postorder', title: 'Post-order (DFS)', code: POSTORDER, run: (p) => dfsOrder('post', p), type: 'Depth-first · Left, Right, Node', complexity: { time: 'O(n)', space: 'O(h) call stack', best: 'Used to delete a tree / evaluate expressions' },
      think: ['Why must children be handled before their parent when freeing memory?', 'Which node is always output last?'], pitfalls: ['The root is last: you cannot "stream" results top-down.'] },
    { id: 'levelorder', title: 'Level-order (BFS)', code: LEVEL, run: levelOrder, type: 'Breadth-first · queue', complexity: { time: 'O(n)', space: 'O(w) queue', best: 'w = widest level' },
      think: ['Swap the queue for a stack: which traversal do you get?', 'When is the queue larger than the DFS stack?'], pitfalls: ['The queue can hold a whole level (about n/2 nodes in a complete tree).'] },
  ],
};
