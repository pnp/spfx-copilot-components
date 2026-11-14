/**
 * Fixtures captured from the tenant, not written by hand (todo.md 8.9 N4).
 *
 * The capture does not re-query SharePoint its own way. It runs the SHIPPED
 * store — `initializeAsync()`, `save()`, `getRecent()` — over a connection that
 * records every parsed response (`Recorder`), then keeps exactly what the store
 * was handed. A required built-in column (L1), a date returned as UTC midnight
 * or a day early (L4), a size returned as a string: if the platform sends it,
 * the fixture has it, because the fixture IS what the platform sent.
 *
 * Everything that would identify the tenant is removed before anything is
 * written, and `leaksIn()` refuses the result if any of it survived:
 *   - `odata.*` / `__*` metadata (it carries absolute URLs), dropped
 *   - the site's server-relative path -> /sites/records
 *   - content type ids, minted per tenant (Decision 6) -> the same structure
 *     with each GUID segment replaced by a hash of the type's name
 *   - item ids, receipt numbers, file names, people and timestamps -> fixed
 *     values in the same format, so a re-capture of an unchanged tenant is
 *     byte-identical and `--check` only reports real drift
 * What is never normalised: field links, choices, and the raw DocumentDate,
 * File.Length and every other value's type and format.
 */
import { createHash } from 'node:crypto';

export const FIXTURE_DOCUMENT_DATE = '2026-08-01';
export const FIXTURE_TIMESTAMP = '2026-08-18T09:00:00';
const PSEUDO_SITE = '/sites/records';

/** Records every parsed response on the connection it is added to. */
export function Recorder(log) {
  return instance => {
    instance.on.post(async function (url, result) {
      log.push({ url: String(url), result });
      return [url, result];
    });
    return instance;
  };
}

/** The responses the store's own calls produced, found by URL. Throws naming what is missing. */
export function classify(log) {
  const find = (label, pattern) => {
    const hits = log.filter(e => pattern.test(e.url));
    if (hits.length === 0) {
      throw new Error(`The recorded calls contain no ${label} (${pattern}). PnPjs's URL shape has changed; update classify().`);
    }
    return hits;
  };
  const fieldLinks = {};
  for (const e of find('field links', /\/contenttypes\('[^']+'\)\/fieldlinks/i)) {
    fieldLinks[/\/contenttypes\('([^']+)'\)\/fieldlinks/i.exec(e.url)[1]] = e.result;
  }
  return {
    rootFolder: find('library root folder', /\/rootfolder/i)[0].result,
    contentTypes: find('library content types', /\/contenttypes(\?|$)/i)[0].result,
    fieldLinks,
    departmentChoices: find('FilingDepartment choices', /getByInternalNameOrTitle\('FilingDepartment'\)/i)[0].result,
    items: log.filter(e => /\/items(\?|$)/i.test(e.url)).map(e => e.result)
  };
}

/**
 * Removes `odata.*` and `__*` keys at every depth, and any key carrying an
 * `@odata.` annotation — SharePoint adds `File@odata.navigationLinkUrl` beside
 * every expanded field, and that URL names the list by GUID (first tenant
 * capture, 2026-09-22). The store reads none of them.
 */
export function stripMetadata(value) {
  if (Array.isArray(value)) return value.map(stripMetadata);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !k.startsWith('odata.') && !k.startsWith('__') && !k.includes('@odata.'))
        .map(([k, v]) => [k, stripMetadata(v)])
    );
  }
  return value;
}

/**
 * A content type id with each `00` + GUID segment replaced by a hash of the
 * type's name: same grammar (parent + 00 + 32 hex, repeated), no tenant in it.
 */
export function pseudonymousContentTypeId(id, name) {
  let rest = id.slice(2);
  const segments = [];
  while (rest.length >= 34 && rest.slice(-34, -32) === '00') {
    segments.unshift(rest.slice(-32));
    rest = rest.slice(0, -34);
  }
  const pseudo = segments.map((_, i) =>
    createHash('sha256').update(`${name}:${i}`).digest('hex').slice(0, 32).toUpperCase()
  );
  return '0x' + rest + pseudo.map(p => '00' + p).join('');
}

/** A timestamp's date and time replaced, its format (fraction, zone) kept. */
function fixedTimestamp(value) {
  const m = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.exec(value);
  return m ? FIXTURE_TIMESTAMP + (m[1] ? '.' + '0'.repeat(m[1].length - 1) : '') + (m[2] || '') : value;
}

/** Every string in `value` with each [from, to] pair replaced. */
function replaceEverywhere(value, pairs) {
  if (typeof value === 'string') return pairs.reduce((s, [from, to]) => s.split(from).join(to), value);
  if (Array.isArray(value)) return value.map(v => replaceEverywhere(v, pairs));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceEverywhere(v, pairs)]));
  }
  return value;
}

/**
 * The fixture, from what `classify()` found. `run` is the capture's own
 * marker, `ownFiles` maps each captured file name to the fixed name it gets,
 * `statusChoices` is the one read the store does not make itself.
 */
