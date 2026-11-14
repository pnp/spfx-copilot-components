import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'assets', 'release-evidence.json');
const solution = JSON.parse(fs.readFileSync(path.join(root, 'config', 'package-solution.json'), 'utf8'));
const packagePath = path.join(root, 'sharepoint', solution.paths.zippedPackage);
const bytes = fs.readFileSync(packagePath);
const archive = await unzipper.Open.buffer(bytes);
const agents = archive.files.filter(entry => /ClientSideAssets\/.*\.zip$/i.test(entry.path));
assert.equal(agents.length, 1, 'Expected one embedded current agent.');
const agentBytes = await agents[0].buffer();
const agentArchive = await unzipper.Open.buffer(agentBytes);
const manifestEntry = agentArchive.files.find(entry => entry.path === 'manifest.json');
assert(manifestEntry, 'Packaged Teams manifest is missing.');
const agentManifest = JSON.parse((await manifestEntry.buffer()).toString('utf8'));
const currentAgent = fs.readFileSync(path.join(root, 'teams', path.basename(agents[0].path)));
assert(agentBytes.equals(currentAgent), 'The packaged agent differs from the generated Teams ZIP.');
const junit = fs.readFileSync(path.join(root, 'jest-output', 'JUnit.xml'), 'utf8').match(/<testsuites\b[^>]*>/)?.[0];
assert(junit && /\bfailures="0"/.test(junit) && /\berrors="0"/.test(junit), 'All Jest tests must pass.');
const gallery = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'gallery-evidence.json'), 'utf8'));
const keynote = JSON.parse(fs.readFileSync(path.join(root, 'ux-review', 'evidence', 'zavacore-modernization.json'), 'utf8'));
const brand = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'brand-provenance.json'), 'utf8'));
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const evidence = {
  generatedAt: new Date().toISOString(),
  package: 'sharepoint/solution/zava-procurement-command-center.sppkg',
  bytes: bytes.length,
  sha256: hash(bytes),
  solutionVersion: solution.solution.version,
  agentVersion: agentManifest.version,
  authoredAgentVersion: JSON.parse(fs.readFileSync(path.join(root, 'copilot', 'manifest.json'), 'utf8')).version,
  agentSha256: hash(agentBytes),
  entries: archive.files.length,
  javascriptAssets: archive.files.filter(entry => /ClientSideAssets\/.*\.js$/i.test(entry.path)).length,
  agentArchives: agents.length,
  visualCaptures: gallery.captureCount,
  keynoteCaptures: keynote.captureCount,
  sharedBrandMedia: brand.items.filter(item => item.file.startsWith('src/shared/assets/brand/')).length,
  componentCount: 22,
  testCount: Number(junit.match(/\btests="(\d+)"/)?.[1]),
  externalGate: 'Authenticated routing, host CSP/focus/accessibility and public media-rights approval remain separate.'
};
if (process.argv.includes('--check')) {
  const existing = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.deepEqual({ ...existing, generatedAt: evidence.generatedAt }, evidence, 'Release evidence is stale.');
} else {
  fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);
}
console.log(JSON.stringify(evidence));
