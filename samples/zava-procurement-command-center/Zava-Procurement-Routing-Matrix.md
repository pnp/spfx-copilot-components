# ZavaCore Procurement Command Center - Routing Matrix

Generated from `src/shared/catalog.ts` and `config/conversation-starters.json`. Tool names retain the registered `Tool` suffix; component/view keys do not.

| Tool | Operation | Lens and route | Full-screen destination | Role | Route when | Exclude when | Canonical prompt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `CreatePurchaseIntentTool` | submit | my-requests / `my-requests/new` | Business case studio / task | Business requester | What is the fastest compliant path for this outcome? | Not request status or approval. | Find the fastest compliant path for 600 rugged devices within EUR 1.2 million. |
| `CompareBuyingOptionsTool` | information | my-requests / `my-requests/options` | Fulfillment strategy / task | Business requester | Which route balances speed, value, and policy? | Not supplier bids or award. | Compare buying options for the rugged-device request. |
| `CheckPurchasePolicyTool` | information | my-requests / `my-requests/policy` | Policy evidence room / task | Business requester | Why is this purchase allowed, warned, or blocked? | Never overrides policy. | Check policy for the rugged-device request. |
| `ReviewPurchaseRequestTool` | review | my-requests / `my-requests/review` | Budget decision room / task | Budget owner | Does the need justify budget and downstream commitment? | Not route selection. | Review purchase request ZPC-REQ-1001. |
| `AggregateDemandTool` | information | sourcing / `sourcing/demand` | Demand planning / task | Category manager | Which needs should move together? | Not event creation. | Combine similar rugged-device demand. |
| `BuildSourcingEventTool` | submit | sourcing / `sourcing/event-studio` | Sourcing event studio / task | Category manager | How do we run a fair, controlled event? | Not bid evaluation. | Build a fair event for cohort ZPC-COHORT-07. |
| `CompareSupplierBidsTool` | information | sourcing / `sourcing/evaluation` | Supplier evaluation room / task | Category manager | Which supplier creates the strongest total value? | Cannot award a supplier. | Compare final bids for ZPC-RFP-31. |
| `ReviewSupplierAwardTool` | review | sourcing / `sourcing/award` | Award decision room / task | Procurement approver | Which award mix is defensible? | Not bid analysis. | Review the 65/35 split award for ZPC-RFP-31. |
| `ExploreSupplier360Tool` | information | supplier-360 / `supplier-360/overview` | Supplier relationship room / workspace | Supplier lead | What relationship evidence changes the next decision? | Not a vendor master. | Explore Fabrikam Devices. |
| `ReviewContractRenewalTool` | review | supplier-360 / `supplier-360/renewal` | Contract renewal room / task | Contract lead | Should we renew, renegotiate, consolidate, or exit? | Not negotiation planning. | Review the Fabrikam device contract renewal. |
| `DetectSpendLeakageTool` | information | spend-command / `spend-command/leakage` | Leakage priorities / task | Procurement finance | Where is spend addressable now? | Not recovery execution. | Show the largest addressable leakage this quarter. |
| `TrackSupplierRiskTool` | information | supplier-360 / `supplier-360/risk` | Continuity planning room / task | Supplier risk lead | Where can disruption propagate? | Not mitigation approval. | Show continuity exposure for Fabrikam Devices. |
| `ResolveInvoiceExceptionTool` | review | spend-command / `spend-command/invoice-exception` | Invoice reconciliation room / task | Accounts payable | Why does this invoice not match? | Not generic approval. | Resolve invoice ZPC-8831. |
| `ExploreSpendPerformanceTool` | information | spend-command / `spend-command/performance` | Global investment and value / workspace | Procurement finance | Did identified opportunity become verified value? | Not a KPI dashboard. | Show whether rugged-device value was realized. |
| `OnboardSupplierTool` | submit | supplier-360 / `supplier-360/onboarding` | Supplier intake studio / task | Supplier governance | What evidence does this candidate need? | Does not approve a vendor. | Onboard a rugged-device supplier. |
| `ReviewSupplierQualificationTool` | review | supplier-360 / `supplier-360/qualification` | Qualification decision room / task | Supplier governance | Is this supplier qualified for this scope? | Not onboarding capture. | Review qualification for Northwind Rugged. |
| `PlanSupplierRiskMitigationTool` | submit | supplier-360 / `supplier-360/mitigation` | Mitigation planning room / task | Supplier risk lead | Which actions reduce residual exposure? | Not risk scoring. | Plan mitigation for the Baltic corridor risk. |
| `NegotiateContractTermsTool` | submit | supplier-360 / `supplier-360/negotiation` | Negotiation mandate room / task | Contract lead | What should we give, get, and protect? | Not contract renewal decision. | Prepare Fabrikam contract negotiation. |
| `ManagePurchaseOrderChangeTool` | review | my-requests / `my-requests/po-change` | Commitment change room / task | Budget owner | What does this PO change commit us to? | Not new demand. | Review change to PO ZPC-PO-4108. |
| `TrackLeakageRecoveryTool` | review | spend-command / `spend-command/recovery` | Value verification room / task | Procurement finance | Is the intervention creating verified value? | Not leakage detection. | Track recovery for off-contract device spend. |
| `ExploreSupplierPortfolioBalanceTool` | information | spend-command / `spend-command/portfolio-balance` | Supply concentration room / task | CPO | Where are category portfolios too concentrated? | Not one supplier analysis. | Show where supplier concentration is too high. |
| `ExploreAgentCapabilitiesTool` | education | education / `education/capabilities` | Procurement experience guide / task | All roles | What can Zava Procurement do safely? | Never confirms an action. | Explore what the Procurement agent can do. |

