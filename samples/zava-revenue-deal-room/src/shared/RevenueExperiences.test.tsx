jest.mock('./visualizations/RevenueCharts', () => ({
  D3CommercialContour: () => null, D3PipelineQuality: () => null, D3RevenueMap: () => null, D3ForecastBridge: () => null,
  D3AttentionRanking: () => null, D3EvidenceFreshness: () => null, D3ClosePlanStatus: () => null
}));
jest.mock('./media', () => ({ PERSONA_MEDIA: {
  'Nestor Wilke': { src: '/portrait.jpg', alt: 'Nestor Wilke' },
  'Pradeep Gupta': { src: '/portrait.jpg', alt: 'Pradeep Gupta' },
  'Lee Gu': { src: '/portrait.jpg', alt: 'Lee Gu' },
  'Patti Fernandez': { src: '/portrait.jpg', alt: 'Patti Fernandez' },
  'Megan Bowen': { src: '/portrait.jpg', alt: 'Megan Bowen' },
  'Miriam Graham': { src: '/portrait.jpg', alt: 'Miriam Graham' },
  'Joni Sherman': { src: '/portrait.jpg', alt: 'Joni Sherman' }
} }));
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import RevenueApp, { type IModelContextSnapshot } from './RevenueApp';
import RevenueThemeProvider from './RevenueThemeProvider';
import { INTENTS, getIntent, type IRevenueProperties, type RevenueIntentKey } from './catalog';
import { initialDraft, resolveScope, workflowFor } from './operations';
import { contextRecord } from './copilot';
import { getDealStore, newDealDraft } from './dealWorkflow';
import { attentionDeals } from './DealAttention';
import { OPPORTUNITIES } from './domain';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
jest.setTimeout(20000);

