# Employee Hub demo prompts and intent mapping

## Inline component and prompt index

Pick a component, copy its example prompt into a fresh conversation, and compare the result with the linked inline screenshot. The last column names the **one** tool expected for that prompt. Entries #01-28 perform focused tasks; #29 explores the catalog without running a task, and #30 opens a workspace.

| Inline component (screenshot) | Example prompt to copy | Expected tool |
| --- | --- | --- |
| #01 [Around the calendar](review/evidence/screens/task-01-inline-760.png) | When is the next town hall? | `FindCompanyEvents` |
| #02 [The story desk](review/evidence/screens/task-02-inline-760.png) | What changed in the company this week? | `ReadCompanyNews` |
| #03 [Market atlas](review/evidence/screens/task-03-inline-760.png) | Which countries are furthest below bookings plan? | `MapSalesMarkets` |
| #04 [A place to meet](review/evidence/screens/task-04-inline-760.png) | Find a step-free room in London for six. | `BookMeetingRoom` |
| #05 [The field guide](review/evidence/screens/task-05-inline-760.png) | Which travel policy applies in the UK? | `FindPublishedGuidance` |
| #06 [Evidence to action](review/evidence/screens/task-06-inline-760.png) | Prepare a follow-up on German partner qualification. | `PrepareGrowthAction` |
| #07 [Forecast bridge](review/evidence/screens/task-07-inline-760.png) | Why did Germany's quarter-end outlook move? | `ExplainForecastMovement` |
| #08 [Bookings scorecard](review/evidence/screens/task-08-inline-760.png) | How are EMEA bookings tracking against plan? | `CompareSalesPerformance` |
| #09 [Lead conversion](review/evidence/screens/task-09-inline-760.png) | How many partner leads in Germany became opportunities this quarter? | `TraceLeadConversion` |
| #10 [Your learning path](review/evidence/screens/task-10-inline-760.png) | What learning is due next? | `ShowRequiredLearning` |
| #11 [Benefits preparation](review/evidence/screens/task-11-inline-760.png) | Help me prepare for my benefits review. | `PrepareBenefitsReview` |
| #12 [Pay statements](review/evidence/screens/task-12-inline-760.png) | Show my latest completed payslip. | `ViewMyPayslip` |
| #13 [Vesting timeline](review/evidence/screens/task-13-inline-760.png) | When is my next vest? | `ShowMyVesting` |
| #14 [Time away ledger](review/evidence/screens/task-14-inline-760.png) | How much annual leave is available? | `CheckLeaveBalance` |
| #15 [Plan time away](review/evidence/screens/task-15-inline-760.png) | Prepare an annual leave request. | `RequestTimeOff` |
| #16 [Coverage planner](review/evidence/screens/task-16-inline-760.png) | Will the studio have coverage next week? | `CheckTeamCoverage` |
| #17 [Leave decisions](review/evidence/screens/task-17-inline-760.png) | Which leave requests need my decision? | `ReviewTimeOffRequest` |
| #18 [Private HR support](review/evidence/screens/task-18-inline-760.png) | I need to ask HR a private benefits question. | `AskHRForHelp` |
| #19 [Device passport](review/evidence/screens/task-19-inline-760.png) | Does my assigned laptop need attention? | `InspectMyDevice` |
| #20 [Service health](review/evidence/screens/task-20-inline-760.png) | Is guest Wi-Fi down in Redmond? | `CheckServiceHealth` |
| #21 [Guided fixes](review/evidence/screens/task-21-inline-760.png) | How do I reconnect my second screen? | `FindTroubleshootingGuide` |
| #22 [Get technology help](review/evidence/screens/task-22-inline-760.png) | Report the display that flickers on my laptop. | `SubmitITTicket` |
| #23 [Your conversations](review/evidence/screens/task-23-inline-760.png) | What is happening with IT-2048? | `TrackMyITTicket` |
| #24 [Equipment desk](review/evidence/screens/task-24-inline-760.png) | I need a USB-C dock for my desk. | `RequestEquipment` |
| #25 [Equipment decisions](review/evidence/screens/task-25-inline-760.png) | Review the display request assigned to me. | `ReviewEquipmentRequest` |
| #26 [Support trends](review/evidence/screens/task-26-inline-760.png) | Are we resolving tickets faster than they arrive? | `AnalyzeSupportTrends` |
| #27 [Support flow](review/evidence/screens/task-27-inline-760.png) | Which queue holds the most requests? | `TraceSupportFlow` |
| #28 [App access](review/evidence/screens/task-28-inline-760.png) | Request contributor access for my work app. | `RequestAppAccess` |
| #29 [Explore the hub](review/evidence/screens/task-29-inline-760.png) | What can this hub help me do? | `ExploreHubCapabilities` |
| #30 [Employee Hub](review/evidence/screens/task-30-inline-760.png) | Open the employee hub on TechWeb. | `OpenEmployeeHub` |