Expansion preserves the current selection and draft and opens the named business view with additional evidence. No origin/launcher UI is shown. Workspace navigation is separate; hidden tasks never publish visible context.


## Conversation starters

| Starter | Prompt | Expected registered tool |
| --- | --- | --- |
| Start a purchase | Find the fastest compliant path for 600 rugged devices within EUR 1.2 million. | `CreatePurchaseIntentTool` |
| Choose a buying route | Compare contract, reuse and sourcing options for request ZPC-REQ-1001 against the delivery deadline. | `CompareBuyingOptionsTool` |
| Review a business case | Review the budget and business need for purchase request ZPC-REQ-1001. | `ReviewPurchaseRequestTool` |
| Compare supplier bids | Compare the final rugged-device bids and show how risk changes the award. | `CompareSupplierBidsTool` |
| Supplier risk | Show our concentration and continuity exposure for Fabrikam Devices. | `TrackSupplierRiskTool` |
| Award decision | Review the proposed split award for sourcing event ZPC-RFP-31. | `ReviewSupplierAwardTool` |
| Understand a supplier | Connect Fabrikam Devices performance, contract obligations and accountable owners. | `ExploreSupplier360Tool` |
| Balance supply resilience | Compare a 60 percent primary supplier limit with a regional continuity buffer for EMEA device supply. | `ExploreSupplierPortfolioBalanceTool` |
| Spend leakage | Show the largest addressable spend leakage this quarter. | `DetectSpendLeakageTool` |
| Reconcile a held invoice | Explain the unmatched freight on invoice ZPC-8831 and the evidence needed to resolve it. | `ResolveInvoiceExceptionTool` |
| Prove procurement value | Show where our global procurement investments stand and which value is verified rather than still unproven. | `ExploreSpendPerformanceTool` |
| Explore capabilities | Explore what the Procurement agent can do. | `ExploreAgentCapabilitiesTool` |

## Nearest-sibling rehearsal

- New outcome/quantity/budget intake -> CreatePurchaseIntentTool; explicit route alternatives on an existing request -> CompareBuyingOptionsTool; controls/remediation -> CheckPurchasePolicyTool; existing demand approval -> ReviewPurchaseRequestTool.
- Bid weights/ranking -> CompareSupplierBidsTool; proposed award and authority -> ReviewSupplierAwardTool.
- Relationship obligations -> ExploreSupplier360Tool; one supplier continuity -> TrackSupplierRiskTool; owned mitigation -> PlanSupplierRiskMitigationTool; cross-supplier allocation -> ExploreSupplierPortfolioBalanceTool.
- New supplier capture -> OnboardSupplierTool; evidence/expiry/conditions decision -> ReviewSupplierQualificationTool.
- Renewal/exit judgment -> ReviewContractRenewalTool; give/get mandate -> NegotiateContractTermsTool.
- New buying demand -> CreatePurchaseIntentTool; existing PO consequences -> ManagePurchaseOrderChangeTool; unmatched invoice disposition -> ResolveInvoiceExceptionTool.
- Opportunity -> DetectSpendLeakageTool; intervention acceptance -> TrackLeakageRecoveryTool; verified stage/value analysis -> ExploreSpendPerformanceTool.
- Capability discovery is educational, not a fallback for an operational request.

Local checks prove metadata, inputs, registrations, and starter targets agree. Rehearse these positive and excluded prompts in fresh authenticated Copilot conversations; local tests do not prove model selection.

