# Zava One - Coding-agent readiness and handoff

> **Historical design record; RC0 supersedes the earlier toolchain selection.** September Beta 5 decisions and verified source dates below are retained as history. The approved current baseline is SPFx 1.24.0-rc.0 / React 18.3.1. Follow the [current README](../README.md), [synchronized creation guide](../agentic-creation-rules.md), and [RC0 report](../../../RC0-updates.md), not an old instruction to stop on RC adoption.

**Specification v0.5 | 28 September 2026 | SPFx 1.24 beta.5 + React 18 | Preview development only**

## 1. Decision and honest readiness

**The product model is ready to hand to a coding agent for a bounded, fixture-first bootstrap and reference slice, once coding is authorized. It is not ready for an unattended implementation of 34 live integrations or a production deployment.** No application has been scaffolded or deployed by this review.

Retain the 34 capabilities; do not add more to make the experience feel "ultimate." The missing investment is shared behavior, complete interaction states, reliable host adapters and explicit integration contracts. The product's strongest differentiators remain Company-first news/events, Personal choice, reusable React capability modules, useful inline experiences and reversible Card Stage navigation.

| Area | Readiness at handoff | Disposition |
| --- | --- | --- |
| Brand, information architecture, scope | Defined | Preserve 34 IDs, two tabs, visible category labels, the universal 4px spectrum bar, and protected Company anchors |
| News, learning and praise UX | Worked reference designs | Six news layouts; multi-assignment learning; compose/review/confirm praise |
| Other capability detail/state designs | Blueprint-level, not 34 finished applications | Section 7 defines initial stage/operation/data contracts; each slice must close its remaining fixtures |
| Requested development platform | Selected; package-resolution evidence still needed | Exactly SPFx `1.24.0-beta.5`, React 18, React templates, Heft; G0 verifies exact dependencies |
| Cross-host runtime and mixed packaging | Architecturally supported, not exercised here | Prove real host wrappers, expansion, lifecycle and package/catalog behavior before scaling |
| Provider APIs, permissions and operations | Candidate systems only | Fixtures first; source owners and live contracts are separate gates |
| Durable preferences and private continuation | Specified as required services, not available infrastructure | Explicit session-only preview until a real approved service is integrated |
| Accessibility, localization and performance | Requirements, not certification or measured runtime results | Gate each slice; HTML boards do not constitute SPFx/React evidence |
| Production | Not ready | Preview restrictions, tenant validation and organizational approval remain |

### What this revision closes

1. A fixed preview-platform decision instead of the old "choose a GA release before coding" ambiguity.
2. A reproducible bootstrap gate that cannot silently downgrade to React 17, drift to `@next`, or adopt beta.4-only tool-resolution behavior.
3. Concrete SharePoint composition rules that preserve independent web parts and mobile news/events order.
4. A separate neutral workspace entry; `ShowMyDay` must not accidentally become the Company-first launch tool.
5. Stage, operation and minimum-data mappings for every capability, plus shared adapter, state, privacy and preference contracts.
6. Ordered coding slices, required fixtures, completion evidence and a paste-ready kickoff prompt.

### Package reading order and authority

Read this handoff, then the [concept plan](Zava-One-Concept-Plan.md), the relevant [capability blueprints](Zava-One-Component-Blueprints.md), and the [visual boards](Zava-One-Experience-Boards.html).

The user's platform choice and this handoff govern implementation constraints; the concept governs product hierarchy; blueprints govern capability behavior; boards demonstrate visual intent. A board's static text, DOM structure or inert button is not a production contract. Report an unresolved contradiction instead of inventing a behavior. Carry this entire package, not just screenshots, into the eventual repository.

## 2. Frozen development baseline and G0

| Item | Decision | Verification required before feature coding |
| --- | --- | --- |
| SPFx generator/framework line | `1.24.0-beta.5`, explicitly selected by the user | Resolve that exact package; record version and integrity; keep generated framework packages coherent |
| React | React 18 for all Zava React experiences | Record the exact compatible `react` and `react-dom` patch emitted/supported by beta.5; pin both exactly |
| React types | React 18-compatible definitions | Resolve and pin compatible `@types/react` and `@types/react-dom`; reject React 17/19 type leakage |
| Project templates | React web part and React Copilot component | Do not scaffold No framework and convert the HTML review page into the application |
| Build | Generated Heft-based SPFx toolchain | Retain generated rig, TypeScript, lint and packaging configuration; no legacy gulp conversion |
| Node/npm/Yeoman | Node 22 LTS is the starting candidate from current setup guidance | Verify beta.5 package engines/prerequisites and record exact working Node/npm/Yeoman versions; do not infer 1.24 compatibility solely from a 1.23 table |
| Fluent UI | Fluent UI React v9 for Zava-owned UI, subject to the baseline compatibility check | Pin selected compatible versions; isolate any generated/host-required older Fluent package; do not mix independent theme systems inside a card |
| Motion | Original shared Card Stage behavior; CSS/native motion is sufficient | No automatic React Bits, animation-library or React-version dependency |
| Other libraries | Smallest supported set | Add chart/map/router libraries only after an explicit need, React 18 compatibility, accessibility and license review |
| Deployment | Isolated developer/test tenant only | No production rollout, broad consent, certificate changes or tenant upload as an implicit bootstrap action |

