import type { IRevenueProperties, RevenueIntentKey } from './catalog';
import { ACCOUNTS, CONTACTS, HERO_EVIDENCE, HERO_MILESTONES, OPPORTUNITIES, type IAccount, type IOpportunity } from './domain';

export const MEETINGS = [
  { id: 'MTG-2042', opportunityId: 'ZDR-2042', name: 'Contoso steering meeting', attendees: ['Nestor Wilke', 'Pradeep Gupta'], source: 'Meeting transcript · 2 days old' },
  { id: 'MTG-2043', opportunityId: 'ZDR-2043', name: 'Global Account 02 discovery', attendees: ['Customer Leader 82'], source: 'Calendar · no transcript recorded' }
] as const;
export const PROPOSALS = [
  { id: 'PROP-2042', opportunityId: 'ZDR-2042', name: '18-country expansion proposal', securityComplete: false, claimsVerified: false },
  { id: 'PROP-2043', opportunityId: 'ZDR-2043', name: 'Discovery outline', securityComplete: false, claimsVerified: false }
] as const;
export const EXCEPTIONS = [
  { id: 'EX-2042', opportunityId: 'ZDR-2042', name: 'Net 60 payment terms', requestedDays: 60, approved: false },
  { id: 'EX-2043', opportunityId: 'ZDR-2043', name: 'Net 90 payment terms', requestedDays: 90, approved: false }
] as const;

export interface IRevenueScope {
  readonly account?: IAccount;
  readonly opportunity?: IOpportunity;
  readonly meeting?: typeof MEETINGS[number];
  readonly proposal?: typeof PROPOSALS[number];
  readonly exception?: typeof EXCEPTIONS[number];
  readonly errors: readonly string[];
}
export function resolveScope(properties: IRevenueProperties): IRevenueScope {
  const errors: string[] = [];
  const meeting = properties.meetingId !== undefined ? MEETINGS.find(item => item.id === properties.meetingId) : undefined;
  const proposal = properties.proposalId !== undefined ? PROPOSALS.find(item => item.id === properties.proposalId) : undefined;
  const exception = properties.exceptionId !== undefined ? EXCEPTIONS.find(item => item.id === properties.exceptionId) : undefined;
  if (properties.meetingId !== undefined && !meeting) errors.push(`No meeting matches ${properties.meetingId || '(empty ID)'}`);
  if (properties.proposalId !== undefined && !proposal) errors.push(`No proposal matches ${properties.proposalId || '(empty ID)'}`);
  if (properties.exceptionId !== undefined && !exception) errors.push(`No exception matches ${properties.exceptionId || '(empty ID)'}`);
  const related = [meeting, proposal, exception].filter(item => item !== undefined);
  const opportunityId = properties.opportunityId ?? related[0]?.opportunityId;
  const account = properties.accountId !== undefined ? ACCOUNTS.find(item => item.id === properties.accountId) : undefined;
  if (properties.accountId !== undefined && !account) errors.push(`No account matches ${properties.accountId || '(empty ID)'}`);
  const opportunity = opportunityId !== undefined ? OPPORTUNITIES.find(item => item.id === opportunityId) :
    OPPORTUNITIES.find(item => item.accountId === (account?.id || 'CONTOSO'));
  if (opportunityId !== undefined && !opportunity) errors.push(`No opportunity matches ${opportunityId || '(empty ID)'}`);
  if (account && opportunity && opportunity.accountId !== account.id) errors.push('Account and opportunity scopes conflict');
  if (related.some(item => item.opportunityId !== opportunity?.id)) errors.push('Related record and opportunity scopes conflict');
  const resolvedAccount = account || ACCOUNTS.find(item => item.id === opportunity?.accountId);
  return {
    account: resolvedAccount, opportunity, errors,
    meeting: meeting || (!properties.meetingId ? MEETINGS.find(item => item.opportunityId === opportunity?.id) : undefined),
    proposal: proposal || (!properties.proposalId ? PROPOSALS.find(item => item.opportunityId === opportunity?.id) : undefined),
    exception: exception || (!properties.exceptionId ? EXCEPTIONS.find(item => item.opportunityId === opportunity?.id) : undefined)
  };
}
export const scopedEvidence = (scope: IRevenueScope): typeof HERO_EVIDENCE =>
  HERO_EVIDENCE.filter(item => item.opportunityId === scope.opportunity?.id);
