/**
 * URL and list lock: the wizard only ever talks to SharePoint on the tenant it is running in.
 * Tool arguments from Copilot and property-pane values are untrusted until checked here.
 */
const SHAREPOINT_SUFFIXES = ['.sharepoint.com', '.sharepoint.us', '.sharepoint.de', '.sharepoint.cn', '.sharepoint-mil.us'];

export function isSharePointHost(hostname: string): boolean {
  const host = (hostname || '').toLowerCase();
  if (!host || host === 'contoso.sharepoint.com') {
    return false;
  }
  return SHAREPOINT_SUFFIXES.some((suffix) => host.length > suffix.length && host.endsWith(suffix));
}

function tryParse(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

/** Origin (https://tenant.sharepoint.com) of the page/host the component runs in, or '' when not SharePoint. */
export function resolveAllowedSharePointOrigin(currentUrl: string | undefined): string {
  const parsed = tryParse((currentUrl || '').trim());
  if (!parsed || parsed.protocol !== 'https:' || !isSharePointHost(parsed.hostname)) {
    return '';
  }
  return parsed.origin.toLowerCase();
}

/** True for an https URL on exactly the allowed origin, without credentials, port or SharePoint API paths. */
export function isUsableSiteUrl(candidate: string | undefined, allowedOrigin: string): boolean {
  if (!allowedOrigin) {
    return false;
  }
  const parsed = tryParse((candidate || '').trim());
  if (!parsed || parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) {
    return false;
  }
  if (parsed.origin.toLowerCase() !== allowedOrigin.toLowerCase()) {
    return false;
  }
  return !/\/_(api|layouts|vti_bin)(\/|$)/i.test(parsed.pathname);
}

export interface ISiteResolution {
  siteUrl: string;
  /** True when a non-empty candidate was rejected and the fallback was used. */
  rejected: boolean;
}

/** Normalised site URL (no trailing slash, query, hash, page or list path), or the fallback (current site). */
export function resolveSiteUrl(candidate: string | undefined, allowedOrigin: string, fallbackUrl: string): ISiteResolution {
  const raw = (candidate || '').trim();
  const fallback = (fallbackUrl || allowedOrigin || '').replace(/\/+$/, '');
  if (!raw) {
    return { siteUrl: fallback, rejected: false };
  }
  if (!isUsableSiteUrl(raw, allowedOrigin)) {
    return { siteUrl: fallback, rejected: true };
  }
  const parsed = new URL(raw);
  const path = parsed.pathname
    .replace(/\/(SitePages|Lists|Shared%20Documents|Shared Documents|Forms)(\/.*)?$/i, '')
    .replace(/\/+$/, '');
  return { siteUrl: `${parsed.origin}${path}`, rejected: false };
}

const LIST_TITLE = /^[A-Za-z0-9\u00C0-\u024F _\-&().,']{1,100}$/;

/** List titles are used inside getbytitle('...'); only plain titles pass. Returns '' when unusable. */
export function resolveListTitle(candidate: string | undefined): string {
  const title = (candidate || '').trim().replace(/\s+/g, ' ');
  return LIST_TITLE.test(title) ? title : '';
}

/** Escape a value for an OData string literal: ' becomes ''. */
export function odataString(value: string): string {
  return value.replace(/'/g, "''");
}

/** REST URL of a list by title, OData-escaped and URL-encoded. */
export function listApiUrl(siteUrl: string, listTitle: string): string {
  return `${siteUrl.replace(/\/+$/, '')}/_api/web/lists/getbytitle('${encodeURIComponent(odataString(listTitle))}')`;
}

const INTERNAL_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,254}$/;

export function isValidInternalName(value: string): boolean {
  return INTERNAL_NAME.test(value) && !/^(__proto__|constructor|prototype)$/.test(value);
}

const FIELD_TOKEN = /^[A-Za-z0-9\u00C0-\u024F _\-&().,']{1,255}$/;

/** "Title, Category; DueDate" -> ['Title', 'Category', 'DueDate']. Drops anything that isn't a plain name. Max 50. */
export function parseFieldList(raw: string | undefined): string[] {
  const seen: Record<string, boolean> = {};
  const out: string[] = [];
  (raw || '')
    .split(/[,;\n]/)
    .map((token) => token.trim())
    .forEach((token) => {
      const key = token.toLowerCase();
      if (token && FIELD_TOKEN.test(token) && !seen[key] && out.length < 50) {
        seen[key] = true;
        out.push(token);
      }
    });
  return out;
}

/** Absolute https DispForm or NewForm URL on the current tenant, or '' when it is not safe to render as a link. */
export function isSafeListFormUrl(candidate: string | undefined, allowedOrigin: string): string {
  if (!allowedOrigin) {
    return '';
  }
  const raw = (candidate || '').trim();
  if (!raw) {
    return '';
  }
  const parsed = tryParse(raw);
  if (!parsed || parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) {
    return '';
  }
  if (parsed.origin.toLowerCase() !== allowedOrigin.toLowerCase()) {
    return '';
  }
  if (!/\/(DispForm|NewForm)\.aspx$/i.test(parsed.pathname)) {
    return '';
  }
  parsed.hash = '';
  return parsed.toString();
}
