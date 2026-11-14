# Zava Employee Agent implementation tracker

## RC0 update - October 20, 2026

The current application baseline is SPFx 1.24.0-rc.0, React/ReactDOM 18.3.1, React types 18.3.31/18.3.7, and Heft 1.3.2. Current validation, exact packages, starter targets, findings, and external release gates are recorded in the [repository RC0 readiness report](../../RC0-updates.md). The local creation guide is synchronized byte-for-byte with the assets golden guide.

Six-starter follow-up: five distinct operational tools plus a final dedicated `ExploreAgentCapabilitiesTool`.
The missing explorer was created with the supported RC0 Yeoman generator; it catalogs all 20 operational
tools without reading private HR records. Its generated GUID is retained, bringing the package to 21
components in the existing shared bundle. Current validation is recorded in the readiness report.

Earlier entries below retain their implementation history. Old framework versions, test totals, byte counts, and hashes in that history are not current RC0 release evidence.

This is the single source of truth for implementation progress against [README.md](README.md),
[Zava-Employee-Agent-Intro-Brief.md](Zava-Employee-Agent-Intro-Brief.md), and the canonical
[Zava-Employee-Agent-UX-Design.md](Zava-Employee-Agent-UX-Design.md). Follow
[agentic-creation-rules.md](agentic-creation-rules.md) for every phase.

> Status legend: ▢ not started · 🔶 in progress · ✅ done

---

> **Progress (latest):** Phases 0-15 and all locally automatable release gates are complete. All 20 value-ranked Copilot Components are
> independently prompt-addressable, package in one Zava Employee Agent, and reuse the implemented
> ten-family full-screen shell. Every family retains all five originally planned experiences as
> complete internal full-screen routes, for 50 internal views total; only 20 are promoted to inline
> Copilot Components/MCP tools. The clean gate passes 39 suites and 170 tests, validates 20 generated
> API-plugin functions and mirrored MCP tools, and emits one shared 910,310-byte JavaScript bundle in a
> ~0.493 MiB `.sppkg`, with no stale output or duplicated image payloads. Remaining Phase 16 blockers
> require authenticated Copilot routing evidence, the final manual accessibility/viewport matrix, and
> final implementation screenshots/gallery metadata before GitHub publication.

## Approach and sequencing

- Complete one family at a time in numeric order, starting with My HR Dashboard.
- Do not begin the next family until the current family passes `heft test --clean` with zero warnings
  and its UX has been reviewed.
- The human creates every new Copilot Component with the supported Yeoman command. The agent never
  manually creates, copies, renames, or restructures a component scaffold.
- Build UX-first against coherent, Graph-shaped mock data. Defer live Microsoft Graph, SharePoint,
  PnPjs, provisioning, and real AI calls.
- After each new family, update Home summaries, action-plan ranking, and direct destinations so Home
  grows with the implemented solution.
- Keep this file current: mark an item 🔶 before starting it and ✅ immediately after validation.

## Inline experience delivery map

Each named inline experience is an independently prompt-addressable Copilot Component and MCP app
tool. Components in the same family share services, visual theme, and full-screen destination, but
each receives its own Yeoman scaffold, manifest GUID, bundle, tool description, and minimal optional
parameter schema. Home's current multi-view implementation is transitional until Phase 6 extraction.

| Family | Component phase | Intent components | Status |
| --- | --- | --- | --- |
| My HR Dashboard | Phase 6 | `GetMyHrDashboard`; `GetProfileHealth`; `GetNextBestActions`; `GetWorklifeSnapshot`; `GetEmployeeMilestones` | ✅ 5/5 complete |
| Policy Q&A | Phase 7 | `PolicyAnswer`; `PolicyComparison` | ✅ 2/2 complete |
| PTO & Leave | Phase 8 | `LeaveBalance`; `RequestTimeOff` | ✅ 2/2 complete |
| Payroll Explainer | Phase 9 | `LatestPay`; `ExplainPayChange` | ✅ 2/2 complete |
| Benefits & Life Events | Phase 10 | `CompareBenefitPlans`; `StartLifeEvent` | ✅ 2/2 complete |
| HR Case Desk | Phase 11 | `CreateHrCase` | ✅ 1/1 complete |
| Learning & Compliance | Phase 12 | `RequiredLearning` | ✅ 1/1 complete |
| Total Rewards | Phase 13 | `TotalRewardsSummary` | ✅ 1/1 complete |
| Manager Team Hub | Phase 14 | `ApprovalInbox`; `TeamAbsenceCalendar` | ✅ 2/2 complete |
| Org & People Graph | Phase 15 | `FindExpert`; `ExploreOrganization` | ✅ 2/2 complete |

Exact tool names, optional parameters, fullscreen routes, UX selection rationale, and future inventory live
in [Zava-Employee-Agent-Component-Plan.md](Zava-Employee-Agent-Component-Plan.md).

### Home baseline prompt mapping

| Example user intent | Owning component/tool | Inline experience | Status |
| --- | --- | --- | --- |
| “What needs my attention?” or a general HR summary | `GetMyHrDashboard` / `GetMyHRDashboard` | Today's HR summary | ✅ Implemented |
| “Is my profile complete?” | `GetProfileHealth` / `GetProfileHealth` | Profile health | ✅ Implemented |
| “What should I do next?” | `GetNextBestActions` / `GetNextBestActions` | Next best actions | ✅ Implemented |
| “Show my HR snapshot.” | `GetWorklifeSnapshot` / `GetWorklifeSnapshot` | Worklife snapshot | ✅ Implemented |
| “What is coming up?” | `GetEmployeeMilestones` / `GetEmployeeMilestones` | Milestones | ✅ Implemented |

## Phase 0 - Scaffold, brief, and initial configuration

### Human-provided foundation

