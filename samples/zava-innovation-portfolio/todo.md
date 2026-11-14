# Zava Innovation Hub - implementation plan

## RC0 update - October 20, 2026

### Current product-completion contract (supersedes historical scope/checkmarks below)

- [x] Replace the generic Workflow form with separate opportunity intake, financial model,
  recognition composer, capital committee, executive narrative, challenge recruitment, and
  measured pilot-learning experiences. Controlled values reach reviewed snapshots and semantic receipts.
- [x] Require Draft → Review → Confirm → receipt; no automatic confirmation or fake publishing.
- [x] Validate measurable process targets, confidence/payback, capital envelope/gate eligibility,
  challenge dates/scoring weights, pilot sample/reduction/safety thresholds, and human rationales.
- [x] Make review queue inspection-only and gate decisions exact-record/human-owned.
- [x] Audit all 17 tools; consume advertised properties or narrow schemas to actual supported scope.
  Keep fixed portfolio/health/budget/growth snapshots honest rather than advertising ignored filters.
- [x] Preserve unknown IDs/regions as visible no-match and publish no-match context.
- [x] Retain primary draft/review/receipt state across passive theme/width/inline-fullscreen changes;
  reset on fresh invocation; unmount once and await framework teardown.
- [x] Publish only committed visible context; report host errors visibly.
- [x] Keep all existing tool GUIDs/names, six canonical starters, and the exact capability starter last.
- [x] Keep offline source data immutable; receipts are in memory, not cross-dashboard durable state.
- [x] Add executable domain/DOM/lifecycle tests and current-source standard/narrow/dark intent
  captures plus review, confirmation, receipt, and no-match evidence.
- [ ] External: RC0 tenant installation, real model routing/extraction, host bridge/CSP support,
  iframe focus/screen-reader rehearsal, production permissions/services, and portrait redistribution.

Current executable evidence is `assets/gallery-evidence.json`, `assets/intent-evidence.json`,
and `assets/release-evidence.json`. Run `npm run capture:visual`,
`npx tsc --project scripts\visual-harness\tsconfig.json`, and `npm run build`.
Older visual/workbench reports and the detailed August plan below are historical only; they are
not claims of current data integration, current test totals, or current RC0 tenant validation.

The current application baseline is SPFx 1.24.0-rc.0, React/ReactDOM 18.3.1, React types 18.3.31/18.3.7, and Heft 1.3.2. Current validation, exact packages, starter targets, findings, and external release gates are recorded in the [repository RC0 readiness report](../../RC0-updates.md). The local creation guide is synchronized byte-for-byte with the assets golden guide.

Earlier entries below retain their implementation history. Old framework versions, test totals, byte counts, and hashes in that history are not current RC0 release evidence.

This is the build source of truth for the product scope in [README.md](README.md). Engineering, UX,
validation, packaging, and safety requirements come from
[agentic-creation-rules.md](agentic-creation-rules.md). Do not begin implementation until Phase 0 and
the open decisions are approved.

**Status legend:** `- [ ]` open | `- [x]` validated | add **IN PROGRESS** or **BLOCKED: reason** to an
open item when appropriate.

> **Progress (latest):** Designer review candidate as of 2026-08-28. Phase 0 is approved and the baseline is
> pushed at `ee70573`. All 17 final-named Yeoman components now route through one catalog, shared
> React/Fluent host, deterministic 120-idea graph, guarded session workflows, and five-lens full-screen
> shell. The canonical local build validates 17 tools/GUIDs in one bundle and passes 5/5 focused tests
> with zero warnings. The premium visual pass now has 17 unique inline compositions, a five-lens icon
> rail, profile-led dashboards, and a multi-chart Enterprise Insights command center. Fifty-eight browser
> states cover every inline intent at standard/narrow widths, every full-screen lens at desktop/mobile,
> and dark representatives, review decisions, portfolio acknowledgement, forced colors, reduced motion,
> 200% scale, and deterministic reset with zero overflow, broken images, console errors, or page errors.
> Phase 6 now includes generated agent identity, provenance checks, bounded motion, designer review guide,
> and three timed demos. Authenticated Workbench direct-selection validation now covers all 17 inline
> components, light/dark host themes, representative workflows, and portfolio Expand/return. Remaining
> gates are natural-language routing, the deeper tenant accessibility matrix, exact transient draft
> transfer, remaining workflow variants, and portrait redistribution approval. GitHub finalization now
> adds 11 current-source publication captures, PnP metadata, zero-production-vulnerability auditing,
> generated-plugin validation, package-content/hash evidence, and an explicitly tracked `.sppkg`.