**Verified on 25 September 2026:** the [1.24 release notes](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/release-1.24.0) list beta.5 on September 23 and React 18.x. They say beta.5 rolls tool-resolution behavior back to the beta.3 level after a beta.4 issue. They also say newly scaffolded declarative agents target v1.8; older examples in the tutorial/overview still show v1.7. The exact pinned generator and its validated output take precedence over copying those older snippets.

The [generic compatibility table](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/compatibility) currently stops at 1.23.2 and stresses exact React versions. It does not establish the React 18 patch for 1.24. Direct npm registry requests failed with TLS transport errors in this review, and an alternate public metadata endpoint timed out. **No exact React patch, package integrity, generated dependency tree or successful beta.5 build is claimed.** Resolve this at G0 with normal certificate validation; do not disable TLS validation or invent a version to make the gate pass.

### G0 procedure for the eventual coding session

- Work only in the user-selected coding repository. Inspect its instructions and existing work before changing it. This design folder is not that repository.
- Query exact generator metadata, for example `npm view @microsoft/generator-sharepoint@1.24.0-beta.5 version engines dist.integrity --json`, and inspect the pinned React template and generated package manifest.
- Use an isolated/local pinned generator environment rather than replacing the user's global generator. Record all bootstrap versions; never use a moving `next` or `latest` tag for this project.
- Scaffold the smallest React host samples with the actual beta.5 generator. Inspect `react`, `react-dom`, their types, framework packages, manifest schemas, scripts and Heft rig.
- Commit a lockfile in the eventual repo, use `npm ci` in clean validation, and inspect `npm ls react react-dom @types/react @types/react-dom`. Do not use `--force`, `--legacy-peer-deps`, an arbitrary override or a bundled second React runtime to conceal incompatibility.
- Prove one React 18 root renders, updates and unmounts correctly in each selected host adapter. Respect the generator's externals/runtime arrangement, rather than forcing a different React copy into a host.
- Run the generated build/lint commands, declarative-agent/schema validation and production-mode packaging. The documented commands are `heft build --production` and `heft package-solution --production`; invoke the project's local pinned tools/scripts, not an unrelated globally installed Heft.
- Record actual versions, commands, results, known warnings and the package path in a bootstrap receipt. A successful install or standalone browser preview is not a host-runtime pass.

**Stop condition:** if beta.5's generated/runtime combination cannot satisfy React 18, record the exact evidence and stop for a version/compatibility decision. Do not silently use React 17, React 19, another beta, an RC, or GA.

## 3. Scope and implementation shape

### One product, not 34 apps

Start with one SPFx project and one logical product. Do not introduce a monorepo, independently deployed microfrontends or a generalized low-code form engine without demonstrated need.

Proposed source areas, adapted to the generated project rather than overriding it:

| Area | Responsibility |
| --- | --- |
| `src\shared\ui` | Fluent/theme binding, card frame, Card Stage, collection/detail patterns, state messages, chart/table wrapper |
| `src\shared\contracts` | Typed host, source, preference, invocation, navigation and mutation contracts |
| `src\capabilities\cXX-*` | Capability-owned model, controller, views, validation, fixtures and tests; no host base class imports |
| `src\services` | Provider interfaces, typed mapping and source adapters; fixtures are explicit alternate providers |
| `src\workspace` | Company/Personal shell, recipe/catalog/settings, route and selected-capability composition |
| Generated `src\webparts` | Thin independent capability web parts plus one Teams-capable workspace web part |
| Generated `src\copilotComponents` | Thin Copilot wrappers and schema-validated tool entry points |
| Generated `src\adaptiveCardExtensions` | Only selected native entry cards and approved React Quick Views |
| Generated `copilot` and `config` | Agent, component references, packaging and serve configuration; validate actual schemas |

The whole solution may eventually contain 34 selectable capability web parts, **one** custom Teams personal workspace app, Copilot tool registrations and selected ACEs. Do not expose 34 separately pinned Teams personal apps or create one agent per tile. Framework wrappers are separate registrations; React views/services are shared.

Mixed `.sppkg` packaging is documented, but prove the exact custom-Teams-app/agent catalog path with the pinned preview. Distinct app/component IDs, schema versions and deployment identities must come from generated and validated artifacts. If a preview limitation requires separate packages, record the reason and obtain approval; preserve shared source and coordinated product versions.

### React runtime rules

Create one managed React root per actual host mount element; reuse it for host updates and unmount on disposal. Keep business controllers outside animated faces and transient layout branches. A fullscreen switch or theme update must not reset the course selection, form or pending mutation.

Use effect cleanup, request cancellation, stable source/entity keys, owner-document-bound portals/styles, and per-capability error boundaries. Prevent duplicated writes, subscriptions or timers under development Strict Mode and repeated host renders. Lazy-load capabilities and heavy chart/map views; do not eagerly import/render all 34 or fetch their sources at shell startup.

A capability must render alone at a narrow web-part width on a wide browser without importing the Teams/Copilot shell. Use scoped SCSS/modules and a host-bound Fluent provider. Do not copy the boards' global CSS, synthetic host chrome, `innerHTML` composition, viewport-only grid decisions or in-memory JavaScript controllers.

## 4. Cross-host composition, routing and continuation

### SharePoint news/events: important layout correction

A single independent C06 web part cannot insert a sibling C10 web part between its lead and supporting stories when SharePoint stacks columns. The v0.3 board's interleaved markup is a design illustration, not proof of that host behavior.

For the recommended publisher-composed Editorial page:

