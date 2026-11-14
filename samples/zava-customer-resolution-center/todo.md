# Zava Customer Resolution Center - Creation Plan

## RC0 update - October 20, 2026

The current application baseline is SPFx 1.24.0-rc.0, React/ReactDOM 18.3.1, React types 18.3.31/18.3.7, and Heft 1.3.2. Current validation, exact packages, starter targets, findings, and external release gates are recorded in the [repository RC0 readiness report](../../RC0-updates.md). The local creation guide is synchronized byte-for-byte with the assets golden guide.

Starter exception: retain six distinct operational flagship starters. Capability discovery is still explicitly routed through ExploreAgentCapabilities when asked for help; it is not the final starter in this curated six-story portfolio. Public media-rights approval remains blocked independently of local technical validation.

Earlier entries below retain their implementation history. Old framework versions, test totals, byte counts, and hashes in that history are not current RC0 release evidence.

This is the implementation tracker for the product and UX brief in [README.md](README.md). The sample
follows [agentic-creation-rules.md](agentic-creation-rules.md). No dependency changes, component
generation, placeholder cleanup, mock implementation, or React feature work begins until Phase 0 is
approved.

## Status legend

- `[ ]` open work
- `[x]` validated work
- **IN PROGRESS** marks the one active implementation slice
- **BLOCKED: reason** identifies an external decision or prerequisite

## Progress (latest)

> **Flagship inline implementation, 22 September 2026:** all six modernization stories are implemented.
> Two submissions use stage replacement and typed fields; two review tools use compact three-item
> queues with editable decisions, receipts, responsive queue/detail replacement, and next-item advance;
> two visual answers use materially different controls, D3 geometry, three-value summaries, and
> collapsed exact tables. The automated flagship gate passes 24 checks with 22 light/narrow/dark and
> stage screenshots. Measured body heights are 399-444 px for submit drafts, 335-375 px for submit
> review, 437 px for review drafts, 398 px for review confirmation, 397 px for desktop charts, and
> 455-523 px for narrow chart/review detail, all without horizontal overflow. The full matrix passes
> 81 captures across all 23 intents with zero failures and 36 distinct layouts. Final routing,
> publication, package, and external host gates remain active below.

> **Inline business-process modernization reset, 22 September 2026:** the Zava IT Concierge rendered
> experiences and owning source were reviewed against this sample. The 23 immutable generated
> identities remain valid, but catalog breadth and full-screen dashboards are no longer the keynote.
> Six existing tools are now the flagship inline portfolio: two compact submissions, two one-at-a-time
> review queues, and two focused visual answers. All three implementation slices now pass their local
> behavior and visual budgets; final routing rehearsal and external host/accessibility gates remain.

> **Release-candidate packaging, 22 September 2026:** the canonical `npm run build` pipeline passes
> all local intent, React, routing, media, gallery, publication, clean-test, generated-plugin, package-
> output, and release-evidence gates. The committed testing artifact is
> `sharepoint/solution/zava-customer-resolution-center.sppkg` (369,440 bytes; SHA-256
> `3f9104422470d80a81691698326c1e10688d038561ab1763c80a99943a5d14d8`). It contains one
> 605,450-byte hashed production JavaScript bundle, one current agent ZIP, five unique media files,
> and 23 component definitions. The suite passes 41 tests with zero failures and zero warnings.
> This is ready for guided package testing; the explicitly blocked public media-rights approval and
> remaining authenticated host/accessibility checks are still required before public release sign-off.

> Inline acceptance hardening completed locally on 18 September 2026. Eleven genuinely case-scoped
> tools now share a catalog-owned navigation contract: no `caseId` opens ranked search, a valid
> `caseId` opens exact detail, an unknown ID has a designed no-match state, and every detail exposes
> **Back to case search**. Selection and query changes publish bounded visible state to Copilot. The
> Teams/Copilot manifest now carries Zava product metadata, and the four-minute keynote focuses on the
> component UX. The broader keynote-quality redesign provides a coherent 12-customer/500-case service
> graph, exhaustive 23-intent dispatcher, four distinct dashboard roots, D3-derived charts, a real
> offline Natural Earth projection, exact-value tables, five provenance-matched portraits, and guarded
> session receipts. The canonical build passes 38 tests with zero warnings. The tenant-free matrix
> passes 81 captures with zero runtime/overflow/image/chart failures and 38 unique layouts. The audited
> 365,327-byte `.sppkg` contains one 585,614-byte hashed JS bundle, one current agent ZIP, five unique
> media files, and 23 definitions; SHA-256 is
> `bc6176d04d95a79d9b0aced16cca6c3cbaf82a587c26f760c7c46e40e3c55736`. Authenticated tenant behavior,
> localization/RTL completion, exhaustive browser interaction semantics, and public media rights remain
> open and are not claimed complete.

> **Microsoft review readiness, 18 September 2026:** ready for design critique and guided validation;
> not ready for final functionality/accessibility sign-off. Local alignment, responsive pixels,
> component uniqueness, case navigation, incident threshold interaction, and workspace continuation
> are proven. Exact subroutes, selected queue detail, complete workflow context, follow-up invocation,
> failure-state boards, accessibility evidence, and authenticated host behavior remain open.

## 22 September 2026 - Inline modernization reset

This section supersedes the earlier keynote emphasis on catalog breadth, portfolio navigation, and
multi-chart full-screen dashboards. Existing completed engineering evidence remains valid. The new
acceptance target is a compelling business-process demo in which Copilot selects a small, deterministic
application surface that lets a person create, review, or understand customer-support work without
leaving the conversation.

### Reference findings and design decision

- [x] Inspect Zava IT Concierge inline submit, approval queue, and chart experiences at rendered and
  source levels, including their owning forms, operation stages, queue/detail composition, charts,
  responsive rules, and full-screen continuation.
- [x] Identify the target root cause: this sample often composes case search, a four-metric case
  preamble, domain evidence/chart content, and `OperationFlow` vertically. The individual modules are
  useful, but their simultaneous rendering makes submit and review tools feel like long reports rather
  than compact inline applications.
- [x] Retain the 22 operational components plus `ExploreAgentCapabilities`; do not add or rename a
  generated component for this redesign. Six existing identities already provide two strong stories
  per required operation type, and preserving them avoids unnecessary routing collisions and new
  scaffold work.
