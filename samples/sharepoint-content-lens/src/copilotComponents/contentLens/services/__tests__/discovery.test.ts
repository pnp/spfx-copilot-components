import { normalizeSharePointLink, SharePointDiscovery } from '../discovery';
import { SharePointContentService } from '../sharePointContentService';
import type { ISharePointReadTransport } from '../sharePointContentService';

const ORIGIN = 'https://contoso.sharepoint.com';
const SITE = `${ORIGIN}/sites/hr/subsite`;
const LIST = '11111111-2222-4333-8444-555555555555';
const CONTENT_TYPE = '0x0101009d1cb255da76424f860d91f20e6c4118';
type Response = Awaited<ReturnType<ISharePointReadTransport['get']>>;
const okay = (body: unknown): Response => ({ status: 200, body });
const collection = (value: unknown[], next?: string): Response => okay({ value, ...(next ? { 'odata.nextLink': next } : {}) });
const page = (id: number): Record<string, unknown> => ({ Id: id, Title: `News ${id}`, PromotedState: 2,
  FileRef: `/sites/hr/subsite/SitePages/news-${id}.aspx`, FSObjType: 0, ContentTypeId: CONTENT_TYPE });
const searchRow = (Title: string, Path: string): Record<string, unknown> => ({ Cells: [{ Key: 'Title', Value: Title }, { Key: 'Path', Value: Path }] });
const searchBody = (Rows: unknown[], TotalRows: number = Rows.length): unknown => ({ PrimaryQueryResult: { RelevantResults: { Table: { Rows }, TotalRows } } });
function setup(handler?: (url: string) => Response | Promise<Response>): { discovery: SharePointDiscovery; calls: string[] } {
  const calls: string[] = [];
  return { calls, discovery: new SharePointDiscovery(ORIGIN, { get: async url => {
    calls.push(url);
    if (handler) return handler(url);
    const path = new URL(url).pathname;
    if (path.endsWith('/lists')) return collection([{ Id: LIST, BaseTemplate: 119, RootFolder: { ServerRelativeUrl: '/sites/hr/subsite/SitePages' } }]);
    if (path.endsWith('/contenttypes')) return collection([{ StringId: CONTENT_TYPE }]);
    return collection([page(1), page(2)]);
  } }) };
}