## Scoped routing checks

Use the index prompt and the scoped paraphrase below in separate conversations. The properties shown apply to the **paraphrase**; do not invent IDs, dates, roles or confirmations for the shorter prompt. Expand keeps the current selection or draft and opens the destination shown. #30 opens the requested landing instead.

The [compiled-host checks](review/evidence/compiled-host.json) dispatched the packaged entries by ID. They did **not** ask a model to route language. For the signed-in test record the original prompt, selected tool and invocation count, extracted properties, actual inline view, Expand destination, and a fresh-prompt reset. Use fixture IDs only. For each collision run one fresh prompt from each side; a dual invocation fails even if the second view looks right.

| # / expected tool | Scoped paraphrase | Scoped arguments | Inline result / Expand destination | Primary exclusion |
| --- | --- | --- | --- | --- |
| 01 `FindCompanyEvents` | Show this month's upcoming London events in my time zone. | `{"officeId":"LON","window":"month"}` | Find an upcoming published event, compare local times, or download its calendar entry.<br>`company/events` | Reserve an accessible meeting room. See #04. |
| 02 `ReadCompanyNews` | Open design story ST-01 in the story desk. | `{"topic":"Design","storyId":"ST-01"}` | Read or save a recent company story by topic or story ID.<br>`company/news` | Find the next town hall. See #01. |
| 03 `MapSalesMarkets` | Map Germany's contribution to our EMEA bookings gap. | `{"marketId":"DE","region":"EMEA"}` | Locate covered markets by bookings volume and signed gap to phased plan.<br>`business/markets` | Explain the change between forecast cuts. See #07. |
| 04 `BookMeetingRoom` | Find a step-free room in London for six at 10 AM for half an hour. | `{"officeId":"LON","capacity":6,"accessible":true,"durationMinutes":30,"startTime":"10:00"}` | Find an eligible room for a local date and time and prepare a reservation for explicit review.<br>`company/room-booking` | Download the calendar entry for a published event. See #01. |
| 05 `FindPublishedGuidance` | Find the published UK travel guidance. | `{"topic":"Travel","locale":"en-GB"}` | Find published workplace resources by topic, title and locale, with their source and version.<br>`company/guidance` | View my private pay statement. See #12. |
| 06 `PrepareGrowthAction` | Draft a German lead qualification follow-up; let me choose evidence before recording it. | `{"marketId":"DE","workstream":"qualification"}` | Prepare and review an owned follow-up on an authorized commercial evidence cut. Recording requires an explicit confirmation.<br>`business/actions` | Explain the lead conversion ratio. See #09. |
| 07 `ExplainForecastMovement` | Show Germany's slippage between the two forecast estimates. | `{"marketId":"DE","driver":"slippage"}` | Explain signed changes between two forecast cuts for the same market and quarter.<br>`business/forecast` | Compare booked-to-date performance with phased plan. See #08. |
| 08 `CompareSalesPerformance` | Compare actual EMEA bookings with the phased regional target this quarter. | `{"period":"current-quarter","region":"EMEA"}` | Compare regional bookings against the phased plan and inspect weighted attainment.<br>`business/scorecard` | Explain why the forward forecast changed. See #07. |
| 09 `TraceLeadConversion` | Trace this quarter's German partner cohort through qualification. | `{"marketId":"DE","period":"current-quarter","channel":"partner"}` | Trace one acquisition cohort from source to opportunity. Compare converted counts and denominators by channel.<br>`business/leads` | Trace unresolved IT requests across service queues. See #27. |
| 10 `ShowRequiredLearning` | Open my inclusive-meetings assignment. | `{"courseId":"inclusive-meetings"}` | Find a personal learning assignment, inspect its due date and record a reviewed section.<br>`hr/learning` | Find the latest published travel policy. See #05. |
| 11 `PrepareBenefitsReview` | What should I check for health benefits in the current planning window? | `{"topic":"health","window":"current"}` | Prepare a benefits checklist and inspect deadlines without electing coverage.<br>`hr/benefits` | Send a private question to HR. See #18. |
| 12 `ViewMyPayslip` | Open my most recent pay statement, masked. | `{"payPeriod":"latest"}` | Inspect a completed personal pay period. Values remain masked until revealed in the view.<br>`hr/pay-statements` | Show future stock vesting. See #13. |
| 13 `ShowMyVesting` | Show my award milestones over the next 90 days. | `{"horizon":"90d"}` | Inspect a personal award schedule, held units and future vesting milestones.<br>`hr/rewards` | Show company share prices or a payslip. See #12. |
| 14 `CheckLeaveBalance` | Explain my current annual leave allowance and pending days. | `{"leaveType":"annual","period":"current"}` | Explain available, booked and pending leave for a selected type and period.<br>`hr/time-balance` | Submit a new leave request. See #15. |
| 15 `RequestTimeOff` | Help me draft annual leave and review the workday calculation. | `{"leaveType":"annual"}` | Prepare a leave date range, check working days and review before explicitly submitting.<br>`hr/time-request` | Approve a colleague's leave request. See #17. |
| 16 `CheckTeamCoverage` | Check next week's staffing for the studio team. | `{"teamId":"studio","week":"next"}` | Inspect available capacity for an eligible team and week without exposing absence reasons.<br>`hr/coverage` | Decide a pending time-off request. See #17. |
| 17 `ReviewTimeOffRequest` | Open pending absence request TA-101 assigned to me. | `{"requestId":"TA-101","status":"pending"}` | Review an assigned colleague's leave request and confirm a decision after inspecting coverage.<br>`hr/leave-decisions` | Request my own time off. See #15. |
| 18 `AskHRForHelp` | Prepare a confidential benefits question for a people adviser. | `{"category":"benefits"}` | Prepare a confidential question, review the recipient and explicitly create a session case.<br>`hr/hr-support` | Browse the general benefits checklist. See #11. |
| 19 `InspectMyDevice` | Show the device passport for my work laptop. | `{"deviceId":"work-laptop","deviceType":"Laptop"}` | Inspect an assigned device, its last check-in, update and refresh window.<br>`tech/devices` | Request an additional device. See #24. |
| 20 `CheckServiceHealth` | Check Redmond's shared guest Wi-Fi service notice. | `{"serviceId":"guest-wifi","officeId":"redmond"}` | Check the current incident and next update for a shared service at a workplace.<br>`tech/service-health` | Show the status of my individual support ticket. See #23. |
| 21 `FindTroubleshootingGuide` | Open the display-link troubleshooting guide for my laptop. | `{"guideId":"display-link","deviceType":"Laptop"}` | Find a reviewed device troubleshooting sequence and work through its steps.<br>`tech/guides` | Open a new break/fix ticket. See #22. |
| 22 `SubmitITTicket` | Prepare a new hardware support ticket for my work laptop after the display-link guide. | `{"deviceId":"work-laptop","guideId":"display-link","category":"Hardware"}` | Prepare a new break/fix ticket with a device, impact and optional guide. Review before submitting.<br>`tech/ticket-intake` | Request new access or track an existing ticket. See #23. |
| 23 `TrackMyITTicket` | Show the conversation and next owner for my open ticket IT-2048. | `{"ticketId":"IT-2048","status":"Open"}` | Inspect an existing personal ticket thread and its next owner.<br>`tech/my-requests` | Report a new device problem. See #22. |
| 24 `RequestEquipment` | Prepare an equipment order for a standard dock. | `{"itemId":"usb-c-dock","category":"Docks"}` | Prepare an equipment order with catalog cost, lead time and rationale; review before confirming.<br>`tech/equipment-request` | Approve a colleague's equipment order. See #25. |
| 25 `ReviewEquipmentRequest` | Check the policy and cost of pending EQ-4102 before I decide. | `{"requestId":"EQ-4102","status":"Pending"}` | Inspect an assigned colleague's order, policy and cost; review and confirm a decision.<br>`tech/equipment-decisions` | Order a new item for myself. See #24. |
| 26 `AnalyzeSupportTrends` | Compare the last four weeks of service intake and resolution. | `{"period":"4w"}` | Compare received and resolved support volumes across weeks for a scoped team.<br>`tech/manager-trends` | Trace the distribution of cases through service queues. See #27. |
| 27 `TraceSupportFlow` | Trace the equipment request cohort through service queues for the last four completed weeks. | `{"period":"4w","category":"equipment"}` | Trace the count of requests from intake through owning queues to outcomes.<br>`tech/manager-flow` | Analyze sales lead conversion. See #09. |
| 28 `RequestAppAccess` | Draft a contributor access request for the app owner to review. | `{"accessLevel":"Contributor"}` | Prepare a least-privilege app access request for resource-owner review; never grant access.<br>`tech/app-access` | Report a broken sign-in. See #22. |
| 29 `ExploreHubCapabilities` | Search the read-only example prompt directory for equipment. | `{"query":"equipment"}` | Browse and preview the 28 operational capabilities without taking action.<br>`isolated/explore` | Open a specific workspace or perform a known task. See #30. |
| 30 `OpenEmployeeHub` | Take me to the technology workspace landing. | `{"landing":"tech"}` | Open the requested authorized workspace landing, not a task, report or capabilities list.<br>`tech/home` | List the kinds of questions the hub can answer. See #29. |

