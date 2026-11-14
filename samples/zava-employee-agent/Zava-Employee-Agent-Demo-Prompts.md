# Zava Employee Agent demo prompts

Use this catalog to test tool selection and parameter extraction in Microsoft Copilot. Start a new conversation when testing routing collisions. Each prompt should select exactly one inline Copilot Component.

> Expected properties below are the normalized values used by the component. When a prompt omits a field, the component may apply the documented offline-demo default. Prompt values prefill or filter UX; they never submit or decide automatically.

For a presentation-ready inline-to-full-screen narrative, use the timed
[Zava Employee Agent 3-minute demo story](Zava-Employee-Agent-3-Minute-Demo.md).

## Quick routing smoke test

| # | Family | Prompt to paste | Expected tool | Full-screen route | Expected inline result |
| --- | --- | --- | --- | --- | --- |
| 1 | Home | **What needs my attention across HR?** | `GetMyHRDashboard` | `home/summary` | General HR summary |
| 2 | Home | **Is my HR profile complete?** | `GetProfileHealth` | `home/profile` | Profile completeness |
| 3 | Home | **What should I do next?** | `GetNextBestActions` | `home/actions` | Ranked HR actions |
| 4 | Home | **Show my HR snapshot.** | `GetWorklifeSnapshot` | `home/timeline` | Worklife metrics and timeline |
| 5 | Home | **When is my next work milestone?** | `GetEmployeeMilestones` | `home/milestones` | Employee milestones |
| 6 | Policy | **What parental leave policy applies to me in Finland?** | `AskPolicy` | `policy/answer` | Cited policy answer |
| 7 | Policy | **Compare parental leave in Finland and Sweden.** | `ComparePolicies` | `policy/compare` | Jurisdiction matrix |
| 8 | Time | **How much vacation leave do I have left?** | `GetLeaveBalance` | `time/balance` | Leave composition |
| 9 | Time | **I want to request vacation from 2027-08-04 to 2027-08-12 for a family trip.** | `RequestTimeOff` | `time/request` | Prefilled request workflow |
| 10 | Money | **Show my latest pay statement.** | `GetLatestPay` | `money/latest` | Gross-to-net statement |
| 11 | Money | **Why did my pay change?** | `ExplainPayChange` | `money/explain-change` | Pay-change waterfall |
| 12 | Benefits | **Compare benefit plans for me and my two children.** | `CompareBenefitPlans` | `benefits/compare` | Weighted plan matrix |
| 13 | Benefits | **Start a benefits life event for a new child.** | `StartLifeEvent` | `benefits/life-event` | Life-event workflow |
| 14 | Support | **Open a private HR case about a payroll deduction.** | `CreateHRCase` | `support/create` | Private case intake |
| 15 | Learning | **Show my required compliance learning.** | `GetRequiredLearning` | `learning/required` | Compliance progress and queue |
| 16 | Rewards | **Show my total rewards for this year.** | `GetTotalRewards` | `rewards/summary` | Annual rewards composition |
| 17 | Team | **Show my pending leave approvals.** | `GetApprovalInbox` | `team/approvals` | Manager decision queue |
| 18 | Team | **Who is away on my team next week?** | `GetTeamAbsenceCalendar` | `team/absence` | Absence heatmap |
| 19 | People | **Find an accessibility expert in Helsinki.** | `FindExpert` | `people/expert` | Evidence-ranked experts |
| 20 | People | **Show me the Customer Experience organization around Megan Bowen.** | `ExploreOrganization` | `people/organization` | Portrait-led org hierarchy |
| 21 | Discovery | **Explore the employee and HR features this agent supports.** | `ExploreAgentCapabilitiesTool` | Dedicated feature explorer | Searchable catalog of all 20 operational tools, not the HR dashboard |

### Published conversation starters

The [canonical six-starter map](config/conversation-starters.json) selects, in order,
`GetMyHRDashboard`, `RequestTimeOff`, `CompareBenefitPlans`, `GetRequiredLearning`,
`GetApprovalInbox`, and `ExploreAgentCapabilitiesTool`. The first five are operational; the last
discovers features. In the explorer, search for **dental** to find benefits comparison, or choose
**Manager Team Hub** to find approvals and absence coverage. A no-match search must stay empty.
Switching theme or host display mode must preserve the feature search rather than open a dashboard.
Browsing never reads private HR facts or confirms a request. Trying an example sends a follow-up
prompt only after the user clicks; normal Copilot tool routing then opens its dedicated experience.

## Parameter-prefill showcase

### Home

| Inline component | Prompt to paste | Expected normalized properties |
| --- | --- | --- |
| General HR summary | **Show my HR dashboard for this month, focused on learning.** | `period: "month"`, `focusArea: "learning"`, `includeSensitive: false`, `privacyLevel: "standard"` |
| Profile health | **What profile information should I update?** | `{}` |
| Next best actions | **Show my most urgent benefits actions for this week.** | `period: "week"`, `focusArea: "benefits"` |
| Worklife snapshot | **Show my worklife snapshot for this month.** | `period: "month"` |
| Employee milestones | **Show my employee milestones for this quarter.** | `period: "quarter"` |

### Policy

