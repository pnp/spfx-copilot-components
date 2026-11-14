# Zava AI Project Portfolio Agent - experience and implementation plan

## RC0 update - October 20, 2026

The current application baseline is SPFx 1.24.0-rc.0, React/ReactDOM 18.3.1, React types 18.3.31/18.3.7, and Heft 1.3.2. Current validation, exact packages, starter targets, findings, and external release gates are recorded in the [repository RC0 readiness report](../../RC0-updates.md). The local creation guide is synchronized byte-for-byte with the assets golden guide.

Earlier entries below retain their implementation history. Old framework versions, test totals, byte counts, and hashes in that history are not current RC0 release evidence.

This document is the source of truth for designing and implementing the Zava AI Project Portfolio
Agent. It tracks approved scope, implementation progress, quality gates, and remaining work.

> **Implementation status:** Phase 0, Phase 2 data/inline baseline, and all locally executable Phase 2B
> and Phase 2C gates are complete; Phase 3 is in progress as of 2026-08-21.
> **Target:** 30 operational inline Copilot Components plus one catalog-driven Agent Capability Explorer
> (31 total) in one polished sample  
> **Status legend:** `[ ]` not started | `[ ]` **IN PROGRESS** | `[x]` complete | `[ ]` **BLOCKED: reason**
>
> **Progress (latest):** All 30 final-named operational Yeoman components and the generated
> `ExploreAgentCapabilities` component have unique GUIDs, bundles, descriptions, schemas, registrations,
> and operation-aware routing. Operational bodies remain 19 information, 5 review, and 6 submit/request
> experiences. The shared React/Fluent host targets the component
> `ownerDocument`, supplies consistent workspace accents/full-screen action, bundled portraits, and
> reusable D3 trend, waterfall, donut, bubble, treemap, and Sankey charts. Retained controls materially
> change records/grouping/geometry/calculations/evidence; generic reviews were replaced by draft-backed
> domain reviews; approvals and forms complete explicit validation/review/confirm/receipt/reset flows.
> The completed operational baseline retains its 91 focused-test gate; Phase 2C raises the current
> project total to 130 focused tests. Catalog/media audits, zero-warning production packaging, 120
> operational width/theme browser states, reduced motion, keyboard focus, real 200% browser zoom,
> 30 operational screenshots, no-match/error states,
> and machine-readable evidence pass. The only deferred Phase 2B prerequisite is the tenant-authenticated
> Copilot Workbench CSP/screen-reader/iframe-focus smoke because `{tenantDomain}` is not configured.
> A newly approved Phase 2C now adds the reusable `ExploreAgentCapabilities` education component,
> third/final conversation starter, dynamic 30-scenario catalog, and isolated full-screen preview gallery.
> The first version is implemented with category/search/audience discovery, business prompts, clipboard
> fallback, featured tour, safe previews for all 30 operational experiences, 10 inline/full-screen visual
> states, eight screenshots, and 130 passing focused tests. The final intent/media audits and clean
> production package gate were revalidated on 2026-08-19. Deferred non-gating follow-ups are a verified
> host prompt-submit action, richer safe preview reset/outcome filtering, lazy loading, reusable threshold
> automation, and tenant high-contrast/screen-reader validation. Phase 3 now has a polished shared
> operational shell with My Work, Project, Portfolio, and Decisions tabs; exact workspace landing and
> fresh-intent rerouting;
> session settings; responsive metrics; dashboard-only full-screen entry; prompt-derived resource
> review at a safe 20%/98% load after explicit selection; keyboard tab/focus behavior; and light,
> dark, 980px, 760px, and 340px evidence. Each tab now opens as a useful default dashboard rather than a
> route dropdown: My Work personal operations, a selectable Project budget/delivery cockpit, a company
> Portfolio investment/cost overview, and a Decisions queue with inline review/confirm/receipt operations.
> The Portfolio tab now presents a company-scale investment landscape, 12-month run-rate, investment
> mix, executive exceptions, and an eight-project financial ledger. Decisions is one unified filterable
> manager inbox backed by the same 12 records as the four inline review queues. Entering from a review
> component automatically filters to its matching three items without auto-selecting one; the left
> request list persists, the right side is empty until explicit Review, and
> processed status/receipt update in place without an internal queue arrow. Fresh Copilot intents reset
> the shared shell to the correct dashboard. My Work now adds six personal submit/request actions that
> reuse the inline forms in a host-bounded right panel and close after confirmed completion. The latest
> complete production test gate passes 168/168 with zero failures, and package-solution regenerates the
> SharePoint artifact. A generated-plugin audit validates the shipped agent ZIP's 31 API plugin v2.4
> functions, 31 mirrored MCP tools, 219 descriptions, supported parameter subset, deployment
> placeholders, and published string limits. All 31 component entries now share one production bundle,
> reducing repeated React/Fluent/shared UX/media/icon output to one 746,078-byte JavaScript file and the
> `.sppkg` from the earlier 10.7 MB baseline to 426,717 bytes (0.41 MiB). Supported named Fluent icon
> imports tree-shake to the used icon subset, now emitted once; production staging has one hashed JS file
> and zero stale unhashed bundles. `check:package-output` now enforces this against the final `.sppkg`:
> no stale JS, duplicate packaged media, repeated inline image payloads across bundles, or Fluent icon
> font; it reports size investigation flags as structured build output. A deterministic invocation
> envelope now normalizes prompt properties, increments a version only for fresh intent/property state,
> preserves a typed transient snapshot across host display-mode rerenders, and resets it on a fresh
> invocation. Representative information, review, and submit interactions emit snapshots and full screen
> shows their continued context without auto-opening panels. A sandbox-safe session action store now
> persists confirmed generic submissions and all review decisions, synchronizes processed Decisions rows
> across remounts, and provides Reset demo decisions. Public-release materials now include a production
> README, timed 3-minute keynote, 10-minute business-value walkthrough, 5-minute technical/code demo,
> complete 31-component prompt catalog, unified-gallery metadata, and 39 validated inline/full-screen
> images. Next:
> extend transient adapters to remaining specialized experiences, extract the reusable workflow state machine, deeper route-specific
> canvases and cross-filtering, high contrast, and tenant-host validation.

---

## 1. Product vision

Create a leadership-ready Copilot Apps sample that demonstrates how each conversational turn can
resolve dynamically to the right contextual UX inside Copilot, preconfigured from prompt parameters
and immediately useful without opening a separate application. Full-screen mode is the scenario-specific
"one more thing": the exact inline context expands into a richer workspace with additional evidence,
navigation, modeling, and safe action capabilities.

The experience should feel like a credible project and portfolio management product, not a gallery of
unrelated cards. It will use one connected, deterministic mock story across personal work, project
delivery, portfolio governance, AI spend, resource capacity, and approvals.

### Experience promise

1. **Ask naturally.** Copilot selects one focused component from the wording and scope of the prompt.
2. **See the answer immediately.** Inline UX summarizes, explains, visualizes, or prefills the requested
   action without requiring a full application launch.
3. **Change the question, change the component.** Intent determines the component; parameters visibly
   alter project, period, grouping, threshold, comparison, or form defaults within that component.
4. **Expand without losing context.** Every inline component opens the same four-tab full-screen shell
   at its owning tab, route, selected entity, filters, and prompt-derived state.
5. **Review before acting.** Prompt values can filter and prefill, but never submit, approve, reject,
   assign, or mutate data without explicit user review and confirmation.
6. **Trust the evidence.** Every metric and AI-style insight traces to coherent mock records and shows
   its as-of date, calculation basis, and relevant owner.
7. **Explain movement, not only status.** Every major summary can answer what changed, why it changed,
   who is affected, and which decision is now required.
8. **Explore before committing.** Resource and funding scenarios preview schedule, cost, capacity, and
   value consequences without changing the approved mock baseline.
9. **Know what to ask.** A nontechnical capability explorer organizes the agent's complete scenario
   breadth by business outcome, provides realistic prompts, and previews each experience safely.

### Demo storytelling contract

1. **Inline dynamic UX is the hero.** The primary demo begins with a natural back-and-forth in one
   Copilot conversation. Materially different questions resolve to materially different purpose-built
   inline components rather than variations of one generic answer surface.
2. **Interact before asking again.** Each inline turn gets one concise interaction that proves the UX is
   functional: select evidence, change a comparison dimension, adjust a safe scenario, edit a draft, or
   review validation. Do not rush through the inline experiences as static cards.
3. **Make conversational continuity visible.** Follow-up wording and extracted parameters carry the
   named project, comparison set, person, period, and proposed value forward while still selecting the
   component best suited to the new question.
4. **Expand late and exactly.** Full screen appears only after the audience understands dynamic inline
   resolution. Expanding preserves the exact selected entity, filters, evidence, draft, or what-if state
   and adds scenario-specific depth; it never resets to a generic dashboard home.
5. **The domain is proof, not the headline.** Project portfolio management supplies a coherent,
   sophisticated example. The reusable story is that Copilot can resolve conversation into trusted,
   interactive UX and then continue seamlessly into an immersive application experience.

### Showcase success criteria

- 30 purposeful operational inline components are independently selectable through distinct tool descriptions.
- One additional catalog-driven education component exposes all 30 operational scenarios without
   duplicating their metadata or requiring users to know tool/component names.
- The same component produces visibly different useful states from different parameter sets.
- The primary keynote shows at least three conversational turns resolving to distinct inline UX shapes,
   with one meaningful interaction completed in each before full screen is opened.
- Every component has a meaningful inline-to-full-screen continuation, not a generic dashboard jump.
- Every inline component uses the same top-right **View in full screen** affordance as the reference
   sample, with consistent icon, tooltip, keyboard behavior, spacing, and host-authoritative state.
- The four primary full-screen tabs support personal, project, portfolio, and manager workflows.
- Full-screen mode uses one persistent horizontal tab row and a settings gear in the top-right product
   bar so navigation and personalization remain predictable regardless of the originating component.
- All people references include a real bundled face image and accessible name/initials fallback.
- Charts answer a decision question and support filters, details, keyboard use, and a nonvisual summary.
- The first useful result delivers a clear keynote moment within ten seconds: relevant people, one
   arresting visual, one surprising but explainable insight, and one obvious next action.
- Mock forms and approvals demonstrate review, validation, confirmation, and a durable-looking receipt.
- The complete keynote path has no runtime network, authentication, AI-service, or date-expiry risk.
- Light, dark, 320 px inline, mobile full-screen, desktop, projector, and reduced-motion states work.
- Locale, currency, fiscal-calendar, long-label, and right-to-left stress cases preserve the information
   hierarchy so the sample feels credible to a worldwide audience.
- Production build and focused tests complete with zero new warnings or errors.

## 2. Approved scope decisions

| Decision | Recommendation | Reason |
| --- | --- | --- |
| Product name | **Zava AI Project Portfolio Agent** | Clearly covers personal delivery, projects, portfolio, and AI governance. |
| Component count | **31 total: 30 operational + 1 education explorer** | Preserves the completed operational catalog and adds a reusable discoverability pattern required for complex agents. |
| Conversation starters | **Exactly 3; the third/final starter opens capability exploration** | Keeps two high-value direct starts while giving users a durable route to the complete agent breadth. |
| Capability education | Generate `ExploreAgentCapabilities`; advertise 30 scenarios dynamically from the intent catalog | Prevents static help drift and makes the pattern reusable by future agents with more than 10 inline tools. |
| Primary navigation | **My Work, Project, Portfolio, Decisions** | Creates a clear progression from personal signal to project context, portfolio trade-off, and accountable decision. Internal route/category identifiers may remain `approvals`. |
| Full-screen navigation | Persistent horizontal tabs below the product bar | Matches the reference interaction model and keeps all four workspaces one click away. |
| Global settings | Settings gear icon in the top-right product bar | Provides a stable location for session preferences without competing with route controls. |
| Current-user persona | **Megan Bowen, Senior Program Manager** | Uses an available face asset and supports both individual and cross-project stories. |
| Demo time model | Resolve relative seed offsets from a mount clock; use **2026-08-18** for design examples | Keeps dates current for review while preventing the finished demo from expiring. |
| Currency and fiscal model | USD, calendar year, monthly financial periods | Simple for a global sample; formatting remains a session setting. |
| Delivery model | Mock-first and offline; service interfaces ready for Graph, SharePoint, Planner, Project, and Fabric later | Maximizes keynote reliability without blocking a credible production architecture. |
| Visualization strategy | Vega-Lite first, D3 for bespoke interactions, Fluent UI for controls and accessible summaries | Balances visual fidelity, maintainability, and custom interaction. |
| First showcase slices | Project comparison, AI spend control tower, resource what-if approval | Proves React visual quality, conversational parameter impact, and safe action before broad scale-out. |
| Worldwide readiness | Locale-aware formatting and layout stress coverage, including right-to-left | Makes the sample resonate beyond one region without requiring live global services. |
| Existing starter | Retire the untouched `ProjectTracker` placeholder during approved scaffold cleanup; do not rename or repurpose it | Its generated name does not match a final catalog intent, and preserving the wrong identity would create lasting ambiguity. |
| Component creation | Keep the 30 completed operational identities immutable; generate `ExploreAgentCapabilities` through Yeoman as component 31 | Preserves validated identities while applying the same supported scaffold rule to the new education intent. |

### Explicitly out of scope for the first showcase

- Live writes to Planner, Project, SharePoint, Dataverse, Fabric, or financial systems.
- Real model inference, token metering, or approval notifications.
- Authentication or authorization beyond role-shaped mock views and privacy labels.
- A generic natural-language chart builder; visuals are intentionally designed for known decisions.
- A fifth primary tab. Secondary routes and detail panels live within the four approved workspaces.

## 3. Information architecture

### Four full-screen tabs

The four workspaces are rendered as **horizontal tabs**, not a left rail, card selector, or command-bar
menu. The active tab has a strong selected indicator, while inactive tabs remain quiet. Tabs preserve
their last internal route during a full-screen session and expose proper `tablist`, `tab`, and
`tabpanel` semantics. On narrow screens the same row scrolls horizontally with visible edge affordance;
it does not collapse into unrelated navigation unless a host width makes the tab labels unusable.