- [x] Adopt the IT Concierge interaction model: one current task, one dominant visual or form, one
  visible consequence, and one primary action. Draft, review, confirmation, and receipt replace each
  other in the same bounded region rather than accumulating down the page.
- [x] Keep full screen as optional continuation for deeper evidence and coordinated work. Inline must
  complete a useful create/review/answer loop without requiring expansion.

### Flagship inline portfolio and intent mapping

| Type | Intent and story | Canonical prompt | Compact inline contract | Full-screen continuation | Nearest-sibling boundary |
| --- | --- | --- | --- | --- | --- |
| Submit 1 | `TriageCustomerIssue`: create a case from the customer's report | “42 Alpine House stores cannot activate their handhelds. Create the support case.” | Four essential fields, entitlement/SLA preview, Review, Confirm, session receipt | `my-queue/new-case` | Do not use when a case already exists; use diagnosis or planning instead. |
| Submit 2 | `ComposeCustomerUpdate`: create a reviewed customer update | “Draft a French and English update for Alpine House with the next update time.” | Recipient/channel/language, editable message, verified-fact chips, Review, Confirm mock send, receipt | `customer-360/communications` | Do not expose internal diagnosis or approve a recovery remedy. |
| Review 1 | `ReviewIncidentResponse`: work incident candidates one by one | “Review today's activation incident candidates and help me decide the next one.” | Three-row queue plus one selected candidate; editable Declare/Monitor/Close decision and rationale; Confirm advances to next | `resolution-room/incident-review` | Detection finds a cohort; this tool makes a decision on an existing candidate. |
| Review 2 | `ReviewServiceRecovery`: work recovery requests one by one | “Review pending customer recovery requests, starting with Alpine House.” | Three-row queue plus selected remedy; editable option/amount/rationale; Approve/Request approval/Decline; Confirm advances to next | `customer-360/service-recovery` | Entitlement explains coverage; this tool decides a proposed remedy. |
| Visual 1 | `DetectServiceIncident`: answer whether cases form an incident | “Are today's activation failures isolated or one emerging incident?” | One interactive emergence graph, threshold control, three exact summary values, compact accessible table disclosure | `service-operations/incident-detection` | Do not declare, monitor, or close an incident. |
| Visual 2 | `ExploreServicePerformance`: answer whether resolution keeps pace | “Is customer-service resolution keeping up with demand today?” | One demand-to-resolution river, period selector, current/peak/gap values, compact accessible table disclosure | `service-operations/demand` | Regional and recurring-driver questions route to their dedicated visual tools. |

The remaining 16 operational tools are supporting depth for technical walkthroughs and capability
discovery. They must remain functional and routable, but they do not compete for keynote time until all
six flagship tools pass the compact inline gate.

### Compact inline UX contract

- [ ] Replace the generic case-search-first treatment for the four scoped flagship submit/review tools
  with operation-owned entry: prompt scope opens the exact task; missing scope opens a compact three-
  item task queue, not the generic eight-result case browser.
- [ ] Render only one submit stage at a time: **Draft -> Review -> Confirm -> Receipt**. Preserve edited
  values between stages and provide **Edit** from Review and **Start another** from Receipt.
- [ ] Render review tools as queue + selected item, not chart + generic textarea. At 760 px, keep a
  220-260 px three-row queue beside detail. At 340 px, show either queue or detail with **Back to
  reviews**, **Previous**, and **Next**; never stack the full queue above the full detail.
- [ ] Make review fields operation-specific: incident decision/rationale/audience/cadence and recovery
  remedy/amount/authority/rationale. Remove the generic freeform `OperationFlow` textarea from these
  flagship reviews.
- [ ] Keep chart answers to one visualization, one compact control row, no more than three headline
  values, one sentence of interpretation, and a collapsed-by-default accessible exact-value table.
- [ ] Use stable inline body budgets measured below the shared header: at 760 px width, target <= 480 px
  for Draft/queue/chart and <= 420 px for Review/Receipt; at 340 px width, target <= 620 px with no
  horizontal overflow. Height changes must call `requestSizeChangeAsync` once per settled stage.
- [ ] Keep primary actions visible without scrolling at 760 px. On 340 px, preserve source order as
  task context -> editable content -> consequence -> primary action.
- [ ] Use purposeful visual identity: customer-language intake for triage, verified-fact/message studio
  for communication, emergence network for incident review/detection, authority-and-outcome comparison
  for recovery, and exact-value chart treatment for analytics. Shared framing must not make the six
  experiences look like one generic form.
- [ ] Publish bounded model context after task selection, material edit, stage transition, decision,
  chart control change, and receipt. Do not publish every keystroke or sensitive freeform rationale.

### Connected demo story

The primary business-process story is **Alpine House launch recovery**. It demonstrates that Copilot
routes natural language into deterministic UX while people retain control over business records and
consequences.

1. **Create the case:** `TriageCustomerIssue` turns the customer's report into a reviewed case with
   entitlement and SLA consequence, then returns a session-only case receipt.
2. **See the pattern:** `DetectServiceIncident` answers whether the new issue is isolated; changing the
   threshold materially changes the cohort and exact values.
3. **Review the incident:** `ReviewIncidentResponse` opens the highest-impact candidate, records a
   Declare/Monitor/Close decision, and advances to the next queue item.
4. **Review recovery:** `ReviewServiceRecovery` compares authorized remedies for the affected
   customer, confirms one decision, and advances the recovery queue.
5. **Communicate safely:** `ComposeCustomerUpdate` drafts from verified facts, exposes the next-update
   promise, and records a mock-send receipt only after review.
6. **Show operational improvement:** `ExploreServicePerformance` shows whether resolution is catching
   demand after the intervention, with exact values and optional full-screen continuation.

- [x] Rewrite the four-minute keynote around these six beats; remove capability breadth, directory
  navigation, and multi-chart dashboard operation from the main-stage path.
- [x] Rewrite the ten-minute business demo to add queue navigation, Edit, rejection/request-approval,
  receipt/reset, responsive 340 px behavior, and one inline-to-full-screen continuation.
- [x] Rewrite the five-minute technical demo around catalog routing boundaries, compact stage state,
  queue selection, model-context snapshots, size requests, accessible chart tables, and session-only
  receipts.
- [x] Update conversation starters so at least one targets each flagship story and the final starter
  remains capability discovery only if the host permits seven; otherwise capability discovery moves to
  the agent greeting and all six starters target the demo portfolio.

