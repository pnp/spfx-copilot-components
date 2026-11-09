# Zava Employee Agent UX Design

## Purpose

This document is the canonical experience contract for the Zava Employee Agent. It translates the
existing composite mockups into implementable behavior for ten SPFx Copilot Component families.

The interaction model builds on two proven samples:

- `my-day`: personalized greeting, summary banner, deterministic recommendation engine, and a
  right-side panel that mimics a streamed AI response without making an API call.
- `time-off-absence`: optional Zod tool properties extracted from the prompt, prefilled controls,
  user review, derived values, and validation before submission.

The existing images under `assets/` remain visual references. Where an image and this document
conflict, this document controls behavior, naming, and component ownership.

## Experience Principles

1. **Personal before procedural.** Every full-screen dashboard starts with the signed-in user's
   identity, a time-aware greeting, and a concise statement of what matters in that area.
2. **Prompt values become visible controls.** Values extracted from the prompt prefill the inline
   experience. They never bypass review, validation, privacy checks, or confirmation.
3. **Summarize, explain, then act.** Surfaces show the result, why it matters, and the next action.
4. **AI behavior is honest and deterministic.** The showcase mimics generation and streaming from
   mocked data. It does not call an AI service and says so in the panel footnote.
5. **One journey, twenty high-value entry points.** Every current-target inline surface is
  independently callable through its own tool metadata. All 20 components reuse one ten-tab
  full-screen shell; 30 lower-priority intents remain documented for optimal future expansion.
6. **Keynote reliability wins.** Relative mock dates, stable ranking, accessible reduced-motion
   behavior, and no runtime network dependency keep every demo repeatable.

## Recommended Architecture

### Component Ownership

Generate the 20 selected SPFx Copilot Components in the value-ranked portfolio. Keep all five
completed Home components and add the 15 selected components across Families 02-10. Each component owns:

- Its manifest, GUID, tool description, and Zod properties schema.
- One focused inline intent surface.
- Only the optional parameters that visibly prefill or filter that intent.
- A fixed owning family, initial full-screen route, and normalized prompt-derived state.

Components in one family reuse shared family services, view models, and theme. The full catalog is
defined in [Zava-Employee-Agent-Component-Plan.md](Zava-Employee-Agent-Component-Plan.md).

All components import a shared `ZavaDashboardShell` for full-screen mode. The shell owns:

- The persistent ten-family navigation rail.
- The current family and detail route while full screen is open.
- The shared personalized header, settings, responsive layout, and right-side panel.
- Cross-family navigation from an action-plan recommendation.

This preserves fine-grained MCP/tool routing without implementing unrelated full-screen shells.
The shell opens on the family and route owned by the invoked component and can then switch family
internally.

### Display Modes

- **Inline:** Render only the invoked component's fixed intent surface. Show Expand only when the
  host advertises `fullscreen` in `availableDisplayModes`.
- **Full screen:** Render `ZavaDashboardShell` with `initialFamily`, `initialRoute`, and normalized
  prompt parameters. Navigation after opening is internal to the shell.
- **Right panel:** Render as a sibling column on wide screens. On narrow screens, render as a
  full-width overlay with Back and Close controls. Only one right panel is open at a time.

### Intent-to-fullscreen contract

Each component supplies immutable definition metadata alongside normalized prompt properties:

```ts
interface IZavaIntentComponentDefinition<TProperties> {
  family: ZavaFamilyId;
  route: string;
  normalize: (properties: TProperties) => Record<string, unknown>;
}
```

On Expand, the host changes display mode for the same invoked component. Its root renders
`ZavaDashboardShell` with `initialFamily`, `initialRoute`, `initialParams`, and the current properties
version. The shell must apply these values on a fresh invocation, focus the destination heading, and
then own internal navigation. No generic `view` parameter selects sibling inline intents.

### Navigation Contract

The canonical rail order is:

1. Home
2. Time
3. Money
4. Benefits
5. Rewards
6. Policy
7. Support
8. Learning
9. Team
10. People

User-facing rail labels stay short. Accessible labels and tooltips use the full family names.

An action destination uses a typed route rather than a URL:

