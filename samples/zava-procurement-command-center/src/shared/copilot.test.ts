jest.mock('@microsoft/sp-copilot-component', () => ({ createCopilotTextContent: (text: string) => ({ type: 'text', text }) }));

import { getIntent, INTENTS, type ProcurementIntentKey } from './catalog';
import { getCopilotActions } from './copilot';
import { FULLSCREEN_DESTINATIONS, getFullscreenDestination } from './fullscreen';
import { createModelContext, MAX_CONTEXT_BYTES, modelContextBytes, type IProcurementSnapshot } from './modelContext';

const snapshot = (intent: ProcurementIntentKey): IProcurementSnapshot => ({
  intent, route: getIntent(intent).route, stage: 'inspect', selectedId: 'ZPC-SUP-001', summary: 'Visible selected evidence',
  scope: { requestId: 'ZPC-REQ-1001', eventId: 'ZPC-RFP-31', supplierId: 'ZPC-SUP-001', contractId: 'ZPC-CON-101', opportunityId: 'ZPC-LEAK-01', category: 'IT hardware', region: 'EMEA', period: 'Current period' }
});

describe('specific full-screen routes and deliberate conversation contracts', () => {
  test('owns exactly one explicit business destination per immutable component', () => {
    expect(FULLSCREEN_DESTINATIONS).toHaveLength(22);
    expect(new Set(FULLSCREEN_DESTINATIONS.map(item => item.intent)).size).toBe(22);
    expect(new Set(FULLSCREEN_DESTINATIONS.map(item => item.route)).size).toBe(22);
    expect(new Set(FULLSCREEN_DESTINATIONS.map(item => item.title)).size).toBe(22);
    for (const intent of INTENTS) {
      const destination = getFullscreenDestination(intent.key);
      expect(destination.route).toBe(intent.route);
      expect(destination.summary.length).toBeGreaterThan(50);
      expect(destination.boundary.length).toBeGreaterThan(40);
    }
  });
  test.each(INTENTS.map(intent => intent.key))('%s full-screen continuation is text, never an unsolicited new card', intent => {
    const action = getCopilotActions(getIntent(intent), snapshot(intent), true).primary;
    expect(action.handoff).toBeUndefined();
    expect(action.prompt).toContain('Do not call tools');
    expect(action.prompt).toContain('100 words');
  });
  test.each(INTENTS.map(intent => intent.key))('%s inline handoff names one registered tool and uses only its supported properties', async intent => {
    const action = getCopilotActions(getIntent(intent), snapshot(intent)).primary;
    if (!action.handoff) { expect(action.prompt).toContain('Do not call tools'); return; }
    const target = INTENTS.find(item => `${item.key}Tool` === action.handoff?.tool);
    expect(target).toBeDefined();
    if (!target) throw new Error('Unregistered continuation target.');
    const folder = target.key[0].toLowerCase() + target.key.slice(1);
    const module: { default: { properties: Record<string, unknown> } } = await import(/* webpackChunkName: 'procurement-continuation-schemas' */ `../copilotComponents/${folder}/${target.key}CopilotComponentProperties`);
    expect(Object.keys(action.handoff.properties).every(key => key in module.default.properties)).toBe(true);
    expect(action.prompt).toContain(`exactly ${target.key}Tool`);
  });
  test('requires a real submission receipt before offering that new request review', () => {
    const draft = { ...snapshot('CreatePurchaseIntent'), stage: 'draft', scope: {} };
    expect(getCopilotActions(getIntent('CreatePurchaseIntent'), draft).primary.handoff).toBeUndefined();
    const receipt = { ...draft, stage: 'receipt', scope: { requestId: 'ZPC-REQ-SESSION-7' } };
    expect(getCopilotActions(getIntent('CreatePurchaseIntent'), receipt).primary.handoff).toEqual({ tool: 'ReviewPurchaseRequestTool', properties: { requestId: 'ZPC-REQ-SESSION-7' } });
  });
  test('unknown scope and intake drafts never manufacture related operational records', () => {
    for (const intent of ['CompareSupplierBids', 'TrackSupplierRisk', 'DetectSpendLeakage'] as const) {
      expect(getCopilotActions(getIntent(intent), { ...snapshot(intent), scope: {} }).primary.handoff).toBeUndefined();
      expect(getCopilotActions(getIntent(intent), { ...snapshot(intent), stage: 'no-match' }).primary.handoff).toBeUndefined();
    }
    for (const intent of ['OnboardSupplier', 'BuildSourcingEvent'] as const) expect(getCopilotActions(getIntent(intent), snapshot(intent)).primary.handoff).toBeUndefined();
  });
});

describe('complete UTF-8 model context budget', () => {
  test('grounds a normal snapshot with truthful provenance', () => {
    const context = createModelContext(snapshot('TrackSupplierRisk'));
    expect(context.structuredContent).toMatchObject({ selectedId: 'ZPC-SUP-001', provenance: { externalWrites: false } });
    expect(modelContextBytes(context)).toBeLessThanOrEqual(MAX_CONTEXT_BYTES);
  });
  test('bounds arrays and multibyte text without dropping essential scope or handoff', () => {
    const handoff = { tool: 'TrackSupplierRiskTool', properties: { supplierId: 'ZPC-SUP-001' } };
    const state: IProcurementSnapshot = {
      ...snapshot('TrackSupplierRisk'), resultCount: 400,
      visibleRecords: Array.from({ length: 400 }, (_, index) => ({ id: index, text: '\u20ac'.repeat(3000) })),
      summary: '\u20ac'.repeat(5000), discussion: { topic: 'Challenge the risk', responseMode: 'component', handoff }
    };
    const context = createModelContext(state);
    expect(modelContextBytes(context)).toBeLessThanOrEqual(MAX_CONTEXT_BYTES);
    expect(context.structuredContent).toMatchObject({ selectedId: state.selectedId, scope: state.scope, resultCount: 400, discussion: { handoff }, contextBudget: { originalVisibleRecordCount: 400 } });
    expect(JSON.stringify(context)).toContain('omittedPaths');
  });
  test('blocks a message whose essential scope cannot fit rather than silently truncating its ID', () => {
    expect(() => createModelContext({ ...snapshot('TrackSupplierRisk'), selectedId: 'X'.repeat(12000) })).toThrow('10,000-byte');
  });
});
