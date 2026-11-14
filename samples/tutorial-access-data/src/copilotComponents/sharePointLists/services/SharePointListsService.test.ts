jest.mock('@microsoft/sp-http', () => ({
  SPHttpClient: { configurations: { v1: {} } }
}));

import type { SPHttpClient } from '@microsoft/sp-http';
import { SharePointListsService, resolveSiteUrl } from './SharePointListsService';

const SITE_URL: string = 'https://contoso.sharepoint.com/sites/hr';

function createClient(
  status: number,
  body: unknown
): { client: SPHttpClient; get: jest.Mock } {
  const get: jest.Mock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  });
  return { client: { get } as unknown as SPHttpClient, get };
}

describe('resolveSiteUrl', () => {
  it('uses the fallback when no site URL is given', () => {
    expect(resolveSiteUrl(undefined, SITE_URL)).toBe(SITE_URL);
  });

  it('uses the fallback when the site URL is blank', () => {
    expect(resolveSiteUrl('   ', SITE_URL)).toBe(SITE_URL);
  });

  it('removes a trailing slash, a query string and a hash', () => {
    expect(resolveSiteUrl(`${SITE_URL}/?web=1#top`, 'https://fallback')).toBe(SITE_URL);
  });

  it('returns the origin for a root site', () => {
    expect(resolveSiteUrl('https://contoso.sharepoint.com/', 'https://fallback')).toBe(
      'https://contoso.sharepoint.com'
    );
  });

  it('throws for a value that is not a URL', () => {
    expect(() => resolveSiteUrl('the HR site', SITE_URL)).toThrow(
      '"the HR site" is not a valid site URL.'
    );
  });

  it('throws for a URL that is not https', () => {
    expect(() => resolveSiteUrl('http://contoso.sharepoint.com/sites/hr', SITE_URL)).toThrow(
      'The site URL must start with https://.'
    );
  });
});

describe('SharePointListsService.getLists', () => {
  it('requests the visible lists of the site, sorted by title', async () => {
    const { client, get } = createClient(200, { value: [] });

    await new SharePointListsService(client).getLists(SITE_URL);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toBe(
      `${SITE_URL}/_api/web/lists?$select=Id,Title,ItemCount&$filter=Hidden eq false&$orderby=Title`
    );
  });

  it('maps the response to lists', async () => {
    const { client } = createClient(200, {
      value: [{ Id: 'a1', Title: 'Documents', ItemCount: 12 }]
    });

    const lists = await new SharePointListsService(client).getLists(SITE_URL);

    expect(lists).toEqual([{ id: 'a1', title: 'Documents', itemCount: 12 }]);
  });

  it('returns an empty array when the site has no visible lists', async () => {
    const { client } = createClient(200, { value: [] });

    expect(await new SharePointListsService(client).getLists(SITE_URL)).toEqual([]);
  });

  it('throws with the status code when SharePoint rejects the request', async () => {
    const { client } = createClient(404, {});

    await expect(new SharePointListsService(client).getLists(SITE_URL)).rejects.toThrow(
      'SharePoint returned 404. Check that the URL is a SharePoint site and that you have access to it.'
    );
  });
});

describe('SharePointListsService.getItems', () => {
  it('requests the 25 most recently modified items of the list', async () => {
    const { client, get } = createClient(200, { value: [] });

    await new SharePointListsService(client).getItems(SITE_URL, 'a1');

    expect(get.mock.calls[0][0]).toBe(
      `${SITE_URL}/_api/web/lists(guid'a1')/items?$select=Id,Title,FileLeafRef,Modified&$orderby=Modified desc&$top=25`
    );
  });

  it('maps the response to items', async () => {
    const { client } = createClient(200, {
      value: [{ Id: 7, Title: 'Onboarding', FileLeafRef: '7_.000', Modified: '2026-09-01T10:00:00Z' }]
    });

    const items = await new SharePointListsService(client).getItems(SITE_URL, 'a1');

    expect(items).toEqual([{ id: 7, title: 'Onboarding', modified: '2026-09-01T10:00:00Z' }]);
  });

  it('uses the file name when a library item has no title', async () => {
    const { client } = createClient(200, {
      value: [{ Id: 3, Title: null, FileLeafRef: 'Budget.xlsx', Modified: '2026-09-02T10:00:00Z' }]
    });

    const items = await new SharePointListsService(client).getItems(SITE_URL, 'a1');

    expect(items[0].title).toBe('Budget.xlsx');
  });

  it('uses the item id when an item has no title and no file name', async () => {
    const { client } = createClient(200, {
      value: [{ Id: 9, Title: '', Modified: '2026-09-03T10:00:00Z' }]
    });

    const items = await new SharePointListsService(client).getItems(SITE_URL, 'a1');

    expect(items[0].title).toBe('Item 9');
  });

  it('throws with the status code when SharePoint rejects the request', async () => {
    const { client } = createClient(403, {});

    await expect(new SharePointListsService(client).getItems(SITE_URL, 'a1')).rejects.toThrow(
      'SharePoint returned 403.'
    );
  });
});