| Tab | Primary audience | Core question | Full-screen content |
| --- | --- | --- | --- |
| **My Work** | Contributor, project manager | What needs my attention, and can I deliver it? | Action center, assigned work, goal contribution, capacity, weekly update, timesheet. |
| **Project** | Project manager, workstream lead | Is this project healthy, funded, staffed, and progressing? | Project selector, health, comparison, plan, milestones, RAID, budget, AI spend, team, updates, requests. |
| **Portfolio** | PMO, portfolio lead, executive | Are we investing in the right work and delivering strategic value? | Portfolio health, OKR alignment, roadmap, funding, AI spend, capacity, risk exposure. |
| **Decisions** | Sponsor, finance, resource manager, governance board | What decisions are waiting, and what evidence supports each one? | Approval inbox, project intake, budget, staffing, and stage-gate decision workspaces. |

### Shared full-screen shell

```text
+------------------------------------------------------------------------------+
| Zava AI Portfolio   As of 18 Aug 2026   Search   Scenario      [gear] [User] |
+------------------------------------------------------------------------------+
| [My Work]   [Project]   [Portfolio]   [Decisions]        horizontal tab row |
+------------------------------------------------------------------------------+
| Breadcrumb / selected scope       Filter bar / period / comparison / export |
+-----------------------------------------------------------+------------------+
| Contextual hero: status sentence, 3-5 metrics, action     | Optional detail  |
| Priority or insight banner                                | / review panel   |
| Main route canvas: charts, tables, forms, timelines       | One at a time    |
| Related evidence and next actions                         |                  |
+-----------------------------------------------------------+------------------+
| Mock data / Offline / Updated from deterministic sample records             |
+------------------------------------------------------------------------------+
```

### Inline-to-full-screen contract

- Each component owns one inline intent, one immutable owning tab, and one initial full-screen route.
- Every inline component reserves the top-right corner of its header for the same icon-plus-tooltip
   control with accessible label and tooltip **View in full screen**. Use the reference sample's expand
   interaction pattern and one shared implementation; do not invent component-specific labels or
   positions. The control must never obscure a title, status, chart label, menu, or form field.
- The full-screen control appears only when the host advertises `fullscreen`; otherwise the reserved
   header layout closes cleanly without leaving an empty visual gap.
- The control is a real button with a familiar fullscreen/expand icon, visible focus state, minimum
   target size, Enter/Space activation, and no optimistic mode change before the host responds.
- Expanding the current component calls `requestDisplayModeAsync('fullscreen')` and lets the same
  component render the shared shell with `initialTab`, `initialRoute`, normalized parameters, and a
  fresh-invocation version token.
- The shell focuses the destination heading, preserves the selected project and filters, and then
  owns internal navigation.
- Passive host rerenders preserve user edits and drill-down state. A fresh Copilot invocation applies
  newly extracted parameters.
- Cross-tab actions use typed destinations, never browser URLs.
- Back returns to the originating chart, list, or approval selection and restores keyboard focus.

### Full-screen chrome contract

- The product bar is visually restrained and contains product identity on the left and global actions
   on the right. The **settings gear is always in the top-right corner**, immediately before the current
   user's avatar. Use a familiar Fluent settings icon with tooltip and accessible label `Settings`.
- Settings opens one focus-managed panel for session-only preferences such as currency, locale, fiscal
   period, density, accessible chart table defaults, and demo scenario. It does not navigate away.
- The horizontal primary tabs sit directly below the product bar and remain visible while the route
   canvas scrolls. Route filters belong below the tabs so they cannot be mistaken for global settings.
- Search, scenario switching, settings, and the user menu keep stable positions and dimensions. Route
   content, selections, loading labels, or long project names must not shift the chrome.

```ts
interface IProjectIntentDefinition<TProperties> {
  tab: 'my-work' | 'project' | 'portfolio' | 'approvals';
  route: string;
  normalize: (properties: TProperties) => Record<string, unknown>;
}
```

## 4. High-level UX designs

### My Work

```text
Megan's workday                         4 actions need attention
[Due this week 7] [Blocked 1] [Capacity 92%] [Time pending 6.5h]
----------------------------------------------------------------
My priorities                    Capacity: planned vs available
Ranked, explainable action list  Stacked weekly allocation chart
----------------------------------------------------------------
My assignments                   Goal contribution
Grouped task board/list          Personal work mapped to OKRs
----------------------------------------------------------------
Weekly update draft              Timesheet completion
Progress, blockers, next steps   Day-by-day hours and variance
```

- Personal and actionable, with the current user's avatar prominent in the hero.
- Default order is urgency, dependency impact, then due date; users can group by project or status.
- Capacity distinguishes committed project work, operational work, learning, and unallocated time.
- Weekly update and timesheet use a staged Draft -> Review -> Mock submit pattern.

### Project

```text
[Project selector: Customer Service Copilot] [Amber] [Execution] [Owner avatar]
[Schedule variance -8d] [Budget 74%] [AI budget 81%] [Team load 94%]
------------------------------------------------------------------------------
Health narrative + trend     Milestone plan / critical path     RAID summary
------------------------------------------------------------------------------
Budget baseline / actual / forecast     AI spend by model, feature, environment
------------------------------------------------------------------------------
Team allocation heatmap       Weekly status history       Requests and decisions
```

- Project selector supports search and recent projects; prompt `projectId` selects it directly.
- Project comparison aligns two-to-four projects on common measures and time windows; it avoids ranking
   unlike phases without explaining the normalization and preserves every project owner's avatar.
- Use standard RAG health, delivery phase, stage gates, baseline/forecast/actual dates, RAID items,
  schedule variance, cost variance, estimate at completion, and decision logs.
- The header always shows project manager and sponsor avatars when named.
- Financial and AI consumption views share period and scenario filters but retain distinct measures.

### Portfolio

```text
AI Transformation Portfolio     8 active projects     Overall health: Amber
[On track 5] [At risk 2] [Critical 1] [Forecast $7.84m] [Benefits $14.2m]
------------------------------------------------------------------------------
Value vs risk bubble plot            Strategic objective / key-result alignment
------------------------------------------------------------------------------
Cross-project roadmap                Funding and AI-spend forecast
------------------------------------------------------------------------------
Capacity demand vs supply            Concentrated risks and dependencies
```

- Portfolio views emphasize comparison and trade-offs instead of repeating project cards.
- Filters cross-highlight all compatible visuals: portfolio, strategic objective, status, phase,
  sponsor, project manager, date range, and scenario.
- Selection opens an evidence panel; a deliberate command opens the Project tab for deeper context.
- Forecast views support Baseline, Current forecast, and Proposed scenario without implying a write.

### Decisions

```text
Decision center      9 waiting     3 due in 48 hours     $1.42m requested
------------------------------------------------------------------------------
Queue / filters       Evidence workspace                 Decision panel
Budget                Business case and variance         Approve
Staffing              Capacity and skill fit             Return for changes
Project intake        Strategic alignment and value      Reject
Stage gate            Exit criteria and unresolved RAID  Comment / confirm
```

- Use a three-pane work pattern on wide screens and queue -> evidence -> decision steps on mobile.
- Every person in requester, sponsor, owner, or proposed assignee positions includes an avatar.
- Decision buttons remain disabled until required evidence is reviewed and validation passes.
- Reject and Return require rationale. Approve shows an explicit consequence summary and confirmation.
- Completed mock decisions return a receipt with ID, timestamp, decision maker, and reversible demo reset.

## 5. Inline Copilot Component portfolio

An intent earns a component when it provides at least two of these: frequent decision value, useful
prompt-driven variation, meaningful interaction or review, a distinctive visualization, and a natural
full-screen continuation. Supporting lists and detail states remain internal routes rather than tools.

> [!IMPORTANT]
> The current shared title/KPI/insight/chart body is a validated technical baseline, not the final UX.
> Shared branding does not mean shared composition. Every component below must use the operation model,
> information hierarchy, controls, and interaction states defined in this section. A component is not
> complete merely because its labels, metrics, and small chart differ from another component.

### Three inline operation models

| Operation model | Components | Required interaction contract |
| --- | ---: | --- |
| **Information and status** | 19 | Answer the question immediately with a use-case-specific visual/list composition. Expose only meaningful filters, grouping, comparison, zoom, selection, or what-if controls. Selection reveals evidence or a compact detail without leaving the inline surface. Required states: useful default, filtered, selected detail, empty/no match, and error. |
| **Review and decision** | 5 | Show a queue or selected request with requester avatar, context, due state, evidence completeness, and consequence. Support Queue -> Review -> Decision draft -> Confirm -> Receipt directly inline. Approve summarizes consequences; Return/Reject requires rationale. Prompt `decision` may preselect a draft but never confirms it. |
| **Request and submit** | 6 | Render real editable controls prefilled from prompt properties. Support Edit -> Validate -> Review -> Confirm -> Receipt directly inline. Derived values update as fields change. No prompt or initial render submits data. |

### Shared branding, deliberately different layouts

- Reuse `ProjectThemeProvider`, workspace accent, typography, status semantics, avatar treatment,
   top-right View in full screen button, focus styling, spacing scale, and receipt language.
- Share primitives such as inline header, person row, filter bar, validation summary, decision buttons,
   and receipt banner. Do not share one universal body component across all three operation models.
- Information components own a chart/list composition selected for the decision question. Review
   components own queue/evidence/decision state. Request/submit components own labeled form controls.
- Controls must visibly alter the displayed records, aggregation, chart marks, calculations, or draft.
   A filter that only changes a caption does not satisfy the interaction contract.
- Inline actions remain complete at 320-399px. Charts may simplify, review queues become sequential,
   and forms become one column, but no required field or confirmation step disappears.

### Information and status inline blueprints - 19

| Component | Purpose-designed inline layout | Direct controls and inline actions |
| --- | --- | --- |
| `GetMyWorkSummary` | Personalized attention brief: compact KPI strip above a ranked 3-5 item priority stack; each row shows project, due state, reason, and owner. A seven-day workload sparkline is supporting evidence, not the main body. | Period and focus segmented controls; project filter; include-completed toggle. Select an item for evidence, mark a task complete in session, or open its owning inline detail. |
| `GetMyTasks` | Dense grouped task list or three-column mini board chosen by `groupBy`; rows show blocker chain, project, due state, priority, and reviewer avatar. | Status, due-window, priority, and project filters; Group by menu. Expand row, change mocked status, or complete a task with confirmation. |
| `GetMyCapacity` | Six-week stacked allocation bars with a 90% warning band, followed by a compact project/operational-work legend and the largest overload explanation. | Date range, project filter, committed/forecast segmented control, operational-work toggle. Select an overloaded week and preview a rebalance scenario. |
| `GetMyGoalContributions` | Objective -> key result -> assignment flow/tree with progress bars and a small unaligned-work callout; hierarchy replaces generic KPI tiles. | Objective and period selectors; project filter; include-indirect toggle. Select a node to inspect contribution evidence and accountable owner. |
| `GetProjectHealth` | Project identity header with manager/sponsor avatars; segmented radial health ring for delivery, budget, scope, value, and risk beside a short change-driver list and trend strip. | Focus tabs and period selector; compare-to-baseline toggle. Select a health dimension to replace the driver list with grounded evidence. |
| `GetProjectTimeline` | Compact Gantt/critical-path canvas with baseline and forecast bars, dependency links, milestone diamonds, and one narrated predecessor chain. | Date zoom, workstream filter, Critical only and Show baseline toggles. Select a task/milestone for owner, variance, and dependency detail. |
| `GetProjectMilestones` | Horizontal milestone rail with stage-gate badges and forecast confidence, plus a 2-3 row due-next list with accountable-owner portraits. | Period and status filters; include-completed toggle. Select a milestone to reveal exit criteria and date movement. |
| `GetProjectRisks` | Probability x impact matrix paired with a ranked risk list; selected matrix bubble and list row stay synchronized. | RAID type, minimum exposure, status, and owner filters; include-issues toggle. Select risk for mitigation, contingency, due date, and trend. |
| `GetProjectBudget` | Actual/committed/forecast bullet chart over approved baseline, followed by a compact variance waterfall and category legend. | Period, category, and baseline/forecast/proposed scenario controls; include-commitments toggle. Select a variance driver for evidence. |
| `GetProjectAiSpend` | AI spend control tower: actual/forecast line with budget guardrail, model/environment stacked mix, unit-cost indicator, and forecast-cap callout. | Period, model, environment, cost type, and group-by controls. Toggle projection and select a series/segment for usage and cost drivers. |
| `GetProjectTeamCapacity` | Person-by-week heatmap with portrait roster, role demand, overload state, and skill-gap markers; selected person detail sits below the heatmap. | Date range, role, person, and scenario filters; skill-gap toggle. Select a person/week and start a non-applied assignment scenario. |
| `CompareProjects` | Two-to-four project columns aligned on common scales, with status headers and owner avatars; dumbbell/slopegraph rows compare delivery, investment, value, risk, and capacity. | Project multi-select/reorder, comparison-dimension tabs, include-forecast and highlight-differences toggles. Select a row or open one project. |
| `GetPortfolioHealth` | Value-vs-risk bubble plot as the primary visual with RAG distribution and a synchronized top-exceptions list; bubble size encodes forecast investment. | Period, status, phase, sponsor, and focus filters. Select a bubble to inspect project evidence or drill into Project. |
| `GetStrategicAlignment` | Collapsible objective -> key result -> project Sankey/tree with contribution strength; unaligned investment appears as an explicit branch. | Objective, project, period, and minimum-contribution controls; include-unaligned toggle. Select a node/link for evidence and owner. |
| `GetPortfolioRoadmap` | Cross-project swimlane roadmap with phases, milestone diamonds, stage gates, launch collisions, and optional dependency arcs. | Date window, phase, project multi-select, milestone type, dependency toggle, and zoom. Select collision or milestone for impacted projects/owners. |
| `GetPortfolioBudgetForecast` | Portfolio variance waterfall plus investment-to-project-to-outcome Sankey drill-in; exact values remain in a compact ranked table. | Period, cost category, scenario, group-by, and variance-only controls. Select a waterfall driver or Sankey node to cross-filter. |
| `GetPortfolioAiSpend` | Hierarchical treemap/packed bubbles for project -> feature/model spend beside a monthly trend and model/provider mix. | Metric, period, project, model, environment, and group-by controls. Select tile to drill one level or inspect unit economics. |
| `GetPortfolioCapacity` | Demand-vs-supply horizon chart with role gaps, geographic capacity bubbles where useful, and a role-to-project resource-flow view. | Date range, role, skill, location, scenario, and open-role toggle. Adjust a safe what-if assumption; Reset restores approved baseline. |
| `GetPortfolioRiskExposure` | Radial/chord dependency view for systemic exposure paired with a concentration matrix and ranked propagation paths. | Period, risk type, minimum exposure, status, and dependency toggle. Select node/link to highlight affected projects and mitigations. |

