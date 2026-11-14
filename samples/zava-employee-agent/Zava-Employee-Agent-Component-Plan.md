# Zava Employee Agent intent-component plan

This is the canonical MCP app tool and SPFx Copilot Component catalog. The current showcase targets
**20 operational components/tools plus a dedicated feature explorer (21 total)** across ten full-screen families. Five completed Home
tools are retained, and fifteen additional tools are selected for decision value, visual density, and
meaningful inline interaction. The other 30 catalog intents are tracked as optimal-future components.

## Inline portfolio UX analysis

An intent earns a component in the current 20-tool target when it does at least two of the following:

1. Answers a frequent, time-sensitive employee or manager question without opening a system of record.
2. Turns prompt parameters into editable controls, calculations, comparison, or explicit confirmation.
3. Makes evidence easier to understand through a chart, matrix, calendar, timeline, graph, or progress view.
4. Creates a distinct keynote moment rather than duplicating a nearby summary, list, document, or status view.
5. Expands naturally into a richer route in the shared full-screen family without changing its intent.

Retrieval-only variants, supporting evidence views, historical lists, and narrow status/detail views remain
valuable, but they do not all justify separate MCP routing and bundles in the first showcase. They belong in
the optimal-future catalog and may still appear as internal full-screen routes when needed by an active tool.

### Selected 20-tool portfolio

| Family | Current inline components | Inline UX value |
| --- | --- | --- |
| Home | `GetMyHrDashboard`; `GetProfileHealth`; `GetNextBestActions`; `GetWorklifeSnapshot`; `GetEmployeeMilestones` | Retains the five completed entry points: cross-family summary, profile gauge, ranked actions, timeline, and personalized milestone media. |
| Policy | `PolicyAnswer`; `PolicyComparison` | Cited answer receipt plus a jurisdiction comparison matrix with highlighted differences. |
| Time | `LeaveBalance`; `RequestTimeOff` | Balance composition chart plus a prompt-prefilled date workflow with business-day and conflict calculations. |
| Money | `LatestPay`; `ExplainPayChange` | Gross-to-net snapshot plus a period-over-period waterfall explaining each driver. |
| Benefits | `CompareBenefitPlans`; `StartLifeEvent` | Reweightable plan matrix plus a staged life-event workflow with impact preview and confirmation. |
| Support | `CreateHrCase` | Privacy-aware intake that visibly separates sensitive details and requires review before submission. |
| Learning | `RequiredLearning` | Compliance progress ring, urgency timeline, estimated effort, and direct resume actions. |
| Rewards | `TotalRewardsSummary` | Annual-value composition chart across salary, bonus, equity, pension, and benefits. |
| Team | `ApprovalInbox`; `TeamAbsenceCalendar` | Actionable approval queue plus an overlap calendar that exposes coverage risk before approval. |
| People | `FindExpert`; `ExploreOrganization` | Faceted expert discovery plus a keyboard-accessible, collapsible organization graph. |

This allocation intentionally averages two tools per family rather than forcing an identical quota. Home has
five because those components are complete. Support, Learning, and Rewards each have one especially strong
flagship; their lower-density intents remain available for future growth. All 20 operational
components are implemented; the 30 other catalog intents remain internal full-screen routes.

### Dedicated feature discovery

`ExploreAgentCapabilitiesTool` is the sixth starter's owner, not an HR dashboard variant. It has
generated GUID `d48c2178-27ab-4f5d-b685-b3016b5f1b08`, optional `query` and `category` inputs,
and a catalog checked against all 20 operational manifests. Search and family filtering reveal
purposes and example prompts without reading employee records. Only an explicit user action sends
a selected prompt to Copilot; unavailable host actions and errors are visible. Both host display modes
retain the explorer and its local search state. Its entry joins the existing shared bundle.

## Non-negotiable component model

- One selected current-target intent equals one component folder, manifest GUID, Webpack entry,
  agent registration, tool description, Zod schema, inline root, and test slice. Future inventory
  rows receive these artifacts only after explicit promotion into the current portfolio.
- Never create or copy a component structure manually. Before implementing a selected intent, generate it from
  the solution root:

  ```bash
  yo @microsoft/sharepoint --component-type copilotComponent --component-name NameOfTheComponent --framework react --skip-install
  ```

