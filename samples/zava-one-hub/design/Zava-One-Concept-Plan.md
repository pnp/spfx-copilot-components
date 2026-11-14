# Zava One

> **Historical design record; RC0 supersedes the earlier toolchain selection.** September Beta 5 decisions and verified source dates below are retained as history. The approved current baseline is SPFx 1.24.0-rc.0 / React 18.3.1. Follow the [current README](../README.md), [synchronized creation guide](../agentic-creation-rules.md), and [RC0 report](../../../RC0-updates.md), not an old instruction to stop on RC adoption.
## Your company, wherever you work.

**Concept and architecture proposal v0.5 | 28 September 2026 | Coding-agent readiness | SPFx 1.24 beta.5 + React 18 preview target**

Zava One is a composable company and employee experience, not a new system of record or an overloaded dashboard. **Company** is the default front door: prominent news articles, leadership updates, company events and shared enterprise signals. **Personal** is the employee's working home: agenda, tasks, required learning, pay and employee services. Employees choose their default tab without losing access to either experience.

**The central promise: one capability, a familiar experience, and the right amount of UI for the moment.** The same React capability powers an individual web part, an intent-focused Copilot component, and a module in a shared full-page workspace. Host-specific adapters handle platform behavior; business logic and visual building blocks remain shared.

### Review package

- [Coding-agent readiness and handoff](Zava-One-Agentic-Handoff.md): start here for the pinned preview target, honest readiness assessment, all-34 stage/data/operation matrix, host contracts, build gates and bounded first-agent prompt.
- [Visual experience boards](Zava-One-Experience-Boards.html): original design studies for the company-first portal, Company/Personal workspaces, Copilot inline, mobile, customization, charts, office map and shared card stages. Review-only news-layout, card-stage, tab, preference and map interactions illustrate the design; business actions do not execute. All example people, office records, prices and transactions are fictional.
- [34 component blueprints](Zava-One-Component-Blueprints.md): purpose, audience, card design, inline design, expanded design, candidate integration, safeguards, example prompt, and acceptance condition for every capability.
- This document: evidence, product concept, cross-host architecture, personalization, governance, sequencing, and decisions for approval.

No SPFx project, React application, tenant deployment, live connector, or production integration has been created. The HTML boards are presentation artifacts with limited local review interactions, not a production application prototype. Office clocks derive current time from the review device; their office details are synthetic. Product research was checked on 24 September and platform guidance rechecked on 25 September 2026. This pass prepares a handoff; it does not begin coding or authorize deployment.

### What changed in v0.4

The user selected **SPFx 1.24.0-beta.5 with React 18 and React-based experiences**. Use that preview baseline for the next authorized build, not a moving `@next` tag, a React 17 sample or a silently substituted GA release. Exact React/runtime/types/tool patches still require the handoff's G0 verification; registry metadata could not be retrieved during this review. Beta.5 and React 18.x support are documented, but no successful scaffold/runtime result is claimed.

The concept is ready for a **bounded fixture-first bootstrap/reference slice**, not an unattended implementation of all 34 live integrations. The new handoff defines source/result/mutation/preference boundaries, initial stage and data mappings for every capability, neutral workspace entry, prototype-to-React gaps, test fixtures and stop gates. There is no feature-count increase.

One host-composition correction is explicit: to put Events between lead and supporting news on a narrow independently composed SharePoint page, use C06 lead and supporting presentation instances around C10 in the publisher recipe. A single news web part cannot interleave a sibling web part within its own content.

### Retained from v0.3

C06 now offers six presentation choices over the same governed news feed: **Editorial, Hero tiles, Layers, Carousel, Filmstrip and Compact list**. Editorial remains the default; layouts do not replace or hide Company events. SharePoint Hero's Tiles, Layers and Carousel are first-party inspiration, not a claim that its implementation or every option can be reused in other hosts. Filmstrip is a proposed Zava layout. [R18]

The shared **Card Stage** pattern makes a card a small, reversible workspace: overview, collection, selected detail and, when needed, compose, review, explicit confirmation and source outcome. A restrained flip signals a change of stage, inspired by the supplied React Bits example; no dependency on that component is selected. Required learning now demonstrates three assignments while showing one next-required course by default. Praise demonstrates compose/review/confirmation in the same card. All 34 capabilities inherit the stage contract for the next detailed UX pass; only applicable stages are used. [R19]

### Retained from v0.2

Corporate communications is now a first-class stakeholder and the default landing is Company, not My day. Company news and events are protected default anchors rather than optional small cards. The full-page shell has two primary tabs with a saved default-tab preference. Existing learning, voice, recognition, IT and pay capabilities now explicitly include mandatory training/video, daily polls, send praise, open ticket and payslip scenarios.

The original 30 IDs are retained. Four separately composable capabilities are added: **C31 Stock ticker**, **C32 Corporate glossary**, **C33 Report now - security**, and **C34 Offices and world map**. The catalog is therefore deliberately expanded to 34 instead of burying these distinct jobs inside unrelated cards or dropping existing features. This is a scope proposal for review, not an assertion that research ranks 34 universal features.

## 1. The product decision

### Name and brand pattern

**Zava One** is the proposed umbrella name. Use that name consistently for the SharePoint home site, custom Teams personal app, and Copilot agent. Capability names remain literal: **Zava One - Time off**, **Zava One - Company news**, **Zava One - Sales performance**.

The name is a design proposal, not a trademark-availability conclusion. The application is fictional Zava branding, not Microsoft product branding.

The visual direction combines:

- **My Day:** a human greeting, a next-action focus, agenda/task/news composition, contextual expansion, and a visible personalization drawer.
- **PnP Copilot UX components:** one thin, consistent four-color identity bar across component cards, paired with evidence-led layouts and explicit review/confirmation before consequential actions.
- **Fluent:** Segoe UI, accessible controls, neutral surfaces, strong focus treatment, host-aware light/dark themes, and familiar Microsoft 365 behavior.

Do not copy the samples wholesale. My Day's settings are deliberately session-only, and its city/country fields do not drive a real weather service. Zava Project Tracker uses deterministic sample data. These are useful interaction references, not production persistence or integration specifications. [R1, R2]

### Product principles

1. **Tasks before departments.** Navigation uses employee language, not the organization chart. Research supports task-specific labels and managed content. [R3]
2. **Company-wide value before dashboard density.** Offer 34 capabilities through two coherent tabs. Company opens with substantial news and events; Personal starts with approximately 6-8 useful modules. Avoid 34 equal-sized tiles. These layout choices are proposed constraints, not research-derived optima.
3. **Conversation is an entry point, not a requirement.** Every important action has a browsable, keyboard-accessible route.
4. **Inline is useful on its own.** Answer the specific question or show a workable short form before offering expansion. Do not make every prompt return the entire portal.
5. **Expand the task, preserve the context.** Selected records, filters, and unsent drafts carry into the shared full-screen workspace.
6. **Trust is visible.** Source, scope, effective date, freshness, and action state are part of the UI, not hidden implementation details.
7. **Native where native wins.** Reuse SharePoint publishing, Teams meeting/chat destinations, and authoritative business workflows rather than rebuilding entire products.
8. **Personalization is not authorization.** Hiding a tile, targeting an audience, or changing location never grants access.

### Intended employees

| Audience | Typical entry | First useful outcome |
| --- | --- | --- |
| Information worker | Teams or SharePoint | Catch the company story and next event; switch to personal work |
| Frontline/site worker | SharePoint app in Teams on mobile | See company/local news and events, then shift, site alert and help |
| New starter | Onboarding deep link or home | Know the next onboarding step and the person who can help |
| People manager | Teams or Copilot | Review pending decisions and team coverage without exposing private HR details |
| Seller/project lead | Copilot or role-specific workspace | Understand a sales/project exception and inspect its evidence |
| Corporate communications/publisher | SharePoint | Publish once, preserve a prominent global story and event program, and measure aggregate reach |

Assume a multinational Zava with office, remote, frontline, and hybrid employees. Equity and sales experiences apply only to eligible populations. Regional policy, employment arrangements, licensing, accessibility, and integration availability will vary.

## 2. Evidence-led feature selection

### What the research actually supports

Microsoft's current planning guidance explicitly lists pay and benefits, vacation hours, help tickets, lunch menus, news, people, training, holidays, and shift management as employee-experience scenarios. It also advises against making every task a dashboard card. [R5]

NN/g's research supports task-based information architecture, clear labels for benefits/pay/time, people, apps/tools, learning, projects, and company information, plus centralized or hybrid content governance. Its search research recommends a visible unified search entry for content, people, and tools. [R3, R4]

These sources establish **recurring scenario families**, not a statistically ranked worldwide list. The 34 below combine the original synthesis with explicit review requests. Stock vesting, sales analytics, portfolio metrics, and manager workflows are role-specific. A corporate stock ticker depends on a relevant public listing and licensed market data; it is not the same as an employee's private equity balance. Glossary has direct category support in R3; a dynamic office map and dedicated security-reporting entry are requested design extensions. The sample repository supplies interaction inspiration, not adoption-frequency evidence.

