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

export interface ISharePointListsService {
  getLists(siteUrl: string): Promise<ISharePointList[]>;
  getItems(siteUrl: string, listId: string): Promise<ISharePointListItem[]>;
}

interface IListResponse {
  value: { Id: string; Title: string; ItemCount: number }[];
}

interface IItemResponse {
  value: { Id: number; Title?: string; FileLeafRef?: string; Modified: string }[];
}

/**
 * Returns an absolute https site URL with no trailing slash, query
 * string or hash. Uses the fallback when no site URL is given.
 */
export function resolveSiteUrl(siteUrl: string | undefined, fallbackUrl: string): string {
  const trimmed: string = (siteUrl ?? '').trim();
  const candidate: string = trimmed.length > 0 ? trimmed : fallbackUrl;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`"${candidate}" is not a valid site URL.`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('The site URL must start with https://.');
  }

  return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
}

export class SharePointListsService implements ISharePointListsService {
  public constructor(private readonly _spHttpClient: SPHttpClient) {}

  public async getLists(siteUrl: string): Promise<ISharePointList[]> {
    const url: string =
      `${siteUrl}/_api/web/lists` +
      '?$select=Id,Title,ItemCount&$filter=Hidden eq false&$orderby=Title';
    const data: IListResponse = await this._getJson<IListResponse>(url);

    return data.value.map((list) => ({
      id: list.Id,
      title: list.Title,
      itemCount: list.ItemCount
    }));
  }

  public async getItems(siteUrl: string, listId: string): Promise<ISharePointListItem[]> {
    const url: string =
      `${siteUrl}/_api/web/lists(guid'${listId}')/items` +
      '?$select=Id,Title,FileLeafRef,Modified&$orderby=Modified desc&$top=25';
    const data: IItemResponse = await this._getJson<IItemResponse>(url);

    return data.value.map((item) => ({
      id: item.Id,
      title: item.Title || item.FileLeafRef || `Item ${item.Id}`,
      modified: item.Modified
    }));
  }

  private async _getJson<T>(url: string): Promise<T> {
    const response: SPHttpClientResponse = await this._spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      throw new Error(
        `SharePoint returned ${response.status}. ` +
          'Check that the URL is a SharePoint site and that you have access to it.'
      );
    }

    return (await response.json()) as T;
  }
}