1. Put **C06 with `editorialPart: lead`** in the first column of the first 2:1 section and **C10 Events** in the second.
2. Put **C06 with `editorialPart: supporting`** in the following section, bound to the same approved editorial collection and ordering rule.
3. Both are presentation instances of C06, not new capabilities or duplicate feeds. Match audience scope and pinned lead selection; exclude the lead ID from Supporting. Verify actual mobile section/column DOM order in the tenant.

Add publisher-only `editorialPart: complete | lead | supporting` to C06 when layout is Editorial; default is `complete` for a standalone web part. In custom Teams/Copilot shells, shared composition places lead, events and supporting content in the prescribed order. Other news layouts remain bounded collections beside Events; they do not promise arbitrary sibling interleaving. Exact all-layout whole-page parity would require an explicit workspace web part/app-page choice, not replacing independent web parts silently.

### Common host adapter contract

Keep these as application interfaces, not asserted SDK property names:

| Concern | Input/output obligation |
| --- | --- |
| Identity | Tenant and immutable current-user identity from authenticated host; no agent-supplied employee identity override |
| Surface | Actual host kind, display mode and measured container dimensions; explicit supported actions |
| Appearance | Host theme, section background, locale, direction, contrast and reduced-motion preference |
| Navigation | Validated capability route, allowed source link, explicit external handoff; no fabricated join/report URLs |
| Expansion | Request only advertised fullscreen support, await actual host result, keep inline useful on failure; collapse stays host-owned |
| Lifetime | Update, visibility and disposal hooks; cancel work and release resources when appropriate |
| Native entry | Constrained ACE Card View may launch a React Quick View or destination; no unrestricted flip/hero CSS promise |

### Neutral entry versus task entry

Add an infrastructure entry named **`OpenZavaWorkspace`**, separate from C01's **`ShowMyDay`**. This does not create C35 or another business feature.

- No requested tab: neutral launch uses saved default, otherwise Company.
- Explicit `company` or `personal`: open that tab for this invocation without saving a preference.
- Specific capability intent: open its fixed owning tab and validated detail/collection/compose stage.
- `ShowMyDay`: Personal, never an accidental substitute for neutral launch.
- A tool can filter or prefill a draft; it cannot authorize a mutation.

Use the pinned generator's supported schema mechanism for every tool. The 34 business tools plus this workspace entry are a product routing requirement, **not a verified platform tool-limit statement**. Validate the merged agent/tool budget and real routing in G1; group registrations as the actual schema supports, without an unrestricted `renderAnything` tool or silent capability removal. Private raw payloads must not be echoed into model-visible tool results.

Use one canonical route model with `tab`, `capabilityId`, `stage`, approved filters and an optional reauthorized entity reference. Use the smallest schema per intent. Reject unknown fields, invalid dates, unsupported enums and inconsistent scope visibly. Disambiguate office names/people before navigation or writes. Test collisions: Company stock versus my equity; company events versus my agenda; mandatory training versus tasks; security intake versus IT help.

### State continuation and interrupted work

Same-instance inline/fullscreen/tab changes preserve capability state. Repeated render/theme events do not count as new invocations. A genuinely new invocation has an instance/invocation identity derived through the verified wrapper, not a guessed SDK field.

If new intent conflicts with an unsent draft, offer **Keep current draft**, **Review new request**, or an explicit discard decision; do not silently overwrite it. A host remount or cross-host move requires an approved reauthorized continuation mechanism for sensitive drafts. Until that exists, label continuation as session-only, explain loss risk before supported navigation, and do not promise recovery. Browsers/hosts may close abruptly; no specification can guarantee recovery without storage.

Keep salaries, messages, HR reasons, tokens, attachments and sensitive entity IDs out of URLs and model-visible outputs. Use a short-lived server-side opaque handle when approved cross-host private continuation is required. Retention, access and expiry are source/privacy gates, not client-side defaults invented by an agent.

## 5. Shared data, operation and preference contracts

### Provider modes

The initial build uses **fixture mode**, selected explicitly at the composition/configuration boundary. Cards and the workspace carry a persistent **Demo data / No business submission** indicator. Do not allow a prompt or an arbitrary URL parameter to switch provider mode.

Fixture and live adapters implement the same typed capability interfaces. Do not import sample data directly into React views. A live error must never select the fixture adapter. Keep dates, money, periods, time zones and status consistent across cards; inject a clock for repeatable tests. The canonical visual-data snapshot is September 24, 2026 at 13:40 UTC; clock/time-zone tests use additional fixed instants. Office clocks may use device time in interactive review, labeled as such.

A simulated mutation may exercise pending/rejected/unknown/reconciled transitions in a test/demo harness, but the UI must label it **simulated**, use a clearly synthetic reference if one is shown, and never claim a real source write. The existing boards stop at **Confirm preview / Nothing sent**. Live mode is a later gate and requires actual sources.

### Minimum shared read model

Define typed per-capability payloads; do not use an unvalidated `any` map or expose raw vendor responses to views. Each result includes:

- Stable record keys scoped by provider, source references and safe authoritative destination when available.
- `asOf` instant, validity/expiry where meaningful, units/currency/period/time zone where applicable.
- Effective access/eligibility and allowed actions from the provider; no client-only role authorization.
- Explicit result state: ready, empty, partial, denied, ineligible, unconfigured, unavailable or error. Loading belongs to the controller.
- For collections: items, paging cursor, `hasMore`, scope, and total only when the source knows the complete total. "3 loaded" is not "3 required" when paging/partial results remain.
- Stable safe error code, user-facing explanation, retryability, correlation reference and approved alternative route; no raw secrets or backend stack traces.

