jest.mock('@microsoft/sp-http', () => ({
  SPHttpClient: { configurations: { v1: {} } }
}));

import type { SPHttpClient } from '@microsoft/sp-http';
import { SharePointListsService, parseSiteUrl } from './SharePointListsService';

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

describe('parseSiteUrl', () => {
  it('removes a trailing slash, a query string and a hash', () => {
    expect(parseSiteUrl(`  ${SITE_URL}/?web=1#top  `)).toBe(SITE_URL);
  });

  it('returns the origin for a root site', () => {
    expect(parseSiteUrl('https://contoso.sharepoint.com/')).toBe('https://contoso.sharepoint.com');
  });

  it('throws when no site URL is given', () => {
    expect(() => parseSiteUrl(undefined)).toThrow(
      'No site URL was given. Ask for the lists on a site by its URL, for example https://contoso.sharepoint.com/sites/hr.'
    );
  });

  it('throws when the site URL is blank', () => {
    expect(() => parseSiteUrl('   ')).toThrow('No site URL was given.');
  });

  it('throws for a value that is not a URL', () => {
    expect(() => parseSiteUrl('the HR site')).toThrow('"the HR site" is not a valid site URL.');
  });

  it('throws for a URL that is not https', () => {
    expect(() => parseSiteUrl('http://contoso.sharepoint.com/sites/hr')).toThrow(
      'The site URL must start with https://.'
    );
  });

  it('throws for a host that is not SharePoint', () => {
    expect(() => parseSiteUrl('https://contoso.example.com/sites/hr')).toThrow(
      'The URL must be a SharePoint site, for example https://contoso.sharepoint.com/sites/hr.'
    );
  });
});

describe('SharePointListsService.getLists', () => {
  it('requests the visible lists of the site', async () => {
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

  it('tells the user when they cannot access the site', async () => {
    const { client } = createClient(403, {});

    await expect(new SharePointListsService(client).getLists(SITE_URL)).rejects.toThrow(
      'You do not have access to this site.'
    );
  });

  it('tells the user when the URL is not a site', async () => {
    const { client } = createClient(404, {});

    await expect(new SharePointListsService(client).getLists(SITE_URL)).rejects.toThrow(
      'No SharePoint site was found at this URL. Use the URL of the site, not the URL of a page or a list.'
    );
  });

  it('tells the user when the URL is a page and SharePoint returns no lists', async () => {
    const { client } = createClient(200, {});

    await expect(new SharePointListsService(client).getLists(SITE_URL)).rejects.toThrow(
      'No SharePoint site was found at this URL. Use the URL of the site, not the URL of a page or a list.'
    );
  });

  it('tells the user when SharePoint returns a response that is not JSON', async () => {
    const get: jest.Mock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      }
    });
    const client: SPHttpClient = { get } as unknown as SPHttpClient;

    await expect(new SharePointListsService(client).getLists(SITE_URL)).rejects.toThrow(
      'No SharePoint site was found at this URL. Use the URL of the site, not the URL of a page or a list.'
    );
  });

  it('includes the status code for any other error', async () => {
    const { client } = createClient(500, {});

    await expect(new SharePointListsService(client).getLists(SITE_URL)).rejects.toThrow(
      'SharePoint returned an error (500).'
    );
  });

  it('tells the user when the site cannot be reached', async () => {
    const get: jest.Mock = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const client: SPHttpClient = { get } as unknown as SPHttpClient;

    await expect(new SharePointListsService(client).getLists(SITE_URL)).rejects.toThrow(
      'The site could not be reached. Check the URL and try again.'
    );
  });
});

describe('SharePointListsService.getItems', () => {
  it('requests the first 25 items of the list', async () => {
    const { client, get } = createClient(200, { value: [] });

    await new SharePointListsService(client).getItems(SITE_URL, 'a1');

    expect(get.mock.calls[0][0]).toBe(
      `${SITE_URL}/_api/web/lists(guid'a1')/items?$select=Id,Title,FileLeafRef,Modified&$top=25`
    );
  });

  it('maps the response to items', async () => {
    const { client } = createClient(200, {
      value: [{ Id: 7, Title: 'Budget', FileLeafRef: '7_.000', Modified: '2026-09-15T12:00:00Z' }]
    });

    const items = await new SharePointListsService(client).getItems(SITE_URL, 'a1');

    expect(items).toEqual([{ id: 7, title: 'Budget', modified: '2026-09-15T12:00:00Z' }]);
  });

  it('uses the file name when a library item has no title', async () => {
    const { client } = createClient(200, {
      value: [{ Id: 7, Title: null, FileLeafRef: 'Budget.xlsx', Modified: '2026-09-15T12:00:00Z' }]
    });

    const items = await new SharePointListsService(client).getItems(SITE_URL, 'a1');

    expect(items[0].title).toBe('Budget.xlsx');
  });

  it('uses the item ID when an item has no title and no file name', async () => {
    const { client } = createClient(200, {
      value: [{ Id: 7, Modified: '2026-09-15T12:00:00Z' }]
    });

    const items = await new SharePointListsService(client).getItems(SITE_URL, 'a1');

    expect(items[0].title).toBe('Item 7');
  });

  it('returns an empty array when the list has no items', async () => {
    const { client } = createClient(200, { value: [] });

    expect(await new SharePointListsService(client).getItems(SITE_URL, 'a1')).toEqual([]);
  });

  it('tells the user when SharePoint returns no items collection', async () => {
    const { client } = createClient(200, {});

    await expect(new SharePointListsService(client).getItems(SITE_URL, 'a1')).rejects.toThrow(
      'No SharePoint site was found at this URL.'
    );
  });
});
