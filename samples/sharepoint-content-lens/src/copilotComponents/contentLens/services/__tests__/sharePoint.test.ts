import { SharePointContentService } from '../sharePoint';
import type { ISharePointContentOptions, ISharePointReadTransport } from '../sharePoint';
import { canvasControls, sharePointPageContent, sharePointCommentText, sharePointContinuation, sharePointText, validateSharePointPageUrl, validateSharePointSiteUrl } from '../sharePointParsing';
import type { PageStructure, ScanRequest } from '../../domain/contracts';
import { storedCanvas } from '../../__fixtures__/storedCanvas';
import { storedPageWithEmptyColumn, storedPageWithSectionBackground, storedPageWithWebPart } from '../../__fixtures__/storedPages';
import { createComparisonServices } from '../../comparison/services';

// The page reader returns text and structure together; these tests look at one of them at a time.
function sharePointEditorialText(canvas: unknown, targetDocument: Document): { text: string; omittedParts: string[] } {
  const content = sharePointPageContent(canvas, targetDocument, '');
  return { text: content.text, omittedParts: content.omittedParts };
}
function sharePointPageStructure(canvas: unknown, targetDocument: Document): PageStructure | undefined {
  try { return sharePointPageContent(canvas, targetDocument, '').structure; }
  catch { return undefined; }
}

const SITE = 'https://contoso.sharepoint.com/sites/hr';
const LIST = '11111111-2222-4333-8444-555555555555';
const CONTENT_TYPE = '0x0101009D1CB255DA76424F860D91F20E6C4118';
const NOW = Date.parse('2026-09-07T12:00:00Z');
const day = (offset: number): string => new Date(NOW + offset * 86400000).toISOString();
const request: ScanRequest = { siteUrl: SITE, mode: 'comments', pageKind: 'both', lookbackDays: 7 };
type Response = Awaited<ReturnType<ISharePointReadTransport['get']>>;
const okay = (body: unknown): Response => ({ status: 200, body });
const rows = (value: unknown[], next?: string): Response => okay({ value, ...(next ? { 'odata.nextLink': next } : {}) });
const page = (id: number = 42, promoted: number = 2): Record<string, unknown> => ({ Id: id, Title: `Page ${id}`,
  FileRef: `/sites/hr/SitePages/page-${id}.aspx`, Created: day(-180), PromotedState: promoted, FSObjType: 0, ContentTypeId: CONTENT_TYPE });
const comment = (id: string, created: number, text: string = 'Original text'): Record<string, unknown> => ({ id, createdDate: day(created), text, replyCount: 0 });
const nextLink = (url: string, token: string): string => { const next = new URL(url); next.searchParams.set('$skiptoken', token); return next.toString(); };

function setup(handler?: (url: string, calls: string[]) => Response | Promise<Response>, extra: Partial<ISharePointContentOptions> = {}): {
  service: SharePointContentService; calls: string[]; advance: (milliseconds: number) => void; waits: number[];
} {
  let clock = NOW;
  const calls: string[] = [];
  const waits: number[] = [];
  const transport: ISharePointReadTransport = { get: async url => {
    calls.push(url);
    if (new URL(url).pathname.endsWith('/lists')) return rows([{ Id: LIST, BaseTemplate: 119, RootFolder: { ServerRelativeUrl: '/sites/hr/SitePages' } }]);
    if (new URL(url).pathname.endsWith('/contenttypes')) return rows([{ StringId: CONTENT_TYPE }]);
    if (handler) return handler(url, calls);
    if (new URL(url).pathname.endsWith('/items')) return rows([page()]);
    return rows([]);
  } };
  const service = new SharePointContentService({ tenantUrl: SITE, transport, targetDocument: document,
    now: () => clock, wait: async milliseconds => { waits.push(milliseconds); clock += milliseconds; }, ...extra });
  return { service, calls, waits, advance: milliseconds => { clock += milliseconds; } };
}