## Approach and sequencing

1. Freeze the brief, immutable names, routing ownership, visual grammar, full-screen topology, package
   identity, and demo narrative.
2. Establish catalog automation, supported scaffolds, dependencies, shared host boundaries, and a green
   baseline before route scale-out.
3. Build one coherent deterministic data graph and prove calculations, relationships, workflows, and
   session-only actions independently of React.
4. Prove one complete information, review, and submit inline slice before implementing siblings.
5. Build the shared full-screen shell and exact continuation adapters before scaling five lenses.
6. Add signature polish and evidence while preserving accessibility, responsiveness, and bundle discipline.
7. Package and publish only from executable local and tenant evidence.

## Phase 0 - Scope and brief approval

### Product and catalog

- [x] Approve **Zava Innovation Hub** as the product/agent name and approve its short description.
- [x] Approve 17 independently routed tools: 16 operational components plus
  `ExploreAgentCapabilities`.
- [x] Approve the operation mix: eight information/analysis, three review/decision, five submit/create,
  and one education/discovery component.
- [x] Approve folding duplicate detection, scoring summary, lifecycle progress, voting, ROI/NPV,
  sponsor/team detail, portfolio balance checks, and supporting charts into their owning components.
- [x] Approve the five demo lenses/personas: My Innovation / Megan Bowen; Programs & Pilots /
  Johanna Lorenz; Reviews & Gates / Diego Siciliani; Investment / Miriam Graham; Enterprise Insights /
  Joni Sherman.
- [x] Approve independent tools for innovation growth, global participation, budget stewardship, and
  leadership health because they serve different roles and decision questions.
- [x] Approve `LaunchInnovationChallenge` to connect strategy and measurable outcomes to the top of the
  funnel before idea intake begins.
- [x] Approve `ManageInnovationExperiment` to connect funding assumptions to evidence-based pilot
  learning before value realization is claimed.
- [x] Approve the Smart Onboarding Journey keynote story and evidence-grounded recognition closing beat.
- [x] Approve exactly six conversation starters, with five distinct operational targets and capability
  exploration last.
- [x] Validate starter order, unique operational targets, inline display capability, generated agent
  JSON, and documented prompt-to-component mappings from one canonical configuration.

### Immutable component names and routes

- [x] Approve `SubmitInnovationIdea` -> `my-innovation/new-idea`.
- [x] Approve `GetMyInnovation` -> `my-innovation/overview`.
- [x] Approve `BuildIdeaBusinessCase` -> `my-innovation/business-case`.
- [x] Approve `CelebrateInnovationImpact` -> `my-innovation/recognition`.
- [x] Approve `GetInnovationReviewQueue` -> `reviews-gates/review-queue`.
- [x] Approve `ReviewIdeaGate` -> `reviews-gates/gate-review`.
- [x] Approve `ReviewInnovationFunding` -> `investment/funding-committee`.
- [x] Approve `ExploreInnovationPortfolio` -> `enterprise-insights/command-center`.
- [x] Approve `TrackInnovationValue` -> `enterprise-insights/value-realization`.
- [x] Approve `GenerateInnovationBrief` -> `enterprise-insights/executive-brief`.
- [x] Approve `GetInnovationGrowth` -> `programs-pilots/growth`.
- [x] Approve `ExploreGlobalInnovation` -> `programs-pilots/geography`.
- [x] Approve `TrackInnovationBudget` -> `investment/budget`.
- [x] Approve `GetInnovationPortfolioHealth` -> `enterprise-insights/leadership-health`.
- [x] Approve `LaunchInnovationChallenge` -> `programs-pilots/challenge-studio`.
- [x] Approve `ManageInnovationExperiment` -> `programs-pilots/experiment-studio`.
- [x] Approve `ExploreAgentCapabilities` -> isolated `education/capabilities`.
- [x] Confirm every tool has one positive use boundary, nearest negative collision boundary, useful
  optional properties, and useful empty-input default.

### Full-screen and visual direction

- [x] Approve one shared shell with a desktop/keynote vertical rail and responsive narrow selector for
  My Innovation, Programs & Pilots, Reviews & Gates, Investment, and Enterprise Insights.
- [x] Approve Funding Committee as an immersive Investment route and the capability gallery as an
  isolated route, not separate primary applications.
