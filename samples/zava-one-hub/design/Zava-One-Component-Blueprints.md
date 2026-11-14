# Zava One - 34 component blueprints

> **Historical design record; RC0 supersedes the earlier toolchain selection.** September Beta 5 decisions and verified source dates below are retained as history. The approved current baseline is SPFx 1.24.0-rc.0 / React 18.3.1. Follow the [current README](../README.md), [synchronized creation guide](../agentic-creation-rules.md), and [RC0 report](../../../RC0-updates.md), not an old instruction to stop on RC adoption.

**Design proposal v0.5 | 28 September 2026 | SPFx 1.24 beta.5 + React 18 | Read with the** [**coding-agent handoff**](Zava-One-Agentic-Handoff.md)**,** [**concept plan**](Zava-One-Concept-Plan.md) **and** [**visual boards**](Zava-One-Experience-Boards.html)**.**

Each numbered capability is an independently composable React 18 module, not a separate application. **Card** describes a SharePoint web part or workspace module. **Inline** describes the focused Copilot experience. **Expanded** is a detail destination in the common Teams/Copilot shell, or a supported SharePoint detail experience. Native dashboard cards use the constrained ACE alternative described below.

Every capability inherits the concept plan's universal 4px four-color spectrum bar, theme, accessibility, source/freshness, permission, loading/empty/partial/error, and host-continuation contracts. The bar is identical across inline components and web parts and never communicates category or status. The candidate sources and tool names below are implementation proposals, not verified access grants or completed integrations. Reference IDs point to the plan's source register.

The v0.4 handoff adds the all-34 initial stage/operation/minimum-data matrix and G0-G8 coding gates. Begin with the exact beta.5/React 18 baseline and labeled fixtures; complete the relevant typed schema, provider mapping and state fixtures before each live adapter. The HTML boards are not the generated React implementation or host-validation evidence.

**Tab ownership is explicit for all 34 IDs in the concept plan's Component-to-tab table.** Company owns C06-C11, C14-C15, C21, C24, C26-C28 and C31-C34. Personal owns C01-C05, C12-C13, C16-C20, C22-C23, C25 and C29-C30. Global utilities and scoped cross-tab summaries do not create duplicate capabilities. Specific intent expansion opens the owning tab even when the user's default launch tab is different.

The original 30 IDs remain stable. C31-C34 are the four new independently composable capabilities. Company news and events are protected default anchors; daily signals, offices, praise, a published outcomes chart, glossary and an applicable stock ticker fill out the Company recipe. Personal defaults explicitly include mandatory learning/video, payslip and IT ticket entry alongside daily work.

## Common surface rules

| Surface | Contract applied to all 34 |
| --- | --- |
| SharePoint | A separately selectable web part; publisher chooses placement/source/defaults; reader actions remain permission checked |
| Teams personal app | A module and detail route in the Company/Personal shell; protected anchors plus saved per-tab recipes |
| Copilot inline | One useful intent-sized view; validated prompt inputs visibly filter/prefill; never auto-write |
| Copilot full screen | The same owning detail route/shell as Teams; retain draft/entity/filter; host owns collapse |
| Native Dashboard / former Viva | Compact native card if the scenario merits one; shared React Quick View or approved destination; never promise unrestricted native-card CSS |

Not all 34 belong in a native dashboard at once. **Native** notes below recommend a useful entry shape, not a requirement to implement every possible native card.

### Card Stage contract inherited by C01-C34

Every capability's next UX pass must name its overview, collection, selected detail and applicable compose/review/outcome stages. Read flow: **overview -> collection -> selected detail -> collection -> overview**. Write flow: **overview -> compose -> review -> explicit confirmation -> pending -> source receipt**. Skip irrelevant stages; retain appropriate direct source/host handoffs.

Use one stable card frame with a restrained forward/back flip; the supplied React Bits example is inspiration, not a package requirement. Only one face is accessible at a time. Named buttons, keyboard focus/return, preserved entity/filter/list position/draft, content-driven height and an instant reduced-motion variant are mandatory. A card transition never writes data. Errors, conflicts and uncertain writes remain explicit; Back/Edit preserve work, while intentional discard explains what is lost. Native ACE Card Views use supported Quick View/detail actions instead of custom flip CSS. The concept plan defines the complete shared rules.

C13 and C14 are the worked design references below. The handoff's section 7 explicitly maps the initial stages and operation boundary for all 34; capability-specific visual/error fixtures still gate each coding slice. Read/source handoffs do not gain writes just because a generic stage engine supports confirmation.

## My day and personal work

### C01 - My day briefing

**Job and audience:** "Tell me what matters next without making me open six applications." All employees with available sources; daily. This is a summary of other capabilities, not another calendar/task database. **Basis:** R1, R5.

- **Card:** greeting, local date/time zone, next meeting, two priorities, compact reason/source labels. Universal spectrum top bar. One **Open my day** action; optional site weather only when configured.
- **Inline:** "You have 3 meetings and 2 priority tasks" with specific source links and an explanation of priority rules. Do not claim a complete briefing when mail or calendar is unavailable.
- **Expanded:** Personal / My day with C02/C03/C04/C13/C16/C17/C23 and other chosen cards; compact company highlights link to C06/C10. A **Plan my day** panel proposes a sequence; it does not book focus time or alter tasks automatically. Do not use this personal hero as the default Company landing.
- **Native:** next-action summary and open-workspace action. **Preferences:** enabled source categories and working hours; no sensitive inference.
- **Source / owner:** composed read models from participating services; employee-experience owner. Begin with deterministic prioritization; any later generated summary requires authorized grounding, citations and evaluation.
- **Intent / acceptance:** `ShowMyDay` - "What should I focus on today?" All numbers must reconcile with the visible underlying source cards; denied sources produce an explicit partial briefing.

