# Zava One - Build Plan and TODO

## RC0 update - October 20, 2026

The current application baseline is SPFx 1.24.0-rc.0, React/ReactDOM 18.3.1, React types 18.3.31/18.3.7, and Heft 1.3.2. Current validation, exact packages, starter targets, findings, and external release gates are recorded in the [repository RC0 readiness report](../../RC0-updates.md). The local creation guide is synchronized byte-for-byte with the assets golden guide.

Existing mixed-host exception: retain the 35 feature web parts, three workspace web parts, and 37 Copilot Components. The application uses React 18; the audited framework-owned React 17 copies must not be overridden. Historical authenticated Teams screenshots are retained as historical evidence, not recertified for RC0.

Earlier entries below retain their implementation history. Old framework versions, test totals, byte counts, and hashes in that history are not current RC0 release evidence.

This is the implementation source of truth for [Zava One](README.md). It translates the
[concept plan](design/Zava-One-Concept-Plan.md),
[component blueprints](design/Zava-One-Component-Blueprints.md),
[visual experience boards](design/Zava-One-Experience-Boards.html), and
[coding-agent handoff](design/Zava-One-Agentic-Handoff.md) into an executable build sequence governed
by [agentic-creation-rules.md](agentic-creation-rules.md).

> **Status legend:** `- [ ]` open, `- [x]` validated, **IN PROGRESS** active, and
> **BLOCKED: reason** externally blocked. A checkbox closes only after its named evidence exists.

> **Progress (latest):** **Demo finalized and locally validated.** All 35 final-named feature
> pairs render through 35 SharePoint-only web parts and 35 intent-specific Copilot Components. Three
> composed workspace web parts provide Combined, Company-only, and Personal-only SharePoint/Teams modes;
> two Copilot infrastructure entries bring the solution to 75 unique SPFx component GUIDs and 37
> generated plugin functions in two host-specific bundles. The local harness has 35 unique inline
> layouts, zero runtime/overflow/image failures, 39 recaptured engineering screenshots, and 15 reviewed
> publication images referenced by `assets/sample.json`. Forty-six Jest tests, 4,080 responsive browser
> states, 28-media provenance,
> six conversation starters with Capability Explorer last, plugin validation, and the final
> version `1.0.0.18`, 6,205,983-byte `.sppkg` audit pass. Evidence is in
> `ux-review/evidence/phase-6-matrix.json`. All 37
> Workbench components reached Ready in the earlier host baseline. The sample author confirmed all
> three separately packaged Teams personal apps work and supplied authenticated screenshots with no
> duplicate workspace header. Modern SharePoint chrome, complete tenant-host accessibility, and deeper
> per-capability edge-state acceptance remain external or post-demo gates.

### Review readiness

**Ready for first repository review and developer-tenant deployment:** all 35 paired experiences, three
workspace modes, C06/C13/C14/C35 reference journeys, C27/C34 D3 visuals, 39 engineering captures, 15
publication assets, deterministic fixtures/media, six conversation starters, generated plugin, and the
committed deployable package have executable evidence.

**Not production-ready:** native ACE selection, source-service abstractions, edge-state matrices, exact
host continuation/focus behavior, deep domain acceptance, complete accessibility/visual review, and
complete authenticated SharePoint/Teams/Copilot acceptance remain open and are not implied by the
working Teams baseline or this submission.

## Authority, Decisions, and Boundaries

- [x] Review the four design artifacts and rendered visual board as the product and UX authority.
- [x] Inspect the current beta.5 scaffold and the My Day reference's README, source patterns, assets,
  settings model, responsive behavior, dark mode, packaging story, and known limitations.
- [x] Record the product-owner scope extension approved on 26 September 2026: add C35 Vacation request
  approvals as a distinct feature without renumbering or changing C01-C34.
- [x] Obtain product-owner approval for this plan, including the proposed final component catalog,
  keynote slice, cross-host scope, and open decisions below; do not begin implementation first.
- [x] Record approved scope changes and baseline decisions here before changing code; C35 and the three
  workspace modes are recorded, with no unapproved engineering exception active.

### Solution-level decisions proposed for approval

1. **Product scope:** preserve C01-C34 and add C35 Vacation request approvals, for 35 stable business
  capability IDs. Every feature owns one generated
  SharePoint-only web part, one generated intent-specific Copilot Component, and one shared React
  capability module consumed by both. The composed workspace has exactly two tabs (`Company` and
  `Personal`), one neutral Copilot entry, and one capability explorer.
2. **Delivery strategy:** build fixture-first in bounded gates. Prove cross-host reuse with C06 Company
  news, C13 Learning, C14 Praise, and C35 Vacation request approvals. C35 is the representative review
  operation and keynote status-update story; then scale the catalog by approved waves.
3. **Preview baseline:** use the playbook-aligned, already scaffolded SPFx `1.24.0-rc.0` profile:
  React/ReactDOM `18.3.1`, React types `18.3.31`, ReactDOM types `18.3.7`, Node
  `>=22.14.0 <23.0.0`, Fluent UI React Components `9.74.9`, Fluent icons `2.0.314`, and Griffel
  `1.7.8`. G0 must verify and pin the complete coherent dependency set from clean beta.5 generator
  output. No `next`, `latest`, downgrade, mixed preview line, forced peer resolution, or guessed React
  patch is allowed.
4. **Cross-product architecture:** G1's "Copilot Component, not a web part" rule applies to every
  Copilot entry point. Each feature's generated web part and Copilot Component are thin host adapters
  around the same capability-owned React/controller/service module. Web-part properties configure
  page composition; Copilot properties carry normalized intent context. Neither wrapper forks business
  UI or behavior. Three generated workspace wrappers and every Copilot full-screen branch render the
  same `ZavaOneWorkspace` React control with an immutable `combined`, `company`, or `personal` mode.
5. **Host exposure:** all 35 feature web parts declare SharePoint web-part hosting only and are not
  exposed as Teams tabs, Teams personal apps, or SharePoint full-page apps. Exactly three composed
  workspace web parts declare Teams hosting:
  `ZavaOneWorkspaceWebPart`, `ZavaOneCompanyWorkspaceWebPart`, and
  `ZavaOnePersonalWorkspaceWebPart`. All remain normal SharePoint web parts and also support SharePoint
  full-page hosting. The final demo packages expose **personal apps only**, with no channel or
  group-chat scopes; the underlying SPFx TeamsTab capability is not a channel app registration.
  These are three Teams app experiences/registrations in one SPFx solution,
  not three copied applications or UI implementations. Any later Teams surface requires explicit
  approval and must compose several coherent capabilities; a small standalone feature never earns
  Teams exposure merely because its web part exists.
6. **Mock boundary:** the keynote release is deterministic, offline, and visibly labeled
  `Demo data / No business submission`. The former `Baseline` runtime calls to Graph and SharePoint
  were diagnostic only and were removed before feature implementation.
7. **Visual reference:** adapt My Day's human greeting, consistent inline-to-full-screen portal transition,
   dynamic responsive composition, session-visible settings impact, deterministic narrative, subtle
   motion, dark mode, and offline media reliability. Do not copy its personal-dashboard information
   architecture, generic equal-card grid, React 18 lifecycle, session-only sync claims, minimal ARIA,
   or illustrative settings as Zava One product behavior.
8. **Signature keynote moment:** one prompt opens a useful focused capability, expands into the exact
   Company or Personal route with selection/draft intact, and continues through the shared Card Stage.
  C35 demonstrates a complete list -> detail -> decision -> updated list workflow across hosts, while
  C34's selectable office map/list and local-time detail provide the signature data visualization.
9. **Publication target:** ship a committed, validated `.sppkg`, current screenshots, release evidence,
   routing matrix, short keynote script, longer business journey, and technical walkthrough.

### Non-goals for the fixture-first keynote release

- No live HRIS, payroll, CRM, LMS, ITSM, market, survey, map, or security provider.
- No broad Graph/SharePoint permissions, tenant-wide deployment, production claim, or invented receipt.
- No 35 independently deployed applications or Teams apps. The 35 standalone web parts and 35 Copilot
  Components ship as paired host adapters in one solution; only the three composed workspace web parts
  are Teams-enabled. No generalized low-code form engine, monorepo conversion, or copied HTML-board
  application architecture.
- No automatic writes, autoplay news, employee tracking, prompt-selected identity, hidden sensitive
  values in URLs/model context, or silent fixture fallback from a failed live service.

## Product and Routing Contract

### Full-screen workspace purpose matrix

| Destination | Primary persona | Benchmark workflow | Decision question | Unique default composition | Data grain | Entry intent | Must not become |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Company | Every employee; communications publishers own anchors | Company home, news/event discovery, trusted enterprise signals | What is happening across Zava, and what shared action or context matters? | Editorial lead + events, supporting news, signals, outcomes, offices, praise, glossary | Published company, region, office, and authorized business scope | `OpenZavaWorkspace` or any Company capability | A Personal productivity dashboard or eight equal KPI cards |
| Personal | Individual employee; scoped manager variants | Daily work, required learning, private services, actionable queues | What do I need to know or do next? | Human greeting/focus, agenda/tasks, required learning, private services, compact Company highlights | Current user and explicitly authorized team scope | `ShowMyDay` or any Personal capability | A second Company portal or an organization-wide HR view |
| Capability explorer (isolated) | New user, keynote audience, evaluator | Search, filter, preview, and start the right scenario | What can Zava One help me accomplish? | Category navigation, compact scenario list, selected detail, safe live preview | Catalog metadata and deterministic preview properties | `ExploreAgentCapabilities` | API documentation, a wall of 35 cards, or a state-mutating workspace |

