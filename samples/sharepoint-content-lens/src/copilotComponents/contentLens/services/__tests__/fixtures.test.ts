/** @jest-environment node */
import { FixtureAnalysisClient, FixtureContentService, demoPages, demoSites, demoSiteUrl } from '../fixtures';
import type { ScanRequest } from '../../domain/contracts';

const request: ScanRequest = { siteUrl: demoSiteUrl, mode: 'comments', lookbackDays: 7, pageKind: 'both' };

describe('Explicit fictional workflow', () => {
  it('keeps a recent reply with older parent context without claiming live operation counts', async () => {
    const result = await new FixtureContentService().read(request);
    expect(result.sources.some(source => source.id === 'reply-3' && !!source.parentCommentId && !!source.contextText)).toBe(true);
    expect(result.sources.some(source => source.id === 'comment-7')).toBe(false);
    expect(result.coverage.isPartial).toBe(true);
    expect(result.coverage.operationsAttempted).toBe(0);
  });
  it('honors demo date, page-kind and one-page filters', async () => {
    const service = new FixtureContentService();
    const wider = await service.read({ ...request, lookbackDays: 14 });
    expect(wider.sources.some(source => source.id === 'comment-7')).toBe(true);
    const onePage = await service.read({ ...request, pageItemId: 18, pageKind: 'page' });
    expect(onePage.sources.map(source => source.id)).toEqual(['comment-4']);
    expect(onePage.coverage.completedPages).toBe(1);
  });
  it('counts inspected catalog pages rather than hardcoding two after page-kind filtering', async () => {
    const service = new FixtureContentService();
    const both = await service.read(request);
    const pages = await service.read({ ...request, pageKind: 'page' });
    const news = await service.read({ ...request, pageKind: 'news' });
    // The office move page has no comments in the example; comments come from the other two pages.
    expect(both.coverage.completedPages).toBe(demoPages.filter(page => page.pageItemId !== 17).length);
    expect(pages.coverage.completedPages).toBe(1);
    expect(news.coverage.completedPages).toBe(1);
    expect(pages.sources.every(source => source.pageKind === 'page')).toBe(true);
    expect(news.sources.every(source => source.pageKind === 'news')).toBe(true);
    for (const result of [both, pages, news]) {
      expect(result.coverage.retrieved).toBe(result.sources.length);
      expect(result.coverage.matching).toBe(result.sources.length);
      expect(result.coverage.displayed).toBe(result.sources.length);
      expect(result.coverage.analyzed).toBe(0);
      expect(result.coverage.httpEnvelopes).toBe(0);
      expect(result.coverage.failedSources).toBe(0);
      expect(result.coverage.partialPages).toBe(0);
      expect(result.coverage.isPartial).toBe(true);
    }
  });
  it('does not count an unknown page or a page excluded by the source filter as inspected', async () => {
    const service = new FixtureContentService();
    for (const mode of ['comments', 'page'] as const) {
      const missing = await service.read({ ...request, mode, pageItemId: 999 });
      expect(missing.sources).toHaveLength(0);
      expect(missing.coverage.completedPages).toBe(0);
      expect(missing.coverage.failedSources).toBe(1);
      expect(missing.coverage.retrieved).toBe(0);
    }
    const excluded = await service.read({ ...request, pageKind: 'page', pageItemId: 42 });
    expect(excluded.sources).toHaveLength(0);
    expect(excluded.coverage.completedPages).toBe(0);
    expect(excluded.coverage.failedSources).toBe(0);
  });
  it('keeps picker metadata aligned with sources and refuses unavailable fictional sites', async () => {
    expect(demoSites.filter(site => site.available).map(site => site.url)).toEqual([demoSiteUrl]);
    const { sources } = await new FixtureContentService().read({ ...request, lookbackDays: 14 });
    for (const source of sources) {
      const page = demoPages.find(candidate => candidate.pageItemId === source.pageItemId);
      expect(page?.title).toBe(source.pageTitle);
      expect(page?.pageKind).toBe(source.pageKind);
      expect(source.contextText).toBeTruthy();
    }
    const archive = demoSites.find(site => !site.available)!;
    await expect(new FixtureContentService().read({ ...request, siteUrl: archive.url })).rejects.toThrow('DEMO_SITE_NOT_AVAILABLE');
    await expect(new FixtureContentService().read({ ...request, siteUrl: 'https://example.invalid/sites/different' })).rejects.toThrow('DEMO_SITE_NOT_AVAILABLE');
  });
  it('reads the selected editorial page and keeps recent comments on older pages', async () => {
    const service = new FixtureContentService();
    const news = await service.read({ ...request, mode: 'page', pageItemId: 42 });
    const page = await service.read({ ...request, mode: 'page', pageItemId: 18 });
    expect(news.sources[0].id).toBe('page-42');
    expect(page.sources[0].id).toBe('page-18');
    expect(page.sources[0].pageTitle).toBe('Workplace health resources');
    expect(page.sources[0].commentId).toBeUndefined();
    expect(page.coverage.completedPages).toBe(1);
    const comments = await service.read({ ...request, pageItemId: 42 });
    expect(new Date(news.sources[0].createdAt).getTime()).toBeLessThan(Date.now() - 7 * 86400000);
    expect(comments.sources.some(source => source.id === 'comment-1')).toBe(true);
    expect(comments.sources.some(source => source.id === 'reply-3' && source.parentCommentId === 'old-parent')).toBe(true);
  });
  it('does not script criticism or neutral health information as an insult', async () => {
    const { sources } = await new FixtureContentService().read(request);
    const result = await new FixtureAnalysisClient().analyze(sources, ['insult', 'sexual'], []);
    expect(result.provenance).toBe('fixture');
    expect(result.findings.map(finding => finding.sourceId)).toEqual(['comment-1']);
    expect(result.decisions.every(decision => decision.status === 'reviewed')).toBe(true);
    for (const id of ['comment-2', 'comment-4']) {
      expect(result.decisions.find(decision => decision.sourceId === id)?.status).toBe('reviewed');
      expect(result.findings.some(finding => finding.sourceId === id)).toBe(false);
    }
  });
  it('does not invent a result for writing rules and discloses omitted page parts', async () => {
    const { sources } = await new FixtureContentService().read({ ...request, mode: 'page' });
    expect(sources[0].omittedParts).toHaveLength(2);
    const result = await new FixtureAnalysisClient().analyze(sources, ['rule1'], ['Check inaccessible terminology.']);
    expect(result.findings).toHaveLength(0);
    expect(result.decisions[0].status).toBe('notReviewed');
  });
});
