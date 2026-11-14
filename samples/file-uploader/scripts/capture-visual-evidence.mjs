#!/usr/bin/env node
/**
 * Rewrites the visual evidence: bundles the harness, drives every state in a
 * real Chromium via Playwright, screenshots each into `assets/`, and writes
 * `assets/visual-evidence.json`. Capture and verification are separate
 * (AGENTS.md R19) — `check:gallery` validates the committed JSON and never
 * recaptures. Run this by hand when the UI changes: `npm run capture:visual`.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { chromium } from 'playwright';
import { STATES, THEMES, expectedCaptures, captureFileName, expectsConsoleError } from './visual-harness/states.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'scripts', 'visual-harness', 'dist');
const ASSETS = join(ROOT, 'assets');
const MODE = Object.fromEntries(STATES.map(s => [s.id, s.displayMode]));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

execFileSync(process.execPath, [join(ROOT, 'scripts', 'visual-harness', 'build.mjs')], { stdio: 'inherit' });
await mkdir(ASSETS, { recursive: true });

const server = createServer(async (req, res) => {
  const path = (req.url || '/').split('?')[0];
  const fileName = path === '/' ? '/index.html' : path;
  try {
    const body = await readFile(join(DIST, fileName));
    res.writeHead(200, { 'content-type': MIME[extname(fileName)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const captures = [];
let failures = 0;

for (const cap of expectedCaptures()) {
  const width = cap.width;
  const zoom = cap.variant === 'zoom200';
  // 200% browser zoom ≈ half the CSS pixels to lay out in. The component still
  // reports its full host width; only the viewport shrinks.
  const viewportWidth = (zoom ? Math.round(width / 2) : width) + 32;
  const page = await browser.newPage({ viewport: { width: viewportWidth, height: 900 }, deviceScaleFactor: 2 });
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(String(e)));

  const url = `${base}/?state=${cap.id}&theme=${cap.theme}&width=${width}&mode=${MODE[cap.id]}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction('window.__harnessReady === true', null, { timeout: 15000 });
  const harnessError = await page.evaluate('window.__harnessError || null');

  const probe = await page.evaluate(`(() => {
    const layout = (document.querySelector('[data-layout]') || {}).getAttribute
      ? document.querySelector('[data-layout]').getAttribute('data-layout') : null;
    const brokenImages = Array.from(document.images).filter(i => i.complete && i.naturalWidth === 0).length;
    const el = document.scrollingElement || document.documentElement;
    const horizontalOverflow = el.scrollWidth > el.clientWidth + 1;
    return { layout, brokenImages, horizontalOverflow };
  })()`);

  const fileName = captureFileName(cap);
  await page.locator('#root').screenshot({ path: join(ASSETS, fileName) });
  await page.close();

  // `render-error` throws on purpose and React logs what the boundary caught;
  // there, a silent console is the failure (states.mjs).
  const expectsError = expectsConsoleError(cap.id);
  const consoleErrorsAreWrong = expectsError ? consoleErrors.length === 0 : consoleErrors.length > 0;

  const record = {
    id: cap.id,
    theme: cap.theme,
    variant: cap.variant,
    width,
    file: `assets/${fileName}`,
    layout: probe.layout,
    brokenImages: probe.brokenImages,
    horizontalOverflow: probe.horizontalOverflow,
    consoleErrors,
    expectsConsoleError: expectsError || undefined,
    harnessError: harnessError || undefined
  };
  captures.push(record);

  const bad = harnessError || probe.brokenImages > 0 || probe.horizontalOverflow || consoleErrorsAreWrong;
  if (bad) failures++;
  console.log(`${bad ? 'FAIL' : 'ok  '}  ${fileName}  (${probe.layout || '—'})${harnessError ? ' ' + harnessError : ''}`);
}

await browser.close();
await new Promise(r => server.close(r));

const summary = {
  total: captures.length,
  brokenImages: captures.reduce((n, c) => n + c.brokenImages, 0),
  horizontalOverflow: captures.filter(c => c.horizontalOverflow).length,
  // Split, so the one state that is meant to log does not hide a regression
  // anywhere else: `check:gallery` gates on the unexpected count.
  unexpectedConsoleErrors: captures
    .filter(c => !expectsConsoleError(c.id))
    .reduce((n, c) => n + c.consoleErrors.length, 0),
  expectedConsoleErrorsMissing: captures
    .filter(c => expectsConsoleError(c.id) && c.consoleErrors.length === 0).length,
  harnessErrors: captures.filter(c => c.harnessError).length
};

await writeFile(
  join(ASSETS, 'visual-evidence.json'),
  JSON.stringify(
    { generatedAt: new Date().toISOString(), clock: '2026-08-18T09:00:00 (local)', states: STATES.length, themes: THEMES, captures, summary },
    undefined,
    2
  ) + '\n'
);

console.log(`\n${captures.length} captures → assets/  (${failures} with problems)`);
if (!existsSync(join(ASSETS, 'visual-evidence.json'))) process.exit(1);
process.exit(failures > 0 ? 1 : 0);
