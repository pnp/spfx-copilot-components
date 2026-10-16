import { AadHttpClient, type AadHttpClientFactory } from '@microsoft/sp-http';
import { z } from 'zod';
import type { ICommunity, ICommunitySnapshot } from '../models/ICommunity';
import type { IVivaEngageService } from './IVivaEngageService';

const GRAPH_ROOT = 'https://graph.microsoft.com';
const COLLECTION = `${GRAPH_ROOT}/v1.0/employeeExperience/communities`;
const communitySchema = z.object({
  id: z.string().min(1),
  displayName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  privacy: z.string().nullable().optional(),
  groupId: z.string().nullable().optional()
});
const pageSchema = z.object({
  value: z.array(communitySchema),
  '@odata.nextLink': z.string().url().optional()
});

export type CommunityErrorKind =
  'authentication' | 'permission' | 'throttled' | 'network' | 'unavailable' | 'notFound' | 'invalidResponse';

export class CommunityServiceError extends Error {
  public constructor(
    public readonly kind: CommunityErrorKind,
    public readonly retryAt?: number
  ) {
    super(kind);
    this.name = 'CommunityServiceError';
  }
}

export function classifyError(error: unknown): CommunityServiceError {
  if (error instanceof CommunityServiceError) return error;
  const message = error instanceof Error ? `${error.name} ${error.message}` : '';
  if (/consent|AADSTS65001|AADSTS65004|permission|access.?denied|forbidden/i.test(message)) {
    return new CommunityServiceError('permission');
  }
  if (/auth|login|token|AADSTS|timed_out|interaction_required/i.test(message)) {
    return new CommunityServiceError('authentication');
  }
  return new CommunityServiceError('network');
}

function mapCommunity(value: z.infer<typeof communitySchema>): ICommunity {
  return {
    id: value.id,
    displayName: value.displayName ?? undefined,
    description: value.description ?? undefined,
    privacy: value.privacy === 'public' || value.privacy === 'private' ? value.privacy : 'unknownFutureValue',
    groupId: value.groupId ?? undefined
  };
}

/**
 * AadHttpClient delegates token acquisition entirely to SPFx. Using its HTTP
 * response preserves Retry-After without layering retries over Graph SDK retries.
 */
export class GraphVivaEngageService implements IVivaEngageService {
  private _client: Promise<AadHttpClient> | undefined;
  private _listRequest: Promise<ICommunity[]> | undefined;
  private readonly _details = new Map<string, ICommunity>();
  private readonly _detailRequests = new Map<string, Promise<ICommunity>>();
  private _snapshot: ICommunitySnapshot = { communities: [], complete: false };
  private readonly _lifetime = new AbortController();
  private _retryAt = 0;
  private _retryKind: 'throttled' | 'unavailable' = 'throttled';
  private _generation = 0;

  public constructor(private readonly _factory: AadHttpClientFactory) {}

  public getSnapshot(): ICommunitySnapshot {
    return { communities: [...this._snapshot.communities], complete: this._snapshot.complete };
  }

  public getCommunities(): Promise<ICommunity[]> {
    if (this._listRequest) return this._listRequest;
    if (this._snapshot.complete) return Promise.resolve([...this._snapshot.communities]);
    this._listRequest = this._loadCommunities().finally(() => { this._listRequest = undefined; });
    return this._listRequest;
  }

  public refresh(): Promise<ICommunity[]> {
    if (this._listRequest) return this._listRequest;
    if (this._retryAt > Date.now()) return Promise.reject(new CommunityServiceError(this._retryKind, this._retryAt));
    this._generation++;
    this._details.clear();
    this._detailRequests.clear();
    this._snapshot = { communities: [], complete: false };
    return this.getCommunities();
  }

  public getCommunityById(id: string, refresh: boolean = false): Promise<ICommunity> {
    if (!id.trim()) return Promise.reject(new CommunityServiceError('notFound'));
    const pending = this._detailRequests.get(id);
    if (pending) return pending;
    if (refresh) {
      if (this._retryAt > Date.now()) return Promise.reject(new CommunityServiceError(this._retryKind, this._retryAt));
      this._details.delete(id);
    }
    const cached = this._details.get(id);
    if (cached) return Promise.resolve(cached);
    const request = this._loadCommunity(id, this._generation).finally(() => {
      if (this._detailRequests.get(id) === request) this._detailRequests.delete(id);
    });
    this._detailRequests.set(id, request);
    return request;
  }

