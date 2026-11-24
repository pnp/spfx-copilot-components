import { extractMedia, headerMedia } from '../comparison/mediaParsing';
import type {
  ISharePointContentService, ReviewCoverage, ReviewSource, ScanCheckpoint, ScanRequest, ScanState
} from '../domain/contracts';
import { z } from 'zod';
import { scanRequestSchema, sourceSchema, maxSourceTextChars, textCutNote } from '../domain/sourceSchema';
import { utf8Bytes } from '../domain/policy';
import {
  sharePointCollection, sharePointCommentText, sharePointContinuation, sharePointPageContent,
  sharePointEntity, sharePointRecord, validateSharePointPageUrl, validateSharePointSiteUrl
} from './sharePointParsing';

export interface ISharePointReadTransport {
  /** Sends exactly one GET request. The host adapter must turn off its own transport retries. */
  get(url: string, signal?: AbortSignal): Promise<{ status: number; body: unknown; retryAfter?: string }>;
}
export interface ISharePointPageMetadata {
  pageItemId: number;
  title: string;
  pageKind: 'page' | 'news';
  sourceUrl: string;
}
export interface ISharePointReadFailure {
  url: string;
  status?: number;
  code: string;
  pageItemId?: number;
}
export interface ISharePointLiveSnapshot {
  sources: ReviewSource[];
  coverage: ReviewCoverage;
  state: ScanState;
  canContinue: boolean;
  cooldownUntil?: number;
  failures: ISharePointReadFailure[];
  pages: ISharePointPageMetadata[];
  checkpoint?: ScanCheckpoint;
}
interface Limits {
  stepPages: number;
  stepOperations: number;
  sessionPages: number;
  sessionOperations: number;
}
export interface ISharePointContentOptions {
  tenantUrl: string;
  transport: ISharePointReadTransport;
  targetDocument?: Document;
  onProgress?: (snapshot: ISharePointLiveSnapshot) => void;
  /** Clock and wait function, injected by tests. The defaults are Date.now and a timer. */
  now?: () => number;
  wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  /** Lower limits for tests. Each value is clamped between 1 and the default limit. */
  limits?: Partial<Limits>;
}

interface Page extends ISharePointPageMetadata {
  createdAt: string;
}
/** `newsFacts` is an optional read that adds the news checks. When it fails, the page read still completes. */
type Operation = {
  kind: 'library' | 'contentTypes' | 'metadata' | 'admit' | 'comments' | 'replies' | 'page' | 'newsFacts';
  url: string;
  page?: Page;
  parentId?: string;
  parentText?: string;
};
type TransportResponse = Awaited<ReturnType<ISharePointReadTransport['get']>>;
interface Session {
  request: ScanRequest;
  runId: string;
  windowStart: number;
  windowEnd: number;
  listId: string;
  upperItemId?: number;
  state: ScanState;
  queue: Operation[];
  queued: Set<string>;
  seenUrls: Set<string>;
  admitted: Set<number>;
  completed: Set<number>;
  failedPages: Set<number>;
  knownPages: Map<number, Page>;
  sources: Map<string, ReviewSource>;
  seenSources: Set<string>;
  operations: number;
  stepOperations: number;
  stepPages: Set<number>;
  failures: ISharePointReadFailure[];
}

const PAGE_CONTENT_TYPE = '0x0101009d1cb255da76424f860d91f20e6c4118';
const DEFAULT_LIMITS: Limits = { stepPages: 25, stepOperations: 50, sessionPages: 200, sessionOperations: 400 };
const SELECT_PAGE = 'Id,Title,FileRef,Created,PromotedState,FSObjType,ContentTypeId';
const DAY_MS = 86400000;
/** The shortest time between the end of one request and the start of the next. */
const REQUEST_GAP_MS = 250;
const MAX_SESSION_BYTES = 2 * 1024 * 1024;
/** The endpoints a restored checkpoint may read, as paths below the site. */
const CHECKPOINT_ENDPOINT =
  /^\/_api\/web\/lists(?:\(guid'[0-9a-f-]{36}'\)(?:\/contenttypes|\/items(?:\(\d+\)(?:\/comments(?:\(\d+\)\/replies)?)?)?)?)?$/i;
