# ZavaMesh Revenue Deal Room - 6-minute keynote

## Beautiful work. One continuous Copilot conversation.

For Microsoft customers, partners, sellers and product leaders. Start with portfolio value,
follow the evidence into one opportunity, and finish with an accountable human decision.
The graphics are not slides: select a connection, inspect a country, edit an offer and review a
request. Copilot carries the exact context between those experiences.

**The signature contrast:** inline **Continue with Copilot** opens the next interactive UX in chat.
Full-screen **Continue with Copilot: Summary & next steps** returns a concise **text-only** answer
to that conversation. Show both using the same commercial scenario.

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

Expansion preserves the current work. The left menu opens a workspace's purposeful landing, not
an unrelated task below another dashboard. **Back to [workspace]** returns to the list; explicit
**Resume** restores mounted work. If the full-screen host does not reveal chat after sending a
summary, use its return-to-chat/collapse control. Do not claim automatic collapse.

## 0:00-0:45 - Follow value, then continue into the next UX

Choose **Pipeline value flow**:

> Show how pipeline value moves from regions through buyer readiness to next actions.

Expected inline component: `ExplorePipelineFlow`, titled **Pipeline value & actions**.
Show the **$29.4M** current allocation, select a connection to reveal its exact dollars and share,
then use **Back to value flow**.

Say: **"This is not a chart pasted into an answer. We can follow the value and inspect what needs action."**

Click **Continue with Copilot: Approval progress** from the overview. Pause for Copilot to create
`ExploreApprovalFlow` **inline in the conversation**. Show the visually distinct intake/reviewer/outcome
flow: **$30.0M** allocated, **$13.2M pending**, **$9.7M stage passed**.

Say: **"The next question becomes the next working experience, without starting the conversation again."**

These are separate planning scopes. Stage completion is not final approval; do not attribute either
aggregate to an individual request or open ZM-1001 as though it represents the chart total.

## 0:45-1:25 - Put opportunity and recorded spend on the world

Choose **World opportunity map**:

> Show a world map of country opportunity value for the current quarter across all regions.

Expected inline component: `DiscoverAccountOpportunity`. Show the projected map, country ranking
and **$82,497,260 across 25 opportunities**. Select Germany, inspect its exact country detail, then
return to **Country overview** with the selector so no country restriction carries into the next view.

Click **Continue with Copilot: Pipeline quality**. Copilot opens `ExplorePipelineQuality` with
**Recorded spend** selected: the same geographic language, a different data model and bubble sizes,
with a separate **$3.4M** expense ledger.

Say: **"Where the opportunity sits and where spend was recorded are different questions. Copilot carries the scope, not an invented conclusion."**

Headquarters attribution is not rollout revenue. Spend is not requested investment or ROI.

## 1:25-2:10 - Move from a portfolio to one buyer decision

Choose **Map the buying committee**:

> Map the buying committee for Contoso and show missing buyer access.

Expected component: `MapBuyingCommittee`, scoped to **ZDR-2042**. Show the buyer-role network,
portraits and exact contact inspection. Economic-buyer access is not evidenced.

Expand into **Deal Room**. Let the audience see the full-width relationship experience and the
aligned workspace navigation. Point to the selected opportunity rather than touring the menu.

Say: **"We have the people on the map. What we still need is proof of access and a credible path to a decision."**

Use the local **Continue to Deal risk**, inspect one signature blocker, then **Continue to Commercial
scenario**. These are local workspace transitions, not model-generated responses. Keep **ZDR-2042**.

## 2:10-3:10 - Same offer, two different Continue with Copilot results

In **Commercial Desk**, set **1,000 users / 24 months / 8% discount / $150,000 services /
0.65 seller probability**. Leave the annual ramp blank. Show the recalculating margin curve and:

- **$2,818,000 contract value**
- **$1,831,700 seller-weighted value**
- Margin above **68%**; required authority is not approval.

Click the full-screen **Continue with Copilot: Summary & next steps**. Return to chat if the host
requires it. **The response must be text, not another UX card.**

Expected substance, not a memorized quotation: the current Contoso terms and exact two values,
the buyer-proof or validation gaps actually visible, and the next review actions. The offer is
proposed; no quote, submission or approval has happened. Keep the answer to a short paragraph and
two next steps. Missing evidence stays unknown.

Say: **"The workspace gives us room to work. Continue with Copilot brings the meaning back into the conversation."**

For the inline handoff, open **Model a commercial offer** with the same explicit values:

> Model a Contoso offer with 1,000 users, 24 months, 8% discount, $150,000 services and 65% seller probability.

This deliberate tool request opens `SimulateCommercialOffer` inline. Verify the same exact values,
then click **Continue with Copilot: Submit a deal**. Copilot must open `SubmitDealRequest` as a
**new interactive inline form**, prefilled with those economics.

Do not assume collapsing an original buyer-network card turns it into the locally navigated
commercial task. Requesting the named inline scenario makes that transition explicit and repeatable.

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

After confirmation, click inline **Continue with Copilot: My priorities**. Copilot opens the
updated `GetMyRevenuePriorities` UX, closing the work loop rather than merely saying it is done.

## 5:10-6:00 - One conversation, four purposeful workspaces

Expand the priorities component into **My Deals**, then use **Back to My Deals** to show the
owned book, next action and actual opportunity choices. The starting view makes sense on its own.

Click **Revenue Command** in the left menu. Show its full-width country opportunity map and
request-status counters. The confirmed work overlay changes; the opportunity catalog does not
quietly become closed-won or a committed forecast.

Return briefly to the text summary in the conversation if time permits. Contrast the short,
contextual explanation with the beautiful, inspectable UX already shown.

Closing line: **"Copilot is not a separate destination. It is the conversation around the work:
interactive when we need to act, concise when we need to understand, and accountable when we decide."**

## Five-minute cut

Keep the commercial full-screen text summary and inline submission handoff; that contrast is mandatory.
Save one minute by using the world opportunity overview without country drill-down or the spend handoff
(20 seconds), showing buyer access without opening a risk detail (15 seconds), and closing on the
approval receipt instead of the priorities/Revenue Command tour (25 seconds). Never skip consent or
pretend a decision occurred.

## Rehearsal and fallback checklist

- Verify both Continue with Copilot buttons in the deployed agent: inline produces the named UX;
  full-screen produces a **text-only** summary with no tool call. Workbench transport is not proof.
- Verify the summary uses the active full-screen task, edited values and selected record, not a
  hidden original card. An explicitly requested later component must still open normally.
- Verify the inline commercial handoff preserves **$2,818,000 / $1,831,700** and all five inputs.
- Verify the same generated request ID reaches approval; aggregate chart volume never becomes its value.
- Verify the visible context precedes the outgoing message and the entire payload stays within
  **10,000 UTF-8 bytes**, with explicit omissions when needed.
- Verify unchecked confirmation, independent roles, evidence, rationale and matching receipts.
- Verify real pointer/keyboard selection, narrow layout, dark theme and aligned full-screen navigation.
- Keep each complete inline stage within **650px at 760px / 800px at 390px**.
- Time actual model responses, not just clicks. Keep the screenshot fallback and pre-opened cards
  ready for tenant latency; do not narrate a missing response as successful routing.