  public dispose(): void {
    this._lifetime.abort();
    this._generation++;
    this._details.clear();
    this._snapshot = { communities: [], complete: false };
  }

  private async _loadCommunities(): Promise<ICommunity[]> {
    const communities = new Map<string, ICommunity>();
    const visited = new Set<string>();
    let next: string | undefined = `${COLLECTION}?$top=100&$select=id,displayName,description,privacy,groupId&$orderby=displayName`;
    this._snapshot = { communities: [], complete: false };
    while (next) {
      if (visited.has(next)) throw new CommunityServiceError('invalidResponse');
      visited.add(next);
      const parsed = pageSchema.safeParse(await this._get(next));
      if (this._lifetime.signal.aborted) throw new CommunityServiceError('network');
      if (!parsed.success) throw new CommunityServiceError('invalidResponse');
      parsed.data.value.forEach(value => {
        const community = mapCommunity(value);
        communities.set(community.id, community);
      });
      this._snapshot = { communities: Array.from(communities.values()), complete: false };
      next = parsed.data['@odata.nextLink'];
      if (next) {
        const url = new URL(next);
        if (url.origin !== GRAPH_ROOT || url.pathname !== '/v1.0/employeeExperience/communities') {
          throw new CommunityServiceError('invalidResponse');
        }
      }
    }
    this._snapshot = { communities: Array.from(communities.values()), complete: true };
    return [...this._snapshot.communities];
  }

  private async _loadCommunity(id: string, generation: number): Promise<ICommunity> {
    const parsed = communitySchema.safeParse(await this._get(`${COLLECTION}/${encodeURIComponent(id)}`));
    if (!parsed.success || parsed.data.id !== id) throw new CommunityServiceError('invalidResponse');
    const community = mapCommunity(parsed.data);
    if (generation === this._generation && !this._lifetime.signal.aborted) this._details.set(id, community);
    return community;
  }

  private async _wait(milliseconds: number): Promise<void> {
    if (this._lifetime.signal.aborted) throw new CommunityServiceError('network');
    await new Promise<void>((resolve, reject) => {
      const signal = this._lifetime.signal;
      let timer: ReturnType<typeof setTimeout> | undefined = undefined;
      const abort = (): void => {
        clearTimeout(timer);
        reject(new CommunityServiceError('network'));
      };
      timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve();
      }, milliseconds);
      signal.addEventListener('abort', abort, { once: true });
    });
  }

  private async _get(url: string): Promise<unknown> {
    try {
      if (this._retryAt > Date.now()) throw new CommunityServiceError(this._retryKind, this._retryAt);
      if (!this._client) {
        this._client = this._factory.getClient(GRAPH_ROOT).catch(error => {
          this._client = undefined;
          throw classifyError(error);
        });
      }
      const client = await this._client;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (this._lifetime.signal.aborted) throw new CommunityServiceError('network');
        const response = await client.get(url, AadHttpClient.configurations.v1);
        if (this._lifetime.signal.aborted) throw new CommunityServiceError('network');
        if (response.ok) {
          try {
            return await response.json();
          } catch {
            throw new CommunityServiceError('invalidResponse');
          }
        }
        if (response.status === 401) throw new CommunityServiceError('authentication');
        if (response.status === 403) throw new CommunityServiceError('permission');
        if (response.status === 404) throw new CommunityServiceError('notFound');
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable) throw new CommunityServiceError('invalidResponse');
        const header = response.headers.get('Retry-After');
        const seconds = header === null ? NaN : Number(header);
        const delay = header === null ? 1000 * Math.pow(2, attempt) :
          Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : Math.max(0, Date.parse(header) - Date.now());
        const wait = Number.isFinite(delay) ? delay : 1000 * Math.pow(2, attempt);
        this._retryAt = Date.now() + wait;
        const kind = response.status === 429 ? 'throttled' : 'unavailable';
        this._retryKind = kind;
        // Long server delays are surfaced to the user, never shortened.
        if (attempt === 2 || wait > 15000) throw new CommunityServiceError(kind, this._retryAt);
        await this._wait(wait);
      }
      throw new CommunityServiceError('unavailable');
    } catch (error) {
      throw classifyError(error);
    }
  }
}
