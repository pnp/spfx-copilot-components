import { getIntent, INTENTS, type IIntentDefinition, type IProcurementProperties, type ProcurementIntentKey } from './catalog';
import type { IProcurementSnapshot } from './modelContext';

export interface ICopilotAction {
  readonly label: string;
  readonly prompt: string;
  readonly handoff?: { readonly tool: string; readonly properties: IProcurementProperties };
  readonly disabledReason?: string;
}

const guidance: Readonly<Record<ProcurementIntentKey, readonly [string, string, ProcurementIntentKey | undefined]>> = {
  CreatePurchaseIntent: ['Challenge this business case', 'Which required fields, budget assumptions and evidence gaps need attention before submission?', undefined],
  CompareBuyingOptions: ['Challenge the buying route', 'Compare the visible cost, lead time, deadline and policy trade-offs. Which route misses the need?', 'CheckPurchasePolicy'],
  CheckPurchasePolicy: ['Explain the policy blockers', 'Explain the actual competition, authority and remediation evidence. A ready state is not approval.', 'ReviewPurchaseRequest'],
  ReviewPurchaseRequest: ['Challenge this demand decision', 'Discuss the selected request, original currency, budget evidence and proposed rationale. Do not approve it.', 'CompareBuyingOptions'],
  AggregateDemand: ['Test this demand cohort', 'Explain the current category, region, currency, combined quantity and timing/compatibility evidence still needed.', 'BuildSourcingEvent'],
  BuildSourcingEvent: ['Challenge event readiness', 'Discuss the scope, cohort, invited supplier, deadline and evaluation model. A saved draft is not an invitation or a received bid.', undefined],
  CompareSupplierBids: ['Challenge the supplier ranking', 'Explain how the current risk weight changes total value, price, delivery, quality and evidence confidence. Ranking is not an award.', 'ReviewSupplierAward'],
  ReviewSupplierAward: ['Challenge this award mix', 'Explain the visible split, exact cost, blended risk, timing confidence, authority limit and human rationale. A proposal is not an award.', 'TrackSupplierRisk'],
  ExploreSupplier360: ['Explain the relationship gaps', 'Which visible obligations, notice windows, performance signals and owners change the next supplier decision?', 'TrackSupplierRisk'],
  ReviewContractRenewal: ['Challenge the renewal economics', 'Explain the selected contract, annual uplift, notice deadline and exit dependencies without signing or contacting anyone.', 'NegotiateContractTerms'],
  DetectSpendLeakage: ['Prioritize the leakage evidence', 'Compare the filtered addressable opportunities, selected intervention, realized evidence and disputed amounts. Opportunity is not saving.', 'TrackLeakageRecovery'],
  TrackSupplierRisk: ['Challenge the continuity scenario', 'Explain the selected supplier, corridor, scenario adjustments and modeled dependency pathway. These assumptions are not verified disruptions.', 'PlanSupplierRiskMitigation'],
  ResolveInvoiceException: ['Explain the unmatched amount', 'Reconcile the visible purchase order, accepted receipt, invoice, tolerance and proposed disposition. Never release payment.', undefined],
  ExploreSpendPerformance: ['Explain the verification bottleneck', 'Explain the selected value-flow connection and scoped EUR amounts. Separate identified, negotiated, contracted and verified evidence; do not double-count disputed amounts.', 'DetectSpendLeakage'],
  OnboardSupplier: ['Check candidate evidence', 'Explain the current candidate intake, attestations and missing evidence. Submission does not create a qualified supplier or an award.', undefined],
  ReviewSupplierQualification: ['Challenge the qualification scope', 'Explain the visible supplier evidence, expiry, conditions and decision. Qualification does not authorize an award.', 'ExploreSupplier360'],
  PlanSupplierRiskMitigation: ['Challenge the mitigation plan', 'Explain the activation trigger, owner, cost, target date and evidence needed to prove residual exposure. A plan does not establish risk reduction.', 'TrackSupplierRisk'],
  NegotiateContractTerms: ['Challenge the give/get mandate', 'Explain the actual objective, target, fallback and protected terms. A mandate is not a signed contract or supplier communication.', 'ReviewContractRenewal'],
  ManagePurchaseOrderChange: ['Explain the commitment delta', 'Compare the selected order before and after the edit, cap, delivery target, authority and decision rationale. Do not change the order.', 'ReviewPurchaseRequest'],
  TrackLeakageRecovery: ['Challenge the recovery evidence', 'Explain the selected intervention, verified amount, disputed exclusion and proposed acceptance. Acceptance does not manufacture savings.', 'ExploreSpendPerformance'],
  ExploreSupplierPortfolioBalance: ['Challenge the concentration trade-off', 'Explain the actual allocation, regional handling adjustment and continuity-buffer assumptions. The allocation is a scenario, not an award.', undefined],
  ExploreAgentCapabilities: ['Choose the right procurement experience', 'Discuss the filtered capabilities and selected preview against my business outcome. Previewing never authorizes an action.', undefined]
};
const safeguards = 'Use the latest visible procurement context and exact IDs. Distinguish source evidence, scenario assumptions, unconfirmed drafts and session receipts. Omitted evidence is unknown. No ERP writes, supplier contact, external award, order, invoice posting or payment.';

