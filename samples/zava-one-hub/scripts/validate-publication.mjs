import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScreenshotEvidence } from './screenshot-evidence.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const requiredFiles = [
  'assets/sample.json',
  'assets/publication-screenshots.md',
  'demos/README.md',
  'demos/keynote-5-minutes.md',
  'demos/technical-demo-10-minutes.md',
  'demos/feature-showcase-20-minutes.md',
  'demos/keynote-90-seconds.md',
  'demos/business-journey.md',
  'demos/technical-walkthrough.md',
  'demos/demo-operations.md',
  'docs/release-readiness.md',
  'docs/responsive-review.md',
  'sharepoint/solution/zava-one-hub.sppkg',
  'teams/zava-one.zip'
];

for (const path of requiredFiles) {
  if (!existsSync(resolve(root, path))) errors.push(`Missing publication file: ${path}`);
}

function collectMarkdown(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) return collectMarkdown(child);
    return extname(entry.name).toLowerCase() === '.md' ? [child] : [];
  });
}

const markdownFiles = [
  resolve(root, 'README.md'),
  resolve(root, 'assets/publication-screenshots.md'),
  resolve(root, 'teams/README.md'),
  ...collectMarkdown(resolve(root, 'demos')),
  ...collectMarkdown(resolve(root, 'docs'))
];
let relativeLinks = 0;
for (const path of markdownFiles) {
  const content = readFileSync(path, 'utf8');
  const links = content.matchAll(/\[[^\]]*\]\((?!https?:\/\/|#)([^\)#]+)(?:#[^\)]*)?\)/g);
  for (const match of links) {
    const target = decodeURIComponent(match[1]);
    if (!existsSync(resolve(dirname(path), target))) errors.push(`Broken relative link in ${path}: ${target}`);
    relativeLinks += 1;
  }
}

const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
const lastReadmeLine = readme.trimEnd().split(/\r?\n/).at(-1);
const expectedTracker = '<img src="https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/samples/zava-one-hub" />';
if (lastReadmeLine !== expectedTracker) errors.push('README visitor tracker must be the final nonblank line.');
if (readme.includes('YOUR-SOLUTION-NAME') || readme.includes('YOUR-GITHUB-ACCOUNT')) errors.push('README contains template placeholders.');

const sample = JSON.parse(readFileSync(resolve(root, 'assets/sample.json'), 'utf8'))[0];
const thumbnails = sample?.thumbnails || [];
if (sample?.name !== 'pnp-sp-dev-spfx-copilot-apps-zava-one-hub') errors.push('Sample metadata name is invalid.');
if (sample?.updateDateTime !== '2026-10-28') errors.push('Sample metadata updateDateTime is stale.');
if (!sample?.products?.includes('Teams')) errors.push('Sample metadata must include Teams.');
if (thumbnails.length !== 15) errors.push(`Expected 15 publication thumbnails, found ${thumbnails.length}.`);
if (new Set(thumbnails.map((thumbnail) => thumbnail.name)).size !== thumbnails.length) errors.push('Thumbnail names must be unique.');
if (new Set(thumbnails.map((thumbnail) => thumbnail.order)).size !== thumbnails.length) errors.push('Thumbnail orders must be unique.');
for (const thumbnail of thumbnails) {
  if (!existsSync(resolve(root, 'assets', thumbnail.name))) errors.push(`Missing thumbnail asset: ${thumbnail.name}`);
  if (!thumbnail.url?.endsWith(`/samples/zava-one-hub/assets/${thumbnail.name}`)) errors.push(`Invalid thumbnail URL: ${thumbnail.name}`);
}
for (const mode of ['combined', 'company', 'personal']) {
  if (!thumbnails.some((thumbnail) => thumbnail.name === `screenshot-teams-${mode}.png`)) {
    errors.push(`Missing ${mode} Teams personal-app thumbnail.`);
  }
}
const captureEvidence = loadScreenshotEvidence(root);
const capturedPaths = new Set(captureEvidence.publication.map((record) => record.path));
for (const thumbnail of thumbnails) {
  if (!capturedPaths.has(`assets/${thumbnail.name}`)) errors.push(`Missing verified capture evidence: ${thumbnail.name}`);
}

const sampleIndex = readFileSync(resolve(root, '..', 'README.md'), 'utf8');
if (!sampleIndex.includes('[`zava-one-hub`](./zava-one-hub)')) errors.push('Root sample index does not include zava-one-hub.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated publication metadata, ${thumbnails.length} thumbnails, ${markdownFiles.length} Markdown files, and ${relativeLinks} relative links.`);