- [x] Approve Portfolio command center as the keynote visual centerpiece.
- [x] Approve grape + marigold as the primary accent pair, with Fluent semantic colors reserved for state.
- [x] Approve the living funnel, funding consequence, impact constellation, and recognition artifact as
  the four signature visuals.
- [x] Approve the 11 copied reference portraits and exact filename/person mapping in README; use Megan,
  Johanna, Diego, Miriam, and Joni as primary profiles and the remaining six as supporting specialists.
- [ ] Approve original theme/badge/empty-state art and geometric agent mark; Fluent initials remain the
  loading/missing-media fallback.
- [x] Approve React SVG and Fluent DOM as default renderers; Babylon remains excluded unless a measured
  spike proves decision value.
- [x] Label the four current PNGs under `assets/` as design references, not implementation evidence.

### Market and lifecycle coverage

- [ ] Approve the directional market benchmark against Brightidea, HYPE, Planview IdeaPlace, Wazoku,
  and Qmarkets; retain retrieval date and public source links without claiming feature parity.
- [ ] Approve the 10-phase operating model: direction, signals/opportunity, ideation, triage/shaping,
  investment, experiment/learn, scale/execute, realize value, learn/recognize, govern/improve.
- [ ] Map every current tool to one lifecycle phase, role, trigger, intent, decision/job, outcome,
  inline contract, and exact full-screen continuation.
- [ ] Validate the sample covers challenge-to-impact continuity without becoming a portal clone or
  implying that model inference performs governed actions.
- [ ] Keep technology/startup scouting, external crowds, patents, methodology administration, and
  durable project execution as explicit extension points with stable service/view-model boundaries.
- [ ] Approve the agentic differentiation matrix: natural-language entry, bounded dynamic inline UX,
  deterministic safeguards, exact full-screen continuation, and integration-ready services.

### Identity and cleanup

- [x] Approve retirement of the generated `Innovation` placeholder; do not rename, repurpose, or
  transfer its GUID to a final intent.
- [x] Approve final package/solution titles, IDs, Contoso publisher metadata, manifest `accentColor`, and a
  plugin-facing human name of at most 20 characters.
- [x] Approve Contoso as the fictional organization while Zava Innovation Hub is the sample/agent
  identity, or select one consistent alternative before content is authored.
- [x] **APPROVAL GATE:** Confirm Phase 0 before scaffold, dependency, source, configuration, or asset work.

## Phase 1 - Foundation and supported scaffolding

### Baseline and immutable identities

- [x] Record the untouched scaffold build, lint, package, Node, SPFx, and dependency baseline.
- [x] Remove the approved placeholder only after Phase 0 confirmation.
- [x] Generate all 17 final-named Copilot Components through the supported Yeoman command when this
  phase starts; never manually create, copy, or rename component scaffolds.
- [x] Verify 17 unique immutable GUIDs, folders/classes, resources, tools, and registrations.

### Canonical intent catalog

- [x] Create one typed catalog owning names, GUIDs, operations, lenses, descriptions, optional schemas,
  previews, education metadata, starter targets, and full-screen destinations.
- [x] Generate manifests, adapters, schemas, bundles, localization, agent registration, and starters
  from that catalog.
- [x] Add fail-fast validation for identity, counts, schemas, registration, routes, previews, starters,
  and bundle drift.
- [x] Generate a prompt/property/collision/routing matrix with a non-writing byte-comparison check mode.
- [x] Validate authored one-request -> one-primary-tool boundaries across intake/business case, queue/gate/funding,
  personal/portfolio, growth/geography, budget/funding, health/landscape/value, and analysis/brief boundaries.

### Shared stack and host

- [x] Pin React 18.0.1, React DOM 18.3.1, matching types, Fluent UI v9, Fluent icons, and Griffel at
  approved reference versions before React implementation.
- [x] Establish one measured shared-bundle strategy for all component entries.
- [x] Build one owner-document Fluent/Griffel host with namespaced provider IDs, theme, brand/action
  header, and host-authoritative full-screen control. The shared control now shows icon + `Expand` at
  standard widths and a 36px icon-only target at 620px and below while preserving title/ARIA text.
  Error fallback remains a focused follow-up.
- [ ] Normalize prompt properties into deterministic signatures and separate fresh invocation, passive
  rerender, transient interaction, settings, and confirmed session state.
- [ ] Add catalog-owned display-mode routing and lazy-load substantial full-screen code.
- [ ] **PARTIAL:** Validate owner-document styles and fresh reset complete in local/tenant evidence;
  current-user fallback, passive preservation, unsupported display mode, and teardown remain open.
