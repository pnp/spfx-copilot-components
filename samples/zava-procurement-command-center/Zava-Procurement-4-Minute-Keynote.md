# ZavaCore Procurement Command Center - 4-minute keynote

## Audience and promise

For Microsoft's Ignite keynote: **buy for the outcome, challenge the evidence, keep people accountable,
and prove the value.** The visual arc is supplier trade-offs -> governed split -> world investment
footprint -> verified-value Sankey. Copilot does not merely describe a dashboard; it selects usable
software, grounds the next conversation in what is actually visible, and lets the work continue.

## Setup and reset

- Deploy the committed `.sppkg`, add **ZavaCore Procurement Command Center**, and start a fresh conversation.
- State once that all records and confirmed actions are deterministic, offline, and session-only.
- Keep the [supplier comparison](assets/ux-inline-CompareSupplierBids.png),
  [split review](assets/ux-ReviewSupplierAward-review.png),
  [global investment command](assets/ux-spend-command.png) and
  [value Sankey](assets/ux-inline-ExploreSpendPerformance.png) ready as fallback.
- Use the 12 published starters; capability exploration is last. Rehearse the exact prompts and bridge
  behavior in the authenticated keynote tenant. Local Chromium is not proof of model routing.
- Confirm the curated sourcing case starts without a recorded award. The new-intake journey and
  existing sourcing event are separate; do not imply the first prompt fabricated received bids.

## 0:00-0:25 - A need, not a form

Prompt: **Find the fastest compliant path for 600 rugged devices within EUR 1.2 million.**

Expected: `CreatePurchaseIntentTool`. Show the 600-device outcome and EUR 1.2m budget. Do not spend
the keynote completing all intake fields. Say: **"The business owns the need. Now let's examine the
received bids for our existing sourcing event, ZPC-RFP-31."** This transition is explicit, not an
invented intake-to-bid automation.

## 0:25-1:15 - Price is not the whole decision

Prompt: **Compare the final rugged-device bids and show how risk changes the award.**

Expected: `CompareSupplierBidsTool`. Set risk weight to **5%**, then **35%**. The price weight changes
from 43% to 13%; the total stays 100%. Northwind Rugged leads the price-led case at **68.4/100**;
Contoso Mobility leads the resilience-led case at **73.3/100**. Marks and exact scores redraw.
Bubble area is evidence confidence, not failure probability. This is analysis, not an award.

Say: **"The lowest price becomes a very different decision when continuity matters."**

## 1:15-1:55 - A conversation grounded in the visual

Open **More discussions -> Challenge the supplier ranking**. Expected response: text about the
currently visible **35% risk weight**, selected supplier, bid economics and evidence—not a new card
or the earlier 5% scenario. Keep the agent's response brief.

Choose **Continue with Copilot: Review supplier award**. Expected: exactly
`ReviewSupplierAwardTool`, preserving `ZPC-RFP-31`. Then choose **Open award decision room**.
The named destination opens directly, retains the draft and adds David's authority/evidence context.
No origin/launcher banner is shown.

## 1:55-2:45 - The human checkpoint changes a commitment, not reality

Set primary share to **72%** and show the authority block. Restore **60%**:
Fabrikam 60%, Contoso 40%, **EUR 1,059,600**, blended risk **39/100**, timing confidence **93%**.
Enter: **"Dual-source capacity and budget authority verified."**

Click **Review approve split award**, inspect the exact values and rationale, then
**Confirm session-only approve split award**. Show the receipt.
Say: **"A defensible decision, with an accountable person. Not an autonomous supplier award."**

## 2:45-4:00 - Follow the world footprint to the missing proof

In the same application choose **Spend Command**. Show the real offline world projection and
**Committed footprint**. The confirmed allocation changes the launch commitment and global
commitments to **EUR 6,295,600** against **EUR 7.8m** planned. Delivery remains **2,050 / 3,370 units**.

Select **APAC**: **EUR 1.52m planned**, **EUR 1.2m committed**, **390 / 630 units delivered**.
Map scope and trend data change; no linked verified savings are invented. Return to **Global** and
scroll to the Sankey: **EUR 286k identified -> EUR 186k verified**, with **EUR 100k unverified**.
Select the **Off-contract device spend -> Contracted / unverified** ribbon: **EUR 17k**.
The **EUR 15k** freight dispute is inside that unverified amount, not an additional flow.

Choose **Continue with Copilot: Summary & next steps**. Expected: a text-only summary of this
selection and current confirmed state. No new component is opened and no further action is authorized.

Closing line: **"From a business need to evidence we can inspect, decisions we can govern, and value
we can actually prove. That is procurement work—not just procurement chat."**

### Optional resilience interlude

For the longer rehearsal, use the Supplier risk starter. In **Continuity planning room**, change
Current corridor to Port disruption: Fabrikam's modeled index changes **44 -> 66**. Select a dependency
node and ask about its assumptions. This is a scenario, never a claim that a disruption occurred.

## Rehearsal checklist

- Verify prompt routing and extracted IDs in the authenticated target tenant.
- Verify each Open action reaches its named business destination with current selection/draft.
- Verify discussion stays in text, explicit inline handoff opens one tool, and full-screen summary
  stays in text. Full-screen **Continue to** is local navigation, not a Copilot message.
- Verify gradients, chart labels, keyboard marks, mobile layout, and dark mode.
- Reset before each run and keep the screenshot sequence available.
- Do not equate newly confirmed award economics with the separate seeded invoice or historical
  recovery evidence. Commitment, delivery and verified savings must remain distinct.