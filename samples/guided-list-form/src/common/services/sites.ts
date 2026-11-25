import { isUsableSiteUrl, resolveListTitle } from '../logic/siteUrl';
import { sanitizePlainText } from '../logic/config';
import type { IHttpClient, IHttpResponse } from './http';
import { JSON_HEADERS } from './http';
import { loadCustomLists, type ISiteList } from './lists';
import { ListFormError } from './IListFormService';

export interface IPickedSite {
  title: string;
  url: string;
  source: 'current' | 'followed' | 'recent' | 'search';
}

export interface ISiteDirectory {
  currentSite?: IPickedSite;
  followedSites(): Promise<IPickedSite[]>;
  recentSites(): Promise<IPickedSite[]>;
  searchSites(query: string): Promise<IPickedSite[]>;
  listsFor(siteUrl: string): Promise<ISiteList[]>;
}

export const MAX_SITE_RESULTS = 20;
export const MAX_SEARCH_QUERY = 80;

function failFor(response: IHttpResponse): ListFormError {
  if (response.status === 401 || response.status === 403) {
    return new ListFormError('accessDenied', 'You don\u2019t have access to search sites on this tenant.');
  }
  return new ListFormError('server', `SharePoint returned HTTP ${response.status}.`);
}

async function getJson(http: IHttpClient, url: string): Promise<unknown> {
  let response: IHttpResponse;
  try {
    response = await http.get(url, { Accept: JSON_HEADERS.Accept, 'odata-version': '' });
  } catch {
    throw new ListFormError('network', 'SharePoint couldn\u2019t be reached.');
  }
  if (!response.ok) {
    throw failFor(response);
  }
  return response.json();
}

function siteTitle(raw: unknown, fallback: string): string {
  const title = sanitizePlainText(typeof raw === 'string' ? raw : '', 80);
  return title || fallback;
}

/** Keeps https, same-tenant SharePoint URLs only. Drops anything else. */
export function sanitizeSiteResult(rawUrl: unknown, rawTitle: unknown, allowedOrigin: string, source: IPickedSite['source']): IPickedSite | undefined {
  const url = typeof rawUrl === 'string' ? rawUrl.trim().replace(/\/+$/, '') : '';
  if (!url || !isUsableSiteUrl(url, allowedOrigin)) {
    return undefined;
  }
  const host = new URL(url).host;
  const fallback = host;
  return { title: siteTitle(rawTitle, fallback), url, source };
}

/** Placeholder used in Copilot until the current web title is known. */
export const CURRENT_SITE_LABEL = 'Current site';

function isGenericSiteTitle(title: string): boolean {
  const value = (title || '').trim().toLowerCase();
  return value === 'current site' || value === 'this site';
}

/** Dedupes by URL (case-insensitive). Prefers a real title over "Current site" / "This site". */
export function uniqueSites(sites: IPickedSite[]): IPickedSite[] {
  const out: IPickedSite[] = [];
  const indexByUrl: Record<string, number> = {};
  sites.forEach((site) => {
    const key = site.url.toLowerCase();
    const existingIndex = indexByUrl[key];
    if (existingIndex === undefined) {
      indexByUrl[key] = out.length;
      out.push(site);
      return;
    }
    const existing = out[existingIndex];
    const title = isGenericSiteTitle(existing.title) && !isGenericSiteTitle(site.title) ? site.title : existing.title;
    const source = existing.source === 'current' || site.source === 'current' ? 'current' : existing.source;
    out[existingIndex] = { ...existing, title, source };
  });
  return out;
}

