/* eslint-disable no-script-url -- Unsafe URL fixtures verify rejection. */
import { compareEvidence, sameSavedPage, textLocations } from '../evidence';
import { isDefaultThumbnail, type ImageUse } from '../media';
import { extractMedia, headerMedia } from '../mediaParsing';
import { sharePointPageContent } from '../../services/sharePointParsing';
import { createComparisonServices, fileEndpoint } from '../services';
import { ComparisonChat, chatContext, parseChatResponse } from '../chat';
import type { ReviewSource } from '../../domain/contracts';

const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');
beforeAll(() => { Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true }); });
const site = 'https://contoso.sharepoint.com/sites/a';
const revision = '00000000-0000-4000-8000-000000000001';
function source(): ReviewSource {
  const canvas = JSON.stringify([{ id: 'text', controlType: 4, position: { zoneIndex: 1, sectionIndex: 1 }, innerHTML: '<h3>Arrival</h3><p>Bring your badge.</p><a href="/sites/a/SitePages/Help.aspx">Help</a><img src="/sites/a/SiteAssets/a.jpg" alt="">' }]);
  const parsed = sharePointPageContent(canvas, document, 'Arrival');
  return { id: 'a', chunkId: 'a:0', kind: 'page', pageItemId: 1, pageKind: 'page', pageTitle: 'Arrival', siteUrl: site, listId: 'list',
    sourceUrl: site + '/SitePages/Arrival.aspx', createdAt: '2026-10-01T00:00:00Z', text: parsed.text,
    page: { version: '3.0', state: 'published', structure: parsed.structure, media: extractMedia(canvas, parsed.structure, document) } };
}
function evidence(): ReturnType<typeof compareEvidence> { return compareEvidence(source(), { ...source(), id: 'b', pageItemId: 2 }, 'en', revision); }

