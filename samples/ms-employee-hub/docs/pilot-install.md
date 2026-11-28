# Restricted pilot: package, install and stop criteria

**The default packages are for local inspection; do not install them in a tenant.** Their legal URLs are placeholders and the Cowork connector deliberately uses `spfx-review.invalid`. Rights to use and redistribute the supplied assets with this sample were confirmed by the contributor on 2026-11-28; see [media provenance](../src/shared/media/sources.json). An approved pilot still needs the actual tenant origin, publisher website/privacy/terms URLs, an administrator's approval and isolated synthetic test accounts. The default privileged fixture is a fictional rehearsal persona, not authorization inferred from sign-in.

## Assemble a tenant-specific set, without uploading

**Only need one surface?** See the [five Teams app folders and PowerShell commands](../teams/README.md) or the [standalone Cowork instructions](../employee-hub-plugin/README.md#create-a-zip). Neither requires npm, Toolkit or an SPFx rebuild to package the saved files. The steps below produce a complete matched release; the packaging machine needs Windows PowerShell 5.1 or `pwsh` for the Cowork step.

Run `npm run review:candidate` first. Have the administrator create a JSON file **outside the sample** with exactly four keys: `sharePointOrigin` (the commercial tenant's HTTPS root, no site or subpath), `websiteUrl`, `privacyUrl` and `termsOfUseUrl` (approved public HTTPS URLs). The sample developer is **Contoso** across all surfaces. Do not include credentials. `npm run package:pilot` validates syntax and rejects review placeholders; it cannot verify ownership, rights or approval.

```powershell
npm run package:pilot -- "C:\pilot-config\employee-hub.json" "C:\pilot-builds\employee-hub-rc1"
```

Use an existing parent and a **new** output directory. This makes an isolated source copy, reuses installed dependencies, rebuilds with Heft, and inspects the actual `.sppkg`, embedded agent, personal tabs and plug-in. It never edits the review sources, signs in or provisions anything. Compare the eight files against the **new** `package-inventory.json`. Target-specific hashes differ from the review build. `node scripts\check-pilot.mjs` exercises this complete path locally using a disposable fictitious target and discards all test ZIPs.

| Artifact in the configured output | Intended installation |
|---|---|
| `ms-employee-hub.sppkg` | Tenant admin enables the approved solution in the authorized SharePoint app catalog for the pilot. Respect catalog policy and pilot scope; do not make a tenant-wide rollout decision here. |
| `employee-hub.zip` | Byte-identical copy of the generated Copilot agent already inside the `.sppkg`. Follow the tenant's SPFx agent discovery flow; do not install it as a sixth workspace or create a duplicate catalog listing. |
| `employee-hub-hub.zip`, `employee-hub-company.zip`, `employee-hub-hr.zip`, `employee-hub-tech.zip`, `employee-hub-business.zip` | Install separately as personal apps for assigned Teams testers only. Hub switches between four landings. The fixed apps land directly on **Microsoft home**, **HRweb**, **TechWeb** and **Business** and have no cross-workspace switcher. No channel tab. |
| `employee-hub-pilot.zip` | A **separate** M365 app for the approved Cowork catalog/sideload flow. Both its app connector and included agent action must target `/_api/mcp/spfx?solutionId=b847948b-8a9b-4483-b335-a6343eeb1760` at that tenant. The five root files are two icons and three JSON manifests. No pinned function list. |

## Acceptance in the actual hosts

1. **SharePoint:** author two differently configured focused parts on one test page; confirm isolation and that only the four workspaces can be single-part app pages. Open all four, test focus and page navigation, and log the actual width. A Teams installation must not elevate privileges.
2. **Copilot:** use all 12 starters and the [all-tool positive/negative matrix](../Employee-Hub-Demo-Prompts.md), including #03 vs #08 vs #07 and #22 vs #23 vs #20. Record the observed selected ID, properties, invocation count and expanded route, not a screenshot alone. Ambiguous requests need clarification with **zero** invocations. Check the current #14 year and #21 step, masked pay, session persistence, fresh-instance isolation and no passive chat.
3. **Teams:** exercise all five apps in personal scope; record each fixed destination beside the actual all-up navigation. Test host Back, theme, phone width, keyboard/screen reader, and lack of channel targeting. Test any policy-based denial with the administrator. The local role fixture alone cannot prove enterprise authorization.
4. **Cowork:** confirm both connector discovery and the included agent identity. Ask the German partner conversion prompt; require exactly `TraceLeadConversion`, the same scoped cut and an actual rendered component. A URL-only dynamic connector may be rejected by the host. Record the rejection as a blocker; don't sidestep it with invented static tools or a different tenant.
5. **Leadership:** rehearse the [keynote](../Employee-Hub-3-Minute-Demo.md) twice from reset. Record the 12 landing/host cells in [todo.md](../todo.md) and separate model traces. Clear real-data, stage and publisher/brand gates independently; neither asset rights nor source publication establishes signed-in acceptance.

**Stop/rollback:** stop on a private value in chat, unexpected grant/write, wrong tool, incorrect scope/denominator, missing fixed app or mismatched package hash. Retain the package identity and a redacted trace. The administrator unassigns/removes the standalone Cowork and five personal apps, disables the generated agent through the approved catalog flow, removes the test page instances, and retracts the solution or restores the previously approved version under the tenant's normal version policy. Do not remove apps used by other samples. Reopening this sample starts clean fixture state; it is not a rollback for real systems.