```ts
type ZavaFamilyId =
  | 'home'
  | 'time'
  | 'money'
  | 'benefits'
  | 'rewards'
  | 'policy'
  | 'support'
  | 'learning'
  | 'team'
  | 'people';

interface IZavaDestination {
  family: ZavaFamilyId;
  route: string;
  params?: Record<string, string | number | boolean | string[]>;
}
```

The shell handles `onNavigate(destination)` by selecting the family, applying validated parameters,
and focusing the destination heading. Browser URLs and external applications are not required for
the mocked showcase.

During incremental implementation, all ten shell destinations remain selectable. Home renders its
completed dashboard; a family that has not yet reached its implementation phase renders only its
family-colored personalized title region above an empty canvas. It must not imitate family data,
tools, cards, or workflows before that family's Copilot Component has been generated and designed.

### Family Theme Contract

Every family owns one unique theme variant in the shared `familyThemes` registry. Full-screen title
regions use a same-hue dark-to-saturated-to-light gradient; navigation, badges, and future inline
surfaces reuse the same accent, foreground, and subtle background tokens.

| Family | Theme palette |
| --- | --- |
| Home | Zava brand blue |
| Time | Teal |
| Money | Green |
| Benefits | Blue |
| Rewards | Gold |
| Policy | Purple |
| Support | Cranberry |
| Learning | Cornflower |
| Team | Pumpkin |
| People | Berry |

Do not substitute a generic brand gradient inside a family component. New inline components must
resolve their visual identity from the shared family metadata and theme registry so inline and
full-screen modes remain recognizably connected.

## Shared Full-Screen Composition

### Personalized Top Region

Every family uses the same hierarchy:

1. Signed-in user's avatar, first name, and optional job title or manager scope.
2. Time-aware greeting based on the client clock:
   - Before 05:00: `Good morning` with an early-start acknowledgement.
   - 05:00-11:59: `Good morning`.
   - 12:00-16:59: `Good afternoon`.
   - 17:00-21:59: `Good evening`.
   - From 22:00: `Good evening` with a late-hours acknowledgement.
3. Family name and one sentence describing the current area state.
4. Three or four family metrics derived from mock data.
5. Settings icon. The AI summary is a separate banner below the hero so both controls remain clear.

Use the real host user when available and a stable Zava persona fallback otherwise. Resolve the clock
once per mount so text and relative dates do not change midway through a keynote interaction.

### Area Priority Banner

Below the hero, every family has a compact priority banner inspired by `PlanYourDayBanner`:

- Sparkle icon and family accent.
- A short title, such as `Your leave priorities`.
- One deterministic summary sentence, such as
  `You have one request to confirm and three carryover days expiring soon.`
- One action button that opens the family priority panel.

The Home version is the cross-family signature feature:

- **Banner title:** `Your HR priorities`
- **Button:** `Build my HR action plan`
- **Panel title:** `My HR action plan`
- **Purpose:** Summarize the most important items across all ten families.

Avoid `My tasks to be completed`; it reads like a generic task list and understates the
cross-domain reasoning. `My HR action plan` is concise, personal, and action-oriented.

### Mocked AI Panel

The panel copies the reliable interaction cadence from `my-day` while adding direct navigation:

1. **Thinking, 800 ms:** Spinner, shimmer, and `Reviewing your HR signals...`.
2. **Streaming, 220 ms per item:** Reveal up to five ranked recommendations.
3. **Done:** Announce completion to assistive technology and focus the first recommendation heading.
4. **Reduced motion:** Skip delays and render the complete plan immediately.

Each recommendation contains:

- Rank and family icon.
- Action title.
- One-sentence reason grounded in mock data.
- Due date or suggested timing when relevant.
- Source label, such as Learning, Benefits, or Time & Leave.
- Primary command, such as `Open in Learning`.
- Optional secondary command, such as `Remind me Friday`.
- Typed destination for direct full-screen navigation.

The fixed panel footnote is:

> AI-style suggestions in this demo are generated locally from sample data. No AI service is called,
> and changes are not saved.

### Deterministic Recommendation Model

The shared mock engine returns a stable contract:

```ts
type HrPriority = 'critical' | 'high' | 'normal' | 'optional';

interface IHrActionItem {
  id: string;
  family: ZavaFamilyId;
  title: string;
  reason: string;
  priority: HrPriority;
  dueOffsetDays?: number;
  suggestedTime?: string;
  destination: IZavaDestination;
}

interface IHrActionPlan {
  headline: string;
  generatedAt: Date;
  items: IHrActionItem[];
}
```

