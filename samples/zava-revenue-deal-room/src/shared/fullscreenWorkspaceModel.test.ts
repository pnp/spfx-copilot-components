import { INTENTS, getIntent } from './catalog';
import { SEEDED_REQUESTS } from './dealWorkflow';
import { fullscreenLensFor, fullscreenNextAction, fullscreenRelatedTasks, fullscreenTask, fullscreenTaskContext, FULLSCREEN_STORIES } from './fullscreenWorkspaceModel';
import type { IModelContextSnapshot } from './RevenueApp';

describe('four fullscreen workspace contracts', () => {
  test('all 27 stable components map to a defined business workspace', () => {
    expect(INTENTS).toHaveLength(27);
    INTENTS.forEach(definition => expect(FULLSCREEN_STORIES[fullscreenLensFor(definition)].goal.length).toBeGreaterThan(30));
    expect(fullscreenLensFor(getIntent('PlanCustomerSuccessHandoff'))).toBe('deal-room');
    expect(fullscreenLensFor(getIntent('ExplorePipelineFlow'))).toBe('revenue-command');
    expect(fullscreenLensFor(getIntent('ExploreApprovalFlow'))).toBe('commercial-desk');
    expect(fullscreenLensFor(getIntent('DiscoverAccountOpportunity'))).toBe('my-deals');
    expect(fullscreenLensFor(getIntent('ExplorePipelineQuality'))).toBe('revenue-command');
  });
  test('a selected task retains its exact scenario and unknown IDs do not become Contoso', () => {
    const alternate = fullscreenTask('PlanCustomerSuccessHandoff', { opportunityId: 'ZDR-2043' });
    expect(fullscreenTaskContext(alternate, SEEDED_REQUESTS).entity).toBe('ZDR-2043');
    const missing = fullscreenTask('GetDealRisk', { opportunityId: 'missing' });
    expect(fullscreenTaskContext(missing, SEEDED_REQUESTS).entity).toBe('No matching record');
    const request = fullscreenTask('ReviewDealApproval', { requestId: 'ZM-1001' });
    expect(fullscreenTaskContext(request, SEEDED_REQUESTS)).toMatchObject({ entity: 'ZM-1001', detail: 'pending / exact stored request' });
  });
  test('portfolio maps and fictional value flows never inherit a default Contoso deal', () => {
    for (const key of ['DiscoverAccountOpportunity', 'ExplorePipelineFlow', 'ExploreApprovalFlow'] as const) {
      expect(fullscreenTaskContext(fullscreenTask(key, {}), SEEDED_REQUESTS).entity).toBe('Portfolio scope');
    }
  });
  test('related scenarios retain the selected opportunity and never manufacture a deal from a portfolio or request', () => {
    const task = fullscreenTask('MapBuyingCommittee', { opportunityId: 'ZDR-2043' });
    const snapshot: IModelContextSnapshot = { intent: task.definition.key, displayMode: 'fullscreen', route: task.definition.route, selectedEntityId: 'ZDR-2043', workflowStage: 'analysis', summary: 'Alternate deal', availableActions: [], resolvedScope: { opportunityId: 'ZDR-2043' } };
    const related = fullscreenRelatedTasks(task, snapshot);
    expect(related.find(item => item.definition.key === 'PlanCustomerSuccessHandoff')?.properties.opportunityId).toBe('ZDR-2043');
    expect(related.find(item => item.definition.key === 'ShapeSolutionProposal')?.properties.proposalId).toBe('PROP-2043');
    related.forEach(item => expect(item.lens).toBe('deal-room'));
    expect(fullscreenRelatedTasks(fullscreenTask('ExplorePipelineFlow', {}))).toEqual([]);
    expect(fullscreenRelatedTasks(fullscreenTask('ReviewDealApproval', { requestId: 'ZM-1001' }))).toEqual([]);
  });
  test('local commercial continuation carries actual edited values and respects intake gates', () => {
    const task = fullscreenTask('SimulateCommercialOffer', { opportunityId: 'ZDR-2043' });
    const snapshot: IModelContextSnapshot = {
      intent: task.definition.key, displayMode: 'fullscreen', route: task.definition.route,
      selectedEntityId: 'ZDR-2043', workflowStage: 'analysis', summary: 'Actual edited offer', availableActions: [],
      resolvedScope: { accountId: 'ACC-002', opportunityId: 'ZDR-2043' },
      commercial: { inputs: { quantity: '2000', termMonths: '24', discount: '8', services: '150000', probability: '0.65', ramp: '' }, errors: [] }
    };
    expect(fullscreenNextAction(task, snapshot)?.handoff).toMatchObject({
      intent: 'SubmitDealRequest', properties: { accountId: 'ACC-002', quantity: 2000, termMonths: 24, discount: 8, services: 150000, probability: .65 }
    });
    const ramped = { ...snapshot, commercial: { inputs: { quantity: '2000', termMonths: '24', discount: '8', services: '150000', probability: '0.65', ramp: '60,100' }, errors: [] } };
    expect(fullscreenNextAction(task, ramped)?.disabledReason).toBeTruthy();
  });
  test('approval does not advertise completion before its independent decision', () => {
    const task = fullscreenTask('ReviewDealApproval', { requestId: 'ZM-1001' });
    const snapshot: IModelContextSnapshot = { intent: task.definition.key, displayMode: 'fullscreen', route: task.definition.route, selectedEntityId: 'ZM-1001', workflowStage: 'queue', summary: 'Selected request', availableActions: [], inlineDealWorkflow: { selectedRequest: { status: 'pending' } } };
    expect(fullscreenNextAction(task, snapshot)).toBeUndefined();
    expect(fullscreenNextAction(task, { ...snapshot, inlineDealWorkflow: { selectedRequest: { status: 'approved' } } })?.handoff?.intent).toBe('GetMyRevenuePriorities');
  });
});
