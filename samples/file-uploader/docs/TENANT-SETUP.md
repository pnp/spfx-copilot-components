# Tenant setup — the records library

What has to exist in SharePoint for the live store
(`services/SharePointDocumentStoreService.ts`) to work. Nothing here is component
code; all of it is tenant configuration, and it is the schema the live service
compiles against. Until a tenant opts in, the component runs on sample data.

**Site:** your records site, `https://<tenant>.sharepoint.com/sites/<site>`. No
tenant is committed to this repo. It lives in
`tenant.local.json` (below), or the scripts take it as `-SiteUrl`.

## Deploy this in your tenant: the walkthrough

This takes the sample from a clone to a real filing in Microsoft 365 Copilot in
your own tenant. The only file you edit is `tenant.local.json`. The rest of
this page explains what each script does and why.

**What you need.** Someone who can register an Entra ID app, once. An owner
of the SharePoint site that will hold the records. A site collection admin
(and owner) of the tenant App Catalog, to deploy and to set the tenant
settings. The people who will file need a Microsoft 365 Copilot licence and
**delete** permission on the library (the default Contribute and Edit levels
include it; a save that fails halfway needs it to roll back). A machine with
PowerShell 7+ (not Windows PowerShell 5.1), PnP.PowerShell 2.x+ and Node 22.
An existing site for the records: the scripts add a library to it and change
nothing else.

Run everything from the sample folder.

1. **Register the app, once per tenant.**
   `Register-PnPEntraIDAppForInteractiveLogin -ApplicationName "PnP PowerShell" -Tenant <tenant>.onmicrosoft.com -SharePointDelegatePermissions AllSites.FullControl`
   *Done when* it prints a client id and you have consented in the browser.
2. **Name your tenant.** `Copy-Item tenant.example.json tenant.local.json`,
   then fill in `tenantId`, `clientId`, `sharepoint.siteUrl` and one
   `filingUsers` email. Git ignores the file. Never commit it.
   *Done when* `npm install` and `npm run check:tenant-config` pass.
3. **Provision the library.** `./scripts/provision-records-library.ps1`
   *Done when* it ends without an error. It is safe to re-run.
4. **Verify what SharePoint stored.** `./scripts/verify-records-library.ps1`
   *Done when* it prints **All checks passed** with one warning, that
   `DocumentIntake.Store` is not set yet. That is expected until step 7.
5. **Prove the store against your library.** `npm run test:tenant`. A
   browser sign-in opens once; sign in as a filing user.
   *Done when* every scenario passes and nothing is listed under "Could not
   recycle". It files test documents named `tenant-test-<run id>-*` and
   recycles them.
6. **Build the package.** `npm run build`
   *Done when* it ends green and `sharepoint/solution/file-uploader.sppkg`
   exists. (The committed package works too; building proves your clone.)
7. **Deploy and switch to live filing.**
   `./scripts/deploy.ps1 -PreflightOnly`, then
   `./scripts/deploy.ps1 -SetTenantSetting`.
   *Done when* it prints `Get-PnPApp: … Deployed=True` and the two tenant
   settings, and ends with a numbered list of manual steps. If it stops, the
   message names the pre-flight item and the fix. It turns custom script on
   for the App Catalog, which the upload needs; `-KeepCustomScriptOff` opts
   out.
8. **Add to Teams, first deploy only.** In the browser: App Catalog →
   **Manage apps** → the solution → **Add to Teams**.
   *Done when* **Document Intake** is listed in the Microsoft 365 admin
   centre → **Agents**. Do not uninstall the agent to "reset" it later: a
   new `.sppkg` is how behaviour changes, and Add to Teams answers "couldn't
   add" for an agent that already exists.
9. **Install it for yourself.** Wait 5–10 minutes, then install it to
   yourself from admin centre → **Agents** to skip the store delay.
10. **File one real document.** Start a new chat with Document Intake and
    ask *File this invoice for the Programs team*. Select **Choose a file**,
    review, and confirm.
    *Done when* the receipt reads *Saved just now by <you> — <file> is
    filed. Receipt #F-<n>*, with no "Sample data" line, and the file is in
    `Records/Finance/Invoices/Programs/<year>` with its columns filled in.
    If the first call shows Copilot's "Something went wrong" card, send the
    request again.