Ranking is deterministic:

1. Blocking compliance, coverage, privacy, or payroll issues.
2. Items due today or overdue.
3. Approvals and requests due in the next seven days.
4. Enrollment, carryover, learning, and manager signals due later.
5. Optional growth and profile-quality recommendations.

Use relative offsets in seed data and resolve them against the mount clock. Never use random ranking.

## Family Dashboard Designs

> [!IMPORTANT]
> Every family dashboard implements all five original experiences below. The current-target list
> identifies which experiences also have independent inline Copilot Components and MCP tools. Items
> labeled optimal-future are already available as internal full-screen routes; only their promotion
> to separate prompt-addressable inline components is deferred.

### 01. My HR Dashboard

**Purpose:** A personalized summary of all HR areas and the primary keynote entry point.

- **Hero state:** `Good afternoon, Vesa` and `Here is what needs your attention across work and HR.`
- **Metrics:** Open actions, upcoming deadlines, profile completeness, next important date.
- **Priority banner:** `Your HR priorities` with `Build my HR action plan`.
- **AI panel:** Up to five cross-family actions with direct family destinations.
- **Content:** Action center, worklife timeline, leave and benefits snapshot, learning progress, personal
  signals, and recent milestones.
- **Direct route example:** `Complete privacy training` opens Learning full screen at the required
  course detail.

Current-target inline components:

- Today's HR summary.
- Profile health.
- Next best actions.
- Worklife snapshot.
- Milestones.

Useful prompt parameters across the five fixed-intent Home tools:

- `period`: `today`, `week`, `month`, or `year`.
- `focusArea`: optional family identifier.
- `includeSensitive`: defaults to `false`.

### 02. Policy Q&A

**Purpose:** Answer policy questions with clear applicability, citations, and a safe private path.

- **Hero state:** `Two policies apply to your question; one changed recently.`
- **Metrics:** Answer confidence, applicable policies, recently changed, sensitive paths available.
- **Priority banner:** `Your policy follow-ups` with `Review this answer`.
- **Panel:** Key answer, applicability assumptions, citations, changed clauses, and direct links to
  Compare policies or Private support routes.
- **Content:** Answer with receipts, source list, jurisdiction comparison, recent changes, and private
  support handoff.

Current-target inline components:

- Policy answer.
- Compare policies.

Optimal-future components:

- Answer sources.
- Private support.
- What changed recently.

Useful prompt parameters:

- `question`: the user's policy question.
- `jurisdictions`: optional ISO country or region codes to compare.
- `effectiveOn`: optional ISO date.
- `includeSources`: defaults to `true`.

### 03. PTO & Leave

**Purpose:** Explain balances and let the user review a prefilled, conflict-aware leave request.

- **Hero state:** `You have 18 vacation days available and no pending requests.`
- **Metrics:** Available days, pending days, expiring carryover, calendar conflicts.
- **Priority banner:** `Your leave priorities` with `Review my leave plan`.
- **Panel:** Expiring balance, pending requests, suggested dates, and direct routes to Request time off
  or Team coverage.
- **Content:** Balance and usage, request preview, status timeline, carryover, and coverage calendar.

Current-target inline components:

- Leave balance.
- Request time off.

Optimal-future components:

- Request status.
- Vacation usage.
- Team coverage check.

Useful prompt parameters:

- `leaveType`: `vacation`, `sick`, or `personal`.
- `asOfDate`: optional ISO date for the balance.
- `startDate` and `endDate`: optional ISO dates, inclusive.
- `reason`: optional short note.

Prompt example:

> I'd like to take vacation from August 4th to August 12th, 2027 for a family trip.

Expected normalized properties:

```json
{
  "leaveType": "vacation",
  "startDate": "2027-08-04",
  "endDate": "2027-08-12",
  "reason": "Family trip"
}
```

The form displays the supplied dates, calculates working days, shows mocked conflicts and coverage,
and requires user confirmation. Prompt values never submit the request automatically.

In both inline and full-screen modes, Leave type fills the first row. Start date and End date share
the next row, followed by a full-width Reason field. At viewport widths of 460 px or less, the existing
single-column layout stacks the fields in the same reading and keyboard order.

