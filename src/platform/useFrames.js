import { useEffect, useState } from 'react';
import { MODULES } from './algorithms/index.js';

const MAX_FRAMES = 6000;

function validate(res) {
  if (!res || !Array.isArray(res.frames) || !res.frames.length || res.frames.length > MAX_FRAMES + 1) throw new Error('Invalid frames');
  res.frames.forEach((f) => { if (!f || !Number.isInteger(f.line) || typeof f.note !== 'string') throw new Error('Malformed frame'); });
  return { frames: res.frames, truncated: !!res.truncated };
}

/** Asynchronously produce frames for (module, algo, params) using a worker; falls back to a bounded sync run. */
export function useFrames(moduleId, algoId, params, enabled = true) {
  const key = JSON.stringify([moduleId, algoId, params]);
  const [state, setState] = useState({ key: null, frames: null, truncated: false, error: null });
  useEffect(() => {
    if (!enabled) return undefined;
    let dead = false, worker = null, timer = null;
    const finish = (r) => { if (!dead) setState({ key, frames: r.frames || null, truncated: !!r.truncated, error: r.error || null }); };
    const sync = () => {
      try { const a = MODULES[moduleId].algos.find((x) => x.id === algoId); finish(validate(a.run(params))); } catch (e) { finish({ error: String(e.message || e) }); }
    };
    try {
      worker = new Worker(new URL('./frames.worker.js', import.meta.url), { type: 'module' });
      timer = setTimeout(() => { worker.terminate(); finish({ error: 'The algorithm took too long and was stopped.' }); }, 4000);
      worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); try { if (!e.data.ok) throw new Error(e.data.error); finish(validate(e.data)); } catch (err) { finish({ error: String(err.message || err) }); } };
      worker.onerror = () => { clearTimeout(timer); worker.terminate(); sync(); };
      worker.postMessage({ module: moduleId, algo: algoId, params });
    } catch (e) { sync(); }
    return () => { dead = true; clearTimeout(timer); if (worker) worker.terminate(); };
  }, [key, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!enabled) return { frames: null, truncated: false, error: null, loading: false };
  return state.key === key ? { ...state, loading: false } : { ...state, loading: true };
}
