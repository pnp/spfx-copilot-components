# Zava IT Concierge: 5-minute technical demo

## 0:00-0:45 - The AI-to-deterministic experience contract

Start in the authenticated Copilot Workbench with one natural-language request and its rendered inline component.

**Say:** "The model provides flexible, non-deterministic language understanding. It identifies intent and extracts useful context. The selected Copilot Component then provides deterministic data, state, validation, and user-controlled operations. The user stays in the Copilot canvas for both."

Show the source tree and explain the four layers:

- `src/shared/intents/intentCatalog.ts` is the typed source of truth that gives the AI 31 explicit tool boundaries and maps each need to a purpose-built experience.
- Generated component classes and manifests bind each tool to one shared React host.
- Deterministic mock data, analytics, and session-only operation reducers keep inline and full-screen views coherent.
- `DashboardFullScreenExperience.tsx` maps every origin into Personal, Team, or IT Portfolio while preserving prompt-derived context inside Copilot.

## 0:45-1:35 - Routing and schemas

Open the catalog and one generated manifest. Every description begins with a positive **Use** boundary and includes a **Do not use** collision boundary. These descriptions guide probabilistic natural-language routing into a bounded tool. Every prompt property is optional, typed with Zod, represented in preview data, and visibly affects deterministic filtering or prefilling after routing.

Show `Zava-IT-Concierge-Prompt-Matrix.md`. It is generated from the catalog and covers all 31 prompts, preview properties, routes, and collision boundaries. Six conversation starters are validated, with capability exploration last.

Run:

```powershell
npm run validate:intents
npm run check:routing-matrix
```

## 1:35-2:25 - Inline work and full-screen context in one canvas

Open `IntentCanvasApp.tsx`. Call out:

- One branded header combines Zava IT Concierge with the action title.
- A fixed top-right **Full screen** control delegates display mode to the host.
- The generic prompt echo and generic decision-insight rail are absent by default.
- Submit and review tools use editable fields, visible consequences, explicit confirmation, and semantic receipts.
- Information and operation components complete focused work inline, without deep links or navigation to another application.
- Full screen preserves the invoking intent and expands into application-scale context without leaving Copilot.

Render these four inline components as the representative implementation matrix:

| Component | Technical pattern to show |
| --- | --- |
| `ReportItIssueCopilotComponent` | Prompt-prefilled controlled form, Fluent fields, validation, review, explicit confirmation, and session receipt |
| `GetTeamTicketTrendCopilotComponent` | Immutable analytical model, lazy React SVG/D3 rendering, exact values, selection, and accessible evidence |
| `GetApprovalQueueCopilotComponent` | Canonical queue records, counted filters, list-to-detail ownership, decision safeguards, and immutable update |
| `GetFleetHealthCopilotComponent` | Inline D3 geography, keyboard-selectable cohorts, exact-value rail, and host-authoritative full-screen continuation |

Open `DashboardFullScreenExperience.tsx` from `GetFleetHealthCopilotComponent` and show the keyboard-operated Personal, Team, and IT Portfolio tabs plus the exact origin context.

**Say:** "This is adaptation with guardrails. AI decides which bounded experience best matches the language. The component, not the model, owns calculations and state transitions. Inline handles the immediate task; full screen adds breadth when the task becomes investigative or cross-functional."

## 2:25-3:10 - Rendering and lifecycle

Show the renderer split:

- Purpose-built DOM compositions for forms, queues, products, journeys, knowledge, and the explorer.
- React SVG and lazy D3 scale/shape modules for compact analytical charts.
- Lazy D3 Geo, TopoJSON, and Natural Earth data for geographic estate risk.
- Babylon only for genuinely dimensional full-screen scenes, with no inline WebGL engines.

Explain that analytical models are immutable and formatting stays exact for counts, percentages, and currency.

## 3:10-3:50 - Data and safety

Open the mock graph and operation reducer. The seeded graph contains 150 employees, 180 devices, 10 catalog SKUs, and 300 tickets. Confirmed demo actions append session-only receipts; prompts never approve, submit, delegate, declare, wipe, or apply a refresh plan.

Call out the trust boundary: natural language may prefill a draft or select a record, but model interpretation never commits a consequential action. Deterministic validation, review, and explicit user confirmation own that transition.

Live service integration is deliberately deferred behind service interfaces. The sample makes no runtime network request for business data or media.

## 3:50-4:35 - Host validation and visual evidence

Use the authenticated Copilot Workbench as the primary runtime demonstration:

```powershell
heft start --nobrowser
```

Invoke the same operation with the matrix prompt and one natural paraphrase to demonstrate flexible language understanding. Verify that both route to the expected component, then show that the resulting fields, calculations, and controls behave predictably. Expand once to prove the full-screen application remains in the Copilot host and preserves origin context.

Use the local visual harness as secondary deterministic UI evidence:

```powershell
npm run capture:visual
npm run check:gallery
```

The Playwright harness captures 31 inline defaults, three dashboards, mobile and dark views, and representative detail, confirmation, and receipt states. `assets/visual-evidence.json` records dimensions, broken images, overflow, deprecated chrome, page errors, console errors, canvas count, and engine count.

## 4:35-5:00 - Production gate

Run:

```powershell
npm run build
```

The canonical gate validates routing, media, gallery metadata, and generated docs; runs the clean production test suite; packages the solution; validates the generated API plugin v2.4 dynamic discovery for 31 source tools; then audits the `.sppkg` for stale output, hashes, bundle/chunk strategy, duplicate media, icon fonts, and size thresholds.

The local gate complements, but does not replace, authenticated Copilot host validation for routing, CSP, display-mode transitions, iframe focus, high contrast, and screen-reader output.

## Required live component checkpoint

Do not replace the four live inline components with screenshots or code-only narration. The technical demo is complete only when `ReportItIssueCopilotComponent`, `GetTeamTicketTrendCopilotComponent`, `GetApprovalQueueCopilotComponent`, and `GetFleetHealthCopilotComponent` each render and the presenter ties natural-language routing, deterministic visible behavior, and inline-to-full-screen continuation to the owning code path.
