# Release readiness

This document is the concise sharing and validation handoff for the fixture-first Zava One sample.

## Architecture

```mermaid
flowchart LR
  SP[35 SharePoint web parts] --> Shared[Shared catalog, controllers, and React experiences]
  CC[37 Copilot Components] --> Shared
  WS[3 composed workspace web parts] --> Shared
  Shared --> Store[Typed fixtures and session-local event store]
  Shared --> Media[Embedded media and D3 visualization]
  Agent[Declarative agent and API plugin] --> CC
```

## Data and action flow

```mermaid
sequenceDiagram
  participant User
  participant Host as SharePoint, Teams, or Copilot
  participant Adapter as Thin host adapter
  participant Experience as Shared React experience
  participant Store as Session-local fixture store
  User->>Host: Ask, select, or edit
  Host->>Adapter: Intent and host context
  Adapter->>Experience: Normalized properties
  Experience->>Store: Read canonical fixture
  Store-->>Experience: Current state
  Experience-->>User: Reviewable UI
  User->>Experience: Explicit confirm
  Experience->>Store: Simulated session update
  Store-->>Experience: Labeled receipt and updated state
```

## Host matrix

| Surface | Count | Exposure | Validation state |
| --- | ---: | --- | --- |
| Feature web parts | 35 | `SharePointWebPart` only | Package and hosted Workbench baseline validated |
| Workspace web parts | 3 | SharePoint web part/full page; separate Teams personal-only app packages | Package validated; working Teams baseline confirmed by author with three authenticated screenshots |
| Feature Copilot Components | 35 | Inline and full screen | Generated plugin and Workbench baseline validated |
| Workspace Copilot Component | 1 | Composed full-screen workspace | Generated plugin validated |
| Capability explorer | 1 | Isolated discovery experience | Generated plugin validated |

## Privacy and safety

- Business data, people, prices, policies, and receipts are fictional fixtures.
- No runtime Graph, SharePoint, HR, finance, CRM, LMS, ITSM, market, or security provider is called.
- Drafts remain local to the invocation; confirmed demo changes remain in the browser session.
- Sensitive drafts are not placed in URLs or model-visible context.
- Every simulated mutation requires review and explicit confirmation.
- A simulated receipt is not evidence of a source-system write.

## Accessibility evidence and limits

Locally validated behavior includes semantic controls, visible focus, keyboard-capable layout movement,
text alternatives for charts/maps, light/dark token use, and responsive component layouts. Publication
screenshots were reviewed individually at their actual rendered bounds: 12 complete local experience
captures and three authentic Teams viewport overviews. Teams crops remove only the outer four-pixel
window frame, with every retained pixel verified against the original snapshot.

This is not an accessibility certification. Authenticated host testing remains required for Narrator or
JAWS, 200% zoom, forced colors, reduced motion, iframe focus, Teams chrome, and modern SharePoint page
integration.

## Local validation

Run with Node.js `>=22.14.0 <23.0.0`:

```bash
npm ci
npm run validate
npm run build
git diff --check
```

Stop `npm start` before a clean build. The current evidence records:

- 42 tests passed, zero failed, including Teams header/control, shared receipt, and saved/default layout regression tests;
- three generated-text regression tests and a fresh Git-index checkout passed without regeneration;
- 35 capability pairs and 75 unique SPFx component GUIDs;
- 37 unique generated plugin functions and six conversation starters;
- two host-specific bundles and 28 provenance-checked media assets;
- 39 recaptured engineering screenshots and 15 reviewed publication screenshots;
- three separately validated Teams personal-app ZIPs, without channel scopes;
- 4,080 responsive browser states passed, including narrow desktop columns, dark mode, and submission journeys;
- a validated version `1.0.0.15`, 110-entry SPPKG.

The [responsive review](./responsive-review.md) records the device-width matrix, balanced default
column measurements, shared confirmation UX, and remaining host/accessibility gates.

Artifact hashes and measured sizes are authoritative in
[`phase-6-matrix.json`](../ux-review/evidence/phase-6-matrix.json).

## Sharing checklist

- Use the committed SPPKG in `sharepoint/solution/zava-one-hub.sppkg`.
- Use the committed agent package in `teams/zava-one.zip`.
- Upload the three personal-app packages separately; see [`teams/README.md`](../teams/README.md).
- Start with [`demos/README.md`](../demos/README.md).
- Use [`assets/sample.json`](../assets/sample.json) for gallery metadata.
- Keep tenant-host and production gates visible in the README and TODO.

## External gates

The author confirmed the three Teams personal apps work; source snapshots are published in the gallery.
That baseline is not a complete host or accessibility certification. Before any production claim,
validate authenticated SharePoint pages, Teams personal-app accessibility,
Copilot inline/full screen, CSP, focus transfer, screen readers, service permissions, privacy, retention,
telemetry, rollback, and support ownership.