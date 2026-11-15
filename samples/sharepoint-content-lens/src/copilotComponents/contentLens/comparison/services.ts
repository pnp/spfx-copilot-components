import type { ReviewSource } from '../domain/contracts';
import type { IContentLensDiscovery, PageChoice, SiteChoice } from '../services/discovery';
import { SharePointContentService } from '../services/sharePointContentService';
import type { ISharePointReadTransport } from '../services/sharePointContentService';
import { sharePointEntity } from '../services/sharePointParsing';
import { httpsUrl } from './media';
import type { ComparisonEvidence, IComparisonChat } from './contracts';
import { compareEvidence } from './evidence';

export interface IComparisonServices {
  discovery?: IContentLensDiscovery;
  chat?: IComparisonChat;
  read(site: SiteChoice, page: PageChoice, signal: AbortSignal): Promise<ReviewSource>;
  measure(a: ReviewSource, b: ReviewSource, locale: string, signal: AbortSignal): Promise<ComparisonEvidence>;
}
export const comparisonBudget = { links: 16, images: 4, milliseconds: 20000 };

type LinkCheck = ComparisonEvidence['links'][number];
type LinkOutcome = Pick<LinkCheck, 'state' | 'reason' | 'status' | 'checkedAt'>;
type FileMetadata = { bytes?: number; width?: number; height?: number };

/** Maps the HTTP status of a file-metadata request to a link state. A 200 response counts as available only after the file is confirmed. */
function responseOutcome(status: number, throttled: boolean): Pick<LinkCheck, 'state' | 'reason'> {
  if (status === 404) return { state: 'missing', reason: 'http404' };
  if (status === 403) return { state: 'denied', reason: 'http403' };
  if (status === 401) return { state: 'signin', reason: 'http401' };
  return { state: 'unknown', reason: throttled ? 'throttled' : 'response' };
}

/**
 * Builds a SharePoint REST request that reads the metadata of a linked file. Returns undefined unless the URL
 * is a file path on the site's origin, without a query string, outside `_layouts` and `_api`, and not a sign-out page.
 */