describe('SharePoint GET-only bounded scan', () => {
  beforeAll(() => {
    const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');
    Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true });
  });

  it('restores a bounded scan in a replacement component without rereading earlier endpoints', async () => {
    const handler = (url: string): Response => {
      const path = new URL(url).pathname;
      if (path.endsWith('/items')) return rows([page()]);
      if (path.endsWith('/comments')) return rows([comment('1', -1, 'Original parent')]);
      return rows([comment('2', -1, 'Reply')]);
    };
    const original = setup(handler, { limits: { stepOperations: 4 } });
    await original.service.read(request);
    expect(original.service.snapshot().state).toBe('paused');
    const checkpoint = original.service.exportSession()!;
    const resumed = setup(handler);
    resumed.service.restoreSession(checkpoint);
    const result = await resumed.service.continueRead();
    expect(resumed.calls).toHaveLength(1);
    expect(resumed.calls[0]).toContain('/comments(1)/replies');
    expect(result.sources.map(source => source.text).sort()).toEqual(['Original parent', 'Reply']);
    expect(result.sources.find(source => source.kind === 'reply')?.contextText).toBe('Original parent');
    expect(result.coverage.operationsAttempted).toBe(5);
    expect(resumed.service.snapshot().checkpoint?.windowEnd).toBe(original.service.snapshot().checkpoint?.windowEnd);
  });

  it('rejects forged resume endpoints before any transport is called', async () => {
    const original = setup(url => new URL(url).pathname.endsWith('/items') ? rows([page()]) : rows([]), { limits: { stepOperations: 3 } });
    await original.service.read(request);
    const serialized = original.service.exportSession()!;
    for (const url of ['https://other.sharepoint.com/_api/web/lists', SITE + '/_api/web/deleteObject']) {
      const state = JSON.parse(serialized);
      state.queue = [{ kind: 'metadata', url }];
      const resumed = setup();
      expect(() => resumed.service.restoreSession(JSON.stringify(state))).toThrow();
      expect(resumed.calls).toHaveLength(0);
    }
  });

  it('preserves throttle cooldown on restoration and does not retry early', async () => {
    const original = setup(url => new URL(url).pathname.endsWith('/items') ? rows([page()]) : { status: 429, body: {}, retryAfter: '60' });
    await original.service.read(request);
    const resumed = setup(); resumed.service.restoreSession(original.service.exportSession()!);
    await resumed.service.continueRead();
    expect(resumed.calls).toHaveLength(0);
    expect(resumed.service.snapshot().state).toBe('throttled');
  });

  it('reads recent comments and new replies on old parents/pages, independently of counts and parent dates', async () => {
    const { service, calls } = setup(url => {
      const path = new URL(url).pathname;
      if (path.endsWith('/items')) return rows([{ ...page(), _CommentCount: 0 }]);
      if (path.endsWith('/comments')) return rows([comment('1', -180, 'Old parent'), comment('2', -1, 'New comment')]);
      if (path.endsWith('/comments(1)/replies')) return rows([comment('3', -1, 'New reply'), comment('4', -10)]);
      return rows([]);
    });
    const result = await service.read(request);
    expect(result.sources.map(source => source.text).sort()).toEqual(['New comment', 'New reply']);
    const reply = result.sources.find(source => source.kind === 'reply');
    expect(reply?.parentCommentId).toBe('1');
    expect(reply?.contextText).toBe('Old parent');
    expect(reply?.sourceUrl).toBe(`${SITE}/SitePages/page-42.aspx`);
    expect(calls.some(url => url.includes('/comments(1)/replies'))).toBe(true);
    expect(calls.filter(url => url.includes('/comments('))).toHaveLength(2);
    expect(result.coverage.completedPages).toBe(1);
    expect(result.coverage.retrieved).toBe(4);
    expect(result.coverage.matching).toBe(2);
    expect(result.coverage.operationsAttempted).toBe(calls.length);
    expect(service.snapshot().state).toBe('completed');
  });

  it('preserves a fixed date-window end and excludes comments added after scan start', async () => {
    const { service } = setup(url => {
      if (new URL(url).pathname.endsWith('/items')) return rows([page()]);
      if (new URL(url).pathname.endsWith('/comments')) return rows([comment('1', 1), comment('2', -7), comment('3', -8)]);
      return rows([]);
    });
    const result = await service.read(request);
    expect(result.sources.map(source => source.commentId)).toEqual(['2']);
    expect(service.snapshot().checkpoint?.windowEnd).toBe(new Date(NOW).toISOString());
  });

  it('paginates comments and replies separately, ignores incomplete expanded replies, and deduplicates identities', async () => {
    const { service } = setup(url => {
      const path = new URL(url).pathname;
      const token = new URL(url).searchParams.get('$skiptoken');
      if (path.endsWith('/items')) return rows([page()]);
      if (path.endsWith('/comments')) return token ? rows([comment('1', -1), comment('2', -2)]) :
        rows([{ ...comment('1', -1), replies: [comment('99', -1, 'Expanded data is not accepted as complete')] }], nextLink(url, 'comments-next'));
      if (path.endsWith('/comments(1)/replies')) return token ? rows([comment('4', -1)]) : rows([comment('3', -1)], nextLink(url, 'replies-next'));
      return rows([]);
    });
    const result = await service.read(request);
    expect(result.sources.map(source => source.commentId).sort()).toEqual(['1', '2', '3', '4']);
    expect(result.coverage.retrieved).toBe(4);
    expect(service.snapshot().coverage.completedPages).toBe(1);
  });

  it('stops at a step operation cap mid-discussion and continues without replaying successful reads', async () => {
    const { service, calls } = setup(url => {
      if (new URL(url).pathname.endsWith('/items')) return rows([page()]);
      if (new URL(url).pathname.endsWith('/comments')) return rows([comment('1', -1), comment('2', -1)]);
      return rows([]);
    }, { limits: { stepOperations: 5 } });
    const first = await service.read(request);
    expect(first.coverage.operationsAttempted).toBe(5);
    expect(first.coverage.partialPages).toBe(1);
    expect(service.snapshot().state).toBe('paused');
    const after = await service.continueRead();
    expect(after.coverage.completedPages).toBe(1);
    expect(after.coverage.operationsAttempted).toBe(6);
    expect(calls.filter(url => new URL(url).pathname.endsWith('/comments'))).toHaveLength(1);
  });

  it('admits at most the page budget and completes already admitted replies before continuing', async () => {
    const { service, calls } = setup(url => new URL(url).pathname.endsWith('/items') ? rows([page(42), page(41), page(40)]) : rows([]),
      { limits: { stepPages: 2 } });
    const first = await service.read(request);
    expect(first.coverage.completedPages).toBe(2);
    expect(service.snapshot().checkpoint?.admittedPageIds).toEqual([42, 41]);
    expect(calls.some(url => url.includes('/items(40)/comments'))).toBe(false);
    await service.continueRead();
    expect(service.snapshot().coverage.completedPages).toBe(3);
    expect(service.snapshot().coverage.operationsAttempted).toBe(6);
  });

  it('does not preload further metadata after the step page ceiling', async () => {
    const { service, calls } = setup(url => {
      if (new URL(url).pathname.endsWith('/items')) return rows([page(42), page(41)], nextLink(url, 'metadata-next'));
      return rows([]);
    }, { limits: { stepPages: 2 } });
    await service.read(request);
    expect(calls.filter(url => new URL(url).pathname.endsWith('/items'))).toHaveLength(1);
    expect(service.snapshot().checkpoint?.upperItemId).toBe(42);
    expect(service.snapshot().state).toBe('paused');
  });

  it('honors session attempt ceilings across continuations', async () => {
    const { service, calls } = setup(url => new URL(url).pathname.endsWith('/items') ? rows([page(42), page(41)]) : rows([]),
      { limits: { stepOperations: 3, sessionOperations: 4 } });
    await service.read(request);
    await service.continueRead();
    expect(calls).toHaveLength(4);
    expect(service.snapshot().state).toBe('capped');
    expect(service.snapshot().canContinue).toBe(false);
    await service.continueRead();
    expect(calls).toHaveLength(4);
  });

  it('pauses on 429 with results intact and manually resumes only the failed operation after Retry-After', async () => {
    let throttle = true;
    const { service, calls, advance } = setup(url => {
      const path = new URL(url).pathname;
      if (path.endsWith('/items')) return rows([page()]);
      if (path.endsWith('/comments')) return rows([comment('1', -1)]);
      if (path.endsWith('/replies') && throttle) { throttle = false; return { status: 429, body: {}, retryAfter: '10' }; }
      return rows([]);
    });
    const first = await service.read(request);
    expect(first.sources).toHaveLength(1);
    expect(service.snapshot().state).toBe('throttled');
    const count = calls.length;
    await service.continueRead();
    expect(calls).toHaveLength(count);
    advance(10000);
    expect(service.snapshot().canContinue).toBe(true);
    await service.continueRead();
    expect(calls).toHaveLength(count + 1);
    expect(service.snapshot().state).toBe('completed');
    expect(service.snapshot().coverage.operationsAttempted).toBe(count + 1);
  });

  it('retains the component-wide cooldown across stop, site changes and direct-page reads', async () => {
    const { service, calls } = setup(() => ({ status: 503, body: {} }));
    await service.read(request);
    const deadline = service.snapshot().cooldownUntil;
    service.stop();
    const count = calls.length;
    await service.read({ ...request, siteUrl: 'https://contoso.sharepoint.com/sites/other', mode: 'page', pageItemId: 1 });
    expect(calls).toHaveLength(count);
    expect(service.snapshot().cooldownUntil).toBe(deadline);
    expect(service.snapshot().state).toBe('throttled');
  });

  it('doubles the missing Retry-After fallback on consecutive throttles without automatic retries', async () => {
    const { service, advance, calls } = setup(() => ({ status: 503, body: {} }));
    await service.read(request);
    const firstDeadline = service.snapshot().cooldownUntil!;
    const firstCount = calls.length;
    advance(30000);
    await service.continueRead();
    expect(calls).toHaveLength(firstCount + 1);
    expect(service.snapshot().cooldownUntil! - firstDeadline).toBe(60000);
  });

  it('records 403/404 failures without retry loops and keeps other pages readable', async () => {
    const { service, calls } = setup(url => {
      if (new URL(url).pathname.endsWith('/items')) return rows([page(42), page(41)]);
      return url.includes('/items(42)') ? { status: 403, body: {} } : rows([]);
    });
    await service.read(request);
    expect(service.snapshot().failures[0].status).toBe(403);
    expect(service.snapshot().coverage.failedSources).toBe(1);
    expect(service.snapshot().coverage.completedPages).toBe(1);
    expect(service.snapshot().coverage.isPartial).toBe(true);
    expect(calls.filter(url => url.includes('/items(42)'))).toHaveLength(1);
  });

  it('counts inspected nonmatching page kinds without retrieving their comments', async () => {
    const { service, calls } = setup(url => new URL(url).pathname.endsWith('/items') ? rows([page(42, 2), page(41, 0)]) : rows([]));
    await service.read({ ...request, pageKind: 'page' });
    expect(service.snapshot().coverage.completedPages).toBe(2);
    expect(calls.some(url => url.includes('/items(42)/comments'))).toBe(false);
    expect(calls.some(url => url.includes('/items(41)/comments'))).toBe(true);
  });

  it('uses a 250ms completion-to-next dispatch gap and notifies subscribers', async () => {
    const { service, calls, waits } = setup();
    const listener = jest.fn();
    const unsubscribe = service.subscribe(listener);
    await service.read(request);
    expect(waits).toHaveLength(calls.length - 1);
    expect(waits.every(gap => gap === 250)).toBe(true);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    const notifications = listener.mock.calls.length;
    service.stop();
    expect(listener).toHaveBeenCalledTimes(notifications);
  });

  it('discards an in-flight source response after stop and preserves its resumable position', async () => {
    let finish: ((response: Response) => void) | undefined;
    const { service } = setup(url => {
      if (new URL(url).pathname.endsWith('/items')) return rows([page()]);
      return new Promise<Response>(resolve => { finish = resolve; });
    });
    const pending = service.read(request);
    for (let index = 0; index < 20; index += 1) { await Promise.resolve(); if (finish) break; }
    expect(finish).toBeDefined();
    service.stop();
    finish!(rows([comment('1', -1)]));
    await pending;
    expect(service.snapshot().sources).toHaveLength(0);
    expect(service.snapshot().state).toBe('cancelled');
    expect(service.snapshot().canContinue).toBe(true);
  });

  it('serializes rapid scope changes and never starts a superseded waiting read', async () => {
    let finish: ((response: Response) => void) | undefined;
    let block = true;
    const { service, calls } = setup(url => {
      if (new URL(url).pathname.endsWith('/items')) return rows([page()]);
      if (block) return new Promise<Response>(resolve => { finish = resolve; });
      return rows([]);
    });
    const first = service.read(request);
    for (let index = 0; index < 20; index += 1) { await Promise.resolve(); if (finish) break; }
    expect(finish).toBeDefined();
    const second = service.read({ ...request, siteUrl: 'https://contoso.sharepoint.com/sites/second' });
    const secondOutcome = second.catch(error => error as Error);
    const third = service.read(request);
    block = false;
    finish!(rows([]));
    await Promise.all([first, third]);
    expect((await secondOutcome as Error).message).toBe('SHAREPOINT_SCAN_SUPERSEDED');
    expect(calls.some(url => url.indexOf('/sites/second/') >= 0)).toBe(false);
    expect(service.snapshot().checkpoint?.siteUrl).toBe(SITE);
  });

  it('reports an explicitly selected nonmodern or wrong-kind item as a failure, never an empty completed review', async () => {
    for (const scenario of [
      { row: { ...page(), ContentTypeId: '0x0101' }, pageKind: 'both' as const, code: 'SHAREPOINT_PAGE_NOT_MODERN' },
      { row: page(), pageKind: 'page' as const, code: 'SHAREPOINT_PAGE_KIND_MISMATCH' }
    ]) {
      const { service } = setup(() => okay(scenario.row));
      const result = await service.read({ ...request, pageItemId: 42, pageKind: scenario.pageKind });
      expect(result.sources).toHaveLength(0);
      expect(result.coverage.completedPages).toBe(0);
      expect(result.coverage.failedSources).toBe(1);
      expect(service.snapshot().state).toBe('failed');
      expect(service.snapshot().failures[0].code).toBe(scenario.code);
    }
  });

  it('rejects a different item ID returned for an explicit page selection', async () => {
    const { service } = setup(() => okay(page(41)));
    const result = await service.read({ ...request, pageItemId: 42 });
    expect(result.sources).toHaveLength(0);
    expect(result.coverage.completedPages).toBe(0);
    expect(service.snapshot().failures[0].code).toBe('SHAREPOINT_PAGE_SELECTION_MISMATCH');
  });

  it('retains all retrieved matches for analysis continuation beyond the first hundred', async () => {
    const { service } = setup(url => {
      const path = new URL(url).pathname;
      if (path.endsWith('/items')) return rows([page()]);
      if (path.endsWith('/comments')) {
        const offset = Number(new URL(url).searchParams.get('$skiptoken') || 0);
        return rows(Array.from({ length: Math.min(50, 105 - offset) }, (_item, index) => comment(String(offset + index + 1), -1)), offset < 100 ? nextLink(url, String(offset + 50)) : undefined);
      }
      return rows([]);
    });
    await service.read(request);
    await service.continueRead();
    const result = await service.continueRead();
    expect(result.sources).toHaveLength(105);
    expect(result.coverage.matching).toBe(105);
    expect(result.coverage.displayed).toBe(result.coverage.matching);
    expect(result.coverage.operationsAttempted).toBe(111);
    expect(service.snapshot().state).toBe('completed');
  });

  it.each([
    ['page API JSON', (controls: object[]): string => JSON.stringify(controls)],
    ['stored list-item HTML', storedCanvas]
  ])('extracts only verified published editorial text and discloses omitted parts (%s)', async (_form, canvasOf) => {
    const { service } = setup(url => {
      const query = new URL(url).searchParams.get('$select') || '';
      if (!query.includes('CanvasContent1')) return okay(page());
      return okay({ ...page(), OData__UIVersionString: '3.0', File: { Level: 1, MinorVersion: 0, CheckOutType: 2, UIVersionLabel: '3.0' },
        CanvasContent1: canvasOf([{ controlType: 4, innerHTML: '<p>Published &amp; exact.</p>' }, { controlType: 3, webPartData: { title: 'News rollup' } }]) });
    });
    const result = await service.read({ ...request, mode: 'page', pageItemId: 42 });
    expect(result.sources[0].text).toBe('Page 42\n\nPublished & exact.');
    expect(result.sources[0].omittedParts).toEqual(['Web part “News rollup”']);
    expect(result.coverage.completedPages).toBe(1);
  });

  it('keeps at most 40,000 characters of page text and says how much was left out', async () => {
    const { service } = setup(url => {
      const query = new URL(url).searchParams.get('$select') || '';
      if (!query.includes('CanvasContent1')) return okay(page());
      return okay({ ...page(), OData__UIVersionString: '3.0', File: { Level: 1, MinorVersion: 0, CheckOutType: 2, UIVersionLabel: '3.0' },
        CanvasContent1: JSON.stringify([{ controlType: 4, innerHTML: '<p>' + 'Long policy text. '.repeat(3000).trim() + '</p>' }]) });
    });
    const result = await service.read({ ...request, mode: 'page', pageItemId: 42 });
    expect(result.sources[0].text).toHaveLength(40000);
    expect(result.sources[0].omittedParts).toEqual(['Text after the first 40,000 characters (54,008 in total)']);
  });

  it('reads a saved draft and labels it, so a publisher can check before publishing', async () => {
    const { service } = setup(url => (new URL(url).searchParams.get('$select') || '').includes('CanvasContent1')
      ? okay({ ...page(), Modified: '2026-10-01T16:20:00Z', OData__UIVersionString: '3.1', File: { Level: 2, MinorVersion: 1, CheckOutType: 2, UIVersionLabel: '3.1' }, CanvasContent1: JSON.stringify([{ controlType: 4, innerHTML: '<p>Draft text</p>' }]) }) : okay(page()));
    const result = await service.read({ ...request, mode: 'page', pageItemId: 42 });
    expect(result.sources[0].page).toMatchObject({ version: '3.1', state: 'draft', modified: '2026-10-01T16:20:00Z' });
    expect(result.sources[0].text).toBe('Page 42\n\nDraft text');
  });

  it('reads a never-published first draft', async () => {
    const { service } = setup(url => (new URL(url).searchParams.get('$select') || '').includes('CanvasContent1')
      ? okay({ ...page(), OData__UIVersionString: '0.1', File: { Level: 2, MinorVersion: 1, CheckOutType: 2, UIVersionLabel: '0.1' }, CanvasContent1: JSON.stringify([{ controlType: 4, innerHTML: '<p>First draft</p>' }]) }) : okay(page()));
    const result = await service.read({ ...request, mode: 'page', pageItemId: 42 });
    expect(result.sources[0].page).toMatchObject({ version: '0.1', state: 'draft' });
  });

  it('reads comparison B through shared pacing without replacing the active review A', async () => {
    const { service } = setup(url => {
      const id = url.includes('items(43)') ? 43 : 42;
      return okay({ ...page(id), OData__UIVersionString: '3.1',
        File: { Level: 2, MinorVersion: 1, CheckOutType: 2, UIVersionLabel: '3.1' },
        CanvasContent1: JSON.stringify([{ id: 'body', controlType: 4, innerHTML: '<p>Saved page ' + id + '</p>' }]) });
    });
    await service.read({ ...request, mode: 'page', pageItemId: 42 });
    const original = service.snapshot().sources;
    const comparison = createComparisonServices({ tenantUrl: SITE, document, get: (url, signal) => service.readDiscovery(url, signal) });
    const b = await comparison.read({ url: SITE, title: 'HR' },
      { pageItemId: 43, title: 'Page 43', pageKind: 'news', sourceUrl: SITE + '/SitePages/page-43.aspx' }, new AbortController().signal);
    expect(b.pageItemId).toBe(43); expect(b.page?.state).toBe('draft'); expect(b.text).toContain('Saved page 43');
    expect(service.snapshot().sources).toEqual(original);
    expect(service.snapshot().sources[0].pageItemId).toBe(42);
  });

  it('rejects a checked-out page and text that does not belong to its version label', async () => {
    const checkedOut = setup(url => (new URL(url).searchParams.get('$select') || '').includes('CanvasContent1')
      ? okay({ ...page(), OData__UIVersionString: '3.2', File: { Level: 255, MinorVersion: 2, CheckOutType: 0, UIVersionLabel: '3.2' }, CanvasContent1: 'Working copy' }) : okay(page()));
    expect((await checkedOut.service.read({ ...request, mode: 'page', pageItemId: 42 })).sources).toHaveLength(0);
    expect(checkedOut.service.snapshot().failures[0].code).toBe('PAGE_CHECKED_OUT');
    const mismatch = setup(url => (new URL(url).searchParams.get('$select') || '').includes('CanvasContent1')
      ? okay({ ...page(), OData__UIVersionString: '3.0', File: { Level: 2, MinorVersion: 1, CheckOutType: 2, UIVersionLabel: '3.1' }, CanvasContent1: 'Older text' }) : okay(page()));
    const result = await mismatch.service.read({ ...request, mode: 'page', pageItemId: 42 });
    expect(result.sources).toHaveLength(0);
    expect(mismatch.service.snapshot().failures[0].code).toBe('PAGE_VERSION_UNAVAILABLE');
    expect(result.coverage.completedPages).toBe(0);
  });

  it('uses the title from the same verified published response as the editorial text', async () => {
    const { service } = setup(url => (new URL(url).searchParams.get('$select') || '').includes('CanvasContent1')
      ? okay({ ...page(), Title: 'Newly published title', OData__UIVersionString: '4.0',
        File: { Level: 1, MinorVersion: 0, CheckOutType: 2, UIVersionLabel: '4.0' },
        CanvasContent1: JSON.stringify([{ controlType: 4, innerHTML: '<p>Newly published text.</p>' }]) }) : okay(page()));
    const result = await service.read({ ...request, mode: 'page', pageItemId: 42 });
    expect(result.sources[0].pageTitle).toBe('Newly published title');
    expect(result.sources[0].text).toBe('Newly published title\n\nNewly published text.');
    expect(service.snapshot().pages[0].title).toBe('Newly published title');
  });

  it('rejects an editorial response belonging to another page despite a valid published version', async () => {
    const { service } = setup(url => (new URL(url).searchParams.get('$select') || '').includes('CanvasContent1')
      ? okay({ ...page(41), OData__UIVersionString: '3.0', File: { Level: 1, MinorVersion: 0, CheckOutType: 2, UIVersionLabel: '3.0' },
        CanvasContent1: JSON.stringify([{ controlType: 4, innerHTML: '<p>Other page.</p>' }]) }) : okay(page()));
    const result = await service.read({ ...request, mode: 'page', pageItemId: 42 });
    expect(result.sources).toHaveLength(0);
    expect(service.snapshot().failures[0].code).toBe('SHAREPOINT_PAGE_SELECTION_MISMATCH');
  });
});

