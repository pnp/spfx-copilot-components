# Privacy information for M365 Messages

M365 Messages is a community sample, not a Microsoft product. It connects an SPFx Copilot component to the externally hosted service at `https://m365messages.spteckapps.com`.

## Data processed

To provide the interactive experience, the client sends the following information to the hosted service:

- A delegated Microsoft Entra access token in the HTTPS `Authorization` header.
- Tool inputs such as the requested result count, search text, and filter.
- MCP protocol requests required to load and operate the embedded app.

The hosted service processes Microsoft 365 service announcement data available through the authenticated tenant and user context. The client-side sample does not intentionally persist tokens, tool inputs, or announcement data.

## External service

The hosted MCP server implementation, infrastructure, operational logging, and retention policies are outside this repository. Tenant administrators should assess the service before deployment and should not assume that server-side operational logs are disabled. Do not use this preview sample with confidential input or in production environments.

## Control and removal

A tenant administrator can deny or revoke the `user_impersonation` permission and remove the SPFx solution and agent. Removing the solution does not automatically revoke an API permission that was previously granted.

For privacy questions about the hosted service, contact `joao.j.mendes@spteck.com`.