### Review and decision inline blueprints - 5

| Component | Queue/review layout | Decision behavior |
| --- | --- | --- |
| `GetApprovalInbox` | Filterable 3-5 row approval queue with request type icon, requester avatar, project, amount/allocation/gate, due state, evidence percentage, and current status. Selecting Review replaces the queue with the owning request detail. | Approval-type, due, project, requester, amount, and status filters. Queue -> Review -> Approve/Return/Reject -> Confirm -> Receipt; Back restores queue selection and filter state. |
| `ReviewProjectRequest` | Requester/sponsor identity followed by business problem and a compact evidence scorecard for strategic fit, value, feasibility, risk, duplication, dates, and requested investment. Missing evidence is listed before controls. | Evidence focus tabs and optional comparison project. Approve, Return for changes, or Reject; Return/Reject requires rationale; confirmation names resulting intake status. |
| `ReviewProjectBudget` | Current/forecast/requested variance bridge with request purpose, alternatives, protected benefit, finance comments, and evidence receipt. Sensitive amounts respect the visibility property. | Period and evidence-section controls. Approve, Return, or Reject; consequence summary updates with decision; explicit confirmation and session receipt. |
| `ReviewResourceAssignment` | Proposed person/role/dates card beside approved-vs-proposed allocation bars, skill fit, conflicts, cost, and milestone impact. Slider/stepper previews a safer allocation without changing baseline. | Adjust allocation and dates in Scenario - not applied mode. Approve proposed scenario or Return with rationale; confirm displays person, project, period, and resulting load. |
| `ReviewStageGate` | Named gate header with owner/sponsor avatars, radial completion summary, authoritative exit-criteria checklist, unresolved RAID list, and spend/value evidence. | Focus tabs for criteria, risks, financials, and value. Approve is disabled while blocking criteria remain; Return/Reject requires rationale; confirmation produces decision receipt. |

### Request and submit inline blueprints - 6

| Component | Editable inline form | Validation, review, and receipt |
| --- | --- | --- |
| `SubmitWeeklyUpdate` | Project and week-ending controls; confidence segmented control; editable accomplishments and next-steps lists; blocker/help-needed fields with Add/Remove actions. | Validate project/date and meaningful content. Review groups changed fields and audiences; confirm creates status-report draft receipt. |
| `SubmitTimesheet` | Weekly day x project/work-category grid with editable hour cells, quick-add row, day totals, weekly total, capacity variance, notes, and copy-previous-day action. | Reject negative/invalid hours and flag daily/weekly overload. Review exact entries and total; confirm creates time-entry receipt and resets only by explicit command. |
| `SubmitProjectStatus` | Project/reporting-date header; separate RAG segmented controls for delivery, budget, scope, value, and risk; summary, accomplishments, next steps, help needed, milestone changes, and RAID changes. | Validate required narrative and reasons for red/amber overrides. Review shows current-vs-prior deltas; confirm creates report receipt. |
| `SubmitAiUsage` | Project/date/model/environment/feature controls; input/output token and request numeric fields; purpose, data classification, and attestation. Live cost preview updates beside the form. | Validate nonnegative volume, required purpose/classification, and attestation. Review usage and forecast impact; confirm creates usage-record receipt. |
| `SubmitProjectRequest` | Compact three-step inline stepper: Problem & value -> Ownership & alignment -> Dates, investment & AI classification. Each step shows completion state without nested cards; Back is visibly disabled on the first step and Next is visibly disabled on the final step. | Validate dates, sponsor, objective, expected value, cost, and AI classification. Review complete business case and approval path; confirm creates intake receipt. |
| `RequestAiBudget` | Current AI budget/consumption/forecast summary above amount, currency, needed-by date, category, model, environment, justification, and alternatives fields. Impact preview recalculates proposed cap and approval route. | Validate positive amount, date, justification, and at least one considered alternative. Review baseline vs proposed position; confirm creates budget-request receipt. |

All parameters below are optional. Empty input must render a useful default. Dates use ISO
`yyyy-mm-dd`; IDs use stable sample IDs. Runtime normalizers enforce bounds that component JSON schema
cannot safely express.

### My Work components - 6

| # | Component / manifest tool | Prompt intent and inline UX | Parameters that visibly change behavior | Full-screen destination |
| --- | --- | --- | --- | --- |
| 1 | `GetMyWorkSummary` / `GetMyWorkSummary` | "What needs my attention?" Personalized action brief with avatars, four KPIs, priority stack, and seven-day workload sparkline. | `period: today\|week\|month`; `projectId`; `focus: tasks\|capacity\|updates\|time`; `includeCompleted` changes ranking, counts, and sparkline window. | `my-work/summary` |
| 2 | `GetMyTasks` / `GetMyTasks` | "Show my blocked tasks for Customer Service Copilot." Compact grouped task board with due state, blockers, project color, owner/reviewer avatars, and quick status filter. | `projectId`; `status`; `due: overdue\|today\|week\|month`; `priority`; `groupBy: project\|status\|dueDate` changes records and layout. | `my-work/tasks` |
| 3 | `GetMyCapacity` / `GetMyCapacity` | "How does my capacity look next month?" Weekly stacked allocation with overload band, available hours, and scenario controls. | `startDate`; `endDate`; `projectId`; `includeOperationalWork`; `scenario: committed\|forecast` changes period, composition, and warning threshold. | `my-work/capacity` |
| 4 | `GetMyGoalContributions` / `GetMyGoalContributions` | "How is my work contributing to our AI adoption OKR?" Personal work-to-key-result map with contribution evidence and progress bars. | `objectiveId`; `period: quarter\|half\|year`; `projectId`; `includeIndirect` changes hierarchy depth and contribution scoring. | `my-work/goals` |
| 5 | `SubmitWeeklyUpdate` / `SubmitWeeklyUpdate` | "Draft my weekly update for Customer Service Copilot." Prompt-prefilled structured form for accomplishments, next steps, blockers, confidence, and help needed, followed by review and mock receipt. | `projectId`; `weekEnding`; `accomplishments`; `nextSteps`; `blockers`; `confidence: green\|amber\|red` prefills editable fields and summary. | `my-work/weekly-update` |
| 6 | `SubmitTimesheet` / `SubmitTimesheet` | "Log 6 hours to evaluation for yesterday." Day-by-day time grid with project/work-category split, capacity variance, validation, review, and mock submission. | `projectId`; `workDate`; `hours`; `workCategory`; `notes`; `weekEnding` prefills the matching row while preserving user review. | `my-work/timesheet` |

### Project components - 12

| # | Component / manifest tool | Prompt intent and inline UX | Parameters that visibly change behavior | Full-screen destination |
| --- | --- | --- | --- | --- |
| 7 | `GetProjectHealth` / `GetProjectHealth` | "How is Customer Service Copilot doing?" RAG scorecard with schedule, cost, scope, value, risk, and trend explanation. | `projectId`; `asOfDate`; `period`; `focus: delivery\|financials\|value\|risk`; `compareToBaseline` changes score weighting and evidence. | `project/health` |
| 8 | `GetProjectTimeline` / `GetProjectTimeline` | "Show the critical path through launch." Compact D3 timeline with baseline vs forecast, dependency links, slippage, and zoomed date window. | `projectId`; `startDate`; `endDate`; `workstream`; `criticalOnly`; `showBaseline` changes nodes, links, and comparison marks. | `project/timeline` |
| 9 | `GetProjectMilestones` / `GetProjectMilestones` | "What milestones are due this quarter?" Milestone strip with stage-gate badges, forecast dates, confidence, accountable-owner avatars, and missed-exit-criteria callout. | `projectId`; `period: month\|quarter\|year`; `status`; `milestoneId`; `includeCompleted` changes window and selected detail. | `project/milestones` |
| 10 | `GetProjectRisks` / `GetProjectRisks` | "Show high exposure AI risks." RAID-focused risk matrix with probability x impact, exposure trend, mitigation state, due date, and owner avatar. | `projectId`; `riskType`; `minimumExposure`; `status`; `ownerId`; `includeIssues` changes matrix population and ranked list. | `project/risks` |
| 11 | `GetProjectBudget` / `GetProjectBudget` | "Are we within budget and what is the forecast?" Baseline/actual/committed/forecast bullet chart with cost variance, burn rate, ETC, EAC, and category breakdown. | `projectId`; `period`; `costCategory`; `scenario: baseline\|forecast\|proposed`; `includeCommitments` changes measures and forecast. | `project/budget` |
| 12 | `GetProjectAiSpend` / `GetProjectAiSpend` | "Compare inference spend to AI budget this month." AI cost dashboard with token/inference trend, model and environment mix, unit cost, guardrail, and forecast-to-cap. | `projectId`; `period`; `model`; `environment`; `costType`; `groupBy: model\|feature\|environment`; `forecastThrough` changes chart grain and projection. | `project/ai-spend` |
| 13 | `GetProjectTeamCapacity` / `GetProjectTeamCapacity` | "Who is overallocated on this project next sprint?" Person-by-week capacity heatmap with role demand, actual/forecast toggle, skills gaps, and avatar roster. | `projectId`; `startDate`; `endDate`; `role`; `personId`; `scenario`; `showSkillGaps` changes heatmap and recommendations. | `project/team-capacity` |
| 14 | `SubmitProjectStatus` / `SubmitProjectStatus` | "Prepare the August project status report." Structured status report with RAG dimensions, narrative, milestone changes, decisions, RAID changes, and review receipt. | `projectId`; `reportingDate`; `overallStatus`; `summary`; `accomplishments`; `nextSteps`; `helpNeeded` prefills editable sections. | `project/status-report` |
| 15 | `SubmitAiUsage` / `SubmitAiUsage` | "Record 2.4 million GPT-5 evaluation tokens for the pilot." Usage intake with model, environment, feature, token/request volumes, cost preview, data classification, and attestation. | `projectId`; `usageDate`; `model`; `environment`; `feature`; `inputTokens`; `outputTokens`; `requests`; `purpose` drives calculated cost preview. | `project/ai-usage` |
| 16 | `SubmitProjectRequest` / `SubmitProjectRequest` | "Start a project request for a supplier risk agent." Progressive intake for problem, sponsor, objective, expected value, dates, cost range, AI classification, and review. | `title`; `businessProblem`; `sponsorId`; `objectiveId`; `targetStartDate`; `targetEndDate`; `estimatedBudget`; `aiEnabled` prefills the draft only. | `project/new-request` |
| 17 | `RequestAiBudget` / `RequestAiBudget` | "Request another $75k of AI budget for production." Budget-change form with current consumption, forecast, requested amount, period, justification, alternatives, and approval path preview. | `projectId`; `amount`; `currency`; `neededBy`; `budgetCategory`; `justification`; `model`; `environment` changes impact and routing preview. | `project/ai-budget-request` |
| 18 | `CompareProjects` / `CompareProjects` | "Compare Customer Service Copilot with Contract Intelligence." Purpose-built comparison canvas with aligned status dimensions, dumbbells and slopegraphs for change, milestone confidence, investment, value, risk, capacity, owner avatars, and the most decision-relevant differences. | `projectIds: string[]`; `period`; `compareOn: delivery\|financials\|value\|risk\|capacity`; `includeForecast`; `highlightDifferences` changes projects, evidence order, and visual emphasis. | `project/compare` |

### Portfolio components - 7

| # | Component / manifest tool | Prompt intent and inline UX | Parameters that visibly change behavior | Full-screen destination |
| --- | --- | --- | --- | --- |
| 19 | `GetPortfolioHealth` / `GetPortfolioHealth` | "How is the AI portfolio performing?" Executive KPI ribbon and value-vs-risk bubble plot with RAG distribution and top exceptions. | `portfolioId`; `period`; `status`; `phase`; `sponsorId`; `focus: delivery\|value\|financials\|risk` changes metrics and ranking. | `portfolio/health` |
| 20 | `GetStrategicAlignment` / `GetStrategicAlignment` | "Which projects support the responsible AI objective?" D3 objective/key-result/project tree with contribution strength, progress, confidence, and unaligned investment. | `portfolioId`; `objectiveId`; `projectId`; `period`; `minimumContribution`; `includeUnaligned` changes hierarchy and exception list. | `portfolio/strategy` |
| 21 | `GetPortfolioRoadmap` / `GetPortfolioRoadmap` | "Show launches and stage gates for the next two quarters." Cross-project roadmap with phases, milestones, dependencies, collisions, and owner avatars in details. | `portfolioId`; `startDate`; `endDate`; `phase`; `projectIds`; `milestoneType`; `showDependencies` changes lanes and links. | `portfolio/roadmap` |
| 22 | `GetPortfolioBudgetForecast` / `GetPortfolioBudgetForecast` | "Where will the portfolio exceed forecast?" Funding allocation and forecast waterfall with variance by project/category and scenario comparison. | `portfolioId`; `period`; `costCategory`; `scenario`; `groupBy: project\|category\|month`; `varianceOnly` changes aggregation and callouts. | `portfolio/budget` |
| 23 | `GetPortfolioAiSpend` / `GetPortfolioAiSpend` | "Which projects drive AI spend and unit-cost growth?" Ranked AI-spend treemap plus monthly forecast and model/provider mix. | `portfolioId`; `period`; `projectIds`; `model`; `environment`; `groupBy`; `metric: cost\|tokens\|requests\|unitCost` changes visual encoding. | `portfolio/ai-spend` |
| 24 | `GetPortfolioCapacity` / `GetPortfolioCapacity` | "Do we have enough AI engineering capacity next quarter?" Demand-vs-supply horizon with role gaps and D3 resource-flow view across projects. | `portfolioId`; `startDate`; `endDate`; `role`; `skill`; `location`; `scenario`; `includeOpenRoles` changes supply and gap calculations. | `portfolio/capacity` |
| 25 | `GetPortfolioRiskExposure` / `GetPortfolioRiskExposure` | "What are our systemic portfolio risks?" Aggregated exposure trend, concentration matrix, dependency propagation, and top mitigations. | `portfolioId`; `period`; `riskType`; `minimumExposure`; `status`; `includeDependencies` changes concentration and propagation view. | `portfolio/risks` |

### Approval and manager components - 5

