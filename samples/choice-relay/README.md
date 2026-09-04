# Choice Relay

## Summary

**Choice Relay** demonstrates both directions of the exchange between an SPFx Copilot Component and the Copilot conversation.

**Copilot → SPFx.** A prompt produces typed arguments and a component renders.

**SPFx → Copilot.** A choice made locally in React is posted back into the conversation as a readable user turn, and that turn causes Copilot to invoke a second tool.

**And back again.** With a component already on screen, an ordinary instruction typed in the Copilot composer invokes the tool again and renders the result as a new component. No prompt names a tool or a component.

A teaching sample: two tools, nothing to provision.

### 1. A prompt renders the component

![The situation prompt, and the choice component Copilot rendered from it](./assets/screenshot-1-prompt-to-component.png)

### 2. A choice returns and a second component renders

![The result component showing the selected option and the proposed next action](./assets/screenshot-2-result.png)

### 3. Revise it inside the component

![An adjustment typed into the component's own field, with Revise with Copilot active](./assets/screenshot-3-revise-in-component.png)

### 4. Or type in the Copilot chat, and the component reacts

![A new fact typed in the composer, and the component re-rendered with the revised action](./assets/preview.png)

## Compatibility

![SPFx 1.24.0-beta.2](https://img.shields.io/badge/SPFx-1.24.0--beta.2-yellow.svg)
![Node.js v22](https://img.shields.io/badge/Node.js-v22-green.svg)
![React 17](https://img.shields.io/badge/React-17-blue.svg)
![Fluent UI v9](https://img.shields.io/badge/Fluent%20UI-v9-purple.svg)
![Compatible with SharePoint Online](https://img.shields.io/badge/SharePoint%20Online-Compatible-green.svg)
![Compatible with Microsoft 365 Copilot](https://img.shields.io/badge/Microsoft%20365%20Copilot-Compatible-green.svg)

> SharePoint Copilot Apps and the APIs used by this sample are currently preview capabilities.

## Applies to

- [SharePoint Framework](https://learn.microsoft.com/sharepoint/dev/spfx/sharepoint-framework-overview) 1.24+ Copilot Components
- [Microsoft 365 Copilot extensibility](https://learn.microsoft.com/microsoft-365-copilot/extensibility/)
- A Microsoft 365 tenant with a SharePoint App Catalog

## Contributors

- [Nello D'Andrea](https://github.com/ferrarirosso)

## Version history

| Version | Date | Comments |
| --- | --- | --- |
| 1.0.0 | July 29, 2026 | Initial community sample |

## Prerequisites

- Node.js **>=22.14.0 and <23.0.0**
- A SharePoint App Catalog site
- No Microsoft Graph permissions and no tenant admin approval beyond deploying the package

## Minimal Path to Awesome

- Clone this repository
- Ensure that you are at the solution folder (`samples/choice-relay`)
- Set your tenant so the Workbench URL resolves — `config/serve.json` ships a `{tenantDomain}` placeholder:
  - `export SPFX_SERVE_TENANT_DOMAIN="contoso.sharepoint.com"`
  - or replace the placeholder in `config/serve.json` directly
- In the command line run:
  - `npm install`
  - `npx heft trust-dev-cert`
  - `npm run start`

Production build, test, and package:

```bash
npm run build
```

## Deploy the agent

1. Run `npm run build`, then upload `sharepoint/solution/choice-relay.sppkg` to the tenant App Catalog and enable it for all sites.
2. Use **Sync to Teams** on the catalog entry to synchronise the embedded declarative agent.
3. Install it — from the [Agents page](https://admin.cloud.microsoft/#/agents/all) in the Microsoft 365 admin center, or from the [agent store](https://m365.cloud.microsoft/chat/agentstore).

Synchronising the agent and installing it are separate steps; step 3 is what makes it available to a user.

## Try it

Select **Choice Relay** in a Copilot chat. Four steps — none of them names a tool or a component.

**1. Describe a situation.** The choice component renders.

> I have 30 minutes before my next meeting. Our pilot starts next week. The demo passed, but the data feed is a week late and the participant briefing still isn't written. What could I start now? I'd rather pick one myself before you tell me where to begin.

**2. Pick an option and choose Continue with Copilot.** Nothing to type. The result component renders.

**3. Revise it in the component's own field.**

> Make this a five-minute first step toward the option I selected. Keep both one risk and one mitigation in scope.

**4. Now type in the Copilot chat.** The component reacts.

> One more fact: sample data is available for rehearsal, but it cannot be used to validate customer results. Keep the option I already selected. Revise the next action using this new fact and do not add anything else.

## The two tools

| User intent | Tool | Component output |
| --- | --- | --- |
| Show two to four possible actions and let the user choose | `ChoiceRelayShowChoices` | Question, selectable options, send action |
| Continue from a selected option, or revise its next action | `ChoiceRelayShowNextAction` | Selected option, next action, explanation, revision field |

Copilot creates the typed arguments for both. React owns the local state. The component never calls a language model — it uses the preview Copilot bridge to place a user-role message into the conversation, and Copilot decides what to do with that turn.

## Features

- Two SPFx Copilot Components in one solution, one tool contract each
- Intent-based routing — no prompt names a tool or a component
- Copilot-generated typed input arriving through `this.properties`
- Local React state that Copilot cannot see until the user sends it
- `sendFollowUpMessageAsync` posting a readable message into the conversation
- Revisions from either the component or the normal Copilot composer
- A collapsed **Under the hood** inspector showing tool input and outbound messages
- Inline and fullscreen modes, host-driven light and dark themes, Fluent UI v9

## Help

We do not support samples, but the community is always willing to help. Search the [repository issues](https://github.com/pnp/spfx-copilot-components/issues) or [create a new issue](https://github.com/pnp/spfx-copilot-components/issues/new) with your environment and reproduction steps.

## References

- [Overview of SharePoint Copilot Apps](https://learn.microsoft.com/sharepoint/dev/spfx/copilot/overview-copilot-apps)
- [Build your first SharePoint Copilot App](https://learn.microsoft.com/sharepoint/dev/spfx/copilot/get-started/build-your-first-copilot-app)
- [Fluent UI React v9](https://react.fluentui.dev/)
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp)

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

<img src="https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/samples/choice-relay" />
