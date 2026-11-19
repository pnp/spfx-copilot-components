# Zava One intent-to-component mapping

This is the presenter and developer routing contract for **35 business tools plus two infrastructure
tools**. Start with the [five-minute keynote](../demos/keynote-5-minutes.md), use this page to inspect
the exact destination, and use [demo operations](../demos/demo-operations.md) for reset and fallback.

## What is authoritative

- [Capability catalog](../config/zava-capabilities.mjs): C01-C35 IDs, canonical prompts, intent keys,
  catalog routes, operations, wrapper names, and positive/negative routing boundaries.
- [Host generator](../scripts/configure-reference-hosts.mjs): optional tool schemas and the two
  infrastructure entries. Edit the catalog/generator, not generated wrappers, when changing a contract.
- [Agent instructions](../copilot/instruction.txt) and
  [canonical starters](../config/conversation-starters.json): one primary tool per request; the
  narrowest operational tool wins over a broad workspace or Explorer.
- [App dispatcher](../src/shared/components/ZavaOneApp.tsx): actual inline React implementation.
  [Workspace composition](../src/shared/components/ZavaOneExperiences.tsx) controls full screen.

The agent chooses a tool through model routing; there is no deterministic prompt-string dispatcher.
The exact prompts below are rehearsal inputs, not a guarantee of tool choice. The
`check:routing-collisions` command checks this document's catalog rows and source boundaries; only an
authenticated Copilot rehearsal proves actual model selection and extracted arguments.

## Six published conversation starters

These are the current six, not a platform limit. Operational starters precede capability discovery.

| # | Starter title | Exact prompt | Expected tool | Intent / catalog route |
| --- | --- | --- | --- | --- |
| 1 | Catch up on Zava | What's new across Zava this week? | `ShowCompanyNews` | `companyNews` / `company/news` |
| 2 | Find a trusted company answer | Find the parental leave policy for Finland. | `FindCompanyKnowledge` | `knowledge` / `company/knowledge` |
| 3 | Recognize a colleague | Help me send praise to Johanna for making the accessibility lab welcoming. | `ShowRecognitionAndCommunities` | `recognition` / `company/praise` |
| 4 | Review sales performance | Show EMEA bookings this quarter. | `ShowSalesPerformance` | `salesPerformance` / `company/sales-performance` |
| 5 | Explore global offices | Show me Zava offices around the world. | `ShowOfficeDetails` | `officeDetails` / `company/offices` |
| 6 | Explore Zava One | Show me all the company and employee experiences Zava One can help with. | `ExploreAgentCapabilities` | `capabilities` / `capabilities` |

## Complete business intent matrix

The **Component** links identify the actual SPFx entry classes, not just a friendly display name.
Every row also has a SharePoint-only web part. Operation is catalog metadata: **information** opens
information, **review** opens assigned work/decisions, and **submit** opens a draft or participation
flow. None authorizes a write. In particular, Tasks uses a local completion checkbox, not the C35
decision-confirmation workflow.

Catalog routes are logical identifiers, **not browser URLs or full-screen deep links**. Some React
snapshots publish more specific/different stage paths, such as `company/sales` or
`personal/vacation-approvals/decision`. Use `intentKey` in the local harness.

