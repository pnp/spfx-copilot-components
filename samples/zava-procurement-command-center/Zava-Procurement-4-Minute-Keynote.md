# ZavaCore Procurement Command Center - 4-minute keynote

## Audience and promise

For Microsoft customers, partners, procurement leaders, and product teams. The promise: Copilot can
turn an outcome into inspectable procurement software while people retain accountability for policy,
supplier, award, invoice, and value decisions.

## Setup and reset

- Deploy the committed `.sppkg`, add **ZavaCore Procurement Command Center**, and start a fresh conversation.
- State once that all records and confirmed actions are deterministic, offline, and session-only.
- Keep `assets/ux-inline-CreatePurchaseIntent.png`, `assets/ux-sourcing-workbench.png`,
  `assets/ux-inline-ReviewSupplierAward.png`, and `assets/ux-spend-command.png` ready as fallback.

## 0:00-0:40 - Ask for an outcome

Prompt: **Find the fastest compliant path for 600 rugged devices within EUR 1.2 million.**

Expected tool: `CreatePurchaseIntentTool`. Show the editable outcome, quantity, locations, currency,
budget, constraints, and needed-by date. Route comparison is a separate explicit request.
The user did not choose a requisition form; Copilot selected bounded UX and the component owns the math.

Click Review and confirm the session-only intake. Expand **My Requests**, select the new
`ZPC-REQ-SESSION-...` business case, and show that the budget owner sees exactly the submitted
quantity, currency, locations and constraints. Enter a rationale, review and confirm. Its queue status
changes; no sourcing event, order or delivery is invented.

## 0:40-1:20 - Show the connected human checkpoint

Use the approval inbox and outcome timeline. Show **Needs review**, **Approved**, the named budget
owner and the exact session receipt. The fresh-intake slice proves submission-to-review continuity.
Now explicitly switch to the separate, pre-curated **600-device sourcing case `ZPC-RFP-31`**.

## 1:20-2:20 - Award for total value

Prompt: **Compare the final bids for ZPC-RFP-31 and show how risk changes the recommendation.**

Expected tool: `CompareSupplierBidsTool`. Change risk weight. Point to the D3 geometry, confidence, exact
table, and the Baltic corridor warning. Lowest price is not silently equated with best value.

## 2:20-3:10 - Preserve human accountability

Prompt: **Review the proposed 65/35 split award.**

Expected tool: `ReviewSupplierAwardTool`. Move the split and inspect cost, risk and resilience. Above
70% primary share is blocked. Restore 65%, enter a specific rationale, and review the exact decision.
Optionally confirm the session receipt while stating explicitly that no supplier was awarded externally.

## 3:10-4:00 - See the world and prove value honestly

Prompt: **Show our global procurement investments and verified value.**

Expected tool: `ExploreSpendPerformanceTool`. Expand **Spend Command**. Show the projected world map,
regional investment buttons, six-week commitment chart and delivery ledger. Select APAC: the program
scope, amounts and chart paths change together, and the absence of linked verified savings is explicit.
Return to Global: EUR 186,000 is verified, with EUR 15,000 disputed freight excluded.

For the deterministic alternate rehearsal, confirm a **60/40** award. The launch commitment becomes
EUR 1,059,600 and global commitments become EUR 6,295,600. Delivery remains 2,050 / 3,370 units:
approval is not fulfillment. Use `ResolveInvoiceExceptionTool` for a separate AP follow-up, not a
payment-release claim.

Closing line: **The art of possible is not more procurement chat. It is visual, evidence-aware software
inside the conversation, with policy visible early and people still accountable for every commitment.**

## Rehearsal checklist

- Verify prompt routing and extracted IDs in the authenticated target tenant.
- Verify Expand reaches the expected workspace with current context.
- Verify gradients, chart labels, keyboard marks, mobile layout, and dark mode.
- Reset before each run and keep the screenshot sequence available.