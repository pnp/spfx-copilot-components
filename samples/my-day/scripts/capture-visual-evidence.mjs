import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
const root = path.resolve(import.meta.dirname, '..');
execFileSync(process.execPath, [path.join(root, 'scripts', 'build-visual-harness.mjs')], { stdio: 'inherit' });
const site = path.join(root, 'temp', 'ux-review');
const evidence = path.join(root, 'ux-review', 'evidence');
fs.mkdirSync(evidence, { recursive: true });
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname;
  const file = path.resolve(site, pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!file.startsWith(`${site}${path.sep}`) || !fs.existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
  response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'text/html');
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const records = [];
async function capture(focus, mode, theme, width, panel = 'none') {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await page.clock.setFixedTime(new Date('2026-10-20T09:00:00Z'));
    await page.goto(`${base}/?${new URLSearchParams({ focus, mode, theme })}`, { waitUntil: 'networkidle' });
    await page.locator('[data-display-mode]').waitFor();
    if (panel === 'settings') await page.getByRole('button', { name: 'Settings', exact: true }).click();
    if (mode === 'fullscreen' && focus === 'plan') {
      await page.locator('aside[aria-label="Plan my day"]').waitFor();
      await page.waitForFunction(() => !document.querySelector('aside[aria-label="Plan my day"] .fui-Spinner'));
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.keyboard.press('Tab');
    const audit = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).length,
      focus: document.activeElement !== document.body,
      visibleFocus: document.querySelector('[data-my-day-view]')?.getAttribute('data-my-day-view') || 'fullscreen',
      inputsLabeled: [...document.querySelectorAll('input,select,textarea')].every(input => input.labels?.length || input.getAttribute('aria-label') || input.getAttribute('aria-labelledby'))
    }));
    assert.deepEqual(errors, [], 'Runtime/page errors');
    assert(!audit.overflow && !audit.brokenImages && audit.focus && audit.inputsLabeled, JSON.stringify({ focus, mode, theme, width, panel, audit }));
    if (mode === 'inline') assert.equal(audit.visibleFocus, focus);
    const filename = `${focus}-${mode}-${theme}-${width}-${panel}.png`;
    const bytes = await page.locator('#root').screenshot({ path: path.join(evidence, filename), animations: 'disabled' });
    const aliases = [];
    if (mode === 'inline' && theme === 'light' && width === 760) {
      if (focus === 'summary') aliases.push('screenshot-inline.png');
      if (['meetings', 'tasks', 'plan'].includes(focus)) aliases.push(`screenshot-${focus}.png`);
    }
    if (mode === 'fullscreen' && focus === 'summary' && width === 1440) {
      if (theme === 'light' && panel === 'none') aliases.push('screenshot-fullscreen.png');
      if (theme === 'light' && panel === 'settings') aliases.push('screenshot-settings.png');
      if (theme === 'dark' && panel === 'none') aliases.push('screenshot-dark.png');
    }
    for (const alias of aliases) fs.copyFileSync(path.join(evidence, filename), path.join(root, 'assets', alias));
    records.push({ focus, mode, theme, width, panel, filename, capturedWidth: bytes.readUInt32BE(16), capturedHeight: bytes.readUInt32BE(20), sha256: crypto.createHash('sha256').update(bytes).digest('hex'), ...audit, runtimeErrors: 0 });
  } finally { await page.close(); }
}
try {
  for (const focus of ['summary', 'meetings', 'tasks', 'news', 'mail', 'plan']) {
    await capture(focus, 'inline', 'light', 760);
    await capture(focus, 'inline', 'light', 340);
    await capture(focus, 'inline', 'dark', 760);
  }
  for (const width of [340, 760, 1440]) for (const theme of ['light', 'dark']) await capture('summary', 'fullscreen', theme, width);
  for (const theme of ['light', 'dark']) {
    await capture('plan', 'fullscreen', theme, 760, 'plan');
    await capture('summary', 'fullscreen', theme, 1440, 'settings');
    await capture('summary', 'fullscreen', theme, 340, 'settings');
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
assert.equal(records.length, 30);
const report = { generatedAt: new Date().toISOString(), react: '18.3.1', states: records.length, failures: 0, records };
fs.writeFileSync(path.join(root, 'assets', 'rc0-visual-evidence.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log('Validated 30 My Day focus/width/theme/workspace/panel states with zero runtime, image, label or overflow failures.');
