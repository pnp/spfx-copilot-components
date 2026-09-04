# M365 Service Health - Live Microsoft 365 Service Health in Copilot Chat

## Summary

**M365 Service Health** is an SPFx **Copilot Component** that answers "is Microsoft 365 working?" without leaving the chat. A declarative agent ("M365 Service Health Agent") calls it as a tool, and it renders a live, interactive service health view inline in the conversation or as a fullscreen overview, reading real data from the Microsoft Graph service health API (`/admin/serviceAnnouncement`).

From the rendered UI, the signed-in user can:

- See the current status of every Microsoft 365 service, with the ones needing attention highlighted first
- Search services by name and filter to only those with active advisories or incidents
- Ask about a specific service in natural language — nicknames and abbreviations (e.g. "Teams", "SPO") are resolved automatically
- Drill into a service to read its active and recently resolved issues
- Open an issue to see who is affected and Microsoft's latest updates
- Switch between a compact inline card and a fullscreen overview

![Main View](assets/main%20page.png)
![Component rendering](assets/copilot_component_rendering.png)
![Fullscreen service health overview](assets/full%20page%20view.png)

## Compatibility

![SPFx 1.24.0-beta.2](https://img.shields.io/badge/SPFx-1.24.0--beta.2-green.svg)
![Node.js v22](https://img.shields.io/badge/Node.js-v22-green.svg)
![Compatible with SharePoint Online](https://img.shields.io/badge/SharePoint%20Online-Compatible-green.svg)
![Compatible with Microsoft 365 Copilot](https://img.shields.io/badge/Microsoft%20365%20Copilot-Compatible-green.svg)

## Applies to

- [SharePoint Framework](https://learn.microsoft.com/sharepoint/dev/spfx/sharepoint-framework-overview) 1.24+ (Copilot Component)
- [Microsoft 365 Copilot extensibility](https://learn.microsoft.com/microsoft-365-copilot/extensibility/)
- [Microsoft 365 tenant](https://learn.microsoft.com/sharepoint/dev/spfx/set-up-your-development-environment) with the SharePoint App Catalog

> Get your own free development tenant by subscribing to the [Microsoft 365 developer program](https://aka.ms/m365/devprogram)

## Contributors

- [Harminder Singh](https://github.com/HarminderSethi)

## Version history

| Version | Date | Comments |
| ------- | ----------------- | --------------- |
| 1.0.0.1 | 2026-07-31 | Initial release |

## Prerequisites

This solution reads live service health data from Microsoft Graph, so beyond the usual SPFx tenant setup it needs the Microsoft Graph permission declared in [`config/package-solution.json`](./config/package-solution.json) approved by a tenant admin:

| Permission | Why it's needed |
| ---------- | ---------------- |
| `ServiceHealth.Read.All` | Read Microsoft 365 service health overviews and issue details from `/admin/serviceAnnouncement`. |

After deploying the `.sppkg` to the App Catalog, a tenant admin must approve this once in the **SharePoint Admin Center → Advanced → API access**. Any time a requested scope changes, it needs to be re-approved there before it takes effect.

## Minimal path to awesome

- Clone this repository
- From your command line, change your current directory to this solution's root
- In the command line run:
  - `npm install`
  - `npm run start`
- Since SPFx Copilot Components can't be tested in the local workbench, `npm start` serves against a hosted tenant workbench
- Package and deploy the solution to your **App Catalog**, approve the API permission above, then invoke the **M365 Service Health Agent** in Microsoft 365 Copilot

Production build, test, and package:

```bash
npm run build
```

Other build commands can be listed using `heft --help`.

## Features

M365 Service Health demonstrates how to surface live tenant service health inside the Copilot canvas using an SPFx Copilot Component, reading real data rather than mock content.

This sample illustrates the following concepts:

- **Copilot Component UX** — a `CopilotComponent` (`copilotType: "Ux"`) exposed as a tool (`M365ServiceHealthCopilotTool`) that a declarative agent can call, rendering its own React UI inside the Copilot host.
- **Zod-based tool properties schema** — tool arguments (`mode`, `serviceName`) are defined with Zod, validated with `superRefine`, and exported as JSON Schema via `zod-to-json-schema` for the Copilot host.
- **Display-mode-aware rendering** — a single React component renders a compact inline card or a fullscreen overview based on the host-advertised display mode, and can request a mode switch through the Copilot bridge.
- **Brokered SSO to Microsoft Graph** — service health overviews and issues are read through the SPFx-brokered `MSGraphClientV3` client, with no manual token handling.
- **Resilient Graph access** — automatic retry with exponential backoff on throttling and transient failures (429/5xx), with errors classified (unauthenticated, forbidden, throttled, network) so the UI can respond appropriately.
- **Natural-language service resolution** — user wording like "Teams" or "SPO" is mapped to the matching Microsoft 365 service automatically.
- **Theme awareness** — light/dark theme driven by the Copilot host context, using Fluent UI v9 theme tokens throughout.
- **Graceful degradation** — if the React tree fails to render, a plain-markup fallback still communicates the requested service and the error.

## Help

If you encounter any issues using this solution, please open an issue in this repository.

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

<img src="https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/samples/m365-service-health" />
