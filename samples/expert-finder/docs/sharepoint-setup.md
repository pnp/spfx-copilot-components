# Set up the Experts list

The component reads expert records from a list named `Experts` in the tenant root site, for example `https://YOUR-TENANT.sharepoint.com`. It does not provision or modify the list. Calendar writes are a separate, explicitly confirmed action.

## Create the list with PnP PowerShell

Use [Provision-ExpertsList.ps1](../scripts/Provision-ExpertsList.ps1) to create the list and its required columns.

Prerequisites:

- PowerShell 7.4 or later and the stable `PnP.PowerShell` module. See the [PnP installation guide](https://pnp.github.io/powershell/articles/installation.html).
- Your own Entra application configured and approved for [PnP interactive authentication](https://pnp.github.io/powershell/articles/authentication.html), with delegated SharePoint access sufficient to manage lists. Pass its Client ID to the script; this is separate from the sample's agent and solution IDs.
- A signed-in user with permission to create lists and fields on the tenant root site, such as a site owner. The application permissions and the user's permissions must both allow the operation.

If the module is not installed, run this in PowerShell:

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
```

From the sample folder (`samples/expert-finder`, rather than the nested SPFx project), replace the URL and Client ID below with your own values:

```powershell
$clientId = '<YOUR_ENTRA_APP_CLIENT_ID>'
./scripts/Provision-ExpertsList.ps1 -SiteUrl 'https://contoso.sharepoint.com' -ClientId $clientId
```

The script opens an interactive sign-in. It accepts only the HTTPS tenant root URL, rejecting paths such as `/sites/demo`. To check the target without signing in or making any requests, use:

```powershell
./scripts/Provision-ExpertsList.ps1 -SiteUrl 'https://contoso.sharepoint.com' -ClientId $clientId -WhatIf
```

It creates a missing generic list named `Experts`, requires the built-in `Title` column and adds the missing custom fields defined below. Compatible existing columns and all list items are preserved. If an existing custom column has incompatible settings or choices, the script stops before changing any columns; review that schema manually instead of converting or recreating it automatically. A partially provisioned list can be completed by rerunning the script after resolving the conflict.

The script creates no users or sample records and changes no permissions or Graph consent. Creating an empty list switches the component to SharePoint mode, where it shows an empty state until records are added. Add experts, then reload the component.

## Schema and manual setup

You can also create the same schema manually:

1. Open the tenant root site, rather than a site under `/sites/` or `/teams/`, with an account allowed to create lists.
2. Create a blank list named **Experts**. Use its existing `Title` column for the expert's job title.
3. Add the columns below using these exact internal names. Create them with these names before changing display labels.

| Internal name | Type | Configuration |
| --- | --- | --- |
| `Title` | Single line of text | Required; job title |
| `Expert` | Person | Required; one user; people only |
| `Skill` | Choice | Required; single selection; `SPFx`, `Copilot`, `DB`, `Spanish`; fill-in disabled |
| `ShortCV` | Multiple lines of text | Plain text |
| `Department` | Single line of text | Department or team |

`Skill` is a single-choice column. Add separate rows when a person has more than one skill, and avoid repeated rows for the same person/skill pair.

## Add example records

[experts-sample-data.json](experts-sample-data.json) contains 15 fictional example rows for manual setup. It is neither an import script nor a runtime data source. For each row, resolve `ExpertName` to an authorized test user using the **Expert** Person picker, then copy the other fields. Do not create accounts from fictional names or use them as login claims.

The example file intentionally has no Spanish rows so that you can check the empty state. Actual results depend on the rows the signed-in user can read. Keep each skill result set at 100 rows or fewer: the sample reports an error when SharePoint returns another page instead of silently truncating the directory.

Grant test users read access to the root site and list as needed. The provider uses `SPHttpClient` with the signed-in user's SharePoint permissions. No Graph permission is required to read the list.

## Automatic data-source selection

At initialization, the component derives the root URL from `new URL(context.pageContext.web.absoluteUrl).origin` and checks:

```http
GET https://YOUR-TENANT.sharepoint.com/_api/web/lists/getbytitle('Experts')?$select=Id
```

| Result | Behavior |
| --- | --- |
| HTTP 200 | Use SharePoint and show the SharePoint source label |
| HTTP 404 | Use bundled fictional profiles and show the Demo data label |
| Other HTTP error or network failure | Show the error; do not switch to mocks |
| Existing list with no matching rows | Show the empty state |

The check runs once per component instance. Reload after creating the list. Opening Workbench from a different site still uses the tenant root; there is no tenant URL or manual mock-mode setting to edit.

The SharePoint item request filters `Skill` on the server and expands the `Expert` Person field. Name-prefix, department and job-title filters operate on the fetched results in memory.

## User identities and optional Graph features

The Person field supplies the display name, membership login and SMTP email. The component derives the UPN for photos and Teams links from the membership login, and uses the Person field's email for calendar availability. It does not guess either identity from a display name.

Live photos use Graph and fall back to initials when unavailable. Availability requires a valid SMTP email, an accessible Exchange mailbox, compatible delegated consent and calendar-sharing policies. A working profile photo does not establish calendar access. Meeting creation also needs an organizer mailbox that supports Teams meetings.

Follow the [Graph permission guide](graph-permissions.md) to enable those features, and the [manual validation checklist](validation.md) to check the configured tenant. Fictional profiles use bundled portraits, make no Graph requests and cannot create real meetings.

Reference: [SharePoint REST query operations](https://learn.microsoft.com/en-us/sharepoint/dev/sp-add-ins/use-odata-query-operations-in-sharepoint-rest-requests).
