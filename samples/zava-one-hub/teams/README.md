# Zava One Teams personal apps

Three independent Teams apps wrap the existing composed SPFx web parts. No web part code changes
or SPFx build are needed to create these app packages.

| App | Folder | SPFx component / Teams app ID | Branding |
| --- | --- | --- | --- |
| Zava One | [zavaOneWorkspace](./zavaOneWorkspace) | `f7b09607-26da-46e6-9930-8b393584e723` | Blue Z + workspace grid |
| Zava One Company | [zavaOneCompanyWorkspace](./zavaOneCompanyWorkspace) | `fafb4281-77b9-4d9f-aed5-6fe06f7d523b` | Emerald Z + company building |
| Zava One Personal | [zavaOnePersonalWorkspace](./zavaOnePersonalWorkspace) | `ded9158d-a589-4e34-a46d-25677aced30c` | Violet Z + person |

Each folder contains `manifest.json`, a 192 x 192 full-bleed color PNG, a 32 x 32 white-on-transparent
outline PNG, and a ready-to-upload `TeamsSPFxApp.zip`. The icons use a shared Zava monogram,
supersampled edges, and distinct signatures. The ZIP contains only the manifest and the two icons
at its root, not a containing folder.

## Supported locations and routing

All three apps are **personal-only**: one `staticTabs` entry with `scopes: ["personal"]`,
`context: ["personalTab"]`, and `defaultInstallScope: "personal"`. They open in the Teams personal
app experience and can be pinned to the app bar. No channel, group-chat, or meeting tabs are declared.
`configurableTabs` and `supportsChannelFeatures` are deliberately removed; the latter is required
for team-scoped apps, not these personal-only apps.

The manifests retain schema 1.29, matching the existing Copilot app manifest. App versions are
1.0.2 for this personal-only update. The web parts already support `TeamsPersonalApp`; their
supported hosts are unchanged. Personal app installation is not an authorization boundary;
these samples use fictional data and simulated actions.

App IDs and tab entity IDs match the corresponding SPFx component IDs. Following Microsoft's
SPFx deployment guidance, each `staticTabs.contentUrl` routes through `TeamsLogon.aspx` to
`teamshostedapp.aspx` with the `teams` and `personal` flags, matching `componentId`, and
`forceLocale={locale}`. A personal tab opens this content directly; there is no configuration page.

**Do not replace `{teamSiteDomain}` or `{locale}`** in the content URL, or `{teamSiteDomain}` in
`webApplicationInfo.resource`. Teams resolves these placeholders at runtime. The SharePoint Online application ID
`00000003-0000-0ff1-ce00-000000000000` is intentional; it is not one of the web part IDs.
Only SharePoint and Microsoft sign-in domains are allowlisted.

## Workspace header in Teams

The shared web part host detects Teams through `context.sdks.microsoftTeams`. For all three
composed workspaces, it omits the in-app Zava One brand bar, Demo data badge, and profile avatar
because Teams already provides app and user chrome. The combined workspace retains its
Company/Personal navigation. Company-only and Personal-only workspaces retain Edit layout and
Personalize in a neutral toolbar. SharePoint and Copilot rendering retain the existing header.

This behavior is implemented in the SPFx code, not the Teams manifest. Rebuild and redeploy the
SPFx solution to apply it; uploading a Teams ZIP alone does not update the rendered web part.
For local UX review, use `?intent=workspace&mode=company&hideWorkspaceHeader=true` (or `combined`
or `personal`) to preview the Teams layout without tenant authentication.

Developer details mirror the existing solution's sample publisher metadata (excluding the
SPFx-only `mpnId`). Before distributing beyond a demo, replace the sample publisher and generic
community website/privacy/terms links with your organization's actual details and policies.

## Regenerate or check packages

Run from the solution root on Windows using PowerShell:

```powershell
# Generate the PNGs and package each existing manifest, without invoking the SPFx build.
.\teams\package-apps.ps1

# Read-only validation of personal routing/scope, authentication, icons, and ZIP contents.
.\teams\package-apps.ps1 -Check
```

The script uses Windows System.Drawing and built-in ZIP tooling, with no additional dependencies.
It also checks `TeamsPersonalApp` web part support and rejects channel-app declarations.
Keep changes to each manifest's app version in sync with uploads: increment `version` when
updating an already-installed Teams app, then regenerate its ZIP.

## Install

1. Ensure the deployed Zava One SPFx package in the tenant SharePoint App Catalog contains all
   three matching component IDs and its client-side assets are available. The Teams ZIPs do
   **not** rebuild, repair, or deploy the SPFx implementation.
2. In Teams, use **Apps > Manage your apps > Upload an app > Upload a custom app**, or have an
   administrator upload the three ZIPs to the organization's Teams app catalog. Custom app
   upload and use must be allowed by tenant policy.
3. Upload each folder's `TeamsSPFxApp.zip` separately. Do not ZIP the entire `teams` directory
   or use SharePoint's automatic **Sync to Teams** to recreate these handcrafted packages.
4. Add/open the desired app for yourself and optionally pin it to the Teams app bar. If replacing
   a previously installed channel/group-chat version, remove its old tabs and update the app to
   version 1.0.2; existing channel tabs are not converted to personal tabs.
5. Confirm Zava One offers Company
   and Personal switching, Company opens only Company content, and Personal opens only Personal
   content. Check sign-in and rendering in your tenant; local package validation cannot verify them.

The existing top-level generated Teams/Copilot assets are separate and are not changed by this
packaging script.

## References

- [SPFx deployment guidance and personal-tab content URL](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/deployment-spfx-teams-solutions)
- [Teams personal tab creation guidance](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/create-personal-tab)
- [Static tab manifest reference](https://learn.microsoft.com/en-us/microsoft-365/extensibility/schema/root-static-tabs?view=m365-app-1.29)
- [Teams app packaging and icon requirements](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/apps-package)