### Feature and host component catalog

The names below are the final-name proposal. After approval, generate both wrappers for each C01-C35
feature through Yeoman when its phase starts. Never rename, copy, or repurpose the generated `Baseline`
scaffold. `Primary operation` controls the Copilot inline dispatcher; optional secondary actions remain
capability-owned. The React module name is the catalog ID plus `Experience` and is shared by the web
part, Copilot inline view, and composed workspace wherever that feature appears.

| ID | Shared feature | SharePoint-only web part | Copilot Component / tool | Tab and route | Operation | Gate |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | My day | `MyDayWebPart` | `ShowMyDay` | Personal / `my-day` | Information | G5 |
| C02 | Calendar | `AgendaWebPart` | `ShowMyAgenda` | Personal / `agenda` | Information | G5 |
| C03 | Important mail | `ImportantMailWebPart` | `ShowImportantMail` | Personal / `mail` | Information | G5 |
| C04 | Tasks | `TasksWebPart` | `ShowMyTasks` | Personal / `tasks` | Review | G5 |
| C05 | Approvals | `ApprovalsWebPart` | `ShowMyApprovals` | Personal / `approvals` | Review | G5 |
| C06 | Company news | `CompanyNewsWebPart` | `ShowCompanyNews` | Company / `news` | Information | G1-G2 |
| C07 | Announcements | `ActiveAnnouncementsWebPart` | `ShowActiveAnnouncements` | Company / `announcements` | Information | G5 |
| C08 | Knowledge | `CompanyKnowledgeWebPart` | `FindCompanyKnowledge` | Company / `knowledge` | Information | G5 |
| C09 | Services | `EmployeeServicesWebPart` | `FindEmployeeService` | Company / `services` | Information | G5 |
| C10 | Company events | `CompanyEventsWebPart` | `ShowCompanyEvents` | Company / `events` | Information | G2 |
| C11 | People | `PeopleWebPart` | `FindPeople` | Company / `people` | Information | G5 |
| C12 | Onboarding | `OnboardingWebPart` | `ShowMyOnboarding` | Personal / `onboarding` | Information | G6 |
| C13 | Learning | `LearningWebPart` | `ShowMyLearning` | Personal / `learning` | Information | G1-G3 |
| C14 | Praise and communities | `RecognitionAndCommunitiesWebPart` | `ShowRecognitionAndCommunities` | Company / `praise` | Submit | G1-G3 |
| C15 | Daily signals | `EmployeeSurveysWebPart` | `ShowEmployeeSurveys` | Company / `signals` | Submit | G4 |
| C16 | Time off | `TimeOffWebPart` | `ShowTimeOff` | Personal / `time-off` | Submit | G5 |
| C17 | Pay documents | `PayDocumentsWebPart` | `ShowPayDocuments` | Personal / `pay-documents` | Information | G5 |
| C18 | Benefits | `BenefitsWebPart` | `ShowMyBenefits` | Personal / `benefits` | Information | G6 |
| C19 | Equity | `EquityWebPart` | `ShowMyEquity` | Personal / `equity` | Information | G6 |
| C20 | Expenses and travel | `ExpensesAndTravelWebPart` | `ShowExpensesAndTravel` | Personal / `expenses-travel` | Submit | G6 |
| C21 | Campus menu | `CampusMenuWebPart` | `ShowCampusMenu` | Company / `campus-menu` | Information | G6 |
| C22 | Workplace space | `WorkplaceSpaceWebPart` | `FindWorkplaceSpace` | Personal / `workplace-space` | Submit | G6 |
| C23 | IT help | `ITHelpWebPart` | `GetITHelp` | Personal / `it-help` | Submit | G5 |
| C24 | Workplace help | `WorkplaceHelpWebPart` | `GetWorkplaceHelp` | Company / `workplace-help` | Submit | G6 |
| C25 | Shifts | `ShiftsWebPart` | `ShowMyShifts` | Personal / `shifts` | Information | G6 |
| C26 | Project health | `ProjectHealthWebPart` | `ShowProjectHealth` | Company / `project-health` | Information | G6 |
| C27 | Sales performance | `SalesPerformanceWebPart` | `ShowSalesPerformance` | Company / `sales-performance` | Information | G6 |
| C28 | Goals and scorecards | `GoalsAndScorecardsWebPart` | `ShowGoalsAndScorecards` | Company / `outcomes` | Information | G4 |
| C29 | Work files | `WorkFilesWebPart` | `FindMyWorkFiles` | Personal / `work-files` | Information | G6 |
| C30 | Team availability | `TeamAvailabilityWebPart` | `ShowTeamAvailability` | Personal / `team-availability` | Information | G6 |
| C31 | Company stock | `CompanyStockWebPart` | `ShowCompanyStock` | Company / `market` | Information | G4 |
| C32 | Corporate glossary | `CorporateGlossaryWebPart` | `FindCompanyTerm` | Company / `glossary` | Information | G4 |
| C33 | Security reporting | `SecurityReportingWebPart` | `ReportSecurityConcern` | Company / `report-now` | Submit | G5 |
| C34 | Offices | `OfficeDetailsWebPart` | `ShowOfficeDetails` | Company / `offices` | Information | G4 |
| C35 | Vacation request approvals | `VacationRequestApprovalsWebPart` | `ReviewVacationRequests` | Personal / `vacation-approvals` | Review | G3 |
| INF-01 | Combined workspace | `ZavaOneWorkspaceWebPart` | `OpenZavaWorkspace` | Saved tab or Company / home | Infrastructure | G1 |
| INF-02 | Company workspace | `ZavaOneCompanyWorkspaceWebPart` | No separate tool | Company / home | Infrastructure | G1 |
| INF-03 | Personal workspace | `ZavaOnePersonalWorkspaceWebPart` | No separate tool | Personal / home | Infrastructure | G1 |
| EDU-01 | Capability explorer | Workspace route only | `ExploreAgentCapabilities` | Isolated / `capabilities` | Education | G1-G3 |

### Shared React and host-adapter contract

- Each C01-C35 folder owns one typed capability controller/service boundary and reusable React
  experience. The same module supplies its standard SharePoint web-part view, focused Copilot inline
  view, and workspace card/detail/stage views; surface composition may adapt, but business state,
  calculations, validation, controls, and data identity must not be reimplemented by a wrapper.
- A feature web part maps catalog-owned Top Actions and property-pane settings into typed capability
  configuration: title, publisher-approved scope/default filters, view/layout, density, item count,
  source/image visibility, and allowed demo actions. High-frequency enumerated choices use Top Action
  dropdowns; an Advanced settings button opens the full pane for titles, sliders, toggles, and less
  frequent settings. It does not accept credentials or arbitrary endpoints. A Copilot Component maps
  normalized tool properties into intent context and does not expose publisher configuration through
  prompts.
- Every Copilot Component renders its feature's focused shared view in inline mode. In full-screen mode
  it renders `ZavaOneWorkspace`, initialized to the owning tab, route, entity, filters, stage, and safe
  transient state. It does not own or copy a private full-screen dashboard.
- The three workspace web parts and Copilot full screen consume the exact same `ZavaOneWorkspace`
  control, registry, routes, settings, and recipes. Each wrapper supplies an immutable experience mode:
  `combined` shows Company/Personal tabs, `company` locks Company and omits the tab control, and
  `personal` locks Personal and omits the tab control. The web parts supply page/Teams host adapters;
  Copilot supplies bridge/display-mode adapters. Host chrome remains outside the React control.
- Fixed Company/Personal variants scope primary navigation, recipes, settings, and direct routes to
  their owning experience. Cross-experience content is an explicit handoff to the combined workspace or
  authoritative source; it never reveals a hidden tab or silently changes the immutable mode.
- The composed workspace may render shared capability modules together and navigate among all 35. A
  standalone feature web part renders only its own module and never imports the composed shell.

### Host exposure matrix

| Registration | Required `supportedHosts` behavior | Explicit exclusions |
| --- | --- | --- |
| C01-C35 feature web parts | SharePoint web-part host only | No `TeamsTab`, `TeamsPersonalApp`, or `SharePointFullPage` |
| `ZavaOneWorkspaceWebPart` | SharePoint web part/full-page app plus Teams channel/personal; immutable `combined` mode with Company/Personal tabs | No feature-level Teams or full-page apps |
| `ZavaOneCompanyWorkspaceWebPart` | SharePoint web part/full-page app plus Teams channel/personal; immutable `company` mode without the tab control | No Personal tab or hidden mode switch |
| `ZavaOnePersonalWorkspaceWebPart` | SharePoint web part/full-page app plus Teams channel/personal; immutable `personal` mode without the tab control | No Company tab or hidden mode switch |
| C01-C35 Copilot Components | Copilot inline plus host-approved full screen | Never masquerade as web parts or Teams tabs |
| `OpenZavaWorkspace` / `ExploreAgentCapabilities` | Copilot infrastructure routes | No standalone SharePoint feature web parts |
| Selected ACE/Quick View | Native supported card/Quick View hosts only | No claim of unrestricted web-part styling |

