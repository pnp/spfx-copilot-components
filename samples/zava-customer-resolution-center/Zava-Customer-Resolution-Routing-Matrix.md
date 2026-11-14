# Zava Customer Resolution - Routing Matrix

Generated from the immutable intent catalog and canonical conversation starters.

| Tool | Operation | Workspace | Full-screen route | Primary prompt |
| --- | --- | --- | --- | --- |
| `TriageCustomerIssue` | submit | my-queue | `my-queue/new-case` | coral |
| `GetPriorityServiceQueue` | information | my-queue | `my-queue/priority` | citrus |
| `ExploreCustomerHealth` | information | customer-360 | `customer-360/overview` | teal |
| `BuildResolutionPlan` | submit | resolution-room | `resolution-room/plan` | teal |
| `StartExpertSwarm` | submit | resolution-room | `resolution-room/swarm` | citrus |
| `DetectServiceIncident` | information | service-operations | `service-operations/incident-detection` | coral |
| `ReviewIncidentResponse` | review | resolution-room | `resolution-room/incident-review` | coral |
| `ReviewServiceRecovery` | review | customer-360 | `customer-360/service-recovery` | citrus |
| `ComposeCustomerUpdate` | submit | customer-360 | `customer-360/communications` | teal |
| `TrackResolutionOutcome` | information | customer-360 | `customer-360/outcomes` | teal |
| `CreateKnowledgeFromResolution` | submit | resolution-room | `resolution-room/knowledge` | teal |
| `ExploreServicePerformance` | information | service-operations | `service-operations/demand` | coral |
| `ExploreRegionalServiceImpact` | information | service-operations | `service-operations/regional-impact` | teal |
| `ExploreRecurringServiceDrivers` | information | service-operations | `service-operations/recurring-drivers` | citrus |
| `DiagnoseCaseEvidence` | information | resolution-room | `resolution-room/diagnostics` | coral |
| `ReviewEntitlementCoverage` | information | customer-360 | `customer-360/entitlement` | citrus |
| `ManageCaseEscalation` | review | my-queue | `my-queue/escalation` | coral |
| `BalanceServiceWorkload` | information | service-operations | `service-operations/workload` | citrus |
| `CoordinateFieldService` | submit | resolution-room | `resolution-room/field-service` | teal |
| `ManageCustomerCommitments` | review | customer-360 | `customer-360/commitments` | citrus |
| `RunServiceQualityReview` | review | service-operations | `service-operations/quality-review` | teal |
| `PlanCustomerWinBack` | submit | customer-360 | `customer-360/win-back` | coral |
| `ExploreAgentCapabilities` | education | education | `education/capabilities` | teal |

## Conversation Starters

- **Create support case:** 42 Alpine House stores cannot activate their handhelds. Create the support case. -> `TriageCustomerIssue`
- **Detect incident:** Are today's activation failures isolated or one emerging incident? -> `DetectServiceIncident`
- **Review incident:** Review today's activation incident candidates and help me decide the next one. -> `ReviewIncidentResponse`
- **Review recovery:** Review pending customer recovery requests, starting with Alpine House. -> `ReviewServiceRecovery`
- **Prepare update:** Draft a French and English update for Alpine House with the next update time. -> `ComposeCustomerUpdate`
- **Explore customer-resolution features:** Explore the customer-resolution features this agent supports. -> `ExploreAgentCapabilities`

## Nearest-Sibling Collision Matrix

These configuration-level cases verify positive ownership and negative boundaries. Final model routing still requires fresh-conversation host rehearsal.

| Prompt | Expected tool | Must not also hit | Boundary |
| --- | --- | --- | --- |
| 42 Alpine House stores cannot activate their handhelds. Create the support case. | `TriageCustomerIssue` | `BuildResolutionPlan`, `DiagnoseCaseEvidence` | Create a new case; do not diagnose or plan an existing case. |
| Build an editable resolution plan for existing case ZCR-1048. | `BuildResolutionPlan` | `TriageCustomerIssue`, `DiagnoseCaseEvidence` | Plan an existing case; do not create intake or investigate hypotheses. |
| Compare the competing hypotheses and contrary evidence for case ZCR-1048. | `DiagnoseCaseEvidence` | `BuildResolutionPlan`, `DetectServiceIncident` | Diagnose one case; do not build the final plan or correlate a cohort. |
| Are today's activation failures isolated or one emerging incident? | `DetectServiceIncident` | `ReviewIncidentResponse` | Analyze similarity; do not make the incident decision. |
| Review today's activation incident candidates and help me decide the next one. | `ReviewIncidentResponse` | `DetectServiceIncident` | Decide an existing candidate; do not rerun exploratory clustering. |
| Review pending customer recovery requests, starting with Alpine House. | `ReviewServiceRecovery` | `ReviewEntitlementCoverage`, `ComposeCustomerUpdate` | Decide a remedy; do not explain coverage or draft the message. |
| Explain what Alpine House's agreement covers for case ZCR-1048. | `ReviewEntitlementCoverage` | `ReviewServiceRecovery` | Explain effective coverage without approving compensation. |
| Draft a French and English update for Alpine House with the next update time. | `ComposeCustomerUpdate` | `ReviewServiceRecovery`, `ManageCustomerCommitments` | Compose a safe message; do not approve recovery or govern the promise ledger. |
| Is customer-service resolution keeping up with demand today? | `ExploreServicePerformance` | `ExploreRegionalServiceImpact`, `ExploreRecurringServiceDrivers` | Answer movement over time; do not route to geography or cause analysis. |
| Which regions have the highest case volume and SLA exposure? | `ExploreRegionalServiceImpact` | `ExploreServicePerformance`, `ExploreRecurringServiceDrivers` | Answer where impact occurs; do not answer trend or recurring cause. |
| Which recurring causes create the most customer effort? | `ExploreRecurringServiceDrivers` | `ExploreServicePerformance`, `ExploreRegionalServiceImpact` | Rank recurring causes; do not answer time trend or geography. |
| Which customer cases need my judgment next? | `GetPriorityServiceQueue` | `ManageCaseEscalation` | Rank the queue; do not move one selected case. |
| Escalate case ZCR-1048 to another queue with acceptance criteria. | `ManageCaseEscalation` | `BalanceServiceWorkload`, `StartExpertSwarm` | Move one case; do not rebalance a team or recruit experts. |
| Where is team capacity creating SLA risk today? | `BalanceServiceWorkload` | `ManageCaseEscalation` | Analyze aggregate capacity; do not escalate one case. |
| Bring named activation specialists into case ZCR-1048 for one decision question. | `StartExpertSwarm` | `ManageCaseEscalation`, `BalanceServiceWorkload` | Recruit expertise without transferring queue ownership. |
| What customer-resolution scenarios can this agent help me with? | `ExploreAgentCapabilities` | `TriageCustomerIssue`, `GetPriorityServiceQueue` | Educate only when no specific operational request is clear. |
| Explore the customer-resolution features this agent supports. | `ExploreAgentCapabilities` | `GetPriorityServiceQueue`, `ExploreServicePerformance` | Browse capabilities, not a case queue or service performance analysis. |