- ✅ Scaffold the SPFx 1.24 solution with the SharePoint Yeoman generator.
- ✅ Scaffold Family 01 as the `GetMyHrDashboard` Copilot Component.
- ✅ Add the product objectives in `README.md` and `Zava-Employee-Agent-Intro-Brief.md`.
- ✅ Add the canonical ten-family interaction contract in `Zava-Employee-Agent-UX-Design.md`.
- ✅ Add `agentic-creation-rules.md` as the implementation playbook.
- ✅ Add the current composite UX references under `assets/`.
- ✅ Confirm the untouched scaffold can complete a production build.

### Initial configuration - agent

- ✅ Install `react@18.3.1` and `react-dom@18.3.1` as runtime dependencies.
- ✅ Install `@types/react@18.3.31` and `@types/react-dom@18.3.7` as development dependencies.
- ✅ Install `@fluentui/react-components@9.54.0` and `@fluentui/react-icons@2.0.270`.
- ✅ Confirm TypeScript uses classic React JSX and remains compatible with React 18.
- ✅ Run `heft test --clean` and resolve all warnings or errors introduced by initial configuration.

### Design-source cleanup

- ✅ Re-export or replace the Family 01 inline and full-screen PNGs with Zava Employee Agent branding.
- ✅ Add a dedicated Home full-screen design containing the personalized hero, Home metrics, Your HR
  priorities banner, and My HR action plan panel.
- ✅ Add wide desktop, right-panel-open, narrow desktop, and mobile Home references.
- ✅ Rename or catalog existing source images by their visible content so implementation does not use
  a mismatched filename as its source of truth.

### Phase 0 gate

- ✅ Review the cleaned Home designs against the canonical UX contract.
- ✅ Confirm no runtime implementation begins before this tracker is approved.
- ✅ Run `heft test --clean` with zero warnings or errors.

## Phase 1 - Shared mock data and application foundations

### Shared models

- ✅ Define `ZavaFamilyId`, family metadata, typed routes, and `IZavaDestination`.
- ✅ Define shared user, metric, priority, grounding, action, and settings view models.
- ✅ Define Graph-shaped raw mock types separately from lean UI view models.
- ✅ Define relative-offset seed types; do not hard-code demo dates or clock-specific copy.

### Coherent Zava story

- ✅ Seed one connected employee story spanning learning, leave, benefits, payroll, support, rewards,
  approvals, and people context.
- ✅ Include one privacy course due soon, one leave draft with a conflict, one enrollment deadline, one
  explainable payroll change, one case awaiting response, one equity vest, two approvals, one
  upcoming one-to-one, and three experts.
- ✅ Give every action-plan destination a stable ID that exists in the owning family dataset.
- ✅ Add bundled mock personas and local/base64 imagery with accessible initials fallbacks.

### Services and utilities

- ✅ Implement an `IZavaEmployeeDataService` contract and `MockZavaEmployeeDataService`.
- ✅ Implement pure seed resolution against a memoized mount clock.
- ✅ Implement pure raw-data-to-view-model mappers that a later live service can reuse.
- ✅ Resolve the signed-in user synchronously from page context, with a stable Zava fallback persona.
- ✅ Implement time-aware greeting, date formatting, reduced-motion, and session-settings utilities.
- ✅ Add focused tests for time resolution, greetings, mapping, and destination integrity.

### Phase 1 gate

- ✅ Verify the complete mock experience has no runtime network dependency.
- ✅ Verify all generated dates remain forward-biased and coherent at different times of day.
- ✅ Run `heft test --clean` with zero warnings or errors.

## Phase 2 - Family 01: My HR Dashboard inline UI baseline

> This phase completed the five visual/behavioral surfaces inside the initially scaffolded Home
> component. It did not create the final five-tool MCP architecture. Phase 6 subsequently extracted
> these proven surfaces into separately generated components without redesigning them.

### Tool and parameter contract

- ✅ Replace the placeholder `message` property with a described Zod schema for `view`, `period`,
  `focusArea`, `includeSensitive`, and optional common locale/privacy inputs.
- ✅ Define explicit `view` values for summary, profile, actions, timeline, and milestones.
- ✅ Update the tool name and description so Copilot selects Home for cross-family HR summaries.
- ✅ Normalize off-contract inputs without throwing during render.
- ✅ Ensure a fresh tool invocation refreshes prompt-derived state while passive host rerenders preserve
  user interaction state.

### React and theme foundation

- ✅ Replace the generated string-template UI with React 18 and `ReactDOM.render`.
- ✅ Add a thin root selector with separate inline and full-screen views.
- ✅ Add one FluentProvider/theme provider targeting the component document and preserving state on
  host theme changes.
- ✅ Pass host theme, display mode, available modes, dimensions, signed-in user, and expand callback
  through typed props.

### Five Home inline variants

- ✅ Implement Today's HR summary.
- ✅ Implement Profile health.
- ✅ Implement Next best actions.
- ✅ Implement Worklife snapshot.
- ✅ Implement Milestones.
- ✅ Add compact drill-down navigation with a reusable back header where required.
- ✅ Show Expand only when `fullscreen` is advertised, and call
  `requestDisplayModeAsync('fullscreen')` without optimistic state changes.

### Inline quality gate

- ✅ Validate light, dark, 320px, standard inline, keyboard, screen-reader, empty, and reduced-motion
  states.
- ✅ Confirm the five `view` inputs visibly select the matching inline variant.
- ✅ Run `heft test --clean` with zero warnings or errors.

## Phase 3 - Home full-screen and My HR action plan

### Shared dashboard shell - first implementation

- ✅ Implement `ZavaDashboardShell` with Home as the only enabled family.
- ✅ Add the canonical rail order with future families visibly unavailable until implemented.
- ✅ Add desktop rail and accessible narrow-layout family menu behavior.
- ✅ Add typed internal navigation, focus restoration, and one-open-panel-at-a-time state.
- ✅ Add a quiet `Mock data - offline` footer disclosure.

### Personalized Home hero