const pageSchema = z.object({
  pageItemId: z.number().int().positive(),
  title: z.string().max(1024),
  pageKind: z.enum(['page', 'news']),
  sourceUrl: z.string().max(4096),
  createdAt: z.string().max(64)
}).strict();
const operationSchema = z.object({
  kind: z.enum(['library', 'contentTypes', 'metadata', 'admit', 'comments', 'replies', 'page', 'newsFacts']),
  url: z.string().max(8192),
  page: pageSchema.optional(),
  parentId: z.string().regex(/^\d+$/).optional(),
  parentText: z.string().max(40000).optional()
}).strict();
const failureSchema = z.object({
  url: z.string().max(8192),
  status: z.number().optional(),
  code: z.string().max(512),
  pageItemId: z.number().optional()
}).strict();
const resumeSchema = z.object({
  request: scanRequestSchema,
  runId: z.string().max(128),
  windowStart: z.number().finite(),
  windowEnd: z.number().finite(),
  listId: z.string().max(128),
  upperItemId: z.number().int().positive().optional(),
  state: z.enum(['idle', 'paused', 'throttled', 'capped', 'completed', 'cancelled', 'failed']),
  queue: z.array(operationSchema).max(25000),
  queued: z.array(z.string().max(8192)).max(25000),
  seenUrls: z.array(z.string().max(8192)).max(400),
  admitted: z.array(z.number().int().positive()).max(200),
  completed: z.array(z.number().int().positive()).max(200),
  failedPages: z.array(z.number().int().positive()).max(200),
  knownPages: z.array(pageSchema).max(225),
  sources: z.array(sourceSchema).max(1049),
  seenSources: z.array(z.string().max(2048)).max(25000),
  operations: z.number().int().min(0).max(400),
  failures: z.array(failureSchema).max(400),
  cooldownUntil: z.number().finite(),
  fallbackCooldown: z.number().min(0).max(300000),
  lastCompletion: z.number().finite()
}).strict();
const emptyCoverage = (): ReviewCoverage => ({
  completedPages: 0, partialPages: 0, failedSources: 0, retrieved: 0, matching: 0, displayed: 0,
  analyzed: 0, operationsAttempted: 0, httpEnvelopes: 0, isPartial: true
});

/** The checkpoint records every read other than a comment, reply or page read as a metadata read. */
function checkpointKind(kind: Operation['kind']): 'replies' | 'comments' | 'page' | 'metadata' {
  if (kind === 'replies' || kind === 'comments' || kind === 'page') return kind;
  return 'metadata';
}

function waitFor(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('ABORTED'));
      return;
    }
    // eslint-disable-next-line prefer-const -- The abort handler and the timer callback refer to each other.
    let timer: ReturnType<typeof setTimeout>;
    const abort = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(new Error('ABORTED'));
    };
    timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, milliseconds);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

/** Cut text to at most `max` UTF-16 units without splitting a surrogate pair. */
function capText(text: string, max: number): string {
  if (text.length <= max) return text;
  const end = /[\uD800-\uDBFF]/.test(text[max - 1]) ? max - 1 : max;
  return text.slice(0, end);
}

/**
 * Reads Site Pages and their comments through the SharePoint REST API: GET requests only, one at a
 * time, within the step and session limits. Each request is sent once; a 429 or 503 response starts
 * a cooldown. The comments endpoint is in beta. Endpoint reference: PnP `comments/types.ts` and the
 * SharePoint list and file REST documentation.
 */
export class SharePointContentService implements ISharePointContentService {
  private _session?: Session;
  private _running?: Promise<void>;
  private _discoveryRunning?: Promise<TransportResponse>;
  private _abort?: AbortController;
  private _generation: number = 0;
  private _readSequence: number = 0;
  private _cooldownUntil: number = 0;
  private _fallbackCooldown: number = 30000;
  private _lastCompletion: number = Number.NEGATIVE_INFINITY;
  private readonly _listeners = new Set<() => void>();
  private readonly _limits: Limits;
  private readonly _now: () => number;
  private readonly _wait: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  private readonly _document?: Document;

  public constructor(private readonly _options: ISharePointContentOptions) {
    this._limits = { ...DEFAULT_LIMITS };
    (Object.keys(DEFAULT_LIMITS) as Array<keyof Limits>).forEach(key => {
      const configured = _options.limits?.[key];
      if (configured !== undefined) this._limits[key] = Math.max(1, Math.min(DEFAULT_LIMITS[key], Math.floor(configured)));
    });
    this._now = _options.now || Date.now;
    this._wait = _options.wait || waitFor;
    this._document = _options.targetDocument || (typeof document === 'undefined' ? undefined : document);
  }

  public subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  public snapshot(): ISharePointLiveSnapshot {
    return this._snapshot(this._session);
  }

  /** The scan state as a checkpoint string. The caller keeps it in the browser tab only. */
  public exportSession(): string | undefined {
    const state = this._session;
    if (!state) return undefined;
    if (state.state === 'running') throw new Error('SHAREPOINT_READ_IN_PROGRESS');
    const value = {
      ...state,
      queue: state.queue,
      queued: Array.from(state.queued),
      seenUrls: Array.from(state.seenUrls),
      admitted: Array.from(state.admitted),
      completed: Array.from(state.completed),
      failedPages: Array.from(state.failedPages),
      knownPages: Array.from(state.knownPages.values()),
      sources: Array.from(state.sources.values()),
      seenSources: Array.from(state.seenSources),
      cooldownUntil: this._cooldownUntil,
      fallbackCooldown: this._fallbackCooldown,
      lastCompletion: Number.isFinite(this._lastCompletion) ? this._lastCompletion : 0
    };
    const serialized = JSON.stringify(resumeSchema.strip().parse(value));
    if (utf8Bytes(serialized) > MAX_SESSION_BYTES) throw new Error('SHAREPOINT_SESSION_TOO_LARGE');
    return serialized;
  }

