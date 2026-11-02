# ZavaMesh Revenue Deal Room - 4-minute keynote

## One opportunity. Four roles. One accountable decision.

For Microsoft customers, partners, sellers and product leaders. The story is:
**My Deals -> Deal Room -> Commercial Desk -> accountable submission and review -> Revenue Command**.
Copilot supplies the conversation and context. Full-screen workspaces make the next decision clear;
they are not a tour of 27 unrelated controls.

## Setup

- Deploy the validated production `.sppkg` and add **ZavaMesh Revenue Deal Room** in Microsoft Copilot.
  Local validation does not deploy anything.
- Use deterministic mock data. Megan Bowen's owned book is illustrative, not the signed-in user's
  real assignments. No CRM, customer, quote or forecast records are changed.
- Open a component, expand it, then click **Commercial Desk** in the left menu to show its landing.
  Use **Reset session data -> Confirm session reset** before rehearsal.
- Keep **ZDR-2042 / Contoso** through the opportunity story. After submission, preserve the actual
  generated **ZM-...** request ID; an opportunity and an approval request are different records.
- Keep the screenshot fallback ready: [Deal Room](assets/fullscreen-deal-room.png),
  [Commercial Desk](assets/fullscreen-commercial-desk.png), [country opportunities](assets/inline-global-opportunity-map.png),
  [submission](assets/inline-deal-submission.png) and [approval](assets/inline-deal-approvals.png).

## The navigation contract

Expanding a component opens its business-appropriate workspace with its exact context and edited
values visible. Entity chips, the business question and selected-work panel explain the information;
there is no extra origin banner.

Clicking a left-hand menu item opens that workspace's own landing view. It does not drag a success
handoff, approval or unrelated deal below another dashboard. Choose an opportunity or request to
work on it. **Back to [workspace]** returns to its list; **Resume [task] / [record]** deliberately
restores mounted work without discarding the draft.

- **My Deals:** owned book, next actions and opportunity selection.
- **Deal Room:** the selected buyer network, proof, risks and joint commitments.
- **Commercial Desk:** proposed offer economics and exact requests for independent review.
- **Revenue Command:** country opportunity, a separate recorded-spend ledger and pipeline interventions.

The **Continue to [business step]** action opens the next selected task inside its matching workspace.
**Continue with Copilot** and **More discussions** send the current visible context and a chat request.
Those are different actions: Workbench records the messages but does not run the model or automatically
create the next chat component.

## 0:00-0:35 - My Deals: start with a reason to act

Prompt: **Show my top revenue priorities, pipeline status and next actions.**

Expected component: `GetMyRevenuePriorities`. Expand it into **My Deals**, then use **Back to My Deals**
to show the purposeful starting point: **$18.54M open / $11.72M seller-weighted** in the current-quarter
owned book, an evidence-linked next action and a list of opportunities.

Say: **"Not another dashboard. A clear next move, grounded in the work I own."**

Click **Work top priority**. It deliberately opens the Contoso buying committee in **Deal Room**.
The interface now explains why this deal is on screen; an arbitrary record did not appear under a menu.

## 0:35-1:15 - Deal Room: turn a relationship gap into a decision

Expected task: `MapBuyingCommittee`, scoped to **ZDR-2042**.

Point to the buyer-role network and exact contact records. Influence is a recorded assessment;
membership does not establish authority, and economic-buyer access is not evidenced.

Say: **"We can see the people. Now we need proof that the right people can make the decision."**

Click **Continue to Deal risk**. Use the signature-blocker network to distinguish contrary buyer
evidence, stale assumptions and seller judgment. Inspect one source. A proposed introduction,
technical inference or elapsed time is not a customer commitment.

Optional conversational beat: use **More discussions -> Ask Copilot about this deal**. The selected
source, exact opportunity and discussion topic travel with the question.

Click **Continue to Commercial scenario** to enter **Commercial Desk** for that same opportunity.

## 1:15-2:05 - Commercial Desk: make the commercial choice explainable

Expected task: `SimulateCommercialOffer`.