- ✅ Render the signed-in user's avatar, first name, and profile context.
- ✅ Render deterministic morning, afternoon, evening, early-start, and late-hours greetings.
- ✅ Render the Home area-state sentence and four metrics: open actions, deadlines, profile
  completeness, and next important date.
- ✅ Add settings access without competing with the Copilot host conversation surface.

### Home content

- ✅ Implement the action center.
- ✅ Implement the worklife timeline.
- ✅ Implement leave and benefits snapshots using initial shared mock signals.
- ✅ Implement learning progress, personal signals, and recent milestones.
- ✅ Use a responsive visibility-driven grid with no nested cards.

### My HR action plan - signature feature

- ✅ Define `IHrActionItem`, `IHrActionPlan`, priority levels, source labels, and typed destinations.
- ✅ Implement deterministic ranking for blocking, overdue, seven-day, later, and optional signals.
- ✅ Add the Your HR priorities banner and dynamic summary sentence.
- ✅ Add the Build my HR action plan command.
- ✅ Add an 800ms thinking phase with spinner and tasteful shimmer.
- ✅ Reveal up to five recommendations at 220ms intervals.
- ✅ Skip thinking and streaming when reduced motion is requested.
- ✅ Add personalized headline, reasons, timing, family source, and direct destination command.
- ✅ Add the fixed disclosure that suggestions are generated locally from sample data and not saved.
- ✅ Add deterministic generator tests, ranking tests, and destination-integrity tests.

### Home full-screen gate

- ✅ Validate wide desktop, projector width, panel-open, narrow desktop, mobile, light, and dark states.
- ✅ Validate panel focus entry, close, Escape, direct navigation, and screen-reader announcements.
- ✅ Confirm Home inline expands into Home full screen with the same normalized parameters.
- ✅ Run `heft test --clean` with zero warnings or errors.
- ✅ Review Family 01 before enabling Family 02 work.

## Phase 4 - Shared UI, settings, and visual system

### Reusable building blocks

- ✅ Extract shared personalized hero, metric tile, priority banner, right panel, dashboard card,
  inline header, detail header, status badge, empty state, and source/grounding controls.
- ✅ Keep full-screen controls reusable in inline drill-downs without embedding complete cards inside
  cards.
- ✅ Add semantic family metadata for icon, rail label, full label, and accent intent.

### Session settings

- ✅ Implement guarded session-only load/save and a typed `useZavaSettings` hook.
- ✅ Add currency, jurisdiction, privacy tier, and visible Home panel controls.
- ✅ Ensure settings visibly reshape data formatting and Home layout.
- ✅ Keep at least one Home panel visible and make the grid reflow automatically.

### Shared quality gate

- ✅ Audit Fluent v9 token use, dark-mode contrast, icon labels, focus states, and touch targets.
- ✅ Audit every animation for a reduced-motion alternative.
- ✅ Run `heft test --clean` with zero warnings or errors.

## Phase 5 - Full-screen family placeholders and transitions

### Shared placeholder model

- ✅ Enable all ten family tabs inside the existing full-screen shell without adding new Copilot Components.
- ✅ Keep Home mapped to the completed dashboard and map the other nine tabs to one shared placeholder view.
- ✅ Render each placeholder from semantic family metadata: icon, short label, full title, and accent intent.
- ✅ Keep placeholder content intentionally empty beneath its personalized, family-colored title region.

### Transition behavior

- ✅ Add desktop rail and mobile selector transitions for all ten families.
- ✅ Animate family view changes with a reduced-motion-safe transition.
- ✅ Update product-bar context and active-tab styling when the selected family changes.
- ✅ Route cross-family Home/action-plan destinations to the matching placeholder tab without implementing family details.
- ✅ Preserve Home settings, action plan, and dashboard state when navigating away and back.

### Placeholder quality gate

- ✅ Validate all ten titles and family accents in light and dark themes.
- ✅ Validate desktop, narrow rail, mobile selector, keyboard focus, and screen-reader current-tab semantics.
- ✅ Confirm no new component manifest, GUID, bundle, tool schema, service, or family mock implementation was added.
- ✅ Run `heft test --clean` with zero warnings or errors.
- ✅ Review the complete tab-transition model before the human scaffolds Family 02.

### Unique family theme refinement

- ✅ Define one reusable, named theme variant for each of the ten families.
- ✅ Replace black-to-accent placeholder headers with same-hue dark-to-light gradients.
- ✅ Apply each unique variant consistently to placeholder headers, navigation identity, and family badges.
- ✅ Mirror all ten variants in the offline transition-review prototype for visual approval.
- ✅ Test that all ten families resolve to distinct variants and rerun `heft test --clean`.
- ✅ Validate desktop and mobile contrast, transitions, and overflow before closing the refinement.

### Five-year anniversary photo refinement

- ✅ Select a suitable real group-celebration photo with a verified free-use license and stable source page.
- ✅ Store the source photo and attribution details under `assets/`.
- ✅ Replace the generated `employeeMoments` illustration and regenerate the offline base64 registry.
- ✅ Confirm the inline milestone quick view and full-screen Home milestone use the same new photo.
- ✅ Update the offline design source to use the new photo.
- ✅ Validate crops, alternative text, mobile/desktop layout, and zero runtime network requests.
- ✅ Run the media freshness check and `heft test --clean` before closing the refinement.

### Welcome-page identity refinement

- ✅ Update the Next important moment icon to a cohesive blue-on-light-blue treatment with no pink.
- ✅ Replace the lower Graph-shaped wording with Work IQ-shaped employee-experience copy.
- ✅ Mirror both changes in the offline design source and validate desktop/mobile presentation.
- ✅ Run `heft test --clean` before closing the refinement.

### Workbench review persona refinement