### Implementation and evidence plan

#### Slice A - Compact submit shell

- [x] Replace the multiline generic `OperationFlow` for flagship submissions with a typed compact
  stage shell that accepts operation-specific fields, review summary, consequence, confirmation, and
  receipt content.
- [x] Rebuild `TriageCustomerIssue` as the reference submit: four essential inputs, visible SLA/
  entitlement consequence, stage replacement, validation, Edit, Confirm, Receipt, and Start another.
- [x] Rebuild `ComposeCustomerUpdate` on the proven shell with editable verified facts, channel,
  language, next-update promise, customer-safe review, mock-send receipt, and no internal evidence.
- [ ] Add focused tests for prefill, required validation, edit parity, double-confirm prevention,
  receipt/reset, model-context snapshots, and deduplicated size requests.
- [x] Capture and inspect both submit tools at 340/760 light, 760 dark, Review, validation, and Receipt;
  reject any state exceeding the inline budget or hiding its primary action at 760 px.

#### Slice B - One-at-a-time review queues

- [x] Add a reusable three-item review queue primitive with selected-state semantics, pending counts,
  Previous/Next, responsive queue/detail replacement, and automatic advance after a confirmed action.
- [x] Rebuild `ReviewIncidentResponse` with candidate-specific graph/evidence, editable decision,
  rationale, audience/cadence consequence, confirmation, receipt, and next-item advance.
- [x] Rebuild `ReviewServiceRecovery` with customer/remedy queue, editable scenario and amount,
  authority/precedent/customer-outcome consequence, decision options, receipt, and next-item advance.
- [ ] Add tests for empty queue, select, edit, back, previous/next, approve, decline, request approval,
  automatic advance, final-item completion, keyboard focus, model context, and session reset.
- [x] Capture and inspect queue/detail/decision/receipt at 340/760 light and 760 dark with no nested
  scrolling, no full generic case preamble, and one clearly dominant next action.

#### Slice C - Focused visual answers

- [x] Restyle `DetectServiceIncident` and `ExploreServicePerformance` against one shared chart-quality
  contract while retaining distinct compositions and color semantics.
- [x] Add period control and materially different data to the demand river; retain the incident
  threshold's materially different cohorts and contrary case.
- [x] Add concise interpretation, three headline values maximum, visible axis/legend labels, and a
  collapsed-by-default accessible exact-value table to each chart.
- [ ] Test control effects on marks, paths, values, summaries, table rows, model context, keyboard
  operation, reduced motion, and no-data/error states.
- [x] Capture and inspect both charts at 340/760 light and 760 dark for label fit, hierarchy, contrast,
  nonblank marks, keynote readability, and inline height.

#### Slice D - Story, regression, and release evidence **IN PROGRESS**

- [x] Run a six-tool routing collision matrix covering positive prompts, omitted IDs, ambiguous
  incident detection/review prompts, entitlement/recovery prompts, and demand/driver/regional prompts.
- [x] Re-run all 23 intent defaults to prove the redesign does not regress supporting tools.
- [x] Automate flagship stage screenshots and machine-readable height, overflow, chart-effect, action-
  visibility, queue-advance, and responsive-replacement evidence.
- [ ] Add bridge call-count/model-context payload assertions and exhaustive keyboard focus restoration
  for the six flagship workflows.
- [ ] Rehearse the six-beat story inside four minutes with deterministic reset and screenshot fallback.
- [x] Refresh README gallery, demo documents, routing matrix, release evidence, Teams agent ZIP, and
  `.sppkg` only after all flagship local gates pass.

### Modernization acceptance gate

- [x] Two submit tools complete Draft -> Review -> Confirm -> Receipt -> Start another inline.
- [x] Two review tools expose a real queue and complete item decisions one by one with editable fields,
  explicit consequences, receipts, and automatic advance.
- [x] Two chart tools answer distinct leadership questions with beautiful responsive visuals,
  materially effective controls, concise interpretation, and exact accessible values.
- [ ] All six route from canonical prompts with no nearest-sibling collisions and preserve exact context
  into their declared full-screen destinations.
- [ ] All six pass 340/760 light, 760 dark, keyboard, focus, 200% zoom, reduced-motion, and bounded-height
  checks in the tenant-free harness; representative submit/review/chart states pass authenticated
  Workbench validation before the redesigned package is called release-ready.

## Approach and sequencing

1. Lock the six-beat keynote, immutable catalog, routes, package identity, visual contract, media plan,
   workspace purposes, routing boundaries, and acceptance evidence.
2. Remove the untouched placeholder through an explicit cleanup step, then generate every approved
   final identity with Yeoman. Never rename or repurpose the placeholder.
3. Pin and validate React 18, Fluent v9, Griffel, focused D3 modules, Jest, catalog automation, and one
   shared-bundle strategy before feature React work.
4. Build the deterministic service domain, calculations, policy packs, session overlay, and reset before
   broad UI work.
5. Prove the premium shared host and keynote UX with `BuildResolutionPlan`,
   `DetectServiceIncident`, `ReviewServiceRecovery`, and exact Resolution Room continuation.
6. Complete the connected Alpine House journey and prove that confirmed actions change later roles'
   first useful states.
7. Scale purpose-designed component families and four genuinely different full-screen lenses from the
   approved catalog.
8. Finish capability education, accessibility, localization, visual evidence, demos, package audits,
   and authenticated host validation.

The keynote uses six live beats. The eight-interface choreography is the extended business demo, and
catalog breadth is demonstrated through the capability explorer and technical walkthrough rather than
forced into the main-stage story.

## Phase 0 - Scope, visual contract, and identity lock

### Brief reconciliation

- [x] Review the current README against the complete agentic creation rules.
- [x] Inspect the named Revenue Deal Room reference at rendered desktop, mobile, dark, inline, source,
  media, responsive, visual-evidence, demo, and package levels.
- [x] Reconcile Gate 5 with the final target: 22 operational components plus
  `ExploreAgentCapabilities`.
- [x] Document the implementation thesis: one inspectable resolution object safely advanced by
  different roles, not a sequence of unrelated AI summaries.