Cache keys must include tenant, user, provider, scope, locale and relevant filters. Invalidate scoped data on confirmed changes and identity changes. Cancel obsolete requests when filters/selection change; a late response cannot overwrite a newer view. Honor source throttling and retry hints with bounded retry, paging and deduplication. No endless background polling and no module-count startup fan-out.

### Initial reference-slice DTO decisions

Use these field/type decisions for fixture models in G1, extending them only through reviewed contracts. They are application DTOs, not vendor API claims. Validate source mappings at the adapter boundary.

| Model | Required reference fields |
| --- | --- |
| `NewsStory` | `id: string`, `headline: string`, `summary: string`, `publisher: string`, `publishedAt: ISO instant`, optional `expiresAt: ISO instant`, `locale: string`, safe source route, optional image metadata including accessible alternative/focal point; collection supplies explicit promoted order and lead ID |
| `LearningAssignment` | Stable `assignmentId` and `courseId`, `title: string`, `required: boolean`, `status: notStarted/inProgress/completed/unknown`, `durationMinutes: nonnegative integer or unknown`, source-reported progress, source launch/transcript capabilities |
| Learning deadline | Discriminated `none`, `date` with `YYYY-MM-DD` plus policy IANA zone, or `instant` with an ISO instant; an absent/unknown deadline is not overdue |
| Learning collection | Items plus the shared completeness/paging model; exact required-incomplete total only if authoritative; stable source revision or `asOf` for refresh |
| `PraiseDraft` | Selected recipient `{id, displayName}` or unresolved, permitted audience `{id, label, kind: direct/team}` or unresolved, message string, optional company-value/theme ID, draft identity and source capability flags |
| Praise validation | No unresolved recipient/audience; non-whitespace message; proposed preview limit 500 characters with a displayed limit; a lower provider limit must be enforced before review, not truncated silently |
| `CardStageState` | Discriminated stage with applicable selected entity/draft/operation reference, prior navigation origin and focus/scroll return target; invalid combinations rejected rather than an unrestricted string stage |
| `SourceResult<T>` | Discriminated read states from this section, source/provenance/access/freshness metadata and capability-specific `T`; no data property containing fabricated values on denied/unavailable results |

Do not fetch real mail, directory or praise endpoints to make these fixtures work. Fixture recipients and story routes are owned demo records, not guessed tenant URLs. Domain business data should be JSON-serializable; render functions, React elements and SDK clients do not belong in persisted models.

### Mutations and handoffs

Use operation-specific commands rather than a generic update endpoint. A confirmed command carries a stable logical operation/idempotency key, validated draft, source revision if supported, and authorized scope. A receipt requires source reference/status/time.

The operation state model is **idle/draft -> review -> pending -> confirmed, rejected, conflict or unknown**. Explicit Confirm causes the transition to pending; animation never does. Failed validation stays in the draft with field errors. Conflict returns current authoritative facts without losing proposed values. Unknown after timeout offers reconciliation; it is not a rejection and not safe to blindly submit again. Reuse the logical operation key for permitted retries. If the provider cannot resolve an uncertain outcome safely, show approved support/status guidance.

The deliberate exception is a reversible low-risk action such as C04 task completion: an explicit checkbox can issue the write with pending/error/rollback and source-supported undo. It still cannot be triggered by rendering, flipping, selection or agent prose. All other new write exceptions require an explicit decision.

Opening an LMS, source document, chat or reporting page is a **handoff**, not a confirmed source transaction. Registration and adding an event to a calendar are distinct actions. Poll privacy, HR rules, shift attendance checks and security evidence handling remain provider-specific.

### Required-learning and news rules that cannot be left implicit

- C13 complete/incomplete/overdue counts derive from LMS state and a defined policy time zone. Date-only deadlines stay date-only with a zone; do not silently turn them into UTC midnight. Sort overdue incomplete first, then dated incomplete by due date, then no-due-date items with stable ID ordering.
- C13 overview selects the highest-priority incomplete assignment; all complete means an honest completed state, not a stale next-required video. Eligibility/denial is not "zero required." Completion is never inferred from playback, navigation or elapsed time.
- C06 receives a resolved authorized editorial collection. The global lead is publisher-selected, not whatever a client fetch returns first. Layout switches retain IDs, order and metadata. Scheduled/expired items and localized variants are filtered consistently.
- C06 first build supports all six manual layouts. Optional autoplay is **deferred**; do not add a timer merely because a carousel library defaults to one.
- C10 uses event status plus start/end instants and authoritative registration status; ended/canceled events leave Upcoming. A reschedule invalidates outdated local summaries.

### Preferences

Use a versioned application contract containing `schemaVersion`, concurrency revision, default tab, separate Company/Personal ordered capability IDs, allowed density, preferred office and explicit overrides. Validate IDs, deduplicate order and preserve protected anchors after policy filtering. Do not store source payloads or private drafts in preferences.

Save/Cancel/reset have separate draft and confirmed state. Save failure keeps the draft and last confirmed preferences. Concurrent save conflict must explain and reconcile; it cannot silently win by last-write. Migrations preserve explicit choices, remove retired IDs with explanation and add required defaults. A missing identity, unavailable service or session-only adapter cannot be labeled "synced across devices."

