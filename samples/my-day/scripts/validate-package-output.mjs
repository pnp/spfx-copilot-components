import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';
const root = path.resolve(import.meta.dirname, '..');
const bytes = fs.readFileSync(path.join(root, 'sharepoint', 'solution', 'my-day.sppkg'));
const archive = await unzipper.Open.buffer(bytes);
const javascript = archive.files.filter(entry => /ClientSideAssets\/.*\.js$/i.test(entry.path));
const agents = archive.files.filter(entry => /ClientSideAssets\/.*\.zip$/i.test(entry.path));
assert.equal(javascript.length, 1, 'Expected one shared My Day production bundle.');
assert.equal(agents.length, 1, 'Expected one current agent ZIP.');
assert(bytes.length < 10 * 1024 * 1024, 'Package exceeds the reviewed 10 MiB sample limit.');
for (const file of javascript) {
  assert(/_[a-f0-9]{20}\.js$/i.test(file.path), 'Unhashed production JavaScript.');
  assert((await file.buffer()).equals(fs.readFileSync(path.join(root, 'release', 'assets', path.basename(file.path)))), 'Packaged UI code is stale.');
}
assert((await agents[0].buffer()).equals(fs.readFileSync(path.join(root, 'teams', path.basename(agents[0].path)))), 'Embedded agent differs from the current Teams ZIP.');
console.log(JSON.stringify({ packageBytes: bytes.length, javascriptFiles: javascript.length, javascriptBytes: javascript[0].uncompressedSize, embeddedAgents: agents.length }));
