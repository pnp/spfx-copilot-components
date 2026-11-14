# Zava IT Concierge release tracker

## RC0 update - October 20, 2026

The current application baseline is SPFx 1.24.0-rc.0, React/ReactDOM 18.3.1, React types 18.3.31/18.3.7, and Heft 1.3.2. Current validation, exact packages, starter targets, findings, and external release gates are recorded in the [repository RC0 readiness report](../../RC0-updates.md). The local creation guide is synchronized byte-for-byte with the assets golden guide.

Earlier entries below retain their implementation history. Old framework versions, test totals, byte counts, and hashes in that history are not current RC0 release evidence.

This is the current source of truth for local release readiness. The approved product and UX specification is preserved in [Zava-IT-Concierge-Design-Brief.md](Zava-IT-Concierge-Design-Brief.md), and reusable implementation guidance lives in [agentic-creation-rules.md](agentic-creation-rules.md).

> **Status:** Release candidate on 2026-08-25. The canonical local build is green and the ready-made package is delivered. Public release remains gated on clean-install reproducibility, current tenant-host validation, publication metadata/rights review, and the focused quality items below.

## Final scope

- [x] 30 independently routed operational Copilot Components.
- [x] One catalog-driven `ExploreAgentCapabilities` education component that advertises the 30 operational tools and excludes itself.
- [x] Six conversation starters, each targeting one component; capability exploration is last.
- [x] One shared production bundle entry with purpose-gated lazy chunks.
- [x] Three connected full-screen dashboards: Personal, Team, and IT Portfolio.
- [x] Seven guarded submit/review experiences: device configuration, justification, issue report, device approval, approval queue, policy exception, and delegation.
- [x] Deterministic offline data and session-only confirmed-action receipts.

### Superseded early concepts

The approved three-dashboard redesign supersedes the early five-view route-browser proposal. Fleet analytics, request context, approvals, and process evidence are coordinated inside the owning Personal, Team, or IT Portfolio dashboard instead of opening separate Fleet Analytics Studio and Request Workspace applications.

The early brief also proposed five broad production state machines for device, support, access, outage, and lifecycle integration. The released mock sample does not claim those live end-to-end systems. It demonstrates seven explicit local review/confirmation workflows and one process-journey view. Authenticated cross-system state machines belong to the deferred integration scope below.

## Verified local evidence

The canonical `npm run build` gate passed on 2026-08-25.

| Gate | Verified result |
| --- | --- |
| Intent catalog | 31 intents, 31 immutable GUIDs, one shared bundle, six starters |
| Asset provenance | 17 local files, two validated agent icons, and two documented fallbacks |
| Routing matrix | 31 tools and six explicit starter targets |
| Visual evidence | 39 PNGs: 31 inline defaults, three dashboards, five representative variants |
| Visual runtime checks | Zero broken images, horizontal overflow, deprecated generic chrome, console errors, or page errors |
| Test suite | Eight suites, 35 successes, zero failures |
| Generated API plugin | API plugin v2.4, 31 functions, 31 mirrored MCP tools, 87 descriptions |
| Package | 2,147,811-byte `.sppkg`, SHA-256 `070040abb6228d9541671bd78c7f539a96e4b790aa5148025b590694028f6e1e` |
| Agent ZIP | 12,365 bytes, SHA-256 `691b546d057226ffc92e2c9d4378a3b159401c4d95f6ae11df2b2e4b5e9c6b94` |
| Agent icons | Color SHA-256 `dc2e8cf7c5819a494d2a0809b312cb5e1eda3cd04a7132eeb1605dc4c8c2b8ed`; outline SHA-256 `65f0b419ddcc3a13b909310033b1e063f1a07f8c37d32748851d0a9e68f9f934` |
| JavaScript | One primary entry, 44 lazy chunks, 45 production files, 2,549,954 bytes total |
| Initial entry | 464,014 bytes; full-screen dependencies deferred from the previous 1,732,809-byte entry |
| Largest deferred chunk | 1,228,383 bytes, below the 2 MiB release threshold |
| Packaged media | 11 files, zero duplicate hashes |
| Package hygiene | Zero stale outputs, zero duplicate inline images, no Fluent icon-font payload |

Machine-readable records:

- [assets/visual-evidence.json](assets/visual-evidence.json)
- [assets/release-evidence.json](assets/release-evidence.json)
- [assets/workbench-evidence-2026-08-25.json](assets/workbench-evidence-2026-08-25.json)
- [assets/sample.json](assets/sample.json)
- [assets/asset-provenance.json](assets/asset-provenance.json)

## Completed product work

### Catalog, routing, and explorer

- [x] Make `src/shared/intents/intentCatalog.ts` the source of truth for names, GUIDs, routes, operation, lens, schemas, preview values, education metadata, and visual identity.
- [x] Give every tool description a positive `Use` boundary and a negative `Do not use` collision boundary.
- [x] Generate component bindings, manifests, bundle membership, agent registration, and conversation starters from catalog-owned configuration.
- [x] Instruct the agent to invoke exactly one tool for the primary request.
- [x] Generate and validate [Zava-IT-Concierge-Prompt-Matrix.md](Zava-IT-Concierge-Prompt-Matrix.md) from all 31 tools.
- [x] Keep capability exploration as the final starter and exclude the explorer from its own 30-tool catalog.
- [x] Test explorer search across title, description, category, and sample prompt; audience/operation filters; page clamping; and featured tools.

### Inline UX

- [x] Use one React 18, Fluent UI v9, and owner-document Griffel host across all 31 components.
- [x] Present the Zava IT Concierge brand with the action title in the shared header.
- [x] Keep the top-right full-screen control stable and host-authoritative.
- [x] Remove generic `From your prompt` and `Decision insight` rails from default inline UX.
- [x] Preserve intent-specific evidence where it supports a chart or consequential review.
- [x] Use dedicated DOM compositions for products, knowledge, journeys, briefs, education, forms, and queues.
- [x] Use purpose-gated SVG/D3 charts and D3 geography for compact analytics; create zero inline Babylon engines.
- [x] Replace native transactional selects with Fluent `Dropdown` and `Option` controls.
- [x] Require editable rationale, visible consequence, explicit confirmation, and semantic receipt for submit/review operations.

### Full-screen dashboards

- [x] Map every origin exactly once into Personal, Team, or IT Portfolio.
- [x] Preserve the initiating intent and safe prompt properties as origin context.
- [x] Implement keyboard-operated vertical lens tabs, focus movement, responsive layout, and return to conversation.
- [x] Deliver Personal device continuity, support, requests, health, and replacement context.
- [x] Deliver Team people readiness, approval queue, budget, support load, and refresh priorities.
- [x] Deliver IT Portfolio estate geography, regional exposure, incident command, service health, tickets, spend, issues, age, refresh capacity, and licenses.
- [x] Use Babylon only where dimensional depth materially helps a full-screen scene.
- [x] Lazy-load the full-screen workspace so the initial production entry is 464,014 bytes instead of 1,732,809 bytes.

### Data, media, and safety

- [x] Design and generate professional Zava IT Concierge `color.png` and `outline.png` agent icons from one geometric Z and estate-health-ring mark; validate manifest mapping, dimensions, transparency, monochrome outline treatment, freshness, and provenance.
- [x] Generate 150 employees, 180 devices, 10 Surface/accessory SKUs, and 300 tickets from deterministic mock data.
- [x] Keep dates, IDs, people, devices, requests, approvals, budgets, incidents, services, tickets, licenses, and refresh plans referentially coherent.
- [x] Package approved demo portraits and official Surface Laptop/Pro renders locally.
- [x] Document Surface Studio/Go/Hub and Microsoft 365 marks as explicit fallbacks rather than fabricating official media.
- [x] Validate all listed local assets by SHA-256.
- [x] Keep prompt values non-consequential until visible review and confirmation.
- [x] Store confirmed receipts only in guarded session storage; no tenant action or business-data network call occurs.

## Completed publication work

- [x] Capture all 31 inline defaults from the real React implementation.
- [x] Capture Personal, Team, and IT Portfolio dashboards.
- [x] Capture Personal mobile, IT Portfolio dark, approval detail, approval confirmation, and request receipt variants.
- [x] Publish PnP `assets/sample.json` with exact file coverage, order, URLs, and descriptive alt text.
- [x] Convert README to PnP sample format and preserve the original specification as the design brief.
- [x] Publish a 3-minute keynote script.
- [x] Publish a 10-minute business-value demo script.
- [x] Publish a 5-minute technical demo script.
- [x] Add deterministic screenshot, gallery, generated-plugin, routing-document, and package validators.
- [x] Generate, audit, and expose the ready-to-deploy package at `sharepoint/solution/zava-it-concierge.sppkg`; both README package links resolve and generated debug output remains ignored.