- [x] Define the six-beat keynote and reserve the eight-interface choreography for the extended demo.
- [x] Approve Alpine House / `ZCR-1048` as the canonical connected hero record.
- [x] Approve the 22 operational tools plus `ExploreAgentCapabilities` as the immutable current catalog.
- [x] Split the overloaded `ExploreServicePerformance` inline answer into three independently routed
  visuals: demand river, regional impact map (`ddf21976-cb07-42dd-aec6-039d15758666`), and recurring-
  driver Pareto (`0f88d08f-04ee-47fb-8520-1a5e16a45877`). Keep coordinated multi-chart analysis in
  full-screen Service Operations only.
- [x] Approve all exact inline-to-full-screen destinations and ownership/negative-routing boundaries.
- [x] Confirm that all current tools satisfy at least two promotion tests; move any weaker candidate to
  an internal route before generation.
- [x] Approve the four-lens topology: My Queue, Customer 360, Resolution Room, and Service Operations.
- [x] Approve six conversation starters; retain host-count validation as a packaging check.

### Workspace purpose matrix

- [x] Define a unique persona, benchmark pattern, decision question, data grain, default composition,
  work, and “must not become” boundary for every lens in the README.
- [x] Approve My Queue as case/next-action grain with ranked work beside one selected case, not a KPI
  dashboard or compact Resolution Room.
- [x] Approve Customer 360 as customer/goal/commitment/interaction grain with a relationship
  constellation, not a CRM record dump or duplicate case timeline.
- [x] Approve Resolution Room as evidence/hypothesis/plan-step grain with the evidence canvas dominant,
  not a generic dashboard or chat transcript.
- [x] Approve Service Operations as cohort/queue/driver/outcome grain with intervention-led analytics,
  not four KPI cards or an enlarged queue.

### Visual-quality contract

- [x] Record the Revenue Deal Room qualities to adapt: strong hierarchy, disciplined density,
  restrained elevation, accountable portraits, exact-value visualization, responsive reflow,
  owner-document theming, tenant-free visual evidence, and package audits.
- [x] Record deliberate differences: no copied blue rail, rainbow strip, buying-committee orbit,
  commercial contour, close runway, forecast bridge, or repeated dashboard composition.
- [x] Approve the carbon/cloud/teal/coral/citrus palette mapped through Fluent custom theme tokens.
- [x] Approve the evidence-to-action visual grammar: customer language -> evidence -> plan -> authority
  -> promise -> outcome, with time and causality flowing left to right.
- [x] Approve typography, compact number treatment, icon style, elevation rules, and motion timing.
- [x] Approve the first pixel-review set: resolution plan at 340 px and 760 px, desktop/mobile/dark
  Resolution Room, recovery review, incident emergence, and partial-evidence/error state.
- [x] Approve the README written visual contract as the initial composition authority; create rendered
  evidence under `assets/` during the premium UX proof.
- [x] Create or approve written wireframes for representative inline and Resolution Room compositions
  under `assets/` before React implementation.
- [x] Approve a bundled, provenance-tracked people and domain-media plan, including reliable fallbacks;
  public redistribution rights remain a release gate.
- [x] Approve the people and domain-media plan, including intended use, source, rights, fallbacks, and
  whether customer imagery is appropriate for the public sample.
- [ ] Define visual state boards for loading, no match, stale evidence, partial source failure,
  permission denied, policy conflict, bridge/action failure, offline mode, and empty queue.

### Trust, safety, and demo contract

- [x] Approve the visual semantics for verified fact, deterministic calculation, inference,
  recommendation, human decision, and session action.
- [x] Approve the internal/customer-visible information boundary and the reviewed transformation used
  by customer communications.
- [x] Approve recovery authority bands, incident-declaration authority, sensitive commercial masking,
  and policy-pack assumptions as demo behavior rather than production authorization claims.
- [ ] Define the exact downstream state change and receipt produced by each keynote confirmation.
- [x] Define setup, reset, expected route, timing, narrator point, and screenshot fallback for every
  keynote beat.
- [ ] Select one explicit Copilot follow-up action and resulting fresh invocation for the required
  message-driven demonstration.

### Inline component acceptance contract

- [x] Audit all 23 component identities, routes, default layouts, operations, and model parameters.
- [x] Keep all 23 tool IDs/routes unique and all 27+ inline/workspace layout identities distinct.
- [x] Classify 11 case-scoped tools centrally; do not force case navigation onto aggregate, creation,
  customer, incident-cohort, commitment, win-back, or capability experiences.
- [x] For every case-scoped tool, open ranked search when `caseId` is absent and exact detail when it is
  present; retain an explicit **Back to case search** action from detail and unknown-ID states.
- [x] Publish current list/detail mode, query, selected case, route, and a bounded visible summary to
  Copilot whenever the inline view materially changes.
- [x] Give all 23 generated tool descriptions explicit **Use when** and **Do not use** boundaries for
  LLM routing; fail intent validation if any component lacks either boundary.
- [x] Publish a purpose-specific activation summary from every inline intent, including the visible UX
  - [x] Observe inline rendered dimensions and call `requestSizeChangeAsync(width, height)` when list,
    detail, workflow, filter, or responsive content size changes; clamp to advertised host dimensions,
    batch per animation frame, deduplicate equal sizes, and disconnect on teardown.
  grammar and relevant customer/case/selection/query context; preserve richer dynamic updates for case
  navigation, incident threshold, and capability selection.
- [ ] Add browser interaction evidence for search, no-match, selection, back, keyboard focus, and
  bridge updates across every case-scoped tool.
- [ ] Extend equivalent reversible navigation to customer-, incident-, commitment-, expert-, and
  capability-scoped tools using their own entity grain rather than a generic case picker.

### Package and existing scaffold decisions

- [x] Approve implementation-owned solution, feature, Teams app, declarative agent, plugin namespace,
  package descriptions, icons, and generated component IDs; public publisher/contact remains a release
  metadata check.
- [x] Approve solution, feature, Teams app, declarative agent, plugin namespace, publisher/contact,
  package title, descriptions, icons, and ownership of existing generated IDs.
- [x] Replace the current placeholder plugin metadata; ensure `name_for_human` is 20 characters or
  fewer, `description_for_human` is 100 or fewer, and `description_for_model` is 2,048 or fewer.
- [x] Approve one shared SPFx bundle for all component entries unless measured isolation evidence later
  justifies an exception.
- [x] Approve explicit removal of the untouched `CustomerResolution` placeholder component,
  localization, registration, and placeholder tool metadata; do not rename it into a final component.
- [x] Approve local implementation from the current README and tracker; GitHub synchronization remains
  a release/publication action.

