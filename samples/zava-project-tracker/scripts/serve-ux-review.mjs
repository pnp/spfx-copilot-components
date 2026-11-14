import { build } from 'esbuild';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const reviewRoot = path.join(root, 'ux-review');

await build({
  entryPoints: [path.join(reviewRoot, 'entry.tsx')],
  bundle: true,
  outfile: path.join(reviewRoot, 'review.js'),
  platform: 'browser',
  format: 'iife',
  jsx: 'transform',
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"development"'
  }
});

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
  const requestPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(reviewRoot, requestPath.replace(/^\//, ''));
  if (!filePath.startsWith(reviewRoot) || !fs.existsSync(filePath)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(4400, '127.0.0.1', () => {
  console.log('Zava UX review available at http://127.0.0.1:4400');
});