const expected: Readonly<Record<RevenueIntentKey, string>> = {
  BuildAccountBrief: 'Whitespace hypothesis', QualifyOpportunity: 'Missing qualification evidence',
  MapBuyingCommittee: 'Lee Gu · Economic buyer', GetDealRisk: 'Economic buyer access missing',
  PrepareCustomerMeeting: 'Steering agenda · 30 minutes', BuildMutualActionPlan: 'Buyer accountable owner',
  ReviewMeetingCommitments: 'Proposed customer commitment', ShapeSolutionProposal: 'Requirement and proof',
  SimulateCommercialOffer: 'Subscription delivery cost 22%', ReviewDealException: 'Proposed payment days',
  InspectForecastCommit: 'Re-entry condition', ExplorePipelineQuality: 'Intervene where buyer proof',
  DiscoverAccountOpportunity: 'discovery candidates, not created leads', ResearchCompetitivePosition: 'Incumbent status · unverified',
  CoachDealStrategy: 'Counterplay · avoid premature discounting', CreateExecutiveEngagementPlan: 'Warm introduction and relationship owner',
  TrackMeetingFollowUp: 'Completion requires source evidence', BuildValueCase: 'Scenario annual benefit $714,000',
  ReviewProposalReadiness: 'Blocking gap and correction', PlanCustomerSuccessHandoff: 'First success checkpoint +30d',
  ExploreAgentCapabilities: `${INTENTS.length - 1} matching scenarios`, SubmitDealRequest: '01  Deal story',
  ReviewDealApproval: 'Commercial approval center', ExploreDealAttention: 'Important deals / attention catalog',
  GetMyRevenuePriorities: 'Focus your next move.', ExplorePipelineFlow: '29.4M in scope',
  ExploreApprovalFlow: '30.0M in scope'
};
describe('all-intent business UX with persistent React 18 roots', () => {
  let container: HTMLDivElement;
  let root: Root;
  const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
  const followUp = jest.fn<Promise<boolean>, [string, IModelContextSnapshot]>(() => Promise.resolve(true));
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    publish.mockReset().mockResolvedValue(undefined); followUp.mockReset().mockResolvedValue(true);
    getDealStore().reset();
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  async function render(key: RevenueIntentKey, properties: IRevenueProperties = {}, displayMode = 'fullscreen', theme = 'light'): Promise<void> {
    await act(async () => root.render(<RevenueThemeProvider theme={theme} targetDocument={document}><RevenueApp definition={getIntent(key)} properties={properties} currentUserName="Megan Bowen" displayMode={displayMode} onUpdateModelContext={publish} onSendFollowUp={followUp} /></RevenueThemeProvider>));
  }
  function button(text: string): HTMLButtonElement {
    const element = Array.from(container.querySelectorAll('button')).find(item => item.textContent === text || item.getAttribute('aria-label') === text);
    if (!element) throw new Error(`Missing button: ${text}`);
    return element;
  }
  async function menuItem(text: string): Promise<HTMLElement> {
    if (!document.querySelector('[role="menuitem"]')) await act(async () => button('More discussions').click());
    const element = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(item => item.textContent === text);
    if (!element) throw new Error(`Missing menu action: ${text}`);
    return element;
  }
  async function click(text: string): Promise<void> {
    const control = Array.from(container.querySelectorAll('button')).find(item => item.textContent === text || item.getAttribute('aria-label') === text) || await menuItem(text);
    await act(async () => control.click());
  }
  async function menuDisabled(text: string): Promise<boolean> {
    const control = Array.from(container.querySelectorAll('button')).find(item => item.textContent === text);
    return control ? control.disabled : (await menuItem(text)).getAttribute('aria-disabled') === 'true';
  }
  async function set(label: string, value: string): Promise<void> {
    const locate = (): Element | null => {
      const labelled = Array.from(container.querySelectorAll('label')).find(item => item.textContent?.indexOf(label) === 0);
      return container.querySelector(`[aria-label="${label}"]`) || document.getElementById(labelled?.htmlFor || '');
    };
    if (!locate() && Array.from(container.querySelectorAll('button')).some(item => item.textContent === 'Edit business fields')) {
      await click('Edit business fields');
    }
    if (!locate() && (label === 'Region' || label === 'Quarter scope') && Array.from(container.querySelectorAll('button')).some(item => item.textContent === 'Change scope')) {
      await click('Change scope');
    }
    const element = locate();
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) throw new Error(`Missing input ${label}`);
    await act(async () => {
      if (element instanceof HTMLInputElement) Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(element, value);
      else if (element instanceof HTMLTextAreaElement) Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(element, value);
      else element.value = value;
      element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
    });
  }
  const latest = (): IModelContextSnapshot => publish.mock.calls[publish.mock.calls.length - 1][0];

  test.each([
    ['ExplorePipelineFlow', 'Pipeline value & actions'],
    ['ExploreApprovalFlow', 'Approval progress']
  ] satisfies [RevenueIntentKey, string][])('%s has a business title, not a diagram-type heading', async (key, title) => {
    await render(key, {}, 'inline');
    expect(container.querySelector('h1')?.textContent).toBe(title);
    expect(contextRecord(latest().revenueFlow).title).toBe(title);
    expect(container.querySelector('h1')?.textContent).not.toContain('Sankey');
    expect(container.textContent).toContain('Value flow analysis');
  });
  test('qualification and competitive research expose different chart structures, units and source-backed data', async () => {
    await render('QualifyOpportunity', {}, 'inline');
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'qualification-evidence-gates', verifiedCount: 1, totalCount: 5 } });
    expect(container.querySelectorAll('[data-qualification-gate]')).toHaveLength(5);
    expect(container.querySelectorAll('[data-competitive-driver]')).toHaveLength(0);
    await set('Missing qualification evidence', 'Seller says every gate is complete');
    expect(latest().businessImpact).toMatchObject({ verifiedCount: 1 });
    expect(latest().inlineStage).toMatchObject({ chart: null });
    await render('ResearchCompetitivePosition', {}, 'inline');
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'competitive-decision-drivers', unit: 'proposed importance percent' } });
    const chart = contextRecord(contextRecord(latest().inlineStage).chart);
    expect(chart.records).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'CMP-security', weight: 35 }), expect.objectContaining({ id: 'CMP-terms', weight: 10 })]));
    expect(container.querySelectorAll('[data-qualification-gate]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-competitive-driver]')).toHaveLength(4);
    expect(container.textContent).toContain('buyer weights and vendor performance remain unverified');
    const mark = container.querySelector('[data-competitive-driver="CMP-security"]');
    await act(async () => mark?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(latest().selectedRecord).toMatchObject({ id: 'CMP-security', kind: 'workshop proposal' });
    expect(latest().inlineStage).toMatchObject({ label: 'Source detail', chart: null });
    expect(container.textContent).toContain('35% proposed importance');
    await render('ResearchCompetitivePosition', { opportunityId: 'ZDR-2043' }, 'inline');
    expect(contextRecord(contextRecord(latest().inlineStage).chart).records).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'CMP-pilot', weight: 15 })]));
  });
  test('pipeline value-flow selection publishes exact connection details and an aggregate, not substituted-deal handoff', async () => {
    await render('ExplorePipelineFlow', {}, 'inline');
    expect(latest().revenueFlow).toMatchObject({ kind: 'pipeline', total: 29400000, stage: 'Sankey' });
    expect(latest().resolvedScope).toEqual({ period: 'current', region: 'all' });
    const ribbon = container.querySelector('[data-sankey-link="pipeline:na:ready"]');
    expect(ribbon).not.toBeNull();
    await act(async () => ribbon?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(latest().selection).toBe('pipeline:na:ready');
    expect(latest().selectedRecord).toMatchObject({ value: 4800000, source: 'Regional planning and review allocations' });
    expect(latest().inlineStage).toMatchObject({ label: 'Details', chart: null, page: 1 });
    expect(latest().visibleRecords).toHaveLength(1);
    expect(container.textContent).toContain('of scoped value');
    await click('Continue with Copilot: Deals needing attention · pipeline:na:ready');
    expect(followUp.mock.calls[0][1].discussion).toMatchObject({ handoff: { intent: 'ExploreDealAttention', properties: { period: 'current', region: 'all' } } });
    expect(contextRecord(contextRecord(followUp.mock.calls[0][1].discussion).handoff).properties).not.toHaveProperty('selectedId');
    await render('ExplorePipelineFlow', {}, 'fullscreen', 'dark');
    await render('ExplorePipelineFlow', {}, 'inline', 'dark');
    expect(latest().selection).toBe('pipeline:na:ready');
    await click('Back to value flow');
    expect(latest().inlineStage).toMatchObject({ label: 'Sankey', chart: { kind: 'sankey' } });
    await set('Planning region', 'EMEA');
    expect(latest().revenueFlow).toMatchObject({ total: 8200000, region: 'EMEA' });
  });
  test('approval value flow inspects a paginated stage and opens the exact request without changing its values or decisions', async () => {
    await render('ExploreApprovalFlow', {}, 'inline');
    const before = getDealStore().getSnapshot().requests;
    const node = container.querySelector('[data-sankey-node="director"]');
    await act(async () => node?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })));
    expect(latest().selectedRecord).toMatchObject({ id: 'director', value: 10800000 });
    expect(latest().inlineStage).toMatchObject({ label: 'Details', page: 1, pageCount: 3 });
    expect(latest().visibleRecords).toHaveLength(2);
    await click('Next connections');
    expect(latest().inlineStage).toMatchObject({ page: 2 });
    expect(latest().visibleRecords).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'approval:director:passed', value: 3700000 })]));
    expect(container.textContent).toContain('Stage completion is not final approval');
    await click('Continue with Copilot: Deal approvals · ZM-1001');
    expect(followUp.mock.calls[0][1].discussion).toMatchObject({ handoff: { intent: 'ReviewDealApproval', properties: { requestId: 'ZM-1001' } } });
    expect(followUp.mock.calls[0][1].revenueFlow).toMatchObject({ kind: 'approval', stage: 'Details' });
    expect(followUp.mock.calls[0][0]).not.toMatch(/\b(?:sample|example|demo|fictional|imaginary)\b/i);
    expect(followUp.mock.calls[0][1].resolvedScope).toMatchObject({ requestId: 'ZM-1001', requestLevelReview: true });
    expect(getDealStore().getSnapshot().requests).toBe(before);
  });
  test.each(['ExplorePipelineFlow', 'ExploreApprovalFlow'] satisfies RevenueIntentKey[])('%s preserves unknown Sankey selections and blocks handoffs until explicit recovery', async key => {
    await render(key, { selectedId: 'missing-flow' }, 'inline');
    expect(latest().selectedEntityId).toBe('missing-flow');
    expect(latest().workflowStage).toBe('no-match');
    expect(container.querySelector('[data-sankey-node]')).toBeNull();
    expect(container.querySelector<HTMLButtonElement>('[data-copilot-action="primary"]')?.disabled).toBe(true);
    await click('Clear flow selection and filters');
    expect(latest().workflowStage).toBe('analysis');
    expect(latest().selection).toBe('');
    expect(container.querySelectorAll('[data-sankey-node]').length).toBe(10);
  });

  test.each(INTENTS)('$key exposes actual distinct business content and committed model context', async definition => {
    await render(definition.key);
    if (definition.key === 'ExplorePipelineQuality') expect(container.querySelector('[data-business-visual="pipeline-health-matrix"]')).not.toBeNull();
    else if (definition.key === 'DiscoverAccountOpportunity') expect(contextRecord(latest().countryMap).chart).toMatchObject({ kind: 'country-choropleth' });
    else expect(container.textContent).toContain(expected[definition.key]);
    expect(container.textContent).not.toContain('3 verified sources');
    expect(container.textContent).not.toMatch(/\b(?:sample|example|demo|fictional|imaginary)\b/i);
    expect(latest().intent).toBe(definition.key);
    expect(latest().workflowStage).toBe(definition.key === 'ReviewDealApproval' ? 'queue' : definition.operation === 'review' || definition.operation === 'submit' ? 'draft' : 'analysis');
    expect(container.querySelectorAll('[data-copilot-action]')).toHaveLength(1);
    await click('Continue with Copilot: Summary & next steps');
    expect(followUp.mock.calls[0][0]).toContain('text-only summary in chat');
    expect(followUp.mock.calls[0][1]).toMatchObject({
      intent: definition.key, displayMode: 'fullscreen',
      discussion: { actionId: 'summarize-workspace', responseMode: 'text', handoff: null }
    });
    await click('More discussions');
    expect(document.querySelectorAll('[role="menuitem"]').length).toBeGreaterThanOrEqual(3);
  });
  test.each(INTENTS)('$key starts in a compact semantic stage with one primary and no expanded discussion footer', async definition => {
    await render(definition.key, {}, 'inline');
    expect(container.querySelector('[data-inline-stage="true"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-copilot-action]')).toHaveLength(1);
    const primary = container.querySelector<HTMLButtonElement>('[data-copilot-action="primary"]');
    expect(primary?.textContent).toContain('Continue with Copilot:');
    expect(primary?.textContent).not.toMatch(/\b(?:sample|example|demo|fictional|imaginary)\b/i);
    expect(primary?.disabled).toBe(false);
    expect(latest().inlineStage).toEqual(expect.objectContaining({ label: expect.any(String), visibleFields: expect.any(Array) }));
    expect(latest().visibleRecordCount).toBeLessThanOrEqual(2);
    const fields = container.querySelectorAll('input:not([type="checkbox"]),textarea,select');
    expect(fields.length).toBeLessThanOrEqual(3);
    await act(async () => primary?.click());
    expect(followUp).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      intent: definition.key, displayMode: 'inline', inlineStage: latest().inlineStage,
      discussion: expect.objectContaining({ label: expect.stringContaining('Continue with Copilot:') })
    }));
  });
  test.each([
    ['GetMyRevenuePriorities', {}, 'Buying committee', 'MapBuyingCommittee', { opportunityId: 'ZDR-2042' }],
    ['MapBuyingCommittee', { opportunityId: 'ZDR-2042' }, 'Deal risk', 'GetDealRisk', { opportunityId: 'ZDR-2042' }],
    ['GetDealRisk', { opportunityId: 'ZDR-2042', selectedId: 'EV-04' }, 'Commercial scenario', 'SimulateCommercialOffer', { opportunityId: 'ZDR-2042', probability: 0.72 }]
  ] satisfies [RevenueIntentKey, IRevenueProperties, string, RevenueIntentKey, IRevenueProperties][])('inline primary %s continues the exact keynote deal to %s', async (key, properties: IRevenueProperties, title, target, nextProperties) => {
    await render(key, properties, 'inline');
    const requestsBefore = getDealStore().getSnapshot().requests;
    await click(`Continue with Copilot: ${title} · ZDR-2042`);
    expect(followUp.mock.calls[0][1]).toMatchObject({
      displayMode: 'inline', resolvedScope: { opportunityId: 'ZDR-2042' },
      discussion: { responseMode: 'component', handoff: { intent: target, properties: nextProperties } }
    });
    if (properties.selectedId) expect(followUp.mock.calls[0][1].selection).toBe(properties.selectedId);
    expect(getDealStore().getSnapshot().requests).toBe(requestsBefore);
  });
  test.each([
    ['MapBuyingCommittee', 'Executive engagement', 'CreateExecutiveEngagementPlan'],
    ['GetDealRisk', 'Mutual action plan', 'BuildMutualActionPlan']
  ] satisfies [RevenueIntentKey, string, RevenueIntentKey][])('inline primary %s keeps its alternate suggestion and full-screen routing', async (key, title, target) => {
    await render(key, { opportunityId: 'ZDR-2043' }, 'inline');
    expect(await menuDisabled(`Continue: ${title}`)).toBe(false);
    await render(key, { opportunityId: 'ZDR-2043' }, 'fullscreen');
    await click(`Continue: ${title}`);
    expect(followUp.mock.calls[0][1].discussion).toMatchObject({ handoff: { intent: target, properties: { opportunityId: 'ZDR-2043' } } });
  });
  test.each([
    [undefined, 'Submit a deal', 'SubmitDealRequest'],
    [[60, 80, 100], 'Deal exception', 'ReviewDealException']
  ] satisfies [readonly number[] | undefined, string, RevenueIntentKey][])('inline primary commercial ramp %s continues to %s without submitting', async (ramp, title, target) => {
    await render('SimulateCommercialOffer', { opportunityId: 'ZDR-2042', termMonths: 36, ramp }, 'inline');
    const requestsBefore = getDealStore().getSnapshot().requests;
    await click(`Continue with Copilot: ${title} · ZDR-2042`);
    expect(followUp.mock.calls[0][1].discussion).toMatchObject({ handoff: { intent: target, properties: { opportunityId: 'ZDR-2042' } } });
    expect(getDealStore().getSnapshot().requests).toBe(requestsBefore);
  });
  test('compact source pagination and focused detail stay accurate through passive mode and theme renders', async () => {
    await render('GetDealRisk', {}, 'inline');
    expect(latest().visibleRecords).toHaveLength(0);
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'signature-blocker-network' } });
    await click('Evidence records');
    expect(latest().visibleRecords).toHaveLength(2);
    expect(latest().inlineStage).toMatchObject({ label: 'Records', page: 1, visibleFields: ['id', 'title', 'kind', 'source'], chart: null });
    const first = latest().visibleRecords;
    await click('Next records');
    expect(latest().visibleRecords).not.toEqual(first);
    expect(latest().inlineStage).toMatchObject({ page: 2 });
    const record = contextRecord((latest().visibleRecords as readonly unknown[])[0]);
    await click(`Inspect ${record.id}`);
    expect(latest().visibleRecords).toHaveLength(1);
    expect(latest().inlineStage).toMatchObject({ label: 'Source detail', chart: null });
    await render('GetDealRisk', {}, 'fullscreen', 'dark');
    expect(container.querySelector('[data-inline-stage]')).toBeNull();
    await render('GetDealRisk', {}, 'inline', 'dark');
    expect(latest().selection).toBe(record.id);
    expect(latest().inlineStage).toMatchObject({ label: 'Source detail', page: 1, pageCount: 1, catalogPage: 2 });
    await click('Back to overview');
    expect(latest().inlineStage).toMatchObject({ label: 'Records', page: 2 });
  });
  test('compact chart marks support keyboard inspection of the exact visible source', async () => {
    await render('GetDealRisk', {}, 'inline');
    const mark = container.querySelector('[role="button"][aria-label="Inspect EV-03"]');
    expect(mark).not.toBeNull();
    await act(async () => mark?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(latest().selection).toBe('EV-03');
    expect(latest().visibleRecords).toHaveLength(1);
    expect(latest().inlineStage).toMatchObject({ label: 'Source detail', chart: null });
  });
  test('commitment follow-up uses a real ownership board and selects an exact milestone', async () => {
    await render('TrackMeetingFollowUp', {}, 'inline');
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'commitment-owner-board' } });
    const card = container.querySelector<HTMLButtonElement>('button[aria-label="Inspect MS-03"]');
    expect(card).not.toBeNull();
    await act(async () => card?.click());
    expect(latest().selectedRecord).toMatchObject({ id: 'MS-03' });
    expect(latest().inlineStage).toMatchObject({ label: 'Source detail', chart: null });
  });
  test('portfolio health is a filtered proof matrix rather than a duplicated value bar', async () => {
    await render('ExplorePipelineQuality', {}, 'inline');
    expect(container.querySelector('table[data-business-visual="pipeline-health-matrix"]')).not.toBeNull();
    const chart = contextRecord(contextRecord(latest().inlineStage).chart);
    expect(chart.kind).toBe('pipeline-health-matrix');
    expect(chart.items).toHaveLength(4);
    expect(latest().visibleRecords).toEqual([]);
    await click('Change scope');
    await set('Quarter scope', 'next');
    await set('Region', 'EMEA');
    await click('Show scoped view');
    expect(latest().requestedScope).toEqual({});
    expect(latest().period).toBe('next');
    expect(latest().region).toBe('EMEA');
    expect(latest().inlineStage).toMatchObject({ label: 'Health', chart: { kind: 'pipeline-health-matrix' } });
  });
  test('portfolio and account discovery both have useful fullscreen workspaces without a fixed reference template', async () => {
    await render('DiscoverAccountOpportunity', {}, 'fullscreen');
    expect(container.querySelector('[data-layout="my-deals-dashboard"]')).not.toBeNull();
    expect(latest().referenceWorkspace).toBeNull();
    expect(latest().requestedScope).toEqual({});
    await render('DiscoverAccountOpportunity', { accountId: 'CONTOSO' }, 'fullscreen');
    expect(container.querySelector('[data-layout="my-deals-dashboard"]')).not.toBeNull();
    expect(latest().requestedScope).toEqual({ accountId: 'CONTOSO' });
    expect(container.textContent).not.toContain('Contoso reference');
  });
  test('country opportunity and recorded-spend maps conserve their own data and hand off the actual selected country', async () => {
    await render('DiscoverAccountOpportunity', {}, 'inline');
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'country-choropleth' } });
    expect(latest().resolvedScope).not.toHaveProperty('accountId');
    expect(contextRecord(contextRecord(latest().countryMap).scopedTotals).opportunityValue).toBe(OPPORTUNITIES.filter(item => item.quarterOffset === 0).reduce((sum, item) => sum + item.value, 0));
    await set('Country', 'DE');
    expect(contextRecord(latest().countryMap).selectedCountryId).toBe('DE');
    expect(latest().selectedEntityId).toBe('DE');
    await click('Recorded spend');
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'country-spend-bubbles' } });
    expect(contextRecord(contextRecord(latest().countryMap).scopedTotals).recordedSpend).toBe(3400000);
    const primary = container.querySelector<HTMLButtonElement>('[data-copilot-action="primary"]');
    await act(async () => primary?.click());
    expect(followUp.mock.calls[0][1].discussion).toMatchObject({ handoff: { intent: 'ExplorePipelineQuality', properties: { period: 'current', region: 'all', countryId: 'DE', mapMetric: 'spend' } } });
    expect(primary?.isConnected).toBe(true);
    expect(primary?.querySelector('[role="status"]')?.getAttribute('aria-label')).toBe('Sent to Copilot with the visible discussion context.');
    expect(primary?.querySelector('[role="status"]')?.closest('span')?.getAttribute('aria-hidden')).toBe('false');
    expect(container.querySelector('p[role="status"]')).toBeNull();
    await set('Country', 'US');
    expect(primary?.querySelector('[role="status"]')).toBeNull();
  });
  test('capability discovery uses actual business-job counts and still launches the clicked tool', async () => {
    await render('ExploreAgentCapabilities', {}, 'inline');
    expect(container.querySelector('[data-business-visual="business-capability-map"]')).not.toBeNull();
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'business-capability-map' } });
    await click('Explore scenarios');
    expect(latest().visibleRecords).toHaveLength(2);
    expect(container.querySelectorAll('[data-copilot-launch]')).toHaveLength(2);
    await click('Open Account brief in Copilot');
    expect(followUp.mock.calls[0][1].discussion).toMatchObject({ handoff: { intent: 'BuildAccountBrief', properties: {} } });
  });
  test.each([
    'BuildAccountBrief', 'MapBuyingCommittee', 'GetDealRisk', 'CoachDealStrategy'
  ] satisfies RevenueIntentKey[])('compact SVG hit target %s provides a painted pointer surface and selects its exact record', async key => {
    await render(key, {}, 'inline');
    const marks = Array.from(container.querySelectorAll<SVGGElement>('svg g[role="button"]'));
    expect(marks.length).toBeGreaterThan(0);
    marks.forEach(mark => {
      const target = mark.querySelector<SVGRectElement>('[data-svg-hit-target="true"]');
      expect(target?.tagName).toBe('rect');
      expect(target?.getAttribute('fill')).toBe('transparent');
      expect(target?.getAttribute('pointer-events')).toBe('all');
      expect(Number(target?.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(target?.getAttribute('height'))).toBeGreaterThan(0);
      expect(mark.getAttribute('tabindex')).toBe('0');
    });
    const selectedId = (marks[0].getAttribute('aria-label') || '').replace(/^Inspect /, '');
    const target = marks[0].querySelector('[data-svg-hit-target="true"]');
    await act(async () => { target?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(latest().selection).toBe(selectedId);
    expect(latest().visibleRecords).toEqual([expect.objectContaining({ id: selectedId })]);
  });
  test('compact value-case fields and review pages share calculated graphic data and gate confirmation', async () => {
    await render('BuildValueCase', {}, 'inline');
    expect(latest().inlineStage).toMatchObject({ label: 'Draft business impact', chart: { kind: 'customer-payback-timeline' } });
    expect(contextRecord(contextRecord(latest().inlineStage).chart).metrics).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'Annual modeled benefit', value: 714000 })]));
    await set('Realized adoption percent', '50');
    expect(contextRecord(latest().businessImpact).metrics).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'Annual modeled benefit', value: 510000 })]));
    expect(latest().inlineStage).toMatchObject({ visibleFields: ['hours', 'rate', 'adoption'], chart: null });
    await click('Next fields');
    expect(latest().inlineStage).toMatchObject({ visibleFields: ['investment', 'onboarding', 'owner'] });
    await click('Review draft');
    const checkbox = container.querySelector<HTMLInputElement>('[aria-label="Specialist business experience"] input[type="checkbox"]');
    expect(checkbox?.disabled).toBe(true);
    await click('Next fields');
    expect(checkbox?.disabled).toBe(false);
    await act(async () => checkbox?.click());
    expect(button('Confirm session draft').disabled).toBe(false);
    await click('Confirm session draft');
    expect(latest().workflowStage).toBe('receipt');
    expect(latest().draft).toMatchObject({ adoption: '50' });
  });
  test('compact personal stages publish only the page, selected priority, or active chart', async () => {
    await render('GetMyRevenuePriorities', {}, 'inline');
    expect(latest().visibleRecords).toHaveLength(2);
    await click('Next priorities');
    expect(latest().inlineStage).toMatchObject({ page: 2 });
    await click('Pipeline');
    expect(latest().visibleRecords).toEqual([]);
    expect(latest().inlineStage).toMatchObject({ label: 'Pipeline', chart: { kind: 'owned-book-pipeline' } });
    await click('Outlook');
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'seller-outlook', open: 18537260 } });
    await click('Close plan');
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'close-status' } });
  });
  test.each(INTENTS.filter(item => (item.operation === 'review' || item.operation === 'submit') && ['SubmitDealRequest', 'ReviewDealApproval'].indexOf(item.key) < 0))('$key reviews actual edited values, explicitly confirms, receipts and resets', async definition => {
    await render(definition.key);
    const workflow = workflowFor(definition.key, resolveScope({}));
    if (!workflow) throw new Error('Missing workflow');
    const editable = workflow.fields.find(item => !item.options && !item.numeric);
    if (!editable) throw new Error('Missing business input');
    await set(editable.label, 'Reviewed business value');
    await click('Review draft');
    expect(container.textContent).toContain('Reviewed business value');
    const confirm = `Confirm session ${definition.operation === 'review' ? 'decision' : 'draft'}`;
    expect(button(confirm).disabled).toBe(true);
    expect(latest().workflowStage).toBe('review');
    await render(definition.key, {}, 'fullscreen', 'dark');
    expect(latest().workflowStage).toBe('review');
    expect(container.textContent).toContain('Reviewed business value');
    await act(async () => {
      const checkbox = container.querySelector('[aria-label="Specialist business experience"] input[type="checkbox"]');
      if (!(checkbox instanceof HTMLInputElement)) throw new Error('Missing explicit confirmation');
      checkbox.click();
    });
    expect(button(confirm).disabled).toBe(false);
    await click(confirm);
    expect(container.textContent).toContain('Session receipt ZDR-SESSION-');
    expect(container.textContent).toContain('Reviewed business value');
    expect(latest().workflowStage).toBe('receipt');
    expect(latest().draft).toEqual({ ...initialDraft(workflow), [editable.name]: 'Reviewed business value' });
    await click('Reset draft');
    expect(latest().workflowStage).toBe('draft');
    expect(latest().draft).toEqual(initialDraft(workflow));
  });
  test.each([
    ['QualifyOpportunity', 'Qualification decision', 'Pursue', 'Decline pursuit'],
    ['ReviewDealException', 'Exception decision', 'Approve exception', 'Decline exception'],
    ['InspectForecastCommit', 'Forecast recommendation', 'Retain commit', 'Remove from period'],
    ['ReviewProposalReadiness', 'Readiness decision', 'Ready for customer', 'Decline release']
  ] satisfies [RevenueIntentKey, string, string, string][])('%s blocks unauthorized positive decisions but permits decline/return', async (key, label, blocked, safe) => {
    await render(key);
    await set(label, blocked);
    expect(button('Review draft').disabled).toBe(true);
    expect(container.textContent).toContain('Missing independent buyer proof');
    await set(label, safe);
    expect(button('Review draft').disabled).toBe(false);
  });
  test('all five commercial inputs change actual calculations; validation never silently clamps', async () => {
    await render('SimulateCommercialOffer', { quantity: 100, termMonths: 12, discount: 0, services: 0, probability: 0.5 });
    expect(container.textContent).toContain('$145,000');
    expect(container.textContent).toContain('78.0%');
    await set('Contract term (months)', '36');
    expect(container.textContent).toContain('$435,000');
    await set('Licensed users', '200');
    expect(container.textContent).toContain('$870,000');
    await set('Discount percent', '20');
    expect(container.textContent).toContain('$696,000');
    expect(container.textContent).toContain('Executive committee');
    await set('Services (USD)', '100000');
    expect(container.textContent).toContain('$796,000');
    await set('Win probability (0–1)', '0.25');
    expect(container.textContent).toContain('$199,000');
    await render('SimulateCommercialOffer', { quantity: 100, termMonths: 12, discount: 0, services: 0, probability: 0.5 }, 'fullscreen', 'dark');
    expect(latest().commercial).toMatchObject({ inputs: { termMonths: '36', probability: '0.25' } });
    await set('Discount percent', '101');
    expect(container.textContent).toContain('Discount percent must be 0–100');
    expect(latest().commercial).toMatchObject({ result: null });
    await click('Reset scenario');
    expect(latest().commercial).toMatchObject({ inputs: { termMonths: '12', probability: '0.5', discount: '0' } });
  });
  test.each([
    ['BuildAccountBrief', { accountId: 'unrecognized' }],
    ['GetDealRisk', { opportunityId: 'unrecognized' }],
    ['PrepareCustomerMeeting', { meetingId: 'unrecognized' }],
    ['ReviewProposalReadiness', { proposalId: 'unrecognized' }],
    ['ReviewDealException', { exceptionId: 'unrecognized' }]
  ] satisfies [RevenueIntentKey, IRevenueProperties][])('%s publishes unknown IDs as no-match without hero UI', async (key, properties) => {
    await render(key, properties, 'fullscreen');
    expect(container.textContent).toContain('No matching business scope');
    expect(container.textContent).not.toContain('Illustrative Contoso role workspace');
    expect(latest().workflowStage).toBe('no-match');
    expect(latest().resolvedScope).toBeNull();
    expect(latest().visibleRecords).toEqual([]);
    expect(latest().selectedEntityId).toContain('unrecognized');
  });
  test('known account and related IDs resolve alternate records, and conflicting scopes stop', async () => {
    await render('BuildAccountBrief', { accountId: 'ACC-002' }, 'fullscreen');
    expect(container.textContent).toContain('Global Account 02');
    expect(container.textContent).not.toContain('Global rollout confirmed');
    await render('PrepareCustomerMeeting', { meetingId: 'MTG-2043' });
    expect(container.textContent).toContain('Global Account 02 discovery');
    expect(latest().resolvedScope).toMatchObject({ opportunityId: 'ZDR-2043' });
    await render('ReviewProposalReadiness', { proposalId: 'PROP-2043' });
    expect(container.textContent).toContain('PROP-2043');
    await render('ReviewDealException', { exceptionId: 'EX-2043' });
    expect(container.textContent).toContain('Net 90');
    await render('GetDealRisk', { accountId: 'ACC-002', opportunityId: 'ZDR-2042' });
    expect(container.textContent).toContain('Account and opportunity scopes conflict');
  });
  test('selection persists across passive renders, mode and theme; fresh property invocation resets it', async () => {
    await render('GetDealRisk', { selectedId: 'EV-03' });
    await click('Inspect EV-05');
    expect(latest().selection).toBe('EV-05');
    await render('GetDealRisk', { selectedId: 'EV-03' }, 'fullscreen', 'dark');
    expect(latest().selection).toBe('EV-05');
    expect(latest().referenceWorkspace).toBeNull();
    expect(contextRecord(latest().workspaceState)).toMatchObject({ lens: 'deal-room', task: 'GetDealRisk' });
    await click('Inspect EV-04');
    expect(latest().selection).toBe('EV-04');
    await click('Revenue Command');
    expect(contextRecord(latest().workspaceState)).toMatchObject({ lens: 'revenue-command', view: 'workspace-home' });
    expect(latest().selectedEntityId).toBe('');
    await click('Deal Room');
    await click('Resume Deal risk / ZDR-2042');
    expect(latest().selection).toBe('EV-04');
    await render('GetDealRisk', { selectedId: 'unrecognized' });
    expect(container.textContent).toContain('No visible record matches unrecognized');
    expect(latest().workflowStage).toBe('no-match');
    await click('Clear selection');
    expect(latest().workflowStage).toBe('analysis');
  });
  test('filters and search change real records; filtered selections are never silently replaced', async () => {
    await render('ExplorePipelineQuality', { period: 'current', region: 'EMEA' });
    const first = contextRecord(contextRecord(latest().inlineStage).chart).items;
    await set('Region', 'all');
    await click('Show scoped view');
    expect(contextRecord(contextRecord(latest().inlineStage).chart).items).not.toEqual(first);
    await render('ExplorePipelineQuality', { period: 'current', region: 'all', selectedId: 'ZDR-2042' });
    await set('Quarter scope', 'next');
    expect(container.textContent).toContain('No visible record matches ZDR-2042');
    expect(latest().period).toBe('next');
    await render('ExplorePipelineQuality', { period: 'invalid' });
    expect(latest().visibleRecords).toEqual([]);
    await render('DiscoverAccountOpportunity', { accountId: 'CONTOSO', period: 'all', region: 'North America' });
    expect(contextRecord(contextRecord(latest().countryMap).scopedTotals).opportunityCount).toBe(2);
    await render('ExploreAgentCapabilities', { query: 'commercial' });
    expect(container.textContent).toContain('Commercial scenario');
    expect(container.textContent).not.toContain('20 matching scenarios');
    await set('Search revenue scenarios', 'no-such-scenario');
    expect(container.textContent).toContain('0 matching scenarios');
    await render('TrackMeetingFollowUp');
    await set('Commitment status', 'blocked');
    expect(latest().visibleRecords).toHaveLength(1);
    expect(await menuDisabled('Ask Copilot about this deal')).toBe(false);
    expect(container.textContent).toContain('Economic sponsor review');
  });
  test('context transport failure is visible and follow-up uses actual scope', async () => {
    publish.mockRejectedValueOnce(new Error('bridge unavailable'));
    await render('GetDealRisk', { opportunityId: 'ZDR-2043' });
    expect(container.textContent).toContain('Visible context could not be shared');
    await click('Ask Copilot about this deal');
    expect(followUp).toHaveBeenCalledWith(expect.stringContaining('Global Account 02 ZDR-2043'), expect.objectContaining({ resolvedScope: expect.objectContaining({ opportunityId: 'ZDR-2043' }), discussion: expect.objectContaining({ actionId: 'discuss-visible' }) }));
  });
  test('meeting updates require the exact supporting customer commitment', async () => {
    await render('ReviewMeetingCommitments');
    await set('Reconciliation decision', 'Accept supported commitment');
    expect(button('Review draft').disabled).toBe(false);
    await set('Proposed customer commitment', 'CFO approved funding');
    expect(button('Review draft').disabled).toBe(true);
    expect(container.textContent).toContain('no supporting transcript or email');
    await set('Reconciliation decision', 'Reject proposed update');
    expect(button('Review draft').disabled).toBe(false);
  });
  test('value sensitivity, dependency thresholds and required fields bind calculations and validation', async () => {
    await render('BuildValueCase');
    await set('Realized adoption percent', '50');
    expect(container.textContent).toContain('Scenario annual benefit $510,000');
    expect(container.textContent).toContain('12.4 months');
    await set('Annual hours saved', '0');
    expect(container.textContent).toContain('payback not reached');
    await set('Customer validation owner', '');
    expect(button('Review draft').disabled).toBe(true);
    await render('BuildMutualActionPlan');
    await set('Target signature in days', '20');
    expect(button('Review draft').disabled).toBe(true);
    await set('Target signature in days', '28');
    expect(container.textContent).toContain('dependency slack 7d');
    expect(button('Review draft').disabled).toBe(false);
  });
  test('fresh invocation resets business drafts but property order alone is passive', async () => {
    await render('BuildValueCase', { opportunityId: 'ZDR-2042', accountId: 'CONTOSO' });
    await set('Annual hours saved', '8000');
    await render('BuildValueCase', { accountId: 'CONTOSO', opportunityId: 'ZDR-2042' }, 'fullscreen', 'dark');
    expect(latest().draft).toMatchObject({ hours: '8000' });
    await render('BuildValueCase', { opportunityId: 'ZDR-2043' });
    expect(latest().draft).toMatchObject({ hours: '12000', owner: '' });
    expect(container.textContent).not.toContain('Nestor Wilke');
  });
  test('commercial empty and out-of-range values suppress results rather than showing NaN', async () => {
    await render('SimulateCommercialOffer', { termMonths: 0, probability: 72 });
    expect(latest().commercial).toMatchObject({ result: null });
    expect(container.textContent).toContain('Contract term (months) must be 1–120');
    await set('Contract term (months)', '');
    expect(container.textContent).toContain('Contract term (months) is required');
    expect(container.textContent).not.toContain('NaN');
  });
  test('unmount and fresh root discard session receipts and drafts', async () => {
    await render('ShapeSolutionProposal');
    await set('Customer outcome', 'Session-only custom outcome');
    await act(async () => root.unmount());
    root = createRoot(container);
    await render('ShapeSolutionProposal');
    expect(latest().draft).toMatchObject({ outcome: '18-country operating model' });
    expect(container.textContent).not.toContain('Session-only custom outcome');
  });
  test('annual ramp prompt arrays and edited schedules materially alter the actual offer', async () => {
    await render('SimulateCommercialOffer', { quantity: 100, termMonths: 36, services: 0, discount: 0, probability: 0.5, ramp: [60, 80, 100] });
    expect(container.textContent).toContain('$348,000');
    await set('Annual licensed ramp percent (comma-separated)', '100, 100, 100');
    expect(container.textContent).toContain('$435,000');
    await set('Annual licensed ramp percent (comma-separated)', '50, 100');
    expect(latest().commercial).toMatchObject({ result: null });
    await click('Reset scenario');
    expect(container.textContent).toContain('$348,000');
  });

  async function check(label: string): Promise<void> {
    const element = Array.from(container.querySelectorAll('label')).find(item => item.textContent?.indexOf(label) === 0);
    const input = document.getElementById(element?.htmlFor || '');
    if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox') throw new Error(`Missing checkbox: ${label}`);
    await act(async () => { if (!input.checked) input.click(); });
  }
  test('suggested discussion captures edited economics and selection; rejection is visible and retryable', async () => {
    await render('SimulateCommercialOffer');
    await set('Discount percent', '18');
    followUp.mockResolvedValueOnce(false);
    await click('Explain these economics');
    expect(followUp.mock.calls[0][1].commercial).toMatchObject({ inputs: { discount: '18' } });
    expect(followUp.mock.calls[0][1].discussion).toMatchObject({ actionId: 'discuss-details', handoff: null });
    expect(container.textContent).toContain('Copilot did not accept');
    await click('Explain these economics');
    expect(container.textContent).toContain('Sent to Copilot with the visible discussion context');
  });
  test('attention catalog drills into one exact deal and restores its catalog and ranking controls', async () => {
    await render('ExploreDealAttention', {}, 'inline');
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'attention-value-proof-map' } });
    await click('Show ranked deals');
    const rows = latest().visibleRecords;
    if (!Array.isArray(rows) || !rows.length) throw new Error('Missing attention candidates');
    const selected = contextRecord(rows[0]);
    if (typeof selected.id !== 'string') throw new Error('Missing deal identity');
    await click(`Details for ${selected.id}`);
    expect(container.querySelector('[aria-label="Selected deal details"]')).not.toBeNull();
    expect(container.textContent).not.toContain('Important deals / attention catalog');
    expect(document.activeElement?.textContent).toBe(selected.title);
    expect(latest().selectedRecord).toMatchObject({ id: selected.id, opportunity: { id: selected.id } });
    expect(latest().attention).toMatchObject({ view: 'deal-detail', displayedCount: 1 });
    expect(latest().visibleRecords).toHaveLength(1);
    expect(latest().displayMode).toBe('inline');
    await click('Back to attention catalog');
    expect(latest().selection).toBe('');
    expect(document.activeElement?.textContent).toBe('Important deals / attention catalog');
    await click('Rank by seller-unweighted value');
    expect(latest().attention).toMatchObject({ measure: 'exposure', view: 'catalog' });
    expect(await menuDisabled('Continue: Deal risk')).toBe(true);
  });
  test('selected attention detail carries its exact record into both risk and buyer-coverage handoffs', async () => {
    await render('ExploreDealAttention', { selectedId: 'ZDR-2072' }, 'inline');
    expect(latest().selectedRecord).toMatchObject({ id: 'ZDR-2072', opportunity: { id: 'ZDR-2072' } });
    await click('Continue: Deal risk');
    expect(followUp.mock.calls[0][1].discussion).toMatchObject({ handoff: { intent: 'GetDealRisk', properties: { opportunityId: 'ZDR-2072' } } });
    await click('Discuss buyer coverage with Copilot');
    expect(followUp.mock.calls[1][1].discussion).toMatchObject({ handoff: { intent: 'MapBuyingCommittee', properties: { opportunityId: 'ZDR-2072' } } });
  });
  test('inline primary submission reviews exact fields and hands the confirmed approval back to priorities', async () => {
    await render('SubmitDealRequest', {}, 'inline');
    expect(contextRecord(latest().inlineDealWorkflow).view).toBe('deal-intake');
    expect(latest().inlineDealWorkflow).toMatchObject({ step: 0, formStep: 'Deal story', visibleFields: ['accountId', 'title', 'outcome', 'owner'] });
    await set('Deal name (5-120 characters)', 'Inline accountable growth deal');
    await click('Continue');
    await set('Discount percent', '8');
    await click('Continue');
    await check('Security review evidence is ready');
    await check('Economic sponsor evidence is ready');
    await click('Review deal request');
    expect(button('Submit deal request').disabled).toBe(true);
    await click('Next values');
    await click('Next values');
    await click('Check my submission');
    expect(followUp.mock.calls[0][1].inlineDealWorkflow).toMatchObject({ stage: 'review', step: 3, formStep: 'Exact-value review and confirmation', draft: { title: 'Inline accountable growth deal', discount: '8' }, confirmed: false });
    await check('I reviewed this request and confirm submission');
    await click('Submit deal request');
    const requestId = contextRecord(latest().inlineDealWorkflow).receiptId;
    if (typeof requestId !== 'string') throw new Error('Missing submission receipt');
    expect(container.textContent).toContain(`${requestId}-SUBMIT`);
    await click(`Continue with Copilot: Deal approvals · ${requestId}`);
    expect(followUp.mock.calls[1][1].discussion).toMatchObject({ handoff: { intent: 'ReviewDealApproval', properties: { requestId } } });
    await render('ReviewDealApproval', { requestId }, 'inline');
    expect(latest().inlineDealWorkflow).toMatchObject({ selectedId: requestId, selectedRequest: { id: requestId, draft: { title: 'Inline accountable growth deal', discount: '8' } } });
    await click('Decision');
    await set('Reviewer role', 'Sales manager');
    await set('Decision rationale (15-1,000 characters)', 'Independent sponsor and security evidence reviewed.');
    expect(button('Approve review stage').disabled).toBe(true);
    await check('I reviewed the evidence and confirm this decision');
    await click('Approve review stage');
    expect(container.textContent).toContain(`${requestId}-A1`);
    expect(contextRecord(latest().inlineDealWorkflow).selectedRequest).toMatchObject({ id: requestId, status: 'approved' });
    expect(latest().displayMode).toBe('inline');
    await click(`Continue with Copilot: My priorities · ${requestId}`);
    expect(followUp.mock.calls[2][1]).toMatchObject({
      inlineDealWorkflow: { receiptId: requestId, selectedRequest: { id: requestId, status: 'approved' } },
      discussion: { handoff: { intent: 'GetMyRevenuePriorities', properties: { period: 'current', region: 'all' } } }
    });
  });
  test('inline primary refreshes priorities after an approved stage without approving outstanding independent stages', async () => {
    const request = getDealStore().submit({ ...newDealDraft(), securityReady: true, sponsorReady: true }, true);
    await render('ReviewDealApproval', { requestId: request.id }, 'inline');
    await click('Decision');
    await set('Reviewer role', 'Sales manager');
    await set('Decision rationale (15-1,000 characters)', 'Independent buyer and security evidence reviewed.');
    expect(container.querySelector('[data-copilot-action="primary"]')?.textContent).toContain(`Discuss ${request.id} / Decision`);
    await check('I reviewed the evidence and confirm this decision');
    expect(container.querySelector('[data-copilot-action="primary"]')?.textContent).toContain(`Discuss ${request.id} / Decision`);
    await click('Approve review stage');
    expect(contextRecord(latest().inlineDealWorkflow).selectedRequest).toMatchObject({ id: request.id, status: 'pending' });
    await click(`Continue with Copilot: My priorities · ${request.id}`);
    expect(followUp.mock.calls[0][1].discussion).toMatchObject({ handoff: { intent: 'GetMyRevenuePriorities', properties: { period: 'current', region: 'all' } } });
    expect(getDealStore().getSnapshot().requests.find(item => item.id === request.id)).toMatchObject({ status: 'pending', events: [{ role: 'Sales manager', decision: 'approved' }] });
  });
  test.each([
    ['returned', 'Return request'],
    ['rejected', 'Reject request']
  ])('inline primary keeps request discussion after a confirmed %s decision', async (decision, action) => {
    await render('ReviewDealApproval', { requestId: 'ZM-1001' }, 'inline');
    await click('Decision');
    await set('Reviewer role', 'Commercial director');
    await set('Proposed decision', decision);
    await set('Decision rationale (15-1,000 characters)', 'Independent review identified corrections to the request.');
    await check('I reviewed the evidence and confirm this decision');
    await click(action);
    expect(container.querySelector('[data-copilot-action="primary"]')?.textContent).toBe('Continue with Copilot: Discuss ZM-1001 / Decision trail · ZM-1001');
    expect(contextRecord(latest().inlineDealWorkflow).selectedRequest).toMatchObject({ status: decision });
  });
  test('unknown approval requests remain unmatched and never select a seeded substitute', async () => {
    await render('ReviewDealApproval', { requestId: 'ZM-unknown' }, 'inline');
    expect(container.textContent).toContain('No request matches ZM-unknown');
    expect(latest().workflowStage).toBe('no-match');
    expect(contextRecord(latest().inlineDealWorkflow).selectedRequest).toBeUndefined();
    expect(await menuDisabled('Continue: Deals needing attention')).toBe(true);
  });
  test.each(['Clear selection', 'Back to attention catalog'])('unavailable attention selection uses explicit recovery through %s without substituting a deal', async recovery => {
    await render('ExploreDealAttention', { selectedId: 'ZDR-missing' }, 'inline');
    expect(container.querySelector('[aria-label="Unavailable deal selection"]')).not.toBeNull();
    expect(container.textContent).not.toContain('Important deals / attention catalog');
    expect(container.querySelector('[aria-label="Deal attention value chart"]')).toBeNull();
    expect(latest()).toMatchObject({
      selectedEntityId: 'ZDR-missing', selection: 'ZDR-missing', workflowStage: 'no-match',
      visibleRecords: [], visibleRecordCount: 0, selectedRecord: null,
      inlineStage: { label: 'Unavailable selection', page: 1, pageCount: 1, visibleFields: ['selectedId'], chart: null },
      attention: { view: 'unavailable-selection', catalogSummary: [], displayedCount: 0 }
    });
    const primary = container.querySelector<HTMLButtonElement>('[data-copilot-action="primary"]');
    expect(primary?.disabled).toBe(true);
    expect(primary?.textContent).toContain('ZDR-missing');
    await act(async () => primary?.click());
    expect(followUp).not.toHaveBeenCalled();
    expect(await menuDisabled('Continue: Deal risk')).toBe(true);
    await render('ExploreDealAttention', { selectedId: 'ZDR-missing' }, 'fullscreen');
    expect(container.textContent).toContain('Important deals / attention catalog');
    expect(latest().selection).toBe('ZDR-missing');
    await render('ExploreDealAttention', { selectedId: 'ZDR-missing' }, 'inline', 'dark');
    expect(latest().inlineStage).toMatchObject({ label: 'Unavailable selection' });
    await click(recovery);
    expect(latest().workflowStage).toBe('analysis');
    expect(latest().selection).toBe('');
    expect(latest().visibleRecords).toHaveLength(0);
    expect(latest().inlineStage).toMatchObject({ chart: { kind: 'attention-value-proof-map' } });
    expect(container.textContent).toContain('Important deals / attention catalog');
    expect(container.querySelector<HTMLButtonElement>('[data-copilot-action="primary"]')?.disabled).toBe(false);
    await click('Show ranked deals');
    expect(latest().visibleRecords).toHaveLength(2);
  });
  test('compact long submission review preserves exact input values and all three reviewed-page gates', async () => {
    const title = 'Contoso validated global expansion '.repeat(4).slice(0, 120);
    const outcome = 'Roll out validated capabilities with accountable sponsor and security evidence. '.repeat(13).slice(0, 1000);
    await render('SubmitDealRequest', {}, 'inline');
    await set('Deal name (5-120 characters)', title);
    await set('Business outcome (20-1,000 characters)', outcome);
    await click('Continue');
    await click('Continue');
    await check('Security review evidence is ready');
    await check('Economic sponsor evidence is ready');
    await click('Review deal request');
    for (let page = 1; page <= 3; page++) {
      if (page > 1) await click('Next values');
      expect(container.textContent).toContain(title);
      expect(latest().inlineDealWorkflow).toMatchObject({ draft: { title, outcome }, page, pageCount: 3 });
      expect(button('Submit deal request').disabled).toBe(true);
    }
    expect(latest().inlineDealWorkflow).toMatchObject({ reviewedValuePages: [1, 2, 3] });
    await check('I reviewed this request and confirm submission');
    await click('Submit deal request');
    const receiptId = contextRecord(latest().inlineDealWorkflow).receiptId;
    expect(getDealStore().getSnapshot().requests.find(item => item.id === receiptId)?.draft).toMatchObject({ title, outcome });
  });
  test('attention rankings use exact catalog values and disclose recorded evidence gaps', () => {
    const byValue = attentionDeals(OPPORTUNITIES, 'value');
    const byExposure = attentionDeals(OPPORTUNITIES, 'exposure');
    expect(byValue[0].opportunity.value).toBe(Math.max(...OPPORTUNITIES.map(item => item.value)));
    expect(byExposure[0].exposure).toBe(Math.max(...OPPORTUNITIES.map(item => item.value * (1 - item.probability))));
    expect(byValue.find(item => item.id === 'ZDR-2042')?.flags).toEqual(['Contrary buyer evidence', 'Stale source assumptions']);
    expect(byValue.find(item => item.id === 'ZDR-2043')?.flags).toContain('No recorded verified buyer evidence');
  });
  test('capability cards open the clicked component directly without a preceding preview selection', async () => {
    await render('ExploreAgentCapabilities', { query: 'submit' });
    expect(latest().selection).toBe('');
    await click('Open Submit a deal in Copilot');
    expect(followUp).toHaveBeenCalledTimes(1);
    expect(followUp.mock.calls[0][1]).toMatchObject({
      selection: 'SubmitDealRequest', selectedEntityId: 'SubmitDealRequest', query: 'submit',
      selectedRecord: { id: 'SubmitDealRequest' },
      discussion: { handoff: { intent: 'SubmitDealRequest', properties: {} } }
    });
  });
  test('a capability launch rejection stays visible and can be retried from the same card', async () => {
    await render('ExploreAgentCapabilities', { query: 'priorities' });
    followUp.mockResolvedValueOnce(false);
    await click('Open My priorities in Copilot');
    expect(container.textContent).toContain('Copilot did not accept');
    await click('Open My priorities in Copilot');
    expect(followUp).toHaveBeenCalledTimes(2);
    expect(followUp.mock.calls[1][1].discussion).toMatchObject({ handoff: { intent: 'GetMyRevenuePriorities' } });
  });
  test('personal priorities publish owned-book status and scope their actionable links to the exact deal', async () => {
    await render('GetMyRevenuePriorities');
    expect(latest().personalPriorities).toMatchObject({ bookOwner: 'Megan Bowen', metrics: { open: 18537260, milestoneCount: 5, completedMilestones: 1 } });
    expect(latest().personalPriorities).toMatchObject({ semantics: expect.stringContaining('not a query of the signed-in user') });
    await click('Map Contoso buyers in Copilot');
    expect(followUp.mock.calls[0][1]).toMatchObject({
      selectedEntityId: 'ZDR-2042-buyers', selection: 'ZDR-2042',
      discussion: { handoff: { intent: 'MapBuyingCommittee', properties: { opportunityId: 'ZDR-2042' } } }
    });
    await set('Region', 'EMEA');
    expect(latest().personalPriorities).toMatchObject({ metrics: { open: 2569000 } });
  });
  test('commercial handoff prefills exact full-license values while submission still requires review', async () => {
    await render('SimulateCommercialOffer', { opportunityId: 'ZDR-2042', quantity: 1000, termMonths: 24, discount: 8, services: 150000, probability: 0.65 });
    await click('Submit this deal for review');
    const context = followUp.mock.calls[0][1];
    const properties = contextRecord(contextRecord(context.discussion).handoff).properties;
    expect(properties).toEqual({ accountId: 'CONTOSO', opportunityId: 'ZDR-2042', quantity: 1000, termMonths: 24, discount: 8, services: 150000, probability: 0.65 });
    await render('SubmitDealRequest', { accountId: 'CONTOSO', opportunityId: 'ZDR-2042', quantity: 1000, termMonths: 24, discount: 8, services: 150000, probability: 0.65 });
    expect(latest().inlineDealWorkflow).toMatchObject({ step: 0, confirmed: false, draft: { title: 'Contoso Global Expansion', quantity: '1000', termMonths: '24', discount: '8', services: '150000', probability: '0.65', outcome: '' } });
    await set('Business outcome (20-1,000 characters)', 'Roll out validated capabilities across 18 countries with independent review.');
    expect(latest().inlineDealWorkflow).toMatchObject({ economics: { contractValue: 2818000 } });
  });
  test('annual-ramp scenarios cannot silently drop the ramp when starting guided intake', async () => {
    await render('SimulateCommercialOffer', { termMonths: 36, ramp: [60, 80, 100] });
    expect(await menuDisabled('Submit this deal for review')).toBe(true);
    expect(container.textContent).toContain('Guided intake uses full licensing');
  });
});
