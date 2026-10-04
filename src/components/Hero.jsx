import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="mx-auto max-w-[1500px] px-5 pt-8 pb-2">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
        <p className="eyebrow text-green-700 dark:text-green-400">Interactive recursion &amp; call stack engine</p>
        <h1 className="mt-1 text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          <span className="bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent">Recursio</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600 dark:text-zinc-300">Watch every call pause, push and return. Step through the code, the call stack and the recursion tree in lock-step, and see <em>why</em> each frame is waiting.</p>
      </motion.div>
    </section>
  );
}
