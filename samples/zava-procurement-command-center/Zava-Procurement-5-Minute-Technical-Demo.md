# ZavaCore Procurement Command Center - 5-minute technical demo

Use the validated terminal transcript and committed package on stage. Show exact commands and
their completed evidence; do not spend the five-minute walkthrough waiting for a full rebuild.

## 0:00-1:00 - Catalog-owned routing

Open [catalog](src/shared/catalog.ts), [full-screen destinations](src/shared/fullscreen.ts) and the
[routing matrix](Zava-Procurement-Routing-Matrix.md). Show 22 immutable tool identities,
operation class, role, route, prompt, and exclusion. Explain that every scaffold came from the pinned
SharePoint Yeoman generator and all entries share one measured SPFx bundle.
Show [the canonical 12 starters](config/conversation-starters.json): distinct registered targets,
business-first wording and capability exploration last. Every tool advertises a positive trigger
and nearest-sibling exclusion. Local metadata tests are not proof of a model's actual routing.

## 1:00-2:00 - Host and theme boundary

Open [the host boundary](src/shared/ProcurementCopilotComponentBase.tsx) and
[theme boundary](src/shared/ProcurementThemeProvider.tsx). Show the persistent React 18 root and
owner-document Griffel renderer. Resize/mutation observers coalesce after-layout root measurements,
report grow/shrink through the SDK, inspect boolean acknowledgement and clean up on teardown/disposal.
Never measure the iframe or impose a clipped fixed-height card.

Open [bounded model context](src/shared/modelContext.ts) and
[continuation](src/shared/CopilotContinuation.tsx). The full content + structured envelope is measured
in UTF-8 bytes (10,000 maximum), with reported omissions and protected scope/handoff fields.
Click-time context and the follow-up are one serialized bridge operation; publication failure blocks
the message, rejection is retryable, and closing the component cancels queued/in-flight questions.

## 2:00-3:10 - Deterministic domain and D3

Open [domain](src/shared/domain.ts), [geometry](src/shared/geometry.ts) and
[charts](src/shared/ProcurementCharts.tsx). Show the 220/14/600/90/18 graph scale,
frozen hero records, weighted scoring, split-award calculation, D3 scales/shapes, keyboard-selectable
marks, chart descriptions, and exact table equivalents.
Continue into [portfolio](src/shared/portfolio.ts) and [world map](src/shared/InvestmentCharts.tsx):
eight typed EUR-reporting programs, linked
value-evidence IDs, scoped totals, cumulative commitment paths and bundled Natural Earth geography
projected with D3 Equal Earth. No runtime tile service or geocoder is used.
Then open [value flow](src/shared/valueFlow.ts) and
[decision visuals](src/shared/ProcurementDecisionVisuals.tsx). Focused D3 scales and horizontal-link
geometry conserve EUR across all three Sankey columns. Disputed value is a subset, not another
flow. Dependency assumptions, allocation scenarios and ranked leakage stay distinct from source facts.
No chart-library upgrade or new runtime dependency was needed.

## 3:10-4:10 - Visual evidence

Show completed `npm run capture:visual` and `npm run check:gallery` output. Explain that 84 captures cover every inline
tool at standard/narrow/dark, all four workspaces at desktop/mobile/dark, and review/receipt states.
Behavior tests prove actual field effects and confirmation boundaries, not just unique layout labels.
Show `npm run check:keynote` output for 24 additional saved checkpoints: 340/760/1920 px workspaces, Chromium
200% page-scale emulation, exact submission-to-approval continuity, reload restoration, the 70%
authority boundary, award-to-commitment arithmetic, regional redraws, keyboard map selection and Reset.
`npm run check:brand` validates optimized media, icons and geography against their provenance hashes.
Show `npm run check:ignite` output: 45 additional captures prove all 22 actual inline-to-full-screen expansions,
preserved edits/selection, named routes without origin UI, keyboard Sankey detail, click-time
handoffs, text-only summaries, custom questions, rejected/throwing bridge recovery and measured root
shrink/grow and honest invalid/no-evidence states without fabricated zero/default arithmetic.
Source signatures bind all visual evidence to the current runtime. Heights are measured,
not hidden by fixed wrappers; native host sizing/zoom remains an authenticated check.

## 4:10-5:00 - Shipped artifact

Show completed `npm run build` output, generated API plugin validation and `.sppkg` audit: 22 unique source tools
discovered dynamically through RC0 MCP (no embedded static functions), one
shared JavaScript asset, one current agent ZIP, package hash, and current capture count. Close with the
mock/live service boundary and authenticated tenant checks that remain external.
The generated agent ZIP is `teams/zavacore-procurement-command-center.zip`; the deployable `.sppkg`
keeps its existing solution identity. The package audit verifies all seven shared brand/portrait assets
are hashed, emitted once and byte-identical to provenance, plus the two branded agent icons.
Open [release evidence](assets/release-evidence.json) for current test totals, all three capture sets,
22 full-screen destinations, 12 starters, context-byte measurements and audited package hashes.
Do not present development output or old RC0 counts as current production certification.