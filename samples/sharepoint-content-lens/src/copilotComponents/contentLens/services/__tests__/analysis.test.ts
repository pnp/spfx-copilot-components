import type { ReviewSource } from '../../domain/contracts';
import { pageParts, prepareAnalysis } from '../analysis';
import { categoryIds } from '../../domain/contracts';
import { sourceSchema } from '../../domain/sourceSchema';

const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');

function page(text: string): ReviewSource {
  return { id: 'page-1', chunkId: 'page-1:0', siteUrl: 'https://example.invalid', listId: 'pages', pageItemId: 1, kind: 'page', pageKind: 'page',
    pageTitle: 'Hybrid work guidelines', text, createdAt: '2026-09-26T00:00:00Z', omittedParts: ['Web part “Hero”'],
    page: { version: '3.0', state: 'published' } };
}

describe('Long pages part by part', () => {
  beforeAll(() => { Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true }); });

  it('keeps a page that fits one request whole', () => {
    const source = page('Short page.\n\nOne block.');
    expect(pageParts(source)).toEqual([source]);
  });

  it('splits a long page at blocks into parts that each fit one request, in order and without losing text', () => {
    const block = (index: number): string => `Section ${index}\n` + `Sentence ${index} explains the rule in plain words. `.repeat(12).trim();
    const text = Array.from({ length: 40 }, (_v, index) => block(index + 1)).join('\n\n');
    const parts = pageParts(page(text));
    expect(parts.length).toBeGreaterThan(2);
    expect(parts.map(part => part.text).join('')).toBe(text);
    parts.forEach((part, index) => {
      expect(part).toMatchObject({ id: 'page-1', chunkId: `page-1:0:p${index + 1}`, part: { index: index + 1, count: parts.length } });
      expect(text.slice(part.part!.offset, part.part!.offset + part.text.length)).toBe(part.text);
      const prepared = prepareAnalysis([part], ['rule1']);
      expect(prepared.batches).toHaveLength(1);
      expect(prepared.limitedKeys.size).toBe(0);
      if (index < parts.length - 1) expect(part.text.endsWith('\n\n')).toBe(true);
      expect(sourceSchema.safeParse(part).success).toBe(true);
    });
    expect(parts[0].page).toBeDefined();
    expect(parts[1].page).toBeUndefined();
    expect(parts[1].omittedParts).toBeUndefined();
  });

  it('fits every part into one request even for a long block without breaks, with every check and five rules', () => {
    const text = 'Title\n\n' + 'x'.repeat(18000) + '\n\n' + 'Ends here. '.repeat(400);
    const parts = pageParts(page(text));
    expect(parts.map(part => part.text).join('')).toBe(text);
    for (const part of parts) {
      const prepared = prepareAnalysis([part], [...categoryIds]);
      expect(prepared.batches).toHaveLength(1);
      expect(prepared.batches[0]).toHaveLength(1);
      expect(prepared.limitedKeys.size).toBe(0);
    }
  });

  it('never splits a character outside the basic plane between two parts', () => {
    const text = '🧭'.repeat(9000);
    const parts = pageParts(page(text));
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/.test(part.text)).toBe(false);
  });

  it('keeps 40,000 characters of Chinese text in parts that each fit one request, without an oversized last part', () => {
    const text = Array.from({ length: 400 }, (_v, index) => '会议日程安排'.repeat(16) + index + '。').join('\n\n').slice(0, 40000);
    const parts = pageParts(page(text));
    expect(parts.length).toBeGreaterThan(10);
    expect(parts.map(part => part.text).join('')).toBe(text);
    for (const part of parts) expect(prepareAnalysis([part], [...categoryIds]).batches).toHaveLength(1);
  });
});