### 04. Payroll Explainer

**Purpose:** Explain pay, deductions, documents, and changes without exposing unrelated sensitive data.

- **Hero state:** `Your latest net pay is EUR 5,126, up 2.4% from the previous period.`
- **Metrics:** Net pay, gross pay, deductions, change from previous period.
- **Priority banner:** `Your pay insights` with `Explain my latest pay`.
- **Panel:** Streamed explanation of the largest pay-change drivers, each routing to the corresponding
  breakdown or document.
- **Content:** Payslip explainer, gross-to-net waterfall, deduction allocation, pay history, and
  documents.

Current-target inline components:

- Latest pay.
- Why pay changed.

Optimal-future components:

- Where deductions go.
- Pay history.
- Pay documents.

Useful prompt parameters:

- `period`: an ISO year-month or `latest`.
- `compareTo`: previous period, previous year, or an ISO year-month.
- `includeDeductions`: defaults to `true` for explanations.

### 05. Benefits & Life Events

**Purpose:** Show current coverage and guide comparisons or life-event changes.

- **Hero state:** `Your coverage is active; open enrollment closes in 23 days.`
- **Metrics:** Active plans, monthly employee cost, covered dependents, enrollment days remaining.
- **Priority banner:** `Your benefits priorities` with `Review my coverage`.
- **Panel:** Coverage gaps, enrollment deadlines, and ranked plan or life-event next steps.
- **Content:** Enrollment checklist, plan comparison, dependents, current coverage, and life-event
  wizard.

Current-target inline components:

- Compare plans.
- Start a life event.

Optimal-future components:

- Current benefits.
- Dependent coverage.
- Enrollment checklist.

Useful prompt parameters:

- `coverageTier`: `employee`, `employeePartner`, `employeeChildren`, or `family`.
- `lifeEvent`: marriage, birth, adoption, relocation, or loss of coverage.
- `dependentCount`: optional non-negative integer.
- `priorities`: optional array of cost, network, deductible, dental, vision, or mentalHealth.
- `effectiveDate`: optional ISO date.

Prompt example:

> Compare family plans for two children. Prioritize a low deductible and dental coverage.

### 06. HR Case Desk

**Purpose:** Answer first where safe, then create and track a private HR case with visible privacy.

- **Hero state:** `One case is waiting for your response; average response time is four hours.`
- **Metrics:** Answer confidence, open cases, average response time, knowledge deflection rate.
- **Priority banner:** `Your support priorities` with `Review my support plan`.
- **Panel:** Case follow-ups, suggested knowledge answers, privacy status, and direct case-detail routes.
- **Content:** Knowledge-first answer, case board, case timeline, private intake, and service health.

Current-target inline component:

- Open a case.

Optimal-future components:

- Case status.
- My HR cases.
- Quick answer first.
- HR desk health.

Useful prompt parameters:

- `category`: payroll, benefits, leave, workplace, learning, or other.
- `subject`: short case title.
- `description`: optional detail shown for user review.
- `privacyLevel`: `standard`, `private`, or `sensitive`.

### 07. Learning & Compliance

**Purpose:** Prioritize required learning while supporting role-based development.

- **Hero state:** `You are 86% complete; one required course is due this week.`
- **Metrics:** Compliance complete, time remaining, recommended items, team members at risk.
- **Priority banner:** `Your learning priorities` with `Build my learning plan`.
- **Panel:** Required course order, estimated time, role-path recommendations, and direct course routes.
- **Content:** Mandatory learning, active course, progress, role path, recommendations, and team status.

Current-target inline component:

- Required learning.

Optimal-future components:

- Continue learning.
- Learning progress.
- Recommended for you.
- Team learning status.

Useful prompt parameters:

- `dueWithinDays`: optional positive integer.
- `includeOptional`: defaults to `false` for compliance prompts.

### 08. Total Rewards

**Purpose:** Explain the complete value of pay, bonus, equity, pension, and employer-funded benefits.

- **Hero state:** `Your estimated total rewards value is EUR 184,000 this year.`
- **Metrics:** Base pay, variable pay, equity vesting this year, employer-funded benefits.
- **Priority banner:** `Your rewards insights` with `Explain my total rewards`.
- **Panel:** Streamed explanation of year-over-year changes and upcoming vesting or election actions.
- **Content:** Total-value composition, compensation history, vesting timeline, pension projection, and
  benefits value.

