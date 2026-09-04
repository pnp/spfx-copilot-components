# Release readiness board

![SPFx](https://img.shields.io/badge/version-1.24.0--beta.2-yellow.svg) ![Node](https://img.shields.io/badge/Node.js-22.x-339933.svg) ![React](https://img.shields.io/badge/React-17-61DAFB.svg) ![Modes](https://img.shields.io/badge/Modes-inline%20%2B%20fullscreen-5B3EE8.svg)

## Summary

**Release readiness board** is a **SharePoint Copilot App** built as an SPFx 1.24 **Copilot Component**. It helps delivery teams track release status directly inside Microsoft 365 Copilot with:

- an inline health snapshot (completion, blockers, overdue checks, risk), and
- a full-screen board for release-level filtering and checklist execution.

The sample is **mock-first** and self-contained: it ships with realistic release data and no external dependencies. You can deploy and demo immediately, then swap mock data for live services later.

### Inline

![Inline screenshot](./assets/preview.png)

### Full-screen

![Full-screen screenshot](./assets/screenshot-fullscreen.png)

## Applies to

- [SharePoint Framework](https://aka.ms/spfx) 1.24+ (Copilot Component)
- [Microsoft 365 Copilot](https://www.microsoft.com/microsoft-365/copilot)
- [Microsoft 365 tenant](https://docs.microsoft.com/sharepoint/dev/spfx/set-up-your-developer-tenant) with SharePoint App Catalog

## Solution

| Solution | Author(s) |
| -------- | --------- |
| release-readiness-board | [Valeras Narbutas](https://github.com/ValerasNarbutas) |

## Version history

| Version | Date | Comments |
| ------- | ---- | -------- |
| 1.0 | August 2, 2026 | Initial release |

## Prerequisites

- Node.js >=22.14.0 <23.0.0
- A Microsoft 365 tenant with SPFx 1.24 (preview) enabled
- SharePoint App Catalog site

## Minimal Path to Awesome

- Clone this repository.
- Go to this sample:
  - `cd samples/release-readiness-board`
- Run:
  - `npm install`
  - `npm run start`

Production build and package:

```bash
npm run build
```

The package will be created at:
`sharepoint/solution/release-readiness-board.sppkg`

## Features

This sample illustrates:

- SPFx Copilot Component with `inline` + `fullscreen` display modes.
- Tool parameter handling via Zod schema (`releaseName`, `owner`, `showBlockedOnly`, `useMock`, `dataServiceUrl`).
- Release-level and owner-level filtering in fullscreen mode.
- Interactive check status updates (`pending`, `done`, `blocked`) and computed release risk.
- Follow-up posting to Copilot chat from inside the component.

## Switch to real data (Azure DevOps-friendly setup)

The sample is mock-first by default. To use real data, expose a lightweight API adapter that maps your source system (Azure DevOps, GitHub, Jira, etc.) to the expected payload and then invoke the tool with:

- `useMock=false`
- `dataServiceUrl=https://<your-api>/api/release-readiness`

### Expected API response

You can return either a raw array or an object with `releases`:

```json
{
  "releases": [
    {
      "id": "release-2-8",
      "name": "Release v2.8",
      "product": "Commerce API",
      "environment": "Production",
      "targetDate": "2026-08-20T00:00:00.000Z",
      "updatedAt": "2026-08-18T10:30:00.000Z",
      "checks": [
        {
          "id": "check-qa-regression",
          "title": "Regression suite pass",
          "area": "QA",
          "owner": "Mantas",
          "dueDate": "2026-08-19T00:00:00.000Z",
          "status": "pending",
          "note": "2 flaky checkout tests under investigation.",
          "updatedAt": "2026-08-18T10:30:00.000Z"
        }
      ]
    }
  ]
}
```

### Azure DevOps adapter pattern

1. Build an API endpoint (Azure Function/App Service) that calls Azure DevOps REST APIs (builds, pipelines, test results, work items).
2. Map the returned data to the schema above.
3. Secure the endpoint with Microsoft Entra ID (recommended), and allow CORS from your SharePoint tenant.
4. Provide the endpoint URL as `dataServiceUrl` while setting `useMock=false`.

This keeps the UI component unchanged while letting you plug in real delivery data.

## References

- [Overview of SharePoint Copilot Apps](https://learn.microsoft.com/sharepoint/dev/spfx/copilot/overview-copilot-apps)
- [Build your first SharePoint Copilot App](https://learn.microsoft.com/sharepoint/dev/spfx/copilot/get-started/build-your-first-copilot-app)
- [Microsoft 365 Copilot extensibility overview](https://learn.microsoft.com/microsoft-365/copilot/extensibility/overview)
- [Heft Documentation](https://heft.rushstack.io/)

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

<img src="https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/samples/release-readiness-board" />
