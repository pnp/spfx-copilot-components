import { createComparisonCache } from '../cache';
import { emptyComparison } from '../contracts';
import { demoComparison, demoAnswer } from '../demo';
import { FixtureContentService, demoSiteUrl } from '../../services/fixtures';
import { createReviewCache } from '../../services/reviewCache';

const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');
const strings = { Comparison: new Proxy({}, { get: (_t, k) => String(k) }) } as IContentLensStrings;
describe('Standalone comparison cache', () => {
  beforeAll(() => { Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true }); });
  beforeEach(() => sessionStorage.clear());
  const options = { storage: () => sessionStorage, tenantUrl: demoSiteUrl, userId: 'reviewer', scope: 'instance-a' };
  it('restores selections and completed answers without a review, scoped to tenant, user and component', async () => {
    const result = await new FixtureContentService().read({ siteUrl: demoSiteUrl, mode: 'page', pageKind: 'both', pageItemId: 17, lookbackDays: 7 });
    const evidence = demoComparison(result.sources[0], document, 'en');
    const state = { ...emptyComparison(), evidence, answers: [demoAnswer(evidence, 'q', strings)], conversationId: 'conversation', question: 'follow-up' };
    expect(createComparisonCache(options).save(state)).toBe(true);
    expect(createComparisonCache(options).get()).toEqual(state);
    expect(createComparisonCache({ ...options, scope: 'another-card' }).get()).toBeUndefined();
    expect(createComparisonCache({ ...options, userId: 'someone-else' }).get()).toBeUndefined();
    expect(createComparisonCache({ ...options, tenantUrl: 'https://other.sharepoint.com' }).get()).toBeUndefined();
  });
  it('bounds the cache to three components and clears only its own component', () => {
    for (let i = 0; i < 4; i++) expect(createComparisonCache({ ...options, scope: String(i) }).save(emptyComparison())).toBe(true);
    expect(createComparisonCache({ ...options, scope: '0' }).get()).toBeUndefined();
    createComparisonCache({ ...options, scope: '1' }).clear();
    expect(createComparisonCache({ ...options, scope: '1' }).get()).toBeUndefined();
    expect(createComparisonCache({ ...options, scope: '2' }).get()).toBeDefined();
  });
  it('reports storage failures and rejects malformed state without touching the review cache', async () => {
    const result = await new FixtureContentService().read({ siteUrl: demoSiteUrl, mode: 'page', pageKind: 'both', pageItemId: 17, lookbackDays: 7 });
    const reviews = createReviewCache(options);
    reviews.save({ version: 3, request: { siteUrl: demoSiteUrl, mode: 'page', lookbackDays: 7, pageKind: 'both', pageItemId: 17 },
      siteTitle: 'Workplace', sources: result.sources, categories: ['insult'], rules: [], groups: [] });
    expect(reviews.get()).toBeDefined();
    const storage = { getItem: (key: string) => sessionStorage.getItem(key), removeItem: (key: string) => sessionStorage.removeItem(key), setItem: () => { throw new Error('QUOTA'); } };
    expect(createComparisonCache({ ...options, storage: () => storage }).save(emptyComparison())).toBe(false);
    expect(reviews.get()).toBeDefined();
    const cache = createComparisonCache(options);
    expect(cache.save(emptyComparison())).toBe(true);
    const key = Object.keys(sessionStorage).find(key => key.startsWith('content-lens.comparisons'))!;
    sessionStorage.setItem(key, '{broken'); expect(cache.get()).toBeUndefined();
    sessionStorage.setItem(key, 'x'.repeat(2 * 1024 * 1024 + 1)); expect(cache.get()).toBeUndefined();
    expect(reviews.get()).toBeDefined();
  });
});
