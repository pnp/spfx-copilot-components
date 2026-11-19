# Demo operations and recovery

## Preflight

### Package and tenant preparation

1. Use Node.js **22.14+ in the 22.x line, 24.x, or 26.x**, matching
   [package engines](../package.json). Restore from an approved registry with the pinned GA packages.
   Never paste registry credentials into documentation or commands being projected.
2. Stop only the watcher/server processes you own before a clean release build. Do not terminate
   unrelated processes in a shared development environment.
3. If dependencies are not restored, run `npm ci`; then run:

   ```powershell
   npm run build
   ```

   This already runs `validate`. Preserve its real output; a passing documentation check is not a
   package build. Do not rebuild on stage.
4. Deploy the validated [SPPkg](../sharepoint/solution/zava-one-hub.sppkg) to the approved developer
   App Catalog and enable the agent in the target Copilot environment. Follow the
   [Teams guide](../teams/README.md) for the three separate personal-app ZIPs.
5. In authenticated Copilot, test all [six starter targets](../docs/intent-component-mapping.md#six-published-conversation-starters).
   Record actual tools/arguments, host/build, latency, expansion/collapse, and news follow-up.
   Do not sign off model routing from Workbench or local screenshots.
6. Verify C35 reset and the exact Johanna decision checkpoints below. Keep screenshots pre-opened.

### Local rehearsal

For tenant-free UI review, build and serve only the harness:

```powershell
npm run build:ux-review
npm run start:ux-review
```

Open `http://127.0.0.1:4322/`. If debugging SPFx in a tenant, use a separate terminal for `npm start`,
trust the local certificate, and verify
`https://localhost:4321/temp/build/manifests.js` responds. The local harness does not need SPFx watch.

The harness records context and follow-up messages but does not execute a model. Its **Expand**
callback is a no-op; open an explicit workspace URL to inspect full-screen composition.
It maps query-string filters to publisher props, **not** to tool arguments. A working harness filter
does not prove prompt extraction or consumption.

## Deterministic reset

### C35

In the **same browsing context** that will present the queue:

1. Open `?intent=vacationApprovals&surface=copilotInline&theme=light`.
2. Use **Back to updated list** or **Back to requests** if needed, then **Reset demo data**.
3. Verify **4 Awaiting decision / 2 Processed this session**.
   The processed counter includes one seeded approval and one seeded decline.
4. Clear **Find employee** and set **Status** to **Pending**.
5. Open Johanna: `vac-1043`, 3 workdays, balance 11 -> 8, coverage **attention**.
6. After explicit approval, expect `ZAVA-LEAVE-1043`, **No HR submission**, and queue 3/3.
7. Reset again before handing over the demo.

Dates are computed when modules load; use displayed dates rather than fixed October dates.
Reset restores the module's seed, not a new midnight date baseline.

### Other forms and layout

- Reload/remount a focused form to discard its local draft or simulated result. The C35 reset button
  does not reset recognition, IT, expenses, room booking, or personalization.
- C35 and layout persistence use session storage in the current origin/browsing context.
  Separate tabs or host iframes are not a synchronized backend. Reset each context used on stage.
- For a reliably clean personalization rehearsal, use a fresh isolated browser session without
  restored tabs, or remove **only these sample-owned keys** in that context's developer console and
  reload. Do not clear the tenant's complete site storage or sign-in data:

  ```javascript
  [
    'zava-one:vacation-requests:v1',
    'zava-one:company-portal-layout:v1',
    'zava-one:company-portal-visibility:v1',
    'zava-one:personal-portal-layout:v1',
    'zava-one:personal-portal-visibility:v1'
  ].forEach((key) => sessionStorage.removeItem(key));
  location.reload();
  ```

- Closing/reopening tabs may restore session storage; do not promise that it always resets the demo.
  If storage is unavailable, state is in-memory and may be lost on reload.

## Offline fallback

Prefix each query with `http://127.0.0.1:4322/`. Navigate the **same tab** for the C35 story.

| Experience | URL query |
| --- | --- |
| Combined Company workspace | `?intent=workspace&surface=workspace&mode=combined&theme=light` |
| Combined Personal workspace | `?intent=workspace&surface=workspace&mode=combined&primaryView=personal&theme=light` |
| Company-only workspace | `?intent=workspace&surface=workspace&mode=company&theme=light` |
| Personal-only workspace | `?intent=workspace&surface=workspace&mode=personal&theme=light` |
| Company News | `?intent=companyNews&surface=copilotInline&theme=light` |
| Knowledge | `?intent=knowledge&surface=copilotInline&theme=light` |
| My Day | `?intent=myDay&surface=copilotInline&theme=light` |
| Praise overview | `?intent=recognition&surface=copilotInline&theme=light` |
| Praise composer | `?intent=recognition&surface=webPart&primaryView=compose&theme=light` |
| Sales | `?intent=salesPerformance&surface=copilotInline&filter=EMEA&theme=light` |
| Offices | `?intent=officeDetails&surface=copilotInline&theme=light` |
| Vacation approvals | `?intent=vacationApprovals&surface=copilotInline&theme=light` |
| Workplace booking | `?intent=workplaceSpace&surface=copilotInline&theme=light` |
| IT help | `?intent=itHelp&surface=copilotInline&theme=light` |
| Security reporting | `?intent=securityReporting&surface=copilotInline&theme=light` |
| Equity | `?intent=equity&surface=copilotInline&theme=light` |
| Capability explorer | `?intent=capabilities&surface=copilotInline&theme=light` |

Use the [complete matrix](../docs/intent-component-mapping.md#complete-business-intent-matrix) for
the other intent keys. `displayMode=fullscreen` shows the composed workspace, not a larger inline
detail. Use `theme=dark` for dark review. News layout demos need `surface=webPart`.

If local services are unavailable, use this screenshot sequence:
[Company](../assets/screenshot-company-workspace.png) ->
[News](../assets/screenshot-company-news.png) ->
[vacation detail](../assets/screenshot-vacation-detail.png) ->
[decision](../assets/screenshot-vacation-decision.png) ->
[receipt](../assets/screenshot-vacation-receipt.png) ->
[updated queue](../assets/screenshot-vacation-updated-list.png) ->
[Sales](../assets/screenshot-sales-performance.png) ->
[Offices](../assets/screenshot-office-map.png) ->
[Personal](../assets/screenshot-personal.png).
Say explicitly that these are recorded states, not a live action.

## Failure recovery

| Failure | Recovery |
| --- | --- |
| Wrong tool selected | Record the actual result. Retry the exact mapped prompt once in a fresh conversation, then use a prepared card/local route. Do not call source-boundary validation model proof. |
| Prompt values not applied | Use visible controls. Check the [consumption limits](../docs/intent-component-mapping.md#current-consumption-limits); do not infer prefilling from seeded defaults. |
| Queue or employee differs | Reset that context, clear the queue filters, verify 4/2 and `vac-1043`. |
| Expansion loses draft/selection | Expected current limitation: complete the workflow inline. Use full screen for composed context, not exact draft transfer. |
| Expansion denied or local Expand does nothing | Use the pre-opened workspace and describe the manual switch. Do not fake host approval. |
| News follow-up rejected | Show the visible error, retry once if appropriate, or describe the selected story locally. "Sent" is transport status, not proof of a model answer. |
| Source/launch button does nothing | Several fixture buttons are presentation-only. Do not use them to prove Outlook, SharePoint, Teams chat, LMS, or service integration. |
| Manifest URL fails | Restart only your own SPFx watcher, check certificate trust and exact debug-manifest URL. |
| Tenant authentication/chrome fails | State the limitation once; switch to local shared UI or screenshots. |
| Action interrupted | Inspect the actual queue/receipt before retrying. Never infer success or repeat a confirmed decision. |
| Evidence/package check fails | Keep the failure visible; stop sharing that package. Rebuild under the documented gates, not just an evidence timestamp refresh. |

## Evidence and handoff

For documentation changes:

```powershell
npm run check:routing-collisions
npm run check:publication
git diff --check
```

For a release, run the clean build after stopping watchers. Then, against the running UX server,
run `npm run check:responsive` for a new browser sweep. `-- --quick` is only a smoke test;
`-- --screenshots --record` captures a tracked full summary. See
[responsive review](../docs/responsive-review.md).

Use `npm run capture:publication` and `npm run capture:gallery` for fresh local captures. These need
Microsoft Edge; set `ZAVA_UX_REVIEW_URL` for a nondefault server port. Authentic Teams snapshots use
[the crop script](../scripts/crop-teams-screenshots.ps1); local screenshots must never invent Teams
chrome. Teams crops remove only the four-pixel frame and verify retained pixels.

`npm run build` updates package evidence from actual artifacts and passing test reports. After new
browser captures, run `npm run update:release-evidence`, then `npm run check:publication`,
`npm run check:release-evidence`, and `npm run check:visual-evidence`. Preserve the distinction
between new captures, older host measurements, and the matrix's legacy profile field.
See [release readiness](../docs/release-readiness.md) for the evidence boundary.

## End of demo

Reset C35, discard drafts, stop only task-owned rehearsal servers, and record deviations in
[todo.md](../todo.md). Leave no claim of live provider writes, cross-host synchronization, or
production/accessibility certification.
