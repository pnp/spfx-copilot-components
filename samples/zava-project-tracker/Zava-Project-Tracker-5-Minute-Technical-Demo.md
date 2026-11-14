# Copilot Components for agents: 5-minute developer and architecture demo

## Purpose

Use this walkthrough after the business demo or in a developer session. Zava Project Tracker is the reference implementation used to explain how Copilot Components combine AI routing with deterministic interaction, human-controlled actions, host integration, shared architecture, and release validation.

The technical message is:

> **Let non-deterministic AI choose and configure the experience; let the component own deterministic interaction and safeguards; apply human authorization where the scenario's governance requires it.**

The implementation message is that many independently routed components can still share one maintainable React application, one coherent data model, and one optimized deployment package.

## Presenter setup

Open these side by side:

- Microsoft Copilot or the local UX review harness
- VS Code at `samples/zava-project-tracker`
- A terminal in the sample folder

Pin these files in editor tabs:

1. `src/copilotComponents/shared/mockData/intentCatalog.ts`
2. `src/copilotComponents/shared/components/ProjectIntentCopilotComponentBase.tsx`
3. `src/copilotComponents/shared/components/ProjectIntentApp.tsx`
4. `src/copilotComponents/shared/components/ProjectThemeProvider.tsx`
5. `src/copilotComponents/shared/models/intentInvocation.ts`
6. `src/copilotComponents/shared/services/SessionActionStore.ts`
7. `config/config.json`
8. `scripts/validate-intent-components.mjs`
9. `scripts/validate-generated-ai-plugin.mjs`
10. `scripts/validate-package-output.mjs`

## Timed walkthrough

### 0:00-0:35 - Show intent-driven UX

**In UX:** Ask:

> **Submit a project status report for Customer Service Copilot for 2026-08-21.**

**Expected component:** `SubmitProjectStatus`

**Say:**

> "Natural language is flexible, so the AI interprets the prompt and selects one independently registered component. That is the non-deterministic boundary. Once rendered, the component becomes the primary response and owns visible, deterministic interaction rather than forcing the user through more generated text."

### 0:35-1:10 - Show the catalog and generated identities

**In code:** Open `intentCatalog.ts` and `scripts/validate-intent-components.mjs`.

**Point out:**

- 31 immutable intent definitions
- owning workspace and full-screen route
- title, summary, decision visual, metrics, evidence, action, and people
- education metadata generated from the same catalog
- validation of unique GUIDs, tools, descriptions, 188 optional prompt properties, registrations, and exact bundle manifest coverage

**Say:**

> "The catalog is this example's component contract. Explicit identities and schemas give the AI clear choices and constrain the context each component receives. Generated folders remain immutable, shared behavior comes from common React modules, and one validator prevents routing metadata, schema, bundle, and registration drift."

### 1:10-1:50 - Show the shared Copilot host boundary

**In code:** Open `ProjectIntentCopilotComponentBase.tsx`.

**Point out:**

- `BaseCopilotComponent<TProperties>`
- host-owned `displayMode`, dimensions, theme, and available modes
- current-user resolution from page context
- `requestDisplayModeAsync('fullscreen')`
- one shared `ProjectIntentApp` for every generated component
- React 18 root reuse, `root.render`, and `root.unmount` during teardown

**Say:**

> "Each component remains independently callable by the agent, but selection ends at a tested host boundary. The adapter receives prompt properties and host state, then hands deterministic rendering and interaction to the shared application. The host remains authoritative for display mode, so the UX never invents state the platform has not granted."

### 1:50-2:25 - Show host-document theming

**In code:** Open `ProjectThemeProvider.tsx`.

**Point out:**

- Griffel `createDOMRenderer` targets `context.domElement.ownerDocument`
- `RendererProvider` and Fluent provider use the same target document
- light/dark theme derives from host context
- stable one-time remount avoids style insertion failures in Workbench iframes

**In UX:** Toggle dark theme in the review harness.

**Say:**

> "A useful agent experience must behave like native host UX, including inside another document. The renderer targets the actual component document, derives the host theme, and has tests around that boundary. Component value depends on trustworthy integration as much as visual design."

### 2:25-3:05 - Show fresh invocation versus passive rerender

**In code:** Open `intentInvocation.ts` and return briefly to `ProjectIntentCopilotComponentBase.tsx`.

**Point out:**

- supported prompt values are normalized and keys sorted deterministically
- intent plus normalized properties form a signature
- version increments only when prompt-derived intent state changes
- passive theme/size rerenders preserve local state
- a component-instance transient snapshot carries supported information, review, and submit context into full screen

**Say:**

> "This separates probabilistic invocation from deterministic local state. A resize or theme change cannot wipe a human edit, while a genuinely fresh prompt intentionally reapplies extracted defaults. The boundary is explicit and tested instead of being reinterpreted inside every control."

### 3:05-3:40 - Show governed session actions

**In UX:** Open a Decisions review and confirm a sample decision, or show an existing session receipt.

**In code:** Open `SessionActionStore.ts`.

**Point out:**

- typed decision/submission receipts
- immutable append behavior
- guarded `sessionStorage` with in-memory fallback for sandboxed hosts
- subscriptions synchronize queues across remounts
- Reset restores deterministic baseline

**Say:**

> "In this implementation, prompt text stops at the action boundary. We configured the component to require a person to review and confirm before recording a browser-session receipt. A future live service can replace this store while preserving that deliberate human-in-the-loop contract."