For the fixture-first preview, use a clearly labeled session-only preference adapter. Implement the proposed durable service only after its infrastructure, authorization, retention and concurrency contract is approved. Reader preferences never edit a published SharePoint page.

## 6. UX completion contract

Preserve the current visual direction, but do not treat the static board's CSS as implementation-ready:

| Gap in a design board | Required coding behavior |
| --- | --- |
| Small 10-11px source captions and illustrative host labels | Zava-owned body 14px baseline, secondary text at least 12px by design policy; verify contrast/zoom. Do not copy synthetic Microsoft chrome |
| Mostly light-theme specimens | Host-bound light/dark/forced-color tokens, icon and focus checks for every shared primitive |
| Viewport-oriented workspace CSS | Container-aware capability layouts, including 320px cards inside a wide SharePoint page |
| Inert business controls and schematic navigation | Every implemented enabled control does its declared local action, verified handoff or explicit guarded demo operation; otherwise show unavailable/configuration explanation |
| News selector visible on a review board | Publisher configuration in SharePoint and governed Company recipe; not an unsolicited reader editing permission |
| Learning/praise worked examples only | Every capability slice includes its own stage map and state fixtures before claiming completion |
| Simplified map geography | Approved geometry/license, clustering or nonoverlapping selection at dense sites, and equivalent 44px office-list targets; no employee tracking |
| Limited customization demo | Complete catalog, allowed show/hide, keyboard reorder, density, default tab, Save/Cancel/reset and conflict/error behavior |

**Shared patterns to finish first:** card frame; reversible Card Stage; collection/detail with paging and focus return; empty/access/unconfigured/partial/error states; draft/review/pending/unknown/result; host-aware navigation; catalog; settings; chart/table alternative; and inline-to-fullscreen continuation.

Use native headings/labels/buttons, visible focus and exactly one interactive card face. Keep content-driven height, support long translated strings and RTL, and avoid swallowing keyboard shortcuts or trapping focus. Respect host/card modality; a card stage is not automatically a dialog. Global help and relevant notices remain reachable at narrow widths.

The motion reference is a 240ms restrained perspective turn, instant under reduced motion. Use source-refresh updates, charts and map selection without gratuitous flips. Never wait for `animationend` to commit state or authorize an action.

## 7. All-34 implementation matrix

This is the initial coding contract, not a claim that all live providers exist. Blueprints retain detailed business behavior. **O** = overview, **L** = collection, **D** = selected detail, **E** = editable draft, **R** = review, **P** = pending, **X** = authoritative outcome/error/unknown; **H** = explicit source handoff. O/L/D routes are reversible. R->P requires explicit confirmation. Every profile inherits access, loading, empty, partial, stale and failure states.

**Operation boundary** distinguishes local navigation/preferences from source writes. Minimum fields below extend the shared read model; complete the exact typed schema, source mapping and acceptance fixtures before coding that capability's live adapter. Owning-tab and wave assignments are unchanged; a wave is not a tab.

