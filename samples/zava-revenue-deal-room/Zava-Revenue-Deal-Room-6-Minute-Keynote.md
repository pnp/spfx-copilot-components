# ZavaMesh Revenue Deal Room - 6-minute keynote

## Beautiful work. More context when you need it.

For Microsoft customers, partners, sellers and product leaders. Start with portfolio value,
follow the evidence into one opportunity, and finish with an accountable human decision.
The graphics are not slides: select a connection, inspect a country, edit an offer and review a
request. Copilot carries the exact context between those experiences.

**The story:** start with useful, interactive work in the conversation. When you need more context
and detail, expand into the matching workspace; full screen is an option, not a prerequisite.
Keep the main journey moving with direct inspection and the form's own controls. Use Copilot
handoffs where the job changes: from a proposed offer to submission, then to independent review.

## Setup - not spoken on stage

- Deploy the validated production `.sppkg` and add **ZavaMesh Revenue Deal Room** in Microsoft Copilot.
  Local validation does not deploy anything.
- Use deterministic mock data. Megan Bowen's owned book is not the signed-in user's live workload.
  Confirmed actions stay in the session; no CRM, customer, quote or forecast records are changed.
- Rehearse in the deployed agent. Workbench records context and outgoing messages; it does not run
  the model, generate summaries or create the next component automatically.
- Reset with **Commercial Desk -> Reset session data -> Confirm session reset** before rehearsal.
- Keep **Contoso / ZDR-2042** throughout the opportunity story. Preserve the generated **ZM-...**
  request ID after submission; request and opportunity IDs are not interchangeable.
- Use the twelve starters as entry points. **Explore capabilities** remains last; it is not the
  opening keynote beat.
- Keep screenshot fallback ready: [pipeline value](assets/inline-pipeline-sankey.png),
  [approval progress](assets/inline-approval-sankey.png), [world opportunity](assets/inline-global-opportunity-map.png),
  [recorded spend](assets/inline-country-spend-map.png), [Deal Room](assets/fullscreen-deal-room.png),
  [Commercial Desk](assets/fullscreen-commercial-desk.png), [submission](assets/inline-deal-submission.png)
  and [approval](assets/inline-deal-approvals.png).

## The interaction contract

| Surface / action | What the audience sees next | What must not happen |
| --- | --- | --- |
| Inline **Continue with Copilot: [next business step]** | The next named UX component in chat, carrying exact scope and supported edited values | A generic text substitute, a different deal or an automatic decision |
| Full-screen **Continue with Copilot: Summary & next steps** | A short text summary in chat: findings, visible numbers, evidence gaps, confirmed status and next steps | Another component, tool call, local navigation, submission or approval |
| Full-screen **Continue to [business step]** | The next task opens locally in its matching workspace | Pretending that local navigation is a Copilot response |
| **More discussions** | A contextual question or explicitly selected tool request | Launching a preview without the user's action |

During unfinished submission or review, keep working through the form's own **Continue**, evidence,
exact-review and confirmation controls. Its contextual discussion action can help check a draft;
it must not bypass submission, independent review or consent to create another record.

Expansion preserves the current work; it is not a required step between inline experiences.
The left menu opens a workspace's purposeful landing, not
an unrelated task below another dashboard. **Back to [workspace]** returns to the list; explicit
**Resume** restores mounted work. If the full-screen host does not reveal chat after sending a
summary, use its return-to-chat/collapse control. Do not claim automatic collapse.

## 0:00-0:45 - Follow value and inspect what needs action

Choose **Pipeline value flow**:

> Show how pipeline value moves from regions through buyer readiness to next actions.

Expected inline component: `ExplorePipelineFlow`, titled **Pipeline value & actions**.
Show the **$29.4M** current allocation, select a connection to reveal its exact dollars and share,
then use **Back to value flow**.

Say: **"This is not a chart pasted into an answer. We can follow the value and inspect what needs action."**

Stay with the selected value and next action rather than launching a second flow. The audience
should see that the answer is already useful inside the conversation. The allocation is a planning
scope, not an individual request, a predicted conversion or an approval.

## 0:45-1:25 - Put the opportunity on the world

Choose **World opportunity map**:

> Show a world map of country opportunity value for the current quarter across all regions.

Expected inline component: `DiscoverAccountOpportunity`. Show the projected map, country ranking
and **$82,497,260 across 25 opportunities**. Select Germany, inspect its exact country detail, then
return to **Country overview** with the selector so no country restriction carries into the next view.

Say: **"We can see where the opportunity sits, inspect a country and understand the actual deals behind the number, right here."**

Headquarters attribution is not rollout revenue. Keep recorded spend as an optional extra, not
another required handoff before the customer story.

## 1:25-2:10 - Buyer proof, with more context when needed

Choose **Map the buying committee**:

> Map the buying committee for Contoso and show missing buyer access.

Expected component: `MapBuyingCommittee`, scoped to **ZDR-2042**. Show the buyer-role network,
portraits and exact contact inspection. Economic-buyer access is not evidenced.

Say: **"We have the people on the map. What we still need is proof of access and a credible path to a decision. When I need more context and detail, I can open the Deal Room."**

Choose **Expand** to show that option: the same selected opportunity, with the wider relationship
experience, pursuit team and evidence ledger around it. Inspect one relevant evidence gap rather
than touring the menu. Explain that this adds surrounding context; it is not necessary to expand
every component to get work done.

Return to the conversation using the host's return-to-chat/collapse control. Keep the buyer view
on **ZDR-2042**; do not navigate through additional tasks just to reach the next keynote beat.

## 2:10-3:10 - Shape the offer, then move to review

Open **Model a commercial offer**:

> Model a Contoso offer with 1,000 users, 24 months, 8% discount, $150,000 services and 65% seller probability.