Current-target inline component:

- Total rewards summary.

Optimal-future components:

- Compensation history.
- Explain rewards change.
- Equity vesting.
- Pension and benefits value.

Useful prompt parameters:

- `year`: optional four-digit year.
- `includeEquity`: defaults to `true`.
- `includeBenefitsValue`: defaults to `true`.
- `currency`: optional ISO currency code.

> [!NOTE]
> Total Rewards needs a new dedicated full-screen visual. It must remain distinct from Payroll:
> Payroll explains a pay period; Total Rewards explains annual employment value.

### 09. Manager Team Hub

**Purpose:** Give managers one prioritized view of approvals, team signals, absence, and check-ins.

- **Hero state:** `Three approvals need you; team coverage is healthy this week.`
- **Metrics:** Direct reports, pending approvals, coverage risks, learning compliance.
- **Priority banner:** `Your manager priorities` with `Build my team action plan`.
- **Panel:** Ranked approvals, risks, overdue check-ins, and direct routes to the selected employee or
  workflow.
- **Content:** Team roster, approval inbox, absence calendar, team signals, and check-in preparation.

Current-target inline components:

- Approvals waiting.
- Team absence calendar.

Optimal-future components:

- Team hub.
- Team risk signals.
- Start a check-in.

Useful prompt parameters:

- `teamId`: optional manager team identifier.
- `approvalType`: optional leave, expense, learning, or people-action filter.
- `startDate` and `endDate`: optional ISO dates for the absence calendar.

### 10. Org & People Graph

**Purpose:** Help users understand relationships, find expertise, and prepare for people interactions.

- **Hero state:** `Five close collaborators and three experts match your current work.`
- **Metrics:** Close collaborators, experts matched, organization changes, next one-to-one.
- **Priority banner:** `Your people priorities` with `Prepare my people plan`.
- **Panel:** Upcoming one-to-ones, suggested experts, organization changes, and direct people routes.
- **Content:** Personal network, organization explorer, expert finder, meeting context, and org signals.

Current-target inline components:

- Explore the organization.
- Find an expert.

Optimal-future components:

- People network.
- Meeting preparation.
- Organization signals.

Useful prompt parameters:

- `personId`: optional selected person.
- `expertise`: optional search phrase or tags.
- `location`: optional expert location filter.
- `organizationId`: optional subtree root.
- `depth`: optional organization-tree depth.

Prompt example:

> Find an expert in accessibility for a customer keynote and show how they connect to my team.

## Inline Parameter Contract

### Common Properties

Each component has one fixed intent and its own minimal optional schema. There is no public `view`
discriminator. Shared field names remain consistent only when they visibly control that component:

```ts
const commonProperties = {
  locale: z.string().optional().describe('Optional BCP 47 locale requested by the user.'),
  privacyLevel: z
    .enum(['standard', 'private', 'sensitive'])
    .optional()
    .describe('Optional privacy level to apply before rendering sensitive information.')
};
```

Use specific enums instead of open strings wherever the choices are known. Every field description
must explain format, examples, and the control it prefills.

### Prompt-to-Control Lifecycle

1. Copilot selects the family tool and extracts only explicitly supplied values.
2. The component normalizes dates, enum aliases, identifiers, and locale-sensitive values.
3. React state initializes from normalized properties.
4. A new tool invocation resets editable state from the new properties. Passive host changes such as
   theme or dimensions do not erase user edits.
5. Derived values recalculate, such as working days, plan totals, or pay comparisons.
6. Validation and mocked conflict checks run.
7. The user reviews and confirms any transaction.

> [!IMPORTANT]
> The `time-off-absence` reference initializes state from tool properties correctly on first mount,
> but its current `propertiesVersion` does not reach the form state. Zava must explicitly distinguish
> a fresh tool invocation from a passive rerender so a second prompt updates the prefilled controls.

### Date Rules

- Tool dates use ISO `yyyy-mm-dd` strings.
- Date ranges are inclusive unless a field explicitly says otherwise.
- Relative language such as `next Friday` is resolved by Copilot before invocation.
- The component tolerates invalid or partial values by showing validation; it never throws during
  render.
