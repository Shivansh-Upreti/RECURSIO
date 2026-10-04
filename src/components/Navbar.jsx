import { motion } from 'framer-motion';
import { useTheme } from '../theme.js';

const ICON = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', width: 16, height: 16, 'aria-hidden': true };
const Sun = () => <svg viewBox="0 0 24 24" {...ICON}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
const Moon = () => <svg viewBox="0 0 24 24" {...ICON}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>;
const Monitor = () => <svg viewBox="0 0 24 24" {...ICON}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>;

const OPTIONS = [['light', 'Light', Sun], ['system', 'System', Monitor], ['dark', 'Dark', Moon]];

function ThemeToggle() {
  const { mode, setMode } = useTheme();
  return (
    <div className="relative inline-flex rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200 dark:bg-zinc-800 dark:ring-zinc-700" role="radiogroup" aria-label="Color theme">
      {OPTIONS.map(([id, text, Icon]) => {
        const on = mode === id;
        return (
          <button key={id} type="button" role="radio" aria-checked={on} aria-label={`${text} theme`} title={`${text} theme`} onClick={() => setMode(id)}
            className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${on ? 'text-green-700 dark:text-green-400' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100'}`}>
            {on && <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-full bg-white shadow dark:bg-zinc-950" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
            <span className="relative"><Icon /></span>
          </button>
        );
      })}
    </div>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-5 py-3">
        <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#16a34a" /><path d="M8 22h16M10 16h12M13 10h6" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" /></svg>
        <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Recursio</span>
        <span className="hidden rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200 dark:bg-green-950/50 dark:text-green-400 dark:ring-green-800 sm:inline">Call-stack engine</span>
        <nav className="ml-auto hidden gap-5 text-sm font-medium text-slate-500 dark:text-zinc-400 md:flex" aria-label="Sections">
          <a className="hover:text-green-700 dark:hover:text-green-400" href="#control-center">Control Center</a>
          <a className="hover:text-green-700 dark:hover:text-green-400" href="#workspace">Workspace</a>
          <a className="hover:text-green-700 dark:hover:text-green-400" href="#insight">Insights</a>
        </nav>
        <div className="ml-auto md:ml-2"><ThemeToggle /></div>
      </div>
    </header>
  );
}