export function fileEndpoint(raw: string, siteUrl: string): string | undefined {
  const resolved = httpsUrl(raw, siteUrl);
  if (!resolved) return undefined;
  const url = new URL(resolved);
  const site = new URL(siteUrl);
  if (url.origin !== site.origin || url.search || /\/_layouts\/|\/_api\/|logout|signout/i.test(url.pathname)) return undefined;
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return undefined;
  }
  const unsafeCharacter = Array.from(path).some(char => char === '\\' || char.charCodeAt(0) < 32);
  if (unsafeCharacter || !/\.[a-z0-9]{2,8}$/i.test(path)) return undefined;
  // A file in a standard library is read from the web that owns the library. Any other file must be inside the chosen web.
  const library = path.match(/^(.*)\/(SitePages|Shared Documents|SiteAssets)\//i);
  const web = library ? site.origin + library[1] : siteUrl.replace(/\/$/, '');
  if (!library && !path.toLowerCase().startsWith(site.pathname.toLowerCase().replace(/\/$/, '') + '/')) return undefined;
  const pathParameter = encodeURIComponent("'" + path.replace(/'/g, "''") + "'");
  return web + '/_api/web/GetFileByServerRelativePath(decodedurl=@p)?@p=' + pathParameter + '&$select=Exists,Length,ServerRelativeUrl';
}

export function createComparisonServices(options: {
  tenantUrl: string;
  document: Document;
  get: ISharePointReadTransport['get'];
  discovery?: IContentLensDiscovery;
  chat?: IComparisonChat;
}): IComparisonServices {
  return {
    discovery: options.discovery,
    chat: options.chat,
    read: async (site, page, signal) => {
      const reader = new SharePointContentService({
        tenantUrl: options.tenantUrl,
        targetDocument: options.document,
        transport: { get: options.get }
      });
      try {
        const result = await reader.read({
          siteUrl: site.url,
          pageItemId: page.pageItemId,
          mode: 'page',
          pageKind: 'both',
          lookbackDays: 7
        }, signal);
        const source = result.sources[0];
        if (!source?.page || source.sourceUrl?.toLowerCase() !== page.sourceUrl.toLowerCase()) {
          throw new Error('COMPARISON_REFERENCE_UNAVAILABLE');
        }
        return source;
      } finally {
        reader.stop();
      }
    },
    measure: async (a, b, locale, signal) => {
      const result = compareEvidence(a, b, locale, crypto.randomUUID());
      // Measure on deep copies, so that the metadata added here leaves the sources of the active review unchanged.
      result.pages = JSON.parse(JSON.stringify(result.pages));
      const deadline = Date.now() + comparisonBudget.milliseconds;
      const controller = new AbortController();
      const cancel = (): void => controller.abort();
      signal.addEventListener('abort', cancel, { once: true });
      const timeout = setTimeout(cancel, comparisonBudget.milliseconds);
      let throttled = false;
      let requests = 0;
      const cache = new Map<string, LinkOutcome>();
      try {
        for (let pageIndex = 0; pageIndex < result.pages.length; pageIndex++) {
          const source = result.pages[pageIndex];
          const page = pageIndex === 0 ? 'A' : 'B';
          for (const use of source.page?.media?.links || []) {
            if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
            const endpoint = fileEndpoint(use.url, source.siteUrl);
            const resolved = httpsUrl(use.url, source.siteUrl);
            const external = resolved && new URL(resolved).origin !== new URL(source.siteUrl).origin;
            let outcome = endpoint ? cache.get(endpoint) : undefined;
            if (!outcome) {
              outcome = { state: 'unchecked', reason: external ? 'external' : 'unsupported' };
              if (endpoint) {
                outcome = { state: 'unchecked', reason: throttled ? 'throttled' : 'budget' };
                if (!throttled && requests < comparisonBudget.links && Date.now() < deadline && !controller.signal.aborted) {
                  requests++;
                  const checkedAt = new Date().toISOString();
                  try {
                    const response = await options.get(endpoint, controller.signal);
                    throttled = response.status === 429 || response.status === 503;
                    const status = response.status;
                    outcome = { ...responseOutcome(status, throttled), status, checkedAt };
                    if (status === 200) {
                      const row = sharePointEntity(response.body);
                      if (row.Exists === true && typeof row.ServerRelativeUrl === 'string') {
                        const expected = httpsUrl(use.url, source.siteUrl)!;
                        const expectedPath = decodeURIComponent(new URL(expected).pathname).toLowerCase();
                        if (expectedPath === decodeURIComponent(row.ServerRelativeUrl).toLowerCase()) {
                          outcome = { state: 'available', reason: 'resolved', status, checkedAt };
                        }
                      }
                    }
                  } catch {
                    outcome = { state: 'unknown', reason: controller.signal.aborted ? 'timeout' : 'response', checkedAt };
                  }
                }
                cache.set(endpoint, outcome);
              }
            }
            const method = outcome.checkedAt ? { method: 'SharePoint file metadata' as const } : {};
            result.links.push({ id: page + ':' + use.id, page, useId: use.id, ...outcome, ...method });
          }
        }
        // Image metadata is optional. It is read only for image files on the site's own origin, for at most four unique files.
        const files = new Map<string, FileMetadata>();
        for (const source of result.pages) {
          for (const image of source.page?.media?.images || []) {
            if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
            const url = image.url && httpsUrl(image.url, source.siteUrl);
            const endpoint = url && fileEndpoint(url, source.siteUrl);
            if (!url || !endpoint || !/\.(png|jpe?g|gif|webp)$/i.test(new URL(url).pathname)) continue;
            if (!files.has(url) && files.size < comparisonBudget.images &&
              !throttled && !controller.signal.aborted && Date.now() < deadline) {
              const metadata: FileMetadata = {};
              files.set(url, metadata);
              try {
                const response = await options.get(endpoint, controller.signal);
                throttled = response.status === 429 || response.status === 503;
                if (response.status === 200) {
                  const row = sharePointEntity(response.body);
                  const bytes = Number(row.Length);
                  const sameFile = row.Exists === true && typeof row.ServerRelativeUrl === 'string' &&
                    decodeURIComponent(row.ServerRelativeUrl).toLowerCase() === decodeURIComponent(new URL(url).pathname).toLowerCase();
                  if (sameFile && isFinite(bytes) && bytes >= 0 && bytes <= 1e12) metadata.bytes = bytes;
                }
                // Load the image for its dimensions only when the file is at most 5 MB.
                if (metadata.bytes !== undefined && metadata.bytes <= 5 * 1024 * 1024 && !controller.signal.aborted) {
                  const dimensions = await new Promise<{ width?: number; height?: number }>(resolve => {
                    const img = options.document.createElement('img');
                    let settled = false;
                    let cleanup = (): void => undefined;
                    const done = (value: { width?: number; height?: number }): void => {
                      if (settled) return;
                      settled = true;
                      cleanup();
                      img.onload = null;
                      img.onerror = null;
                      img.removeAttribute('src');
                      resolve(value);
                    };
                    const abort = (): void => done({});
                    const timer = setTimeout(abort, 3000);
                    cleanup = () => {
                      clearTimeout(timer);
                      controller.signal.removeEventListener('abort', abort);
                    };
                    controller.signal.addEventListener('abort', abort, { once: true });
                    img.onload = () => done({ width: img.naturalWidth || undefined, height: img.naturalHeight || undefined });
                    img.onerror = abort;
                    img.src = url;
                  });
                  Object.assign(metadata, dimensions);
                }
              } catch {
                // Metadata that cannot be read stays unknown.
              }
            }
            const metadata = files.get(url);
            if (metadata?.bytes !== undefined) Object.assign(image, metadata, { metadata: 'file' });
          }
        }
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        return result;
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener('abort', cancel);
        controller.abort();
      }
    }
  };
}