### Complete capability catalog

**Core** = broadly relevant employee need; **targeted** = role, location, lifecycle, or eligibility dependent. Wave numbers describe a proposed later build order, not committed dates.

| ID | Capability | Employee outcome | Reach | Wave | Evidence |
| --- | --- | --- | --- | --- | --- |
| C01 | My day briefing | Understand today's priorities and next action | Core | 1B | R1, R5 |
| C02 | Calendar and meeting preparation | See the agenda, prepare, and join | Core | 1B | R1 |
| C03 | Important email | Triage a small, explainable set of important messages | Core | 1B | R1 |
| C04 | Tasks and personal follow-ups | Complete and organize assigned work | Core | 1B | R1, R5 |
| C05 | Approvals and decisions | Review pending decisions with evidence | Targeted | 1B | R5, R12 |
| C06 | Company and local news | Follow prominent global stories, leadership updates and local articles | Core | 1A | R3, R5 |
| C07 | Essential announcements and alerts | Notice urgent or required information | Core | 1A | R5, R6 |
| C08 | Search and verified knowledge answers | Find people, tools, documents, and policy evidence | Core | 1A | R3, R4 |
| C09 | Apps and employee services directory | Find and launch the right tool | Core | 1A | R3, R5 |
| C10 | Company events and town halls | Discover, register, attend and watch recordings | Core | 1A | R3; design synthesis |
| C11 | People and expertise | Find a colleague or subject-matter expert | Core | 1B | R3, R4, R13 |
| C12 | Onboarding and employee transitions | Complete an owned, sequenced checklist | Targeted | 2 | R5, R14 |
| C13 | Mandatory training, videos and learning | Complete assigned courses/videos and find development | Core | 1B | R3, R5; review request |
| C14 | Praise and employee communities | Send praise to a colleague and discover community stories | Core | 1A | R3; review request |
| C15 | Daily signals, polls and surveys | Take a quick pulse and see permitted aggregate results | Core | 1A | Review request; design synthesis |
| C16 | Time off and holidays | Check entitlement and request leave | Core | 1B | R3, R5, R11 |
| C17 | Payslips and tax documents | Access authoritative personal pay records securely | Targeted | 1B | R3, R5, R14 |
| C18 | Benefits and life events | Understand eligibility and complete enrollment | Targeted | 2 | R3, R5, R14 |
| C19 | Equity and stock vesting | Understand grant schedules and next vesting event | Targeted | 3 | User request; R14 adjacent inspiration |
| C20 | Expenses and business travel | Prepare a claim and find travel actions | Targeted | 3 | R3 |
| C21 | Cafeteria and campus food | Find today's menu for the right site | Targeted | 2 | R5 |
| C22 | Rooms, desks, and workplace booking | Find and reserve an appropriate space | Targeted | 3 | R1; design synthesis |
| C23 | IT support tickets and service status | Open an IT ticket, troubleshoot or track a request | Core | 1B | R3, R5 |
| C24 | Facilities, safety, and site services | Report a workplace issue and get local help | Targeted | 2 | R3, R5 |
| C25 | Shifts and attendance | See a shift and perform allowed attendance actions | Targeted | 3 | R5 |
| C26 | Project and portfolio health | Understand delivery status and exceptions | Targeted | 3 | R2, R3 |
| C27 | Sales and revenue performance | Understand performance against an explicit target | Targeted | 3 | User request; R15 |
| C28 | Company outcomes, goals and scorecards | See approved company chart data; drill into authorized team goals | Core/targeted | 1A | R3; review request |
| C29 | Recent files and knowledge collections | Resume work and find curated working material | Core | 2 | R3, R4 |
| C30 | Team availability and manager hub | Coordinate coverage and team lifecycle actions | Targeted | 3 | R5, R11, R14 |
| C31 | Company stock ticker | View a labeled market quote and historical trend | Targeted | 1A | Review request; listing/license dependent |
| C32 | Corporate glossary | Understand acronyms and company terminology | Core | 1A | R3; review request |
| C33 | Report now - security | Safely report a security concern through an approved channel | Core | 1A | Review request |
| C34 | Offices and world map | Explore offices, local time, details and site services | Core | 1A | Review request; R3 adjacent location pattern |

The shell, two-tab navigation, settings drawer and catalog remain shared infrastructure, not extra business features. Weather is optional contextual content. New capabilities preserve existing IDs so approved work and preferences can migrate cleanly.

### Information architecture

The full-page shell has exactly two primary tabs: **Company** and **Personal**. The six previous destinations become secondary categories/detail routes, not six competing top-level tabs. My day is the Personal landing. News, events, workplace and company outcomes are Company discovery categories. An **All experiences** catalog filters by tab/category and keeps all 34 capabilities reachable.

**Company is the first-use default.** A user can save Company or Personal as the default for a neutral app launch. A specific Copilot intent, notification or deep link overrides that preference for that invocation, opens the owning tab/detail route and never overwrites the saved default. Generic "Open Zava One" respects the saved default; explicit "Show company news" opens Company and "Plan my day" opens Personal.

Search is shared and visible, not a separate private search engine. In SharePoint, prioritize native global search; in Teams, label the in-app field **Search Zava people, tools, and knowledge**. **Report now** and **IT help** remain global utility actions in both tabs; they link to one underlying capability each.

### Component-to-tab and default-placement contract

Each capability has one owning tab. Secondary placement reuses a scoped view of the same component; it does not duplicate data, business logic or tool identity. Visible category labels remain stable across tabs; every card uses the same spectrum bar.

| ID | Owning tab | Default placement | Secondary placement or rule |
| --- | --- | --- | --- |
| C01 | Personal | My day briefing | No personal hero ahead of Company news |
| C02 | Personal | Agenda card | Company event RSVP is still C10 |
| C03 | Personal | Important email | Optional; never in public company feed |
| C04 | Personal | Tasks card | Required training links to C13 |
| C05 | Personal | Approver recipe | Global pending indicator if authorized |
| C06 | Company | Protected lead news region | Compact Company highlights on Personal |
| C07 | Company | Applicable notice above tabs | Relevant mandates visible in both tabs |
| C08 | Company | Shared search utility | Same entry accessible from Personal |
| C09 | Company | All experiences/services utility | Personal favorites shortcut |
| C10 | Company | Protected upcoming-events region | My registered events summary in Personal |
| C11 | Company | People discovery catalog | New-starter/team recipe |
| C12 | Personal | New-starter recipe | Company onboarding campaign links here |
| C13 | Personal | Required training/video card | Applicable required-learning reminder in both tabs |
| C14 | Company | Praise/community card | Send praise shortcut available in Personal |
| C15 | Company | Daily signal/poll card | No mandatory voting; privacy label required |
| C16 | Personal | Time-off card | Not an organization-wide balance view |
| C17 | Personal | Payslip card when eligible | Private, amounts masked |
| C18 | Personal | Benefits catalog/enrollment recipe | Company enrollment campaign links here |
| C19 | Personal | Equity-eligible recipe | Separate from public C31 stock ticker |
| C20 | Personal | Travel/expense recipe | No itinerary in Company feed |
| C21 | Company | Local workplace catalog | Onsite Personal recipe may pin menu |
| C22 | Personal | Hybrid-worker recipe | Office C34 provides a booking shortcut |
| C23 | Personal | IT support card + global IT help | One ticket capability, not duplicated in C33 |
| C24 | Company | Site-services catalog | Local safety/help links in both tabs |
| C25 | Personal | Frontline recipe | Company campaigns never expose attendance |
| C26 | Company | Authorized project catalog | Personal followed projects may pin a view |
| C27 | Company | Authorized business/sales catalog | No confidential sales figures in default public tile |
| C28 | Company | Published company-outcomes chart | Private team/personal goals only in authorized detail |
| C29 | Personal | Recent-files catalog | Only explicitly published collections may appear in Company |
| C30 | Personal | Manager recipe | Scope-checked; no organization-wide private HR overview |
| C31 | Company | Stock ticker when applicable | Hide or explicitly replace if no valid listing/feed |
| C32 | Company | Glossary card | Search and onboarding cross-links |
| C33 | Company | Always-findable Report now utility | Same approved intake in both tabs |
| C34 | Company | Offices/world-map card | Personal preferred-office and booking shortcut |

### Corporate communications design contract

At desktop workspace widths of 1024px and above, the first content row allocates approximately **two thirds to news and one third to events**. News includes a real lead article with supporting headlines, not a decorative slogan or a small tertiary tile. Events shows the next two relevant events and a calendar/recording route. Both headings and useful content must be present in the initial default Company view at the reference 1440x1000 viewport. In the default Editorial composition, narrow order is applicable alert, company heading, lead news, upcoming events, supporting news, then other modules. The custom shell owns that composition; independent SharePoint web parts require the publisher recipe below. Do not assume the host can interleave sibling web parts within one component.

