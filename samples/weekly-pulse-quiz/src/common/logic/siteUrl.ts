/**
 * URL lock: the quiz only ever talks to SharePoint on the tenant it is running in.
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

/** True for an https URL on exactly the allowed origin, without credentials, query or fragment tricks. */
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

/** Normalised site URL (no trailing slash, query or hash), falling back to the tenant root. */
export function resolveSiteUrl(candidate: string | undefined, allowedOrigin: string): string {
  if (isUsableSiteUrl(candidate, allowedOrigin)) {
    const parsed = new URL((candidate || '').trim());
    const path = parsed.pathname.replace(/\/(SitePages|Lists|Shared%20Documents|Shared Documents)\/.*$/i, '').replace(/\/+$/, '');
    return `${parsed.origin}${path}`;
  }
  return allowedOrigin;
}

const LIST_TITLE = /^[A-Za-z0-9\u00C0-\u024F _\-&().,]{1,100}$/;

/** List titles are used inside getbytitle('...'); only allow plain titles. */
export function resolveListTitle(candidate: string | undefined, fallback: string): string {
  const title = (candidate || '').trim();
  return LIST_TITLE.test(title) ? title : fallback;
}

/** Escape a value for an OData string literal inside getbytitle('...'). */
export function odataString(value: string): string {
  return value.replace(/'/g, "''");
}
