# Publication screenshot audit

The publication set contains **15 reviewed images**: 12 light-theme local images refreshed October 2
for the responsive/default-layout/receipt updates,
and three authenticated Teams snapshots supplied October 1 by the
sample author. They complement the recaptured 39-state engineering gallery.

Local images are captured from the rendered experience element, not an arbitrary viewport rectangle.
The pinned Playwright runner asserts the actual viewport, expected state, settled images, PNG/content
bounds, and absence of runtime errors or horizontal overflow. Focused images retain their source
footer; workspace images retain the natural document flow and all configured modules. No image is
upscaled to satisfy an artificial minimum resolution.

Teams images are **viewport overviews**, not complete-workspace captures. Only a four-pixel outer
window border is cropped; app chrome, titles, navigation, controls, and the visible content are
preserved. Every retained pixel was compared with its original snapshot and matched exactly.

| Order | File | Pixels | State proved |
| ---: | --- | --- | --- |
| 100 | [preview.png](./preview.png) | 1600x778 | Searchable 35-capability explorer and safe prompt preview |
| 101 | [screenshot-company-workspace.png](./screenshot-company-workspace.png) | 1600x5479 | Complete Combined workspace, Company tab, balanced default columns |
| 102 | [screenshot-personal.png](./screenshot-personal.png) | 1600x3722 | Complete Combined workspace, Personal tab, balanced default columns |
| 103 | [screenshot-company-news.png](./screenshot-company-news.png) | 1600x1289 | Complete Editorial Company News composition |
| 104 | [screenshot-recognition-compose.png](./screenshot-recognition-compose.png) | 720x681 | Praise recipient, message, value, and audience composer |
| 105 | [screenshot-sales-performance.png](./screenshot-sales-performance.png) | 720x719 | EMEA metrics and actual/target bookings trend |
| 106 | [screenshot-office-map.png](./screenshot-office-map.png) | 720x716 | Global office map, equivalent list, and selected detail |
| 107 | [screenshot-vacation-approvals.png](./screenshot-vacation-approvals.png) | 720x660 | Four-request reset baseline before a decision |
| 108 | [screenshot-vacation-detail.png](./screenshot-vacation-detail.png) | 720x632 | Dates, balance impact, coverage, and employee note |
| 109 | [screenshot-vacation-decision.png](./screenshot-vacation-decision.png) | 720x490 | Explicit decision review before confirmation |
| 110 | [screenshot-vacation-receipt.png](./screenshot-vacation-receipt.png) | 720x590 | Polished shared session-only approval receipt |
| 111 | [screenshot-vacation-updated-list.png](./screenshot-vacation-updated-list.png) | 720x586 | Three pending and three processed after approval |
| 112 | [screenshot-teams-combined.png](./screenshot-teams-combined.png) | 1492x760 | Authenticated Combined personal app, Company selected, switcher retained, no duplicate header |
| 113 | [screenshot-teams-company.png](./screenshot-teams-company.png) | 1487x760 | Authenticated Company personal app, no switcher or duplicate header |
| 114 | [screenshot-teams-personal.png](./screenshot-teams-personal.png) | 1490x760 | Authenticated Personal personal app, no switcher or duplicate header |

## Review result

- No image contains a stale layout or placeholder scaffold.
- Local primary controls, labels, and source footers fit inside every frame.
- Workspace columns are not horizontally clipped.
- Complete Company and Personal workspace captures include every configured module.
- C35 workflow states are independently readable and ordered.
- Teams screenshots retain authentic host chrome and are not presented as local previews.
- Fixture labels are retained wherever the rendered experience includes them.

## Reproduction and validation

Install dependencies, build the UX review bundle, and run `npm run start:ux-review` in one terminal.
With Microsoft Edge installed, use another terminal:

```powershell
npm run capture:publication
npm run capture:gallery
# For a nondefault server port, set ZAVA_UX_REVIEW_URL before capturing.
.\scripts\crop-teams-screenshots.ps1 -Combined <combined.png> -Company <company.png> -Personal <personal.png>
npm run update:release-evidence
npm run check:publication
npm run check:visual-evidence
```

The release-evidence update requires a current passing Jest JUnit report and matching built SPPKG.
Capture geometry, original Teams snapshot hashes/crop rectangles, and image hashes are recorded in
[`publication-capture-matrix.json`](../ux-review/evidence/publication-capture-matrix.json),
[`teams-capture-matrix.json`](../ux-review/evidence/teams-capture-matrix.json), and
[`gallery-capture-matrix.json`](../ux-review/evidence/gallery-capture-matrix.json).

Dark/mobile/forced-color and full host accessibility acceptance are separate gates; they are not
implied by these light-theme publication images or the author's working Teams baseline.