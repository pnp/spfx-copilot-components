/**
 * Offline tests for check-package-fresh.mjs (todo.md 8.9 N2a). No repository,
 * no tenant, no new dependency: `node:test`, with git and the file system
 * injected. Run with `npm run test:package-fresh`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectTimes, isPackageFresh, parsePorcelain, staleMessage } from './check-package-fresh.mjs';

const PREFIX = 'components/file-uploader/';
const PKG = 'sharepoint/solution/file-uploader.sppkg';
const T = s => Date.UTC(2026, 8, 23, 12, 0, s); // one minute, second by second

/**
 * A fake git: `commits` maps a component-relative path to its last commit time
 * (ms), `dirty` is porcelain entries relative to the component.
 */
function fakeGit({ commits = {}, dirty = [] }) {
  return args => {
    if (args[0] === 'rev-parse') return PREFIX + '\n';
    if (args[0] === 'status') return dirty.map(e => e.slice(0, 3) + PREFIX + e.slice(3)).join('\0') + (dirty.length ? '\0' : '');
    if (args[0] === 'log') {
      const t = commits[args[args.length - 1]];
      return t ? `${Math.floor(t / 1000)}\n` : '';
    }
    throw new Error(`unexpected git ${args.join(' ')}`);
  };
}
const fakeMtime = mtimes => path => mtimes[path];
const run = ({ commits, dirty, mtimes = {} }) => {
  const times = collectTimes({ git: fakeGit({ commits, dirty }), mtime: fakeMtime(mtimes), now: T(59) });
  return { times, ...isPackageFresh(times) };
};

test('isPackageFresh: equal times are fresh, a newer source is stale and named', () => {
  assert.equal(isPackageFresh({ packageTime: T(10), sources: [{ path: 'src', time: T(10) }] }).fresh, true);
  const r = isPackageFresh({ packageTime: T(10), sources: [{ path: 'config', time: T(5) }, { path: 'src', time: T(11) }] });
  assert.equal(r.fresh, false);
  assert.equal(r.newest.path, 'src');
});

test('clean checkout, package committed with the source -> fresh', () => {
  const r = run({ commits: { src: T(10), config: T(3), copilot: T(3), [PKG]: T(10) } });
  assert.equal(r.fresh, true);
});

test('a source commit newer than the package -> stale, naming it', () => {
  const r = run({ commits: { src: T(20), config: T(3), [PKG]: T(10) } });
  assert.equal(r.fresh, false);
  assert.equal(r.newest.path, 'src');
  assert.match(staleMessage(r.newest, r.times.packageTime), /^package built before the last source change — src \(2026-09-23 12:00:20 UTC\) is newer than the \.sppkg \(2026-09-23 12:00:10 UTC\)\. Run `npm run build`/);
});

test('a dirty source edited after the package was built -> stale, naming the file', () => {
  const file = 'src/copilotComponents/fileUploader/components/FilingInline.tsx';
  const r = run({ commits: { src: T(5), [PKG]: T(10) }, dirty: [` M ${file}`], mtimes: { [file]: T(30) } });
  assert.equal(r.fresh, false);
  assert.equal(r.newest.path, file);
});

test('package rebuilt and not yet committed, after the last source commit -> fresh', () => {
  const r = run({ commits: { src: T(20), [PKG]: T(10) }, dirty: [` M ${PKG}`], mtimes: { [PKG]: T(40) } });
  assert.equal(r.fresh, true);
  assert.equal(r.times.packageTime, T(40));
});

test('an untracked file under src/ counts', () => {
  const file = 'src/copilotComponents/fileUploader/components/blocks/LinkOut.tsx';
  const r = run({ commits: { src: T(5), [PKG]: T(10) }, dirty: [`?? ${file}`], mtimes: { [file]: T(12) } });
  assert.equal(r.fresh, false);
  assert.equal(r.newest.path, file);
});

test('dirty files outside the sources do not count (docs, todo.md)', () => {
  const r = run({ commits: { src: T(5), [PKG]: T(10) }, dirty: [' M todo.md', ' M docs/TESTING.md', ' M scripts/deploy.ps1'], mtimes: { 'todo.md': T(50) } });
  assert.equal(r.fresh, true);
});

test('a deleted source takes its folder mtime: deleted before the build -> fresh', () => {
  const r = run({ commits: { src: T(5), [PKG]: T(5) }, dirty: [' D src/old.ts', ` M ${PKG}`], mtimes: { src: T(8), [PKG]: T(10) } });
  assert.equal(r.fresh, true);
});

test('a deleted source after the build -> stale, naming it', () => {
  const r = run({ commits: { src: T(5), [PKG]: T(10) }, dirty: [' D src/old.ts'], mtimes: { src: T(20) } });
  assert.equal(r.fresh, false);
  assert.equal(r.newest.path, 'src/old.ts');
  assert.equal(r.newest.time, T(20));
});

test('a deleted source whose folder is gone too counts as changed now', () => {
  const r = run({ commits: { src: T(5), [PKG]: T(10) }, dirty: [' D src/gone/old.ts'] });
  assert.equal(r.fresh, false);
  assert.equal(r.newest.time, T(59));
});

test('a single-file source (package-lock.json) is matched exactly, not by prefix', () => {
  const r = run({ commits: { 'package-lock.json': T(20), 'package.json': T(1), [PKG]: T(10) } });
  assert.equal(r.newest.path, 'package-lock.json');
  assert.equal(r.fresh, false);
});

test('parsePorcelain: strips the repo prefix, takes the new side of a rename, drops other components', () => {
  const out = [`R  ${PREFIX}src/new.ts`, `${PREFIX}src/old.ts`, `?? ${PREFIX}config/x.json`, ' M components/other/src/a.ts', ''].join('\0');
  assert.deepEqual(parsePorcelain(out, PREFIX), ['src/new.ts', 'config/x.json']);
});
