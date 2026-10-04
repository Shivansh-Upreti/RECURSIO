// Runs after `npm run build` (postbuild) and prints the zero-Git deployment steps.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve('dist');
if (!existsSync(resolve(dist, 'index.html'))) { console.error('dist/index.html is missing: build did not produce a site.'); process.exit(1); }
const hasHeaders = existsSync(resolve(dist, '_headers'));
console.log(`
==================  Recursio build is ready  ==================
 Output folder : ${dist}
 _headers file : ${hasHeaders ? 'present (security headers will be applied by Netlify)' : 'MISSING: security headers will NOT be applied'}

 Deploy for free, no GitHub needed (3 steps):

  1. Open https://app.netlify.com/drop in your browser
     (sign in or create a free Netlify account if it asks).
  2. Open File Explorer at the folder above and drag the whole
     "dist" folder onto the drop zone (drop the folder itself,
     not a zip and not the project root).
  3. Wait a few seconds for the live URL. Open it, then check
     DevTools > Network > the page request > Response Headers
     for Content-Security-Policy and X-Frame-Options.
     (Unclaimed drops may expire; claim the site to keep it.)
===============================================================
`);
