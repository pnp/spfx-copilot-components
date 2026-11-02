import { getIntent, type IIntentDefinition, type IRevenueProperties, type RevenueIntentKey, type RevenueLens } from './catalog';
import { contextRecord, createCopilotHandoff, getCopilotActions, type ICopilotAction } from './copilot';
import { resolveScope } from './operations';
import type { DealRequest } from './dealWorkflow';
import type { IModelContextSnapshot } from './RevenueApp';

export type FullscreenWorkspaceLens = Exclude<RevenueLens, 'education'>;
export interface IFullscreenTask {
  readonly id: string;
  readonly definition: IIntentDefinition;
  readonly properties: IRevenueProperties;
  readonly lens: FullscreenWorkspaceLens;
  readonly origin: boolean;
}
export const FULLSCREEN_STORIES: Readonly<Record<FullscreenWorkspaceLens, { readonly headline: string; readonly goal: string; readonly navigation: string }>> = {
  'my-deals': { headline: 'Make your next move matter.', goal: 'Choose the work that moves your book forward, then act on one opportunity at a time.', navigation: 'Priorities and growth' },
  'deal-room': { headline: 'Turn buyer proof into progress.', goal: 'Choose a deal. Connect the people, evidence and commitments needed for its next decision.', navigation: 'People, proof and plans' },
  'commercial-desk': { headline: 'Protect value. Own the decision.', goal: 'Shape a proposed offer or choose an exact request for independent commercial review.', navigation: 'Offers and independent review' },
  'revenue-command': { headline: 'See where growth needs action.', goal: 'Connect country opportunity, recorded spend and pipeline proof before choosing an intervention.', navigation: 'Markets and pipeline' }
};

export function fullscreenLensFor(definition: IIntentDefinition): FullscreenWorkspaceLens {
  return definition.lens === 'education' ? 'my-deals' : definition.lens;
}
export function fullscreenTask(key: RevenueIntentKey, properties: IRevenueProperties, origin = false): IFullscreenTask {
  const definition = getIntent(key);
  const signature = JSON.stringify(Object.keys(properties).sort().map(name => [name, properties[name as keyof IRevenueProperties]]));
  return { id: `${key}:${signature}`, definition, properties, lens: fullscreenLensFor(definition), origin };
}

