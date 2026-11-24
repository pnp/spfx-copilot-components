import type { ReviewSource } from '../../domain/contracts';
import { utf8Bytes } from '../../domain/policy';
import { categoryCodes } from '../../roundTrip/checks';
import { pageParts, prepareAnalysis, type Segment } from '../analysis';
import { categoryIds, type CategoryId } from '../../domain/contracts';
import type { ReviewAnswer } from '../../roundTrip/answerSchema';
import { ReviewClient, reviewProtocol, reviewRequestMaxBytes, reviewRuleInstructions, type IReviewRequest } from '../../roundTrip/reviewClient';
import { contentLensSources } from '../copilotReview';

const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');
interface Input { sourceId: string; chunkId: string; passages: Array<{ id: number; text: string }>; context: string; contextOmitted: boolean; }
function source(id: number, text: string = 'Only an idiot would approve this policy.'): ReviewSource {
  return { id: `source-${id}`, chunkId: `chunk-${id}`, siteUrl: 'https://example.invalid/sites/review', listId: 'pages', pageItemId: id,
    commentId: String(id), kind: 'comment', pageKind: 'news', pageTitle: 'Fictional policy', text, contextText: 'Fictional policy discussion.', createdAt: '2026-09-07T10:00:00Z' };
}
function uuid(index: number): string { return `00000000-0000-4000-8000-${(1000000000000 + index).toString().slice(1)}`; }
function finding(input: Input, overrides: object = {}): object { return { sourceId: input.sourceId, chunkId: input.chunkId, categoryId: 'insult', excerpt: 'Only an idiot', explanation: 'Possible personal insult.', needsContext: false, ...overrides }; }
function reviewed(inputs: Input[], findings: object[] = []): { review: string; note1: string; note2: string } {
  const items = findings as Array<{ sourceId: string; categoryId: CategoryId; excerpt: string; explanation: string; needsContext: boolean }>;
  const notes = inputs.map(input => items.find(item => item.sourceId === input.sourceId)?.explanation.slice(0, 48) || '');
  return {
    review: items.some(item => !inputs.some(input => input.sourceId === item.sourceId)) ? 's9:r:i@1' : inputs.map(input => {
      const flags = items.filter(item => item.sourceId === input.sourceId).map(item => {
        const passage = input.passages.find(part => part.text.includes(item.excerpt));
        return `${categoryCodes[item.categoryId]}${item.needsContext ? '?' : ''}@${passage?.id || 99}`;
      });
      return `${input.sourceId}:r:${flags.join(',') || '-'}`;
    }).join(';'), note1: notes[0] || '', note2: notes[1] || ''
  };
}
function blank(review: string = 'invalid'): { review: string; note1: string; note2: string } { return { review, note1: '', note2: '' }; }
type Respond = (inputs: Input[], attempt: number, request: IReviewRequest) => object | string | undefined | Promise<object | string | undefined>;