| ID | Exact canonical prompt | Tool | Component | intentKey | Catalog route | Operation | SharePoint web part |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C01 | What should I focus on today? | `ShowMyDay` | [ShowMyDayCopilotComponent](../src/copilotComponents/showMyDay/ShowMyDayCopilotComponent.tsx) | `myDay` | `personal/my-day` | information | `MyDayWebPart` |
| C02 | What do I have tomorrow morning? | `ShowMyAgenda` | [ShowMyAgendaCopilotComponent](../src/copilotComponents/showMyAgenda/ShowMyAgendaCopilotComponent.tsx) | `agenda` | `personal/agenda` | information | `AgendaWebPart` |
| C03 | Show messages I have flagged. | `ShowImportantMail` | [ShowImportantMailCopilotComponent](../src/copilotComponents/showImportantMail/ShowImportantMailCopilotComponent.tsx) | `importantMail` | `personal/mail` | information | `ImportantMailWebPart` |
| C04 | What tasks are due today? | `ShowMyTasks` | [ShowMyTasksCopilotComponent](../src/copilotComponents/showMyTasks/ShowMyTasksCopilotComponent.tsx) | `tasks` | `personal/tasks` | review | `TasksWebPart` |
| C05 | Which approvals need me? | `ShowMyApprovals` | [ShowMyApprovalsCopilotComponent](../src/copilotComponents/showMyApprovals/ShowMyApprovalsCopilotComponent.tsx) | `approvals` | `personal/approvals` | review | `ApprovalsWebPart` |
| C06 | What's new across Zava this week? | `ShowCompanyNews` | [ShowCompanyNewsCopilotComponent](../src/copilotComponents/showCompanyNews/ShowCompanyNewsCopilotComponent.tsx) | `companyNews` | `company/news` | information | `CompanyNewsWebPart` |
| C07 | Are there active office notices? | `ShowActiveAnnouncements` | [ShowActiveAnnouncementsCopilotComponent](../src/copilotComponents/showActiveAnnouncements/ShowActiveAnnouncementsCopilotComponent.tsx) | `announcements` | `company/announcements` | information | `ActiveAnnouncementsWebPart` |
| C08 | Find the parental leave policy for Finland. | `FindCompanyKnowledge` | [FindCompanyKnowledgeCopilotComponent](../src/copilotComponents/findCompanyKnowledge/FindCompanyKnowledgeCopilotComponent.tsx) | `knowledge` | `company/knowledge` | information | `CompanyKnowledgeWebPart` |
| C09 | Where do I submit expenses? | `FindEmployeeService` | [FindEmployeeServiceCopilotComponent](../src/copilotComponents/findEmployeeService/FindEmployeeServiceCopilotComponent.tsx) | `employeeServices` | `company/services` | information | `EmployeeServicesWebPart` |
| C10 | When is the next town hall? | `ShowCompanyEvents` | [ShowCompanyEventsCopilotComponent](../src/copilotComponents/showCompanyEvents/ShowCompanyEventsCopilotComponent.tsx) | `companyEvents` | `company/events` | information | `CompanyEventsWebPart` |
| C11 | Who can help with accessibility? | `FindPeople` | [FindPeopleCopilotComponent](../src/copilotComponents/findPeople/FindPeopleCopilotComponent.tsx) | `people` | `company/people` | information | `PeopleWebPart` |
| C12 | What do I need to do before my first day? | `ShowMyOnboarding` | [ShowMyOnboardingCopilotComponent](../src/copilotComponents/showMyOnboarding/ShowMyOnboardingCopilotComponent.tsx) | `onboarding` | `personal/onboarding` | information | `OnboardingWebPart` |
| C13 | What required learning must I finish? | `ShowMyLearning` | [ShowMyLearningCopilotComponent](../src/copilotComponents/showMyLearning/ShowMyLearningCopilotComponent.tsx) | `learning` | `personal/learning` | information | `LearningWebPart` |
| C14 | Send praise to Alex for the launch. | `ShowRecognitionAndCommunities` | [ShowRecognitionAndCommunitiesCopilotComponent](../src/copilotComponents/showRecognitionAndCommunities/ShowRecognitionAndCommunitiesCopilotComponent.tsx) | `recognition` | `company/praise` | submit | `RecognitionAndCommunitiesWebPart` |
| C15 | What's today's employee poll? | `ShowEmployeeSurveys` | [ShowEmployeeSurveysCopilotComponent](../src/copilotComponents/showEmployeeSurveys/ShowEmployeeSurveysCopilotComponent.tsx) | `surveys` | `company/signals` | submit | `EmployeeSurveysWebPart` |
| C16 | Draft leave for October 19 through 23. | `ShowTimeOff` | [ShowTimeOffCopilotComponent](../src/copilotComponents/showTimeOff/ShowTimeOffCopilotComponent.tsx) | `timeOff` | `personal/time-off` | submit | `TimeOffWebPart` |
| C17 | Where is my August payslip? | `ShowPayDocuments` | [ShowPayDocumentsCopilotComponent](../src/copilotComponents/showPayDocuments/ShowPayDocumentsCopilotComponent.tsx) | `payDocuments` | `personal/pay-documents` | information | `PayDocumentsWebPart` |
| C18 | What changes after moving country? | `ShowMyBenefits` | [ShowMyBenefitsCopilotComponent](../src/copilotComponents/showMyBenefits/ShowMyBenefitsCopilotComponent.tsx) | `benefits` | `personal/benefits` | information | `BenefitsWebPart` |
| C19 | What vests next quarter? | `ShowMyEquity` | [ShowMyEquityCopilotComponent](../src/copilotComponents/showMyEquity/ShowMyEquityCopilotComponent.tsx) | `equity` | `personal/equity` | information | `EquityWebPart` |
| C20 | Help me finish my Berlin expense claim. | `ShowExpensesAndTravel` | [ShowExpensesAndTravelCopilotComponent](../src/copilotComponents/showExpensesAndTravel/ShowExpensesAndTravelCopilotComponent.tsx) | `expensesTravel` | `personal/expenses-travel` | submit | `ExpensesAndTravelWebPart` |
| C21 | What's vegetarian in Redmond today? | `ShowCampusMenu` | [ShowCampusMenuCopilotComponent](../src/copilotComponents/showCampusMenu/ShowCampusMenuCopilotComponent.tsx) | `campusMenu` | `company/campus-menu` | information | `CampusMenuWebPart` |
| C22 | Find a room for four at 14:00. | `FindWorkplaceSpace` | [FindWorkplaceSpaceCopilotComponent](../src/copilotComponents/findWorkplaceSpace/FindWorkplaceSpaceCopilotComponent.tsx) | `workplaceSpace` | `personal/workplace-space` | submit | `WorkplaceSpaceWebPart` |
| C23 | My VPN is not working. | `GetITHelp` | [GetItHelpCopilotComponent](../src/copilotComponents/getItHelp/GetItHelpCopilotComponent.tsx) | `itHelp` | `personal/it-help` | submit | `ItHelpWebPart` |
| C24 | Report a broken light on floor 3. | `GetWorkplaceHelp` | [GetWorkplaceHelpCopilotComponent](../src/copilotComponents/getWorkplaceHelp/GetWorkplaceHelpCopilotComponent.tsx) | `workplaceHelp` | `company/workplace-help` | submit | `WorkplaceHelpWebPart` |
| C25 | When is my next shift? | `ShowMyShifts` | [ShowMyShiftsCopilotComponent](../src/copilotComponents/showMyShifts/ShowMyShiftsCopilotComponent.tsx) | `shifts` | `personal/shifts` | information | `ShiftsWebPart` |
| C26 | Why is Project Aurora at risk? | `ShowProjectHealth` | [ShowProjectHealthCopilotComponent](../src/copilotComponents/showProjectHealth/ShowProjectHealthCopilotComponent.tsx) | `projectHealth` | `company/project-health` | information | `ProjectHealthWebPart` |
| C27 | Show EMEA bookings this quarter. | `ShowSalesPerformance` | [ShowSalesPerformanceCopilotComponent](../src/copilotComponents/showSalesPerformance/ShowSalesPerformanceCopilotComponent.tsx) | `salesPerformance` | `company/sales-performance` | information | `SalesPerformanceWebPart` |
| C28 | How are our customer experience goals tracking? | `ShowGoalsAndScorecards` | [ShowGoalsAndScorecardsCopilotComponent](../src/copilotComponents/showGoalsAndScorecards/ShowGoalsAndScorecardsCopilotComponent.tsx) | `goalsScorecards` | `company/outcomes` | information | `GoalsAndScorecardsWebPart` |
| C29 | Find the launch brief I used yesterday. | `FindMyWorkFiles` | [FindMyWorkFilesCopilotComponent](../src/copilotComponents/findMyWorkFiles/FindMyWorkFilesCopilotComponent.tsx) | `workFiles` | `personal/work-files` | information | `WorkFilesWebPart` |
| C30 | Who is available on Friday? | `ShowTeamAvailability` | [ShowTeamAvailabilityCopilotComponent](../src/copilotComponents/showTeamAvailability/ShowTeamAvailabilityCopilotComponent.tsx) | `teamAvailability` | `personal/team-availability` | information | `TeamAvailabilityWebPart` |
| C31 | How is our stock doing today? | `ShowCompanyStock` | [ShowCompanyStockCopilotComponent](../src/copilotComponents/showCompanyStock/ShowCompanyStockCopilotComponent.tsx) | `companyStock` | `company/market` | information | `CompanyStockWebPart` |
| C32 | What does CXR mean at Zava? | `FindCompanyTerm` | [FindCompanyTermCopilotComponent](../src/copilotComponents/findCompanyTerm/FindCompanyTermCopilotComponent.tsx) | `glossary` | `company/glossary` | information | `CorporateGlossaryWebPart` |
| C33 | Help me report a suspicious email. | `ReportSecurityConcern` | [ReportSecurityConcernCopilotComponent](../src/copilotComponents/reportSecurityConcern/ReportSecurityConcernCopilotComponent.tsx) | `securityReporting` | `company/report-now` | submit | `SecurityReportingWebPart` |
| C34 | What time is it in Helsinki? | `ShowOfficeDetails` | [ShowOfficeDetailsCopilotComponent](../src/copilotComponents/showOfficeDetails/ShowOfficeDetailsCopilotComponent.tsx) | `officeDetails` | `company/offices` | information | `OfficeDetailsWebPart` |
| C35 | Show vacation requests waiting for my decision. | `ReviewVacationRequests` | [ReviewVacationRequestsCopilotComponent](../src/copilotComponents/reviewVacationRequests/ReviewVacationRequestsCopilotComponent.tsx) | `vacationApprovals` | `personal/vacation-approvals` | review | `VacationRequestApprovalsWebPart` |

