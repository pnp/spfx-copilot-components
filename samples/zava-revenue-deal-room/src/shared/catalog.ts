export type RevenueLens = 'my-deals' | 'deal-room' | 'commercial-desk' | 'revenue-command' | 'education';
export type RevenueOperation = 'information' | 'review' | 'submit' | 'education';
export type RevenueIntentKey =
  | 'BuildAccountBrief' | 'QualifyOpportunity' | 'MapBuyingCommittee' | 'GetDealRisk'
  | 'PrepareCustomerMeeting' | 'BuildMutualActionPlan' | 'ReviewMeetingCommitments'
  | 'ShapeSolutionProposal' | 'SimulateCommercialOffer' | 'ReviewDealException'
  | 'InspectForecastCommit' | 'ExplorePipelineQuality' | 'DiscoverAccountOpportunity'
  | 'ResearchCompetitivePosition' | 'CoachDealStrategy' | 'CreateExecutiveEngagementPlan'
  | 'TrackMeetingFollowUp' | 'BuildValueCase' | 'ReviewProposalReadiness'
  | 'PlanCustomerSuccessHandoff' | 'ExploreAgentCapabilities'
  | 'SubmitDealRequest' | 'ReviewDealApproval' | 'ExploreDealAttention' | 'GetMyRevenuePriorities'
  | 'ExplorePipelineFlow' | 'ExploreApprovalFlow';

export interface IRevenueProperties {
  readonly accountId?: string;
  readonly opportunityId?: string;
  readonly meetingId?: string;
  readonly exceptionId?: string;
  readonly proposalId?: string;
  readonly period?: string;
  readonly region?: string;
  readonly query?: string;
  readonly selectedId?: string;
  readonly quantity?: number;
  readonly termMonths?: number;
  readonly discount?: number;
  readonly services?: number;
  readonly probability?: number;
  readonly ramp?: readonly number[];
  readonly requestId?: string;
  readonly countryId?: string;
  readonly mapMetric?: 'opportunity' | 'spend';
}

export interface IIntentDefinition {
  readonly key: RevenueIntentKey;
  readonly title: string;
  readonly lens: RevenueLens;
  readonly route: string;
  readonly operation: RevenueOperation;
  readonly role: string;
  readonly question: string;
  readonly outcome: string;
  readonly prompt: string;
  readonly excludes: string;
}

const define = (
  key: RevenueIntentKey,
  title: string,
  lens: RevenueLens,
  route: string,
  operation: RevenueOperation,
  role: string,
  question: string,
  outcome: string,
  prompt: string,
  excludes: string
): IIntentDefinition => ({ key, title, lens, route, operation, role, question, outcome, prompt, excludes });