  public restoreSession(serialized: string): void {
    if (this._running || this._session) throw new Error('SHAREPOINT_SCAN_ALREADY_STARTED');
    if (utf8Bytes(serialized) > MAX_SESSION_BYTES) throw new Error('SHAREPOINT_SESSION_TOO_LARGE');
    const state = resumeSchema.parse(JSON.parse(serialized));
    const siteUrl = validateSharePointSiteUrl(state.request.siteUrl, this._options.tenantUrl);
    // The restored scan keeps the date window it started with. The store that holds the checkpoint
    // decides how long it is kept.
    if (state.windowEnd > this._now()) throw new Error('SHAREPOINT_SCAN_CHECKPOINT_INVALID');
    if (state.windowStart !== state.windowEnd - state.request.lookbackDays * DAY_MS) throw new Error('SHAREPOINT_SCAN_CHECKPOINT_INVALID');
    const pages = new Map(state.knownPages.map(page => [page.pageItemId, page]));
    const safeUrl = (url: string): void => {
      sharePointContinuation(url, url, siteUrl);
      const sitePath = new URL(siteUrl).pathname.replace(/\/$/, '');
      const path = decodeURIComponent(new URL(url).pathname).slice(sitePath.length);
      if (!CHECKPOINT_ENDPOINT.test(path)) throw new Error('SHAREPOINT_CHECKPOINT_ENDPOINT_REJECTED');
    };
    state.queue.forEach(op => {
      if (op.kind !== 'admit') safeUrl(op.url);
      if (op.page && JSON.stringify(pages.get(op.page.pageItemId)) !== JSON.stringify(op.page)) {
        throw new Error('SHAREPOINT_CHECKPOINT_PAGE_MISMATCH');
      }
      if (['admit', 'comments', 'replies', 'page'].indexOf(op.kind) >= 0 && !op.page) throw new Error('SHAREPOINT_CHECKPOINT_PAGE_MISSING');
    });
    state.sources.forEach(source => {
      if (source.siteUrl !== siteUrl || source.listId !== state.listId || !pages.has(source.pageItemId)) {
        throw new Error('SHAREPOINT_CHECKPOINT_SOURCE_MISMATCH');
      }
      if (source.sourceUrl) validateSharePointPageUrl(source.sourceUrl, siteUrl);
    });
    this._session = {
      ...state,
      request: { ...state.request, siteUrl },
      queued: new Set(state.queued),
      seenUrls: new Set(state.seenUrls),
      admitted: new Set(state.admitted),
      completed: new Set(state.completed),
      failedPages: new Set(state.failedPages),
      knownPages: pages,
      sources: new Map(state.sources.map(source => [source.id, source])),
      seenSources: new Set(state.seenSources),
      stepOperations: 0,
      stepPages: new Set()
    };
    this._cooldownUntil = state.cooldownUntil;
    this._fallbackCooldown = state.fallbackCooldown;
    this._lastCompletion = state.lastCompletion;
  }

  /** A picker GET. It shares the scan's pacing and cooldown and does not count toward the scan coverage. */
  public async readDiscovery(url: string, signal?: AbortSignal): Promise<TransportResponse> {
    if (this._running || this._session?.state === 'running') throw new Error('SHAREPOINT_READ_IN_PROGRESS');
    if (this._discoveryRunning) throw new Error('SHAREPOINT_DISCOVERY_IN_PROGRESS');
    if (this._now() < this._cooldownUntil) throw new Error('SHAREPOINT_THROTTLED');
    const requestUrl = new URL(url);
    const origin = new URL(this._options.tenantUrl).origin;
    if (requestUrl.protocol !== 'https:' || requestUrl.origin !== origin ||
      requestUrl.username || requestUrl.password || requestUrl.hash || !/\/_api\//i.test(requestUrl.pathname)) {
      throw new Error('SHAREPOINT_DISCOVERY_ENDPOINT_REJECTED');
    }
    const run = async (): Promise<TransportResponse> => {
      const gap = this._lastCompletion + REQUEST_GAP_MS - this._now();
      if (gap > 0) await this._wait(gap, signal);
      if (signal?.aborted) throw new Error('ABORTED');
      const response = await this._options.transport.get(url, signal);
      this._lastCompletion = this._now();
      // A cancelled request can still return 429 or 503. Its cooldown applies to the whole component.
      if (response.status === 429 || response.status === 503) {
        this._recordThrottle(response.retryAfter);
        this._notify();
      } else if (response.status >= 200 && response.status < 300) {
        this._fallbackCooldown = 30000;
      }
      return response;
    };
    const running = run();
    this._discoveryRunning = running;
    try {
      return await running;
    } finally {
      this._lastCompletion = this._now();
      if (this._discoveryRunning === running) this._discoveryRunning = undefined;
    }
  }

  private _recordThrottle(retryAfter?: string): void {
    // Retry-After holds either a number of seconds or an HTTP date.
    const secondsDelay = retryAfter && /^\d+(?:\.\d+)?$/.test(retryAfter.trim()) ? Number(retryAfter) * 1000 : undefined;
    const retryDate = retryAfter ? Date.parse(retryAfter) : Number.NaN;
    let delay = this._fallbackCooldown;
    if (secondsDelay !== undefined) delay = secondsDelay;
    else if (Number.isFinite(retryDate) && retryDate > this._now()) delay = retryDate - this._now();
    this._cooldownUntil = Math.max(this._cooldownUntil, this._now() + delay);
    this._fallbackCooldown = Math.min(this._fallbackCooldown * 2, 300000);
  }