Communications owns the featured global story, leadership updates, campaign slot, publish/expire dates, regional editions and event program. Personalization can add relevant local content but must not filter out the approved global lead. Users can personalize supporting Company modules; **news/events remain protected anchors on the Company tab**. Choosing Personal as a default remains allowed: keep a compact Company highlights strip with the latest headline and next event, plus mandatory notices/learning reminders when relevant. Ordinary articles are not forced acknowledgments.

The default Company recipe has eight substantive modules: C06 News, C10 Events, C15 Daily signal, C34 Offices, C31 Stock ticker if applicable, C14 Praise, C28 Published company outcomes, and C32 Glossary. Search/apps/reporting utilities and conditional notices are not eight more dashboard cards. These supporting modules may sit below the fold and load lazily. News movement is reader-controlled by default; no market ticker marquee or decorative hero animation competes with reading. An optional, explicitly started slideshow is subject to the news-motion safeguards below.

### News layout and editorial controls

**One C06 capability, multiple compositions; not six feeds or six new features.** Preserve the same story IDs, permissions, targeting, order, source dates, promotion expiry and publisher metadata when switching layout. First-party Hero supports Tiles, Layers and Carousel; it is a curated highlight web part, not a guarantee of automatic news aggregation or a reusable cross-host React implementation. Zava's news source adapter remains responsible for the news feed. [R18]

| Zava layout | Proposed use and behavior |
| --- | --- |
| Editorial (default) | Substantial lead article with image/summary and supporting headlines; approximately 2:1 news/events desktop row |
| Hero tiles | One to five promoted stories, with a larger lead tile and smaller supporting tiles; maintain readable text and image focal points |
| Layers | Stacked image/text story bands for campaigns or deeper editorial reading; limit the landing-page set and provide All news |
| Carousel | One featured story at a time; visible Previous/Next, position and direct story selection; no automatic movement on entry |
| Filmstrip | Horizontal strip with multiple story cards and a visible next-card preview; reader-controlled Previous/Next, native touch/trackpad scrolling and snap alignment |
| Compact list | Thumbnail/headline/publisher/date rows for narrow or information-dense contexts; no forced imagery or animation |

The **publisher** chooses source, promoted story order, layout, image crop/focal point, headline/summary density and visible story count in SharePoint web-part properties. Editorial additionally supports `editorialPart: complete | lead | supporting`; lead/supporting instances share the approved collection and exclude duplicate lead content. Other layouts use complete mode. Corporate communications owns the equivalent Company recipe in Teams/Copilot. Reader layout overrides, if later approved, stay inside those policy limits and never replace permissions or protected news/events anchors. The board selectors are **review controls**, not proposed end-user publishing permissions.

Use container-aware variants: tile/layer layouts simplify to a readable stack or compact list; carousel/filmstrip keep explicit controls and a list alternative at narrow widths. At 390px the default Editorial layout still orders lead story, events, then supporting headlines. Inline defaults to an intent-sized story/list rather than importing a full hero. Native SharePoint News/Hero may be used where appropriate; native Dashboard cards do not inherit custom carousel or flip CSS.

**Movement contract:** manual 200-300ms sliding is sufficient for the filmstrip. Automatic rotation is off by default and deferred from the first build. If an approved slideshow mode is added later, expose Play/Pause, a readable configurable interval (initial proposal: at least eight seconds), pause on pointer hover, stop on keyboard focus/manual navigation, document hiding or leaving the viewport, and require explicit Play to restart. Never start playback under reduced motion. Do not rotate critical notices, auto-play audio or change focused content. Announce manual position changes only, not timer ticks. With zero stories show an honest empty/error state; with one story remove unnecessary paging controls. The review boards demonstrate manual movement, not autoplay.

Corporate approval checks cover editorial prominence, translation, global/local balance, accessible video, event freshness, content ownership and aggregate reach. Measure news opens and event engagement separately from personal task completion; do not imply that opening an article means understanding it.

## 3. The experience across products

### Host matrix and non-negotiable distinctions

| Surface | Composition | What is shared | What belongs to the host |
| --- | --- | --- | --- |
| SharePoint landing portal | Communication/home site containing separate Zava web parts | Card contents, tokens, business rules, data services, component details | Page sections, navigation, publishing, editing, audience configuration, available widths |
| Custom Teams personal app | One full-page Zava shell containing selected capability modules | Full workspace shell and recipes also used in Copilot full screen | Teams rail, app lifecycle, theme/context, meeting/chat navigation |
| SharePoint app in Teams / former Viva Connections | Home-site experience plus native Dashboard, News, Resources, Announcements | Home-site web parts where supported; capability logic; React quick-view/detail UI | Native dashboard card layout, native personalization, Teams mobile navigation |
| Copilot inline | A focused capability selected by the agent from user intent | A compact React view of that capability and its action flow | Conversation, tool invocation, available display modes, host controls |
| Copilot full screen | Shared Company/Personal shell; saved default for neutral entry, owning tab for specific intent | Same shell, component layouts, route model, settings and recipes as custom Teams app | Actual display mode, expansion approval, collapse affordance, available container area |

**Consistency does not mean replacing Microsoft chrome.** SharePoint and Teams retain their own outer frames. The visible Zava content should feel identical at equivalent available widths, but native SharePoint page composition cannot guarantee pixel-identical placement to a custom shell.

Offer a curated SharePoint landing recipe using the same cards and hierarchy. If exact whole-page fidelity is later required, evaluate a separate single-part app page or workspace web part. That is an explicit alternative, not a silent replacement of the user's requested independently configurable web parts.

### A. SharePoint: the company front door

The landing page is explicitly company-first: compact identity, publisher-owned announcement region, a substantial editorial news region and an adjacent upcoming-events web part. The Personal destination and practical employee services are easy to find but do not displace news/events from the first row. These remain independent web parts, not one monolithic "Company page" component.

Proposed page recipe:

| Region | Content | Owner |
| --- | --- | --- |
| Native header/navigation | Brand, company navigation, native search | Site owner |
| Essential message | Time-limited announcement when relevant | Communications |
| First editorial row | C06 Editorial/lead in the first 2:1 column, C10 Events in the second | Corporate/local communications; separate web parts |
| Supporting news | C06 Editorial/supporting in the following section, same collection/order | Another C06 presentation instance, not another capability |
| Company signals | Daily poll, approved outcomes chart, stock ticker when applicable | Approved business publishers |
| Connected organization | Office world map, praise, glossary | Workplace, engagement and knowledge owners |
| Personal entry | Compact required-learning reminder and Personal/workspace link | Source-scoped user data; publisher-owned placement |
| Persistent help | Report now, IT help, search and services | Approved service owners |

Each capability is selectable as **Zava One - [capability]** in the web-part toolbox. The property pane controls source configuration, allowed filters, title, supported layout density, audience defaults, and visible actions. It must not accept arbitrary credential-bearing endpoint URLs.

Verify the real page's section/column order at mobile widths. `Editorial/complete` remains useful for a standalone C06 web part, but it cannot guarantee Events between its lead and supporting stories. The HTML board illustrates the desired composition, not SharePoint's actual DOM. Exact whole-page parity remains an optional workspace-web-part/app-page decision.

Readers cannot remove web parts from a published page through Zava settings. They can use supported personal filters, favorites, or detail views. Publishers decide what is on the page. Native Dashboard personalization, when used, is a separate host-owned feature. [R6]

### B. Teams personal app: the employee's working home

Pin **Zava One** as the custom personal app for users who prefer an application-style workspace. Company is the initial default; users can save Company or Personal as the default launch tab. Both tab recipes are retained separately.

The full-page experience uses the shared header, two tabs and responsive recipe. Company leads with news/events; Personal has the greeting, My day focus and individual services. A single **Customize** action controls the default tab and allowed modules in each tab. Do not nest another Teams-like sidebar inside Teams or repeat a large SharePoint masthead.

Teams joins, chats, calls, documents, and business systems open through supported host-aware links. Zava does not recreate chat or email editors. A route opened from a notification goes directly to the relevant entity, not back to a generic home.

### C. Viva / new SharePoint experience: a distribution path, not a fourth fork

Current documentation says the SharePoint home site powers the former Viva Connections experience, now branded as the **SharePoint app in Teams**. Existing custom names and branding continue to work. New SharePoint **Discover / Publish / Build** destinations are Microsoft-owned experiences; this proposal does not assume an extension point that replaces or inserts arbitrary cards into those destinations. [R6, R7]

Zava appears through its home site, supported pages, native dashboard entry points, news, and navigation. Discover can lead employees to the authoritative Zava site/content; it is not a second Zava homepage to rebuild.

For native Dashboard cards, design a compact, host-constrained card per appropriate capability. **An ACE Card View is not an unrestricted React web part.** Where useful, the Quick View can render shared HTML/React UI using the documented SPFx capability, or open the Zava detail destination. The colored card-top accent is mandatory in Zava-owned React surfaces, but must degrade to supported native identity/icon styling in constrained native card views. [R10]

