import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(resolve(root, 'assets/media-provenance.json'), 'utf8'));
const keys = new Set();
const paths = new Set();
const errors = [];

for (const asset of catalog.assets) {
  if (!asset.key || keys.has(asset.key)) errors.push(`Duplicate or missing key: ${asset.key}`);
  if (!asset.path || paths.has(asset.path)) errors.push(`Duplicate or missing path: ${asset.path}`);
  keys.add(asset.key);
  paths.add(asset.path);

  if (!asset.sourceUrl || !asset.license || !asset.usage || !asset.alt) {
    errors.push(`Incomplete provenance: ${asset.key}`);
    continue;
  }

  try {
    const bytes = readFileSync(resolve(root, asset.path));
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (hash !== asset.sha256) errors.push(`Hash mismatch: ${asset.key}`);
  } catch {
    errors.push(`Missing media file: ${asset.path}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated provenance for ${catalog.assets.length} media assets.`);