- Run `npm install` after each approved generation batch, then verify every generated GUID appears
  once in `config/copilot-agent.json`, every component has a bundle in `config/config.json`, and every
  manifest exposes exactly its intended tool metadata.
- A component owns exactly one inline intent. Do not add a generic `view` parameter to multiplex
  sibling family surfaces back into one tool.
- All Zod fields are optional. Use `z.object({})` when prompt extraction cannot improve the initial
  experience. Do not add ceremonial parameters.
- Do not use Zod string, array, or numeric bounds that emit unsupported `minLength`, `maxLength`,
  `maxItems`, `minimum`, or `maximum` keywords in Copilot Component property schemas. Enforce any
  required runtime bounds in normalizers instead.
- Prompt parameters prefill or filter the inline UI. They never submit, approve, create, or mutate
  data without explicit user review and confirmation.
- Expand requests host fullscreen from the invoked component. In fullscreen mode the same component
  renders the shared shell with its fixed `initialFamily`, fixed `initialRoute`, normalized
  `initialParams`, and properties version. The shell focuses that route and then owns internal tab
  navigation. The dedicated capability explorer is the intentional exception: it keeps its own
  discovery UX in full screen, rather than opening an unrelated HR workspace.

## Shared host contract

Every generated component adapts its host context to one shared root contract:

```ts
interface IZavaIntentComponentDefinition<TProperties> {
  family: ZavaFamilyId;
  route: string;
  normalize: (properties: TProperties) => Record<string, unknown>;
}
```

- **Inline mode:** render only that component's compact intent surface.
- **Fullscreen mode:** render `ZavaDashboardShell` with the definition's family and route.
- **Fresh invocation:** normalized properties and a version token reset prompt-derived defaults.
- **Passive rerender:** preserve local edits and drill-down state.
- **Cross-family navigation:** continue using typed `IZavaDestination`; never use browser URLs.

## Complete intent inventory

Parameters below are optional Zod fields. Dates use ISO `yyyy-mm-dd`. Empty means `z.object({})`.
Only names listed in the selected portfolio are current-target components; all other rows are optimal-future
candidates retained here so future expansion does not require rediscovering schemas or routes. All 50
inventory rows are implemented as internal views in their owning full-screen family; “optimal-future”
means only that no separate inline component, manifest, bundle, or MCP tool exists for that row.

### Family 01 - Home

| Inline intent | Yeoman component name | Manifest tool | Optional parameters | Fullscreen route |
| --- | --- | --- | --- | --- |
| Today's HR summary | `GetMyHrDashboard` | `GetMyHRDashboard` | `period: today\|week\|month`; `focusArea`; `includeSensitive`; `locale`; `privacyLevel` | `home/summary` |
| Profile health | `GetProfileHealth` | `GetProfileHealth` | Empty | `home/profile` |
| Next best actions | `GetNextBestActions` | `GetNextBestActions` | `period: today\|week\|month`; `focusArea`; `includeSensitive` | `home/actions` |
| Worklife snapshot | `GetWorklifeSnapshot` | `GetWorklifeSnapshot` | `period: today\|week\|month\|year` | `home/timeline` |
| Milestones | `GetEmployeeMilestones` | `GetEmployeeMilestones` | `period: month\|quarter\|year`; `milestoneId` | `home/milestones` |

Phase 6 is complete: `GetMyHrDashboard` remains the summary tool, its public `view` multiplexer is
removed, and the four sibling components reuse the existing Home UI pieces without duplicating
markup. All five Home components remain in the current portfolio.

### Family 02 - Policy

| Inline intent | Yeoman component name | Manifest tool | Optional parameters | Fullscreen route |
| --- | --- | --- | --- | --- |
| Policy answer | `PolicyAnswer` | `AskPolicy` | `question`; `jurisdiction`; `effectiveOn`; `includeSources` | `policy/answer` |
| Compare policies | `PolicyComparison` | `ComparePolicies` | `topic`; `jurisdictions: string[]`; `effectiveOn` | `policy/compare` |
| Answer sources | `PolicySources` | `GetPolicySources` | `query`; `jurisdiction`; `effectiveOn` | `policy/sources` |
| Private support | `PrivatePolicySupport` | `GetPrivatePolicySupport` | `category`; `subject`; `privacyLevel` | `policy/private-support` |
| What changed recently | `PolicyChanges` | `GetPolicyChanges` | `topic`; `jurisdiction`; `changedSince` | `policy/changes` |