**Later deploys** are steps 6, 7 and 10: bump `solution.version` and every
`features[].version` together in `config/package-solution.json`,
`npm run build`, `deploy.ps1`. **Back to sample data:**
`Remove-PnPStorageEntity -Key "DocumentIntake.Store"`.

## Your tenant configuration: `tenant.local.json`

Every tenant script reads one git-ignored file at the component root. Copy the committed example and fill it in:

```powershell
Copy-Item tenant.example.json tenant.local.json
```

```json
{
  "tenantId": "<tenant>.onmicrosoft.com",
  "clientId": "00000000-0000-0000-0000-000000000000",
  "auth": "user",
  "certificatePath": "",
  "certificateThumbprint": "",
  "store": "sharepoint",
  "sharepoint": {
    "siteUrl": "https://<tenant>.sharepoint.com/sites/<site>",
    "libraryName": "Records"
  },
  "filingUsers": []
}
```

| Field | Read by | Meaning |
|---|---|---|
| `tenantId` | `test:tenant` | the tenant's `onmicrosoft.com` domain or its GUID — the sign-in authority |
| `clientId` | all | the Entra app registration below |
| `auth` | `test:tenant` only | `user` (default): sign in as a person, so the run proves that person's permissions. `app`: certificate, unattended, and proves nothing about user permissions |
| `certificatePath` | `test:tenant`, `auth: app` only | the app certificate's **private key, PEM** (not a `.pfx` — MSAL for Node reads PEM). Keep it outside the repo, or anywhere git ignores |
| `certificateThumbprint` | `test:tenant`, `auth: app` only | that certificate's SHA-1 thumbprint, hex, as the Entra app registration shows it |
| `store` | `test:tenant` | which store the contract runs against; mirrors the tenant setting `DocumentIntake.Store` |
| `sharepoint.siteUrl` | all | the records site |
| `sharepoint.libraryName` | all | defaults to `Records` |
| `filingUsers` | verify | emails whose delete permission is checked (`-FilingUser`) |

A command-line parameter always wins over the file, and `PNP_CLIENT_ID` is still
read when `clientId` is empty. A value left as the example's placeholder counts
as unset, so a copied-but-unfilled file stops with the field it is missing.
`npm run check:tenant-config` (second step of `npm run build`) fails if
`tenant.local.json` is ever tracked, and if any committable file in this
component names a real tenant host — or, on a machine that has a
`tenant.local.json`, contains one of its values.

## Order

The column **internal names** below are string constants in the live service,
and `getKinds()` reads kinds and required fields *from* the content types, so the
library has to match this page exactly — a stray content type or an unknown
required column stops the component at start-up with the reason. The Syntex
experiments with automatic classification need a live library too.

Order: site columns → content types → library → tenant setting.

## The short way: run the script

`scripts/provision-records-library.ps1` does everything on this page and is
idempotent — re-run it to bring a second tenant to the same shape, or to
repair a hand-made mess.

```powershell
# once per machine
Install-Module PnP.PowerShell -Scope CurrentUser

# once per tenant — PnP.PowerShell 2.x+ has no multi-tenant app of its own.
# Interactive browser sign-in is this cmdlet's default; there is no -Interactive
# switch on it (the only alternative is -DeviceLogin).
Register-PnPEntraIDAppForInteractiveLogin `
    -ApplicationName "PnP PowerShell" -Tenant <tenant>.onmicrosoft.com `
    -SharePointDelegatePermissions AllSites.FullControl

# put the client id it prints, the site and a filing user in tenant.local.json
# (above), then, from components/file-uploader (pwsh 7+, not Windows PowerShell 5.1)
./scripts/provision-records-library.ps1

# always follow it with the read-only verifier: provisioning prints what it
# ASKED for, this prints what SharePoint STORED. Exits non-zero on any failure.
./scripts/verify-records-library.ps1

# only when you are ready to file for real: set the tenant settings to
# this site. Needs an owner of the tenant app catalog site.
./scripts/provision-records-library.ps1 -SetTenantSetting
```

Without a `tenant.local.json`, pass `-SiteUrl`, `-ClientId` and (verify only)
`-FilingUser` instead.

Provisioned and verified green against the dev site on 2026-09-10.