- ✅ Detect Copilot Workbench from the component document URL without relying on tenant-specific values.
- ✅ Use a bundled real sample-person photo for the Workbench current-user avatar.
- ✅ Preserve the signed-in display name and keep production pages on the neutral offline placeholder.
- ✅ Add focused detector/resolver tests and confirm no profile-photo network request is introduced.
- ✅ Validate the Workbench avatar treatment and rerun `heft test --clean`.

### Current-user photo fallback refinement

- ✅ Prefer a usable current-user photo exposed by SharePoint or Copilot host context, including Workbench.
- ✅ Use the bundled Megan sample photo only when the host has no current-user photo.
- ✅ Keep resolution synchronous and introduce no profile-photo endpoint or runtime fetch.
- ✅ Test host-photo, missing-photo, Workbench, and unavailable-context behavior.
- ✅ Run `heft test --clean` before closing the refinement.

## Phase 6 - Intent-component architecture and Home extraction

### Yeoman scaffold checkpoint

- ✅ Generate `GetProfileHealth` with `yo @microsoft/sharepoint --component-type copilotComponent --component-name GetProfileHealth --framework none --skip-install`.
- ✅ Generate `GetNextBestActions` with `yo @microsoft/sharepoint --component-type copilotComponent --component-name GetNextBestActions --framework none --skip-install`.
- ✅ Generate `GetWorklifeSnapshot` with `yo @microsoft/sharepoint --component-type copilotComponent --component-name GetWorklifeSnapshot --framework none --skip-install`.
- ✅ Generate `GetEmployeeMilestones` with `yo @microsoft/sharepoint --component-type copilotComponent --component-name GetEmployeeMilestones --framework none --skip-install`.
- ✅ Run `npm install` after the generation batch and verify five unique Home GUIDs, bundles,
  manifests, localized resources, and agent registrations. Never copy or manually create a scaffold.

### Shared intent host contract

- ✅ Add typed component definitions with fixed `family`, `route`, and property normalizer metadata.
- ✅ Add one shared React host that renders the component's fixed inline surface or
  `ZavaDashboardShell` according to host display mode.
- ✅ Extend `ZavaDashboardShell` with `initialFamily`, `initialRoute`, `initialParams`, and properties
  version; apply them on fresh invocation and preserve internal navigation on passive rerenders.
- ✅ Keep Expand host-authoritative and pass normalized properties into the matching full-screen
  route without browser URLs or duplicated dashboard implementations.

### Home tool extraction

- ✅ Keep `GetMyHrDashboard` as the Today's HR summary tool and remove its public `view` multiplexer
  only after all four sibling components pass routing tests.
- ✅ Give `GetProfileHealth` an empty Zod object and reuse the completed Profile health UI.
- ✅ Give `GetNextBestActions` only optional `period`, `focusArea`, and `includeSensitive` parameters.
- ✅ Give `GetWorklifeSnapshot` only an optional `period` parameter.
- ✅ Give `GetEmployeeMilestones` only optional `period` and `milestoneId` parameters.
- ✅ Write mutually distinct manifest descriptions for the five example prompt intents in the Home
  baseline prompt mapping.

### Home architecture gate

- ✅ Verify MCP/tool metadata selects each of the five Home components independently.
- ✅ Verify `{}` renders useful defaults and invalid/partial parameters normalize without throwing.
- ✅ Verify each component expands to the Home tab at `home/summary`, `home/profile`, `home/actions`,
  `home/timeline`, or `home/milestones` respectively.
- ✅ Verify prompt-derived defaults reset on a fresh invocation while passive rerenders preserve
  local state.
- ✅ Run `heft test --clean` with zero warnings or errors and review the five-component pattern before
  generating Policy components.

## Phase 7 - Family 02: Policy Q&A

### Policy human scaffold checkpoint

- ✅ Run the required Yeoman command once each for `PolicyAnswer` and `PolicyComparison`; never copy
  a component scaffold.
- ✅ Run `npm install`, then verify two unique manifest GUIDs, bundles, localized resources, and
  agent registrations before modifying generated code.

### Policy implementation

- ✅ Add Graph/search-shaped policy sources, jurisdiction rules, changed clauses, citations, and mock
  private-support data behind a policy service interface.
- ✅ Add separate minimal optional Zod schemas from the component catalog; do not add a shared
  `view` parameter or unrelated fields to every Policy tool.
- ✅ Implement Policy answer and Compare policies inline variants with citation receipts, highlighted
  clauses, and a responsive jurisdiction matrix.
- ✅ Implement the Policy full-screen section with personalized hero, metrics, answer receipts,
  jurisdiction comparison, changes, and private handoff.
- ✅ Implement Your policy follow-ups banner and Review this answer panel.
- ✅ Validate the showcase prompt for Finland/Sweden parental leave and visible citations.

### Policy Home integration and gate

- ✅ Add policy-change and sensitive-path signals to Home summaries.
- ✅ Add a Policy action-plan destination that opens the implemented answer route with question context.
- ✅ Replace the Policy placeholder with implemented routes while preserving the existing selectable tab.
- ✅ Update Copilot instructions and agent metadata for Policy tool selection.
- ✅ Run the supported `heft test` gate; 103 tests pass with only the two pre-existing script-URL test warnings.
- ✅ Review Family 02 before enabling Family 03 work.

## Phase 8 - Family 03: PTO & Leave

### PTO and Leave human scaffold checkpoint

- ✅ Run the required Yeoman command once each for `LeaveBalance` and `RequestTimeOff`; never copy a
  component scaffold.
- ✅ Run `npm install`, then verify two unique GUIDs, bundles, resources, and agent registrations.

### Leave implementation

- ✅ Add mock balances, requests, holidays, usage, calendar conflicts, and team coverage behind a leave
  service interface.
- ✅ Add separate minimal optional Zod schemas from the component catalog. Only `RequestTimeOff`
  receives `leaveType`, `startDate`, `endDate`, and `reason` prefill fields.
- ✅ Implement Leave balance and Request time off inline variants with balance composition, calendar
  context, prompt-prefilled controls, and conflict review.