describe('bounded SharePoint pickers', () => {
  test('site names use one bounded SharePoint Search GET and cannot inject KQL', async () => {
    const { discovery, calls } = setup(() => okay(searchBody([
      searchRow('HR', SITE), searchRow('HR duplicate', SITE), searchRow('Outside', 'https://evil.example/sites/hr')
    ])));
    const result = await discovery.searchSites('HR" OR Path:*');
    expect(result.items).toEqual([{ title: 'HR duplicate', url: SITE }]);
    expect(calls).toHaveLength(1);
    const url = new URL(calls[0]);
    expect(url.origin).toBe(ORIGIN); expect(url.pathname).toBe('/_api/search/query');
    expect(url.searchParams.get('rowlimit')).toBe('21');
    expect(url.searchParams.get('querytext')).toContain('Title:HR* AND Title:OR* AND Title:Path*');
    expect(url.searchParams.get('enablequeryrules')).toBe('false');
  });

  test.each(['', '   '])('opening choices uses one bounded tenant-scoped search without a title filter: %j', async query => {
    const { discovery, calls } = setup(() => okay(searchBody([
      searchRow('HR', SITE), searchRow('Outside', 'https://evil.example/sites/hr')
    ])));
    expect(await discovery.searchSites(query)).toEqual({ items: [{ title: 'HR', url: SITE }], hasMore: false });
    expect(calls).toHaveLength(1);
    const url = new URL(calls[0]);
    expect(url.origin).toBe(ORIGIN); expect(url.pathname).toBe('/_api/search/query');
    expect(url.searchParams.get('querytext')).toBe(`'(contentclass:STS_Site OR contentclass:STS_Web) AND Path:${ORIGIN}*'`);
    expect(url.searchParams.get('rowlimit')).toBe('21');
    expect(url.searchParams.get('selectproperties')).toBe("'Title,Path'");
    expect(url.searchParams.get('enablequeryrules')).toBe('false');
  });

  test.each(['', 'Site'])('site results cap at twenty and expose more indexed matches without fetching another page: %j', async query => {
    const { discovery, calls } = setup(() => okay(searchBody(Array.from({ length: 21 }, (_value, index) => searchRow(`Site ${index}`, `${ORIGIN}/sites/s${index}`)), 70)));
    const result = await discovery.searchSites(query);
    expect(result.items).toHaveLength(20); expect(result.hasMore).toBe(true);
    expect(calls).toHaveLength(1);
  });

  test('site search allows the tenant root while retaining exact-origin result validation', async () => {
    const { discovery, calls } = setup(() => okay(searchBody([searchRow('Home', ORIGIN)])));
    expect((await discovery.searchSites('Home')).items).toEqual([{ title: 'Home', url: ORIGIN }]);
    expect(new URL(calls[0]).searchParams.get('querytext')).toContain(`Path:${ORIGIN}*`);
  });

  test('nonempty short, punctuation-only, or oversized queries do not issue search requests', async () => {
    const { discovery, calls } = setup();
    expect(await discovery.searchSites('a')).toEqual({ items: [], hasMore: false });
    expect(await discovery.searchSites('  a  ')).toEqual({ items: [], hasMore: false });
    expect(await discovery.searchSites('()')).toEqual({ items: [], hasMore: false });
    expect(await discovery.searchSites(' * : ? / ')).toEqual({ items: [], hasMore: false });
    await expect(discovery.searchSites('a'.repeat(101))).rejects.toThrow('QUERY_INVALID');
    expect(calls).toHaveLength(0);
  });

  test.each([
    `${SITE}/SitePages/news.aspx?web=1#comments`,
    `${ORIGIN}/:w:/r/sites/hr/subsite/Shared%20Documents/example.docx?d=token&web=1`,
    `${SITE}/Shared%20Documents/Forms/AllItems.aspx?id=${encodeURIComponent('/sites/hr/subsite/Shared Documents/example.docx')}`
  ])('pasted direct link resolves the actual owning subsite, then verifies its title: %s', async link => {
    const { discovery, calls } = setup(url => new URL(url).pathname.endsWith('/web') ? okay({ Url: SITE, Title: 'HR subsite' }) : okay({ value: SITE }));
    await expect(discovery.resolveSite(link)).resolves.toEqual({ url: SITE, title: 'HR subsite' });
    expect(calls).toHaveLength(2);
    expect(new URL(calls[0]).searchParams.get('@v')).not.toContain('?');
    expect(new URL(calls[0]).searchParams.get('@v')).not.toContain('/:w:/r');
    expect(new URL(calls[1]).pathname).toBe('/sites/hr/subsite/_api/web');
  });

  test.each([SITE, { GetWebUrlFromPageUrl: SITE }, { d: { GetWebUrlFromPageUrl: SITE } }])('accepts documented resolver OData wrappers', async body => {
    const { discovery } = setup(url => new URL(url).pathname.endsWith('/web') ? okay({ Url: SITE, Title: 'HR' }) : okay(body));
    await expect(discovery.resolveSite(`${SITE}/SitePages/page.aspx`)).resolves.toEqual({ url: SITE, title: 'HR' });
  });

  test.each([SITE, `${SITE}/`, ORIGIN])('an exact web URL is verified directly, without a page resolver: %s', async site => {
    const normalized = site.replace(/\/+$/, '');
    const { discovery, calls } = setup(() => okay({ Url: normalized, Title: 'Site title' }));
    await expect(discovery.resolveSite(site)).resolves.toEqual({ url: normalized, title: 'Site title' });
    expect(calls).toHaveLength(1);
    expect(new URL(calls[0]).pathname).toBe(`${new URL(normalized).pathname.replace(/\/$/, '')}/_api/web`);
  });

  test('a parent response or denial for a site URL cannot silently broaden the selected site', async () => {
    for (const reply of [okay({ Url: `${ORIGIN}/sites/hr`, Title: 'Parent' }), { status: 403, body: undefined }]) {
      const { discovery, calls } = setup(() => reply);
      await expect(discovery.resolveSite(SITE)).rejects.toThrow();
      expect(calls).toHaveLength(1);
    }
  });

  test('only 404 on a candidate web can fall through to resolving an extensionless file', async () => {
    const link = `${SITE}/Documents/report`;
    const { discovery, calls } = setup(url => new URL(url).pathname === '/sites/hr/subsite/Documents/report/_api/web'
      ? { status: 404, body: undefined } : new URL(url).pathname.endsWith('/web') ? okay({ Url: SITE, Title: 'HR' }) : okay({ value: SITE }));
    await expect(discovery.resolveSite(link)).resolves.toEqual({ url: SITE, title: 'HR' });
    expect(calls).toHaveLength(3);
  });

  test.each([
    'https://other.sharepoint.com/sites/hr/page.aspx', 'https://user:secret@contoso.sharepoint.com/sites/hr',
    `${ORIGIN}/:w:/g/sites/hr/token`, `${SITE}/%2e%2e/secret.aspx`, `${SITE}/a%5cb.aspx`,
    `${SITE}/Shared%20Documents/Forms/AllItems.aspx?id=${encodeURIComponent('https://evil.example/a')}`
  ])('rejects an unsafe or opaque link before any request: %s', async link => {
    const { discovery, calls } = setup();
    await expect(discovery.resolveSite(link)).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  test('returned owning web cannot be a sibling or another tenant', async () => {
    for (const resolved of [`${ORIGIN}/sites/finance`, 'https://evil.example/sites/hr']) {
      const { discovery, calls } = setup(() => okay({ value: resolved }));
      await expect(discovery.resolveSite(`${SITE}/SitePages/a.aspx`)).rejects.toThrow('SITE_UNVERIFIED');
      expect(calls).toHaveLength(1);
    }
  });

  test('the second response must verify the exact resolved site, not a redirect', async () => {
    const { discovery } = setup(url => new URL(url).pathname.endsWith('/web') ? okay({ Url: `${ORIGIN}/sites/other`, Title: 'Other' }) : okay({ value: SITE }));
    await expect(discovery.resolveSite(`${SITE}/SitePages/a.aspx`)).rejects.toThrow('SITE_UNVERIFIED');
  });

  test('page picker resolves modern library, searches title and returns named page identities', async () => {
    const { discovery, calls } = setup();
    const result = await discovery.searchPages(SITE, "Author's news");
    expect(calls).toHaveLength(3);
    expect(result.items[0]).toEqual({ pageItemId: 1, title: 'News 1', pageKind: 'news', sourceUrl: `${SITE}/SitePages/news-1.aspx` });
    const query = new URL(calls[2]);
    expect(query.searchParams.get('$filter')).toContain("substringof('Author''s news',Title)");
    expect(query.searchParams.get('$top')).toBe('21');
  });

  test('default page list is recent, bounded, and never follows its next link', async () => {
    const { discovery, calls } = setup(url => {
      if (new URL(url).pathname.endsWith('/items')) return collection(Array.from({ length: 21 }, (_value, index) => page(index + 1)), `${url}&$skiptoken=next`);
      return new URL(url).pathname.endsWith('/lists') ? collection([{ Id: LIST, BaseTemplate: 119 }]) : collection([{ StringId: CONTENT_TYPE }]);
    });
    const result = await discovery.searchPages(SITE, '');
    expect(result.items).toHaveLength(20); expect(result.hasMore).toBe(true); expect(calls).toHaveLength(3);
    expect(new URL(calls[2]).searchParams.get('$orderby')).toBe('Modified desc');
  });

  test('invalid or foreign page identities are never offered', async () => {
    const { discovery } = setup(url => {
      if (new URL(url).pathname.endsWith('/lists')) return collection([{ Id: LIST, BaseTemplate: 119 }]);
      if (new URL(url).pathname.endsWith('/contenttypes')) return collection([{ StringId: CONTENT_TYPE }]);
      return collection([page(1), page(1), { ...page(2), FileRef: 'https://evil.example/a' }, { ...page(3), ContentTypeId: '0x01' }]);
    });
    expect((await discovery.searchPages(SITE, '')).items.map(item => item.pageItemId)).toEqual([1]);
  });

  test('draft news remains news, consistently with the content reader', async () => {
    const { discovery } = setup(url => {
      if (new URL(url).pathname.endsWith('/lists')) return collection([{ Id: LIST, BaseTemplate: 119 }]);
      if (new URL(url).pathname.endsWith('/contenttypes')) return collection([{ StringId: CONTENT_TYPE }]);
      return collection([{ ...page(1), PromotedState: 0 }, { ...page(2), PromotedState: 1 }, page(3), { ...page(4), PromotedState: 9 }]);
    });
    expect((await discovery.searchPages(SITE, '')).items.map(item => item.pageKind)).toEqual(['page', 'news', 'news']);
  });

  test('content-type pagination cannot exceed five requests in one picker operation', async () => {
    let index = 0;
    const { discovery, calls } = setup(url => new URL(url).pathname.endsWith('/lists') ? collection([{ Id: LIST, BaseTemplate: 119 }]) :
      collection([], `${url.replace(/&%24skiptoken=\d+/, '')}&%24skiptoken=${++index}`));
    await expect(discovery.searchPages(SITE, '')).rejects.toThrow('DISCOVERY_LIMIT_REACHED');
    expect(calls).toHaveLength(5);
  });

  test.each([401, 403, 404, 429, 503])('HTTP %s is not retried or replaced by fictional choices', async status => {
    const { discovery, calls } = setup(() => ({ status, body: undefined }));
    await expect(discovery.searchSites('HR')).rejects.toThrow(status === 429 || status === 503 ? 'THROTTLED' : `HTTP_${status}`);
    expect(calls).toHaveLength(1);
  });

  test('cancelled discovery schedules no next request', async () => {
    const abort = new AbortController();
    const { discovery, calls } = setup(() => { abort.abort(); return okay({ value: SITE }); });
    await expect(discovery.resolveSite(`${SITE}/SitePages/a.aspx`, abort.signal)).rejects.toThrow('ABORTED');
    expect(calls).toHaveLength(1);
  });

  test('normalization strips fragments and harmless query without guessing the web boundary', () => {
    expect(normalizeSharePointLink(`${SITE}/SitePages/a.aspx?web=1#comments`, ORIGIN)).toBe(`${SITE}/SitePages/a.aspx`);
  });
});

describe('picker and scan shared request gate', () => {
  test('a picker throttle prevents scans and other picker calls until the shared cooldown expires', async () => {
    let now = 1000;
    const get = jest.fn(async () => ({ status: 429, retryAfter: '2', body: undefined }));
    const service = new SharePointContentService({ tenantUrl: ORIGIN, targetDocument: document, transport: { get }, now: () => now,
      wait: async milliseconds => { now += milliseconds; } });
    await service.readDiscovery(`${ORIGIN}/_api/search/query`);
    expect(service.snapshot().cooldownUntil).toBe(3000);
    await expect(service.readDiscovery(`${ORIGIN}/_api/search/query`)).rejects.toThrow('THROTTLED');
    const scan = await service.read({ siteUrl: SITE, mode: 'comments', pageKind: 'both', lookbackDays: 7 });
    expect(scan.coverage.operationsAttempted).toBe(0); expect(get).toHaveBeenCalledTimes(1);
    now = 3000;
    await service.readDiscovery(`${ORIGIN}/_api/search/query`);
    expect(get).toHaveBeenCalledTimes(2);
  });

  test('picker reads are paced but remain separate from scan counters', async () => {
    let now = 1000;
    const waits: number[] = [];
    const service = new SharePointContentService({ tenantUrl: ORIGIN, targetDocument: document, transport: { get: async () => okay({}) },
      now: () => now, wait: async milliseconds => { waits.push(milliseconds); now += milliseconds; } });
    await service.readDiscovery(`${ORIGIN}/_api/search/query`);
    await service.readDiscovery(`${ORIGIN}/_api/search/query`);
    expect(waits).toEqual([250]); expect(service.snapshot().coverage.operationsAttempted).toBe(0);
  });

  test('discovery cannot overlap an active scan or another discovery read', async () => {
    let release: ((response: Response) => void) | undefined;
    const service = new SharePointContentService({ tenantUrl: ORIGIN, targetDocument: document,
      transport: { get: async () => new Promise(resolve => { release = resolve; }) } });
    const first = service.readDiscovery(`${ORIGIN}/_api/search/query`);
    await expect(service.readDiscovery(`${ORIGIN}/_api/search/query`)).rejects.toThrow('DISCOVERY_IN_PROGRESS');
    release!(okay({})); await first;
    const scan = service.read({ siteUrl: SITE, mode: 'comments', pageKind: 'both', lookbackDays: 7 });
    await expect(service.readDiscovery(`${ORIGIN}/_api/search/query`)).rejects.toThrow('READ_IN_PROGRESS');
    service.stop(); await scan;
  });

  test('starting a scan waits for the in-flight picker GET before sending anything', async () => {
    let release: ((response: Response) => void) | undefined;
    let now = 1000;
    const calls: string[] = [];
    const service = new SharePointContentService({ tenantUrl: ORIGIN, targetDocument: document, now: () => now,
      wait: async milliseconds => { now += milliseconds; }, transport: { get: async url => {
        calls.push(url);
        if (url.includes('/search/query')) return new Promise(resolve => { release = resolve; });
        return collection([]);
      } } });
    const picker = service.readDiscovery(`${ORIGIN}/_api/search/query`);
    const scan = service.read({ siteUrl: SITE, mode: 'comments', pageKind: 'both', lookbackDays: 7 });
    expect(calls).toHaveLength(1);
    release!(okay({}));
    await picker; await scan;
    expect(calls).toHaveLength(2); expect(calls[1]).toContain('/web/lists');
    expect(now).toBe(1250);
  });

  test('a late picker throttle response preserves cooldown even after cancellation', async () => {
    let release: ((response: Response) => void) | undefined;
    const abort = new AbortController();
    const service = new SharePointContentService({ tenantUrl: ORIGIN, targetDocument: document, now: () => 1000,
      transport: { get: async () => new Promise(resolve => { release = resolve; }) } });
    const discovery = new SharePointDiscovery(ORIGIN, { get: (url, signal) => service.readDiscovery(url, signal) });
    const pending = discovery.searchSites('HR', abort.signal);
    abort.abort(); release!({ status: 429, retryAfter: '2', body: undefined });
    await expect(pending).rejects.toThrow('THROTTLED');
    expect(service.snapshot().cooldownUntil).toBe(3000);
  });
});

describe('Page field', () => {
  test('resolves a pasted page link to its site and item without search', async () => {
    const { discovery, calls } = setup(url => {
      const path = decodeURIComponent(new URL(url).pathname);
      if (path.endsWith('getweburlfrompageurl(@v)')) return okay({ value: SITE });
      if (path.endsWith('/web')) return okay({ Title: 'Workplace', Url: SITE });
      if (path.includes('GetFileByServerRelativePath')) return okay({ Id: 17, Title: 'Office move FAQ', FileRef: '/sites/hr/subsite/SitePages/Office-move.aspx', PromotedState: 0, FSObjType: 0, ContentTypeId: CONTENT_TYPE });
      return collection([]);
    });
    const page = await discovery.resolvePage(`${SITE}/SitePages/Office-move.aspx?web=1`);
    expect(page).toEqual({ pageItemId: 17, title: 'Office move FAQ', pageKind: 'page', sourceUrl: `${SITE}/SitePages/Office-move.aspx`, site: { url: SITE, title: 'Workplace' } });
    expect(calls.some(url => url.includes('search/query'))).toBe(false);
    await expect(discovery.resolvePage(`${SITE}/Shared Documents/a.docx`)).rejects.toThrow('SHAREPOINT_LINK_NOT_A_PAGE');
  });
});
