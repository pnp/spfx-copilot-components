#!/usr/bin/env node
/**
 * Build-time gate on the tenant configuration (todo.md 8.9 N1, AGENTS.md §8).
 *
 * `tenant.local.json` is the one place a tenant is named. This fails the build if:
 *   - it is tracked by git, or `.gitignore` stops ignoring it;
 *   - `tenant.example.json` carries anything but placeholders;
 *   - any committed-or-committable text file in this component names a real
 *     SharePoint or onmicrosoft.com host;
 *   - and, when a `tenant.local.json` is present on this machine, any such file
 *     contains one of its actual values (site host, client id, tenant id) —
 *     the check CI cannot make, and the one that catches a pasted GUID.
 *
 * "Committed-or-committable" is `git ls-files --cached --others
 * --exclude-standard`: tracked files plus new ones git would pick up, never
 * node_modules or build output.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL = 'tenant.local.json';
const EXAMPLE = 'tenant.example.json';
const ZERO_GUID = '00000000-0000-0000-0000-000000000000';

// Host labels that are documentation, not a tenant. `<tenant>` never matches the
// host pattern at all; these are the conventional fictional names.
const FICTIONAL_HOSTS = new Set(['contoso', 'fabrikam', 'tenant', 'example', 'yourtenant']);
const HOST_PATTERN = /\b([a-z0-9][a-z0-9-]*?)(?:-admin|-my)?\.(sharepoint\.com|onmicrosoft\.com)\b/gi;
const BINARY = /\.(png|jpe?g|gif|ico|zip|sppkg|woff2?|ttf|pdf)$/i;

const errors = [];

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    // `check-ignore` exits 1 for "not ignored"; that is an answer, not a failure.
    if (e.status === 1 && args[0] === 'check-ignore') return null;
    throw new Error(`git ${args.join(' ')} failed: ${e.message}`);
  }
}

// 1. Never tracked, always ignored.
if (git(['ls-files', '--', LOCAL]).trim() !== '') {
  errors.push(`${LOCAL} is tracked by git — \`git rm --cached ${LOCAL}\`, then check what it exposed`);
}
if (git(['check-ignore', '-q', '--no-index', '--', LOCAL]) === null) {
  errors.push(`${LOCAL} is not ignored — .gitignore must list it`);
}

// 2. The example is placeholders only.
if (!existsSync(join(ROOT, EXAMPLE))) {
  errors.push(`${EXAMPLE} is missing — it is how a new tenant starts`);
} else {
  const example = JSON.parse(await readFile(join(ROOT, EXAMPLE), 'utf8'));
  if (example.clientId !== ZERO_GUID) errors.push(`${EXAMPLE}: clientId must be ${ZERO_GUID}`);
  if (typeof example.tenantId !== 'string' || !example.tenantId.includes('<')) {
    errors.push(`${EXAMPLE}: tenantId must be a <placeholder>`);
  }
  if (typeof example.sharepoint?.siteUrl !== 'string' || !example.sharepoint.siteUrl.includes('<tenant>')) {
    errors.push(`${EXAMPLE}: sharepoint.siteUrl must use the <tenant> placeholder`);
  }
  if ((example.filingUsers ?? []).length > 0) errors.push(`${EXAMPLE}: filingUsers must be empty`);
  for (const field of ['certificatePath', 'certificateThumbprint']) {
    if (example[field]) errors.push(`${EXAMPLE}: ${field} must be empty`);
  }
}

// 3 + 4. No tenant named in anything git would commit.
const secrets = [];
if (existsSync(join(ROOT, LOCAL))) {
  let local;
  try {
    local = JSON.parse(await readFile(join(ROOT, LOCAL), 'utf8'));
  } catch (e) {
    errors.push(`${LOCAL} is not valid JSON (${e.message})`);
  }
  const real = v => typeof v === 'string' && v.trim() !== '' && !v.includes('<') && v !== ZERO_GUID;
  if (local) {
    if (real(local.clientId)) secrets.push(['clientId', local.clientId.trim()]);
    if (real(local.tenantId)) secrets.push(['tenantId', local.tenantId.trim()]);
    if (real(local.sharepoint?.siteUrl)) {
      try {
        secrets.push(['sharepoint.siteUrl host', new URL(local.sharepoint.siteUrl).host]);
      } catch {
        // A malformed URL names no host to look for; the scripts report it.
      }
    }
  }
}

const files = git(['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
  .split('\0')
  .filter(f => f && f !== LOCAL && !BINARY.test(f) && existsSync(join(ROOT, f)));
for (const file of files) {
  const text = await readFile(join(ROOT, file), 'utf8');
  for (const match of text.matchAll(HOST_PATTERN)) {
    if (!FICTIONAL_HOSTS.has(match[1].toLowerCase())) {
      const line = text.slice(0, match.index).split('\n').length;
      errors.push(`${file}:${line} names a real tenant host (${match[0]}) — use <tenant>, and keep the value in ${LOCAL}`);
    }
  }
  const lower = text.toLowerCase();
  for (const [field, value] of secrets) {
    const at = lower.indexOf(value.toLowerCase());
    if (at >= 0) {
      const line = text.slice(0, at).split('\n').length;
      errors.push(`${file}:${line} contains ${LOCAL}'s ${field} — it belongs in ${LOCAL} only`);
    }
  }
}

if (errors.length > 0) {
  console.error('tenant configuration failed validation:\n  - ' + errors.join('\n  - '));
  process.exit(1);
}
const local = secrets.length > 0 ? `, ${secrets.length} ${LOCAL} value(s) found nowhere` : `, no ${LOCAL} here`;
console.log(`tenant configuration: ${LOCAL} ignored and untracked, ${files.length} files free of tenant hosts${local}`);