- ✅ Prefill request controls from prompt properties while preserving user edits on passive rerenders.
- ✅ Calculate inclusive business days and mocked calendar/coverage conflicts.
- ✅ Require explicit review and confirmation; never submit from prompt values automatically.
- ✅ Implement the Time full-screen section and Your leave priorities panel.
- ✅ Validate the August 4-12, 2027 vacation showcase prompt and second-prompt refresh behavior.

### PTO and Leave Home integration and gate

- ✅ Replace provisional leave signals on Home with Family 03 service data.
- ✅ Add expiring carryover, request conflict, and pending-request action-plan destinations.
- ✅ Replace the Time placeholder with implemented routes while preserving the existing selectable tab.
- ✅ Update Copilot instructions and agent metadata for leave routing.
- ✅ Run `heft test --clean` with zero warnings or errors.
- ✅ Review Family 03 before enabling Family 04 work.

## Phase 9 - Family 04: Payroll Explainer

### Payroll human scaffold checkpoint

- ✅ Run the required Yeoman command once each for `LatestPay` and `ExplainPayChange`; never copy a
  component scaffold.
- ✅ Run `npm install`, then verify two unique GUIDs, bundles, resources, and agent registrations.

### Payroll implementation

- ✅ Add mock pay periods, earnings, deductions, change drivers, history, and documents behind a
  payroll service interface.
- ✅ Add separate minimal optional Zod schemas from the component catalog; keep period selection on
  `LatestPay` and comparison/deduction inclusion only on `ExplainPayChange`.
- ✅ Implement Latest pay and Why pay changed inline variants with gross-to-net composition and a
  period-over-period driver waterfall.
- ✅ Implement the Money full-screen section with gross-to-net, deductions, history, and documents.
- ✅ Implement Your pay insights banner and Explain my latest pay panel.
- ✅ Validate July-versus-June explanation input and privacy-safe rendering.

### Payroll Home integration and gate

- ✅ Add explainable pay-change signals and document reminders to Home.
- ✅ Add Payroll destinations without exposing sensitive values in unrelated Home surfaces.
- ✅ Replace the Money placeholder with implemented routes and update Copilot routing instructions.
- ✅ Run `heft test --clean` with zero warnings or errors.
- ✅ Review Family 04 before enabling Family 05 work.

## Phase 10 - Family 05: Benefits & Life Events

### Benefits human scaffold checkpoint

- ✅ Run the required Yeoman command once each for `CompareBenefitPlans` and `StartLifeEvent`; never
  copy a component scaffold.
- ✅ Run `npm install`, then verify two unique GUIDs, bundles, resources, and agent registrations.

### Benefits implementation

- ✅ Add mock plans, coverage, dependents, enrollment, comparison weights, and life events behind a
  benefits service interface.
- ✅ Add separate minimal optional Zod schemas from the component catalog; keep comparison and
  life-event prefills on their owning tools.
- ✅ Implement Compare plans and Start a life event inline variants with reweightable comparison,
  dependent-cost impact, staged validation, and explicit confirmation.
- ✅ Implement the Benefits full-screen section with comparison and life-event workflows.
- ✅ Implement Your benefits priorities banner and Review my coverage panel.
- ✅ Validate the two-children, dental, low-deductible comparison prompt.

### Benefits Home integration and gate

- ✅ Replace provisional benefits data on Home with Family 05 service data.
- ✅ Add enrollment deadlines and coverage-gap destinations to My HR action plan.
- ✅ Replace the Benefits placeholder with implemented routes and update Copilot routing instructions.
- ✅ Run `heft test --clean` with zero warnings or errors.
- ✅ Review Family 05 before enabling Family 06 work.

## Phase 11 - Family 06: HR Case Desk

### HR Case Desk human scaffold checkpoint

- ✅ Run the required Yeoman command for `CreateHrCase`; never copy a component scaffold.
- ✅ Run `npm install`, then verify its unique GUID, bundle, resources, and agent registration.

### Support implementation

- ✅ Add mock knowledge answers, cases, messages, timelines, service metrics, and privacy metadata
  behind a support service interface.
- ✅ Add the minimal optional `CreateHrCase` schema from the component catalog; sensitive case details
  remain confined to this privacy-aware tool.
- ✅ Implement Open a case as a privacy-aware inline intake with category guidance, sensitive-detail
  boundaries, review, validation, and mocked confirmation.
- ✅ Implement the Support full-screen section with knowledge deflection, case board, detail timeline,
  and private intake.
- ✅ Implement Your support priorities banner and Review my support plan panel.
- ✅ Validate private payroll-case prefill without leaking its description into Home or chat copy.

### HR Case Desk Home integration and gate

- ✅ Add privacy-safe case follow-up counts and destinations to Home.
- ✅ Ensure sensitive action-plan items reveal only the minimum necessary summary.
- ✅ Replace the Support placeholder with implemented routes and update Copilot routing instructions.
- ✅ Run `heft test --clean` with zero warnings or errors.
- ✅ Review Family 06 before enabling Family 07 work.

## Phase 12 - Family 07: Learning & Compliance

### Learning human scaffold checkpoint

- ✅ Run the required Yeoman command for `RequiredLearning`; never copy a scaffold.
- ✅ Run `npm install`, then verify its unique GUID, bundle, resources, and agent registration.

### Learning implementation

- ✅ Add mock courses, assignments, progress, role paths, recommendations, and manager status behind a
  learning service interface.
- ✅ Add only `dueWithinDays` and `includeOptional` as optional `RequiredLearning` parameters.
- ✅ Implement Required learning as a compliance progress ring, urgency timeline, estimated-effort
  breakdown, and direct resume queue.
- ✅ Implement the Learning full-screen section with compliance and role-growth paths.
- ✅ Implement Your learning priorities banner and Build my learning plan panel.
- ✅ Validate the required-learning-due-in-14-days prompt.