- [x] Run the first clean zero-warning compile before feature implementation.

### Required automation

- [x] Add intent configure/validate, routing matrix, agent icon, asset, gallery, visual capture,
  generated-plugin, and package-output scripts with check modes where required.
- [x] Add canonical `validate` and production `build` commands in the rules-mandated order.
- [x] Pin Playwright and Chromium for the tenant-free visual harness.
- [x] Keep generated output ignored while exposing only the final `.sppkg` release artifact.

## Phase 2 - Domain model and mock services

### Deterministic connected data

- [ ] Define objectives, challenges, people, locations, business units, themes, ideas, scores, similarity, business cases,
  reviews, budget ledgers, funding, milestones, value, feedback, votes, recognition, portfolio history,
  program growth, and receipt models.
- [ ] Generate at least 100 employees, 120 ideas across all stages, six uneven themes, 15 funded pilots,
  24 months of submission/contributor/gate history, and six quarters of budget/value history from
  deterministic relative-time seeds.
- [ ] Seed at least eight active/completed challenges with outcomes, audiences, sponsors, criteria,
  constraints, timelines, participation plans, linked ideas, and measurable results.
- [ ] Seed pilot experiments with hypotheses, assumptions, methods, thresholds, milestones,
  observations, evidence, learning, confidence, and go/pivot/stop recommendations.
- [ ] Attribute ideas and people across countries, four reporting regions, and at least five business
  units with deliberately uneven participation and conversion for meaningful geographic analysis.
- [ ] Keep Smart Onboarding Journey coherent across owner, collaborators, score, reviews, business case,
  funding, milestones, value, feedback, and recognition.
- [ ] Include similar/no-similar ideas, evidence gaps, conflicts, overdue reviews, partial/deferred
  funding, at-risk milestones, under-realized value, and no-match filters.
- [ ] Validate all IDs/relationships, deterministic dates, distributions, and edge-state reachability.

### Services, calculations, and workflows

- [ ] Define `IInnovationDataService`, `MockInnovationDataService`, mappers, and a mock-default factory.
- [ ] Implement/test similarity, five-axis score, readiness, ROI, NPV, payback, sensitivity, funnel
  conversion/velocity, growth cohorts, regional participation/conversion, horizon mix, budget bridge,
  burn/forecast, concentration, portfolio health, and value variance calculations.
- [ ] Implement pure challenge, idea, gate, funding, experiment, pilot/value, and recognition workflow transitions.
- [x] Implement an in-memory-first session receipt store with guarded `sessionStorage`, remount reads,
  append-only confirmed receipts, and Reset API. Cross-view subscriptions remain open.
- [ ] Prove actions update related views without mutating immutable seeds.

### Chart and media models

- [ ] Define renderer-neutral models with stable IDs, exact/formatted values, relationships, colors,
  geometry inputs, selection, legends, and fallback rows.
- [ ] Build pure funnel, radar, cash-flow, bubble, balance, treemap, waterfall, growth/cohort,
  geographic, budget forecast, leadership health, timeline/value, and recognition models.
- [x] Retain only `d3-geo` and `topojson-client` for the measured Natural Earth map; reject unrelated
  D3 modules because current charts do not need them.
- [x] Package Natural Earth world boundaries locally through `world-atlas`, document dependency use, and prove
  no runtime map tiles, geography, or media are fetched.
- [x] Reject full `d3` plus selection, axis, transition, timer, interpolation, brush, drag, zoom, fetch,
  and formatting modules; React owns SVG, state, events, and motion.
- [x] Create one typed local media catalog and package all 11 approved persona portraits with alt text
  and resilient lookup fallback. Theme, badge, empty-state, and agent-icon provenance remains open.
- [ ] Validate calculations, chart model variance, fallback rows, media keys, and reset behavior before React.

## Phase 3 - Representative inline slices

### Shared operation mechanics

- [x] Implement information, review, submit, and education dispatching; unknown intents fail
  visibly in development.
- [x] Give every intent default a stable intent-specific `data-layout` identity.
- [x] Share validation, confirmation, receipt, reset, and announcement mechanics without
  sharing generic domain bodies.
- [x] Inventory/test retained controls: workflow progression, growth metric, capability selection,
  compact density, and vertical navigation all produce material visible changes.

### Submit - `SubmitInnovationIdea`

