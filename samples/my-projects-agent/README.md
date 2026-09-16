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

SharePoint Copilot Apps and the SPFx 1.24.0-beta.3 APIs used by this sample are preview capabilities and may change.

## Development

```bash
npm ci
npm start
```

The local server listens on `https://localhost:4321`. Replace `{tenantDomain}` in [config/serve.json](config/serve.json) with the tenant host before opening Copilot Workbench.

## Validation

```bash
npx tsc --noEmit
npm run build
```

The production build runs lint, webpack, Copilot package generation, Jest tests, and SharePoint solution packaging. Output packages are written to `teams/my-planner-projects-agent.zip` and `sharepoint/solution/spfx-my-projects-agent.sppkg`.

## Privacy and permissions

The component reads the signed-in user's accessible Planner projects and tasks, and can create a plan and its selected buckets and tasks only after the user presses **Create**. Requests use delegated Microsoft Graph permissions approved by the tenant administrator; this sample does not send Planner data to an external service. See [PRIVACY.md](PRIVACY.md).

## Contributor

- [João Mendes](https://github.com/joaojmendes)

## Version history

| Version | Date | Comments |
| --- | --- | --- |
| 1.0.0 | September 15, 2026 | Initial PnP sample from the My Planner Projects Agent project. |

## Architecture documentation

See [docs/architecture.md](docs/architecture.md) for the complete Copilot request lifecycle, component responsibilities, Graph data flow, selection persistence, fullscreen navigation, project creation flow, testing strategy, and packaging details.

<img src="https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/samples/my-projects-agent" />