## Bidirectional collisions

Each side's packaged tool description explicitly excludes the named counterpart. For example, an EMEA scorecard is #08, a country contribution map is #03, and a change between projected quarter-end cuts is #07. Asking *why* does not turn a booked figure into a forecast.

| Owner | Separately owned neighboring intents |
| --- | --- |
| 01 FindCompanyEvents | #02 ReadCompanyNews; #04 BookMeetingRoom |
| 02 ReadCompanyNews | #01 FindCompanyEvents |
| 03 MapSalesMarkets | #07 ExplainForecastMovement; #08 CompareSalesPerformance |
| 04 BookMeetingRoom | #01 FindCompanyEvents |
| 05 FindPublishedGuidance | #10 ShowRequiredLearning; #12 ViewMyPayslip |
| 06 PrepareGrowthAction | #07 ExplainForecastMovement; #09 TraceLeadConversion |
| 07 ExplainForecastMovement | #03 MapSalesMarkets; #06 PrepareGrowthAction; #08 CompareSalesPerformance |
| 08 CompareSalesPerformance | #03 MapSalesMarkets; #07 ExplainForecastMovement |
| 09 TraceLeadConversion | #06 PrepareGrowthAction; #27 TraceSupportFlow |
| 10 ShowRequiredLearning | #05 FindPublishedGuidance |
| 11 PrepareBenefitsReview | #18 AskHRForHelp |
| 12 ViewMyPayslip | #05 FindPublishedGuidance; #13 ShowMyVesting |
| 13 ShowMyVesting | #12 ViewMyPayslip |
| 14 CheckLeaveBalance | #15 RequestTimeOff; #16 CheckTeamCoverage |
| 15 RequestTimeOff | #14 CheckLeaveBalance; #16 CheckTeamCoverage; #17 ReviewTimeOffRequest |
| 16 CheckTeamCoverage | #14 CheckLeaveBalance; #15 RequestTimeOff; #17 ReviewTimeOffRequest |
| 17 ReviewTimeOffRequest | #15 RequestTimeOff; #16 CheckTeamCoverage |
| 18 AskHRForHelp | #11 PrepareBenefitsReview |
| 19 InspectMyDevice | #21 FindTroubleshootingGuide; #22 SubmitITTicket; #24 RequestEquipment |
| 20 CheckServiceHealth | #21 FindTroubleshootingGuide; #23 TrackMyITTicket |
| 21 FindTroubleshootingGuide | #19 InspectMyDevice; #20 CheckServiceHealth; #22 SubmitITTicket; #28 RequestAppAccess |
| 22 SubmitITTicket | #19 InspectMyDevice; #21 FindTroubleshootingGuide; #23 TrackMyITTicket; #28 RequestAppAccess |
| 23 TrackMyITTicket | #20 CheckServiceHealth; #22 SubmitITTicket; #26 AnalyzeSupportTrends |
| 24 RequestEquipment | #19 InspectMyDevice; #25 ReviewEquipmentRequest |
| 25 ReviewEquipmentRequest | #24 RequestEquipment |
| 26 AnalyzeSupportTrends | #23 TrackMyITTicket; #27 TraceSupportFlow |
| 27 TraceSupportFlow | #09 TraceLeadConversion; #26 AnalyzeSupportTrends |
| 28 RequestAppAccess | #21 FindTroubleshootingGuide; #22 SubmitITTicket |
| 29 ExploreHubCapabilities | #30 OpenEmployeeHub |
| 30 OpenEmployeeHub | #29 ExploreHubCapabilities |

