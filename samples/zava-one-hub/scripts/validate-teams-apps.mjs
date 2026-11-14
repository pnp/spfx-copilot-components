import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apps = [
  ['zavaOneWorkspace', 'ZavaOneWorkspace'],
  ['zavaOneCompanyWorkspace', 'ZavaOneCompanyWorkspace'],
  ['zavaOnePersonalWorkspace', 'ZavaOnePersonalWorkspace']
];
const ids = new Set();

for (const [folder, alias] of apps) {
  const directory = resolve(root, 'teams', folder);
  const manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8'));
  const webPartPath = resolve(root, 'src/webparts', folder, `${alias}WebPart.manifest.json`);
  const parsed = ts.parseConfigFileTextToJson(webPartPath, readFileSync(webPartPath, 'utf8'));
  assert.ok(!parsed.error, `${folder}: invalid SPFx manifest`);
  assert.equal(manifest.id, parsed.config.id, `${folder}: component ID mismatch`);
  assert.ok(parsed.config.supportedHosts.includes('TeamsPersonalApp'), `${folder}: web part lacks personal-app support`);
  assert.ok(!ids.has(manifest.id), `${folder}: duplicate Teams identity`);
  ids.add(manifest.id);
  assert.equal(manifest.defaultInstallScope, 'personal', `${folder}: incorrect installation scope`);
  assert.equal(manifest.staticTabs.length, 1, `${folder}: expected one personal tab`);
  assert.equal('configurableTabs' in manifest, false, `${folder}: channel tabs are not allowed`);
  assert.equal('supportsChannelFeatures' in manifest, false, `${folder}: channel declarations are not allowed`);
  const tab = manifest.staticTabs[0];
  assert.deepEqual(tab.scopes, ['personal'], `${folder}: incorrect scope`);
  assert.deepEqual(tab.context, ['personalTab'], `${folder}: incorrect context`);
  assert.equal(tab.entityId, manifest.id, `${folder}: incorrect tab identity`);
  assert.equal(tab.name, manifest.name.short, `${folder}: incorrect tab name`);
  assert.equal(tab.contentUrl,
    `https://{teamSiteDomain}/_layouts/15/TeamsLogon.aspx?SPFX=true&dest=/_layouts/15/teamshostedapp.aspx%3Fteams%26personal%26componentId=${manifest.id}%26forceLocale={locale}`,
    `${folder}: incorrect SPFx personal-app URL`);
  assert.deepEqual(manifest.webApplicationInfo, { id: '00000003-0000-0ff1-ce00-000000000000', resource: 'https://{teamSiteDomain}' });
  assert.equal(manifest.icons.color, 'color.png');
  assert.equal(manifest.icons.outline, 'outline.png');
  for (const [name, size] of [['color.png', 192], ['outline.png', 32]]) {
    const bytes = readFileSync(resolve(directory, name));
    assert.equal(bytes.readUInt32BE(16), size, `${folder}/${name}: incorrect width`);
    assert.equal(bytes.readUInt32BE(20), size, `${folder}/${name}: incorrect height`);
  }
  const archive = resolve(directory, 'TeamsSPFxApp.zip');
  const files = ['manifest.json', 'color.png', 'outline.png'];
  assert.deepEqual(execFileSync('tar', ['-tf', archive], { encoding: 'utf8' }).trim().split(/\r?\n/).sort(), [...files].sort(),
    `${folder}: incorrect ZIP entries`);
  for (const name of files) {
    assert.ok(execFileSync('tar', ['-xOf', archive, name]).equals(readFileSync(resolve(directory, name))),
      `${folder}: stale ${name} in ZIP`);
  }
  console.log(`Validated ${folder}: personal-only manifest, SPFx mapping, icon dimensions, and ZIP contents.`);
}
