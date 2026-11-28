import { spawnSync, execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { root, entries, fixed, catalog, proof } from './host-model.mjs';

const all = process.argv.includes('--all');
const rows = all ? catalog : catalog.filter(r => proof.includes(r.id));
const npm = process.env.npm_execpath;
const globalDir = npm ? execFileSync(process.execPath, [npm, 'root', '-g'], { encoding: 'utf8' }).trim()
  : execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['root', '-g'], { encoding: 'utf8', shell: process.platform === 'win32' }).trim();
const meta = JSON.parse(readFileSync(resolve(globalDir, '@microsoft/generator-sharepoint/package.json'), 'utf8'));
if (meta.version !== '1.24.2') throw Error(`Install @microsoft/generator-sharepoint@1.24.2; found ${meta.version}`);
const yo = resolve(globalDir, 'yo/lib/cli.js');
const requested = [
  ...rows.map(r => ['copilotComponents', r.tool]), ...rows.map(r => ['webparts', r.part]), ...fixed.map(r => ['webparts', r.part])
];
let generated = 0;
const protect = ['.yo-rc.json', 'eslint.config.js', 'package.json', 'config/serve.json', 'config/package-solution.json'];
for (const [kind, name] of requested) {
  if (entries(kind).some(e => e.alias.toLowerCase() === (name + (kind === 'webparts' ? 'WebPart' : 'CopilotComponent')).toLowerCase())) continue;
  const previous = protect.filter(p => existsSync(resolve(root, p))).map(p => [p, readFileSync(resolve(root, p))]);
  // The initial web-part scaffold has already added its dependencies. Later adds must not replace the build or legal metadata.
  try {
    const r = spawnSync(process.execPath, [yo, '@microsoft/sharepoint', '--component-type', kind === 'webparts' ? 'webpart' : 'copilotComponent',
      '--component-name', name, '--framework', 'react', '--skip-install', '--no-insight'], { cwd: root, encoding: 'utf8' });
    if (r.status !== 0 || !entries(kind).some(e => e.alias.toLowerCase() === (name + (kind === 'webparts' ? 'WebPart' : 'CopilotComponent')).toLowerCase())) throw Error(`${name}: ${r.stderr}\n${r.stdout}`);
    generated++;
    console.log(`Generated ${name} (${kind})`);
  } finally { for (const [p, bytes] of previous) writeFileSync(resolve(root, p), bytes); }
}
console.log(`${generated} new GA scaffolds; existing component GUIDs were preserved.`);
