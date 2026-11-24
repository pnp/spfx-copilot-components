import type { IHttpClient, IHttpResponse } from '../services/http';
import { listDropdownOptions, listsSiteUrl, loadCustomLists } from '../services/lists';

const SITE = 'https://fabrikam.sharepoint.com/sites/it';

function res(status: number, body: unknown = {}): IHttpResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

class MockHttp implements IHttpClient {
  public gets: string[] = [];
  public constructor(private readonly _routes: (url: string) => IHttpResponse | Error) {}
  public async get(url: string): Promise<IHttpResponse> {
    this.gets.push(url);
    const r = this._routes(url);
    if (r instanceof Error) {
      throw r;
    }
    return r;
  }
  public async post(): Promise<IHttpResponse> {
    throw new Error('not used');
  }
}

describe('list loading', () => {
  it('asks for visible custom lists, ordered by title, and drops unusable names', async () => {
    const http = new MockHttp(() =>
      res(200, {
        value: [
          { Title: 'Zebra', Id: 'z' },
          { Title: 'IT Requests', Id: 'a' },
          { Title: "Bad/Name", Id: 'b' },
          { Title: 'IT Requests', Id: 'dup' }
        ]
      })
    );
    const lists = await loadCustomLists(http, SITE);
    expect(http.gets[0]).toBe(`${SITE}/_api/web/lists?$filter=${encodeURIComponent('Hidden eq false and BaseTemplate eq 100')}&$select=Title,Id&$orderby=Title`);
    expect(lists.map((l) => l.title)).toEqual(['IT Requests', 'Zebra']);
  });

  it('maps access and network errors', async () => {
    await expect(loadCustomLists(new MockHttp(() => res(403)), SITE)).rejects.toMatchObject({ kind: 'accessDenied' });
    await expect(loadCustomLists(new MockHttp(() => new Error('offline')), SITE)).rejects.toMatchObject({ kind: 'network' });
  });

  it('uses the current site when the URL is empty, and rejects a foreign site', () => {
    const origin = 'https://fabrikam.sharepoint.com';
    expect(listsSiteUrl('', origin, SITE)).toEqual({ siteUrl: SITE, rejected: false });
    expect(listsSiteUrl('https://other.sharepoint.com/sites/x', origin, SITE)).toEqual({ siteUrl: '', rejected: true });
    expect(listsSiteUrl(`${SITE}/`, origin, SITE).rejected).toBe(false);
  });

  it('keeps a saved list selected even when it is no longer in the results', () => {
    const options = listDropdownOptions([{ title: 'IT Requests', id: 'a' }], 'Archived list');
    expect(options[0]).toEqual({ key: 'Archived list', text: 'Archived list' });
    expect(options.map((o) => o.key)).toContain('IT Requests');
    expect(listDropdownOptions([{ title: 'IT Requests', id: 'a' }], 'IT Requests').length).toBe(1);
  });
});