### Teams app catalog

| Teams app display name | Generated workspace wrapper | Mode and launch behavior |
| --- | --- | --- |
| Zava One | `ZavaOneWorkspaceWebPart` | `combined`; shows Company/Personal tabs and honors the saved default |
| Zava One Company | `ZavaOneCompanyWorkspaceWebPart` | `company`; opens Company directly and never renders the top-level tab control |
| Zava One Personal | `ZavaOnePersonalWorkspaceWebPart` | `personal`; opens Personal directly and never renders the top-level tab control |

- Each Teams entry has a unique generated component/app identity, localized name/description, approved
  icon set, personal scope, and channel/team tab scope, while sharing one SPFx solution package and one
  React implementation.
- Copilot full screen uses `combined` mode, focused to the invoking capability's owning tab and route.
  This preserves cross-workspace continuation without creating a fourth Teams app or another shell.
- Validate the actual beta.5 Teams packaging/catalog output before claiming that one SPFx package
  publishes all three entries. If the preview toolchain requires separate Teams manifest archives,
  generate three thin manifests over the same SPFx components and record that packaging constraint;
  never fork source, fixtures, routes, or React UI.

### Tool-routing contract

- [x] Give every catalog entry one realistic prompt, outcome, normalized optional properties, and
  unique `data-layout` identity.
- [ ] Add explicit decision-question and deterministic `previewProperties` metadata for every catalog
  entry before full capability-gallery previews are claimed complete.
- [x] Give every tool description a positive `Use when ...` trigger and nearest-sibling
  `Do not use ...` boundary.
- [ ] Generate and test collision pairs: generic approvals/vacation approvals, time-off
  request/vacation approval, tasks/approvals, news/announcements, knowledge/glossary,
  events/agenda, learning/tasks, IT/security/facilities, public stock/private equity,
  Personal leave/team availability, and offices/workplace booking/campus menu.
- [x] Provide six keynote-ready conversation starters spanning company news, verified knowledge,
  a praise form, a sales chart, a global office map, and `ExploreAgentCapabilities` in the final position.
- [x] Keep API plugin v2.4 `name_for_human` at `Zava One` (8 characters), human description at no more
  than 100 characters, and model description at no more than 2,048 characters.

## Visual Quality Contract

### Adapted reference primitives

- **Hero and hierarchy:** retain My Day's identity-aware greeting and decisive next-action focus on
  Personal. Give Company a separate editorial identity: substantial first-party story imagery, visible
  event program, protected global lead, and a clear hint of the next content band at keynote widths.
- **Brand and color:** use a Fluent custom theme and semantic tokens for actions, content, charts, and
  statuses. Every inline component, web part, and workspace card uses the same 4px spectrum bar:
  `#075FCE` 0-32%, `#138A3D` 32-55%, `#B32687` 55-78%, and `#D84F38` 78-100%. Never encode category
  or status in the top bar; use visible labels, icons, and content instead.
- **Elevation and shape:** use restrained Fluent token borders and shadows, 8px-or-less card radius,
  4px controls, stable dimensions, and no nested card surfaces.
- **Typography:** use Fluent/Segoe UI conventions from the design, 14px body baseline, minimum 12px
  secondary copy, 16px card headings, 28px page titles, tabular numerals for clocks/metrics, no
  viewport-scaled type, and no negative letter spacing.
- **People and media:** use approved bundled portraits for decision evidence and recognition stories,
  first-party editorial images with focal metadata, initials only as fallback, and a provenance catalog
  with source/license/hash/usage. No runtime image request is required for the keynote.
- **Zava editorial quality:** author a cohesive fictional newsroom package, not placeholder headlines.
  Every lead/supporting story has a named Zava author, portrait, publication/expiry, region, topic,
  substantial summary, story-specific hero image, focal point, meaningful alternative text, and safe
  detail content. Preserve the same story identity and imagery across all six C06 layouts and hosts.
- **Visualization:** implement charts with focused D3 modules and C34 geography with an offline approved
  projection/topology. Every chart/map has labels, units, as-of state, keyboard interaction, selected
  detail, accessible table/list parity, and materially changing data under controls.
- **Navigation and continuation:** use exactly two top-level tabs, Company and Personal, with direct
  routes and an isolated explorer. Preserve selected records, filters, draft fields, stage, focus origin,
  and safe what-if values when expanding; collapse remains host-owned.
- **Motion:** use a restrained 200-300ms entrance/slide and 240ms Card Stage turn, with immediate
  reduced-motion equivalents. Motion never authorizes an action or delays truthful state.
- **Responsive:** design from container width at 320, 390, 768, 1024, 1440, and keynote/projector widths.
  Company keeps lead news before events before supporting news on narrow screens. Full screen uses the
  available canvas; inline remains one focused answer.
- **Dark/contrast:** bind styles and portals to `ownerDocument`, support light, dark, forced colors, and
  200% zoom, and preserve in-progress state through theme changes.

### Fully functional demo contract

- Every enabled control completes its declared local behavior. Lists filter and page, rows open the
  correct detail, Back restores filters/selection/focus, edits survive review, decisions update the
  canonical record, status/counts change everywhere that record is visible, and Reset restores the
  deterministic starting scenario. No enabled button, selector, chart mark, link, or stage is inert.
- All confirmed demo mutations use one typed, evented, session-local mock store keyed by scenario and
  record ID. Web-part, Copilot inline, Copilot full-screen, and combined/fixed workspace views subscribe
  to the same canonical records. Drafts remain invocation-local; only explicit confirmed demo actions
  update shared session state. No external write or fabricated authoritative receipt is implied.
- Every state-changing experience shows immediate pending/disabled feedback, guards duplicate actions,
  produces a clearly simulated receipt/history event, publishes updated model context, and updates all
  visible summaries, queue counts, badges, detail status, and related capability views.
- Every demo workflow covers success, validation failure, rejected action, stale/conflict, unknown
  outcome/reconciliation, Back/Edit, and deterministic reset. Status uses text/icon plus semantic color.
- The local harness must exercise controls rather than only capture initial renders, and its evidence
  records before/after state, affected record IDs, visible status changes, and cross-surface parity.

### Representative evidence gate before scale-out

- [x] Capture and review C06 inline, Company desktop full screen, Company narrow full screen, and dark
  full screen against the visual board and My Day reference.
- [ ] Capture and review C13 Card Stage and C14 draft/review at inline and full-screen widths.
- [x] Reject scale-out if the slice resembles a generic KPI/card grid, uses initials where approved
  portraits exist, repeats the same composition between Company and Personal, lacks editorial imagery,
  or leaves controls decorative.
- [x] Record representative review screenshots and hashes under `ux-review/evidence/screenshots/` and
  `ux-review/evidence/phase-6-matrix.json`.

## Approach and Sequencing

1. Phase 0 freezes scope, identities, UX, keynote story, and package metadata.
2. Phase 1 proves the beta.5 baseline and installs automation before feature React work.
3. Phase 2 builds one coherent typed fixture domain and shared contracts.
4. Phase 3 proves the premium cross-host reference slice and all three operation models.
5. Phase 4 completes Company-first value and the signature visualization.
6. Phase 5 completes Personal essentials and cross-capability composition.
7. Phase 6 scales the remaining employee-service and specialist capabilities.
8. Phase 7 makes settings materially reshape the experience and completes showcase polish.
9. Phase 8 packages, validates, documents, and rehearses the keynote release.

Every phase closes with focused tests, saved evidence, `heft test --clean` with zero warnings/errors,
and an immediate update to this file. Tenant-only checks remain open with one precise prerequisite.

## Phase 0 - Scope, Identities, and Demo Contract

### Product approval

- [x] Approve the 35-capability scope, Company/Personal ownership, stable IDs, proposed web-part and
  Copilot names, routes, operation classes, neutral entry, and mandatory capability explorer.
- [x] Approve G1 keynote scope: C06, C13, C14, C35, `OpenZavaWorkspace`, and
  `ExploreAgentCapabilities`; C35 is the representative review slice in G3.
- [x] Approve the keynote narrative: Company story/events -> Copilot focused answer -> exact expansion
  -> Personal learning Card Stage -> C35 vacation decision/status update -> praise draft/review -> C34
  global office visualization.
- [x] Approve the package identity, solution GUID ownership, agent name `Zava One`, short plugin
  metadata, conversation starters, and public sample title.
- [x] Approve the three Teams catalog identities: `Zava One`, `Zava One Company`, and
  `Zava One Personal`, including unique app/component IDs, localized descriptions, and icon treatment.

### Cross-host ownership

