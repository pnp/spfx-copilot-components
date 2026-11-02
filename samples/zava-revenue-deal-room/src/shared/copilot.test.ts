jest.mock('@microsoft/sp-copilot-component', () => ({
  createCopilotTextContent: (text: string) => ({ type: 'text', text })
}));
import { getIntent, INTENTS } from './catalog';
import { contextRecord, createCopilotSummary, getCopilotActions } from './copilot';
import { createModelContext, MAX_CONTEXT_BYTES, modelContextBytes } from './modelContext';
import type { IModelContextSnapshot } from './RevenueApp';
import { revenueFlow, type RevenueFlowKind } from './flows';

const snapshot = (extra: Readonly<Record<string, unknown>> = {}): IModelContextSnapshot => ({
  intent: 'GetDealRisk', displayMode: 'inline', route: 'deal-room/risks',
  selectedEntityId: 'EV-05', workflowStage: 'analysis', summary: 'Contoso ZDR-2042 / selected security risk',
  availableActions: ['Inspect EV-05'], resolvedScope: { accountId: 'CONTOSO', opportunityId: 'ZDR-2042' },
  scopeLabel: 'Contoso ZDR-2042', selection: 'EV-05', ...extra
});

describe('bounded Copilot discussion and component handoffs', () => {
  test('workspace summaries request text only without a handoff, even when the visible scope needs recovery', () => {
    const action = createCopilotSummary(getIntent('SimulateCommercialOffer'), snapshot({
      displayMode: 'fullscreen', workflowStage: 'no-match', scopeLabel: 'Requested ZDR-UNKNOWN',
      validationErrors: ['No matching opportunity']
    }));
    expect(action.label).toBe('Summary & next steps');
    expect(action.handoff).toBeUndefined();
    expect(action.disabledReason).toBeUndefined();
    expect(action.prompt).toContain('text-only summary in chat');
    expect(action.prompt).toContain('Requested ZDR-UNKNOWN');
    expect(action.prompt).toContain('Do not call tools');
    expect(action.prompt).toContain('unconfirmed edits');
  });
  test.each(['pipeline', 'approval'] satisfies RevenueFlowKind[])('%s value-flow context retains the complete planning graph within the full 10KB payload', kind => {
    const flow = revenueFlow(kind, 'all', 'all');
    const payload = createModelContext(snapshot({
      intent: kind === 'pipeline' ? 'ExplorePipelineFlow' : 'ExploreApprovalFlow', scopeLabel: 'Regional planning flow',
      resolvedScope: kind === 'pipeline' ? { period: 'all', region: 'all' } : { requestId: 'ZM-1001', requestLevelReview: true },
      revenueFlow: flow, inlineStage: { label: 'Sankey', chart: { kind: 'sankey', dataPath: 'revenueFlow' } }
    }));
    expect(modelContextBytes(payload)).toBeLessThanOrEqual(MAX_CONTEXT_BYTES);
    const shared = contextRecord(contextRecord(payload.structuredContent).revenueFlow);
    expect(shared.nodes).toHaveLength(10);
    expect(shared.links).toHaveLength(flow.links.length);
    expect(shared.total).toBe(flow.total);
    expect(shared.semantics).toContain('Offline USD');
  });
  test.each(INTENTS)('$key offers discussion, a topic-specific question and a registered next component', definition => {
    const actions = getCopilotActions(definition, snapshot({ intent: definition.key, selection: '' }));
    expect(actions.length).toBeGreaterThanOrEqual(3);
    expect(new Set(actions.map(action => action.id)).size).toBe(actions.length);
    expect(actions[0].prompt).toContain('No CRM writes');
    expect(actions[1].prompt).toContain('edited values and discussion topic');
    actions.forEach(action => {
      expect(`${action.label} ${action.prompt} ${action.disabledReason || ''}`).not.toMatch(/\b(?:sample|example|demo|fictional|imaginary)\b/i);
    });
    const target = actions.find(action => action.handoff)?.handoff?.intent;
    expect(INTENTS.some(item => item.key === target)).toBe(true);
  });
  test('handoffs use the selected portfolio deal, not the default Contoso scope', () => {
    const state = snapshot({ intent: 'ExploreDealAttention', selection: 'ZDR-2043', period: 'next', region: 'EMEA' });
    const actions = getCopilotActions(getIntent('ExploreDealAttention'), state);
    expect(actions.find(action => action.handoff?.intent === 'GetDealRisk')?.handoff?.properties).toEqual({ opportunityId: 'ZDR-2043' });
    expect(actions.find(action => action.handoff?.intent === 'MapBuyingCommittee')?.handoff?.properties).toEqual({ opportunityId: 'ZDR-2043' });
    expect(actions.find(action => action.handoff?.intent === 'InspectForecastCommit')?.handoff?.properties).toEqual({ opportunityId: 'ZDR-2043' });
    expect(actions.find(action => action.handoff?.intent === 'SimulateCommercialOffer')?.handoff?.properties).toEqual({ opportunityId: 'ZDR-2043', probability: 0.4 });
  });
  test('pipeline continuation opens the exact selected attention detail while retaining portfolio filters', () => {
    const action = getCopilotActions(getIntent('ExplorePipelineQuality'), snapshot({
      intent: 'ExplorePipelineQuality', selection: 'ZDR-2043', period: 'next', region: 'EMEA'
    }))[2];
    expect(action.handoff).toEqual({ intent: 'ExploreDealAttention', properties: { selectedId: 'ZDR-2043', period: 'next', region: 'EMEA' } });
  });
  test('unmatched selections and invalid commercial inputs disable handoffs, not discussion', () => {
    const unmatched = getCopilotActions(getIntent('GetDealRisk'), snapshot({ workflowStage: 'no-match' }));
    expect(unmatched[0].disabledReason).toBeUndefined();
    expect(unmatched[2].disabledReason).toContain('unmatched');
    const commercial = getCopilotActions(getIntent('SimulateCommercialOffer'), snapshot({ intent: 'SimulateCommercialOffer', validationErrors: ['Invalid quantity'] }));
    expect(commercial[2].disabledReason).toContain('commercial inputs');
  });
  test('submission hands the exact receipt to approval; an unsubmitted draft cannot enter approval', () => {
    const definition = getIntent('SubmitDealRequest');
    expect(getCopilotActions(definition, snapshot({ intent: 'SubmitDealRequest', inlineDealWorkflow: { selectedId: 'ZM-1001' } }))[2].disabledReason).toContain('Submit');
    const action = getCopilotActions(definition, snapshot({ intent: 'SubmitDealRequest', inlineDealWorkflow: { receiptId: 'ZM-1003', selectedId: 'ZM-1003' } }))[2];
    expect(action.disabledReason).toBeUndefined();
    expect(action.handoff).toEqual({ intent: 'ReviewDealApproval', properties: { requestId: 'ZM-1003' } });
  });
  test('a capability preview opens only the explicitly selected registered tool', () => {
    const action = getCopilotActions(getIntent('ExploreAgentCapabilities'), snapshot({
      intent: 'ExploreAgentCapabilities', selection: 'SubmitDealRequest', query: 'submission'
    }))[2];
    expect(action.handoff?.intent).toBe('SubmitDealRequest');
    expect(action.disabledReason).toBeUndefined();
    expect(action.prompt).toContain('calling SubmitDealRequest');
  });
  test('the exact 10,000-byte full context payload is accepted unchanged; one byte over is compacted', () => {
    const state = snapshot({ padding: '' });
    const baseBytes = modelContextBytes(createModelContext(state));
    const exact = { ...state, padding: 'x'.repeat(MAX_CONTEXT_BYTES - baseBytes) };
    expect(modelContextBytes(createModelContext(exact))).toBe(MAX_CONTEXT_BYTES);
    expect(createModelContext(exact).structuredContent).toBe(exact);
    const over = createModelContext({ ...exact, padding: `${exact.padding}x` });
    expect(modelContextBytes(over)).toBeLessThanOrEqual(MAX_CONTEXT_BYTES);
    expect(contextRecord(over.structuredContent).contextBudget).toMatchObject({ limitBytes: MAX_CONTEXT_BYTES, originalBytes: MAX_CONTEXT_BYTES + 1 });
  });
  test('large Unicode views preserve selection, routing, edited values and explicit omission metadata', () => {
    const state = snapshot({
      selectedRecord: { id: 'EV-05', detail: '\u6f22\ud83d\ude42'.repeat(6000) },
      visibleRecords: Array.from({ length: 120 }, (_, index) => ({ id: `row-${index}`, detail: 'Source facts '.repeat(80) })),
      visibleRecordCount: 120, draft: { owner: 'Megan Bowen', days: '28' },
      discussion: { actionId: 'open-BuildMutualActionPlan', responseMode: 'component', handoff: { intent: 'BuildMutualActionPlan', properties: { opportunityId: 'ZDR-2042' } } }
    });
    const payload = createModelContext(state);
    expect(modelContextBytes(payload)).toBeLessThanOrEqual(MAX_CONTEXT_BYTES);
    const bounded = contextRecord(payload.structuredContent);
    expect(bounded.selectedEntityId).toBe('EV-05');
    expect(bounded.selectedRecord).toMatchObject({ id: 'EV-05' });
    expect(bounded.draft).toEqual({ owner: 'Megan Bowen', days: '28' });
    expect(bounded.discussion).toEqual(state.discussion);
    expect(bounded.visibleRecordCount).toBe(120);
    expect(contextRecord(bounded.contextBudget).omittedPathCount).toBeGreaterThan(0);
  });
  test('irreducibly oversized context fails explicitly instead of sending an oversized payload', () => {
    const large: Record<string, unknown> = {};
    for (let index = 0; index < 2000; index++) large[`field-${index}`] = 'value';
    expect(() => createModelContext(snapshot({ large }))).toThrow('10,000-byte');
  });
});