### C02 - Calendar and meeting preparation

**Job and audience:** "Show my day and help me prepare for the next meeting." Information workers and applicable shift/meeting participants; daily. **Basis:** R1.

- **Card:** chronological agenda, current/next event emphasis, start/end times and local time zone, online/location label. **Join** and **Open calendar** are distinct actions.
- **Inline:** the requested meeting or a short date-scoped list; attendees and linked preparation material only within permissions. Prompt date is visible and editable.
- **Expanded:** day/week agenda and selected-event detail; preparation checklist and authorized files. Avoid recreating all of Outlook.
- **Native:** next meeting and join link; Quick View for agenda. **Preferences:** workweek, time display, permitted calendar scope.
- **Source / owner:** Microsoft Graph calendar and supported meeting links; collaboration services. Recurrence, cancellations, DST and organizer updates come from the source.
- **Intent / acceptance:** `ShowMyAgenda` - "What do I have tomorrow morning?" Test a time-zone boundary and a canceled meeting; do not infer shared-calendar access or generate a join URL.

### C03 - Important email

**Job and audience:** "Help me notice the messages that need attention." Mail-enabled employees; daily. **Basis:** R1.

- **Card:** at most three message rows, sender, subject, age, importance reason and unread state; body previews off by default in sensitive contexts.
- **Inline:** matching important messages with clear scope such as flagged/unread; explain the selection rule rather than pretending to perfectly detect urgency.
- **Expanded:** bounded triage list with source filters and **Open in Outlook**. Reading/replying stays in Outlook initially; any later send flow requires explicit recipient/body review.
- **Native:** count/summary without subject disclosure on shared-device views. **Preferences:** allowed importance rules and preview privacy.
- **Source / owner:** Graph mail; messaging owner. Request only necessary fields; avoid attachment/body ingestion unless the approved scenario needs it.
- **Intent / acceptance:** `ShowImportantMail` - "Show messages I have flagged." Results match the source filter; revoked mailbox consent results in a reconnect/access message, not an empty inbox claim.

### C04 - Tasks and personal follow-ups

**Job and audience:** "See and complete my assigned work in one place." Employees using supported task systems; daily. **Basis:** R1, R5.

- **Card:** due-today count, compact progress, up to five tasks with due time and source badge; priority is textual as well as colored.
- **Inline:** filtered task list or one task detail; a checkbox is an explicit user action, not something a prompt silently executes.
- **Expanded:** Today / Upcoming / Completed filters, source grouping, task detail. Include only permitted task types; a Planner item and a To Do item retain their source identity.
- **Native:** due count and short task Quick View. **Preferences:** source list and sort order.
- **Source / owner:** Graph To Do and supported Planner APIs; work-management owner. Use stable `(source, id)` keys; do not deduplicate unrelated tasks by title.
- **Intent / acceptance:** `ShowMyTasks` - "What is due today?" Completion appears in other hosts after refresh; failed writes roll back the check with a clear error and preserve the task.

### C05 - Approvals and decisions

**Job and audience:** "Give me enough evidence to make the decisions awaiting me." Approvers and requesters; event-driven. **Basis:** R5, R12.

- **Card:** pending count and three rows with requester, type, due time and value only if authorized. **Review**, not one-click bulk approval, is primary.
- **Inline:** one request's evidence, status and allowed decision choices; decline/comment fields appear when required.
- **Expanded:** filterable inbox and request detail with history, attachments and review/confirm action flow. Submitted and awaiting-my-decision are clearly separate.
- **Native:** count and review Quick View, not sensitive financial previews. **Preferences:** request type/source filters.
- **Source / owner:** verified approval providers and source workflows; process owner for each type. The repository's Graph example does not establish coverage for every HR/finance approval.
- **Intent / acceptance:** `ShowMyApprovals` - "Which approvals need me?" A request approved elsewhere becomes non-actionable; duplicate confirmation cannot create a second decision and receipt comes from the source.

## Company information and discovery

### C06 - Company and local news

**Job and audience:** "Help me understand what is happening in the company and my location." All employees; daily/weekly. **Basis:** R3, R5.

- **Card:** protected Company lead region, approximately two-thirds of the first desktop row beside C10 Events. Publisher-selectable **Editorial (default), Hero tiles, Layers, Carousel, Filmstrip or Compact list** over the same authorized feed. Editorial shows a substantial lead plus supporting headlines. Tiles/layers/carousel take first-party Hero inspiration; Filmstrip is Zava's horizontal multi-story alternative. Do not reduce news to a tertiary tile. [R18]
- **SharePoint composition:** Editorial has `complete`, `lead` and `supporting` presentation parts. For mobile lead/Events/supporting order with independent web parts, place lead and C10 in the first 2:1 section and supporting in the following section. Both C06 instances share the approved collection/order and exclude duplicate lead content. Verify actual host stacking; one complete C06 web part cannot interleave C10 inside itself.
- **Inline:** the requested topic/location with a bounded news list, source link and publication dates; summaries are marked as summaries.
- **Expanded:** Company / News with accessible article/feed layout, regional editions and native SharePoint destinations. Global editorial selection remains visible alongside permitted local personalization. Preserve publishing, translation, comments, approval and expire/promotion dates in the source.
- **Native:** use native News/Hero where it meets the need rather than assuming cross-host reuse of their implementation. **Preferences:** publisher owns layout, promoted order/count, image focal point and summary density; optional reader topics stay within policy. Board layout selectors are review-only controls.
- **Source / owner:** SharePoint news pages and audience metadata; corporate/local communications. Permission trimming remains distinct from audience relevance.
- **Stages / motion:** overview/selected story -> news collection -> article detail -> originating collection/story. Carousel has explicit Previous/Next, position and direct selection; Filmstrip has those controls plus native scrolling/snap. No motion on entry; autoplay is deferred from the first build, and future Play/Pause follows the concept's interruption/reduced-motion rules. Narrow views retain a list alternative. Layout changes do not alter story scope.
- **Intent / acceptance:** `ShowCompanyNews` - "What's new in our Finland office?" All six layouts retain story identity/order, dates and source links; unpublished/unauthorized/expired promotions stay excluded. Cover zero/one/many stories, long headlines, keyboard/manual motion and reduced motion. Events remain visible independently; Personal keeps a compact headline without forced acknowledgment.