## Phase 1 - Supported scaffolding and baseline automation

### Placeholder cleanup and immutable generation

- [x] Remove the approved untouched placeholder and verify no placeholder source, registration,
  localization, or manifest remains.
- [x] Generate the 22 operational components with final names using the supported SharePoint Yeoman
  Copilot Component command and the same pinned generator version.
- [x] Generate `ExploreAgentCapabilities` as its own education component through Yeoman.
- [x] Verify 23 unique generated component GUIDs, aliases, tool names, schemas, resources, and entries.
- [x] Configure one shared bundle with exact manifest coverage and no duplicate membership.

### Supported dependency baseline

- [x] Align all `@microsoft/sp-*` packages to one approved SPFx 1.24 RC0 generator output.
- [x] Pin React/ReactDOM `18.3.1`, React types `18.3.31`/`18.3.7`, Fluent React Components
  `9.74.6`, Fluent Icons `2.0.314`, and Griffel React `1.7.7` exactly.
- [x] Remove direct Fluent UI v8 after proving no active v8 imports remain.
- [x] Install Jest and only the focused D3 modules/types required by approved visuals.
- [x] Run dependency-tree checks, production audit, and `heft test --clean` with zero
  warnings before feature implementation.

### Catalog and fail-fast automation

- [x] Create one typed catalog owning operation model, identity, schema, route, preview, prompt,
  negative-routing boundaries, and education metadata for all 23 components.
- [x] Add catalog-driven configure and intent validation scripts.
- [ ] Add React baseline, routing matrix, media provenance, gallery, publication, generated plugin,
  package output, mock-media, and release-evidence scripts required by the playbook.
- [x] Make validators fail on duplicate IDs/tools/descriptions, wrong counts, placeholder metadata,
  missing resources/registrations, duplicate bundle membership, and route collisions.
- [x] Generate a routing matrix from canonical catalog data and use it in demos and rehearsal.
- [x] Add the ordered `validate` and production `build` commands.

## Phase 2 - Coherent service domain and deterministic workflows

### Canonical domain graph

- [x] Define source contracts and lean view models for customers, contacts, sites, products/versions,
  cases, interactions, entitlements, SLA policies, telemetry, diagnostics, knowledge, commitments,
  incidents, experts, recovery policies, communications, outcomes, and quality reviews.
- [x] Seed 12 curated customers, exactly three per region, and 500 cases with deterministic cross-record
  relationships. The reduced customer count is an approved demo decision so **All regions** shows every
  company without pagination while each region remains concise.
  contact/product-history scale remains an extension target.
  months across AMER, EMEA, APAC, and LATAM.
- [x] Make Alpine House / `ZCR-1048` coherent across keynote evidence, workflow, policy, receipt,
  and downstream views.
- [ ] Seed 8 incident candidates, 3 declared incidents, localized interactions, entitlement clauses,
  recovery authority bands, expert availability, CSAT, reopen events, and verified outcomes.
- [ ] Use stable IDs, one invocation clock, relative dates, and `Intl` for dates, duration, numbers,
  currency, and locale-sensitive output.
- [ ] Represent provenance and freshness in the type system, including fact, calculation, inference,
  recommendation, decision, stale evidence, and contrary evidence.
- [ ] Add referential-integrity, deterministic-seed, scale, localization-shape, and no-network tests.

### Calculations and policies

- [x] Implement and test priority ranking with visible contributing reasons; sentiment cannot
  automatically deny, compensate, or escalate.
- [x] Implement and test response/resolution SLA clocks and severity/entitlement effects with disclosed
  inputs; advanced pause/override policy remains open.
  entitlement obligations with disclosed inputs.
- [x] Implement and test diagnostic hypothesis support, incident similarity/cohort thresholds, and
  contrary-case handling.
- [x] Implement and test recovery cost, authority, precedent, and expected-outcome ranges.
- [ ] Implement and test workload, field readiness/route consequence, reopen risk, customer health,
  commitment risk, and service-performance aggregations.
- [ ] Put jurisdiction-specific recovery, privacy, recording, retention, and communication rules behind
  typed policy packs.

### Service and session boundaries

- [ ] Implement offline mock versions of `ICustomerServiceDataService`, `IWorkContextService`,
  `IKnowledgeService`, `IPolicyAndSlaService`, and `IWorkflowService`.
- [x] Implement immutable confirmed-action records, stable receipts, subscriptions, guarded
  `sessionStorage`, in-memory fallback, and Reset.
- [ ] Consume session state with stable snapshots and prove updates propagate across routes and roles.
- [ ] Verify unconfirmed drafts, host context, permission details, and sensitive values never enter
  shared session persistence or customer-visible output.

## Phase 3 - Shared host and premium UX proof

### Host lifecycle, theme, and bridge

- [x] Implement one persistent React 18 root per entry point, owner-document Griffel rendering,
  `FluentProvider`, current-user fallback, and teardown cleanup.
- [ ] Derive host theme/display mode directly from props and preserve component state across passive
  host rerenders.
- [ ] Implement normalized property signatures, fresh-invocation versions, and typed transient
  snapshots for filters, selections, drafts, and workflow stage.
- [x] Implement host-authoritative Expand and catalog-owned workspace/route metadata.
- [ ] Publish bounded deduplicated semantic model context only after committed material state changes.
- [x] Deduplicate identical model-context snapshots and publish case/list query, capability selection,
  and incident threshold/cohort changes without conflating generic selection IDs with case IDs.
- [x] Publish intent, route, display mode, selected entity, query/view, and a bounded purpose-specific
  visible-state summary for every component activation through `updateModelContextAsync`.
- [ ] Extend bounded model context to operation stage, reviewed draft, confirmation/receipt, active
  full-screen lens, and other retained analytical selections; add bridge call-count/error tests.
- [ ] Send follow-up messages only from explicit user actions with pending, error, and deduplication
  behavior.
- [ ] Add focused lifecycle, StrictMode cleanup, owner-document, passive-rerender, fresh-invocation,
  bridge, and no-sensitive-context tests.

### Representative information slice

- [x] Implement `DetectServiceIncident` with deterministic D3 cluster geometry, threshold controls,
  controls that materially rebuild the cohort, contrary evidence, exact records, and table equivalent.
- [x] Exercise the incident threshold in the browser: changing 72% to 90% updates visible cohort text
  and exact table classification from six related cases to two.
