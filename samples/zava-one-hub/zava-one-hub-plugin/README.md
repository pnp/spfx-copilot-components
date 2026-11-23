# Zava One Hub plug-in

A manually created Microsoft 365 Copilot plug-in version of the agent in the
[Zava One SPFx sample](../README.md), packaged separately for **tenant deployment and use in Cowork**.
Both the **app-level connector and included agent use dynamic tool discovery** from the deployed
SPFx MCP endpoint. The solution currently provides 37 tools; this package does not pin or duplicate
their definitions.

For this SPFx 1.24.x sample, the plug-in is manually maintained and packaged with
[Package-Plugin.ps1](./Package-Plugin.ps1). The normal `npm run build` path produces the original
agent package, not this plug-in ZIP. The original [agent definition](../copilot/manifest.json),
[generated agent ZIP](../teams/zava-one.zip), and [Teams personal apps](../teams/README.md) remain
separate.

## Identity and target

| Setting | Value |
| --- | --- |
| SharePoint origin | `https://spex005.sharepoint.com` |
| Plug-in app ID | `61fc4ae0-03dc-4932-962d-e74bfffea7f4` |
| App version | `1.0.2` |
| Agent ID | `zavaOneHubPluginAgent` |
| Action ID | `zavaOneHubPluginAction` |
| Connector ID | `ZavaOneHubPlugin-MCP` |
| Action namespace | `zavaOneHubPlugin` |
| Existing SPFx solution ID | `1ecc25fc-3211-40c0-9ac4-283b994bf411` |
| Source SPPKG version | `1.0.0.18` |
| Original app ID, not reused | `986dd51d-45fe-4c8f-bcdc-ccbc0c9b22ad` |

The original SPFx solution and component/tool identities stay unchanged because this plug-in calls that deployed implementation. Only the plug-in/agent identity is new. The icons use a precise Zava Z inside a three-node workplace ring, with a deep-teal color background and a matching transparent white outline. They are distinct from the original blue Z icons.

The outer app manifest uses `manifestVersion: "devPreview"`. Confirm that the target tenant's
deployment flow and Cowork policy accept this configuration; do not infer general availability from
the presence of an example ZIP.

Both the app-level connector's `mcpServerUrl` and the included agent action's runtime `spec.url` target:

```text
https://spex005.sharepoint.com/_api/mcp/spfx?solutionId=1ecc25fc-3211-40c0-9ac4-283b994bf411
```

The key plug-in declaration is the top-level `agentConnectors` array in `manifest.json`; `copilotAgents` alone only declares the included agent. When configuring a package manually, edit `agentConnectors[].toolSource.remoteMcpServer.mcpServerUrl` for the deployment tenant and keep `ai-plugin.json` > `runtimes[].spec.url` identical. The sample helper sets both values together, but a hand-assembled ZIP doesn't substitute tenant URLs automatically.

The tenant hostname selects the deployment environment. The `solutionId` matches `solution.id` in the SPFx sample's `config/package-solution.json`, allowing SPFx to resolve that deployed solution's Copilot UX components and discover their tools dynamically. It isn't the new plug-in app ID.

The `.sppkg` must remain deployed and enabled in that tenant's App Catalog. The sample uses `includeClientSideAssets: true`, so SharePoint hosts its bundled UX assets from the App Catalog, optionally through the configured Microsoft 365 CDN. This ZIP only supplies the connection and agent configuration; it neither contains nor serves the UX implementation.

## Build the package

1. Deploy the [SPPKG](../sharepoint/solution/zava-one-hub.sppkg) to the **target tenant App Catalog**,
   enable the solution, and complete its deployment prerequisites. The configured `spex005` host is
   the supplied example, not a value to reuse for another tenant. The ZIP does not deploy component code.
2. From this folder, run the following in PowerShell:

   ```powershell
   .\Package-Plugin.ps1 -TenantUrl 'https://yourtenant.sharepoint.com'
   ```