- [ ] Implement the prompt-backed editable idea canvas and visible field guidance.
- [ ] Update duplicate matches, radar score, readiness, and next steps from the live draft.
- [x] Implement validation, Edit, exact review, explicit mock confirmation, receipt, and reset.
- [ ] Preserve draft, step, similarity, and score on Expand.
- [ ] Validate defaults, prefill, edits, invalid/no-similar/high-similarity states, workflow, narrow and
  standard widths, dark mode, reduced motion, and 200% zoom.

### Review - `ReviewInnovationFunding`

- [ ] Implement economics, proposed amount, before/after horizon mix, budget/value consequences, and
  milestone-scope impact.
- [ ] Implement Fund, Partial fund, Defer, and Reject drafts with rationale safeguards and confirmation.
- [ ] Produce a semantic receipt and update canonical queue/portfolio overlays.
- [ ] Preserve request, amount scenario, rationale, and decision draft on Expand.
- [ ] Validate all decisions, amount bounds, exact review values, remount/reset, responsive/theme,
  reduced-motion, and zoom states.

### Information - `ExploreInnovationPortfolio`

- [ ] Implement funnel, impact/effort, balance, theme, and funding-bridge modes selected by prompt or control.
- [ ] Make period, horizon, theme, region, stage, and selection materially rebuild compatible models.
- [ ] Coordinate mark, legend, exact-value rail, and View as table without generic insight chrome.
- [ ] Preserve mode, filters, and selected mark on Expand.
- [ ] Validate defaults by focus, filter variance, detail, no-match/error, keyboard selection,
  responsive/theme, reduced-motion, and zoom states.

### First tenant gate

- [x] Prove owner-document styles, direct-selected representative tools, interaction, and portfolio
  route continuity through Expand/return in authenticated Workbench. Natural-language prompt selection
  remains a separate routing gate.
- [x] Save dated Workbench evidence and distinguish natural-language routing from direct tool selection.

## Phase 4 - Remaining inline catalog and explorer

### My Innovation

- [ ] Implement `GetMyInnovation`: selected idea, living funnel, next action, feedback/supporters,
  milestones, recognition progress, and material filters.
- [ ] Implement `BuildIdeaBusinessCase`: assumptions, cash-flow/payback, ROI/NPV, uncertainty, scenario
  comparison, guarded review, and receipt where an action is confirmed.
- [ ] Implement `CelebrateInnovationImpact`: evidence, recipients, badge, praise composition, audience,
  review, mock share receipt, and reset.

### Decisions

- [x] Implement `GetInnovationReviewQueue`: pending default, Screening/Business case/Pilot buckets,
  counted Action/Approved/Declined/Sent-back filters, compact ranked rows, completed read-only outcomes,
  phase guidance, and preserved phase context.
- [x] Implement `ReviewIdeaGate`: selected submission, evidence completeness, strategic fit, expected
  value, strengths, gaps, owner, Approve/Send back/Decline drafts, rationale safeguards, consequence
  confirmation, semantic receipt, and updated queue counts.

### Portfolio

- [ ] Implement `TrackInnovationValue`: milestones, projected/actual value, variance, at-risk evidence,
  owner, filters, selection, and exact table.
- [ ] Implement `GenerateInnovationBrief`: audience/scope/emphasis, grounded evidence, editable mock
  narrative, review, copy/export/mock send, and receipt.

### Growth, geography, budget, and leadership

- [ ] **PARTIAL:** `GetInnovationGrowth` has a responsive submission trend and exact table; complete
  contributor/throughput/conversion series, cohort controls, selected points, and materially varied data.
- [ ] **PARTIAL:** `ExploreGlobalInnovation` now has packaged Natural Earth boundaries, a deliberate
  projection, submission-sized/conversion-colored markers, exact conversion bars, and keyboard region
  selection; complete theme mix, metric controls, and an equivalent full data table.
- [ ] **PARTIAL:** `TrackInnovationBudget` has reconciled KPIs and a funding bridge; complete burn/forecast,
  horizon mix, variance selection, and visibly non-applied scenarios.
- [ ] **PARTIAL:** `GetInnovationPortfolioHealth` has leadership KPIs and funnel evidence; complete
  selectable dimensions, trends, calculation basis, and accountable exception drill-down.
- [ ] Validate that growth is not a submission-count vanity chart, geography does not equate volume with
  quality, budget values reconcile exactly, and leadership health exposes calculation basis and exceptions.

### Challenge and experiment

- [ ] Implement `LaunchInnovationChallenge`: strategic outcome, problem framing, target audience,
  constraints, source evidence, criteria/weights, sponsor, timeline, expected participation, review,
  explicit mock launch receipt, and reset.
