#!/usr/bin/env node
/**
 * Build-time gate on the committed visual evidence (AGENTS.md R19 — validate,
 * never recapture). Fails if `assets/visual-evidence.json` is missing, stale
 * against the state matrix, points at a missing PNG, or recorded a broken
 * image / horizontal overflow / console error / harness error.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { expectedCaptures, captureFileName, expectsConsoleError } from './visual-harness/states.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE = join(ROOT, 'assets', 'visual-evidence.json');

const errors = [];
if (!existsSync(EVIDENCE)) {
  console.error('assets/visual-evidence.json is missing — run `npm run capture:visual`');
  process.exit(1);
}

const data = JSON.parse(await readFile(EVIDENCE, 'utf8'));
const want = expectedCaptures().map(c => captureFileName(c)).sort();
const have = (data.captures || []).map(c => c.file.replace(/^assets\//, '')).sort();

if (JSON.stringify(want) !== JSON.stringify(have)) {
  errors.push(
    `capture set does not match the state matrix — run \`npm run capture:visual\`\n    missing: ${want.filter(w => !have.includes(w)).join(', ') || 'none'}\n    extra:   ${have.filter(h => !want.includes(h)).join(', ') || 'none'}`
  );
}

for (const c of data.captures || []) {
  if (!existsSync(join(ROOT, c.file))) errors.push(`${c.file} is listed but not on disk`);
  if (c.harnessError) errors.push(`${c.file}: harness error — ${c.harnessError}`);
  if (c.brokenImages > 0) errors.push(`${c.file}: ${c.brokenImages} broken image(s)`);
  if (c.horizontalOverflow) errors.push(`${c.file}: horizontal overflow`);
  const logged = (c.consoleErrors || []).length;
  if (expectsConsoleError(c.id)) {
    // The boundary state throws on purpose; React logging what it caught is the
    // proof it threw. Silence here means the throw stopped happening.
    if (logged === 0) errors.push(`${c.file}: expected the caught error to be logged, console was silent`);
  } else if (logged > 0) {
    errors.push(`${c.file}: console error — ${c.consoleErrors[0]}`);
  }
  if (!c.layout) errors.push(`${c.file}: no [data-layout] rendered`);
}

const s = data.summary || {};
if (s.brokenImages || s.horizontalOverflow || s.unexpectedConsoleErrors || s.expectedConsoleErrorsMissing || s.harnessErrors) {
  errors.push(`summary is not clean: ${JSON.stringify(s)}`);
}

if (errors.length > 0) {
  console.error('visual evidence failed validation:\n  - ' + errors.join('\n  - '));
  process.exit(1);
}
console.log(`visual evidence: ${data.captures.length} captures, all clean`);
