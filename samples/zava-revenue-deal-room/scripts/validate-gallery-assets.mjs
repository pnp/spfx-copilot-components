import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { visualSourceSignature } from './visual-source-signature.mjs';

const root = path.resolve(import.meta.dirname, '..');
const assets = path.join(root, 'assets');
const sample = JSON.parse(fs.readFileSync(path.join(assets, 'sample.json'), 'utf8'))[0];
const evidence = JSON.parse(fs.readFileSync(path.join(assets, 'gallery-evidence.json'), 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(sample.source === 'pnp' && sample.name.startsWith('pnp-'), 'Invalid PnP sample identity.');
assert(sample.metadata.some((item) => item.key === 'CLIENT-SIDE-DEV' && item.value === 'React'), 'React metadata is missing.');
assert(sample.thumbnails.length >= 6, 'At least six publication thumbnails are required.');
assert(new Set(sample.thumbnails.map((item) => item.name)).size === sample.thumbnails.length, 'Thumbnail names must be unique.');
assert(new Set(sample.thumbnails.map((item) => item.order)).size === sample.thumbnails.length, 'Thumbnail order must be unique.');
for (const thumbnail of sample.thumbnails) {
  const file = path.join(assets, thumbnail.name);
  assert(fs.existsSync(file), `Missing thumbnail ${thumbnail.name}`);
  const bytes = fs.readFileSync(file);
  assert(bytes.subarray(1, 4).toString() === 'PNG', `${thumbnail.name} is not a PNG.`);
  assert(bytes.readUInt32BE(16) >= 390 && bytes.readUInt32BE(20) >= 600, `${thumbnail.name} is too small.`);
  assert(thumbnail.alt.length >= 40, `${thumbnail.name} needs descriptive alt text.`);
  assert(thumbnail.url.endsWith(`/assets/${thumbnail.name}`), `${thumbnail.name} URL does not match.`);
  assert(evidence.captures.some((capture) => capture.name === thumbnail.name), `${thumbnail.name} has no current evidence.`);
}
assert(evidence.failureCount === 0, 'Visual evidence contains failures.');
assert(evidence.sourceSha256 === visualSourceSignature(root), 'Curated visuals are stale for the current runtime source.');
for (const capture of evidence.captures) {
  const bytes = fs.readFileSync(path.join(assets, capture.name));
  assert(bytes.length === capture.bytes && crypto.createHash('sha256').update(bytes).digest('hex') === capture.sha256, `${capture.name} does not match capture evidence.`);
  if (!capture.mode) assert(capture.inlineHeight > 0 && capture.inlineHeight <= 650, `${capture.name} exceeds the measured inline height budget.`);
}
const expectedWorkspaceLayouts = {
  'fullscreen-my-deals-analytics.png': 'my-deals-dashboard',
  'fullscreen-deal-room.png': 'deal-room-dashboard',
  'fullscreen-commercial-desk.png': 'commercial-desk-dashboard',
  'fullscreen-revenue-command.png': 'revenue-command-dashboard'
};
for (const [name, layout] of Object.entries(expectedWorkspaceLayouts)) {
  const capture = evidence.captures.find((item) => item.name === name);
  assert(capture && capture.layouts.includes(layout), `${name} must contain unique layout ${layout}.`);
}
console.log(JSON.stringify({ thumbnails: sample.thumbnails.length, captures: evidence.totalCaptures, failures: evidence.failureCount }));