export const INTENTS: readonly IIntentDefinition[] = [
  define('BuildAccountBrief', 'Account brief', 'deal-room', 'deal-room/account-brief', 'information', 'Account executive', 'What changed at this account?', 'Connects fresh relationship evidence to whitespace and open commitments.', 'Build a brief for the Contoso expansion.', 'Do not use for one meeting.'),
  define('QualifyOpportunity', 'Qualification gate', 'my-deals', 'my-deals/qualification', 'review', 'Account executive', 'Should we pursue this opportunity?', 'Makes stage judgment explicit and evidence-based.', 'Should we pursue the Contoso expansion?', 'Do not use for forecast commit.'),
  define('MapBuyingCommittee', 'Buying committee', 'deal-room', 'deal-room/stakeholders', 'information', 'Deal lead', 'Who can move the decision?', 'Reveals authority, stance, influence, access gaps, and relationship owners.', 'Map the buying committee for Contoso.', 'Do not use for general contact lists.'),
  define('GetDealRisk', 'Deal risk', 'deal-room', 'deal-room/risks', 'information', 'Deal lead', 'What can derail signature?', 'Ranks threats with contrary evidence, freshness, owners, and actions.', 'Help me get Contoso to signature this quarter.', 'Do not use for aggregate pipeline risk.'),
  define('PrepareCustomerMeeting', 'Meeting preparation', 'my-deals', 'my-deals/meeting-prep', 'information', 'Account executive', 'How should we use the next customer meeting?', 'Connects attendees, commitments, objections, proof, and questions.', 'Prepare me for the Contoso steering meeting.', 'Do not use to write meeting results.'),
  define('BuildMutualActionPlan', 'Mutual action plan', 'deal-room', 'deal-room/mutual-plan', 'submit', 'Deal lead', 'Can both parties reach the target date?', 'Builds an owned dependency runway and credible close range.', 'Build a mutual action plan for Contoso.', 'Do not use for internal task lists.'),
  define('ReviewMeetingCommitments', 'Meeting commitments', 'my-deals', 'my-deals/meeting-review', 'review', 'Account executive', 'What did the customer actually commit to?', 'Reconciles each proposed update against meeting evidence.', 'Review commitments from the Contoso meeting.', 'Do not use for meeting preparation.'),
  define('ShapeSolutionProposal', 'Solution proposal', 'deal-room', 'deal-room/proposal', 'submit', 'Solution architect', 'Does the proposal prove the customer outcome?', 'Joins requirements, proof, adoption, value, exclusions, and owners.', 'Shape the Contoso solution proposal.', 'Do not use for commercial pricing.'),
  define('SimulateCommercialOffer', 'Commercial scenario', 'commercial-desk', 'commercial-desk/scenario', 'information', 'Finance partner', 'Which offer balances outcome and economics?', 'Recalculates value, margin, authority, probability, and forecast impact.', 'Model a three-year ramped offer for Contoso.', 'Do not use to approve an exception.'),
  define('ReviewDealException', 'Deal exception', 'commercial-desk', 'commercial-desk/exception', 'review', 'Finance partner', 'Should this nonstandard request be accepted?', 'Places policy, precedent, alternatives, and conditions beside impact.', 'Review the Contoso payment-term exception.', 'Do not use for scenario modeling.'),
  define('InspectForecastCommit', 'Forecast commit', 'revenue-command', 'revenue-command/forecast-review', 'review', 'Sales manager', 'Can this deal remain in commit?', 'Separates buyer proof, seller judgment, inference, range, and conditions.', 'Should Contoso remain in commit for Q4?', 'Do not use for seller qualification.'),
  define('ExplorePipelineQuality', 'Pipeline quality', 'revenue-command', 'revenue-command/pipeline', 'information', 'Revenue leader', 'Where should leadership intervene?', 'Connects coverage, aging, evidence quality, concentration, and movement.', 'Show pipeline quality for this quarter.', 'Do not use for one deal.'),
  define('DiscoverAccountOpportunity', 'Opportunity discovery', 'my-deals', 'my-deals/opportunity-discovery', 'information', 'Account executive', 'Where is the next credible growth opportunity?', 'Explores scoped country opportunity value, market spend and inspectable account opportunities.', 'Where is the next growth opportunity in Contoso?', 'Do not create a lead automatically or treat headquarters attribution as rollout revenue.'),
  define('ResearchCompetitivePosition', 'Competitive position', 'deal-room', 'deal-room/competition', 'information', 'Deal strategist', 'How do we improve our competitive position?', 'Separates public facts, customer evidence, observations, and approved proof.', 'Research the competitive position for Contoso.', 'Do not invent competitor claims.'),
  define('CoachDealStrategy', 'Deal coaching', 'my-deals', 'my-deals/coaching', 'information', 'Sales manager', 'Which strategy play improves our position?', 'Tests explainable plays against relationships, evidence, path, and forecast.', 'Coach me on the Contoso deal.', 'Do not make a forecast decision.'),
  define('CreateExecutiveEngagementPlan', 'Executive engagement', 'deal-room', 'deal-room/executive-engagement', 'submit', 'Executive sponsor', 'How should executives create useful access?', 'Maps sponsor fit, objective, message, sensitivities, path, and owner.', 'Create an executive engagement plan for Contoso.', 'Do not send customer communication.'),
  define('TrackMeetingFollowUp', 'Commitment follow-up', 'deal-room', 'deal-room/commitments', 'information', 'Account executive', 'Which commitment needs attention now?', 'Shows source, owner, dependency, evidence, and forecast consequence.', 'Track follow-up from the Contoso meeting.', 'Do not infer completion.'),
  define('BuildValueCase', 'Value case', 'deal-room', 'deal-room/value-case', 'submit', 'Value engineer', 'Can the customer defend the investment?', 'Models outcome drivers, costs, sensitivity, payback, and evidence gaps.', 'Build the value case for Contoso.', 'Do not set price or approve spend.'),
  define('ReviewProposalReadiness', 'Proposal readiness', 'commercial-desk', 'commercial-desk/proposal-readiness', 'review', 'Commercial reviewer', 'Is the proposal ready for the customer?', 'Governs traceability, claims, economics, dependencies, and conditions.', 'Review the Contoso proposal readiness.', 'Do not write the proposal.'),
  define('PlanCustomerSuccessHandoff', 'Success handoff', 'deal-room', 'deal-room/success-handoff', 'submit', 'Customer success lead', 'Will sold outcomes survive the handoff?', 'Connects commitments, measures, risks, milestones, and ownership.', 'Plan the Contoso customer success handoff.', 'Do not close the opportunity.'),
  define('ExploreAgentCapabilities', 'Explore capabilities', 'education', 'education/capabilities', 'education', 'All roles', 'What can the Revenue Deal Room help me do?', 'Makes every business scenario searchable and safely previewable.', 'Explore what the Revenue Deal Room can do.', 'Do not use for a specific operational request.'),
  define('SubmitDealRequest', 'Submit a deal', 'my-deals', 'my-deals/deal-submission', 'submit', 'Account executive', 'How do I submit an evidence-backed deal?', 'Guides account, outcome, economics, evidence and explicit submission in the conversation.', 'Help me submit a new deal for commercial review.', 'Do not submit to CRM or grant approval.'),
  define('ReviewDealApproval', 'Deal approvals', 'commercial-desk', 'commercial-desk/deal-approvals', 'review', 'Commercial reviewer', 'Which deal request needs my independent decision?', 'Reviews the exact request, staged authority, explicit decision and matching audit receipt inline.', 'Show the deals awaiting commercial approval.', 'Do not approve without independent authority and explicit confirmation.'),
  define('ExploreDealAttention', 'Deals needing attention', 'revenue-command', 'revenue-command/deal-attention', 'information', 'Revenue leader', 'Which important deals need attention?', 'Ranks filtered deals with charts and drills into economics, buyer coverage and evidence without full screen.', 'Show the most important deals needing attention and let me inspect one.', 'Do not treat seller-weighted exposure as a predicted loss or an approval.'),
  define('GetMyRevenuePriorities', 'My priorities', 'my-deals', 'my-deals/revenue-priorities', 'information', 'Account executive', 'What needs my attention and how is my pipeline performing?', 'Connects the owned book, evidence-backed next actions, pipeline outlook and close-plan status charts.', 'Show my top revenue priorities, pipeline status and next actions.', 'Do not imply live personal assignments, approve deals or contact customers.'),
  define('ExplorePipelineFlow', 'Pipeline value & actions', 'revenue-command', 'revenue-command/pipeline-flow', 'information', 'Revenue leader', 'Where does pipeline value need action?', 'Connects regional value, buyer readiness and next actions through inspectable value flows.', 'Show how pipeline value moves from regions through buyer readiness to next actions.', 'Do not treat planning allocations as CRM totals, conversion predictions or forecast commit.'),
  define('ExploreApprovalFlow', 'Approval progress', 'commercial-desk', 'commercial-desk/approval-flow', 'information', 'Commercial reviewer', 'Where is approval value waiting?', 'Connects intake routes, current reviewers and stage outcomes with inspectable value flows.', 'Show where approval value is waiting by intake route, current reviewer and stage outcome.', 'Do not attribute aggregate values to individual requests, skip independent stages or equate stage completion with final approval.')
];

export const getIntent = (key: RevenueIntentKey): IIntentDefinition => {
  const definition = INTENTS.find((item) => item.key === key);
  if (!definition) {
    throw new Error(`Unknown revenue intent: ${key}`);
  }
  return definition;
};

export const LENS_LABELS: Readonly<Record<RevenueLens, string>> = {
  'my-deals': 'My Deals',
  'deal-room': 'Deal Room',
  'commercial-desk': 'Commercial Desk',
  'revenue-command': 'Revenue Command',
  education: 'Capabilities'
};