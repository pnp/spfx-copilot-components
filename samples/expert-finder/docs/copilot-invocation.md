# Invoke Expert Finder in Copilot

Install and synchronize the baseline agent using the [deployment guide](deployment.md). Open **Expert Finder** in Microsoft 365 Copilot and start a new conversation. Users do not need to name the tool: the declarative agent chooses `ExpertFinderTool` and supplies a canonical `skill` argument.

## Example prompts

| Prompt | Expected tool behavior | Fictional-data result count |
| --- | --- | --- |
| Who can help me with SPFx? | `skill: SPFx` | 6 |
| Find a SharePoint Framework developer. | `skill: SPFx` | 6 |
| Who can help me build a Copilot agent? | `skill: Copilot` | 8 |
| Find a database expert. | `skill: DB` | 1 |
| Find someone who knows Spanish. | `skill: Spanish` | 0; empty state |
| Find an expert. | Ask which skill | No search yet |
| Who can help with Azure Functions? | Explain the supported skills | No invented match |

Counts apply only when the root `Experts` list returns HTTP 404 and mocks are selected. A SharePoint-backed search uses the accessible list rows. Each invocation has one skill; there is no in-app skill selector. Name, department and role filters refine the current result set locally.

Copilot Workbench can supply `{"skill":"SPFx"}` directly. That verifies the component's argument/rendering path, rather than natural-language tool selection. Use Copilot developer diagnostics where available to inspect the selected tool and arguments. After deployment changes, allow discovery-cache propagation and test in a new conversation.

## Introduce me

1. Search for a supported skill and open fullscreen.
2. Select **Introduce me** on one expert card.
3. Wait for the handoff. Copilot writes the introduction in the existing conversation.
4. Review or copy the draft yourself; the action sends no Teams message.

The draft is requested in the first person, addressed to the selected expert, with exactly three relevant numbered questions. It should use the latest human request's language where available. Fictional profiles produce an explicitly illustrative draft.

This is a component action, not another tool. It publishes only the selected expert's name, job title, department, skill and summary, plus a purpose and fictional-profile marker. Emails, photos, calendars and other experts are excluded. The component awaits `updateModelContextAsync` before calling `sendFollowUpMessageAsync`; filters and rendering alone make neither call.

Context is labeled as data. Drafting instructions belong in the agent and follow-up, while profile fields remain untrusted input. Copilot should ground the draft in that profile without searching again or invoking an external action. See the [code walkthrough](code-walkthrough.md#selected-profile-context-and-follow-up) for the implementation.

The UI blocks overlapping requests across cards, checks host error acknowledgements and handles timeout and cancellation. An acknowledgement is not the generated draft: verify the actual conversation result and that the chat remains available. The author has reported this flow working in deployed Copilot; the [validation guide](validation.md#reported-deployed-checks) distinguishes that report from checks to repeat in another tenant.