### Learning Home integration and gate

- ✅ Replace provisional learning signals on Home with Family 07 service data.
- ✅ Make the required privacy course a high-priority direct destination in My HR action plan.
- ✅ Replace the Learning placeholder with implemented routes and update Copilot routing instructions.
- ✅ Run `heft test --clean` with zero warnings or errors.
- ✅ Review Family 07 before enabling Family 08 work.

## Phase 13 - Family 08: Total Rewards

### Design and human scaffold checkpoint

- ✅ Create and approve a dedicated Total Rewards full-screen design that is visibly distinct from
  Payroll Explainer.
- ✅ Run the required Yeoman command for `TotalRewardsSummary`; never copy a scaffold.
- ✅ Run `npm install`, then verify its unique GUID, bundle, resources, and agent registration.

### Rewards implementation

- ✅ Add mock base pay, variable pay, equity, vesting, pension, benefits value, and history behind a
  rewards service interface.
- ✅ Add only year, currency, equity visibility, and benefits-value visibility as optional
  `TotalRewardsSummary` parameters.
- ✅ Implement Total rewards summary as an annual-value composition chart with privacy controls,
  currency formatting, category drill-down, and clear Payroll-versus-Rewards framing.
- ✅ Implement the Rewards full-screen section with annual value composition and vesting timeline.
- ✅ Implement Your rewards insights banner and Explain my total rewards panel.
- ✅ Verify Payroll explains a pay period while Rewards explains annual employment value.

### Total Rewards Home integration and gate

- ✅ Add upcoming vesting and annual rewards-change signals to Home.
- ✅ Add privacy-safe Rewards destinations to My HR action plan.
- ✅ Replace the Rewards placeholder with implemented routes and update Copilot routing instructions.
- ✅ Run `heft test --clean` with zero warnings or errors.
- ✅ Review Family 08 before enabling Family 09 work.

## Phase 14 - Family 09: Manager Team Hub

### Manager Team Hub human scaffold checkpoint

- ✅ Run the required Yeoman command once each for `ApprovalInbox` and `TeamAbsenceCalendar`; never
  copy a scaffold.
- ✅ Run `npm install`, then verify two unique GUIDs, bundles, resources, and agent registrations.

### Manager implementation

- ✅ Add mock team members, approvals, risks, absence, learning, and check-in context behind a manager
  service interface.
- ✅ Add only team/approval filters to `ApprovalInbox` and team/date filters to `TeamAbsenceCalendar`.
- ✅ Implement Approvals waiting and Team absence calendar inline variants with queue actions,
  role-aware privacy, overlap visualization, and coverage-risk explanation.
- ✅ Implement the Team full-screen section with roster, approvals, absence, signals, and check-ins.
- ✅ Implement Your manager priorities banner and Build my team action plan panel.
- ✅ Validate approvals-and-absence-risks prompt and role-aware empty state for non-managers.

### Manager Team Hub Home integration and gate

- ✅ Add manager-only approval and risk signals to Home without showing them to non-managers.
- ✅ Add approval and employee-detail destinations to My HR action plan.
- ✅ Replace the Team placeholder with role-aware implemented routes and update Copilot routing instructions.
- ✅ Run `heft test --clean` with zero warnings or errors.
- ✅ Review Family 09 before enabling Family 10 work.

## Phase 15 - Family 10: Org & People Graph

### Org and People Graph human scaffold checkpoint

- ✅ Run the required Yeoman command once each for `FindExpert` and `ExploreOrganization`; never copy
  a scaffold.
- ✅ Run `npm install`, then verify two unique GUIDs, bundles, resources, and agent registrations.

### People implementation

- ✅ Add mock organization relationships, collaborators, experts, meetings, and org-change signals
  behind a people service interface.
- ✅ Add only expertise/location filters to `FindExpert` and person/organization/depth controls to
  `ExploreOrganization`.
- ✅ Implement Find an expert and Explore the organization inline variants with faceted matching,
  evidence tags, relationship context, and a keyboard-accessible collapsible graph.
- ✅ Implement the People full-screen section with network, org explorer, expert search, and meeting
  context.
- ✅ Implement Your people priorities banner and Prepare my people plan panel.
- ✅ Validate the accessibility-expert keynote prompt and relationship-context rendering.

### Org and People Graph Home integration and gate

- ✅ Add one-to-one, expert, and organization-change signals to Home.
- ✅ Add People destinations to My HR action plan and verify all ten families now contribute coherent
  signals.
- ✅ Replace the People placeholder with implemented routes and update Copilot routing instructions.
- ✅ Run `heft test --clean` with zero warnings or errors.
- ✅ Review Family 10 and the complete cross-family journey.

### Full-screen panel and People visual refinements

- ✅ Reuse the seven supplied My Day human portraits byte-for-byte and keep them base64-embedded for
  a fully offline experience.
- ✅ Render real portraits in expert results, People network rows, and organization hierarchy nodes.
- ✅ Redesign the organization explorer with manager context, an anchored person, relationship labels,
  responsive horizontal containment, and keyboard-accessible collapsible branches.
- ✅ Add Home-style thinking, shimmer, staged detail reveal, live announcements, and reduced-motion
  behavior to the Policy and all shared family right-side explanation panels.
- ✅ Validate 37 suites and 160 tests with zero failures.

### Mocked action workflow refinements

- ✅ Implement Request time off as an editable form, conflict-aware review, explicit Submit for
  approval step, and mocked confirmation with request ID in both inline and full-screen modes.
- ✅ Implement Open a private HR case as an editable privacy-aware intake, private review, explicit
  Open case with HR step, and mocked confirmation with case ID in both modes.
- ✅ Implement Approvals waiting as queue, requester detail, evidence/risk review, approve-or-decline
  selection, final confirmation, and mocked outcome with decline-reason support.
