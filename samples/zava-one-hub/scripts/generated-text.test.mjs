import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeNewlines } from './generated-text.mjs';

test('LF, CRLF, and mixed generated files compare equally', () => {
  assert.equal(normalizeNewlines('first\r\nsecond\r\n'), 'first\nsecond\n');
  assert.equal(normalizeNewlines('first\nsecond\r\n'), 'first\nsecond\n');
  assert.equal(normalizeNewlines('first\nsecond\n'), 'first\nsecond\n');
});

test('content changes and missing final newlines remain detectable', () => {
  assert.notEqual(normalizeNewlines('changed\r\n'), normalizeNewlines('original\n'));
  assert.notEqual(normalizeNewlines('original'), normalizeNewlines('original\n'));
});

test('escaped newlines inside generated strings are preserved', () => {
  assert.equal(normalizeNewlines('{"value":"first\\r\\nsecond"}\r\n'), '{"value":"first\\r\\nsecond"}\n');
});
