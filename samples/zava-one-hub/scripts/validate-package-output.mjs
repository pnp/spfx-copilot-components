import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = resolve(root, 'sharepoint/solution/zava-one-hub.sppkg');

if (!existsSync(packagePath)) {
  console.error('SPPKG is missing: sharepoint/solution/zava-one-hub.sppkg');
  process.exit(1);
}

const entries = execFileSync('tar', ['-tf', packagePath], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);
const packageSize = statSync(packagePath).size;
const errors = [];

if (!entries.some((entry) => entry.endsWith('.js'))) errors.push('SPPKG contains no JavaScript asset.');
if (!entries.some((entry) => entry.includes('ClientSideAssets'))) errors.push('SPPKG contains no ClientSideAssets output.');
if (entries.some((entry) => entry.toLowerCase().includes('baseline'))) errors.push('SPPKG contains stale Baseline output.');
if (packageSize > 15 * 1024 * 1024) errors.push(`SPPKG exceeds the 15 MB keynote threshold (${packageSize} bytes).`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated SPPKG (${packageSize} bytes, ${entries.length} entries).`);