export const scopedMilestones = (scope: IRevenueScope): typeof HERO_MILESTONES =>
  HERO_MILESTONES.filter(item => item.opportunityId === scope.opportunity?.id);
export const scopedContacts = (scope: IRevenueScope): typeof CONTACTS =>
  CONTACTS.filter(item => item.accountId === scope.account?.id);
export function proposedMeetingAgenda(scope: IRevenueScope): readonly { readonly label: string; readonly minutes: number }[] {
  if (!scope.meeting) return [];
  return scope.meeting.id === 'MTG-2042'
    ? [{ label: 'Scope alignment', minutes: 10 }, { label: 'Control proof', minutes: 12 }, { label: 'Buyer decisions', minutes: 8 }]
    : [{ label: 'Discovery needs', minutes: 12 }, { label: 'Budget process', minutes: 8 }, { label: 'Success criteria', minutes: 10 }];
}
export const currency = (value: number): string => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export interface IBusinessRow {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly source: string;
  readonly kind: string;
}
export type QualificationProofState = 'verified' | 'missing' | 'blocked' | 'stale' | 'unconfirmed';
export interface IQualificationGate {
  readonly id: string;
  readonly label: string;
  readonly state: QualificationProofState;
  readonly sourceId?: string;
  readonly source: string;
  readonly detail: string;
}
export function qualificationReadiness(scope: IRevenueScope): {
  readonly gates: readonly IQualificationGate[];
  readonly verifiedCount: number;
  readonly totalCount: number;
  readonly semantics: string;
} {
  const evidence = scopedEvidence(scope);
  const requirements: readonly (readonly [string, string, string | undefined, string])[] = [
    ['Q-scope', 'Scope', 'EV-01', 'No buyer-confirmed deployment scope.'],
    ['Q-budget', 'Budget', undefined, 'No buyer-confirmed funding record is stored.'],
    ['Q-authority', 'Authority', 'EV-03', 'No direct economic-buyer interaction is recorded.'],
    ['Q-security', 'Security', 'EV-05', 'No customer-accepted control evidence is recorded.'],
    ['Q-timing', 'Timing', 'EV-04', 'No current buyer-confirmed launch date is recorded.']
  ];
  const gates = requirements.map(([id, label, sourceId, missing]): IQualificationGate => {
    const proof = evidence.find(item => item.id === sourceId);
    const state: QualificationProofState = !proof ? 'missing' : proof.kind === 'verified' ? 'verified' : proof.kind === 'contrary' ? 'blocked' : proof.kind === 'stale' ? 'stale' : 'unconfirmed';
    return { id, label, state, sourceId: proof?.id, source: proof ? `${proof.source} / ${proof.kind} / ${proof.ageDays}d` : 'No supporting buyer evidence', detail: proof?.detail || missing };
  });
  return {
    gates, verifiedCount: gates.filter(item => item.state === 'verified').length, totalCount: gates.length,
    semantics: 'Buyer-proof coverage across qualification dimensions, not win probability, a complete qualification policy, or permission to pursue. Typed draft values do not establish buyer evidence.'
  };
}
export interface ICompetitiveDecisionDriver {
  readonly id: string;
  readonly label: string;
  readonly weight: number;
  readonly proof: string;
  readonly sourceIds: readonly string[];
  readonly detail: string;
}
export function competitiveDecisionDrivers(scope: IRevenueScope): readonly ICompetitiveDecisionDriver[] {
  const scopeProof = scopedEvidence(scope).find(item => item.id === 'EV-01' && item.kind === 'verified');
  if (scopeProof) return [
    { id: 'CMP-security', label: 'Security assurance', weight: 35, proof: 'Controls unconfirmed', sourceIds: ['EV-05'], detail: 'Proposed emphasis on retiring two unresolved controls. EV-05 is inference, not accepted controls or a competitor rating.' },
    { id: 'CMP-rollout', label: 'Global rollout', weight: 30, proof: 'Scope recorded', sourceIds: ['EV-01'], detail: 'EV-01 confirms the 18-country scope. The 30% importance is a workshop proposal, not a buyer-approved weight or proof of vendor superiority.' },
    { id: 'CMP-value', label: 'Customer value', weight: 25, proof: 'Owner only', sourceIds: ['EV-02'], detail: 'EV-02 records business-case ownership, not validated ROI. Propose a 25% outcome weighting and ask the customer to confirm it.' },
    { id: 'CMP-terms', label: 'Commercial fit', weight: 10, proof: 'Terms unapproved', sourceIds: scope.exception ? [scope.exception.id] : [], detail: 'Compare payment flexibility only after commercial-policy review. Proposed 10% importance is not approved terms or competitive performance.' }
  ];
  return [
    { id: 'CMP-budget', label: 'Budget efficiency', weight: 35, proof: 'Not recorded', sourceIds: [], detail: 'Discovery-workshop assumption: validate funding constraints before accepting this proposed weight.' },
    { id: 'CMP-fit', label: 'Integration fit', weight: 30, proof: 'Not recorded', sourceIds: [], detail: 'Discovery-workshop assumption: ask for the customer integration criteria and a scored proof exercise.' },
    { id: 'CMP-process', label: 'Decision process', weight: 20, proof: 'Not recorded', sourceIds: [], detail: 'Discovery-workshop assumption: identify decision rights and procurement steps; no approved customer scorecard exists.' },
    { id: 'CMP-pilot', label: 'Pilot proof', weight: 15, proof: 'Not recorded', sourceIds: [], detail: 'Discovery-workshop assumption: agree measurable pilot acceptance criteria. No vendor has been scored.' }
  ];
}
export function analysisRows(key: RevenueIntentKey, scope: IRevenueScope): readonly IBusinessRow[] {
  const evidence = scopedEvidence(scope);
  const hasProof = evidence.length > 0;
  const row = (id: string, title: string, detail: string, source: string, kind = 'inference'): IBusinessRow => ({ id, title, detail, source, kind });
  switch (key) {
    case 'BuildAccountBrief':
      return [
        row('account', `${scope.account?.name} · ${scope.account?.segment}`, `Region: ${scope.account?.region}. ${OPPORTUNITIES.filter(item => item.accountId === scope.account?.id).length} recorded opportunities.`, 'Account graph', 'source fact'),
        ...OPPORTUNITIES.filter(item => item.accountId === scope.account?.id).map(item => row(item.id, item.name, `${currency(item.value)} open; ${item.stage}; ${Math.round(item.probability * 100)}% seller judgment. Quarter offset ${item.quarterOffset}.`, 'Recorded demo account opportunity book', 'source fact / seller judgment')),
        ...evidence.filter(item => item.kind === 'verified' || item.kind === 'stale').map(item => row(item.id, item.title, item.detail, `${item.source} · ${item.ageDays}d`, item.kind)),
        row('whitespace', 'Whitespace hypothesis', hasProof ? '18-country rollout suggests an adoption workstream; validate budget with Nestor before treating it as pipeline.' : 'No validated expansion signal recorded. Schedule discovery before estimating whitespace.', 'Account graph + evidence assessment')
      ];
    case 'MapBuyingCommittee':
      return scopedContacts(scope).map(item => row(item.id, `${item.name} · ${item.role}`, `Stance: ${item.stance}; influence ${item.influence}/100. ${item.name === 'Lee Gu' ? 'Direct economic sponsor access is not evidenced; Megan owns the introduction.' : 'Confirm decision rights with the customer; influence does not establish authority.'}`, 'Seeded relationship graph', 'source fact'));
    case 'GetDealRisk':
      return evidence.filter(item => item.kind !== 'verified').map((item, index) => row(item.id, `${index + 1}. ${item.title}`, `${item.detail} Owner: ${index === 0 ? 'Megan Bowen' : 'Pradeep Gupta'}. ${item.kind === 'contrary' ? 'Request a buyer-confirmed sponsor review.' : 'Validate the assumption before carrying the close date.'}`, `${item.source} · ${item.ageDays}d`, item.kind));
    case 'PrepareCustomerMeeting':
      return scope.meeting ? [
        row('agenda', 'Steering agenda · 30 minutes', `Meeting ${scope.meeting.id}: ${scope.meeting.name}. Attendees: ${scope.meeting.attendees.join(', ')}. Proposed allocation: ${proposedMeetingAgenda(scope).map(item => `${item.label} ${item.minutes}m`).join('; ')}.`, 'Calendar + prepared agenda', 'source fact / draft'),
        row('questions', 'Questions that earn buyer proof', hasProof ? 'Who owns the two unresolved controls? Can Nestor secure a direct CFO review? Which launch date can the customer confirm?' : 'Who owns budget, success criteria and procurement? No prior buyer commitments are recorded.', 'Preparation inference'),
        ...evidence.filter(item => item.kind === 'verified').map(item => row(item.id, `Bring proof: ${item.title}`, item.detail, item.source, 'verified'))
      ] : [];
    case 'TrackMeetingFollowUp':
      return scopedMilestones(scope).map(item => row(item.id, `${item.title} · ${item.status}`, `${item.side} owner: ${item.owner}; due ${item.dueOffsetDays} days relative to showcase date. ${item.status === 'blocked' ? 'Escalate sponsor introduction; signature depends on this checkpoint.' : 'Completion requires source evidence, not an elapsed due date.'}`, scope.meeting?.source || 'Joint close plan', item.status === 'complete' ? 'verified' : 'source fact'));
    case 'ResearchCompetitivePosition':
      return [
        row('criteria', 'Decision criteria, not invented competitor claims', hasProof ? 'Customer confirmed 18-country deployment. Compare rollout proof, control evidence and adoption ownership.' : 'Customer evaluation criteria are not recorded. Obtain the scorecard first.', 'EV-01 / meeting transcript', hasProof ? 'verified' : 'evidence gap'),
        row('incumbent', 'Incumbent status · unverified', 'No named competitor or public benchmark is stored in this offline graph. Do not assert product superiority.', 'Research coverage', 'evidence gap'),
        ...competitiveDecisionDrivers(scope).map(item => row(item.id, `${item.label} / ${item.weight}% proposed importance`, `${item.detail} Available proof: ${item.proof}.`, `Proposed workshop weighting; ${item.sourceIds.length ? item.sourceIds.join(', ') : 'no buyer evidence'}`, 'workshop proposal')),
        row('proof', 'Differentiation proof plan', 'Offer a customer-scored control workshop and country rollout reference. Ask the buyer to weight each criterion before scoring.', 'Strategy inference')
      ];
    case 'CoachDealStrategy':
      return [
        row('access', 'Play 1 · earn economic access', hasProof ? 'Ask Nestor to introduce Megan to the CFO. Measure success by a buyer-accepted sponsor review, not a seller activity.' : 'Identify an accountable champion before proposing an executive introduction.', 'Relationship graph + EV-03'),
        row('proof', 'Play 2 · retire the technical dependency', 'Run a control-evidence workshop with a named technical owner. Stop escalating commercial urgency until acceptance criteria are explicit.', 'Critical-path assessment'),
        row('tradeoff', 'Counterplay · avoid premature discounting', 'A lower price does not resolve missing authority or launch evidence. Compare a phased rollout after validating the decision path.', 'Coaching inference · no forecast change')
      ];
    default: return [];
  }
}

