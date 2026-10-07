/* Sandbox worker for the "My code" workspace: the ONLY place learner code is evaluated for non-Recursion topics.
   - Off the main thread, so the page can terminate it if it loops forever.
   - Network / storage APIs removed here; production CSP for /sandbox/* also sets connect-src 'none'.
   Returns raw per-test results; judging happens on the main thread against trusted reference code. */

for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel', 'Worker', 'SharedWorker']) {
  try { Object.defineProperty(self, name, { value: undefined, writable: false, configurable: false }); } catch (e) { /* already locked */ }
}

const fmtLog = (v) => { try { return typeof v === 'string' ? v : JSON.stringify(v); } catch (e) { return String(v); } };
function safeClone(v) {
  try {
    const c = structuredClone(v);
    if (JSON.stringify(c, (k, x) => (x === Infinity ? '∞' : x)).length > 30000) return '[output too large]';
    return c;
  } catch (e) { return '[value cannot be shown]'; }
}

self.onmessage = (e) => {
  const { code, fn, tests, stress } = e.data || {};
  const logs = [];
  const print = (...xs) => { if (logs.length < 40) logs.push(xs.map(fmtLog).join(' ').slice(0, 300)); };
  let f;
  try {
    // eslint-disable-next-line no-new-func
    const make = new Function('print', 'console', '"use strict";\n' + String(code) + '\n;return ' + (fn ? `(typeof ${fn} === "function") ? ${fn} : undefined` : 'undefined') + ';');
    f = make(print, { log: print });
  } catch (err) {
    self.postMessage({ type: 'done', phase: 'load', error: String((err && err.message) || err).slice(0, 300), logs });
    return;
  }
  if (fn && typeof f !== 'function') { self.postMessage({ type: 'done', phase: 'missing', logs }); return; }
  const results = [];
  for (let i = 0; i < (tests || []).length; i++) {
    self.postMessage({ type: 'progress', i });
    const args = structuredClone(tests[i].args);
    const t0 = performance.now();
    try {
      const got = f(...args);
      results.push({ got: safeClone(got), after: safeClone(args), ms: performance.now() - t0 });
    } catch (err) {
      results.push({ error: String((err && err.message) || err).slice(0, 200), ms: performance.now() - t0 });
    }
  }
  // Correctness results go out first, so a slow speed check can never erase them.
  self.postMessage({ type: 'partial', results, logs });
  let stressMs = null;
  if (stress && f) {
    self.postMessage({ type: 'progress', i: -1 });
    try {
      const t0 = performance.now();
      const sa = structuredClone(stress.args);   // cloned once: stress targets are read-only lookups
      for (let r = 0; r < stress.repeat; r++) f(...sa);
      stressMs = performance.now() - t0;
    } catch (err) { stressMs = null; }
  }
  self.postMessage({ type: 'done', phase: 'ran', stressMs, logs });
};
