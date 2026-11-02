# Zava Revenue Deal Room routing matrix

Generated from configured component manifests and the canonical starter configuration. Tool schemas prefill or scope experiences; they never confirm consequential actions.

## Tool boundaries

| Tool | Positive use boundary | Nearest exclusion |
| --- | --- | --- |
| `BuildAccountBrief` | Use for sourced account context and whitespace. | Do not use for one meeting. |
| `QualifyOpportunity` | Use for opportunity qualification and stage judgment. | Do not use for forecast commit. |
| `MapBuyingCommittee` | Use for buyer roles, influence, stance, and access. | Do not use for contact lists. |
| `GetDealRisk` | Use for evidence-ranked risk on one deal. | Do not use for aggregate pipeline risk. |
| `PrepareCustomerMeeting` | Use for preparing one upcoming customer meeting. | Do not use for meeting results. |
| `BuildMutualActionPlan` | Use for buyer and seller close commitments. | Do not use for internal task lists. |
| `ReviewMeetingCommitments` | Use for reviewing proposed meeting updates. | Do not use for meeting preparation. |
| `ShapeSolutionProposal` | Use for an outcome-led solution proposal. | Do not use for pricing approval. |
| `SimulateCommercialOffer` | Use for commercial scenario modeling. | Do not use to approve exceptions. |
| `ReviewDealException` | Use for a governed commercial exception decision. | Do not use for scenario modeling. |
| `InspectForecastCommit` | Use for manager forecast-category decisions. | Do not use for seller qualification. |
| `ExplorePipelineQuality` | Use for aggregate pipeline quality and intervention. | Do not use for one deal. |
| `DiscoverAccountOpportunity` | Use for account or country opportunity discovery and separate demo market-spend analysis. | Do not create a lead automatically or claim headquarters value is rollout revenue. |
| `ResearchCompetitivePosition` | Use for evidence-grounded competitive strategy. | Do not invent competitor claims. |
| `CoachDealStrategy` | Use for explainable deal coaching plays. | Do not make a forecast decision. |
| `CreateExecutiveEngagementPlan` | Use for reviewed executive engagement planning. | Do not contact customers. |
| `TrackMeetingFollowUp` | Use for evidence-backed commitment follow-up. | Do not infer completion. |
| `BuildValueCase` | Use for customer outcome and payback modeling. | Do not set commercial price. |
| `ReviewProposalReadiness` | Use for proposal evidence and readiness decisions. | Do not write the proposal. |
| `PlanCustomerSuccessHandoff` | Use for reviewed sold-outcome handoff. | Do not close the opportunity. |
| `ExploreAgentCapabilities` | Use for discovering revenue scenarios. | Do not use for a specific request. |
| `SubmitDealRequest` | Use for guided inline deal intake, economics, evidence and explicit session submission. | Do not write to CRM or grant approval. |
| `ReviewDealApproval` | Use for the inline demo approval inbox, exact request detail, independent staged decisions and audit receipts. | Do not approve without authority and explicit confirmation. |
| `ExploreDealAttention` | Use for a filtered chart-based catalog of important deals needing attention and inline detail drill-down. | Do not treat seller-unweighted value as a predicted loss or make approvals. |
| `GetMyRevenuePriorities` | Use for an illustrative owned-book revenue brief, top next actions, pipeline outlook and close-plan status charts. | Do not imply live personal assignments, approve requests or contact customers. |
| `ExplorePipelineFlow` | Use for an imaginary pipeline Sankey: regional value, buyer readiness and next actions with node/ribbon details. | Do not treat fictional allocations as CRM totals or predicted conversion. |
| `ExploreApprovalFlow` | Use for an imaginary approval Sankey: intake batches, current reviewer stages and stage outcomes. | Do not imply stored request status, skip independent reviews or equate stage and final approval. |

## Conversation starters

| # | Title | Prompt | Expected inline component |
| ---: | --- | --- | --- |
| 1 | Pipeline value flow | Show an imaginary pipeline Sankey from regions through buyer readiness to next actions. | `ExplorePipelineFlow` |
| 2 | World opportunity map | Show a world map of country opportunity value for the current quarter across all regions. | `DiscoverAccountOpportunity` |
| 3 | Approval value flow | Show an imaginary approval Sankey from submitted batches through current reviewer stages to stage outcomes. | `ExploreApprovalFlow` |
| 4 | Submit a deal | Help me submit an evidence-backed deal for commercial review. | `SubmitDealRequest` |
| 5 | Deal approvals | Show the deals awaiting independent commercial approval. | `ReviewDealApproval` |
| 6 | My revenue priorities | Show my top revenue priorities, pipeline status and next actions. | `GetMyRevenuePriorities` |
| 7 | Map the buying committee | Map the buying committee for Contoso and show missing buyer access. | `MapBuyingCommittee` |
| 8 | Model a commercial offer | Model a Contoso offer with 1,000 users, 24 months, 8% discount, $150,000 services and 65% seller probability. | `SimulateCommercialOffer` |
| 9 | World recorded-spend map | Show recorded demo spend by country for the current quarter. | `ExplorePipelineQuality` |
| 10 | Build a mutual action plan | Build a mutual action plan for Contoso with owned dependencies. | `BuildMutualActionPlan` |
| 11 | Build the customer value case | Build the Contoso value case with editable assumptions and payback. | `BuildValueCase` |
| 12 | Explore capabilities | Explore what the Revenue Deal Room agent can do. | `ExploreAgentCapabilities` |

## Sibling collision rehearsal

| Boundary | Prompt A | Expected A | Prompt B | Expected B |
| --- | --- | --- | --- | --- |
| Account context vs meeting prep | Build a brief for the Contoso expansion. | `BuildAccountBrief` | Prepare me for the Contoso steering meeting. | `PrepareCustomerMeeting` |
| Qualification vs forecast | Should we pursue the Contoso expansion? | `QualifyOpportunity` | Should Contoso remain in commit for Q4? | `InspectForecastCommit` |
| Deal risk vs pipeline quality | What can derail the Contoso signature? | `GetDealRisk` | Show pipeline quality for this quarter. | `ExplorePipelineQuality` |
| Scenario vs exception decision | Model a three-year ramped offer for Contoso. | `SimulateCommercialOffer` | Review the Contoso payment-term exception. | `ReviewDealException` |
| Proposal creation vs readiness | Shape the Contoso solution proposal. | `ShapeSolutionProposal` | Review the Contoso proposal readiness. | `ReviewProposalReadiness` |
| Inline attention vs aggregate pipeline | Show important deals needing attention and let me inspect one inline. | `ExploreDealAttention` | Show pipeline quality for this quarter. | `ExplorePipelineQuality` |
| Deal submission vs independent approval | Help me submit an evidence-backed deal. | `SubmitDealRequest` | Review submitted demo request ZM-1001. | `ReviewDealApproval` |
| Fictional pipeline flow vs catalog quality | Show an imaginary pipeline Sankey from regions to buyer readiness and actions. | `ExplorePipelineFlow` | Show pipeline quality for this quarter. | `ExplorePipelineQuality` |
| Fictional approval flow vs stored decisions | Show an imaginary approval Sankey through current reviewer stages. | `ExploreApprovalFlow` | Review stored demo request ZM-1001. | `ReviewDealApproval` |

## Host validation notes

- Verify selected tool and extracted properties in an authenticated Copilot tenant.
- Verify Expand lands in the tool's configured lens and preserves supported context.
- Verify a fresh prompt resets defaults while a passive host rerender preserves local interaction state.
- Local source validation proves catalog metadata alignment, not model routing behavior.