- [ ] Show challenge portfolio fit, similar active challenges, target audience reach, and measurable
  success definition without allowing AI to launch or publish automatically.
- [ ] Implement `ManageInnovationExperiment`: selected funded idea, hypothesis, assumptions, method,
  threshold, milestones, observations, evidence strength, learning, and go/pivot/stop recommendation.
- [ ] Keep experiment recommendation visibly distinct from a confirmed gate/scale decision; require
  review and receipt for saved mock plans or recommendations.
- [ ] Validate prompt prefill, edits, visible safeguards, exact review values, confirmation, receipt,
  reset, no-evidence/contradictory-evidence states, and inline-to-full-screen continuation for both tools.

### Capability education

- [x] Implement `ExploreAgentCapabilities` from catalog metadata; exclude itself and advertise all 16 tools.
- [x] Add search, scenario detail, working prompt copy, and deterministic safe preview.
- [x] Stop review/submit previews before confirmation and label them `Demo preview - no action applied`.
- [ ] Validate six starters, completeness, counts, clipboard fallback, reset, every preview, no nested
  header, and no side effects.

### Inline scale-out gate

- [x] Render all 17 defaults at narrow and standard widths plus representative dark states with zero
  errors, overflow, blank charts, broken images, or unlabeled controls; 17 unique layouts validated.
- [ ] Validate every information default/filter/detail/no-match/error state.
- [x] Validate review queue/evidence/safeguard/rationale/confirm/receipt/update states for Approve,
  Send back, and Decline; each path changes action items from 4 to 3 in the mounted demo session.
- [ ] Validate every submit prefill/validation/Edit/review/confirm/receipt/reset state.
- [x] Run the complete clean zero-warning local gate: 5/5 tests, 17 tools/GUIDs, one shared bundle.

## Phase 5 - Full-screen shell and continuation

### Shared shell

- [ ] **PARTIAL:** Build product bar with identity, density, live status, and persona. Search,
  notifications, settings panel, and host-owned return remain open.
- [x] Build accessible five-lens desktop/keynote vertical navigation with overflow-free narrow reflow.
- [x] Implement useful route-correct lens defaults and typed catalog destinations.
- [ ] Resolve the host user into one demo profile whose default lens, scope, metrics, queue/action
  visibility, accountable-person context, and suggested operations change materially.
- [x] Keep cross-lens navigation available for the demo while role-sensitive mock actions remain
  read-only or require an explicit persona switch; label this as demo behavior, not authorization.
- [ ] Synchronize session receipts across profiles so Megan -> Diego -> Miriam -> Johanna -> Joni handoffs
  appear from one canonical record graph without a tenant write.
- [x] Implement working density and work-area search controls that materially reshape visible content.
  Locale/currency, table defaults, and configurable visible panels remain open.
- [ ] **PARTIAL:** Validate mobile, desktop, keynote, representative light/dark, keyboard tab movement,
  and reduced-motion CSS. Tablet, long-label, 200% zoom, and host high-contrast remain open.

### Lens dashboards

- [x] Build the My Innovation default around Megan, a personal funnel, action workflow, and its four routes.
- [x] Build Programs & Pilots around Johanna, challenge/experiment routes, growth, and geography.
- [x] Build Reviews & Gates around Diego, review context, funnel evidence, and guarded gate workflow.
- [x] Build Investment around Miriam, reconciled budget KPIs, funding bridge, and guarded funding workflow.
- [x] Build Enterprise Insights around Joni, the dominant living funnel, leadership KPIs, value, and briefs.
- [x] Add a proportional horizontal stage-gate hero with five lifecycle chevrons, direct counts,
  conversion labels, and milestone markers based on the command-center design reference.
- [x] Add Top performing ideas by verified value realized with contributor portraits, value, ROI,
  phase, earned impact badge, and working acknowledgement/session receipt.
- [x] Keep gamification outcome-based: measured value, evidence confidence, and named contribution;
  raw submission volume and reactions do not determine rank.
- [ ] Add one visibly non-applied portfolio scenario studio that enters governance before confirmation.
- [x] Build the isolated capability gallery with search, detail, working prompt copy, and safe preview.
  Audience filters, Previous/Next, featured tour, and lazy preview loading remain open.

### Exact continuation gate

- [ ] Test every destination with lens, route, entity, filters, comparison, selection, draft, review,
  and safe scenario state where applicable.