## Canonical commands

```powershell
npm run configure:intents
npm run capture:visual
npm run build
```

`npm run build` performs catalog, asset, routing matrix, and gallery checks; a clean production compile and all tests; solution packaging; generated API plugin validation; and final package auditing.

## Pre-release publication gate

### Delivered package

- [x] **Ready-made package delivered.** The 2,147,811-byte `.sppkg` matches release evidence, the sample `.gitignore` exposes only `sharepoint/solution/zava-it-concierge.sppkg`, both README links target that artifact, and debug/extracted output remains ignored. The package is currently untracked; include it when staging the source changes for submission.

### Required before public release

- [x] **Direct Workbench component matrix.** Using the unchanged localhost Heft host and authenticated `span001.sharepoint.com` Workbench, instantiate all 31 expected component/tool pairs: 31 reached Ready, 31 rendered the Zava brand and expected heading, and 31 exposed Full screen.
- [x] **Direct Workbench display-mode smoke.** Expand all 31 turns and return each to inline: 13 resolved to Personal, 8 to Team, and 10 to IT Portfolio; every turn exposed Back to conversation and returned successfully. See [assets/workbench-evidence-2026-08-25.json](assets/workbench-evidence-2026-08-25.json).
- [ ] **Fix repeated Fluent ID collisions.** Workbench logs `@fluentui/react-provider: There are conflicting ids in your DOM` as an error while component iframes initialize. Reproduce from one clean turn, identify provider/SSR ID ownership, remove the collision without changing the baseline Heft process, and rerun all 31 inline turns with zero component console errors.
- [ ] **Restore visible exact-origin context in IT Portfolio.** Full screen opened the correct Portfolio lens but did not visibly preserve the invoking origin for `GetTicketDeflectionTrend`, `GetTopItIssues`, `GetItSpendBridge`, `PlanRefreshWaves`, `CorrelateMajorIncident`, and `GenerateItBrief`. Render/focus the initiating module or equivalent origin context and retest these six routes.
- [ ] **Resolve repeated icon registration warnings.** Workbench reports re-registration of `Options20Regular` and `Drafts20Regular` as each iframe initializes. Determine whether this is application-bundle or host behavior; remove app-owned duplicate registration or document a verified host-only exception.
- [ ] **Reproduce from a clean checkout.** In a fresh worktree or clone, run `npm ci`, `npm run check:agent-icons`, `npm run capture:visual` with the documented Playwright Chromium revision, and `npm run build`; verify 35 tests, 39 captures, 31 generated functions/tools, zero stale output, and a deployable package without relying on existing `dist`, `lib`, `release`, `temp`, `teams`, or `sharepoint/solution/debug` content.
- [ ] **Complete final-package tenant validation.** Deploy the final `.sppkg` to `span001.sharepoint.com`, reset the Copilot Component Workbench, and record the package hash/version being tested. The localhost-manifest matrix passed, but it does not prove the app-catalog package matches the tested source.
- [ ] **Validate all routing in the real host.** Rehearse all 31 prompt-matrix prompts and six conversation starters in fresh conversations; record exactly one selected tool, extracted properties, visible inline result, and expected Personal/Team/IT Portfolio continuation for each. Investigate every zero-tool, wrong-tool, or multi-tool result before release.
- [ ] **Validate host display mode and focus.** In Workbench, prove top-right Expand, `requestDisplayModeAsync`, exact destination, return to inline/conversation, iframe focus continuity, and passive rerender state preservation for representative information, review, submit, and explorer tools.
- [ ] **Validate tenant accessibility.** Complete keyboard-only navigation, screen-reader output, tenant high contrast/forced colors, dark/light host themes, 200% zoom, and mobile-width checks for inline, full-screen, queue detail, confirmation, receipt, and capability explorer states. Record issues and screenshots rather than relying on the local harness alone.
- [ ] **Resolve public publisher metadata.** Confirm PnP acceptance of the reserved `zava.example.com` website/privacy/terms/contact values or replace them with approved reachable publisher URLs and contact email. Keep fictional employee addresses reserved, and document the final publisher choice in README and manifest validation.
- [ ] **Complete media-rights review.** Add explicit terms/license or usage-policy URLs for the two Random User portraits and official Microsoft Surface renders, verify public redistribution is acceptable, and replace any asset whose rights cannot be demonstrated. Preserve source URL, retrieval date, intended use, and SHA-256.
- [ ] **Record dependency security disposition.** Add a reproducible audit command/report. Current evidence is zero production vulnerabilities from `npm audit --omit=dev` and nine moderate, no-fix advisories in the SPFx development toolchain (`express`/`qs`, `uuid`, `webpack-dev-server` paths); document acceptance, monitor upstream SPFx releases, and fail release on new high/critical or production advisories.

