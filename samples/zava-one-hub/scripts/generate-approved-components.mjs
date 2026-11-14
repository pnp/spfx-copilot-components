import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { zavaCapabilityCatalog } from '../config/zava-capabilities.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const yoCli = resolve(process.env.APPDATA || '', 'npm/node_modules/yo/lib/cli.js');
const fallbackCli = 'Q:/.tools/.npm-global/node_modules/yo/lib/cli.js';
const cli = existsSync(yoCli) ? yoCli : fallbackCli;

function lowerFirst(value) {
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function generate(type, name, manifestPath) {
  if (existsSync(resolve(root, manifestPath))) return false;
  console.log(`Generating ${type} ${name}...`);
  const result = spawnSync(process.execPath, [
    cli,
    '@microsoft/sharepoint',
    '--component-type', type,
    '--component-name', name,
    '--framework', 'react',
    '--skip-install'
  ], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Yeoman failed for ${name} (${result.status}).`);
  return true;
}

let generated = 0;
for (const capability of zavaCapabilityCatalog) {
  if (generate('webpart', capability.webPartName, `src/webparts/${lowerFirst(capability.webPartName)}/${capability.webPartName}WebPart.manifest.json`)) generated += 1;
  if (generate('copilotComponent', capability.copilotName, `src/copilotComponents/${lowerFirst(capability.copilotName)}/${capability.copilotName}CopilotComponent.manifest.json`)) generated += 1;
}

console.log(`Generated ${generated} missing approved component scaffolds.`);