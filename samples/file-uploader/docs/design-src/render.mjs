import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = 'file://' + path.join(here, 'mock.html');
const out = path.resolve(here, '..', '..', 'assets', 'design');

// name -> {state, width, theme, narrow}
const shots = [
  ['inline-draft',              { state: 'inline-draft',           width: 760 }],
  ['inline-narrow-draft',       { state: 'inline-draft',           width: 340, narrow: true }],
  ['inline-validation',         { state: 'inline-validation',      width: 760 }],
  ['inline-review',             { state: 'inline-review',          width: 760 }],
  ['inline-receipt',            { state: 'inline-receipt',         width: 760 }],
  ['inline-empty',              { state: 'inline-empty',           width: 760 }],
  ['inline-error',              { state: 'inline-error',           width: 760 }],
  ['fullscreen-bulk',           { state: 'fullscreen-bulk',        width: 1280 }],
  ['fullscreen-bulk-receipt',   { state: 'fullscreen-bulk-receipt',width: 1280 }],
  ['fullscreen-bulk-dark',      { state: 'fullscreen-bulk',        width: 1280, theme: 'dark' }],
  ['recent-default',            { state: 'recent-default',         width: 760 }],
  ['recent-filtered',           { state: 'recent-filtered',        width: 760 }],
  ['recent-selected',           { state: 'recent-selected',        width: 760 }],
  ['recent-no-match',           { state: 'recent-no-match',        width: 760 }],
  ['recent-narrow-default',     { state: 'recent-default',         width: 340, narrow: true }],
];

const browser = await chromium.launch();
const results = [];
for (const [name, o] of shots) {
  // body has 16px padding each side; viewport = component width + 32
  const page = await browser.newPage({ viewport: { width: o.width + 32, height: 600 }, deviceScaleFactor: 2 });
  const u = `${src}?state=${o.state}&theme=${o.theme || 'light'}&narrow=${o.narrow ? 1 : 0}`;
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(u);
  await page.waitForTimeout(150);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  const file = path.join(out, name + '.png');
  await page.screenshot({ path: file, fullPage: true });
  results.push({ name, width: o.width, overflow, errors });
  await page.close();
}
await browser.close();
for (const r of results) console.log(`${r.name.padEnd(26)} ${String(r.width).padStart(4)}px  overflow=${r.overflow}  errors=${r.errors.length}`);