### Quality improvements recommended before release

- [ ] **Add a shared React error boundary.** Wrap the shared intent application so an unexpected render, lazy-load, or visualization error produces an accessible branded fallback with retry/reset guidance instead of a blank component. Add tests for inline and full-screen failure recovery without exposing stack details.
- [ ] **Make visual evidence freshness enforceable.** Add SHA-256 for every captured PNG plus a deterministic source/build fingerprint to `assets/visual-evidence.json`; make `check:gallery` fail when screenshot bytes or relevant source/styles/media/catalog inputs drift. Dimensions and filenames alone do not prove current screenshots.
- [ ] **Expand local accessibility automation.** Add executable keyboard/focus assertions, 200% browser zoom, reduced motion, forced-colors/high-contrast styling, long-label/locale stress, and accessible-name checks. Either test RTL behavior or narrow the README worldwide-readiness wording to the evidence actually collected.
- [ ] **Enforce visualization ownership and teardown.** Make the harness fail unless every inline route has zero Babylon engines, each approved full-screen scene stays within its expected engine/canvas count, and unmount returns `EngineStore.Instances` to zero. Add context-loss/fallback and nonblank-pixel assertions where canvas is required.
- [ ] **Add a small runtime performance budget.** Record settled first render for representative inline tools and each dashboard, lazy geography/chart load time, full-screen scene frame/render cost, and zero idle render loops. Define investigation thresholds and save the accepted baseline with release evidence.
- [ ] **Pin release-tool ranges exactly.** Change direct declarations from `playwright: ^1.62.1` and `unzipper: ^0.12.3` to exact validated versions, refresh `package-lock.json`, install the matching Playwright browser revision, and rerun the canonical build. Keep SPFx `1.24.0-rc.0`, Node 22, and React 18 unchanged until the Copilot Component toolchain publishes and validates a supported upgrade.

### Optional follow-ups

- [ ] Add a concise extensibility guide showing the supported Yeoman scaffold, intent-catalog entry, generator run, focused tests, routing matrix update, explorer metadata, visual evidence, and package gate for one new tool.
- [ ] Add a CI job on an image-stable Windows runner for `npm ci`, catalog/icon/asset/routing/gallery checks, clean tests, packaging, generated-plugin/package audits, and optional Playwright capture diff.
- [ ] Add polite live announcements for chart/map selection changes so screen-reader users hear the newly selected label and exact value without moving focus.
- [ ] Document the localization workflow and extract/track user-facing strings before claiming translated availability; keep English-only status explicit in the current publication.

## Deferred production integration

- [ ] Implement authorized adapters for Microsoft Graph, Intune, Entra, SharePoint, Microsoft 365 service health, procurement, shipment, license, and finance sources.
- [ ] Replace session-only receipts with authenticated APIs, role checks, audit, retry, idempotency, and durable state.
- [ ] Implement organization-specific device, support, access, outage, and lifecycle process state machines only after source-system ownership is approved.
- [ ] Provision tenant resources, consent, data classification, retention, environment configuration, and operational monitoring.
- [ ] Revalidate privacy, localization, failure behavior, performance, and accessibility with production data volumes.

## Open decisions

1. Approve reachable public publisher website, privacy, terms, and contact values, or explicitly approve the reserved sample placeholders for PnP publication.
2. Approve redistribution evidence for representational portraits and Microsoft product renders.
3. Decide whether public release waits for the recommended error-boundary/evidence-hardening items or tracks them as immediate follow-up issues.
4. Tenant-specific connectors, policy rules, retention, and production data permissions remain deferred until a live integration target is approved.
