export type ProcurementIntentKey =
  | 'CreatePurchaseIntent' | 'CompareBuyingOptions' | 'CheckPurchasePolicy' | 'ReviewPurchaseRequest'
  | 'AggregateDemand' | 'BuildSourcingEvent' | 'CompareSupplierBids' | 'ReviewSupplierAward'
  | 'ExploreSupplier360' | 'ReviewContractRenewal' | 'DetectSpendLeakage' | 'TrackSupplierRisk'
  | 'ResolveInvoiceException' | 'ExploreSpendPerformance' | 'OnboardSupplier' | 'ReviewSupplierQualification'
  | 'PlanSupplierRiskMitigation' | 'NegotiateContractTerms' | 'ManagePurchaseOrderChange'
  | 'TrackLeakageRecovery' | 'ExploreSupplierPortfolioBalance' | 'ExploreAgentCapabilities';

export type ProcurementLens = 'my-requests' | 'sourcing' | 'supplier-360' | 'spend-command' | 'education';
export type ProcurementOperation = 'information' | 'submit' | 'review' | 'education';

export interface IProcurementProperties {
  readonly outcome?: string;
  readonly requestId?: string;
  readonly category?: string;
  readonly categoryHint?: string;
  readonly quantity?: number;
  readonly neededBy?: string;
  readonly locations?: readonly string[];
  readonly budget?: number;
  readonly currency?: string;
  readonly constraints?: readonly string[];
  readonly cohortId?: string;
  readonly eventId?: string;
  readonly supplierId?: string;
  readonly contractId?: string;
  readonly invoiceId?: string;
  readonly opportunityId?: string;
  readonly period?: string;
  readonly region?: string;
  readonly scenario?: string;
  readonly selectedId?: string;
  readonly proposedDecision?: string;
  readonly conditionText?: string;
  readonly query?: string;
  readonly supplierName?: string;
  readonly country?: string;
  readonly owner?: string;
  readonly riskWeight?: number;
  readonly splitPercent?: number;
  readonly concentrationLimit?: number;
  readonly purchaseOrderId?: string;
}

export interface IIntentDefinition {
  readonly key: ProcurementIntentKey;
  readonly title: string;
  readonly lens: ProcurementLens;
  readonly route: string;
  readonly operation: ProcurementOperation;
  readonly role: string;
  readonly question: string;
  readonly outcome: string;
  readonly prompt: string;
  readonly excludes: string;
}

const d = (key: ProcurementIntentKey, title: string, lens: ProcurementLens, route: string,
  operation: ProcurementOperation, role: string, question: string, outcome: string,
  prompt: string, excludes: string): IIntentDefinition =>
  ({ key, title, lens, route, operation, role, question, outcome, prompt, excludes });