Expected inline component: `SimulateCommercialOffer`, still scoped to **ZDR-2042**. Use its editable
fields to show **1,000 users / 24 months / 8% discount / $150,000 services / 0.65 seller probability**.
Leave the annual ramp blank. Show the recalculating margin curve and:

- **$2,818,000 contract value**
- **$1,831,700 seller-weighted value**
- Margin above **68%**; required authority is not approval.

Say: **"We can shape the proposal here. When the terms are ready, we move into review with those exact values."**

Click **Continue with Copilot: Submit a deal**. Copilot must open `SubmitDealRequest` as a
**new interactive inline form**, prefilled with those economics. This is a meaningful change of job,
not an extra continuation between every inspection.

Do not reopen the offer or require a full-screen summary before submitting. The proposal is still
unsubmitted and unapproved; the next form owns review and consent.

## 3:10-4:10 - Review and submit the real values on screen

Expected component: `SubmitDealRequest`, with the exact five commercial values above.

Enter:

> Roll out validated capabilities across 18 countries with an accountable customer owner and independent commercial review.

Advance through the compact form. Explicitly check the two evidence attestations, inspect all
exact-value review pages and check the submission confirmation. **Submit deal request** must remain
disabled until the user has completed the required review and consent.

Say: **"Copilot carries the proposal. The person still reviews the actual values and owns submission."**

Submit once. Show the **ZM-...-SUBMIT** receipt. Only now click **Continue with Copilot: Deal approvals**
(the button also shows the generated request ID). Pause for the **inline approval UX**, not a
prose approval or a substituted ZM-1001 baseline.

## 4:10-5:10 - An independent decision, not an AI approval

Expected component: `ReviewDealApproval`, scoped to that exact **ZM-...** request.

Inspect the matching **$2,818,000** terms and evidence. Choose **Sales manager**, enter an independent
rationale and explicitly confirm. Role switching is not authentication; use it only to demonstrate
the assigned review-stage control.

Suggested rationale:

> Sponsor, security evidence and the standard commercial terms have been independently reviewed.

**Approve review stage** stays disabled without the required evidence, assigned independent role,
rationale and consent. The 8%-discount, above-floor request needs the manager stage only.
Show the matching **ZM-...-A1** receipt.

Say: **"An explanation is not an approval. Opening a component is not an approval. This independent, confirmed decision is the recorded action."**

Finish on the matching receipt. A further **Continue with Copilot: My priorities** is available,
but is not needed to prove that the decision was recorded.

## 5:10-6:00 - The same work, with wider operating context

Say: **"The decision is recorded. If I now need the wider operating picture, I can move into the workspace."**

Expand the approval component into **Commercial Desk**. Choose **My Deals** in the left menu to show
the owned book, next action and actual opportunity choices. Its landing makes sense on its own;
there is no need to create another chat card first.

Click **Revenue Command** in the left menu. Show its full-width country opportunity map and
request-status counters. The confirmed work overlay changes; the opportunity catalog does not
quietly become closed-won or a committed forecast.

Closing line: **"Copilot is not a separate destination. It is the conversation around the work:
interactive when we need to act, concise when we need to understand, and accountable when we decide."**

## Optional capability moments - not required transitions

Use these for extra time or audience questions, not between every main-story beat:

- **Approval value flow** opens `ExploreApprovalFlow`: **$30.0M** allocated, **$13.2M pending**,
  **$9.7M stage passed**. This is a separate planning scope, not the submitted request or final approval.
- **Recorded spend by country** opens `ExplorePipelineQuality` with **Recorded spend** selected:
  a separate **$3.4M** expense ledger, not requested investment or ROI.
- For a concise explanation of the edited offer, expand its original `SimulateCommercialOffer`
  card into **Commercial Desk**, then choose **Continue with Copilot: Summary & next steps**.
  Return to chat if the host requires it. The response must be **text-only**, not another card:
  the current terms, **$2,818,000 / $1,831,700**, visible evidence gaps, confirmed status and two
  next steps. No quote, submission or approval has happened. Return to that same inline offer
  to continue; do not recreate it or assume collapsing a different card changes its task.

## Five-minute cut

Keep the inline offer-to-submission and submission-to-approval handoffs, including the outcome wording
and exact-value review. Save one minute by using the pipeline overview without connection drill-down
(15 seconds), the world opportunity overview without country drill-down (15 seconds), and closing on
the approval receipt instead of the workspace tour (30 seconds). Leave optional capability moments
out of both timed runs. Never skip consent or pretend a decision occurred.

## Rehearsal and fallback checklist

- Verify the two core inline handoffs in the deployed agent: offer to submission, then the submitted
  request to approval. Both must produce the named UX, not a text substitute. Workbench transport is not proof.
- Rehearse expansion as a choice for more context and detail, not a prerequisite to the next task.
- If showing the optional full-screen summary, verify a **text-only** answer with no tool call,
  using the active task, edited values and selected record, not a hidden original card.
  An explicitly requested later component must still open normally.
- Verify the inline commercial handoff preserves **$2,818,000 / $1,831,700** and all five inputs.
- Verify the same generated request ID reaches approval; aggregate chart volume never becomes its value.
- Verify the visible context precedes the outgoing message and the entire payload stays within
  **10,000 UTF-8 bytes**, with explicit omissions when needed.
- Verify unchecked confirmation, independent roles, evidence, rationale and matching receipts.
- Verify real pointer/keyboard selection, narrow layout, dark theme and aligned full-screen navigation.
- Keep each complete inline stage within **650px at 760px / 800px at 390px**.
- Time actual model responses, not just clicks. Keep the screenshot fallback and pre-opened cards
  ready for tenant latency; do not narrate a missing response as successful routing.
