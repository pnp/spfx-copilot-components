# Work IQ Answers

## Summary

The Work IQ REST reference documents the Chat API as text-only. Work IQ Answers sends the user's question to the [Work IQ Chat API](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/rest/overview) and renders the response as structured UI instead:

- People, meetings, and files Work IQ tags inline in its answer become typed, clickable chips.
- Citations are grouped into a source panel by type (meetings, files, people), each row linking into Teams, SharePoint, or the person's profile.
- Footnote markers become superscripts that jump to the source they reference.
- A sensitivity label badge appears when the answer draws on labelled content.
- Follow-up questions reuse the same `conversationId`, so multi-turn works and the turn counter climbs.

Unlike the other samples in this repository, which use mocked data or call Microsoft Graph, this one calls Work IQ directly. That also demonstrates the SPFx pattern for a non-Graph, Entra-secured API: delegated auth, no middle tier, no client secret.

![Work IQ Answers rendering a cited answer with entity chips and a grouped source panel](assets/preview.png)

## Compatibility

![SPFx 1.24.0-beta.2](https://img.shields.io/badge/SPFx-1.24.0--beta.2-green.svg)
![Node.js v22](https://img.shields.io/badge/Node.js-v22-green.svg)
![Compatible with SharePoint Online](https://img.shields.io/badge/SharePoint%20Online-Compatible-green.svg)
![Compatible with Microsoft 365 Copilot](https://img.shields.io/badge/Microsoft%20365%20Copilot-Compatible-green.svg)
![Runs without a tenant](https://img.shields.io/badge/Local%20Workbench-Compatible-green.svg)

> Built and tested against Node.js v22.18.0 and SPFx 1.24.0-beta.2 (the Copilot Components beta).

## Applies to

- [SharePoint Framework](https://learn.microsoft.com/sharepoint/dev/spfx/sharepoint-framework-overview)
- [Microsoft 365 Copilot extensibility](https://learn.microsoft.com/microsoft-365-copilot/extensibility/)
- [Microsoft Work IQ APIs](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/)
- [Microsoft 365 tenant](https://learn.microsoft.com/sharepoint/dev/spfx/set-up-your-development-environment)

> Get your own free development tenant by subscribing to the [Microsoft 365 developer program](https://aka.ms/m365/devprogram)

## Contributors

- [Ramin Ahmadi](https://github.com/AhmadiRamin)

## Version history

| Version | Date            | Comments        |
| ------- | --------------- | --------------- |
| 1.0     | August 21, 2026 | Initial release |

## Prerequisites

The sample runs with no prerequisites in mock mode, which is how it ships. `useMock` is `true` by default and the canned responses exercise the full UI. Read this section when you're ready to point it at your tenant.

Going live needs one thing no other sample in this repository needs: a tenant admin has to grant a delegated permission to a non-Graph API.

### 1. Work IQ must be set up in the tenant

The Work IQ service principal has to exist in your tenant before any permission can be granted against it. Follow [Set up the Work IQ API](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/) first. Work IQ API usage is billed through [Copilot Credits](https://learn.microsoft.com/microsoft-365/copilot/usage-based-billing-overview-copilot-credits), which matters if a component fires on every question across a department.

### 2. The permission request

[`config/package-solution.json`](config/package-solution.json) already declares it:

```json
"webApiPermissionRequests": [
  {
    "resource": "Work IQ",
    "scope": "WorkIQAgent.Ask"
  }
]
```

`WorkIQAgent.Ask` is the only permission the Chat API accepts, and it's delegated (work or school account) only — there's no application-only equivalent and no higher-privileged alternative. Every call runs as the signed-in user and is permission-trimmed to what that person can already see.

SPFx matches `resource` against the service principal's display name and [rejects an object ID](https://learn.microsoft.com/sharepoint/dev/spfx/use-aadhttpclient#request-permissions-to-an-entra-id-application). `Work IQ` is the name the service reports for itself; its OAuth protected-resource metadata returns `"resource_name": "Work IQ"`. If the permission request doesn't appear in your tenant under that name, confirm the actual display name first:

```powershell
Get-MgServicePrincipal -Filter "appId eq 'fdcc1f02-fc51-4226-8753-f668596af7f7'" |
  Select-Object DisplayName, AppId
```

That `appId` is Work IQ's, taken from the `WWW-Authenticate` challenge the API returns to an unauthenticated request.

### 3. Admin consent

Deploy the `.sppkg` to the app catalog, then approve the request in **SharePoint admin center → Advanced → API access**. Or from PowerShell:

```powershell
Get-SPOTenantServicePrincipalPermissionRequests
Approve-SPOTenantServicePrincipalPermissionRequest -RequestId <Guid>
```

Permissions granted this way apply tenant-wide, not just to this solution. See [Considerations](https://learn.microsoft.com/sharepoint/dev/spfx/use-aadhttpclient#considerations).

### 4. Flip the switch

In [`WorkIQAnswersCopilotComponent.tsx`](src/copilotComponents/workIQAnswers/WorkIQAnswersCopilotComponent.tsx):

```ts
const USE_MOCK: boolean = false;
```

No UI code is touched — mock and live responses go through the same extraction code.

## Minimal path to awesome

- Clone this repository (or [download this solution as a .ZIP file](https://pnp.github.io/download-partial/?url=https://github.com/pnp/spfx-copilot-components/tree/main/samples/work-iq-answers) then unzip it)
- From your command line, change your current directory to the directory containing this sample (`work-iq-answers`, located under `samples`)
- In the command line run:
  - `npm install`
  - `npm run start`
- Open the Copilot Workbench at `https://{your-tenant}.sharepoint.com/_layouts/copilotworkbench.aspx`, add the **Work IQ Answers** component, and ask it one of the conversation starters

To build the package and run the unit tests:

```bash
npm run build
```

To run just the tests:

```bash
npx heft test
```

## Features

### Turning text into UI

Work IQ's answer `text` is markdown with citation markup embedded in it. Real tenant responses send it as plain numbered links:

```text
I found **9 meetings scheduled in the next week**. [1](https://teams.microsoft.com/l/meeting/details?eventId=...#a10f2c)[2](...)[3](...)
```

The Work IQ REST reference documents a different shape: entity tags plus `[^n^]` footnotes.

```text
- **Meeting**: <Event>Contoso Engineering Standup</Event>
- **Organizer**: <Person>John Doe</Person>[^1^]
```

Rendered as-is, either shape leaks its own markup to the user. [`core/entityParser.ts`](src/copilotComponents/workIQAnswers/core/entityParser.ts) parses both into blocks and typed inline segments (`citationLink` for the real shape, `entity`/`footnote` for the documented one), and the React layer renders each segment kind with visible spacing between adjacent citation markers. Nothing is passed to `dangerouslySetInnerHTML`; the parser output is plain data.

### Grouping and deep links

Neither shape labels a source as a meeting, a file, or a person, so `core/citations.ts` classifies by the deep-link shape (`teams.microsoft.com/l/meeting/…`, `*.sharepoint.com/…`, `office.com/search?q=…`). Anything unrecognised lands in **Other** instead of being dropped. Links open through `copilotBridge.openLinkAsync`, not `window.open`, since the component runs in a sandboxed iframe.

### Multi-turn

`startConversation()` is called once and the id is held for the life of the component instance. Every follow-up posts to `/conversations/{id}/chat` with that id, and the `turnCount` badge reflects the server's own counter.

## Help

If you encounter any issues using this sample, [create a new issue](https://github.com/pnp/spfx-copilot-components/issues/new).

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

<img src="https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/samples/work-iq-answers" />
