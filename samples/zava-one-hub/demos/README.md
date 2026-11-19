# Zava One demos

These scripts demonstrate the fixture-first sample without implying live business writes or production
readiness. Use the same validated package, prompts, and reset procedure for every rehearsal.
Start with an employee outcome; use capability discovery only as an optional closing beat.

**Presenter path:** [operations](./demo-operations.md) ->
[five-minute keynote](./keynote-5-minutes.md) ->
[exact intent/component matrix](../docs/intent-component-mapping.md) ->
[release gates](../todo.md#remaining-release-gates).

## Primary presenter set

| Script | Duration | Purpose |
| --- | --- | --- |
| [Five-minute keynote](./keynote-5-minutes.md) | 5 minutes | Executive product story across answers, decisions, charts, maps, and workspaces |
| [Ten-minute technical demo](./technical-demo-10-minutes.md) | 10 minutes; 5-minute cut included | Catalog trace, real adapter boundaries, state, dynamic MCP, packaging, and evidence |
| [Twenty-minute feature showcase](./feature-showcase-20-minutes.md) | 15-20 minutes | Guided employee day covering forms, services, business insight, and personalization |

## Alternate cuts and operations

| Script | Duration | Purpose |
| --- | --- | --- |
| [90-second keynote](./keynote-90-seconds.md) | 60-90 seconds | Company update, manager decision, map, and breadth |
| [Business journey](./business-journey.md) | 8-12 minutes | Company, Personal, forms, charts, and cross-surface state |
| [Technical walkthrough](./technical-walkthrough.md) | 10-15 minutes | Architecture, host isolation, routing, state, and evidence |
| [Demo operations](./demo-operations.md) | Reference | Preflight, reset, offline fallback, and recovery |

## Required preflight

1. Follow [Demo operations](./demo-operations.md).
2. Confirm `npm run build` passes before starting a watch server.
3. Reset the C35 vacation queue and any session personalization.
4. Keep source and simulation notes visible where provided (C35: **Demo data / No HR submission**).
5. Use the exact prompts, but verify actual model routing in authenticated Copilot; the local harness
   does not run the model and its Expand callback does not change display mode.
6. Choose one primary script and rehearse its optional cuts; do not combine every branch live.

## What this presenter set does not claim

- Prompt-selected filters/prefills work only where the active body consumes them; see the
  [parameter audit](../docs/intent-component-mapping.md#current-consumption-limits).
- Expansion shows the owning workspace tab, not a preserved inline draft or exact record route.
- C35 storage is local to its runtime/browsing context, not shared across independent tenant hosts.
- Recorded test totals, screenshots, and host baselines are not a fresh GA keynote sign-off.

The current publication screenshots and their state coverage are recorded in
[`assets/publication-screenshots.md`](../assets/publication-screenshots.md).