- [x] Fix the Teams exposure model: three composed app registrations backed by
  `ZavaOneWorkspaceWebPart`, `ZavaOneCompanyWorkspaceWebPart`, and
  `ZavaOnePersonalWorkspaceWebPart`, each available as personal and channel tabs; no C01-C35 feature
  web part is visible in Teams and no separate small-feature Teams app is generated.
- [x] Confirm the local keynote host matrix: 35 independently configurable SharePoint-only web
  parts, 35 intent-specific Copilot Components, three composed SharePoint/Teams workspace web parts,
  and Copilot full screen using the same workspace control. Native ACE selection remains separate.
- [x] Decide whether exact SharePoint whole-page parity requires a later single-part app page; default
  remains independently composed web parts with C06 lead + C10 + C06 supporting mobile order.
- [ ] Select the first native ACE reference among C13 Learning, C23 IT Help, or C33 Report Now.

### Design and media approval

- [x] Approve the visual quality contract above and the rendered visual board as the canonical UX
  direction, not as reusable HTML/CSS/application architecture.
- [x] Approve keynote personas and a fictional Zava fixture roster covering everyday employee,
  frontline worker, new starter, manager, seller/project lead, and denied/unknown user.
- [x] Approve editorial, portrait, icon, and map/topology sources and their permitted bundled usage.
- [x] Create the media provenance catalog before importing media into runtime code.

### Phase 0 gate

- [x] Record approval date and approved exceptions in this section.
- [x] Confirm there are no unresolved component names or route collisions before generation.

## Phase 1 - G0 Baseline and Automation

### Phase 1-6 approval audit - September 30, 2026

| Phase | Verified approval baseline | Remaining local hardening | External/deferred gate |
| --- | --- | --- | --- |
| 1 | Exact beta.5/React 18 pins, host generation, React lifecycle, collision, publication, and release-evidence validators | None for the fixture-sample baseline | Production-supported SPFx decision remains separate |
| 2 | Connected typed fixtures, stable identities, deterministic session state, IANA clock tests, and no runtime network/write path | Provider interfaces, exhaustive source/edge-state contracts, focal points, normalization, and Card Stage focus/motion | Live provider mapping, permissions, retention, and source ownership |
| 3 | Shared host adapters, six Company News layouts, reference read/submit/review flows, error fallback, bridge baseline, and complete C35 desktop flow | Continuation/focus matrices, specialist edge states, read-only previews, and C16/C30 canonical projections | Authenticated Teams, SharePoint page, and Copilot host validation |
| 4 | Purpose-built Company portal, charts, map/list equivalence, and deterministic IANA office clocks | Domain edge fixtures, typed cross-routes, and the full responsive/theme visual matrix | Authorization-aware goals, licensed market behavior, and source handoffs |
| 5 | Personal portal and all Personal capability baselines | C01 compositional read models, rollback/undo, ambiguity, and per-intent error matrices | Secure source handoff and step-up authentication |
| 6 | All specialist pairs, property authoring catalog, unique layouts, screenshots, packages, and local smoke evidence | Specialist edge-state/source contracts and complete multimodal review | Live modern-page Top Actions and tenant-host acceptance |

**Approval stance:** the deterministic fixture sample is locally ready for code/product review. Open
checkboxes below are intentionally retained where exhaustive edge-state, live-provider, accessibility,
or authenticated-host evidence does not yet exist; they are not silently treated as complete.

### Reproducible beta.5 bootstrap

- [x] Resolve `@microsoft/generator-sharepoint@1.24.0-rc.0` metadata and integrity with normal TLS;
  record Node, npm, Yeoman, generator, Heft, TypeScript, React/runtime/types, and all SPFx versions.
- [x] Generate isolated beta.5 React Copilot Component and React web-part references; compare their
  package manifests, schemas, lifecycle, and bundling with this scaffold.
- [x] Pin the complete beta.5-compatible stack exactly: React/ReactDOM `18.3.1`, React types
  `18.3.31`, ReactDOM types `18.3.7`, Fluent UI React Components `9.74.9`, Fluent icons `2.0.314`,
  Griffel `1.7.8`, and only approved focused D3 modules/types.
- [x] Remove direct Fluent v8 only after proving generated/runtime code does not require or import it;
  keep any framework-owned isolated dependency untouched.
- [x] Maintain the lockfile, run `npm ci`, inspect `npm ls`, and stop on React/type/peer mismatch instead
  of using `--force`, `--legacy-peer-deps`, arbitrary overrides, or another preview version. Clean
  install passed with zero vulnerabilities and the exact React/Fluent/Griffel/SPFx pins.
- [x] Run the clean generated build/package commands and save a bootstrap receipt with exact commands,
  output, warnings, package paths, and integrity values.

### Placeholder disposition and final generation rules

- [x] Use `Baseline` only to prove beta.5 root creation, update, bridge access, and teardown.
- [x] After the bootstrap receipt passes, remove the placeholder through an explicit cleanup change;
  do not rename it into a Zava One component or transfer GUID `998b80c4-e4ac-453c-9717-1bae6e354305`.
- [x] Generate both final-named wrappers for each capability entering its phase: one React web part and
  one Copilot Component. Generate the three workspace web parts separately. Verify unique GUIDs,
  manifests, schemas, registrations, localized resources, supported hosts, and bundle membership.
- [x] Never generate Teams or full-page exposure for a feature web part. Only the three workspace web-part
  manifests may include `SharePointFullPage`, `TeamsTab`, and `TeamsPersonalApp`.

### Automation foundation

- [x] Create one typed catalog as the source for feature identity, shared module, paired web-part and
  Copilot identities, operation, route, web-part configuration contract, tool schema/descriptions,
  supported hosts, education, bundle membership, and preview metadata.
- [x] Add equivalent catalog generation/validation automation in
  `scripts/configure-reference-hosts.mjs`, driven by `config/zava-capabilities.mjs`; it owns all 75
  wrappers, schemas, descriptions, hosts, GUID registrations, package pins, and shared bundle output.
- [x] Make catalog validation fail on a missing/duplicate feature pair, wrapper without a shared module,
  feature web part with Teams/full-page exposure, workspace web part without both Teams host modes,
  a Teams-enabled web part outside the three approved workspace identities, duplicate workspace mode,
  fixed mode that renders the Company/Personal tab control, or Copilot full-screen route that bypasses
  `ZavaOneWorkspace`.
- [x] Add `scripts/validate-react-baseline.mjs` for beta.5 pins, React roots/lifecycle, imports, and
  unexpected application React copies.
- [x] Add generated-plugin, package-output, full-gallery visual evidence, media-provenance, and
  deterministic embedded-media validators.
- [x] Add dedicated publication, routing-collision-matrix, and generated release-evidence validators
  before Phase 8 publication sign-off.
- [x] Add the tenant-free `ux-review/` harness, server, screenshot capture, and machine-readable
  evidence pipeline before feature scale-out.
- [x] Add `validate` and `build` scripts that execute source audits, clean tests, production packaging,
  generated plugin validation, package inspection, and release evidence in one command.
- [x] Configure separate SharePoint-web-part and Copilot-Component bundles after host testing proved
  runtime isolation was required; retain shared React source and reject duplicate component membership.

### Phase 1 gate

- [x] `npm ci`, `npm ls`, catalog/host/media/visual validators, clean tests, production build,
  generated-plugin validation, and package audit pass with zero warnings/errors.
- [x] Add and pass the dedicated React-baseline and routing-collision validators before the Phase 8
  release gate; current dependency-tree and generated-host checks cover the implemented baseline.
- [x] Save the G0 receipt and update the Progress block with measured versions and artifact counts.

## Phase 2 - Coherent Fixture Domain and Shared Contracts

### Fixture data and service boundary

- [x] Create source-appropriate typed records and view models for personas, news, learning, vacation
  requests, capability metadata, receipts, routes, model context, and workspace state.
- [ ] Add explicit provider mappers, `SourceResult<T>`, and one injected canonical clock instead of the
  remaining authored fixture instants.
- [ ] Implement capability service interfaces and explicit mock providers; React views never import raw
  fixtures or call Graph/SharePoint/provider APIs directly.
- [x] Model one connected Zava story across news, events, people, learning, praise, vacation approvals,
  other approvals, offices, tasks, services, outcomes, and help without inventing live access or
  authoritative writes.
- [ ] Cover ready, loading, empty, partial, stale, denied, ineligible, unconfigured, unavailable, and
  error states; collections add zero/one/many/paging/selection-removal fixtures.
- [ ] Add normal, long-text, RTL, 12/24-hour, date-only policy, time-zone/DST, mixed-currency, canceled,
  missing-geometry, and revoked-access fixtures where relevant.
- [x] Keep sensitive salaries, messages, HR reasons, tokens, attachments, and private entity IDs out of
  URLs, logs, model context, and persistent browser storage.

### Zava persona, media, and editorial fixture pack

- [x] Establish one reusable fictional persona catalog with stable IDs, roles, offices, reporting lines,
  accessible portrait metadata, and bundled approved portraits. The recurring cast is Megan Bowen,
  Patti Fernandez, Diego Siciliani, Johanna Lorenz, Joni Sherman, Nestor Wilke, Pradeep Gupta, Grady
  Archie, Isaiah Langer, Lee Gu, and Miriam Graham.
