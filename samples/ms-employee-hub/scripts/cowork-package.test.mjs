import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {copyFile, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import JSZip from 'jszip';

test('the standalone helper packages literal files and leaves good packages intact after invalid input', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'employee-hub-plugin-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const file = name => path.join(dir, name);
  const members = ['ai-plugin.json', 'color.png', 'declarativeAgent.json', 'manifest.json', 'outline.png'];
  for (const name of [...members, 'Package-Plugin.ps1'])
    await copyFile(new URL(`../employee-hub-plugin/${name}`, import.meta.url), file(name));
  const sources = Object.fromEntries(await Promise.all(members.map(async name => [name, await readFile(file(name))])));
  const run = (...args) => execFileSync(process.platform === 'win32' ? 'powershell.exe' : 'pwsh',
    ['-NoProfile', '-NonInteractive', '-File', file('Package-Plugin.ps1'), ...args], {cwd: dir, stdio: 'pipe'});
  const load = name => readFile(file(name));
  run();
  const review = await JSZip.loadAsync(await load('employee-hub-local-review.zip'), {checkCRC32: true});
  assert.deepEqual(Object.keys(review.files).sort(), members);
  for (const name of members) assert.deepEqual(await review.file(name).async('nodebuffer'), sources[name]);

  const tenant = 'https://offline-fixture.sharepoint.com', legal = ['-WebsiteUrl', 'https://publisher.contoso.com',
    '-PrivacyUrl', 'https://publisher.contoso.com/privacy', '-TermsOfUseUrl', 'https://publisher.contoso.com/terms'];
  run('-TenantUrl', tenant, ...legal);
  const good = await load('employee-hub-plugin.zip'), pilot = await JSZip.loadAsync(good, {checkCRC32: true});
  const app = JSON.parse(await pilot.file('manifest.json').async('string')), action = JSON.parse(await pilot.file('ai-plugin.json').async('string'));
  const endpoint = `${tenant}/_api/mcp/spfx?solutionId=b847948b-8a9b-4483-b335-a6343eeb1760`;
  assert.deepEqual(Object.keys(pilot.files).sort(), members);
  assert.equal(app.agentConnectors[0].toolSource.remoteMcpServer.mcpServerUrl, endpoint);
  assert.equal(action.runtimes[0].spec.url, endpoint);
  assert.deepEqual(app.developer, {name: 'Contoso', websiteUrl: legal[1], privacyUrl: legal[3], termsOfUseUrl: legal[5]});
  for (const name of members) assert.deepEqual(await load(name), sources[name]);

  const reject = async (reason, ...args) => {
    assert.throws(() => run(...args), reason);
    assert.deepEqual(await load('employee-hub-plugin.zip'), good);
  };
  await reject(/approved public HTTPS/i, '-TenantUrl', tenant);
  for (const invalid of [tenant + '/sites/pilot', 'https://fixture-admin.sharepoint.com', 'https://fixture-my.sharepoint.com'])
    await reject(/commercial SharePoint tenant root/i, '-TenantUrl', invalid, ...legal);
  for (const override of [{functions: [{name: 'staticTool'}]}, {runtimes: action.runtimes}]) {
    await writeFile(file('ai-plugin.json'), JSON.stringify({...JSON.parse(sources['ai-plugin.json']), ...override}));
    await reject(/dynamically discover/i, '-TenantUrl', tenant, ...legal);
  }
});
