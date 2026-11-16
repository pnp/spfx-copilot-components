# Manual validation

Use this checklist after following [deployment](deployment.md). These are checks to perform in the target environment, not a claim that every scenario has already passed. Keep local build results separate from deployed Copilot observations.

## Author-reported Copilot validation on November 16, 2026

The sample author confirmed that the updated sample was validated in deployed Copilot and works as expected, including Today / Next working day availability, meeting booking, Copilot-generated agenda review/editing and saving the agenda to the existing meeting. The earlier pending status in the November 15 local-verification notes is superseded by this report for the normal user journey.

This is author-reported tenant validation, separate from the local build and simulated checks below. It does not claim independent verification of every failure, concurrency or accessibility case in the reusable checklist.

## Local verification on November 15, 2026

### Meeting agenda revision

- `npm run build` passed with the existing dependencies: TypeScript, lint, production bundles and solution packaging. The sample still has no committed automated test suite or new dependencies.
- Archive checks confirmed SharePoint solution `1.0.0.13`, Teams app `1.0.9`, two registered components, one embedded agent ZIP and the generated `ExpertFinderTool` / `PrepareMeetingAgendaTool` catalog. Existing solution/app/search-component IDs were preserved; the agenda component has its own ID. No development hot-update assets or generated archives are committed.
- Temporary simulated Graph/React DOM checks passed for new-booking markers, strict input/context limits, organizer/marker validation, text and HTML body preservation, literal HTML escaping, ETag-conditional body-only saves, identical-save deduplication, changed-agenda replacement, conflicts, uncertain-save reconciliation and disposal before a write.
- UI checks covered read-only initial rendering, editing, duplicate clicks, confirmed success, unknown-status checking, conflict reload, denied reads, inline size reporting and the captured objective/booking passed after confirmed creation. Bridge checks verified context-before-follow-up ordering, the shared handoff guard and cancellation after teardown.
- The previous availability checks passed again, including weekend/year/daylight-saving boundaries, day/period navigation, Refresh, stale responses and booking date/cancel. Sample metadata, thumbnails, local documentation links and the README view tracker were checked locally.

All calendar and Bridge responses in these checks were simulated. No real event was created/updated, no baseline agent was deployed or synchronized, and no new dependency installation or full gallery CI run was performed. Deployed Copilot checks were pending at the time of this local run; the later author-reported validation is recorded above.

### Availability revision

- `npm run build` passed from an isolated copy of the tracked source with the already installed dependencies, covering TypeScript, lint, production bundling and packaging. The sample has no unit-test suites.
- Archive-integrity checks confirmed solution version `1.0.0.12`, exactly one embedded Teams agent ZIP at `1.0.8`, unchanged solution/app/component IDs and the existing single-component tool set.
- Temporary React DOM checks covered Today / Next working day selection, Friday/weekend-to-Monday behavior, the 17:30 default boundary, year rollover, daylight-saving transitions, period navigation without refetching, Refresh preserving day/period, stale responses, error/mock states and the selected date in the booking confirmation. Cancelling the confirmation performed no write.
- Simulated Graph checks verified the selected local 09:00–18:00 window becomes the expected UTC request before and after daylight-saving changes, with 18 half-hour slots.
- The updated sample metadata passed the repository JSON schema, referenced thumbnail-path checks and the existing README view-tracker validation.

These checks used simulated calendar responses and existing dependencies. No live Graph request, invitation, fresh dependency installation or full gallery CI run was performed. The browser connection was unavailable during this local run. The later author-reported Copilot validation is recorded above.

## Local verification on November 7, 2026

- `npm run build` passed from an isolated copy of the tracked SPFx source using the already installed dependencies. This covered TypeScript compilation, lint, bundling and production packaging. Jest reported no test suites; no unit-test coverage is claimed.
- The generated `.sppkg` passed archive-integrity checks and contained exactly one agent ZIP at version `1.0.4`, with solution version `1.0.0.5` and unchanged IDs. The packaged instructions matched the source and no longer described the removed Schedule preview.
- Local rendering of the compiled React actions and cards confirmed that the Schedule button was absent in mock and live modes, while Teams contact, **Introduce me** and **Check availability** remained available. This was a server-rendering check, not a deployed Copilot UI test.
- The gallery metadata passed the repository JSON schema, thumbnail-path checks and README view-tracker validation. Documentation links and heading anchors were checked locally.

This run did not perform a fresh dependency installation, the complete gallery CI workflow, or tenant operations. The provisioning script's live execution and real meeting delivery still need target-tenant checks. The separate author-reported Copilot checks are recorded below.

## Local build and Workbench

- Run `npm run build` from `src/copilot-expert-finder` with the development server stopped. Confirm the `.sppkg` exists and contains exactly one current agent ZIP.
- In Copilot Workbench, supply `{"skill":"SPFx"}`. Check the result count, first three inline experts and fullscreen expansion.
- Check light/dark themes, narrow widths, keyboard activation, loading indicators, empty results and readable error states.
- Apply and clear name-prefix, department and job-title filters. Verify they cause no new SharePoint queries or model calls.
- Try lowercase/whitespace skill variants, an empty string, an unsupported skill and a non-string value. Invalid input should not retrieve expert items; the initialization source check still occurs independently.

Workbench supplies arguments directly. A successful build or Workbench rendering does not establish natural-language discovery or a generated conversation draft.

## Data-source selection

