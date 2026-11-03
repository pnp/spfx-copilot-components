import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { visualSourceSignature } from './visual-source-signature.mjs';

const root = path.resolve(import.meta.dirname, '..');
const site = path.join(root, 'temp', 'ux-review');
const evidence = path.join(root, 'ux-review', 'evidence');
const screenshots = path.join(evidence, 'ignite');
fs.mkdirSync(screenshots, { recursive: true });
const catalog = fs.readFileSync(path.join(root, 'src', 'shared', 'catalog.ts'), 'utf8');
const routes = new Map([...catalog.matchAll(/d\('([^']+)','[^']+','[^']+','([^']+)'/g)].map(match => [match[1], match[2]]));
const destinations = [...fs.readFileSync(path.join(root, 'src', 'shared', 'fullscreen.ts'), 'utf8').matchAll(/f\('([^']+)','([^']+)','(task|workspace)'/g)].map(match => ({ intent: match[1], title: match[2], view: match[3] }));
assert.equal(destinations.length, 22);
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
const pages = [];
const errors = [];
const requests = [];
const captures = [];
const routing = [];
const sizing = [];
const completeBytes = snapshot => Buffer.byteLength(JSON.stringify({ content: [{ type: 'text', text: snapshot.summary }], structuredContent: snapshot }), 'utf8');
async function open(intent, mode = 'inline', width = 760, theme = 'light', extra = {}) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce' });
  pages.push(page);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => requests.push(request.url()));
  await page.goto(`${base}/?${new URLSearchParams({ intent, mode, theme, ...extra })}`);
  await page.getByRole('button', { name: /^Continue with Copilot:/ }).waitFor();
  await page.waitForFunction(() => window.procurementHarness.contexts.length > 0);
  return page;
}
const latest = page => page.evaluate(() => window.procurementHarness.contexts.at(-1));
const turns = page => page.evaluate(() => window.procurementHarness.followUps);
const waitForContext = (page, field, value) => page.waitForFunction(({ keys, expected }) => {
  let current = window.procurementHarness.contexts.at(-1);
  for (const key of keys) current = current?.[key];
  return JSON.stringify(current) === JSON.stringify(expected);
}, { keys: field.split('.'), expected: value });
async function capture(page, name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const metrics = await page.evaluate(() => {
    const root = document.querySelector('[data-procurement-content]');
    const bounds = root.getBoundingClientRect();
    const visible = element => element.getClientRects().length > 0;
    const controls = [...root.querySelectorAll('button,input,textarea,select')].filter(visible);
    return {
      layout: root.dataset.layout, route: root.dataset.fullscreenRoute || null,
      width: Math.ceil(bounds.width), height: Math.ceil(bounds.height),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clippedControls: controls.filter(control => { const rect = control.getBoundingClientRect(); return rect.left < bounds.left - 1 || rect.right > bounds.right + 1; }).length,
      unlabeledControls: controls.filter(control => !control.textContent?.trim() && !control.getAttribute('aria-label') && !control.labels?.length).length,
      brokenImages: [...root.querySelectorAll('img')].filter(image => !image.naturalWidth).length,
      chartsLabeled: [...root.querySelectorAll('svg[role="img"],svg[role="group"]')].every(svg => svg.querySelector('title') && svg.querySelector('desc')),
      visibleCharts: [...root.querySelectorAll('[data-chart]')].filter(visible).map(chart => chart.dataset.chart),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  });
  assert(!metrics.overflow && !metrics.clippedControls && !metrics.unlabeledControls && !metrics.brokenImages && metrics.chartsLabeled && metrics.reducedMotion, `${name}: ${JSON.stringify(metrics)}`);
  assert.equal(new Set(metrics.visibleCharts).size, metrics.visibleCharts.length, `${name}: duplicate visible chart`);
  const snapshot = await latest(page);
  assert(completeBytes(snapshot) <= 10000, `${name}: visible snapshot exceeds the complete UTF-8 envelope budget`);
  const file = path.join(screenshots, `${name}.png`);
  const bytes = await page.locator('[data-procurement-content]').screenshot({ path: file, animations: 'disabled' });
  captures.push({ name, file: path.relative(root, file).replaceAll('\\', '/'), sha256: crypto.createHash('sha256').update(bytes).digest('hex'), viewport: page.viewportSize(), contextBytes: completeBytes(snapshot), ...metrics });
}
try {
  for (const destination of destinations) {
    const page = await open(destination.intent);
    assert.equal((await turns(page)).length, 0, `${destination.intent}: automatic conversation turn`);
    const initial = await latest(page);
    assert.equal(initial.intent, destination.intent);
    assert(initial.visuals.length > 0 && initial.availableActions.length >= 3);
    const numeric = page.locator('input[type="number"]:visible').first();
    let edited;
    if (await numeric.count()) {
      const current = Number(await numeric.inputValue());
      const maximum = Number(await numeric.getAttribute('max')) || 10000000;
      edited = String(Math.min(maximum, current + 1));
      await numeric.fill(edited);
    } else if (destination.intent === 'ExploreSupplier360') {
      await page.getByLabel('Supplier relationship', { exact: true }).selectOption('ZPC-SUP-002');
    } else if (destination.intent === 'ExploreSpendPerformance') {
      await page.getByLabel('Value category', { exact: true }).selectOption('IT hardware');
      await page.getByLabel('Value period', { exact: true }).selectOption('Previous period');
    }
    const inlineHeight = await page.locator('[data-procurement-content]').evaluate(element => Math.ceil(element.getBoundingClientRect().height));
    await page.getByRole('button', { name: `Open ${destination.title.toLowerCase()}`, exact: true }).click();
    await page.waitForFunction(route => document.querySelector('[data-procurement-content]')?.getAttribute('data-fullscreen-route') === route, routes.get(destination.intent));
    assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), destination.title);
    assert(!/came from|origin component|launched from|focused copilot task/i.test(await page.locator('main').innerText()));
    if (edited) assert.equal(await numeric.inputValue(), edited, `${destination.intent}: expansion lost the edited value`);
    if (destination.intent === 'ExploreSupplier360') assert.equal((await latest(page)).selectedId, 'ZPC-SUP-002');
    if (destination.intent === 'ExploreSpendPerformance') {
      const context = await latest(page);
      assert.equal(context.filters.valueCategory, 'IT hardware');
      assert.equal(context.filters.valuePeriod, 'Previous period');
      assert.equal(context.flowTotals.verified, 79200);
    }
    assert.equal((await turns(page)).length, 0, `${destination.intent}: expansion sent a conversation turn`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await capture(page, `route-${destination.intent}`);
    routing.push({ intent: destination.intent, destination: destination.title, route: routes.get(destination.intent), view: destination.view, editedValuePreserved: edited || null, inlineHeightAt760: inlineHeight });
    await page.close();
  }
  for (const intent of ['ExploreSpendPerformance', 'TrackSupplierRisk', 'CompareSupplierBids', 'ReviewSupplierAward', 'DetectSpendLeakage', 'ExploreSupplierPortfolioBalance']) {
    for (const [width, theme] of [[340, 'light'], [760, 'dark']]) {
      const page = await open(intent, 'inline', width, theme);
      await page.keyboard.press('Tab');
      await capture(page, `${intent}-${width}-${theme}`);
      await page.close();
    }
  }
  const flow = await open('ExploreSpendPerformance');
  const ribbon = flow.getByRole('button', { name: /Off-contract device spend to Contracted \/ unverified:/ }).first();
  await ribbon.focus();
  await flow.keyboard.press('Enter');
  await waitForContext(flow, 'selectedId', 'ZPC-LEAK-01:contracted');
  assert.equal((await latest(flow)).selectedEvidence.value, 17000);
  assert.equal((await latest(flow)).scope.opportunityId, 'ZPC-LEAK-01');
  assert.equal((await turns(flow)).length, 0);
  await flow.getByRole('button', { name: 'More discussions', exact: true }).click();
  await flow.getByRole('menuitem', { name: 'Explain the verification bottleneck', exact: true }).click();
  let turn = (await turns(flow)).at(-1);
  assert.equal(turn.snapshot.discussion.responseMode, 'text');
  assert.equal(turn.snapshot.discussion.handoff, undefined);
  assert.equal(turn.snapshot.selectedId, 'ZPC-LEAK-01:contracted');
  await capture(flow, 'sankey-evidence-discussion');
  await flow.getByRole('button', { name: 'More discussions', exact: true }).click();
  await flow.getByRole('menuitem', { name: 'Ask your own question', exact: true }).click();
  await flow.getByLabel('Question about this view').fill('Which evidence is needed to verify the selected amount?');
  assert.equal((await turns(flow)).length, 1);
  await flow.getByRole('button', { name: 'Ask Copilot', exact: true }).click();
  turn = (await turns(flow)).at(-1);
  assert.match(turn.message, /Which evidence is needed/);
  assert.equal(turn.snapshot.selectedEvidence.value, 17000);
  await capture(flow, 'custom-visible-evidence-question');

  const bid = await open('CompareSupplierBids');
  await bid.getByLabel('Risk weight (%)').fill('35');
  await bid.evaluate(() => { window.procurementHarness.acknowledgement = 'reject'; });
  const continueBid = bid.getByRole('button', { name: 'Continue with Copilot: Review supplier award', exact: true });
  await continueBid.click();
  await bid.getByRole('alert').filter({ hasText: 'did not accept' }).waitFor();
  assert.equal((await turns(bid)).length, 0);
  await capture(bid, 'copilot-rejected');
  await bid.evaluate(() => { window.procurementHarness.acknowledgement = 'throw'; });
  await continueBid.click();
  await bid.getByRole('alert').filter({ hasText: 'Harness bridge unavailable' }).waitFor();
  await capture(bid, 'copilot-transport-error');
  await bid.evaluate(() => { window.procurementHarness.acknowledgement = 'accept'; });
  await continueBid.click();
  turn = (await turns(bid)).at(-1);
  assert.equal(turn.snapshot.weights.risk, 35);
  assert.deepEqual(turn.snapshot.discussion.handoff, { tool: 'ReviewSupplierAwardTool', properties: { eventId: 'ZPC-RFP-31' } });
  await capture(bid, 'copilot-scoped-handoff');

  const global = await open('ExploreSpendPerformance', 'fullscreen', 1440);
  const map = global.locator('[data-chart="global-investment-map"]');
  const before = await map.innerHTML();
  await global.getByRole('button', { name: 'Committed footprint', exact: true }).click();
  await waitForContext(global, 'filters.mapMetric', 'committed');
  assert.notEqual(await map.innerHTML(), before);
  assert.equal((await latest(global)).mapValues.find(record => record.id === 'ZPC-INV-01').value, 0);
  await global.getByRole('button', { name: 'APAC', exact: true }).click();
  await waitForContext(global, 'selectedId', 'APAC');
  assert.deepEqual((await latest(global)).visibleIds, ['ZPC-INV-03', 'ZPC-INV-07']);
  await global.getByRole('button', { name: 'Continue with Copilot: Summary & next steps', exact: true }).click();
  turn = (await turns(global)).at(-1);
  assert.equal(turn.snapshot.discussion.responseMode, 'text');
  assert.equal(turn.snapshot.discussion.handoff, undefined);
  assert.equal(turn.snapshot.selectedId, 'APAC');
  assert.equal(turn.snapshot.focusedTask, undefined);
  await capture(global, 'regional-text-summary');

  const intake = await open('CreatePurchaseIntent');
  const height = () => intake.locator('[data-procurement-content]').evaluate(element => Math.ceil(element.getBoundingClientRect().height));
  const draftHeight = await height();
  await intake.getByRole('button', { name: 'Review create purchase intent', exact: true }).click();
  const reviewHeight = await height();
  await intake.getByRole('button', { name: 'Confirm session-only create purchase intent', exact: true }).click();
  await waitForContext(intake, 'stage', 'receipt');
  const receiptHeight = await height();
  turn = await latest(intake);
  assert.equal(turn.stage, 'receipt');
  assert.match(turn.scope.requestId, /^ZPC-REQ-SESSION-/);
  assert.equal((await turns(intake)).length, 0, 'Confirmation must not send a conversation turn.');
  await capture(intake, 'receipt-specific-next-review');
  await intake.getByRole('button', { name: 'Reset draft', exact: true }).click();
  const restoredHeight = await height();
  assert(receiptHeight < reviewHeight && restoredHeight > receiptHeight, 'Expected real root shrink and grow across receipt/reset.');
  sizing.push({ intent: 'CreatePurchaseIntent', draftHeight, reviewHeight, receiptHeight, restoredHeight, sdkAcknowledgement: 'Covered separately by typed BaseCopilotComponent tests; authenticated host remains external.' });

  const invalidPortfolio = await open('ExploreSupplierPortfolioBalance');
  await invalidPortfolio.getByLabel('Maximum primary supplier share (%)').fill('99');
  await waitForContext(invalidPortfolio, 'stage', 'input-error');
  assert.equal((await latest(invalidPortfolio)).scenarioArithmetic, undefined);
  assert.equal(await invalidPortfolio.locator('[data-chart="portfolio-allocation"]').count(), 0);
  await capture(invalidPortfolio, 'invalid-portfolio-no-calculation');

  const invalidRegion = await open('ExploreSpendPerformance', 'fullscreen', 1440, 'light', { region: 'Mars' });
  let invalid = await latest(invalidRegion);
  assert.deepEqual(invalid.mapValues, []);
  assert.equal(invalid.flowTotals, undefined);
  assert(!invalid.summary.includes('EUR 0'));
  await capture(invalidRegion, 'unmatched-region-no-fabricated-value');

  const invalidPeriod = await open('ExploreSpendPerformance', 'fullscreen', 1440, 'light', { period: 'Next quarter' });
  assert.equal(await invalidPeriod.getByLabel('Portfolio value period').inputValue(), 'Next quarter');
  invalid = await latest(invalidPeriod);
  assert.equal(invalid.flowTotals, undefined);
  assert.match(invalid.summary, /no value amounts evaluated/);
  await capture(invalidPeriod, 'unsupported-value-period');
  await invalidPeriod.getByLabel('Portfolio value period').selectOption('Current period');
  await waitForContext(invalidPeriod, 'flowTotals.verified', 186000);

  const noEvidence = await open('ExploreSpendPerformance', 'inline', 760, 'light', { category: 'Marketing' });
  invalid = await latest(noEvidence);
  assert.equal(invalid.resultCount, 0);
  assert.equal(invalid.flowTotals, undefined);
  assert.equal(invalid.stage, 'no-match');
  assert(!invalid.summary.includes('EUR 0'));
  await capture(noEvidence, 'missing-value-evidence');

  assert.equal(routing.length, 22);
  assert.equal(errors.length, 0, `Browser runtime errors: ${errors.join('; ')}`);
  assert(requests.every(url => url.startsWith(base) || url.startsWith('data:') || url.startsWith('blob:')), 'Unexpected external runtime request.');
  const output = {
    schemaVersion: 1, generatedAt: new Date().toISOString(), sourceSha256: visualSourceSignature(),
    routingCount: routing.length, captureCount: captures.length, errors, externalRuntimeRequests: 0,
    continuationChecks: ['no automatic turns', 'click-time scoped handoff', 'text-only full-screen summary', 'keyboard Sankey selection', 'custom visible-evidence question', 'rejection and transport retry', 'receipt-specific request handoff', 'invalid scopes never publish default/zero financial evidence'],
    routing, sizing, captures,
    externalGate: 'Actual model routing, host bridge acknowledgement/sizing, CSP, native zoom, forced colors and screen-reader behavior require the authenticated Ignite tenant.'
  };
  fs.writeFileSync(path.join(evidence, 'ignite-readiness.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Ignite readiness passed: 22 expansion destinations, ${captures.length} captures, scoped/text-only Copilot continuation, retries, keyboard visuals, preserved edits and actual root shrink/grow; no external runtime requests.`);
} finally {
  await Promise.all(pages.filter(page => !page.isClosed()).map(page => page.close()));
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
