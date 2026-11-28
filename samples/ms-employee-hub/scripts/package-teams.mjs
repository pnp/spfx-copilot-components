import { resolve } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import JSZip from 'jszip';
import assert from 'node:assert/strict';
import { root, entries, publisher as reviewPublisher } from './host-model.mjs';
import {targetFromArgs} from './pilot-target.mjs';
import { colors } from './identity-art.mjs';

const check = process.argv.includes('--check');
const publisher=targetFromArgs(process.argv.slice(2))?.publisher||reviewPublisher;
const apps = entries('webparts').filter(p => p.row?.id === 30);
assert.equal(apps.length, 5);
const target = (path, data) => {
  if (check) assert(readFileSync(path).equals(data), `Unexpected or stale ${path}`); else writeFileSync(path, data);
};
for (const part of apps) {
  const key = part.landing?.landing || 'hub', title = part.landing?.title || 'Employee Hub';
  const id = part.manifest.id, path = resolve(root, 'teams', key);
  if (!check) mkdirSync(path, { recursive: true });
  const manifest = {
    $schema: 'https://developer.microsoft.com/json-schemas/teams/v1.29/MicrosoftTeams.schema.json',
    manifestVersion: '1.29', version: '1.0.1', id, developer: publisher, name: { short: title, full: `${title} · Employee Hub workspace` },
    description: { short: `Open ${title} in a personal workspace.`, full: `${part.landing ? `A fixed ${title} experience without workspace switching.` : 'Explore your authorized company, HR, technology and business workspaces.'} Uses synthetic records and in-memory actions. Installing this app does not grant data access. Requires this Employee Hub SPFx solution in the organization’s app catalog.` },
    icons: { color: 'color.png', outline: 'outline.png' }, accentColor: colors[key], defaultInstallScope: 'personal',
    staticTabs: [{ entityId: id, name: title, contentUrl: `https://{teamSiteDomain}/_layouts/15/TeamsLogon.aspx?SPFX=true&dest=/_layouts/15/teamshostedapp.aspx%3Fteams%26personal%26componentId=${id}%26forceLocale={locale}`, scopes: ['personal'], context: ['personalTab'] }],
    validDomains: ['*.login.microsoftonline.com', '*.sharepoint.com'],
    webApplicationInfo: { id: '00000003-0000-0ff1-ce00-000000000000', resource: 'https://{teamSiteDomain}' }
  };
  const files = { 'manifest.json': Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`), 'color.png': readFileSync(resolve(path,'color.png')), 'outline.png': readFileSync(resolve(path,'outline.png')) };
  const zipPath = resolve(path, `employee-hub-${key}.zip`), archive = new JSZip();
  for (const [file, value] of Object.entries(files)) {
    if(file==='manifest.json')target(resolve(path, file), value);
    archive.file(file, value, { date: new Date('2000-01-01T00:00:00Z') });
  }
  if (!check) writeFileSync(zipPath, await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', platform: 'DOS' }));
  const release = resolve(root, 'release', 'teams');
  if (!check) mkdirSync(release, { recursive: true });
  const copy = resolve(release, `employee-hub-${key}.zip`);
  if (!check) writeFileSync(copy, readFileSync(zipPath));
  // PowerShell and JSZip may use different compression. Both copies must contain the same authored bytes.
  for (const archivePath of [zipPath, copy]) {
    const packed = await JSZip.loadAsync(readFileSync(archivePath), { checkCRC32: true });
    assert.deepEqual(Object.keys(packed.files).sort(), Object.keys(files).sort(), archivePath);
    for (const [file, value] of Object.entries(files)) assert((await packed.file(file).async('nodebuffer')).equals(value), `${archivePath}: ${file}`);
  }
}
console.log(`Verified ${apps.length} separate personal-only Teams ZIPs, generated target IDs and 192px/32px icons.`);
