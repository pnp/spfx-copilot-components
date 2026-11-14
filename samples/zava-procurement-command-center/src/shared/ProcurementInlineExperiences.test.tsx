import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ProcurementApp, { type IModelContextSnapshot } from './ProcurementApp';
import ProcurementThemeProvider from './ProcurementThemeProvider';
import { getIntent, INTENTS, type IProcurementProperties, type ProcurementIntentKey } from './catalog';
import { getPurchaseDecision, getPurchaseQueue, getReceipts, resetProcurementSession } from './operations';

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
  const render = (intent: ProcurementIntentKey, properties: IProcurementProperties = {}, mode = 'inline', theme = 'light', publish?: (snapshot: IModelContextSnapshot) => Promise<void>): void => {
    act(() => root.render(<ProcurementThemeProvider theme={theme} targetDocument={document}><ProcurementApp definition={getIntent(intent)} properties={properties} currentUserName="Megan Bowen" displayMode={mode} onUpdateModelContext={publish} /></ProcurementThemeProvider>));
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
    click(`Review ${id}`);
    expect(container.textContent).toContain('$230,000');
    expect(container.textContent).toContain('Local support required');
    change('Decision rationale', 'Local support and budget evidence verified');
    click('Review approve request');
    expect(container.querySelector('[data-workflow-stage="review"]')?.textContent).toContain('Equip the Austin service team');
    click('Confirm session-only approve request');
    expect(getPurchaseDecision(id)?.result).toBe('approved');
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
});
