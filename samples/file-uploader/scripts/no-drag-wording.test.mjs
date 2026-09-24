/**
 * Offline tests for no-drag-wording.mjs (todo.md 8.8 L10 review). `node:test`,
 * no new dependency. Run with `npm run test:no-drag-wording`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_PROHIBITION, findDragWording, jsonStrings } from './no-drag-wording.mjs';

test('the pre-review tool description is caught', () => {
  const hit = findDragWording('File an invoice… The user drops the file in the component; nothing is saved until they confirm.');
  assert.match(hit, /The user drops the file/);
});

test('choose wording passes; words that merely contain the letters do not count', () => {
  assert.equal(findDragWording('The user chooses the file in the component.'), undefined);
  assert.equal(findDragWording('Raindrop Ltd, a backdrop invoice'), undefined);
});

test('the one prohibition is allowed, wrapped as instruction.txt wraps it', () => {
  const wrapped = 'is never a tool input. Never\nask them to drag or drop it: a file dragged into Copilot is attached to the\nchat, not to the form.\n';
  assert.equal(findDragWording(wrapped, [ALLOWED_PROHIBITION]), undefined);
});

test('the allowance covers that sentence once, not a second mention', () => {
  const text = ALLOWED_PROHIBITION + ' Then drop the invoice into it.';
  assert.match(findDragWording(text, [ALLOWED_PROHIBITION]), /drop the invoice/);
});

test('rewording the prohibition re-arms the check', () => {
  assert.ok(findDragWording('Never ask the user to drag a file in.', [ALLOWED_PROHIBITION]));
});

test('jsonStrings reaches nested descriptions (functions[] and MCP tools)', () => {
  const plugin = {
    functions: [{ name: 'fileDocuments', description: 'ok' }],
    runtimes: [{ spec: { mcp_tool_description: { tools: [{ description: 'The user drops the file' }] } } }]
  };
  assert.match(findDragWording(jsonStrings(plugin)), /drops the file/);
});
