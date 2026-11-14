# Demo operations and recovery

## Preflight

Do not run a clean build while the SPFx watcher is active.
Generated-text checks tolerate Git's LF/CRLF conversion without ignoring actual content changes.

```bash
npm ci
npm run build
```

After the build passes, start the two local surfaces in separate terminals:

```bash
npm start
npm run start:ux-review
```

Confirm:

- `https://localhost:4321/temp/build/manifests.js` returns the debug manifests.
- `http://127.0.0.1:4322` opens the UX review harness.
- The browser trusts the local development certificate.
- The C35 queue shows four requests awaiting decision.

## Deterministic reset

1. Open `?intent=vacationApprovals&surface=webPart&theme=light` in the UX review harness.
2. Select **Reset demo data**.
3. Verify four requests are awaiting decision and two are processed this session.
4. Close and reopen all Zava tabs when a fresh session-only personalization state is required.
5. Reload the intended Company or Personal workspace only after reset is complete.

Do not clear or edit fixture records manually during a presentation.

## Offline fallback

Use these routes when a tenant or Copilot surface is unavailable:

| Experience | URL query |
| --- | --- |
| Combined Company workspace | `?intent=workspace&surface=workspace&mode=combined&theme=light` |
| Personal workspace | `?intent=workspace&surface=workspace&mode=personal&theme=light` |
| Company News | `?intent=companyNews&surface=webPart&primaryView=editorial&scope=All&theme=light` |
| Praise | `?intent=recognition&surface=webPart&theme=light` |
| Sales | `?intent=salesPerformance&surface=webPart&scope=EMEA&theme=light` |
| Offices | `?intent=officeDetails&surface=webPart&theme=light` |
| Vacation approvals | `?intent=vacationApprovals&surface=webPart&theme=light` |
| Capability explorer | `?intent=capabilities&surface=webPart&theme=light` |

Prefix each query with `http://127.0.0.1:4322/`.

## Failure recovery

| Failure | Recovery |
| --- | --- |
| Local manifest URL fails | Stop stale watchers, run `npm start`, trust the certificate, and retry the exact manifest URL. |
| Copilot Component does not appear | Reload Workbench with `debug=true`, `noredir=true`, and the localhost manifest URL. |
| Routing selects the wrong component | Use the exact canonical prompt, then inspect the positive and negative boundary in `config/zava-capabilities.mjs`. |
| State is no longer deterministic | Use **Reset demo data** and reopen the intended route. |
| Workspace personalization is unexpected | Close all Zava tabs to end the browser session, then reopen the workspace. |
| Tenant authentication or host chrome fails | State the limitation once and switch to the matching local fallback route. |
| A simulated action is interrupted | Return to the list and inspect current session state; do not claim success without the receipt. |
| Build output differs from evidence | Stop watchers, build the package, run `npm run update:release-evidence`, then `npm run validate` before sharing. |

## Screenshot and package evidence

Use `npm run check:responsive` against the running review server to validate device widths, narrow
desktop columns, configured views, poll results, submission flows, and workspace controls. Add
`-- --quick` for the 320px smoke run or `-- --screenshots --record` for captures and a tracked passing
summary. See the [responsive review](../docs/responsive-review.md) for full coverage.

Use `npm run capture:publication` and `npm run capture:gallery` against the running UX review server.
The capture runner requires installed Microsoft Edge and asserts the actual viewport, correct layout,
image loading, complete rendered bounds, and no horizontal clipping. Set `ZAVA_UX_REVIEW_URL` if using
a port other than 4322.

For Teams, supply authenticated Combined, Company, and Personal snapshots to
[`crop-teams-screenshots.ps1`](../scripts/crop-teams-screenshots.ps1). It removes only a four-pixel window
frame and verifies every retained pixel against its source; it does not invent host chrome or resize.
These are viewport overviews, not complete-workspace captures.

After rebuilding packages, run `npm run update:release-evidence` to read the actual artifact hashes,
embedded versions, passing Jest JUnit totals, and validated screenshot matrices. Then run
`npm run check:publication`, `npm run check:visual-evidence`, and `npm run check:release-evidence`.
See the [publication audit](../assets/publication-screenshots.md) for the full image inventory.

## End of demo

Reset C35, close sensitive drafts, and leave no statement that fixtures are live data or that simulated
receipts represent source-system writes.