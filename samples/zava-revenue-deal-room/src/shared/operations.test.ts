import { INTENTS, type IRevenueProperties, type RevenueIntentKey } from './catalog';
import { HERO_OFFER, OPPORTUNITIES, calculateCommercialOffer } from './domain';
import { analysisRows, initialDraft, resolveScope, workflowCalculation, workflowErrors, workflowFor, qualificationReadiness, competitiveDecisionDrivers, workflowReviewPages, type IReviewValuePart } from './operations';

describe('scoped revenue business rules', () => {
  test('long reviewed business values are paged without losing Unicode or any entered characters', () => {
    const workflow = workflowFor('ShapeSolutionProposal', resolveScope({}));
    if (!workflow) throw new Error('Missing proposal workflow');
    const long = 'Customer proof \ud83d\ude80 and accountable rollout. '.repeat(18);
    const draft = { ...initialDraft(workflow), requirement: long };
    const pages = workflowReviewPages(workflow.fields, draft);
    const parts = pages.reduce<IReviewValuePart[]>((items, page) => items.concat(page.filter(item => item.field.name === 'requirement')), []);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.map(item => item.value).join('')).toBe(long);
    expect(parts.every(item => Array.from(item.value).length <= 240)).toBe(true);
    expect(workflowErrors('ShapeSolutionProposal', resolveScope({}), workflow, { ...draft, requirement: 'x'.repeat(1001) }).join(' ')).toContain('at most 1,000');
  });
  test('qualification readiness counts buyer evidence, not source classifications or typed seller claims', () => {
    const scope = resolveScope({});
    const readiness = qualificationReadiness(scope);
    expect(readiness.verifiedCount).toBe(1);
    expect(readiness.totalCount).toBe(5);
    expect(readiness.gates.map(item => item.state)).toEqual(['verified', 'missing', 'blocked', 'unconfirmed', 'stale']);
    expect(readiness.gates.find(item => item.id === 'Q-security')).toMatchObject({ sourceId: 'EV-05', state: 'unconfirmed' });
    expect(readiness.gates.find(item => item.id === 'Q-budget')?.sourceId).toBeUndefined();
    expect(qualificationReadiness(resolveScope({ opportunityId: 'ZDR-2043' })).verifiedCount).toBe(0);
    const workflow = workflowFor('QualifyOpportunity', scope);
    if (!workflow) throw new Error('Missing qualification workflow');
    expect(workflowErrors('QualifyOpportunity', scope, workflow, { ...initialDraft(workflow), decision: 'Pursue', criteria: 'All gates passed' }).join(' ')).toContain('Missing independent');
  });
  test('competitive driver weights are distinct scoped workshop proposals, never fabricated vendor scores', () => {
    const current = competitiveDecisionDrivers(resolveScope({}));
    const discovery = competitiveDecisionDrivers(resolveScope({ opportunityId: 'ZDR-2043' }));
    expect(current.map(item => item.weight)).toEqual([35, 30, 25, 10]);
    expect(discovery.map(item => item.weight)).toEqual([35, 30, 20, 15]);
    expect(current.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
    expect(discovery.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
    expect(current.find(item => item.id === 'CMP-value')?.proof).toBe('Owner only');
    expect(discovery.every(item => item.sourceIds.length === 0)).toBe(true);
    const rows = analysisRows('ResearchCompetitivePosition', resolveScope({}));
    current.forEach(item => expect(rows.find(row => row.id === item.id)).toMatchObject({ kind: 'workshop proposal' }));
    expect(rows.find(item => item.id === 'incumbent')?.kind).toBe('evidence gap');
  });
  test.each([
    { accountId: 'missing' }, { opportunityId: 'missing' }, { meetingId: 'missing' },
    { proposalId: 'missing' }, { exceptionId: 'missing' },
    { accountId: 'ACC-002', opportunityId: 'ZDR-2042' },
    { meetingId: 'MTG-2043', opportunityId: 'ZDR-2042' },
    { proposalId: 'PROP-2043', exceptionId: 'EX-2042' }
  ] satisfies IRevenueProperties[])('does not silently substitute an invalid scope %j', properties => {
    expect(resolveScope(properties).errors.length).toBeGreaterThan(0);
  });
  test.each([
    { accountId: 'ACC-002' }, { opportunityId: 'ZDR-2043' }, { meetingId: 'MTG-2043' },
    { proposalId: 'PROP-2043' }, { exceptionId: 'EX-2043' }
  ] satisfies IRevenueProperties[])('resolves alternate records without hero evidence %j', properties => {
    const scope = resolveScope(properties);
    expect(scope.errors).toEqual([]);
    expect(scope.opportunity?.id).toBe('ZDR-2043');
    expect(scope.account?.id).toBe('ACC-002');
    expect(analysisRows('GetDealRisk', scope)).toEqual([]);
  });
  test('keeps account summary, risks, preparation, competition and coaching factually distinct', () => {
    const scope = resolveScope({});
    const keys: readonly RevenueIntentKey[] = ['BuildAccountBrief', 'GetDealRisk', 'PrepareCustomerMeeting', 'ResearchCompetitivePosition', 'CoachDealStrategy', 'MapBuyingCommittee', 'TrackMeetingFollowUp'];
    const bodies = keys.map(key => JSON.stringify(analysisRows(key, scope)));
    expect(new Set(bodies).size).toBe(keys.length);
    expect(bodies.every(body => body.length > 100)).toBe(true);
    expect(analysisRows('MapBuyingCommittee', scope).find(row => row.title.indexOf('Nestor') >= 0)?.title).toContain('Champion');
    expect(analysisRows('MapBuyingCommittee', scope).find(row => row.title.indexOf('Lee Gu') >= 0)?.title).toContain('Economic buyer');
  });
  test('annualizes delivery cost for every subscription year and exactly weights TCV', () => {
    const one = calculateCommercialOffer({ quantity: 100, termMonths: 12, services: 0, discount: 0, probability: 0.5 });
    const three = calculateCommercialOffer({ quantity: 100, termMonths: 36, services: 0, discount: 0, probability: 0.5 });
    expect(one.grossMargin).toBe(78);
    expect(three.grossMargin).toBe(78);
    expect(three.contractValue).toBe(one.contractValue * 3);
    expect(three.weightedForecast).toBe(217500);
    expect(HERO_OFFER.contractValue).toBe(OPPORTUNITIES[0].value);
    expect(calculateCommercialOffer({ quantity: 100, termMonths: 12, services: 0, discount: 100, probability: 0 }).grossMargin).toBe(0);
  });
  test.each([['QualifyOpportunity', 'Pursue'], ['ReviewDealException', 'Approve exception'], ['InspectForecastCommit', 'Retain commit'], ['ReviewProposalReadiness', 'Ready for customer']] satisfies [RevenueIntentKey, string][])('cannot grant gated %s from draft values', (key, choice) => {
    const scope = resolveScope({});
    const workflow = workflowFor(key, scope);
    expect(workflow).toBeDefined();
    if (!workflow) throw new Error('Missing workflow');
    const draft = initialDraft(workflow);
    expect(workflowErrors(key, scope, workflow, draft)).toEqual([]);
    expect(workflowErrors(key, scope, workflow, { ...draft, decision: choice }).join(' ')).toContain('Missing independent');
    expect(workflowErrors(key, scope, workflow, { ...draft, decision: workflow.fields[0].options?.[2] || '' })).toEqual([]);
  });
  test('accepts only the supported meeting commitment', () => {
    const scope = resolveScope({});
    const workflow = workflowFor('ReviewMeetingCommitments', scope);
    if (!workflow) throw new Error('Missing workflow');
    const draft = { ...initialDraft(workflow), decision: 'Accept supported commitment' };
    expect(workflowErrors('ReviewMeetingCommitments', scope, workflow, draft)).toEqual([]);
    expect(workflowErrors('ReviewMeetingCommitments', scope, workflow, { ...draft, commitment: 'CFO approved funding' })).toHaveLength(1);
    expect(workflowErrors('ReviewMeetingCommitments', resolveScope({ meetingId: 'MTG-2043' }), workflow, draft)).toHaveLength(1);
  });
  test('enforces runway, numeric bounds, required ownership and value sensitivity', () => {
    const scope = resolveScope({});
    const workflow = workflowFor('BuildMutualActionPlan', scope);
    if (!workflow) throw new Error('Missing workflow');
    expect(workflowErrors('BuildMutualActionPlan', scope, workflow, { ...initialDraft(workflow), days: '20', buyer: '' })).toHaveLength(2);
    const value = workflowFor('BuildValueCase', scope);
    if (!value) throw new Error('Missing model');
    const draft = initialDraft(value);
    expect(workflowCalculation('BuildValueCase', scope, draft)).toContain('$714,000');
    expect(workflowCalculation('BuildValueCase', scope, draft)).toContain('8.8 months');
    expect(workflowCalculation('BuildValueCase', scope, { ...draft, adoption: '0' })).toContain('not reached');
    expect(workflowErrors('BuildValueCase', scope, value, { ...draft, adoption: '101' })).toHaveLength(1);
  });
  test('specialist review/submit tools have domain fields and valid initial safe paths', () => {
    const scope = resolveScope({});
    const tools = INTENTS.filter(item => (item.operation === 'review' || item.operation === 'submit') && ['SubmitDealRequest', 'ReviewDealApproval'].indexOf(item.key) < 0);
    expect(tools).toHaveLength(10);
    tools.forEach(item => {
      const workflow = workflowFor(item.key, scope);
      if (!workflow) throw new Error(item.key);
      expect(workflow.fields.length).toBeGreaterThanOrEqual(3);
      expect(workflowErrors(item.key, scope, workflow, initialDraft(workflow))).toEqual([]);
    });
  });
  test('keeps discount authority thresholds exact and escalates low-margin services', () => {
    const offer = { quantity: 100, termMonths: 12, services: 0, discount: 10, probability: 0.5 };
    expect(calculateCommercialOffer(offer).authority).toBe('Sales manager');
    expect(calculateCommercialOffer({ ...offer, discount: 10.01 }).authority).toBe('Commercial director');
    expect(calculateCommercialOffer({ ...offer, discount: 18 }).authority).toBe('Commercial director');
    expect(calculateCommercialOffer({ ...offer, discount: 18.01 }).authority).toBe('Executive committee');
    expect(calculateCommercialOffer({ ...offer, services: 1000000 }).authority).toBe('Executive committee');
  });
  test('empty explicit IDs are not treated as an omitted scope', () => {
    ['accountId', 'opportunityId', 'meetingId', 'proposalId', 'exceptionId'].forEach(key => {
      expect(resolveScope({ [key]: '' }).errors.length).toBeGreaterThan(0);
    });
  });
  test('annual licensing ramps prorate subscription revenue and cost, including a partial year', () => {
    const input = { quantity: 100, termMonths: 30, services: 0, discount: 0, probability: 0.5, ramp: [50, 75, 100] };
    const result = calculateCommercialOffer(input);
    expect(result.contractValue).toBe(145000 * 1.75);
    expect(result.grossMargin).toBe(78);
    expect(result.arr).toBe(145000);
  });
});
