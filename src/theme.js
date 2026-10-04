import { useCallback, useEffect, useState } from 'react';

const KEY = 'recursio-theme';
export const MODES = ['light', 'system', 'dark'];

const read = () => { try { const v = localStorage.getItem(KEY); return MODES.includes(v) ? v : 'system'; } catch (e) { return 'system'; } };
const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

/** mode = what the user chose; resolved = what is actually shown. */
export function useTheme() {
  const [mode, setModeState] = useState(read);
  const [sysDark, setSysDark] = useState(systemDark);
  const resolved = mode === 'system' ? (sysDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = (e) => setSysDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', resolved === 'dark'); }, [resolved]);

  const setMode = useCallback((m) => {
    setModeState(m);
    try { localStorage.setItem(KEY, m); } catch (e) { /* storage blocked: still applies this session */ }
  }, []);
  return { mode, resolved, setMode };
}
