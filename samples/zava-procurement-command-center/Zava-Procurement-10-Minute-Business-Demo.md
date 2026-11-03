# ZavaCore Procurement Command Center - 10-minute business demo

## Story

A requester needs 600 rugged devices across Europe. Procurement must justify the need, compare
supplier trade-offs, govern the award and distinguish financial commitment from delivered value.
The story has two explicit slices: a newly submitted business case, then the existing sourced event
`ZPC-RFP-31`. The invoice and recovery ledger are separate seeded evidence, not transactions
fabricated by the new intake or award.

| Time | Role and prompt | Expected tool | Evidence and action |
| --- | --- | --- | --- |
| 0:00 | Requester: fastest compliant path | `CreatePurchaseIntentTool` | Edit quantity/locations; open Business case studio; review and confirm the exact intake |
| 0:50 | Budget owner: review the submitted ID | `ReviewPurchaseRequestTool` | Receipt-specific Continue with Copilot opens the same request, not ZPC-REQ-1001 by substitution |
| 1:40 | Requester: compare routes and controls | `CompareBuyingOptionsTool`, then `CheckPurchasePolicyTool` | Separate explicit requests; Fulfillment strategy and Policy evidence room expose deadline, costs, controls and remediation |
| 2:25 | Buyer: inspect compatible demand | `AggregateDemandTool` | Demand planning uses category/region/currency-coherent records and actual computed units |
| 3:00 | Category lead: prepare an event | `BuildSourcingEventTool` | Event studio scope, deadline, invitation and evaluation model; review is a draft, not supplier communication |
| 3:50 | Category lead: examine already received bids | `CompareSupplierBidsTool` | Explicit switch to ZPC-RFP-31; risk 5% -> 35% changes leader from Northwind to Contoso |
| 4:45 | Risk lead: challenge continuity assumptions | `TrackSupplierRiskTool` | Current corridor 44 -> Port disruption 66; keyboard-select a modeled dependency and discuss its assumptions |
| 5:35 | Risk lead: define an owned intervention | `PlanSupplierRiskMitigationTool` | Enter Serena, a trigger, EUR 48k cost and date in Mitigation planning room; no risk reduction is asserted as fact |
| 6:25 | Approver: defend a 60/40 mix | `ReviewSupplierAwardTool` | 72% authority block; restore 60%, review EUR 1,059,600 and human rationale, then confirm |
| 7:25 | AP: reconcile the separate held invoice | `ResolveInvoiceExceptionTool` | Invoice ZPC-8831: EUR 15k unmatched against EUR 5k tolerance; reviewed correction never releases payment |
| 8:10 | Finance: find the missing proof | `ExploreSpendPerformanceTool` | Sankey: EUR 286k identified, EUR 186k verified; select an intervention/evidence connection and ask about it |
| 9:00 | CPO: connect execution with value | `ExploreSpendPerformanceTool` | Open Global investment and value; map measure/region changes real data, then text-only Summary & next steps |

## ZavaCore modernization choreography

At intake, confirm the edited business case. **Continue with Copilot: Review request [receipt ID]**
requests its exact operational component; **Open budget decision room** adds source evidence and
Carole's accountability. Review quantity, original currency, locations and constraints. Confirm the
budget decision, then **Back to My Requests** to show the Approved queue and owned timeline.
Reload restoration is a separate rehearsal proof. Reset is the deterministic boundary.

Then explicitly introduce the separate seeded 600-device sourcing event `ZPC-RFP-31`. Do not describe
a newly submitted case as if bids or purchase orders had been generated for it. The curated event
supports weight changes, exact evidence, split-allocation geometry, authority checks and a reviewed
award. At 5% risk, Northwind leads at 68.4/100; at 35%, Contoso leads at 73.3/100. Do not claim all
weight changes flip the leader. A 60/40 confirmed award contributes EUR 1,059,600 to modeled launch
commitment, not to verified savings.

Finish in Spend Command. Baseline investment is EUR 7.8m planned and EUR 5.236m committed across
eight sites. After that 60/40 award, commitments are EUR 6,295,600; units and verified savings do not
change. Toggle Planned footprint, Committed footprint and Uncommitted headroom; zero commitments
have no bubble. Drill into APAC (EUR 1.52m planned / EUR 1.2m committed), then EMEA and Global.
The EUR-reporting programs never imply FX conversion of source request currencies.

Supplier 360 provides a distinct relationship-led interlude: select the supplier, inspect the notice
window, meet Serena as the accountable risk owner and enter the owned mitigation or renewal review.
The ZavaCore portraits represent the named fictional brand team, not the signed-in tenant user.

### Reconcile the value story

The three Sankey columns conserve **EUR 286,000**: region -> intervention -> disjoint evidence state.
Terminal values are **EUR 186,000 verified**, **EUR 28,000 contracted/unverified**,
**EUR 17,000 negotiated/uncontracted**, and **EUR 55,000 identified/unnegotiated**.
The EUR 15,000 freight dispute is a subset of unverified contracted value, not extra money.
Select a connection or its exact-table alternative to inspect the intervention. A filtered or
unknown selection never silently becomes another record.

Use **More discussions** for explain/challenge questions or **Ask your own question**. Those responses
stay in chat. Inline primary handoffs request one registered tool; full-screen primary continuation
returns text only. **Continue to** is visibly separate local navigation. No message is sent by opening
a view, changing a filter or confirming a receipt.

All 22 components have named business destinations, not a generic expansion landing page. The
[routing matrix](Zava-Procurement-Routing-Matrix.md) is the current map. Twelve starters cover distinct
operational targets; **Explore capabilities** remains last and previews cannot confirm actions.

## Safeguards to narrate

- Prompt properties prefill and scope; React components resolve records and own deterministic math.
- Policy, supplier scores, confidence, missing evidence, and alternatives stay inspectable.
- Discuss visible proposed calculations during Draft, but enter Review before asking about withheld
  business text or rationale. Nothing omitted is reconstructed by Copilot.
- Sourcing launch, qualification, award, renewal, PO, and invoice disposition require human confirmation.
- No mock action writes to ERP, source-to-pay, supplier, contract, or payment systems.

## Fallback

Use the [publication images](assets/gallery-evidence.json) and
[45 expansion/continuation checkpoints](ux-review/evidence/ignite-readiness.json) in the same order.
The local evidence proves rendering and package contents;
authenticated tenant evidence separately proves routing, CSP, iframe focus, and bridge behavior.