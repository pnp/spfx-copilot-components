import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const site = path.join(root, 'temp', 'ux-review');
const evidence = path.join(root, 'ux-review', 'evidence');
const screenshots = path.join(evidence, 'zavacore');
fs.mkdirSync(screenshots, { recursive: true });
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
const errors = [];
const requests = [];
const pages = [];
async function open(intent, width = 1440) {
  const page = await browser.newPage({ viewport: { width, height: 1050 }, reducedMotion: 'reduce' });
  pages.push(page);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => requests.push(request.url()));
  await page.clock.setFixedTime(new Date('2026-10-26T12:00:00Z'));
  await page.goto(`${base}/?${new URLSearchParams({ intent, mode: 'fullscreen', theme: 'light' })}`);
  await page.locator('[data-experience]').first().waitFor();
  return page;
}
async function capture(page, name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const metrics = await page.evaluate(() => {
    const root = document.querySelector('[data-layout]');
    const bounds = root.getBoundingClientRect();
    const controls = [...root.querySelectorAll('button,input,select,textarea,img')].filter(element => element.getClientRects().length);
    return {
      layout: root.getAttribute('data-layout'),
      dashboard: root.querySelector('[data-dashboard-layout]')?.getAttribute('data-dashboard-layout'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clippedControls: controls.filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.left < bounds.left - 1 || rect.right > bounds.right + 1;
      }).length,
      brokenImages: [...document.images].filter(image => !image.naturalWidth).length,
      labeled: [...root.querySelectorAll('input,select,textarea')].every(input => input.labels?.length || input.getAttribute('aria-label')),
      chartsLabeled: [...root.querySelectorAll('svg[role="img"]')].every(svg => svg.querySelector('title') && svg.querySelector('desc')),
      scale: window.visualViewport.scale,
      chartModules: [...root.querySelectorAll('[data-chart]')].map(chart => chart.getAttribute('data-chart')),
      focus: document.activeElement !== document.body
    };
  });
  assert(!metrics.overflow && !metrics.clippedControls && !metrics.brokenImages && metrics.labeled && metrics.chartsLabeled, `${name}: ${JSON.stringify(metrics)}`);
  assert.equal(new Set(metrics.chartModules).size, metrics.chartModules.length, `${name}: duplicate chart module`);
  const target = path.join(screenshots, `${name}.png`);
  const bytes = await page.locator('[data-layout]').first().screenshot({ path: target, animations: 'disabled' });
  captures.push({ name, file: path.relative(root, target).replaceAll('\\', '/'), sha256: crypto.createHash('sha256').update(bytes).digest('hex'), viewport: page.viewportSize(), ...metrics });
}
const workspaces = [
  ['requests', 'CreatePurchaseIntent'], ['sourcing', 'CompareSupplierBids'],
  ['supplier', 'TrackSupplierRisk'], ['spend', 'ExploreSpendPerformance']
];
try {
  const layouts = new Set();
  for (const [name, intent] of workspaces) {
    for (const width of [340, 760, 1920]) {
      const page = await open(intent, width);
      await page.keyboard.press('Tab');
      await capture(page, `${name}-${width}`);
      layouts.add(await page.locator('[data-dashboard-layout]').getAttribute('data-dashboard-layout'));
      await page.close();
    }
    const page = await open(intent, 1280);
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
    assert.equal(await page.evaluate(() => window.visualViewport.scale), 2, 'Expected actual Chromium 200% page-scale emulation.');
    await page.keyboard.press('Tab');
    await capture(page, `${name}-200-percent`);
    await page.close();
  }
  assert.equal(layouts.size, 4, 'Each operational workspace must own a distinct dashboard composition.');
  const page = await open('CreatePurchaseIntent');
  await page.getByLabel('Quantity', { exact: true }).fill('0');
  assert(await page.getByRole('button', { name: 'Review create purchase intent', exact: true }).isDisabled());
  assert.match(await page.getByRole('alert').textContent(), /whole number/);
  await page.getByLabel('Quantity', { exact: true }).fill('650');
  await page.getByLabel('Business outcome', { exact: true }).fill('Equip the Helsinki and Rotterdam field teams');
  await page.getByLabel('Delivery locations', { exact: true }).fill('Helsinki, Rotterdam');
  await page.getByLabel('Purchase constraints', { exact: true }).fill('EU support and verified ruggedization');
  await page.getByRole('button', { name: 'Review create purchase intent', exact: true }).click();
  const workflow = page.locator('[data-workflow-stage]');
  assert.match(await workflow.textContent(), /650/);
  await page.getByRole('button', { name: 'Edit draft', exact: true }).click();
  assert.equal(await page.getByLabel('Quantity', { exact: true }).inputValue(), '650');
  await page.getByRole('button', { name: 'Review create purchase intent', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm session-only create purchase intent', exact: true }).click();
  assert.equal(await workflow.getAttribute('data-workflow-stage'), 'receipt');
  await capture(page, 'submitted-business-case');
  await page.reload();
  await page.getByRole('button', { name: 'Review ZPC-REQ-SESSION-1', exact: true }).click();
  await page.getByLabel('Decision rationale / conditions (minimum 12 characters)').fill('EU support, quantity and budget evidence verified');
  await page.getByRole('button', { name: 'Review approve request', exact: true }).click();
  assert.match(await workflow.textContent(), /Helsinki, Rotterdam/);
  assert.match(await workflow.textContent(), /EU support and verified ruggedization/);
  await capture(page, 'budget-human-review');
  await page.getByRole('button', { name: 'Confirm session-only approve request', exact: true }).click();
  await capture(page, 'budget-session-receipt');
  await page.getByLabel('Request status', { exact: true }).selectOption('Approved');
  assert.match(await page.getByRole('region', { name: 'My Requests dashboard', exact: true }).textContent(), /ZPC-REQ-SESSION-1/);
  await capture(page, 'approved-request-inbox');
  await page.getByRole('button', { name: 'Sourcing Workbench', exact: true }).click();
  await page.getByRole('button', { name: 'Review split award', exact: true }).click();
  await page.getByLabel('Primary award share (%)').fill('72');
  await page.getByLabel('Decision rationale / conditions (minimum 12 characters)').fill('Alternate capacity, continuity evidence and authority reviewed');
  assert(await page.getByRole('button', { name: 'Review approve split award', exact: true }).isDisabled());
  await page.getByLabel('Decision', { exact: true }).selectOption('Return award for evidence');
  assert(await page.getByRole('button', { name: 'Review return award for evidence', exact: true }).isEnabled());
  await page.getByLabel('Decision', { exact: true }).selectOption('Approve split award');
  await page.getByLabel('Primary award share (%)').fill('60');
  await page.getByRole('button', { name: 'Review approve split award', exact: true }).click();
  assert.match(await workflow.textContent(), /€1,059,600/);
  await capture(page, 'award-human-review');
  await page.getByRole('button', { name: 'Confirm session-only approve split award', exact: true }).click();
  await page.getByRole('button', { name: 'Spend Command', exact: true }).click();
  const spend = page.locator('[data-workspace="spend-command"]');
  assert.match(await spend.textContent(), /€6,295,600/);
  assert.match(await spend.textContent(), /Award approved \/ not delivered/);
  await capture(page, 'award-to-investment');
  const originalPath = await page.locator('[data-chart="commitment-trend"] path').last().getAttribute('d');
  await page.getByRole('button', { name: 'APAC', exact: true }).click();
  assert.match(await spend.textContent(), /€1,520,000/);
  assert.match(await spend.textContent(), /No verified savings evidence/);
  assert.notEqual(await page.locator('[data-chart="commitment-trend"] path').last().getAttribute('d'), originalPath);
  await capture(page, 'regional-investment-drilldown');
  await page.getByRole('button', { name: /Show EMEA: Helsinki/ }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.getByRole('button', { name: 'EMEA', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Reset demo session', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Review ZPC-REQ-SESSION-1', exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('zavacore-procurement-session-v1')), null);
  await capture(page, 'reset-baseline');
  assert.equal(captures.length, 24);
  assert.equal(errors.length, 0, `Runtime errors: ${errors.join('; ')}`);
  assert(requests.every(url => url.startsWith(base) || url.startsWith('data:') || url.startsWith('blob:')), 'Unexpected external runtime request.');
  const output = { schemaVersion: 1, generatedAt: new Date().toISOString(), captureCount: captures.length, workspaceLayouts: [...layouts], errors, externalRuntimeRequests: 0,
    journey: ['invalid intake blocked', 'draft edits preserved', 'reviewed submission', 'session reload restored', 'matching budget approval', 'processed queue', 'award authority limit', 'exact split commitment', 'regional geometry and totals', 'keyboard map drill-down', 'reset'],
    zoomMethod: 'Chromium CDP Emulation.setPageScaleFactor=2; tenant/native browser zoom remains a separate manual host check', captures };
  fs.writeFileSync(path.join(evidence, 'zavacore-modernization.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log(`ZavaCore keynote validation passed: ${captures.length} captures, 4 unique workspaces, guided intake through approvals and global investment, exact 200% page scale, no external requests or runtime/overflow/label/image failures.`);
} finally {
  await Promise.all(pages.filter(page => !page.isClosed()).map(page => page.close()));
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
