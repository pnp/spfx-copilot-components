# 90-second keynote

## Product truth

Zava One turns a focused employee question into a useful Copilot Component, then composes the same
shared React capability into SharePoint and Teams workspaces. Every action in this flow is fixture-only
and session-local.

## Before the clock

- Complete the [preflight and reset](./demo-operations.md#preflight).
- Open Microsoft 365 Copilot with the Zava One agent and keep the local fallback tab ready.
- Confirm the C35 queue shows four requests awaiting decision.

## Script

| Time | Say and do | Expected result |
| --- | --- | --- |
| 0:00 | Select **Catch up on Zava** or ask **What's new across Zava this week?** | `ShowCompanyNews` opens `company/news` with current fictional stories and source metadata. |
| 0:12 | Say: "That is the company view. Now show vacation requests waiting for my decision." | `ReviewVacationRequests` opens `personal/vacation-approvals` with four pending requests. |
| 0:25 | Open Johanna Lorenz. Point out requested dates, projected balance, and team coverage. | The detail state uses the same canonical request shown in the queue. |
| 0:38 | Select **Review decision**, then **Approve vacation request**. | A simulated receipt shows `ZAVA-LEAVE-1043` and explicitly says the update is session-only. |
| 0:52 | Return to the updated list. | Pending count changes from four to three and processed count changes from two to three. |
| 1:02 | Select **Explore global offices** or ask **Show me Zava offices around the world.** | `ShowOfficeDetails` opens `company/offices` with a selectable map and equivalent office list. |
| 1:16 | Select **Explore Zava One**. | `ExploreAgentCapabilities` shows all 35 operational scenarios and safe prompts. |
| 1:28 | Close with: "One product, focused answers, shared experiences, and review before action." | Stop before introducing tenant or production claims. |

## Screenshot checkpoints

- [Company News](../assets/screenshot-company-news.png)
- [Vacation detail](../assets/screenshot-vacation-detail.png)
- [Decision review](../assets/screenshot-vacation-decision.png)
- [Simulated receipt](../assets/screenshot-vacation-receipt.png)
- [Updated queue](../assets/screenshot-vacation-updated-list.png)
- [Office map](../assets/screenshot-office-map.png)
- [Capability explorer](../assets/preview.png)

## Offline fallback

If Copilot routing or tenant authentication is unavailable, use the matching URLs in
[Demo operations](./demo-operations.md#offline-fallback). State the limitation once, then demonstrate
the same React experience and product truth in the local harness.