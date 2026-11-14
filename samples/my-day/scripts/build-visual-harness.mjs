import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'temp', 'ux-review');
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(path.join(root, 'ux-review', 'index.html'), path.join(output, 'index.html'));
await build({
  entryPoints: [path.join(root, 'ux-review', 'entry.tsx')],
  outfile: path.join(output, 'review.js'), bundle: true, platform: 'browser',
  format: 'iife', jsx: 'transform', define: { 'process.env.NODE_ENV': '"development"' }
});
console.log('Built the tenant-free React 18 My Day review harness.');
