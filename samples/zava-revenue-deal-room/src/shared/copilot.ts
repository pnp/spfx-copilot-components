import { getIntent, INTENTS, type IIntentDefinition, type IRevenueProperties, type RevenueIntentKey } from './catalog';
import { resolveScope } from './operations';
import type { IModelContextSnapshot } from './RevenueApp';

export interface ICopilotAction {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
  readonly handoff?: { readonly intent: RevenueIntentKey; readonly properties: IRevenueProperties };
  readonly disabledReason?: string;
}

const guidance: Readonly<Record<RevenueIntentKey, readonly [string, string, RevenueIntentKey]>> = {
  BuildAccountBrief: ['Find the evidence gaps', 'Which account changes are supported, stale or only hypotheses?', 'DiscoverAccountOpportunity'],
  QualifyOpportunity: ['Challenge this qualification', 'Which buyer evidence supports or blocks the current qualification judgment?', 'GetDealRisk'],
  MapBuyingCommittee: ['Plan buyer access', 'Which decision makers lack access, and what evidence-backed introduction should we propose?', 'CreateExecutiveEngagementPlan'],
  GetDealRisk: ['Challenge the risk ranking', 'Explain the selected threat, provenance, freshness, owner and a practical next step.', 'BuildMutualActionPlan'],
  PrepareCustomerMeeting: ['Refine the meeting questions', 'Which questions would validate the missing buyer proof without inventing meeting outcomes?', 'ReviewMeetingCommitments'],
  BuildMutualActionPlan: ['Challenge the close path', 'Explain the edited milestones, dependencies, buyer acceptance gaps and credible close range.', 'InspectForecastCommit'],
  ReviewMeetingCommitments: ['Explain the proposed updates', 'Compare the actual draft against the meeting evidence; distinguish supported commitments from assumptions.', 'TrackMeetingFollowUp'],
  ShapeSolutionProposal: ['Challenge the proposed proof', 'Discuss the current outcome, requirements, exclusions and missing proof without authorizing release.', 'ReviewProposalReadiness'],
  SimulateCommercialOffer: ['Explain these economics', 'Explain the visible inputs, ramp, value, margin and required authority. Authority is not approval.', 'ReviewDealException'],
  ReviewDealException: ['Compare safe alternatives', 'Explain the proposed exception, independent proof, alternatives and conditions without granting approval.', 'InspectForecastCommit'],
  InspectForecastCommit: ['Challenge the forecast', 'Separate seller probability, buyer proof, forecast judgment and conditions for this deal.', 'GetDealRisk'],
  ExplorePipelineQuality: ['Prioritize interventions', 'Discuss the filtered portfolio, selected opportunity and evidence gaps; do not substitute a different deal.', 'ExploreDealAttention'],
  DiscoverAccountOpportunity: ['Validate this growth theme', 'Explain the selected opportunity, account signals and missing customer validation; do not create a lead.', 'QualifyOpportunity'],
  ResearchCompetitivePosition: ['Challenge the competitive claims', 'Which selected claims are verified, customer-observed or unsupported, and what proof should we seek?', 'ShapeSolutionProposal'],
  CoachDealStrategy: ['Compare strategy plays', 'Compare evidence-backed plays, trade-offs and buyer-access gaps for the visible selection.', 'BuildMutualActionPlan'],
  CreateExecutiveEngagementPlan: ['Refine the sponsor message', 'Discuss the actual sponsor draft, access path, sensitivities and customer objective; do not contact anyone.', 'PrepareCustomerMeeting'],
  TrackMeetingFollowUp: ['Explain the blocked commitment', 'Discuss the selected commitment, source, owner, dependency and proof needed for completion.', 'BuildMutualActionPlan'],
  BuildValueCase: ['Challenge the value assumptions', 'Explain the edited benefit, adoption, cost, sensitivity and payback assumptions; do not approve spend.', 'SimulateCommercialOffer'],
  ReviewProposalReadiness: ['Explain the release blockers', 'Discuss the actual readiness judgment, missing proof and corrections; a draft is not permission to release.', 'PlanCustomerSuccessHandoff'],
  PlanCustomerSuccessHandoff: ['Challenge the success measures', 'Discuss the sold outcome, edited checkpoint, owners and missing customer validation.', 'TrackMeetingFollowUp'],
  ExploreAgentCapabilities: ['Help me choose a scenario', 'Compare the currently filtered capabilities and selected preview against my intended outcome.', 'ExploreDealAttention'],
  SubmitDealRequest: ['Check my submission', 'Discuss the actual form step, entered economics, evidence attestations, validation and confirmation. Do not submit for me.', 'ReviewDealApproval'],
  ReviewDealApproval: ['Explain this approval route', 'Discuss the selected request, prior independent decisions, required next reviewer and proposed rationale. Do not approve for me.', 'ExploreDealAttention'],
  ExploreDealAttention: ['Explain why this deal needs attention', 'Explain the selected deal, ranking measure, buyer coverage, source evidence and seller probability. Missing proof is not a positive finding.', 'GetDealRisk'],
  GetMyRevenuePriorities: ['Explain my top priority', 'Explain the illustrative owned book, priority rules, blockers, next actions and current pipeline charts. Do not imply these are my real CRM assignments.', 'ExploreDealAttention'],
  ExplorePipelineFlow: ['Explain this fictional bottleneck', 'Discuss the selected Sankey node or ribbon, exact hypothetical USD allocation, scope and conservation assumptions. Do not call it actual pipeline or predicted conversion.', 'ExploreApprovalFlow'],
  ExploreApprovalFlow: ['Explain this fictional review flow', 'Discuss the imaginary batch, current reviewer and stage outcomes. Stage passed is not final approval; the example request is not part of this modeled volume.', 'ReviewDealApproval']
};
const safeguards = 'Use the latest visible model context, including selection, filters, edited values and discussion topic. Distinguish the specialist task from any reference workspace. Fictional Sankey allocations are not live records, conversion predictions or final approvals. No CRM writes, real approvals, customer contact or external execution. Unconfirmed drafts and required authority are not approvals; omitted evidence is unknown.';
export const isContextRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
export const contextRecord = (value: unknown): Readonly<Record<string, unknown>> => isContextRecord(value) ? value : {};
const string = (value: unknown): string | undefined => typeof value === 'string' && value.length ? value : undefined;