- [ ] Test fresh invocation vs passive rerender and one transient interaction per operation model.
- [x] Test each profile's default lens and first useful state: Megan/My Innovation, Johanna/Programs &
  Pilots, Diego/Reviews & Gates, Miriam/Investment, and Joni/Enterprise Insights.
- [ ] Test handoff continuity for challenge -> idea, idea -> gate queue, gate -> funding queue, funding ->
  experiment, and experiment/value -> leadership health/recognition.
- [ ] Test that changing profile alters meaningful data/action context rather than only avatar/name, and
  that unauthorized-looking mock actions do not imply production role enforcement.
- [x] Capture all 17 inline defaults at standard/narrow widths, all five full-screen defaults at
  desktop/mobile, two dark representatives, seven review decision variants, portfolio recognition,
  forced colors, reduced motion, 200% scale, and reset: 58 cumulative states with zero overflow,
  broken images, console errors, or page errors.
- [x] Run the complete clean zero-warning local gate: 5/5 focused tests and 58 browser states.

## Phase 6 - Brand, signature visuals, and demo polish

### Original assets

- [x] Design one geometric lightbulb + funnel mark and deterministic generator for
  `copilot/color.png` and `copilot/outline.png`.
- [x] Validate dimensions, transparency/color rules, small-size legibility, manifest mapping, hashes,
  packaged bytes, provenance, and check-mode freshness.
- [x] Generate one typed media catalog for all 11 copied JPEG portraits using exact person and filename
  keys; validate every file, hash, accessible name, intended role, and initials fallback.
- [x] Record source/reference path, intended use, SHA-256, and redistribution status for all portraits,
  both icons, and four design references in `assets/asset-provenance.json`.
- [ ] **BLOCKED: media-rights approval.** Confirm portrait redistribution before public release.
- [ ] Create six original theme marks, recognition badges, and no-ideas/no-reviews empty states.
- [ ] Validate meaningful alt text/decorative treatment, local provenance, and zero runtime media fetches.

### Visual and motion refinement

- [x] Refine the living-funnel system through personal/queue summaries and a keynote horizontal
  stage-gate command-center hero with counts, conversion, and milestone markers.
- [ ] Refine funding amount consequences across mix, budget, value, and milestone scope without layout shift.
- [ ] Refine impact constellation for pointer, keyboard, selection, and exact evidence.
- [x] Refine growth metric switching so submissions, conversion, and value materially redraw while
  remaining legible at standard and narrow widths.
- [ ] **PARTIAL:** Refine the world map with deliberate Natural Earth projection, conversion thresholds,
  collision-safe labels, regional bars, and keyboard location selection complete; add an equivalent
  exact table and metric/theme controls.
- [ ] Refine the budget bridge/forecast so every amount reconciles and scenario remains visibly not applied.
- [x] Refine leadership health and Enterprise Insights to read in ten seconds through a profile hero,
  four KPIs, stage-gate, impact/effort, horizon mix, momentum, themes, and top outcomes.
- [x] Refine recognition as a polished responsive artifact plus Top performing ideas board grounded in
  verified value, ROI, phase, evidence, contributor, badge, and working acknowledgement.
- [x] Complete local light/dark/forced-color tokens and keynote/projector review; tenant high-contrast
  and screen-reader validation remain open.
- [x] Add bounded route, stage-gate, list, confirmation, receipt, and acknowledgement motion with
  reduced-motion bypass and settled screenshot capture.
- [x] Remove scaffold chrome, generic AI gradients, decorative controls, nested cards, placeholders,
  unsupported actions, and unlabeled chart evidence.

### Demo enablement

- [x] Author a four-minute challenge -> idea -> gate -> funding -> experiment -> impact/praise keynote.
- [x] Author a 10-minute business walkthrough adding business case, value, brief, and discovery.
- [x] Author a five-minute technical walkthrough of catalog, data, chart models, workflows, host state,
  continuation, accessibility, evidence, and package audits.
- [x] Make reset deterministic through the full-screen `Reset demo data` command and document demo preparation.

## Phase 7 - Evidence, packaging, and release

### Automated UX evidence

- [ ] **PARTIAL:** Complete harness coverage for every intent default, five lenses, representative workflow
  stages, mobile, dark, forced colors, reduced motion, zoom, and safe preview; remaining no-match/error
  and exhaustive workflow combinations stay open.
- [x] Capture 11 publication PNGs and machine-readable evidence with complete shared-UX source
  fingerprint, dimensions, hashes, layout IDs, runtime errors, broken media, and overflow results;
  broader evidence covers representative chart, focus, motion, zoom, and workflow behavior.