- [x] Give C35 six varied vacation requests linked to those personas: pending, clear/attention/conflict
  coverage, ample/low projected balance, already approved, and declined examples with dates, workdays,
  balance impact, requester note, submitted time, revision, and decision history.
- [ ] Add a true stale-revision/concurrent-decision fixture and explicit manager-scope/policy-zone fields.
- [x] Author a keynote-grade fictional Zava newsroom set with at least eight substantial stories across
  leadership, product/customer impact, offices, accessibility, community, learning, and events. Initial
  editorial candidates are `One Zava, closer to every customer`, `Helsinki opens an accessibility
  innovation lab`, `Project Aurora reaches its first customer milestone`, `Global town hall: building
  our next chapter`, and `Singapore turns support insight into product improvements`.
- [x] Give every story a distinctive, bright, inspectable image rather than generic atmospheric stock;
  include author/byline portrait, summary, detail excerpt, topic, region, publish/expiry instants, image
  dimensions, meaningful alt text, source/license/provenance, and deterministic ordering.
- [ ] Add explicit focal-point metadata for publisher-controlled image crops.
- [x] Generate or source all portraits/editorial imagery under approved rights, optimize and bundle it
  once, record hashes in the media catalog, and verify no external image request or broken fallback.
- [x] Add focused data-integrity tests for persona IDs, portrait references, news authors/media,
  learning IDs, catalog uniqueness, C35 decision/reset behavior, and Personal workflow fixture rules
  for business days, approval identity, equity estimates, room capacity, and IT issue scope (covered by
  the initial 29-test suite; the final demo now has 46 passing tests).
- [ ] Extend integrity tests to C16/C30 cross-capability vacation projections and every specialist
  source contract before those deep acceptance gates close.

### Shared application contracts

- [x] Implement typed capability registry, route, invocation, display mode, host adapter, navigation,
  mutation, receipt, model-context, and transient-state contracts.
- [ ] Implement deterministic property normalization/signatures; `{}`, partial, invalid, stale, and
  fresh values always resolve to a useful safe state.
- [x] Separate invocation, transient, and confirmed session state. Preserve safe local interaction state
  across passive host rerenders and expansion; reset it only for a fresh normalized signature.
- [x] Implement one canonical review catalog so inline and full-screen queues never disagree or nest a
  second queue inside a parent decision center.
- [x] Implement operation-specific routers/workflows for information, review/decision, request/submit,
  and education, with an explicit accessible fallback for an unknown intent.
- [ ] Implement Card Stage with explicit reversible transitions, focus return, draft retention, one
  accessible active face, content-driven height, 240ms motion, and instant reduced-motion rendering.
- [x] Implement one surface contract for each shared feature module: `webPart` receives validated
  publisher configuration, `copilotInline` receives normalized intent context, and `workspace` receives
  route/transient context. Keep one controller, state machine, validation path, and view-model identity.

### Data integrity gate

- [x] Test current catalog/persona/news/learning/vacation stable IDs, references, counts, uniqueness,
  C35 decision rules, reset, and deterministic fixture output.
- [x] Test the injected deterministic office instant across IANA-zone UTC rollover and winter/summer DST.
- [ ] Extend tests to all money/unit, source-freshness, sorting, access-trimming, and remaining
  specialist-calculation contracts.
- [x] Assert no runtime network call or external write in fixture mode and no switch to fixtures after a
  live-adapter error.
- [x] Run clean tests and save the Phase 2 fixture/integrity evidence.

## Phase 3 - G1/G3 Premium Reference Slice

### Shared host foundation

- [x] Build paired thin generated wrappers around shared React UI/controllers for the reference
  capabilities: SharePoint-only feature web parts plus intent-specific Copilot Components.
- [x] Build the three workspace web parts as the complete Teams-enabled allowlist and expose each
  registration for Teams personal and channel tabs; do not expose any feature web part in Teams.
- [x] Build `ZavaOneWorkspace` once and render that exact React control from
  all three workspace wrappers and every Copilot Component's full-screen branch.
- [x] Implement and test immutable workspace modes: combined renders both tabs and saved-default
  behavior; Company-only renders Company without tabs; Personal-only renders Personal without tabs.
- [ ] Validate three distinct Teams catalog entries and launch contexts in an authenticated tenant with approved
  display names, icons, personal scope, and channel/team tab scope; prove each loads its fixed mode.
- [x] Implement persistent React 18 roots, complete teardown, owner-document Griffel renderer, one
  Fluent provider, resolved-current-user fallback, and host-derived state.
- [x] Add a shared React error boundary with a safe no-submit fallback, retry action, and route/theme
  reset key around every focused and workspace experience.
- [ ] Prove abortable asynchronous effect cleanup under host rerenders when live asynchronous providers
  are introduced; current fixture rendering is synchronous.
- [x] Implement the two-tab shell, typed route focus, neutral launch, responsive canvas, and
  host-owned expansion/collapse behavior.
- [ ] Complete exact transient-state continuation, settings location, and focus restoration for every
  deep-linked workflow before host continuation is claimed complete.
- [x] Implement the SPFx Copilot bridge adapter only through public APIs: initial and material-change
  model-context snapshots, explicit user-triggered follow-up, display-mode request, size request when
  measured necessary, safe links, error handling, and snapshot deduplication.
- [ ] Prove fresh invocation versus passive rerender and transient state transfer for one information,
  review, and submit flow.

### C06 Company news - representative information slice

- [x] Generate the C06 pair: `CompanyNewsWebPart` with publisher configuration and
  `ShowCompanyNews` with optional useful intent filters only.
- [x] Implement one focused inline news answer and exact expansion to Company / News.
- [x] Implement Editorial, Hero tiles, Layers, Carousel, Filmstrip, and Compact list over the same
  authorized ordered records; no autoplay in the first build.
- [ ] Implement `complete`, `lead`, and `supporting` SharePoint web-part presentations and verify the
  publisher-composed lead/events/supporting narrow order with C10 placeholder content.
- [ ] Test zero/one/many stories, long headlines, expired/scheduled/denied items, manual controls,
  list alternative, focus, reduced motion, and identity/order preservation across layouts.

### C13 Learning - representative Card Stage read slice

- [x] Generate the C13 pair: `LearningWebPart` with page configuration and `ShowMyLearning` with
  useful optional assignment/status intent inputs.
- [x] Implement prioritized overview -> complete collection -> selected course -> origin-preserving Back;
  show authoritative/partial totals honestly and never infer completion from navigation or playback.
- [x] Implement three independently selectable assignments with duration, due date, progress, source
  status, transcript metadata, and an explicit tenant-host handoff label.
- [ ] Add and validate overdue, no-due-date, completed, inaccessible, and partial-feed fixtures.
- [ ] Preserve selection, filter, list position, and stage across inline/full-screen continuation.

### C14 Praise - representative submit slice

- [x] Generate the C14 pair: `RecognitionAndCommunitiesWebPart` with page configuration and
  `ShowRecognitionAndCommunities` with safe optional draft-prefill intent fields.
- [x] Implement overview -> compose -> validate -> review -> explicit confirm-preview ->
  `Nothing sent` receipt for fixture mode; Edit and Cancel preserve/explain draft state.
- [ ] Validate recipient ambiguity, audience/privacy, message limits, duplicate click, rejected, conflict,
  and unknown outcome without claiming a source write.
- [x] Use approved portraits and a human recognition story; publish no private message automatically.

### C35 Vacation request approvals - representative review slice

- [x] Generate the C35 pair: `VacationRequestApprovalsWebPart` with manager-scope, status, density,
  page-size, evidence, and allowed-decision configuration; `ReviewVacationRequests` accepts only useful
  optional request/status/team intent filters and never a prompt-selected approver identity.
- [x] Implement a polished request list with requester portraits, requested dates/workdays, coverage
  signal, projected balance, status, search, filters, and materially changing counts.
- [x] Implement the complete reversible flow: list -> selected request detail -> decision draft ->
  explicit confirm -> simulated receipt -> Back to the same filtered list. Detail includes
  policy facts, balance impact, conflicts, team coverage, request note, history, and allowed decisions.
- [x] Support Approve and Decline in fixture mode; Decline requires a visible rationale. Pending disables
  duplicate action. The receipt names request, employee, dates, decision, simulated reference/time,
  session-only status, and next action.
- [x] Store confirmed decisions in the canonical evented session-local vacation-request catalog and
  update mounted C35 list/detail/count/receipt views plus Combined/Personal workspaces immediately.
- [ ] Wire the canonical C35 decision into purpose-specific C16 requester and C30 manager projections;
  their current interactive baselines do not yet consume the shared vacation record.
- [x] Keep decision drafts local until explicit confirmation. Publish safe model-context snapshots for
  list, detail, decision, receipt, and returned-list states; never expose private rationale before Review.
- [x] Add deterministic Reset demo data and visible decision history so the keynote can repeat without
  refreshing or rebuilding. Reset must restore every related C16/C30/C35 surface to the same baseline.