export function createCopilotHandoff(target: RevenueIntentKey, snapshot: IModelContextSnapshot, label?: string): ICopilotAction {
  const selected = string(snapshot.selection);
  const portfolio = ['ExploreDealAttention', 'ExplorePipelineQuality', 'DiscoverAccountOpportunity'].indexOf(snapshot.intent) >= 0;
  const resolved = contextRecord(snapshot.resolvedScope);
  const opportunityId = portfolio ? selected : string(resolved.opportunityId);
  const scope = opportunityId ? resolveScope({ opportunityId }) : undefined;
  const workflow = contextRecord(snapshot.inlineDealWorkflow);
  let properties: IRevenueProperties;
  let disabledReason: string | undefined;
  if (snapshot.intent === 'ExploreAgentCapabilities') {
    properties = {};
  } else if (target === 'ReviewDealApproval') {
    properties = { requestId: string(resolved.requestId) || string(workflow.receiptId) || string(workflow.selectedId) };
    if (!properties.requestId || snapshot.intent === 'SubmitDealRequest' && !string(workflow.receiptId)) disabledReason = 'Submit a demo request before opening its approval.';
  } else if (target === 'DiscoverAccountOpportunity') {
    const country = contextRecord(snapshot.countryMap);
    properties = {
      ...(scope?.account?.id || string(resolved.accountId) ? { accountId: scope?.account?.id || string(resolved.accountId) } : {}),
      period: string(snapshot.period), region: string(snapshot.region),
      countryId: string(country.selectedCountryId) || string(resolved.countryId),
      ...(snapshot.intent === 'ExplorePipelineQuality' && country.metric ? { mapMetric: 'opportunity' as const } : {})
    };
  } else if (target === 'SubmitDealRequest' || target === 'BuildAccountBrief') {
    properties = { accountId: scope?.account?.id || string(resolved.accountId) };
    if (!properties.accountId) disabledReason = 'Select a known account first.';
    if (target === 'SubmitDealRequest' && snapshot.intent === 'SimulateCommercialOffer') {
      const inputs = contextRecord(contextRecord(snapshot.commercial).inputs);
      const number = (value: unknown): number | undefined => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
        return undefined;
      };
      properties = {
        ...properties, opportunityId: scope?.opportunity?.id,
        quantity: number(inputs.quantity), termMonths: number(inputs.termMonths), discount: number(inputs.discount),
        services: number(inputs.services), probability: number(inputs.probability)
      };
      if ([properties.quantity, properties.termMonths, properties.discount, properties.services, properties.probability].some(value => value === undefined)) disabledReason = 'Validate the current commercial inputs before starting intake.';
      if (string(inputs.ramp)?.trim()) disabledReason = 'Guided intake uses full licensing, not an annual ramp. Clear the ramp or discuss a full-license scenario before continuing.';
    }
  } else if (target === 'ExplorePipelineFlow' || target === 'ExploreApprovalFlow') {
    properties = { period: string(snapshot.period), ...(target === 'ExplorePipelineFlow' ? { region: string(snapshot.region) } : {}) };
  } else if (target === 'ExploreDealAttention' || target === 'ExplorePipelineQuality' || target === 'GetMyRevenuePriorities') {
    const workspace = contextRecord(snapshot.workspaceState);
    properties = {
      period: snapshot.intent === 'ExplorePipelineFlow' ? string(snapshot.period) : string(workspace.period) || string(snapshot.period),
      region: snapshot.intent === 'ExplorePipelineFlow' ? string(snapshot.region) : string(workspace.region) || string(snapshot.region),
      ...(target !== 'GetMyRevenuePriorities' && scope?.opportunity ? { selectedId: scope.opportunity.id } : {})
    };
    if (target === 'ExplorePipelineQuality' && snapshot.intent === 'DiscoverAccountOpportunity' && isContextRecord(snapshot.countryMap)) {
      properties = { ...properties, countryId: string(contextRecord(snapshot.countryMap).selectedCountryId), mapMetric: 'spend' };
    }
  } else if (target === 'ExploreAgentCapabilities') {
    properties = { query: string(snapshot.query) };
  } else {
    properties = {
      opportunityId: scope?.opportunity?.id,
      ...(target === 'SimulateCommercialOffer' && scope?.opportunity ? { probability: scope.opportunity.probability } : {}),
      ...(['PrepareCustomerMeeting', 'ReviewMeetingCommitments', 'TrackMeetingFollowUp'].indexOf(target) >= 0 ? { meetingId: scope?.meeting?.id } : {}),
      ...(['ShapeSolutionProposal', 'ReviewProposalReadiness'].indexOf(target) >= 0 ? { proposalId: scope?.proposal?.id } : {}),
      ...(target === 'ReviewDealException' ? { exceptionId: scope?.exception?.id } : {})
    };
    if (!properties.opportunityId) disabledReason = 'Select a visible, known deal first.';
  }
  if (snapshot.workflowStage === 'no-match') disabledReason = 'Resolve the unmatched scope or selection before continuing.';
  if (snapshot.intent === 'SimulateCommercialOffer' && Array.isArray(snapshot.validationErrors) && snapshot.validationErrors.length) disabledReason = 'Correct the commercial inputs before opening a review.';
  const title = getIntent(target).title;
  return {
    id: `open-${target}`, label: label || `Continue: ${title}`, disabledReason,
    handoff: { intent: target, properties },
    prompt: `Show the ${title.toLowerCase()} UX component by calling ${target} with ${JSON.stringify(properties)}. Continue from ${snapshot.intent}; carry the visible evidence and discussion forward, but do not copy a draft as an approved decision or fabricate supporting records. ${safeguards}`
  };
}