export function discussionAction(label: string, question: string): ICopilotAction {
  return { label, prompt: `Answer in text in this conversation: ${question} Do not call tools or open another component. ${safeguards}` };
}

export function createCopilotHandoff(target: ProcurementIntentKey, properties: IProcurementProperties, label?: string): ICopilotAction {
  return {
    label: label || getIntent(target).title,
    handoff: { tool: `${target}Tool`, properties },
    prompt: `Continue with ${getIntent(target).title.toLowerCase()}: call exactly ${target}Tool with ${JSON.stringify(properties)} and show its UX component. Preserve the visible evidence and exact scope. Navigation or a prompt is never authorization. ${safeguards}`
  };
}

export function getCopilotActions(definition: IIntentDefinition, snapshot: IProcurementSnapshot, full = false): {
  readonly primary: ICopilotAction; readonly discussions: readonly ICopilotAction[];
} {
  const [label, topic, next] = guidance[definition.key];
  const scope = snapshot.scope || {};
  const discussions = [
    discussionAction('Explain what is shown', `Explain ${snapshot.selectedLabel || snapshot.selectedId || definition.title}, including the visible findings, chart grammar, source and limitations.`),
    discussionAction(label, topic)
  ];
  let primary = discussions[1];
  if (next) {
    let properties: IProcurementProperties = {};
    let known = true;
    switch (next) {
      case 'CheckPurchasePolicy':
      case 'ReviewPurchaseRequest':
      case 'CompareBuyingOptions': properties = { requestId: scope.requestId }; known = Boolean(scope.requestId); break;
      case 'BuildSourcingEvent': properties = { cohortId: scope.cohortId, category: scope.category }; known = Boolean(scope.cohortId); break;
      case 'ReviewSupplierAward': properties = { eventId: scope.eventId }; known = Boolean(scope.eventId); break;
      case 'TrackSupplierRisk':
      case 'PlanSupplierRiskMitigation':
      case 'ExploreSupplier360': properties = { supplierId: scope.supplierId }; known = Boolean(scope.supplierId); break;
      case 'NegotiateContractTerms':
      case 'ReviewContractRenewal': properties = { contractId: scope.contractId, supplierId: scope.supplierId }; known = Boolean(scope.contractId); break;
      case 'TrackLeakageRecovery': properties = { opportunityId: scope.opportunityId }; known = Boolean(scope.opportunityId); break;
      case 'ExploreSpendPerformance':
      case 'DetectSpendLeakage': properties = { category: scope.category, region: scope.region, ...(next === 'ExploreSpendPerformance' ? { period: scope.period } : {}) }; break;
      default: known = false;
    }
    if (known) primary = createCopilotHandoff(next, properties);
  }
  if (definition.key === 'CreatePurchaseIntent' && snapshot.stage === 'receipt' && scope.requestId) {
    primary = createCopilotHandoff('ReviewPurchaseRequest', { requestId: scope.requestId }, `Review request ${scope.requestId}`);
  }
  if (definition.key === 'ExploreAgentCapabilities' && typeof snapshot.previewIntent === 'string') {
    const capability = INTENTS.find(intent => intent.key === snapshot.previewIntent);
    if (capability) primary = createCopilotHandoff(capability.key, {});
  }
  if (snapshot.stage === 'no-match' || snapshot.stage === 'input-error' || snapshot.safePreview && definition.key !== 'ExploreAgentCapabilities') {
    primary = discussionAction('Resolve the evidence gap', 'Explain the visible no-match, validation or safe-preview boundary. Do not substitute another record or open an operational component.');
  }
  if (full) primary = discussionAction('Summary & next steps', 'Summarize this visible procurement workspace or focused task in at most 100 words: key values, evidence gaps, confirmed status and two practical next steps. Keep unconfirmed edits distinct. Do not navigate, submit or approve.');
  return { primary, discussions };
}
