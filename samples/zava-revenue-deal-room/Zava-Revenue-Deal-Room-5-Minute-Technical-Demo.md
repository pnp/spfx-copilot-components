# ZavaMesh Revenue Deal Room - 5-minute technical demo

## 0:00-0:40 - Immutable component catalog

Show `src/shared/catalog.ts`, `scripts/configure-intent-components.mjs`, and `scripts/validate-intent-components.mjs`.

Explain 21 final Yeoman-generated component identities, unique GUIDs, one bounded business scenario per tool, positive/negative routing boundaries, one shared bundle, and optional prompt properties that scope or prefill but never confirm an action.

## 0:40-1:20 - React 18 host and Copilot bridge

Show `src/shared/RevenueCopilotComponentBase.tsx` and `src/shared/RevenueThemeProvider.tsx`.

Explain one persistent React 18 root per entrypoint, teardown, Griffel targeting `ownerDocument`, host-authoritative `requestDisplayModeAsync('fullscreen')`, bounded model-context snapshots, and explicit user-triggered follow-ups.

Show the React DOM tests: passive rerenders, mode/theme continuation, fresh argument signatures,
unmount/reset, scope no-match, committed context and visible bridge failure. The theme provider no
longer remounts its children after the first effect.

## 1:20-2:20 - D3 visualization-first UX

Show `src/shared/visualizations/revenueGeometry.ts`, `RevenueCharts.tsx`, `RevenueApp.tsx`,
`FullscreenWorkspace.tsx` and `fullscreenWorkspaceModel.ts`.

Highlight:

- D3 scales, monotone line/area geometry, and selected scenario coordinates for the commercial contour
- D3 band/linear scales for the evidence-weighted pipeline
- D3 signed forecast-waterfall geometry
- D3 Natural Earth projection and TopoJSON paths for the offline regional opportunity map
- React-owned SVG marks, state, keyboard actions, accessible names, exact labels, and adjacent tables
- Separate landing and selected-work states across My Deals, Deal Room, Commercial Desk, and Revenue Command
- Catalog-based component-to-workspace mapping, exact scenario selection and mounted draft resume
- Full-width country maps and fictional value flows in their business-appropriate workspace
- Active-only model-context publishing: hidden work is retained but never presented as visible data

Show the current Jest suite and generated release evidence, including exact term/ramp costs,
discount authority boundaries, all 27 content bodies, complete review/confirm/receipt/reset lifecycles,
workspace navigation, scenario continuity and redraw-size notifications.

## 2:20-3:05 - Deterministic domain and people

Show `src/shared/domain.ts`, `src/shared/media.ts`, `assets/asset-provenance.json`, and `scripts/validate-persona-media.mjs`.

Report 80 accounts, 260 contacts, 120 opportunities, the connected `ZDR-2042` evidence graph, seven package-hosted persona portraits, source/runtime SHA-256 parity, initials fallback, and the explicit pending public media-rights review.

## 3:05-3:45 - Reproducible publication evidence

Show `scripts/visual-harness`, `scripts/capture-gallery-assets.mjs`, `assets/gallery-evidence.json`, `assets/sample.json`, and `Zava-Revenue-Deal-Room-Routing-Matrix.md`.

Report the current capture totals from release evidence, with zero runtime/console, broken-image or
overflow failures. The supplementary matrix covers all 27 inline tools at standard/narrow/dark,
four workspace landings, selected scenarios, ten reviews, ten receipts and property/gate states.
Show `assets/business-matrix-evidence.json`; all visual sets are bound to current runtime source hashes.

## 3:45-4:35 - Production package gates

Run `npm run build` and explain the ordered gates: catalog, routing matrix, persona provenance, curated
and matrix freshness, publication, clean production tests, packaging, dynamic MCP plugin and portable
source/compiled schema validation, package audit and release-evidence freshness. Also run
`npx tsc --project scripts/visual-harness/tsconfig.json`.

Show `assets/release-evidence.json` and the committed `.sppkg`.

## 4:35-5:00 - Production boundary

Close with the service boundary: the sample is offline and deterministic. Live CRM, Graph, CPQ, pricing policy, workflow, and e-signature integrations are deferred. Tenant Workbench validation remains required for actual model routing, CSP, iframe focus, forced colors, and screen-reader host behavior.

## Presenter checklist

- Run `npm run build` before presenting and verify release evidence is current.
- Show `RevenueExperiences.tsx` and `operations.ts`: every operational body is specific, while review
  framing is shared. Do not imply that session receipts propagate into another mounted tool or CRM.
- Do not claim authenticated host checks from the tenant-free harness.
- Keep map, pipeline, forecast, commercial, mobile, and dark screenshots open as the fallback path.