- [ ] Test approved, declined, rationale validation, stale revision, already decided, duplicate click,
  conflict, unknown outcome/reconciliation, Back/focus restoration, filter preservation, cross-root
  subscription cleanup, and status parity across web part, Copilot inline/full screen, and Teams modes.

### Neutral entry and capability education

- [x] Generate `OpenZavaWorkspace`; neutral launch honors the saved default or Company, explicit tab is
  invocation-only, and a specific capability always opens its owning tab/route.
- [x] Generate `ExploreAgentCapabilities`; derive all 35 advertised scenarios from the catalog, exclude
  itself/infrastructure, and implement search, category/audience/operation filters, pagination, detail,
  safe prompt copy, Previous/Next, and featured tour.
- [ ] Implement isolated read-only full-screen previews using deterministic `previewProperties`; stop
  review/submit previews before confirmation and label `Demo preview - no action applied`.

### Phase 3 premium and behavior gate

- [x] Complete the representative visual evidence gate defined above before any sibling scale-out.
- [x] Audit every visible control and prove it changes records, grouping, chart geometry, calculation,
  selected evidence, draft, validation, or workflow stage.
- [ ] Test bridge snapshots/follow-ups, exact continuation, error boundaries, host rerenders, root
  cleanup, keyboard/focus, reduced motion, dark mode, forced colors, 200% zoom, and no network calls.
- [x] Render each reference feature locally through shared web-part/Copilot/workspace React paths,
  including all three fixed/combined workspace modes, with 39 settled screenshots.
- [x] Prevent zero-height and nested-scroll MCP full-screen wrappers: render the workspace in natural
  document flow, keep the header/tabs/content in one page, and let the MCP/Copilot document own the
  single scrollbar without custom iframe-height negotiation.
- [ ] Verify the same reference features in actual SharePoint web parts, Teams personal/channel hosts,
  and Copilot Workbench; local harness evidence does not prove authenticated host behavior.
- [x] Assert feature web-part manifests are SharePoint-only, exactly three web parts are Teams-enabled,
  each owns one unique workspace mode, and all workspace/Copilot full-screen roots resolve to the same
  `ZavaOneWorkspace` implementation.
- [x] Capture complete-content C35 list, detail, decision, receipt, and updated-list publication
  screenshots with real bundled persona portraits at the desktop web-part checkpoint.
- [ ] Extend the complete C35 state sequence to inline, Teams workspace, Copilot full-screen, narrow,
  and dark authenticated-host checkpoints.
- [x] Validate the generated plugin/package and save local cross-host evidence; keep tenant-only behavior open
  if authentication or host capability is unavailable.

## Phase 4 - G2/G4 Company Front Door and Signature Visualization

- [x] Generate all Phase 4 web-part/Copilot pairs and deliver interactive catalog-driven baselines for
  C10, C15, C28, C31, C32, and C34 on the approved shared host.

### Company default experience

- [x] Generate the C10 pair and implement a source-labeled Company Events list/detail baseline with
  local-time labels and explicit registration/calendar distinction.
- [ ] Add canceled, rescheduled, ended, capacity, authoritative registration, and source-handoff states.
- [ ] Compose C06 lead + C10 events + C06 supporting at desktop and narrow widths; preserve protected
  anchors under user customization and show honest empty states without removing them.
- [x] Generate the C15 pair and implement an interactive privacy-labeled survey review/receipt baseline.
- [ ] Add eligibility, duplicate-vote, closing-time, minimum-cohort suppression, and aggregate chart/table states.
- [x] Generate the C28 pair and implement a named outcome metric with period, target, direct-label D3
  chart, exact-value table, and selected detail.
- [ ] Add publisher/owner metadata and authorization-aware company/team goal boundaries.
- [x] Generate the C31 pair and implement fictional, source-labeled market data with status/delay text,
  selectable period geometry, and an accessible trend table.
- [ ] Add market-calendar, stale quote, no listing, and not-configured/inapplicable states.
- [x] Generate the C32 pair and implement an approved-term glossary search/detail baseline with owner
  and effective-version fixture content.
- [ ] Add ambiguous-domain meanings, authorization trimming, and governed suggestion review.

### C34 signature office experience

- [x] Generate the C34 pair: `OfficeDetailsWebPart` with office/layout configuration and
  `ShowOfficeDetails` with office/region/time-format intent properties and exact Company / Offices
  continuation.
- [x] Implement an offline projected world map with approved bundled geography, keyboard/touch markers,
  nonoverlapping dense-site selection, equivalent 44px office-list targets, and selected detail.
- [x] Compute clocks from an injected deterministic instant and IANA zones for Los Angeles, New York,
  London, Helsinki, and Singapore; test UTC midnight/DST. Fixture clocks schedule no updates or repeated
  announcements, so hidden/unmounted cleanup is not required until live clocks are enabled.
- [ ] Connect typed routes to C21, C22, and C24; show an explicit unavailable destination until those
  capabilities are implemented.

### Company gate

- [ ] Capture each Company default at mobile, standard, desktop, keynote, light, and dark; assert unique
  layouts, no duplicate focused module, no overflow/blank chart, and lead/events visibility.
- [x] Verify Company and Personal do not share a relabeled/reordered default composition.
- [x] Rebuild Company full screen as a configurable 17-component portal: pinned company-wide
  announcements/alerts hero, all Company experiences visible by default, three independent columns,
  real shared component UX, Company-specific Edit/Personalize controls, and isolated session settings.
- [x] Replace generic Company implementations with task-specific experiences for Events, People/Teams
  chat, Daily Poll, photographed Campus Menu, Project Health confidence, Sales actual/target, Goals key
  results, period-based Stock detail, and the five-office concierge map. Correct Recognition contrast
  with Fluent palette tokens and validate light/dark ratios above WCAG AA.
- [x] Run catalog, control-effect, visualization, local accessibility, clean build, plugin, and package gates.

## Phase 5 - G5 Personal Essentials and Shared Journeys

- [x] Generate every Phase 5 web-part/Copilot pair and deliver an interactive, unique-layout baseline
  for C01-C05, C07-C09, C11, C16-C17, C23, and C33.

### Personal workspace

- [x] Generate C01-C04 pairs and implement interactive briefing, agenda, explainable-mail, and
  source-labeled task baselines with focused detail routes.
- [ ] Reconcile C01 counts against shared C02/C03/C04/C13/C16/C17/C23 records and add task rollback/undo.
- [x] Generate C05 and implement a generic non-vacation decision baseline; catalog routing explicitly
  sends vacation decisions to C35.
- [ ] Add purpose-specific C05 evidence, concurrent-decision handling, rationale rules, and collision tests.
- [ ] Keep C01 compositional: consume established C02/C03/C04/C13/C16/C17/C23 read models rather than
  creating a second data source or provider.
- [x] Generate C11 and implement portrait-backed, evidence-labeled people/expertise results and detail.
- [ ] Add ambiguity resolution, missing-photo/presence fallbacks, and verified contact handoff.
- [x] Generate C16 and implement a personal time-off draft/review/receipt baseline with balance projection.
- [ ] Add region/work-schedule/holiday calculation, source conflict, duplicate, and unknown outcome states.
- [x] Generate C17 and implement masked, period-scoped pay-document availability with no private amount
  in Company surfaces or model context.
- [ ] Add secure source handoff, step-up authentication, denied, and expired-authorization states.
- [x] Generate C23 and implement incident-first IT guidance plus minimal intake/review baseline with a
  visible C33 security boundary.
- [ ] Add authoritative incident/ticket states, failed/unknown submission, and typed C33 route handoff.

### Remaining Company wave-1 capabilities

- [x] Generate C07 and implement scoped/severity/validity announcement detail with honest source wording.
- [ ] Add active/expired/scheduled/none and source-backed acknowledgment states.
- [x] Generate C08 and implement query/scope, source/effective-date evidence, and typed knowledge results.
- [ ] Add conflicting-policy, unresolved-region, denied, and grounded-answer evaluation states.
- [x] Generate C09 and implement task-based service discovery with owner/access-state detail.
- [ ] Add allowlisted launch, retired/unlicensed, access-request, and preference-only favorite behavior.
- [x] Generate C33 and implement confidential minimal security intake/review with a strict IT/facilities boundary.
- [ ] Add approved reporting handoff, controlled evidence, unavailable intake, and authoritative receipt states.

### Phase 5 gate

- [x] Demonstrate Company -> Personal navigation, Personal compact Company highlights, and direct intent
  ownership without changing fixed workspace modes.
- [ ] Add saved launch preference and unsent-draft conflict handling.
- [x] Smoke-test all 35 useful defaults, retained controls, selected details, unique layouts, model-context
  snapshots, images, runtime errors, and overflow at the standard review width.
- [ ] Complete per-intent no-match/error matrices, review safeguards, submit edge lifecycles, and host follow-up tests.
- [x] Complete the clean production package gate for all implemented Phase 5 routes.

## Phase 6 - G6 Employee Services and Specialist Breadth

- [x] Generate every Phase 6 web-part/Copilot pair and deliver interactive, unique-layout baselines for
  C12, C18-C22, C24-C30, with source-labeled fixtures and operation-aware local workflows.