export function buildFixture({ recorded, statusChoices, ownFiles, formatReceiptNumber, source }) {
  const root = recorded.rootFolder.ServerRelativeUrl;
  const sitePath = root.slice(0, root.lastIndexOf('/'));

  const contentTypes = stripMetadata(recorded.contentTypes);
  const idPairs = contentTypes
    .map(ct => [ct.Id.StringValue, pseudonymousContentTypeId(ct.Id.StringValue, ct.Name)])
    .sort((a, b) => b[0].length - a[0].length); // longest first, so a parent never clips a child

  // Keyed by the pseudonymous id directly: replaceEverywhere() rewrites values, not keys.
  const pseudoOf = new Map(idPairs);
  const fieldLinks = {};
  for (const [id, links] of Object.entries(recorded.fieldLinks)) {
    if (!pseudoOf.has(id)) throw new Error(`Field links were read for content type ${id}, which the library did not list.`);
    fieldLinks[pseudoOf.get(id)] = stripMetadata(links).map(l => ({
      Name: l.Name,
      DisplayName: l.DisplayName,
      Required: l.Required,
      Hidden: l.Hidden
    }));
  }

  const names = Object.keys(ownFiles);
  const items = stripMetadata(recorded.items.flat())
    .filter(item => names.includes(item.FileLeafRef))
    .sort((a, b) => names.indexOf(a.FileLeafRef) - names.indexOf(b.FileLeafRef))
    .map((item, i) => {
      const id = 101 + i;
      const out = { ...item, Id: id, FileLeafRef: ownFiles[item.FileLeafRef] };
      if ('ID' in out) out.ID = id;
      if ('ReceiptNumber' in out) out.ReceiptNumber = formatReceiptNumber(id);
      if (typeof out.FileRef === 'string') out.FileRef = out.FileRef.replace(item.FileLeafRef, ownFiles[item.FileLeafRef]);
      if (typeof out.Created === 'string') out.Created = fixedTimestamp(out.Created);
      if (out.Author && 'Title' in out.Author) out.Author = { ...out.Author, Title: 'Filing User' };
      if (out.ReportOwner && 'Title' in out.ReportOwner) out.ReportOwner = { ...out.ReportOwner, Title: 'Report Owner' };
      return out;
    });
  if (items.length !== names.length) {
    throw new Error(`getRecent returned ${items.length} of the ${names.length} captured files; cannot capture the item shape.`);
  }

  const pairs = [...idPairs, [sitePath, PSEUDO_SITE]];
  return {
    $source: source,
    library: replaceEverywhere({ contentTypes, fieldLinks }, pairs),
    choices: {
      FilingDepartment: stripMetadata(recorded.departmentChoices).Choices,
      FilingStatus: statusChoices
    },
    recent: { documentDateWritten: FIXTURE_DOCUMENT_DATE, items: replaceEverywhere(items, pairs) }
  };
}

/**
 * Every secret, and every dashed GUID, still in the fixture — each as
 * "<what> at <JSON path>", so a refusal names the field to scrub rather than
 * only the value (todo.md 8.9 N4a). Walks every key and every scalar value;
 * a hit inside a key name is reported with "(in the key)". One entry per
 * place, so the same GUID in two items is two lines.
 */
export function leaksIn(fixture, secrets) {
  const wanted = secrets.filter(([, v]) => v).map(([label, v]) => [label, String(v).toLowerCase()]);
  const guidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const found = [];

  const inspect = (text, where) => {
    const lower = text.toLowerCase();
    for (const [label, value] of wanted) {
      if (lower.includes(value)) found.push(`${label} at ${where}`);
    }
    for (const match of text.matchAll(guidPattern)) found.push(`a GUID (${match[0]}) at ${where}`);
  };
  const walk = (value, path) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (value && typeof value === 'object') {
      for (const [key, v] of Object.entries(value)) {
        const child = path ? `${path}.${key}` : key;
        inspect(key, `${child} (in the key)`);
        walk(v, child);
      }
    } else if (value !== null && value !== undefined) {
      inspect(String(value), path || '(root)');
    }
  };
  walk(fixture, '');
  return found;
}

/** JSON paths that differ between two fixtures, ignoring `$source`. */
export function driftBetween(committed, captured, path = '') {
  if (path === '' ) {
    committed = { ...committed, $source: undefined };
    captured = { ...captured, $source: undefined };
  }
  if (JSON.stringify(committed) === JSON.stringify(captured)) return [];
  const bothObjects = committed && captured && typeof committed === 'object' && typeof captured === 'object';
  if (!bothObjects || Array.isArray(committed) !== Array.isArray(captured)) {
    return [`${path || '(root)'}: ${JSON.stringify(committed)} -> ${JSON.stringify(captured)}`];
  }
  const keys = [...new Set([...Object.keys(committed), ...Object.keys(captured)])];
  return keys.flatMap(k => driftBetween(committed[k], captured[k], `${path}${Array.isArray(committed) ? `[${k}]` : `.${k}`}`));
}