describe('SharePoint normalization and URL boundaries', () => {
  it('accepts only an explicit HTTPS same-origin site URL', () => {
    expect(validateSharePointSiteUrl(`${SITE}/`, SITE)).toBe(SITE);
    for (const invalid of ['https://evil.example/sites/hr', `${SITE}?x=1`, `${SITE}#x`, 'https://user@contoso.sharepoint.com/sites/hr',
      'https://contoso.sharepoint.com:444/sites/hr', `${SITE}/_api/web`, `${SITE}/SitePages/a.aspx`, 'http://contoso.sharepoint.com/sites/hr']) {
      expect(() => validateSharePointSiteUrl(invalid, SITE)).toThrow();
    }
    expect(() => validateSharePointSiteUrl(SITE, '')).toThrow('SHAREPOINT_TENANT_SCOPE_UNAVAILABLE');
  });
  it('rejects continuation origin/path/filter changes', () => {
    const current = `${SITE}/_api/web/lists(guid'${LIST}')/items?$filter=FSObjType eq 0&$orderby=Id desc&$top=25`;
    expect(new URL(sharePointContinuation(nextLink(current, '1'), current, SITE)).searchParams.get('$skiptoken')).toBe('1');
    expect(() => sharePointContinuation('https://evil.example/_api/items', current, SITE)).toThrow('SHAREPOINT_CONTINUATION_OUT_OF_SCOPE');
    expect(() => sharePointContinuation(`${SITE}/_api/web/other`, current, SITE)).toThrow('SHAREPOINT_CONTINUATION_OUT_OF_SCOPE');
    expect(() => sharePointContinuation(current.replace('Id desc', 'Id asc'), current, SITE)).toThrow('SHAREPOINT_CONTINUATION_QUERY_CHANGED');
  });
  it('rejects page source URLs with credentials, query strings or fragments', () => {
    expect(validateSharePointPageUrl('/sites/hr/SitePages/a.aspx', SITE)).toBe(`${SITE}/SitePages/a.aspx`);
    for (const fileRef of [`${SITE}/SitePages/a.aspx?x=1`, `${SITE}/SitePages/a.aspx#fragment`,
      'https://user@contoso.sharepoint.com/sites/hr/SitePages/a.aspx',
      'https://user:password@contoso.sharepoint.com/sites/hr/SitePages/a.aspx']) {
      expect(() => validateSharePointPageUrl(fileRef, SITE)).toThrow('SHAREPOINT_PAGE_URL_OUT_OF_SCOPE');
    }
  });
  it('normalizes original HTML and mentions through one inert text conversion', () => {
    expect(sharePointText('<p>A &amp; B</p><script>doNotRun()</script><p>C<br>D</p>', document)).toBe('A & B\nC\nD');
    // A table: one line for each row, and the cells stay separate words.
    expect(sharePointText('<table><tbody><tr><th>Floor</th><th>Date</th></tr><tr><td>Floor 2</td><td><p>3 May</p></td></tr></tbody></table>', document)).toBe('Floor Date\nFloor 2 3 May');
    expect(sharePointCommentText({ text: 'Hello @mention{0}', mentions: [{ name: 'Alex' }] }, document)).toBe('Hello @Alex');
    expect(sharePointEditorialText('<div data-sp-rte=""><p>Editorial.</p></div><div data-sp-webpart=""></div>', document))
      .toEqual({ text: 'Editorial.', omittedParts: ['Dynamic or custom web part 1'] });
    expect(sharePointEditorialText(JSON.stringify([{ controlType: 4, innerHTML: '<p>Editorial.</p><img src="https://example.invalid/image.png">' }]), document))
      .toEqual({ text: 'Editorial.', omittedParts: ['Embedded media 1 in text control 1'] });
    expect(() => sharePointEditorialText('<div>Unrecognized canvas format</div>', document)).toThrow('PAGE_CANVAS_FORMAT_UNSUPPORTED');
  });
});

