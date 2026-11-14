# Technical walkthrough

Target duration: 10-15 minutes.

## 1. Identity and generation

- `config/zava-capabilities.mjs` is the canonical catalog for 35 IDs, intents, routes, operations,
  prompts, tools, outcomes, and routing boundaries.
- `scripts/configure-reference-hosts.mjs` normalizes the generated wrappers and validates 191 owned
  artifacts.
- The package contains 75 unique SPFx component GUIDs: 35 feature web parts, three workspace web parts,
  35 feature Copilot Components, one workspace component, and one capability explorer.

## 2. Shared implementation

- Web-part and Copilot wrappers are thin host adapters.
- `src/shared/components/ZavaOneApp.tsx` selects one shared React experience by normalized intent.
- `src/shared/hosts/ZavaOneWebPartBase.ts` owns SharePoint rendering, Top Actions, and property panes.
- `src/shared/hosts/ZavaOneCopilotComponentBase.tsx` owns Copilot lifecycle, display mode, context, and
  follow-up bridging.
- Persistent React roots prevent host rerenders from losing the active selection or draft.

## 3. Host isolation

- All 35 feature web parts support SharePoint web-part hosting only.
- Exactly three workspace web parts support SharePoint, SharePoint full page, Teams personal app, and
  Teams tab hosting.
- Copilot Components support inline and full-screen display modes.
- Separate `zava-one-webparts` and `zava-one-copilot-components` bundles keep Copilot runtime code out
  of ordinary SharePoint feature web parts.

## 4. Routing and agent behavior

- RC0 dynamically discovers 37 unique source tools with positive **Use when** and nearest-sibling
  **Do not use when** boundaries.
- Agent instructions name all 37 source tools and select the narrowest matching tool.
- Six conversation starters demonstrate news, verified knowledge, praise, sales, offices, and the
  capability explorer. Explorer remains last.
- Tool parameters filter or prefill an experience; they never authorize or submit an action.

## 5. State and safety

- Typed fixtures and an evented, session-local store provide deterministic data.
- C35 proves list, detail, decision, receipt, updated queue, and reset over one canonical request.
- Draft state remains invocation-local; only explicit confirmation changes the session store.
- Sensitive drafts are not put in URLs or model-visible context.
- Simulated receipts are labeled and never imply a source-system write.

## 6. Media and visualization

- Twenty-eight provenance-checked assets are embedded once for offline rendering.
- D3 modules provide sales charts, survey geometry, equity estimates, and the office projection.
- Charts retain exact-value tables, and the map retains an equivalent selectable office list.

## 7. Validation evidence

Run:

```bash
npm ci
npm run build
```

The current gate verifies 42 tests, 4,080 responsive browser states, 37 plugin functions, 39 engineering screenshots, 15 publication
images, two bundles, 28 media assets, the final SPPKG, and three personal-only Teams packages. See
[`docs/release-readiness.md`](../docs/release-readiness.md) and
[`phase-6-matrix.json`](../ux-review/evidence/phase-6-matrix.json).

## 8. Honest boundary

The author's working Teams baseline and three authenticated screenshots do not certify complete host
accessibility. Modern SharePoint page Top Actions,
host screen-reader behavior, CSP/focus integration, or live providers. Those remain explicit tenant and
production gates.