export function getCopilotActions(definition: IIntentDefinition, snapshot: IModelContextSnapshot): readonly ICopilotAction[] {
  const [label, question, next] = guidance[definition.key];
  const scopeLabel = string(snapshot.scopeLabel) || 'the visible scope';
  const focusedDeal = definition.key === 'ExploreDealAttention' && contextRecord(snapshot.attention).view === 'deal-detail';
  const discussion = (id: string, actionLabel: string, topic: string): ICopilotAction => ({
    id, label: actionLabel, prompt: `Help me analyze ${definition.title.toLowerCase()} for ${scopeLabel}. ${topic} ${safeguards}`
  });
  const actions = [
    discussion('discuss-visible', definition.operation === 'education' ? 'Ask Copilot about these scenarios' : definition.key === 'ExplorePipelineFlow' || definition.key === 'ExploreApprovalFlow' ? 'Ask Copilot about this fictional flow' : definition.key === 'GetMyRevenuePriorities' ? 'Ask Copilot about my priorities' : definition.key === 'ExplorePipelineQuality' || definition.key === 'ExploreDealAttention' && !focusedDeal ? 'Ask Copilot about this portfolio' : definition.key === 'ReviewDealApproval' ? 'Ask Copilot about this request' : 'Ask Copilot about this deal', focusedDeal ? 'Explain this selected deal, its economics, buyer coverage and recorded evidence. Help me examine one detail at a time.' : definition.question),
    discussion('discuss-details', label, question)
  ];
  const selectedCapability = definition.operation === 'education' ? INTENTS.find(item => item.key === snapshot.selection) : undefined;
  actions.push(createCopilotHandoff(selectedCapability?.key || next, snapshot));
  if (definition.key === 'SimulateCommercialOffer') actions.push(createCopilotHandoff('SubmitDealRequest', snapshot, 'Submit this deal for review'));
  if (definition.key === 'ExploreDealAttention' && string(snapshot.selection)) {
    actions.push(
      createCopilotHandoff('MapBuyingCommittee', snapshot, 'Discuss buyer coverage with Copilot'),
      createCopilotHandoff('SimulateCommercialOffer', snapshot, 'Explore offer economics with Copilot'),
      createCopilotHandoff('InspectForecastCommit', snapshot, 'Discuss forecast evidence with Copilot')
    );
  }
  return actions;
}
