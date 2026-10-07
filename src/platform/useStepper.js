import { useCallback, useEffect, useState } from 'react';

/** Deterministic stepper over precomputed frames: a plain state machine, no user code involved. */
export function useStepper(total, resetKey) {
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  useEffect(() => { setPos(0); setPlaying(false); }, [resetKey]);
  useEffect(() => {
    if (!playing) return undefined;
    if (pos >= total - 1) { setPlaying(false); return undefined; }
    const id = setTimeout(() => setPos((p) => Math.min(total - 1, p + 1)), 900 / speed);
    return () => clearTimeout(id);
  }, [playing, pos, total, speed]);
  const next = useCallback(() => { setPlaying(false); setPos((p) => Math.min(total - 1, p + 1)); }, [total]);
  const prev = useCallback(() => { setPlaying(false); setPos((p) => Math.max(0, p - 1)); }, []);
  const reset = useCallback(() => { setPlaying(false); setPos(0); }, []);
  const seek = useCallback((p) => { setPlaying(false); setPos(Math.max(0, Math.min(total - 1, p))); }, [total]);
  const toggle = useCallback(() => { setPlaying((pl) => { if (!pl && pos >= total - 1) setPos(0); return !pl; }); }, [pos, total]);
  return { pos, playing, speed, setSpeed, next, prev, reset, seek, toggle };
}