### C07 - Essential announcements and alerts

**Job and audience:** "Make sure I notice the information that changes what I must do." Affected employees; exceptional. **Basis:** R5, R6.

- **Card:** compact alert with severity text/icon, affected site, validity interval, owner and action. Distinguish a service notice from an emergency.
- **Inline:** active relevant alerts or details of a named notice. If none apply, say **No active notices from this source**, not "everything is safe."
- **Expanded:** notice detail and history with acknowledgment only when an approved communication policy requires it. No user layout toggle may hide a currently mandated applicable alert.
- **Native:** prefer the host Announcements capability if suitable. **Preferences:** no opt-out of applicable mandatory notices; accessibility and language remain configurable.
- **Source / owner:** SharePoint announcements or incident publisher; communications/site safety. It is not a substitute for emergency notification systems.
- **Intent / acceptance:** `ShowActiveAnnouncements` - "Any office notices today?" Start/expiry/time-zone and audience rules work; acknowledgment states are authoritative and retained only under policy.

### C08 - Search and verified knowledge answers

**Job and audience:** "Find the right person, policy, document, or tool without knowing the department." All employees; frequent. **Basis:** R3, R4.

- **Card:** a clearly scoped search field or entry to results; source categories and recent safe searches where appropriate. Avoid a second competing SharePoint global search.
- **Inline:** answer with exact source references/effective dates, or typed results for people/content/tools. If evidence conflicts, show the conflict rather than inventing policy.
- **Expanded:** results with content-type, location, freshness and source filters; policy detail retains authoritative link and owner. Enter submits the typed query, not an unchosen suggestion.
- **Native:** search/knowledge entry with a supported detail destination. **Preferences:** scope and language within permissions, not private-data inclusion by default.
- **Source / owner:** supported Microsoft/SharePoint search plus approved connected sources; knowledge/search owner. Index and authorization capabilities must be verified per provider.
- **Intent / acceptance:** `FindCompanyKnowledge` - "What is the parental leave policy in Finland?" Show only the applicable authorized policy or say the region is unresolved; every answer claim has a retrievable source.

### C09 - Apps and employee services directory

**Job and audience:** "Find the right application or service without memorizing its URL." All employees; frequent. **Basis:** R3, R5.

- **Card:** six permitted favorites with recognizable icon/name and a short purpose; **All apps and services** opens discovery.
- **Inline:** precise matches to "Where do I submit expenses?" with service owner, access state and launch action.
- **Expanded:** searchable catalog by employee task, favorites, support links and access-request route; label external destinations before navigation.
- **Native:** Resources and supported custom service cards can point to the same catalog. **Preferences:** personal favorites/order, not endpoint/credential editing.
- **Source / owner:** curated SharePoint-backed service catalog and approved launch/access metadata; digital workplace owner. A catalog item is not proof of actual license/access.
- **Intent / acceptance:** `FindEmployeeService` - "Open the expenses service." Safe destination allowlist and retired-link handling work; an unlicensed service shows how to request access instead of a dead launch.

### C10 - Company events and town halls

**Job and audience:** "Find events I can attend and get the details right." All employees, targeted by role/location; weekly. **Basis:** R3 and editorial/engagement design synthesis.

- **Card:** protected default Company card beside lead news, with next two relevant events, date, user time zone, mode, location and registration state. The shared shell places it after the lead article and before supporting news on narrow screens; an independently composed SharePoint page uses the C06 lead/supporting recipe to achieve that order. Empty state offers the event calendar/recordings rather than deleting the anchor.
- **Inline:** topic/date-scoped event results or one event detail with a register/add-to-calendar action.
- **Expanded:** Company / Events with calendar/list filters, detail, registration, calendar invitation and captioned recording/transcript links. Personal may show my registered events through the same component, not a second event database.
- **Native:** upcoming-event card or source event page. **Preferences:** topics and permitted location filters.
- **Source / owner:** SharePoint events plus authoritative registration/Teams event systems; internal events owner. A calendar link does not equal registration.
- **Intent / acceptance:** `ShowCompanyEvents` - "When is the next town hall?" Default visibility, rescheduling, cancellation, capacity and local time are correct; registration confirms only after source acknowledgment. Ended events move out of Upcoming into Recordings/Past.

## People, growth and belonging

### C11 - People and expertise

**Job and audience:** "Find the person who can help and contact them." All employees; frequent. **Basis:** R3, R4, R13.

- **Card:** people search or a small contextual contact set; name, role, location and accessible avatar. Expertise includes its evidence/source rather than an unexplained score.
- **Inline:** up to three matches with why they match, profile link and supported Teams/email actions.
- **Expanded:** filterable directory, profile and reporting context; only approved profile/skills fields. Presence is optional and permission-dependent.
- **Native:** people lookup Quick View or directory link. **Preferences:** relevance filters; no private-profile scraping.
- **Source / owner:** Graph directory plus approved skills profile store; identity/people-data owner. Use a supported endpoint with reviewed scopes, not automatic adoption of a sample's beta call.
- **Intent / acceptance:** `FindPeople` - "Who can help with accessibility?" The profile remains useful without photo/presence access; every expertise claim maps to approved data and disabled users are treated according to policy.

