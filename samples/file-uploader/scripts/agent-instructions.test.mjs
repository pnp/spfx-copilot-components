/**
 * Offline tests for agent-instructions.mjs (todo.md 8.8 L11 B): the rule
 * validate-agent-package.mjs applies with and without `--allow-inline`, and
 * what `gen-copilot-assets --inline` writes. `node:test`, no new dependency.
 * Run with `npm run test:agent-instructions`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkInstructions, inlineInstructions, INSTRUCTIONS_PLACEHOLDER, MAX_INSTRUCTIONS } from './agent-instructions.mjs';

const AUTHORED = 'You are Document Intake.\r\nThe user chooses the file there.\r\n';
const LF = 'You are Document Intake.\nThe user chooses the file there.\n';

test('placeholder, file shipped and equal -> passes, with or without --allow-inline', () => {
  for (const allowInline of [false, true]) {
    const r = checkInstructions({ instructions: INSTRUCTIONS_PLACEHOLDER, shipped: LF, authored: AUTHORED, allowInline });
    assert.deepEqual(r, { errors: [], form: 'placeholder' });
  }
});

test('placeholder with the file missing or stale -> fails (N2e, unchanged)', () => {
  assert.match(checkInstructions({ instructions: INSTRUCTIONS_PLACEHOLDER, shipped: undefined, authored: AUTHORED }).errors[0], /not in the agent package/);
  assert.match(checkInstructions({ instructions: INSTRUCTIONS_PLACEHOLDER, shipped: 'old text', authored: AUTHORED }).errors[0], /differs/);
});

test('inlined WITHOUT --allow-inline -> fails with the N2e message, naming the way to do it on purpose', () => {
  const r = checkInstructions({ instructions: LF, shipped: LF, authored: AUTHORED });
  assert.equal(r.form, 'inlined');
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /^declarativeAgent\.json inlines the instructions\. SharePoint registers an inlined package with no functions \(R34, D17\)/);
  assert.match(r.errors[0], /build:instruction-update/);
  assert.match(r.errors[0], /-InstructionUpdate/);
});

test('inlined WITH --allow-inline, verbatim (line endings aside) -> passes as inlined', () => {
  assert.deepEqual(checkInstructions({ instructions: LF, shipped: LF, authored: AUTHORED, allowInline: true }), { errors: [], form: 'inlined' });
  // beta.2 may or may not copy instruction.txt beside it; its absence is fine when inlined.
  assert.deepEqual(checkInstructions({ instructions: LF, shipped: undefined, authored: AUTHORED, allowInline: true }).errors, []);
});

test('inlined WITH --allow-inline but not verbatim -> fails (stale inline)', () => {
  const r = checkInstructions({ instructions: 'You are Document Intake.\nThe user drops the file there.\n', shipped: LF, authored: AUTHORED, allowInline: true });
  assert.match(r.errors[0], /differ from copilot\/instruction\.txt/);
});

test('inlined but the copied instruction.txt disagrees -> fails', () => {
  const r = checkInstructions({ instructions: LF, shipped: 'older text', authored: AUTHORED, allowInline: true });
  assert.match(r.errors.join('\n'), /instruction\.txt in the agent package differs/);
});

test('a half-inlined $[...] reference is never accepted', () => {
  const half = LF + "$[file('more.txt')]";
  const r = checkInstructions({ instructions: half, shipped: undefined, authored: half, allowInline: true });
  assert.match(r.errors.join('\n'), /still contain a \$\[\.\.\.\] reference/);
});

test('empty instructions and the 8,000-character limit fail in every mode', () => {
  assert.equal(checkInstructions({ instructions: '  ', shipped: LF, authored: AUTHORED, allowInline: true }).form, 'invalid');
  const long = 'x'.repeat(MAX_INSTRUCTIONS + 1);
  assert.match(checkInstructions({ instructions: long, shipped: undefined, authored: long, allowInline: true }).errors[0], /8000/);
});

test('--inline writes instruction.txt with LF line endings, nothing else', () => {
  assert.equal(inlineInstructions(AUTHORED), LF);
});