### Wave 2 employee services

- [x] Generate C12 and implement an ordered onboarding journey baseline with next-step/detail navigation.
- [ ] Add dependency guards, blockers, lifecycle scope, owners, deadlines, and source-backed completion.
- [x] Generate C18 and implement eligibility/deadline/checklist-oriented benefits detail and review baseline.
- [ ] Add effective-period, region, documentation, stale-policy, and handoff-first enrollment states.
- [x] Generate C21 and implement site/date/currency/dietary-labeled campus menu results and detail.
- [ ] Add validity/hours, allergen-source caveats, expired menu, and unavailable-information states.
- [x] Generate C24 and implement site/category/evidence workplace-help review baseline with emergency wording.
- [ ] Add confirmed floor/location, safe attachments, source receipt/status timeline, and emergency handoff.
- [x] Generate C29 and implement recent/curated file result and detail baselines with source metadata.
- [ ] Add permission recheck, moved/deleted/revoked states, native open, and preference-only pinning.

### Wave 3 specialist capabilities

- [x] Generate C19 and implement grant/vesting/unit/as-of detail with explicit no-advice wording.
- [ ] Add canceled/forfeited, masked value, price-date/currency, and source-document states.
- [x] Generate C20 and implement line/currency/policy-oriented expense review and receipt baseline.
- [ ] Add safe attachments, duplicate receipt, exchange policy, upload failure, and travel handoff.
- [x] Generate C22 and implement room/equipment/accessibility result and reservation-review baseline.
- [ ] Add room/desk distinction, interval/time zone, availability recheck, conflict, and alternatives.
- [x] Generate C25 and implement local-time shift detail with explicit attendance-source wording.
- [ ] Add overnight/DST, permitted request, device/policy checks, offline, and clocking safeguards.
- [x] Generate C26 and implement project health/milestone/risk evidence with selected detail.
- [ ] Add reporting-period/currency reconciliation, dependencies, access trimming, and aggregate-leak tests.
- [x] Generate C27 and implement metric/fiscal-scope/target/currency D3 chart with materially changing
  geometry, exact-value table, and no-CRM-write wording.
- [ ] Add governed metric definitions, filtered-row reconciliation, stale/no/zero target, mixed currency, and RLS states.
- [x] Generate C30 and implement privacy-safe team availability/coverage and manager-action baseline.
- [ ] Add authorized scope and typed delegation to C05/C12/C13/C16 rather than duplicated HR workflows.

### Full-catalog gate

- [x] Define catalog-owned authoring profiles for all 35 feature web parts and three composed workspace
  web parts, with valid defaults, feature-specific Top Action choices, bounded item counts, and only
  relevant advanced property-pane fields.
- [x] Implement beta.5 Top Actions through the public `@microsoft/sp-top-actions` button/dropdown API,
  pin the package directly, rerender immediately on changes, and open the property pane from Advanced
  settings. Fixed Company/Personal workspaces do not expose a start-tab switch.
- [x] Assert all 35 profiles are complete and reject page-author properties in the packaged 37-function
  Copilot plugin; the current 46 tests pass and the generated plugin validator confirms the boundary.
- [x] Brand the agent as Zava One with deterministic manifest-safe icons: 192x192 white Z on Zava blue
  for `color.png`, and a padded white Z on a transparent 32x32 canvas for `outline.png`. Validate exact
  source-to-ZIP bytes, icon paths, display names, and `#075FCE` accent color during every build.
- [x] Replace the universal scope/search/list experience with purpose-built C01 My Day, C02 Agenda,
  C32 Glossary, and C33 Security Reporting flows. Give the remaining grammars only meaningful controls
  and distinct alert, timeline, people, directory, document, queue, service-card, or chart structures.
- [x] Rebuild Personal full screen around the My Day reference: one private greeting, all 18 Personal
  capability modules, optional Company highlights, animated Plan My Day and Personalize drawers,
  session-local module visibility, and catalog-derived tab ownership. Never duplicate the invoking
  inline component above the portal.
- [x] Render the 17 non-My-Day Personal experiences through their full shared interactive UX in three
  independently stacked columns. Add accessible pointer/keyboard drag handles, cross-column drop zones,
  and normalized session-storage persistence so order returns on the next full-screen opening.
- [x] Add Personal `Edit layout` / `Done` mode switching in the Company/Personal bar. Keep move and X
  controls absent in normal mode; synchronize X-hidden panels with Personalize and persist visibility
  for the session so a hidden panel can be restored from the drawer.
- [x] Move Personalize from the My Day hero into the Personal bar as `Edit layout | Personalize` with
  edit/settings icons, responsive icon-only controls, and no connected-experience count label.
- [x] Reuse the My Day full-screen side-rail model for Plan My Day and Personalize: 380px sibling panel,
  no modal backdrop, 250ms slide-in, host-owned page scrolling, 800ms planning pause, and
  220ms streamed focus recommendations. Preserve this subtle keynote sequence in Workbench even when
  its embedded browser reports reduced motion, so the planning state is not skipped during the demo.
- [x] Give all 18 Personal Copilot components one shared top-right Expand control: icon + text when the
  component is wider than 520px and a true 32x32 icon button below it. Tenant-test every component
  through expand/collapse and verify Personal routing, greeting, Plan My Day, Personalize, the complete
  18-module portal, no duplicate focused component, no alerts, and intent-preserving model context.
- [x] Reuse one Tasks checklist/progress body, one sender-face Important Mail/Outlook body, and one
  Learning assignment body across standalone Personal components, My Day drill-down, and full screen.
  Add expense-category icons, neutral Shift borders, file-type icons, white My Day Expand treatment,
  fixed top-right Agenda expansion, and Review in Outlook for every meeting.
- [x] Replace the generic approval/service-submit treatments with fixture-backed end-to-end workflows:
  approval queue and decision, learning detail and continuation, time-off history/request/receipt,
  received-versus-estimated equity, expense report submission/removal, delayed room search/booking,
  personal/known/new IT issues, and searchable branded Work Files.
- [x] Synchronize inline Copilot canvas size after React state changes and animation settling. Workbench
  verifies Expenses grows `675 -> 891` and shrinks to `675`, while IT Help changes `474 -> 701 -> 474`.
- [ ] Verify Top Action toolbar rendering, persisted values, and property-pane synchronization on a live
  modern SharePoint page in edit mode; the hosted Workbench cannot render this host chrome.
- [x] Assert C01-C35 appear exactly once in the registry, each has one owner, route, operation,
  education record, default layout, prompt, routing boundary, preview, fixtures, and test matrix.
- [x] Assert all 35 features have exactly one generated SharePoint-only web part, exactly one generated
  Copilot Component, and exactly one shared module used by both; reject wrapper-owned duplicate UI,
  calculations, validation, or fixture data.
- [x] Assert exactly three web parts are Teams-enabled (combined, Company-only, Personal-only), each
  standalone app package supports personal scope only, fixed variants omit the Company/Personal control, and no
  feature-level web part gains Teams or SharePoint full-page exposure.
- [ ] Render and smoke-test every intent in the local harness at all required widths/themes; verify no
  nested global headers, external writes, runtime errors, image failures, or overflow.
- [x] Render all 35 inline intents at the standard review width: 35 unique layouts, zero runtime errors,
  zero horizontal overflow, and zero broken images (`ux-review/evidence/phase-6-matrix.json`).
- [x] Capture one settled evidence image per intent and each workspace state: 35 inline experiences and
  four Combined/Company/Personal workspace states in `ux-review/evidence/all-experiences/`.
- [ ] Complete the full-gallery multimodal/human review for repetition, density, crop, alignment,
  contrast, and keynote readability; representative Company/C06/C27/C34/C35 pixels are already reviewed.
- [x] Validate bundle/media duplication and measured package thresholds before proceeding: two host-specific
  bundles, 28 media assets, and a version `1.0.0.15`, 6,205,670-byte `.sppkg`.

## Phase 7 - Configuration Impact and Showcase Polish

### Session-safe preferences

- [ ] Implement a versioned session-only preference adapter for the keynote with explicit
  `This session only` language; never imply durable cross-device sync.
- [ ] Implement separate confirmed/draft Company and Personal recipes, default tab, allowed visibility,
  keyboard reorder, density, locale/site/time format, Save, Cancel, reset, failure, and conflict states.
- [ ] Keep Company news/events protected, required learning and applicable notices policy-visible, and
  Personal Company highlights retained.
- [ ] Prove each retained setting changes actual composition, records, formatting, or navigation.

### Keynote finish

- [x] Validate all 35 components, configured primary views, representative submission/detail flows,
  poll results/change-vote, and workspace controls at phone/tablet/desktop and desktop-column widths,
  including dark mode: 4,080 browser states, zero clipping/runtime/image failures.
- [x] Replace viewport-only experience breakpoints with actual container sizing, reflow narrow rows
  and form/card grids, and stack narrow personalization panels without squeezing dashboard content.
- [x] Share the polished Praise-style receipt across submission/decision experiences, preserving
  references, pending statuses, return/reset actions, and explicit fixture-only boundaries.
