# My Planner Projects Agent

An SPFx 1.24 Copilot declarative agent that reads the current user's Microsoft Planner projects and prepares new projects for explicit creation.

## Features

- Lists accessible Planner projects in a `DetailsList` when multiple projects match.
- Shows a focused summary card when one project matches.
- Highlights projects with incomplete tasks that are overdue or due within seven days.
- Finds active or overdue work assigned to the current user.
- Filters projects by creation, task activity, and due-date periods or custom dates.
- Returns recently active, newly created, or next-due projects with optional result limits.
- Finds incomplete tasks in buckets named `On hold`, `Hold`, `In hold`, or `Blocked`.
- Opens the selected project in the native Microsoft Planner web part in Copilot fullscreen mode.
- Prepares a blank Basic plan or editable Simple Plan, Project Management, Software Development, Business Plan, and Employee Onboarding templates from natural-language requests.
- Loads the user's Microsoft 365 groups on picker focus, supports debounced search, and continues with infinite-scroll paging.
- Creates the selected plan, buckets, scheduled tasks, and optional self-assignments only after an explicit button click.
- Reports partial creation progress and can continue the remaining setup without duplicating blueprint buckets or tasks.
- Supports light and dark Copilot host themes.

Planner does not expose a native on-hold task status. The on-hold view therefore uses the documented bucket-name convention above.

## Prerequisites

- Node.js `>=22.14.0 <23.0.0`.
- A Microsoft 365 tenant with SharePoint, Copilot, and Planner available.
- Approval of the solution's delegated Microsoft Graph `Tasks.ReadWrite` and `GroupMember.Read.All` permissions in SharePoint admin.

## Development

```bash
npm install
npm start
```

The local server listens on `https://localhost:4321`. Replace `{tenantDomain}` in [config/serve.json](config/serve.json) with the tenant host before opening Copilot Workbench.

## Validation

```bash
npx tsc --noEmit
npm run build
```

The production build runs lint, webpack, Copilot package generation, Jest tests, and SharePoint solution packaging. Output packages are written to `teams/my-planner-projects-agent.zip` and `sharepoint/solution/my-planner-projects-agent.sppkg`.

## Architecture documentation

See [docs/architecture.md](docs/architecture.md) for the complete Copilot request lifecycle, component responsibilities, Graph data flow, selection persistence, fullscreen navigation, project creation flow, testing strategy, and packaging details.

## Version history

| Version | Date | Comments |
| --- | --- | --- |
| Metadata correction | November 6, 2026 | Align the gallery SPFx version with the existing 1.24.0-beta.3 package dependencies; no dependency upgrade. |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

<img src="https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/samples/my-planner-projects" />