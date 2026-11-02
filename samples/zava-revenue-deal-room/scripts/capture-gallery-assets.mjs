import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { visualSourceSignature } from './visual-source-signature.mjs';

const root = path.resolve(import.meta.dirname, '..');
const harness = path.join(root, 'temp', 'visual-harness');
const assets = path.join(root, 'assets');
const captures = [
  { name: 'inline-country-spend-map.png', intent: 'ExplorePipelineQuality', parameters: { mapMetric: 'spend' }, width: 760, height: 650, alt: 'Country spending bubble map using a separate recorded expense ledger with exact country totals and focused drill-down' },
  { name: 'inline-country-opportunity-detail.png', intent: 'DiscoverAccountOpportunity', parameters: { countryId: 'DE' }, width: 760, height: 650, alt: 'Focused Germany opportunity detail with exact headquarters-attributed catalog values and links to inspect the opportunities' },
  { name: 'inline-qualification-gate.png', intent: 'QualifyOpportunity', width: 760, height: 650, alt: 'Buyer-proof qualification ring showing sourced, missing, contrary, inferred and stale proof dimensions without claiming pursuit permission' },
  { name: 'inline-competitive-decision-drivers.png', intent: 'ResearchCompetitivePosition', width: 760, height: 650, alt: 'Competitive decision-driver importance chart with explicit workshop proposal weights, missing vendor evidence and focused source inspection' },
  { name: 'inline-pipeline-sankey.png', intent: 'ExplorePipelineFlow', width: 760, height: 650, alt: 'Interactive pipeline value flow connecting regional USD allocations, buyer readiness and next actions with conserved connections and selectable details' },
  { name: 'inline-approval-sankey.png', intent: 'ExploreApprovalFlow', width: 760, height: 650, alt: 'Interactive approval value flow connecting intake routes, current independent reviewer stages and stage outcomes without implying final approval' },
  { name: 'inline-my-priorities.png', intent: 'GetMyRevenuePriorities', width: 760, height: 1100, alt: 'Personal action cockpit with owned-book totals, evidence-linked priorities, exact deal links and recorded due cues rather than numerical priority scores' },
  { name: 'inline-deal-attention.png', intent: 'ExploreDealAttention', width: 760, height: 1100, alt: 'Scoped deal value versus observable attention flags with exact deal inspection and contextual Copilot questions, not invented loss probabilities' },
  { name: 'inline-deal-details.png', intent: 'ExploreDealAttention', selectedId: 'ZDR-2072', width: 760, height: 1000, alt: 'Inline selected-deal detail view with exact economics, buyer coverage, evidence gaps, a back action, and focused Copilot handoffs' },
  { name: 'inline-deal-submission.png', intent: 'SubmitDealRequest', width: 760, height: 1000, alt: 'Inline guided deal story form with commercial summary, evidence stages, explicit confirmation, and context-aware Copilot suggestions' },
  { name: 'inline-deal-approvals.png', intent: 'ReviewDealApproval', width: 760, height: 1100, alt: 'Inline deal approval inbox with exact request economics, independent reviewer authority, rationale and explicit session decisions' },
  { name: 'inline-buying-committee.png', intent: 'MapBuyingCommittee', width: 760, height: 940, alt: 'Recorded buyer-role network with customer portraits, stance, stored recorded influence assessments and exact contact inspection without claiming decision authority' },
  { name: 'inline-mutual-action-plan.png', intent: 'BuildMutualActionPlan', width: 760, height: 940, alt: 'Inline mutual action plan with buyer and seller commitments, critical path, owners, and credible close range' },
  { name: 'inline-commercial-scenario.png', intent: 'SimulateCommercialOffer', width: 760, height: 980, alt: 'Inline commercial scenario studio with editable inputs, margin guardrail, authority, forecast, and outcome contour' },
  { name: 'inline-global-opportunity-map.png', intent: 'DiscoverAccountOpportunity', width: 760, height: 980, alt: 'Country opportunity choropleth with scoped catalog totals, explicit headquarters attribution and accessible country drill-down' },
  { name: 'inline-pipeline-quality.png', intent: 'ExplorePipelineQuality', width: 760, height: 940, alt: 'Scoped pipeline health matrix with actual stage record counts, catalog value and recorded buyer-proof coverage, plus separate country spending analysis' },
  { name: 'inline-forecast-commit.png', intent: 'InspectForecastCommit', width: 760, height: 940, alt: 'Inline forecast review with verified buyer proof, contrary evidence, seller judgment, and critical close path' },
  { name: 'inline-capability-explorer.png', intent: 'ExploreAgentCapabilities', width: 760, height: 900, alt: 'Inline searchable Revenue Deal Room capability catalog with business outcomes and safe scenario previews' },
  { name: 'fullscreen-deal-room.png', intent: 'MapBuyingCommittee', mode: 'fullscreen', width: 1440, height: 980, alt: 'Full-screen Deal Room workspace coordinating Contoso relationship influence, evidence, and credible close range' },
  { name: 'fullscreen-commercial-desk.png', intent: 'SimulateCommercialOffer', mode: 'fullscreen', width: 1440, height: 980, alt: 'Selected Contoso Commercial Desk scenario with actual editable economics, a computed margin curve and an exact-value continuation to request submission' },
  { name: 'fullscreen-revenue-command.png', intent: 'InspectForecastCommit', mode: 'fullscreen', width: 1440, height: 980, alt: 'Full-screen Revenue Command forecast review with evidence ledger, movement context, and critical milestones' },
  { name: 'fullscreen-my-deals-analytics.png', intent: 'DiscoverAccountOpportunity', mode: 'fullscreen', width: 1440, height: 980, alt: 'Full-width country opportunity map in My Deals with actual portfolio totals, headquarters attribution and relevant geographic context rather than an unrelated task' },
  { name: 'fullscreen-deal-room-mobile.png', intent: 'MapBuyingCommittee', mode: 'fullscreen', width: 390, height: 844, alt: 'Deal Room workspace adapted to a narrow mobile viewport with scrollable navigation and readable evidence' },
  { name: 'fullscreen-deal-room-dark.png', intent: 'MapBuyingCommittee', mode: 'fullscreen', theme: 'dark', width: 1440, height: 980, alt: 'Full-screen Deal Room in dark theme with accessible relationship orbit, evidence provenance, and status colors' },
  ...[
    ['my-deals', 'My Deals'], ['deal-room', 'Deal Room'], ['commercial-desk', 'Commercial Desk'], ['revenue-command', 'Revenue Command']
  ].map(([name, workspace]) => ({ name: `fullscreen-${name}-home.png`, intent: 'PlanCustomerSuccessHandoff', parameters: { opportunityId: 'ZDR-2043' }, workspace, mode: 'fullscreen', width: 1440, height: 980, alt: `${workspace} purposeful landing with actual record selection and role-specific graphics; the originating success handoff is not appended to the workspace` })),
  { name: 'fullscreen-country-spend.png', intent: 'ExplorePipelineQuality', parameters: { mapMetric: 'spend' }, mode: 'fullscreen', width: 1440, height: 980, alt: 'Revenue Command full-width country spending bubbles with the separate recorded ledger and exact geographic drill-down' },
  { name: 'fullscreen-pipeline-value-flow.png', intent: 'ExplorePipelineFlow', mode: 'fullscreen', width: 1440, height: 980, alt: 'Revenue Command pipeline planning flow with conserved USD allocations and an explicit next business step' },
  { name: 'fullscreen-approval-progress.png', intent: 'ExploreApprovalFlow', mode: 'fullscreen', width: 1440, height: 980, alt: 'Commercial Desk approval value flow with independent-stage semantics and an exact named-request continuation' },
  { name: 'fullscreen-alternate-success-plan.png', intent: 'PlanCustomerSuccessHandoff', parameters: { opportunityId: 'ZDR-2043' }, mode: 'fullscreen', width: 1440, height: 980, alt: 'Deal Room success planning for the exact alternate ZDR-2043 opportunity, with proposed outcome controls and no unrelated My Deals template' }
];
const hash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const server = http.createServer((request, response) => {
  const requested = new URL(request.url, 'http://localhost').pathname === '/' ? 'index.html' : new URL(request.url, 'http://localhost').pathname.slice(1);
  const file = path.resolve(harness, requested);
  if (!file.startsWith(harness) || !fs.existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': path.extname(file) === '.js' ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(fs.readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true });
const evidence = [];
try {
  for (const capture of captures) {
    const page = await browser.newPage({ viewport: { width: capture.width, height: capture.mode ? capture.height : 650 }, colorScheme: capture.theme === 'dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    const query = new URLSearchParams({ intent: capture.intent });
    if (capture.mode) query.set('mode', capture.mode);
    if (capture.theme) query.set('theme', capture.theme);
    if (capture.selectedId) query.set('selectedId', capture.selectedId);
    for (const [name, value] of Object.entries(capture.parameters || {})) query.set(name, value);
    await page.goto(`http://127.0.0.1:${port}/?${query}`, { waitUntil: 'networkidle' });
    await page.locator('[data-layout]').first().waitFor();
    if (capture.workspace) await page.getByRole('navigation', { name: 'Revenue workspaces' }).getByRole('button', { name: capture.workspace, exact: true }).click();
    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('[data-inline-stage="true"]');
      return { viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth, inlineHeight: shell ? Math.ceil(Math.max(shell.getBoundingClientRect().height, shell.scrollHeight)) : null, brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).length, layouts: [...document.querySelectorAll('[data-layout]')].map((element) => element.getAttribute('data-layout')) };
    });
    if (metrics.content > metrics.viewport) errors.push(`Horizontal overflow: ${metrics.content} > ${metrics.viewport}`);
    if (!capture.mode && (!metrics.inlineHeight || metrics.inlineHeight > 650)) errors.push(`Inline height ${metrics.inlineHeight} exceeds 650px or was not measured`);
    if (metrics.brokenImages) errors.push(`${metrics.brokenImages} broken image(s)`);
    if (errors.length) throw new Error(`${capture.name}: ${errors.join('; ')}`);
    const output = path.join(assets, capture.name);
    await page.screenshot({ path: output, fullPage: true, animations: 'disabled' });
    const bytes = fs.readFileSync(output);
    evidence.push({ ...capture, inlineHeight: metrics.inlineHeight, capturedWidth: bytes.readUInt32BE(16), capturedHeight: bytes.readUInt32BE(20), bytes: bytes.length, sha256: hash(bytes), layouts: metrics.layouts });
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
fs.writeFileSync(path.join(assets, 'gallery-evidence.json'), `${JSON.stringify({ schemaVersion: 1, capturedAt: new Date().toISOString(), sourceSha256: visualSourceSignature(root), totalCaptures: evidence.length, failureCount: 0, captures: evidence }, null, 2)}\n`);
console.log(`Captured ${evidence.length} visuals with zero runtime or overflow failures.`);