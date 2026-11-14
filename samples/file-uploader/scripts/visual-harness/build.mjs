#!/usr/bin/env node
/** Bundles harness.tsx → dist/harness.js and copies index.html. No SPFx host. */
import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, 'dist');
mkdirSync(DIST, { recursive: true });

await build({
  entryPoints: [join(HERE, 'harness.tsx')],
  outfile: join(DIST, 'harness.js'),
  bundle: true,
  format: 'iife',
  target: 'es2019',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  define: { 'process.env.NODE_ENV': '"production"', 'DEBUG': 'false' },
  logLevel: 'info'
});

copyFileSync(join(HERE, 'index.html'), join(DIST, 'index.html'));
console.log('visual harness bundled → scripts/visual-harness/dist/');
