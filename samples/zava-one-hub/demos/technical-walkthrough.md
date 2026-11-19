# Technical walkthrough and discussion

Use the [ten-minute technical demo](./technical-demo-10-minutes.md) for the timed path, including a
five-minute cut. This page is the 10-15-minute discussion companion, not a second conflicting script.

| Question | Source to inspect | What to prove |
| --- | --- | --- |
| How does language reach UI? | [Intent matrix](../docs/intent-component-mapping.md), [catalog](../config/zava-capabilities.mjs) | One narrow primary tool, exact intent, stable identity, positive trigger and sibling exclusion |
| Which schemas are real? | [Generator](../scripts/configure-reference-hosts.mjs), adjacent component properties files | Advertised optional fields versus actually consumed inputs; publisher settings do not leak into tools |
| Is business UI copied? | [App dispatcher](../src/shared/components/ZavaOneApp.tsx), [workspace](../src/shared/components/ZavaOneExperiences.tsx) | Shared feature bodies, thin host wrappers, separate composed workspace |
| What survives rerender/expansion? | [Copilot base](../src/shared/hosts/ZavaOneCopilotComponentBase.tsx) | Persistent root during host rerender, but different inline/workspace trees; no exact draft-transfer guarantee |
| What changes after confirmation? | [Session store](../src/shared/services/ZavaSessionStore.ts) | C35 pending-only decision, revision, receipt, subscribed queue, reset; not a source-system write |
| What survives reload? | [Operations/reset](./demo-operations.md#deterministic-reset) | C35 and layout session-storage scope versus other forms' mount-local state |
| What is truly interactive? | [Company experiences](../src/shared/components/CompanyCapabilityExperiences.tsx), [D3 bars](../src/shared/components/DecisionBarChart.tsx), [map](../src/shared/components/OfficeMap.tsx) | Region changes Sales series; office selection matches map/list; exact-value alternatives where implemented |
| How are hosts separated? | [Bundle config](../config/config.json), [Teams guide](../teams/README.md) | 35 SharePoint-only features, three composed Teams-capable wrappers, personal-only distributed Teams apps |
| Where do tools come from? | [Plugin validator](../scripts/validate-generated-ai-plugin.mjs) | Dynamic MCP discovery of 37 source tools; empty static plugin function array |
| Which evidence is current? | [Release readiness](../docs/release-readiness.md), [TODO](../todo.md) | New command results versus recorded package/browser/host evidence and uncompleted external gates |

## Useful follow-up demonstrations

1. Contrast general approvals, personal leave, and manager vacation approval. Never merge C05/C16/C35.
2. Show that a request prompt cannot bypass the C35 review and confirmation.
3. Cancel a decline with no reason; demonstrate the disabled confirmation without changing the queue.
4. Inspect the news-detail follow-up in the local harness, explaining that it records a message rather
   than invoking Copilot. Repeat in authenticated Copilot before claiming a model response.
5. Compare a narrow/light view, a dark view, and one full-screen workspace. Screenshot evidence is not
   screen-reader or forced-colors acceptance.

## Production discussion

Live providers require service ownership, user authorization, privacy/retention, freshness, failure,
idempotency, reconciliation, and authoritative receipts. Session-only fixtures do not supply those
contracts. See [deferred integration](../todo.md#deferred---dynamic-data-and-api-integration);
do not make provider work a hidden prerequisite for the offline presentation.