C14's canonical Alex prompt is a **routing example**, not a supported recipient-selection claim:
the composer currently offers Johanna, Diego, and Joni. Use the published Johanna starter on stage.
C16/C17 retain the exact catalog's month-specific examples for traceability; choose future dates or a
visible document in the UI for a current rehearsal instead of narrating those months as current.

## Positive triggers and nearest-sibling exclusions

These are the catalog boundaries used to generate each tool's **Use when / Do not use when**
description. The 13 collision-pair checks cover a subset of these boundaries, not all paraphrases.

| ID | Use when | Do not use when |
| --- | --- | --- |
| C01 | the user asks what matters today or wants a daily briefing | the user asks only for calendar events or tasks |
| C02 | the user asks about meetings, calendar, or preparation | the user asks for company events |
| C03 | the user asks for flagged, unread, or important mail | the user asks for tasks or approvals |
| C04 | the user asks about personal tasks or due work | the user asks for approvals or required learning |
| C05 | the user asks for general approvals awaiting a decision | the request is specifically a vacation or leave approval |
| C06 | the user asks for Zava company or local news | the user asks for events or urgent alerts |
| C07 | the user asks about active notices or alerts | the user asks for ordinary company news |
| C08 | the user asks for a company policy or verified answer | the user asks for an acronym definition or service |
| C09 | the user asks where to complete an employee task | the user asks for a policy answer |
| C10 | the user asks about company events or town halls | the user asks for personal calendar meetings |
| C11 | the user asks who can help or has specific expertise | the user asks for team availability |
| C12 | the user asks about onboarding or employee transition steps | the user asks only for learning assignments |
| C13 | the user asks about assigned or required learning | the user asks for general tasks or onboarding |
| C14 | the user wants to draft or send praise to a colleague | the user asks for people expertise, approvals, or surveys |
| C15 | the user asks about an employee poll or survey | the user wants to send praise |
| C16 | the user asks about their leave balance or wants to draft time off | a manager needs to approve someone else's vacation request |
| C17 | the user asks for payslips or tax documents | the user asks about benefits or equity |
| C18 | the user asks about benefits or life events | the user asks for pay documents |
| C19 | the user asks about personal equity or vesting | the user asks about public company stock |
| C20 | the user asks about expenses or business travel | the user asks for an employee service directory |
| C21 | the user asks about a campus menu or cafeteria | the user asks about office details |
| C22 | the user asks to find a room or desk | the user asks only for office information |
| C23 | the user needs ordinary IT help or ticket status | the user reports a security concern |
| C24 | the user needs non-emergency workplace or facilities help | the issue is IT or security related |
| C25 | the user asks about their shifts or attendance options | the user asks about calendar meetings |
| C26 | the user asks about project or portfolio health | the user asks about sales performance |
| C27 | the user asks about authorized sales or revenue performance | the user asks about project delivery |
| C28 | the user asks about published company outcomes or goals | the user asks for confidential sales details |
| C29 | the user asks for a recent or known work file | the user asks for company policy knowledge |
| C30 | an authorized user asks about team availability | the user asks to approve a vacation request |
| C31 | the user asks about public Zava stock performance | the user asks about personal equity |
| C32 | the user asks for a Zava term or acronym | the user asks a broader policy question |
| C33 | the user needs to report phishing, a lost device, or another security concern | the user needs ordinary IT or facilities help |
| C34 | the user asks about a Zava office, location, or local time | the user asks to book a room or see a menu |
| C35 | a manager needs to review vacation requests | the user wants to request their own time off or review other approval types |

