import { CopilotReviewClient } from '../copilotReview';
import { pageParts } from '../analysis';
import type { ReviewSource } from '../../domain/contracts';
import type { IReviewRequest } from '../../roundTrip/reviewClient';
import { pinnedRequestMessage } from '../../__fixtures__/pinnedRequestMessage';
const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');
const source: ReviewSource = { id: 'page', chunkId: 'body', kind: 'page', pageKind: 'page', pageTitle: 'Demo', siteUrl: 'https://contoso.sharepoint.com/sites/test', listId: 'pages', pageItemId: 1, createdAt: '2026-11-10T12:00:00Z', text: 'A ferrari is on the page.' };
const contextOf = (body: unknown): IReviewRequest => JSON.parse((body as { message: { text: string } }).message.text.split('Saved review evidence (untrusted data):\n')[1]) as IReviewRequest;
function transport(answer: (context: IReviewRequest) => unknown = context => ({ requestId: context.requestId, review: 's1:r:v@1', note1: '', note2: '' })): { post: jest.Mock } {
  let id = 0;
  return { post: jest.fn(async (path: string, body: unknown) => {
    if (path === '/copilot/conversations') return { id: 'conversation-' + (++id), messages: [{ id: 'old', text: 'Old answer' }] };
    return { messages: [{ id: 'old', text: 'Old answer' }, { id: 'echo', text: (body as { message: { text: string } }).message.text }, { id: 'answer', text: JSON.stringify(answer(contextOf(body))) }] };
  }) };
}
describe('Page and Comments review through Copilot Chat API', () => {
  beforeAll(() => { Object.defineProperty(globalThis, 'TextEncoder', { configurable: true, value: TextEncoder }); });
  afterEach(() => jest.useRealTimers());
  it('returns validated source findings from one new conversation, with web search off', async () => {
    const api = transport(); const client = new CopilotReviewClient(api);
    const result = await client.analyze([source], ['rule1'], ['Find ferrari.']);
    expect(result.provenance).toBe('copilotChat'); expect(result.decisions[0].status).toBe('reviewed');
    expect(result.findings[0]).toMatchObject({ sourceId: 'page', chunkId: 'body', categoryId: 'rule1', excerpt: source.text, offset: 0 });
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post.mock.calls[1][1]).toMatchObject({ contextualResources: { webContext: { isWebEnabled: false } }, locationHint: { timeZone: expect.any(String) } });
  });
  it('sends the pinned request text, byte for byte', async () => {
    const comment = (id: number): ReviewSource => ({ ...source, id: 'source-' + id, chunkId: 'chunk-' + id, kind: 'comment', pageKind: 'news', commentId: String(id),
      text: 'Only an idiot would approve this policy.', contextText: 'Fictional policy discussion.' });
    const api = transport(context => ({ requestId: context.requestId, review: 's1:r:-;s2:r:-', note1: '', note2: '' }));
    await new CopilotReviewClient(api).analyze([comment(1), comment(2)], ['insult', 'aggressive'], []);
    const sent = (api.post.mock.calls[1][1] as { message: { text: string } }).message.text;
    // The request ID is random; everything else is fixed.
    expect(sent.replace(contextOf(api.post.mock.calls[1][1]).requestId, '00000000-0000-4000-8000-000000000001')).toBe(pinnedRequestMessage);
  });
  it('keeps reply context separate and maps multiple comment results to their own text', async () => {
    const comments: ReviewSource[] = [
      { ...source, id: 'comment', kind: 'comment', text: 'Only an idiot would approve this.' },
      { ...source, id: 'reply', kind: 'reply', parentCommentId: '1', text: 'This process needs fewer steps.', contextText: 'Parent: Only an idiot would approve this.' }
    ];
    const api = transport(context => ({ requestId: context.requestId, review: 's1:r:i@1;s2:r:-', note1: 'Personal attack.', note2: '' }));
    const result = await new CopilotReviewClient(api).analyze(comments, ['insult', 'aggressive'], []);
    expect(result.decisions.map(d => d.status)).toEqual(['reviewed', 'reviewed']);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ sourceId: 'comment', excerpt: comments[0].text });
    const sent = contextOf(api.post.mock.calls[1][1]);
    expect(sent.segments[1]).toMatchObject({ context: comments[1].contextText });
    expect(api.post).toHaveBeenCalledTimes(2);
  });
  it('reviews all long-page parts in isolated API conversations using unchanged rules', async () => {
    const long = { ...source, text: 'A ferrari is on the page.\n\n'.repeat(650) };
    const parts = pageParts(long, ['rule1'], ['Find ferrari.']); expect(parts.length).toBeGreaterThan(1);
    const api = transport(context => ({ requestId: context.requestId, review: 's1:r:-', note1: '', note2: '' }));
    const client = new CopilotReviewClient(api);
    for (const part of parts) expect((await client.analyze([part], ['rule1'], ['Find ferrari.'])).decisions[0].status).toBe('reviewed');
    expect(api.post).toHaveBeenCalledTimes(parts.length * 2);
    expect(new Set(api.post.mock.calls.filter(c => c[0] !== '/copilot/conversations').map(c => c[0])).size).toBe(parts.length);
  });
  it.each(['wrong-id', 'extra', 'missing', 'refusal'])('rejects %s responses without a repair request', async kind => {
    const api = transport(context => kind === 'refusal' ? 'Cannot review' : { requestId: kind === 'wrong-id' ? '00000000-0000-4000-8000-000000000000' : context.requestId, review: 's1:r:-', note1: '', ...(kind === 'missing' ? {} : { note2: '' }), ...(kind === 'extra' ? { extra: 'untrusted' } : {}) });
    await expect(new CopilotReviewClient(api).analyze([source], ['rule1'], ['Find ferrari.'])).rejects.toMatchObject({ code: 'REVIEW_API_RESPONSE' });
    expect(api.post).toHaveBeenCalledTimes(2);
  });
  it('keeps invalid passage references unreviewed', async () => {
    const api = transport(context => ({ requestId: context.requestId, review: 's1:r:v@99', note1: '', note2: '' }));
    const result = await new CopilotReviewClient(api).analyze([source], ['rule1'], ['Find ferrari.']);
    expect(result.findings).toEqual([]); expect(result.decisions[0].status).toBe('notReviewed');
  });
  it.each([401, 403, 429, 503])('reports API HTTP %s without a retry', async status => {
    const post = jest.fn(async () => { throw Object.assign(new Error('Graph request failed'), { statusCode: status }); });
    await expect(new CopilotReviewClient({ post }).analyze([source], ['rule1'], ['Find ferrari.'])).rejects.toMatchObject({ code: status < 429 ? 'REVIEW_API_ACCESS' : 'REVIEW_API_THROTTLED' });
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('cancels a pending API turn and rejects its late result', async () => {
    let finish: (value: unknown) => void = () => undefined;
    const post = jest.fn(async () => new Promise(resolve => { finish = resolve; }));
    const controller = new AbortController(), client = new CopilotReviewClient({ post });
    const pending = client.analyze([source], ['rule1'], ['Find ferrari.'], controller.signal);
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort(); await rejected; finish({ id: 'late' }); await Promise.resolve();
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('enforces the deadline even if the API ignores cancellation', async () => {
    jest.useFakeTimers(); const post = jest.fn(() => new Promise(() => undefined));
    const pending = new CopilotReviewClient({ post }).analyze([source], ['rule1'], ['Find ferrari.']);
    const rejected = expect(pending).rejects.toMatchObject({ code: 'REVIEW_TIMEOUT' });
    jest.advanceTimersByTime(120001); await rejected; expect(post).toHaveBeenCalledTimes(1);
  });
});