export interface IBusinessField { readonly name: string; readonly label: string; readonly initial: string; readonly options?: readonly string[]; readonly numeric?: boolean; }
export interface IReviewValuePart { readonly field: IBusinessField; readonly value: string; readonly part: number; readonly partCount: number; }
export function workflowReviewPages(fields: readonly IBusinessField[], draft: Readonly<Record<string, string>>): readonly (readonly IReviewValuePart[])[] {
  const long = fields.some(field => Array.from(draft[field.name] || '').length > 240);
  if (!long) {
    const pages: IReviewValuePart[][] = [];
    for (let index = 0; index < fields.length; index += 3) pages.push(fields.slice(index, index + 3).map(field => ({ field, value: draft[field.name] || '', part: 1, partCount: 1 })));
    return pages;
  }
  const pages: IReviewValuePart[][] = [];
  fields.forEach(field => {
    const characters = Array.from(draft[field.name] || '');
    const count = Math.max(1, Math.ceil(characters.length / 240));
    for (let index = 0; index < count; index++) pages.push([{ field, value: characters.slice(index * 240, index * 240 + 240).join(''), part: index + 1, partCount: count }]);
  });
  return pages;
}
export interface IWorkflow {
  readonly heading: string;
  readonly evidence: string;
  readonly fields: readonly IBusinessField[];
  readonly blockedChoices: readonly string[];
}
const field = (name: string, label: string, initial: string, options?: readonly string[], numeric?: boolean): IBusinessField => ({ name, label, initial, options, numeric });
export function workflowFor(key: RevenueIntentKey, scope: IRevenueScope): IWorkflow | undefined {
  const milestone = scopedMilestones(scope).find(item => item.status !== 'complete');
  const hasProof = scopedEvidence(scope).length > 0;
  const customerOwner = hasProof ? 'Nestor Wilke' : '';
  const outcome = hasProof ? '18-country operating model' : '';
  switch (key) {
    case 'QualifyOpportunity': return {
      heading: 'Evidence-based pursuit gate', evidence: 'Buyer scope is evidenced only for ZDR-2042. Economic authority and security acceptance are not verified. Pursue cannot pass this gate.',
      fields: [field('decision', 'Qualification decision', 'Return for discovery', ['Pursue', 'Return for discovery', 'Decline pursuit']), field('owner', 'Discovery owner', 'Megan Bowen'), field('criteria', 'Missing qualification evidence', 'Buyer budget and decision authority')],
      blockedChoices: ['Pursue']
    };
    case 'BuildMutualActionPlan': return {
      heading: 'Joint buyer / seller close runway', evidence: hasProof ? 'Security +5d → sponsor +9d → commercial +14d → signature +21d. Buyer acceptance is not recorded for this draft.' : 'No buyer-accepted milestones recorded. Draft a proposed dependency path; the 21-day minimum is a deterministic planning assumption.',
      fields: [field('milestone', 'Next joint milestone', milestone?.title || 'Confirm buyer success criteria'), field('buyer', 'Buyer accountable owner', scopedContacts(scope)[0]?.name || ''), field('seller', 'Seller accountable owner', 'Megan Bowen'), field('days', 'Target signature in days', '21', undefined, true), field('dependency', 'Critical dependency', 'Security evidence before economic sponsor review')],
      blockedChoices: []
    };
    case 'ReviewMeetingCommitments': return {
      heading: 'Transcript-to-commitment reconciliation', evidence: scope.meeting?.id === 'MTG-2042' ? 'Transcript: rollout scope confirmed. Customer email: Nestor owns the joint value review. No CFO attendance or security acceptance is evidenced.' : 'No meeting transcript available; accept is blocked.',
      fields: [field('commitment', 'Proposed customer commitment', hasProof ? 'Nestor owns joint value review' : 'No sourced commitment', hasProof ? ['Nestor owns joint value review', 'CFO approved funding', 'Security accepted'] : ['No sourced commitment']), field('decision', 'Reconciliation decision', 'Return for clarification', ['Accept supported commitment', 'Return for clarification', 'Reject proposed update']), field('owner', 'Follow-up owner', 'Megan Bowen'), field('note', 'Evidence rationale', hasProof ? 'Reconcile to customer email, not seller inference' : 'Request a transcript before accepting proposed updates')],
      blockedChoices: []
    };
    case 'ShapeSolutionProposal': return {
      heading: 'Outcome-to-proof proposal builder', evidence: `${scope.proposal?.name || 'No proposal record'} · country rollout confirmed only where EV-01 exists. Security proof remains incomplete.`,
      fields: [field('outcome', 'Customer outcome', outcome), field('requirement', 'Requirement and proof', hasProof ? 'Country rollout → steering transcript EV-01' : ''), field('adoption', 'Adoption owner and plan', hasProof ? 'Nestor · phased country onboarding' : ''), field('exclusions', 'Explicit exclusions', 'Unverified controls and unapproved payment terms excluded'), field('owner', 'Solution owner', 'Pradeep Gupta')],
      blockedChoices: []
    };
    case 'ReviewDealException': return {
      heading: 'Payment-term policy decision', evidence: `${scope.exception?.name || 'No exception record'}. Policy Net 30; requested Net ${scope.exception?.requestedDays || 60}. Finance + legal approval absent. Prompt text cannot confer approval.`,
      fields: [field('decision', 'Exception decision', 'Return with conditions', ['Approve exception', 'Return with conditions', 'Decline exception']), field('days', 'Proposed payment days', String(scope.exception?.requestedDays || 60), undefined, true), field('condition', 'Mitigation or decline rationale', 'Require finance + legal sign-off and milestone billing'), field('owner', 'Finance review owner', 'Miriam Graham')],
      blockedChoices: ['Approve exception']
    };
    case 'InspectForecastCommit': return {
      heading: 'Buyer-proof forecast category review', evidence: 'Seller momentum is judgment, not commit authority. Sponsor access, launch confirmation and control acceptance remain missing.',
      fields: [field('decision', 'Forecast recommendation', 'Move to best case', ['Retain commit', 'Move to best case', 'Remove from period']), field('probability', 'Scenario probability (0–1)', String(scope.opportunity?.probability || 0.3), undefined, true), field('condition', 'Re-entry condition', 'Buyer-confirmed sponsor review and security acceptance'), field('owner', 'Manager reviewer', 'Joni Sherman')],
      blockedChoices: ['Retain commit']
    };
    case 'CreateExecutiveEngagementPlan': return {
      heading: 'Purposeful sponsor introduction plan', evidence: hasProof ? 'EV-03: direct economic buyer access is missing. This drafts a plan; it does not send an invitation.' : 'No sourced executive relationship path recorded. Name a buyer and introduction owner before reviewing.',
      fields: [field('sponsor', 'Internal executive sponsor', 'Joni Sherman'), field('buyer', 'Customer executive target', hasProof ? 'Lee Gu' : ''), field('objective', 'Meeting objective', 'Confirm investment criteria and decision rights'), field('path', 'Warm introduction and relationship owner', hasProof ? 'Nestor → Megan → Lee' : ''), field('sensitivity', 'Sensitivities and message guardrails', 'No unapproved pricing or launch commitments')],
      blockedChoices: []
    };
    case 'BuildValueCase': return {
      heading: 'Customer-defensible investment model', evidence: 'Editable deterministic assumptions, not verified customer savings. Benefits are annual; investment and onboarding are one-time.',
      fields: [field('hours', 'Annual hours saved', '12000', undefined, true), field('rate', 'Loaded hourly cost (USD)', '85', undefined, true), field('adoption', 'Realized adoption percent', '70', undefined, true), field('investment', 'Investment (USD)', '450000', undefined, true), field('onboarding', 'Onboarding cost (USD)', '75000', undefined, true), field('owner', 'Customer validation owner', customerOwner)],
      blockedChoices: []
    };
    case 'ReviewProposalReadiness': return {
      heading: 'Customer-release readiness gate', evidence: `${scope.proposal?.id || 'No proposal'}: security evidence incomplete, claims unverified and terms unapproved. Readiness cannot be granted by this demo.`,
      fields: [field('decision', 'Readiness decision', 'Return to author', ['Ready for customer', 'Return to author', 'Decline release']), field('gap', 'Blocking gap and correction', 'Attach control proof and remove unverified launch claim'), field('owner', 'Correction owner', 'Pradeep Gupta')],
      blockedChoices: ['Ready for customer']
    };
    case 'PlanCustomerSuccessHandoff': return {
      heading: 'Sold-outcome transition draft', evidence: 'No signed agreement recorded. Handoff remains a planning draft, not a closed-won or delivery authorization.',
      fields: [field('outcome', 'Sold outcome to validate', outcome), field('metric', 'Success metric', hasProof ? 'First 3 countries adopted within 90 days' : ''), field('owner', 'Success owner', 'Patti Fernandez'), field('days', 'First success checkpoint in days', '30', undefined, true), field('dependency', 'Prerequisite and customer risk', 'Signed scope, control acceptance and named customer adoption owner')],
      blockedChoices: []
    };
    default: return undefined;
  }
}
export function initialDraft(workflow: IWorkflow): Record<string, string> {
  const result: Record<string, string> = {};
  workflow.fields.forEach(item => { result[item.name] = item.initial; });
  return result;
}
export function workflowErrors(key: RevenueIntentKey, scope: IRevenueScope, workflow: IWorkflow, draft: Readonly<Record<string, string>>): readonly string[] {
  const errors = workflow.fields.filter(item => !draft[item.name]?.trim()).map(item => `${item.label} is required`);
  workflow.fields.filter(item => !item.numeric && (draft[item.name]?.length || 0) > 1000).forEach(item => errors.push(`${item.label} must contain at most 1,000 characters`));
  if (workflow.blockedChoices.indexOf(draft.decision) >= 0) errors.push('Missing independent buyer proof or approval. Return or decline remains available.');
  workflow.fields.filter(item => item.numeric).forEach(item => {
    const value = Number(draft[item.name]);
    const max = item.name === 'probability' ? 1 : item.name === 'adoption' ? 100 : item.name === 'days' ? 365 : 100000000;
    if (!Number.isFinite(value) || value < 0 || value > max || (item.name === 'days' && value < 1)) errors.push(`${item.label} must be within ${item.name === 'days' ? 1 : 0}–${max}`);
  });
  if (key === 'ReviewMeetingCommitments' && draft.decision === 'Accept supported commitment' && (scope.meeting?.id !== 'MTG-2042' || draft.commitment !== 'Nestor owns joint value review')) errors.push('The selected commitment has no supporting transcript or email');
  if (key === 'BuildMutualActionPlan' && Number(draft.days) < 21) errors.push('Signature cannot precede the 21-day dependency runway');
  if (key === 'ReviewMeetingCommitments' && !scope.meeting) errors.push('A known meeting record is required');
  if (['ReviewProposalReadiness', 'ShapeSolutionProposal'].indexOf(key) >= 0 && !scope.proposal) errors.push('A known proposal record is required');
  if (key === 'ReviewDealException' && !scope.exception) errors.push('A known exception record is required');
  return errors;
}
export function workflowCalculation(key: RevenueIntentKey, scope: IRevenueScope, draft: Readonly<Record<string, string>>): string {
  if (key === 'BuildValueCase') {
    const { benefit, cost, halfAdoptionBenefit } = valueCaseEconomics(draft);
    return `Scenario annual benefit ${currency(benefit)}; first-year net ${currency(benefit - cost)}; payback ${benefit > 0 ? `${(cost / benefit * 12).toFixed(1)} months` : 'not reached'}; at 50% adoption ${currency(halfAdoptionBenefit)} annual benefit.`;
  }

  if (key === 'InspectForecastCommit') return `Scenario weighted value ${currency((scope.opportunity?.value || 0) * Number(draft.probability))}; proposed period contribution ${currency(draft.decision === 'Remove from period' ? 0 : (scope.opportunity?.value || 0) * Number(draft.probability))}. This does not update CRM.`;
  if (key === 'ReviewDealException') return `Incremental receivables exposure: ${currency((scope.opportunity?.value || 0) * Math.max(0, Number(draft.days) - 30) / 365)} at ${draft.days} days (TCV × incremental days / 365). Finance + legal still required.`;
  if (key === 'BuildMutualActionPlan') return `Proposed signature +${draft.days}d; dependency slack ${Number(draft.days) - 21}d; buyer acceptance pending.`;
  if (key === 'PlanCustomerSuccessHandoff') return `First success checkpoint +${draft.days}d after signed-scope handoff, not today.`;
  return '';
}

export function valueCaseEconomics(draft: Readonly<Record<string, string>>): { benefit: number; cost: number; halfAdoptionBenefit: number } {
  const fullBenefit = Number(draft.hours) * Number(draft.rate);
  return { benefit: fullBenefit * Number(draft.adoption) / 100, cost: Number(draft.investment) + Number(draft.onboarding), halfAdoptionBenefit: fullBenefit * 0.5 };
}