For example: **Where do I submit expenses?** finds a service (C09); **Help me finish my Berlin expense
claim.** opens the expense workflow (C20). **Explore global offices** is operational C34, not Explorer.

## Infrastructure and composed hosts

| Tool | Component | intentKey | Entry behavior | Do not use for |
| --- | --- | --- | --- | --- |
| `OpenZavaWorkspace` | [OpenZavaWorkspaceCopilotComponent](../src/copilotComponents/openZavaWorkspace/OpenZavaWorkspaceCopilotComponent.tsx) | `workspace` | Composed workspace; default Company in combined mode | A specific business question |
| `ExploreAgentCapabilities` | [ExploreAgentCapabilitiesCopilotComponent](../src/copilotComponents/exploreAgentCapabilities/ExploreAgentCapabilitiesCopilotComponent.tsx) | `capabilities` | Inline searchable scenario browser; copy a prompt, then explicitly submit it in chat | A known operational task |

The three workspace web parts are `ZavaOneWorkspaceWebPart` (combined),
`ZavaOneCompanyWorkspaceWebPart` (Company only), and `ZavaOnePersonalWorkspaceWebPart` (Personal only).
There are **not** three workspace tools. These three web parts alone advertise SharePoint full-page
and Teams hosting; the distributed [Teams app packages](../teams/README.md) are personal-only.