  private _snapshot(session?: Session): ISharePointLiveSnapshot {
    if (!session) {
      return {
        sources: [], coverage: emptyCoverage(), state: 'idle', canContinue: false,
        cooldownUntil: this._cooldownUntil || undefined, failures: [], pages: []
      };
    }
    const all = Array.from(session.sources.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
    const sources = all.map(source => ({ ...source }));
    const partialPages = Array.from(session.admitted)
      .filter(id => !session.completed.has(id) && !session.failedPages.has(id)).length;
    const coverage: ReviewCoverage = {
      completedPages: session.completed.size,
      partialPages,
      failedSources: session.failures.length,
      retrieved: session.seenSources.size,
      matching: all.length,
      displayed: sources.length,
      analyzed: 0,
      operationsAttempted: session.operations,
      httpEnvelopes: session.operations,
      isPartial: session.state !== 'completed' || session.failures.length > 0
    };
    // At the page limit, a scan can still continue the reads of pages it has already admitted.
    const canContinue = session.sources.size < 1000 && session.queue.length > 0 &&
      session.state !== 'running' && session.state !== 'failed' &&
      session.operations < this._limits.sessionOperations && this._now() >= this._cooldownUntil &&
      (session.admitted.size < this._limits.sessionPages ||
        session.queue.some(op => !!op.page && session.admitted.has(op.page.pageItemId)));
    return {
      sources,
      coverage,
      state: session.state,
      canContinue,
      cooldownUntil: this._cooldownUntil || undefined,
      failures: session.failures.map(failure => ({ ...failure })),
      pages: Array.from(session.knownPages.values()).map(page => ({ ...page })),
      checkpoint: {
        runId: session.runId,
        siteUrl: session.request.siteUrl,
        listId: session.listId,
        windowStart: new Date(session.windowStart).toISOString(),
        windowEnd: new Date(session.windowEnd).toISOString(),
        upperItemId: session.upperItemId,
        metadataCursor: session.queue.find(op => op.kind === 'metadata')?.url,
        pending: session.queue.map((op, index) => ({
          id: `${index}:${op.url}`,
          pageItemId: op.page?.pageItemId,
          kind: checkpointKind(op.kind),
          cursor: op.url || undefined,
          parentCommentId: op.parentId
        })),
        processedIds: Array.from(session.seenSources),
        admittedPageIds: Array.from(session.admitted),
        cooldownUntil: this._cooldownUntil || undefined,
        state: session.state,
        coverage
      }
    };
  }

  public async read(request: ScanRequest, signal?: AbortSignal): Promise<{ sources: ReviewSource[]; coverage: ReviewCoverage }> {
    const siteUrl = validateSharePointSiteUrl(request.siteUrl, this._options.tenantUrl);
    if (!this._document) throw new Error('SHAREPOINT_TEXT_DOCUMENT_UNAVAILABLE');
    if ([7, 14, 30].indexOf(request.lookbackDays) < 0 || ['comments', 'page'].indexOf(request.mode) < 0 ||
      ['page', 'news', 'both'].indexOf(request.pageKind) < 0) {
      throw new Error('SHAREPOINT_SCAN_REQUEST_INVALID');
    }
    if (request.pageItemId !== undefined && (!Number.isSafeInteger(request.pageItemId) || request.pageItemId < 1)) {
      throw new Error('SHAREPOINT_SCAN_REQUEST_INVALID');
    }
    if (request.mode === 'page' && request.pageItemId === undefined) throw new Error('SHAREPOINT_PAGE_SELECTION_REQUIRED');
    this.stop();
    const readSequence = this._readSequence;
    if (this._running) await this._running;
    while (this._discoveryRunning) await this._discoveryRunning.catch(() => undefined);
    if (readSequence !== this._readSequence) throw new Error('SHAREPOINT_SCAN_SUPERSEDED');
    const now = this._now();
    const session: Session = {
      request: { ...request, siteUrl },
      runId: `sharepoint-${now}-${this._generation}`,
      windowStart: now - request.lookbackDays * DAY_MS,
      windowEnd: now,
      listId: '',
      state: 'idle',
      queue: [],
      queued: new Set(),
      seenUrls: new Set(),
      admitted: new Set(),
      completed: new Set(),
      failedPages: new Set(),
      knownPages: new Map(),
      sources: new Map(),
      seenSources: new Set(),
      operations: 0,
      stepOperations: 0,
      stepPages: new Set(),
      failures: []
    };
    this._session = session;
    this._enqueue(session, {
      kind: 'library',
      url: `${siteUrl}/_api/web/lists?$select=Id,BaseTemplate,RootFolder/ServerRelativeUrl&$expand=RootFolder&$filter=BaseTemplate eq 119&$top=25`
    });
    await this._startStep(session, signal);
    const { sources, coverage } = this._snapshot(session);
    return { sources, coverage };
  }

  public async continueRead(signal?: AbortSignal): Promise<{ sources: ReviewSource[]; coverage: ReviewCoverage }> {
    if (this._running) throw new Error('SHAREPOINT_READ_IN_PROGRESS');
    if (this._discoveryRunning) throw new Error('SHAREPOINT_DISCOVERY_IN_PROGRESS');
    if (!this._session) throw new Error('SHAREPOINT_SCAN_NOT_STARTED');
    const session = this._session;
    await this._startStep(session, signal);
    const { sources, coverage } = this._snapshot(session);
    return { sources, coverage };
  }

  public stop(): void {
    this._readSequence += 1;
    this._generation += 1;
    this._abort?.abort();
    if (this._session?.state === 'running') this._session.state = 'cancelled';
    this._notify();
  }

  private _notify(): void {
    this._options.onProgress?.(this.snapshot());
    this._listeners.forEach(listener => listener());
  }

  private _enqueue(session: Session, operation: Operation, front: boolean = false): void {
    const key = operation.kind === 'admit' ? `admit:${operation.page?.pageItemId}` : operation.url;
    if (session.queued.has(key)) return;
    session.queued.add(key);
    if (front) {
      session.queue.unshift(operation);
    } else {
      session.queue.push(operation);
    }
  }

  private async _startStep(session: Session, signal?: AbortSignal): Promise<void> {
    if (this._now() < this._cooldownUntil) {
      session.state = 'throttled';
      this._notify();
      return;
    }
    if (session.state === 'failed') {
      this._notify();
      return;
    }
    if (session.operations >= this._limits.sessionOperations) {
      session.state = 'capped';
      this._notify();
      return;
    }
    session.stepOperations = 0;
    session.stepPages.clear();
    session.state = 'running';
    this._abort = new AbortController();
    const controller = this._abort;
    const abort = (): void => {
      controller.abort();
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const generation = this._generation;
    this._notify();
    const running = this._drain(session, generation, controller.signal);
    this._running = running;
    try {
      await running;
    } finally {
      signal?.removeEventListener('abort', abort);
      if (this._running === running) this._running = undefined;
    }
  }

  private async _drain(session: Session, generation: number, signal: AbortSignal): Promise<void> {
    // Stop, a newer scan or the caller's signal ends this run.
    const stopped = (): boolean => signal.aborted || generation !== this._generation;
    while (session.queue.length && !stopped()) {
      if (session.sources.size >= 1000) {
        session.state = 'capped';
        break;
      }
      const operation = session.queue[0];
      if (operation.kind === 'admit') {
        const page = operation.page!;
        const sessionFull = session.admitted.size >= this._limits.sessionPages;
        if (session.stepPages.size >= this._limits.stepPages || sessionFull) {
          session.state = sessionFull ? 'capped' : 'paused';
          break;
        }
        session.queue.shift();
        session.admitted.add(page.pageItemId);
        session.stepPages.add(page.pageItemId);
        // A Comments scan of one page kind completes a page of the other kind without reading it.
        if (session.request.mode === 'comments' && session.request.pageKind !== 'both' && session.request.pageKind !== page.pageKind) {
          session.completed.add(page.pageItemId);
          this._notify();
          continue;
        }
        const readsPage = session.request.mode === 'page';
        this._enqueue(session, {
          kind: readsPage ? 'page' : 'comments',
          page,
          url: readsPage
            ? `${session.request.siteUrl}/_api/web/lists(guid'${session.listId}')/items(${page.pageItemId})?$select=${SELECT_PAGE},Modified,CanvasContent1,OData__UIVersionString,File/Level,File/MinorVersion,File/UIVersionLabel,File/CheckOutType&$expand=File`
            : `${session.request.siteUrl}/_api/web/lists(guid'${session.listId}')/items(${page.pageItemId})/comments?$top=50`
        }, true);
        continue;
      }
      const sessionOperationsReached = session.operations >= this._limits.sessionOperations;
      const sessionPagesReached = session.admitted.size >= this._limits.sessionPages;
      // A metadata read can add pages, so it waits while no more pages can be admitted.
      const metadataBlocked = operation.kind === 'metadata' &&
        (session.stepPages.size >= this._limits.stepPages || sessionPagesReached);
      if (session.stepOperations >= this._limits.stepOperations || sessionOperationsReached || metadataBlocked) {
        session.state = sessionOperationsReached || sessionPagesReached ? 'capped' : 'paused';
        break;
      }
      const gap = this._lastCompletion + REQUEST_GAP_MS - this._now();
      if (gap > 0) {
        try {
          await this._wait(gap, signal);
        } catch {
          // eslint-disable-next-line require-atomic-updates -- This run owns its session object; a newer run uses a different one.
          session.state = 'cancelled';
          break;
        }
      }
      if (stopped()) break;
      session.operations += 1;
      session.stepOperations += 1;
      let response: TransportResponse;
      try {
        response = await this._options.transport.get(operation.url, signal);
      } catch (error) {
        this._lastCompletion = this._now();
        if (stopped()) break;
        session.queue.shift();
        if (operation.kind === 'newsFacts') {
          this._finishPage(session, operation.page!.pageItemId);
          this._notify();
          continue;
        }
        this._fail(session, operation, error instanceof Error ? error.message : 'SHAREPOINT_TRANSPORT_FAILED');
        if (!operation.page) {
          session.state = 'failed';
          break;
        }
        this._finishPage(session, operation.page.pageItemId);
        this._notify();
        continue;
      }
      this._lastCompletion = this._now();
      // A response that arrives after Stop or a newer scan still sets the component-wide cooldown.
      if (response.status === 429 || response.status === 503) {
        this._recordThrottle(response.retryAfter);
        // The optional news-facts reads are dropped instead of retried, so the page whose text was read completes.
        if (operation.kind === 'newsFacts' && session.queue[0] === operation) {
          session.queue = session.queue.filter(op => op.kind !== 'newsFacts');
          this._finishPage(session, operation.page!.pageItemId);
          if (!session.queue.length) {
            this._notify();
            continue;
          }
        }
        // eslint-disable-next-line require-atomic-updates -- A throttle response also sets the state after Stop.
        session.state = 'throttled';
        this._notify();
        break;
      }
      if (stopped()) break;
      session.queue.shift();
      if (operation.kind === 'newsFacts') {
        if (response.status >= 200 && response.status < 300) {
          try {
            this._process(session, operation, response.body);
          } catch {
            /* Unreadable news facts leave the page review as it is. */
          }
        }
        this._finishPage(session, operation.page!.pageItemId);
        this._notify();
        continue;
      }
      if (response.status < 200 || response.status >= 300) {
        this._fail(session, operation, `SHAREPOINT_HTTP_${response.status}`, response.status);
        if (!operation.page) {
          session.state = 'failed';
          break;
        }
      } else {
        this._fallbackCooldown = 30000;
        try {
          this._process(session, operation, response.body);
          session.seenUrls.add(new URL(operation.url).toString());
        } catch (error) {
          this._fail(session, operation, error instanceof Error ? error.message : 'SHAREPOINT_RESPONSE_INVALID');
          if (!operation.page) {
            session.state = 'failed';
            break;
          }
        }
      }
      if (operation.page) this._finishPage(session, operation.page.pageItemId);
      this._notify();
    }
    if (session.state === 'running') {
      if (stopped()) session.state = 'cancelled';
      else session.state = session.queue.length ? 'paused' : 'completed';
    }
    this._notify();
  }

  private _fail(session: Session, operation: Operation, code: string, status?: number): void {
    session.failures.push({ url: operation.url, code, status, pageItemId: operation.page?.pageItemId });
    if (operation.page) session.failedPages.add(operation.page.pageItemId);
  }

  /** A page is complete when none of its reads failed and none is still queued. */
  private _finishPage(session: Session, pageItemId: number): void {
    if (!session.failedPages.has(pageItemId) && !session.queue.some(op => op.page?.pageItemId === pageItemId)) {
      session.completed.add(pageItemId);
    }
  }

  private _next(session: Session, operation: Operation, next?: string): void {
    if (!next) return;
    const url = sharePointContinuation(next, operation.url, session.request.siteUrl);
    if (url === new URL(operation.url).toString() || session.seenUrls.has(url)) throw new Error('SHAREPOINT_CONTINUATION_LOOP');
    this._enqueue(session, { ...operation, url }, operation.kind === 'comments' || operation.kind === 'replies');
  }

  private _process(session: Session, operation: Operation, body: unknown): void {
    if (operation.kind === 'library') {
      const collection = sharePointCollection(body);
      const candidates = collection.rows.filter(row => Number(row.BaseTemplate) === 119 && typeof row.Id === 'string');
      const expectedRoot = `${new URL(session.request.siteUrl).pathname.replace(/\/$/, '')}/SitePages`.toLowerCase();
      const canonical = candidates.filter(row => {
        const root = row.RootFolder ? sharePointRecord(row.RootFolder) : undefined;
        return root && typeof root.ServerRelativeUrl === 'string' &&
          root.ServerRelativeUrl.replace(/\/$/, '').toLowerCase() === expectedRoot;
      });
      // The library at <site>/SitePages; else the only candidate, when the list of libraries is complete.
      let selected: Record<string, unknown> | undefined;
      if (canonical.length === 1) selected = canonical[0];
      else if (candidates.length === 1 && !collection.next) selected = candidates[0];
      if (!selected || !/^[0-9a-f-]{36}$/i.test(String(selected.Id))) throw new Error('SITE_PAGES_LIBRARY_UNRESOLVED');
      session.listId = String(selected.Id);
      this._enqueue(session, {
        kind: 'contentTypes',
        url: `${session.request.siteUrl}/_api/web/lists(guid'${session.listId}')/contenttypes?$select=StringId&$top=25`
      }, true);
      return;
    }
    if (operation.kind === 'contentTypes') {
      const collection = sharePointCollection(body);
      if (!collection.rows.some(row => typeof row.StringId === 'string' && row.StringId.toLowerCase().startsWith(PAGE_CONTENT_TYPE))) {
        if (collection.next) {
          this._next(session, operation, collection.next);
          return;
        }
        throw new Error('MODERN_SITE_PAGES_CONTENT_TYPE_UNVERIFIED');
      }
      const base = `${session.request.siteUrl}/_api/web/lists(guid'${session.listId}')/items`;
      const url = session.request.pageItemId !== undefined
        ? `${base}(${session.request.pageItemId})?$select=${SELECT_PAGE}`
        : `${base}?$select=${SELECT_PAGE}&$filter=FSObjType eq 0&$orderby=Id desc&$top=25`;
      this._enqueue(session, { kind: 'metadata', url });
      return;
    }
    if (operation.kind === 'metadata') {
      const collection = session.request.pageItemId !== undefined
        ? { rows: [sharePointEntity(body)], next: undefined }
        : sharePointCollection(body);
      if (collection.rows.length > 25) throw new Error('SHAREPOINT_METADATA_PAGE_TOO_LARGE');
      // Rows come in descending ID order. The first ID read is the upper bound of the scan.
      let previous = Number.POSITIVE_INFINITY;
      collection.rows.forEach(row => {
        const id = Number(row.Id);
        if (!Number.isSafeInteger(id) || id < 1 || id > previous) throw new Error('SHAREPOINT_METADATA_ORDER_INVALID');
        if (session.request.pageItemId !== undefined && id !== session.request.pageItemId) {
          throw new Error('SHAREPOINT_PAGE_SELECTION_MISMATCH');
        }
        previous = id;
        if (session.upperItemId === undefined) session.upperItemId = id;
        if (id > session.upperItemId || session.knownPages.has(id)) return;
        const contentType = typeof row.ContentTypeId === 'string' ? row.ContentTypeId : '';
        if (Number(row.FSObjType) !== 0 || !contentType.toLowerCase().startsWith(PAGE_CONTENT_TYPE)) {
          if (session.request.pageItemId !== undefined) throw new Error('SHAREPOINT_PAGE_NOT_MODERN');
          return;
        }
        const sourceUrl = validateSharePointPageUrl(row.FileRef, session.request.siteUrl);
        if (typeof row.Title !== 'string' || typeof row.Created !== 'string' || !Number.isFinite(Date.parse(row.Created)) ||
          [0, 1, 2].indexOf(Number(row.PromotedState)) < 0) {
          throw new Error('SHAREPOINT_PAGE_METADATA_INVALID');
        }
        const page: Page = {
          pageItemId: id,
          title: row.Title,
          pageKind: Number(row.PromotedState) === 0 ? 'page' : 'news',
          sourceUrl,
          createdAt: row.Created
        };
        const kindMismatch = session.request.pageKind !== 'both' && session.request.pageKind !== page.pageKind;
        if (session.request.pageItemId !== undefined && kindMismatch) throw new Error('SHAREPOINT_PAGE_KIND_MISMATCH');
        session.knownPages.set(id, page);
        this._enqueue(session, { kind: 'admit', page, url: '' });
      });
      if (collection.next) this._next(session, operation, collection.next);
      return;
    }
    if (operation.kind === 'page') {
      const row = sharePointEntity(body);
      const page = operation.page!;
      if (Number(row.Id) !== page.pageItemId) throw new Error('SHAREPOINT_PAGE_SELECTION_MISMATCH');
      if (typeof row.Title !== 'string' || typeof row.Created !== 'string' || !Number.isFinite(Date.parse(row.Created))) {
        throw new Error('SHAREPOINT_PAGE_METADATA_INVALID');
      }
      // A modern page: a file with the Site Page content type and a known promoted state.
      if (Number(row.FSObjType) !== 0 || typeof row.ContentTypeId !== 'string' ||
        !row.ContentTypeId.toLowerCase().startsWith(PAGE_CONTENT_TYPE) || [0, 1, 2].indexOf(Number(row.PromotedState)) < 0) {
        throw new Error('SHAREPOINT_PAGE_METADATA_INVALID');
      }
      const currentPage: Page = {
        pageItemId: page.pageItemId,
        title: row.Title,
        pageKind: Number(row.PromotedState) === 0 ? 'page' : 'news',
        createdAt: row.Created,
        sourceUrl: validateSharePointPageUrl(row.FileRef, session.request.siteUrl)
      };
      if (session.request.pageKind !== 'both' && session.request.pageKind !== currentPage.pageKind) {
        throw new Error('SHAREPOINT_PAGE_KIND_MISMATCH');
      }
      const file = sharePointRecord(row.File);
      const version = file.UIVersionLabel;
      // A checked-out page shows different text to different people. A saved draft or a published
      // version shows the same text to everyone.
      if (Number(file.CheckOutType) !== 2) throw new Error('PAGE_CHECKED_OUT');
      const level = Number(file.Level);
      const published = level === 1 && Number(file.MinorVersion) === 0;
      const draft = level === 2 && Number(file.MinorVersion) > 0;
      // The text must belong to the version the label names.
      if (!published && !draft) throw new Error('PAGE_VERSION_UNAVAILABLE');
      if (typeof version !== 'string' || !/^\d+\.\d+$/.test(version) || published !== /\.0$/.test(version)) {
        throw new Error('PAGE_VERSION_UNAVAILABLE');
      }
      if (row.OData__UIVersionString !== version) throw new Error('PAGE_VERSION_UNAVAILABLE');
      // One pass: the text in reading order, and the layout whose blocks point into that text.
      const editorial = sharePointPageContent(row.CanvasContent1, this._document!, currentPage.title);
      const fullText = editorial.text;
      const structure = editorial.structure;
      const text = capText(fullText, maxSourceTextChars);
      const omittedParts = text.length < fullText.length
        ? [...editorial.omittedParts.slice(0, 99), textCutNote(maxSourceTextChars, fullText.length)]
        : editorial.omittedParts;
      const id = `${session.request.siteUrl}|${session.listId}|page:${page.pageItemId}`;
      session.knownPages.set(currentPage.pageItemId, currentPage);
      session.seenSources.add(id);
      session.sources.set(id, {
        id, chunkId: `${id}:0`, siteUrl: session.request.siteUrl, listId: session.listId,
        pageItemId: currentPage.pageItemId, pageKind: currentPage.pageKind, pageTitle: currentPage.title,
        sourceUrl: currentPage.sourceUrl, kind: 'page', text, createdAt: currentPage.createdAt, omittedParts,
        page: {
          version,
          state: published ? 'published' : 'draft',
          ...(typeof row.Modified === 'string' ? { modified: row.Modified.slice(0, 64) } : {}),
          ...(structure ? { structure } : {}),
          media: extractMedia(row.CanvasContent1, structure, this._document!)
        }
      });
      // Next, the saved header fields. This read is optional: when it fails, the page review stands.
      this._enqueue(session, {
        kind: 'newsFacts',
        page: currentPage,
        url: `${session.request.siteUrl}/_api/web/lists(guid'${session.listId}')/items(${currentPage.pageItemId})?$select=Id,OData__UIVersionString,Description,BannerImageUrl,LayoutWebpartsContent`
      }, true);
      return;
    }
    if (operation.kind === 'newsFacts') {
      const row = sharePointEntity(body);
      const page = operation.page!;
      const id = `${session.request.siteUrl}|${session.listId}|page:${page.pageItemId}`;
      const source = session.sources.get(id);
      // The header fields are used only when they belong to the version whose text was read.
      if (!source?.page || Number(row.Id) !== page.pageItemId || row.OData__UIVersionString !== source.page.version) return;
      const description = typeof row.Description === 'string' && !!row.Description.trim();
      // BannerImageUrl is a URL field: { Description, Url }, a string or null. A page without a banner of
      // its own shows SharePoint's default thumbnail, which does not count as a banner.
      const bannerField = row.BannerImageUrl;
      const bannerValue = bannerField && typeof bannerField === 'object' ? (bannerField as Record<string, unknown>).Url : bannerField;
      let banner = false;
      if (typeof bannerValue === 'string' && bannerValue.trim()) {
        try {
          const bannerPath = decodeURIComponent(new URL(bannerValue, session.request.siteUrl).pathname);
          banner = !/\/_layouts\/15\/images\/sitepagethumbnail\.png$/i.test(bannerPath);
        } catch {
          banner = true;
        }
      }
      session.sources.set(id, {
        ...source,
        page: {
          ...source.page,
          ...(source.pageKind === 'news' ? { news: { description, banner } } : {}),
          media: headerMedia(source.page.media || { images: [], links: [], omitted: [] }, row, this._document!)
        }
      });
      return;
    }
    if (operation.kind === 'comments' || operation.kind === 'replies') {
      const collection = sharePointCollection(body);
      if (collection.rows.length > 50) throw new Error('SHAREPOINT_COMMENT_PAGE_TOO_LARGE');
      const page = operation.page!;
      this._next(session, operation, collection.next);
      collection.rows.forEach(row => {
        const commentId = String(row.id === undefined ? '' : row.id);
        if (!/^\d+$/.test(commentId)) throw new Error('SHAREPOINT_COMMENT_ID_INVALID');
        const text = sharePointCommentText(row, this._document!);
        const id = `${session.request.siteUrl}|${session.listId}|${page.pageItemId}|${operation.parentId || 'root'}|${commentId}`;
        session.seenSources.add(id);
        // Replies are read for every comment, also for a comment outside the date window.
        if (operation.kind === 'comments') {
          this._enqueue(session, {
            kind: 'replies',
            page,
            parentId: commentId,
            parentText: text,
            url: `${session.request.siteUrl}/_api/web/lists(guid'${session.listId}')/items(${page.pageItemId})/comments(${commentId})/replies?$top=50`
          }, true);
        }
        const date = typeof row.createdDate === 'string' ? Date.parse(row.createdDate) : Number.NaN;
        if (!Number.isFinite(date)) throw new Error('SHAREPOINT_COMMENT_DATE_INVALID');
        if (date < session.windowStart || date > session.windowEnd) return;
        const authorName = row.author && typeof row.author === 'object' ? (row.author as { name?: unknown }).name : undefined;
        session.sources.set(id, {
          id, chunkId: `${id}:0`, siteUrl: session.request.siteUrl, listId: session.listId,
          pageItemId: page.pageItemId, pageKind: page.pageKind, pageTitle: page.title, sourceUrl: page.sourceUrl,
          kind: operation.kind === 'replies' ? 'reply' : 'comment', commentId, parentCommentId: operation.parentId,
          ...(typeof authorName === 'string' ? { commentAuthor: authorName.trim().slice(0, 120) } : {}),
          text, contextText: operation.parentText, createdAt: new Date(date).toISOString()
        });
      });
    }
  }
}
