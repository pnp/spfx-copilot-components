import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';

const root = path.resolve(import.meta.dirname, '..');
const site = path.join(root, 'temp', 'ux-review');
const assets = path.join(root, 'assets');
const source = fs.readFileSync(path.join(root, 'src', 'shared', 'catalog.ts'), 'utf8');
const intents = [...source.matchAll(/d\('([^']+)'/g)].map(match => match[1]);
assert.equal(intents.length, 22);
const server = createServer((request, response) => {
  const relative = new URL(request.url || '/', 'http://localhost').pathname.replace(/^\//, '') || 'index.html';
  const file = path.resolve(site, relative);
  if (!file.startsWith(`${site}${path.sep}`) || !fs.existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
  response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'text/html');
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const captures = [];
async function capture(name, intent, mode, theme, width, height, interaction) {
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: theme, reducedMotion: 'reduce' });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${base}/?${new URLSearchParams({ intent, mode, theme })}`);
    await page.locator('[data-experience]').first().waitFor();
    if (interaction) await interaction(page);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.keyboard.press('Tab');
    const metrics = await page.evaluate(() => {
      const focusable = document.querySelectorAll('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]').length;
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        layout: document.querySelector('[data-layout]')?.getAttribute('data-layout') || '',
        experience: document.querySelector('[data-experience]')?.getAttribute('data-experience') || '',
        stage: document.querySelector('[data-workflow-stage]')?.getAttribute('data-workflow-stage') || 'inspect',
        buttons: [...document.querySelectorAll('button')].every(button => Boolean(button.textContent?.trim() || button.getAttribute('aria-label'))),
        inputsLabeled: [...document.querySelectorAll('input,select,textarea')].every(input => input.labels?.length || input.getAttribute('aria-label')),
        brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).length,
        charts: document.querySelectorAll('svg[role="img"] title').length,
        focusable, focus: focusable === 0 || document.activeElement !== document.body
      };
    });
    assert.equal(metrics.experience, intent, `${name}: wrong owning experience`);
    assert(errors.length === 0 && !metrics.overflow && metrics.buttons && metrics.inputsLabeled && !metrics.brokenImages && metrics.focus, `${name}: ${JSON.stringify({ errors, ...metrics })}`);
    const fileName = `ux-${name}.png`;
    const bytes = await page.locator('[data-layout]').first().screenshot({ path: path.join(assets, fileName), animations: 'disabled' });
    captures.push({ name, fileName, intent, mode, theme, viewport: { width, height }, capturedWidth: bytes.readUInt32BE(16), capturedHeight: bytes.readUInt32BE(20), sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, errors, ...metrics });
  } finally { await page.close(); }
}
try {
  for (const intent of intents) {
    await capture(`inline-${intent}`, intent, 'inline', 'light', 760, 920);
    await capture(`inline-${intent}-narrow`, intent, 'inline', 'light', 340, 920);
    await capture(`inline-${intent}-dark`, intent, 'inline', 'dark', 760, 920);
  }
  for (const [name, intent, short] of [
    ['sourcing-workbench', 'CompareSupplierBids', 'sourcing'], ['supplier-360', 'TrackSupplierRisk', 'supplier-360'],
    ['spend-command', 'ExploreSpendPerformance', 'spend-command'], ['my-requests', 'CreatePurchaseIntent', 'my-requests']
  ]) {
    await capture(name, intent, 'fullscreen', 'light', 1440, 1000);
    await capture(`${short}-mobile`, intent, 'fullscreen', 'light', 390, 1100);
    await capture(`${short}-dark`, intent, 'fullscreen', 'dark', 1440, 1000);
  }
  for (const [intent, action] of [
    ['CreatePurchaseIntent', 'create purchase intent'], ['ReviewSupplierAward', 'approve split award'],
    ['ResolveInvoiceException', 'request corrected invoice']
  ]) {
    const review = async page => {
      if (intent !== 'CreatePurchaseIntent') await page.getByLabel('Decision rationale / conditions (minimum 12 characters)').fill('Source evidence and authority reviewed');
      await page.getByRole('button', { name: `Review ${action}`, exact: true }).click();
      await assertStage(page, 'review');
    };
    await capture(`${intent}-review`, intent, 'inline', 'light', 760, 920, review);
    await capture(`${intent}-receipt`, intent, 'inline', 'light', 760, 920, async page => {
      await review(page);
      await page.getByRole('button', { name: `Confirm session-only ${action}`, exact: true }).click();
      await assertStage(page, 'receipt');
    });
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
async function assertStage(page, expected) {
  assert.equal(await page.locator('[data-workflow-stage]').getAttribute('data-workflow-stage'), expected);
}
assert.equal(captures.length, 84);
fs.writeFileSync(path.join(assets, 'gallery-evidence.json'), `${JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), captureCount: captures.length, captures }, null, 2)}\n`);
console.log('Captured 84 current states: 22 tools at standard/narrow/dark, 4 workspaces at desktop/mobile/dark, and 6 review/receipt states; zero runtime, overflow, label, image or focus failures.');