On mobile, show a relevant company lead story and upcoming event before supporting dashboard tools; keep critical site alerts first. Then prioritize shift, required learning/video, leave, lunch and help for frontline audiences. Native News/Resources reference the same authored content and service catalog. Company/Personal tabs belong to Zava-owned full-page UI; do not claim to replace host-native Dashboard/News/Resources navigation.

The custom Zava Teams app and the branded SharePoint app in Teams overlap. **Recommend one pinned primary entry per audience**, with an optional link to the other. Both can exist in the architecture; do not force every employee to see two identically named pinned applications.

### D. Copilot inline: intent-sized work

Examples:

| Employee asks | Component returned | First render |
| --- | --- | --- |
| "What should I focus on today?" | C01 My day | Next meeting, two priorities, provenance, open workspace |
| "How much leave do I have?" | C16 Time off | Balance, policy period, upcoming leave, request action |
| "Draft a leave request for October 19-23" | C16 Time off | Editable dates, working-day calculation, review action; no submission |
| "What's for lunch in Redmond?" | C21 Cafeteria | Site/day, two menu options, dietary labels and source |
| "How are EMEA sales doing this quarter?" | C27 Sales | Scoped KPI, target, comparison, as-of time and chart |
| "Find someone who knows accessibility" | C11 People | Relevant people with the basis for matching and contact links |
| "What is the company announcing this week?" | C06 News | Featured article, supporting updates, source dates |
| "When is the next company town hall?" | C10 Events | Date/time zone, attendance link, registration state |
| "What time is it in the Singapore office?" | C34 Offices | Selected office, current local time/date, office details |
| "Help me report a suspicious message" | C33 Security reporting | Safe approved reporting flow; no message automatically forwarded |

A normal inline result has a category accent, title, scope/source line, a bounded useful answer, one primary action, and expansion if supported. No persistent workspace navigation, sprawling dashboard, or giant hero in a conversation.

Prompt inputs prefill or filter. They do not approve, submit, send mail, book space, complete training, or change HR/CRM records. Ambiguous dates, identity, currency, and geography are clarified in the UI before a consequential action.

### E. Copilot full screen: the same workspace, at the right place

Three entry paths share one shell:

- Generic **Open Zava One** opens the saved default tab, or Company on first use.
- **My day** opens Personal, regardless of default. **Company news/events** opens Company.
- Any other focused component opens its owning tab/detail route from the mapping table with selected item/filter/draft intact. **Continued from your conversation** explains the context. Selecting the other tab never silently submits or discards a draft.

Full-screen opening is a request, not a guaranteed local toggle. Read host display mode and advertised capabilities; react to the actual host result. The component may request full screen, but collapse is host-owned. Never add a fake in-component "close full screen" control that claims to override the host. If expansion is unavailable, keep the inline action useful and offer a supported deep link. [R8, R16]

## 4. Shared visual system

### Design tokens proposed for approval

| Element | Proposal | Rule |
| --- | --- | --- |
| Brand blue | `#0F6CBD` | Primary actions, selection, My day |
| Teal | `#008272` | Workplace; secondary brand accent |
| Violet | `#6750A4` | People and learning |
| Deep green | `#107C41` | Pay and benefits |
| Ochre | `#8A6500` | Projects and business |
| Spectrum bar | `#075FCE` 0-32%; `#138A3D` 32-55%; `#B32687` 55-78%; `#D84F38` 78-100% | Universal Zava component identity; same order and proportions everywhere |
| Canvas / card / main text | `#F5F6F8` / `#FFFFFF` / `#242424` | Map to Fluent host-aware neutral tokens in implementation |
| Card top bar | 4px spectrum bar | Required on every inline component, web part, and workspace card; never category-coded |
| Shell signature | The same 4px spectrum bar | One consistent identity across SharePoint, Teams, and Copilot surfaces |
| Typography | Segoe UI; 14px body, 16px card title, 28px page title | No viewport-scaled text |
| Shape | 8px card radius, 4px inputs/buttons, subtle border/shadow | No excessive pill-shaped containers |
| Spacing | 4px base; 8/12/16/24/32px steps | 16-20px card padding, 16-24px grid gap |
| Motion | 200-300ms when useful; 240ms card-stage proposal | Restrained flip/slide, instant reduced-motion alternative; no simulated AI typing delays |

All final text/state color combinations require contrast verification; the palette is a proposal, not a blanket accessibility certification. Status colors remain semantic: success, warning, failure, and informational state have text/icons as well as color. The top bar never communicates category or status; visible labels and content do that work.

For coded Zava UI, use a 14px body baseline and secondary text of at least 12px as design policy. The boards' smaller review annotations and synthetic Microsoft chrome are not text-size or host-replacement specifications. Bind Fluent UI to host light/dark/contrast themes, and use scoped, container-aware styles rather than copying global HTML CSS. The handoff lists these prototype-to-implementation boundaries.

### Card anatomy

Every React card uses **universal spectrum bar / title and icon / scope / useful content / action / source and state**. Its content pattern depends on its task:

| Pattern | Best suited to | Example |
| --- | --- | --- |
| Briefing | A small prioritized synthesis | My day |
| Timeline | Time or sequence | Agenda, onboarding, vesting |
| Action list | A bounded queue | Tasks, approvals, IT cases |
| Editorial | Authored communication | News, events |
| Metric and chart | A quantified question | Sales, portfolio, goals |
| Form and receipt | A transaction | Leave, booking, expenses |
| Discovery and results | Finding a thing or person | Directory, apps, files, knowledge |

Do not give every feature the same KPI ring, or use "View all" as a generic destination when "Open calendar" or "Review request" is clearer.

### Card Stage: a shared interaction language