- [x] Rebalance fresh Company and Personal defaults with measured card moves; preserve saved session
  layouts and validate desktop column-height spread at 1280/1440/1600px.

- [ ] Curate the final fixture narrative so news, events, learning, praise, vacation decisions, other
  approvals, offices, tasks, outcomes, and help tell one coherent Zava story with the approved persona
  catalog, believable relationships, and dates.
- [ ] Editorially review every Zava headline, summary, byline, article detail, portrait, and image crop at
  all six C06 layouts. Reject lorem ipsum, repeated imagery, generic labels, implausible corporate copy,
  inaccessible crops, and content that does not support the keynote narrative.
- [ ] Add restrained staged entrances and Card Stage transitions with reduced-motion equivalence; remove
  decorative motion and simulated AI typing delays.
- [ ] Audit editorial image crops, portraits, chart labels, map framing, card density, controls, focus,
  empty/error states, dark/forced-color contrast, localization, RTL, and projector scaling.
- [ ] Audit every visible control again; remove or replace anything whose behavior cannot be proven.
- [ ] Measure useful-content timing, bundle/runtime/media cost, and screenshot stability in the recorded
  environment; establish budgets from evidence rather than invented universal limits.

### Demo enablement

- [x] Create presenter-ready five-minute keynote, ten-minute technical, and twenty-minute feature
  showcase scripts with exact prompts, routes, UI targets, timing, recovery cuts, and honest host gates.
- [x] Write and rehearse a 60-90 second keynote flow with deterministic reset points and an offline
  fallback that demonstrates the same product truth.
- [x] Write a longer business journey covering Company, Personal, Copilot continuation, one review,
  one submit preview, C35 cross-surface vacation status updates, personalization, and the C34
  visualization.
- [x] Write a technical walkthrough covering generated identities, shared adapters, catalog automation,
  state ownership, bridge snapshots, fixture services, accessibility, and package evidence.
- [x] Save demo prompts, expected routes, screenshots, reset procedure, and failure recovery in the repo.

### Phase 7 gate

- [ ] Run the full visual matrix: 320, 390, 768, 1024, 1440, keynote/projector, light, dark, forced
  colors, reduced motion, 200% zoom, keyboard, image/chart checks, and screen-reader naming.
- [ ] Complete human/multimodal pixel review and record approval for keynote use.

## Phase 8 - Package, Publication, and Release Evidence

### Local executable gates

- [x] Increment the final App Catalog solution and feature versions to `1.0.0.15` while preserving solution,
  feature, component, and agent identities for upgrade deployment.
- [x] Run catalog, React baseline, routing matrix, media, embedded media, gallery, publication, visual,
  clean test, production build, generated plugin, package-output, release-evidence, diagnostics, and
  `git diff --check` gates with zero warnings/errors.
- [x] Inspect the actual `.sppkg` JavaScript, manifests, embedded agent ZIP, icons, media count, shared
  bundle membership, paired feature registrations, three Teams-enabled workspace registrations,
  stale output, and measured size thresholds.
- [x] Inspect the three standalone Teams manifest archives for unique identities,
  names, icons, personal-only scope/context, launch mode, shared component references, and absence of all
  feature-level web parts.
- [ ] Run a clean-clone/offline rehearsal with `npm ci`, no runtime network, repeatable screenshots, and
  the one-command build.
- [x] Prove fresh Git-index checkout stability without regeneration: LF/CRLF regression tests and all
  generated-file, media, routing, publication, Teams ZIP, release-evidence, and SPPKG gates pass using
  the installed dependency baseline. This is not a replacement for the separate `npm ci` rehearsal.
- [x] Commit the validated `sharepoint/solution/zava-one-hub.sppkg` and generated release-evidence JSON.

### Tenant-host evidence

- [x] Record the sample author's working Teams personal-app baseline and three authenticated viewport
  screenshots. Preserve host chrome, remove only the four-pixel frame, and verify every retained pixel.
- [ ] Complete the broader authenticated host matrix: SharePoint web-part composition/mobile DOM order,
  Teams personal-app accessibility,
  Copilot Workbench inline/full screen, bridge context/follow-up, expansion denial/collapse, iframe CSP
  and focus, selected ACE/Quick View, screen reader, and real catalog routing when supplied.
- [ ] Record actual host/version/account prerequisites, screenshots, unsupported preview behavior, and
  known limitations without substituting local harness evidence.

### Publication gate

- [x] Confirm package hashes, feature-pair/component/tool counts, Teams-enabled web-part count,
  bundle/media counts, screenshot inventory, routing matrix, README links, demos, and release claims are
  generated from current artifacts.
- [x] Stop task-owned temporary servers, update the Progress block and duplicated measured counts, and
  distinguish external sign-off gates from deferred production-feature work.

## Deferred - Dynamic Data and API Integration

These items are not part of the offline keynote package and must not block its local completion.

- [ ] Approve one provider at a time with named owner, exact API/version, least-privilege scopes,
  identity mapping, source schema, access/eligibility, freshness, paging/throttling, cache, failure,
  idempotency/reconciliation, audit/retention, licensing, and support contract.
- [ ] Implement live Graph/SharePoint adapters for calendar, mail, tasks, people, files, news, events,
  search, and approved content only after tenant permission review.
- [ ] Implement protected backend integrations for HRIS, payroll, benefits, equity, CRM, project,
  finance, LMS, expenses, workplace, ITSM, surveys, market data, map/geography, and security intake.
- [ ] Implement durable preference and opaque private-continuation services only after authorization,
  concurrency, retention, migration, and regional privacy approval.
- [ ] Replace simulated mutation outcomes with operation-specific live commands, source revisions,
  idempotency keys, pending/conflict/unknown reconciliation, and authoritative receipts.
- [ ] Revalidate tool schemas, agent routing, deployment/provisioning, permissions, CSP, telemetry,
  rollback, support, and package architecture for each enabled provider.
- [ ] Never turn a live-provider failure into fixture data or a synthetic success receipt.

## Docs and Cleanup

- [x] Replace the placeholder README with the PnP sample template content for Zava One: objectives,
  cross-product experiences, architecture, fixture/data story, prerequisites, setup, limitations,
  screenshots, demos, package link, version history, authors, and references.
- [x] Author `assets/sample.json` from actual metadata and validated PNGs; preserve gallery ordering and
  link only to real assets.
- [x] Recapture and individually review 12 complete local publication images and three genuine Teams
  viewport overviews; verify content geometry, correct states, source hashes, and exact Teams crop pixels.
- [x] Recapture all 35 inline engineering images and four workspace states with the pinned browser
  runner; assert actual viewport size, correct layout, loaded images, bounds, and no horizontal clipping.
- [x] Add reproducible screenshot/crop scripts and validators, and synchronize the publication gallery,
  release matrix, package hashes, screenshot metadata, README, and demo evidence counts.
- [x] Add architecture and data-flow diagrams, catalog/routing documentation, host matrix, privacy and
  accessibility notes, media provenance, test commands, and release evidence links.
- [ ] Reconcile design documents only where implementation decisions legitimately supersede proposals;
  preserve history and mark measured limitations honestly.
- [x] Remove the diagnostic `Baseline` scaffold and all placeholder names/descriptions/properties only
  after the G0 receipt and final-named generated replacements exist.
- [x] Remove temporary harness output that is not part of approved evidence; retain reproducible scripts,
  machine-readable matrices, selected screenshots, and the committed package.

## Reusable Playbook

Implementation follows [agentic-creation-rules.md](agentic-creation-rules.md). This tracker specializes
that playbook for the design-selected beta.5 preview, 35 paired SharePoint/Copilot feature hosts, one
composed SharePoint/Teams workspace, the shared full-screen Copilot control, two-tab workspace, Card
Stage interaction model, and keynote evidence requirements. The playbook remains the authority for
engineering quality, automation, safety, testing, and packaging where this file is silent.

## Open Decisions

- [ ] Approve or revise the proposed final names for 35 web-part/Copilot pairs, the three composed
  workspace web parts, the neutral workspace Copilot entry, and the capability explorer.
- [ ] Confirm the keynote stopping gate. The complete solution still requires all 35 paired feature
  hosts; a bounded keynote milestone may stop earlier only if unimplemented pairs are visibly excluded
  and not represented as available.
- [ ] Confirm keynote deadline and the required stopping gate: G1 reference slice, G4 Company showcase,
  G5 Company + Personal essentials, or full G6 fixture breadth.
- [ ] Select the native ACE reference; Teams has three approved composed workspace surfaces, not
  separate feature apps.
- [ ] Approve final editorial/portrait/map assets, provenance, and any generated-versus-licensed media.
- [ ] Approve the fictional company listing/feed treatment for C31 or mark the module inapplicable.
- [ ] Name the developer tenant/app catalog and test accounts needed for tenant-host evidence.
- [ ] Name product, communications, HR/privacy, security, accessibility, and source owners for later
  business and production approvals.
- [ ] Decide whether durable preferences/private continuation are required for a later pilot; the
  keynote remains explicitly session-only.
- [ ] Approve the eventual production baseline separately; beta.5 preview success is not production
  readiness or marketplace approval.