### Family 03 - Time

| Inline intent | Yeoman component name | Manifest tool | Optional parameters | Fullscreen route |
| --- | --- | --- | --- | --- |
| Leave balance | `LeaveBalance` | `GetLeaveBalance` | `leaveType`; `asOfDate` | `time/balance` |
| Request time off | `RequestTimeOff` | `RequestTimeOff` | `leaveType`; `startDate`; `endDate`; `reason` | `time/request` |
| Request status | `TimeOffRequestStatus` | `GetTimeOffRequestStatus` | `requestId` | `time/status` |
| Vacation usage | `VacationUsage` | `GetVacationUsage` | `year`; `leaveType` | `time/usage` |
| Team coverage | `TeamCoverage` | `GetTeamCoverage` | `startDate`; `endDate`; `teamId` | `time/coverage` |

Example: “I want to book some time off from August 5 to August 10” selects `RequestTimeOff` and
prefills ISO `startDate` and `endDate`. `leaveType` and `reason` remain empty unless stated. The user
reviews working days and conflicts before any mocked confirmation.

### Family 04 - Money

| Inline intent | Yeoman component name | Manifest tool | Optional parameters | Fullscreen route |
| --- | --- | --- | --- | --- |
| Latest pay | `LatestPay` | `GetLatestPay` | `period` | `money/latest` |
| Why pay changed | `ExplainPayChange` | `ExplainPayChange` | `period`; `compareTo`; `includeDeductions` | `money/explain-change` |
| Where deductions go | `ExplainDeductions` | `ExplainDeductions` | `period`; `deductionCategory` | `money/deductions` |
| Pay history | `PayHistory` | `GetPayHistory` | `fromDate`; `toDate` | `money/history` |
| Pay documents | `PayDocuments` | `GetPayDocuments` | `documentType`; `year` | `money/documents` |

### Family 05 - Benefits

| Inline intent | Yeoman component name | Manifest tool | Optional parameters | Fullscreen route |
| --- | --- | --- | --- | --- |
| Current benefits | `CurrentBenefits` | `GetCurrentBenefits` | `effectiveOn` | `benefits/current` |
| Compare plans | `CompareBenefitPlans` | `CompareBenefitPlans` | `coverageTier`; `dependentCount`; `priorities: string[]` | `benefits/compare` |
| Start a life event | `StartLifeEvent` | `StartLifeEvent` | `lifeEvent`; `effectiveDate`; `dependentCount` | `benefits/life-event` |
| Dependent coverage | `DependentCoverage` | `GetDependentCoverage` | `dependentId`; `coverageType` | `benefits/dependents` |
| Enrollment checklist | `EnrollmentChecklist` | `GetEnrollmentChecklist` | `planYear`; `coverageTier` | `benefits/enrollment` |

### Family 06 - Support

| Inline intent | Yeoman component name | Manifest tool | Optional parameters | Fullscreen route |
| --- | --- | --- | --- | --- |
| Open a case | `CreateHrCase` | `CreateHRCase` | `category`; `subject`; `description`; `privacyLevel` | `support/create` |
| Case status | `HrCaseStatus` | `GetHRCaseStatus` | `caseId` | `support/status` |
| My HR cases | `MyHrCases` | `GetMyHRCases` | `status`; `category` | `support/cases` |
| Quick answer first | `QuickHrAnswer` | `GetQuickHRAnswer` | `question`; `category`; `includeSources` | `support/quick-answer` |
| HR desk health | `HrDeskHealth` | `GetHRDeskHealth` | Empty | `support/health` |

### Family 07 - Learning

| Inline intent | Yeoman component name | Manifest tool | Optional parameters | Fullscreen route |
| --- | --- | --- | --- | --- |
| Required learning | `RequiredLearning` | `GetRequiredLearning` | `dueWithinDays`; `includeOptional` | `learning/required` |
| Continue learning | `ContinueLearning` | `ContinueLearning` | `courseId` | `learning/continue` |
| Learning progress | `LearningProgress` | `GetLearningProgress` | `period`; `targetRole` | `learning/progress` |
| Recommended for you | `LearningRecommendations` | `GetLearningRecommendations` | `targetRole`; `skill` | `learning/recommendations` |
| Team learning status | `TeamLearningStatus` | `GetTeamLearningStatus` | `teamId`; `dueWithinDays` | `learning/team-status` |

