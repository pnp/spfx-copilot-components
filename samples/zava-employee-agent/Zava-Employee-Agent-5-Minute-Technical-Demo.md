# Zava Employee Agent: 5-minute developer and architecture demo

## Purpose

Use this walkthrough after the business demo or in a developer session. It pairs the live UX with the source files that implement intent routing, host integration, safe workflows, shared full-screen composition, optimized packaging, and release validation.

> **Twenty independently routed HR tools share one maintainable React application, one data story, and one optimized package.**

## Presenter setup

Open these side by side:

- Microsoft Copilot or `npm run start:ux-review`
- VS Code at `samples/zava-employee-agent`
- A terminal in the sample folder

Pin these files:

1. `config/copilot-agent.json`
2. `config/config.json`
3. `src/copilotComponents/shared/components/ZavaIntentCopilotComponentBase.tsx`
4. `src/copilotComponents/shared/experiences/CatalogIntentCopilotComponentBase.tsx`
5. `src/copilotComponents/getMyHrDashboard/components/ZavaDashboardShell.tsx`
6. `src/copilotComponents/getMyHrDashboard/components/HomeThemeProvider.tsx`
7. `src/copilotComponents/shared/services/MockZavaEmployeeDataService.ts`
8. `src/copilotComponents/shared/experiences/RequestTimeOffWorkflow.tsx`
9. `scripts/validate-generated-ai-plugin.mjs`
10. `scripts/validate-package-output.mjs`

## Timed walkthrough

### 0:00-0:35 - Show intent-driven UX

**In UX, ask:**

> **Explain why my pay changed in 2026-07 compared with 2026-06, including deductions.**

**Expected component:** `ExplainPayChange`

**Say:**

> "The orchestrator selects one focused tool. This is not a generic dashboard with a hidden view parameter. Each prompt-addressable intent retains its own component manifest, GUID, tool description, and property schema."

### 0:35-1:10 - Show independent identity and shared registration

**In code:** Open `config/copilot-agent.json` and one component manifest.

**Point out:**

- 20 registered component GUIDs
- distinct tool names and descriptions
- minimal optional property schemas
- one declarative agent exposing the complete HR catalog

**Say:**

> "Independent identity gives Copilot precise routing metadata. Shared implementation does not erase that deployment contract."

### 1:10-1:50 - Show the common host boundary

**In code:** Open `ZavaIntentCopilotComponentBase.tsx` and `CatalogIntentCopilotComponentBase.tsx`.

**Point out:**

- `BaseCopilotComponent<TProperties>` lifecycle
- current-user resolution from host context with bundled fallback
- host-owned theme, dimensions, display mode, and available modes
- normalized intent family, route, and parameters
- React 18 render and teardown
- host-authoritative `requestDisplayModeAsync('fullscreen')`

**Say:**

> "Each class remains callable, but common lifecycle and full-screen behavior live in one tested adapter. A host resize or theme change does not become business state."

### 1:50-2:25 - Show owner-document theming and shared shell

**In code:** Open `HomeThemeProvider.tsx` and `ZavaDashboardShell.tsx`.

**Point out:**

- Griffel renderer targets the component owner document
- Fluent light/dark theme follows host context
- one-time provider remount handles iframe style insertion
- ten family destinations and fifty internal routes
- one family/route/parameter continuation contract for all tools

**In review harness:** Toggle dark mode and switch full-screen families.

### 2:25-3:05 - Show source-shaped mock data

**In code:** Open `MockZavaEmployeeDataService.ts` and the shared mappers/resolvers.

**Point out:**

- Graph-shaped mock seeds
- relative date resolution
- lean view models
- bundled personas and media
- service interface boundary for later Graph, SharePoint, or HR connectors

**Say:**

> "The UI consumes a stable view model. A live service can replace the mock without rewriting the component surfaces or action-plan contract."

### 3:05-3:40 - Show deterministic action boundaries

**In UX:** Open Request Time Off or Approval Inbox.

**In code:** Open `RequestTimeOffWorkflow.tsx` or `ApprovalDecisionWorkflow.tsx`.

**Point out:**

- editable prompt-derived defaults
- validation and calculated evidence
- Review -> Confirm -> mocked receipt stages
- explicit no-live-write disclosure

**Say:**

> "The language model can select and prefill. Deterministic code owns validation, calculations, and action boundaries. Prompt text never submits or approves automatically."

### 3:40-4:20 - Show one optimized bundle

**In code:** Open `config/config.json`.

**Point out:**

- 20 component entries keep separate manifests and entrypoints
- all entries share `zava-employee-copilot-components`
- React, Fluent UI, services, icon subset, and ten bundled images emit once
- final JavaScript is 910,310 bytes and the `.sppkg` is about 0.49 MiB

**Say:**

> "Independent routing does not require twenty copies of the same runtime and media. The shared bundle reduced the package from 8.99 MiB to about 0.49 MiB."

### 4:20-5:00 - Run the release gates

**In terminal:** Run or show the latest output from:

```bash
npm run build
```

**Expected proof:**

- media registry freshness
- 32 gallery screenshots and `assets/sample.json`
- 170 tests with zero failures
- 20 source tool/schema pairs and RC0 dynamic MCP discovery
- one hashed production JavaScript file
- no stale output, duplicate media, repeated cross-bundle base64, or Fluent icon font
- final package below configured investigation thresholds

**Say:**

> "The package is not done because Webpack completed. Source media, behavior, gallery assets, generated plugin output, and the final archive are independently validated."

## Architecture map

```text
Natural-language request
  -> declarative agent routing instructions
  -> one Copilot Component/tool
  -> normalized family + route + parameters
  -> shared React host
  -> focused inline experience OR shared full-screen workspace
  -> deterministic mock services and calculations
  -> explicit review and confirmation
  -> local sample receipt
```

## Key technical decisions

| Decision | Why |
| --- | --- |
| One intent per component/tool | Clear orchestration metadata and immutable identity |
| Shared component base classes | Avoid duplicated lifecycle and host integration |
| Owner-document Griffel renderer | Correct styles inside Copilot-hosted documents |
| Shared full-screen shell | Consistent continuation across 20 tools and ten families |
| Source-shaped mock services | Offline reliability and later live-service replacement |
| Explicit review and confirmation | Safe action semantics without external writes |
| One shared production bundle | Deduplicate runtime, UI, media, and icon code |
| Post-package validators | Validate what is shipped, not only source files |
| Tenant-free review harness | Reproducible screenshots and responsive QA |

## Presenter guardrails

- This is SPFx `1.24.0-rc.0` preview code; confirm target-tenant support.
- All HR records, calculations, recommendations, and receipts are deterministic sample data.
- The local harness does not prove authenticated tenant CSP, iframe focus, screen-reader output, or high contrast.
- Do not describe mocked receipts as writes to a production HR platform.

## Technical rehearsal checklist

- [ ] Keep the ten source tabs open in the listed order.
- [ ] Confirm the pay prompt routes correctly.
- [ ] Toggle theme and full-screen family in the review harness.
- [ ] Show the component identity and shared host boundary.
- [ ] Show one explicit review/confirmation workflow.
- [ ] Show one shared bundle with 20 manifest entries.
- [ ] Keep recent `npm run build` output visible.
- [ ] Finish within five minutes and reserve deeper code discussion for Q&A.
