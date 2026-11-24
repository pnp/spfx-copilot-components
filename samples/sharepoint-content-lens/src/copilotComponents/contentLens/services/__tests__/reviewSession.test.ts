import { mergeReviewResults, validateReviewSession } from '../reviewSession';

const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');
beforeAll(() => { Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true }); });
import type { AnalysisResult, ReviewSource } from '../../domain/contracts';

const source: ReviewSource = { id: 'a', chunkId: 'a:0', siteUrl: 'https://example.invalid/sites/review', listId: 'pages', pageItemId: 1,
  kind: 'comment', pageKind: 'news', pageTitle: 'Test', text: 'Only an idiot', createdAt: '2026-09-26T10:00:00Z' };
const result = (id: string): AnalysisResult => ({ provenance: 'copilotChat', findings: [{ id: 'analysis:0', sourceId: id, chunkId: id + ':0',
  categoryId: 'insult', excerpt: 'Only an idiot', explanation: 'Insult.', needsContext: false }],
  decisions: [{ sourceId: id, chunkId: id + ':0', status: 'reviewed' }] });
describe('cumulative review session', () => {
  it('keeps distinct evidence across answers even when their finding IDs repeat', () => {
    const merged = mergeReviewResults(result('a'), result('b'));
    expect(merged.findings).toHaveLength(2);
    expect(new Set(merged.findings.map(finding => finding.id)).size).toBe(2);
    expect(mergeReviewResults(merged, result('b')).findings).toHaveLength(2);
  });
  it('rejects another site, invented evidence and duplicate decisions on restoration', () => {
    const state = { version: 3, request: { siteUrl: source.siteUrl, mode: 'comments', pageKind: 'both', lookbackDays: 7 },
      siteTitle: 'Test', sources: [source], categories: ['insult'], rules: [], analysis: result('a') };
    expect(validateReviewSession(state).sources).toHaveLength(1);
    expect(() => validateReviewSession({ ...state, autoContinuePage: true })).toThrow('REVIEW_SESSION_INVALID');
    // Every check plus five rules, with the rules the request named.
    expect(validateReviewSession({ ...state, categories: ['insult', 'rule1', 'rule2'], rules: ['A', 'B'] }).rules).toEqual(['A', 'B']);
    expect(() => validateReviewSession({ ...state, version: 1 })).toThrow();
    expect(() => validateReviewSession({ ...state, categories: ['insult', 'rule1'], rules: [] })).toThrow();
    expect(() => validateReviewSession({ ...state, customCheck: '' })).toThrow();
    expect(() => validateReviewSession({ ...state, sources: [{ ...source, siteUrl: 'https://other.invalid' }] })).toThrow();
    expect(() => validateReviewSession({ ...state, analysis: result('invented') })).toThrow();
    expect(() => validateReviewSession({ ...state, analysis: { ...result('a'), decisions: [...result('a').decisions, ...result('a').decisions] } })).toThrow();
  });

  it('restores automatic-only Page reviews without accepting empty or fabricated AI reviews', () => {
    const state = { version: 3, request: { siteUrl: source.siteUrl, mode: 'page', pageKind: 'both', lookbackDays: 7 },
      siteTitle: 'Test', sources: [{ ...source, kind: 'page' }], categories: [], rules: [], groups: ['a11y'] };
    expect(validateReviewSession(state).categories).toEqual([]);
    expect(() => validateReviewSession({ ...state, groups: [] })).toThrow();
    expect(() => validateReviewSession({ ...state, autoContinuePage: true })).toThrow();
    expect(() => validateReviewSession({ ...state, analysis: { findings: [], decisions: [], provenance: 'copilotChat' } })).toThrow();
    expect(() => validateReviewSession({ ...state, request: { ...state.request, mode: 'comments' } })).toThrow();
  });

  it('restores pages saved with and without the layout and news facts', () => {
    const page = (extra: object): ReviewSource => ({ ...source, id: 'p', chunkId: 'p:0', kind: 'page', text: 'Office move\n\nOnly an idiot',
      page: { version: '1.0', state: 'published', structure: { words: 4, textBlocks: 1, webParts: 0, sections: [{ vertical: false, columns: [[{ kind: 'text', label: 'Only', words: 3, id: 't' }]] }],
        issues: [{ kind: 'linkEmpty', where: 'Only an idiot', blockId: 't', at: 13 }], ...extra } } });
    const withFacts: ReviewSource = { ...page({ layout: [{ kind: 'emptySection', where: '', section: 2 }] }), page: { ...page({ layout: [] }).page!, news: { description: false, banner: true } } };
    const older = page({});
    for (const item of [withFacts, older]) {
      const state = { version: 3, request: { siteUrl: source.siteUrl, mode: 'page', pageKind: 'both', lookbackDays: 7, pageItemId: 1 },
        siteTitle: 'Test', sources: [item], categories: ['insult'], rules: [] };
      expect(validateReviewSession(JSON.parse(JSON.stringify(state))).sources[0].page).toEqual(item.page);
    }
  });
});
