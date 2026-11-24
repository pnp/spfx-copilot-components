import { isUsableSiteUrl, resolveListTitle, resolveSiteUrl } from '../logic/siteUrl';
import type { IHttpClient, IHttpResponse } from './http';
import { JSON_HEADERS } from './http';
import { ListFormError } from './IListFormService';

/** Generic custom list (not a library or hidden list). */
export const CUSTOM_LIST_TEMPLATE = 100;

export interface ISiteList {
  title: string;
  id: string;
}

export interface IListOption {
  key: string;
  text: string;
}

function failFor(response: IHttpResponse): ListFormError {
  if (response.status === 401 || response.status === 403) {
    return new ListFormError('accessDenied', 'You don\u2019t have access to the lists on this site.');
  }
  if (response.status === 404) {
    return new ListFormError('notFound', 'This site wasn\u2019t found.');
  }
  return new ListFormError('server', `SharePoint returned HTTP ${response.status}.`);
}

/**
 * Custom lists on a same-tenant site. `siteUrl` must already have passed the URL lock
 * (https, current tenant), or be the current web URL. An empty site URL means the current site.
 */
export async function loadCustomLists(
  http: IHttpClient,
  siteUrl: string
): Promise<ISiteList[]> {
  const base = (siteUrl || '').replace(/\/+$/, '');
  if (!base) {
    throw new ListFormError('notFound', 'No site URL was available.');
  }
  const filter = encodeURIComponent('Hidden eq false and BaseTemplate eq 100');
  const url = `${base}/_api/web/lists?$filter=${filter}&$select=Title,Id&$orderby=Title`;
  let response: IHttpResponse;
  try {
    response = await http.get(url, { Accept: JSON_HEADERS.Accept, 'odata-version': '' });
  } catch {
    throw new ListFormError('network', 'SharePoint couldn\u2019t be reached.');
  }
  if (!response.ok) {
    throw failFor(response);
  }
  const json = (await response.json()) as { value?: { Title?: unknown; Id?: unknown }[] };
  const rows = json && Array.isArray(json.value) ? json.value : [];
  const out: ISiteList[] = [];
  const seen: Record<string, boolean> = {};
  rows.forEach((row) => {
    const title = resolveListTitle(typeof row.Title === 'string' ? row.Title : '');
    const id = typeof row.Id === 'string' ? row.Id : '';
    const key = title.toLowerCase();
    if (title && !seen[key]) {
      seen[key] = true;
      out.push({ title, id });
    }
  });
  out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

/** Resolve the site to query: empty input uses the current web; rejected URLs return ''. */
export function listsSiteUrl(candidate: string, allowedOrigin: string, currentWebUrl: string): { siteUrl: string; rejected: boolean } {
  const raw = (candidate || '').trim();
  if (!raw) {
    const fallback = (currentWebUrl || allowedOrigin || '').replace(/\/+$/, '');
    return { siteUrl: fallback, rejected: false };
  }
  if (allowedOrigin && isUsableSiteUrl(raw, allowedOrigin)) {
    return { siteUrl: resolveSiteUrl(raw, allowedOrigin, currentWebUrl).siteUrl, rejected: false };
  }
  return { siteUrl: '', rejected: true };
}

/**
 * Dropdown options. The saved title is always included (and selected) even if it is no longer
 * in the loaded results, so an existing web part does not go blank.
 */
export function listDropdownOptions(lists: ISiteList[], savedTitle: string): IListOption[] {
  const saved = resolveListTitle(savedTitle);
  const options: IListOption[] = lists.map((l) => ({ key: l.title, text: l.title }));
  if (saved && !options.some((o) => o.key.toLowerCase() === saved.toLowerCase())) {
    options.unshift({ key: saved, text: saved });
  }
  return options;
}