### Then prove the store against it: `npm run test:tenant`

The verifier proves the library's *shape*. Loop 2 proves
the component can *use* it: it runs the shipped `SharePointDocumentStoreService`,
compiled from `src/`, from Node against this library. It files real test
documents, reads them back and recycles them.

```powershell
npm run test:tenant              # all of it
npm run test:tenant -- -t L4     # one tagged scenario
```

- **Opt-in.** Without `tenant.local.json` it prints why and exits 0. It is not
  part of `npm run build` and never runs in CI unless someone wires it there.
- **What it writes.** Files named `tenant-test-<run id>-*.pdf` into the real
  destination folders (`Finance/<kind>/Programs/<year>`), plus a
  `tenant-test-<run id>-fresh` folder. Everything goes to the recycle bin at the
  end, pass or fail. Anything it cannot recycle is listed by name. The run id is
  printed at the start.
- **Tags.** Each test is tagged `[L1]`, `[L4]`–`[L7]` or `[Deferred]`, the
  finding it settles from the component's first live runs. The `[Deferred]` tests also print what SharePoint
  actually answered.
- **Sign-in (`auth`).**
  - `"user"` (default): a browser window opens once and the token is cached in
    the git-ignored `.tenant-token-cache.json`. It uses the same app
    registration and the same interactive loopback sign-in as PnP.PowerShell,
    so the app made by `Register-PnPEntraIDAppForInteractiveLogin` needs no
    change. It runs as you, so run it as a filing user (Contribute plus delete)
    to prove the delete prerequisite rather than assert it.
  - `"app"`: certificate, unattended. The app needs a certificate uploaded
    (`certificatePath` = its PEM private key, `certificateThumbprint` = its
    SHA-1 thumbprint) and SharePoint *application* permission
    `Sites.FullControl.All` or `Sites.Selected` with admin consent. The run says,
    at the start and the end, that it proves nothing about user permissions.
- **Owner.** The expense-report scenario files with the first `filingUsers`
  entry as the report owner, or with your own email if that list is empty. In
  app mode, set `filingUsers`.

### Keep the local fakes honest: `npm run capture:fixtures`

The local tests' SharePoint fake answers with
`src/copilotComponents/fileUploader/services/__fixtures__/sharepoint-tenant.json`. That file is written by this command, not by hand.

```powershell
npm run capture:fixtures    # rewrite the fixture from this tenant; review the diff
npm run check:fixtures      # same capture, compared instead of written; exit 1 on drift
```

- It runs the shipped store over a connection that records every response:
  start-up reads the content types, field links and department choices; it
  saves one invoice and one expense report; `getRecent` reads the item shape.
  It also reads the `FilingStatus` choices. It keeps what SharePoint returned,
  so a built-in required column or a date returned a day early is in the
  fixture because the platform sent it.
- Before writing, it scrubs anything that names the tenant: metadata, the site
  path, the content type GUIDs (the structure stays), people, item ids and
  timestamps (the format stays). It refuses to write if any of these survive:
  your host, site, tenant id, client id, a user's name or email, or any GUID.
  `check:tenant-config` also rejects this file if it contains a
  `tenant.local.json` value.
- The two files it writes are recycled at the end, pass or fail. Neither
  command is part of `npm run build`.

The rest of this document is what the script does and why — read it before
changing the script, and follow it by hand if you are provisioning a tenant
where you cannot run PnP.

## 1. Site columns

Site settings → Site columns → Create. Put all of them in a new group,
**Document Intake**.

| Internal name | Display name | Type | Settings |
|---|---|---|---|
| `FilingDepartment` | Department | Choice | Programs, Development, Finance, Operations · drop-down · no fill-in |
| `Vendor` | Vendor | Single line of text | |
| `ReportOwner` | Report owner | Person or Group | People only, single selection |
| `DocumentDate` | Document date | Date and Time | **Date Only** |
| `Amount` | Amount | Currency | 2 decimals (set via the `Decimals` schema attribute — display-only) |
| `FilingStatus` | Status | Choice | Received, Pending review, Approved, Paid, Returned |
| `ReceiptNumber` | Receipt number | Single line of text | |

**Two of those internal names dodge collisions that are real, not
hypothetical** — both confirmed present in this tenant on 2026-09-10:

- **`Department`** already exists as a *single line of text* in **Core Contact
  and Calendar Columns** (the Outlook contact field, internal name
  `ol_Department`). It is not a choice column and cannot carry the four
  department values, so ours is `FilingDepartment` with the display name
  "Department".
- **`Status`** already exists as a *choice* in **Core Document Columns**.
  Ours is `FilingStatus`, display name "Status".

The display names collide harmlessly — internal names are what must be unique,
and what the code uses. Pick columns from the **Document Intake** group when
building the content types and you will never touch the built-ins.

One more trap if you are clicking rather than scripting: **SharePoint derives
the internal name from the title you first type**, so creating a column called
"Document date" leaves you with `Document_x0020_date` forever. Type the
spaceless internal name, save, then edit the title. `Add-PnPField` takes
`-InternalName` and `-DisplayName` separately and avoids the whole problem.

The choice **labels** are what SharePoint stores; the code's `DepartmentKey` /
`FilingStatus` unions are camelCase keys (`programs`, `pendingReview`). The
mapping between them lives in `services/sharePointConfig.ts`, never in views (R8).

## 2. Content types

Site settings → Site content types → Create, parent **Document**, group
**Document Intake**.

**Invoice**

| Column | Required | Per-content-type display name |
|---|---|---|
| `FilingDepartment` | Yes | Department |
| `Vendor` | Yes | Vendor |
| `DocumentDate` | Yes | **Invoice date** |
| `Amount` | Yes | Amount |
| `FilingStatus` | Yes | Status |
| `ReceiptNumber` | No | Receipt number |

**Expense report**

| Column | Required | Per-content-type display name |
|---|---|---|
| `FilingDepartment` | Yes | Department |
| `ReportOwner` | Yes | Report owner |
| `DocumentDate` | Yes | **Period end** |
| `Amount` | Yes | Amount |
| `FilingStatus` | Yes | Status |
| `ReceiptNumber` | No | Receipt number |

Invoice requires `Vendor` and has no `ReportOwner` at all; Expense report the
reverse. That asymmetry is the reason there are two content types rather than
one, and it is what `validateDraft` enforces today from `requiredFields`.

Two things this buys the live `getKinds()` directly:

- the **Required** flag per content type → `IDocumentKindDefinition.requiredFields`
- the **per-content-type display name** override on `DocumentDate` →
  `dateFieldLabel` ("Invoice date" / "Period end")

The display-name override is a property of the content type's *field link*, not
of the column — in the UI it is Site content types → Invoice → the column →
Column Name. It is **written** through CSOM (`ct.FieldLinks`, then
`ct.Update($true)`), which is why the script does not use
`Add-PnPFieldToContentType` alone, and **read** through REST
(`/_api/web/contenttypes('<id>')/fieldlinks`). Two CSOM read routes were tried
first and both lied: `FieldLink.DisplayName` comes back empty unless explicitly
requested, and `ContentType.SchemaXml` loads but carries no `<FieldRefs>` for a
site content type. That is why the verifier reads through REST.

## 3. The library

Create a document library named **`Records`** — the string in `LIBRARY_NAME`,
which is the first segment of every resolved destination.

- Library settings → Advanced settings → **Allow management of content
  types = Yes**
- Add **Invoice** and **Expense report**
- Remove **Document** as the library default, so a file cannot be filed
  untyped. Do this last: a library must always have at least one content type.
- Versioning on; content approval **off** (status is modelled by
  `FilingStatus`, not by SharePoint approval)
- Check the library's **own copies** of the two content types, not only the
  site ones. The component reads the library's field links, and they can drift
  from the site's: on the dev tenant `Records/Invoice` lost its "Invoice
  date" override every time a site-column change was pushed to lists, while
  the site content type kept it. The script pushes only real changes, and its
  *Library content types* step repairs Required and the display name there;
  the verifier checks both.

## 4. Folders

The destination is a pure function of metadata — there is no folder picker, by
design (README non-goal):

```
Records / Finance / {Invoices | Expense reports} / {Department} / {year}
```