3. Use the resulting [zava-one-hub-plugin.zip](./zava-one-hub-plugin.zip) for the tenant's supported
   plug-in upload flow. Do not zip this entire folder. See
   [tenant deployment and Cowork use](#deploy-to-the-tenant-and-use-in-cowork) below.

Rerun the command after changing a packaged JSON or PNG file. The previously created ZIP doesn't update automatically.

The helper edits `manifest.json` and `ai-plugin.json` in place to set both MCP endpoint URLs, checks
v2.4 action configuration and dynamic discovery for both entry points, and creates the ZIP. It does
not read the SPPKG or export a tool catalog. No npm restore or SPFx source build is required to package
these configuration files; the deployed SPFx implementation must already be available.

The helper does not deploy the SPPKG, authenticate to the tenant, or certify runtime rendering. SPFx supplies tool definitions and UX metadata at runtime; check runtime CSP diagnostics for the target tenant.

For another tenant, deploy the same SPPKG there and rerun with its `https://[prefix].sharepoint.com` origin. Increment the app `version` before uploading an update to an already installed package. The helper deliberately does not change release versions or generate a new identity on each run.

## Package contents

The ZIP contains exactly these five files at its root:

```text
manifest.json
declarativeAgent.json
ai-plugin.json
color.png
outline.png
```

This is an **agent-and-connector package**, not a connector-only package. The agent's file-reference chain is `manifest.json` -> `declarativeAgent.json` -> `ai-plugin.json`. Keep the action manifest: the included agent references it through `actions[].file`, even though the app manifest doesn't reference it directly.

`Package-Plugin.ps1` and this README are authoring files, not installable package contents. Agent instructions are already literal text in `declarativeAgent.json`; no unresolved Toolkit file macros are shipped.

`ai-plugin.json` retains an empty `functions` array, a `RemoteMCPServer` runtime with `run_for_functions: ["*"]`, and no `mcp_tool_description`. Don't copy the connector's tool catalog into this file.

The action manifest uses [plug-in schema v2.4](https://developer.microsoft.com/json-schemas/copilot/plugin/v2.4/schema.json): its `$schema` URL and `schema_version: "v2.4"` must stay aligned. The packaging helper enforces both. This schema applies to `ai-plugin.json`, not to the outer app manifest or the MCP `tools/list` catalog.

The app connector omits `mcpToolDescription`, and the agent runtime omits `mcp_tool_description`. Don't add either reference or a packaged tool list when using this dynamic configuration.

## Deploy to the tenant and use in Cowork

1. Have a tenant administrator upload the ZIP through the tenant's supported Microsoft 365 Copilot
   plug-in deployment flow and complete any required approval.
2. Assign it to the intended test users or groups. Packaging alone neither installs the plug-in nor
   makes it available to every user.
3. In **Cowork**, use an assigned account in an environment where plug-ins are enabled. Make the
   deployed plug-in available to the task using the host's supported plug-in controls.
4. Ask **What's new across Zava this week?** and confirm `ShowCompanyNews` is discovered and opens the
   expected experience. Then rehearse the other focused tasks required for the presentation.
5. Test the included **Zava One Hub Plugin** agent separately. Its distinct identity allows the
   original **Zava One** agent to remain installed; this plug-in does not rename or upgrade it.

The app-level connector supplies the dynamically discovered tools to plug-in consumers such as
Cowork. `copilotAgents` declares the separately included agent; that declaration alone is not the
app-level connector. The tenant must also host the deployed SPPKG and permit the intended users to
invoke it. User access, tenant policy, host support, and actual tool/UX behavior require verification.

## Validate in the tenant and Cowork

- Validate the ZIP with the upload service; local file/JSON checks do not certify tenant acceptance.
- Record tenant deployment, assignment, and actual availability to the test account in Cowork.
- Confirm the distinct **Zava One Hub Plugin** identity and new icon in the agent gallery.
- In the included agent, try each of its six starters. Confirm news, policy, praise, sales, offices,
  and capability discovery open distinct experiences. The plug-in keeps its own starter copy in
  [declarativeAgent.json](./declarativeAgent.json).
- In Cowork, invoke the required business tasks through the plug-in and record the actual tools,
  sign-in, rendering, theme/focus behavior, and any host limitations.
- Try a broad workspace request and confirm `OpenZavaWorkspace`. Use the visible workspace controls
  to select Personal; the advertised `tab` input is not currently consumed. Do not claim preserved
  inline drafts or selections on expansion. See the [runtime mapping](../docs/intent-component-mapping.md).
- Confirm C35 reset at 4 pending / 2 processed, an explicit Johanna approval, reference
  `ZAVA-LEAVE-1043`, and the session-only/no-HR-submission receipt. Confirmed fixture actions are
  not live business writes or synchronized state across independent hosts.
- Confirm network/CSP diagnostics use the **configured target tenant**, not a host copied from
  another sample.
- Confirm the original **Zava One** agent remains separate and unchanged.

Revalidate deployment, upload acceptance, gallery visibility, and authenticated invocation for each
new tenant or package update. Creating a ZIP alone does not verify them, and the original sample's
SPFx/Teams evidence does not certify Cowork.

The helper checks the local dynamic-discovery configuration, v2.4 action settings, literal
instructions, identity separation, and presence of the five package files. It writes the two
endpoints together and archives those files. It does not authenticate, validate upload acceptance,
or exercise tool discovery and rendering in Copilot or Cowork.

## Related documentation

- [Sample README and package comparison](../README.md#deploy-the-manually-created-plug-in-for-cowork)
- [Release readiness and evidence boundary](../docs/release-readiness.md#manual-plug-in-and-cowork-deployment)
- [Exact intent/component mapping and current runtime limits](../docs/intent-component-mapping.md)
- [Presenter preflight and reset](../demos/demo-operations.md#cowork-and-the-manually-created-plug-in)