### Family 08 - Rewards

| Inline intent | Yeoman component name | Manifest tool | Optional parameters | Fullscreen route |
| --- | --- | --- | --- | --- |
| Total rewards summary | `TotalRewardsSummary` | `GetTotalRewards` | `year`; `currency`; `includeEquity`; `includeBenefitsValue` | `rewards/summary` |
| Compensation history | `CompensationHistory` | `GetCompensationHistory` | `fromYear`; `toYear`; `currency` | `rewards/history` |
| Explain rewards change | `ExplainRewardsChange` | `ExplainRewardsChange` | `year`; `compareToYear`; `currency` | `rewards/explain-change` |
| Equity vesting | `EquityVesting` | `GetEquityVesting` | `asOfDate`; `horizonMonths` | `rewards/equity` |
| Pension and benefits value | `PensionBenefitsValue` | `GetPensionBenefitsValue` | `year`; `currency` | `rewards/pension` |

### Family 09 - Team

| Inline intent | Yeoman component name | Manifest tool | Optional parameters | Fullscreen route |
| --- | --- | --- | --- | --- |
| Team hub | `ManagerTeamHub` | `GetTeamHub` | `teamId`; `period` | `team/hub` |
| Approvals waiting | `ApprovalInbox` | `GetApprovalInbox` | `teamId`; `approvalType` | `team/approvals` |
| Team risk signals | `TeamRiskSignals` | `GetTeamRiskSignals` | `teamId`; `period`; `riskType` | `team/risks` |
| Team absence calendar | `TeamAbsenceCalendar` | `GetTeamAbsenceCalendar` | `teamId`; `startDate`; `endDate` | `team/absence` |
| Start a check-in | `StartManagerCheckIn` | `StartManagerCheckIn` | `employeeId`; `meetingDate`; `focusTopics: string[]` | `team/check-in` |

### Family 10 - People

| Inline intent | Yeoman component name | Manifest tool | Optional parameters | Fullscreen route |
| --- | --- | --- | --- | --- |
| People network | `PeopleNetwork` | `GetPeopleNetwork` | `personId`; `context` | `people/network` |
| Explore the organization | `ExploreOrganization` | `ExploreOrganization` | `personId`; `organizationId`; `depth` | `people/organization` |
| Find an expert | `FindExpert` | `FindExpert` | `expertise`; `location` | `people/expert` |
| Meeting preparation | `PrepareForMeeting` | `PrepareForMeeting` | `meetingId`; `personId`; `context` | `people/meeting` |
| Organization signals | `OrganizationSignals` | `GetOrganizationSignals` | `organizationId`; `period` | `people/signals` |

## Generation and implementation order

1. **Phase 6 - pattern proven with Home.** `GetProfileHealth`, `GetNextBestActions`,
  `GetWorklifeSnapshot`, `GetEmployeeMilestones`, and `GetMyHrDashboard` are complete.
2. The shared intent host/fullscreen adapter makes all five Home tools independently selectable from
  prompt metadata and opens the existing shell on the Home tab at each fixed route.
3. Implement Families 02-10 one family at a time, generating only the one or two selected components
  for that family before editing generated code.
4. After each family, verify unique GUIDs, bundles, manifest schemas/descriptions, agent component
   registration, prompt-to-tool routing, parameter prefills, fullscreen initial route, and Home action
   plan integration.

## Acceptance rules for every current-target intent component

- Its tool description names the user intents it owns and avoids overlapping sibling tools.
- Its schema contains only parameters that visibly change initial rendering.
- It renders useful defaults when invoked with `{}`.
- Invalid or partial parameters normalize without throwing.
- Prompt-derived editable values reset only on a fresh invocation.
- Inline Expand appears only when fullscreen is available.
- Fullscreen opens the fixed owning family and route with the normalized parameters.
- It uses shared family services/theme and does not duplicate the full-screen implementation.
- It has focused static/behavior tests and passes `heft test --clean` without warnings.
