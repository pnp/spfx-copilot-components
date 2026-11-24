import type { ISharePointReadTransport } from './sharePointContentService';
import { sharePointCollection, sharePointContinuation, sharePointEntity, sharePointRecord,
  validateSharePointPageUrl, validateSharePointSiteUrl } from './sharePointParsing';

export interface SiteChoice { url: string; title: string; }
export interface PageChoice {
  pageItemId: number;
  title: string;
  pageKind: 'page' | 'news';
  sourceUrl: string;
  /** The page's site, when the choice came from a pasted link. */
  site?: SiteChoice;
}
export interface DiscoveryResult<T> { items: T[]; hasMore: boolean; }
export interface IContentLensDiscovery {
  searchSites(query: string, signal?: AbortSignal): Promise<DiscoveryResult<SiteChoice>>;
  resolveSite(value: string, signal?: AbortSignal): Promise<SiteChoice>;
  searchPages(siteUrl: string, query: string, signal?: AbortSignal): Promise<DiscoveryResult<PageChoice>>;
  /** A pasted link to a page: its site and its item, read directly, without search. */
  resolvePage?(value: string, signal?: AbortSignal): Promise<PageChoice & { site: SiteChoice }>;
}

const PAGE_CONTENT_TYPE = '0x0101009d1cb255da76424f860d91f20e6c4118';
const CHOICE_LIMIT = 20;
const REQUEST_LIMIT = 5;
const literal = (value: string): string => `'${value.replace(/'/g, "''")}'`;

function endpoint(base: string, path: string, parameters: Record<string, string>): string {
  const url = new URL(`${base}/_api/${path}`);
  Object.keys(parameters).forEach(key => url.searchParams.set(key, parameters[key]));
  return url.toString();
}

function queryText(value: string): string {
  const text = value.trim();
  if (text.length > 100 || unsafeCharacters(text)) throw new Error('SHAREPOINT_DISCOVERY_QUERY_INVALID');
  return text;
}

function unsafeCharacters(value: string, rejectBackslash: boolean = false): boolean {
  return Array.from(value).some(character => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 || (rejectBackslash && character === '\\');
  });
}

function rows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(sharePointRecord);
  const results = sharePointRecord(value).results;
  if (!Array.isArray(results)) throw new Error('SHAREPOINT_SEARCH_RESPONSE_INVALID');
  return results.map(sharePointRecord);
}

/**
 * Normalizes a direct link to a site, folder, file or page. A sharing link is accepted only in its
 * `/:x:/r/` form, which contains the path; a sharing link with a token is rejected.
 */