export const INTENTS: readonly IIntentDefinition[] = [
  d('CreatePurchaseIntent','Create purchase intent','my-requests','my-requests/new','submit','Business requester','What is the fastest compliant path for this outcome?','A governed request with an explainable buying route.','Find the fastest compliant path for 600 rugged devices within EUR 1.2 million.','Not request status or approval.'),
  d('CompareBuyingOptions','Compare buying options','my-requests','my-requests/options','information','Business requester','Which route balances speed, value, and policy?','Ranked catalog, contract, reuse, and sourcing paths.','Compare buying options for the rugged-device request.','Not supplier bids or award.'),
  d('CheckPurchasePolicy','Check purchase policy','my-requests','my-requests/policy','information','Business requester','Why is this purchase allowed, warned, or blocked?','An exact policy ledger with remediation.','Check policy for the rugged-device request.','Never overrides policy.'),
  d('ReviewPurchaseRequest','Review purchase request','my-requests','my-requests/review','review','Budget owner','Does the need justify budget and downstream commitment?','An authority-aware demand decision.','Review purchase request ZPC-REQ-1001.','Not route selection.'),
  d('AggregateDemand','Aggregate demand','sourcing','sourcing/demand','information','Category manager','Which needs should move together?','A reviewable demand cohort and timing scenario.','Combine similar rugged-device demand.','Not event creation.'),
  d('BuildSourcingEvent','Build sourcing event','sourcing','sourcing/event-studio','submit','Category manager','How do we run a fair, controlled event?','A validated sourcing-event draft.','Build a fair event for cohort ZPC-COHORT-07.','Not bid evaluation.'),
  d('CompareSupplierBids','Compare supplier bids','sourcing','sourcing/evaluation','information','Category manager','Which supplier creates the strongest total value?','Normalized bids, sensitivity, and exact evidence.','Compare final bids for ZPC-RFP-31.','Cannot award a supplier.'),
  d('ReviewSupplierAward','Review supplier award','sourcing','sourcing/award','review','Procurement approver','Which award mix is defensible?','A reviewed single, split, return, or no-award decision.','Review the 65/35 split award for ZPC-RFP-31.','Not bid analysis.'),
  d('ExploreSupplier360','Explore supplier 360','supplier-360','supplier-360/overview','information','Supplier lead','What relationship evidence changes the next decision?','Connected contracts, obligations, performance, and owners.','Explore Fabrikam Devices.','Not a vendor master.'),
  d('ReviewContractRenewal','Review contract renewal','supplier-360','supplier-360/renewal','review','Contract lead','Should we renew, renegotiate, consolidate, or exit?','A time-bound renewal decision.','Review the Fabrikam device contract renewal.','Not negotiation planning.'),
  d('DetectSpendLeakage','Detect spend leakage','spend-command','spend-command/leakage','information','Procurement finance','Where is spend addressable now?','Evidence-backed leakage opportunities.','Show the largest addressable leakage this quarter.','Not recovery execution.'),
  d('TrackSupplierRisk','Track supplier risk','supplier-360','supplier-360/risk','information','Supplier risk lead','Where can disruption propagate?','A geographic and sub-tier exposure scenario.','Show continuity exposure for Fabrikam Devices.','Not mitigation approval.'),
  d('ResolveInvoiceException','Resolve invoice exception','spend-command','spend-command/invoice-exception','review','Accounts payable','Why does this invoice not match?','An exact three-way reconciliation and reviewed disposition.','Resolve invoice ZPC-8831.','Not generic approval.'),
  d('ExploreSpendPerformance','Explore spend performance','spend-command','spend-command/performance','information','Procurement finance','Did identified opportunity become verified value?','A traceable spend-to-value flow.','Show whether rugged-device value was realized.','Not a KPI dashboard.'),
  d('OnboardSupplier','Onboard supplier','supplier-360','supplier-360/onboarding','submit','Supplier governance','What evidence does this candidate need?','A region and category-aware supplier candidate.','Onboard a rugged-device supplier.','Does not approve a vendor.'),
  d('ReviewSupplierQualification','Review supplier qualification','supplier-360','supplier-360/qualification','review','Supplier governance','Is this supplier qualified for this scope?','A conditional, expiring qualification decision.','Review qualification for Northwind Rugged.','Not onboarding capture.'),
  d('PlanSupplierRiskMitigation','Plan risk mitigation','supplier-360','supplier-360/mitigation','submit','Supplier risk lead','Which actions reduce residual exposure?','An owned, triggered mitigation plan.','Plan mitigation for the Baltic corridor risk.','Not risk scoring.'),
  d('NegotiateContractTerms','Negotiate contract terms','supplier-360','supplier-360/negotiation','submit','Contract lead','What should we give, get, and protect?','A reviewed negotiation plan with fallback.','Prepare Fabrikam contract negotiation.','Not contract renewal decision.'),
  d('ManagePurchaseOrderChange','Manage purchase order change','my-requests','my-requests/po-change','review','Budget owner','What does this PO change commit us to?','An exact before-and-after order decision.','Review change to PO ZPC-PO-4108.','Not new demand.'),
  d('TrackLeakageRecovery','Track leakage recovery','spend-command','spend-command/recovery','review','Procurement finance','Is the intervention creating verified value?','An accountable recovery plan and evidence trail.','Track recovery for off-contract device spend.','Not leakage detection.'),
  d('ExploreSupplierPortfolioBalance','Explore portfolio balance','spend-command','spend-command/portfolio-balance','information','CPO','Where are category portfolios too concentrated?','A concentration-versus-risk portfolio landscape.','Show where supplier concentration is too high.','Not one supplier analysis.'),
  d('ExploreAgentCapabilities','Explore capabilities','education','education/capabilities','education','All roles','What can Zava Procurement do safely?','Searchable safe previews of all 21 operations.','Explore what the Procurement agent can do.','Never confirms an action.')
];

export const OPERATIONAL_LENSES: readonly ProcurementLens[] = ['my-requests','sourcing','supplier-360','spend-command'];
export const getIntent = (key: ProcurementIntentKey): IIntentDefinition => {
  const value = INTENTS.find((item) => item.key === key);
  if (!value) throw new Error(`Unknown procurement intent: ${key}`);
  return value;
};