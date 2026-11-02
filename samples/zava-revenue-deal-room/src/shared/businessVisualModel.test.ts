import { getIntent, INTENTS, type RevenueIntentKey } from './catalog';
import { OPPORTUNITIES } from './domain';
import { analysisRows, initialDraft, resolveScope, workflowFor } from './operations';
import { businessVisualModel, type IBusinessVisualInput } from './businessVisualModel';
import { inlineBusinessChart } from './InlineBusinessVisual';
import { approvalQueueModel, requestValueModel } from './visualizations/PortfolioDecisionVisuals';
import { newDealDraft, SEEDED_REQUESTS } from './dealWorkflow';

const input = (key: RevenueIntentKey, opportunityId = 'ZDR-2042'): IBusinessVisualInput => {
  const scope = resolveScope({ opportunityId });
  const workflow = workflowFor(key, scope);
  return {
    definition: getIntent(key), scope, rows: key === 'ExplorePipelineQuality'
      ? OPPORTUNITIES.filter(item => item.quarterOffset === 0).map(item => ({ id: item.id, title: item.name, detail: '', source: 'Demo catalog', kind: 'source fact' }))
      : analysisRows(key, scope),
    draft: workflow ? initialDraft(workflow) : {}, stage: 'draft', status: 'all'
  };
};
describe('keynote business visualization contracts', () => {
  test('every shared operational visual has its own business model, not a generic source-count fallback', () => {
    const keys: readonly RevenueIntentKey[] = [
      'BuildAccountBrief', 'MapBuyingCommittee', 'GetDealRisk', 'PrepareCustomerMeeting',
      'BuildMutualActionPlan', 'ReviewMeetingCommitments', 'ShapeSolutionProposal', 'ReviewDealException',
      'InspectForecastCommit', 'CoachDealStrategy', 'CreateExecutiveEngagementPlan', 'TrackMeetingFollowUp',
      'BuildValueCase', 'ReviewProposalReadiness', 'PlanCustomerSuccessHandoff', 'ExploreAgentCapabilities',
      'ExplorePipelineQuality', 'QualifyOpportunity', 'ResearchCompetitivePosition'
    ];
    const models = keys.map(key => inlineBusinessChart({ ...input(key), onSelect: () => undefined }));
    expect(new Set(models.map(item => item.kind)).size).toBe(keys.length);
    expect(models.some(item => ['source-classification', 'source-age', 'milestone-runway', 'capability-path', 'open-and-seller-weighted'].indexOf(String(item.kind)) >= 0)).toBe(false);
    models.forEach(model => {
      expect(JSON.stringify(model).length).toBeGreaterThan(150);
      expect(model.semantics).toEqual(expect.any(String));
    });
  });
  test('account growth and pipeline health reconcile to actual scoped catalog records', () => {
    const account = businessVisualModel(input('BuildAccountBrief'));
    expect(account.metrics[0].value).toBe(OPPORTUNITIES.filter(item => item.accountId === 'CONTOSO').reduce((sum, item) => sum + item.value, 0));
    expect(account.items.map(item => item.id)).toEqual(OPPORTUNITIES.filter(item => item.accountId === 'CONTOSO').map(item => item.id));
    const portfolio = businessVisualModel(input('ExplorePipelineQuality'));
    expect(portfolio.items.reduce((sum, item) => sum + (item.value || 0), 0)).toBe(OPPORTUNITIES.filter(item => item.quarterOffset === 0).length);
    expect(portfolio.items.reduce((sum, item) => sum + (item.secondary || 0), 0)).toBe(1);
  });
  test('meeting preparation and reconciliation use distinct calendars, proposed allocations and sourced claim support', () => {
    const agenda = businessVisualModel(input('PrepareCustomerMeeting'));
    const discovery = businessVisualModel(input('PrepareCustomerMeeting', 'ZDR-2043'));
    expect(agenda.items.map(item => item.value)).toEqual([10, 12, 8]);
    expect(discovery.items.map(item => item.value)).toEqual([12, 8, 10]);
    expect(agenda.items.reduce((sum, item) => sum + (item.value || 0), 0)).toBe(30);
    const review = businessVisualModel(input('ReviewMeetingCommitments'));
    expect(review.metrics[0].value).toBe(1);
    expect(businessVisualModel(input('ReviewMeetingCommitments', 'ZDR-2043')).metrics[0].value).toBe(0);
    expect(review.semantics).toContain('not established by choosing');
  });
  test('value payback and capital exposure are real draft calculations and update with their inputs', () => {
    const baseline = input('BuildValueCase');
    const value = businessVisualModel(baseline);
    expect(value.items[0].value).toBe(-525000);
    expect(value.items[value.items.length - 1].value).toBe(189000);
    expect(value.metrics.find(item => item.label === 'Payback')?.value).toBeCloseTo(8.823529);
    const reduced = businessVisualModel({ ...baseline, draft: { ...baseline.draft, adoption: '35' } });
    expect(reduced.metrics.find(item => item.label === 'Annual modeled benefit')?.value).toBe(357000);
    expect(businessVisualModel({ ...baseline, draft: { ...baseline.draft, adoption: '' } }).errors.length).toBeGreaterThan(0);
    const exception = input('ReviewDealException');
    expect(businessVisualModel(exception).metrics[0].value).toBeCloseTo(3637260 * 30 / 365);
    expect(businessVisualModel({ ...exception, draft: { ...exception.draft, days: '90' } }).metrics[0].value).toBeCloseTo(3637260 * 60 / 365);
  });
  test('dependency, introduction, release and success models expose their real constraints instead of optimistic scores', () => {
    expect(businessVisualModel(input('BuildMutualActionPlan')).items.map(item => item.days)).toEqual([5, 9, 14, 21]);
    expect(businessVisualModel(input('CreateExecutiveEngagementPlan')).semantics).toContain('not existing contact');
    expect(businessVisualModel(input('ReviewProposalReadiness')).metrics[0].value).toBe(0);
    expect(businessVisualModel(input('PlanCustomerSuccessHandoff')).metrics[1].display).toBe('No signed agreement');
    const jobs = businessVisualModel(input('ExploreAgentCapabilities'));
    expect(jobs.items.reduce((sum, item) => sum + (item.value || 0), 0)).toBe(INTENTS.length - 1);
  });
  test('unknown observations omit numeric values while genuine zero scenarios remain zero', () => {
    const buyer = businessVisualModel(input('MapBuyingCommittee'));
    expect(buyer.metrics[1]).toMatchObject({ display: 'Not evidenced', unit: 'evidence status' });
    expect(buyer.metrics[1].value).toBeUndefined();
    expect(JSON.parse(JSON.stringify(buyer.metrics[1]))).not.toHaveProperty('value');
    const forecast = input('InspectForecastCommit');
    const invalid = businessVisualModel({ ...forecast, draft: { ...forecast.draft, probability: '' } });
    expect(invalid.metrics[0].value).toBeUndefined();
    expect(invalid.errors.length).toBeGreaterThan(0);
    expect(businessVisualModel({ ...forecast, draft: { ...forecast.draft, probability: '0' } }).metrics[0].value).toBe(0);
    const exception = input('ReviewDealException');
    expect(businessVisualModel({ ...exception, draft: { ...exception.draft, days: '30' } }).metrics[0].value).toBe(0);
    const valueCase = input('BuildValueCase');
    expect(businessVisualModel({ ...valueCase, draft: { ...valueCase.draft, adoption: '0' } }).metrics.find(item => item.label === 'Payback')).toMatchObject({ display: 'Not reached', value: undefined });
  });
  test('approval workload and intake composition use actual stored requests and exact economics, not the same offer contour', () => {
    const workload = approvalQueueModel(SEEDED_REQUESTS);
    expect(workload.pendingCount).toBe(2);
    expect(workload.stages.map(item => item.currentCount)).toEqual([1, 1, 0]);
    expect(workload.stages.map(item => item.remainingCount)).toEqual([1, 2, 1]);
    const draft = { ...newDealDraft(), quantity: '1000', termMonths: '24', discount: '8', services: '150000', probability: '0.65' };
    const value = requestValueModel(draft);
    expect(value.contractValue).toBe(2818000);
    expect(value.licensedContractValue + value.servicesValue).toBe(value.contractValue);
    expect(value.sellerWeightedValue).toBe(1831700);
    expect(value.kind).not.toBe(workload.kind);
  });
  test('unregistered generic visualization requests fail explicitly', () => {
    expect(() => businessVisualModel(input('ExplorePipelineFlow'))).toThrow('No task-specific business visualization');
  });
});
