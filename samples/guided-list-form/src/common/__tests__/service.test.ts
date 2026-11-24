import type { IHttpClient, IHttpResponse } from '../services/http';
import { errorKindOf } from '../services/IListFormService';
import { DEMO_EQUIPMENT_FIELDS, DEMO_FIELDS, DemoListFormService } from '../services/DemoListFormService';
import { SharePointListFormService } from '../services/SharePointListFormService';

const SITE = 'https://fabrikam.sharepoint.com/sites/it';

function res(status: number, body: unknown = {}): IHttpResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

class MockHttp implements IHttpClient {
  public gets: string[] = [];
  public posts: { url: string; headers: Record<string, string>; body: string }[] = [];
  public constructor(private readonly _routes: (url: string, method: 'GET' | 'POST') => IHttpResponse | Error) {}
  public async get(url: string): Promise<IHttpResponse> {
    this.gets.push(url);
    const r = this._routes(url, 'GET');
    if (r instanceof Error) {
      throw r;
    }
    return r;
  }
  public async post(url: string, headers: Record<string, string>, body: string): Promise<IHttpResponse> {
    this.posts.push({ url, headers, body });
    const r = this._routes(url, 'POST');
    if (r instanceof Error) {
      throw r;
    }
    return r;
  }
}

const LIST = { Id: 'x', Title: 'IT Requests', BaseTemplate: 100, Hidden: false, RootFolder: { ServerRelativeUrl: '/sites/it/Lists/ITRequests' } };

function okHttp(list: unknown = LIST): MockHttp {
  return new MockHttp((url, method) => {
    if (method === 'POST') {
      return res(201, { Id: 12 });
    }
    return url.indexOf('/fields') >= 0 ? res(200, { value: DEMO_FIELDS }) : res(200, list);
  });
}