- ✅ Keep all mutations local to component state and disclose that no live HR system is changed.
- ✅ Validate both rendering modes and both manager decision paths; 38 suites and 166 tests pass.

### Demo prompt routing preparation

- ✅ Curate one minimal routing prompt for each of the 20 inline Copilot Components.
- ✅ Add parameter-prefill showcase prompts grounded in each component's actual Zod schema and
  normalized defaults.
- ✅ Document transactional follow-through for time off, HR cases, and manager approval decisions.
- ✅ Add sibling collision checks for Time, Money, Policy, Benefits, Team, and People routing.
- ✅ Expand the declarative-agent instruction from Home-only selection to all 20 dedicated tools.
- ▢ Execute the prompt catalog in the authenticated Copilot UX and record observed tool selection
  and extracted properties.

### Copilot property schema compatibility

- ✅ Remove Zod string and array length validators from all Copilot Component property schemas.
- ✅ Remove numeric Zod minimum/maximum validators from exported tool schemas and preserve safe
  bounds through explicit normalizer clamping.
- ✅ Verify all 20 emitted schemas omit unsupported `minLength`, `maxLength`, `maxItems`, `minimum`,
  and `maximum` keys.
- ✅ Preserve empty milestone-ID normalization outside Zod so runtime behavior remains stable.
- ✅ Add a regression test covering all 20 exported property schemas.

### Agent catalog icon refinement

- ✅ Replace generic placeholder icons with a Zava employee-and-agent-spark mark.
- ✅ Keep the 192 × 192 color mark within the 120 × 120 safe region on a full-bleed Zava blue square.
- ✅ Provide a matching 32 × 32 white-only outline icon on transparency.
- ✅ Align manifest `accentColor` to Zava blue and add a reproducible icon generator.
- ✅ Verify source and packaged icon hashes match exactly.

## Phase 16 - Cross-family showcase polish

### Prompt and navigation reliability

- ▢ Validate every showcase prompt selects the expected component/tool and normalized properties.
- ▢ Validate a second prompt refreshes editable defaults without requiring a page reload.
- ▢ Validate every Home and family-priority destination opens an existing detail and restores focus.
- ✅ Validate all 20 current-target intent components share one shell and one production bundle without duplicating family implementations.

### Accessibility and responsive review

- ✅ Add a tenant-free review harness for all 20 inline tools and all ten full-screen families with
  reproducible intent, family, width, mode, theme, and clean-capture routes.
- ✅ Capture and inspect representative inline, desktop, mobile, and dark implementation states with
  no console errors or horizontal overflow in the reviewed routes.
- ▢ Complete keyboard-only and screen-reader journeys for all inline components and full-screen routes.
- ▢ Complete light, dark, high-contrast, reduced-motion, 320px, mobile, desktop, and projector reviews.
- ▢ Verify empty, loading/thinking, streaming, complete, validation, success, and fallback states.
- ▢ Confirm text never overlaps controls and all fixed-format regions remain dimensionally stable.

### Keynote demo

- ✅ Curate a timed three-minute story that moves from purpose-built inline components to the shared
  full-screen workspace and My HR action plan.
- ✅ Document exact prompts, presenter wording, interaction checkpoints, trust language, optional
  privacy/manager variants, and a live-demo recovery plan.
- ✅ Create a ten-video BDM/TDM social campaign focused on the art of the possible, Copilot-hosted UX,
  secure modernization of existing experiences, human control, production direction, publishing
  cadence, platform adaptations, localization, and business measurement.
- ✅ Curate a deterministic 60-second primary demo centered on My HR action plan.
- ✅ Curate prompt-prefill demos for PTO, Benefits, Payroll, Policy, Support, Learning, Team, and
  People.
- ✅ Verify the documented demos use bundled mock data and clearly disclose mock/AI-style behavior.
- ✅ Create a timed 10-minute business-value walkthrough covering employee, private, and manager flows.
- ✅ Create a 5-minute developer walkthrough covering routing, host integration, safe workflows,
  shared bundling, the review harness, and release validation.
- ✅ Embed the canonical Microsoft 365 package-testing walkthrough (`4asOZi4PNUQ`) in README.
- ✅ Capture 32 final screenshots from the implemented React experience, including all 20 inline tools,
  all ten full-screen families, mobile Home, and dark People, with focused UX-only framing and no
  harness background padding.
- ✅ Run the clean production gate with 39 suites and 170 tests passing and zero failures.

## Optimal future - Additional inline components

These 30 intents remain useful candidates after the current 20-tool showcase. They are not part of
Phases 7-15 and must not be scaffolded opportunistically. Their data and interactions may still appear
inside the owning full-screen tab when they support a selected component's end-to-end journey.

Promote a future intent only when user evidence shows frequent direct prompting and its proposed inline
surface adds a distinct chart, decision, transaction, or explainability pattern beyond the current tools.
Promotion requires an approved UX reference, mutually exclusive routing language, a minimal parameter
schema, and a human-run Yeoman scaffold.

### Policy future

- ▢ `PolicySources` - promote when users need standalone provenance exploration beyond citations in
  `PolicyAnswer`; use source ranking, effective-date filtering, and clause-level evidence.
- ▢ `PrivatePolicySupport` - promote when policy-specific confidential handoff proves distinct from
  `CreateHrCase`; use progressive disclosure and privacy-boundary preview.
- ▢ `PolicyChanges` - promote when policy-change monitoring supports a useful before/after clause diff.

### Time future

- ▢ `TimeOffRequestStatus` - promote when direct request tracking needs a rich approval timeline.
- ▢ `VacationUsage` - promote when historical usage supports a forecast chart and carryover planning.
- ▢ `TeamCoverage` - promote when employee self-service needs a separate coverage heatmap beyond the
  manager-focused `TeamAbsenceCalendar`.

### Money future

- ▢ `ExplainDeductions` - promote when deduction composition and tax-category drill-down merit a
  dedicated visual explainer beyond `ExplainPayChange`.
