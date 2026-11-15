# Code walkthrough

Code and configuration paths are relative to [`src/copilot-expert-finder`](../src/copilot-expert-finder/). This guide describes the existing implementation; it does not require a backend, another model or a separate MCP server.

## Request flow

```mermaid
flowchart LR
    User[User prompt] --> Agent[Declarative agent]
    Agent --> Tool[ExpertFinderTool]
    Tool --> Input[Typed skill property]
    Input --> UI[React inline or fullscreen UI]
    UI --> Data[SharePoint or fictional profiles]
    UI --> Graph[User-triggered Graph actions]
    UI --> Prepare[Prepare agenda with Copilot]
    Prepare --> Agent
    Agent --> Agenda[PrepareMeetingAgendaTool]
    Agenda --> Review[Editable agenda review]
    Review --> Save[Explicit Save to existing event]
    Save --> Graph
```

Copilot selects the tool and generates its arguments. The component validates the canonical skill, retrieves matching records and renders the interactive results. It does not ask another model to search. Supported skills are `SPFx`, `Copilot`, `DB` and `Spanish`; local filters refine the results of the current invocation.

## Agent and component wiring

| File | Responsibility |
| --- | --- |
| [copilot/manifest.json](../src/copilot-expert-finder/copilot/manifest.json) | Microsoft 365 app identity, branding and baseline agent reference |
| [copilot/declarativeAgent.json](../src/copilot-expert-finder/copilot/declarativeAgent.json) and [instruction.txt](../src/copilot-expert-finder/copilot/instruction.txt) | Agent description, starters, skill mappings and drafting rules |
| [copilot/ai-plugin.json](../src/copilot-expert-finder/copilot/ai-plugin.json) | Plugin seed; the build expands the runtime wiring |
| [config/copilot-agent.json](../src/copilot-expert-finder/config/copilot-agent.json) | Groups both components into one agent and generates the static tool catalog |
| [Component manifest](../src/copilot-expert-finder/src/copilotComponents/expertFinder/ExpertFinderCopilotComponent.manifest.json) and [typed properties](../src/copilot-expert-finder/src/copilotComponents/expertFinder/ExpertFinderCopilotComponentProperties.ts) | Tool metadata and Zod-backed input contract |
| [ExpertFinderCopilotComponent.tsx](../src/copilot-expert-finder/src/copilotComponents/expertFinder/ExpertFinderCopilotComponent.tsx) | SPFx context, source selection, service lifetime, React rendering and public Copilot Bridge calls |

SPFx hosts both components and supplies their managed MCP transport. This sample uses the installed generator's `toolDiscovery: "static"` option so both tools are generated from the component manifests/schemas into the baseline agent; no function catalog is maintained by hand. Changes to this generated catalog require rebuilding and synchronizing the baseline. Preserve package identities when updating an existing installation. See [deployment](deployment.md) for when agent synchronization is required.

## Data and React views

[createExpertService.ts](../src/copilot-expert-finder/src/copilotComponents/expertFinder/services/createExpertService.ts) checks `Experts` at the origin of the SPFx context URL. HTTP 200 selects SharePoint, HTTP 404 selects mocks and other failures remain errors. An empty existing list is not a reason to use mocks.

[SharePointExpertService.ts](../src/copilot-expert-finder/src/copilotComponents/expertFinder/services/SharePointExpertService.ts) uses `SPHttpClient` under the current user's permissions, filters the single-choice `Skill` column server-side, expands the Person field and validates the response with Zod. It reports an error if the result exceeds one page of 100 records. Membership login and SMTP email have distinct roles: UPN-based photos/Teams links and email-based calendar requests.

[MockExpertService.ts](../src/copilot-expert-finder/src/copilotComponents/expertFinder/services/MockExpertService.ts) reads the bundled [mockExperts.ts](../src/copilot-expert-finder/src/copilotComponents/expertFinder/data/mockExperts.ts). The JSON under `docs/` is only a manual SharePoint setup aid. Mock mode does not construct the live Graph services.