- [x] Keep historical design references separate from implementation evidence/gallery ordering.
- [ ] Validate nonblank visuals, exact-value alternatives, semantic names, contrast, focus, and no active
  render loops/timers after teardown.

### Tenant Workbench evidence

- [ ] Rehearse all routing prompts and six starters in fresh authenticated conversations; require
  exactly one expected tool and useful properties.
- [x] Validate all 17 inline tools through direct Workbench selection, owner-document typography/theme,
  light/dark broadcast, assets, overflow, representative interactions, portfolio destination/return,
  and fresh-mount diagnostics. Iframe focus, passive state continuity, all destinations, and current-user
  fallback remain open.
- [ ] Complete tenant keyboard, screen-reader, forced-colors, dark/light, mobile-width, and 200% zoom
  checks for representative information, review, submit, and explorer states.
- [x] Save `assets/workbench-evidence-2026-08-28.json` naming host, direct-selection method, debug
  manifest, layouts, themes, interactions, destination/return, diagnostics, local parity, and unresolved
  findings. Add a separate dated model-routing run when the six starters are rehearsed.

### Canonical release gate

- [x] Finalize provenance, `assets/sample.json`, screenshot metadata, routing matrix, instructions,
  manifests, publisher metadata, and dependency security disposition.
- [x] Run catalog, icon, asset, routing, gallery, production audit, clean production tests, package, generated-plugin,
  package-output, diagnostics, and `git diff --check` through one canonical command.
- [x] Require zero production vulnerabilities, build warnings/errors, test failures, stale output,
  duplicate media, repeated image catalogs,
  unsupported plugin schema, and unhashed development bundles.
- [x] Record test/capture counts, package/JavaScript sizes, hashes, bundle counts, duplicate media,
  diagnostics, and stopped-server state from machine evidence.
- [ ] Stage and commit the validated `sharepoint/solution/zava-innovation-portfolio.sppkg`; it is visible
  to Git while debug package output remains ignored.
- [ ] Reproduce `npm ci`, visual capture, and canonical build from a clean checkout before publication.

## Deferred - Dynamic data / API integration

- [ ] Implement authorized Dataverse/SharePoint ideas, Graph people, Teams/community praise,
  Power BI/Fabric, finance, and workflow adapters while preserving UI view models.
- [ ] Replace session receipts with authenticated durable APIs, authorization, audit, idempotency,
  retry, conflict handling, notifications, and rollback policy.
- [ ] Provision resources, consent, environments, classification, retention, localization, monitoring,
  and support ownership.
- [ ] Revalidate privacy, accessibility, performance, calculations, failure states, and visualization
  density against production volumes.

## Docs and cleanup

- [x] Preserve the approved product brief while converting the public README to release-candidate/PnP format.
- [x] Keep one current `todo.md`; do not create competing status trackers.
- [x] Document setup, supported Yeoman extension, architecture, data mapping, reset, harness, Workbench,
  validation, packaging, and limitations.
- [x] Publish three timed demo scripts, designer review guide, generated prompt matrix, and evidence index.
- [ ] Publish the extensibility guide after final architecture and release automation settle.
- [x] Stop temporary servers, keep debug artifacts ignored, retire superseded packages, and audit dependencies,
  placeholders, and unsupported controls before release.
- [x] Reconcile this tracker after every validated phase and update counts only from complete commands
  or machine-readable evidence.

## Reusable playbook

- [x] Apply [agentic-creation-rules.md](agentic-creation-rules.md) throughout implementation, including
  scaffold restrictions, host-document theming, operation contracts, state separation, visualization,
  accessibility, evidence, bundle, and packaging requirements. Final learnings now cover packaged real
  geography, map-channel accessibility, Fluent provider ID isolation, computed native-control styling,
  source-hashed publication captures, and immutable-ID all-tool Workbench review.
- [x] No undocumented implementation exception remains; deferred scope and external prerequisites are
  recorded explicitly in this tracker.

## Remaining publication prerequisites

1. Rehearse all six starters and routing-matrix prompts through natural-language model selection in
   fresh authenticated Copilot conversations; direct Workbench selection is already validated.
2. Complete tenant screen-reader, iframe-focus, forced-colors, mobile-width, and 200% zoom validation.
3. Confirm redistribution approval for the bundled fictional demo-persona portraits before public
   publication; initials remain the approved fallback.
4. After committing this release candidate, reproduce `npm ci`, `npm run capture:visual`, and
   `npm run build` from a clean checkout before opening the final publication pull request.