- [ ] Continue exactly to `service-operations/incident-detection` with cohort, threshold, dimensions,
  and selected cluster preserved.
- [ ] Design no-match, partial-evidence, stale-source, and permission-limited states.

### Representative submit slice

- [x] Implement `BuildResolutionPlan` with ordered steps, supporting/conflicting evidence,
  confidence, assumptions, owners, SLA consequence, and unsupported-promise validation.
- [ ] Complete Draft -> Validate -> Review -> Confirm -> Receipt -> Reset with live draft/review parity.
- [ ] Continue exactly to `resolution-room/plan` with case, draft, selected evidence, and current step.

### Representative review slice

- [x] Implement `ReviewServiceRecovery` with materially different remedy scenarios, policy, authority,
  cost, precedent, and customer-outcome consequences.
- [ ] Complete queue/detail -> evidence -> decision -> rationale -> confirmation -> receipt -> updated
  queue without implying a production approval.
- [ ] Continue exactly to `customer-360/service-recovery` with case, scenario, amount, evidence, and
  decision step.

### Resolution Room and visual approval gate

- [x] Implement the distinct Resolution Room shell with evidence canvas, persistent SLA edge,
  diagnostics, experts, incident signal, and bounded decision dock.
- [ ] Coordinate one selected evidence ID across plan step, visual connector, source detail, and
  accessible list/table.
- [x] Add five correctly named persona portraits with hash provenance and reliable fallbacks; public
  redistribution rights remain blocked below.
- [x] Capture and inspect all 23 intents at 340/760 light and 760 dark plus all four dashboards at
  keynote light, desktop dark, and mobile light.
  Resolution Room, recovery review, incident emergence, and a partial-evidence/error state.
- [ ] Validate runtime, console, image, overflow, focus, keyboard, reduced-motion, and 200% zoom evidence.
- [ ] Do not start sibling component bodies until the representative pixels and focused behavior tests
  pass this gate.

## Phase 4 - Connected Alpine House hero

### Six-beat keynote

- [ ] Beat 1: assemble Alpine House issue, customer, product, entitlement, sentiment, missing evidence,
  and six-hour resolution window from a natural-language prompt.
- [ ] Beat 2: select telemetry, reject the unsupported network inference, and visibly recalculate the
  diagnostic hypothesis and proposed plan.
- [ ] Beat 3: edit and confirm the grounded resolution plan; propagate owners, next action, and SLA
  consequence to My Queue and Resolution Room.
- [ ] Beat 4: change incident similarity controls, inspect contrary cases, and explicitly confirm a
  monitored incident decision.
- [ ] Beat 5: compare recovery remedies, expose authority and precedent, then confirm a session-only
  recovery receipt and localized customer update.
- [ ] Beat 6: show customer confirmation, promise status, operational cohort/outcome change, and a
  grounded knowledge draft.

### Hero reliability

- [ ] Implement deterministic setup/reset and a one-command keynote rehearsal state.
- [ ] Prove each confirmed receipt changes the next role's first useful state without mutating seeds.
- [ ] Prove exact context through inline expansion, lens navigation, role changes, and return navigation.
- [ ] Rehearse the live cut within five minutes with one explicit Copilot follow-up and no runtime
  network dependency.
- [ ] Save an ordered screenshot fallback that tells the same six-beat story.

## Phase 5 - Four-lens full-screen application

### My Queue

- [x] Implement the ranked queue and selected-case action workspace with SLA pressure, entitlement,
  SLA pressure, sentiment, entitlement, ownership, prepared work, and one recommended next action.
- [x] Make every ranked row selectable and explain its score through visible reasons, owner, impact,
  status, and SLA consequence in an adjacent decision workspace.
- [x] Add **Open resolution room** for the selected case and guarded **Mark resolved** -> **Confirm
  resolved** behavior that removes the item for the demo session and advances to the next priority.
- [x] Prove the workflow in the browser: select `ZCR-1140`, confirm resolution, reduce the queue from six
  to five, auto-select `ZCR-1048`, and continue into that exact Resolution Room.
- [ ] Implement exact routes for `my-queue/new-case`, `my-queue/priority`, and
  `my-queue/escalation`.
- [ ] Validate that My Queue does not repeat the Resolution Room evidence workspace.

### Customer 360

- [x] Implement relationship constellation, customer goals, service history,
  bilateral commitments, sentiment movement, and retention exposure.
- [x] When no `customerId` is supplied, open a searchable/filterable 12-customer directory with health,
  goal, region, tier, language, open cases, sites, exposure, and renewal risk; select a customer to open
  detail and retain **Back to customer search**.
- [x] Add distinct Alpine House, Northwind Traders, Contoso Retail, and Fabrikam Stores profiles with
  different goals, health, sites, exposure, case patterns, and bilateral commitments.
- [x] Give each named customer an explicit canonical case and evidence pack: Alpine activation
  (`ZCR-1048`), Northwind delivery synchronization (`ZCR-1001`), Contoso payment reconciliation
  (`ZCR-1002`), and Fabrikam inventory availability (`ZCR-1003`).
- [x] Use the named case evidence and customer-specific resolution steps in Resolution Room rather than
  relabeling Alpine evidence or relying on generator coincidences.
- [x] Guarantee at least three visible evidence records for every one of the 500 Resolution Room cases;
  preserve explicit canonical evidence and generate deterministic verified/inference/gap packs for the
  remaining cases.
- [x] Give every customer owned constellation labels, kinds, weights, and angles; named customers also
  receive distinct recovery remedies, costs, authority, precedent, and trust outcomes.
- [x] Prove directory -> Northwind detail -> directory in the browser and capture Alpine detail,
  Northwind dark detail, and mobile directory states.
- [ ] Implement exact routes for `customer-360/overview`, `service-recovery`, `communications`,
  `outcomes`, `entitlement`, `commitments`, and `win-back`.
- [ ] Validate permission-aware commercial treatment and prevent CRM-record-dump composition.

### Resolution Room

- [ ] Complete exact routes for `resolution-room/plan`, `swarm`, `incident-review`, `diagnostics`,
  `knowledge`, and `field-service`.
- [x] Coordinate case evidence, hypotheses, plan dependencies, experts, and incident signal in the
  distinct Resolution Room dashboard.
  recovery consequence, and customer-safe output without nested queues.
