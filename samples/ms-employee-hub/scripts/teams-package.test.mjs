import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cp, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import JSZip from 'jszip';

test('standalone Teams helpers create only the selected app and reject stale packages or wrong routes', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'employee-hub-tabs-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const apps = ['hub', 'company', 'hr', 'tech', 'business'], members = ['color.png', 'manifest.json', 'outline.png'];
  await cp(new URL('../teams/', import.meta.url), dir, {recursive: true, filter: p => !p.endsWith('.zip')});
  const run = (script, ...args) => execFileSync(process.platform === 'win32' ? 'powershell.exe' : 'pwsh',
    ['-NoProfile', '-NonInteractive', '-File', path.join(dir, script), ...args], {stdio: 'pipe'});
  const zipPath = key => path.join(dir, key, `employee-hub-${key}.zip`);
  run('hr/Package-App.ps1');
  await assert.rejects(readFile(zipPath('hub')), {code: 'ENOENT'});
  run('Package-TeamsApps.ps1');
  run('Package-TeamsApps.ps1', '-Check');
  for (const key of apps) {
    const archive = await JSZip.loadAsync(await readFile(zipPath(key)), {checkCRC32: true});
    assert.deepEqual(Object.keys(archive.files).sort(), members);
    for (const name of members) assert.deepEqual(await archive.file(name).async('nodebuffer'), await readFile(path.join(dir, key, name)));
  }
  const source = path.join(dir, 'hr', 'manifest.json'), manifest = JSON.parse(await readFile(source)), good = await readFile(zipPath('hr'));
  manifest.version = '1.0.99';
  await writeFile(source, JSON.stringify(manifest));
  assert.throws(() => run('hr/Package-App.ps1', '-Check'), /stale manifest.json/);
  manifest.staticTabs[0].scopes = ['team'];
  await writeFile(source, JSON.stringify(manifest));
  assert.throws(() => run('hr/Package-App.ps1'), /one personal tab/);
  assert.deepEqual(await readFile(zipPath('hr')), good);
});