/** Strips KQL/quotes so the user's search is treated as plain text inside a locked query. */
export function sanitizeSearchQuery(raw: string): string {
  const cleaned = sanitizePlainText(raw, MAX_SEARCH_QUERY)
    .replace(/["'\\:*?<>|{}()[\]]/g, ' ')
    .replace(/\b(AND|OR|NOT|NEAR|XRANK|WORDS)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

interface ISearchCell {
  Key?: string;
  Value?: unknown;
}

function cellsToMap(cells: ISearchCell[] | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  (cells || []).forEach((cell) => {
    if (typeof cell.Key === 'string' && typeof cell.Value === 'string') {
      map[cell.Key] = cell.Value;
    }
  });
  return map;
}

function parseSearchRows(json: unknown, allowedOrigin: string, source: IPickedSite['source']): IPickedSite[] {
  const primary = json && typeof json === 'object' ? (json as { PrimaryQueryResult?: unknown; d?: { query?: { PrimaryQueryResult?: unknown } } }) : undefined;
  const result = (primary && primary.PrimaryQueryResult) || (primary && primary.d && primary.d.query && primary.d.query.PrimaryQueryResult);
  const table =
    result && typeof result === 'object'
      ? ((result as { RelevantResults?: { Table?: { Rows?: unknown } } }).RelevantResults || {}).Table
      : undefined;
  const rowsRaw = table && typeof table === 'object' ? (table as { Rows?: unknown }).Rows : undefined;
  const rows: { Cells?: ISearchCell[] }[] = Array.isArray(rowsRaw)
    ? (rowsRaw as { Cells?: ISearchCell[] }[])
    : rowsRaw && typeof rowsRaw === 'object' && Array.isArray((rowsRaw as { results?: unknown }).results)
      ? ((rowsRaw as { results: { Cells?: ISearchCell[] | { results?: ISearchCell[] } }[] }).results || []).map((row) => ({
          Cells: Array.isArray(row.Cells) ? row.Cells : row.Cells && Array.isArray(row.Cells.results) ? row.Cells.results : []
        }))
      : [];
  const sites: IPickedSite[] = [];
  rows.forEach((row) => {
    const cells = Array.isArray(row.Cells)
      ? row.Cells
      : row.Cells && typeof row.Cells === 'object' && Array.isArray((row.Cells as { results?: ISearchCell[] }).results)
        ? (row.Cells as { results: ISearchCell[] }).results
        : [];
    const map = cellsToMap(cells);
    const picked = sanitizeSiteResult(map.Path || map.SPSiteUrl || map.OriginalPath, map.Title || map.SiteTitle, allowedOrigin, source);
    if (picked) {
      sites.push(picked);
    }
  });
  return uniqueSites(sites).slice(0, MAX_SITE_RESULTS);
}

function searchUrl(origin: string, queryText: string, sort?: string): string {
  const params = [
    `querytext='${queryText}'`,
    "selectproperties='Title,Path,SiteTitle,SPSiteUrl'",
    `rowlimit=${MAX_SITE_RESULTS}`,
    'trimduplicates=true'
  ];
  if (sort) {
    params.push(`sortlist='${sort}'`);
  }
  return `${origin}/_api/search/query?${params.join('&')}`;
}

function lockedSiteQuery(allowedOrigin: string, extra?: string): string {
  const path = allowedOrigin.replace(/'/g, '');
  const base = `contentclass:STS_Site AND Path:${path}`;
  return extra ? `${base} AND ${extra}` : base;
}

/**
 * Same-tenant site discovery for the Copilot picker: followed sites, recent sites, and a
 * search box. Every URL is checked with the existing https + tenant lock.
 */
export function createSiteDirectory(http: IHttpClient, allowedOrigin: string, currentWebUrl: string, currentWebTitle?: string): ISiteDirectory {
  const origin = (allowedOrigin || '').replace(/\/+$/, '');
  const knownTitle = siteTitle(currentWebTitle, '');
  let current = sanitizeSiteResult(currentWebUrl || origin, knownTitle || CURRENT_SITE_LABEL, origin, 'current');
  let titleLoad: Promise<void> | undefined;

  const ensureCurrentTitle = (): Promise<void> => {
    if (!current || knownTitle) {
      return Promise.resolve();
    }
    if (!titleLoad) {
      const siteUrl = current.url;
      titleLoad = getJson(http, `${siteUrl}/_api/web?$select=Title`)
        .then((json) => {
          const raw =
            json && typeof json === 'object'
              ? ((json as { Title?: unknown; d?: { Title?: unknown } }).Title
                || ((json as { d?: { Title?: unknown } }).d && (json as { d: { Title?: unknown } }).d.Title))
              : undefined;
          const title = siteTitle(raw, '');
          if (title && current && current.url.toLowerCase() === siteUrl.toLowerCase()) {
            current = { ...current, title };
          }
        })
        .catch(() => {
          /* Keep CURRENT_SITE_LABEL when the web title cannot be loaded. */
        });
    }
    return titleLoad;
  };

  return {
    get currentSite(): IPickedSite | undefined {
      return current;
    },
    async followedSites(): Promise<IPickedSite[]> {
      if (!origin) {
        return current ? [current] : [];
      }
      try {
        const json = (await Promise.all([
          ensureCurrentTitle(),
          getJson(http, `${origin}/_api/social.following/my/followed(types=4)`)
        ]))[1] as {
          value?: { Name?: unknown; Uri?: unknown }[];
          d?: { Followed?: { results?: { Name?: unknown; Uri?: unknown }[] } };
        };
        const rows = Array.isArray(json.value)
          ? json.value
          : json.d && json.d.Followed && Array.isArray(json.d.Followed.results)
            ? json.d.Followed.results
            : [];
        const sites = rows
          .map((row) => sanitizeSiteResult(row.Uri, row.Name, origin, 'followed'))
          .filter((s): s is IPickedSite => !!s);
        const list = uniqueSites((current ? [current] : []).concat(sites));
        return list.slice(0, MAX_SITE_RESULTS);
      } catch {
        await ensureCurrentTitle();
        return current ? [current] : [];
      }
    },
    async recentSites(): Promise<IPickedSite[]> {
      if (!origin) {
        return [];
      }
      try {
        const json = await getJson(http, searchUrl(origin, lockedSiteQuery(origin), 'LastModifiedTime:descending'));
        return parseSearchRows(json, origin, 'recent');
      } catch {
        return [];
      }
    },
    async searchSites(query: string): Promise<IPickedSite[]> {
      if (!origin) {
        return [];
      }
      const text = sanitizeSearchQuery(query);
      if (!text) {
        return [];
      }
      const escaped = text.replace(/'/g, ' ');
      const json = await getJson(http, searchUrl(origin, lockedSiteQuery(origin, `"${escaped}"`)));
      return parseSearchRows(json, origin, 'search');
    },
    async listsFor(siteUrl: string): Promise<ISiteList[]> {
      const clean = sanitizeSiteResult(siteUrl, '', origin, 'search');
      if (!clean) {
        throw new ListFormError('notFound', 'That site isn\u2019t on this tenant.');
      }
      const lists = await loadCustomLists(http, clean.url);
      return lists.filter((l) => resolveListTitle(l.title));
    }
  };
}

/** In-memory directory for tests and the local preview. */
export class MemorySiteDirectory implements ISiteDirectory {
  public constructor(
    public currentSite: IPickedSite | undefined,
    private readonly _followed: IPickedSite[],
    private readonly _recent: IPickedSite[],
    private readonly _lists: Record<string, ISiteList[]>
  ) {}

  public async followedSites(): Promise<IPickedSite[]> {
    return uniqueSites((this.currentSite ? [this.currentSite] : []).concat(this._followed));
  }

  public async recentSites(): Promise<IPickedSite[]> {
    return this._recent.slice();
  }

  public async searchSites(query: string): Promise<IPickedSite[]> {
    const text = sanitizeSearchQuery(query).toLowerCase();
    if (!text) {
      return [];
    }
    const all = (this.currentSite ? [this.currentSite] : []).concat(this._followed, this._recent);
    return all.filter((s) => s.title.toLowerCase().indexOf(text) >= 0 || s.url.toLowerCase().indexOf(text) >= 0).map((s) => ({ ...s, source: 'search' as const }));
  }

  public async listsFor(siteUrl: string): Promise<ISiteList[]> {
    const key = (siteUrl || '').replace(/\/+$/, '').toLowerCase();
    return (this._lists[key] || this._lists[siteUrl] || []).slice();
  }
}


/** In-memory sites and lists for tests and the local preview. */
export function createDemoSiteDirectory(): MemorySiteDirectory {
  const it = 'https://contoso.sharepoint.com/sites/it';
  const lumen = 'https://contoso.sharepoint.com/sites/lumen';
  const ops = 'https://contoso.sharepoint.com/sites/ops';
  const hr = 'https://contoso.sharepoint.com/sites/hr';
  const finance = 'https://contoso.sharepoint.com/sites/finance';
  const marketing = 'https://contoso.sharepoint.com/sites/marketing';
  const projects = 'https://contoso.sharepoint.com/sites/projects';
  const legal = 'https://contoso.sharepoint.com/sites/legal';
  return new MemorySiteDirectory(
    undefined,
    [{ title: 'IT', url: it, source: 'followed' }],
    [
      { title: 'Lumen Team', url: lumen, source: 'recent' },
      { title: 'Operations', url: ops, source: 'recent' },
      { title: 'Human Resources', url: hr, source: 'recent' },
      { title: 'Finance', url: finance, source: 'recent' },
      { title: 'Marketing', url: marketing, source: 'recent' },
      { title: 'Projects', url: projects, source: 'recent' },
      { title: 'Legal', url: legal, source: 'recent' }
    ],
    {
      [it]: [
        { title: 'IT Requests', id: 'it-requests' },
        { title: 'Equipment Issues', id: 'equipment' },
        { title: 'Annual Processes', id: 'annual' },
        { title: 'Facilities', id: 'facilities' },
        { title: 'Onboarding tasks', id: 'onboarding' }
      ],
      [lumen]: [{ title: 'Lumen milestones', id: 'milestones' }, { title: 'Event Feedback', id: 'feedback' }],
      [ops]: [{ title: 'Weekly notes', id: 'notes' }],
      [hr]: [{ title: 'Leave requests', id: 'leave' }],
      [finance]: [{ title: 'Invoice register', id: 'invoices' }],
      [marketing]: [{ title: 'Campaign ideas', id: 'campaigns' }],
      [projects]: [{ title: 'Project intake', id: 'intake' }],
      [legal]: [{ title: 'Contract review', id: 'contracts' }]
    }
  );
}