// Every canvas test runs on both forms: the page API's JSON array and the HTML a Site Pages list item stores.
describe.each([
  ['page API JSON', (controls: object[]): string => JSON.stringify(controls)],
  ['stored list-item HTML', storedCanvas]
])('Page structure from the canvas (%s)', (_form, canvasOf) => {
  const at = (layoutIndex: number, zoneIndex: number, sectionIndex: number, controlIndex: number): object => ({ layoutIndex, zoneIndex, sectionIndex, controlIndex, sectionFactor: 6 });
  it('orders sections, columns and controls visually and reports accessibility basics of text blocks', () => {
    const canvas = canvasOf([
      { controlType: 4, position: at(1, 2, 1, 1), innerHTML: '<h4>Costs</h4><p>Claims are paid monthly. <a href="/a">click here</a> or <a href="/b">click here</a>.</p>' },
      { controlType: 4, position: at(1, 1, 1, 1), innerHTML: '<h2>Overview</h2><p>See <a href="https://contoso.com/x">https://contoso.com/x</a>. <img src="x.png"></p><h2> </h2><h1>Big</h1>' },
      { controlType: 3, position: at(1, 1, 2, 1), webPartData: { title: 'Quick links' } },
      { controlType: 0, position: at(1, 1.5, 2, 1) },
      { controlType: 14, position: at(1, 3, 1, 1) },
      { controlType: 3, position: at(2, 1, 1, 1) },
      { controlType: 4, position: at(1, 3, 1, 2), innerHTML: '<p>Image with text <img src="y.png" alt=""></p>', zoneGroupMetadata: { type: 1, displayName: 'More' } }
    ]);
    const structure = sharePointPageStructure(canvas, document)!;
    // The section background (control type 14) is not a web part.
    expect(structure).toMatchObject({ textBlocks: 3, webParts: 2 });
    expect(structure.sections.map(section => section.vertical)).toEqual([false, false, false, false, true]);
    expect(structure.sections[0].columns.map(column => column.map(item => item.label))).toEqual([['Overview'], ['Quick links']]);
    // A placeholder keeps its empty column visible instead of disappearing.
    expect(structure.sections[1].columns).toEqual([[], []]);
    expect(structure.sections[2].columns[0][0]).toMatchObject({ kind: 'text', label: 'Costs' });
    expect(structure.sections[4].columns[0][0]).toEqual({ kind: 'webPart', label: '', id: 'b5' });
    expect(structure.issues.map(issue => issue.kind)).toEqual(['headingEmpty', 'headingTitleLevel', 'linkUrl', 'imageAlt', 'headingSkip', 'linkText', 'linkText', 'linkAmbiguous']);
    expect(structure.issues.find(issue => issue.kind === 'headingSkip')).toMatchObject({ text: 'Costs', from: 1, to: 4 });
    // Decorative images with an empty alt attribute are correct and not reported.
    expect(structure.issues.filter(issue => issue.kind === 'imageAlt')).toHaveLength(1);
  });

  it('reads the text in page order, and every text block points at its own words in that text', () => {
    const canvas = canvasOf([
      { controlType: 4, id: 'second', position: at(1, 2, 1, 1), innerHTML: '<h2>Parking</h2><p>Permits from the front desk.</p>' },
      { controlType: 4, id: 'first', position: { ...at(1, 1, 1, 1), sectionFactor: 8 }, innerHTML: '<p>The move starts in March.</p>' },
      { controlType: 3, id: 'links', position: { ...at(1, 1, 2, 1), sectionFactor: 4 }, webPartData: { title: 'Quick links' } }
    ]);
    const content = sharePointPageContent(canvas, document, 'Office move FAQ');
    expect(content.text).toBe('Office move FAQ\n\nThe move starts in March.\n\nParking\nPermits from the front desk.');
    const blocks = content.structure!.sections.map(section => section.columns.map(column => column.map(item => item)));
    const first = blocks[0][0][0];
    const second = blocks[1][0][0];
    expect(first).toMatchObject({ id: 'first', kind: 'text' });
    expect(content.text.slice(first.start, first.end)).toBe('The move starts in March.');
    expect(content.text.slice(second.start, second.end)).toBe('Parking\nPermits from the front desk.');
    expect(blocks[0][1][0]).toEqual({ kind: 'webPart', label: 'Quick links', id: 'links' });
    expect(content.structure!.sections[0].factors).toEqual([8, 4]);
    expect(content.structure!.sections[1].factors).toBeUndefined();
    expect(content.omittedParts).toEqual(['Web part “Quick links”']);
  });

  it('reports tables without a header row and an Image web part whose alternative text is empty', () => {
    const image = (altText: unknown): object => ({ controlType: 3, webPartData: { id: 'd1d91016-032f-456d-98a4-721247c305e8', title: 'Image', properties: altText === undefined ? {} : { altText } } });
    const canvas = canvasOf([
      { controlType: 4, innerHTML: '<table><tbody><tr><td>Floor</td><td>Date</td></tr></tbody></table>' },
      { controlType: 4, innerHTML: '<table><thead><tr><th>Floor</th></tr></thead><tbody><tr><td>2</td></tr></tbody></table>' },
      image(''), image('Floor plan of level 2'), image(undefined),
      // A header row of ordinary cells names no columns.
      { controlType: 4, innerHTML: '<table><thead><tr><td>Name</td></tr></thead><tbody><tr><td>Ana</td></tr></tbody></table>' }
    ]);
    const structure = sharePointPageStructure(canvas, document)!;
    expect(structure.issues.map(issue => issue.kind)).toEqual(['tableHeader', 'imageWebPartAlt', 'tableHeader']);
    expect(structure.issues[1]).toMatchObject({ where: 'Image', blockId: 'b2' });
  });

  it('suggests layout changes: a long block without heading, a long paragraph, empty space and many web parts of one kind', () => {
    const words = (count: number): string => Array.from({ length: count }, (_v, index) => 'word' + index).join(' ');
    const canvas = canvasOf([
      { controlType: 4, id: 'long', position: at(1, 1, 1, 1), innerHTML: `<p>${words(140)}</p><p>${words(130)}</p>` },
      { controlType: 4, id: 'fine', position: at(1, 2, 1, 1), innerHTML: `<h2>Title</h2><p>${words(260)}</p>` },
      { controlType: 0, position: at(1, 3, 1, 1) },
      { controlType: 4, id: 'half', position: at(1, 4, 1, 1), innerHTML: '<p>Left.</p>' }, { controlType: 0, position: at(1, 4, 2, 1) },
      ...Array.from({ length: 4 }, (_v, index) => ({ controlType: 3, id: 'q' + index, position: at(1, 5, 1, index + 1), webPartData: { title: 'Quick links' } })),
      ...Array.from({ length: 5 }, (_v, index) => ({ controlType: 3, id: 'd' + index, position: at(1, 6, 1, index + 1), webPartData: { title: 'Divider' } }))
    ]);
    const layout = sharePointPageStructure(canvas, document)!.layout!;
    expect(layout.map(item => item.kind)).toEqual(['longBlock', 'longParagraph', 'longParagraph', 'longParagraph', 'emptySection', 'emptyColumn', 'repeatedWebParts']);
    expect(layout[0]).toMatchObject({ blockId: 'long', words: 270 });
    expect(layout.find(item => item.kind === 'emptyColumn')).toMatchObject({ section: 4, count: 1 });
    expect(layout.find(item => item.kind === 'repeatedWebParts')).toMatchObject({ where: 'Quick links', count: 4 });
  });

  it('reports a Hero tile image with empty alternative text and a link without a name, never a missing property', () => {
    const hero = (alternateText?: string, image: boolean = true): object => ({ controlType: 3, webPartData: { id: 'c4bd7b2f-7b6e-4599-8485-16504575f590', title: 'Hero',
      properties: { content: [{ ...(alternateText === undefined ? {} : { alternateText }), ...(image ? { image: { url: '/sites/a/SiteAssets/x.png' } } : {}) }] } } });
    const flattened = { controlType: 3, webPartData: { id: 'c4bd7b2f-7b6e-4599-8485-16504575f590', title: 'Hero', properties: { content: [{}] },
      serverProcessedContent: { searchablePlainTexts: { 'content[0].alternateText': '' }, imageSources: { 'content[0].image.url': '/x.png' } } } };
    const canvas = canvasOf([hero(''), hero('Floor plan'), hero(undefined), hero('', false), flattened,
      { controlType: 4, innerHTML: '<p><a href="/x"></a> <a href="/y" aria-label="Map"></a> <a href="/z"><img src="m.png" alt="Map"></a> <a href="/t" title="Plan"></a> <a name="top"></a></p>' }]);
    expect(sharePointPageStructure(canvas, document)!.issues.map(issue => issue.kind)).toEqual(['heroImageAlt', 'heroImageAlt', 'linkEmpty']);
  });

  it('counts each Hero tile, resolves aria-labelledby, excludes repeated Image parts by id, and counts a list item\'s own words', () => {
    const words = (count: number): string => Array.from({ length: count }, (_v, index) => 'w' + index).join(' ');
    const tile = { alternateText: '', image: { url: '/x.png' } };
    const canvas = canvasOf([
      { controlType: 3, webPartData: { id: 'c4bd7b2f-7b6e-4599-8485-16504575f590', title: 'Hero', properties: { content: [tile, { alternateText: 'Map', image: { url: '/y.png' } }, tile] } } },
      { controlType: 4, innerHTML: '<p><a href="/a" aria-labelledby="missing"></a> <a href="/b" aria-labelledby="label"></a> <span id="label">Floor plan</span></p>' },
      ...Array.from({ length: 4 }, () => ({ controlType: 3, webPartData: { id: 'd1d91016-032f-456d-98a4-721247c305e8', title: 'Photo' } })),
      { controlType: 4, innerHTML: `<ul><li>${words(130)}<ul><li>Short.</li></ul></li></ul>` }
    ]);
    const structure = sharePointPageStructure(canvas, document)!;
    expect(structure.issues.map(issue => [issue.kind, issue.text])).toEqual([['heroImageAlt', '1'], ['heroImageAlt', '3'], ['linkEmpty', undefined]]);
    expect(structure.layout!.map(item => [item.kind, item.words])).toEqual([['longParagraph', 130]]);
  });

  it('reads a news post\'s description and banner image in an optional read', async () => {
    const { service, calls } = setup(url => {
      const query = new URL(url).searchParams.get('$select') || '';
      if (query === 'Id,OData__UIVersionString,Description,BannerImageUrl,LayoutWebpartsContent') return okay({ Id: 42, OData__UIVersionString: '2.0', Description: '', BannerImageUrl: { Description: '', Url: 'https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png?width=800' } });
      if (!query.includes('CanvasContent1')) return okay(page());
      if (new URL(url).pathname.endsWith('/items')) return rows([]);
      return okay({ ...page(), OData__UIVersionString: '2.0', File: { Level: 1, MinorVersion: 0, CheckOutType: 2, UIVersionLabel: '2.0' },
        CanvasContent1: canvasOf([{ controlType: 4, innerHTML: '<p>News text.</p>' }]) });
    });
    const result = await service.read({ ...request, mode: 'page', pageItemId: 42 });
    expect(result.sources[0].page?.news).toEqual({ description: false, banner: false });
    expect(calls.some(url => (new URL(url).searchParams.get('$select') || '') === 'Id,OData__UIVersionString,Description,BannerImageUrl,LayoutWebpartsContent')).toBe(true);
    const failing = setup(url => {
      const query = new URL(url).searchParams.get('$select') || '';
      if (query === 'Id,OData__UIVersionString,Description,BannerImageUrl,LayoutWebpartsContent') return { status: 400, body: undefined };
      if (!query.includes('CanvasContent1')) return okay(page());
      if (new URL(url).pathname.endsWith('/items')) return rows([]);
      return okay({ ...page(), OData__UIVersionString: '2.0', File: { Level: 1, MinorVersion: 0, CheckOutType: 2, UIVersionLabel: '2.0' },
        CanvasContent1: canvasOf([{ controlType: 4, innerHTML: '<p>News text.</p>' }]) });
    });
    const read = await failing.service.read({ ...request, mode: 'page', pageItemId: 42 });
    expect(read.sources).toHaveLength(1);
    expect(read.sources[0].page?.news).toBeUndefined();
    expect(failing.service.snapshot().failures).toEqual([]);
  });

  it('counts a heading block of up to 12 words just above a long block as its heading', () => {
    const words = (count: number): string => Array.from({ length: count }, (_v, index) => 'w' + index).join(' ');
    const long = (id: string, heading: number): object[] => [
      { controlType: 4, id: id + '-h', position: at(1, 1, 1, 1), innerHTML: `<h2>${words(heading)}</h2>` },
      { controlType: 4, id, position: at(1, 1, 1, 2), innerHTML: `<p>${words(251)}</p>` }];
    expect(sharePointPageStructure(canvasOf(long('short', 12)), document)!.layout!.filter(item => item.kind === 'longBlock')).toEqual([]);
    expect(sharePointPageStructure(canvasOf(long('long', 13)), document)!.layout!.filter(item => item.kind === 'longBlock')).toHaveLength(1);
  });

  it('reports a link text that leads to different places once', () => {
    const canvas = canvasOf([{ controlType: 4, innerHTML: '<p><a href="/a">Policy</a> <a href="/b">Policy</a> <a href="/c">Policy</a></p>' }]);
    expect(sharePointPageStructure(canvas, document)!.issues.filter(issue => issue.kind === 'linkAmbiguous')).toHaveLength(1);
  });

  it('gives up quietly on a legacy, broken or unexpected canvas', () => {
    expect(sharePointPageStructure('<div data-sp-rte="">Old page</div>', document)).toBeUndefined();
    expect(sharePointPageStructure('[{"controlType":4,', document)).toBeUndefined();
    expect(sharePointPageStructure(42, document)).toBeUndefined();
    expect(sharePointPageStructure(canvasOf([{ controlType: 4, position: 'odd', innerHTML: '<p>Text</p>' }]), document)).toMatchObject({ textBlocks: 1 });
  });

  it('attaches the structure to a page read, without changing its text', async () => {
    const { service } = setup(url => (new URL(url).searchParams.get('$select') || '').includes('CanvasContent1')
      ? okay({ ...page(), OData__UIVersionString: '2.0', File: { Level: 1, MinorVersion: 0, CheckOutType: 2, UIVersionLabel: '2.0' },
        CanvasContent1: canvasOf([{ controlType: 4, innerHTML: '<h3>Skipped</h3><p>Body text.</p>' }]) }) : okay(page()));
    const result = await service.read({ ...request, mode: 'page', pageItemId: 42 });
    expect(result.sources[0].text).toBe('Page 42\n\nSkipped\nBody text.');
    expect(result.sources[0].page?.structure?.issues).toEqual([{ kind: 'headingSkip', where: 'Skipped Body text.', text: 'Skipped', from: 1, to: 3, blockId: 'b0', at: 9 }]);
  });
});

