import { createLiveContentLensServices, type ISharePointGetResponse } from '../live';
import type { IAnalysisClient } from '../../domain/contracts';

const tenantUrl = 'https://contoso.sharepoint.com/sites/testing';
const analysis: IAnalysisClient = { analyze: async () => ({ findings: [], decisions: [], provenance: 'copilotChat' }) };
function response(status: number, body: object = {}): ISharePointGetResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body, headers: { get: () => null } };
}
type GetArgs = [string, { headers: Record<string, string>; signal?: AbortSignal }];
type Get = jest.Mock<Promise<ISharePointGetResponse>, GetArgs>;
const encoder = jest.requireActual('util') as { TextEncoder: typeof TextEncoder };
Object.defineProperty(globalThis, 'TextEncoder', { configurable: true, value: encoder.TextEncoder });

describe('deployed live transport', () => {
  test('construction and snapshot send no request', () => {
    const get: Get = jest.fn();
    const services = createLiveContentLensServices({ tenantUrl, targetDocument: document, get, analysis });
    expect(services.content.snapshot().sources).toEqual([]);
    expect(services.discovery).toBeDefined();
    expect(get).not.toHaveBeenCalled();
  });

  test('a review failure is not replayed, sent to SharePoint or replaced by fixtures', async () => {
    const get: Get = jest.fn<Promise<ISharePointGetResponse>, GetArgs>(async () => response(403, { error: 'private provider text' }));
    const failing = { analyze: jest.fn(async (): Promise<never> => { throw new Error('REVIEW_API_ACCESS'); }) };
    const services = createLiveContentLensServices({ tenantUrl, targetDocument: document, get, analysis: failing });
    const source = { id: 's', chunkId: 'main', siteUrl: tenantUrl, listId: 'l', pageItemId: 1,
      kind: 'comment' as const, pageKind: 'news' as const, pageTitle: 'Test', text: 'Test text', createdAt: '2026-09-07T10:00:00Z' };
    await expect(services.analysis.analyze([source], ['insult'], [])).rejects.toThrow('REVIEW_API_ACCESS');
    expect(failing.analyze).toHaveBeenCalledTimes(1);
    expect(get).not.toHaveBeenCalled();
  });

  test('site discovery reads through the SPFx SharePoint client with a plain GET and no token', async () => {
    const get: Get = jest.fn<Promise<ISharePointGetResponse>, GetArgs>(async () => response(200, {
      PrimaryQueryResult: { RelevantResults: { Table: { Rows: [] }, TotalRows: 0 } }
    }));
    const services = createLiveContentLensServices({ tenantUrl, targetDocument: document, get, analysis });
    await expect(services.discovery!.searchSites('HR')).resolves.toEqual({ items: [], hasMore: false });
    expect(get).toHaveBeenCalledTimes(1);
    const [url, init] = get.mock.calls[0];
    expect(new URL(url).origin).toBe('https://contoso.sharepoint.com');
    expect(url).toContain('/_api/search/query');
    expect(init.headers).toEqual({ Accept: 'application/json;odata=nometadata', 'odata-version': '' });
    expect(Object.keys(init.headers).some(name => name.toLowerCase() === 'authorization')).toBe(false);
    expect(services.content.snapshot().coverage.operationsAttempted).toBe(0);
  });

  test('foreign pasted links fail before any HTTP request', async () => {
    const get: Get = jest.fn();
    const services = createLiveContentLensServices({ tenantUrl, targetDocument: document, get, analysis });
    await expect(services.discovery!.resolveSite('https://other.sharepoint.com/sites/hr/SitePages/news.aspx')).rejects.toThrow('OUTSIDE_TENANT');
    expect(get).not.toHaveBeenCalled();
  });
});
