/* Tier 3 scaffold: annotated pseudo-code + explanations (see advdc.js for the placeholder contract). */

const MCM = `matrixChain(p):                       // matrix i is p[i−1] × p[i]
  for len = 2 .. n:
    for i = 1 .. n − len + 1:
      j = i + len − 1;  dp[i][j] = ∞
      for k = i .. j − 1:
        cost = dp[i][k] + dp[k+1][j] + p[i−1] · p[k] · p[j]
        dp[i][j] = min(dp[i][j], cost)
  return dp[1][n]`;

const BITMASK = `tsp(dist):                            // visit all n cities once, return to city 0
  dp[mask][i] = ∞;  dp[1][0] = 0       // mask = set of visited cities, i = last one
  for mask in 1 .. 2ⁿ − 1:
    for i in mask:
      for j not in mask:
        dp[mask | (1<<j)][j] = min(dp[mask | (1<<j)][j], dp[mask][i] + dist[i][j])
  return min over i of dp[full][i] + dist[i][0]`;

const TREEDP = `dfs(u, parent):                       // maximum-weight independent set on a tree
  take[u] = weight[u];  skip[u] = 0
  for each child v of u (v ≠ parent):
    dfs(v, u)
    take[u] += skip[v]                 // if u is taken, its children cannot be
    skip[u] += max(take[v], skip[v])   // otherwise each child is free to choose
  answer = max(take[root], skip[root])`;

export default {
  id: 'advdp', title: 'Advanced DP', branch: 'Tier 3 · Advanced DAA', viz: 'none', advanced: true,
  tagline: 'When the state is an interval, a subset, or a subtree: the craft is choosing what the table index means.',
  params: [],
  algos: [
    { id: 'mcm', title: 'Matrix chain multiplication', code: MCM, placeholder: true, type: 'Interval DP', params: [],
      complexity: { time: 'Θ(n³)', space: 'Θ(n²)', best: 'Brute force over parenthesisations is Catalan-number large' },
      lines: {
        1: 'Multiplying a chain of matrices is associative, but the PARENTHESISATION changes the number of scalar multiplications. Find the cheapest order. dp[i][j] = min cost for matrices i..j.',
        2: 'Solve by increasing chain length so shorter chains are ready before longer ones need them.',
        3: 'Every starting matrix i for this length.',
        4: 'j is the last matrix of the chain; start the minimum at infinity.',
        5: 'Try every split point k: (i..k) × (k+1..j).',
        6: 'Cost = cost of the left part + cost of the right part + the cost of multiplying the two resulting matrices (p[i−1] × p[k] times p[k] × p[j]).',
        7: 'Keep the cheapest split.',
        8: 'The whole chain 1..n is the answer.',
      },
      planned: 'An upper-triangular table filling by diagonals, with the two sub-chains for the current split highlighted and the optimal parenthesisation drawn as a tree at the end.',
      think: ['Why must we fill by chain length rather than row by row?', 'How would you recover the actual parenthesisation?'], pitfalls: ['Off-by-one in the dimension array p is the classic bug: matrix i has shape p[i−1] × p[i].'] },
    { id: 'bitmask', title: 'Bitmask DP (TSP)', code: BITMASK, placeholder: true, type: 'Subset DP', params: [],
      complexity: { time: 'Θ(n² · 2ⁿ)', space: 'Θ(n · 2ⁿ)', best: 'Held–Karp: far better than the Θ(n!) brute force' },
      lines: {
        1: 'Travelling salesman: the shortest tour that visits every city once. State = (set of visited cities, current city).',
        2: 'A bitmask encodes the visited set in one integer (bit j set = city j visited). dp[mask][i] is the cheapest way to be at i having visited exactly mask. Start at city 0.',
        3: 'Process masks in increasing order: a superset always has a larger integer value, so dependencies are ready.',
        4: 'i is the current (last visited) city, and must belong to the mask.',
        5: 'j is the next, not yet visited city.',
        6: 'Transition: extend the tour from i to j and record the cheaper cost for the new mask.',
        7: 'Close the tour: from the last city back to city 0.',
      },
      planned: 'The cities on a map, the current mask shown as a row of bits, and the dp table (masks × last city) lighting up as transitions are applied.',
      think: ['Why is the number of states 2ⁿ · n, not n!?', 'What problem sizes (n) are practical for this approach?'], pitfalls: ['Memory: 2ⁿ · n values grows fast; n ≈ 20 is a common practical limit.'] },
    { id: 'treedp', title: 'DP on trees', code: TREEDP, placeholder: true, type: 'Tree DP', params: [],
      complexity: { time: 'Θ(n)', space: 'Θ(h) recursion (+ Θ(n) table)', best: 'Each vertex is processed once' },
      lines: {
        1: 'Choose vertices of a tree with maximum total weight so that no two chosen vertices are adjacent (maximum independent set). Each vertex stores two values for its subtree.',
        2: 'take[u]: best weight in u\'s subtree if u IS chosen. skip[u]: best if u is NOT chosen.',
        3: 'Combine information from every child (post-order: children first).',
        4: 'Solve the child subtree first.',
        5: 'If u is chosen, its children must be skipped, so add skip[v].',
        6: 'If u is not chosen, each child independently takes its better option.',
        7: 'The root\'s better option is the global optimum.',
      },
      planned: 'A rooted tree where each node shows its (take, skip) pair appearing in post-order, with the final chosen set highlighted.',
      think: ['Why does a tree allow independent child subproblems when a general graph does not?', 'How would you recover which vertices were chosen?'], pitfalls: ['Deep trees need an iterative DFS to avoid stack overflow.'] },
  ],
};