### C12 - Onboarding and employee transitions

**Job and audience:** "Tell me the next step and who owns it." New starters, internal movers and authorized offboarding participants; lifecycle. **Basis:** R5, R14.

- **Card:** progress, next step, deadline and buddy/owner. One explicit **Continue onboarding** action.
- **Inline:** personalized next steps for the authorized lifecycle case; a blocker names the responsible team and help route.
- **Expanded:** sequenced checklist/timeline with dependencies, instructions, evidence and owned actions. Completed steps are source-backed; sensitive offboarding information is restricted.
- **Native:** next step/remaining count and detail route. **Preferences:** benign reminders; no hiding mandatory tasks.
- **Source / owner:** HR workflow, provisioning status, learning and approved checklist store; employee-lifecycle owner.
- **Intent / acceptance:** `ShowMyOnboarding` - "What do I need to do before my first day?" Completion dependencies hold and an internal transfer does not restart an unrelated onboarding journey.

### C13 - Mandatory training, videos and learning

**Job and audience:** "Know what training is required and find useful development." All employees; periodic. **Basis:** R3, R5.

- **Card:** default Personal card shows **one** prioritized incomplete course/video, due date, duration and source progress, plus the explicit assignment count and **View all 3** in the example. Overdue first, then nearest due date with stable ordering. Three required assignments must never look like a single-course backlog. A discreet Company reminder remains; no employee leaderboards.
- **Inline:** required courses or skill-filtered options with eligibility, source, expected duration and launch link.
- **Expanded:** Personal / Learning with required/recommended/completed views, accessible video player or approved LMS handoff, captions, transcript, playback speed, resume position and assessment requirements. Never autoplay audio. Viewing a video or seeking to its end does not automatically satisfy mandatory training; completion comes from LMS rules.
- **Native:** next course plus count; supported Quick View or destination reveals the required collection. **Preferences:** development interests; required courses stay visible when applicable.
- **Source / owner:** LMS and supported learning integrations; learning/compliance owners. Viva Learning availability and licensing require confirmation if used.
- **Stages / motion:** overview -> all required assignments -> select any course -> that course's detail -> Back to the same collection row -> Overview. Overview can also open its featured course directly; Back restores its actual origin. Collection includes due dates, duration and status. Keep selection/filter/list position through turns and expansion. Course launch is an explicit LMS action, not a flip. Exact totals require complete source data; show a loaded/partial count otherwise. Date-only deadlines use a defined policy zone; no-due-date items follow dated items with stable ordering.
- **Intent / acceptance:** `ShowMyLearning` - "What mandatory videos must I finish?" Demonstrate at least three independently selectable assignments, correct count and nearest-due overview; cover zero, one, many, overdue, completed, inaccessible and partial-feed cases. Check keyboard focus return, reduced motion, captions/transcript and source-backed completion. Neither flipping, selecting nor playback alone marks a course complete.

### C14 - Praise and employee communities

**Job and audience:** "Recognize a colleague and find people with shared work or interests." Employees within community policies; weekly. **Basis:** R3 and social/engagement design synthesis.

- **Card:** default Company praise/community card with a human recognition story and prominent **Send praise** action, author and visibility scope. Never use competitive employee scoring or silently publish a private message.
- **Inline:** recognition draft with recipient, message and audience clearly editable, or matching communities when the intent is discovery.
- **Expanded:** Company / Praise with the same draft/stage as its card: recipient picker, praise theme/company value, message, optional audience/channel, preview, explicit Send and source receipt. Community discovery is a second view. Personal can expose the same send-praise shortcut. This is a Zava workflow, not an assumption of a supported write API for the native Teams Praise app.
- **Native:** community/recognition summary without private group leakage. **Preferences:** followed communities and permitted feed filters.
- **Source / owner:** approved recognition store and community links/integrations such as Viva Engage; employee engagement owner. Verify APIs and moderation policies.
- **Stages / motion:** overview -> **Send praise** -> compose -> **Review praise** -> review recipient/message/audience -> **Confirm and send** -> pending -> source receipt. Edit turns back with all fields intact. Cancel explains discard; uncertain results reconcile before any retry. Review-only boards use **Confirm preview** -> **Nothing sent**, never a fabricated successful receipt.
- **Intent / acceptance:** `ShowRecognitionAndCommunities` - "Send praise to Alex for the launch." The request only opens a draft. Resolve ambiguity, validate required fields, preserve edits across stage turns, and verify focus/reduced-motion behavior. No automatic post from flipping; explicit confirmation, duplicate-click protection and private audience enforcement are required for production.

### C15 - Daily signals, polls and surveys

**Job and audience:** "Take the daily pulse and contribute feedback knowing who can see it." Eligible employees; daily/periodic. **Basis:** explicit review request and design synthesis.

- **Card:** default Company **Daily signal** with one short question, labeled choices, closing time, privacy model and explicit Vote. Use a stable No active poll state when there is no published question; do not fabricate a daily prompt.
- **Inline:** survey invitation or approved short survey rendering; explain the privacy model before an answer is submitted.
- **Expanded:** Company / Daily signals with active poll, prior published results, source receipt and permitted aggregate bar chart/table. Results require the configured minimum cohort; label sample size and closing date and suppress small slices. Separate daily low-risk polls from sensitive anonymous surveys.
- **Native:** survey invitation and supported form destination. **Preferences:** optional reminders within policy.
- **Source / owner:** approved survey platform; people insights/privacy owner. Keep anonymous submissions out of identity-linked product telemetry.
- **Intent / acceptance:** `ShowEmployeeSurveys` - "What's today's employee poll?" Show privacy before voting, handle duplicate submissions according to provider rules, do not imply anonymity for identified responses, and never expose results below the approved cohort threshold.

