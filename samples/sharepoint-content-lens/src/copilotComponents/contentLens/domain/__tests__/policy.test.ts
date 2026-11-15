/** @jest-environment node */
import { completeDecisions, isFindingValid, utf8Bytes } from '../policy';
import type { ReviewFinding, ReviewSource } from '../contracts';

// Heft strips the environment docblock during TypeScript emit; jsdom needs this test-only Web API shim.
const originalTextEncoder = globalThis.TextEncoder;
beforeAll(() => { globalThis.TextEncoder = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util').TextEncoder; });
afterAll(() => { globalThis.TextEncoder = originalTextEncoder; });

const source: ReviewSource = { id: 's1', chunkId: 's1:0', siteUrl: 'https://example.invalid/sites/hr', listId: 'pages', pageItemId: 1, kind: 'comment', pageKind: 'news', pageTitle: 'Policy', text: 'Only an idiot would approve this policy.', createdAt: '2026-09-01T10:00:00Z' };
const finding: ReviewFinding = { id: 'f1', sourceId: source.id, chunkId: source.chunkId, categoryId: 'insult', excerpt: 'Only an idiot', explanation: 'Personal attack', needsContext: false };

describe('Evidence safety', () => {
  it('keeps coverage per source/chunk and marks omissions, duplicates and unknown decisions unreviewed', () => {
    const chunks = [source, { ...source, chunkId: 's1:1' }, { ...source, chunkId: 's1:2' }];
    const decisions = completeDecisions(chunks, [
      { sourceId: 's1', chunkId: 's1:0', status: 'reviewed' },
      { sourceId: 's1', chunkId: 's1:2', status: 'reviewed' },
      { sourceId: 's1', chunkId: 's1:2', status: 'notReviewed' },
      { sourceId: 'invented', chunkId: 's1:1', status: 'reviewed' }
    ]);
    expect(decisions.map(decision => decision.status)).toEqual(['reviewed', 'notReviewed', 'notReviewed']);
    expect(decisions).toHaveLength(3);
  });
  it('requires an exact normalized excerpt, known source/chunk and selected category', () => {
    expect(isFindingValid(finding, [source], ['insult'])).toBe(true);
    expect(isFindingValid({ ...finding, excerpt: 'invented wording' }, [source], ['insult'])).toBe(false);
    expect(isFindingValid({ ...finding, sourceId: 'invented' }, [source], ['insult'])).toBe(false);
    expect(isFindingValid({ ...finding, chunkId: 'other' }, [source], ['insult'])).toBe(false);
    expect(isFindingValid(finding, [source], ['hate'])).toBe(false);
  });
  it('measures UTF-8 bytes rather than characters', () => {
    expect(utf8Bytes('ä')).toBe(2);
  });
});
