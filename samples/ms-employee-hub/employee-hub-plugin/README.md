# Employee Hub plug-in for Cowork

This is a hand-authored Microsoft 365 app package, following the [Zava One Hub plug-in](../../zava-one-hub/zava-one-hub-plugin/README.md). **No Microsoft 365 Agents Toolkit, WIQD, Node, npm restore, sign-in or SPFx build is needed to create this ZIP.** It is separate from the [embedded Copilot agent](../copilot/manifest.json) and the [five Teams personal apps](../teams/README.md).

## What goes in the ZIP

| Root file | Purpose |
|---|---|
| [manifest.json](manifest.json) | App identity, Contoso developer, icons, app-level MCP connector and the reference to the included agent. |
| [declarativeAgent.json](declarativeAgent.json) | Included agent with literal instructions, 12 ordered conversation starters and a reference to the action. |
| [ai-plugin.json](ai-plugin.json) | v2.4 action: one `RemoteMCPServer`, `run_for_functions: ["*"]`, and an empty `functions` list. |
| [color.png](color.png), [outline.png](outline.png) | The plug-in's own 192 px color and 32 px outline marks. |

These are complete source files, not templates. The ZIP must contain **exactly these five files at the root** - no enclosing folder, README, helper, artwork source or other ZIP. The connector and the included agent discover the same tools from the [separately deployed SPFx solution](../sharepoint/solution/ms-employee-hub.sppkg); neither carries a static tool catalog or the SPFx code.

## Create a ZIP

From this directory, the optional [PowerShell helper](Package-Plugin.ps1) works with Windows PowerShell 5.1 or PowerShell 7. It reads the five files here and never rewrites them or deploys anything.

```powershell
.\Package-Plugin.ps1 -Review
```

This produces [employee-hub-local-review.zip](employee-hub-local-review.zip) next to the manifests. Its endpoint (`spfx-review.invalid`) and publisher/legal URLs are deliberately non-routable. **Inspect this ZIP; do not install it.**

For an authorized pilot, supply the approved values. The following variables stand for values supplied by the administrator, not sample defaults:

```powershell
.\Package-Plugin.ps1 -TenantUrl $tenantOrigin -WebsiteUrl $publisherWebsite `
    -PrivacyUrl $privacyPolicy -TermsOfUseUrl $termsOfUse
```

The output is `employee-hub-plugin.zip` in this folder. Both MCP URLs are set together in the archive and the publisher remains Contoso. The helper rejects a site URL, an admin/OneDrive host or placeholder legal URLs. If your working copy of `manifest.json` already contains approved legal URLs, only `-TenantUrl` is required. `-OutputPath` selects another ZIP path. Re-run after an edit; a ZIP does not track its source.

**Without the helper:** copy the five files to a clean folder. In `manifest.json`, set `developer.websiteUrl`, `developer.privacyUrl`, `developer.termsOfUseUrl` and `agentConnectors[0].toolSource.remoteMcpServer.mcpServerUrl`. In `ai-plugin.json`, set `runtimes[0].spec.url` to the **identical** endpoint:

```text
https://<approved-tenant>.sharepoint.com/_api/mcp/spfx?solutionId=b847948b-8a9b-4483-b335-a6343eeb1760
```

Select the five files themselves in a ZIP utility, or run this in the clean folder:

```powershell
Compress-Archive -LiteralPath 'manifest.json','declarativeAgent.json','ai-plugin.json','color.png','outline.png' -DestinationPath 'employee-hub-plugin.zip'
```

## Identity and acceptance

- **Plug-in app ID:** `ce6ec992-07ef-42c1-8c3d-c158ac69461e`. Keep it for updates. The app version is `1.0.2`. The `solutionId` in the URL is the **Employee Hub SPFx solution ID**, not the plug-in or the embedded agent ID. Do not copy Zava's tenant or identities.
- **Discovery:** the top-level connector `employee-hub-tools` is for Cowork; `employeeHubCoworkAgent` uses its own `employeeHubCoworkAction` for the same endpoint. The outer manifest uses `devPreview` like Zava. Tenant policy and host support must be verified separately.
- **Pilot:** an authorized administrator enables the `.sppkg`, approves the configured ZIP and assigns it to a test account. In Cowork, ask “How many partner leads in Germany became opportunities this quarter?” and verify that **only `TraceLeadConversion`** opens with the correct cohort. Check the included **Employee Hub Plug-in** agent separately. See [installation and rollback](../docs/pilot-install.md). Packaging does not validate any of those signed-in steps.

The sample's ordinary `npm run build` does not generate this ZIP. The optional `npm run package:cowork` calls the same manual helper and copies its review ZIP into `release\cowork`; the combined pilot release calls it with the approved settings. When changing starters, keep the manual agent aligned with [the canonical starter list](../config/conversation-starters.json); the release audit compares the packaged values.