## Pay, benefits and life administration

### C16 - Time off and holidays

**Job and audience:** "Understand my entitlement and request the right dates." Eligible employees; periodic. **Basis:** R3, R5, R11.

- **Card:** source-period balance with explicit unit, upcoming leave and next local holiday; **Request time off**.
- **Inline:** balance answer or editable request with date/type prefill, workday calculation, conflicts and **Review request**. Absence reason remains private.
- **Expanded:** balances, holiday/leave calendar, draft/review/confirm, pending requests and source receipts. Expansion retains the unsent dates and leave type.
- **Native:** safe balance summary or request entry; sensitive leave categories may be suppressed. **Preferences:** display calendar and locale, not entitlement calculation.
- **Source / owner:** authoritative HRIS/leave provider and holiday calendar; HR operations. Outlook can inform availability but is not the leave balance authority.
- **Intent / acceptance:** `ShowTimeOff` - "Draft leave for October 19-23." Validate region, employment schedule, holidays and hours/days; two confirmations/retries cannot create duplicate requests.

### C17 - Payslips and tax documents

**Job and audience:** "Access the right personal pay record and understand its source." Payroll-eligible employees; monthly/annual. **Basis:** R3, R5, R14.

- **Card:** default eligible Personal **Payslip** card showing latest period/availability, with **Open payslip securely**. Pay amounts remain masked and never appear in Company highlights.
- **Inline:** document availability by period with an explicit reveal/open action; no salary or tax information in agent-visible text by default.
- **Expanded:** authenticated period list and source document handoff; an optional pay comparison only when data meaning and privacy are approved.
- **Native:** new-document notice without amount. **Preferences:** display format; masking defaults controlled by policy.
- **Source / owner:** payroll provider; payroll/privacy owners. Sensitive viewing/download may require step-up authentication and approved audit.
- **Intent / acceptance:** `ShowPayDocuments` - "Where is my August payslip?" Identity mapping is server-verified; another employee's ID in a prompt never changes the subject and private values never enter URLs.

### C18 - Benefits and life events

**Job and audience:** "Know what applies to me and what I need to do during a life change." Eligible employees; enrollment/lifecycle. **Basis:** R3, R5, R14.

- **Card:** enrollment window, outstanding action, and benefit categories. Health/wellbeing support can be listed without exposing claim or treatment details.
- **Inline:** region/eligibility-scoped benefit explanation with authoritative policy and deadline; life-event prompt starts a draft, not enrollment.
- **Expanded:** enrollment checklist and comparable plan facts, life-event documentation requirements, approved provider handoff or confirmed transaction.
- **Native:** upcoming deadline and safe detail link. **Preferences:** benign interests; no inferred medical/family status.
- **Source / owner:** benefits administrator and HR policy; total-rewards owner. Enforce eligibility and effective date; avoid personalized medical or financial advice.
- **Intent / acceptance:** `ShowMyBenefits` - "What do I need to do after moving country?" Ambiguous residency/employment scope is resolved before advice/actions; stale policy is labeled.

### C19 - Equity and stock vesting

**Job and audience:** "Understand my grants, vesting dates and what the numbers mean." Equity-eligible employees only; periodic. **Basis:** explicit user request; adjacent rewards inspiration in R14. Not a universal intranet feature.

- **Card:** next vesting date and units, masked by default; no speculative monetary gain headline.
- **Inline:** requested grant/date schedule with vesting conditions, source/as-of time and clear separation of vested, unvested and estimated value.
- **Expanded:** grant table and vesting timeline, document links and provider handoff. Stock trading, exercise, sale and tax decisions remain out of initial scope.
- **Native:** private equity entry with no amounts. **Preferences:** units/value display only where authorized.
- **Source / owner:** equity administrator and approved price feed if needed; compensation/equity owner. Estimated value must show price date/currency and exclude unsupported tax assumptions.
- **Intent / acceptance:** `ShowMyEquity` - "What vests next quarter?" Grant totals reconcile; canceled/forfeited awards are handled; changing currency cannot fabricate a converted value.

### C20 - Expenses and business travel

**Job and audience:** "Finish an expense claim and find my approved travel actions." Travelers and reimbursable-expense users; periodic. **Basis:** R3.

- **Card:** draft/returned claim count and next trip summary without unnecessary itinerary detail; **Continue claim** or **Open travel**.
- **Inline:** selected claim status or editable draft with date, category, amount/currency and missing fields. Receipt extraction is a suggestion requiring review.
- **Expanded:** expense list/detail with policy checks, receipt attachments, review/confirm and source receipt; travel booking stays a supported handoff initially.
- **Native:** outstanding claim status and safe detail entry. **Preferences:** list filters; source currencies remain explicit.
- **Source / owner:** expense/travel system; finance/travel owner. Card/payment credentials do not enter the component or prompt.
- **Intent / acceptance:** `ShowExpensesAndTravel` - "Help me finish my Berlin expense claim." Validate exchange policy and duplicate receipts; failed upload or submission must not appear successful.

## Workplace and frontline services

### C21 - Cafeteria and campus food

**Job and audience:** "Find something suitable to eat at my site today." Onsite employees and visitors where allowed; daily. **Basis:** R5.

