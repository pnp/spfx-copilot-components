import { build } from 'esbuild';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [resolve(root, 'ux-review/entry.tsx')],
  bundle: true,
  outfile: resolve(root, 'ux-review/dist/app.js'),
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: false,
  sourcemap: true,
  logLevel: 'info'
});