- End dates cannot precede start dates.
- Transactions calculate business days and show holidays or conflicts before confirmation.

### Parameter Showcase Scenarios

Use these prompts in demos and automated interaction tests:

1. `I'd like vacation from August 4th to August 12th, 2027 for a family trip.`
   Opens PTO & Leave request with leave type, dates, and reason prefilled.
2. `Compare family medical plans for two children, prioritizing dental and low deductible.`
   Opens Benefits comparison with family tier, dependent count, and priorities applied.
3. `Why did my July 2026 pay change compared with June? Include deductions.`
   Opens Payroll change explanation with both periods and deduction detail.
4. `What is the parental leave policy in Finland and Sweden as of August 1st? Show sources.`
   Opens Policy comparison with jurisdictions, effective date, and citations visible.
5. `Open a private payroll case about an unexplained deduction.`
   Opens HR Case Desk intake with category, privacy level, and subject prefilled for review.
6. `Show required learning due in the next 14 days.`
   Opens Learning required view with the deadline filter applied.
7. `Show approvals and absence risks for my team this month.`
   Opens Manager Team Hub with approvals, risks, and period applied.
8. `Find an accessibility expert for my customer keynote.`
   Opens People expert search with the expertise and context applied.

## Mock Data Requirements

The Home action plan needs enough connected data to summarize all areas. Seed one coherent Zava
persona story rather than ten unrelated datasets:

- One required privacy course due in three days.
- One vacation request draft with a date conflict and healthy team coverage.
- One benefits enrollment deadline in 23 days.
- One recently changed payroll deduction with a plausible explanation.
- One open HR case waiting for the user's response.
- One equity vest date later this month.
- Two manager approvals, one high priority.
- One upcoming one-to-one and three relevant experts.

Every seed uses relative offsets. IDs referenced by action-plan destinations must exist in the owning
family dataset so direct navigation always lands on a real mocked detail.

## Visual and Interaction Quality Bar

- Use Fluent UI v9 components and semantic tokens. Family accents may guide emphasis but must not
  replace semantic success, warning, and danger colors.
- Use icons for icon actions and tooltips for unfamiliar controls.
- Keep compact dashboard headings proportional to the panels; reserve large type for the hero.
- No nested cards. The shell, hero, and page bands are unframed; cards represent individual data or
  action units.
- Keep animations meaningful: initial stagger, right-panel entrance, and mocked stream only.
- Respect `prefers-reduced-motion` and maintain keyboard focus when panels open, close, or navigate.
- On mobile, replace the persistent rail with an accessible family menu and show right panels as
  full-width layers.
- Every mocked transaction has review, validation, success, empty, and error/fallback states.
- Show `Mock data - offline` quietly in the shell footer and the AI disclosure in the action panel.

## Design Asset Work Required

The current image set is useful for composition but is not presentation-ready. Before keynote use:

1. Re-export assets with Zava Employee Agent branding and filenames matching visible content.
2. Create a dedicated My HR Dashboard full-screen design with the priority banner and action panel.
3. Create a dedicated Total Rewards full-screen design distinct from Payroll.
4. Add a time-aware personalized hero and area priority banner to every full-screen design.
5. Show the action panel in open and completed states, including a direct family navigation command.
6. Add prompt-prefilled inline states for PTO, Benefits, Payroll, Policy, HR Case, Team, and People.
7. Show desktop, narrow desktop with panel open, and mobile behavior for the shared shell.
8. Replace the proposed persistent `Ask the agent` input with the action banner and host chat. A
   second prompt box inside the component duplicates Copilot and competes with the settings control.

## Acceptance Checklist

- The current portfolio has 20 fixed-intent inline components across all ten families.
- All ten full-screen dashboards identify the user and use a time-aware greeting.
- All ten dashboards have an area-specific state sentence, metrics, priority banner, and panel CTA.
- Home ranks cross-family mocked signals and routes every item to an existing destination.
- Mocked generation has thinking, streaming, done, and reduced-motion behavior.
- Prompt parameters visibly prefill controls and remain editable.
- A second prompt refreshes prefilled state without a page reload.
- No prompt-derived transaction submits without user confirmation.
- Payroll and Total Rewards remain visibly and conceptually distinct.
- The shell works with pointer, keyboard, screen reader, light theme, dark theme, and narrow layouts.