## Exact optional tool inputs

All properties are optional. Strings below are strings unless a type or enum is stated. These are
the **advertised source schemas**, not a promise that every field is consumed by the current UI.
Publisher options such as title, layout, density, item count, or action policy are not tool inputs.

| Applies to | Advertised fields |
| --- | --- |
| C01-C04, C07-C12, C15, C17-C18, C21, C24-C28, C30-C34 | `scope`, `query` |
| C05 | `approvalType`: budget/publication/supplier/all; `approvalId` |
| C06 | `topic`, `region` |
| C13 | `assignmentId`, `status` |
| C14 | `recipientName`, `message`, `audience` |
| C16 | `leaveType`: vacation/sick/personal; `startDate`, `endDate`: YYYY-MM-DD; `reason` |
| C19 | `year`: integer 2020-2100; `currency`: EUR/USD/GBP |
| C20 | `reportName`, `trip` |
| C22 | `office`: Helsinki/Redmond/Singapore; `date`: YYYY-MM-DD; `time`: HH:mm; `durationMinutes`: integer 30-240; `capacity`: integer 1-20 |
| C23 | `category`: Access/Device/Network/Software/Other; `impact`: Low/Medium/High; `summary`, `description` |
| C29 | `query` |
| C35 | `requestId`, `employeeName`, `status` |
| `OpenZavaWorkspace` | `tab` (description recommends company/personal; schema is a string) |
| `ExploreAgentCapabilities` | `category`, `query` |

Read each component's adjacent `*CopilotComponentProperties.ts` for the generated Zod definition.
Numeric bounds above describe source validation; inspect discovered/compiled schemas before claiming
the model or host enforces those bounds. The user must still review every form.

### Current consumption limits

The host passes `toolProperties` through; it does not normalize them into publisher settings.

- **Consumed in inline UI:** C05 `approvalId`; C11 `query`; C13 `assignmentId`; C16 all four fields;
  C19 `currency` (display label, not a live FX conversion); C20 `reportName`; C22 all five fields;
  C23 all four fields; C29 `query`.
- **Other advertised inputs are not currently consumed by their active inline implementation.**
  This includes news topic/region, praise prefills, C35 direct request/filter inputs, Sales scope,
  office scope, workspace tab, and Explorer's initial filters. Use the visible controls; do not
  claim that the prompt applied a filter merely because the seeded default happens to match.
- C05 currently falls back to the first approval for an unknown `approvalId`; use only fixture IDs
  during rehearsal. Unknown-record handling is an implementation gate, not evidence of a match.
- `location` read by Campus Menu is not advertised in its tool schema; choose **Redmond** in the UI.
  Sales starts at **EMEA / Q1 FY27**; that fixture period is not necessarily the actual current quarter.