| # | Component / manifest tool | Prompt intent and inline UX | Parameters that visibly change behavior | Full-screen destination |
| --- | --- | --- | --- | --- |
| 26 | `GetApprovalInbox` / `GetApprovalInbox` | "What approvals need me today?" Prioritized queue with due state, amount, evidence completeness, requester/sponsor avatars, and approval-type mix. | `approvalType`; `projectId`; `due: overdue\|today\|week`; `minimumAmount`; `requesterId`; `status` changes ranking and queue. | `approvals/inbox` |
| 27 | `ReviewProjectRequest` / `ReviewProjectRequest` | "Review the supplier risk agent proposal." Business-case scorecard with strategic fit, value, cost, feasibility, risk, duplicate-work check, and explicit decision workflow. | `requestId`; `focus`; `compareProjectId`; `decision: review\|approve\|return\|reject` can open a decision draft but never completes it. | `approvals/project-request` |
| 28 | `ReviewProjectBudget` / `ReviewProjectBudget` | "Review the extra AI budget request." Current/forecast/requested bridge with reason, alternatives, benefit impact, finance comments, and confirmation. | `approvalId`; `projectId`; `budgetType`; `period`; `decision`; `showSensitiveCosts` changes evidence and decision draft. | `approvals/budget` |
| 29 | `ReviewResourceAssignment` / `ReviewResourceAssignment` | "Can Pradeep join Customer Service Copilot at 40%?" Proposed assignment compared with current capacity, skills, conflicts, project impact, and approve/return flow. | `approvalId`; `projectId`; `personId`; `allocationPercent`; `startDate`; `endDate`; `role`; `decision` changes scenario calculations. | `approvals/resource-assignment` |
| 30 | `ReviewStageGate` / `ReviewStageGate` | "Is Customer Service Copilot ready to exit pilot?" Exit-criteria checklist, evidence completeness, unresolved RAID, spend/value summary, accountable avatars, and gate decision. | `approvalId`; `projectId`; `gateId`; `focus: criteria\|risks\|financials\|value`; `decision` changes evidence emphasis and draft. | `approvals/stage-gate` |

### Agent education component - 1

| # | Component / manifest tool | Prompt intent and inline UX | Parameters that visibly change behavior | Full-screen destination |
| --- | --- | --- | --- | --- |
| 31 | `ExploreAgentCapabilities` / `ExploreAgentCapabilities` | "What can this agent help me do?" Nontechnical scenario explorer grouped by My Work, Project delivery, Portfolio decisions, and Approvals. Search/category selection changes the scenario list; selecting a scenario reveals business value, a realistic prompt, and safe preview. | `category`; `audience`; `query`; `scenarioKey`; `tour: featured\|all` changes grouping, selected scenario, prompt, and preview. | `education/capabilities` (isolated gallery, not a fifth operational tab) |

The explorer advertises the 30 operational intents and excludes itself. Its content is derived from
education metadata on the canonical intent catalog, not maintained in a second static list.

## 6. Intent routing and parameter behavior

### Routing precedence

1. **Capability/help prompts win:** "what can you do?", "show available scenarios", "help me get
   started", or equivalent breadth/discovery language routes to `ExploreAgentCapabilities`.
2. **Decision verbs win:** approve, reject, return, review, or "ready to pass gate" route to the
   matching approval component, never a read-only budget or project-health component.
3. **Submission verbs win over summaries:** submit, log, record, draft, request, or report route to the
   owning form component.
4. **Explicit scope wins:** "portfolio" selects portfolio tools; a named project or `projectId` selects
   project tools; "my" and personal workload language selects My Work.
5. **Explicit multi-project comparison wins:** compare/versus language plus two or more named projects
   or `projectIds` routes to `CompareProjects`. Period comparison within one project remains with the
   owning health, budget, timeline, or AI-spend component.
6. **Metric nouns disambiguate:** AI usage entry -> `SubmitAiUsage`; AI spend analysis ->
   `GetProjectAiSpend` or `GetPortfolioAiSpend`; total budget -> budget components.
7. **Broad prompts use summary tools:** "What needs attention?" -> `GetMyWorkSummary`; "How is Project
   X?" -> `GetProjectHealth`; "How is the portfolio?" -> `GetPortfolioHealth`.
8. **Missing entity IDs remain visible:** use a safe default or selector, state the selected scope, and
   never silently combine projects.

### Prompt-to-component showcase set

| Prompt | Expected component | Parameter-driven keynote moment |
| --- | --- | --- |
| "What needs my attention this week?" | `GetMyWorkSummary` | Week window ranks a blocked task, overdue update, and pending time entry. |
| "Show only my blocked Customer Service Copilot tasks." | `GetMyTasks` | Project and status filters switch to a compact blocker group. |
| "How does my committed capacity look in September?" | `GetMyCapacity` | Date range and committed scenario expose a 112% week. |
| "Draft my weekly update with launch readiness as amber." | `SubmitWeeklyUpdate` | Extracted confidence and narrative appear as editable form values. |
| "Log 6 hours of model evaluation for yesterday." | `SubmitTimesheet` | Correct date and category row are prefilled; totals recalculate. |
| "How is Customer Service Copilot doing financially?" | `GetProjectHealth` | `focus=financials` promotes budget, AI spend, and EAC evidence. |
| "Compare Customer Service Copilot with Contract Intelligence on delivery and value." | `CompareProjects` | Two project IDs and comparison dimensions produce aligned small multiples, differences, owners, and a clear decision summary. |
| "Show only the critical path through production launch." | `GetProjectTimeline` | `criticalOnly=true` simplifies the dependency graph and reveals slippage. |
| "Compare August inference spend with budget." | `GetProjectAiSpend` | Monthly period and inference filter redraw actual, cap, and forecast. |
| "Record 2.4m GPT-5 evaluation tokens for the pilot." | `SubmitAiUsage` | Token volumes, model, environment, and cost preview are populated. |
| "Request $75k more production AI budget by October 1." | `RequestAiBudget` | Amount, environment, needed-by date, forecast impact, and approval route update. |
| "Which projects support Responsible AI adoption?" | `GetStrategicAlignment` | Objective filter expands only linked key results and projects. |
| "Show portfolio resource gaps for AI engineers next quarter." | `GetPortfolioCapacity` | Role, horizon, and scenario expose demand/supply gaps and project impact. |
| "What approvals need me before Friday?" | `GetApprovalInbox` | Due window reranks the queue and updates type/amount summaries. |
| "Can Pradeep join Customer Service Copilot at 40%?" | `ReviewResourceAssignment` | Person, project, dates, and allocation recalculate conflicts before review. |
| "Is Customer Service Copilot ready to exit pilot?" | `ReviewStageGate` | The current gate opens with unmet criteria and decision controls locked. |

### Change storytelling and safe scenario contract

- Major summary routes expose a consistent **What changed** mode when a prior snapshot exists. It shows
   the comparison period, changed values, new/resolved exceptions, accountable people, likely drivers,
   and the decision now required. It never hides the current absolute value behind a delta.
- `GetProjectHealth`, `CompareProjects`, `GetPortfolioHealth`, budget, AI-spend, capacity, risk, and
   roadmap routes share one typed snapshot/delta model so change claims reconcile across the product.
- A safe **What if** mode is available from `GetPortfolioCapacity` and `ReviewResourceAssignment`.
   Users can vary person, role, allocation, dates, project, and approved scenario assumptions.
- Scenario previews recalculate capacity, schedule exposure, forecast cost, strategic-value risk, and
   affected milestones in memory. The approved baseline stays visible and unchanged.
- Proposed changes are visually labeled **Scenario - not applied**. Moving from exploration to an
   approval draft requires a deliberate command, review, and confirmation; no chart gesture commits data.

### Tool-description quality rules

- Each manifest description names the phrases and user outcome it owns.
- Sibling descriptions explicitly distinguish analysis, submission, request, and approval.
- No public generic `view` parameter multiplexes sibling components.
- Parameters exist only when they visibly change initial rendering or editable defaults.
- Every normalizer handles missing, partial, stale, and unrecognized values without throwing.
- Routing tests include positive matches, sibling collisions, broad defaults, and parameter extraction.

## 7. Visualization-as-code plan

The linked Fabric Apps article is inspiration for a code-first visual pipeline, not a proposal to turn
this SPFx sample into a Fabric App. We will keep the same useful separation: typed data adapter,
declarative visual specification, renderer, interaction state, theme mapping, and accessible summary.

### Library responsibilities

| Technology | Use | Planned examples |
| --- | --- | --- |
| **Vega-Lite** | Default for declarative analytical visuals, consistent scales, tooltips, selection, projection, and cross-filtering. | Workload trend, risk matrix, budget bullet, spend trend, value-risk scatter, geographic point/bubble map, forecast waterfall, heatmap. |
| **Vega** | Use where lower-level marks, projections, or signal control materially improve the experience. | Layered baseline/forecast roadmap, connected geographic flow map, or high-density approval evidence where Vega-Lite is insufficient. |
| **D3.js modules** | Bespoke layouts and interactions that are awkward in a grammar-of-graphics chart. | Critical-path timeline, OKR hierarchy, Sankey resource/funding flow, radial dependency view, force-directed dependency map, and geographic overlays. |
| **Fluent UI + semantic HTML** | Controls, KPI tiles, legends, tables, forms, badges, menus, and chart summaries. | All component chrome and accessible alternatives. |
| **CSS/SVG microvisuals** | Tiny indicators where loading a chart engine would be wasteful. | Sparklines, progress rings, status strips, compact allocation bars. |

### Visual design rules

- Start each visual specification with the decision question it answers.
- Use one shared semantic color registry: neutral, success, warning, danger, information, selection,
  actual, baseline, forecast, and proposed scenario. Never rely on hue alone.
- Reserve red/amber/green for status meaning. Project colors identify entities but never health.
- Use direct labels where practical, restrained gridlines, precise units, and a visible as-of date.
- Cross-filter only when the affected visuals clearly show the active selection and a Reset command.
- Tooltips supplement visible content; they never contain the only project, value, or status label.
- Every chart has a concise textual insight and accessible table/list alternative.
- SVG receives a title and description; canvas-based output receives an equivalent adjacent summary.
- D3 renderers expose keyboard-selectable nodes/rows and do not require drag or hover.
- Respect `prefers-reduced-motion`; transitions explain state changes but never delay task completion.
- Lazy-load chart engines for components that need them and measure bundle impact before scaling out.
- Advanced chart types must earn their place. A map requires a geographic decision, a Sankey chart
   requires meaningful flow, and a radial chart requires cyclic, hierarchical, or proportional data.
   If a sorted bar chart answers the question more clearly, use the bar chart.
- Geographic views use bundled simplified GeoJSON or TopoJSON, never a runtime tile service. Regions
   have direct labels or an adjacent ranked list, and the same values remain available without the map.
- Map size, Sankey link width, radial angle, bubble area, and node proximity are never the sole carriers
   of meaning. Pair them with labels, legends, summaries, and keyboard-reachable details.

### Chart and presentation repertoire

| Visual pattern | Decision question | Primary destination | Interaction and presentation treatment |
| --- | --- | --- | --- |
| **Geographic choropleth** | Where are delivery risk, adoption, benefits, or capacity gaps concentrated? | `portfolio/health` or `portfolio/capacity` | Region fill uses a sequential scale; selection filters a ranked project/person list; missing regions are visibly hatched. |
| **Proportional-symbol bubble map** | Which office or market combines the greatest investment, adoption, and delivery exposure? | `portfolio/health` | Bubble area encodes investment, color encodes risk, and a selection halo is separate from status color. |
| **Arc/flow map** | How do scarce skills, shared platforms, or dependencies move between delivery locations? | `portfolio/capacity` | Curved links are filtered to the selected role/project; directional markers and an adjacent flow table prevent ambiguity. |
| **Sankey chart** | How does approved funding or available capacity flow from portfolio to project, workstream, and outcome? | `portfolio/budget` and `portfolio/capacity` | Links reveal source-to-destination flow; selecting a node isolates its path and updates totals without animated clutter. |
| **Radial progress constellation** | Which project dimensions or stage-gate criteria are complete, at risk, or blocked? | `project/health` and `approvals/stage-gate` | Segmented arcs show named dimensions around a central status; use for compact overview, never precise comparison. |
| **Radial dependency/chord view** | Which projects share the most consequential dependencies or risk propagation paths? | `portfolio/risks` | Default to the highest-impact subset, pair with ranked edges, and offer a linear dependency-table mode. |
| **Packed bubbles / circle packing** | Which AI features or models dominate spend within projects and portfolios? | `project/ai-spend` and `portfolio/ai-spend` | Hierarchical grouping supports drill-in; area is paired with amount and percent labels in details. |
| **Treemap** | How is a finite budget or usage total composed? | `portfolio/ai-spend` | Use when hierarchy matters more than comparison; pin top labels and collect tiny values into an explicit Other group. |
| **Marimekko / mosaic** | How do project phase and health combine across investment or capacity? | `portfolio/health` | Width and height carry different measures; an adjacent matrix provides exact values. |
| **Horizon/stream view** | When will portfolio demand exceed role supply or AI spend breach its guardrail? | `portfolio/capacity` and AI-spend routes | Emphasize crossing points and confidence bands rather than decorative waves. |
| **Calendar heatmap** | When are personal workload, submission gaps, or milestone collisions concentrated? | `my-work/capacity`, `my-work/timesheet`, `portfolio/roadmap` | Keyboard navigation follows date order; today, weekends, and selected period remain distinct. |
| **Waterfall and variance bridge** | What changed baseline into current forecast or requested EAC? | Budget and approval routes | Direct labels explain each driver; totals and subtotals remain visually distinct. |
| **Critical-path timeline** | Which dependency currently determines the delivery date? | `project/timeline` | Baseline and forecast align on one time scale; selected predecessor chain is emphasized and narrated. |

### Signature visuals

1. **Portfolio value-risk constellation:** bubble size = forecast investment, x = strategic value,
   y = delivery risk, shape = phase, ring = AI-enabled; selecting a bubble cross-filters exceptions.
2. **AI spend control tower:** actual and forecast line, budget guardrail, model/feature composition,
   unit-cost slope, and an explainable forecast-cap date.
3. **Resource horizon:** role demand vs supply by week with a D3 flow from scarce skills to projects;
   selection previews a staffing scenario without changing records.
4. **Critical-path story:** baseline and forecast task bars, dependency links, delayed milestones, and a
   compact explanation of which predecessor drives the launch date.
5. **Strategy alignment tree:** Objective -> Key Result -> Project -> measurable contribution evidence,
   with unaligned investment intentionally visible.
6. **Approval evidence bridge:** current forecast + request = proposed EAC, with benefits, alternatives,
   and unresolved risks adjacent to the decision rather than hidden in another screen.
7. **Global delivery bubble map:** office/market bubbles combine forecast investment, adoption, and RAG
   exposure; selecting a location cross-filters projects and resource gaps.
