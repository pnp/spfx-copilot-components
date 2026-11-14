import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const packagePath = path.join(root, 'sharepoint', 'solution', 'zava-procurement-command-center.sppkg');
const bytes = fs.readFileSync(packagePath);
const archive = await unzipper.Open.buffer(bytes);
const javascript = archive.files.filter(entry => /ClientSideAssets\/.*\.js$/i.test(entry.path));
const agents = archive.files.filter(entry => /ClientSideAssets\/.*\.zip$/i.test(entry.path));
assert.equal(javascript.length, 1, 'Expected one shared production JavaScript asset.');
assert(/_[a-f0-9]{20}\.js$/i.test(javascript[0].path), 'JavaScript must use the current content hash.');
assert.equal(agents.length, 1, 'Expected one current embedded agent.');
assert(bytes.length <= 2000000, `Package exceeds the 2 MB sample threshold: ${bytes.length}`);
assert(agents[0].path.endsWith('/zavacore-procurement-command-center.zip'), 'Expected the current ZavaCore-branded agent.');
assert((await agents[0].buffer()).equals(fs.readFileSync(path.join(root, 'teams', 'zavacore-procurement-command-center.zip'))), 'Embedded agent is stale.');
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const provenance = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'brand-provenance.json'), 'utf8'));
const expected = provenance.items.filter(item => item.file.startsWith('src/shared/assets/brand/'));
const media = archive.files.filter(entry => /ClientSideAssets\/.*\.(?:png|jpg|jpeg)$/i.test(entry.path));
const solution = JSON.parse(fs.readFileSync(path.join(root, 'config', 'package-solution.json'), 'utf8'));
const publicationNames = solution.solution.metadata.screenshotPaths.map(file => path.basename(file));
const runtimeMedia = media.filter(entry => !publicationNames.includes(path.basename(entry.path)));
const hashes = await Promise.all(media.map(async entry => hash(await entry.buffer())));
assert.equal(runtimeMedia.length, expected.length, 'Missing or unexpected packaged brand/portrait assets.');
assert.equal(media.length, expected.length + publicationNames.length, 'Unexpected publication media.');
assert.equal(new Set(hashes).size, hashes.length, 'Duplicate packaged media.');
assert(runtimeMedia.every(entry => /_[a-f0-9]{8,}\.(?:png|jpg|jpeg)$/i.test(entry.path)), 'Unhashed runtime media.');
assert(expected.every(item => hashes.includes(item.sha256)), 'Packaged media differs from approved ZavaCore provenance.');
for (const name of publicationNames) {
  const entry = media.find(file => path.basename(file.path) === name);
  assert(entry && hash(await entry.buffer()) === hash(fs.readFileSync(path.join(root, 'assets', name))), `Packaged publication screenshot is stale: ${name}`);
}
const agentArchive = await unzipper.Open.buffer(await agents[0].buffer());
for (const icon of provenance.items.filter(item => item.file.startsWith('copilot/'))) {
  const entry = agentArchive.files.find(file => file.path === path.basename(icon.file));
  assert(entry && hash(await entry.buffer()) === icon.sha256, 'Agent icon differs from approved ZavaCore artwork.');
}
assert(!archive.files.some(entry => /\.(?:woff2?|ttf|eot)$/i.test(entry.path)), 'Unexpected icon font payload.');
const sourceManifest = JSON.parse(fs.readFileSync(path.join(root, 'copilot', 'manifest.json'), 'utf8'));
const packagedManifest = JSON.parse((await agentArchive.files.find(file => file.path === 'manifest.json').buffer()).toString('utf8'));
assert.equal(packagedManifest.name.full, sourceManifest.name.full, 'Packaged agent branding is stale.');
console.log(JSON.stringify({ packageBytes: bytes.length, sharedJavaScriptAssets: javascript.length, embeddedAgents: agents.length, largestJavaScriptBytes: javascript[0].uncompressedSize, compressedJavaScriptBytes: javascript[0].compressedSize, packagedMedia: media.length, sharedBrandMedia: runtimeMedia.length, publicationScreenshots: publicationNames.length, expectedPortraits: 3, duplicateMedia: 0, matchingZavaCoreIcons: true, javascriptInvestigation: javascript[0].uncompressedSize > 1024 * 1024 }));
