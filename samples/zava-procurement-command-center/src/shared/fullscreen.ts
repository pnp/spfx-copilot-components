import { getIntent, type ProcurementIntentKey } from './catalog';
import { OWNERS } from './brand';
import { money } from './domain';
import { contracts, getPurchaseQueue, getReceipts, invoices, leakageOpportunities, purchaseOrders, supplierRecords } from './operations';
import type { IProcurementSnapshot } from './modelContext';

export interface IFullscreenDestination {
  readonly intent: ProcurementIntentKey;
  readonly route: string;
  readonly title: string;
  readonly view: 'task' | 'workspace';
  readonly summary: string;
  readonly boundary: string;
  readonly owner: keyof typeof OWNERS;
}
const f = (intent: ProcurementIntentKey, title: string, view: IFullscreenDestination['view'], summary: string, boundary: string, owner: IFullscreenDestination['owner']): IFullscreenDestination =>
  ({ intent, route: getIntent(intent).route, title, view, summary, boundary, owner });

export const FULLSCREEN_DESTINATIONS: readonly IFullscreenDestination[] = [
  f('CreatePurchaseIntent','Business case studio','task','Turn a field outcome into a complete, reviewable business case. Keep quantity, locations, timing and budget together.','Submission creates a session request, not bids, an order or delivery.','finance'),
  f('CompareBuyingOptions','Fulfillment strategy','task','Balance speed, available reuse, contract value and the delivery deadline for the selected request.','Indicative route pricing is EUR only. Choosing a route does not approve spend.','sourcing'),
  f('CheckPurchasePolicy','Policy evidence room','task','Resolve competition, authority and control evidence before asking anyone to commit funds.','A ready control state is not budget-owner approval.','finance'),
  f('ReviewPurchaseRequest','Budget decision room','task','Review the exact business need, original currency and commitment evidence with an accountable budget owner.','Only the selected request is reviewed; approval never fabricates downstream sourcing.','finance'),
  f('AggregateDemand','Demand planning','task','Find compatible needs in one category, region and currency before preparing a fair sourcing event.','Combined units do not prove compatible specifications or delivery dates.','sourcing'),
  f('BuildSourcingEvent','Sourcing event studio','task','Prepare the source cohort, bid deadline, invitation and evaluation model for a controlled event.','A saved event draft neither contacts suppliers nor creates received bids.','sourcing'),
  f('CompareSupplierBids','Supplier evaluation room','task','Trade price against delivery, quality, continuity and confidence. Inspect the evidence behind every supplier mark.','Weighted ranking supports judgment; it cannot award a supplier.','sourcing'),
  f('ReviewSupplierAward','Award decision room','task','Review exact allocation economics, resilience and authority before confirming a supplier mix.','Primary share above 70% exceeds this authority. Confirmation changes only modeled commitment.','sourcing'),
  f('ExploreSupplier360','Supplier relationship room','workspace','Connect performance, contract notice windows, continuity ownership and qualification for one selected supplier.','Relationship evidence does not establish qualification or authorize an award.','risk'),
  f('ReviewContractRenewal','Contract renewal room','task','Make the renewal uplift, notice obligation and exit dependencies visible before deciding.','A renewal decision does not sign a contract or communicate terms.','sourcing'),
  f('DetectSpendLeakage','Leakage priorities','task','Rank addressable leakage and inspect which intervention has verified evidence rather than just potential.','Identified opportunity and disputed value are not verified savings.','finance'),
  f('TrackSupplierRisk','Continuity planning room','task','Follow a supplier dependency pathway and challenge the corridor assumptions before assigning an intervention.','Modeled exposure is an index, not failure probability or a confirmed disruption.','risk'),
  f('ResolveInvoiceException','Invoice reconciliation room','task','Reconcile ordered commitment, accepted receipt and billed value before choosing a held-exception disposition.','No payment release or invoice posting is available in this experience.','finance'),
  f('ExploreSpendPerformance','Global investment and value','workspace','Connect the world investment footprint to commitments, delivery and a reconciled procurement-value Sankey.','Commitment is not delivery; investment budgets are separate from verified savings evidence.','finance'),
  f('OnboardSupplier','Supplier intake studio','task','Prepare the candidate identity, intended scope and explicit evidence attestations for governance review.','Candidate submission is not a vendor-master write, qualification or award.','risk'),
  f('ReviewSupplierQualification','Qualification decision room','task','Review supplier evidence with a bounded scope, explicit conditions and a meaningful expiry.','Qualification does not sign terms or authorize a supplier award.','risk'),
  f('PlanSupplierRiskMitigation','Mitigation planning room','task','Assign an accountable owner, activation trigger, cost and target date to a concrete continuity action.','Saving a plan does not execute it or prove lower residual exposure.','risk'),
  f('NegotiateContractTerms','Negotiation mandate room','task','Balance what to give, what to protect and the fallback economics before approaching a supplier.','A reviewed mandate does not sign or send a contract.','sourcing'),
  f('ManagePurchaseOrderChange','Commitment change room','task','Compare order quantity, delivery and financial commitment before and after the proposed change.','A session decision never updates the external purchase order.','finance'),
  f('TrackLeakageRecovery','Value verification room','task','Trace the intervention from identified opportunity to accepted invoice evidence and disputed exclusions.','Accept only verified value; a human receipt does not manufacture savings.','finance'),
  f('ExploreSupplierPortfolioBalance','Supply concentration room','task','Balance a conserved allocation against supplier risk, regional handling and a continuity-buffer scenario.','Portfolio allocations are proposals, not event-specific awards or proven risk reduction.','risk'),
  f('ExploreAgentCapabilities','Procurement experience guide','task','Choose the business question, inspect a safe preview and deliberately open the right operational experience.','Previewing never confirms a procurement action.','sourcing')
];

