import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'ux-review');
const port = Number(process.env.PORT || 4322);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

createServer((request, response) => {
  const requestPath = new URL(request.url || '/', `http://localhost:${port}`).pathname;
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\//, '');
  const filePath = resolve(root, relativePath);

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  createReadStream(filePath).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Zava One UX review: http://127.0.0.1:${port}`);
});