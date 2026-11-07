# Build and deploy Expert Finder

## Build locally

Run from [`src/copilot-expert-finder`](../src/copilot-expert-finder/) using Node.js 24.x:

```bash
npm install
npm run build
```

The existing script runs `heft test --clean --production && heft package-solution --production`: it compiles, lints, bundles and packages the solution. No unit-test suite is included. Stop any development server first because both commands use the same staging directories.

| Output | Purpose |
| --- | --- |
| `sharepoint/solution/copilot-expert-finder.sppkg` | Upload to the tenant SharePoint App Catalog |
| `teams/expert-finder.zip` | Generated baseline agent package, included in the solution |

Keep only one current agent ZIP in `teams/`; other ZIPs in that directory can also be embedded in the solution. Keep the existing `teams/.copilot-agent-hotfix.json` version-history file when copying the project. Edit source configuration under `copilot/` and `config/`, then rebuild; avoid editing generated archives.

## Run in Copilot Workbench

From the same project directory:

```bash
npm start -- --nobrowser
```

Open `https://YOUR-TENANT.sharepoint.com/_layouts/15/copilotworkbench.aspx` with a licensed test user. Load `https://localhost:4321/temp/build/manifests.js` when prompted, select **ExpertFinderTool** and supply `{"skill":"SPFx"}`. The local HTTPS development certificate must be trusted. `SPFX_SERVE_TENANT_DOMAIN` is only needed for automatic tenant substitution when opening the configured initial page; it is not a runtime data-source setting.

Check inline/fullscreen rendering, light/dark themes and local filters. Workbench supplies arguments directly; test natural-language discovery and conversation drafting with the deployed agent. See the [manual validation checklist](validation.md).

## Prepare the tenant

1. Use a development tenant with a SharePoint App Catalog, the required Copilot license and an administrator who can deploy the solution and manage agent availability.
2. Choose the data source. Without an `Experts` list in the tenant root, HTTP 404 selects fictional profiles. For real users, follow [SharePoint setup](sharepoint-setup.md) to run the [PnP provisioning script](../scripts/Provision-ExpertsList.ps1) or create the list manually, then add expert records and reload the component.
3. For live photos or calendars, arrange the [delegated Graph permissions](graph-permissions.md). The package has no `webApiPermissionRequests`; uploading it does not request or grant these scopes.
4. If redistributing under your own publisher identity, review the developer website/privacy/terms fields in [`copilot/manifest.json`](../src/copilot-expert-finder/copilot/manifest.json) and [`config/package-solution.json`](../src/copilot-expert-finder/config/package-solution.json), plus the placeholder `contact_email` in [`copilot/ai-plugin.json`](../src/copilot-expert-finder/copilot/ai-plugin.json). These are publisher metadata, not tenant routing. The supplied personal website links are not a dedicated privacy policy or terms for your deployment.

The root SharePoint URL is derived from the SPFx context. Tenant-specific URLs and Object IDs belong in your administrative setup, not in the reusable component or generated agent ZIP.

## Install the agent

1. Upload `sharepoint/solution/copilot-expert-finder.sppkg` to the tenant App Catalog and enable it for all sites as required by the Copilot integration.
2. Select **Add to Teams** for the solution. This synchronizes the baseline declarative agent; follow the tenant's app and agent approval policies.
3. Make the agent available to the intended test users. Allow propagation and tool-discovery caching time, then open **Expert Finder** in Microsoft 365 Copilot and start a new conversation.
4. Try **Who can help me with SPFx?** and the remaining [invocation checks](copilot-invocation.md).

Follow Microsoft's [first-component deployment tutorial](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/get-started/build-your-first-copilot-app) for the current administrative UI. For synchronization failures, use the official [Copilot UX component troubleshooting guide](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/troubleshooting-copilot-ux-components) and inspect the built package before changing its identity or contents.

## Updating the sample

The supplied source uses agent app version `1.0.3` and SPFx solution version `1.0.0.4`. Preserve the solution, app and component IDs when updating the same installation.

| Change | Deployment action |
| --- | --- |
| Component implementation or UI | Build and redeploy the `.sppkg`; no additional sync if the baseline agent is unchanged |
| Runtime tool definition only | Build and redeploy; allow discovery-cache propagation |
| Agent instructions, descriptions, icons or starters | Build and redeploy, then use **Add to Teams** to synchronize the changed baseline |
| Documentation only | No solution build or agent synchronization is needed |

The solution version in `config/package-solution.json` identifies SharePoint package updates. The numeric app version in `copilot/manifest.json` identifies baseline agent updates; inspect the generated app version because the SPFx build can advance it. Declarative-agent `version: v1.8` is a schema selection, not a release counter.

See Microsoft's [development and deployment guidance](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/development-and-deployment) for the component/baseline distinction. Validate the installed solution and a fresh Copilot conversation after an update.
