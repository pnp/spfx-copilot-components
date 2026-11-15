import { createReviewCache } from '../reviewCache';
import type { ReviewSession } from '../reviewSession';
const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');
beforeAll(() => { Object.defineProperty(globalThis, 'TextEncoder', { configurable: true, value: TextEncoder }); });
it.each(['page', 'comments'] as const)('restores completed %s work only in its own card, without continuation authority', mode => {
  const data = new Map<string, string>();
  const storage = { getItem: (k: string): string | null => data.get(k) || null, setItem: (k: string, v: string): void => { data.set(k, v); }, removeItem: (k: string): void => { data.delete(k); } };
  const options = { storage: () => storage, tenantUrl: 'https://contoso.sharepoint.com', userId: 'u', scope: 'card-1' };
  const cache = createReviewCache(options);
  const review: ReviewSession = { version: 3, siteTitle: 'Test', request: { siteUrl: options.tenantUrl, mode, pageKind: 'both', lookbackDays: 7 },
    sources: [], categories: ['insult'], rules: [], ...(mode === 'page' ? { autoContinuePage: true as const } : {}), analysis: { findings: [], decisions: [], provenance: 'copilotChat' } };
  cache.save(review); expect(cache.get()?.analysis).toEqual(review.analysis); expect(cache.get()?.autoContinuePage).toBeUndefined();
  expect(createReviewCache({ ...options, scope: 'card-2' }).get()).toBeUndefined();
  expect(createReviewCache({ ...options, userId: 'other' }).get()).toBeUndefined();
  cache.clear(); expect(cache.get()).toBeUndefined();
});
