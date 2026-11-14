# Responsive layouts and submission confirmations

## October 2, 2026 validation

The local Microsoft Edge/Playwright run passed **4,080 rendered states with zero failures**.
The [responsive matrix](../ux-review/evidence/responsive-matrix.json) records coverage, assertions,
and measured desktop column heights. The production build passes 42 Jest tests.

| Coverage | Tested |
| --- | --- |
| Components | All 35 capabilities in Copilot inline and SharePoint web-part rendering |
| Primary views | Every configured primary-view option from the authoring catalog |
| Light viewport widths | 320, 390, 560, 768, 1024, 1280, 1440, 1600 CSS pixels |
| Narrow desktop columns | 320, 390, 560, 768px content inside a 1440px viewport |
| Dark viewport widths | 320, 768, 1440 CSS pixels |
| Phone input | Mobile/touch browser contexts at widths up to 560px |
| Workspaces | Combined Company/Personal, fixed Company/Personal, with and without the Teams header flag |
| Interactive states | Poll vote/results/change-vote; praise; general/vacation approvals; time off; expenses; room booking; IT/security intake; facilities submission; selected learning, mail, files, and people |
| Workspace controls | Edit layout, personalization panel, and panel dismissal |

Checks measure document and nested component bounds, internal overflow, broken images, and runtime
errors. Poll checks also require all four answers, chart/legend stacking in narrow components, and
retained selection when changing a vote. Deliberately scrollable news filmstrips, decorative spinner
tails, and visually hidden drag live regions are not treated as accidental clipping.

Phone poll results and confirmation cards were visually inspected, along with desktop/tablet poll
results, desktop time-off receipts, dark security receipts, and the updated publication workspace
images. This is not a claim that every automated state received individual human visual review.

## Layout fixes

Experience roots establish a named inline-size container. Layout breakpoints therefore follow the
actual card width, not just the browser viewport. This matters for Teams, SharePoint columns, and
three-column workspace cards on a wide desktop.

- Poll options and results reflow without losing answer labels, response counts, or percentages.
- Adaptive card/form grids cannot request minimum tracks wider than their container.
- Vacation requests, learning assignments, shifts, and files put secondary actions/details on another
  row when space is limited.
- Stock and office detail panels stack at narrow widths.
- Workspace padding follows content width; personalization panels stack below the dashboard when
  there is insufficient room for a sidebar.

## Consistent receipts

The shared [SubmissionReceipt](../src/shared/components/SubmissionReceipt.tsx) follows the Praise
pattern: a lightly tinted hero, success icon, clear heading, neutral content body, structured
metadata, and explicit next actions. It is used for Praise, security/IT reports, time off, expenses,
room bookings, approvals, vacation decisions, and generic fixture updates.

Recorded declines receive neutral styling rather than a celebratory success treatment. References,
pending statuses, reset/return actions, and session-only/no-external-submission language are retained.
The outcome is a live status announcement; action buttons sit outside that announcement.

## Balanced workspace defaults

The [default assignments](../src/shared/models/workspacePortalDefaults.ts) move Company employee
services and workplace help into the third column. Personal time off moves from the first to the
third column, and pay documents move from the second to the third.

| Default at 1440px | Before: column heights | After: column heights |
| --- | --- | --- |
| Company | 6367 / 4560 / 3821px | 5038 / 4560 / 5150px |
| Personal | 3622 / 3671 / 2622px | 3176 / 3332 / 3407px |

All four workspace variants, with both header states, satisfy a maximum 20% tallest-to-shortest
spread relative to the mean column height at 1280, 1440, and 1600px. Cards are not given arbitrary
fixed heights or dynamically reordered after rendering.

Existing saved session layouts remain unchanged. To see the new defaults, start a fresh browser
session; merely refreshing a session with a saved layout does not reset it. Small screens retain
the normal stacked reading flow and every card exactly once.

## Reproduce

Build and start the UX review harness in one terminal:

```powershell
npm run build:ux-review
npm run start:ux-review
```

In another terminal, with Microsoft Edge installed:

```powershell
npm run check:responsive
npm run check:responsive -- --quick
npm run check:responsive -- --screenshots --record
```

Set `ZAVA_UX_REVIEW_URL` for a nondefault preview port and `ZAVA_RESPONSIVE_OUTPUT` to choose where
diagnostics and screenshots are saved. The default output is ignored `temp/responsive`. The quick
run covers 320px viewport and desktop-column layouts; only a complete passing run may record the
tracked summary matrix.

These are shared-React local harness checks, not a new authenticated SharePoint/Teams/Copilot host
certification. Full screen-reader, forced-color, RTL, real-device/browser, and tenant-host acceptance
remain separate gates.
