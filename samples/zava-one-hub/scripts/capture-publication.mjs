import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { zavaCapabilityCatalog } from '../config/zava-capabilities.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = process.env.ZAVA_UX_REVIEW_URL || 'http://127.0.0.1:4322';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const captures = [];
const viewport = { width: 1600, height: 1000 };

async function open(query, captureViewport = viewport) {
  const context = await browser.newContext({ viewport: captureViewport, deviceScaleFactor: 1, colorScheme: 'light' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-10-01T09:00:00Z'));
  await page.goto(`${baseUrl}/?${query}`, { waitUntil: 'networkidle' });
  await page.locator('[data-layout]').first().waitFor();
  assert.deepEqual(await page.evaluate(() => ({ width: innerWidth, height: innerHeight })), captureViewport);
  return { context, page, errors, query, viewport: captureViewport };
}

async function capture(session, name, expectedLayout, directory = 'assets') {
  const { page, errors, query } = session;
  const content = page.locator('[data-layout]').first();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
  const layout = await content.getAttribute('data-layout');
  assert.ok(layout, `${name}: missing experience layout`);
  if (expectedLayout) assert.equal(layout, expectedLayout, `${name}: wrong experience state`);
  const geometry = await content.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      scrollWidth: element.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).length
    };
  });
  assert.ok(geometry.width >= 640 && geometry.height >= 200, `${name}: collapsed content bounds`);
  assert.ok(geometry.scrollWidth <= geometry.width + 2, `${name}: content is horizontally clipped`);
  assert.ok(geometry.documentWidth <= geometry.viewportWidth + 2, `${name}: document overflow`);
  assert.equal(geometry.brokenImages, 0, `${name}: broken image`);
  assert.deepEqual(errors, [], `${name}: browser runtime errors`);
  const path = resolve(root, directory, name);
  await content.screenshot({ path, animations: 'disabled', timeout: 30000 });
  const bytes = readFileSync(path);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert.ok(Math.abs(width - geometry.width) <= 1 && Math.abs(height - geometry.height) <= 1,
    `${name}: PNG dimensions do not match rendered content bounds`);
  captures.push({
    path: `${directory}/${name}`,
    source: 'local-ux-review',
    query,
    layout,
    viewport: session.viewport,
    width,
    height,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    geometry,
    runtimeErrors: errors.length
  });
  console.log(`${name}: ${width}x${height}, correct state, settled images, no clipping.`);
}

try {
  if (process.argv.includes('--gallery')) {
    const directory = 'ux-review/evidence/all-experiences';
    const inventory = JSON.parse(readFileSync(resolve(root, 'ux-review/evidence/all-experiences-matrix.json'), 'utf8'));
    const inlineLayouts = new Set();
    for (const [index, capability] of zavaCapabilityCatalog.entries()) {
      const name = inventory.screenshots[index].path.split('/').at(-1);
      assert.ok(name.startsWith(`${capability.id.toLowerCase()}-`), 'Gallery filename/catalog mismatch');
      const session = await open(`intent=${capability.intentKey}&surface=copilotInline`, { width: 900, height: 1000 });
      try {
        await capture(session, name, undefined, directory);
        inlineLayouts.add(captures.at(-1).layout);
      } finally { await session.context.close(); }
    }
    assert.equal(inlineLayouts.size, 35, 'Inline layouts must remain intent-specific');
    for (const [name, query, layout] of [
      ['workspace-combined-company.png', 'intent=workspace&mode=combined&primaryView=company', 'workspace-combined-company'],
      ['workspace-combined-personal.png', 'intent=workspace&mode=combined&primaryView=personal', 'workspace-combined-personal'],
      ['workspace-company.png', 'intent=workspace&mode=company', 'workspace-company-company'],
      ['workspace-personal.png', 'intent=workspace&mode=personal', 'workspace-personal-personal']
    ]) {
      const session = await open(query, { width: 1440, height: 1000 });
      try { await capture(session, name, layout, directory); } finally { await session.context.close(); }
    }
    assert.equal(captures.length, 39);
    writeFileSync(resolve(root, 'ux-review/evidence/gallery-capture-matrix.json'),
      `${JSON.stringify({ capturedAt: new Date().toISOString(), captureMode: 'rendered-element', captures }, null, 2)}\n`);
  } else {
    const scenarios = [
      ['preview.png', 'intent=capabilities&surface=webPart', 'capability-explorer'],
      ['screenshot-company-workspace.png', 'intent=workspace&mode=combined&primaryView=company', 'workspace-combined-company'],
      ['screenshot-personal.png', 'intent=workspace&mode=combined&primaryView=personal', 'workspace-combined-personal'],
      ['screenshot-company-news.png', 'intent=companyNews&surface=webPart&primaryView=editorial', 'news-editorial'],
      ['screenshot-recognition-compose.png', 'intent=recognition&surface=copilotInline&primaryView=compose', 'recognition-compose-compose'],
      ['screenshot-sales-performance.png', 'intent=salesPerformance&surface=copilotInline', 'company-sales-performance'],
      ['screenshot-office-map.png', 'intent=officeDetails&surface=copilotInline', 'company-office-map']
    ];
    for (const [name, query, layout] of scenarios) {
      const session = await open(query);
      try { await capture(session, name, layout); } finally { await session.context.close(); }
    }

    const vacation = await open('intent=vacationApprovals&surface=copilotInline');
    try {
      const { page } = vacation;
      await page.getByRole('button', { name: 'Reset demo data', exact: true }).click();
      assert.equal(await page.locator('[aria-label="Vacation requests"] > button').count(), 4);
      await capture(vacation, 'screenshot-vacation-approvals.png', 'vacation-approvals-queue-list');
      await page.getByRole('button', { name: /Johanna Lorenz/ }).click();
      await capture(vacation, 'screenshot-vacation-detail.png', 'vacation-approvals-queue-detail');
      await page.getByRole('button', { name: 'Review decision', exact: true }).click();
      await capture(vacation, 'screenshot-vacation-decision.png', 'vacation-approvals-queue-decision');
      await page.getByRole('button', { name: 'Approve vacation request', exact: true }).click();
      await capture(vacation, 'screenshot-vacation-receipt.png', 'vacation-approvals-queue-receipt');
      await page.getByRole('button', { name: 'Back to updated list', exact: true }).click();
      assert.equal(await page.locator('[aria-label="Vacation requests"] > button').count(), 3);
      await capture(vacation, 'screenshot-vacation-updated-list.png', 'vacation-approvals-queue-list');
    } finally { await vacation.context.close(); }

    writeFileSync(resolve(root, 'ux-review/evidence/publication-capture-matrix.json'),
      `${JSON.stringify({ capturedAt: new Date().toISOString(), captureMode: 'rendered-element', captures }, null, 2)}\n`);
  }
} finally {
  await browser.close();
}