- ▢ `PayHistory` - promote when multi-period trend analysis adds forecasting or anomaly detection.
- ▢ `PayDocuments` - promote when document comparison, filtering, or secure retrieval becomes more
  than a compact file list.

### Benefits future

- ▢ `CurrentBenefits` - promote when coverage-gap visualization adds value beyond the comparison matrix.
- ▢ `DependentCoverage` - promote when relationship-aware coverage editing supports a safe review flow.
- ▢ `EnrollmentChecklist` - promote when deadline dependencies justify an interactive critical-path view.

### Support future

- ▢ `HrCaseStatus` - promote when case tracking requires a direct prompt surface with a response timeline.
- ▢ `MyHrCases` - promote when cross-case filtering and priority grouping outperform the full-screen board.
- ▢ `QuickHrAnswer` - promote when support knowledge differs materially from cited `PolicyAnswer` behavior.
- ▢ `HrDeskHealth` - promote for service owners when SLA distributions and volume trends have a clear audience.

### Learning future

- ▢ `ContinueLearning` - promote when resumable media or assessment interaction can run meaningfully inline.
- ▢ `LearningProgress` - promote when skill-path trends and target-role gap analysis become available.
- ▢ `LearningRecommendations` - promote when recommendation evidence and comparison avoid a generic catalog.
- ▢ `TeamLearningStatus` - promote when manager compliance cohorts need a privacy-safe heatmap and actions.

### Rewards future

- ▢ `CompensationHistory` - promote when multi-year purchasing-power or progression analysis is available.
- ▢ `ExplainRewardsChange` - promote when annual variance drivers are distinct enough from pay-period change.
- ▢ `EquityVesting` - promote when a vesting timeline can model horizon, value scenarios, and uncertainty.
- ▢ `PensionBenefitsValue` - promote when retirement scenarios support interactive assumptions and projection.

### Team future

- ▢ `ManagerTeamHub` - promote only if a prompt-specific manager summary differs from the Team full-screen landing.
- ▢ `TeamRiskSignals` - promote when transparent, non-diagnostic indicators support explainable manager actions.
- ▢ `StartManagerCheckIn` - promote when agenda composition, history, and scheduling form one reviewable workflow.

### People future

- ▢ `PeopleNetwork` - promote when relationship strength and collaboration paths support an accessible graph.
- ▢ `PrepareForMeeting` - promote when calendar context can produce an evidence-backed preparation board.
- ▢ `OrganizationSignals` - promote when organization changes can be summarized without speculative people analytics.

## Deferred - Dynamic data / API integration

- ▢ Define live service implementations behind the existing interfaces without changing UI view
  models.
- ▢ Add selective PnPjs v4 or Microsoft Graph integrations only when the scenario requires them.
- ▢ Add real policy search, HR connectors, calendar conflicts, people graph, and SharePoint case data.
- ▢ Replace the local action-plan generator with a live service that returns the same
  `IHrActionPlan` shape.
- ▢ Add provisioning, permissions, admin-consent, error, throttling, and fallback documentation.
- ▢ Keep the committed mock mode available as the default reliable showcase.

## Docs and cleanup

- ✅ Update README features and status as each family becomes implemented; never describe planned
  behavior as shipped behavior.
- ✅ Add PnP gallery `assets/sample.json` with 32 implementation screenshots, unique order/alt text,
  local PNG integrity, and raw GitHub URLs validated by `check:gallery`.
- ✅ Add one final implementation screenshot per gallery row and complete the 60-second, 3-minute,
  10-minute business, and 5-minute technical demo scripts.
- ✅ Update solution, declarative-agent, plugin, and Teams manifest naming to Zava Employee Agent.
- ✅ Confirm all component GUIDs, shared bundle entries, localized resources, agent registrations, and tool schemas
  are synchronized.
- ✅ Move stale People Compass boards out of publication assets into documented legacy design sources.
- ✅ Run `heft test --clean --production` with 170 tests and zero failures.
- ✅ Run `heft package-solution --production` and verify one hashed bundle in the ~0.493 MiB package.
- ▢ Commit `sharepoint/solution/zava-employee-agent.sppkg` while keeping other build output ignored.

### Publication readiness gate

- ✅ README includes real screenshots, ready-made package/build paths, local review instructions,
  correct tenant-package video guidance, validation status, safety boundaries, and all demo links.
- ✅ Legacy design boards are separated from the publication asset root.
- ✅ Gallery, generated-plugin, and package-output validators run from `npm run build`.
- ▢ Complete authenticated Copilot prompt routing/property extraction and second-prompt refresh evidence.
- ▢ Complete authenticated host CSP, iframe focus, screen-reader, and Windows high-contrast checks.
- ▢ Run one cold-machine/offline rehearsal of the 60-second, business, and technical demo paths.

## Reusable playbook

- ✅ Recheck the golden [agentic-creation-rules.md](agentic-creation-rules.md) and synchronize this
  sample's reference copy byte-for-byte.
- ✅ Preserve React 18, Fluent UI v9, Heft, token-only styling, mock-first services, relative dates,
  accessibility, reduced motion, and offline runtime behavior throughout implementation.
- ✅ Record progress only in this file; do not create parallel implementation-status documents.

## Open decisions

- ✅ Approve the final Home PNG designs before Family 01 implementation.
- ✅ Keep all ten rail families selectable, using honest placeholders until each family is implemented.
- ✅ Retain all five completed Home components in the 20-tool portfolio rather than removing working
  MCP entry points solely to force an identical per-family quota.
- ✅ Show Team as unavailable with a clear manager-access state for non-managers; do not silently hide
  the family.
- ✅ Use a dedicated annual-value Total Rewards experience that remains visually and conceptually
  distinct from pay-period Payroll.
- ✅ Keep mocked workflow outcomes component-local and reset them on remount; persist only explicit
  session preferences, with no live-system writes.
