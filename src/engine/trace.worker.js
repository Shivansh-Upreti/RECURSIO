/* Sandbox worker: the ONLY place learner code is evaluated.
 * - Runs off the main thread, so a runaway loop can be killed with worker.terminate().
 * - Has no DOM access. Network/storage APIs are removed here as defence in depth, and the
 *   production CSP for /sandbox/* sets connect-src 'none' so exfiltration is blocked by the browser.
 * This is hardening, not a perfect sandbox: it protects the page and the user's session,
 * not against code that merely burns this worker's own CPU (which the timeout handles).
 */
import { runCustom } from './custom.js';

for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel', 'Worker', 'SharedWorker']) {
  try { Object.defineProperty(self, name, { value: undefined, writable: false, configurable: false }); } catch (e) { /* already locked */ }
}

self.onmessage = (e) => {
  const { code, call, limits } = e.data || {};
  try {
    self.postMessage({ ok: true, trace: runCustom(String(code), String(call), limits) });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err).slice(0, 300) });
  }
};