export function normalizeSharePointLink(value: string, tenantUrl: string): string {
  const input = value.trim();
  let url: URL;
  let decoded: string;
  try {
    url = new URL(input);
    decoded = decodeURIComponent(input);
  } catch {
    throw new Error('SHAREPOINT_LINK_INVALID');
  }
  if (url.origin !== new URL(tenantUrl).origin) throw new Error('SHAREPOINT_SITE_OUTSIDE_TENANT');
  if (url.protocol !== 'https:' || url.username || url.password || url.port || unsafeCharacters(decoded, true) ||
    /(?:^|\/)\.{1,2}(?:\/|[?#]|$)/.test(decoded)) {
    throw new Error('SHAREPOINT_LINK_INVALID');
  }
  if (/^\/:[a-z]:\//i.test(url.pathname)) {
    const direct = /^\/:[a-z]:\/r(\/.*)$/i.exec(url.pathname);
    if (!direct) throw new Error('SHAREPOINT_LINK_UNSUPPORTED');
    url.pathname = direct[1];
  }
  // SharePoint's library view URL can carry the selected file/folder in id or RootFolder.
  if (/\/Forms\/(?:AllItems|ByAuthor|MyItems)\.aspx$/i.test(url.pathname)) {
    const selectedPath = url.searchParams.get('id') || url.searchParams.get('RootFolder');
    if (selectedPath) {
      const selected = new URL(selectedPath, url.origin);
      if (selected.origin !== url.origin || selected.username || selected.password || selected.search || selected.hash ||
        unsafeCharacters(decodeURIComponent(selectedPath), true)) {
        throw new Error('SHAREPOINT_LINK_INVALID');
      }
      url.pathname = selected.pathname;
    }
  }
  if (/\/_api(?:\/|$)/i.test(url.pathname)) throw new Error('SHAREPOINT_LINK_UNSUPPORTED');
  url.search = '';
  url.hash = '';
  return url.toString();
}

/**
 * Picker reads. Each call has a budget of REQUEST_LIMIT small requests, and a search reads only the
 * first page of results.
 */
export class SharePointDiscovery implements IContentLensDiscovery {
  private readonly _origin: string;
  public constructor(private readonly _tenantUrl: string, private readonly _transport: ISharePointReadTransport) {
    this._origin = new URL(_tenantUrl).origin;
  }

  private _reader(signal?: AbortSignal): (url: string) => Promise<unknown> {
    let attempts = 0;
    return async (url: string): Promise<unknown> => {
      if (signal?.aborted) throw new Error('ABORTED');
      if (attempts >= REQUEST_LIMIT) throw new Error('SHAREPOINT_DISCOVERY_LIMIT_REACHED');
      attempts += 1;
      const response = await this._transport.get(url, signal);
      if (response.status === 429 || response.status === 503) throw new Error('SHAREPOINT_THROTTLED');
      if (signal?.aborted) throw new Error('ABORTED');
      if (response.status < 200 || response.status >= 300) throw new Error(`SHAREPOINT_HTTP_${response.status}`);
      return response.body;
    };
  }

  public async searchSites(query: string, signal?: AbortSignal): Promise<DiscoveryResult<SiteChoice>> {
    const text = queryText(query);
    if (text.length > 0 && text.length < 2) return { items: [], hasMore: false };
    // The text becomes title-prefix words. Punctuation is removed, so it cannot change the KQL query.
    const words = text.replace(/["':*?(){}\[\]\\=<>+!&|^~;,/.]/g, ' ').split(/\s+/).filter(Boolean);
    if (text && !words.length) return { items: [], hasMore: false };
    // Empty text reads one page of indexed sites without a title filter, with the same row limit.
    const titleFilter = words.length ? ` AND (${words.map(word => `Title:${word}*`).join(' AND ')})` : '';
    const queryExpression = `(contentclass:STS_Site OR contentclass:STS_Web) AND Path:${this._origin}*` + titleFilter;
    const read = this._reader(signal);
    const body = sharePointEntity(await read(endpoint(this._origin, 'search/query', {
      querytext: literal(queryExpression),
      rowlimit: String(CHOICE_LIMIT + 1),
      selectproperties: literal('Title,Path'),
      trimduplicates: 'false',
      enablequeryrules: 'false'
    })));
    const result = sharePointRecord(body.query || body);
    const relevant = sharePointRecord(sharePointRecord(result.PrimaryQueryResult).RelevantResults);
    const entries = rows(sharePointRecord(relevant.Table).Rows);
    const choices = new Map<string, SiteChoice>();
    entries.forEach(entry => {
      const properties: Record<string, string> = {};
      rows(entry.Cells).forEach(cell => {
        if (typeof cell.Key === 'string' && typeof cell.Value === 'string') properties[cell.Key] = cell.Value;
      });
      if (!properties.Title || !properties.Path) return;
      try {
        const url = validateSharePointSiteUrl(properties.Path, this._tenantUrl);
        choices.set(url.toLowerCase(), { url, title: properties.Title });
      } catch {
        /* A result outside the tenant is skipped. */
      }
    });
    return {
      items: Array.from(choices.values()).slice(0, CHOICE_LIMIT),
      hasMore: entries.length > CHOICE_LIMIT || Number(relevant.TotalRows) > CHOICE_LIMIT
    };
  }

  public async resolveSite(value: string, signal?: AbortSignal): Promise<SiteChoice> {
    const link = normalizeSharePointLink(value, this._tenantUrl);
    const read = this._reader(signal);
    const verify = async (site: string): Promise<SiteChoice> => {
      const web = sharePointEntity(await read(endpoint(site, 'web', { '$select': 'Title,Url' })));
      if (typeof web.Url !== 'string' || validateSharePointSiteUrl(web.Url, this._tenantUrl).toLowerCase() !== site.toLowerCase()) {
        throw new Error('SHAREPOINT_LINK_SITE_UNVERIFIED');
      }
      if (typeof web.Title !== 'string' || !web.Title.trim()) throw new Error('SHAREPOINT_LINK_SITE_UNVERIFIED');
      return { url: site, title: web.Title };
    };
    // A link without a file extension can be the site itself, so it is verified as a site first.
    let siteCandidate: string | undefined;
    if (!/\.[^/]+\/?$/.test(new URL(link).pathname)) {
      try {
        siteCandidate = validateSharePointSiteUrl(link.replace(/\/+$/, ''), this._tenantUrl);
      } catch {
        /* Not a valid site URL: the page resolver below finds the site. */
      }
    }
    if (siteCandidate) {
      try {
        return await verify(siteCandidate);
      } catch (error) {
        // A missing web (404) means the link can be a folder or a file without an extension.
        // Every other error, such as access denied, is final.
        if (!(error instanceof Error) || error.message !== 'SHAREPOINT_HTTP_404') throw error;
      }
    }
    const raw = await read(endpoint(this._origin, 'sp.web.getweburlfrompageurl(@v)', { '@v': literal(link) }));
    const entity = typeof raw === 'string' ? raw : sharePointEntity(raw);
    const webUrl = typeof entity === 'string' ? entity : entity.GetWebUrlFromPageUrl || entity.value;
    if (typeof webUrl !== 'string') throw new Error('SHAREPOINT_LINK_SITE_UNVERIFIED');
    let site: string;
    try {
      site = validateSharePointSiteUrl(webUrl, this._tenantUrl);
    } catch {
      throw new Error('SHAREPOINT_LINK_SITE_UNVERIFIED');
    }
    // The link must lie inside the web that SharePoint returned.
    const linkPath = decodeURIComponent(new URL(link).pathname).toLowerCase().replace(/\/+$/, '');
    const webPath = decodeURIComponent(new URL(site).pathname).toLowerCase().replace(/\/+$/, '');
    if (linkPath !== webPath && !linkPath.startsWith(`${webPath}/`)) throw new Error('SHAREPOINT_LINK_SITE_UNVERIFIED');
    return verify(site);
  }

  /** The site's modern Site Pages library, verified by its content type. */
  private async _sitePagesList(site: string, read: (url: string) => Promise<unknown>): Promise<string> {
    const libraries = sharePointCollection(await read(endpoint(site, 'web/lists', {
      '$select': 'Id,BaseTemplate,RootFolder/ServerRelativeUrl',
      '$expand': 'RootFolder',
      '$filter': 'BaseTemplate eq 119',
      '$top': '25'
    })));
    const candidates = libraries.rows.filter(row => Number(row.BaseTemplate) === 119 && typeof row.Id === 'string');
    const expectedRoot = `${new URL(site).pathname.replace(/\/$/, '')}/SitePages`.toLowerCase();
    const canonical = candidates.filter(row =>
      row.RootFolder && String(sharePointRecord(row.RootFolder).ServerRelativeUrl).replace(/\/$/, '').toLowerCase() === expectedRoot);
    // The library at <site>/SitePages; else the only candidate, when the list of libraries is complete.
    let library: Record<string, unknown> | undefined;
    if (canonical.length === 1) library = canonical[0];
    else if (candidates.length === 1 && !libraries.next) library = candidates[0];
    if (!library || !/^[0-9a-f-]{36}$/i.test(String(library.Id))) throw new Error('SITE_PAGES_LIBRARY_UNRESOLVED');
    const list = `web/lists(guid'${String(library.Id)}')`;
    let contentTypeUrl: string | undefined = endpoint(site, `${list}/contenttypes`, { '$select': 'StringId', '$top': '25' });
    let verified = false;
    const seen = new Set<string>();
    while (contentTypeUrl && !verified) {
      if (seen.has(contentTypeUrl)) throw new Error('SHAREPOINT_CONTINUATION_LOOP');
      seen.add(contentTypeUrl);
      const contentTypes = sharePointCollection(await read(contentTypeUrl));
      verified = contentTypes.rows.some(row =>
        typeof row.StringId === 'string' && row.StringId.toLowerCase().startsWith(PAGE_CONTENT_TYPE));
      contentTypeUrl = contentTypes.next ? sharePointContinuation(contentTypes.next, contentTypeUrl, site) : undefined;
    }
    if (!verified) throw new Error('MODERN_SITE_PAGES_CONTENT_TYPE_UNVERIFIED');
    return list;
  }

  public async searchPages(siteUrl: string, query: string, signal?: AbortSignal): Promise<DiscoveryResult<PageChoice>> {
    const site = validateSharePointSiteUrl(siteUrl, this._tenantUrl);
    const text = queryText(query);
    const read = this._reader(signal);
    const list = await this._sitePagesList(site, read);
    const titleFilter = text ? ` and substringof(${literal(text)},Title)` : '';
    const filter = `FSObjType eq 0 and startswith(ContentTypeId,${literal(PAGE_CONTENT_TYPE)})${titleFilter}`;
    const pages = sharePointCollection(await read(endpoint(site, `${list}/items`, {
      '$select': 'Id,Title,FileRef,PromotedState,FSObjType,ContentTypeId',
      '$filter': filter,
      '$orderby': 'Modified desc',
      '$top': String(CHOICE_LIMIT + 1)
    })));
    const items: PageChoice[] = [];
    const ids = new Set<number>();
    pages.rows.forEach(page => {
      const id = Number(page.Id);
      if (!Number.isSafeInteger(id) || id < 1 || ids.has(id)) return;
      // A modern page: a file with the Site Page content type, a title and a known promoted state.
      if (Number(page.FSObjType) !== 0 || typeof page.ContentTypeId !== 'string' ||
        !page.ContentTypeId.toLowerCase().startsWith(PAGE_CONTENT_TYPE)) return;
      if (typeof page.Title !== 'string' || !page.Title.trim() || [0, 1, 2].indexOf(Number(page.PromotedState)) < 0) return;
      try {
        items.push({
          pageItemId: id,
          title: page.Title,
          pageKind: Number(page.PromotedState) === 0 ? 'page' : 'news',
          sourceUrl: validateSharePointPageUrl(page.FileRef, site)
        });
        ids.add(id);
      } catch {
        /* A page whose URL is outside the site is not offered. */
      }
    });
    return { items: items.slice(0, CHOICE_LIMIT), hasMore: pages.rows.length > CHOICE_LIMIT || !!pages.next };
  }

  public async resolvePage(value: string, signal?: AbortSignal): Promise<PageChoice & { site: SiteChoice }> {
    const link = normalizeSharePointLink(value, this._tenantUrl);
    const path = decodeURIComponent(new URL(link).pathname);
    if (!/\/SitePages\/.+\.aspx$/i.test(path)) throw new Error('SHAREPOINT_LINK_NOT_A_PAGE');
    const read = this._reader(signal);
    const site = await this.resolveSite(link, signal);
    const item = sharePointEntity(await read(endpoint(site.url, 'web/GetFileByServerRelativePath(decodedurl=@p)/ListItemAllFields', {
      '$select': 'Id,Title,FileRef,PromotedState,FSObjType,ContentTypeId',
      '@p': literal(path)
    })));
    const id = Number(item.Id);
    if (!Number.isSafeInteger(id) || id < 1 || Number(item.FSObjType) !== 0 || typeof item.ContentTypeId !== 'string' ||
      !item.ContentTypeId.toLowerCase().startsWith(PAGE_CONTENT_TYPE) ||
      typeof item.Title !== 'string' || [0, 1, 2].indexOf(Number(item.PromotedState)) < 0) {
      throw new Error('SHAREPOINT_LINK_NOT_A_PAGE');
    }
    return {
      pageItemId: id,
      title: item.Title || path.split('/').pop() || '',
      pageKind: Number(item.PromotedState) === 0 ? 'page' : 'news',
      sourceUrl: validateSharePointPageUrl(item.FileRef, site.url),
      site
    };
  }
}
