import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const assetsDirectory = path.join(root, 'assets');
const samplePath = path.join(assetsDirectory, 'sample.json');
const evidencePath = path.join(assetsDirectory, 'visual-evidence.json');
const repositoryPath = 'samples/zava-it-concierge/assets';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(fs.existsSync(samplePath), 'assets/sample.json is missing.');
assert(fs.existsSync(evidencePath), 'assets/visual-evidence.json is missing. Run npm run capture:visual first.');
const document = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
assert(Array.isArray(document) && document.length === 1, 'sample.json must contain exactly one sample entry.');
const sample = document[0];
for (const key of ['name', 'source', 'title', 'shortDescription', 'url', 'downloadUrl', 'creationDateTime', 'updateDateTime']) {
  assert(typeof sample[key] === 'string' && sample[key].trim().length > 0, `sample.json ${key} is required.`);
}
assert(sample.source === 'pnp', 'sample.json source must be pnp.');
assert(Array.isArray(sample.longDescription) && sample.longDescription.length >= 3, 'sample.json needs three long-description paragraphs.');
assert(Array.isArray(sample.products) && sample.products.includes('SharePoint') && sample.products.includes('Copilot'), 'sample.json products must include SharePoint and Copilot.');
assert(Array.isArray(sample.authors) && sample.authors.length > 0, 'sample.json must include an author.');
assert(Array.isArray(sample.references) && sample.references.length > 0, 'sample.json must include references.');

const metadata = new Map((sample.metadata || []).map((item) => [item.key, item.value]));
assert(metadata.get('SAMPLE-TYPE') === 'SPFx-CopilotComponent', 'SAMPLE-TYPE metadata is missing or invalid.');
assert(metadata.get('CLIENT-SIDE-DEV') === 'React', 'CLIENT-SIDE-DEV metadata is missing or invalid.');
assert(typeof metadata.get('SPFX-VERSION') === 'string', 'SPFX-VERSION metadata is required.');

assert(evidence.totalCaptures === 39, `Expected 39 evidence captures, found ${evidence.totalCaptures}.`);
assert(evidence.inlineDefaults === 31, `Expected 31 inline defaults, found ${evidence.inlineDefaults}.`);
assert(evidence.dashboardCaptures === 3, `Expected 3 dashboard captures, found ${evidence.dashboardCaptures}.`);
assert(evidence.failureCount === 0, `Visual evidence contains ${evidence.failureCount} failure(s).`);
const evidenceByName = new Map(evidence.captures.map((capture) => [capture.filename, capture]));
const thumbnails = sample.thumbnails || [];
assert(thumbnails.length === evidence.totalCaptures, `Expected ${evidence.totalCaptures} publication screenshots, found ${thumbnails.length}.`);
assert(new Set(thumbnails.map((item) => item.name)).size === thumbnails.length, 'Thumbnail names must be unique.');
assert(new Set(thumbnails.map((item) => item.order)).size === thumbnails.length, 'Thumbnail orders must be unique.');

for (const thumbnail of thumbnails) {
  assert(thumbnail.type === 'image', `${thumbnail.name} must use type image.`);
  assert(typeof thumbnail.alt === 'string' && thumbnail.alt.trim().length >= 20, `${thumbnail.name} needs descriptive alt text.`);
  const capture = evidenceByName.get(thumbnail.name);
  assert(capture, `${thumbnail.name} is not present in visual-evidence.json.`);
  const filePath = path.join(assetsDirectory, thumbnail.name);
  assert(fs.existsSync(filePath), `Referenced thumbnail is missing: ${thumbnail.name}.`);
  const bytes = fs.readFileSync(filePath);
  assert(bytes.length > 24 && bytes.subarray(1, 4).toString('ascii') === 'PNG', `${thumbnail.name} is not a readable PNG.`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert(width === capture.width && height === capture.height, `${thumbnail.name} dimensions drifted from evidence (${width}x${height} versus ${capture.width}x${capture.height}).`);
  assert(width >= 320 && height >= 240, `${thumbnail.name} is too small (${width}x${height}).`);
  const expectedUrl = `https://github.com/pnp/spfx-copilot-components/raw/main/${repositoryPath}/${thumbnail.name}`;
  assert(thumbnail.url === expectedUrl, `${thumbnail.name} has an unexpected raw GitHub URL.`);
}

const referencedNames = new Set(thumbnails.map((item) => item.name));
const missingMetadata = [...evidenceByName.keys()].filter((file) => !referencedNames.has(file));
assert(missingMetadata.length === 0, `Evidence screenshots are missing from sample.json: ${missingMetadata.join(', ')}.`);
const designReferences = thumbnails.filter((item) => item.name.startsWith('it-concierge-'));
assert(designReferences.length === 0, 'Historical design references must not be published as implementation screenshots.');

console.log(`Verified PnP gallery metadata and ${thumbnails.length} evidence-backed implementation screenshots.`);