| ID | Owning tab / wave | Initial stage profile | Minimum capability fields | Operation boundary / distinctive fixture |
| --- | --- | --- | --- | --- |
| C01 | Personal / 1B | O -> D -> capability route | Source summaries, next event, priority reason, source completeness | Composed read only; counts reconcile when mail is denied |
| C02 | Personal / 1B | O -> L -> D -> H | Event ID, subject, start/end, zone, location, status, verified join URL | Calendar/join handoff; recurrence, canceled event and DST |
| C03 | Personal / 1B | O -> L -> D -> H | Message key, sender, subject, received time, unread/flag state, reason | Read and Outlook handoff; no send/reply/body ingestion initially |
| C04 | Personal / 1B | O -> L -> D; explicit check -> P -> X | Provider/task key, title, due, source, state, revision | Reversible completion exception; rollback on failure, no title-based deduplication |
| C05 | Personal / 1B | O -> L -> D -> E -> R -> P -> X | Request key, requester, kind, evidence, allowed decisions, revision | Source decision; concurrent approval and required decline reason |
| C06 | Company / 1A | O -> L -> D -> H | Story key, headline, summary, source URL, locale, publish/expiry, image/focal point, promoted order | Read/layout only; six layouts plus lead/supporting variants, scheduled/expired/denied items |
| C07 | Company / 1A | O -> D; optional E -> R -> P -> X | Notice key, severity, scope, validity, owner, acknowledgment policy | Acknowledge only if enabled by source policy; "none" is not an all-clear |
| C08 | Company / 1A | Query -> L -> D -> H | Query/scope, typed results, source/effective date, evidence references | Search first; generated answers deferred until grounded evaluation; conflicting regional policies |
| C09 | Company / 1A | O -> L -> D -> H | Service key, purpose, approved URL, access/license state, owner | Local favorite via preference adapter; unlicensed/retired destination |
| C10 | Company / 1A | O -> L -> D -> H; supported registration E -> R -> P -> X | Event key, start/end/zone, location/mode, state, capacity, registration, recording URL | Calendar addition is not registration; cancellation and reschedule |
| C11 | Company / 1B | O -> L -> D -> H | Person key, permitted display name/role/site, expertise evidence, contact route | Directory read/contact handoff; missing photo/presence and ambiguous people |
| C12 | Personal / 2 | O -> L -> D -> H; owned step E -> R -> P -> X | Lifecycle case, ordered steps, dependencies, owner, deadline, source completion | Approved workflow only; internal transfer and blocked dependency |
| C13 | Personal / 1B | O -> L -> D -> H | Assignment/course keys, required flag, status, due/zone, duration, progress, source launch/transcript | Read and LMS handoff; 0/1/3/many, partial totals, overdue, no due date, all complete |
| C14 | Company / 1A | O -> E -> R -> P -> X; community L -> D -> H | Recipient identity, ambiguity, permitted audience, value/theme, message, source reference | Recognition submission only through approved provider; draft/Edit and unknown write |
| C15 | Company / 1A | O -> E -> R -> P -> X -> result D | Poll key, choices, privacy model, closesAt, eligibility, prior response, threshold, aggregates | Explicit vote; identified vs anonymous, duplicate vote and small cohort suppression |
| C16 | Personal / 1B | O -> L -> D; E -> R -> P -> X | Balance/unit/period, type, date-only range, work schedule, region/calendar, draft/revision | HR leave request; holidays, partial days, conflict and uncertain submission |
| C17 | Personal / 1B | O -> L -> D -> secure H | Document key, period, availability, authorized source route, step-up requirement | Read/secure source open; masked amounts and expired authorization |
| C18 | Personal / 2 | O -> L -> D -> H; approved enrollment E -> R -> P -> X | Benefit key, eligibility, effective period, deadline, plan facts, required documents | Handoff initially; confirmed enrollment only with approved write contract |
| C19 | Personal / 3 | O -> L -> D -> H | Grant key, units, vest schedule/conditions, grant state, price date/currency if used | Read only; canceled/forfeited grants; no trading/exercise/tax decision |
| C20 | Personal / 3 | O -> L -> D -> E -> R -> P -> X; travel H | Claim key, line amounts/currencies, dates, policy, safe attachments, revision | Expense workflow; travel handoff; duplicate receipt/upload failure |
| C21 | Company / 2 | O -> L -> D -> H | Site/venue, valid date, hours, menu/item, price/currency, source dietary/allergen labels | Read and optional approved ordering handoff; expired menu/unknown allergens |
| C22 | Personal / 3 | O -> L -> D -> E -> R -> P -> X | Space key/type/site, facilities, interval/zone, availability timestamp, reservation | Source reservation/cancel; concurrent booking and desk/room differences |
| C23 | Personal / 1B | O -> L -> D; E -> R -> P -> X | Service/status scope, issue category/impact, summary, safe evidence, ticket key/timeline | ITSM intake; known incident, failed submission, security reroute |
| C24 | Company / 2 | O -> L -> D; E -> R -> P -> X | Site/floor, approved contact, category, issue, safe attachments, request status | Facilities workflow; local help separate from emergency response |
| C25 | Personal / 3 | O -> L -> D; eligible E -> R -> P -> X | Shift key, interval/zone, breaks, allowed requests, device/policy checks | Workforce provider actions; overnight/DST/offline clocking, no unsupported completed claim |
| C26 | Company / 3 | O -> L -> D -> H | Project key, owner, health/evidence, milestone, risk, period, scoped budget/currency | Read/drill-through; denied projects and mixed reporting periods |
| C27 | Company / 3 | O -> L -> D -> H | Metric definition, fiscal period, region/product scope, actual/target, currency, rows | Read only; no CRM updates; RLS, zero/missing target and mixed currency |
| C28 | Company / 1A | O -> L -> D; approved check-in E -> R -> P -> X | Published metric/goal key, unit, period, actual/target, owner, public/private scope | Read published score initially; check-in cannot alter finance measures |
| C29 | Personal / 2 | O -> L -> D -> H | File key, title/type/location, modified date, source route, allowed access | Native file open; preference-only pin; revoked/moved/deleted file |
| C30 | Personal / 3 | O -> L -> D -> owning capability | Authorized team/date scope, safe availability, permitted workflow references | Read aggregation; actions delegate to C05/C12/C13/C16, never duplicate HR logic |
| C31 | Company / 1A | O -> D -> H | Instrument/exchange, currency, quote/history, previous close, asOf, delay/status, rights | Read only when relevant/licensed; market closed, stale quote and no listing |
| C32 | Company / 1A | O -> L -> D; suggestion E -> R -> P -> X | Term key, domain, synonyms, approved definition, locale, owner/effective version | Read first; suggestion workflow never publishes directly; ambiguous acronym |
| C33 | Company / 1A | O -> D -> approved H; allowed intake E -> R -> P -> X | Approved intake route/category, minimal description, confidential access, receipt | Safe handoff first; no automatic email/evidence upload or unrestricted IT ticket |
| C34 | Company / 1A | O -> L/map -> D -> C21/C22/C24 route | Office key, coordinates, IANA zone, approved address/contact/services, review date | Read/navigation only; no geolocation; list parity, midnight/DST and missing zone |

### Dependency rules

Shared UI/contracts/adapters precede all capabilities. C01 consumes established capability read models rather than implementing duplicate providers. C30 delegates actions to their owning modules. C34's cross-links route to existing C21/C22/C24 capabilities; before those are built, show an explicit unavailable destination instead of a dead enabled button.

C08 search can index authorized capability descriptors and source results, but does not grant broader permissions. C06/C10 feed the Personal highlights strip through the same read models. Preferences, routes and feature availability use the registry; do not maintain disconnected hard-coded card arrays in each host.

## 8. Ordered build plan and stop gates

This sequence refines the original waves; it does not delete or reclassify any capability. The earliest reference slice deliberately spans corporate and personal value.