describe('Saved comparison evidence', () => {
  it('accepts supplied text-block references but rejects invented and truncated locations', () => {
    const e = evidence(), location = textLocations(e.pages[0], 'A')[0];
    const raw = (id: string): unknown => ({ messages: [{ id: 'answer', text: JSON.stringify({ answer: 'Wording differs.', highlights: [{ title: 'Wording', explanation: 'Compare the passages.', evidenceIds: [id] }] }) }] });
    expect(parseChatResponse(raw(location.id), e, 'q', 'sent', [], chatContext(e)).highlights).toHaveLength(1);
    expect(parseChatResponse(raw('A:block:invented'), e, 'q', 'sent', [], chatContext(e)).highlights).toHaveLength(0);
    e.pages[0].text = 'x'.repeat(11000);
    const block = e.pages[0].page!.structure!.sections[0].columns[0][0]; block.start = 9990; block.end = 10010;
    const context = chatContext(e);
    expect(context).not.toContain(JSON.stringify(location.id));
    expect(parseChatResponse(raw(location.id), e, 'q', 'sent', [], context).highlights).toHaveLength(0);
  });
  it('recognizes the same saved page by identity and version, never title alone', () => {
    const a = source();
    expect(sameSavedPage(a, { ...a, siteUrl: a.siteUrl.toUpperCase() + '/' })).toBe(true);
    expect(sameSavedPage(a, { ...a, pageItemId: 2 })).toBe(false);
    expect(sameSavedPage(a, { ...a, page: { ...a.page!, version: '3.1' } })).toBe(false);
  });
  it('labels only the known same-origin SharePoint default thumbnail', () => {
    const image: ImageUse = { id: 'thumbnail', blockId: 'thumbnail', section: 0, column: 0, role: 'thumbnail', state: 'configured', metadata: 'unknown', url: '/_layouts/15/images/sleektemplateimagetile.jpg' };
    expect(isDefaultThumbnail(image, site)).toBe(true);
    expect(isDefaultThumbnail({ ...image, role: 'banner' }, site)).toBe(false);
    expect(isDefaultThumbnail({ ...image, url: 'https://other.example' + image.url }, site)).toBe(false);
    expect(isDefaultThumbnail({ ...image, url: '/SiteAssets/sleektemplateimagetile.jpg' }, site)).toBe(false);
    expect(isDefaultThumbnail({ ...image, url: undefined }, site)).toBe(false);
  });
  it('keeps locations and empty alt text; never confuses thumbnail and banner', () => {
    const a = source();
    expect(a.page?.media?.links[0]).toMatchObject({ blockId: 'text', section: 1, column: 1, name: 'Help' });
    expect(a.page?.media?.images[0]).toMatchObject({ role: 'inline', alt: '', decorative: undefined });
    const media = headerMedia(a.page!.media!, { BannerImageUrl: '/thumb.jpg', LayoutWebpartsContent: JSON.stringify([{ webPartData: { properties: { layoutType: 'NoImage' } } }]) }, document);
    expect(media.images.find(i => i.role === 'banner')).toMatchObject({ state: 'none', url: undefined });
    expect(media.images.find(i => i.role === 'thumbnail')).toMatchObject({ state: 'configured', url: '/thumb.jpg' });
  });
  it('rejects external, action, query and non-HTTPS destinations before authenticated dispatch', () => {
    for (const url of ['https://evil.example/a.aspx', '/_layouts/15/signout.aspx', 'javascript:alert(1)', '/SitePages/a.aspx?delete=true', '/_api/web/delete.aspx']) expect(fileEndpoint(url, site)).toBeUndefined();
    expect(fileEndpoint('/sites/a/SitePages/Help.aspx', site)).toContain('GetFileByServerRelativePath');
  });
  it('does not flag explicitly decorative Image and Hero images, but still flags unmarked empty alt text', () => {
    const canvas = JSON.stringify([
      { controlType: 3, webPartData: { id: 'd1d91016-032f-456d-98a4-721247c305e8', properties: { altText: '', isDecorative: true } } },
      { controlType: 3, webPartData: { id: 'c4bd7b2f-7b6e-4599-8485-16504575f590', properties: { content: [
        { image: { url: '/a.jpg' }, alternateText: '', isDecorative: true },
        { image: { url: '/b.jpg' }, alternateText: '' }
      ] } } }
    ]);
    expect(sharePointPageContent(canvas, document, 'Images').structure?.issues.map(i => [i.kind, i.text])).toEqual([['heroImageAlt', '2']]);
  });
  it('deduplicates checks, distinguishes denied from missing, and leaves the original snapshots untouched', async () => {
    const a = source(), b = source(); a.page!.media!.images = []; b.page!.media!.images = [];
    b.page!.media!.links.push({ ...b.page!.media!.links[0], id: 'missing', url: '/sites/a/SitePages/Missing.aspx' },
      { ...b.page!.media!.links[0], id: 'external', url: 'https://other.example/a.aspx' });
    const before = JSON.stringify([a, b]);
    const get = jest.fn(async (url: string) => ({ status: url.includes('Missing') ? 404 : 403, body: undefined }));
    const services = createComparisonServices({ tenantUrl: site, document, get });
    const result = await services.measure(a, b, 'en', new AbortController().signal);
    expect(get).toHaveBeenCalledTimes(2);
    expect(result.links.map(l => l.state)).toEqual(['denied', 'denied', 'missing', 'unchecked']);
    expect(result.links[3].reason).toBe('external');
    expect(JSON.stringify([a, b])).toBe(before);
  });
  it('does not treat HTML success or a mismatched file as availability; stops checking on throttle', async () => {
    const a = source(); a.page!.media!.images = [];
    const get = jest.fn(async () => ({ status: 200, body: { Exists: true, ServerRelativeUrl: '/other.aspx' } }));
    const result = await createComparisonServices({ tenantUrl: site, document, get }).measure(a, a, 'en', new AbortController().signal);
    expect(result.links.every(l => l.state === 'unknown')).toBe(true);
    a.page!.media!.links.push({ ...a.page!.media!.links[0], id: 'next', url: '/sites/a/SitePages/Next.aspx' });
    const throttle = jest.fn(async () => ({ status: 429, body: undefined }));
    const limited = await createComparisonServices({ tenantUrl: site, document, get: throttle }).measure(a, a, 'en', new AbortController().signal);
    expect(throttle).toHaveBeenCalledTimes(1);
    expect(limited.links[1]).toMatchObject({ state: 'unchecked', reason: 'throttled' });
  });
});