| Inline component | Prompt to paste | Expected normalized properties |
| --- | --- | --- |
| Policy answer | **What parental leave policy applies to me in Finland on 2026-08-01? Include sources.** | `question: "What parental leave policy applies to me?"`, `jurisdiction: "Finland"`, `effectiveOn: "2026-08-01"`, `includeSources: true` |
| Policy comparison | **Compare parental leave in Finland and Sweden as of 2026-08-01.** | `topic: "Parental leave"`, `jurisdictions: ["Finland", "Sweden"]`, `effectiveOn: "2026-08-01"` |

### Time

| Inline component | Prompt to paste | Expected normalized properties |
| --- | --- | --- |
| Leave balance | **Show my vacation balance as of 2026-08-13.** | `leaveType: "vacation"`, `asOfDate: "2026-08-13"` |
| Request time off | **I want to request vacation from 2027-08-04 to 2027-08-12 for a family trip.** | `leaveType: "vacation"`, `startDate: "2027-08-04"`, `endDate: "2027-08-12"`, `reason: "Family trip"` |

Request-time-off interaction: edit fields → **Review request** → verify dates, working days, reason, conflict, and coverage → **Submit for approval** → verify request `PTO-2027-0812` confirmation.

### Money

| Inline component | Prompt to paste | Expected normalized properties |
| --- | --- | --- |
| Latest pay | **Show my pay statement for 2026-07.** | `period: "2026-07"` |
| Explain pay change | **Explain why my pay changed in 2026-07 compared with 2026-06, including deductions.** | `period: "2026-07"`, `compareTo: "2026-06"`, `includeDeductions: true` |

### Benefits

| Inline component | Prompt to paste | Expected normalized properties |
| --- | --- | --- |
| Compare plans | **Compare employee-and-children benefit plans for two dependents. Prioritize a low deductible and dental coverage.** | `coverageTier: "employeeChildren"`, `dependentCount: 2`, `priorities: ["deductible", "dental"]` |
| Start life event | **Start a birth life event effective 2026-09-01. I will have two dependents.** | `lifeEvent: "birth"`, `effectiveDate: "2026-09-01"`, `dependentCount: 2` |

### Support

| Inline component | Prompt to paste | Expected normalized properties |
| --- | --- | --- |
| Create HR case | **Open a sensitive payroll HR case. Subject: July deduction question. Details: Please explain the unexpected deduction on my July statement.** | `category: "payroll"`, `subject: "July deduction question"`, `description: "Please explain the unexpected deduction on my July statement."`, `privacyLevel: "sensitive"` |

HR-case interaction: edit fields → **Review private case** → verify privacy boundary and details → **Open case with HR** → verify case `HR-2049` confirmation.

### Learning and rewards

| Inline component | Prompt to paste | Expected normalized properties |
| --- | --- | --- |
| Required learning | **Show required learning due within 14 days. Do not include optional courses.** | `dueWithinDays: 14`, `includeOptional: false` |
| Total rewards | **Show my 2026 total rewards in EUR, including equity and employer-funded benefits.** | `year: 2026`, `currency: "EUR"`, `includeEquity: true`, `includeBenefitsValue: true` |

### Team

| Inline component | Prompt to paste | Expected normalized properties |
| --- | --- | --- |
| Approval inbox | **Show pending leave approvals for my team.** | `teamId: "team-megan"` default, `approvalType: "leave"` |
| Absence calendar | **Show my team absence calendar from 2026-08-17 to 2026-08-21.** | `teamId: "team-megan"` default, `startDate: "2026-08-17"`, `endDate: "2026-08-21"` |

Approval interaction: **Review** a request → inspect requester, dates/context, coverage, and risk → choose **Approve** or **Decline** → confirm the decision → verify the mocked outcome. Decline also supports a reason.

### People

| Inline component | Prompt to paste | Expected normalized properties |
| --- | --- | --- |
| Find expert | **Find an accessibility expert in Helsinki for a customer keynote.** | `expertise: "accessibility for a customer keynote"`, `location: "Helsinki"` |
| Explore organization | **Explore the Customer Experience organization around Megan Bowen to three levels.** | `personId: "Megan Bowen"` or `"megan-bowen"`, `organizationId: "Customer Experience"` or `"customer-experience"`, `depth: 3` |

## Collision checks

Use these pairs to verify sibling routing:

- **How much vacation do I have?** → `GetLeaveBalance`; **Request vacation for these dates** → `RequestTimeOff`.
- **Show my latest pay** → `GetLatestPay`; **Why did my pay change?** → `ExplainPayChange`.
- **What does parental leave policy say?** → `AskPolicy`; **Compare parental leave in Finland and Sweden** → `ComparePolicies`.
- **Compare benefit plans** → `CompareBenefitPlans`; **I had a new child and need to update benefits** → `StartLifeEvent`.
- **What needs my approval?** → `GetApprovalInbox`; **Who is away?** → `GetTeamAbsenceCalendar`.
- **Find an accessibility expert** → `FindExpert`; **Show the reporting structure** → `ExploreOrganization`.

## Test recording

For each prompt, record:

1. Selected tool name.
2. Extracted properties shown in Copilot diagnostics, if available.
3. Visible inline experience.
4. Expand destination and family tab.
5. Whether a second prompt resets prompt-derived defaults without a page reload.