const portfolioKeys: readonly RevenueIntentKey[] = [
  'DiscoverAccountOpportunity', 'ExplorePipelineQuality', 'ExploreDealAttention', 'GetMyRevenuePriorities',
  'ExploreAgentCapabilities', 'ExplorePipelineFlow', 'ExploreApprovalFlow'
];
export function fullscreenTaskContext(task: IFullscreenTask, requests: readonly DealRequest[], snapshot?: IModelContextSnapshot): {
  readonly title: string; readonly entity: string; readonly detail: string;
} {
  if (task.definition.key === 'ReviewDealApproval') {
    const id = task.properties.requestId || String(contextRecord(snapshot?.inlineDealWorkflow).selectedId || '');
    const request = requests.find(item => item.id === id);
    return { title: request?.draft.title || 'Independent request review', entity: id || 'Request inbox', detail: request ? `${request.status} / exact stored request` : 'Select a stored request; opening a review grants no authority.' };
  }
  if (task.definition.key === 'SubmitDealRequest') {
    const workflow = contextRecord(snapshot?.inlineDealWorkflow);
    const draft = contextRecord(workflow.draft);
    return { title: typeof draft.title === 'string' && draft.title ? draft.title : 'Evidence-backed deal request', entity: typeof workflow.receiptId === 'string' && workflow.receiptId ? workflow.receiptId : 'Proposed request', detail: 'Exact draft values / explicit confirmation / no CRM writes' };
  }
  if (portfolioKeys.indexOf(task.definition.key) >= 0) {
    const country = contextRecord(snapshot?.countryMap);
    const selectedCountry = typeof country.selectedCountryId === 'string' ? country.selectedCountryId : task.properties.countryId;
    if (task.definition.key === 'DiscoverAccountOpportunity' && task.properties.accountId !== undefined) {
      const scope = resolveScope(task.properties);
      return { title: scope.account?.name || 'Requested account scope', entity: scope.account?.id || 'No matching account', detail: scope.errors.length ? scope.errors.join('; ') : `${scope.account?.name} / ${selectedCountry ? `country ${selectedCountry}` : 'headquarters-attributed opportunity footprint'}` };
    }
    return {
      title: task.definition.key === 'GetMyRevenuePriorities' ? "Megan Bowen's illustrative owned book" : task.definition.title,
      entity: selectedCountry ? `Country ${selectedCountry}` : 'Portfolio scope',
      detail: typeof snapshot?.scopeLabel === 'string' ? snapshot.scopeLabel : `${task.properties.period || 'current'} quarter / ${task.properties.region || 'all'} regions`
    };
  }
  const scope = resolveScope(task.properties);
  return { title: scope.opportunity?.name || 'Requested business scope', entity: scope.opportunity?.id || 'No matching record', detail: scope.errors.length ? scope.errors.join('; ') : `${scope.account?.name} / ${task.definition.question}` };
}
export function fullscreenNextAction(task: IFullscreenTask, snapshot?: IModelContextSnapshot): ICopilotAction | undefined {
  if (!snapshot || snapshot.workflowStage === 'no-match') return undefined;
  if (task.definition.key === 'DiscoverAccountOpportunity') return createCopilotHandoff('ExplorePipelineQuality', snapshot);
  if (task.definition.key === 'BuildAccountBrief') return createCopilotHandoff('MapBuyingCommittee', snapshot);
  if (task.definition.key === 'MapBuyingCommittee') return createCopilotHandoff('GetDealRisk', snapshot);
  if (task.definition.key === 'GetDealRisk') return createCopilotHandoff('SimulateCommercialOffer', snapshot);
  if (task.definition.key === 'ShapeSolutionProposal') return createCopilotHandoff('BuildValueCase', snapshot);
  if (task.definition.key === 'BuildValueCase') return createCopilotHandoff('SimulateCommercialOffer', snapshot);
  if (task.definition.key === 'SimulateCommercialOffer') return createCopilotHandoff('SubmitDealRequest', snapshot);
  if (task.definition.key === 'SubmitDealRequest') return createCopilotHandoff('ReviewDealApproval', snapshot);
  if (task.definition.key === 'ReviewDealApproval') {
    const request = contextRecord(contextRecord(snapshot.inlineDealWorkflow).selectedRequest);
    return request.status === 'approved' ? createCopilotHandoff('GetMyRevenuePriorities', snapshot) : undefined;
  }
  return getCopilotActions(task.definition, snapshot).find(action => !!action.handoff);
}

export function fullscreenRelatedTasks(task: IFullscreenTask, snapshot?: IModelContextSnapshot): readonly IFullscreenTask[] {
  const resolved = contextRecord(snapshot?.resolvedScope);
  if (typeof resolved.opportunityId !== 'string') return [];
  const scope = resolveScope({ opportunityId: resolved.opportunityId });
  if (scope.errors.length || !scope.opportunity) return [];
  const keys: readonly RevenueIntentKey[] = task.lens === 'deal-room'
    ? ['BuildAccountBrief', 'MapBuyingCommittee', 'GetDealRisk', 'BuildMutualActionPlan', 'ShapeSolutionProposal', 'ResearchCompetitivePosition', 'CreateExecutiveEngagementPlan', 'TrackMeetingFollowUp', 'BuildValueCase', 'PlanCustomerSuccessHandoff']
    : task.lens === 'my-deals' ? ['QualifyOpportunity', 'PrepareCustomerMeeting', 'ReviewMeetingCommitments', 'CoachDealStrategy']
      : task.lens === 'commercial-desk' ? ['SimulateCommercialOffer', 'ReviewDealException', 'ReviewProposalReadiness']
        : ['InspectForecastCommit'];
  return keys.filter(key => key !== task.definition.key &&
    (['PrepareCustomerMeeting', 'ReviewMeetingCommitments', 'TrackMeetingFollowUp'].indexOf(key) < 0 || !!scope.meeting) &&
    (['ShapeSolutionProposal', 'ReviewProposalReadiness'].indexOf(key) < 0 || !!scope.proposal) &&
    (key !== 'ReviewDealException' || !!scope.exception))
    .map(key => fullscreenTask(key, {
      opportunityId: scope.opportunity?.id,
      ...(['PrepareCustomerMeeting', 'ReviewMeetingCommitments', 'TrackMeetingFollowUp'].indexOf(key) >= 0 ? { meetingId: scope.meeting?.id } : {}),
      ...(['ShapeSolutionProposal', 'ReviewProposalReadiness'].indexOf(key) >= 0 ? { proposalId: scope.proposal?.id } : {}),
      ...(key === 'ReviewDealException' ? { exceptionId: scope.exception?.id } : {})
    }));
}