Adopt the supplied [React Bits Flip Card](https://reactbits.dev/micro/flip-card) as **experience inspiration**, not selected source code, package, license approval or a mandatory dependency. The principle is continuity: the same colored card frame turns to the next meaningful stage instead of opening a new modal for every action. It is a multi-stage flow, not a two-sided card with an increasingly crowded reverse face. [R19]

**Read flow:** `Overview -> Collection -> Selected detail -> Collection -> Overview`. Direct overview-to-detail is also allowed; Back returns to the actual origin and restores the selected row, filters and scroll. Example: next required course -> all three assignments -> select a different course -> its details -> the same list -> next-required overview.

**Write flow:** `Overview -> Compose -> Review -> explicit Confirm -> Pending -> Source receipt`. Confirm is a deliberate button action, not an animation event or a mandatory extra confirmation modal. Edit returns from Review to the preserved draft. Errors, conflicts and uncertain results remain visible, preserve the draft, and use the existing safe retry/reconciliation rules. A card flip never sends praise, votes, submits leave, marks learning complete or acknowledges a policy.

| Shared stage rule | Requirement for every applicable capability |
| --- | --- |
| Stable frame | Retain category accent, capability title, scope and source/privacy state; name the active stage in text |
| One active face | Only the current stage is visible, keyboard reachable and exposed to assistive technology; no tabbable hidden back face |
| Deliberate navigation | Named buttons/links, never hover-only, swipe-only or clicking the whole card; Back and Overview remain explicit |
| Direction and motion | Short perspective turn forward, reverse direction on Back; no full-page spin, mirrored reading text or repeated bounce |
| Reduced motion | Same stages and actions with an immediate swap; animation completion is never required for navigation or submission |
| Focus and announcement | Move focus to the new stage heading on forward navigation; Back restores the originating control when available, otherwise its heading; announce stage once |
| State continuity | Preserve selected entity ID, filters, list position and unsent draft outside the animated face; changing selection changes details, not the whole host |
| Layout | Content-driven height and readable forms; reserve space where useful but never clip content to match the front face; large tasks can expand |
| Safe exit | Back/Edit preserve draft. Explicit Cancel/discard must explain any loss; leaving the card/host cannot silently submit or silently erase work |
| External/host actions | LMS, secure payslip, meetings and approved reporting may hand off; host expansion is not a card flip and collapse stays host-owned |

The pattern applies to **all 34 modules** at the next detailed UX stage, not only C13/C14. Read/discovery modules use overview/collection/detail where useful (news, offices, glossary, stock, mail, people and files). Transactional modules add compose/review/confirmation/outcome (praise, polls, approvals, leave, booking, expenses and tickets). Hybrid modules combine them. A single fact or direct source link is not forced through an unnecessary collection or review screen. Refreshes, charts, tab changes and host-owned navigation retain their appropriate behaviors; the common card-stage contract does not require literally flipping every UI update.

**Required-learning reference flow:** show the highest-priority incomplete assignment (overdue first, then nearest due date with a stable tie-break) and an explicit **3 required / View all 3** count. One assignment never implies only one exists. Collection rows expose title, due date, duration and source status; selecting any row opens its own detail with captions/transcript, resume and launch affordances. Back returns to that selected row. Zero, one, many, overdue, no-due-date, completed, inaccessible and temporarily unavailable assignments need distinct fixtures. A partially loaded feed says so instead of asserting a total. Completed assignments stay in Completed, and LMS-confirmed state determines counts.

**Praise reference flow:** overview -> Send praise -> recipient/message/audience compose -> Review -> Confirm and send -> pending/source receipt. Ambiguous recipients require selection, visibility is explicit, and Edit preserves all fields. In the review boards the final action is **Confirm preview** and the outcome says **Nothing sent**; no successful business write or source receipt is simulated.

**Later React 18 design direction:** share a `CardStage` presentation primitive and a typed, per-capability transition definition; do not invent one giant form engine. Stage state belongs to the capability controller, keyed by instance/invocation and stable entity ID, not to CSS, list indexes or a remounted animated child. Enforce allowed transitions and one in-flight write; honor effect cleanup, reduced motion and hidden-host state. Safe continuation carries stage/selection/draft handle into expansion, never sensitive form values in a URL. Native ACE Card Views use supported actions into a Quick View/detail destination, not a promise of unrestricted 3D animation.

### Responsive behavior

Size decisions use the **component's available container width**, not just the browser viewport. A SharePoint one-column web part and a Copilot inline card can be narrow on a large monitor.

- 320-479px: one column, compact list, full-width primary action, text alternative to dense charts.
- 480-767px: one comfortable column or an internal two-item layout if content allows.
- 768-1199px: two workspace columns; selected details may replace the grid.
- 1200px and above: up to three workspace columns; cap reading width around 1440px.
- At 200% zoom, cards reflow rather than clipping. Wide data tables get a dedicated scroll region with clear row/column labels and a compact list alternative where practical.

Avoid masonry layout that makes visual and keyboard reading order disagree. Keep a predictable row-major reading order and focus return when opening/closing details.

## 5. Personalization and configuration

### My Day inspiration, extended deliberately

My Day exposes panel visibility, temperature units, and illustrative location fields and stores settings in the browser session. Zava One should preserve that immediacy but add a governed, durable preference service. **Cross-host persistence is a proposed Zava capability, not something SPFx or the sample provides automatically.** [R1]

| Setting | Teams / Copilot full screen | SharePoint web parts | Native Dashboard |
| --- | --- | --- | --- |
| Show/hide modules | User chooses from permitted catalog | Publisher controls placement | Host-native behavior |
| Reorder and permitted width | User; keyboard move controls as well as drag | Page editor uses SharePoint sections | Host-native behavior |
| Default launch tab | Company initially; user can save Company or Personal | Site landing remains publisher-owned | Host-native behavior; no assumed preference sync |
| Company news/events anchors | Protected on Company; compact highlights remain on Personal | Publisher maintains editorial priority | Native composition/configuration |
| Office/location and locale | User choice where policy permits | Same profile context for relevant cards | Adapter/source context where supported |
| Temperature unit | Optional contextual card setting | Same where displayed | No assumed native preference integration |
| Compact/comfortable density | User within supported bounds | Publisher default; optional reader override | Host-native behavior |
| Theme | Follow host by default | Follow site/section theme | Follow host |
| Show sensitive summaries | Off by default; explicit reveal | Same secure defaults | No sensitive preview by default |
| Required communications | Clearly locked while applicable | Publisher/governance policy | Native capability plus governance |
| Reset to recommended | Restores the current audience recipe | Does not edit a page | Native reset if supported |

**Drawer design:** default launch-tab selector first, then **Customize Company / Customize Personal**, searchable category list, module switches, ordering controls, density and locale/site controls, policy-lock explanations, Save/Cancel and reset. Company news and events have **Company anchor** labels, not misleading "mandatory read" labels. Required training has a separate policy label. Preview before Save; cancellation restores the previous draft. Reset restores Company as default plus both recommended recipes. Current-tab navigation alone does not change the saved default.

### Preference precedence and persistence

Effective access first requires valid identity, permission, eligibility, license, and host capability. Within that allowed set, apply organization mandates, page/host constraints, audience recipe, and then user preferences. A lower-precedence preference cannot override a restriction.

Proposed storage: a tenant-owned preference service keyed by tenant and immutable user object ID, with a schema version, `defaultTab: company | personal`, separate Company/Personal recipes, explicit overrides, locale/site preferences, and concurrency version. Store **layout preference IDs, not mail, salary, health information, or leave drafts**. For migration from v0.1, preserve an explicitly saved My day preference as Personal; do not infer user choice from the old factory default. Retain C01-C30 IDs, introduce C31-C34 through policy defaults, and explain new Company anchors.

Teams and Copilot full screen consume the same saved workspace preferences. Independent SharePoint web parts may consume benign shared preferences such as location, but not inherit card visibility from the personal workspace. Native Dashboard settings remain separate unless a supported integration is verified.

If saving fails, show **Changes not saved** and keep the local draft available. If only a session cache is available, say **This session only**; never claim cross-device sync. Reconcile concurrent changes and migrate retired/new component IDs without silently removing mandatory modules. An inaccessible component must not leak sensitive metadata through a "hidden" tile.

### Starting recipes, not fixed personas

| Recipe | Company tab | Personal tab |
| --- | --- | --- |
| Everyday employee | Global/local news, events, daily poll, offices, stock if applicable, praise, published outcomes, glossary | Briefing, agenda, tasks, important email, mandatory training/video, time off, payslip if eligible, IT support |
| Frontline/site | Global and site news, next event, critical alert, local office/menu context | Shift, required training, tasks, leave, cafeteria, IT/facilities help |
| New starter | Company story, welcome events, glossary, offices, praise | Onboarding, people/buddy, mandatory learning, benefits, apps |
| Manager | Same company anchors; authorized business scorecards | Briefing, approvals, team coverage, agenda, learning, goals |
| Seller/project lead | Same company anchors; authorized sales/project views | Briefing, tasks, meetings, files, approvals, required training |

All Personal recipes retain a compact Company highlights entry for the current lead article and next event. Inapplicable/unavailable personal sources are not replaced by fake balances or unlabeled demo records.

People can adjust layouts within policy. The system explains **Recommended because you work at Redmond** or **Required by your organization**; it does not silently infer sensitive traits or promote workforce surveillance.

## 6. Architecture for later agentic implementation

### Logical architecture

```text
SharePoint page      Custom Teams app      Native Dashboard      Copilot
web-part adapters    workspace adapter     ACE adapter           UX adapters
        \                  |                 |                     /
         Host context: identity, theme, locale, size, capabilities,
                  navigation, lifecycle, display-mode requests
                                  |
          Zava One shell + recipe/personalization + component registry
                                  |
         34 independently addressable React 18 capability modules
         compact/card/detail views + typed state + action workflows
                                  |
               Domain services, policies, mapping and validation
                                  |
       Microsoft Graph / SharePoint     Tenant-owned integration gateway
                                        HRIS / finance / CRM / LMS / workplace
```

This is one logical solution and one design system, not one universal runtime base class.

**Packaging proposal:** one versioned Zava One SPFx solution package containing the capability web parts, the Teams-capable workspace web part, the Copilot UX adapters/agent definition, and selected native dashboard ACEs. Keep distinct component registrations and approved Teams/agent manifests; do not combine them by guessing manifest fields. Microsoft's overview supports mixed component types conceptually, but the exact mixed-package deployment, catalog synchronization, and target-host behavior must be proven in Stage 2 against the selected release. If a preview limitation requires separate deployable packages, keep shared source, one product version and coordinated deployment, and record the exception for approval. Backend integrations and the preference service are separately operated tenant services, not code executed inside the `.sppkg`.

### Verified platform constraints

| Topic | Evidence as of review date | Planning consequence |
| --- | --- | --- |
| React 18 | SPFx 1.24 preview explicitly adds React 18.x; user selected beta.5 | Pin SPFx 1.24.0-beta.5 for isolated preview development; verify and pin compatible exact React 18 runtime/types at G0 |
| Tool resolution/schema | Beta.5 rolls back beta.4 tool-resolution changes to beta.3 behavior; release notes say new agents target v1.8 | Use actual pinned generated schemas/output; do not copy older v1.7 tutorial snippets or beta.4-only assumptions |
| Build baseline | Modern SPFx uses Heft; generic compatibility guidance has no 1.24 row yet | Follow generated rig and validate beta.5 prerequisites; do not guess the React patch or transplant legacy gulp tooling |
| Copilot UX components | Preview; Microsoft says not to use in production | Tenant-isolated prototype only until production approval and platform readiness |
| Cross-surface UI reuse | Documentation describes shared UI behind different base classes | Share React code, not the Copilot host base class |
| Copilot component hosting | Current preview documents Copilot UX only | Use ordinary web-part/Teams adapters separately; do not assert the same Copilot manifest runs everywhere today |
| Teams personal app | Documented `TeamsPersonalApp` web-part host | Full shell can be exposed through a Teams-capable web-part adapter |
| Native dashboard expansion | HTML/React Quick Views documented since SPFx 1.20 | Shared detail UI possible; native card appearance remains constrained |
| Full-screen transitions | Component requests expansion; host controls collapse | Preserve state and obey actual host context |
| Preview licensing/store | GA licensing not finalized; marketplace distribution unavailable in preview | Budget/licensing/store claims require a later gate |

Sources: R8-R10, R16-R17, R20-R23. The sample revisions originally inspected use React 17/SPFx 1.24 beta.2; they are design references, not this baseline. Release notes checked on 25 September list beta.5 on September 23 and an October GA target, **not a guaranteed delivery date**. React 18 patch/package integrity and host-runtime compatibility remain a G0 evidence gate because npm metadata retrieval failed in this review. [R1, R2, R9]

### Shared component contract

Each catalog entry will declare:

| Contract area | Required design |
| --- | --- |
| Identity | Stable capability ID, localized name, category, owning tab/route, business owner |
| Rendering | Compact/standard/detail views, supported widths, accessibility semantics |
| Invocation | Named intent, validated optional filters/prefill, invocation ID/version |
| Data | Typed view model, source references, scope, `asOf`, partial/error state |
| Access | Eligibility and data permissions checked by authoritative services |
| Actions | Shared Card Stage navigation plus explicit read/draft/review/confirm/pending/receipt states; animation never triggers a write |
| Card stages | Initial overview/intent stage, collection/detail routes, allowed transitions, Back/focus targets, draft retention and reduced-motion behavior |
| Continuation | Entity reference, scope, draft handle, current step; never raw tokens |
| Preferences | Company/Personal recipe defaults, protected-anchor rules and validated user-adjustable fields |
| Host features | Expand, deep link, download, open external, and mobile constraints |
| Evidence | Loading, empty, denied, stale, offline, conflict, and failure fixtures |

The shell renders modules from this registry; a web part renders a single module without the whole shell. A component must be useful and independently testable without importing the SharePoint page, Teams SDK, or Copilot base class into its domain logic.

For React 18, plan one managed root per host component, correct update/unmount behavior, effect cleanup, independent error boundaries, and theme/style/dialog portals bound to the host element's owner document. Avoid global CSS and assumptions about parent-frame access.

### Copilot registration and routing

Start with one recognizable **Zava One** declarative agent and explicit, narrowly described capability tools. Each of the 34 blueprints names a proposed primary tool; some capabilities may later merit a separate read and draft-request tool. The business-feature count does not require the same number of technical manifests.

Define **OpenZavaWorkspace** as the neutral infrastructure entry, separate from C01's **ShowMyDay**. Neutral launch honors the saved default; My day opens Personal; specific capability intent opens its owning tab. This does not create a 35th business capability. Verify the combined agent/tool budget and supported registration grouping with beta.5 before promising all tools in one agent.

Do not expose a vague `renderAnything(view: string)` tool. Prefer distinct intent descriptions, constrained schemas, and fixed owning destinations. Evaluate collisions such as tasks vs approvals, personal leave vs team availability, news vs alerts, IT tickets vs security reports, and public stock quotes vs private equity. The browseable catalog remains shell navigation, not another business capability.

Agent invocation initializes a view; it is not an authorization claim. Derive the current user from the authenticated host, not a prompt-supplied employee ID. Reject unsupported fields and invalid scope rather than silently switching to a different user's record.

### State ownership

| State | Owner and lifetime |
| --- | --- |
| Host display mode/theme/size | Host context; never persisted as authoritative user state |
| Current route/filter/selection | Workspace session; safe fields allowed in deep links |
| Unsubmitted sensitive draft | Short-lived protected state; server-side handle for cross-host continuation if required |
| Saved layout/location/unit preference | Tenant-owned per-user preference store |
| HR/CRM/approval/task record | Authoritative source system |
| Source cache | Per-user, scoped, time-bounded; no sensitive payload in browser persistent storage by default |

Inline-to-full-screen continuation should stay inside the same application lifetime where supported. A host remount must recover safe context without resubmitting a transaction. Moving between different hosts requires supported deep links plus a reauthorized opaque continuation handle; it is not automatic memory sharing.

### Integration strategy

| Domain | Candidate source and boundary | What must be verified |
| --- | --- | --- |
| Calendar, mail, tasks, people, files | Microsoft Graph through supported SPFx clients | Least-privilege scopes, supported endpoints, paging/throttling, license, shared mailbox/task limits |
| News, announcements, policies, resources | SharePoint pages/lists/search and native publishing | Content types, permissions, translation, audience metadata, expiry and search behavior |
| Approval aggregation | Supported Microsoft approvals and/or source-specific providers | Endpoint maturity and permissions; no assumption that one API covers every workflow |
| Leave, pay, benefits, equity | HRIS/payroll/equity provider through a protected integration boundary | Employee identity mapping, regional policy, consent, vendor API/write support, audit and step-up auth |
| Sales, projects, goals | CRM/project system or governed semantic model | RLS, metric definitions, fiscal periods, currency, refresh, Power BI licensing if used |
| Workplace, food, booking, shifts | Site services/booking/food/Shifts provider | Site identity, dietary accuracy, reservations, labor rules, mobile device support |
| Learning, expenses, service desk | LMS/expense/ITSM providers | System ownership, workflow handoff, API availability, transaction confirmation |
| Market ticker | Licensed quote/history provider via approved integration | Listing/symbol, exchange, price currency, delay, market calendar, usage/display license and timestamps |
| Office map and clocks | Owned office directory with coordinates and IANA time zones; approved map geometry | Address/contact permissions, geographic accuracy, DST/date rollover, map licensing, no employee location tracking |
| Glossary and daily polls | Published term store/content and approved survey provider | Term ownership/version/synonyms; vote deduplication, privacy statement and aggregate suppression |
| Security reporting | Security operations intake or approved reporting handoff | Confidential routing, data minimization, evidence handling, escalation and source-issued receipt |

The office map uses a selected office ID to render coordinates, local date/time, named time zone, address, services and safe contacts. Compute clocks from an instant plus the office's IANA time zone using a supported time library/Intl, not a fixed UTC offset. Include an accessible office list with equivalent selection, avoid continuous screen-reader clock announcements, and stop refresh timers when hidden/unmounted. For the design board only, a schematic map and current device clock illustrate this behavior; production geometry, office hours and status need an authoritative source. Time-zone correctness does not establish whether an office is open.

Charts are genuine data views, not decorative sparklines: C28 published company outcomes, C31 price trend, C15 permitted aggregate poll results, C27 authorized sales, C26 portfolio and C19 private vesting. Each needs labels, units, date range, as-of/delay state and a table/list alternative. C28's default company chart uses a publisher-approved broadly visible dataset; private team metrics remain access-controlled. Never infer source permission from placement on Company.

Prefer delegated access when supported. Use a tenant-owned backend for confidential vendor credentials, authorization enforcement, complex normalization, or system-to-system writes. SPFx hosts assets, not arbitrary backend compute. External integrations may need infrastructure even though SPFx UI asset hosting is provided by SharePoint.

A demo provider is a deliberate, visibly labeled mode, separate from live mode. Never turn an API error into invented balances, approvals, news, or a synthetic success receipt. Some repository samples have demo-oriented fallbacks; those are explicitly **not** the production pattern to adopt. [R11]

## 7. Trust, accessibility, and operations

### Transactions

Consequential actions follow **Draft -> Review -> Confirm -> Pending -> Authoritative receipt**, with an explicit Failed/Unknown outcome branch. Revalidate permission, policy, availability, and concurrency immediately before a write. Use source-supported idempotency or a deduplication strategy; after an ambiguous timeout, check the source before retrying.

Leave and expenses require confirmation. A simple task check can be a direct explicit action with rollback/error handling and undo where the source supports it. Viewing a record or expanding a card is never consent to a write. Copilot text is never accepted as proof of a completed transaction.

### Privacy and authorization

Mask pay, benefit claims, and equity amounts by default. Restrict HR and manager views by source permissions, not client role flags. Free-text health details and absence reasons do not appear in team coverage. Do not place private payloads in URLs, analytics, agent-visible summaries, browser logs, or persistent browser storage.

Source content is data, not agent instructions. Grounded answers cite retrievable authorized records and show when sources disagree or are stale. Do not claim access to all tenant data merely because the UI runs in SPFx.

Native targeting helps relevance; it is not a security boundary. Frontline and shared-device scenarios need sign-out/session isolation and deliberate sensitive-content behavior.

### Common component states

| State | Required UX |
| --- | --- |
| Loading | Stable skeleton; no fabricated zero balances |
| Empty | Explain whether there is no work, no matching result, or setup is needed |
| Permission/eligibility | Safe explanation and appropriate access route; no leaked record metadata |
| Stale/partial | Per-source timestamp and missing-source warning; unaffected cards still work |
| Unavailable/offline | Retry and authorized source link; no unsent transaction labeled complete |
| Confirming/pending | Disable duplicate action; show pending state |
| Failure/unknown outcome | Preserve draft, explain uncertainty, reconcile before retry |
| Success | Source-issued reference/status/time, not just a green toast |

### Accessibility and worldwide use

Target WCAG 2.2 AA for Zava-owned experiences. Include full keyboard navigation, visible focus, named controls, screen-reader announcements, chart tables, non-color status cues, high contrast/forced colors, reduced motion, reflow, and focus return. Touch controls target 44px where feasible; desktop density must still meet applicable minimum target requirements.

Design localization from the first component: translated labels, variable-length text, RTL layouts, user time zones, locale dates, fiscal calendars, regional leave units, local holidays, and source currency. A currency dropdown must not pretend to convert financial records without an exchange-rate source and date.

### Content and operational ownership

Use a hybrid governance model: central experience/design/search standards and business-owned source content. Every capability and content collection has a named owner, service contact, review cadence, freshness expectation, and retirement path. News remains authored in SharePoint; policy answers link to the source owner and effective version.

Instrument aggregate task completion, latency, error rates, expansion use, and navigation success without collecting message bodies, medical details, salary, or personal productivity rankings. Required message delivery/acknowledgment needs an approved communication policy and retention schedule, not implicit employee surveillance.

### Proposed measurable acceptance targets

These are design goals to validate with users, not measured outcomes or platform guarantees.

- At least 90% successful completion in moderated testing of the selected top tasks; record failures by audience and host.
- Company first-use view at 1440x1000 shows the lead news article and upcoming-events heading/content before personal task modules; at 390px, events precede supporting news and lower dashboard modules.
- Every default Company recipe contains C06 and C10; Personal retains compact company highlights. Expired events never remain featured as upcoming.
- All six C06 layouts preserve authorized story IDs/order and metadata; filmstrip/carousel are navigable without drag, stay still on entry, and expose manual position and list alternatives. Empty, single-story and long-title states are covered.
- C13 with at least three assignments shows one prioritized course plus the correct count; users can open every assignment and return to the selected list row without losing context. Partial data never claims a complete count.
- C14 compose/review/Edit retains recipient, audience and message. Only explicit confirmation may issue a real write; turning a card never does. Review fixtures never claim praise was sent.
- Every staged capability demonstrates keyboard focus return, an inaccessible inactive face, reduced-motion equivalence, unmount/expansion continuity and content growth at 320px/200% zoom.
- All 34 components have exactly one owning tab; specific deep links/intent expansion override the launch preference without modifying it.
- Office selection updates the selected record and correct local date/time across DST and date boundaries; keyboard/list selection reaches every mapped office.
- Top service/people/policy destinations reachable within two deliberate navigation actions from the workspace home, excluding authentication.
- Same scenario produces the same authorized record, units, and transaction state on every supported surface.
- Initial Zava-owned useful content at p75 within 2.5 seconds after host initialization in an agreed test environment; separate host startup and backend latency.
- One slow or denied provider does not blank the workspace. Load visible modules first; lazily load charts and below-fold modules; do not issue 34 startup queries.
- Every transactional capability demonstrates duplicate-click, stale data, unauthorized access, and uncertain-write recovery cases.
- Every capability has narrow and wide, light and dark, keyboard, screen-reader, high-contrast, and localization evidence before release.

## 8. Design journeys to approve

### Journey A: start anywhere

Megan opens SharePoint: the featured company article and next town hall are immediately visible. First-use Teams and generic Copilot workspace entry open Company with the same published content. She switches to Personal for her agenda and required training. "What should I focus on?" in Copilot still returns C01 and expands directly to Personal, even though her default is Company.

### Journey B: leave request without losing context

Megan asks for a draft for 19-23 October 2026. The inline card shows the dates, source policy, and five working days under the fictional Monday-Friday example. Expanding opens Personal / Pay & benefits with the same unsent draft. Review shows an illustrative 18-day balance and projected 13-day balance, subject to the real HR source and holiday rules. Nothing is submitted until confirmed; a pending/receipt state then comes from HR.

### Journey C: a frontline lunch-and-shift visit

An employee opens the SharePoint app in Teams on a phone. A critical site alert comes first when applicable, followed by a company headline and upcoming event. Relevant shift, required video and lunch entries follow. A cafeteria card opens a native quick view or supported Zava detail page. Native navigation remains native; offline behavior does not invent current availability.

### Journey D: a seller asks a precise question

"How are EMEA sales doing this quarter?" returns a C27 inline card scoped to EMEA, the fiscal quarter, and the source currency. The chart includes target, as-of time, and table alternative. Expansion keeps the scope and opens Company / Projects & business only with appropriate source access; it does not publish that sales dataset to every employee.

### Journey E: customize once, preserve editorial control

Megan chooses Personal as her default launch tab, hides Important email and moves Tasks ahead of Agenda, then saves. Generic Teams/Copilot launches honor Personal; a news intent still opens Company. Company keeps protected news/events anchors and Personal retains its compact company highlights. Relevant mandates remain. SharePoint's page composition is unchanged. A failed preference save is reported explicitly.

### Journey F: connect the global company

An employee selects Helsinki on the world map or equivalent office list. The card shows Helsinki's current local date/time and time-zone label, office details and links to site services. Selecting Singapore updates the same component rather than launching another application. Daylight-saving and date rollover are tested; no employee presence or live building occupancy is inferred.

### Journey G: daily participation and safe help

The Company tab offers a short daily poll with its privacy model before voting and threshold-protected aggregate results afterward. Send praise turns the card into a composer, Review turns to a recipient/message/audience preview, and Edit turns back without losing the draft. Only Confirm and send issues a real request; a later receipt must come from the source. Report now opens the dedicated approved security intake; Open IT support ticket opens C23 instead. The two channels have different confidentiality and escalation rules and never share an unrestricted public activity feed.

### Journey H: one learning card, several required assignments

Personal initially shows Protecting customer information, due Oct 2, with **3 required**. Megan chooses View all 3; the card turns into the required collection. She selects Accessible collaboration, sees that course's due date, duration and transcript/launch options, then returns to the same list item. Overview returns to the prioritized next-required course. Nothing in this navigation launches training or records completion.

### Journey I: the same company news, a different composition

A communications publisher reviews Editorial, Hero tiles, Layers, Carousel, Filmstrip and Compact list over the same permitted three-story example. Filmstrip advances with Next or native scrolling; Carousel selects one story. Events remain beside the news region, and the default narrow Editorial flow still places events ahead of supporting headlines. These are presentation choices, not different sources or permission models.

## 9. Delivery plan after concept approval

No implementation starts in this review pass. The user has selected the preview platform; a coding session/repository and authorization to build are still required. The [agentic handoff](Zava-One-Agentic-Handoff.md) refines the waves below into G0-G8 gates, starting with baseline verification and a fixture-first cross-host reference slice. There is no schedule estimate yet; connector discovery and target tenant readiness determine effort.

| Stage | Deliverable | Exit gate |
| --- | --- | --- |
| 0. Concept and handoff review | Company-first concept, 34 blueprints, visual boards and coding handoff | Review bounded preview scope, selected beta.5 baseline and unresolved integration gates |
| 1. UX refinement | Six C06 news layouts; Card Stage flows for all 34, starting with multi-assignment C13 and compose/review C14; other company/personal detail states | Owners approve hierarchy, stage maps, motion, focus return, safe confirmation and host alternatives |
| 2. Technical feasibility | G0/G1: exact beta.5 React 18 baseline, shared wrappers, C06/C13 read and C14 no-send draft references | Dependency/runtime receipt, generated manifest validation, real host lifecycle, continuation and mixed-package evidence |
| 3. Shared foundation | Tokens, Card Stage primitive, per-capability transitions, shell, registry, adapters, preference contract, fixtures | Independent modules; state survives stage changes; motion and business writes remain separate |
| 4A. Wave 1A - company value | C06-C10, C14-C15, C28, C31-C34: 12 capabilities | News/events-first corporate review; approved content, market/map and safe-reporting contracts |
| 4B. Wave 1B - personal essentials | C01-C05, C11, C13, C16-C17, C23: 10 capabilities | Personal work, mandatory learning, payslip and support flows across supported hosts |
| 5. Wave 2 - employee services | C12, C18, C21, C24, C29: 5 capabilities | Business owners sign off source correctness and transactional behavior |
| 6. Wave 3 - specialist depth | C19-C20, C22, C25-C27, C30: 7 capabilities | Role/region restrictions, business metric definitions and vendor integrations approved |
| 7. Pilot and production gates | Audience pilots, adoption feedback, release/governance runbooks | Production-supported platform, permissions, licensing, performance and accessibility evidence |

Stages 1-2 can exercise mock examples from later waves without committing to their live integrations. A read-only connector or clear source-system handoff is acceptable when a write API is unavailable, but must be marked **handoff**, not represented as an in-place completed workflow.

### Agentic coding handoff pattern

After approval, work in bounded capability slices, not 34 parallel implementations with improvised contracts. Each work item carries the capability ID, owning tab, default/anchor policy, blueprint, board, shared-contract version, source adapter contract, permitted operations, fixtures, and measurable acceptance cases.

The first agent task establishes the scaffold and shared seams. Subsequent tasks add one capability's compact/standard/detail views and wrappers using those seams. Repository-standard generators should create SPFx artifacts. No sample-copy scaffolding, manifest guessing, broad permission additions, or dependency changes without checking the selected supported toolchain.

A capability is done only when its standalone web part and shell module work, Copilot inline and expansion behavior are verified where available, the native card/quick-view alternative is documented, error/access states are honest, and its source operations meet the acceptance condition in the blueprint.

### Review decisions and open gates

| Decision | Proposed default | Approval or investigation needed |
| --- | --- | --- |
| Umbrella brand | Zava One; "Your company, wherever you work." | Name and visual direction |
| Feature breadth | Retain C01-C30 and add C31-C34; 34 total | Approve the explicit four-capability scope increase |
| Corporate entry | Company first; protected lead news + events; configurable Personal default | Corporate communications approves global/local editorial and event hierarchy |
| News presentation | Editorial default; Hero tiles, Layers, Carousel, Filmstrip and Compact list | Publisher controls, promoted counts, image policy, narrow variants and optional slideshow safeguards |
| Card transitions | Shared reversible Card Stage pattern; 240ms flip, instant reduced-motion mode | Validate all capability stage maps, focus, draft retention and host alternatives; no React Bits dependency assumed |
| Tab model | Company/Personal ownership mapping and per-tab recipes | Confirm mappings, protected anchors and cross-tab reminders |
| Primary Teams entry | One pinned primary app per audience | Choose custom workspace vs branded SharePoint app policy |
| SharePoint fidelity | Independently composed web parts with shared appearance | Whether a separate exact-parity app page is also desired |
| Personalization | Shared durable Teams/Copilot preferences; page composition stays separate | Storage owner, privacy and retention |
| Live systems | Graph/SharePoint plus source-specific adapters | Actual Zava HRIS, CRM, LMS, finance and workplace systems |
| New sources | Licensed market feed, office directory/time zones, glossary, polls and security intake | Listing relevance, content owners, privacy and service boundaries |
| Sensitive data | Masked by default; least privilege; review-confirm writes | Regional privacy/security and data-owner approval |
| React/SPFx | User-selected SPFx 1.24.0-beta.5 + React 18, React templates, Heft | Exact dependency/type/runtime verification at G0; separate later production baseline decision |
| Coding entry | Fixture-first G0/G1, not an all-34 live build | Select repository/test tenant and authorize the bounded coding session |
| Copilot delivery | Inline first with optional host-approved full screen | Current host matrix, license, catalog distribution |
| Production promise | No GA/date/licensing assumptions from sample success | Revalidate official guidance before rollout |

## 10. Research and reference register

Product research links were inspected or linked from inspected source files on 24 September 2026. Platform guidance and the new handoff sources were checked on 25 September. Research statements use primary sources rather than treating search summaries as authoritative. Public NN/g articles were used, not paywalled report contents. Registry transport failures are recorded separately and are not treated as package evidence.

| Ref | Source | What it supports |
| --- | --- | --- |
| R1 | [My Day README](https://github.com/pnp/spfx-copilot-components/tree/main/samples/my-day), [settings source](https://github.com/pnp/spfx-copilot-components/blob/main/samples/my-day/src/copilotComponents/myDay/utils/settings.ts), [card source](https://github.com/pnp/spfx-copilot-components/blob/main/samples/my-day/src/copilotComponents/myDay/components/fullscreen/DashboardCard.tsx) | Personal dashboard, panel visibility, session persistence, shared card composition; mock/data limits |
| R2 | [Zava Project Tracker](https://github.com/pnp/spfx-copilot-components/tree/main/samples/zava-project-tracker), [full-screen shell](https://github.com/pnp/spfx-copilot-components/blob/main/samples/zava-project-tracker/src/copilotComponents/shared/components/fullscreen/ProjectFullscreenShell.tsx) | Branded top accent, full-screen workspaces, intent-driven components, confirmation flow, sample-only data |
| R3 | [NN/g: Intranet Usability Guidelines - New Findings From 57 Intranets](https://www.nngroup.com/articles/intranet-usability-guidelines/) | Task-based IA, common content categories, centralized/hybrid governance |
| R4 | [NN/g: Intranet-Search Essentials](https://www.nngroup.com/articles/intranet-search/) | Unified visible search, useful results, source metadata and findability |
| R5 | [Microsoft: Plan the SharePoint app in Teams](https://learn.microsoft.com/en-us/sharepoint/homesites/plan-sharepoint-app-in-teams) | Explicit employee scenario list, audience planning, dashboard/news/resources/announcements |
| R6 | [Microsoft: Home site updates](https://learn.microsoft.com/en-us/sharepoint/home-sites-improvements) | Viva Connections rename, home-site relationship, retained branding, native dashboard personalization |
| R7 | [Microsoft: New SharePoint experience](https://learn.microsoft.com/en-us/sharepoint/enable-new-sharepoint-experience) | Discover, Publish, Build, global navigation and neutral host UI |
| R8 | [Microsoft: Copilot UX components overview](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/overview-copilot-apps) | Different host base classes, shared UI, preview limits, deployment, display modes, licensing uncertainty |
| R9 | [Microsoft: SPFx 1.24 preview release notes](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/release-1.24.0) | React 18, beta.5 date, preview and production restrictions |
| R10 | [Microsoft: HTML Quick Views for ACEs](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/viva/get-started/build-html-quickview-adaptive-card-extension) | HTML/React quick-view option; not an unrestricted native card surface |
| R11 | [Time off and absence sample](https://github.com/pnp/spfx-copilot-components/tree/main/samples/time-off-absence) | Balance/request/team interaction patterns; delegated source examples; demo fallback caveat |
| R12 | [MyApprovals sample](https://github.com/pnp/spfx-copilot-components/tree/main/samples/copilot-my-approvals) | Focused approval UI and real Graph integration example; not universal workflow coverage |
| R13 | [People directory sample](https://github.com/pnp/spfx-copilot-components/tree/main/samples/people-directory) | Directory search, direct contact actions, real Graph example; endpoint/scopes still need review |
| R14 | [Zava Employee Agent sample](https://github.com/pnp/spfx-copilot-components/tree/main/samples/zava-employee-agent) | HR family design, manager/benefits/learning patterns and shared expansion shell; mocked data |
| R15 | [Executive sales dashboard sample](https://github.com/pnp/spfx-copilot-components/tree/main/samples/executive-sales-dashboard) | Inline/full-screen sales, scope filters and chart composition; mock values despite Graph-shaped data |
| R16 | [My Day display-mode guide](https://github.com/pnp/spfx-copilot-components/blob/main/samples/my-day/displayMode.md) | Host-advertised expansion, host-owned collapse, preservation of actual host state |
| R17 | [Microsoft: Expose SPFx web parts in Teams](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/build-for-teams-expose-webparts-teams) | `TeamsPersonalApp` and separate web-part hosting |
| R18 | [Microsoft Support: Use the Hero web part](https://support.microsoft.com/en-us/sharepoint/pages-in-sharepoint/use-the-hero-web-part) | First-party Tiles, Layers and Carousel layouts, up to five items, publisher controls and image focal points; Filmstrip is a Zava proposal |
| R19 | [React Bits: Flip Card](https://reactbits.dev/micro/flip-card) | User-selected motion/continuity reference only; no code reuse, dependency choice or production accessibility claim |
| R20 | [Microsoft: SPFx compatibility reference](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/compatibility) | Exact React compatibility requirement; current table does not include 1.24 |
| R21 | [Microsoft: Heft-based SPFx toolchain](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/toolchain/sharepoint-framework-toolchain-rushstack-heft) | Generated modern build/rig workflow instead of a legacy gulp conversion |
| R22 | [Microsoft: First Copilot component tutorial](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/get-started/build-your-first-copilot-app) | Component/agent/schema structure, Workbench and packaging/catalog flow; older sample schema versions must not override beta.5 output |
| R23 | [Microsoft: Development environment setup](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-development-environment) | Modern prerequisites and Node 22 starting guidance; verify requirements for the specifically selected preview |

Repository reference tree observed: `a09c0b6adef448db3bc56fa83625586c90af25d5`. My Day README blob: `7471407a80ed2e1817fd6804147f63f06d26e65f`; Zava Project Tracker README blob: `d251da32822a0451f3a475e2524e013639a83478`. Links to `main` remain living references; pin selected source revisions at implementation time.

**Approval boundary:** this package proposes the complete experience and implementation direction. It does not authorize production deployment, live access, transactions, or starting the React/SPFx build.
