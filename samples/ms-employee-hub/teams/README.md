# Employee Hub Teams personal apps

Choose **Employee Hub** for one app that switches among all four workspaces, or choose a fixed app to open just its named workspace. Each row is a separate Teams app with a stable identity, its own icon pair, and one personal tab. There are no channel, meeting or group-chat tabs. The 29 focused SharePoint web parts are not Teams apps.

| Teams app / source folder | What opens | App ZIP | App ID and SPFx component ID |
|---|---|---|---|
| [Employee Hub](hub/) | All-up hub with workspace switching | [employee-hub-hub.zip](hub/employee-hub-hub.zip) | `7a2e07b7-bdfc-4442-aa61-005171754688` |
| [Microsoft home](company/) | Fixed [workplace journal](../review/evidence/screens/company-1280.png) | [employee-hub-company.zip](company/employee-hub-company.zip) | `77aff969-01f4-45b9-bf8a-c6fcd29fc7e1` |
| [HRweb](hr/) | Fixed [employee services workspace](../review/evidence/screens/hr-1280.png) | [employee-hub-hr.zip](hr/employee-hub-hr.zip) | `c9d7030a-ca94-4a61-aafc-c340cd98fbd3` |
| [TechWeb](tech/) | Fixed [technology support workspace](../review/evidence/screens/tech-1280.png) | [employee-hub-tech.zip](tech/employee-hub-tech.zip) | `06908557-127f-435c-b4b6-b73306ec8ce3` |
| [Business](business/) | Fixed [commercial operating review](../review/evidence/screens/business-1280.png) | [employee-hub-business.zip](business/employee-hub-business.zip) | `2aa8bc99-9b5d-453b-b943-c82c4318c81b` |

**What is not a Teams app here:** the top-level [employee-hub.zip](employee-hub.zip) is the generated Copilot agent already inside the SharePoint `.sppkg`. The adjacent `.copilot-agent-hotfix.json` is SPFx-generated version state for that agent. Neither is a sixth workspace. The [Cowork plug-in](../employee-hub-plugin/README.md) has its own folder, manifest, app ID and packaging command.

## Package all five or just one

Run these examples from the **sample root** with Windows PowerShell 5.1 or PowerShell 7. No Node installation, SPFx rebuild, Toolkit or tenant sign-in is needed to package the saved manifests and icons.

```powershell
.\teams\Package-TeamsApps.ps1             # Build five ZIPs, one in each app folder
.\teams\hr\Package-App.ps1               # Rebuild HRweb only
.\teams\Package-TeamsApps.ps1 -Check     # Verify all five without writing
.\teams\hr\Package-App.ps1 -Check        # Verify HRweb only
```

Every app folder has the same `Package-App.ps1` entry point; keep the [shared helper](Package-TeamsApps.ps1) one level above. Each ZIP contains **exactly** `manifest.json`, `color.png` (192 x 192) and `outline.png` (32 x 32) at its root. Do not zip the enclosing folder or add screenshots, scripts, component code or other ZIPs. `-Check` verifies the personal-tab route and ID, icon dimensions and each ZIP member against its source.

The PowerShell scripts package the files **as saved** and do not rewrite publisher details. The sample's `npm run package:teams` instead regenerates the canonical review manifests from [the SPFx components](../src/webparts) and [the Teams manifest generator](../scripts/package-teams.mjs), then copies the five ZIPs to `release\teams`. Make lasting manifest-generation changes in that generator. Leave `{teamSiteDomain}` and `{locale}` untouched; Teams resolves them at runtime.

## Test in a tenant

The checked-in manifests use `.invalid` publisher URLs: **the linked ZIPs are for local review, not upload**. For a test tenant, follow the [restricted pilot instructions](../docs/pilot-install.md) to create the approved matched set. The administrator must enable the matching `.sppkg` in SharePoint, allow custom Teams apps and assign the intended app(s) to testers. Upload each configured personal-app ZIP separately; do not use **Sync to Teams** to recreate these packages. Then check that the all-up app switches workspaces and that each fixed app opens its own landing without a switcher. Packaging does not grant data access or prove tenant acceptance.
