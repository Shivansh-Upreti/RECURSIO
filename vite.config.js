import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The sandbox worker is emitted under /sandbox/ so public/_headers can give that path (and only that path)
  // the CSP it needs to evaluate learner code, while every other path keeps a strict no-eval CSP.
  worker: {
    format: 'es',
    // trace.worker + usercode.worker (evaluate learner code) -> /sandbox/ ; every other worker (curated algorithms only) -> /workers/.
    // public/_headers gives each directory its own CSP, so only the code-eval worker is ever allowed 'unsafe-eval'.
    rollupOptions: {
      output: {
        entryFileNames: (c) => (/^(trace|usercode)/.test(c.name) ? 'sandbox/' : 'workers/') + '[name]-[hash].js',
        chunkFileNames: (c) => (/^(trace|usercode)/.test(c.name) ? 'sandbox/' : 'workers/') + '[name]-[hash].js',
      },
    },
  },
  build: { target: 'es2022', sourcemap: false },
});
