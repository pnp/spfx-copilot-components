# Invoke Expert Finder in Copilot

Install and synchronize the baseline agent using the [deployment guide](deployment.md). Open **Expert Finder** in Microsoft 365 Copilot and start a new conversation. Users do not need to name the tool: the declarative agent chooses `ExpertFinderTool` and supplies a canonical `skill` argument.

## Example prompts

| Prompt | Expected tool behavior | Fictional-data result count |
| --- | --- | --- |
| Who can help me with SPFx? | `skill: SPFx` | 6 |
| Find a SharePoint Framework developer. | `skill: SPFx` | 6 |
| Who can help me build a Copilot agent? | `skill: Copilot` | 8 |
| Find a database expert. | `skill: DB` | 1 |
| Find someone who knows Spanish. | `skill: Spanish` | 0; empty state |
| Find an expert. | Ask which skill | No search yet |
| Who can help with Azure Functions? | Explain the supported skills | No invented match |

Counts apply only when the root `Experts` list returns HTTP 404 and mocks are selected. A SharePoint-backed search uses the accessible list rows. Each invocation has one skill; there is no in-app skill selector. Name, department and role filters refine the current result set locally.

Copilot Workbench can supply `{"skill":"SPFx"}` directly. That verifies the component's argument/rendering path, rather than natural-language tool selection. Use Copilot developer diagnostics where available to inspect the selected tool and arguments. After deployment changes, allow discovery-cache propagation and test in a new conversation.

## Introduce me

1. Search for a supported skill and open fullscreen.
2. Select **Introduce me** on one expert card.
3. Wait for the handoff. Copilot writes the introduction in the existing conversation.
4. Review or copy the draft yourself; the action sends no Teams message.

The draft is requested in the first person, addressed to the selected expert, with exactly three relevant numbered questions. It should use the latest human request's language where available. Fictional profiles produce an explicitly illustrative draft.

This is a component action, not another tool. It publishes only the selected expert's name, job title, department, skill and summary, plus a purpose and fictional-profile marker. Emails, photos, calendars and other experts are excluded. The component awaits `updateModelContextAsync` before calling `sendFollowUpMessageAsync`; filters and rendering alone make neither call.

Context is labeled as data. Drafting instructions belong in the agent and follow-up, while profile fields remain untrusted input. Copilot should ground the draft in that profile without searching again or invoking an external action. See the [code walkthrough](code-walkthrough.md#selected-profile-context-and-follow-up) for the implementation.

The UI blocks overlapping requests across cards, checks host error acknowledgements and handles timeout and cancellation. An acknowledgement is not the generated draft: verify the actual conversation result and that the chat remains available. The author has reported this flow working in deployed Copilot; the [validation guide](validation.md#reported-deployed-checks) distinguishes that report from checks to repeat in another tenant.

## Meeting agenda

1. Search for a live expert, open fullscreen and choose **Check availability**.
2. Choose Today or Next working day and a future Free slot. Enter an optional **Session objective / notes**, review the date and expert, then confirm **Create Teams meeting**. This sends a real invitation.
3. After confirmed creation, select **Prepare agenda with Copilot**. The original objective and professional profile are shared with Copilot only for this action. Acknowledgement means the request was accepted, not that an agenda was rendered or saved.
4. Copilot generates a plain-text objective, timed blocks totaling 30 minutes and exactly three relevant questions in the conversation language, then invokes `PrepareMeetingAgendaTool` with the exact `eventId`, `bookingId` and generated `agenda`.
5. In **Review meeting agenda**, check the Graph-backed meeting details and edit the draft. **Save agenda to meeting** updates that same invitation and can notify attendees. The card confirms saved/already saved only after verification and offers **Open in Outlook** when available.

The two tool identifiers must come from the same confirmed booking and match the published `meetingAgenda` context. Without matching context, use the booking action again rather than inventing identifiers or substituting a new search. Empty notes allow a general learning agenda for the selected skill. Embedded instructions in profiles, notes or generated text remain data.

Only new marked meetings created by this revision are eligible. Old/unmarked events, attendee copies, changed booking times, cancelled/recurring events and invalid inputs cannot be updated through this card. Mock profiles have no booking/agenda flow. No extra Graph scope beyond the existing `Calendars.ReadWrite` booking permission is needed.

If saving is uncertain, use **Check save status** and inspect Outlook. Do not infer failure from a timeout or repeatedly save: the earlier update may have completed. Conflicts require reloading and reviewing the event. Generating, rendering, editing, or failing to open the agenda tool does not create a second meeting.

Use deployed Copilot to verify actual tool selection, generated content and normal conversation continuity afterward. A prose acknowledgement without a real agenda-tool invocation is not a completed handoff. Workbench can inject the three properties to check validation and rendering, but cannot prove natural orchestration. After deploying this revision, synchronize the changed baseline with **Add to Teams** and test in a new conversation.