- [x] When no `caseId` is supplied, open an active-resolution portfolio with leadership demand and
  incident charts plus ranked customer rooms; selecting a room opens case/customer-specific evidence,
  resolution path, relationship consequence, and **Back to active resolutions**.
- [x] Preserve selected customer and case across full-screen tab changes; prove portfolio -> Alpine room
  -> Service Operations -> persisted room -> portfolio in the browser.
- [ ] Validate sequential narrow-screen order and evidence/action continuity across every route.

### Service Operations

- [x] Implement demand-to-resolution river, projected global impact map, recovery
  cost/outcome matrix, recurring-driver Pareto, workload, quality, and named interventions.
- [x] Establish three distinct routed leadership visual answers without adding duplicate component
  identities: service performance river/map/Pareto, incident cohort graph, and workload capacity/SLA-
  risk matrix, all with exact-value tables.
- [x] Replace the static Service Operations dashboard with coordinated period, region, and product
  filters that update KPIs, demand path, map bubbles/selection, driver bars, and recovery exposure.
- [x] Verify Today/EMEA/All -> 7 days/APAC/Commerce in the browser changes demand to 1,184, SLA risk to
  45%, geography, driver mix, path geometry, and recovery exposure to $1.64M.
- [ ] Implement exact routes for `service-operations/incident-detection`, `command`, `workload`, and
  `quality-review`.
- [ ] Validate materially different filters/datasets and prevent repeated chart modules or generic KPI
  composition.

### Shared navigation and continuation

- [ ] Implement stable responsive navigation, workspace identity, keyboard behavior, destination focus,
  and narrow-screen adaptation.
- [x] Use navigation/current-page semantics for the four workspace roots, make **Open prepared plan**
  continue from My Queue to Resolution Room, and remove unsupported enabled dashboard actions.
- [x] Preserve the current inline case selection and query in the full-screen render path.
- [x] Follow the Zava IT Concierge expand pattern: show an icon-plus-**Full screen** button at suitable
  inline widths and retain the icon-only accessible control below 620px.
- [x] Apply the scoped-entry rule: inline `customerId`/`caseId` opens exact detail; direct tab navigation
  without scope opens the owning customer or resolution portfolio before drill-in.
- [ ] Validate every catalog destination preserves its declared entity, filters, evidence selection,
  draft/scenario values, and workflow step.
- [ ] Prove full screen adds role-owned context and operations instead of enlarging inline content.

## Phase 6 - Remaining operational catalog

### Listen, prioritize, understand, and diagnose

- [x] Implement purpose-specific inline roots for `TriageCustomerIssue`, `GetPriorityServiceQueue`,
  `ExploreCustomerHealth`, and `DiagnoseCaseEvidence`.
- [x] Implement purpose-specific inline roots for `ReviewEntitlementCoverage` and `BalanceServiceWorkload`.
- [x] Make unscoped `ExploreCustomerHealth` a leadership customer value/risk matrix sized by annual
  exposure; retain a customer-owned constellation when `customerId` is supplied.
- [x] Re-audit all 23 inline visual grammars after the full-screen redesign. Keep the immutable catalog;
  use existing intents for portfolio matrix, river/map/Pareto, incident network, and capacity/risk
  matrix rather than adding near-duplicate leadership tools.

### Collaborate, govern, and coordinate

- [x] Implement purpose-specific inline roots for `StartExpertSwarm`, `ReviewIncidentResponse`,
  `ManageCaseEscalation`, and `CoordinateFieldService`.
- [ ] Validate one canonical queue owner whenever a reviewer is embedded in a parent workspace.

### Communicate, recover, and retain

- [x] Implement purpose-specific inline roots for `ComposeCustomerUpdate`, `TrackResolutionOutcome`,
  `ManageCustomerCommitments`, and `PlanCustomerWinBack`.
- [ ] Prove verified facts and commitments are customer-safe, localized, editable, and reviewed before
  a mock send or plan receipt.

### Learn, assure, and improve

- [x] Implement purpose-specific inline roots for `CreateKnowledgeFromResolution`, `ExploreServicePerformance`, and
  `RunServiceQualityReview`.
- [ ] Prevent customer-specific or unverified evidence from becoming generalized knowledge.
- [ ] Run every information default/change/detail/no-match/error test, every review lifecycle, and every
  submit lifecycle before marking the catalog complete.

## Phase 7 - Capability explorer and routing education

- [x] Implement `ExploreAgentCapabilities` from catalog metadata with search, selected detail, realistic
  prompt copy, safe preview, and Previous/Next paging across all 22 operational scenarios.
- [x] Verify browser paging exposes ranges 1-7, 8-14, 15-21, and 22-22; disable Previous on page 1 and
  Next on page 4, reset to page 1 after search changes, and publish page/range state to Copilot.
- [ ] Keep `education/capabilities` isolated from operational navigation and preserve its search,
  filters, and featured intent.
- [ ] Stop review/submit previews before confirmation and label them as demo previews with no action
  applied.
- [ ] Validate all 22 operational previews, no network/writes, no nested headers, keyboard behavior,
  prompt-copy success/failure, and preview reset.
- [ ] Generate and validate positive prompts, collision pairs, exclusions, normalized properties, exact
  routes, and fallback prompts for all 23 tools.

## Phase 8 - Global quality and visual evidence

### Accessibility, localization, and responsive behavior

- [ ] Externalize all strings and validate English, German expansion, Japanese, and Arabic RTL.
- [ ] Validate keyboard, accessible names, focus order/restoration, screen-reader structure, 200% zoom,
  forced colors, reduced motion, inline widths, mobile full screen, and long localization.
- [ ] Give every SVG a decision-specific title/description, exact visible values, keyboard alternatives
  where interactive, and a table/list equivalent.
- [ ] Verify semantic pending/warning, approved/success, and rejected/blocked/error states pair color
  with text, icon, and status meaning.
- [ ] Audit every visible control for a tested effect on records, geometry, calculation, evidence,
  selection, draft, or workflow stage; remove decorative controls.
- [x] Move focus to changed workflow headings, announce Review/Receipt transitions, and provide a
  designed capability no-match state with a **View all capabilities** recovery action.
- [x] Replace the inaccessible translucent full-screen hero persona box with opaque carbon and explicit
  white text; verify 13.5:1 rendered contrast in light mode and inspect light, dark, and mobile pixels.
- [x] Use Megan Bowen's approved bundled portrait as the My Queue owner and align the catalog role,
  workspace brief, hero narrative, and tenant-free harness identity.