These gaps are tracked in [the finalization checklist](../todo.md#remaining-release-gates). They
are pre-existing runtime limitations, not implemented fixes or tenant-verified behavior.

## Shared React ownership

All component classes render through
[ZavaOneCopilotComponentBase](../src/shared/hosts/ZavaOneCopilotComponentBase.tsx) into the same
[ZavaOneApp](../src/shared/components/ZavaOneApp.tsx) used by the web-part host. The active bodies are:

| Implementation file | Intent keys / exported experiences |
| --- | --- |
| [FocusedCapabilityExperiences](../src/shared/components/FocusedCapabilityExperiences.tsx) | `myDay` -> MyDayExperience; `agenda` -> AgendaExperience; `glossary` -> GlossaryExperience; `securityReporting` -> SecurityReportingExperience |
| [PersonalDetailExperiences](../src/shared/components/PersonalDetailExperiences.tsx) | `importantMail` -> ImportantMailExperience; `tasks` -> TasksExperience; `learning` -> PersonalLearningExperience; `expensesTravel` -> ExpensesTravelExperience; `shifts` -> ShiftsExperience; `workFiles` -> WorkFilesExperience |
| [PersonalWorkflowExperiences](../src/shared/components/PersonalWorkflowExperiences.tsx) | `approvals` -> ApprovalsExperience; `timeOff` -> TimeOffExperience; `equity` -> EquityExperience; `workplaceSpace` -> WorkplaceSpaceExperience; `itHelp` -> ItHelpExperience |
| [CompanyCapabilityExperiences](../src/shared/components/CompanyCapabilityExperiences.tsx) | `companyEvents`, `people`, `surveys`, `campusMenu`, `projectHealth`, `salesPerformance`, `goalsScorecards`, `companyStock`, `officeDetails` -> their named experiences |
| [ZavaOneExperiences](../src/shared/components/ZavaOneExperiences.tsx) | `companyNews` -> CompanyNewsExperience; `recognition` -> RecognitionExperience; `vacationApprovals` -> VacationApprovalsExperience; `capabilities` -> CapabilityExplorerExperience; `workspace` -> ZavaOneWorkspace |
| [CatalogCapabilityExperience](../src/shared/components/CatalogCapabilityExperience.tsx) | `announcements`, `knowledge`, `employeeServices`, `onboarding`, `payDocuments`, `benefits`, `workplaceHelp`, `teamAvailability` use the catalog/grammar-specific body |

## Inline, full screen, and continuation

1. A selected tool opens its focused inline body. Do the task there; expansion is optional.
2. **Expand** requests host-approved `fullscreen`. The host's returned display mode is authoritative.
3. Full screen renders the composed workspace, initially on the capability's owning tab, not an
   exact selected-record page. Company has 17 modules; Personal has 18. The Explorer expands to the
   Company workspace rather than remaining a full-screen Explorer.
4. The workspace creates its module bodies without `toolProperties`. Inline selection, draft, and
   stage are not transferred into those newly mounted bodies. A persistent outer React root does not
   prove continuity across different inner trees. Complete C35 inline before expanding.
5. C35 confirmed decisions share the evented store within the same runtime and can reload from that
   browsing context's session storage. Other forms primarily keep mounted local state. Separate tabs,
   origins, iframes, SharePoint, Teams, and Copilot sessions are **not** a synchronized business backend.
6. News detail's **Ask Copilot about this story** sends an explicit follow-up. The local harness records
   it but does not execute a model. There is no sample-wide Revenue-style **Summary & next steps** or
   next-component handoff contract; do not borrow those stage directions from other Zava samples.

## Rehearsal acceptance

- Submit each starter in authenticated Copilot; record actual tool name, arguments, visible body,
  tenant/host build, and any deviation. The local harness proves rendering, not model routing.
- Compare C05/C35, C16/C35, C08/C32, C02/C10, C23/C33, C19/C31, and C34/C22/C21 explicitly.
- Verify C35 `vac-1043`: 3 workdays, balance 11 -> 8, coverage **attention**, reference
  `ZAVA-LEAVE-1043`, and pending 4 -> 3 after explicit approval.
- Reject any claim of preserved drafts, applied filters, real submissions, or cross-host state that
  was not observed. Record a failure and use the [fallback](../demos/demo-operations.md#offline-fallback).
