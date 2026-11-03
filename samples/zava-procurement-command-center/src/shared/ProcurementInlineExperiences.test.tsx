import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ProcurementApp, { type IModelContextSnapshot } from './ProcurementApp';
import ProcurementThemeProvider from './ProcurementThemeProvider';
import { getIntent, INTENTS, type IProcurementProperties, type ProcurementIntentKey } from './catalog';
import { getPurchaseDecision, getPurchaseQueue, getReceipts, resetProcurementSession } from './operations';
import { getFullscreenDestination } from './fullscreen';
import type { SendProcurementFollowUp } from './CopilotContinuation';

const anchors: Record<ProcurementIntentKey, string> = {
  CreatePurchaseIntent: 'Business outcome', CompareBuyingOptions: 'Fulfillment alternatives',
  CheckPurchasePolicy: 'Policy evidence and remediation', ReviewPurchaseRequest: 'Demand and commitment evidence',
  AggregateDemand: 'Source requests in this cohort', BuildSourcingEvent: 'Bid deadline',
  CompareSupplierBids: 'Exact supplier comparison', ReviewSupplierAward: 'Primary award share',
  ExploreSupplier360: 'Connected obligations and owners', ReviewContractRenewal: 'Notice window',
  DetectSpendLeakage: 'Addressable leakage, not realized savings', TrackSupplierRisk: 'Dependency and continuity exposure',
  ResolveInvoiceException: 'Three-way reconciliation', ExploreSpendPerformance: 'Opportunity to verified value',
  OnboardSupplier: 'Supplier legal name', ReviewSupplierQualification: 'Qualification evidence, not an award',
  PlanSupplierRiskMitigation: 'Activation trigger', NegotiateContractTerms: 'What we must get / protect',
  ManagePurchaseOrderChange: 'Before and after commitment', TrackLeakageRecovery: 'Intervention evidence trail',
  ExploreSupplierPortfolioBalance: 'allocation scenario', ExploreAgentCapabilities: 'Search procurement scenarios'
};

