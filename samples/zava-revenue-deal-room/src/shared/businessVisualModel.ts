import { INTENTS, type IIntentDefinition } from './catalog';
import { OPPORTUNITIES } from './domain';
import {
  currency, scopedContacts, scopedEvidence, scopedMilestones, valueCaseEconomics, proposedMeetingAgenda,
  type IBusinessRow, type IRevenueScope
} from './operations';

export interface IBusinessVisualItem {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly source: string;
  readonly state: string;
  readonly value?: number;
  readonly secondary?: number;
  readonly days?: number;
  readonly owner?: string;
}
export interface IBusinessVisualMetric {
  readonly label: string;
  readonly value?: number;
  readonly display: string;
  readonly unit: string;
}
export type BusinessVisualKind =
  | 'account-growth-footprint' | 'buyer-relationship-network' | 'signature-blocker-network'
  | 'meeting-agenda-clock' | 'mutual-dependency-plan' | 'meeting-claim-reconciliation'
  | 'requirement-proof-trace' | 'working-capital-runway' | 'forecast-buyer-proof-funnel'
  | 'strategy-choice-canvas' | 'executive-introduction-path' | 'commitment-owner-board'
  | 'customer-payback-timeline' | 'proposal-release-controls' | 'success-outcome-canvas'
  | 'business-capability-map' | 'pipeline-health-matrix' | 'country-opportunity-footprint';
export interface IBusinessVisualModel {
  readonly kind: BusinessVisualKind;
  readonly title: string;
  readonly items: readonly IBusinessVisualItem[];
  readonly metrics: readonly IBusinessVisualMetric[];
  readonly semantics: string;
  readonly errors: readonly string[];
}
export interface IBusinessVisualInput {
  readonly definition: IIntentDefinition;
  readonly scope: IRevenueScope;
  readonly rows: readonly IBusinessRow[];
  readonly draft: Readonly<Record<string, string>>;
  readonly stage: string;
  readonly status?: string;
  readonly query?: string;
}
const metric = (label: string, value: number | undefined, display: string, unit: string): IBusinessVisualMetric => ({ label, value, display, unit });
const money = (label: string, value: number): IBusinessVisualMetric => metric(label, value, currency(value), 'USD');
const model = (kind: BusinessVisualKind, title: string, items: readonly IBusinessVisualItem[], metrics: readonly IBusinessVisualMetric[], semantics: string, errors: readonly string[] = []): IBusinessVisualModel =>
  ({ kind, title, items, metrics, semantics, errors });
