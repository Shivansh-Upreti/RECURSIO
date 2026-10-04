import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The sandbox worker is emitted under /sandbox/ so public/_headers can give that path (and only that path)
  // the CSP it needs to evaluate learner code, while every other path keeps a strict no-eval CSP.
  worker: {
    format: 'es',
    rollupOptions: { output: { entryFileNames: 'sandbox/[name]-[hash].js', chunkFileNames: 'sandbox/[name]-[hash].js' } },
  },
  build: { target: 'es2022', sourcemap: false },
});
