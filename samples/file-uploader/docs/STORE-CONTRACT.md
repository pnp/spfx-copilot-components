# The store contract — `IDocumentStoreService`

What every implementation of the document store must guarantee, how each
guarantee is proven, and what it takes to add a third store.

The interface is
[`services/IDocumentStoreService.ts`](../src/copilotComponents/fileUploader/services/IDocumentStoreService.ts).
Today it has two implementations: `MockDocumentStoreService` (sample data) and
`SharePointDocumentStoreService` (a document library whose content types
define the kinds). Views, mappers and controllers are the same for both.
A third store is a new file behind the same interface and a
new adapter for the tenant tests. The scenarios do not change.

**Nothing generic is built ahead of a second real store.** Building the
abstraction before there is a second store to prove it would repeat the
mock-first mistake. This page is the cheap part, done now, so the
second store arrives with its proof already written.

## The interface in one screen

| Member | Sync? | Contract |
|---|---|---|
| `isSampleData` | — | `true` only when nothing is really stored. Drives the on-screen "Sample data — nothing is stored" line |
| `initializeAsync()` | async | The one warm-up. Reads whatever the synchronous getters need. Awaited in `onInit()`, before the first real render |
| `getKinds()` | sync | Document kinds, each with `requiredFields`, `dateFieldLabel`, `folder`, `defaultStatus`, `statuses`. Only valid after `initializeAsync()` |
| `getDepartments()` | sync | Departments. Only valid after `initializeAsync()` |
| `validate(draft)` | sync | Pure check against the kind's rules. Never persists |
| `resolveDestination(draft, now)` | sync | Where a draft would land, or `undefined` if kind or department is unknown |
| `save(drafts, now)` | async | One receipt per draft, in order, or a throw with nothing left behind (G2) |
| `getRecent(filter, now)` | async | The signed-in user's filings matching the filter, newest first |

Failures to reach the store throw `DocumentStoreUnavailableError`. Every
method that needs the time takes `now`, so no store reads the clock itself.

## The guarantees

Each guarantee states the rule, the evidence that made it a rule, and where it
is proven. *Loop 1* is `heft test` (local, offline). *Loop 2* is
`npm run test:tenant` (the shipped store against a real tenant). *Loop 3* is
the Copilot host. Loop 2 needs a tenant: see the walkthrough in
[`TENANT-SETUP.md`](./TENANT-SETUP.md).

### G1 — A receipt exists only after a real record does

`save()` returns a receipt only when the store has a durable record with its
own id, and the receipt number comes from that id. A store that cannot
produce one throws. It never makes up a number.

- *SharePoint:* the receipt is `F-` + the list item id, written back to the
  item's `ReceiptNumber` column.
- *Why:* on 2026-09-22 a mock receipt, *"ont33.png is filed. Receipt
  #F-10946"*, appeared in a live tenant with nothing stored. It looked exactly
  like a real one.
- *Proven:* loop 2 `[L4]`: the receipt number equals the item id read back
  independently of the service. Loop 1: the lifecycle suite's
  *rendering before startup resolves* tests.

### G2 — A save is all or nothing, and a partial failure says what it left

If any draft in a `save()` call fails, the call throws and nothing from that
call stays stored. Where the platform has no transaction, the store rolls back
what it wrote. If the rollback itself fails, the error names every file it
left behind. It never reports a clean failure it did not achieve.

- *SharePoint:* no atomic "upload with metadata" call exists, so the store
  uploads, sets the columns, and recycles every file the call uploaded when a
  later step fails. That needs delete permission
  ([`TENANT-SETUP.md`](./TENANT-SETUP.md) *Permissions*).
- *Proven:* loop 2 `[L7]` twice: a collision on the second file recycles
  the first; a refused recycle produces an error naming the orphan.

### G3 — `isSampleData` is honest and visible