| Component | Responsibility |
| --- | --- |
| [ExpertFinder.tsx](../src/copilot-expert-finder/src/copilotComponents/expertFinder/components/ExpertFinder.tsx) | Loads results and coordinates shared interaction state |
| [ExpertFinderInline.tsx](../src/copilot-expert-finder/src/copilotComponents/expertFinder/components/ExpertFinderInline.tsx) | Total count, up to three experts and host-supported expansion |
| [ExpertFinderFullscreen.tsx](../src/copilot-expert-finder/src/copilotComponents/expertFinder/components/ExpertFinderFullscreen.tsx) | Responsive cards and local name-prefix, department and job-title filters |
| [ExpertCard.tsx](../src/copilot-expert-finder/src/copilotComponents/expertFinder/components/ExpertCard.tsx) and [ExpertActions.tsx](../src/copilot-expert-finder/src/copilotComponents/expertFinder/components/ExpertActions.tsx) | Profile presentation and user actions |
| [ExpertAvailabilityPanel.tsx](../src/copilot-expert-finder/src/copilotComponents/expertFinder/components/ExpertAvailabilityPanel.tsx) | One selected expert's availability and bookable slots |
| [MeetingConfirmationDialog.tsx](../src/copilot-expert-finder/src/copilotComponents/expertFinder/components/MeetingConfirmationDialog.tsx) | Explicit confirmation before a real calendar write |

Filters operate in memory. Host theme and display-mode changes do not trigger another model call. Teams navigation uses the public host link API.

## Graph photos and calendars

[GraphPhotoService.ts](../src/copilot-expert-finder/src/copilotComponents/expertFinder/services/GraphPhotoService.ts) uses `MSGraphClientV3` to retrieve photo bytes, loads the small result set in parallel and caches by UPN for the component instance. Avatars show a shimmer and fall back to initials. The service releases Blob URLs on teardown.

[GraphAvailabilityService.ts](../src/copilot-expert-finder/src/copilotComponents/expertFinder/services/GraphAvailabilityService.ts) requests only the selected expert's SMTP address using `POST /me/calendar/getSchedule`. The panel passes the selected **Today** or **Next working day** date to the service. Its local 09:00–18:00 boundaries are converted to UTC, and the returned half-hour availability codes are displayed in local time. The next working day skips Saturday and Sunday without considering holidays. Responses are matched to both the expert email and selected day, so a late response cannot replace another date's results. Event details are discarded. Changing days loads that date; Morning/Afternoon navigation slices the loaded day, while **Refresh** rereads it without resetting the selected period. There is no background calendar polling.

[GraphMeetingService.ts](../src/copilot-expert-finder/src/copilotComponents/expertFinder/services/GraphMeetingService.ts) rechecks both calendars and the organizer's Teams-provider support after confirmation, then creates a calendar-backed event with `isOnlineMeeting: true` and `onlineMeetingProvider: teamsForBusiness`. This sends a real invitation. The service blocks self-booking and repeated in-flight attempts and uses Graph's `transactionId` for retry protection.

Successful creation adds a session-local Busy record that takes precedence over stale Free results. It survives expert/mode changes in the component instance, but not a reload, and does not establish attendee acceptance or track later cancellations. An uncertain create result blocks another attempt for that slot in the instance: inspect Outlook before retrying. A missing join link can be reread from the created event without creating another meeting.

See [Graph permissions](graph-permissions.md) for delegated consent and mailbox prerequisites.

## Selected-profile context and follow-up

**Introduce me** is a component action, not a new tool. [introduction.ts](../src/copilot-expert-finder/src/copilotComponents/expertFinder/utils/introduction.ts) builds a context snapshot with `purpose: introductionDraft`, a fictional-profile marker and exactly one expert's name, job title, department, skill and summary. It excludes emails, photos, calendar data and other experts, and rejects payloads over its 9,000-byte UTF-8 budget.

The entry point:

1. Creates host text content using a descriptive data label and the profile JSON.
2. Awaits `updateModelContextAsync` to publish that selected profile.
3. Calls `sendFollowUpMessageAsync` with the drafting request.
4. Checks `isError`, handles timeout/cancellation and releases the shared pending state.