| Gate / slice | Bounded deliverable | Required evidence / exit condition |
| --- | --- | --- |
| G0 - baseline | Pinned beta.5 React scaffolds and dependency/build receipt | Exact React 18 runtime/types, reproducible install/build, validated generated manifests; stop on mismatch |
| G1 - host spine | Shared shell/Card Stage, fixtures, neutral entry, one read reference and draft reference in thin wrappers | C06/C13 read and C14 no-send draft reach SharePoint, Teams, Copilot inline/fullscreen; real lifecycle and mixed-package proof; selected native Quick View alternative |
| G2 - corporate front door | C06 six manual layouts + publisher variants; C10 events; Company/Personal routing and highlights | Desktop prominence and actual SharePoint mobile composition; source-preserving layouts; no fabricated RSVP |
| G3 - interaction references | C13 complete assignment flow; C14 review/confirm and error/unknown fixtures; catalog/settings baseline | Keyboard/reduced-motion/focus/retention; guarded simulated outcome only; complete settings behavior, no false sync |
| G4 - visual breadth | C15, C28, C31, C32, C34 | Accessible chart/table, map/list/time zones, privacy/eligibility and licensed-source states; keep 34-count stable |
| G5 - remaining wave 1 | C01-C05, C07-C09, C11, C16-C17, C23, C33 | All listed stage/data/operation contracts completed per slice; C01 composed only after underlying reads exist |
| G6 - specialist waves | C12, C18, C21, C24, C29, then C19-C20, C22, C25-C27, C30 | Role/region fixtures and per-capability designs; all 34 covered with no unapproved live provider assumptions |
| G7 - approved live preview | One provider at a time in isolated tenant, durable preferences/continuation if approved | Named owner, exact API/schema/scopes, identity mapping, failure/reconciliation, deployment/admin consent and support runbook |
| G8 - production decision | Supported production baseline and rollout readiness | Separate platform/security/privacy/accessibility/operations approval; beta.5 is not relabeled production-ready |

Do not launch 34 implementation agents against undefined shared contracts. One foundation owner establishes the registry, contracts and wrappers. Later work can be bounded by capability with explicit file ownership; use a single integration owner for dependencies, manifests, shared primitives and schema changes.

The named capability sets across G2-G6 cover C01-C34 exactly once; G1 is a deliberate thin reference/proof, not an extra feature wave.

G1 is a diagnostic/reference shell, not the completed Company landing. Unimplemented catalog entries/anchor slots must say **Not included in this reference slice**, not pretend to be connected, empty or complete. The Company-first business UX gate, including functioning C10 fixture content, belongs to G2. Do not render 31 fake enabled applications to make G1 appear feature-complete.

## 9. Acceptance, fixtures and completion evidence

### Minimum fixture pack

Use fixture identities for an everyday employee, frontline worker without a mailbox, new starter, authorized manager, authorized seller, and unknown/denied user. Do not infer real identities or role permissions from demo names.

Every capability covers normal, empty, loading, denied, ineligible/unconfigured where relevant, partial, stale, unavailable, long text and narrow layout. Collections add 0/1/many/paging/selection removal. Mutations add validation failure, double click, source revision conflict, timeout with unknown result and reconciliation. Do not pretend every capability has all mutation states if it is read-only.

Include locale/RTL, 12/24-hour formats, date-only policy deadlines, Los Angeles/Helsinki/Singapore across UTC midnight and DST, canceled events, no stock listing, no market target, mixed currencies, denied source after prior access, and missing map geometry. Freeze the clock for deterministic assertions; use a real-time provider only where the scenario explicitly requires it.

### Test layers

1. **Pure behavior:** stage transitions and forbidden transitions; course priority/counts; source normalization; dates/money/units; preferences/route validation; transaction duplicate/unknown handling.
2. **React views:** named controls and one active face; Back/Edit focus; long/partial data; user changes do not disappear on theme/container updates; Strict Mode cleanup and no effect-triggered write.
3. **Visual/accessibility:** reference widths 320, 390, 768, 1024 and 1440 plus a 320px card inside a wide page; 200% zoom, light/dark/forced colors, reduced motion, keyboard, chart tables and manual screen-reader checks.
4. **Host integration:** real SharePoint page property panes/composition, custom Teams personal workspace, Copilot Workbench and real tenant conversation including expansion denial/collapse, selected native Quick View. A standalone browser test does not prove these.
5. **Packaging and routing:** generated manifest/agent validation, stable IDs, supported tool count and intent evaluation; verify merged package contents and actual catalog behavior in the authorized test tenant.

### Specific release assertions

- Company default: news and Events remain protected; specific Personal intent overrides launch preference without changing it.
- SharePoint Editorial: the approved lead/Events/supporting recipe actually yields that mobile order, not just the HTML screenshot order.
- News: all six layouts retain allowed story IDs and metadata; Previous/Next and list alternative work without drag; no automatic movement on entry.
- Learning: every required item is reachable; exact total only with complete data; Back returns to the selected item; no fake completion.
- Praise: recipient/audience/message survive Edit and host changes; only explicit approved confirmation can write; unknown is not success or failure.
- Isolation: multiple cards and Copilot invocations do not share drafts, stale identities, selections or caches accidentally.
- Personalization: all allowed controls work, policy locks explain themselves, save errors/conflicts do not masquerade as sync.
- Performance: preserve the concept's proposed p75 2.5-second useful-content goal after host initialization; measure host, bundle and source time separately in a recorded test environment. Establish bundle/request budgets from G1 measurements, not invented universal limits.