8. **Investment-to-outcome Sankey:** approved portfolio funding flows through projects and AI features
   to measurable key results, exposing leakage, concentration, and unaligned spend.
9. **Stage-gate radial:** a compact, labeled ring shows exit-criteria completion around the current gate,
   while the adjacent linear checklist remains the authoritative decision surface.
10. **Project comparison studio:** aligned small multiples, slopegraphs, milestone confidence, owner
   avatars, and a ranked difference narrative make two-to-four projects comparable without a dense
   scorecard wall.
11. **Change story:** an animated-but-reduced-motion-safe before/after sequence connects changed metric,
   driver, affected person or milestone, evidence, and required decision in one reading path.
12. **Resource what-if:** adjusting Pradeep's proposed allocation redraws capacity, project impact, cost,
   and milestone exposure while the approved baseline remains pinned beside the scenario.

## 8. Mock domain model and coherent demo story

### Industry-standard entities

- `Person`, `Role`, `Skill`, `Team`, `CapacityCalendar`, `ResourceAllocation`.
- `Location`, `Office`, `Market`, and `DeliveryRegion` with stable coordinates and region identifiers for
   offline geographic views; no precise personal location data is modeled.
- `Portfolio`, `StrategicObjective`, `KeyResult`, `Project`, `Workstream`, `WorkItem`.
- `ProjectPhase`, `StageGate`, `Milestone`, `Dependency`, `Decision`, `ChangeRequest`.
- `RaidItem` with Risk, Assumption, Issue, and Dependency types; probability, impact, exposure,
  mitigation, contingency, owner, and due date.
- `BudgetBaseline`, `ActualCost`, `Commitment`, `Forecast`, `EstimateToComplete`,
  `EstimateAtCompletion`, and `BenefitForecast`.
- `AiUsageRecord` with model, provider, feature, environment, input/output tokens, requests, unit cost,
  data classification, purpose, and attestation.
- `WeeklyStatusReport`, `TimeEntry`, `ProjectRequest`, `BudgetRequest`, `ApprovalRequest`, and
  `ApprovalDecision`.
- `ProjectSnapshot`, `PortfolioSnapshot`, `MetricDelta`, and `ScenarioDefinition` for consistent
   what-changed and what-if experiences across inline and full-screen routes.

### Metric semantics

- RAG health is deterministic from thresholds and can be overridden only with an explicit reason.
- Schedule variance compares forecast milestone date with approved baseline.
- Cost variance compares earned/actual position with baseline; EAC = actual + estimate to complete.
- AI budget consumption separates actual, committed, forecast, and requested amounts.
- Capacity uses working hours minus leave and operational commitments; allocation over 100% is an
  error state and 90-100% is a warning by default.
- Risk exposure = probability x impact, with trend based on prior snapshots.
- Strategic contribution links measurable project outcomes to key-result movement; no vague AI score.
- All calculated values have focused tests and visible formatting rules.

### Seed scale

| Entity | Target volume | Purpose |
| --- | --- | --- |
| Portfolios | 2 | One primary AI Transformation portfolio and one comparison portfolio. |
| Strategic objectives / key results | 5 / 14 | Enough hierarchy for alignment and unaligned-investment views. |
| Projects | 8 active + 2 proposed | Green, amber, red, paused, intake, and stage-gate examples. |
| Work items / milestones / dependencies | 72 / 28 / 24 | Credible task, roadmap, and critical-path density. |
| RAID items / decisions | 24 / 12 | Mix of systemic AI risk and normal delivery governance. |
| Resource allocations / time entries | 40 / 60 | Personal, project, and portfolio capacity stories. |
| Financial periods / AI usage records | 12 months / 90 records | Trend, forecast, variance, and unit-economics visuals. |
| Approval requests | 10 | Project, budget, resource, and stage-gate queue states. |

### Primary project story as of 2026-08-18

| Project | Phase / health | Project manager / sponsor | Key demo state |
| --- | --- | --- | --- |
| Customer Service Copilot (`PRJ-2601`) | Pilot / Amber | Megan Bowen / Joni Sherman | Production gate on 2026-09-30; eight-day forecast slip; AI budget 81% consumed; one Responsible AI criterion open. |
| Demand Forecasting Modernization (`PRJ-2602`) | Execute / Green | Isaiah Langer / Johanna Lorenz | Strong value realization; data-engineering capacity pressure next quarter. |
| Contract Intelligence (`PRJ-2603`) | Validate / Red | Pradeep Gupta / Grady Archie | Supplier delay and security issue; funding change awaiting review. |
| Knowledge Discovery Platform (`PRJ-2604`) | Execute / Green | Diego Siciliani / Joni Sherman | Shared dependency for three projects; model unit cost improving. |
| Sales Meeting Assistant (`PRJ-2605`) | Discover / Amber | Lee Gu / Johanna Lorenz | Adoption evidence incomplete; design research milestone at risk. |
| Supply Chain Exception Agent (`PRJ-2606`) | Intake / Proposed | Patti Fernandez / Joni Sherman | New request with high strategic fit and incomplete benefit baseline. |
| Responsible AI Controls (`PRJ-2607`) | Execute / Green | Nestor Wilke / Joni Sherman | Portfolio dependency and key-result contribution across all AI projects. |
| Invoice Processing Automation (`PRJ-2608`) | Close / Green | Miriam Graham / Grady Archie | Benefits validation and lessons learned pending before closure. |

### People and face assets

Source every person image from `D:\git\spfx-copilot-apps-vesa\samples\my-day\assets\faces`.
During implementation, copy/embed the assets into this sample so it has no cross-sample runtime path.

| Person | Sample role | Asset |
| --- | --- | --- |
| Megan Bowen | Senior Program Manager; current user | `Megan-Bowen.jpeg` |
| Joni Sherman | VP, Digital Strategy; portfolio sponsor | `Joni-Sherman.jpeg` |
| Johanna Lorenz | Product Director | `Johanna-Lorenz.jpeg` |
| Diego Siciliani | Engineering Manager | `Diego-Siciliani.jpeg` |
| Pradeep Gupta | AI Platform Lead | `Pradeep-Gupta.jpeg` |
| Miriam Graham | Finance Business Partner | `Miriam-Graham.jpeg` |
| Lee Gu | UX and Adoption Lead | `Lee-Gu.jpeg` |
| Nestor Wilke | Security and Responsible AI Lead | `Nestor-Wilke.jpeg` |
| Patti Fernandez | Change Management Lead | `Patti-Fernandez.jpeg` |
| Isaiah Langer | Data Engineering Lead | `Isaiah-Langer.jpeg` |
| Grady Archie | Procurement Lead | `Grady-Archie.jpeg` |

**Avatar rule:** whenever a person's name, assignment, request, approval, risk ownership, project
ownership, review, or comment is visible, render their image next to the reference. Use accessible
name text and initials fallback; never show an anonymous generic icon for a known sample person.

### Time and scenario behavior

- Store seed dates as offsets from a resolved demo clock and memoize that clock per component mount.
- Use 2026-08-18 only as the review snapshot; production demo copy remains relative and future-safe.
- Add deterministic scenarios: `Leadership demo`, `Portfolio healthy`, and `Capacity pressure`.
- Scenario switching replaces the complete coherent dataset, not isolated chart values.
- Show the active scenario in a quiet developer/demo control, never as normal production chrome.
- No random values, `Math.random`, unstable sorting, or current-time changes during an interaction.

## 9. Technical architecture plan

### Reuse from the reference sample

- React 17 host with Fluent UI v9 and Griffel theme tokens.
- One shared intent-component base that owns React mount/unmount, host theme, display mode, and expand.
- One shared full-screen shell rendered by every component in full-screen mode.
- Typed fixed intent definitions, parameter normalizers, fresh-invocation versioning, and typed routes.
- Stateless mock service interfaces, Graph-shaped raw data, lean view models, and relative-date resolver.
- Reusable avatar, metric, status, banner, details panel, receipt, and accessibility components.
- Offline embedded images, deterministic AI-style summaries, and reduced-motion support.
- One component manifest, GUID, bundle, registration, Zod schema, and focused test slice per intent.

### Improvements over the reference

- Four role-oriented primary tabs instead of ten domain families.
- Project hierarchy and selectors: Portfolio -> Project -> Workstream -> Work item.
- Central metric dictionary so inline and full-screen values cannot disagree.
- Dedicated chart-spec and chart-data layers with shared theme and accessible summary contracts.
- Cross-filter state that is explicit, resettable, route-aware, and testable.
- Reusable review/confirm/receipt state machine for all submissions and decisions.
- Scenario engine for coherent healthy, at-risk, and capacity-pressure demo paths.
- Role-shaped visibility and confidentiality labels for financial, staffing, and project-intake data.
- Catalog-driven end-user capability education with realistic prompts and safe live previews.

### Agent Capability Explorer architecture

`ExploreAgentCapabilities` is a generated Copilot Component and a reusable education experience, not a
hard-coded Zava help page. Extend each of the 30 operational intent definitions with:

```ts
interface ICapabilityEducationDefinition {
   scenarioName: string;            // nontechnical, outcome-oriented
   businessOutcome: string;         // one sentence
   category: 'my-work' | 'project' | 'portfolio' | 'approvals';
   audience: string[];
   operation: 'information' | 'review' | 'submit';
   examplePrompt: string;           // realistic mock names/entities
   tags: string[];
   featuredRank?: number;
   previewProperties: IProjectIntentProperties;
   previewSafety: 'read-only' | 'stop-before-confirm';
}
```

- Derive categories, counts, search index, featured tour, prompt text, and preview adapters from
   `PROJECT_INTENT_CATALOG`. The explorer excludes `ExploreAgentCapabilities` from advertised scenarios.
- Add a dedicated `education` operation to intent routing. Do not inflate the 19 information / 5 review /
   6 submit counts; the final split becomes 30 operational + 1 education.
- Use a reusable `capabilityExplorer/` module for category navigation, scenario list/detail, prompt
   actions, preview boundary, featured tour, and tests. Inject Zava metadata through the catalog.
- Add `ICapabilityPromptAction` with feature detection. Use a verified host prompt-submit API when
   available; otherwise expose `Copy prompt` with success/error feedback and an instruction to send it
   in the current conversation. Do not invent an unsupported Copilot host API.
- Preview the selected scenario through the shared React experience/router using
   `previewProperties`, but suppress the nested global header/full-screen button. Use an isolated keyed
   boundary so scenario changes reset preview state only.
- Preview mode is deterministic and safe: information tools remain interactive; review/submit previews
   stop before final confirmation, display `Demo preview - no action applied`, and cannot update the
   session action store.
- Inline layout: category control + searchable scenario list + selected business outcome/prompt/preview.
   Avoid 30 equal cards and all technical tool/component language.
- Full-screen route `education/capabilities` is isolated from the four operational tabs. It adds search,
   category/audience/outcome filters, Previous/Next, featured tour, larger preview, prompt action, and
   Reset preview. It does not become a fifth primary workspace tab.

### Proposed source organization

```text
src/copilotComponents/
  getMyWorkSummary/                 # existing starter evolves into first intent
  getMyTasks/
   exploreAgentCapabilities/       # generated education/discovery component
  ...                              # one generated folder per remaining intent
  shared/
    components/                    # Fluent primitives and domain UI
    experiences/                   # inline roots, shell, tab routes, panels
   capabilityExplorer/            # reusable catalog, filters, prompt actions, safe preview/gallery
    intents/                       # definitions, normalizers, route registry
    models/                        # raw domain, view models, navigation, metrics
    mockData/                      # people, projects, work, RAID, finance, usage
    services/                      # interfaces, mock service, mapping, ranking
    state/                         # filters, scenario, review/confirm workflows
    theme/                         # semantic colors, chart theme, tab accents
    visualizations/
      adapters/                    # typed domain data -> chart rows/nodes
      specs/                       # Vega/Vega-Lite specifications
      renderers/                   # Vega and D3 React hosts
      summaries/                   # accessible text/table equivalents
    utils/                         # dates, currency, calculations, focus, motion
```

### Dependency direction

```text
Generated component -> intent definition -> shared React host
Shared React host -> inline route OR full-screen shell
Route -> service interface -> mock service -> raw mock data
Route -> view model -> visualization adapter -> spec/renderer + accessible summary
Form/approval route -> shared review state machine -> mock receipt service
```

### Dependency candidates to validate before installation

- `react@17.0.1`, `react-dom@17.0.1`, matching React type packages.
- `@fluentui/react-components`, `@fluentui/react-icons`, and `@griffel/react` pinned to the proven
  SPFx-compatible reference versions unless the current build requires a newer compatible patch.
- `vega`, `vega-lite`, and optionally `vega-embed` after a bundle/CSP rendering spike.
- Focused D3 modules rather than the full package where practical: selection, scale, shape, hierarchy,
  force, zoom, array, time-format, and corresponding type packages.
- No dependency is added until the approved Phase 1 spike verifies SPFx packaging and host CSP.

## 10. Interaction, safety, and state rules

### Read-only analysis components

- Show selected scope, active filters, as-of date, and data provenance.
- Explain status or recommendation with the top contributing records.
- Empty, loading, error, and no-match states preserve a useful next step.
- Selection in an inline chart can open a compact detail, but Expand retains that selection.

### Forms and submissions

1. **Draft:** prompt parameters prefill visible editable fields.
2. **Validate:** required values, dates, hours, budget, classifications, and conflicts are checked.
3. **Review:** show exactly what will be mocked, calculated consequences, and approval path.
4. **Confirm:** use an explicit command; never trigger from initial render or prompt extraction.
5. **Receipt:** show stable sample ID, timestamp, actor avatar, status, and what would happen next.

### Approval decisions

- Separate evidence state from decision state.
- Opening with `decision=approve` may preselect a draft choice but cannot enable final confirmation until
  required evidence has been viewed.
- Approve summarizes consequences; Return and Reject require comments.
- Decision receipts retain the original requester and decision-maker avatars.
- Mock state changes are session-local and offer Reset demo data.

### AI honesty

- AI-style summaries are deterministic compositions from mock records.
- Use a fixed disclosure in generated insight panels:

  > AI-style insights in this demo are generated locally from sample data. No AI service is called,
  > and confirmed actions are not saved to a system of record.

- Never claim prediction confidence, causal inference, or optimization beyond the implemented formula.

## 11. Visual language

