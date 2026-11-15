import type { IAnalysisClient } from '../domain/contracts';
import { SharePointContentService } from './sharePoint';
import { SharePointDiscovery } from './discovery';
import type { IContentLensDiscovery } from './discovery';
import type { IRulesStore } from './rulesStore';
import type { IReviewCache } from './reviewCache';
import { createComparisonServices, type IComparisonServices } from '../comparison/services';
import type { IComparisonCache } from '../comparison/cache';
import type { IComparisonChat } from '../comparison/contracts';

export interface IContentLensServices {
  content: Pick<SharePointContentService, 'read' | 'continueRead' | 'stop' | 'snapshot' | 'subscribe'>;
  /** Reviews Page and Comments text; in the component, through the Copilot Chat API. */
  analysis: IAnalysisClient;
  /** Reviews of this card kept for the tab, so a card the host opens again can show them without asking Copilot. */
  reviewCache?: IReviewCache;
  discovery?: IContentLensDiscovery;
  /** Writing rules remembered in this browser; absent in the local preview. */
  rules?: IRulesStore;
  comparison?: IComparisonServices;
  comparisonCache?: IComparisonCache;
}

/** The response fields the scanner reads; SPFx's SharePoint client response provides them. */
export interface ISharePointGetResponse {
  ok: boolean;
  status: number;
  headers: Pick<Headers, 'get'>;
  json(): Promise<unknown>;
}

export interface ILiveContentLensOptions {
  tenantUrl: string;
  targetDocument: Document;
  /**
   * GET through the SPFx SharePoint client. It uses the signed-in user's own SharePoint access,
   * so these reads need no additional Graph permissions. Copilot Chat has separate delegated permissions.
   */
  get(url: string, init: { headers: Record<string, string>; signal?: AbortSignal }): Promise<ISharePointGetResponse>;
  analysis: IAnalysisClient;
  chat?: IComparisonChat;
}

/** Lazy transports: constructing services or opening the component makes no request. */
export function createLiveContentLensServices(options: ILiveContentLensOptions): IContentLensServices {
  const content = new SharePointContentService({
    tenantUrl: options.tenantUrl,
    targetDocument: options.targetDocument,
    transport: {
      get: async (url, signal) => {
        const origin = new URL(options.tenantUrl).origin;
        if (new URL(url).origin !== origin) throw new Error('SHAREPOINT_SITE_OUTSIDE_TENANT');
        if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
        // Read-only GETs; the empty odata-version header keeps the lighter nometadata response.
        const response = await options.get(url, {
          signal,
          headers: { Accept: 'application/json;odata=nometadata', 'odata-version': '' }
        });
        return {
          status: response.status,
          retryAfter: response.headers.get('Retry-After') || undefined,
          body: response.ok ? await response.json() : undefined
        };
      }
    }
  });
  const discovery = new SharePointDiscovery(options.tenantUrl, { get: (url, signal) => content.readDiscovery(url, signal) });
  return {
    content,
    discovery,
    comparison: createComparisonServices({
      tenantUrl: options.tenantUrl,
      document: options.targetDocument,
      discovery,
      chat: options.chat,
      get: (url, signal) => content.readDiscovery(url, signal)
    }),
    analysis: options.analysis
  };
}