## No component should run

| Turn | Expected response (zero tools) |
| --- | --- |
| Help with leave. | Clarify balance, personal request, team coverage or an assigned decision. |
| Check my stock. | Clarify public share prices versus personal vesting. |
| Sales outlook? | Clarify actual bookings versus a change between forecast cuts. |
| I can't open Design Studio. | Clarify troubleshooting, reporting a fault or requesting access. |
| Approve that. | Without an eligible selected record, clarify. Never confirm in chat. |
| Why did this number change? | With a visible chart, discuss its cut and denominator; do not reopen it or start an action. |

## Conversation starters (both agents)

| Order | Starter | Exact utterance | Expected owner |
| --- | --- | --- | --- |
| 1 | Find the biggest market gap | Which markets are furthest below bookings plan this quarter? Show me the gaps on a map. | #03 MapSalesMarkets |
| 2 | Trace lead conversion | How many partner leads in Germany became opportunities this quarter? | #09 TraceLeadConversion |
| 3 | Explain a forecast change | What changed in Germany's quarter-end bookings forecast since the last estimate? | #07 ExplainForecastMovement |
| 4 | Find a room for six | Find a step-free meeting room in London for six people next Tuesday at 10 AM for 30 minutes. | #04 BookMeetingRoom |
| 5 | Plan two days away | Help me draft annual leave for next Thursday and Friday. How many working days would that use? | #15 RequestTimeOff |
| 6 | Review pending time off | Show me the pending time-off requests assigned to me so I can check coverage before deciding. | #17 ReviewTimeOffRequest |
| 7 | Read my pay statement | Open my latest completed pay statement and keep the amounts hidden until I choose to reveal them. | #12 ViewMyPayslip |
| 8 | Report a flickering display | My work laptop's display flickers after it wakes up. Help me draft a support ticket. | #22 SubmitITTicket |
| 9 | Review an equipment order | Show me a pending equipment order assigned to me, with its cost and policy, before I decide. | #25 ReviewEquipmentRequest |
| 10 | Find a support bottleneck | Trace equipment requests from intake to resolution. Which queue holds the most? | #27 TraceSupportFlow |
| 11 | Compare regional bookings | Compare EMEA bookings with the phased plan for this quarter. How far ahead or behind are we? | #08 CompareSalesPerformance |
| 12 | Explore what I can ask | Show me the Employee Hub components and an example prompt I can try for each. | #29 ExploreHubCapabilities |

**Discovery:** #29 groups the 28 operational tools by Company & workplace, Leadership business review, Pay & benefits, Time & learning, Tech support and Manager decisions. Seven entries appear per unfiltered page. Expanding a preview reads metadata; Copy copies the example, not an instruction to execute. The last starter opens the directory. Edit the [catalog](config/hub-catalog.json) to change a title, description or example without changing the UI; when extending scope, update category membership, the [host contract](src/hosts/fields.ts) and collision coverage together. Neither the directory nor a new plug-in tool list owns those tasks. Full simulation remains in scope; live HRIS, payroll, CRM, ticketing and grants are not future features silently enabled by setup.