describe('intent-specific procurement experiences', () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (intent: ProcurementIntentKey, properties: IProcurementProperties = {}, mode = 'inline', theme = 'light', publish?: (snapshot: IModelContextSnapshot) => Promise<void>, send?: SendProcurementFollowUp, expand?: () => Promise<void>): void => {
    act(() => root.render(<ProcurementThemeProvider theme={theme} targetDocument={document}><ProcurementApp definition={getIntent(intent)} properties={properties} currentUserName="Megan Bowen" displayMode={mode} onUpdateModelContext={publish} onSendFollowUp={send} onRequestFullscreen={expand} /></ProcurementThemeProvider>));
  };
  const button = (text: string): HTMLButtonElement => {
    const found = Array.from(container.querySelectorAll('button')).find(element => element.textContent?.trim() === text);
    if (!found) throw new Error(`Missing button: ${text}`);
    return found;
  };
  const click = (text: string): void => { act(() => button(text).click()); };
  const field = (label: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => {
    const owner = Array.from(container.querySelectorAll('label')).find(element => element.textContent?.startsWith(label));
    const input = owner?.control || owner?.querySelector('input,select,textarea');
    if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLSelectElement) && !(input instanceof HTMLTextAreaElement)) throw new Error(`Missing field: ${label}`);
    return input;
  };
  const change = (label: string, value: string): void => {
    const input = field(label);
    const prototype = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (!setter) throw new Error(`Missing native value setter: ${label}`);
      setter.call(input, value);
      input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
    });
  };
  beforeEach(() => {
    resetProcurementSession();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  test.each(INTENTS.map(intent => intent.key))('%s owns a purpose-specific business surface', intent => {
    render(intent);
    expect(container.textContent).toContain(anchors[intent]);
    expect(container.textContent).not.toContain('working note');
    expect(container.querySelectorAll('[data-experience]')).toHaveLength(1);
    expect(getReceipts()).toHaveLength(0);
  });
  test.each(INTENTS.map(intent => intent.key))('%s exposes only bounded, described tool properties', async intent => {
    const folder = intent[0].toLowerCase() + intent.slice(1);
    const module: { default: { type: string; properties: Record<string, { description?: string }> } } = await import(/* webpackChunkName: 'procurement-test-schemas' */ `../copilotComponents/${folder}/${intent}CopilotComponentProperties`);
    const schema = module.default;
    expect(schema.type).toBe('object');
    expect(Object.keys(schema.properties).length).toBeLessThanOrEqual(8);
    expect(Object.keys(schema.properties).every(name => Boolean(schema.properties[name].description))).toBe(true);
    for (const name of Object.keys(schema.properties)) {
      for (const keyword of ['minimum', 'maximum', 'minLength', 'maxLength', 'maxItems']) expect(schema.properties[name]).not.toHaveProperty(keyword);
    }
  });
  test('prefills purchase inputs but requires separate review and confirmation', () => {
    render('CreatePurchaseIntent', { outcome: 'Equip the northern field team', quantity: 900, budget: 1500000, locations: ['Helsinki'], neededBy: '2026-12-10' });
    expect(field('Quantity').value).toBe('900');
    expect(field('Delivery locations').value).toBe('Helsinki');
    change('Quantity', '750');
    click('Review create purchase intent');
    expect(container.textContent).toContain('750');
    expect(getReceipts()).toHaveLength(0);
    click('Confirm session-only create purchase intent');
    expect(getReceipts()).toHaveLength(1);
    expect(container.textContent).toContain('ZPC-SESSION-0001');
    expect(container.textContent).toContain('No external system was changed');
    click('Reset draft');
    expect(field('Quantity').value).toBe('900');
  });
  const workflows: readonly { intent: ProcurementIntentKey; action: string; properties?: IProcurementProperties; attest?: boolean }[] = [
    { intent: 'CreatePurchaseIntent', action: 'create purchase intent' },
    { intent: 'ReviewPurchaseRequest', action: 'approve request' },
    { intent: 'BuildSourcingEvent', action: 'create sourcing event draft' },
    { intent: 'ReviewSupplierAward', action: 'approve split award' },
    { intent: 'ReviewContractRenewal', action: 'renew with conditions' },
    { intent: 'ResolveInvoiceException', action: 'request corrected invoice' },
    { intent: 'OnboardSupplier', action: 'submit supplier candidate', properties: { supplierName: 'North Coast Devices' }, attest: true },
    { intent: 'ReviewSupplierQualification', action: 'qualify with conditions' },
    { intent: 'PlanSupplierRiskMitigation', action: 'submit mitigation plan' },
    { intent: 'NegotiateContractTerms', action: 'save negotiation mandate' },
    { intent: 'ManagePurchaseOrderChange', action: 'approve po change' },
    { intent: 'TrackLeakageRecovery', action: 'accept verified recovery' }
  ];
  test.each(workflows)('$intent confirms only after an explicit domain review', scenario => {
    render(scenario.intent, { conditionText: 'Source evidence and authority reviewed', ...scenario.properties });
    if (scenario.attest) act(() => container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(checkbox => checkbox.click()));
    expect(button(`Review ${scenario.action}`).disabled).toBe(false);
    click(`Review ${scenario.action}`);
    expect(getReceipts()).toHaveLength(0);
    expect(container.querySelector('[data-workflow-stage]')?.getAttribute('data-workflow-stage')).toBe('review');
    click(`Confirm session-only ${scenario.action}`);
    expect(getReceipts()).toHaveLength(1);
    expect(getReceipts()[0].intent).toBe(scenario.intent);
    expect(container.querySelector('[aria-label="Session receipt"]')).not.toBeNull();
  });
  test('rejects empty quantities and impossible dates with visible errors', () => {
    render('CreatePurchaseIntent');
    change('Quantity', '');
    expect(button('Review create purchase intent').disabled).toBe(true);
    expect(container.textContent).toContain('whole number');
    change('Quantity', '600');
    change('Needed by', '2026-11-31');
    expect(button('Review create purchase intent').disabled).toBe(true);
    expect(getReceipts()).toHaveLength(0);
  });
  test('preserves edited drafts across theme and display mode but resets for a fresh invocation', () => {
    const properties = { quantity: 600, budget: 1200000 };
    render('CreatePurchaseIntent', properties);
    change('Quantity', '740');
    render('CreatePurchaseIntent', { budget: 1200000, quantity: 600 }, 'fullscreen', 'dark');
    expect(field('Quantity').value).toBe('740');
    render('CreatePurchaseIntent', { quantity: 800, budget: 1200000 });
    expect(field('Quantity').value).toBe('800');
  });
  test('protects an edited draft when a workspace action opens another task', () => {
    render('CreatePurchaseIntent', {}, 'fullscreen');
    change('Quantity', '740');
    click('Back to My Requests');
    click('Review ZPC-REQ-1001');
    expect(document.body.textContent).toContain('Discard unconfirmed draft?');
    const dialogButton = (label: string): HTMLButtonElement => {
      const found = Array.from(document.body.querySelectorAll('button')).find(element => element.textContent?.trim() === label);
      if (!found) throw new Error(`Missing dialog action: ${label}`);
      return found;
    };
    act(() => dialogButton('Keep current draft').click());
    expect(field('Quantity').value).toBe('740');
    click('Review ZPC-REQ-1001');
    act(() => dialogButton('Discard draft and open task').click());
    expect(container.querySelector('[data-experience]')?.getAttribute('data-experience')).toBe('ReviewPurchaseRequest');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Current procurement task');
    expect(getReceipts()).toHaveLength(0);
  });
  test('does not let a prompt budget grant additional PO authority', () => {
    render('ManagePurchaseOrderChange', { purchaseOrderId: 'ZPC-PO-4108', quantity: 1200, budget: 5000000, conditionText: 'Requesting a larger device rollout' });
    expect(button('Review approve po change').disabled).toBe(true);
    expect(container.textContent).toContain('exceeds the supplied authority cap');
    expect(getReceipts()).toHaveLength(0);
  });
  test('permits an explicit rejection without granting approval authority', () => {
    render('ReviewSupplierAward', { splitPercent: 75, conditionText: 'Concentration exceeds the allowed approval authority' });
    expect(button('Review approve split award').disabled).toBe(true);
    change('Decision', 'Decline award');
    expect(button('Review decline award').disabled).toBe(false);
    render('ManagePurchaseOrderChange', { quantity: 1200, conditionText: 'The proposed commitment exceeds available authority' });
    expect(button('Review approve po change').disabled).toBe(true);
    change('Decision', 'Decline PO change');
    expect(button('Review decline po change').disabled).toBe(false);
    expect(getReceipts()).toHaveLength(0);
  });
  test('compares actual request routes and preserves unknown request identifiers', () => {
    render('CompareBuyingOptions', { requestId: 'ZPC-REQ-1001' });
    change('Units needed', '700');
    expect(container.textContent).toContain('€1,206,333');
    render('CompareBuyingOptions', { requestId: 'ZPC-REQ-UNKNOWN' });
    expect(container.textContent).toContain('No record matches');
    expect(container.textContent).not.toContain('Qualified supplier; current contract');
  });
  test('keeps unknown records as designed no-match states', () => {
    render('ReviewSupplierAward', { eventId: 'ZPC-RFP-UNKNOWN' });
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('No record matches');
    expect(container.textContent).not.toContain('Primary award share');
    expect(getReceipts()).toHaveLength(0);
  });
  test.each(['TrackSupplierRisk', 'ResolveInvoiceException', 'CompareSupplierBids'] as const)('%s publishes no-match rather than stale or healthy context for unknown records', intent => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render(intent, { supplierId: 'UNKNOWN-SUPPLIER', invoiceId: 'UNKNOWN-INVOICE', eventId: 'UNKNOWN-EVENT' }, 'inline', 'light', publish);
    expect(publish).toHaveBeenCalled();
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot.stage).toBe('no-match');
    expect(snapshot.summary).not.toContain('exposure 0/100');
    expect(snapshot.selectedId).toContain('UNKNOWN');
  });
  test('enforces concentration and rationale before an award decision', () => {
    render('ReviewSupplierAward', { eventId: 'ZPC-RFP-31', splitPercent: 75 });
    change('Decision rationale', 'Dual source evidence reviewed');
    expect(button('Review approve split award').disabled).toBe(true);
    expect(container.textContent).toContain('exceeds this sample authority');
    change('Primary award share', '65');
    expect(button('Review approve split award').disabled).toBe(false);
    click('Review approve split award');
    expect(getReceipts()).toHaveLength(0);
    click('Confirm session-only approve split award');
    expect(getReceipts()[0].recordId).toBe('ZPC-RFP-31');
    expect(getReceipts()[0].summary).toContain('Contoso Mobility 35%');
  });
  test('marks reviewed requests and does not silently process a second decision', () => {
    render('ReviewPurchaseRequest', { requestId: 'ZPC-REQ-1001', conditionText: 'Budget and competitive evidence reviewed' });
    click('Review approve request');
    click('Confirm session-only approve request');
    expect(container.textContent).toContain('processed in session');
    click('Reset draft');
    expect(button('Review approve request').disabled).toBe(true);
    expect(getReceipts()).toHaveLength(1);
  });
  test('exposes the exact invoice variance and never offers payment release', () => {
    render('ResolveInvoiceException', { invoiceId: 'ZPC-8831', conditionText: 'Disputed freight requires supplier correction' });
    expect(container.textContent).toContain('€15,000');
    expect(container.querySelector('select')?.textContent).not.toContain('Release payment');
    click('Review request corrected invoice');
    click('Confirm session-only request corrected invoice');
    expect(getReceipts()[0].summary).toContain('Unmatched amount: €15,000');
  });
  test('requires all supplier intake attestations before creating a candidate', () => {
    render('OnboardSupplier', { supplierName: 'North Coast Devices', country: 'Finland', category: 'IT hardware' });
    expect(button('Review submit supplier candidate').disabled).toBe(true);
    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(3);
    act(() => { checkboxes.forEach(checkbox => checkbox.click()); });
    expect(button('Review submit supplier candidate').disabled).toBe(false);
    expect(getReceipts()).toHaveLength(0);
  });
  test('materially changes regional exposure, value and portfolio calculations', () => {
    render('TrackSupplierRisk', { supplierId: 'ZPC-SUP-001' });
    expect(container.querySelector('progress')?.value).toBe(44);
    change('Continuity scenario', 'Port disruption');
    expect(container.querySelector('progress')?.value).toBe(66);
    render('ExploreSpendPerformance', { category: 'IT hardware' });
    expect(container.textContent).toContain('€99,000');
    change('Value period', 'Previous period');
    expect(container.textContent).toContain('€79,200');
    render('ExploreSupplierPortfolioBalance', { concentrationLimit: 34 });
    expect(Array.from(container.querySelectorAll('progress')).map(progress => progress.value)).toEqual([34, 33, 33]);
  });
  test('searches and previews the owning component without allowing confirmation', () => {
    render('ExploreAgentCapabilities', { query: 'invoice' });
    click('Preview resolve invoice exception');
    expect(container.textContent).toContain('Safe preview');
    change('Decision rationale', 'Freight discrepancy needs correction');
    click('Review request corrected invoice');
    expect(button('Confirm session-only request corrected invoice').disabled).toBe(true);
    expect(getReceipts()).toHaveLength(0);
  });
  test('submits a business case then reviews the exact submitted currency and evidence', () => {
    render('CreatePurchaseIntent', { outcome: 'Equip the Austin service team', quantity: 120, budget: 230000, currency: 'USD', locations: ['Austin'], constraints: ['Local support required'] }, 'fullscreen');
    click('Review create purchase intent');
    click('Confirm session-only create purchase intent');
    const id = getPurchaseQueue()[0].id;
    expect(container.textContent).toContain(id);
    click('Back to My Requests');
    click(`Review ${id}`);
    expect(container.textContent).toContain('$230,000');
    expect(container.textContent).toContain('Local support required');
    change('Decision rationale', 'Local support and budget evidence verified');
    click('Review approve request');
    expect(container.querySelector('[data-workflow-stage="review"]')?.textContent).toContain('Equip the Austin service team');
    click('Confirm session-only approve request');
    expect(getPurchaseDecision(id)?.result).toBe('approved');
    click('Back to My Requests');
    change('Request status', 'Approved');
    expect(container.querySelector('[aria-label="My Requests dashboard"]')?.textContent).toContain(id);
    expect(getReceipts()).toHaveLength(2);
  });
  test('regional selection changes investment data, chart paths and model context together', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('ExploreSpendPerformance', {}, 'fullscreen', 'light', publish);
    const initial = container.querySelector('[data-chart="commitment-trend"]')?.innerHTML;
    const scope = container.querySelector('[data-workspace="spend-command"]');
    expect(scope?.textContent).toContain('€7,800,000');
    click('APAC');
    expect(scope?.textContent).toContain('€1,520,000');
    expect(scope?.textContent).toContain('No verified savings evidence');
    expect(container.querySelector('[data-chart="commitment-trend"]')?.innerHTML).not.toBe(initial);
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot).toMatchObject({ workspace: 'spend-command', filters: { region: 'APAC' }, selectedId: 'APAC' });
    expect(snapshot.visibleIds).toEqual(['ZPC-INV-03', 'ZPC-INV-07']);
  });
  test('an approved custom split updates the investment commitment but not delivery', () => {
    render('ReviewSupplierAward', { splitPercent: 60, conditionText: 'Continuity capacity and authority verified' }, 'fullscreen');
    click('Review approve split award');
    click('Confirm session-only approve split award');
    expect(getReceipts()[0].commitment).toBe(1059600);
    click('Spend Command');
    const scope = container.querySelector('[data-workspace="spend-command"]');
    expect(scope?.textContent).toContain('€6,295,600');
    expect(scope?.textContent).toContain('Award approved / not delivered');
  });
  test('draft snapshots do not expose unreviewed business text', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('CreatePurchaseIntent', { outcome: 'Private business text awaiting human review' }, 'inline', 'light', publish);
    expect(JSON.stringify(publish.mock.calls)).not.toContain('Private business text');
    click('Review create purchase intent');
    expect(JSON.stringify(publish.mock.calls)).toContain('Private business text');
  });
  test('a changed split redraws the award geometry and invalid input shows no healthy chart', () => {
    render('ReviewSupplierAward', { conditionText: 'Evidence and authority have been reviewed' });
    const before = container.querySelector('[data-chart="award-allocation"] path')?.getAttribute('d');
    change('Primary award share', '60');
    expect(container.querySelector('[data-chart="award-allocation"] path')?.getAttribute('d')).not.toBe(before);
    change('Primary award share', '49');
    expect(container.querySelector('[data-chart="award-allocation"]')).toBeNull();
    expect(button('Review approve split award').disabled).toBe(true);
    expect(container.textContent).toContain('Primary share must be between 50% and 85%');
  });
  test('initial investment scope honors prompt regions and exposes unsupported regions', () => {
    render('ExploreSpendPerformance', { region: 'APAC' }, 'fullscreen');
    expect(container.querySelector('[data-workspace="spend-command"]')?.textContent).toContain('€1,520,000');
    render('ExploreSpendPerformance', { region: 'Mars' }, 'fullscreen');
    expect(container.textContent).toContain('No investment region matches Mars');
    expect(container.querySelector('[data-chart="global-investment-map"]')).toBeNull();
  });
  test.each(INTENTS.map(intent => intent.key))('%s publishes an activation snapshot and exposes deliberate continuation without sending automatically', intent => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    const send = jest.fn<Promise<boolean>, [string, IModelContextSnapshot]>(() => Promise.resolve(true));
    render(intent, {}, 'inline', 'light', publish, send);
    expect(publish).toHaveBeenCalled();
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot).toMatchObject({ intent, route: getIntent(intent).route, displayMode: 'inline' });
    expect(snapshot.visuals?.length).toBeGreaterThan(0);
    expect(snapshot.availableActions?.length).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll('[data-copilot-continuation]')).toHaveLength(1);
    expect(send).not.toHaveBeenCalled();
  });
  test.each(INTENTS.map(intent => intent.key))('%s expands to its specific full-screen destination with business context, not origin UI', async intent => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    const expand = jest.fn<Promise<void>, []>(() => Promise.resolve());
    render(intent, {}, 'inline', 'light', publish, undefined, expand);
    const destination = getFullscreenDestination(intent);
    await act(async () => { button(`Open ${destination.title.toLowerCase()}`).click(); });
    expect(expand).toHaveBeenCalledTimes(1);
    render(intent, {}, 'fullscreen', 'dark', publish);
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot.route).toBe(destination.route);
    expect(container.querySelector('[data-procurement-content]')?.getAttribute('data-fullscreen-route')).toBe(destination.route);
    expect(container.querySelector('h1')?.textContent).toBe(destination.title);
    expect(container.textContent).not.toContain('came from');
    expect(container.textContent).not.toContain('Focused Copilot task');
    if (destination.view === 'task') {
      expect(container.querySelector(`[aria-label="${destination.title} context"]`)?.textContent).toContain(destination.boundary);
      expect(snapshot.fullScreenView).toBe(destination.title);
    }
  });
  test('captures changed bid evidence at click time, suppresses duplicate sends and preserves later edits', async () => {
    let acknowledge: ((accepted: boolean) => void) | undefined;
    const send = jest.fn<Promise<boolean>, [string, IModelContextSnapshot]>(() => new Promise(resolve => { acknowledge = resolve; }));
    render('CompareSupplierBids', { eventId: 'ZPC-RFP-31' }, 'inline', 'light', undefined, send);
    change('Risk weight', '35');
    const continuation = button('Continue with Copilot: Review supplier award');
    act(() => { continuation.click(); continuation.click(); });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][1]).toMatchObject({
      scope: { eventId: 'ZPC-RFP-31', riskWeight: 35 }, weights: { risk: 35, price: 13 },
      discussion: { responseMode: 'component', handoff: { tool: 'ReviewSupplierAwardTool', properties: { eventId: 'ZPC-RFP-31' } } }
    });
    expect(continuation.disabled).toBe(true);
    change('Risk weight', '40');
    await act(async () => { if (!acknowledge) throw new Error('Missing acknowledgement.'); acknowledge(true); });
    expect(field('Risk weight').value).toBe('40');
    expect(send.mock.calls[0][1].scope?.riskWeight).toBe(35);
  });
  test('keeps full-screen summaries text-only and excludes a mounted hidden draft', async () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    const send = jest.fn<Promise<boolean>, [string, IModelContextSnapshot]>(() => Promise.resolve(true));
    render('CreatePurchaseIntent', { outcome: 'Private draft text not yet reviewed' }, 'fullscreen', 'light', publish, send);
    change('Quantity', '740');
    click('Spend Command');
    click('APAC');
    await act(async () => { button('Continue with Copilot: Summary & next steps').click(); });
    const captured = send.mock.calls[0][1];
    expect(captured).toMatchObject({ intent: 'ExploreSpendPerformance', selectedId: 'APAC', filters: { region: 'APAC' }, discussion: { responseMode: 'text' } });
    expect(captured.discussion?.handoff).toBeUndefined();
    expect(JSON.stringify(captured)).not.toContain('Private draft text');
    expect(captured.focusedTask).toBeUndefined();
    expect(captured.workflow).toBeUndefined();
    click('My Requests');
    click('Open business case studio');
    expect(field('Quantity').value).toBe('740');
  });
  test('shows rejected and thrown follow-up errors, permits retry and never records an action', async () => {
    const send = jest.fn<Promise<boolean>, [string, IModelContextSnapshot]>().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('Bridge offline')).mockResolvedValue(true);
    render('TrackSupplierRisk', {}, 'inline', 'light', undefined, send);
    const continuation = (): HTMLButtonElement => button('Continue with Copilot: Plan risk mitigation');
    await act(async () => { continuation().click(); });
    expect(container.textContent).toContain('did not accept');
    await act(async () => { continuation().click(); });
    expect(container.textContent).toContain('Bridge offline');
    await act(async () => { continuation().click(); });
    expect(container.textContent).toContain('Message accepted');
    expect(getReceipts()).toHaveLength(0);
  });
  test('launches the capability actually clicked with its own context and registered tool', async () => {
    const send = jest.fn<Promise<boolean>, [string, IModelContextSnapshot]>(() => Promise.resolve(true));
    render('ExploreAgentCapabilities', { query: 'invoice' }, 'inline', 'light', undefined, send);
    await act(async () => { button('Open resolve invoice exception in Copilot').click(); });
    expect(send.mock.calls[0][1]).toMatchObject({ selectedId: 'ResolveInvoiceException', discussion: { handoff: { tool: 'ResolveInvoiceExceptionTool', properties: {} } } });
  });
  test('publishes the selected Sankey evidence and materially changed map measure', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('ExploreSpendPerformance', {}, 'inline', 'light', publish);
    const ribbon = container.querySelector<SVGElement>('[aria-label="Off-contract device spend to Contracted / unverified: €17,000"]');
    expect(ribbon).not.toBeNull();
    act(() => { ribbon?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    let snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot).toMatchObject({ selectedId: 'ZPC-LEAK-01:contracted', selectedEvidence: { value: 17000, opportunityId: 'ZPC-LEAK-01' } });
    render('ExploreSpendPerformance', {}, 'fullscreen', 'light', publish);
    const before = container.querySelector('[data-chart="global-investment-map"]')?.innerHTML;
    click('Committed footprint');
    expect(container.querySelector('[data-chart="global-investment-map"]')?.innerHTML).not.toBe(before);
    snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot.filters?.mapMetric).toBe('committed');
    expect(snapshot.mapValues).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'ZPC-INV-01', value: 0 })]));
  });
  test('publishes actual award arithmetic in Draft without publishing the unreviewed rationale', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('ReviewSupplierAward', { splitPercent: 60, conditionText: 'Private draft rationale awaiting review' }, 'inline', 'light', publish);
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot.proposedCalculations).toMatchObject({ primaryShare: 60, secondaryShare: 40, awardCostEUR: 1059600, primaryAuthorityLimit: 70 });
    expect(JSON.stringify(snapshot)).not.toContain('Private draft rationale');
  });
  test('shows passive context failure with retry while leaving the business draft usable', async () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>().mockRejectedValueOnce(new Error('Context unavailable')).mockResolvedValue(undefined);
    await act(async () => { render('CreatePurchaseIntent', {}, 'inline', 'light', publish); });
    expect(container.textContent).toContain('Context unavailable');
    expect(field('Quantity').value).toBe('600');
    await act(async () => { button('Retry sharing this view').click(); });
    expect(container.textContent).not.toContain('Context unavailable');
    expect(getReceipts()).toHaveLength(0);
  });
  test.each([
    { intent: 'TrackSupplierRisk' as const, properties: { supplierId: 'UNKNOWN' }, omitted: 'scenarioArithmetic' },
    { intent: 'ExploreSupplierPortfolioBalance' as const, properties: { concentrationLimit: 99 }, omitted: 'scenarioArithmetic' },
    { intent: 'ExploreSpendPerformance' as const, properties: { period: 'Unknown quarter' }, omitted: 'flowTotals' },
    { intent: 'CompareSupplierBids' as const, properties: { riskWeight: 99 }, omitted: 'weights' },
    { intent: 'CompareBuyingOptions' as const, properties: { requestId: 'UNKNOWN' }, omitted: undefined },
    { intent: 'CheckPurchasePolicy' as const, properties: { requestId: 'UNKNOWN' }, omitted: undefined }
  ])('$intent never publishes healthy default arithmetic for invalid or unknown scope', ({ intent, properties, omitted }) => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render(intent, properties, 'inline', 'light', publish);
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(['no-match', 'input-error']).toContain(snapshot.stage);
    if (omitted) expect(snapshot[omitted]).toBeUndefined();
    expect(snapshot.visibleRecords || []).toEqual([]);
    if (intent === 'CompareBuyingOptions') {
      expect(snapshot.filters?.budget).toBeUndefined();
      expect(snapshot.scope?.budget).toBeUndefined();
    }
    if (intent === 'CheckPurchasePolicy') {
      expect(snapshot.summary).not.toContain('0 EUR');
      expect(snapshot.filters?.amount).toBeUndefined();
    }
  });
  test('an empty demand query does not invent a source cohort or offer event creation', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('AggregateDemand', { region: 'APAC', currency: 'EUR' }, 'inline', 'light', publish);
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot).toMatchObject({ stage: 'no-match', resultCount: 0 });
    expect(snapshot.scope?.cohortId).toBeUndefined();
    expect(container.textContent).toContain('Continue with Copilot: Resolve the evidence gap');
  });
  test('a cleared numeric draft reports not evaluated and absent rather than serializing NaN as a valid value', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('CreatePurchaseIntent', {}, 'inline', 'light', publish);
    change('Quantity', '');
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot.proposedCalculations).toMatchObject({ quantity: 'Not evaluated' });
    expect(snapshot.workflow).toMatchObject({ fields: expect.arrayContaining([{ label: 'Quantity', present: false }]) });
    expect(button('Review create purchase intent').disabled).toBe(true);
  });
  test('an unknown investment region publishes neither hidden map amounts nor zero financial totals', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('ExploreSpendPerformance', { region: 'Mars' }, 'fullscreen', 'light', publish);
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot).toMatchObject({ stage: 'no-match', selectedId: 'Mars', mapValues: [], visibleRecords: [] });
    expect(snapshot.flowTotals).toBeUndefined();
    expect(snapshot.summary).toContain('no investment or value amounts were evaluated');
    expect(snapshot.summary).not.toContain('EUR 0');
  });
  test('an unsupported value period remains visibly selected and can be corrected without losing investment context', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('ExploreSpendPerformance', { period: 'Next quarter' }, 'fullscreen', 'light', publish);
    expect(field('Portfolio value period').value).toBe('Next quarter');
    expect(container.textContent).toContain('Next quarter (unsupported)');
    expect(container.textContent).toContain('Not evaluated');
    let snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot.flowTotals).toBeUndefined();
    expect(snapshot.summary).toContain('planned EUR 7800000');
    change('Portfolio value period', 'Current period');
    snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot.flowTotals).toMatchObject({ verified: 186000 });
  });
  test('program actions use linked evidence and location selection is reversible', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('ExploreSpendPerformance', {}, 'fullscreen', 'light', publish);
    click('Inspect Singapore');
    expect(publish.mock.calls[publish.mock.calls.length - 1][0].selectedProgram).toMatchObject({ id: 'ZPC-INV-03' });
    click('Clear location selection');
    expect(publish.mock.calls[publish.mock.calls.length - 1][0].selectedProgram).toBeUndefined();
    expect(container.textContent).toContain('Supplier dependency not linked');
    expect(container.textContent).not.toContain('Inspect corridor risk');
    click('APAC');
    expect(Array.from(container.querySelectorAll('button')).some(element => element.textContent === 'Reconcile held invoice ZPC-8831')).toBe(false);
    expect(publish.mock.calls[publish.mock.calls.length - 1][0].flowTotals).toBeUndefined();
    expect(container.textContent).toContain('No linked evidence');
  });
  test('an unknown supplier selection describes the valid event landscape without claiming it was not evaluated', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('CompareSupplierBids', { supplierId: 'UNKNOWN' }, 'inline', 'light', publish);
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot).toMatchObject({ stage: 'no-match', selectedId: 'UNKNOWN', resultCount: 4 });
    expect(snapshot.summary).toContain('four received bids remain visible');
    expect(snapshot.summary).not.toContain('no bid evidence was evaluated');
    expect(snapshot.visibleRecords).toHaveLength(4);
  });
  test('unsupported continuity scope preserves the visibly selected supplier without inventing a dependency selection', () => {
    const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
    render('TrackSupplierRisk', { supplierId: 'ZPC-SUP-001', scenario: 'Unknown scenario' }, 'inline', 'light', publish);
    const snapshot = publish.mock.calls[publish.mock.calls.length - 1][0];
    expect(snapshot).toMatchObject({ selectedLabel: 'Fabrikam Devices', stage: 'no-match' });
    expect(snapshot.filters?.dependency).toBeUndefined();
    expect(snapshot.visuals).toEqual(['Supplier and continuity-scope validation']);
    expect(snapshot.scenarioArithmetic).toBeUndefined();
  });
});
