import { CURRENT_SITE_LABEL, createDemoSiteDirectory, createSiteDirectory, sanitizeSearchQuery, sanitizeSiteResult, uniqueSites } from '../services/sites';
import type { IHttpClient, IHttpResponse } from '../services/http';

const ORIGIN = 'https://contoso.sharepoint.com';

function ok(json: unknown): IHttpResponse {
  return { ok: true, status: 200, json: async () => json, text: async () => JSON.stringify(json) };
}

describe('site URL and search sanitising', () => {
  it('keeps https same-tenant SharePoint URLs and drops everything else', () => {
    expect(sanitizeSiteResult('https://contoso.sharepoint.com/sites/it', 'IT', ORIGIN, 'search')).toEqual({
      title: 'IT',
      url: 'https://contoso.sharepoint.com/sites/it',
      source: 'search'
    });
    expect(sanitizeSiteResult('http://contoso.sharepoint.com/sites/it', 'IT', ORIGIN, 'search')).toBeUndefined();
    expect(sanitizeSiteResult('https://fabrikam.sharepoint.com/sites/it', 'IT', ORIGIN, 'search')).toBeUndefined();
    expect(sanitizeSiteResult('https://evil.example/sites/it', 'IT', ORIGIN, 'search')).toBeUndefined();
  });

  it('strips quotes and KQL operators from the user search', () => {
    expect(sanitizeSearchQuery('Lumen AND Path:https://evil.example')).toBe('Lumen Path https //evil.example');
    expect(sanitizeSearchQuery('  "IT" OR NOT  ')).toBe('IT');
    expect(sanitizeSearchQuery("foo'bar")).toBe('foo bar');
  });
});

describe('site directory search lock', () => {
  it('sends contentclass:STS_Site with Path locked to this tenant and ignores off-tenant rows', async () => {
    const urls: string[] = [];
    const http: IHttpClient = {
      get: async (url: string) => {
        urls.push(url);
        return ok({
          PrimaryQueryResult: {
            RelevantResults: {
              Table: {
                Rows: [
                  { Cells: [{ Key: 'Title', Value: 'IT' }, { Key: 'Path', Value: 'https://contoso.sharepoint.com/sites/it' }] },
                  { Cells: [{ Key: 'Title', Value: 'Evil' }, { Key: 'Path', Value: 'https://evil.example/sites/x' }] }
                ]
              }
            }
          }
        });
      },
      post: async () => {
        throw new Error('not used');
      }
    };
    const dir = createSiteDirectory(http, ORIGIN, `${ORIGIN}/sites/it`);
    const found = await dir.searchSites('IT AND Path:https://attacker.example');
    expect(urls.length).toBe(1);
    expect(decodeURIComponent(urls[0])).toContain('contentclass:STS_Site');
    expect(decodeURIComponent(urls[0])).toContain('Path:https://contoso.sharepoint.com');
    expect(decodeURIComponent(urls[0])).not.toContain('Path:https://attacker');
    expect(decodeURIComponent(urls[0])).toContain('contentclass:STS_Site AND Path:https://contoso.sharepoint.com');
    expect(found.map((s) => s.url)).toEqual(['https://contoso.sharepoint.com/sites/it']);
  });

  it('refuses listsFor on an off-tenant URL', async () => {
    const http: IHttpClient = {
      get: async () => ok({ value: [] }),
      post: async () => {
        throw new Error('not used');
      }
    };
    const dir = createSiteDirectory(http, ORIGIN, `${ORIGIN}/sites/it`);
    await expect(dir.listsFor('https://fabrikam.sharepoint.com/sites/it')).rejects.toThrow(/isn.t on this tenant/);
  });
});