- Quiet, information-dense operational product rather than a marketing dashboard.
- Establish a deliberate **2026 enterprise data-product** direction: crisp editorial hierarchy,
   asymmetric but aligned analytical compositions, compact command surfaces, layered neutral depth,
   and a few confident data-led focal moments. It should feel designed for repeated PMO work, not
   generated from a generic dashboard prompt.
- Avoid recognizable "AI slop" signatures: no oversized gradient headline, glass cards, glowing
   borders, floating blobs, decorative sparkle fields, generic assistant copy, excessive pill controls,
   or a uniform grid of interchangeable KPI cards.
- Zava brand signal in the shell; distinct tab accents used sparingly and consistently.
- White/neutral canvas in light mode and Fluent neutral surfaces in dark mode; avoid one-hue layouts.
- Status colors have icons and labels. Selection uses a separate blue treatment.
- Cards only for individual repeated entities, approvals, or bounded tools; no cards nested in cards.
- Full-width sections and aligned grid tracks keep complex dashboards readable.
- Expressive but restrained typography using the reference sample's established product type choices.
- Stable chart dimensions and skeletons prevent layout movement during selection or loading.
- Person rows reserve avatar space so names, roles, and status never shift.
- Motion is limited to route entry, cross-filter update, panel reveal, and mock insight sequencing.
- Let maps, Sankey flows, radial summaries, and timelines occasionally break the base grid when their
   data story benefits, while preserving alignment, stable dimensions, and visible neighboring context.
- Use visual density intentionally: one dominant analytical visual, one supporting evidence region,
   and one clear action area per viewport is preferable to six equally weighted charts.

## 12. Accessibility, responsive, and quality requirements

### Worldwide readiness

- Format dates, times, numbers, compact notation, percentages, currency, and plural-sensitive copy with
   locale-aware APIs; never concatenate presentation strings in chart adapters.
- Use stable IDs and neutral mock semantics so display names, project titles, labels, and descriptions
   can be localized without changing calculations or routing.
- Stress-test at least `en-US`, `fi-FI`, `de-DE`, `ja-JP`, and `ar-SA`, including USD/EUR/JPY display,
   long translated labels, different week starts, and right-to-left shell/chart-summary layout.
- Maps use internationally recognizable region labels and avoid implying that office geography equals
   employee nationality, identity, or precise location.
- Use globally understandable status language, icons, and units. Explain PMO abbreviations such as EAC
   and RAID on first use in user-facing details.
- Worldwide readiness is a layout and formatting quality gate for the sample; full human translation of
   all copy remains a follow-up unless localized resources are approved for the first release.

### Accessibility

- WCAG 2.2 AA contrast for text, controls, chart marks, focus indicators, and status combinations.
- Full keyboard operation for tabs, selectors, charts, task groups, approval queues, panels, and forms.
- Correct tab semantics, heading hierarchy, landmarks, live regions, validation summaries, and focus
  restoration.
- 44 px minimum touch targets where the host size permits; compact inline controls remain at least 32 px.
- Reduced-motion mode removes sequencing delays and nonessential transitions.
- 200% zoom and Windows high-contrast checks.
- Every chart has an insight sentence and data table/list equivalent reachable from the chart toolbar.

### Responsive checkpoints

| Context | Expected behavior |
| --- | --- |
| Inline 320-399 px | One-column content, compact chart, no clipped labels, essential actions only. |
| Inline 400-640 px | Two-column metrics where readable; forms remain single column. |
| Full-screen mobile < 600 px | Scrollable tab list, queue-first approval steps, detail as a full-width route. |
| Tablet 600-1023 px | Two-column dashboards; details overlay; charts keep minimum useful height. |
| Desktop 1024-1599 px | Full dashboard grids; optional sibling detail panel. |
| Projector >= 1600 px | Constrained readable content width; charts expand without oversized typography. |

### Performance and reliability

- No runtime network requests for data, avatars, fonts, or visual specifications.
- Lazy-load Vega/D3 only for routes that use them; cache parsed specifications by theme.
- Avoid rerendering all charts for unrelated panel or form state.
- Measure component bundle output after the visualization spike and define a budget before Phase 4.
- No console errors, unhandled promise rejections, duplicate element IDs, or leaked event listeners.
- Deterministic sorting and stable keys across every list and chart.

## 13. Delivery phases and gates

### Phase 0 - Review and freeze the experience contract

- [x] Approve product name, 30-component scope, four tab labels, current persona, currency, and mock story.
- [x] Approve removal of the untouched `ProjectTracker` placeholder and clean Yeoman generation of
   `GetMyWorkSummary`; never rename, copy, or transfer the placeholder identity.
- [x] Review each component for distinct intent, useful parameter variation, and full-screen destination.
- [x] Confirm no component can be replaced by a parameter variant of a stronger sibling.
- [x] Approve D3 as the primary bespoke visualization library; keep Vega/Vega-Lite optional where a
      declarative specification is clearer and smaller.
- [x] Approve the top-right View in full screen affordance, horizontal tab model, top-right settings
   gear, and the 2026 enterprise data-product visual direction.
- [x] Approve which geographic, Sankey, radial, bubble, hierarchy, and flow views answer real demo
   decisions; reject advanced charts that are present only for novelty.
- [x] Approve the avatar rule and roles assigned to the 11 supplied people.
- [x] Approve the ten-second keynote standard, what-changed model, safe what-if model, worldwide locale
   stress set, and first three showcase slices.
- [x] Decide documentation split: keep this file canonical through baseline delivery, then publish the
      UX contract, component catalog, and demo-prompt guide during Phase 12.
- [x] Freeze Phase 1 only after review notes are incorporated here.

**Gate:** written scope approval; no source or manifest edits before this gate.

### Phase 1 - Foundation and technical spikes

- [x] Capture the untouched clean production build result and original placeholder identity.
- [x] Add pinned React 17, Fluent UI, Griffel, focused D3 modules, optional Vega/Vega-Lite, and matching types.
- [x] Remove the untouched `ProjectTracker` placeholder through the approved scaffold-cleanup step,
      generate `GetMyWorkSummary` with its final name through Yeoman, and implement the first shared
      React intent host without renaming or repurposing generated artifacts.
- [x] Revise the spike after library review: render D3-generated inline geometry now; deliver the
   decision-specific Sankey, radial, geographic, and optional Vega views with full-screen routes.
- [x] Verify local theme changes, 340px container resize behavior, React teardown compilation, and
   production bundle output.
- [x] Complete all locally executable host-boundary work. The authenticated CSP,
   `requestDisplayModeAsync('fullscreen')`, iframe-focus, high-contrast, and screen-reader smoke is
   consolidated into the canonical external Phase 11 tenant gate.
- [x] Define the baseline performance budget: <= 550 KB per production component bundle and <= 12 MB
   compressed `.sppkg`; measured baseline is about 501 KB per bundle and 10.7 MB packaged.
- [x] Establish Jest support and run clean compile/lint/test gates with zero warnings.

**Gate:** one inline component expands correctly; both chart paths work; `heft test --clean` passes.

### Phase 2 - Domain model, mock story, and avatars

- [x] Define source-shaped project/portfolio entities, lean view models, metric definitions, typed routes, and roles.
- [x] Implement a deterministic supplied clock and three coherent scenarios.
- [x] Seed projects, objectives, work, milestones, RAID, financials, AI usage, allocations, and approvals.
- [x] Seed reconciled prior snapshots and scenario definitions for What changed and What if experiences.
- [x] Add a typed service interface and stateless mock implementation.
- [x] Copy/embed all 11 face assets, prefer usable host-provided photos, and test bundled/initials fallback behavior.
- [x] Add calculation tests for health, schedule, cost variance, AI budget, capacity, risk, and portfolio value.
- [x] Add referential-integrity tests for every person, project, objective, work item, milestone, risk,
   allocation, usage record, request, approval, route, and portrait.

**Gate:** all views can derive from one coherent offline dataset and relative dates remain valid.

### Phase 2 inline baseline checkpoint

- [x] Generate all 30 components with final immutable names through SharePoint Yeoman.
- [x] Verify 30 unique manifests, GUIDs, bundles, localized resources, and agent registrations.
- [x] Replace scaffold `message` properties with 183 optional, described, behavior-changing prompt fields.
- [x] Add 30 distinct tool descriptions and precedence-based declarative-agent routing instructions.
- [x] Render all 30 baseline inline intents through one shared React/Fluent host with decision-specific
   titles, metrics, insights, D3 visual geometry, real portraits, and accessible SVG summaries.
- [x] Implement and visually validate the consistent top-right View in full screen control.
- [x] Target Griffel's `RendererProvider` and Fluent's provider at the component `ownerDocument`, with
   a one-time post-commit remount, so online Copilot Workbench iframes receive generated styles.
- [x] Validate all 30 intents at 340px and 760px in light and dark mode: 120 states, zero overflow,
   broken images, unlabeled analytical charts, or runtime errors.
- [x] Pass the catalog/media audits, 24 focused tests including owner-document style insertion,
   zero-warning clean build, and production packaging.

**Checkpoint boundary:** this completes the reviewable baseline inline portfolio. Editable workflow
controls, receipts, detailed per-intent visualizations, fresh-invocation state, and the shared four-tab
full-screen shell remain in their owning later phases and are not claimed complete here.

### Phase 2B - Purpose-designed inline UX redesign

> The shared baseline body is superseded by the Section 5 blueprints. Keep the validated provider,
> header, branding, portraits, routing, schemas, data service, and fullscreen control; replace the body
> with operation-specific experiences before Phase 3 full-screen implementation begins.

#### Information and status experiences

- [x] Implement the four unique My Work information layouts: attention stack, task board/list, capacity
   horizon, and goal-contribution flow, including their specified filters and selected-detail states.
- [x] Implement the eight unique Project information layouts: health ring, critical-path Gantt,
   milestone rail, risk matrix, budget bullet/waterfall, AI spend control tower, team heatmap, and
   aligned project comparison studio.
- [x] Implement the seven unique Portfolio information layouts: value-risk bubbles, strategy tree/Sankey,
   swimlane roadmap, budget waterfall/Sankey, AI-spend treemap, capacity horizon/flow, and systemic
   risk radial/matrix.
- [x] Verify every retained filter/control changes records, aggregation, chart marks, calculations, or
   selected evidence; remove unsupported decorative affordances.
- [x] Add table-driven useful-default coverage for all 19 information intents plus grouped filtered,
   selected-detail, no-match, and shared error-fallback tests.

#### Review and decision experiences

- [x] Implement `GetApprovalInbox` as a filterable request queue that launches the selected inline review.
- [x] Implement purpose-specific evidence views for project request, budget, resource assignment, and
   stage gate; do not reuse one generic scorecard body.
- [x] Implement shared Queue -> Review -> Decision draft -> Confirm -> Receipt mechanics while keeping
   component-specific evidence, consequences, validation, and decision commands.
- [x] Require reviewer-entered rationale for Return/Reject, prevent blocked gate and overloaded-resource
   approvals, preserve queue/filter state, and show processed status when returning from the receipt.
- [x] Add queue-count, selection, confirmation, receipt, updated-queue, rationale, and decision-safeguard
   tests for all five components. Keyboard focus-restoration testing remains in the final accessibility gate.

#### Request and submit experiences

- [x] Implement six real editable forms: weekly update, timesheet grid, project status report, AI usage,
   stepped project request, and AI budget request.
- [x] Make Delivery, Budget, Scope, Value, and Risk independently selectable as semantic Green/Amber/Red
   states in `SubmitProjectStatus`, and preserve icon/color/meaning badges through review.
- [x] Replace the generic submit review and receipt with distinct weekly-update, timesheet, project-status,
   AI-usage, and project-request experiences whose content is backed by each form's live draft values.
- [x] Apply fresh prompt properties only to initial draft values; preserve edits on passive host rerenders.
- [x] Implement component-specific derived calculations, validation summaries, review screens, explicit
   confirmation, session-local receipts, and Reset/Edit commands.
- [x] Verify no prompt value, form change, chart selection, or initial render submits data automatically.
- [x] Add prompt-prefill, visible-field validation, Edit preservation, review, confirmation, receipt,
   and prompt-backed reset tests for all six forms.

#### Inline redesign quality gate

- [x] Apply a polished 6px workspace gradient accent to all 30 inline components and replace static
   trend, capacity, waterfall, portfolio bubble, and AI-spend treemap marks with reusable D3 charts.
- [x] Add D3 progress pies for goal contributions, metric-specific portfolio AI-spend redraws, a weighted
   portfolio-capacity Sankey, clearer project AI actual/forecast spacing, and semantic approval pills.
- [x] Validate all 30 redesigned components in the supported inline UX harness at 340px and 760px,
   light/dark, keyboard focus, reduced motion, real 200% browser zoom, no-match, and error states:
   120 responsive/theme states with zero overflow, runtime, broken-image, unlabeled-control, or blank-chart failures.
- [x] Complete every local Phase 2B gate. The final authenticated Workbench smoke is consolidated into
   the canonical external Phase 11 tenant gate; `{tenantDomain}` remains the required external value.
- [x] Capture one standard-width screenshot for every component and a machine-readable interaction/quality
   matrix under `ux-review/evidence/` so visual repetition and failures are auditable.
- [x] Run a visual-diversity review: all 30 standard-width components expose unique `data-layout`
   identities and purpose-specific bodies; shared workflow stages retain component-specific evidence.
- [x] Pass intent/schema/media audits, 91 focused tests, zero-warning `heft test --clean`, and production packaging.

**Gate:** leadership approves the 19 information, 5 review, and 6 form experiences as purpose-designed,
directly actionable inline UX before Phase 3 full-screen work begins.

### Phase 2C - Agent Capability Explorer and end-user education

> This phase is required before Phase 3 because Zava exposes 30 operational inline tools. The education
> experience must be catalog-driven and reusable by future complex Copilot Apps, not a static Zava page.

#### Catalog and agent contract

- [x] Approve the scope amendment: keep 30 operational tools and add one education tool (31 total),
   with `ExploreAgentCapabilities` as the final immutable component/tool name.
- [x] Generate `ExploreAgentCapabilities` through the supported SharePoint Yeoman command; preserve all
   existing generated identities and register the new GUID/bundle/locale/schema/tool.
- [x] Add the `education` operation and complete capability metadata for all 30 advertised operational
   intents: scenario name, outcome, category, audience, operation, prompt, tags, rank, preview properties,
   and preview safety.
- [x] Extend configure/validate scripts from 30 to 31 components while asserting exactly 30 advertised
   scenarios, complete unique education metadata, normalized preview properties, and self-exclusion.
