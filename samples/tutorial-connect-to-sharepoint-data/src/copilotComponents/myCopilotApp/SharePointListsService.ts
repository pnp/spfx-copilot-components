import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';

export interface ISharePointList {
  id: string;
  title: string;
  itemCount: number;
}

export interface ISharePointListItem {
  id: number;
  title: string;
  modified: string;
}

interface IListResponse {
  Id: string;
  Title: string;
  ItemCount: number;
}

interface IItemResponse {
  Id: number;
  Title?: string;
  FileLeafRef?: string;
  Modified: string;
}

const EXAMPLE_URL: string = 'https://contoso.sharepoint.com/sites/hr';

const NOT_A_SITE: string =
  'No SharePoint site was found at this URL. ' +
  'Use the URL of the site, not the URL of a page or a list.';

// The model fills in the URL. Send requests only to SharePoint hosts.
const SHAREPOINT_HOST: RegExp = /\.sharepoint(\.com|\.us|\.cn|-mil\.us)$/i;

/**
 * Returns an absolute https site URL with no trailing slash, query
 * string or hash. Throws an Error with a message for the user when
 * the value is not the URL of a SharePoint site.
 */
export function parseSiteUrl(siteUrl: string | undefined): string {
  const trimmed: string = typeof siteUrl === 'string' ? siteUrl.trim() : '';

  if (trimmed.length === 0) {
    throw new Error(
      `No site URL was given. Ask for the lists on a site by its URL, for example ${EXAMPLE_URL}.`
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`"${trimmed}" is not a valid site URL.`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('The site URL must start with https://.');
  }

  if (!SHAREPOINT_HOST.test(parsed.hostname)) {
    throw new Error(`The URL must be a SharePoint site, for example ${EXAMPLE_URL}.`);
  }

  return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
}

export class SharePointListsService {
  public constructor(private readonly _spHttpClient: SPHttpClient) {}

  public async getLists(siteUrl: string): Promise<ISharePointList[]> {
    const url: string =
      `${siteUrl}/_api/web/lists` +
      '?$select=Id,Title,ItemCount&$filter=Hidden eq false&$orderby=Title';
    const lists: IListResponse[] = await this._getCollection<IListResponse>(url);

    return lists.map((list) => ({
      id: list.Id,
      title: list.Title,
      itemCount: list.ItemCount
    }));
  }

  public async getItems(siteUrl: string, listId: string): Promise<ISharePointListItem[]> {
    const url: string =
      `${siteUrl}/_api/web/lists(guid'${listId}')/items` +
      '?$select=Id,Title,FileLeafRef,Modified&$top=25';
    const items: IItemResponse[] = await this._getCollection<IItemResponse>(url);

    // Columns differ between lists. A library item often has no title,
    // so fall back to the file name.
    return items.map((item) => ({
      id: item.Id,
      title: item.Title || item.FileLeafRef || `Item ${item.Id}`,
      modified: item.Modified
    }));
  }

  private async _getCollection<T>(url: string): Promise<T[]> {
    let response: SPHttpClientResponse;
    try {
      response = await this._spHttpClient.get(url, SPHttpClient.configurations.v1);
    } catch {
      throw new Error('The site could not be reached. Check the URL and try again.');
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('You do not have access to this site.');
    }

    if (response.status === 404) {
      throw new Error(NOT_A_SITE);
    }

    if (!response.ok) {
      throw new Error(`SharePoint returned an error (${response.status}).`);
    }

    // A page URL can return 200 with HTML or with JSON that is not a
    // collection, so check the shape before using it.
    let body: { value?: unknown };
    try {
      body = await response.json();
    } catch {
      throw new Error(NOT_A_SITE);
    }

    if (!body || !Array.isArray(body.value)) {
      throw new Error(NOT_A_SITE);
    }

    return body.value as T[];
  }
}