describe('Separate Chat API interpretation', () => {
  it.each([401, 403])('reports missing API access for HTTP %s without retrying', async statusCode => {
    const post = jest.fn(async () => { throw Object.assign(new Error('Denied'), { statusCode }); });
    await expect(new ComparisonChat({ post }).turn(evidence(), 'q', 'en', { messageIds: [] }, new AbortController().signal)).rejects.toMatchObject({ code: 'access' });
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('creates once, disables web on every turn, supplies snapshot versions and continues the API conversation', async () => {
    let message = 0;
    const post = jest.fn(async (path: string, body: unknown) => {
      if (path === '/copilot/conversations') return { id: 'conversation-1' };
      const input = body as { message: { text: string } };
      return { messages: [{ id: 'echo', text: input.message.text }, { id: 'answer-' + (++message), text: 'The evidence is incomplete.', attributions: [] }] };
    });
    const chat = new ComparisonChat({ post }), e = evidence(), before = JSON.stringify(e);
    const first = await chat.turn(e, 'Compare', 'en', { messageIds: [] }, new AbortController().signal);
    await chat.turn(e, 'What changed?', 'de', { id: first.conversationId, messageIds: [first.answer.messageId] }, new AbortController().signal);
    expect(post).toHaveBeenCalledTimes(3);
    const bodies = post.mock.calls.slice(1).map(call => call[1]) as Array<{ message: { text: string }; contextualResources: unknown; additionalContext: Array<{ text: string; description: string }> }>;
    bodies.forEach(body => {
      expect(body.contextualResources).toEqual({ webContext: { isWebEnabled: false } });
      expect(body.additionalContext[0].text).toContain('3.0');
      expect(body.message.text).toContain(body.additionalContext[0].text);
      expect(body.additionalContext[0].description).toContain('page A and page B');
      const data = JSON.parse(body.additionalContext[0].text);
      expect(data.pages.map((p: { page: string; text: string }) => [p.page, p.text])).toEqual([['A', e.pages[0].text], ['B', e.pages[1].text]]);
    });
    expect(JSON.stringify(e)).toBe(before);
  });
  it('validates evidence IDs, separates citations, and preserves plain unsafe-looking text without executing it', () => {
    const e = evidence(), ctx = chatContext(e), id = e.facts[0].id;
    const raw = { messages: [{ id: 'new', text: JSON.stringify({ answer: '<img src=x onerror=alert(1)>', highlights: [
      { title: 'Evidence', explanation: 'Known', evidenceIds: [id] }, { title: 'Invented', explanation: 'Unknown', evidenceIds: ['fake'] }] }),
      attributions: [{ attributionType: 'citation', seeMoreWebUrl: 'javascript:alert(1)' }, { attributionType: 'citation', seeMoreWebUrl: 'https://contoso.sharepoint.com/page', providerDisplayName: 'Source' }], sensitivityLabel: { displayName: 'Confidential' } }] };
    const answer = parseChatResponse(raw, e, 'q', 'sent', [], ctx);
    expect(answer.highlights).toHaveLength(1); expect(answer.citations).toHaveLength(1); expect(answer.sensitivity).toEqual(['Confidential']);
    expect(answer.text).toContain('<img');
    expect(() => parseChatResponse({ messages: [{ id: '1', text: 'One' }, { id: '2', text: 'Two' }] }, e, 'q', 'sent', [], ctx)).toThrow('response');
  });
  it('excludes every previously returned message, including user echoes with no role field', () => {
    const e = evidence(), context = chatContext(e);
    const first = parseChatResponse({ messages: [{ id: 'user-1', text: 'sent-1' }, { id: 'answer-1', text: 'First answer' }] }, e, 'question-1', 'sent-1', [], context);
    const second = parseChatResponse({ messages: [{ id: 'user-1', text: 'sent-1' }, { id: 'answer-1', text: 'First answer' },
      { id: 'user-2', text: 'sent-2' }, { id: 'answer-2', text: 'Second answer' }] }, e, 'question-2', 'sent-2', first.responseMessageIds!, context);
    expect(second.text).toBe('Second answer');
  });
  it('unwraps identical repeated JSON, keeps uncertainty without evidence controls, and rejects conflicting or broken JSON', () => {
    const e = evidence(), context = chatContext(e);
    const encoded = JSON.stringify({ answer: 'Not enough evidence.\n\nA quoted brace: "}".', highlights: [{ title: 'Uncertain', explanation: 'The snapshots do not establish this.', evidenceIds: [] }] });
    const parse = (text: string): ReturnType<typeof parseChatResponse> => parseChatResponse({ messages: [{ id: 'a', text }] }, e, 'q', 'sent', [], context);
    expect(parse(encoded + encoded)).toMatchObject({ text: 'Not enough evidence.\n\nA quoted brace: "}".', highlights: [{ title: 'Uncertain', evidenceIds: [] }] });
    expect(parse(JSON.stringify({ answer: 'Readable answer', highlights: [{ malformed: true }] }))).toMatchObject({ text: 'Readable answer', highlights: [] });
    expect(() => parse(encoded + JSON.stringify({ answer: 'Different answer' }))).toThrow('response');
    expect(() => parse('{"answer":"unfinished')).toThrow('response');
  });
  it('deduplicates returned citations without treating their presence as snapshot evidence', () => {
    const e = evidence();
    const answer = parseChatResponse({ messages: [{ id: 'a', text: 'Uncertain.', attributions: [
      { attributionType: 'citation', seeMoreWebUrl: 'https://contoso.sharepoint.com/other', providerDisplayName: 'Other source' },
      { attributionType: 'citation', seeMoreWebUrl: 'https://contoso.sharepoint.com/other', providerDisplayName: 'Repeated source' }
    ] }] }, e, 'q', 'sent', [], chatContext(e));
    expect(answer.citations).toEqual([{ url: 'https://contoso.sharepoint.com/other', title: 'Other source' }]);
    expect(answer.highlights).toEqual([]);
  });
  it('makes omissions explicit and refuses replay after an uncertain request', async () => {
    const e = evidence(); e.pages.forEach(p => { p.text = 'long '.repeat(8000); });
    const context = JSON.parse(chatContext(e)); expect(context.pages[0].textOmittedFromChat).toBeGreaterThan(0);
    const post = jest.fn(async () => { throw Object.assign(new Error('Throttled'), { statusCode: 429 }); });
    await expect(new ComparisonChat({ post }).turn(e, 'q', 'en', { messageIds: [] }, new AbortController().signal)).rejects.toMatchObject({ code: 'throttled' });
    expect(post).toHaveBeenCalledTimes(1);
  });
});