- When using [PnP provisioning](sharepoint-setup.md#create-the-list-with-pnp-powershell), check `-WhatIf` first. After intentionally provisioning the target tenant, verify the field schema and rerun the script to confirm that compatible fields and existing records are preserved. These tenant operations are separate from local script validation.
- In an environment where the root `Experts` list is absent, confirm HTTP 404 selects visibly fictional data: SPFx 6, Copilot 8, DB 1, Spanish 0.
- With the configured list present, confirm the SharePoint label and the rows accessible to the test user. An existing list with no matching records should show the empty state.
- With denied access or another HTTP/network error, confirm an explicit error rather than a mock fallback.
- Reload after creating the list. Confirm photos and contact identities come from the Person field, and that fictional profiles make no Graph requests.

## Live photos and availability

- Confirm the [delegated permissions](graph-permissions.md) for the SPFx principal, rather than relying on Graph Explorer consent.
- Check a profile with a photo and one without an available photo. Cards should render independently; initials are the fallback.
- Select **Check availability** for an expert with a valid SMTP address and accessible Exchange mailbox. Compare both **Today** and **Next working day** with Outlook for the displayed 09:00–18:00 local-time range.
- Check that Friday, Saturday and Sunday point to Monday, and that month/year boundaries and daylight-saving changes keep 09:00–18:00 in the viewer's local time. Holidays are not excluded.
- Open the panel on a weekday before 17:30: it should default to Today, with Afternoon selected from 14:00. On weekends or from 17:30, it should default to Next working day and Morning.
- Changing days should make one new availability request and reset to that day's initial period. Move between **Morning** and **Afternoon** without another Graph request; **Refresh** should reread the selected day and preserve the period.
- Switch days or experts while a request is pending, filter out the selected expert and leave fullscreen. Stale responses must not replace the active day or panel.
- Check an unavailable mailbox or denied calendar access. The UI must not invent Free slots. Mock profiles should explain that no live calendar is available.

## Confirmed Teams meetings

This section creates a real event and sends an invitation only when **Create Teams meeting** is confirmed. Use intended test participants. After today's last future slot, use **Next working day** to select a future date.

- Select a future Free slot on each available day for another expert and inspect the organizer, attendee, selected date, local time, duration and optional notes. **Cancel** should create no event.
- Confirm a meeting once. Verify the invitation in Outlook and the Teams or Outlook link supplied by the result.
- Confirm the slot immediately becomes Busy and stays Busy after **Refresh**, expert changes and fullscreen changes for the same component instance, even if Graph has not updated yet.
- Check that self-booking, past/current slots and repeated clicks cannot start another booking. A conflicting calendar or unsupported Teams provider should stop creation.
- If a response is uncertain, inspect Outlook before retrying or reloading. A local Busy record is session state, not attendee acceptance or a reservation against later calendar changes.
- Manage any test event's cancellation in Outlook; the component has no cancel-event operation.

## Meeting agenda

- Deploy the updated solution and synchronize the baseline with **Add to Teams**. Confirm the new app version and both tool registrations before using a fresh conversation.
- Create a new controlled meeting with a live non-self expert and an optional objective. Only confirmed creation should expose **Prepare agenda with Copilot**; Cancel, mocks and uncertain creation must not request an agenda.
- Inspect the actual agenda-tool arguments: exact event ID and booking UUID from that booking, plus generated text. Expect an objective, timed blocks totaling 30 minutes and exactly three relevant questions in the conversation language. Test specific and empty objectives.
- Verify the independent review card loads authoritative meeting details and survives closing the original directory. Rendering/reading/editing must not update the invitation.
- Edit and explicitly save. In Outlook, verify the same event, one agenda section, original notes and a working Teams connection. Saving may notify attendees; no replacement invitation should be created.
- Save identical content again, then edit and save a replacement. The identical content should skip PATCH; the changed content should replace the section once. Rapid duplicate clicks must not issue duplicate writes.
- Check that old/unmarked events, wrong booking IDs/organizers, changed meeting times, cancelled/recurring events and malformed inputs never enable an unsafe write. Agenda text containing HTML must remain literal; blank, oversized or reserved-marker content must be rejected.
- Exercise conflict reload and uncertain-save status checking with controlled failures. Retain the draft and inspect Outlook before deliberately enabling another save; no automatic PATCH retry is expected.
- Check light/dark themes, narrow widths, keyboard focus and inline resizing after load, editing and save-state changes. Then send an ordinary chat message and a new expert search; exercise **Introduce me** separately to verify its draft-only routing remains scoped.

## Copilot conversation

- Run the [example prompts](copilot-invocation.md#example-prompts) with the deployed agent. Check actual tool choice and canonical arguments, rather than Workbench injection.
- Select **Introduce me** for one expert. Verify a first-person draft for that person, exactly three relevant numbered questions, the conversation language and no message sent to Teams.
- For a fictional profile, confirm the draft is illustrative. For another card, wait until the first handoff finishes, then confirm the next draft uses the newly selected expert.
- Check that the draft requires no repeat search or unrelated tool, and that the conversation accepts a subsequent ordinary message.
- Check shared pending-state behavior across cards and understandable host-error handling. Filters, theme and display-mode changes should never trigger a draft on their own.

## Reported deployed checks

The author reported the following results from the original development tenant before the public-sample adaptation:

| Area | Reported evidence |
| --- | --- |
| Discovery and rendering | Copilot screenshots showed natural invocation, inline/fullscreen results, dark theme, SharePoint expert records, profile photos and a calendar timeline. |
| Agent synchronization | The author confirmed **Add to Teams** synchronization worked after the obsolete additional agent ZIP was removed. |
| **Introduce me** | The author confirmed a draft for the selected expert with exactly three questions, and a conversation that remained available afterward. |

These reports are distinct from validation performed on this sample checkout. They do not establish every theme, error case, mailbox policy, client or end-to-end meeting-invitation scenario. Record those results for your own tenant and installed package versions.