`isSampleData` is `true` exactly when nothing is stored, and whenever it is
`true` the view says so in words. A store never pretends to be the
other kind. The choice between them belongs to the tenant, never to a tool
argument.

- *Proven:* loop 2 `[L1]` asserts `false` on the live store. Loop 1 asserts
  the sample line on the mock and its absence on a live stub.

### G4 — Warm-up completes before the first real render

The synchronous getters are called during render, so `initializeAsync()`
must have settled first. On the component side, `render()` never chooses
a store. Until `onInit()` settles it shows the starting view,
which needs no store and makes no sample/live claim.

- *Why:* the host can call `render()` while `onInit()` is still awaiting the
  tenant read. On 2026-09-22 that early render built a mock and bound the
  controllers to it, and the views later drew live copy over a mock save.
- *Proven:* loop 1 lifecycle, *rendering before startup resolves*,
  three tests. Loop 3: L2b showed the `store-starting` skeleton, then the
  live form (2026-09-23).

### G5 — It runs as the signed-in user

The store uses the user's own access. It has no service identity, no
elevation and no secret in the package. If the user cannot write the record,
the save fails and says so.

- *SharePoint:* PnPjs from the Copilot component's context. No Graph scopes,
  no `webApiPermissionRequests`.
- *Proven:* loop 2 with `"auth": "user"`, run as a filing
  user. An `"auth": "app"` run says at start and end that it proves nothing
  about user permissions.

### G6 — The store supplies the schema; the views never do

Kinds, their required fields, date labels and departments come from the
store. A view that hard-codes one breaks the next store silently. If the
store finds something it cannot map, such as an unknown required column,
`initializeAsync()` throws with the reason. It does not guess.

- *SharePoint:* content types and their field links, the department choice
  column, plus the part-config map in `sharePointConfig.ts` for what content
  types cannot express ([`TENANT-SETUP.md`](./TENANT-SETUP.md) *What the
  content types cannot supply*).
- *Proven:* loop 2 `[L1]` against the real content types; loop 1 against the
  fixture captured from the tenant, not typed by hand.

### G7 — The date written is the date read

A calendar date (`YYYY-MM-DD`) round-trips unchanged: no time-zone shift, no
off-by-one. Store it as a date wherever the platform allows.

- *Proven:* loop 2 `[L4]` writes the first of the month, so a date read back
  a day early lands in the previous month. Loop 3: L2b's Invoice date read
  `9/1/2026` in the library.

### G8 — Unreachable means an error, never a fallback

A store that cannot be reached, or a tenant setting that cannot be read,
ends in `DocumentStoreUnavailableError` or a startup error. The view shows
it with **Try again**. Nothing falls back to the mock, because the mock's
receipts look real (Decisions 11, 17).

- *Proven:* loop 1 lifecycle, *starting the store*: an unreadable setting
  shows the error, and Try again recovers.

### G9 — Recent means mine, newest first

`getRecent()` returns only the signed-in user's filings, in reverse
chronological order, filtered on the server where the platform allows.

- *Proven:* loop 2 `[L4]` reads back its own filing through `getRecent`.
  Loop 3: *"What have I filed this week?"* rendered the L2b filing
  (2026-09-23).

## How a store is chosen

One place decides: `resolveDocumentStoreAsync()` in
`services/documentStoreFactory.ts`. It reads the tenant setting
`DocumentIntake.Store`:

| Value | Store |
|---|---|
| absent, blank, unknown | mock, with the sample line on screen |
| `sharepoint` | `SharePointDocumentStoreService` against `DocumentIntake.SharePoint.SiteUrl` |
| `sharepoint`, site key unusable or unreadable | error with Try again, never the mock |

Each store's settings live under its own prefix
(`DocumentIntake.<Store>.*`), so a new store adds keys without touching these. `tenant.local.json` mirrors this: `store` names it, and a
block per store carries its settings.

## How the contract is tested

Loop 2 splits in two so that a new store brings only the part that is
specific to it:

- **`tenant-tests/contract.test.mjs`** holds the scenarios. They talk only to
  `IDocumentStoreService` and to the adapter's read-back probes.
- **`tenant-tests/stores/<store>.mjs`** is the adapter. It connects, builds
  the shipped store, and reads back what was stored without going through
  the service.

An adapter exports `createAdapter(config)`, returning:

| Member | Purpose |
|---|---|
| `name` | printed in the suite title |
| `createStore({ failRollback? })` | a fresh, uninitialised shipped store. `failRollback` makes the store's rollback call fail, for the G2 orphan scenario |
| `readBack(receipt)` | `{ id, fileName, kindLabel, documentDateRaw, ownerEmail, receiptNumber }` read from the platform directly |
| `findByFileName(name)` | stored records with that file name, for "nothing was left behind" |
| `recycleByFileName(name)` | clean-up. Returns how many |
| `sp` (SharePoint only) | the raw connection, for `sharepoint-platform.test.mjs`, which tests platform facts, not the contract |

**Honest limit.** Some expectations in the scenarios are still in
SharePoint's words. They are the `F-` prefix, the content type names *Invoice*
and *Expense report*, the date labels, and the error messages for an unknown
person, a collision and an orphan. The scenario list is store-neutral, but
those values are not. When a second store arrives, move those expected values
into the adapter (for example an `expect` block on it) in the same change.
Do it then and not before, for the reason at the top of this page.

`tenant-tests/config.mjs` accepts only `store: "sharepoint"` today and says so
for any other value.

## Adding a store

1. `services/<Name>DocumentStoreService.ts` implements the interface. It
   imports platform clients as types only. Values are loaded behind a
   function.
2. `services/storeSetting.ts` learns the store name and its keys. The factory
   gets one branch. Nothing else in `src/` changes. If a view has to change,
   the boundary is in the wrong place (R8).
3. Loop 1: unit tests over a fake built from a captured fixture, as
   `npm run capture:fixtures` does for SharePoint,
   not typed by hand. The lifecycle suite's live stub already covers G1, G3,
   G4 and G8 for any store.
4. `tenant.example.json` gains the store's block with placeholders only
   (`check:tenant-config` enforces that). `tenant-tests/config.mjs` accepts
   the name.
5. `tenant-tests/stores/<name>.mjs` is the adapter above. Move the
   store-specific expected values out of the scenarios (*Honest limit*).
6. `npm run test:tenant` green against a real instance, run as a user.
7. README: the tier paragraph under *Deploy this in your tenant*. For a tier 2
   store, also `webApiPermissionRequests` in `config/package-solution.json`
   and the admin-consent step in the deploy walkthrough.

## What a store can be: three tiers

The limit is what a Copilot component can reach from inside the canvas.

| Tier | Examples | Component code | What the deployer must do |
|---|---|---|---|
| **1 — same trust boundary** | another library or site, OneDrive / Graph drives | small | nothing new |
| **2 — Entra-protected APIs** | Microsoft Graph, Dataverse, an owner-hosted API in front of SQL (Azure Function / App Service) | small (`AadHttpClient` / `MSGraphClientV3`); a custom API is its own project | `webApiPermissionRequests` in `package-solution.json`, then **a tenant admin approves API access** after the `.sppkg` deploys. For a custom API, host and secure it |
| **3 — not from the component** | direct SQL, third-party APIs (the canvas blocks them, as the roadmap sample showed on 2026-09-20), MCP servers, Power Platform connectors | — | put it behind a tier 2 API, or make it the agent's job (a second action), not this form's |

Tiers 1 and 2 are supported by design. Tier 3 is not, for two reasons. The
canvas blocks calls to arbitrary origins. And G5 rules out the rest: a store
that needs a secret or a service identity cannot ship inside a `.sppkg`.
Tier 2 stays within G5, because the component calls the API on the user's
behalf with a delegated token.