describe('demo site directory', () => {
  it('lists followed and recent sites, and custom lists for a chosen site', async () => {
    const dir = createDemoSiteDirectory();
    const followed = await dir.followedSites();
    const recent = await dir.recentSites();
    expect(followed.some((s) => s.title === 'IT')).toBe(true);
    expect(recent.some((s) => s.title === 'Lumen Team')).toBe(true);
    const lists = await dir.listsFor('https://contoso.sharepoint.com/sites/lumen');
    expect(lists.map((l) => l.title)).toContain('Lumen milestones');
    const search = await dir.searchSites('lumen');
    expect(search.map((s) => s.title)).toEqual(['Lumen Team']);
  });
});

describe('current site title', () => {
  const itUrl = `${ORIGIN}/sites/it`;
  const lumen = `${ORIGIN}/sites/lumen`;

  function httpFor(handlers: (url: string) => unknown): IHttpClient {
    return {
      get: async (url: string) => ok(handlers(url)),
      post: async () => {
        throw new Error('not used');
      }
    };
  }

  it('uses a provided current web title immediately and does not label it This site', async () => {
    const urls: string[] = [];
    const http = httpFor((url) => {
      urls.push(url);
      return { value: [] };
    });
    const dir = createSiteDirectory(http, ORIGIN, itUrl, 'IT helpdesk');
    expect(dir.currentSite && dir.currentSite.title).toBe('IT helpdesk');
    expect(dir.currentSite && dir.currentSite.title).not.toBe('This site');
    const followed = await dir.followedSites();
    expect(followed[0]).toEqual({ title: 'IT helpdesk', url: itUrl, source: 'current' });
    expect(urls.some((u) => u.indexOf('/_api/web?') >= 0)).toBe(false);
  });

  it('shows Current site until the web title loads, then uses that title', async () => {
    const http = httpFor((url) => {
      if (url.indexOf('/_api/web?$select=Title') >= 0) {
        return { Title: 'IT helpdesk' };
      }
      if (url.indexOf('social.following') >= 0) {
        return {
          value: [
            { Name: 'IT helpdesk', Uri: itUrl },
            { Name: 'Lumen Team', Uri: lumen }
          ]
        };
      }
      throw new Error(`unexpected url ${url}`);
    });
    const dir = createSiteDirectory(http, ORIGIN, itUrl);
    expect(dir.currentSite && dir.currentSite.title).toBe(CURRENT_SITE_LABEL);
    expect(dir.currentSite && dir.currentSite.title).not.toBe('This site');
    const followed = await dir.followedSites();
    expect(followed.map((s) => s.title)).toEqual(['IT helpdesk', 'Lumen Team']);
    expect(followed.filter((s) => s.url === itUrl)).toHaveLength(1);
    expect(dir.currentSite && dir.currentSite.title).toBe('IT helpdesk');
  });

  it('keeps Current site when the web title cannot be loaded', async () => {
    const http: IHttpClient = {
      get: async (url: string) => {
        if (url.indexOf('/_api/web?$select=Title') >= 0) {
          return { ok: false, status: 500, json: async () => ({}), text: async () => '' };
        }
        return ok({ value: [] });
      },
      post: async () => {
        throw new Error('not used');
      }
    };
    const dir = createSiteDirectory(http, ORIGIN, itUrl);
    const followed = await dir.followedSites();
    expect(followed).toEqual([{ title: CURRENT_SITE_LABEL, url: itUrl, source: 'current' }]);
  });
});

describe('uniqueSites', () => {
  it('dedupes the current site against followed or recent and prefers a real title', () => {
    const itUrl = `${ORIGIN}/sites/it`;
    const lumen = `${ORIGIN}/sites/lumen`;
    const merged = uniqueSites([
      { title: CURRENT_SITE_LABEL, url: itUrl, source: 'current' },
      { title: 'IT helpdesk', url: itUrl, source: 'followed' },
      { title: 'This site', url: itUrl, source: 'recent' },
      { title: 'Lumen Team', url: lumen, source: 'recent' }
    ]);
    expect(merged).toEqual([
      { title: 'IT helpdesk', url: itUrl, source: 'current' },
      { title: 'Lumen Team', url: lumen, source: 'recent' }
    ]);
  });
});
