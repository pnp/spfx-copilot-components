/**
 * The tenant settings that choose the store (todo.md Decisions 11 and 17).
 *
 * `DocumentIntake.Store` names the store; each store then has keys of its own
 * under `DocumentIntake.<Store>.*`, so a later store adds keys without touching
 * these. Today there is one: `sharepoint`, which reads
 * `DocumentIntake.SharePoint.SiteUrl`. The pre-17 key
 * `DocumentIntake.RecordsSiteUrl` is not read at all.
 *
 * Pure and free of PnPjs, so it can be tested where `tenantSettings.ts` cannot
 * (AGENTS.md R36).
 */
export const STORE_KEY: string = 'DocumentIntake.Store';
export const SHAREPOINT_SITE_URL_KEY: string = 'DocumentIntake.SharePoint.SiteUrl';

/** The stores `DocumentIntake.Store` can name. Anything else is sample data. */
export type StoreName = 'sharepoint';

/** What the tenant chose: sample data, or a named store with its settings. */
export type StoreSelection = { store: 'sample' } | { store: 'sharepoint'; siteUrl: string };

/**
 * A `DocumentIntake.Store` entity as SharePoint returns it -> the store it
 * names, or `undefined` for sample data.
 *
 * Absent, null, blank **or unknown** means sample data (Decision 17 as ruled),
 * which the view then says on screen (R37) — so a mistyped store name is
 * visible as "Sample data — nothing is stored", never as live-looking receipts.
 * Matched case-insensitively.
 */
export function storeNameFrom(entity: unknown): StoreName | undefined {
  const value: string | undefined = entityValue(entity);
  return value?.toLowerCase() === 'sharepoint' ? 'sharepoint' : undefined;
}

/**
 * A `DocumentIntake.SharePoint.SiteUrl` entity -> the records site URL, trimmed
 * and without a trailing slash. Read only once the store is `sharepoint`, so an
 * empty value throws: the tenant chose the live store and named no site, and
 * falling back to sample data would hide that behind receipts that look real
 * (R25). A value that is not an absolute https URL throws for the same reason.
 */
export function sharePointSiteUrlFrom(entity: unknown): string {
  const value: string | undefined = entityValue(entity);
  if (value === undefined) {
    throw new Error(
      'The tenant setting ' + STORE_KEY + ' is "sharepoint" but ' + SHAREPOINT_SITE_URL_KEY + ' is not set.'
    );
  }
  const trimmed: string = value.replace(/\/+$/, '');
  let parsed: URL | undefined;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Not parseable as a URL at all; reported below with the value as set.
    parsed = undefined;
  }
  if (!parsed || parsed.protocol !== 'https:') {
    throw new Error(
      'The tenant setting ' + SHAREPOINT_SITE_URL_KEY + ' is "' + value + '", which is not an absolute https site URL.'
    );
  }
  return trimmed;
}

/**
 * The failure the caller renders when a storage-entity read itself rejects
 * (todo.md 8.5 E5). Names the key and the web the read was addressed to — in
 * the Copilot host that web is whichever one the host supplies, and a failure
 * that does not say which is unreadable (todo.md H2).
 *
 * The context is `unknown` here and tests pass stubs, so every step down to
 * `pageContext.web.absoluteUrl` is guarded.
 */
export function tenantSettingReadFailure(key: string, context: unknown, cause: unknown): Error {
  return new Error(
    'The Document Intake tenant setting ' +
      key +
      ' could not be read: ' +
      (cause instanceof Error ? cause.message : String(cause)) +
      askedWebSuffix(context)
  );
}

/**
 * Every empty form of a storage entity reads as `undefined`. SharePoint does
 * not document the shape of a missing key, so absent, `odata.null`, a null
 * `Value` and whitespace are all treated alike.
 */
function entityValue(entity: unknown): string | undefined {
  const value: unknown = entity && typeof entity === 'object' ? (entity as { Value?: unknown }).Value : undefined;
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function askedWebSuffix(context: unknown): string {
  const pageContext: unknown = readProperty(context, 'pageContext');
  const web: unknown = readProperty(pageContext, 'web');
  const absoluteUrl: unknown = readProperty(web, 'absoluteUrl');
  return typeof absoluteUrl === 'string' ? ' (asked ' + absoluteUrl + ')' : ' (asked an unknown web)';
}

function readProperty(source: unknown, name: string): unknown {
  return source && typeof source === 'object' ? (source as Record<string, unknown>)[name] : undefined;
}
