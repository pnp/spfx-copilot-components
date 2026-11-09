# Design asset catalog

## Historical Family 01 design references

These files are generated from `design-sources/zava-home-dashboard.html` and retained under
`design-sources/home-reference/` as historical design references for Family 01:

The same HTML source is now an offline interactive review prototype for the shared full-screen shell.
Its desktop rail and mobile selector transition between Home and nine intentionally empty,
family-colored title views. Use `?family=policy`, for example, to open a placeholder directly. The
prototype does not add or simulate family business components.

| Asset | Dimensions | Purpose |
| --- | --- | --- |
| `zava-01-home-inline.png` | 1400 x 700 | Employee-led summary plus four prompt-driven Home states |
| `zava-full-home-dashboard-wide.png` | 1600 x 1000 | Wide desktop Home dashboard |
| `zava-full-home-action-plan.png` | 1600 x 1000 | Wide desktop with My HR action plan open |
| `zava-full-home-dashboard-narrow.png` | 1024 x 1123 | Narrow desktop/tablet shell behavior |
| `zava-full-home-dashboard-mobile.png` | 390 x 1793 | Mobile shell and stacked Home content |

## Publication screenshots

The 33 PNG files directly under `assets/` are captured from the real React implementation through
`npm run start:ux-review`. They cover all 20 operational inline Copilot Components, the feature explorer,
all ten full-screen families, mobile Home, and dark People. [sample.json](sample.json) lists every publication image, and
`npm run check:gallery` validates metadata, file integrity, dimensions, alt text, unique order, URL,
and exact publication-root coverage.

The November 9, 2026 time-off refresh updates `inline-request-time-off.png` and `fullscreen-time.png`
from the shared React form: Leave type on its own row, Start date and End date together beneath it,
then Reason. Reproduce the captures with `?intent=requestTimeOff&mode=inline&width=standard&clean=1`
and `?family=time&mode=fullscreen&width=wide&clean=1`, respectively. Narrow screens retain stacked fields.

The refreshed source uses the same visual hierarchy proven by the My Day sample: a white Copilot
canvas, employee-first greeting, one signature gradient action band, varied editorial columns, and
local demo-persona photography. Source portraits live under `faces/`; original Zava graphics live
under `images/`. `npm run generate:mock-media` embeds every source file into
`src/copilotComponents/shared/mockData/embeddedImages.ts` as a base64 data URI, and
`npm run check:mock-media` fails when that generated registry is stale.

## Third-party photo sources

| Local asset | Source | Creator | License | Use |
| --- | --- | --- | --- | --- |
| `images/zava-five-year-celebration.jpg` | [Happy coworkers celebrating in a modern office](https://www.pexels.com/photo/people-standing-at-the-table-8555211/) | [Edmond Dantès](https://www.pexels.com/@edmond-dantes/) | [Pexels License](https://www.pexels.com/license/) | Five years at Zava inline and full-screen milestone |

Pexels permits free app and web use, modification, and use without attribution. The source and
creator are retained here for provenance. The optimized local JPEG is embedded at build time; the
runtime does not request Pexels or any other image host.

## Legacy People Compass source boards

The `pc-*` PNG files are retained under `design-sources/legacy-people-compass/` as source material
only. They are intentionally outside the publication asset root. Their filenames do not reliably
identify their visible content, and the boards contain People Compass branding. Do not implement
from a legacy filename without checking the visible heading inside the image.

| Existing filename | Visible content or issue |
| --- | --- |
| `pc-02-policy-qa-inline.png` | Family 01 My HR Dashboard inline board |
| `pc-03-pto-leave-inline.png` | Family 02 Policy Q&A inline board |
| `pc-04-payroll-inline.png` | Family 03 PTO & Leave inline board |
| `pc-05-benefits-inline.png` | Family 04 Payroll Explainer inline board |
| `pc-06-hr-case-inline.png` | Family 05 Benefits & Life Events inline board |
| `pc-07-learning-inline.png` | Family 06 HR Case Desk inline board |
| `pc-08-total-rewards-inline.png` | Family 07 Learning & Compliance inline board |
| `pc-09-manager-hub-inline.png` | Family 08 Total Rewards inline board |
| `pc-10-people-graph-inline.png` | Family 09 Manager Team Hub inline board |
| `pc-full-home-dashboard.png` | Benefits & Life Events, not Home |
| `pc-full-benefits-life-events.png` | Composite board; not a Benefits full-screen reference |
| `pc-full-money-rewards.png` | Payroll Explainer |
| `pc-full-policy-answers.png` | Org & People Graph |
| `pc-full-total-rewards.png` | Time & Leave, not Total Rewards |

The remaining `pc-full-*` boards may inform composition, but the canonical behavior and naming live
in `../Zava-Employee-Agent-UX-Design.md`.