The shared `_sendHandoff` helper performs the two Bridge operations for both introduction and agenda requests. `_introduceExpert` supplies `buildIntroductionContext` and `introductionPrompt`; `_prepareAgenda` verifies the booking before building its context. `options` carries the existing timeout and abort signal. The helper checks disposal between operations and handles failures and cleanup.

```typescript
const bridge = this.context.copilotBridge;
await bridge.updateModelContextAsync(
  { content: [createCopilotTextContent(handoff.context)] },
  options
);
const result = await bridge.sendFollowUpMessageAsync(
  [createCopilotTextContent(handoff.prompt)],
  options
);
if (result.isError) throw new Error('The host rejected the Copilot request. Inspect the conversation before trying again.');
```

`updateModelContextAsync` publishes context without generating a response. `sendFollowUpMessageAsync` adds the user-triggered message that asks Copilot to use it. Awaiting the first call ensures the selected profile is available before the follow-up is sent; the follow-up acknowledgement is separate from the draft generated in chat.

Profile fields remain untrusted data. Behavioral rules belong in the agent and follow-up. A shared guard prevents overlapping requests from different cards. The host returns an acknowledgement, while the draft appears in the Copilot conversation; the introduction action contains no draft editor and sends no Teams message. See [invocation](copilot-invocation.md) for expected draft content and [Microsoft's context guidance](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/provide-context-to-copilot) for the public Bridge APIs.

## Meeting agenda review and save

[meetingAgenda.ts](../src/copilot-expert-finder/src/copilotComponents/expertFinder/utils/meetingAgenda.ts) builds a `purpose: meetingAgenda` context with exact event/booking IDs, authoritative event times, the selected professional profile and the original objective. Each text block is limited to 9,000 UTF-8 bytes; identifiers are never truncated. Introduction and agenda actions share the same Bridge guard. Agent instructions route agenda requests separately from the introduction branch's no-tools rule.

[PrepareMeetingAgendaCopilotComponent.tsx](../src/copilot-expert-finder/src/copilotComponents/prepareMeetingAgenda/PrepareMeetingAgendaCopilotComponent.tsx) is a separate component with its own Graph service and React root. Its [strict properties schema](../src/copilot-expert-finder/src/copilotComponents/prepareMeetingAgenda/PrepareMeetingAgendaCopilotComponentProperties.ts) accepts exactly `eventId`, `bookingId` and generated plain-text `agenda`. Runtime validation remains authoritative even where the generator removes unsupported schema constraints from the agent-facing catalog. Invocation reads and renders; it does not save.

New meetings contain a bounded `singleValueExtendedProperties` marker with booking UUID, expert email and original UTC times. Agenda reads use `/me/events/{id}` and verify the event, organizer, marker, attendee, single-instance 30-minute time range, ETag and Teams connection. Arbitrary or legacy unmarked events are rejected. UI summary fields come from Graph rather than model arguments.

[MeetingAgendaReview.tsx](../src/copilot-expert-finder/src/copilotComponents/prepareMeetingAgenda/components/MeetingAgendaReview.tsx) displays the editable draft and explicitly warns that saving may notify attendees. Save rereads the event, compares the reviewed version and sends only `body` in a conditional PATCH. [meetingAgendaBody.ts](../src/copilot-expert-finder/src/copilotComponents/expertFinder/utils/meetingAgendaBody.ts) preserves outside markup/notes/links and inserts or replaces one bounded, escaped section. Confirmation rereads the same event and checks exact agenda text, outside content and Teams link, tolerating presentation-only HTML/CSS normalization. This follows Microsoft's [event-body update guidance](https://learn.microsoft.com/en-us/graph/api/event-update?view=graph-rest-1.0).

An identical agenda returns already saved without another PATCH. Conflicts require reload/review; an uncertain update retains the draft and offers read-only status checking, then an explicit Outlook-inspection/reload decision before another save. There is no replacement event or automatic write retry. The `If-Match` header limits conflicts where honored; the Graph event-update reference does not guarantee atomic cross-client editing. The agenda card reports inline content-size changes to the host; fullscreen sizing remains host-owned.
