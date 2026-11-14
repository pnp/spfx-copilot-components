#!/usr/bin/env node
/**
 * Is the committed .sppkg newer than every source that goes into it?
 * (todo.md 8.9 N2a; AGENTS.md R13, R21, R39.)
 *
 * The 1.0.5.0 deploy shipped a package built before the last source change:
 * the version fields were right, so nothing noticed. `deploy.ps1` pre-flight 1
 * runs this after its version checks. It is not part of `npm run build`,
 * which makes the package fresh by definition.
 *
 * Effective time of a path: its file mtime if `git status` lists it (modified
 * or untracked), else its last commit time. A clean checkout's mtimes are the
 * checkout time, which is why clean files use the commit time. A source
 * directory's time is the later of its last commit and any dirty file in it.
 * A deleted file has no mtime; its folder's mtime is when it was deleted
 * (deleting a file updates the folder). Only if the folder is gone too does it
 * count as changed now. Treating every deletion as "now" refused a package
 * built after the deletion (1.0.10.0, DropTarget.tsx → FilePicker.tsx).
 * Fresh iff t(package) >= max t(sources); equal is fresh (committed together).
 *
 * Usage:
 *   node scripts/check-package-fresh.mjs [path/to/package.sppkg]
 *
 * Every git call uses --no-optional-locks: a `git status` that takes the index
 * lock leaves `index.lock` behind when a sandboxed shell kills it (GOTCHAS).
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const SOURCES = ['src', 'config', 'copilot', 'agent.source.json', 'package.json', 'package-lock.json'];
export const PACKAGE = 'sharepoint/solution/file-uploader.sppkg';

/**
 * Pure rule. `sources` is `[{ path, time }]` in epoch ms; a time of 0 means
 * "no history" and never makes a package stale.
 */
export function isPackageFresh({ packageTime, sources }) {
  const newest = sources.reduce((a, b) => (b.time > a.time ? b : a), { path: undefined, time: 0 });
  return { fresh: packageTime >= newest.time, newest };
}

/**
 * Parses `git status --porcelain -z` into component-relative paths. Porcelain
 * paths are relative to the repository root whatever the cwd, so `prefix`
 * (`git rev-parse --show-prefix`) is stripped. A rename lists the new path
 * then the old one; only the new one exists on disk.
 */
export function parsePorcelain(out, prefix) {
  const entries = out.split('\0').filter(Boolean);
  const paths = [];
  for (let i = 0; i < entries.length; i++) {
    const x = entries[i][0];
    const path = entries[i].slice(3);
    if (x === 'R' || x === 'C') i++;
    if (path.startsWith(prefix)) paths.push(path.slice(prefix.length));
  }
  return paths;
}

const under = (path, source) => path === source || path.startsWith(source + '/');

/**
 * Collects the effective times. `git(args)` returns stdout; `mtime(path)`
 * returns epoch ms for a component-relative path, or undefined when the file
 * is gone (a deleted source then takes its folder's mtime). Both are injected so the
 * tests need no repository.
 */
export function collectTimes({ git, mtime, now = Date.now(), sources = SOURCES, packagePath = PACKAGE }) {
  const prefix = git(['rev-parse', '--show-prefix']).trim();
  const dirty = parsePorcelain(git(['status', '--porcelain', '-z', '--untracked-files=all', '--', '.']), prefix);
  const committed = path => {
    const t = git(['log', '-1', '--format=%ct', '--', path]).trim();
    return t ? Number(t) * 1000 : 0;
  };
  const dirtyTime = path => mtime(path) ?? mtime(posix.dirname(path)) ?? now;

  const sourceTimes = sources.map(source => {
    let best = { path: source, time: committed(source) };
    for (const path of dirty.filter(p => under(p, source))) {
      const time = dirtyTime(path);
      if (time > best.time) best = { path, time };
    }
    return best;
  });
  const packageTime = dirty.includes(packagePath) ? dirtyTime(packagePath) : committed(packagePath) || (mtime(packagePath) ?? 0);
  return { packageTime, sources: sourceTimes };
}

export const formatTime = ms => new Date(ms).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

export function staleMessage(newest, packageTime) {
  return (
    `package built before the last source change — ${newest.path} (${formatTime(newest.time)}) is newer than the .sppkg ` +
    `(${formatTime(packageTime)}). Run \`npm run build\`, then commit the .sppkg and agent ZIP from that one build (R13, R20, R21).`
  );
}

function main() {
  const arg = process.argv[2];
  const rel = arg ? relative(ROOT, resolve(arg)).split(sep).join('/') : PACKAGE;
  const git = args => execFileSync('git', ['--no-optional-locks', ...args], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const mtime = path => {
    try {
      return statSync(isAbsolute(path) ? path : join(ROOT, path)).mtimeMs;
    } catch {
      return undefined;
    }
  };
  // A package outside this component is not in its history: its mtime is all there is.
  const outside = rel.startsWith('..') || isAbsolute(rel);
  const times = collectTimes({ git, mtime, packagePath: outside ? resolve(arg) : rel });
  if (outside) times.packageTime = mtime(resolve(arg)) ?? 0;
  if (!times.packageTime) {
    console.error(`no package at ${arg || PACKAGE} — run \`npm run build\``);
    process.exit(1);
  }
  const { fresh, newest } = isPackageFresh(times);
  if (!fresh) {
    console.error(staleMessage(newest, times.packageTime));
    process.exit(1);
  }
  console.log(
    `package is fresh: built ${formatTime(times.packageTime)}, newest source ${newest.path ?? '(none)'}` +
      (newest.time ? ` ${formatTime(newest.time)}` : '')
  );
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
