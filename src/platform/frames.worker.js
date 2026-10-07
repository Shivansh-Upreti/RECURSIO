/* Computes animation frames off the main thread. Runs ONLY curated algorithm code from this repo (no eval,
   no user code). Inputs are clamped by normalize() before they get here, and the frame count is capped. */
import { MODULES } from './algorithms/index.js';

self.onmessage = (e) => {
  const { module, algo, params } = e.data || {};
  try {
    const m = MODULES[module], a = m && m.algos.find((x) => x.id === algo);
    if (!a) throw new Error('Unknown algorithm');
    self.postMessage({ ok: true, ...a.run(params) });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err).slice(0, 200) });
  }
};
