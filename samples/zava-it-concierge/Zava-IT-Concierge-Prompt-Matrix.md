# Zava IT Concierge prompt and routing matrix

Use these copy/paste prompts for routing rehearsal. Each row is generated from the canonical intent catalog and must resolve to exactly one tool. Prompt-derived properties prefill or filter the component; they never execute a consequential action.

| # | Expected tool | Operation | Lens | Copy/paste prompt | Optional property preview | Full-screen route | Collision boundary |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `MyDeviceStatus` | information | me | Show the status of my Surface device. | `deviceId: string = "ZVA-SRF-1042"` | `me/my-it#device` | Do not use for detailed health metrics or running diagnostics. |
| 2 | `GetDeviceHealth` | information | me | Check the health of my Surface. | `deviceId: string = "ZVA-SRF-1042"` | `me/my-it#health` | Do not use to run diagnostic checks or show warranty inventory. |
| 3 | `GetRefreshEligibility` | information | me | When is my Surface eligible for refresh? | `deviceId: string = "ZVA-SRF-1042"` | `me/my-it#refresh` | Do not use for company refresh-wave planning or browsing replacements. |
| 4 | `ExploreDeviceCatalog` | information | me | Compare Surface devices for hybrid work. | `role: string = "Product manager"; workload: string = "Hybrid collaboration"` | `me/request-workspace#catalog` | Do not use to configure or submit a specific request. |
| 5 | `ConfigureDeviceRequest` | submit | me | Configure a Surface Laptop request with 32 GB of memory. | `model: string = "Surface Laptop"; memoryGb: number = 32; storageGb: number = 512` | `me/request-workspace#configure` | Do not use for catalog comparison or justification drafting. |
| 6 | `DraftDeviceJustification` | submit | me | Draft a business justification for my device request. | `requestId: string = "REQ-2048"; emphasis: string = "Customer workshops"` | `me/request-workspace#justify` | Do not use to configure hardware, compare devices, or preview request cost. |
| 7 | `ReportItIssue` | submit | me | Report that my video calls drop when I undock. | `symptom: string = "Video calls drop when undocked"; severity: string = "medium"` | `me/request-workspace#report-issue` | Do not use when the user asks to run diagnostics or find help content. |
| 8 | `RunDeviceDiagnostics` | information | me | Run diagnostics for my battery drain. | `deviceId: string = "ZVA-SRF-1042"; symptom: string = "Battery drains quickly"` | `me/my-it#diagnostics` | Do not use to submit an issue or show static health metrics only. |
| 9 | `GetMyRequests` | information | me | Show my active IT requests. | `status: string = "active"; requestType: string = "device"` | `me/my-it#requests` | Do not use for approval work, one shipment, or one process stage. |
| 10 | `FindKnowledgeMatch` | information | me | Find help for poor Teams call quality. | `query: string = "Improve Teams call quality while undocked"; product: string = "Surface Laptop"` | `me/my-it#knowledge` | Do not use to run diagnostics, report an issue, or inspect service incidents. |
| 11 | `TrackDeviceShipment` | information | me | Track my Surface shipment. | `orderId: string = "ORD-48291"` | `me/my-it#shipment` | Do not use for all requests or generic process status. |
| 12 | `ReviewDeviceApproval` | review | team | Review device request REQ-2048. | `requestId: string = "REQ-2048"` | `team/team-it#approval` | Do not use for a queue, policy exception, cost-only preview, or delegation. |
| 13 | `GetApprovalQueue` | review | team | Show my pending approval queue. | `requestType: string = "all"; status: string = "pending"` | `team/team-it#approvals` | Do not use to decide one named request or exception. |
| 14 | `GetTeamBudget` | information | team | Show this quarter's team IT budget including pending requests. | `period: string = "current-quarter"; includePending: boolean = true` | `team/team-it#budget` | Do not use for one request cost or company-wide spend variance. |
| 15 | `GetTeamAssets` | information | team | Show aging Surface devices on my team. | `department: string = "Product"; risk: string = "all"` | `team/team-it#assets` | Do not use for company fleet health or one employee device. |
| 16 | `PreviewRequestCost` | information | team | Preview the budget impact of REQ-2048. | `requestId: string = "REQ-2048"` | `team/team-it#cost-impact` | Do not use for total team budget, company spend, or approving the request. |
| 17 | `ReviewPolicyException` | review | team | Review policy exception EXC-0317. | `exceptionId: string = "EXC-0317"` | `team/team-it#exceptions` | Do not use for a standard device approval, approval queue, or cost-only preview. |
| 18 | `GetTeamTicketTrend` | information | team | Show my team's six-month IT ticket trend. | `period: string = "six-months"; category: string = "all"` | `team/team-it#tickets` | Do not use for company deflection or top issue ranking. |
| 19 | `DelegateApproval` | submit | team | Delegate approval for REQ-2048 to Alex Wilber. | `requestId: string = "REQ-2048"; delegateEmail: string = "alex.wilber@zava.example.com"` | `team/team-it#delegate` | Do not use to approve, decline, or list requests. |
| 20 | `GetFleetHealth` | information | company | Show fleet health across all regions. | `region: string = "all"; department: string = "all"` | `company/control-center#fleet-health` | Do not use for device age cohorts, refresh scheduling, team assets, or one device. |
| 21 | `GetDeviceAgeDistribution` | information | company | Show devices approaching the four-year refresh threshold. | `region: string = "all"; thresholdYears: number = 4` | `company/fleet-analytics#device-age` | Do not use for overall fleet health or scheduling refresh waves. |
| 22 | `GetTicketDeflectionTrend` | information | company | Show the six-month ticket deflection trend. | `period: string = "six-months"; channel: string = "all"` | `company/control-center#deflection` | Do not use for one team trend or issue-category ranking. |
| 23 | `GetTopItIssues` | information | company | What issues account for most tickets this quarter? | `period: string = "quarter"; region: string = "all"` | `company/fleet-analytics#pareto` | Do not use for deflection rate, one team trend, or service status. |
| 24 | `GetServiceHealth` | information | company | Show current Microsoft 365 service health. | `service: string = "all"; region: string = "all"` | `company/control-center#services` | Do not use to correlate raw signals into a major incident or report a user issue. |
| 25 | `GetLicenseReclaim` | information | company | Show licenses inactive for more than 90 days. | `inactivityDays: number = 90; department: string = "all"` | `company/control-center#licenses` | Do not use for hardware spend or team budget. |
| 26 | `GetItSpendBridge` | information | company | Explain this quarter's IT spend variance. | `quarter: string = "current"; department: string = "all"` | `company/control-center#spend` | Do not use for a team budget, one request cost, or license reclaim. |
| 27 | `PlanRefreshWaves` | information | company | Plan refresh waves with capacity of 42 devices per week. | `region: string = "all"; maxDevicesPerWeek: number = 42` | `company/fleet-analytics#refresh-waves` | Do not use for one device eligibility or age distribution. |
| 28 | `CorrelateMajorIncident` | information | company | Correlate signals for major incident INC-7091. | `incidentId: string = "INC-7091"; service: string = "Microsoft Teams"` | `company/control-center#incident-correlation` | Do not use for the general service-health board or user issue submission. |
| 29 | `GetProcessJourney` | information | contextual | Show the process journey for REQ-2048. | `processId: string = "REQ-2048"; processType: string = "device-request"` | `workflow/process-journey` | Do not use to list all requests or track carrier delivery specifically. |
| 30 | `GenerateItBrief` | information | contextual | Generate a company IT brief focused on risks and decisions. | `scope: string = "company"; focus: string = "risks and decisions"` | `brief/current-scope` | Do not use for a specific metric or action. |
| 31 | `ExploreAgentCapabilities` | education | education | Explore what Zava IT Concierge can do. | `query: string = "Surface refresh"; lens: string = "all"` | `education/capabilities` | Do not use when the user asks for any specific IT task. |

## Conversation starters

The agent exposes six deliberately non-overlapping starters. The final starter always opens capability exploration.

| # | Title | Prompt | Expected tool |
| ---: | --- | --- | --- |
| 1 | Submit a support ticket | Submit an IT support ticket because my video calls drop when I undock. | `ReportItIssueTool` |
| 2 | Diagnose my Surface | Run device diagnostics for battery drain on my Surface. | `RunDeviceDiagnosticsTool` |
| 3 | Review approval queue | Show all pending requests awaiting my approval. | `GetApprovalQueueTool` |
| 4 | Inspect fleet health | Show company fleet health by region and department. | `GetFleetHealthTool` |
| 5 | Correlate an incident | Correlate signals for major incident INC-7091. | `CorrelateMajorIncidentTool` |
| 6 | Explore capabilities | Explore what Zava IT Concierge can do. | `ExploreAgentCapabilitiesTool` |

## Rehearsal result

- Record tenant prompt-routing results separately from the deterministic local catalog check.
- A passing local check proves catalog, schemas, generated manifests, starters, and this matrix agree; it does not claim authenticated model routing.
