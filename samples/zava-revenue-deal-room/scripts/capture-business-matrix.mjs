import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { visualSourceSignature } from './visual-source-signature.mjs';

const root = path.resolve(import.meta.dirname, '..');
const harness = path.join(root, 'temp', 'visual-harness');
const output = path.join(root, 'assets', 'business-matrix');
const evidencePath = path.join(root, 'assets', 'business-matrix-evidence.json');
const intents = [...fs.readFileSync(path.join(root, 'src', 'shared', 'catalog.ts'), 'utf8').matchAll(/define\('([^']+)',[^\n]+?, '(information|review|submit|education)',/g)].map(match => ({ key: match[1], operation: match[2] }));
assert.equal(intents.length, 27);
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const inlineBudget = width => width <= 480 ? 800 : 650;
const flowsOnly = process.argv.includes('--flows-only');
const businessChartsOnly = process.argv.includes('--business-charts-only');
const overviewOnly = process.argv.includes('--overview-only');
const countryMapsOnly = process.argv.includes('--country-maps-only');
assert([flowsOnly, businessChartsOnly, overviewOnly, countryMapsOnly].filter(Boolean).length <= 1, 'Choose only one focused visual selector');
if (process.argv.includes('--check')) {
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  assert.equal(evidence.sourceSha256, visualSourceSignature(root), 'Business matrix is stale for the current runtime source');
  assert.equal(evidence.failureCount, 0);
  assert.equal(evidence.inlineMatrixCount, intents.length * 3);
  for (const intent of intents) for (const variant of ['standard', 'narrow', 'dark']) assert(evidence.captures.some(item => item.intent === intent.key && item.variant === variant), `${intent.key}/${variant} missing`);
  for (const capture of evidence.captures) {
    const bytes = fs.readFileSync(path.join(output, capture.name));
    assert.equal(bytes.length, capture.bytes);
    assert.equal(digest(bytes), capture.sha256);
    if (capture.inlineHeight !== null) {
      assert.equal(capture.inlineBudget, inlineBudget(capture.viewportWidth));
      assert(capture.inlineHeight > 0 && capture.inlineHeight <= capture.inlineBudget, `${capture.intent}/${capture.variant}: inline height exceeds budget`);
      assert.deepEqual(capture.clippedRegions, [], `${capture.intent}/${capture.variant}: clipped or scrolling content`);
    }
  }
  for (const capture of evidence.captures.filter(item => ['standard', 'narrow', 'dark'].includes(item.variant))) assert(capture.inlineHeight > 0, `${capture.intent}/${capture.variant}: missing measured inline height`);
  assert(Array.isArray(evidence.inlineProbes) && evidence.inlineProbes.length > 75, 'Missing compact-stage measurements');
  for (const probe of evidence.inlineProbes) {
    assert.equal(probe.budget, inlineBudget(probe.viewportWidth));
    assert(probe.height > 0 && probe.height <= probe.budget, `${probe.intent}/${probe.variant}: inline stage exceeds height budget`);
    assert.deepEqual(probe.clippedRegions, []);
    assert.equal(probe.primaryActions, 1);
  }
  for (const intent of intents) for (const width of [760, 390]) assert(evidence.inlineProbes.some(probe => probe.intent === intent.key && probe.viewportWidth === width), `${intent.key}/${width}: missing stage measurements`);
  assert.equal(evidence.dashboardCount, 4);
  assert.equal(evidence.workflowReviewCount, 10);
  assert.equal(evidence.workflowReceiptCount, 10);
  console.log(JSON.stringify({ captures: evidence.totalCaptures, failures: evidence.failureCount, inlineIntents: intents.length, dashboards: 4, reviews: 10, receipts: 10, hashesCurrent: true }));
  process.exit(0);
}
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = path.resolve(harness, pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!file.startsWith(`${harness}${path.sep}`) || !fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript' : 'text/html', 'Cache-Control': 'no-store' });
  response.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const captures = [];
const inlineProbes = [];
const errors = [];
const base = `http://127.0.0.1:${server.address().port}/`;
async function pageFor(intent, variant = 'standard', parameters = {}) {
  const page = await browser.newPage({ viewport: { width: variant === 'narrow' ? 390 : variant === 'dashboard' ? 1440 : 760, height: 980 }, reducedMotion: 'reduce', colorScheme: variant === 'dark' ? 'dark' : 'light' });
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`); });
  await page.goto(`${base}?${new URLSearchParams({ intent, ...(variant === 'dark' ? { theme: 'dark' } : {}), ...(variant === 'dashboard' ? { mode: 'fullscreen' } : {}), ...parameters })}`, { waitUntil: 'networkidle' });
  await page.locator('[aria-label="Specialist business experience"]').waitFor();
  await page.waitForFunction(() => !!window.revenueHarness.context);
  return page;
}
async function inspectState(page, intent, variant) {
  const metrics = await page.evaluate(() => {
    const shell = document.querySelector('[data-inline-stage="true"]');
    const clippedRegions = shell ? [shell, ...shell.querySelectorAll('*')].filter(element => {
      if (!(element instanceof HTMLElement) || ['TEXTAREA', 'INPUT', 'SELECT'].includes(element.tagName)) return false;
      const style = getComputedStyle(element);
      return ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 2;
    }).map(element => element.getAttribute('aria-label') || element.tagName) : [];
    return {
      viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth,
      inlineHeight: shell ? Math.ceil(Math.max(shell.getBoundingClientRect().height, shell.scrollHeight)) : null,
      primaryActions: shell ? shell.querySelectorAll('[data-copilot-action="primary"]').length : 0,
      clippedRegions,
      brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).length,
      layouts: [...document.querySelectorAll('[data-layout]')].map(element => element.getAttribute('data-layout')),
      context: window.revenueHarness.context
    };
  });
  assert(metrics.content <= metrics.viewport, `${intent}/${variant}: overflow ${metrics.content} > ${metrics.viewport}`);
  const budget = inlineBudget(metrics.viewport);
  if (metrics.context.displayMode !== 'fullscreen') {
    assert(metrics.inlineHeight > 0, `${intent}/${variant}: missing inline shell`);
    assert(metrics.inlineHeight <= budget, `${intent}/${variant}: inline height ${metrics.inlineHeight}px > ${budget}px`);
    assert.deepEqual(metrics.clippedRegions, [], `${intent}/${variant}: clipped or scrolling content`);
    assert.equal(metrics.primaryActions, 1, `${intent}/${variant}: expected one primary story continuation`);
  }
  assert.equal(metrics.brokenImages, 0, `${intent}/${variant}: broken images`);
  assert.equal(errors.length, 0, `${intent}/${variant}: ${errors.join('; ')}`);
  if (metrics.inlineHeight !== null) inlineProbes.push({ intent, variant, viewportWidth: metrics.viewport, height: metrics.inlineHeight, budget, clippedRegions: metrics.clippedRegions, primaryActions: metrics.primaryActions, inlineStage: metrics.context.inlineStage });
  return metrics;
}
async function capture(page, intent, variant) {
  const metrics = await inspectState(page, intent, variant);
  const budget = inlineBudget(metrics.viewport);
  const name = `${intent}-${variant}.png`;
  await page.screenshot({ path: path.join(output, name), fullPage: true, animations: 'disabled' });
  const bytes = fs.readFileSync(path.join(output, name));
  captures.push({ intent, variant, name, bytes: bytes.length, sha256: digest(bytes), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), viewportWidth: metrics.viewport, inlineHeight: metrics.inlineHeight, inlineBudget: metrics.inlineHeight === null ? null : budget, clippedRegions: metrics.clippedRegions, primaryActions: metrics.primaryActions, layouts: metrics.layouts, workflowStage: metrics.context.workflowStage, inlineStage: metrics.context.inlineStage, selectedEntityId: metrics.context.selectedEntityId });
}
async function capturePages(page, intent, variant, nextLabel) {
  const next = page.getByRole('button', { name: nextLabel, exact: true });
  let index = 1;
  do {
    assert(index <= 100, `${intent}: pagination did not terminate`);
    if (index === 1) await capture(page, intent, `${variant}-page-${index}`);
    else await inspectState(page, intent, `${variant}-page-${index}`);
    if (!await next.isVisible() || await next.isDisabled()) break;
    await next.click();
    index++;
  } while (true);
}
async function editWorkflowText(page) {
  const edit = page.getByRole('button', { name: 'Edit business fields', exact: true });
  if (await edit.isVisible()) await edit.click();
  const field = page.locator('[aria-label="Specialist business experience"] input[type="text"]').first();
  for (let index = 0; index < 3 && !await field.isVisible(); index++) {
    const next = page.getByRole('button', { name: 'Next fields', exact: true });
    assert(await next.isVisible() && !await next.isDisabled(), 'Workflow has no editable text field');
    await next.click();
  }
  await field.fill('Matrix reviewed business value');
}
async function captureSankeyStages() {
  for (const key of ['ExplorePipelineFlow', 'ExploreApprovalFlow']) for (const variant of ['standard', 'narrow', 'dark']) {
    const page = await pageFor(key, variant);
    const nodes = await page.locator('[data-sankey-node]').evaluateAll(elements => elements.map(element => element.getAttribute('data-sankey-node')));
    const links = await page.locator('[data-sankey-link]').evaluateAll(elements => elements.map(element => element.getAttribute('data-sankey-link')));
    assert.equal(nodes.length, 10, `${key}: exact diagram nodes`);
    assert.equal(links.length, key === 'ExplorePipelineFlow' ? 21 : 18, `${key}: exact diagram ribbons`);
    const invalidPaths = await page.locator('[data-sankey-link] path').evaluateAll(elements => elements.filter(element => /NaN|Infinity/.test(element.getAttribute('d') || '')).length);
    assert.equal(invalidPaths, 0);
    await capture(page, key, `${variant}-sankey`);
    for (const id of nodes) {
      const mark = page.locator(`[data-sankey-node="${id}"]`);
      await mark.focus();
      await mark.press('Enter');
      await page.waitForFunction(value => window.revenueHarness.context.selection === value, id);
      assert.equal(await page.locator('[data-sankey-node]').count(), 0, 'Details replace, rather than stack below, the Sankey');
      await capturePages(page, key, `${variant}-node-${id}`, 'Next connections');
      await page.getByRole('button', { name: 'Back to value flow', exact: true }).click();
      await mark.click();
      await page.waitForFunction(value => window.revenueHarness.context.selection === value, id);
      await inspectState(page, key, `${variant}-pointer-node-${id}`);
      await page.getByRole('button', { name: 'Back to value flow', exact: true }).click();
    }
    for (const id of links) {
      const mark = page.locator(`[data-sankey-link="${id}"]`);
      const point = await mark.evaluate(element => {
        const path = element.querySelector('path');
        const transform = path?.getScreenCTM();
        if (!path || !transform) throw new Error('Sankey ribbon has no visible geometry');
        const length = path.getTotalLength();
        const stroke = Number(path.getAttribute('stroke-width'));
        if (!Number.isFinite(stroke) || stroke <= 0) throw new Error('Sankey ribbon has no positive painted width');
        const observations = [];
        for (const fraction of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
          const position = path.getPointAtLength(length * fraction);
          const before = path.getPointAtLength(Math.max(0, length * fraction - 1));
          const after = path.getPointAtLength(Math.min(length, length * fraction + 1));
          const magnitude = Math.hypot(after.x - before.x, after.y - before.y);
          for (const offset of [0, -0.25, 0.25, -0.4, 0.4]) {
            const local = new DOMPoint(position.x - (after.y - before.y) / magnitude * stroke * offset, position.y + (after.x - before.x) / magnitude * stroke * offset);
            if (!path.isPointInStroke(local)) continue;
            const screen = local.matrixTransform(transform);
            const point = { x: Math.round(screen.x), y: Math.round(screen.y) };
            const target = document.elementFromPoint(point.x, point.y);
            if (target && element.contains(target)) return point;
            if (offset === 0) observations.push({ fraction, x: screen.x, y: screen.y, target: target?.closest('[data-sankey-link],[data-sankey-node]')?.getAttribute('data-sankey-link') || target?.closest('[data-sankey-node]')?.getAttribute('data-sankey-node') || target?.tagName });
          }
        }
        throw new Error(`No exposed pointer surface on Sankey ribbon ${element.getAttribute('data-sankey-link')}: ${JSON.stringify(observations)}`);
      });
      await page.mouse.click(point.x, point.y);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const clicked = await page.evaluate(() => ({ selection: window.revenueHarness.context.selection, stage: window.revenueHarness.context.revenueFlow.stage }));
      assert.equal(clicked.selection, id, `${key}/${variant}: painted ribbon click at ${JSON.stringify(point)} produced ${JSON.stringify(clicked)}`);
      await inspectState(page, key, `${variant}-ribbon-${id}`);
      const value = await page.evaluate(() => window.revenueHarness.context.selectedRecord.value);
      assert(value > 0, `${id}: exact selected ribbon value`);
      await page.getByRole('button', { name: 'Back to value flow', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Model assumptions', exact: true }).click();
    await capture(page, key, `${variant}-assumptions`);
    await page.getByRole('button', { name: 'Back to value flow', exact: true }).click();
    if (key === 'ExplorePipelineFlow') {
      await page.getByLabel('Planning region', { exact: true }).selectOption('EMEA');
      await page.waitForFunction(() => window.revenueHarness.context.revenueFlow.total === 8200000);
      await capture(page, key, `${variant}-emea-flow`);
    }
    await page.getByLabel('Planning quarter', { exact: true }).selectOption('next');
    await capture(page, key, `${variant}-next-flow`);
    await page.close();
    const unknown = await pageFor(key, variant, { selectedId: 'missing-flow' });
    assert.equal(await unknown.locator('[data-sankey-node]').count(), 0);
    assert(await unknown.locator('[data-copilot-action="primary"]').isDisabled());
    await capture(unknown, key, `${variant}-unknown-flow`);
    await unknown.getByRole('button', { name: 'Clear flow selection and filters', exact: true }).click();
    await unknown.waitForFunction(() => window.revenueHarness.context.workflowStage === 'analysis');
    await capture(unknown, key, `${variant}-recovered-flow`);
    await unknown.close();
  }
}
async function captureDistinctBusinessCharts() {
  for (const key of ['QualifyOpportunity', 'ResearchCompetitivePosition']) for (const variant of ['standard', 'narrow', 'dark']) for (const opportunityId of ['ZDR-2042', 'ZDR-2043']) {
    const page = await pageFor(key, variant, { opportunityId });
    const chart = await page.evaluate(() => window.revenueHarness.context.inlineStage.chart);
    if (key === 'QualifyOpportunity') {
      assert.equal(chart.kind, 'qualification-evidence-gates');
      assert.equal(chart.verifiedCount, opportunityId === 'ZDR-2042' ? 1 : 0);
      assert.equal(chart.totalCount, 5);
      assert.equal(await page.locator('[data-qualification-gate]').count(), 5);
      assert.equal(await page.locator('[data-competitive-driver]').count(), 0);
    } else {
      assert.equal(chart.kind, 'competitive-decision-drivers');
      assert.deepEqual(chart.records.map(item => item.weight), opportunityId === 'ZDR-2042' ? [35, 30, 25, 10] : [35, 30, 20, 15]);
      assert.equal(await page.locator('[data-competitive-driver]').count(), 4);
      assert.equal(await page.locator('[data-qualification-gate]').count(), 0);
    }
    await capture(page, key, `${variant}-distinct-${opportunityId}`);
    if (key === 'ResearchCompetitivePosition') {
      const mark = page.locator('[data-competitive-driver]').first();
      const selectedId = await mark.getAttribute('data-competitive-driver');
      await mark.focus();
      await mark.press('Enter');
      await page.waitForFunction(id => window.revenueHarness.context.selection === id, selectedId);
      await capture(page, key, `${variant}-driver-detail-${opportunityId}`);
    }
    await page.close();
  }
}
async function captureCountryStages() {
  for (const key of ['DiscoverAccountOpportunity', 'ExplorePipelineQuality']) for (const variant of ['standard', 'narrow', 'dark']) {
    const page = await pageFor(key, variant, { mapMetric: key === 'ExplorePipelineQuality' ? 'spend' : 'opportunity' });
    await page.waitForFunction(() => !!window.revenueHarness.context.countryMap?.chart);
    await page.locator('[data-copilot-action="primary"]').click();
    await page.getByRole('status', { name: 'Sent to Copilot with the visible discussion context.', exact: true }).waitFor();
    await capture(page, key, `${variant}-country-context-sent`);
    const context = await page.evaluate(() => window.revenueHarness.context.countryMap);
    assert.equal(context.scopedTotals.recordedSpend, 3400000, 'Country expenses must reconcile to the separate recorded demo ledger');
    assert.equal(context.scopedTotals.opportunityValue, 82497260, 'Country opportunity values must reconcile to the current demo catalog');
    await capture(page, key, `${variant}-country-overview`);
    for (const metric of ['Opportunity', 'Recorded spend']) {
      await page.getByRole('button', { name: metric, exact: true }).click();
      for (const country of ['US', 'DE', 'JP', 'BR']) {
        await page.getByLabel('Country', { exact: true }).selectOption(country);
        await page.waitForFunction(id => window.revenueHarness.context.countryMap.selectedCountryId === id, country);
        await capturePages(page, key, `${variant}-${metric === 'Opportunity' ? 'opportunity' : 'spend'}-${country}`, 'Next');
      }
    }
    await page.getByRole('button', { name: 'Opportunity', exact: true }).click();
    await page.waitForFunction(() => window.revenueHarness.context.countryMap.visibleOpportunityIds.length > 0);
    const selectedIds = await page.evaluate(() => window.revenueHarness.context.countryMap.visibleOpportunityIds);
    assert(Array.isArray(selectedIds) && selectedIds.length, 'The selected country must expose its exact opportunity records');
    await page.getByRole('button', { name: `Inspect ${selectedIds[0]}`, exact: true }).click();
    await page.waitForFunction(id => window.revenueHarness.context.selection === id, selectedIds[0]);
    await capture(page, key, `${variant}-country-opportunity-detail`);
    await page.getByRole('button', { name: 'Back to overview', exact: true }).click();
    await page.getByLabel('Country', { exact: true }).selectOption('');
    await page.getByRole('button', { name: 'Recorded spend', exact: true }).click();
    await page.getByRole('button', { name: 'Change scope', exact: true }).click();
    await page.getByLabel('Quarter scope', { exact: true }).selectOption('next');
    await page.getByLabel('Region', { exact: true }).selectOption('all');
    await page.getByRole('button', { name: 'Show scoped view', exact: true }).click();
    if (key === 'ExplorePipelineQuality') await page.getByRole('button', { name: 'Country spend', exact: true }).click();
    await page.waitForFunction(() => window.revenueHarness.context.countryMap?.scopedTotals.recordedSpend === 0);
    await capture(page, key, `${variant}-no-future-recorded-spend`);
    await page.close();
    const unknown = await pageFor(key, variant, { countryId: 'ZZ', mapMetric: 'opportunity' });
    await unknown.waitForFunction(() => window.revenueHarness.context.workflowStage === 'no-match');
    assert(await unknown.locator('[data-copilot-action="primary"]').isDisabled());
    await capture(unknown, key, `${variant}-unmatched-country`);
    await unknown.close();
  }
}
try {
  if (countryMapsOnly || !businessChartsOnly && !overviewOnly && !flowsOnly) await captureCountryStages();
  if (!businessChartsOnly && !overviewOnly && !countryMapsOnly) await captureSankeyStages();
  if (!flowsOnly && !overviewOnly && !countryMapsOnly) await captureDistinctBusinessCharts();
  if (!flowsOnly && !businessChartsOnly && !countryMapsOnly) {
  for (const intent of intents) for (const variant of ['standard', 'narrow', 'dark']) {
    const page = await pageFor(intent.key, variant);
    await capture(page, intent.key, variant);
    await page.close();
  }
  if (!overviewOnly) {
  for (const key of ['DiscoverAccountOpportunity', 'MapBuyingCommittee', 'SimulateCommercialOffer', 'InspectForecastCommit']) {
    const page = await pageFor(key, 'dashboard', key === 'DiscoverAccountOpportunity' ? { accountId: 'CONTOSO' } : {});
    const layout = { DiscoverAccountOpportunity: 'my-deals-dashboard', MapBuyingCommittee: 'deal-room-dashboard', SimulateCommercialOffer: 'commercial-desk-dashboard', InspectForecastCommit: 'revenue-command-dashboard' }[key];
    assert(await page.locator(`[data-layout="${layout}"]`).isVisible(), `${key}: expected its actual reference dashboard`);
    await capture(page, key, 'dashboard');
    await page.close();
  }
  const recordIntents = ['BuildAccountBrief', 'MapBuyingCommittee', 'GetDealRisk', 'PrepareCustomerMeeting', 'ResearchCompetitivePosition', 'CoachDealStrategy', 'TrackMeetingFollowUp', 'ExploreAgentCapabilities'];
  for (const variant of ['standard', 'narrow']) {
    for (const key of recordIntents) {
      const page = await pageFor(key, variant);
      const chartButtons = page.locator('svg [role="button"][aria-label^="Inspect "]');
      const chartButtonCount = key === 'MapBuyingCommittee' ? await chartButtons.count() : Math.min(1, await chartButtons.count());
      for (let index = 0; index < chartButtonCount; index++) {
        const chartButton = chartButtons.nth(index);
        const selectedId = (await chartButton.getAttribute('aria-label')).slice(8);
        await chartButton.focus();
        await chartButton.press('Enter');
        await page.getByRole('button', { name: 'Back to overview', exact: true }).waitFor();
        assert.equal(await page.evaluate(() => window.revenueHarness.context.selectedEntityId), selectedId, `${key}: chart keyboard selection must preserve its source ID`);
        await page.getByRole('button', { name: 'Back to overview', exact: true }).click();
        await chartButton.click();
        await page.getByRole('button', { name: 'Back to overview', exact: true }).waitFor();
        assert.equal(await page.evaluate(() => window.revenueHarness.context.selectedEntityId), selectedId, `${key}: chart pointer selection must preserve its source ID`);
        if (key === 'MapBuyingCommittee') await capture(page, key, `${variant}-buyer-detail-${selectedId}`);
        await page.getByRole('button', { name: 'Back to overview', exact: true }).click();
      }
      const inspect = page.locator('button').filter({ hasText: /^Inspect / }).first();
      if (await inspect.isVisible()) {
        await inspect.click();
        await capture(page, key, `${variant}-source-detail`);
        await page.getByRole('button', { name: 'Back to overview', exact: true }).click();
      }
      const records = page.getByRole('button', { name: key === 'ExploreAgentCapabilities' ? 'Explore scenarios' : 'Evidence records', exact: true });
      if (await records.isVisible()) await records.click();
      await capturePages(page, key, `${variant}-overview`, 'Next records');
      const chart = page.getByRole('button', { name: 'Pipeline chart', exact: true });
      if (await chart.isVisible()) {
        await chart.click();
        await capture(page, key, `${variant}-chart`);
      }
      await page.close();
    }
    const attention = await pageFor('ExploreDealAttention', variant);
    await attention.getByRole('button', { name: 'Show ranked deals', exact: true }).click();
    await attention.getByRole('button', { name: /^Details for / }).first().click();
    for (const facet of ['Deal facts', 'Buyer coverage', 'Evidence']) {
      await attention.getByRole('button', { name: facet, exact: true }).click();
      await capturePages(attention, 'ExploreDealAttention', `${variant}-${facet.toLowerCase().replaceAll(' ', '-')}`, 'Next details');
    }
    await attention.getByRole('button', { name: 'Back to attention catalog', exact: true }).click();
    await capturePages(attention, 'ExploreDealAttention', `${variant}-catalog`, 'Next deals');
    await attention.close();
    const priorities = await pageFor('GetMyRevenuePriorities', variant);
    await priorities.getByRole('button', { name: 'Inspect priority', exact: true }).first().click();
    await capture(priorities, 'GetMyRevenuePriorities', `${variant}-priority-detail`);
    await priorities.getByRole('button', { name: 'Back to priorities', exact: true }).click();
    await capturePages(priorities, 'GetMyRevenuePriorities', `${variant}-actions`, 'Next priorities');
    for (const stage of ['Pipeline', 'Outlook', 'Close plan']) {
      await priorities.getByRole('button', { name: stage, exact: true }).click();
      await capture(priorities, 'GetMyRevenuePriorities', `${variant}-${stage.toLowerCase().replaceAll(' ', '-')}`);
    }
    await priorities.close();
    const scenario = await pageFor('SimulateCommercialOffer', variant);
    for (const stage of ['License terms', 'Delivery and ramp', 'Economics']) {
      await scenario.getByRole('button', { name: stage, exact: true }).click();
      await capture(scenario, 'SimulateCommercialOffer', `${variant}-${stage.toLowerCase().replaceAll(' ', '-')}`);
    }
    await scenario.close();
    for (const intent of intents.filter(item => ['review', 'submit'].includes(item.operation) && !['SubmitDealRequest', 'ReviewDealApproval'].includes(item.key))) {
      const page = await pageFor(intent.key, variant);
      await page.getByRole('button', { name: 'Edit business fields', exact: true }).click();
      await capturePages(page, intent.key, `${variant}-draft-fields`, 'Next fields');
      await editWorkflowText(page);
      await page.getByRole('button', { name: 'Review draft', exact: true }).click();
      const confirm = page.getByRole('button', { name: `Confirm session ${intent.operation === 'review' ? 'decision' : 'draft'}`, exact: true });
      assert(await confirm.isDisabled(), `${intent.key}: explicit consent is required`);
      await capturePages(page, intent.key, `${variant}-review-fields`, 'Next fields');
      await page.getByLabel('I reviewed these values and understand this is session-only').check();
      await confirm.click();
      await page.waitForFunction(() => window.revenueHarness.context.workflowStage === 'receipt');
      await capturePages(page, intent.key, `${variant}-inline-receipt`, 'Next fields');
      await page.close();
    }
    const workflow = await pageFor('SubmitDealRequest', variant, { accountId: 'CONTOSO', opportunityId: 'ZDR-2042' });
    const center = () => workflow.getByRole('region', { name: 'Deal submission and approval center', exact: true });
    await center().getByLabel('Deal name (5-120 characters)').fill('Compact Contoso growth program');
    await center().getByLabel('Business outcome (20-1,000 characters)').fill('Roll out validated capabilities with accountable sponsor and security evidence.');
    await capture(workflow, 'SubmitDealRequest', `${variant}-deal-story`);
    await center().getByRole('button', { name: 'Continue', exact: true }).click();
    for (const [label, value] of [['Licensed users', '1000'], ['Contract months', '24'], ['Discount percent', '8']]) await center().getByLabel(label).fill(value);
    await capture(workflow, 'SubmitDealRequest', `${variant}-license-terms`);
    await center().getByRole('button', { name: 'Delivery and investment', exact: true }).click();
    for (const [label, value] of [['Services (USD)', '150000'], ['Seller probability (0-1)', '0.65'], ['GTM investment requested (USD)', '250000']]) await center().getByLabel(label).fill(value);
    await capture(workflow, 'SubmitDealRequest', `${variant}-delivery-investment`);
    await center().getByRole('button', { name: 'Continue', exact: true }).click();
    await capture(workflow, 'SubmitDealRequest', `${variant}-evidence`);
    await center().getByLabel('Security review evidence is ready', { exact: true }).check();
    await center().getByLabel('Economic sponsor evidence is ready', { exact: true }).check();
    await center().getByRole('button', { name: 'Review deal request', exact: true }).click();
    const submit = center().getByRole('button', { name: 'Submit deal request', exact: true });
    assert(await submit.isDisabled(), 'Inline submission must require explicit confirmation');
    await capturePages(workflow, 'SubmitDealRequest', `${variant}-exact-review`, 'Next values');
    await center().getByLabel('I reviewed this request and confirm submission', { exact: true }).check();
    await submit.click();
    await workflow.waitForFunction(() => window.revenueHarness.context.inlineDealWorkflow.stage === 'receipt');
    await capture(workflow, 'SubmitDealRequest', `${variant}-submission-receipt`);
    await workflow.locator('[data-copilot-action="primary"]').click();
    await workflow.waitForFunction(() => window.revenueHarness.followUps.length === 1);
    const handoff = await workflow.evaluate(() => window.revenueHarness.followUps[0].context.discussion.handoff);
    assert.equal(handoff.intent, 'ReviewDealApproval');
    assert.match(handoff.properties.requestId, /^ZM-/);
    await workflow.goto(`${base}?${new URLSearchParams({ intent: handoff.intent, ...handoff.properties })}`, { waitUntil: 'networkidle' });
    await workflow.waitForFunction(() => !!window.revenueHarness.context);
    await capturePages(workflow, 'ReviewDealApproval', `${variant}-terms`, 'Next values');
    for (const facet of ['Evidence', 'Inbox', 'Requests']) {
      await center().getByRole('button', { name: facet, exact: true }).click();
      await capturePages(workflow, 'ReviewDealApproval', `${variant}-${facet.toLowerCase()}`, facet === 'Requests' ? 'Next requests' : 'Next values');
    }
    await center().getByRole('button', { name: 'Decision', exact: true }).click();
    await center().getByLabel('Reviewer role', { exact: true }).selectOption('Sales manager');
    await center().getByLabel('Decision rationale (15-1,000 characters)').fill('Sponsor, security evidence and standard commercial terms independently reviewed.');
    const approve = center().getByRole('button', { name: 'Approve review stage', exact: true });
    assert(await approve.isDisabled(), 'Inline approval must require explicit confirmation');
    await capture(workflow, 'ReviewDealApproval', `${variant}-decision`);
    await center().getByLabel('I reviewed the evidence and confirm this decision', { exact: true }).check();
    await approve.click();
    await capturePages(workflow, 'ReviewDealApproval', `${variant}-decision-trail`, 'Next decisions');
    await workflow.locator('[data-copilot-action="primary"]').click();
    await workflow.waitForFunction(() => window.revenueHarness.followUps.length === 1);
    const refresh = await workflow.evaluate(() => window.revenueHarness.followUps[0].context.discussion.handoff);
    assert.equal(refresh.intent, 'GetMyRevenuePriorities');
    await workflow.goto(`${base}?${new URLSearchParams({ intent: refresh.intent, ...refresh.properties })}`, { waitUntil: 'networkidle' });
    await workflow.waitForFunction(() => !!window.revenueHarness.context);
    await workflow.getByRole('button', { name: 'Outlook', exact: true }).click();
    await capture(workflow, 'GetMyRevenuePriorities', `${variant}-refreshed-status`);
    await workflow.close();
    const maximumInputs = await pageFor('SubmitDealRequest', variant);
    const maximumCenter = maximumInputs.getByRole('region', { name: 'Deal submission and approval center', exact: true });
    await maximumCenter.getByLabel('Deal name (5-120 characters)').fill('Contoso validated global expansion '.repeat(4).slice(0, 120));
    await maximumCenter.getByLabel('Business outcome (20-1,000 characters)').fill('Roll out validated capabilities with accountable sponsor and security evidence. '.repeat(13).slice(0, 1000));
    await maximumCenter.getByRole('button', { name: 'Continue', exact: true }).click();
    await maximumCenter.getByRole('button', { name: 'Delivery and investment', exact: true }).click();
    await maximumCenter.getByRole('button', { name: 'Continue', exact: true }).click();
    await maximumCenter.getByLabel('Security review evidence is ready', { exact: true }).check();
    await maximumCenter.getByLabel('Economic sponsor evidence is ready', { exact: true }).check();
    await maximumCenter.getByRole('button', { name: 'Review deal request', exact: true }).click();
    await capturePages(maximumInputs, 'SubmitDealRequest', `${variant}-maximum-input-review`, 'Next values');
    await maximumInputs.close();
  }
  for (const intent of intents.filter(item => ['review', 'submit'].includes(item.operation) && !['SubmitDealRequest', 'ReviewDealApproval'].includes(item.key))) {
    const page = await pageFor(intent.key);
    await editWorkflowText(page);
    await page.getByRole('button', { name: 'Review draft', exact: true }).click();
    const confirm = page.getByRole('button', { name: `Confirm session ${intent.operation === 'review' ? 'decision' : 'draft'}`, exact: true });
    assert(await confirm.isDisabled(), 'Confirmation must require explicit consent');
    await capture(page, intent.key, 'review');
    const next = page.getByRole('button', { name: 'Next fields', exact: true });
    if (await next.isVisible() && !await next.isDisabled()) {
      await next.click();
      await capturePages(page, intent.key, 'review-fields', 'Next fields');
    }
    await page.evaluate(() => window.revenueHarness.render({ mode: 'fullscreen', theme: 'dark' }));
    await page.waitForFunction(() => window.revenueHarness.context.displayMode === 'fullscreen');
    assert.equal(await page.locator('[aria-label="Specialist business experience"]').getByText('Matrix reviewed business value', { exact: true }).count(), 1, 'Draft must survive mode/theme changes');
    await page.getByLabel('I reviewed these values and understand this is session-only').check();
    await confirm.click();
    await page.waitForFunction(() => window.revenueHarness.context.workflowStage === 'receipt');
    assert.match(await page.locator('[aria-label="Specialist business experience"]').innerText(), /Session receipt ZDR-SESSION-/);
    await capture(page, intent.key, 'receipt');
    await page.getByRole('button', { name: 'Reset draft', exact: true }).click();
    await page.waitForFunction(() => window.revenueHarness.context.workflowStage === 'draft');
    await page.close();
  }
  const commercial = await pageFor('SimulateCommercialOffer');
  await commercial.getByLabel('Licensed users', { exact: true }).fill('1200');
  await commercial.getByLabel('Contract term (months)', { exact: true }).fill('24');
  await commercial.getByLabel('Discount percent', { exact: true }).fill('25');
  await commercial.getByRole('button', { name: 'Delivery and ramp', exact: true }).click();
  await commercial.getByLabel('Services (USD)', { exact: true }).fill('200000');
  await commercial.getByLabel('Win probability (0–1)', { exact: true }).fill('0.4');
  await commercial.getByRole('button', { name: 'Economics', exact: true }).click();
  assert.match(await commercial.locator('[aria-label="Specialist business experience"]').innerText(), /\$2,810,000/);
  await capture(commercial, 'SimulateCommercialOffer', 'changed');
  await commercial.getByRole('button', { name: 'License terms', exact: true }).click();
  await commercial.getByLabel('Discount percent', { exact: true }).fill('101');
  await capture(commercial, 'SimulateCommercialOffer', 'invalid');
  await commercial.getByRole('button', { name: 'Reset scenario', exact: true }).click();
  await commercial.getByRole('button', { name: 'Delivery and ramp', exact: true }).click();
  await commercial.getByRole('button', { name: 'Model 60/80/100% ramp', exact: true }).click();
  assert.match(await commercial.locator('[aria-label="Specialist business experience"]').innerText(), /\$2,993,808/);
  await capture(commercial, 'SimulateCommercialOffer', 'ramped');
  await commercial.getByRole('button', { name: 'License terms', exact: true }).click();
  await commercial.getByLabel('Discount percent', { exact: true }).fill('100');
  await capture(commercial, 'SimulateCommercialOffer', 'zero-subscription');
  await commercial.close();
  for (const [key, label, choice] of [
    ['QualifyOpportunity', 'Qualification decision', 'Pursue'],
    ['ReviewDealException', 'Exception decision', 'Approve exception'],
    ['InspectForecastCommit', 'Forecast recommendation', 'Retain commit'],
    ['ReviewProposalReadiness', 'Readiness decision', 'Ready for customer']
  ]) {
    const page = await pageFor(key);
    await page.getByRole('button', { name: 'Edit business fields', exact: true }).click();
    await page.getByLabel(label, { exact: true }).selectOption(choice);
    assert(await page.getByRole('button', { name: 'Review draft', exact: true }).isDisabled());
    await capture(page, key, 'blocked-positive');
    await page.close();
  }
  for (const [key, parameters, variant] of [
    ['BuildAccountBrief', { accountId: 'ACC-002' }, 'alternate-account'],
    ['PrepareCustomerMeeting', { meetingId: 'MTG-2043' }, 'alternate-meeting'],
    ['ReviewProposalReadiness', { proposalId: 'PROP-2043' }, 'alternate-proposal'],
    ['ReviewDealException', { exceptionId: 'EX-2043' }, 'alternate-exception'],
    ['GetDealRisk', { opportunityId: 'not-found' }, 'no-match'],
    ['GetDealRisk', { selectedId: 'not-found' }, 'unknown-selection'],
    ['ExplorePipelineQuality', { period: 'next', region: 'EMEA' }, 'filtered'],
    ['DiscoverAccountOpportunity', { accountId: 'CONTOSO', period: 'all', region: 'North America' }, 'filtered'],
    ['ExploreAgentCapabilities', { query: 'commercial' }, 'searched'],
    ['ExploreDealAttention', { selectedId: 'ZDR-2072' }, 'selected-deal'],
    ['ExploreDealAttention', { selectedId: 'ZDR-missing' }, 'unmatched-deal'],
    ['GetDealRisk', { selectedId: 'EV-05' }, 'selected-inference']
  ]) {
    const page = await pageFor(key, 'standard', parameters);
    await capture(page, key, variant);
    await page.close();
  }
  }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
const countVariant = variant => captures.filter(capture => capture.variant === variant).length;
const inlineMatrixCount = ['standard', 'narrow', 'dark'].reduce((total, variant) => total + countVariant(variant), 0);
const dashboardCount = countVariant('dashboard');
const workflowReviewCount = countVariant('review');
const workflowReceiptCount = countVariant('receipt');
if (flowsOnly || businessChartsOnly || overviewOnly || countryMapsOnly) {
  console.log(JSON.stringify({ captures: captures.length, stageProbes: inlineProbes.length, maximumDesktopHeight: Math.max(...inlineProbes.filter(item => item.budget === 650).map(item => item.height)), maximumNarrowHeight: Math.max(...inlineProbes.filter(item => item.budget === 800).map(item => item.height)), failures: errors.length }));
  process.exit(0);
}
const evidence = { schemaVersion: 1, capturedAt: new Date().toISOString(), sourceSha256: visualSourceSignature(root), totalCaptures: captures.length, failureCount: errors.length, inlineMatrixCount, dashboardCount, workflowReviewCount, workflowReceiptCount, inlineProbes, captures };
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Captured ${captures.length} current business visuals: ${inlineMatrixCount} inline, ${dashboardCount} dashboards, ${workflowReviewCount} review, ${workflowReceiptCount} receipt, ${captures.length - inlineMatrixCount - dashboardCount - workflowReviewCount - workflowReceiptCount} property/gate states; inline stages within 650px desktop / 800px narrow; zero runtime, console, image, clipping or overflow failures.`);