- [x] Change `copilot/declarativeAgent.json` to exactly three conversation starters: (1) `Review my
   priorities`, (2) `Compare projects`, and (3/final) `Explore what this agent can do` with prompt
   `Show me the project and portfolio scenarios you can help with.` Retire the standalone AI-spend and
   resource-decision starters because those scenarios remain discoverable through the explorer.
- [x] Update `copilot/instruction.txt` so capability/help/breadth prompts route to
   `ExploreAgentCapabilities` before broad summary fallbacks; add disambiguation tests.

#### Reusable inline explorer

- [x] Create `shared/capabilityExplorer/` with domain-neutral catalog types, category/search/filter
   selectors, scenario list/detail, prompt action adapter, preview boundary, tour state, and test helpers.
- [x] Build the inline explorer around the end-user question `What are you trying to accomplish?` with
   My Work, Project delivery, Portfolio decisions, and Approvals categories, counts, search, and audience
   filters. Do not show component names, manifest tools, schemas, or technical routes in visible copy.
- [x] Show one selected scenario's business outcome, realistic prompt, operation cue, mocked-data context,
   and safe preview. Category/search changes must materially change results and support a positive no-match state.
- [x] Implement the approved first-version `Copy prompt` fallback with visible success/failure feedback
   and guidance to send it in chat. No unsupported host API is called.
- [ ] Add `Try this prompt` only after a documented target-host prompt-submit API is verified.
- [x] Reuse the shared workspace accent/current-user/full-screen header; add unique stage layouts,
   keyboard focus management, reduced-motion behavior, 200% zoom support, dark semantics, and an error boundary.

#### Isolated full-screen gallery

- [x] Add `education/capabilities` as an isolated full-screen route opened by the explorer. It remains
   outside the four operational tabs and does not disturb their route/filter state.
- [x] Add category/audience filters, search, Previous/Next, featured tour, selected prompt action,
   larger live preview, Reset preview, and a compact explanation of mocked data/no external writes.
- [x] Render every operational experience through the shared preview adapter with deterministic
   `previewProperties`; suppress nested global frames and key previews by scenario so state resets cleanly.
- [x] Enforce safe first-version gallery mode with a capture boundary: previews show
   `Demo preview - no action applied`, cannot reach final confirmation, and cannot update session actions.
- [ ] Add richer safe preview interactivity with explicit Reset preview and outcome filters; keep final
   confirmation/session writes blocked.
- [ ] Lazy-load heavy previews where practical; current shared preview adapter is bundled eagerly.

#### Validation and reusable evidence

- [ ] Extract executable threshold validation into reusable automation; the generic playbook requirement
   is documented, while Zava directly validates the required 31/30 contract.
- [x] Test catalog completeness/self-exclusion, category/search/filter counts, no-match, keyboard
   navigation, prompt copy success/failure, host launch feature detection/fallback, Previous/Next, featured
   tour, preview reset, and safe stop-before-confirm behavior.
- [x] Smoke-render all 30 advertised previews with deterministic properties: no network calls, writes,
   nested global headers, confirmation side effects, runtime errors, blank charts, or overflow.
- [x] Validate inline 340px/760px and isolated full-screen 340px/760px/980px in light/dark, reduced motion,
   real 200% zoom, keyboard-accessible naming, runtime/overflow/chart safety, and capture one screenshot
   per category plus information/review/submit previews in `ux-review/evidence/phase-2c-matrix.json`.
- [x] Complete local explorer accessibility validation. Authenticated high-contrast and screen-reader
   output are consolidated into the canonical external Phase 11 tenant gate.
- [x] Extract/document the reusable integration contract so another 11+ tool Copilot App can adopt the
   explorer by supplying education metadata and preview adapters without copying Zava-specific content.
- [x] Pass final 31-component/188-field intent audit, media audit, 130 focused tests, zero-warning
   production build, current
   Teams/Copilot agent ZIP inspection, and `.sppkg` regeneration.

**Gate:** a nontechnical first-time user can discover all 30 operational scenarios, understand their
business value, obtain a usable prompt, and safely preview representative UX inline or full-screen;
the same explorer module is ready for reuse before Phase 3 operational shell work begins.

### Phase 3 - Shared shell, design system, and workflow primitives

- [x] Implement the persistent horizontal four-tab responsive shell, product bar, top-right settings
   gear, selectors, filters, breadcrumb, footer, and focus-managed detail panel. Use the user-facing
   labels My Work, Project, Portfolio, and Decisions while retaining stable internal route identifiers.
- [ ] **IN PROGRESS** Make full screen a scenario-specific continuation rather than a generic dashboard
   landing page. Every fresh intent now selects its owning workspace and preserves the invoked definition;
   project scope continues into Project, while review intents deliberately filter Decisions without
   auto-selecting an item. Route-specific focused canvases plus transient inline selections, edited
   drafts, and filters still need an approved transfer contract.
- [x] Retire the duplicate Decision Thread navigation bar. Use the primary tabs for workspace switching
   and keep My Work, Project, and Portfolio as complete dashboards without cross-UX side panels.
- [ ] Add typed cross-workspace evidence links without duplicating primary navigation. Each transition
   must answer the next question, preserve scope/scenario state, and focus the relevant evidence.
- [x] Replace the full-screen route dropdown as the primary experience with four polished operational
   dashboards: personal priorities/capacity/outcomes; selectable project budget/work/AI details; company
   portfolio investment/cost/value exposure; and incoming decisions with working review controls.
- [x] Implement one shared inline header with the top-right View in full screen control and validate
   consistent placement across summary, chart, form, queue, and approval component shapes.
- [x] Implement Fluent theme tokens, status semantics, workspace/tab accents, chart theming, and dark mode.
- [ ] Complete Windows high-contrast styling; authenticated validation is tracked by the canonical
   external Phase 11 tenant gate.
- [ ] Build shared avatar, metric, status, insight banner, evidence, empty state, data table, and receipt.
- [ ] Build shared Draft -> Validate -> Review -> Confirm -> Receipt state machine.
- [x] Add a typed session action/receipt store with guarded `sessionStorage`, in-memory fallback,
   immutable decision/submission receipts, subscriptions, and Reset. Record all review decisions and
   generic submission confirmations; restore processed Decisions state across shell remounts.
- [x] Implement typed internal workspace/route navigation with exact intent destinations.
- [x] Implement deterministic invocation signatures/versioning and a component-instance transient-state
   envelope. Passive host rerenders preserve the snapshot; a fresh intent or normalized property change
   increments the version and resets transient state. Prove information, review, and submit snapshots
   plus visible full-screen continued context without automatically opening a panel or decision.
- [ ] Extend transient snapshot adapters to all remaining stateful information controls and specialized
   `GetProjectAiSpend` / `RequestAiBudget` experiences; map their state into route-specific full-screen
   modules rather than only the shared continuation summary.
- [x] Add shell landing, fresh-intent rerouting, keyboard tabs, simplified chrome, settings, and focus tests.
- [x] Add session receipt tests for persistence reload, sandbox-safe reset/subscriptions, confirmed
   generic submission, processed decision restoration across full-screen remounts, and UI reset.
- [ ] Add reusable state-machine transition tests after Draft -> Validate -> Review -> Confirm -> Receipt
   mechanics are extracted from the existing component-specific implementations.
- [ ] Expand the coherent narrative data spine before route-specific full-screen scale-out. The current
   inline-sized seed has 8 projects, 12 work items, 8 milestones, 6 risks, 8 allocations, 5 AI usage
   records, and 12 shared review decisions; roadmap, dependency, trend, and drill-down routes need the Section 8 target
   density without changing the approved Customer Service Copilot story or deterministic scenarios.
- [x] Validate 980px light, 760px dark, and 340px light full-screen states with zero overflow, blank
   charts, console warnings, or console errors; save screenshots and `ux-review/evidence/phase-3-matrix.json`.

**Gate (foundation passed locally):** all four operational tab routes are usable across mobile, desktop,
keyboard, and dark mode. Phase 3 remains open for shared workflow/state primitives, high contrast, and
tenant-authenticated host validation.

### Phase 4 - First vertical showcase slice

- [x] Complete the inline `GetMyWorkSummary` experience using its final-named Yeoman-generated identity.
- [x] Generate `CompareProjects`, `GetProjectAiSpend`, and `ReviewResourceAssignment` with the supported
   Yeoman command; their later family phases treat these components as already complete.
- [x] Implement the inline Project comparison studio with aligned project evidence and selectable dimensions.
- [x] Implement the inline AI spend control tower with actual/forecast, guardrail, composition, unit cost,
   explainable cap date, and materially different period states.
- [x] Implement the inline resource what-if approval with person avatar, allocation controls, pinned approved
   baseline, scenario impact, explicit review, and no prompt-triggered decision.
- [ ] Complete exact full-screen continuation and exhaustive parameter variants for all three showcase slices.
- [ ] Meet the ten-second keynote standard for all three slices in inline and full-screen modes.
- [ ] Verify the representative prompts, collisions, parameter variants, and accessibility summaries.
- [ ] Validate passive rerender vs fresh invocation and inline selection retention on Expand.

**Gate:** leadership approves visual originality, conversational control, trust, and inline-to-full-screen
continuity for Project comparison, AI spend control tower, and resource what-if before scale-out.

### Phase 5 - My Work family

- [x] Generate and implement the inline `GetMyTasks` experience.
- [x] Generate and implement the inline `GetMyCapacity` experience.
- [x] Generate and implement the inline `GetMyGoalContributions` experience with D3 progress pies.
- [x] Generate and implement the inline `SubmitWeeklyUpdate` workflow.
- [x] Generate and implement the inline `SubmitTimesheet` workflow.
- [x] Build the default My Work full-screen dashboard with personal priorities, capacity horizon,
   upcoming milestones, and goal contribution without cross-dashboard detail panels.
- [x] Add My Work personal actions for weekly update, timesheet, project status, AI usage, project
   request, and AI budget request. Reuse each existing inline submission UX in a focus-managed right
   panel; close after confirmed completion and show a session-only success notice on the dashboard.
- [x] Validate all six launchers, standard and AI-budget completion callbacks, manual/Escape close,
   dashboard preservation, and a 340px host-bounded compact panel with zero overflow.
- [ ] Complete My Work full-screen routes and cross-route state.
- [ ] Validate personal prompts, prefills, calculations, review, confirmations, and receipts.

**Gate:** 6/6 My Work components complete; clean test gate and UX review.

### Phase 6 - Project insight components

- [x] Retain and polish the inline `GetProjectAiSpend` control tower during scale-out.
- [x] Retain the inline `CompareProjects` experience during scale-out.
- [x] Generate and implement the inline `GetProjectHealth` experience.
- [x] Generate and implement the inline `GetProjectTimeline` critical-path view.
- [x] Generate and implement the inline `GetProjectMilestones` experience.
- [x] Generate and implement the inline `GetProjectRisks` experience.
- [x] Generate and implement the inline `GetProjectBudget` experience.
- [x] Generate and implement the inline `GetProjectTeamCapacity` experience.
- [x] Build the selectable Project full-screen cockpit; project selection updates ownership, budget,
   schedule, AI consumption, work status, risks, milestones, and forecast benefit together.
- [ ] Complete health-to-evidence navigation and shared project/period filtering.

**Gate:** 8/8 project analysis components complete; metric reconciliation and clean test gate.

### Phase 7 - Project submission and request components

- [x] Generate and implement the inline `SubmitProjectStatus` workflow.
- [x] Generate and implement the inline `SubmitAiUsage` workflow with calculated cost preview and classification review.
- [x] Generate and implement the inline `SubmitProjectRequest` workflow.
- [x] Make Project Request stepper boundaries semantic and visible: Back is disabled/muted on step one,
   Next is disabled/muted on step three, and focused lifecycle/boundary tests pass.
- [x] Generate and implement the inline `RequestAiBudget` workflow.
- [ ] Reuse the shared workflow state machine without bypassing review or confirmation.
- [x] Connect all review receipts and generic project submission receipts to the session-local store and
   Decisions processed-state view.
- [ ] Connect specialized `RequestAiBudget` completion/receipt state to the shared session store and
   surface submission history in the relevant Project/My Work status views.

**Gate:** 12/12 Project components complete; all forms validate and reset predictably.

### Phase 8 - Portfolio components

- [x] Generate and implement the inline `GetPortfolioHealth` value-risk bubble experience.
- [x] Generate and implement the inline `GetStrategicAlignment` flow experience.
- [x] Generate and implement the inline `GetPortfolioRoadmap` experience.
- [x] Generate and implement the inline `GetPortfolioBudgetForecast` waterfall experience.
- [x] Generate and implement the inline `GetPortfolioAiSpend` metric-driven treemap and trend experience.
- [x] Generate and implement the inline `GetPortfolioCapacity` weighted D3 Sankey.
- [x] Generate and implement the inline `GetPortfolioRiskExposure` matrix and radial dependency experience.
- [x] Build the company Portfolio full-screen dashboard with approved/forecast budget, project variance,
   AI cost trajectory, value-risk exposure, forecast benefits, and ranked exceptions.
- [x] Expand Portfolio into a company-scale command center with all eight projects, approved-versus-
   forecast investment bars, expected benefits, a 12-month run-rate, investment mix, exceptions, and
   a complete financial/AI-spend ledger; provide readable compact summaries on mobile.
- [ ] Implement explicit cross-filter state, Reset, details, and Project-tab drill-in.

**Gate:** 7/7 Portfolio components complete; visual and metric reconciliation passes.

### Phase 9 - Approval and manager components

- [x] Retain the approved inline `ReviewResourceAssignment` implementation during scale-out.
- [x] Generate and implement the inline `GetApprovalInbox` workflow.
- [x] Generate and implement the inline `ReviewProjectRequest` workflow.
- [x] Generate and implement the inline `ReviewProjectBudget` workflow.
- [x] Generate and implement the inline `ReviewStageGate` workflow.
- [x] Complete inline approval queues, evidence completeness, decision safeguards, semantic status pills,
   and session-local mock receipts.
- [x] Build Decisions as one unified manager inbox across project request, budget, resource, and stage-gate
   reviews. Type, evidence-readiness, and status filters update the persistent request list.
- [x] Keep Decisions selection-first: the detail area clearly says no item is selected and exposes no
   decision controls until Review is chosen. The existing type-specific review then renders on the right.
- [x] Keep processed results synchronized: the left request row receives approved/returned/rejected status,
   the right receipt remains visible, and embedded reviews expose no second queue or Back to queue arrow.