const inputNumber = (draft: Readonly<Record<string, string>>, name: string, minimum: number, maximum: number): number | undefined => {
  const raw = draft[name];
  if (!raw?.trim()) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= minimum && value <= maximum ? value : undefined;
};
export function meetingAgenda(scope: IRevenueScope): readonly { readonly label: string; readonly minutes: number }[] {
  return proposedMeetingAgenda(scope);
}
export function businessVisualModel(input: IBusinessVisualInput): IBusinessVisualModel {
  const { definition, scope, draft } = input;
  const evidence = scopedEvidence(scope);
  const contacts = scopedContacts(scope);
  const milestones = scopedMilestones(scope);
  const opportunities = OPPORTUNITIES.filter(item => item.accountId === scope.account?.id);
  const known = (id: string): boolean => evidence.some(item => item.id === id && item.kind === 'verified');
  switch (definition.key) {
    case 'BuildAccountBrief': {
      const items = opportunities.map(item => ({ id: item.id, label: item.name, value: item.value, secondary: item.value * item.probability, state: item.stage, detail: `${item.stage}; ${Math.round(item.probability * 100)}% seller probability; quarter offset ${item.quarterOffset}.`, source: 'Offline account opportunity catalog' }));
      return model('account-growth-footprint', 'Account growth footprint', items, [
        money('Recorded open book', items.reduce((sum, item) => sum + item.value, 0)),
        metric('Opportunity records', items.length, String(items.length), 'records')
      ], 'Area represents recorded demo opportunity value by account. Seller weighting is judgment; these are not whitespace forecasts or new leads.');
    }
    case 'MapBuyingCommittee':
      return model('buyer-relationship-network', 'Decision roles and access', contacts.slice(0, 6).map(item => ({ id: item.id, label: item.name, owner: item.role, value: item.influence, state: item.stance, detail: `${item.role}; ${item.stance}; demo influence ${item.influence}. Membership does not establish decision authority.`, source: 'Recorded demo relationship graph' })), [
        metric('Recorded buyer roles', contacts.length, String(contacts.length), 'contacts'),
        metric('Sponsor access', undefined, evidence.some(item => item.id === 'EV-03') ? 'Not evidenced' : 'Unknown', 'evidence status')
      ], 'Nodes are recorded contacts; size is a stored demo influence assessment, not authority or probability. Economic-buyer access still requires evidence.');
    case 'GetDealRisk': {
      const deadline: Readonly<Record<string, number>> = { 'EV-03': 9, 'EV-04': 21, 'EV-05': 5 };
      const labels: Readonly<Record<string, string>> = { 'EV-03': 'Sponsor access', 'EV-04': 'Buyer launch date', 'EV-05': 'Control acceptance', 'EV-06': 'Seller momentum' };
      return model('signature-blocker-network', 'Evidence-to-signature blockers', evidence.filter(item => item.kind !== 'verified').map(item => ({ id: item.id, label: labels[item.id] || item.title, state: item.kind, days: deadline[item.id], detail: item.detail, source: `${item.source}; ${item.ageDays}d old`, owner: item.id === 'EV-03' ? 'Megan Bowen' : 'Pradeep Gupta' })), [
        metric('Open deal value', scope.opportunity?.value, scope.opportunity ? currency(scope.opportunity.value) : 'No known deal', 'USD'),
        metric('Observed nonverified signals', evidence.filter(item => item.kind !== 'verified').length, String(evidence.filter(item => item.kind !== 'verified').length), 'records')
      ], 'Connections identify relevant close-plan checkpoints, not causal revenue-loss estimates. Missing evidence is unknown; seller momentum is judgment.');
    }
    case 'PrepareCustomerMeeting':
      return model('meeting-agenda-clock', 'A meeting that earns buyer proof', meetingAgenda(scope).map((item, index) => ({ id: `agenda-${index}`, label: item.label, value: item.minutes, state: 'proposal', detail: `${item.minutes} proposed minutes in ${scope.meeting?.name}.`, source: 'Known calendar meeting + proposed agenda' })), [
        metric('Proposed agenda', scope.meeting ? 30 : undefined, scope.meeting ? '30 minutes' : 'No known meeting', 'minutes'),
        metric('Known attendees', scope.meeting?.attendees.length || 0, String(scope.meeting?.attendees.length || 0), 'calendar attendees')
      ], 'Agenda allocation is proposed, not accepted meeting outcomes. The steering and discovery meetings use different objectives and time allocations.');
    case 'BuildMutualActionPlan': {
      const days = inputNumber(draft, 'days', 1, 365);
      const items = milestones.filter(item => item.dueOffsetDays >= 0).map(item => ({ id: item.id, label: item.id === 'MS-02' ? 'Security' : item.id === 'MS-03' ? 'Sponsor' : item.id === 'MS-04' ? 'Terms' : 'Target', days: item.id === 'MS-05' && days !== undefined ? days : item.dueOffsetDays, state: item.id === 'MS-05' ? 'proposal' : item.status, owner: item.owner, detail: item.title, source: 'Recorded close plan; final target is the edited draft' }));
      return model('mutual-dependency-plan', 'Owned dependency plan', items, [
        metric('Proposed target', days, days === undefined ? 'Correct target days' : `+${days} days`, 'days'),
        metric('Buyer / seller ownership', undefined, `${draft.buyer || 'Missing buyer'} / ${draft.seller || 'Missing seller'}`, 'draft owners')
      ], `Draft milestone: ${draft.milestone || '(not entered)'}. Dependencies and owners remain proposals until customer acceptance. The 21-day minimum is the existing deterministic gate.`, days === undefined ? ['Enter valid target days to model the dependency plan.'] : []);
    }
    case 'ReviewMeetingCommitments': {
      const supported = scope.meeting?.id === 'MTG-2042' && known('EV-02');
      return model('meeting-claim-reconciliation', 'What was said versus proposed', [
        { id: 'claim-owner', label: 'Value-review owner', state: supported ? 'verified' : 'unknown', value: supported ? 1 : 0, detail: 'Nestor owns joint value review', source: supported ? 'EV-02 / customer email' : 'No supporting transcript or email' },
        { id: 'claim-funding', label: 'CFO funding approval', state: 'unknown', value: 0, detail: 'No CFO approval record', source: 'Missing buyer proof' },
        { id: 'claim-controls', label: 'Security acceptance', state: 'unknown', value: 0, detail: 'Two unresolved controls', source: 'No accepted control evidence' }
      ], [metric('Supported proposed claims', supported ? 1 : 0, `${supported ? 1 : 0} of 3`, 'claims'), metric('Current reconciliation', undefined, draft.decision || 'Choose a decision', 'draft judgment')], 'Support is checked against the known meeting and customer email. A seller-proposed funding or security claim is not established by choosing it.');
    }
    case 'ShapeSolutionProposal':
      return model('requirement-proof-trace', 'Outcome-to-proof traceability', [
        { id: 'requirement-draft', label: 'Draft requirement', state: 'proposal', detail: draft.requirement || 'Requirement not entered', source: 'Current editable proposal' },
        { id: 'scope-proof', label: 'Deployment scope', state: known('EV-01') ? 'verified' : 'unknown', detail: known('EV-01') ? '18-country scope recorded' : 'No scope proof', source: known('EV-01') ? 'EV-01 / steering transcript' : 'Missing source' },
        { id: 'control-proof', label: 'Control acceptance', state: scope.proposal?.securityComplete ? 'verified' : 'missing', detail: scope.proposal?.securityComplete ? 'Control record complete' : 'Attach customer-accepted controls', source: scope.proposal?.id || 'Missing proposal' }
      ], [metric('Customer outcome', undefined, draft.outcome || 'Enter outcome', 'draft'), metric('Solution owner', undefined, draft.owner || 'Name an owner', 'draft owner')], `Adoption plan: ${draft.adoption || 'not entered'}. A drafted requirement does not prove equivalence with the related scope evidence; exclusions remain explicit.`);
    case 'ReviewDealException': {
      const days = inputNumber(draft, 'days', 1, 365);
      const open = scope.opportunity?.value;
      const exposure = days !== undefined && open !== undefined ? open * Math.max(0, days - 30) / 365 : undefined;
      return model('working-capital-runway', 'Cash timing and capital exposure', [
        { id: 'policy', label: 'Policy due', days: 30, state: 'verified', detail: 'Net 30 baseline', source: 'Commercial policy' },
        { id: 'request', label: 'Proposed due', days, state: 'proposal', detail: scope.exception?.name || 'No exception', source: scope.exception?.id || 'Missing record' }
      ], [metric('Incremental receivables exposure', exposure, exposure === undefined ? 'Correct payment days' : currency(exposure), 'USD'), metric('Required review', undefined, 'Finance + legal / not granted', 'authority')], 'Exposure = TCV × extra payment days / 365. This is working-capital exposure, not interest cost, lost revenue or approval.', exposure === undefined ? ['Enter valid payment days for a known deal.'] : []);
    }
    case 'InspectForecastCommit': {
      const probability = inputNumber(draft, 'probability', 0, 1);
      const open = scope.opportunity?.value;
      const weighted = probability !== undefined && open !== undefined ? open * probability : undefined;
      return model('forecast-buyer-proof-funnel', 'Seller outlook versus buyer proof', [
        { id: 'sponsor', label: 'Sponsor access', state: evidence.some(item => item.id === 'EV-03') ? 'blocked' : 'unknown', detail: 'Independent economic access is not evidenced', source: 'Buyer relationship evidence' },
        { id: 'controls', label: 'Control acceptance', state: scope.proposal?.securityComplete ? 'verified' : 'missing', detail: 'Customer acceptance required', source: scope.proposal?.id || 'No source' },
        { id: 'launch', label: 'Buyer timing', state: evidence.some(item => item.id === 'EV-04') ? 'stale' : 'unknown', detail: 'Current buyer-confirmed date required', source: 'Forecast evidence, not elapsed time' }
      ], [metric('Seller-weighted value', weighted, weighted === undefined ? 'Correct probability' : currency(weighted), 'USD / seller judgment'), metric('Proposed period contribution', weighted === undefined ? undefined : draft.decision === 'Remove from period' ? 0 : weighted, weighted === undefined ? 'Not modeled' : currency(draft.decision === 'Remove from period' ? 0 : weighted), 'USD / recommendation')], 'Seller probability is not buyer proof. Commit remains blocked without the required evidence; moving a draft category does not update CRM.', weighted === undefined ? ['Enter a valid 0–1 scenario probability.'] : []);
    }
    case 'CoachDealStrategy':
      return model('strategy-choice-canvas', 'Choose the play that removes a constraint', [
        { id: 'access', label: 'Earn buyer access', state: evidence.some(item => item.id === 'EV-03') ? 'blocked' : 'unknown', detail: 'Secure a buyer-accepted sponsor review', source: 'Relationship proof / EV-03' },
        { id: 'proof', label: 'Retire control dependency', state: evidence.some(item => item.id === 'EV-05') ? 'unconfirmed' : 'unknown', detail: 'Name a control-evidence owner and acceptance test', source: 'Control inference / EV-05' },
        { id: 'tradeoff', label: 'Protect commercial value', state: 'proposal', detail: 'Discounting does not establish authority or a date', source: 'Explainable strategy constraint' }
      ], [metric('Recorded scope proof', known('EV-01') ? 1 : 0, known('EV-01') ? 'Scope confirmed' : 'Discovery required', 'buyer evidence'), metric('Observed strategy constraints', evidence.filter(item => item.kind === 'contrary' || item.kind === 'inference').length, String(evidence.filter(item => item.kind === 'contrary' || item.kind === 'inference').length), 'source observations')], 'Plays are explainable proposals, not predicted win-rate uplift, performed outreach or forecast decisions.');
    case 'CreateExecutiveEngagementPlan':
      return model('executive-introduction-path', 'A purposeful proposed introduction', [
        { id: 'internal-sponsor', label: draft.sponsor || 'Name sponsor', owner: 'Internal sponsor', state: 'proposal', detail: draft.objective || 'Enter objective', source: 'Edited engagement draft' },
        { id: 'relationship-path', label: scope.account?.id === 'CONTOSO' ? 'Nestor Wilke' : 'Buyer path unknown', owner: 'Relationship bridge', state: scope.account?.id === 'CONTOSO' ? 'recorded role' : 'missing', detail: draft.path || 'Name a sourced introduction path', source: 'Recorded relationship / proposed path' },
        { id: 'buyer-target', label: draft.buyer || 'Name buyer', owner: 'Customer executive', state: 'unconfirmed', detail: 'Direct executive access is not established by this draft', source: 'Proposed target / buyer evidence required' }
      ], [metric('Meeting purpose', undefined, draft.objective || 'Enter objective', 'draft'), metric('Access', undefined, 'Not yet evidenced', 'buyer evidence')], `Guardrails: ${draft.sensitivity || 'not entered'}. Connections are proposed steps, not existing contact, sent invitations or pricing commitments.`);
    case 'TrackMeetingFollowUp': {
      const shown = milestones.filter(item => (!input.status || input.status === 'all' || item.status === input.status) && (!input.rows.length || input.rows.some(row => row.id === item.id)));
      return model('commitment-owner-board', 'Buyer and seller commitment ledger', shown.map(item => ({ id: item.id, label: item.title, days: item.dueOffsetDays, owner: item.owner, state: item.status, detail: `${item.side} owner; ${item.status}; ${item.dueOffsetDays >= 0 ? '+' : ''}${item.dueOffsetDays} days`, source: scope.meeting?.source || 'Recorded joint close plan', value: item.side === 'buyer' ? 0 : 1 })), [
        metric('Recorded completion', milestones.filter(item => item.status === 'complete').length, `${milestones.filter(item => item.status === 'complete').length} / ${milestones.length}`, 'milestones'),
        metric('Unresolved dependencies', milestones.filter(item => item.status === 'blocked' || item.status === 'at-risk').length, String(milestones.filter(item => item.status === 'blocked' || item.status === 'at-risk').length), 'recorded statuses')
      ], 'Board lanes are buyer versus seller ownership for the displayed records. Due dates do not imply completion; totals refer to the recorded close plan.');
    }
    case 'BuildValueCase': {
      const fields = ['hours', 'rate', 'adoption', 'investment', 'onboarding'];
      const valid = fields.every(key => inputNumber(draft, key, 0, key === 'adoption' ? 100 : 100000000) !== undefined);
      if (!valid) return model('customer-payback-timeline', 'Customer investment payback', [], [], 'Editable annual benefit and one-time cost assumptions, not customer-validated savings.', ['Correct the benefit and investment assumptions.']);
      const { benefit, cost } = valueCaseEconomics(draft);
      return model('customer-payback-timeline', 'Customer investment payback', [0, 3, 6, 9, 12].map(month => ({ id: `month-${month}`, label: `${month}m`, value: benefit * month / 12 - cost, days: month, state: 'calculation', detail: 'Cumulative modeled benefit less one-time investment', source: 'Current editable hours, rate, adoption and costs' })), [
        money('Annual modeled benefit', benefit),
        metric('Payback', benefit > 0 ? cost / benefit * 12 : undefined, benefit > 0 ? `${(cost / benefit * 12).toFixed(1)} months` : 'Not reached', 'months'),
        money('First-year net', benefit - cost)
      ], 'Benefits are annual and costs one-time. Payback is deterministic math on draft assumptions, not guaranteed customer return.');
    }
    case 'ReviewProposalReadiness': {
      const controls = [
        { id: 'security', label: 'Control evidence', state: scope.proposal?.securityComplete ? 'verified' : 'missing', detail: 'Customer-accepted security proof', source: scope.proposal?.id || 'No proposal' },
        { id: 'claims', label: 'Supported claims', state: scope.proposal?.claimsVerified ? 'verified' : 'missing', detail: 'No unsupported customer-release claim', source: scope.proposal?.id || 'No proposal' },
        { id: 'terms', label: 'Commercial authority', state: scope.exception?.approved ? 'verified' : 'missing', detail: 'Independent terms approval', source: scope.exception?.id || 'No approval record' }
      ];
      return model('proposal-release-controls', 'Customer-release control board', controls, [metric('Passed hard controls', controls.filter(item => item.state === 'verified').length, `${controls.filter(item => item.state === 'verified').length} / ${controls.length}`, 'controls'), metric('Proposed disposition', undefined, draft.decision || 'Choose a recommendation', 'draft')], 'Control flags come from stored demo proposal/exception records. A readiness draft is not customer-release authorization.');
    }
    case 'PlanCustomerSuccessHandoff': {
      const days = inputNumber(draft, 'days', 1, 365);
      return model('success-outcome-canvas', 'Sold promise to measurable ownership', [
        { id: 'outcome', label: 'Customer outcome', state: 'proposal', detail: draft.outcome || 'Enter the sold outcome', source: 'Edited success draft' },
        { id: 'measure', label: 'Acceptance measure', state: 'proposal', detail: draft.metric || 'Enter the success measure', source: 'Customer validation required' },
        { id: 'owner', label: 'Accountable owner', state: draft.owner ? 'proposal' : 'missing', owner: draft.owner, detail: draft.owner || 'Name success owner', source: 'Proposed responsibility' },
        { id: 'checkpoint', label: 'First checkpoint', state: 'proposal', days, detail: days === undefined ? 'Correct checkpoint' : `+${days} days`, source: 'Edited plan' }
      ], [metric('First review', days, days === undefined ? 'Correct days' : `+${days} days`, 'days'), metric('Delivery authority', undefined, 'No signed agreement', 'record status')], `Prerequisite: ${draft.dependency || 'not entered'}. Outcome, measures and ownership are planning proposals, not closed-won status or delivery permission.`, days === undefined ? ['Enter a valid success checkpoint.'] : []);
    }
    case 'ExploreAgentCapabilities': {
      const query = (input.query || '').toLowerCase();
      const tools = INTENTS.filter(item => item.operation !== 'education' && `${item.title} ${item.outcome}`.toLowerCase().indexOf(query) >= 0);
      const groups = [
        { id: 'my-deals', label: 'Grow and act' }, { id: 'deal-room', label: 'Prove the deal' },
        { id: 'commercial-desk', label: 'Shape and govern' }, { id: 'revenue-command', label: 'Lead the portfolio' }
      ];
      return model('business-capability-map', 'Business jobs, not a tool wall', groups.map(group => ({ ...group, value: tools.filter(item => item.lens === group.id).length, state: 'registered', detail: tools.filter(item => item.lens === group.id).map(item => item.title).join(', '), source: 'Actual registered intent catalog' })), [metric('Matching operations', tools.length, String(tools.length), 'registered tools')], 'Group counts use actual matching registrations. Preview never executes; direct Open in Copilot requests the clicked registered tool.');
    }
    case 'ExplorePipelineQuality': {
      const visible = input.rows.map(row => OPPORTUNITIES.find(item => item.id === row.id)).filter(item => item !== undefined);
      const items = ['Qualify', 'Develop', 'Propose', 'Commit'].map(stage => {
        const records = visible.filter(item => item.stage === stage);
        const verified = records.filter(item => scopedEvidence({ ...scope, opportunity: item }).some(source => source.kind === 'verified')).length;
        return { id: stage, label: stage, value: records.length, secondary: verified, state: verified ? 'some verified proof' : 'unknown buyer proof', detail: currency(records.reduce((sum, item) => sum + item.value, 0)), source: 'Filtered demo catalog and actual recorded evidence' };
      });
      return model('pipeline-health-matrix', 'Stage coverage versus buyer proof', items, [metric('Displayed opportunity records', visible.length, String(visible.length), 'records')], 'Counts refer to supplied scope records; no evidence is unknown, not failed qualification. Stage and seller probability do not establish buyer proof.');
    }
    case 'DiscoverAccountOpportunity':
      return model('country-opportunity-footprint', 'Country opportunity footprint', input.rows.map(row => ({ id: row.id, label: row.title, state: row.kind, detail: row.detail, source: row.source })), [], 'Country attribution is explicit demo headquarters data, not international rollout revenue.');
    default:
      throw new Error(`No task-specific business visualization is registered for ${definition.key}.`);
  }
}