Enter **1,000 licensed users / 24 months / 8% discount / $150,000 services / 0.65 seller probability**.
Leave the annual ramp blank. Show the calculated margin curve and:

- **$2,818,000 contract value**
- **$1,831,700 seller-weighted value**
- Margin above the **68%** floor; required authority is not approval.

Say: **"The numbers are the entered scenario, not a decorative chart or an approved quote."**

Click **Continue to Submit a deal**. The seller task opens in **My Deals** with those five actual values.
Do not retype a different offer. Annual-ramp scenarios cannot silently enter non-ramped intake.

## 2:05-3:00 - My Deals: submit the reviewed request, not an AI summary

Expected task: `SubmitDealRequest`.

Enter an outcome such as: **Roll out validated capabilities across 18 countries with an accountable
customer owner and independent commercial review.**

Continue through the form. Explicitly check the two **evidence attestations**, then review
the exact values. **Submit deal request** remains disabled until the user confirms.

Say: **"Copilot can help us reason. The user still reviews the actual request and owns submission."**

Confirm once and show the **ZM-...-SUBMIT** receipt. No CRM write or real approval occurred.
Use **Continue to Deal approvals** to open the exact generated request in **Commercial Desk**.

## 3:00-3:35 - Commercial Desk: an independent human decision

Expected task: `ReviewDealApproval`, scoped to the exact **ZM-...** request.

Show the same **$2,818,000** economics, inspect the evidence, choose the assigned
**Sales manager** role and enter an independent rationale. Explicit consent is required
before **Approve review stage** enables. This 8%-discount, above-floor request needs the manager stage only.

Point to the matching **ZM-...-A1** decision receipt. Role switching is not authentication.
Opening a request or moving between tasks never grants authority or approves anything automatically.

## 3:35-4:00 - Revenue Command: close the loop without rewriting the pipeline

Click **Revenue Command** in the left menu. Its own landing view shows the current country opportunity
map, request-status counters and clear interventions. The confirmed request count changes;
the CRM-shaped opportunity catalog does **not** quietly mutate into closed-won or commit.

Show **Opportunity / Recorded spend**:

- **$82,497,260** across 25 current-quarter opportunities, attributed to account HQs.
- A separate **$3.4M** recorded expense ledger, not rollout revenue, requested investment or ROI.

Closing line: **"Copilot carries the conversation. The workspaces carry the evidence and controls.
People still own the decision."**

## Graphical variants for a longer keynote slot

- **Explore pipeline value flow** opens `ExplorePipelineFlow` in **Revenue Command**.
  Its **$29.4M** current scenario is a separate planning allocation, not the catalog total.
- **Explore approval progress** opens `ExploreApprovalFlow` in **Commercial Desk**.
  Stage completion is not final approval. **Continue to Deal approvals** opens the named
  **ZM-1001** request with its own economics and evidence, not the aggregate chart value.
- Expand `DiscoverAccountOpportunity` for country opportunity and `ExplorePipelineQuality` with recorded
  spend for a full-width map. Choose a country, then inspect an actual record; scopes and provenance
  must remain visible.
- Show the alternate **ZDR-2043** scenario once to prove that selecting a different record changes the
  information rather than copying Contoso's proof or values.

## Rehearsal and fallback checklist

- Verify all four menu entries are aligned, readable, keyboard accessible and selected consistently.
- Verify every component expands into its matching workspace with its actual scope and edited values.
- Verify menu navigation shows a landing view, not an unrelated task appended at the bottom.
- Verify explicit item selection and resume preserve the intended record and draft.
- Verify maps and value flows are visible at desktop, narrow widths and in dark theme.
- Verify direct workspace continuation carries exact commercial inputs and generated request IDs.
- Verify real Copilot routing in the deployed agent; Workbench validates outgoing context/message exchanges.
- Verify the complete context stays below 10,000 UTF-8 bytes and precedes the message.
- Verify unchecked confirmations, independent roles, authority gates and exact receipts.
- Keep every inline stage within 650px at 760px width / 800px at 390px width. Expansion does not weaken
  those inline limits.
- Keep the screenshot fallback and pre-opened component cards ready if tenant preview routing is delayed.