/** A transport that records every request and answers it. `undefined` leaves the request pending until it is aborted. */
class Harness {
  public readonly requests: IReviewRequest[] = [];
  public client: ReviewClient<ReviewSource>;
  private id = 0;
  public constructor(private readonly respond: Respond = inputs => reviewed(inputs), timeoutMs: number = 1000) {
    this.client = new ReviewClient<ReviewSource>({ sources: contentLensSources, timeoutMs, createRequestId: () => uuid(++this.id),
      send: async (request, signal) => {
        this.requests.push(request);
        const result = await this.respond(request.segments as Input[], this.requests.length, request);
        if (result === undefined) return new Promise<ReviewAnswer>((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError'))));
        return { requestId: request.requestId, ...(typeof result === 'string' ? blank(result) : result) } as ReviewAnswer;
      } });
  }
}

async function flush(): Promise<void> { for (let index = 0; index < 8; index++) await Promise.resolve(); }

describe('One request, one validated answer', () => {
  beforeAll(() => { Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true }); });
  afterEach(() => jest.useRealTimers());

  it('sends one request of up to eight segments and leaves every other source not reviewed', async () => {
    const harness = new Harness(inputs => reviewed(inputs, [finding(inputs[0])]));
    const result = await harness.client.analyze(Array.from({ length: 10 }, (_v, i) => source(i + 1)), ['insult'], []);
    expect(harness.requests).toHaveLength(1);
    expect(harness.requests[0].segments).toHaveLength(8);
    expect(result.findings).toHaveLength(1);
    expect(result.decisions.map(item => item.status)).toEqual([...Array(8).fill('reviewed'), 'notReviewed', 'notReviewed']);
  });

  it('never sends a repair request for an invalid reply', async () => {
    const harness = new Harness(() => blank('s2:r:-'));
    const result = await harness.client.analyze([source(1), source(2), source(3)], ['insult'], []);
    expect(harness.requests).toHaveLength(1);
    expect(result.findings).toEqual([]);
    expect(result.decisions.every(item => item.status === 'notReviewed')).toBe(true);
  });

  it('does not mark a long source reviewed from its first part', async () => {
    const harness = new Harness(inputs => reviewed(inputs));
    const original = source(1, 'Long source content. '.repeat(1800));
    const result = await harness.client.analyze([original, source(2)], ['insult'], []);
    expect(harness.requests).toHaveLength(1);
    expect(result.decisions.every(item => item.status === 'notReviewed')).toBe(true);
    expect(result.inputLimited).toBe(true);
  });

  it('times out a missing answer, names the request and sends nothing again', async () => {
    jest.useFakeTimers();
    const harness = new Harness(() => undefined);
    const waiting = harness.client.analyze([source(1), source(2), source(3)], ['insult'], []).catch(error => error);
    await flush(); jest.advanceTimersByTime(1001);
    expect(await waiting).toMatchObject({ code: 'REVIEW_TIMEOUT', requestId: uuid(1) });
    expect(harness.requests).toHaveLength(1);
  });

  it('refuses an answer that arrives after the deadline, even before the timeout callback runs', async () => {
    jest.useFakeTimers();
    let release: (value: object) => void = () => undefined;
    const harness = new Harness(() => new Promise<object>(resolve => { release = resolve; }), 50);
    const pending = harness.client.analyze([source(1)], ['insult'], []);
    const failure = expect(pending).rejects.toMatchObject({ code: 'REVIEW_TIMEOUT' }); await flush();
    jest.setSystemTime(Date.now() + 51);
    release(blank('s1:r:-'));
    await failure;
  });

  it('returns findings and decisions under the original source identities', async () => {
    const harness = new Harness(inputs => reviewed(inputs, [finding(inputs[0])]));
    const result = await harness.client.analyze([source(1)], ['insult'], []);
    expect(result.provenance).toBe('copilotChat');
    expect(result.requestId).toBe(harness.requests[0].requestId);
    expect(result.findings[0]).toMatchObject({ sourceId: 'source-1', chunkId: 'chunk-1', excerpt: source(1).text });
    expect(result.decisions).toEqual([{ sourceId: 'source-1', chunkId: 'chunk-1', status: 'reviewed' }]);
    expect(harness.requests).toHaveLength(1);
    expect(JSON.stringify(harness.requests[0])).toContain('Only an idiot would approve this policy.');
    expect(utf8Bytes(JSON.stringify(harness.requests[0]))).toBeLessThanOrEqual(reviewRequestMaxBytes);
  });

  it('carries only this request\'s data; rules travel only when selected', async () => {
    const harness = new Harness();
    await harness.client.analyze([source(1)], ['insult', 'aggressive'], []);
    expect(Object.keys(harness.requests[0])).toEqual(['protocol', 'requestId', 'checks', 'segments']);
    expect(harness.requests[0]).toMatchObject({ protocol: reviewProtocol, checks: ['insult', 'aggressive'] });
    // Rules travel as data with their result codes, plus the codes as a request-level hint.
    await harness.client.analyze([source(2)], ['insult', 'rule1', 'rule2'], ['Flag vague promises.', 'Write dates as 2 October 2026.']);
    expect(Object.keys(harness.requests[1])).toEqual(['protocol', 'requestId', 'checks', 'rules', 'instructions', 'segments']);
    expect(harness.requests[1]).toMatchObject({ checks: ['insult', 'rule1', 'rule2'], instructions: reviewRuleInstructions,
      rules: [{ id: 'rule1', code: 'v', text: 'Flag vague promises.' }, { id: 'rule2', code: 'w', text: 'Write dates as 2 October 2026.' }] });
    expect(reviewRuleInstructions).toContain('v@3-4.9.12');
  });

  it('reviews seven URL-identified comments using compact wire IDs and maps every result to its original', async () => {
    const harness = new Harness(inputs => reviewed(inputs, inputs.map(input => finding(input))));
    const originals = Array.from({ length: 7 }, (_v, index) => ({
      ...source(index + 1), id: 'https://example.invalid/sites/review|list|page|comment|' + index,
      chunkId: 'https://example.invalid/sites/review|list|page|comment|' + index + ':part:1'
    }));
    const result = await harness.client.analyze(originals, ['insult', 'aggressive'], []);
    expect(harness.requests.map(request => request.segments.length)).toEqual([7]);
    expect((harness.requests[0].segments as Input[]).map(segment => segment.sourceId)).toEqual(['s1', 's2', 's3', 's4', 's5', 's6', 's7']);
    expect(JSON.stringify(harness.requests[0])).not.toContain('https://');
    expect(result.findings.map(item => item.sourceId)).toEqual(originals.map(item => item.id));
    expect(result.decisions.map(item => item.chunkId)).toEqual(originals.map(item => item.chunkId));
  });

  it('bounds the request with every check, five maximum rules, Unicode and escaped source text', async () => {
    const harness = new Harness();
    const originals = Array.from({ length: 7 }, (_v, index) => source(index + 1, '🧭\\\"\n'.repeat(300)));
    const result = await harness.client.analyze(originals, [...categoryIds], Array.from({ length: 5 }, () => '🧭'.repeat(100)));
    expect(result.decisions).toHaveLength(7);
    expect(harness.requests).toHaveLength(1);
    expect(result.inputLimited).toBe(true);
    for (const request of harness.requests) expect(utf8Bytes(JSON.stringify(request))).toBeLessThanOrEqual(reviewRequestMaxBytes);
  });

  it('keeps every page part reviewable within the request budget with five CJK rules and every check', async () => {
    const harness = new Harness();
    const page: ReviewSource = { ...source(1, ('界"\\\n'.repeat(40) + '\n\n').repeat(60)), kind: 'page', commentId: undefined, contextText: undefined };
    const rules = Array.from({ length: 5 }, () => '界'.repeat(200));
    const parts = pageParts(page, [...categoryIds], rules);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.map(part => part.text).join('')).toBe(page.text);
    for (const part of parts) {
      const result = await harness.client.analyze([part], [...categoryIds], rules);
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].status).toBe('reviewed');
      expect(result.inputLimited).toBe(false);
    }
    expect(harness.requests).toHaveLength(parts.length);
    for (const request of harness.requests) expect(utf8Bytes(JSON.stringify(request))).toBeLessThanOrEqual(reviewRequestMaxBytes);
  });

  it.each(['界'.repeat(1000), '\u0001'.repeat(1000)])('fits one large rule and long source text within the request budget (%#)', async rule => {
    const harness = new Harness();
    const result = await harness.client.analyze([source(1, '界'.repeat(7000))], ['rule1'], [rule]);
    expect(result.inputLimited).toBe(true);
    expect(result.decisions[0].status).toBe('notReviewed');
    expect(harness.requests[0].rules![0].text).toBe(rule);
    expect((harness.requests[0].segments[0] as Input).passages[0].text.length).toBeGreaterThan(0);
    expect(utf8Bytes(JSON.stringify(harness.requests[0]))).toBeLessThanOrEqual(reviewRequestMaxBytes);
  });

  it('accepts reviewed-with-no-findings and bounds the request to eight segments and 8KB', async () => {
    const harness = new Harness();
    const result = await harness.client.analyze(Array.from({ length: 21 }, (_v, i) => source(i + 1)), ['insult'], []);
    expect(result.findings).toHaveLength(0);
    expect(result.decisions.map(item => item.status)).toEqual([...Array(8).fill('reviewed'), ...Array(13).fill('notReviewed')]);
    expect(harness.requests).toHaveLength(1);
    expect(harness.requests[0].segments).toHaveLength(8);
    expect(utf8Bytes(JSON.stringify(harness.requests[0].segments))).toBeLessThanOrEqual(8192);
  });

  it('sends nothing and reviews nothing when no source has reviewable text', async () => {
    const harness = new Harness();
    const result = await harness.client.analyze([source(1, '')], ['insult'], []);
    expect(harness.requests).toHaveLength(0);
    expect(result.decisions).toEqual([{ sourceId: 'source-1', chunkId: 'chunk-1', status: 'notReviewed' }]);
    expect(result.inputLimited).toBe(true);
  });

  it('sends rules as bounded review criteria and never serializes author profiles or routing metadata to the model', async () => {
    const harness = new Harness();
    const item = { ...source(1), author: { displayName: 'PRIVATE_AUTHOR' } };
    await harness.client.analyze([item], ['rule1'], ['Flag vague promises.']);
    const serialized = JSON.stringify(harness.requests);
    expect(serialized).toContain('Flag vague promises.');
    expect(serialized).not.toContain('PRIVATE_AUTHOR');
    expect(serialized).not.toContain(item.siteUrl);
    expect(Object.keys(harness.requests[0].segments[0]).sort()).toEqual(['chunkId', 'context', 'contextOmitted', 'passages', 'sourceId']);
  });

  const invalidCases: Array<{ name: string; output: (inputs: Input[]) => object | string }> = [
    { name: 'invented source IDs', output: inputs => reviewed(inputs, [finding(inputs[0], { sourceId: 'invented' })]) },
    { name: 'invented excerpts', output: inputs => reviewed(inputs, [finding(inputs[0], { excerpt: 'not present' })]) },
    { name: 'unselected categories', output: inputs => reviewed(inputs, [finding(inputs[0], { categoryId: 'hate' })]) },
    { name: 'duplicate decisions', output: () => blank('s1:r:-;s1:r:-') },
    { name: 'omitted decisions', output: () => blank('-') },
    { name: 'extra decisions', output: () => blank('s1:r:-;s2:r:-') },
    { name: 'refusal rather than verdicts', output: () => 'refusal' }
  ];
  for (const example of invalidCases) it(`leaves the request not reviewed for ${example.name}, without a repair request`, async () => {
    const harness = new Harness(inputs => example.output(inputs));
    const result = await harness.client.analyze([source(1)], ['insult'], []);
    expect(harness.requests).toHaveLength(1);
    expect(result.decisions[0].status).toBe('notReviewed');
    expect(result.findings).toHaveLength(0);
  });

  it('preserves supplementary Unicode, caps five parts per source and discloses omitted long source text', async () => {
    const harness = new Harness();
    const original = source(1, '🧭'.repeat(12000));
    const result = await harness.client.analyze([original], ['insult'], []);
    const admitted = prepareAnalysis([original], ['insult']).batches.reduce<Segment[]>((all, batch) => all.concat(batch), []);
    expect(admitted).toHaveLength(5);
    const parts = harness.requests[0].segments as Input[];
    expect(parts).toHaveLength(1);
    for (const part of parts) { const text = part.passages.map(passage => passage.text).join(''); expect(text).toBe('🧭'.repeat(text.length / 2)); }
    expect(result.inputLimited).toBe(true);
    expect(result.decisions[0].status).toBe('notReviewed');
  });

  it('keeps omitted-context findings uncertain and the original source not reviewed', async () => {
    const harness = new Harness(inputs => reviewed(inputs, [finding(inputs[0])]));
    const result = await harness.client.analyze([{ ...source(1), contextText: 'ä'.repeat(1000) }], ['insult'], []);
    expect((harness.requests[0].segments as Input[])[0]).toMatchObject({ context: '', contextOmitted: true });
    expect(result.inputLimited).toBe(true); expect(result.findings[0].needsContext).toBe(true); expect(result.decisions[0].status).toBe('notReviewed');
  });

  it('admits at most thirty sources per review and reports the rest as not reviewed', async () => {
    const harness = new Harness();
    const result = await harness.client.analyze(Array.from({ length: 31 }, (_v, i) => source(i + 1)), ['insult'], []);
    expect(JSON.stringify(harness.requests)).not.toContain('source-31');
    expect(result.decisions).toHaveLength(31); expect(result.decisions[30].status).toBe('notReviewed'); expect(result.inputLimited).toBe(true);
  });

  it.each([
    ['an answer to another request', { requestId: uuid(999) }],
    ['an unknown field', { extra: 'untrusted' }],
    ['an oversized review', { review: 'x'.repeat(177) }],
    ['an oversized note', { note1: 'x'.repeat(49) }]
  ])('rejects %s as no answer at all', async (_name, change) => {
    const harness = new Harness(inputs => ({ ...reviewed(inputs), ...change }));
    await expect(harness.client.analyze([source(1)], ['insult'], [])).rejects.toMatchObject({ code: 'REVIEW_API_RESPONSE', requestId: uuid(1) });
    expect(harness.requests).toHaveLength(1);
  });

  it('explicit cancellation stops the pending request and starts no further requests', async () => {
    const controller = new AbortController(); const harness = new Harness(() => undefined);
    const pending = harness.client.analyze(Array.from({ length: 21 }, (_v, i) => source(i + 1)), ['insult'], [], controller.signal);
    const failure = expect(pending).rejects.toMatchObject({ name: 'AbortError' }); await flush(); controller.abort(); await failure;
    expect(harness.requests).toHaveLength(1);
  });

  it('teardown rejects the pending request and refuses a new one', async () => {
    const harness = new Harness(() => undefined);
    const pending = harness.client.analyze([source(1)], ['insult'], []);
    const failure = expect(pending).rejects.toMatchObject({ name: 'AbortError' }); await flush(); harness.client.dispose(); await failure;
    await expect(harness.client.analyze([source(2)], ['insult'], [])).rejects.toMatchObject({ code: 'REVIEW_DISPOSED' });
    expect(harness.requests).toHaveLength(1);
  });

  it('never exposes a raw transport error', async () => {
    const harness = new Harness(() => { throw new Error('PRIVATE_PROVIDER_ERROR'); });
    const failure = await harness.client.analyze([source(1)], ['insult'], []).catch(error => error);
    expect(failure).toMatchObject({ code: 'REVIEW_SEND_FAILED', requestId: uuid(1) });
    expect(String(failure.message)).not.toContain('PRIVATE');
  });

  it('rejects invalid input, already-aborted reviews and concurrent analyses without dispatch', async () => {
    const harness = new Harness(() => undefined); const controller = new AbortController(); controller.abort();
    await expect(harness.client.analyze([source(1)], [], [])).rejects.toMatchObject({ code: 'REVIEW_CHECKS_REQUIRED' });
    await expect(harness.client.analyze([source(1)], ['rule1'], [' '])).rejects.toMatchObject({ code: 'REVIEW_CHECKS_REQUIRED' });
    await expect(harness.client.analyze([source(1)], ['insult'], ['A rule without its check'])).rejects.toMatchObject({ code: 'REVIEW_CHECKS_REQUIRED' });
    await expect(harness.client.analyze([source(1)], ['rule2'], ['Rule 2 without rule 1'])).rejects.toMatchObject({ code: 'REVIEW_CHECKS_REQUIRED' });
    await expect(harness.client.analyze([source(1), source(1)], ['insult'], [])).rejects.toMatchObject({ code: 'REVIEW_DUPLICATE_SOURCES' });
    // A later part of a page never carries the page facts; such a source is not a part of that page.
    const forged: ReviewSource = { ...source(1), kind: 'page', commentId: undefined, contextText: undefined, part: { index: 2, count: 2, offset: 10 }, page: { version: '1.0', state: 'published' } };
    await expect(harness.client.analyze([forged], ['insult'], [])).rejects.toMatchObject({ code: 'REVIEW_INVALID_SOURCES' });
    await expect(harness.client.analyze([source(1)], ['insult'], [], controller.signal)).rejects.toMatchObject({ name: 'AbortError' }); expect(harness.requests).toHaveLength(0);
    const pending = harness.client.analyze([source(1)], ['insult'], []); const failure = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await expect(harness.client.analyze([source(1)], ['insult'], [])).rejects.toMatchObject({ code: 'REVIEW_BUSY' }); harness.client.dispose(); await failure;
  });
});