- **Card:** explicit campus, date, open hours, two menu items and prices/currency. Universal spectrum top bar; dietary labels include text/icons.
- **Inline:** menu for the requested site/day, with dietary filters and source-provided allergen information. Say when information is unavailable.
- **Expanded:** venue/menu browsing, opening hours, prices, allergen detail and any approved ordering destination. Ordering is not required for the initial design.
- **Native:** today's menu summary and Quick View. **Preferences:** campus and voluntarily chosen dietary filters; avoid inferring health/religion.
- **Source / owner:** catering provider or owned menu list; workplace/catering owner. Menus must have publish date and validity; no invented current stock.
- **Intent / acceptance:** `ShowCampusMenu` - "What's vegetarian in Redmond today?" The site/day is correct and expired menus are labeled; no unsupported guarantee that a meal is allergen-free.

### C22 - Rooms, desks, and workplace booking

**Job and audience:** "Find an available space with the facilities I need." Hybrid/onsite workers; frequent. **Basis:** R1 and workplace-service synthesis.

- **Card:** next reservation and a compact space search entry with building/date. **Find a space** opens the available inventory.
- **Inline:** matching rooms/desks for explicit time, capacity and accessibility/equipment needs. Display availability as of a time, not as a permanent guarantee.
- **Expanded:** list-first space search with optional accessible map, details and review/confirm reservation. Release/cancel stays source-governed.
- **Native:** booking entry or next reservation. **Preferences:** preferred office/floor; automatic location tracking is not assumed.
- **Source / owner:** approved workspace provider and supported room calendar/Places interfaces; workplace owner. Desk and room booking APIs are not assumed interchangeable.
- **Intent / acceptance:** `FindWorkplaceSpace` - "Find a room for four at 14:00." Recheck availability on confirmation; a simultaneous booking conflict keeps alternatives available without claiming success.

### C23 - IT support tickets and service status

**Job and audience:** "Fix my problem or know what will happen next." All employees; event-driven. **Basis:** R3, R5.

- **Card:** default Personal card with **Open IT support ticket**, active relevant service incident and latest request. Also accessible through global IT help on both tabs. Healthy status applies only to covered services.
- **Inline:** issue-specific guided help from approved knowledge, or ticket status with source reference; ask for minimal diagnostic detail.
- **Expanded:** Personal / IT support with explicit category, impact, summary, safe evidence fields, review/submit and source-issued ticket number/status. Approved troubleshooting is optional, not a blocker to contacting support. Security incidents route to C33's confidential intake, not an unrestricted IT queue. Privileged actions require an approved workflow.
- **Native:** help entry, relevant incident and ticket Quick View. **Preferences:** subscribed services where permitted.
- **Source / owner:** ITSM, service-status feed and approved knowledge; IT support owner. Do not solicit passwords, tokens or unrestricted log dumps.
- **Intent / acceptance:** `GetITHelp` - "My VPN is not working." Known incidents surface before duplicate tickets; submission has a real ticket reference and failed provider calls do not generate one.

### C24 - Facilities, safety, and site services

**Job and audience:** "Report a local issue and find the right assistance." Onsite/frontline employees; event-driven. **Basis:** R3, R5.

- **Card:** local service contacts, my active issue and **Report a workplace issue**. Urgent safety guidance is clearly separate from normal requests.
- **Inline:** issue/site/category prefill and a short form, with an emergency-contact route when appropriate.
- **Expanded:** request types, allowed attachments, site/floor/location, status timeline and source receipt. Avoid forcing a map for employees who cannot use it.
- **Native:** facilities entry and local contacts. **Preferences:** preferred site, not unrestricted access to incident records.
- **Source / owner:** facilities/safety system; workplace/safety owner. Restrict incident details and redact inappropriate image metadata as policy requires.
- **Intent / acceptance:** `GetWorkplaceHelp` - "Report a broken light on floor 3." Required location is confirmed, unsafe emergency guidance is avoided, and a ticket is not a promise of emergency response.

### C25 - Shifts and attendance

**Job and audience:** "Know my schedule and perform permitted attendance actions." Frontline/shift employees; daily. **Basis:** R5.

- **Card:** next shift, local site/time zone, break information and eligible action. No salary or colleague absence reason.
- **Inline:** requested schedule and permitted swap/request action. **Clock in** requires explicit user/device validation rather than a conversational assertion.
- **Expanded:** week schedule, requests, coverage and attendance history. Policy checks for location, device, schedule and labor rules precede a transaction.
- **Native:** high-priority mobile shift/attendance card. **Preferences:** display/time format; no override of assigned shifts.
- **Source / owner:** Teams Shifts or actual workforce provider; workforce operations owner. Verify specific clocking/write APIs, offline rules and licensing.
- **Intent / acceptance:** `ShowMyShifts` - "When is my next shift?" Overnight/DST shifts display accurately; offline clock-in cannot falsely claim a completed source record.

## Projects, business and shared work

### C26 - Project and portfolio health

**Job and audience:** "Understand delivery exceptions and the evidence behind status." Project contributors/leads and authorized executives; weekly. **Basis:** R2, R3.

- **Card:** selected project milestone, health label, owner and top risk; portfolio totals only within access scope.
- **Inline:** intent-focused project health or comparison with definitions, source date and evidence links; no generic portfolio overload for one-project questions.
- **Expanded:** project/portfolio views, milestones, risks, dependencies, budgets and decision links. Use shared charts/tables, not a separate branded mini-application.
- **Native:** relevant project summary and detail link. **Preferences:** followed projects and approved scope.
- **Source / owner:** approved project system/semantic model; PMO owner. Do not sum multiple currencies or inconsistent reporting periods.
- **Intent / acceptance:** `ShowProjectHealth` - "Why is Project Aurora at risk?" Status agrees with source evidence; an unauthorized project's existence or budget is not revealed through aggregates.

### C27 - Sales and revenue performance

**Job and audience:** "See performance against target and the actionable exception." Sellers and permitted business leaders; daily/weekly. **Basis:** user request, R15. Explicitly role-specific.

