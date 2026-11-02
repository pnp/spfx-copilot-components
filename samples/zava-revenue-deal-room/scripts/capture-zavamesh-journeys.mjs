import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { visualSourceSignature } from './visual-source-signature.mjs';

const root = path.resolve(import.meta.dirname, '..');
const harness = path.join(root, 'temp', 'visual-harness');
const output = path.join(root, 'assets', 'zavamesh-journeys');
const evidencePath = path.join(root, 'assets', 'zavamesh-journey-evidence.json');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
if (process.argv.includes('--check')) {
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  assert.equal(evidence.sourceSha256, visualSourceSignature(root), 'ZavaMesh journey evidence is stale');
  assert.equal(evidence.failureCount, 0);
  assert.equal(evidence.workspaceVariants, 32);
  for (const capture of evidence.captures) assert.equal(digest(fs.readFileSync(path.join(output, capture.name))), capture.sha256);
  console.log(JSON.stringify({ captures: evidence.captures.length, checks: evidence.checks.length, failures: 0, current: true }));
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
const base = `http://127.0.0.1:${server.address().port}/`;
const errors = [];
const captures = [];
const checks = [];
let workspaceVariants = 0;
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`); });
async function capture(name) {
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page.evaluate(() => {
    const visible = element => !!element.getClientRects().length;
    return {
      viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth,
      brokenImages: [...document.images].filter(image => visible(image) && (!image.complete || !image.naturalWidth)).length,
      unlabeledControls: [...document.querySelectorAll('input,select,textarea')].filter(element => visible(element) && !element.labels?.length && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')).length,
      unreadableRows: [...document.querySelectorAll('[data-workspace-record]')].filter(element => visible(element) && element.getBoundingClientRect().height > 320).map(element => element.getAttribute('data-workspace-record')),
      invalidCharts: [...document.querySelectorAll('svg[role="img"]')].filter(element => visible(element) && (
        !(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')) || !element.querySelector('title') ||
        [...element.querySelectorAll('*')].some(mark => ['d', 'x', 'y', 'cx', 'cy', 'r', 'width', 'height'].some(attribute => /NaN|Infinity/.test(mark.getAttribute(attribute) || '')))
      )).length,
      context: window.revenueHarness.context
    };
  });
  assert(metrics.content <= metrics.viewport, `${name}: horizontal overflow`);
  assert.equal(metrics.brokenImages, 0, `${name}: broken images`);
  assert.equal(metrics.unlabeledControls, 0, `${name}: unlabeled form controls`);
  assert.deepEqual(metrics.unreadableRows, [], `${name}: record layout collapsed into unreadable vertical text`);
  assert.equal(metrics.invalidCharts, 0, `${name}: inaccessible or invalid chart`);
  assert.deepEqual(errors, [], `${name}: runtime warnings/errors`);
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(output, file), fullPage: true, animations: 'disabled' });
  const bytes = fs.readFileSync(path.join(output, file));
  captures.push({ name: file, sha256: digest(bytes), bytes: bytes.length, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
}
const center = () => page.getByRole('region', { name: 'Deal submission and approval center', exact: true });
async function chooseWorkspace(name) {
  await page.getByRole('navigation', { name: 'Revenue workspaces' }).getByRole('button', { name, exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.context?.workflowStage === 'workspace-home');
}
async function setDecision(role, decision, rationale) {
  const area = center();
  await area.getByLabel('Reviewer role', { exact: true }).selectOption(role);
  await area.getByLabel('Proposed decision', { exact: true }).selectOption(decision);
  await area.getByLabel('Decision rationale (15-1,000 characters)').fill(rationale);
  const action = area.getByRole('button', { name: decision === 'approved' ? 'Approve review stage' : decision === 'returned' ? 'Return request' : 'Reject request', exact: true });
  assert(await action.isDisabled(), 'Decision needs explicit, initially unchecked confirmation');
  await area.getByLabel('I reviewed the evidence and confirm this decision', { exact: true }).check();
  await action.click();
}
try {
  const inline = await browser.newPage({ viewport: { width: 760, height: 900 }, reducedMotion: 'reduce' });
  await inline.goto(`${base}?intent=SimulateCommercialOffer&mode=inline`, { waitUntil: 'networkidle' });
  await inline.evaluate(() => window.revenueHarness.render({ properties: { opportunityId: 'ZDR-2042', quantity: 1000, termMonths: 24, discount: 8, services: 150000, probability: .65 } }));
  await inline.waitForFunction(() => window.revenueHarness.context.commercial?.inputs.quantity === '1000');
  await inline.getByRole('button', { name: 'Continue with Copilot: Submit a deal · ZDR-2042', exact: true }).click();
  await inline.waitForFunction(() => window.revenueHarness.followUps.length === 1);
  const inlineHandoff = await inline.evaluate(() => window.revenueHarness.followUps[0]);
  assert.equal(inlineHandoff.context.displayMode, 'inline');
  assert.equal(inlineHandoff.context.discussion.responseMode, 'component');
  assert.deepEqual(inlineHandoff.context.discussion.handoff, {
    intent: 'SubmitDealRequest',
    properties: { accountId: 'CONTOSO', opportunityId: 'ZDR-2042', quantity: 1000, termMonths: 24, discount: 8, services: 150000, probability: .65 }
  });
  await inline.close();
  checks.push('Inline continuation requests the next interactive component with the exact five edited commercial inputs; it does not submit or approve.');

  await page.goto(`${base}?intent=GetMyRevenuePriorities&mode=fullscreen`, { waitUntil: 'networkidle' });
  await chooseWorkspace('Revenue Command');
  const original = await page.evaluate(() => window.revenueHarness.context.workspaceState.countryMap.scopedTotals);
  assert.equal(original.recordedSpend, 3400000);
  await page.getByLabel('Workspace quarter', { exact: true }).selectOption('next');
  await page.waitForFunction(value => window.revenueHarness.context.workspaceState.countryMap.scopedTotals.opportunityValue !== value, original.opportunityValue);
  await page.getByLabel('Workspace region', { exact: true }).selectOption('EMEA');
  await page.waitForFunction(() => window.revenueHarness.context.workspaceState.region === 'EMEA');
  await page.getByRole('button', { name: 'Recorded spend', exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.context.workspaceState.countryMap.stage === 'empty-spend');
  await capture('no-future-recorded-spend');
  await page.getByLabel('Workspace quarter', { exact: true }).selectOption('current');
  await page.getByLabel('Workspace region', { exact: true }).selectOption('all');
  await page.waitForFunction(() => window.revenueHarness.context.workspaceState.countryMap.scopedTotals.recordedSpend === 3400000);
  await page.getByLabel('Country', { exact: true }).selectOption('DE');
  await page.waitForFunction(() => window.revenueHarness.context.workspaceState.countryMap.selectedCountryId === 'DE');
  assert.equal(await page.getByText('$220,000', { exact: true }).count(), 1);
  await capture('country-recorded-spend-detail');
  await page.getByRole('button', { name: 'All countries', exact: true }).click();
  await page.getByRole('button', { name: 'Opportunity', exact: true }).click();
  checks.push('Actual scoped country totals, independent expense ledger, empty future expenses, country detail and recovery; no requested investment or ROI substituted.');

  await chooseWorkspace('My Deals');
  assert.equal(await page.locator('[data-layout="PlanCustomerSuccessHandoff-business-draft"]:visible').count(), 0);
  await capture('my-deals-starting-point');
  await page.getByRole('button', { name: 'Work top priority', exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.context.intent === 'MapBuyingCommittee');
  assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), 'Deal Room');
  assert.equal(await page.evaluate(() => window.revenueHarness.context.resolvedScope.opportunityId), 'ZDR-2042');
  await page.getByRole('button', { name: 'Continue to Deal risk', exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.context.intent === 'GetDealRisk');
  await capture('selected-deal-proof-story');
  await page.getByRole('button', { name: 'Continue to Commercial scenario', exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.context.intent === 'SimulateCommercialOffer');
  for (const [label, value] of [['Licensed users', '1000'], ['Contract term (months)', '24'], ['Discount percent', '8'], ['Services (USD)', '150000'], ['Win probability (0–1)', '0.65']]) await page.getByLabel(label, { exact: true }).fill(value);
  assert((await page.getByRole('region', { name: 'Specialist business experience' }).innerText()).includes('$2,818,000'));
  await page.getByRole('button', { name: 'Continue with Copilot: Summary & next steps', exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.followUps.length === 1);
  const summary = await page.evaluate(() => window.revenueHarness.followUps[0]);
  assert.equal(summary.context.intent, 'SimulateCommercialOffer');
  assert.equal(summary.context.displayMode, 'fullscreen');
  assert.equal(summary.context.discussion.responseMode, 'text');
  assert.equal(summary.context.discussion.handoff, null);
  assert.match(summary.message, /text-only summary in chat/);
  assert.deepEqual(summary.context.commercial.inputs, { quantity: '1000', termMonths: '24', discount: '8', services: '150000', probability: '0.65', ramp: '' });
  await capture('fullscreen-commercial-summary-request');
  checks.push('Full-screen continuation requests only a concise chat summary of the active edited scenario, with no tool handoff or navigation.');
  await page.getByRole('button', { name: 'Continue to Submit a deal', exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.context.intent === 'SubmitDealRequest');
  assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), 'My Deals');
  await center().getByLabel('Deal name (5-120 characters)').fill('ZavaMesh connected growth program');
  await center().getByLabel('Business outcome (20-1,000 characters)').fill('Launch an accountable regional growth program with sponsor and security evidence.');
  await center().getByRole('button', { name: 'Continue', exact: true }).click();
  assert.equal(await center().getByLabel('Licensed users').inputValue(), '1000');
  assert.equal(await center().getByLabel('Contract months').inputValue(), '24');
  await center().getByLabel('Licensed users').fill('');
  assert((await center().getByRole('alert').innerText()).includes('Licensed users'));
  await center().getByLabel('Licensed users').fill('1000');
  await capture('deal-commercial-draft');
  await center().getByRole('button', { name: 'Continue', exact: true }).click();
  await center().getByLabel('Security review evidence is ready', { exact: true }).check();
  await center().getByLabel('Economic sponsor evidence is ready', { exact: true }).check();
  await center().getByRole('button', { name: 'Review deal request', exact: true }).click();
  assert((await center().innerText()).includes('$2,818,000'));
  assert(await center().getByRole('button', { name: 'Submit deal request', exact: true }).isDisabled());
  await chooseWorkspace('Revenue Command');
  await chooseWorkspace('My Deals');
  await page.getByRole('button', { name: 'Resume Submit a deal / Proposed request', exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.context.intent === 'SubmitDealRequest');
  assert((await center().innerText()).includes('ZavaMesh connected growth program'));
  await capture('deal-request-review');
  await center().getByLabel('I reviewed this request and confirm submission', { exact: true }).check();
  await center().getByRole('button', { name: 'Submit deal request', exact: true }).click();
  await page.waitForFunction(() => !!window.revenueHarness.context.inlineDealWorkflow?.receiptId);
  const requestId = await page.evaluate(() => window.revenueHarness.context.inlineDealWorkflow.receiptId);
  await capture('deal-submission-receipt');
  checks.push('Explicit priority selection, exact scope through buyer proof and commercial choice, actual-value intake continuity, invalid-input feedback, mounted draft resume and consent-gated submission.');

  await page.getByRole('button', { name: 'Continue to Deal approvals', exact: true }).click();
  await page.waitForFunction(id => window.revenueHarness.context.inlineDealWorkflow.selectedRequest.id === id, requestId);
  assert((await center().innerText()).includes('$2,818,000'));
  await setDecision('Sales manager', 'approved', 'Sponsor and security demo evidence reviewed; standard commercial terms accepted.');
  await page.waitForFunction(() => window.revenueHarness.context.inlineDealWorkflow.selectedRequest.status === 'approved');
  await capture('approved-deal-and-audit');
  await chooseWorkspace('Commercial Desk');
  await page.getByRole('button', { name: 'Review ZM-1002', exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.context.inlineDealWorkflow.selectedRequest.id === 'ZM-1002');
  assert.equal(await center().getByLabel('Reviewer role', { exact: true }).inputValue(), 'Sales manager');
  await center().getByLabel('Decision rationale (15-1,000 characters)').fill('Security and sponsor evidence must be supplied before approval.');
  await center().getByLabel('I reviewed the evidence and confirm this decision', { exact: true }).check();
  assert(await center().getByRole('button', { name: 'Approve review stage', exact: true }).isDisabled());
  await center().getByLabel('Proposed decision', { exact: true }).selectOption('returned');
  assert(!(await center().getByLabel('I reviewed the evidence and confirm this decision', { exact: true }).isChecked()));
  await center().getByLabel('I reviewed the evidence and confirm this decision', { exact: true }).check();
  await center().getByRole('button', { name: 'Return request', exact: true }).click();
  await capture('evidence-gated-return');
  checks.push('Exact request selected before review, independent role and rationale, unchanged monetary values, explicit consent, evidence blocks approval while a reasoned return remains available.');

  await page.reload({ waitUntil: 'networkidle' });
  await chooseWorkspace('Commercial Desk');
  await page.getByRole('button', { name: `Review ${requestId}`, exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.context.inlineDealWorkflow.selectedRequest.status === 'approved');
  await chooseWorkspace('Commercial Desk');
  await page.getByRole('button', { name: 'Reset session data', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm session reset', exact: true }).click();
  await page.waitForFunction(() => window.revenueHarness.context.workflowStage === 'workspace-home');
  assert.equal(await page.getByRole('button', { name: `Review ${requestId}`, exact: true }).count(), 0);
  checks.push('Confirmed overlays survive reload; explicit reset clears drafts and restores baseline; menu selection opens a landing, not the originating task.');

  for (const theme of ['light', 'dark']) for (const width of [340, 760, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(theme => window.revenueHarness.render({ mode: 'fullscreen', theme }), theme);
    for (const workspace of ['My Deals', 'Deal Room', 'Commercial Desk', 'Revenue Command']) {
      await chooseWorkspace(workspace);
      assert.equal(await page.getByRole('navigation', { name: 'Revenue workspaces' }).getByRole('button', { name: workspace, exact: true }).getAttribute('aria-current'), 'page');
      assert.equal(await page.getByRole('region', { name: 'Specialist business experience' }).count(), 0);
      await capture(`${workspace.toLowerCase().replaceAll(' ', '-')}-${width}-${theme}`);
      workspaceVariants++;
    }
  }
  await page.setViewportSize({ width: 720, height: 500 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
  await capture('revenue-command-200-percent-page-scale');
  await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
  await page.getByRole('navigation', { name: 'Revenue workspaces' }).getByRole('button', { name: 'My Deals', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.getByRole('navigation', { name: 'Revenue workspaces' }).getByRole('button', { name: 'My Deals', exact: true }).getAttribute('aria-current'), 'page');
  checks.push('Four distinct landing views at eight width/theme combinations; keyboard navigation, readable left menu, truthful scope and no unsolicited task tail.');
  fs.writeFileSync(evidencePath, `${JSON.stringify({ schemaVersion: 1, capturedAt: new Date().toISOString(), sourceSha256: visualSourceSignature(root), failureCount: 0, workspaceVariants, checks, captures }, null, 2)}\n`);
  console.log(JSON.stringify({ captures: captures.length, workspaceVariants, checks: checks.length, failures: 0 }));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