- [x] Prove My Queue row selection updates adjacent case work and selected Resolution Room context.
- [ ] Audit triage fields, copy feedback, every remaining analytical selection, and every workflow
  control before functionality sign-off.

### Tenant-free visual harness

- [x] Build a parameterized local harness for every intent, mode, width, and theme; extended explicit
  reduced-motion/error-state controls remain open.
  workflow stage, and designed failure state.
- [x] Automate 75 screenshots with runtime, console, overflow, broken-image, semantic-chart, and layout
  identity checks; deeper keyboard/focus/RTL/200%-zoom automation remains open.
  keyboard, focus, reduced-motion, RTL, and 200%-zoom checks.
- [x] Save one screenshot per intent at standard/narrow/dark plus dashboard mobile/dark/keynote states
  and machine-readable evidence; error/confirmation/receipt publication states remain open.
  receipt states with a machine-readable evidence matrix.
- [x] Publish one current standard-light screenshot for every one of the 23 components under `assets/`,
  generate `component-screenshot-index.json`, show the complete set in the README, and refresh the ten
  curated PnP gallery images from the same capture run.
- [ ] Conduct multimodal pixel review for hierarchy, keynote readability, clipping, density, image
  cropping, contrast, repeated composition, and customer-service distinctiveness.

### Authenticated tenant gate

- [x] Authenticate to the `span001.sharepoint.com` Copilot Component Workbench and load the local
  `https://localhost:4321/temp/build/manifests.js` debug manifest over the trusted SPFx HTTPS server.
- [x] Verify Workbench discovers all 23 local manifests and instantiate one default inline turn for
  every component. Confirm 23/23 nonblank iframes, each with `data-intent` and `data-layout`, and zero
  Workbench event-log error entries; every portable-component URL retains the localhost debug manifest.
- [x] Re-run the original 21 turns after the universal context update and verify 21 ready iframes, 42 successful
  Workbench **Component state update** events (initial plus purpose-specific snapshots), and zero errors.
- [x] After the leadership-chart split, restart localhost and instantiate all 23 tools in authenticated
  Workbench. Verify 23/23 nonblank intent/layout frames, 23 ready components, 46 state updates, 96
  size-change/resize events, and zero host errors.
- [ ] Complete authenticated Workbench CSP/resource inspection, parameter extraction, inline-to-full-
  screen state preservation, host theme rerender, bridge context/follow-up, fresh invocation, iframe
  focus restoration, forced colors, keyboard, and host screen-reader validation.
- [ ] **BLOCKED: public media-rights approval** Confirm redistribution rights for all persona, product,
  site, and channel media or replace them and regenerate provenance, screenshots, release evidence, and
  package output.

## Phase 9 - Documentation, demos, packaging, and release

### Publication and demos

- [ ] Replace planning status in the README only after implementation evidence exists; add PnP summary,
  screenshots, applies-to, prerequisites, minimal path, features, architecture, safety, accessibility,
  limitations, support owner, and version history.
- [x] Create a 4-minute keynote, 10-minute business journey, and 5-minute technical
  walkthrough with setup, reset, timing, routing, guardrails, and fallback paths.
- [x] Rewrite all demos around Copilot UX rather than the fictional business case: visual answers,
  routing boundaries, visible-state awareness, responsive expansion, list/portfolio drill-in and back,
  coordinated leadership filters, guarded decisions, and capability discovery.
- [x] Align the six conversation starters to customer portfolio, actionable queue, scoped resolution,
  incident analysis, coordinated Service Operations, and capability discovery.
- [x] Create `assets/sample.json`, designer review, generated routing matrix, media provenance,
  gallery evidence, and release evidence from canonical artifacts.
- [ ] Document mock/live service boundaries, formulas, policy assumptions, telemetry/outcome plan, and
  external tenant prerequisites.

### Production and package evidence

- [x] Run catalog, React, routing, media, gallery, publication, and clean production tests
  with zero warnings.
- [x] Build the production solution and validate the generated API plugin v2.4 with 23 functions inside
  the embedded agent ZIP.
- [x] Audit the `.sppkg` for hashed production JavaScript, shared entry coverage, no stale output,
  no duplicate substantial media/base64 catalogs, no Fluent icon font, and approved size thresholds.
- [x] Generate current hashes, counts, screenshot identities, package metrics, and diagnostics into
  release evidence; run `git diff --check`.
- [ ] Run a clean-clone/offline rehearsal, inspect the shipped package and agent ZIP, stop temporary
  servers, and obtain release approval.
- [x] Commit the ready-to-deploy `.sppkg` only after every local executable gate passes.

## Deferred - Dynamic data / API integration

- [ ] Implement authenticated CRM/CSM, Microsoft Graph/Work IQ, SharePoint knowledge, telemetry,
  policy, workflow, field-service, communication, and analytics adapters behind validated contracts.
- [ ] Add production authorization, consent, customer/contact access, sensitive commercial masking,
  recording, legal hold, retention, residency, audit, throttling, conflict, and retry requirements.
- [ ] Replace session receipts with real commands only after environment-specific review while
  preserving explicit confirmation and the same view-model contracts.
- [ ] Revalidate schemas, provisioning, CSP, permissions, host behavior, accessibility, policy packs,
  and operational telemetry for every approved live system.

## Docs and cleanup

- [ ] Keep this tracker current immediately after every focused validation; use at most one
  **IN PROGRESS** implementation item unless parallel work is explicit.
- [ ] Strike through and annotate superseded decisions instead of deleting planning history.
- [ ] Record test, warning, package, media, and screenshot counts only from saved command output.
- [ ] Separate locally proven evidence from authenticated host and public-rights prerequisites.
- [ ] Keep reusable implementation rules in [agentic-creation-rules.md](agentic-creation-rules.md) and
  solution-specific scope, order, decisions, and evidence in this file.

## Open decisions before implementation

- [x] Approve the immutable 21-component catalog.
- [x] Approve the six-beat keynote and Alpine House / `ZCR-1048` as the canonical connected story.
- [x] Approve the four lens purposes and exact route topology.
- [x] Approve the written visual contract, screenshot set, typography, palette, and media strategy.
- [x] Approve package/agent metadata and the one-shared-bundle strategy.
- [x] Approve removal of the current placeholder followed by clean Yeoman generation.
- [ ] Provide or approve the tenant used for the eventual authenticated host gate.