- **Card:** named metric, actual/target, period, region and currency; small trend/target chart and as-of time. Universal spectrum top bar.
- **Inline:** the requested slice with one explanatory metric and chart, optional supporting rows. Clearly distinguish bookings, recognized revenue, forecast and pipeline.
- **Expanded:** filterable charts and accessible tables for region/product/segment, target comparison and source-record drill-through. CRM updates are excluded from this first read-oriented capability.
- **Native:** authorized KPI summary and detail destination. **Preferences:** permitted default region/fiscal period.
- **Source / owner:** CRM or governed semantic model; sales operations/finance. Respect RLS and the chosen Power BI licensing model if embedding is used.
- **Intent / acceptance:** `ShowSalesPerformance` - "Show EMEA bookings this quarter." Totals reconcile with filtered rows; stale refresh, no target, zero target and mixed-currency cases render explicitly.

### C28 - Company outcomes, goals and scorecards

**Job and audience:** "Understand how the company is doing and how my team contributes." All employees for published company outcomes; authorized users for private team goals. **Basis:** R3 and review-requested corporate chart value.

- **Card:** default Company published-outcomes chart with named metric, period, actual/target, units and owner. Initial design example: customer experience score by quarter. Chart bars/lines have direct labels and a table alternative; underlying private sales or HR data is never automatically made public.
- **Inline:** goal-specific progress and evidence for the selected team/period; no invented completion percentage.
- **Expanded:** Company / Outcomes with publisher-approved company trends and separately authorized team/goal detail/check-ins. Personal can pin an authorized personal-goal view of the same component. A manual check-in is explicitly labeled; mixed units are not averaged.
- **Native:** next check-in or authorized goal summary. **Preferences:** followed goals and scope.
- **Source / owner:** approved goals system, SharePoint list or metric platform; strategy/business owner. Do not assume a particular legacy Viva product is available.
- **Intent / acceptance:** `ShowGoalsAndScorecards` - "How are our customer experience goals tracking?" Mixed units are not averaged and a check-in cannot change an underlying finance measure.

### C29 - Recent files and knowledge collections

**Job and audience:** "Resume the document I was working on or find the team's approved material." All knowledge workers and supported frontline document users; daily. **Basis:** R3, R4.

- **Card:** three recent or pinned files with title, type, location and modified time; **Open files**. Distinguish personal recency from publisher-curated collections.
- **Inline:** relevant authorized document matches or a requested collection, with source metadata and open/preview action.
- **Expanded:** recent/pinned/curated views and scoped filtering; use native Office/SharePoint/OneDrive opening and preview where supported rather than rebuilding editors.
- **Native:** curated knowledge collection or safe recent-file entry. **Preferences:** pinning and approved source scopes.
- **Source / owner:** Graph/SharePoint/OneDrive and curated collection metadata; collaboration/knowledge owners. Permissions must be rechecked even for previously seen items.
- **Intent / acceptance:** `FindMyWorkFiles` - "Find the launch brief I used yesterday." Revoked access and moved/deleted files are handled without exposing content; pinning never copies or shares a document.

### C30 - Team availability and manager hub

**Job and audience:** "Coordinate coverage and handle my legitimate team responsibilities." People managers and employees with limited peer-availability access; frequent. **Basis:** R5, R11, R14.

- **Card:** coverage for a selected day, outstanding manager action and team milestone. Availability labels do not disclose absence reasons.
- **Inline:** scoped team availability or manager action list; employee and manager views have different permissions and fields.
- **Expanded:** coverage calendar, lifecycle/learning exceptions and links into C05/C12/C13/C16, reusing their logic instead of duplicating HR workflows.
- **Native:** safe coverage/manager action entry. **Preferences:** allowed team/date filters; never arbitrary employee-scope overrides.
- **Source / owner:** HR/Graph reporting relationships and authorized workflow providers; people operations owner. Reporting line alone may not grant every sensitive permission.
- **Intent / acceptance:** `ShowTeamAvailability` - "Who is available on Friday?" Dotted-line, acting-manager and privacy rules are verified; no health/leave reason or individual productivity surveillance appears.

## Company-wide additions

### C31 - Company stock ticker

**Job and audience:** "See the company's market price with the right context." Employees of an organization with an applicable publicly listed instrument. **Owning tab:** Company; default only where relevant and licensed. **Basis:** explicit review request, not a universal intranet requirement.

- **Card:** issuer and symbol/exchange, quote currency, latest available price, absolute/percentage change versus previous close, timestamp, market status and delay label. A restrained line chart replaces an animated ticker marquee. Do not confuse this with C19's private grants.
- **Inline:** quote for a validated issuer/instrument, timestamp and selected period. No buy/sell recommendation or automatically personalized investment advice.
- **Expanded:** Company / Market with selectable historical period, labeled historical trend and table, source attribution and corporate investor-relations link. Quotes may be delayed; a ticking clock does not imply real-time market data.
- **Native:** compact source-labeled quote and detail destination. **Preferences:** approved display period; no fictional currency conversion.
- **Source / owner:** licensed quote/history provider via approved integration; investor relations/finance. Verify display rights, market calendar, symbol mapping and corporate actions. Private/unlisted organizations omit the module or use a clearly titled published business update; never manufacture a public listing.
- **Intent / acceptance:** `ShowCompanyStock` - "How is our stock doing today?" Price/change reconcile with the provider, delayed/stale/closed states are explicit, and the approved symbol is not replaced by prompt-injected endpoints. ZAVA in the boards is a fictional demonstration symbol, not an asserted exchange listing.

### C32 - Corporate glossary