### 3:40-4:20 - Show one optimized package

**In code:** Open `config/config.json`.

**Point out:**

- 31 component entries retain separate manifests, GUIDs, and entrypoints
- all entries share one production bundle because they consume the same React/Fluent/application graph
- named Fluent SVG icon imports tree-shake to the used subset
- persona media is emitted once in the shared bundle

**Say:**

> "Purpose-built components do not require thirty-one duplicated applications. Independent identities preserve precise agent routing, while the shared bundle reuses React, Fluent, services, media, and icons. That reduced the package from the early 10.7 MB baseline to about 0.41 MiB without collapsing the experiences into one generic dashboard."

### 4:20-5:00 - Run the release gates

**In terminal:** Run or show the last output from:

```bash
npm run build
```

**In code:** Point to the three validators.

**Expected proof:**

- 31 tools and 188 optional properties
- 39 unified-gallery screenshots
- 172 tests with zero failures/warnings
- generated API plugin v2.4 dynamic MCP tool discovery
- one hashed production JavaScript file
- no stale JS, duplicate media, repeated base64 across bundles, or Fluent icon font
- final `.sppkg` below configured investigation thresholds

**Say:**

> "The package is not done merely because it renders. Tests verify deterministic behavior and human-action safeguards; validators verify component identity, schemas, gallery assets, generated plugin output, and the archive that actually ships."

## Architecture map

```text
Natural-language prompt
  -> non-deterministic intent interpretation
  -> declarative agent routing instructions
  -> one generated Copilot Component/tool
  -> shared BaseCopilotComponent adapter
  -> normalized invocation + version + transient state
  -> inline operation router OR shared/isolated full-screen root
  -> deterministic services/calculations
  -> configured human review + explicit confirmation
  -> session action receipt
```

## Key technical decisions

| Decision | Why |
| --- | --- |
| Keep AI flexibility at the intent boundary | Use natural-language understanding without making controls or actions probabilistic |
| One intent per generated component/tool | Give orchestration clear metadata and each experience an immutable deployment identity |
| Shared React host and operation routers | Avoid duplicated lifecycle, theming, workflow, and error handling |
| Catalog-owned routes and education metadata | Prevent tool/help/full-screen drift |
| Owner-document Griffel renderer | Correct styling in Copilot-hosted iframe documents |
| Normalized invocation signatures | Preserve edits on passive rerenders and reset on fresh prompts |
| Mock service interfaces and immutable seeds | Offline reliability and later live-service replacement |
| Explicit confirmation and session receipts | Implement the chosen human-in-the-loop policy and safe action semantics without external writes |
| One shared production bundle | Deduplicate common runtime, UI, media, and icon code |
| Post-package validators | Validate what is actually shipped, not only source files |

## Useful code references

- Routing behavior: `copilot/instruction.txt`
- Intent definitions: `src/copilotComponents/shared/mockData/intentCatalog.ts`
- Education metadata: `src/copilotComponents/shared/mockData/capabilityEducation.ts`
- Operation classification: `src/copilotComponents/shared/models/intentOperations.ts`
- Component host: `src/copilotComponents/shared/components/ProjectIntentCopilotComponentBase.tsx`
- Inline router: `src/copilotComponents/shared/components/inline/InlineExperienceRouter.tsx`
- Full-screen shell: `src/copilotComponents/shared/components/fullscreen/ProjectFullscreenShell.tsx`
- Dashboard compositions: `src/copilotComponents/shared/components/fullscreen/FullscreenWorkspaceDashboard.tsx`
- Invocation state: `src/copilotComponents/shared/models/intentInvocation.ts`
- Session receipts: `src/copilotComponents/shared/services/SessionActionStore.ts`
- Source identity audit: `scripts/validate-intent-components.mjs`
- Generated plugin audit: `scripts/validate-generated-ai-plugin.mjs`
- Final package audit: `scripts/validate-package-output.mjs`
- Gallery audit: `scripts/validate-gallery-assets.mjs`

## Presenter guardrails

- Present Zava as a reference implementation, not as the limit of the Copilot Component pattern.
- This is SPFx `1.24.0-rc.0` preview code; confirm target-tenant support before production adoption.
- Data, people, calculations, and receipts are deterministic mock records.
- Describe component calculations and the explicit action boundary as implementation and governance choices, not as limits of AI capability.
- The local harness proves UX behavior but not authenticated tenant CSP, iframe focus, high contrast, or screen-reader output.
- Supported transient continuation exists for representative operation state; not every specialized slider/filter is mapped into every full-screen module yet.
- Do not describe session receipts as writes to Planner, Project, SharePoint, Dataverse, Fabric, or finance systems.

## Technical rehearsal checklist

- [ ] Keep the ten source tabs open in the listed order.
- [ ] Reset demo decisions before showing session persistence.
- [ ] Confirm the status-report prompt routes correctly and renders the editable five-dimension form.
- [ ] Identify the non-deterministic routing boundary before demonstrating deterministic controls.
- [ ] Toggle dark theme to demonstrate owner-document styling.
- [ ] Show invocation signature/version fields without reading the whole file.
- [ ] Confirm a decision and show the receipt surviving remount/navigation.
- [ ] State that this implementation requires explicit human confirmation at the action boundary.
- [ ] Show the single shared bundle and 31 manifest entries.
- [ ] Keep recent `npm run build` output visible.
- [ ] Finish within five minutes and leave detailed code questions for Q&A.