Use the generated/existing test and lint setup first. Add only the missing test capability necessary for these assertions, with compatible pinned packages. Passing a standalone TypeScript compiler does not replace SPFx bundling, manifest checks, tenant runtime or the accessibility checks.

### Definition of done for a capability slice

The change includes its completed typed contract, controller/views, fixture states, allowed operation, registry entry, required wrappers, tests and relevant blueprint updates. Every enabled control is meaningful. Record actual commands, outcomes, host evidence, unsatisfied checks and exclusions. Screenshots show true state, not staged success. No secrets, private telemetry, TODO success paths, silent fixture fallback or unapproved dependencies/scopes.

If a tenant/API prerequisite is unavailable, local fixture work may be complete, but **host validation or live integration stays explicitly blocked**. Do not mark the overall release complete.

## 10. Live integration and operational gates

Before enabling any live provider, record its owner, approved version/endpoint, exact least-privilege scopes, employee identity mapping, eligibility/region rules, allowed reads/writes, field schema, source freshness, caching/paging/throttling, idempotency/reconciliation, audit/retention and support route. Put credentials and server-enforced vendor authorization in an approved backend, never in SPFx properties, the browser bundle or a prompt.

Graph and SharePoint adapters still require real permission/endpoint review; familiar product names do not establish access. HRIS, LMS, CRM, ITSM, market, survey and security-intake providers are not yet selected. Do not scaffold pretend vendor APIs or grant broad application permissions to avoid discovery.

Deployment requires an approved test tenant/site/app catalog, app identity/version strategy, source configuration and operator. The documented Copilot catalog synchronization may appear as **Add to Teams**; the custom personal app and the declarative agent have distinct roles. No automatic upload, tenant-wide enablement or admin consent in this design pass.

Define structured content-free diagnostic events: capability/surface, operation kind, result code, elapsed time and safe correlation ID. Exclude message text, search content where sensitive, salary, HR reasons, recipient identities, raw source bodies and confidential incident details. A business audit trail is source-governed, not ordinary analytics.

Provide source-specific disable controls and explicit unavailable-state behavior; preserve help routes. Document upgrade/migration, rollback, cache invalidation and removal. Validate licensing, map/market/image rights and source availability separately from UI success.

## 11. Paste-ready first coding-agent task

Use only after the user has selected a coding repository and authorized development:

> Build the first bounded Zava One preview slice from the v0.4 design package. Start with G0, then G1 only. Preserve Company-first news/events, the Company/Personal model, the 34 capability IDs and the shared Card Stage contract. Use exactly SPFx 1.24.0-beta.5, React templates and React 18; resolve and pin the compatible exact React/runtime/types versions from verified beta.5 output. Use the generated Heft toolchain. Do not use next/latest, downgrade React, force peer resolution or copy the HTML board as application code.
>
> Inspect repository instructions and existing work. Read the handoff, concept, C06/C13/C14 blueprints and boards. Produce the G0 bootstrap receipt before adding feature breadth. If dependency/runtime compatibility is unresolved, stop with evidence rather than switch versions.
>
> Implement thin host adapters around shared React UI/controllers using explicitly labeled deterministic fixtures. Prove the common shell, neutral OpenZavaWorkspace entry, C06/C13 read views and a C14 no-send draft/review flow. Keep external handoffs and unavailable integration behavior honest. Demonstrate root disposal, draft/selection retention, reduced motion, keyboard focus and expansion denial. Validate the generated agent/tool configuration and package.
>
> Do not implement the other 31 capabilities, new live providers, a preference backend, arbitrary infrastructure, broad permissions or deployment without the next approved slice. Do not invent tenant IDs, secrets, source endpoints or successful receipts. Run relevant build/lint/tests and report exact completed versus blocked host checks. Stop for review at G1 with the evidence and next slice recommendation.

For later slices, include the exact capability IDs, fixture contract, operation boundary, allowed files/shared contracts, applicable host evidence and stop condition. A task titled "build the ultimate app" without these bounds is not an acceptable handoff.

## 12. Evidence and open decisions

| Evidence | What it establishes / does not establish |
| --- | --- |
| [SPFx 1.24 preview release notes](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/release-1.24.0), checked 25 Sep 2026 | beta.5 date, React 18.x, beta.3-level tool resolution rollback, v1.8 scaffold target, preview constraints; not exact React patch |
| [Compatibility reference](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/compatibility), checked 25 Sep 2026 | Exact compatible React matters; current table lacks a 1.24 row |
| [Development setup](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-development-environment) and [Heft toolchain](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/toolchain/sharepoint-framework-toolchain-rushstack-heft) | Modern tooling and Node 22 starting guidance; beta.5 engines still require verification |
| [Copilot overview](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/overview-copilot-apps) and [first component tutorial](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/get-started/build-your-first-copilot-app) | Separate base classes, generated schema/tool structure, host-owned collapse, mixed packaging, Workbench and tenant flow; sample schema versions can lag |
| Existing v0.3/v0.4 HTML boards | Visual/reference interactions only; no React build, app-catalog or live-provider evidence |

Open items are bounded rather than hidden: exact dependency/runtime receipt; target repository and tenant; selected primary pinned app per audience; real source systems/owners/scopes; durable preference/private-continuation service; approved geography/market licenses; remaining capability-specific visual states; and later production baseline/rollout approval. None requires expanding the 34-feature catalog today.