export function getFullscreenDestination(intent: ProcurementIntentKey): IFullscreenDestination {
  const destination = FULLSCREEN_DESTINATIONS.find(item => item.intent === intent);
  if (!destination) throw new Error(`Missing full-screen destination: ${intent}`);
  return destination;
}

export function fullscreenEvidence(snapshot: IProcurementSnapshot): readonly { readonly label: string; readonly value: string }[] {
  const scope = snapshot.scope || {};
  const evidence: { label: string; value: string }[] = [];
  const request = getPurchaseQueue().find(item => item.id === scope.requestId);
  const supplier = supplierRecords.find(item => item.id === scope.supplierId);
  const contract = contracts.find(item => item.id === scope.contractId);
  const invoice = invoices.find(item => item.id === scope.invoiceId);
  const order = purchaseOrders.find(item => item.id === scope.purchaseOrderId);
  const opportunity = leakageOpportunities.find(item => item.id === scope.opportunityId);
  if (request) evidence.push({ label: request.id, value: `${request.quantity} units / ${money(request.budget, request.currency)} / ${request.locations || request.region}. Original request currency is preserved.` });
  if (supplier) evidence.push({ label: supplier.supplier, value: `${supplier.region} / ${supplier.lead}-day bid lead / risk ${supplier.risk}/100 / evidence confidence ${supplier.confidence}%. These are source signals, not authorization.` });
  if (contract) evidence.push({ label: contract.id, value: `${money(contract.annualValue)} annual baseline / ${contract.noticeDays}-day notice / ${contract.renewalIncrease}% quoted uplift.` });
  if (invoice) evidence.push({ label: invoice.id, value: `${money(invoice.billed - invoice.received)} unmatched / ${money(invoice.tolerance)} tolerance. Receipt acceptance, not ordered value, bounds reconciliation.` });
  if (order) evidence.push({ label: order.id, value: `${order.quantity} units / ${money(order.value)} original commitment / ${order.neededBy}. Source request ${order.requestId}.` });
  if (opportunity) evidence.push({ label: opportunity.id, value: `${money(opportunity.realized)} verified / ${money(opportunity.disputed)} disputed and excluded. Use this intervention's evidence, never aggregate flow amounts, for recovery acceptance.` });
  const relevantIds = [scope.requestId, scope.supplierId, scope.contractId, scope.invoiceId, scope.purchaseOrderId, scope.opportunityId, scope.eventId];
  const receipts = getReceipts().filter(receipt => relevantIds.indexOf(receipt.recordId) >= 0);
  evidence.push({ label: 'Confirmed session actions in this scope', value: receipts.length ? receipts.map(receipt => `${receipt.id}: ${receipt.action}`).join('; ') : 'None recorded. Drafts, navigation and required authority are not confirmed decisions.' });
  return evidence;
}