describe('Page structure from pages as SharePoint stores them', () => {
  it('reads text blocks, sections and an empty column from a stored page, and skips the page settings', () => {
    const content = sharePointPageContent(storedPageWithEmptyColumn, document, 'Stored');
    expect(content.text).toBe('Stored\n\ntest\n\nTest');
    const structure = content.structure!;
    expect(structure).toMatchObject({ textBlocks: 2, webParts: 0, words: 2, issues: [] });
    expect(structure.sections.map(section => section.columns.map(column => column.map(item => item.label)))).toEqual([[['test']], [['Test'], []]]);
    expect(structure.sections[1].factors).toEqual([6, 6]);
    expect(structure.layout).toEqual([{ kind: 'emptyColumn', where: '', section: 2, count: 1 }]);
  });

  it('reads a web part, and puts its stored texts and HTML back where the page API has them', () => {
    const content = sharePointPageContent(storedPageWithWebPart, document, 'Stored');
    expect(content.structure).toMatchObject({ textBlocks: 0, webParts: 1 });
    expect(content.structure!.sections[0].columns[0]).toEqual([{ kind: 'webPart', label: 'doctor-placeholder', id: 'f3e0587d-77b6-4bc9-b865-2eec74713c2d' }]);
    expect(content.omittedParts).toEqual(['Web part “doctor-placeholder”']);
    const processed = (canvasControls(storedPageWithWebPart, document)![0] as { webPartData: { serverProcessedContent: Record<string, Record<string, string>> } })
      .webPartData.serverProcessedContent;
    expect(processed.searchablePlainTexts.code).toContain('List of the current shared environments.');
    expect(processed.htmlStrings.html).toContain('<h3 id="summary">Summary</h3>');
  });

  it('does not count a section background as a web part', () => {
    const content = sharePointPageContent(storedPageWithSectionBackground, document, 'Home');
    expect(content.text).toBe('Home\n\ntest');
    expect(content.omittedParts).toEqual([]);
    expect(content.structure).toMatchObject({ textBlocks: 1, webParts: 0, layout: [{ kind: 'emptyColumn', section: 1, count: 1 }] });
    expect(content.structure!.sections).toHaveLength(1);
  });

  it('keeps every text block when a control cannot be read, and leaves the layout unchecked', () => {
    const rte = (text: string): string => `<div data-sp-rte=""><p>${text}</p></div>`;
    const settings = '<div data-sp-canvascontrol="" data-sp-controldata="&#123;&quot;controlType&quot;&#58;0,&quot;pageSettingsSlice&quot;&#58;&#123;&#125;&#125;"></div>';
    for (const canvas of [
      `<div><div data-sp-canvascontrol="" data-sp-controldata="broken">${rte('Only article text')}</div></div>`,
      `<div><div data-sp-canvascontrol="" data-sp-controldata="&#123;&#125;">${rte('Only article text')}</div></div>`,
      `<div><div data-sp-canvascontrol="">${rte('Only article text')}</div></div>`,
      `<div>${rte('Only article text')}${settings}</div>`
    ]) {
      const content = sharePointPageContent(canvas, document, 'Page');
      expect(content.text).toBe('Page\n\nOnly article text');
      expect(content.structure).toBeUndefined();
    }
  });

  it('gives each control its own parts when controls are nested', () => {
    const text = (data: string, inner: string): string => `<div data-sp-canvascontrol="" data-sp-controldata="${data}">${inner}</div>`;
    const canvas = '<div>' + text('&#123;&quot;controlType&quot;&#58;4,&quot;innerHTML&quot;&#58;&quot;&lt;p&gt;Outer&lt;/p&gt;&quot;&#125;',
      text('&#123;&quot;controlType&quot;&#58;4&#125;', '<div data-sp-rte=""><p>Inner</p></div>')) + '</div>';
    const content = sharePointPageContent(canvas, document, 'Page');
    expect(content.text).toBe('Page\n\nOuter\n\nInner');
    expect(content.structure).toMatchObject({ textBlocks: 2 });
    // Rich text kept in a web part's properties is the web part's own, not text outside a text block.
    const part = storedCanvas([{ controlType: 3, webPartData: { title: 'Notes', serverProcessedContent: { htmlStrings: { body: '<div data-sp-rte=""><p>Inside</p></div>' } } } }]);
    expect(sharePointPageContent(part, document, 'Page').structure).toMatchObject({ webParts: 1, textBlocks: 0 });
  });
});