describe('SharePointListFormService', () => {
  it('reads the list and its editable columns with escaped list title, same site only', async () => {
    const http = okHttp();
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: "Alex's list" });
    const schema = await svc.loadSchema();
    expect(http.gets[0]).toBe(`${SITE}/_api/web/lists/getbytitle('Alex''s%20list')?$select=Id,Title,BaseTemplate,Hidden,RootFolder/ServerRelativeUrl&$expand=RootFolder`);
    expect(http.gets[1]).toContain(`${SITE}/_api/web/lists/getbytitle('Alex''s%20list')/fields?$filter=Hidden%20eq%20false%20and%20ReadOnlyField%20eq%20false&$select=`);
    expect(http.gets[1]).toContain('CurrencyLocaleId');
    expect(http.gets[1]).toContain('FieldTypeKind');
    http.gets.forEach((u) => expect(u.indexOf(`${SITE}/_api/`)).toBe(0));
    expect(schema.listTitle).toBe('IT Requests');
    expect(schema.listUrl).toBe('https://fabrikam.sharepoint.com/sites/it/Lists/ITRequests');
    expect(schema.fields.map((f) => f.internalName)).toEqual(['Title', 'Category', 'Details', 'NeededBy']);
    expect(schema.skipped.map((c) => c.internalName)).toEqual(['Owner']);
  });

  it('rejects document libraries and hidden lists', async () => {
    await expect(new SharePointListFormService(okHttp({ ...LIST, BaseTemplate: 101 }), { siteUrl: SITE, listTitle: 'Documents' }).loadSchema()).rejects.toMatchObject({ kind: 'notAList' });
    await expect(new SharePointListFormService(okHttp({ ...LIST, Hidden: true }), { siteUrl: SITE, listTitle: 'X' }).loadSchema()).rejects.toMatchObject({ kind: 'notFound' });
  });

  it.each([
    [401, 'accessDenied'],
    [403, 'accessDenied'],
    [404, 'notFound'],
    [500, 'server']
  ])('maps HTTP %s to %s', async (status, kind) => {
    const http = new MockHttp(() => res(status as number));
    await expect(new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'X' }).loadSchema()).rejects.toMatchObject({ kind });
  });

  it('maps a thrown request to network', async () => {
    const http = new MockHttp(() => new Error('offline'));
    await expect(new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'X' }).loadSchema()).rejects.toMatchObject({ kind: 'network' });
  });

  it('creates one item with nometadata JSON and returns its display-form link', async () => {
    const http = okHttp();
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'IT Requests' });
    const schema = await svc.loadSchema();
    const result = await svc.submit(schema, { Title: 'Laptop', Category: 'Hardware', NeededBy: '2026-11-02', Owner: 'x', Evil: 'y' });
    expect(http.posts).toHaveLength(1);
    expect(http.posts[0].url).toBe(`${SITE}/_api/web/lists/getbytitle('IT%20Requests')/items`);
    expect(http.posts[0].headers['Content-Type']).toBe('application/json;odata=nometadata');
    expect(JSON.parse(http.posts[0].body)).toEqual({ Title: 'Laptop', Category: 'Hardware', NeededBy: '2026-11-02T12:00:00Z' });
    expect(result).toEqual({ id: 12, itemUrl: 'https://fabrikam.sharepoint.com/sites/it/Lists/ITRequests/DispForm.aspx?ID=12', demo: false });
  });

  it('never posts when required columns are unsupported', async () => {
    const http = okHttp();
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'IT Requests' });
    const schema = await svc.loadSchema();
    await expect(svc.submit({ ...schema, blocking: [{ internalName: 'A', title: 'A', typeLabel: 'Lookup', required: true }] }, {})).rejects.toMatchObject({ kind: 'server' });
    expect(http.posts).toHaveLength(0);
  });

  it('maps a failed save to accessDenied', async () => {
    const http = new MockHttp((url, method) => (method === 'POST' ? res(403) : url.indexOf('/fields') >= 0 ? res(200, { value: DEMO_FIELDS }) : res(200, LIST)));
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'IT Requests' });
    const schema = await svc.loadSchema();
    await expect(svc.submit(schema, { Title: 'a', Category: 'Hardware' })).rejects.toMatchObject({ kind: 'accessDenied' });
  });

  it('does not post when required fields are empty and names them in the error', async () => {
    const http = okHttp();
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'IT Requests' });
    const schema = await svc.loadSchema();
    await expect(svc.submit(schema, {})).rejects.toMatchObject({
      kind: 'validation',
      message: 'Please fill in What do you need? and Category.'
    });
    expect(http.posts).toHaveLength(0);
  });

  it('surfaces a SharePoint validation message from a 400 OData body', async () => {
    const http = new MockHttp((url, method) =>
      method === 'POST'
        ? res(400, { 'odata.error': { message: { value: "Required field 'Title' cannot be empty." } } })
        : url.indexOf('/fields') >= 0
          ? res(200, { value: DEMO_FIELDS })
          : res(200, LIST)
    );
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'IT Requests' });
    const schema = await svc.loadSchema();
    await expect(svc.submit(schema, { Title: 'Laptop', Category: 'Hardware' })).rejects.toMatchObject({
      kind: 'validation',
      message: "Required field 'Title' cannot be empty."
    });
  });

  it('treats a 200 body with HasException as a failed save, not a new item', async () => {
    const http = new MockHttp((url, method) =>
      method === 'POST'
        ? res(200, {
            value: [
              { FieldName: 'Title', HasException: true, ErrorMessage: "The required field Title cannot be empty." },
              { FieldName: 'Id', FieldValue: '12', HasException: false }
            ]
          })
        : url.indexOf('/fields') >= 0
          ? res(200, { value: DEMO_FIELDS })
          : res(200, LIST)
    );
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'IT Requests' });
    const schema = await svc.loadSchema();
    await expect(svc.submit(schema, { Title: 'Laptop', Category: 'Hardware' })).rejects.toMatchObject({
      kind: 'validation',
      message: "The required field Title cannot be empty."
    });
  });

  it('leaves a hung POST pending so a late create can still be observed', async () => {
    let resolvePost: (value: import('../services/http').IHttpResponse) => void = () => undefined;
    const http: import('../services/http').IHttpClient = {
      get: async (url: string) => (url.indexOf('/fields') >= 0 ? res(200, { value: DEMO_FIELDS }) : res(200, LIST)),
      post: () => new Promise((resolve) => {
        resolvePost = resolve;
      })
    };
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'IT Requests' });
    const schema = await svc.loadSchema();
    const pending = svc.submit(schema, { Title: 'Laptop', Category: 'Hardware' });
    let settled = false;
    pending.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      }
    );
    await Promise.resolve();
    expect(settled).toBe(false);
    resolvePost(res(201, { Id: 44 }));
    await expect(pending).resolves.toEqual({
      id: 44,
      itemUrl: 'https://fabrikam.sharepoint.com/sites/it/Lists/ITRequests/DispForm.aspx?ID=44',
      demo: false
    });
  });

  it('finds a recently created item for the signed-in user without posting again', async () => {
    const submittedAt = Date.parse('2026-11-24T18:00:00Z');
    const created = new Date(submittedAt + 1000).toISOString();
    const http = new MockHttp((url, method) => {
      if (method === 'POST') {
        return new Error('POST should not run during reconcile');
      }
      if (url.indexOf('/currentuser') >= 0) {
        return res(200, { Id: 7 });
      }
      if (url.indexOf('/items?') >= 0) {
        return res(200, { value: [{ Id: 42, Title: 'Laptop', Created: created, AuthorId: 7 }] });
      }
      return url.indexOf('/fields') >= 0 ? res(200, { value: DEMO_FIELDS }) : res(200, LIST);
    });
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'IT Requests' });
    const schema = await svc.loadSchema();
    const found = await svc.findSubmittedItem(schema, { Title: 'Laptop', Category: 'Hardware' }, submittedAt);
    expect(http.posts).toHaveLength(0);
    expect(http.gets.some((url) => url === `${SITE}/_api/web/currentuser?$select=Id`)).toBe(true);
    const itemsUrl = http.gets.filter((url) => url.indexOf('/items?') >= 0)[0];
    expect(itemsUrl).toContain('AuthorId%20eq%207');
    expect(itemsUrl).toContain("Created%20ge%20datetime'");
    expect(itemsUrl).toContain("Title%20eq%20'Laptop'");
    expect(decodeURIComponent(itemsUrl)).toContain("Created ge datetime'2026-11-24T17:59:30Z'");
    expect(found).toEqual({
      id: 42,
      itemUrl: 'https://fabrikam.sharepoint.com/sites/it/Lists/ITRequests/DispForm.aspx?ID=42',
      demo: false
    });
  });

  it('returns undefined when reconcile finds no matching item', async () => {
    const http = new MockHttp((url, method) => {
      if (method === 'POST') {
        return new Error('POST should not run during reconcile');
      }
      if (url.indexOf('/currentuser') >= 0) {
        return res(200, { Id: 7 });
      }
      if (url.indexOf('/items?') >= 0) {
        return res(200, { value: [] });
      }
      return url.indexOf('/fields') >= 0 ? res(200, { value: DEMO_FIELDS }) : res(200, LIST);
    });
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'IT Requests' });
    const schema = await svc.loadSchema();
    await expect(svc.findSubmittedItem(schema, { Title: 'Laptop', Category: 'Hardware' }, Date.parse('2026-11-24T18:00:00Z'))).resolves.toBeUndefined();
    expect(http.posts).toHaveLength(0);
  });
});