Allow folder creation in the library, but do not pre-build the tree by hand —
the live `save()` creates the path on demand and idempotently
(`web.folders.addUsingPath(path, true)` one segment at a time, falling back to the
folder's `Exists` flag). Hand-built folders mean
someone has to remember to add a new year every January, and the first missed
one surfaces as a save failure.

## 5. Indexing

Index **`Created`** and **`Author`** before loading any volume of test data.
`getRecent()` filters to the current user over a 7/30/90-day window, newest
first; unindexed, that trips the 5,000-item list view threshold and starts
throwing in a way that reads like a bug in the component rather than a missing
index.

## 6. Leave Syntex off for now

When document processing is eventually switched on, Library settings →
Automatic classification and extraction must be set to **"New files only"** —
the default reprocesses on every upload *or edit*, which can overwrite a
human's correction. The overwrite behaviour is
undocumented and needs an empirical test here before anything relies on it.

## 7. The tenant setting that turns the live store on

The component runs on sample data until the tenant says otherwise. The switch is a pair of **tenant properties** (storage entities):
one naming the store, and one per setting of that store, so a
later store adds keys of its own without touching these.

| Key | Value |
|---|---|
| `DocumentIntake.Store` | `sharepoint` |
| `DocumentIntake.SharePoint.SiteUrl` | `https://<tenant>.sharepoint.com/sites/<site>` — absolute, https |

```powershell
# connected with Connect-PnPOnline; the default -Scope Tenant writes to the
# tenant app catalog, whichever site you connected to. The site first, so
# there is never a moment where the store is named without it.
Set-PnPStorageEntity -Key "DocumentIntake.SharePoint.SiteUrl" -Value "https://<tenant>.sharepoint.com/sites/<site>"
Set-PnPStorageEntity -Key "DocumentIntake.Store" -Value "sharepoint"
```

- **`DocumentIntake.Store` absent, blank or a store the component does not
  know** → sample data, with "Sample data — nothing is stored" on screen — so a
  mistyped store name shows up as that line, never as receipts that look real.
  **`sharepoint`** → the live store, against `DocumentIntake.SharePoint.SiteUrl`.
  **`sharepoint` with that key unset, not an absolute https URL, or either key
  unreadable** → the component shows the error, naming the key, with "Try
  again". It never falls back to sample data, whose receipts look real.
- Any user can read a tenant property. Writing one needs an owner of the tenant
  app catalog site (PnP PowerShell) or a SharePoint administrator (SharePoint
  Online Management Shell).
- `Remove-PnPStorageEntity -Key "DocumentIntake.Store"` puts the tenant back on
  sample data.
- `provision-records-library.ps1 -SetTenantSetting` and `deploy.ps1 -SetTenantSetting`
  (one shared function, `TenantConfig.ps1`) set both to the site in
  `tenant.local.json` (or `-SiteUrl`), idempotently. It is a switch, not a
  default, because it moves the whole tenant from sample data to live filing.
  `verify-records-library.ps1` passes when the store is `sharepoint` and the
  site key points at the site it verified, warns when the store is unset or
  unknown, and fails when the site key is missing, points elsewhere, is not an
  https URL, or a key cannot be read.
- **Before 2026-09-22** the switch was a single key,
  `DocumentIntake.RecordsSiteUrl`. Nothing reads it any more.
  `-SetTenantSetting` removes it if it is still there, and the verifier warns
  while it is.

## What the content types cannot supply

`getKinds()` returns more than SharePoint can express, so the live
implementation is **part-read, part-config**:

- **`statuses` and `defaultStatus`** — the per-kind lifecycle (Invoice starts
  *Received* and never enters *Pending review*; Expense report starts *Pending
  review* and never enters *Received*). A shared choice column holds all five
  values and cannot narrow them per content type. Needs a small map in code
  keyed by content type.
- **`folder`** — derivable from the content type name, but only while nobody
  renames one. An explicit map is safer than a derivation.
- **`key`** — `invoice` / `expenseReport` are code identifiers; the mapping
  from content type (name or ID) to key is config.

~~Content type **IDs** are more stable than names. Prefer keying that map on ID
and treating the name as a label.~~ **Resolved 2026-09-10: keyed on
content type NAME.** IDs are indeed more stable against renames, but
`provision-records-library.ps1` calls `Add-PnPContentType` without
`-ContentTypeId`, so SharePoint mints a random ID in every tenant it runs
against — an ID-keyed map would be right here and wrong everywhere else, and the
component would stop being deployable from the `.sppkg` alone. The names are
load-bearing instead, and `verify-records-library.ps1` asserts both on every run,
so a rename breaks at verification rather than silently at runtime. The map lives
in `src/copilotComponents/fileUploader/services/sharePointConfig.ts`.

**A library content type also carries required built-in columns, which the
component ignores by design.** Every document library marks `FileLeafRef` — the
file **Name** — required, and the component supplies that through the upload
rather than as a form field. Those columns are listed in
`IGNORED_REQUIRED_COLUMNS` (`sharePointConfig.ts`) and skipped before the check
that makes any *other* unknown required column a hard error. So the Required
flags that matter here are the ones on the columns in §1; you do not need to
clear a built-in's Required flag, and you must not add a column to the content
types expecting the form to collect it — that needs a code change.

**A field link's display name is the column's internal name unless the
content type overrides it.** The first capture from a tenant returned `FilingDepartment`, not "Department". `dateFieldLabelFrom()`
reads the override, so a library provisioned without the two overrides
(*Invoice date* under Invoice, *Period end* under Expense report) would label
the date field `DocumentDate`, and nothing would report an error.
Provisioning sets both, and `verify-records-library.ps1` asserts them. Run the
verifier after any hand change to the content types.

The step-by-step version of this page, for deploying into a new tenant, is
the walkthrough at the top. The guarantees a store keeps, and how to add
another one, are in [`STORE-CONTRACT.md`](./STORE-CONTRACT.md).

## Permissions

Permissions ride on the user's own access to this library. No Graph scopes, no
`webApiPermissionRequests` — flag it before adding either.

**The filing user needs delete permission.** The default **Contribute** and
**Edit** permission levels both include Delete Items (Edit is what a site's
Members group gets), so ordinary filers have it; only a custom permission level
with Delete Items removed breaks the rollback described here. Check a real filer
with `verify-records-library.ps1 -FilingUser`. SharePoint has no atomic "upload with metadata" call for a document
library, so `save()` uploads the file and then sets its columns; if the second
step fails it **recycles the uploaded file** and throws, which is how the
interface's "nothing is partially saved" promise stays true. Without
delete permission that rollback fails, and the save reports the file it had to
leave behind rather than failing cleanly.

## The mock boundary

~~`logic/destination.ts` imports `LIBRARY_NAME` from `models/seeds.ts` — mock
data reached from shared logic.~~ Fixed in the live swap: `LIBRARY_NAME` now
lives in `models/config.ts`, which `logic/destination.ts` and
`services/sharePointConfig.ts` both import and `models/seeds.ts` re-exports for
its existing readers. Layering is models ← logic ← services, so the constant
could not go in the services config module. ~~The mock boundary is clean.~~
**A second leak was found on 2026-09-11:** the full-screen view imported
`ORGANISATION_NAME` from the seeds, and the inline view hard-coded the fictional
organisation, so a live run would have shown it. Both are gone — the views name
the library instead — and `check:copilot-assets` now fails the build on any
`src/` import of `models/seeds` outside the mock store and tests.

## Verification on the first live run

- Uploading a file to `Records` prompts for a content type, and choosing
  **Invoice** demands Vendor but not Report owner
- `DocumentDate` shows as "Invoice date" under Invoice and "Period end" under
  Expense report
- A folder path `Finance/Invoices/Programs/2026` can be created by an account
  with only library access — no elevated permission, no Graph scope
- The current user can read back their own uploaded item with all seven columns
  populated
- **`DocumentDate` reads back as the date that was written.** It is a date-only
  column. The live service assumes SharePoint returns those at UTC midnight and
  takes the calendar date off the stored string (`isoDateFromSharePoint`) rather
  than routing it through `logic/dates.ts`, which is local-time by design. That
  assumption is unproven: SharePoint may instead return midnight in the *site's*
  time zone, which reads back a day early on a site east of UTC (audit M9). Check
  the site's regional time zone, then confirm a filing dated 1 January reads back
  as 1 January, not 31 December.
- **The tenant setting is read.** With it absent the component says
  "Sample data — nothing is stored"; with it set, that line is gone and a filing
  lands in `Records`.
