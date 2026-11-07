# Delegated Microsoft Graph permissions

Expert Finder uses SPFx's `MSGraphClientV3` for live photos, calendar availability and confirmed Teams meetings. SharePoint list access uses `SPHttpClient` separately. Fictional profiles make no Graph calls, and **Introduce me** needs no additional Graph scope.

The package intentionally contains no `webApiPermissionRequests`. A tenant administrator must arrange delegated consent for the SPFx principal before using the live Graph features. The CLI commands below are administrative setup instructions; deploying or building the sample does not run them.

## Choose access for the features you need

| Feature | Graph v1.0 operation | Least delegated permission for the operation |
| --- | --- | --- |
| Other users' profile photos | `GET /users/{UPN}/photo/$value` | `ProfilePhoto.Read.All` |
| Calendar availability | `POST /me/calendar/getSchedule` | `Calendars.ReadBasic` |
| Confirmed calendar-backed Teams meeting | `POST /me/events` | `Calendars.ReadWrite` |

These permissions were checked against the current [profile-photo](https://learn.microsoft.com/en-us/graph/api/profilephoto-get?view=graph-rest-1.0#permissions), [getSchedule](https://learn.microsoft.com/en-us/graph/api/calendar-getschedule?view=graph-rest-1.0#permissions) and [create-event](https://learn.microsoft.com/en-us/graph/api/user-post-events?view=graph-rest-1.0#permissions) endpoint documentation.

Reuse compatible existing grants. For example, `User.ReadBasic.All` or `User.Read.All` can cover photos; `Calendars.Read` or `Calendars.ReadWrite` covers availability. Enabling all live features needs photo access plus `Calendars.ReadWrite`, rather than an additional calendar-read grant. Meeting creation also reads the organizer's Teams-provider support and can reread the created event with that calendar permission. This calendar-backed flow does not use the separate online-meetings API.

Consent does not create mailboxes, provide licenses or override Exchange sharing policies. Confirm those prerequisites separately.

## 1. Identify the service principals

Use [CLI for Microsoft 365](https://pnp.github.io/cli-microsoft365/) already configured and signed in to the intended tenant. The administrator and CLI application's permissions must allow service-principal inspection and delegated-grant management; see each linked command's permissions. Microsoft's [SPFx troubleshooting guidance](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/troubleshooting-copilot-ux-components#a-microsoft-graph-permission-cant-be-approved) describes the newer **SharePoint Online Web Client Extensibility** principal and the required administrative roles.

Use [entra enterpriseapp get](https://pnp.github.io/cli-microsoft365/cmd/entra/enterpriseapp/enterpriseapp-get/):

```bash
m365 entra enterpriseapp get \
  --id "08e18876-6177-487e-b8b5-cf950c1e598c" \
  --query "{name:displayName,appId:appId,objectId:id}" \
  --output json

m365 entra enterpriseapp get \
  --displayName "Microsoft Graph" \
  --query "{name:displayName,appId:appId,objectId:id}" \
  --output json
```

Verify the returned names and App IDs. The SPFx App ID above and Microsoft Graph App ID `00000003-0000-0000-c000-000000000000` are public product identifiers. The returned Object IDs are tenant-specific and must be looked up in your tenant. If the expected SPFx principal is absent, use the official troubleshooting guidance to identify the principal used by your tenant before granting access.

Copy the returned Object IDs:

```bash
expertFinderSpfxPrincipalId="<SPFX_SERVICE_PRINCIPAL_OBJECT_ID>"
expertFinderGraphPrincipalId="<GRAPH_SERVICE_PRINCIPAL_OBJECT_ID>"
```

## 2. Inspect existing delegated consent

Use [entra oauth2grant list](https://pnp.github.io/cli-microsoft365/cmd/entra/oauth2grant/oauth2grant-list/):

```bash
m365 entra oauth2grant list \
  --spObjectId "$expertFinderSpfxPrincipalId" \
  --query "[?resourceId=='$expertFinderGraphPrincipalId' && consentType=='AllPrincipals'].{grantId:id,scope:scope}" \
  --output json
```

Check the scopes against the feature table. When a compatible scope already exists, no grant change is needed for that feature. Graph Explorer uses its own consent; a successful request there does not prove that the SPFx principal has access.

## 3. Add only missing access

Select one missing scope at a time. Set the variable to `ProfilePhoto.Read.All`, `Calendars.ReadBasic` or `Calendars.ReadWrite` according to the feature being enabled:

```bash
expertFinderRequiredScope="ProfilePhoto.Read.All"
```

### Existing tenant-wide grant

Copy the grant ID and its entire current scope string from step 2, then use [entra oauth2grant set](https://pnp.github.io/cli-microsoft365/cmd/entra/oauth2grant/oauth2grant-set/):

```bash
expertFinderGrantId="<EXISTING_GRANT_ID>"
expertFinderExistingScopes="<EXACT_CURRENT_SCOPE_VALUE>"

m365 entra oauth2grant set \
  --grantId "$expertFinderGrantId" \
  --scope "$expertFinderExistingScopes $expertFinderRequiredScope"
```

Setting `scope` replaces the previous list. Preserve the complete existing value and append only the missing scope. This grant is shared by other SPFx solutions using the same principal. If adding another scope, rerun step 2 first so that the existing-scope value includes the previous change.

### No tenant-wide grant

Only if step 2 returned no matching grant, use [entra oauth2grant add](https://pnp.github.io/cli-microsoft365/cmd/entra/oauth2grant/oauth2grant-add/):

```bash
m365 entra oauth2grant add \
  --clientId "$expertFinderSpfxPrincipalId" \
  --resourceId "$expertFinderGraphPrincipalId" \
  --scope "$expertFinderRequiredScope"
```

Both IDs here are service-principal Object IDs. These are delegated permissions; application-role assignments are a different authorization model.

## 4. Verify access in the component

Rerun step 2 and confirm the selected scope, while checking that existing scopes remain. Reload the component and validate live photos, availability and, when intended, confirmed meeting creation using the [manual checklist](validation.md). Photo failures fall back to initials; calendar failures remain an explicit unavailable state.

**Create Teams meeting** sends a real invitation after confirmation. Merely opening availability or cancelling the confirmation creates no event. If a create request has an uncertain outcome, inspect Outlook before trying again.

Implementation reference: [Use MSGraphClientV3 in SPFx](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/use-msgraph).