describe('SharePointListFormService v1.1', () => {
  it('posts MultiChoice as a plain array and DateTime as a UTC instant (nometadata)', async () => {
    const http = new MockHttp((url, method) => (method === 'POST' ? res(201, { Id: 3 }) : url.indexOf('/fields') >= 0 ? res(200, { value: DEMO_EQUIPMENT_FIELDS }) : res(200, LIST)));
    const svc = new SharePointListFormService(http, { siteUrl: SITE, listTitle: 'Equipment Issues' });
    const schema = await svc.loadSchema();
    expect(schema.fields.map((f) => f.kind)).toEqual(['text', 'multichoice', 'datetime', 'choice']);
    await svc.submit(schema, { Title: 'Flicker', Devices: ['Monitor', 'Laptop'], StartedAt: '2026-11-16T14:30' });
    const body = JSON.parse(http.posts[0].body);
    expect(body).toEqual({ Title: 'Flicker', Devices: ['Laptop', 'Monitor'], StartedAt: `${new Date(2026, 10, 16, 14, 30).toISOString().slice(0, 16)}:00Z` });
    expect(http.posts[0].body).not.toMatch(/results|__metadata/);
  });
});

describe('DemoListFormService', () => {
  it('records submissions locally and never links to SharePoint', async () => {
    const svc = new DemoListFormService();
    const schema = await svc.loadSchema();
    expect(await svc.submit(schema, { Title: 'a' })).toEqual({ id: 1, itemUrl: '', demo: true });
    expect(svc.submitted).toEqual([{ Title: 'a' }]);
  });

  it('has an equipment scenario with date + time and multi-choice steps', async () => {
    const schema = await new DemoListFormService('equipment').loadSchema();
    expect(schema.listTitle).toBe('Equipment Issues');
    expect(schema.fields.map((f) => f.kind)).toEqual(['text', 'multichoice', 'datetime', 'choice']);
    expect(schema.blocking).toEqual([]);
  });

  it('has blocked, library, not-found and save-error scenarios', async () => {
    expect((await new DemoListFormService('blocked').loadSchema()).blocking).toHaveLength(1);
    await expect(new DemoListFormService('library').loadSchema()).rejects.toMatchObject({ kind: 'notAList' });
    await expect(new DemoListFormService('not-found').loadSchema()).rejects.toMatchObject({ kind: 'notFound' });
    const svc = new DemoListFormService('save-error');
    await expect(svc.submit(await svc.loadSchema(), {})).rejects.toMatchObject({ kind: 'accessDenied' });
  });

  it('errorKindOf defaults to server', () => {
    expect(errorKindOf(new Error('x'))).toBe('server');
  });
});
