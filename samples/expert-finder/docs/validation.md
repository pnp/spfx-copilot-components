# Manual validation

Use this checklist after following [deployment](deployment.md). These are checks to perform in the target environment, not a claim that every scenario has already passed. Keep local build results separate from deployed Copilot observations.

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
- Select **Check availability** for an expert with a valid SMTP address and accessible Exchange mailbox. Compare today's 09:00–18:00 local-time range with Outlook.
- Move between **Morning** and **Afternoon** without a new Graph request; **Refresh** should perform a new read.
- Switch experts while a request is pending, filter out the selected expert and leave fullscreen. Stale responses must not replace the active panel.
- Check an unavailable mailbox or denied calendar access. The UI must not invent Free slots. Mock profiles should explain that no live calendar is available.

## Confirmed Teams meetings

This section creates a real event and sends an invitation only when **Create Teams meeting** is confirmed. Use intended test participants. Availability is limited to today, so there are no future slots after 18:00 local time.

- Select a future Free slot for another expert and inspect the organizer, attendee, date, local time, duration and optional notes. **Cancel** should create no event.
- Confirm a meeting once. Verify the invitation in Outlook and the Teams or Outlook link supplied by the result.
- Confirm the slot immediately becomes Busy and stays Busy after **Refresh**, expert changes and fullscreen changes for the same component instance, even if Graph has not updated yet.
- Check that self-booking, past/current slots and repeated clicks cannot start another booking. A conflicting calendar or unsupported Teams provider should stop creation.
- If a response is uncertain, inspect Outlook before retrying or reloading. A local Busy record is session state, not attendee acceptance or a reservation against later calendar changes.
- Manage any test event's cancellation in Outlook; the component has no cancel-event operation.

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