**Job and audience:** "Understand our acronyms and specialized language." All employees, especially new starters and cross-functional teams. **Owning tab:** Company; default glossary/term card plus search integration. **Basis:** R3 explicitly identifies glossary; review request.

- **Card:** searchable term/acronym, concise approved definition, domain and owner; optional editorial term of the day. Avoid guessing acronyms from public web meanings.
- **Inline:** exact term match or disambiguation across domains, with approved definition/source/effective date. If there is no entry, say so and offer a suggestion flow.
- **Expanded:** Company / Glossary with A-Z/search, synonyms, related terms, language variants and governed Suggest a change. C08 search links to the same definition record rather than maintaining a second glossary.
- **Native:** term lookup Quick View or destination. **Preferences:** language/domain; a user preference does not edit official terminology.
- **Source / owner:** curated SharePoint list or governed taxonomy/content service; corporate knowledge owner with domain stewards. Version, approve and retire entries.
- **Intent / acceptance:** `FindCompanyTerm` - "What does CXR mean at Zava?" An ambiguous acronym offers its domain-specific meanings, authorized-only entries remain trimmed and a suggested definition is not published without approval.

### C33 - Report now - security

**Job and audience:** "Report a suspicious message, lost device or other security concern quickly and privately." All employees; occasional but always findable. **Owning tab:** Company / Security, with a persistent Report now utility in both tabs. **Basis:** explicit review request.

- **Card:** calm **Report now** entry, category examples and confidentiality statement. Never publish recent incident contents or other employees' reports as a company feed.
- **Inline:** safe category selection and approved reporting instructions; prompt text can prefill a minimal draft but cannot automatically upload a message, attachment, device log or credential.
- **Expanded:** Company / Report now with incident type, short description, optional approved metadata, review and explicit submission to security operations. Phishing may hand off to the organization's approved Outlook report action instead of copying the email into chat. Show receipt from the authoritative source; do not claim the threat is remediated.
- **Native:** prominent report entry and approved destination. **Preferences:** none that remove access to the reporting route. Distinguish cyber/security intake from C23 IT service requests and C24 physical facilities/safety assistance.
- **Source / owner:** security operations case/intake provider and documented incident policy. Secrets stay out of prompts/telemetry; controlled evidence attachment, retention and access rules apply. Immediate physical danger routes to verified local emergency guidance; this tool is not an emergency dispatch system.
- **Intent / acceptance:** `ReportSecurityConcern` - "Help me report a suspicious email." Draft/review/confirm, confidentiality, correct routing and source receipt are verified; unavailable intake offers approved alternative contact rather than pretending submission succeeded.

### C34 - Offices and world map

**Job and audience:** "Understand our global footprint, an office's local time and how to visit or connect." All employees for published office information. **Owning tab:** Company; default map card. **Basis:** explicit review request; R3 includes company/office information.

- **Card:** dynamic world-map view with selectable office markers and a fully equivalent office list. Selecting an office reveals name, current local time/date, IANA zone/label, city/country, approved address/contact and services. Use the universal spectrum top bar; never show employee tracking or infer presence from a time zone.
- **Inline:** selected office summary/current clock or a short office list; map optional in tight containers. The office name and date/time remain useful even if map geometry cannot load.
- **Expanded:** Company / Offices with larger map, region/office search, selected details, accessibility/visitor guidance and links to C21 menu, C22 booking and C24 site services. Office hours/holiday status comes from the directory/service, not the clock alone.
- **Native:** preferred-office summary and shared React Quick View/detail. **Preferences:** preferred office, 12/24-hour display and locale. No geolocation permission needed for browsing.
- **Source / owner:** maintained office directory with stable IDs, latitude/longitude, IANA zones, published contact/address/services and review date; global workplace owner. Use licensed/approved geography, lazy-load optional map assets, and disclose provider/network requirements before choosing a third-party map SDK.
- **Intent / acceptance:** `ShowOfficeDetails` - "What time is it in Helsinki and where is our office?" Mouse/touch/keyboard list selection yields the same office; validate Los Angeles, Helsinki and Singapore across UTC midnight and DST changes. Unsupported/missing time zones are explicit. Refresh clocks without repeated screen-reader announcements; stop background updates when hidden. Board map is schematic and office metadata is fictional, but its local-time display uses the actual current device instant.

## Per-capability handoff template

When a capability is approved for coding, its work item must include the following completed fields, not just the feature name.

| Field | Required handoff detail |
| --- | --- |
| Scope | Capability ID, owning Company/Personal tab, exact route, default/anchor policy and view variants |
| Stage map | Applicable overview/collection/detail/compose/review/outcome stages, transition guards, Back/focus targets, draft retention and reduced-motion rendering |
| Business owner | Person/team approving terminology, policy and source meaning |
| Evidence | Relevant blueprint, visual board and source definitions |
| Service contract | Fields, identity mapping, permissions, endpoint/provider maturity, refresh and failure model |
| Operations | Read-only, source handoff, or exact approved write state machine |
| Invocation | Proposed tool name, routing boundaries, normalized dates/scope, invalid-input behavior |
| Fixtures | Success, no data, partial, forbidden, stale, timeout, long labels, narrow layout and locale variants |
| Continuation | What survives expansion, remount and host change; what must never enter a URL |
| Personalization | Allowed fields, defaults, policy locks and migration behavior |
| Verification | The acceptance condition above plus common host/accessibility/action tests |
| Build gate | Exact pinned baseline, current G0-G8 slice, allowed files/dependencies and explicit completed versus blocked host/provider evidence |

**Scope check:** 34 capability modules, retaining C01-C30 and adding C31-C34. Shared shell, two tabs, design primitives, settings, adapters and catalogs remain supporting infrastructure. No module is complete merely because a happy-path card looks finished.