- [x] Use one shared 12-item decision catalog for `ReviewProjectRequest`, `ReviewProjectBudget`,
   `ReviewResourceAssignment`, `ReviewStageGate`, and the Decisions inbox so IDs, titles, people, due
   states, evidence, amounts, safeguards, and receipts cannot drift.
- [x] Automatically filter Decisions on full-screen transition: project request, budget, resource, or
   stage gate. Show the same three pending items as the originating inline component, keep detail empty,
   and require explicit Review before opening the matching item-level UX.
- [ ] Validate role-shaped financial/staffing visibility and required rationale rules.

**Gate:** 5/5 Approval components complete; all decision paths are keyboard accessible and explicit.

### Phase 10 - Agent routing, manifests, and registration

- [x] Verify 30 unique manifest GUIDs, bundles, tool descriptions, and agent registrations.
- [x] Verify every manifest exposes `inline` and `fullscreen` and exactly one distinct tool intent;
   enforce the 31/31 contract in `scripts/validate-intent-components.mjs`.
- [x] Validate generated `ai-plugin.json` from the SharePoint-embedded agent ZIP after packaging:
   plugin v2.4 metadata/functions pass Microsoft schema validation, the Remote MCP extension contains
   only the supported SPFx placeholders/shape, and all 31 function schemas exactly mirror 31 MCP tools.
- [x] Verify all 188 Zod prompt fields are optional, described in generated output, use supported API
   plugin v2.4 parameter types/keywords, and stay within published metadata string limits.
- [ ] Complete the semantic review that all 188 prompt fields materially change behavior; remove any
   ceremonial property that only changes a caption or duplicates another field.
- [x] Write routing instructions with precedence and collision rules from Section 6.
- [ ] Add one primary, one parameter-variant, and one collision smoke prompt per component.
- [ ] Validate `{}`, partial, invalid, and stale properties for every normalizer.
- [ ] Validate fresh invocation, passive rerender, Expand, and initial full-screen route for all 30.

**Gate:** after Phase 2C, 31/31 independently routable tools select and render their expected experience;
the explorer advertises exactly the 30 operational tools.

### Phase 11 - Visual, accessibility, responsive, and performance polish

- [x] Review every inline chart/control against its decision question; remove decorative or redundant
   visuals and unsupported affordances; verify retained controls change data, geometry, or evidence.
- [ ] Review maps, bubble maps, Sankey flows, packed bubbles, radial views, and dependency maps against
   their accessible table/list modes and verify that no encoding depends on hover, color, or shape alone.
- [x] Complete the inline visual-originality review: 30 unique layout identities, purpose-specific bodies,
   operation-specific reviews, and one saved screenshot per component.
- [x] Add accessible chart names/summaries and keyboard-reachable inline controls; validate no unlabeled
   controls or analytical charts in the local 120-state matrix.
- [ ] Add remaining chart table/list equivalents, advanced selection reset, and explicit focus restoration.
- [x] Validate inline light/dark, reduced motion, and real 200% browser zoom paths in the local harness.
- [ ] **BLOCKED: tenant/account required** Run one canonical authenticated Workbench gate covering CSP,
   `requestDisplayModeAsync('fullscreen')`, iframe focus restoration, Windows high contrast, and
   screen-reader output after `{tenantDomain}` and a suitable account are supplied.
- [ ] Validate locale-aware formatting and layout using the five worldwide stress locales, including
   long labels, JPY formatting, week-start variation, and right-to-left presentation.
- [x] Validate all inline 340px/760px responsive checkpoints with zero overflow or clipped evidence.
- [x] Validate all four dashboard roots at 340px light, 760px dark, and 980px light with zero overflow,
   blank charts, or console warnings; capture dashboard and decision-receipt evidence.
- [x] Confirm inline visible person references follow the bundled-avatar/name/initials rule.
- [x] Consolidate all 31 immutable component entries into one shared SPFx production bundle; update the
   intent validator to require exact 31-manifest coverage, keep supported named Fluent icon imports,
   and verify the tree-shaken icon subset is emitted once with no unused icon font/family payload.
- [x] Measure optimized release output after invocation/session-state support: one 746,078-byte (0.71 MiB
   raw) hashed JavaScript bundle, one 426,717-byte (0.41 MiB) `.sppkg`, zero stale unhashed component
   bundles, 168/168 tests, and passing
   generated-plugin validation. This supersedes the initial 31-bundle/10.7 MB package baseline.
- [x] Add `scripts/validate-package-output.mjs` as the final `npm run build` gate. Resolve the `.sppkg`
   from `config/package-solution.json`; fail on stale JS, duplicate media hashes, repeated inline image
   payloads across bundles, or Fluent icon-font leakage; report configurable 1 MiB JS/10 MiB package
   investigation thresholds without treating them as automatic architectural failures.
- [ ] Measure first render, chart update, panel open, and teardown; optimize runtime regressions.
- [x] Run Playwright screenshots and interaction/quality checks for the supported local host review
   environment; save 30 screenshots and `ux-review/evidence/phase-2b-matrix.json`.
- [x] Run catalog/media audits, 91 focused tests, and production package gates with zero warnings.

**Gate:** quality matrix passes and no unresolved severity-1/2 UX or accessibility defects remain.

### Phase 12 - Demo curation and documentation

- [x] Create a distinctive Zava portfolio agent mark with required 192x192 color and 32x32 transparent
   outline PNGs, align the manifest accent color, and keep a reproducible icon-generation script.
- [x] Reconcile `todo.md` with validation-backed inline completion and expand
   `agentic-creation-rules.md` into a reusable mandatory automation protocol for future samples.
- [x] Create a 3-minute dynamic-UX narrative whose main act stays inline: (1) ask how Customer Service
   Copilot is doing and inspect one health driver, (2) follow up by comparing it with Contract Intelligence
   on capacity and change the comparison dimension, and (3) ask whether a 20% Pradeep allocation protects
   launch without harming the other project, then adjust/review the safe what-if. These turns must resolve
   to distinct information, comparison, and review components while preserving conversational context.
   Publish the timed presenter actions, expected tools/properties, safety language, fallback, and
   rehearsal checklist in `Zava-Project-Tracker-3-Minute-Demo.md`.
- [ ] Create the flagship full-screen "one more thing" as a connected evidence journey, not a tab tour:
   expand the final inline state into the Decisions inbox, select the matching resource request, and
   review the preserved 20% scenario; follow the
   schedule consequence into Project; widen to the portfolio capacity/value trade-off in Portfolio;
   reveal Megan's and Pradeep's resulting commitments in My Work; then return through the primary tabs
   to Decisions and complete an explicit mocked confirmation/receipt. Preserve scope, selected
   evidence, proposed allocation, and scenario throughout.
- [ ] Keep a rehearsed three-minute cut that shows Decisions plus one evidence destination, and a
   four-to-five-minute flagship that traverses all four tabs. In both versions, spend more time proving
   distinct inline UX resolution than navigating full screen.
- [x] Create `Zava-Project-Tracker-10-Minute-Business-Demo.md`: a timed business-value deep dive that first proves broader inline resolution across information,
   review, and submit experiences, then uses all four full-screen tabs to show exact-context continuation,
   cross-route evidence, scenario modeling, and session-local decisions. Include audience, presenter
   language, business value, optional prompts, fallback, and rehearsal guardrails that distinguish
   current supported state from planned deeper route transfer.
- [x] Create `Zava-Project-Tracker-5-Minute-Technical-Demo.md`: pair a live comparison/decision UX with
   concrete code for catalog routing, immutable generated identities, shared host lifecycle,
   owner-document theming, invocation versioning, session receipts, shared bundling, and post-package
   validation. Include an architecture map, code-reference index, preview caveats, and rehearsal steps.
- [x] Embed the canonical Microsoft 365 `.sppkg` package-testing walkthrough (`4asOZi4PNUQ`) in README.
- [ ] Publish the 31-component catalog, 30-scenario education metadata, schemas, routes, and selection rationale.
- [ ] Publish the canonical UX contract, visual design guide, and mock-data dictionary.
- [x] Publish `Zava-Project-Tracker-Demo-Prompts.md` with all 31 components, canonical prompts,
   expected normalized properties, inline result, full-screen destination, meaningful interactions,
   routing collisions, action safeguards, and a test-recording template.
- [ ] Complete advanced troubleshooting and authenticated tenant validation instructions in the README.
   Public overview, prerequisites, ready-made package/build/start paths, tenant-domain setup, data and
   safety disclosure, accessibility, worldwide scope, validation status, and demo links are now in place.
- [x] Publish 39 validated gallery images under `assets/`: all 31 inline components plus My Work,
   Project, Portfolio, Decisions, capability explorer, mobile, dark, and decision-receipt full-screen
   states. Add every image with unique order/alt text/raw URL to `assets/sample.json`.
- [x] Add `scripts/validate-gallery-assets.mjs` to the canonical build. Validate unified-gallery schema
   essentials, required metadata, exact 39-image coverage, unique names/orders, local PNG integrity and
   dimensions, descriptive alt text, and raw GitHub URLs.
- [x] Keep the 3-minute keynote, 10-minute business demo, 5-minute technical demo, prompt catalog,
   real screenshots, and `assets/sample.json` linked together as the public demo asset set.
- [ ] Capture a concise worldwide-impact reel showing locale changes without losing hierarchy or chart
   meaning; keep this secondary to the primary operational story.
- [ ] Run a cold-machine/offline rehearsal and verify every example date and receipt.

### Publication readiness gate

- [x] README includes real screenshots, ready-made package/build paths, correct tenant-package video
   guidance, validation status, safety boundaries, and all demo links.
- [x] Gallery, generated-plugin, intent, media, and package-output validators run from `npm run build`.
- [ ] Complete authenticated Copilot routing, CSP, iframe focus, screen-reader, and Windows high-contrast
   evidence before claiming tenant validation complete.
- [ ] Run one cold-machine/offline rehearsal of the keynote, business, and technical demo paths.

**Gate:** a presenter unfamiliar with the implementation can reliably explain and demonstrate dynamic
inline UX resolution as the hero, then use full screen as the exact-context immersive payoff.

## 14. Per-component definition of done (evaluation rubric)

This section is a reusable rubric, not 20 aggregate project tasks. Phase checkboxes and automated
matrices record Zava's actual completion; any remaining gaps stay open in their owning phase above.

- Generated through the supported scaffold with a unique GUID, bundle, registration, and locale.
- One distinct tool description and one minimal optional Zod property schema.
- Useful default rendering for `{}` and robust normalization for invalid/partial input.
- At least two documented parameter sets that produce materially different initial UX.
- The body implements the component's exact Section 5 blueprint; changing labels or data inside the
   shared baseline composition does not count as implementation.
- Information/status components provide a use-case-specific chart/list hierarchy, meaningful live
   controls, synchronized selection/detail, and useful default/filtered/empty/error states.
- Review/decision components complete Queue/Selection -> Review -> Decision draft -> Confirm ->
   Receipt inline, enforce rationale and blocking rules, and restore queue/filter/focus state.
- Request/submit components render real labeled controls and complete Edit -> Validate -> Review ->
   Confirm -> Receipt inline; prompt values only prefill the initial draft.
- Education components derive advertised scenarios from the operational catalog, exclude themselves,
   use nontechnical outcome/prompt language, provide host-safe prompt actions, and preview operational
   experiences without final confirmation or writes.
- Summary-capable components explain meaningful change from a reconciled prior snapshot when one
   exists; scenario-capable components pin the unchanged approved baseline beside the proposal.
- Focused inline experience at 320 px, standard width, light, dark, and reduced motion.
- The shared View in full screen button occupies the inline header's top-right corner, appears only
   when available, is keyboard/tooltip accessible, and opens the correct tab, route, scope, and filters.
- Full-screen mode uses the horizontal primary tabs and exposes the settings gear in the stable
   top-right product-bar position.
- Shared services, metric dictionary, theme, avatar, and workflow primitives are reused.
- Every named person includes their bundled image, name, and initials fallback.
- Forms and decisions require explicit review and confirmation.
- Loading, empty, error, success/receipt, and no-match states are designed.
- Keyboard, focus, screen-reader, zoom, and accessible chart summary are validated.
- Resolver, normalizer, rendering, calculation/interaction, and routing tests pass.
- `heft test --clean` passes with zero new warnings or errors.

## 15. Resolved decisions and open questions

### Resolved

- Product name: **Zava AI Project Portfolio Agent**.
- User-facing tabs: **My Work, Project, Portfolio, and Decisions**.
- Current-user persona: **Megan Bowen**, with role-shaped manager and leadership paths.
- Default currency: **USD**, with locale/currency alternatives available through session settings.
- Scope: all 30 operational components plus `ExploreAgentCapabilities` remain current target.
- Flagship project: **Customer Service Copilot**, connected to Contract Intelligence and portfolio evidence.
- Demo scenarios: retain Leadership demo, Portfolio healthy, and Capacity pressure.
- Demo story: dynamic inline UX resolution is the hero; exact-context full screen is the connected
  Decisions -> Project -> Portfolio -> My Work -> Decisions "one more thing".

### Open

1. Should `SubmitProjectRequest` remain under Project, or open Decisions at a requester-facing New request route?
2. Should chart data tables remain on demand through View data, or stay visible beside selected desktop visuals?
3. Does the target Copilot host expose a documented prompt-submit API? Until verified, `Copy prompt`
   remains the approved behavior.
4. Which tenant and account should be used for the final authenticated CSP, high-contrast,
   screen-reader, and iframe-focus validation?

## 16. Immediate next step after review

Complete the Phase 3 state and workflow spine before broadening route-specific full-screen canvases:

1. Extend the implemented invocation/transient-state contract to remaining information controls,
   `GetProjectAiSpend`, and `RequestAiBudget`, then bind those snapshots to focused full-screen modules.
2. Extract the reusable Draft -> Validate -> Review -> Confirm -> Receipt state machine and connect the
   specialized AI budget path plus contextual submission history to the completed session receipt store.
3. Expand the coherent mock-data spine to support credible roadmap, dependency, trend, and drill-down
   density while preserving the approved flagship records and calculations.
4. Finish exact continuation and parameter/accessibility coverage for `CompareProjects`,
   `GetProjectAiSpend`, and `ReviewResourceAssignment`, then use those slices for the rehearsed keynote arc.
5. Expand My Work, Project, Portfolio, and Decisions route depth only after the shared state contract passes.
6. Keep host prompt-submit, richer explorer previews, lazy loading, threshold automation, worldwide
   stress, and tenant accessibility explicitly tracked; do not substitute local harness evidence for host validation.
