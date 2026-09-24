#!/usr/bin/env node
/**
 * Removes `jest-output/` before `heft test --clean`, retrying while Windows
 * holds a handle in it (docs/GOTCHAS.md, *EPERM … rmdir '…\jest-output\…'*;
 * AGENTS.md R39).
 *
 * `npm run build` failed three times on 2026-09-24, each time at the start of
 * the test phase, with `EPERM: operation not permitted, rmdir
 * '…\jest-output\coverage\…'`, and passed on an immediate retry. Heft's clean
 * deletes once and gives up. Reproduced by holding a handle inside
 * jest-output from another process: a file opened without share-delete gives
 * `EBUSY unlink`, a folder that is a process's current directory gives
 * `EBUSY rmdir`. The usual holders are short-lived: Defender or the Search
 * indexer scanning the coverage files the last run wrote, an editor or a
 * terminal sitting in the folder.
 *
 * The retry loop is our own, over those codes (EBUSY, EMFILE, ENFILE,
 * ENOTEMPTY, EPERM), with a linear back-off, so a transient lock clears and
 * the build goes on. Node's own `maxRetries` is not enough: on Node 22 it
 * retries a locked *file* but a locked *folder* (`EBUSY rmdir`) fails at
 * once, and folders are what failed here. A lock that outlasts the retries
 * fails here, before anything is built, with the path and what to close. It changes nothing
 * about what the tests run: heft still cleans and runs the same suites.
 *
 * `JEST_OUTPUT_RETRIES` overrides the retry count (0 shows the bare failure).
 */
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(ROOT, 'jest-output');
const RETRIES = process.env.JEST_OUTPUT_RETRIES !== undefined ? Number(process.env.JEST_OUTPUT_RETRIES) : 8;
const DELAY_MS = 250; // linear: 250, 500, … — 8 retries wait up to 9 s in all

if (!existsSync(TARGET)) {
  process.exit(0);
}
const RETRIABLE = new Set(['EBUSY', 'EMFILE', 'ENFILE', 'ENOTEMPTY', 'EPERM']);
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function removeWithRetries() {
  for (let attempt = 0; ; attempt++) {
    try {
      rmSync(TARGET, { recursive: true, force: true });
      return;
    } catch (e) {
      if (attempt >= RETRIES || !RETRIABLE.has(e.code)) {
        throw e;
      }
      sleep(DELAY_MS * (attempt + 1));
    }
  }
}

const started = Date.now();
try {
  removeWithRetries();
} catch (e) {
  const waited = ((Date.now() - started) / 1000).toFixed(1);
  console.error(
    `jest-output/ could not be removed after ${RETRIES} retries (${waited} s): ${e.code} ${e.syscall} '${e.path}'.\n` +
      'Another process has a handle in it: a terminal or editor sitting in jest-output, an open coverage report, ' +
      'or Defender / the Search indexer still scanning the last run. Close it, wait a few seconds and run the build ' +
      'again. Nothing was built or tested (docs/GOTCHAS.md, "EPERM … rmdir …jest-output").'
  );
  process.exit(1);
}
const waited = Date.now() - started;
// Only worth a line when it had to wait: that is the transient lock, cleared.
if (waited >= DELAY_MS) {
  console.log(`jest-output/ removed after ${(waited / 1000).toFixed(1)} s of retries (a transient Windows lock cleared).`);
}
