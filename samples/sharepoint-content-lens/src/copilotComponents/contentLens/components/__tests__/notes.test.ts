import type { ReviewSource } from '../../domain/contracts';
import { sharePointPageContent } from '../../services/sharePointParsing';
import { pageParts } from '../../services/analysis';
import { pageNotes, noteRange } from '../notes';
import { checkLabels } from '../viewUtils';

const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');
beforeAll(() => { Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true }); });

const strings = new Proxy({ OutlineSection: 'Section {0}', A11ySubjectHeading: 'Heading “{0}”', A11ySubjectLink: 'Link “{0}”', 
  FreshnessStale: 'Saved {0} months ago', RuleLabel: 'Rule {0}' } as Record<string, string>, { get: (target, key: string) => target[key] || key }) as unknown as IContentLensStrings;
const NOW = Date.parse('2026-10-03T09:00:00Z');

function page(canvas: object[], modified: string = '2026-09-01T00:00:00Z'): ReviewSource {
  const content = sharePointPageContent(JSON.stringify(canvas), document, 'Office move FAQ');
  return { id: 'p', chunkId: 'p:0', siteUrl: 'https://x.invalid', listId: 'l', pageItemId: 1, kind: 'page', pageKind: 'page', pageTitle: 'Office move FAQ',
    text: content.text, createdAt: '2026-01-01T00:00:00Z', page: { version: '1.0', state: 'published', modified, structure: content.structure } };
}
const at = (zone: number, column: number = 1, factor: number = 12): object => ({ layoutIndex: 1, zoneIndex: zone, sectionIndex: column, controlIndex: 1, sectionFactor: factor });

describe('Notes on a page', () => {
  it('numbers Copilot findings and notes found without AI once, in page order, each in its block', () => {
    const source = page([
      { controlType: 4, id: 'b', position: at(2), innerHTML: '<h3>Parking</h3><p>Employees must collect permits. Details: <a href="/x">click here</a>.</p>' },
      { controlType: 4, id: 'a', position: at(1, 1, 8), innerHTML: '<p>The move starts on 11/03/2026.</p>' },
      { controlType: 3, id: 'w', position: at(1, 2, 4), webPartData: { title: 'Quick links' } }
    ]);
    const finding = (excerpt: string, categoryId: 'rule1' | 'rule2'): object => ({ id: excerpt, sourceId: 'p', chunkId: 'p:0', categoryId, excerpt, explanation: '',
      needsContext: false, offset: source.text.indexOf(excerpt) });
    const result = pageNotes({ sources: [source], findings: [finding('Employees must collect permits.', 'rule2'), finding('starts on 11/03/2026', 'rule1')] as never,
      decisions: [{ sourceId: 'p', chunkId: 'p:0', status: 'reviewed' }], rules: ['Write dates as 2 October 2026.', 'Address readers as you.'],
      labels: checkLabels(strings), strings, now: NOW });
    expect(result.notes.map(note => [note.n, note.label, note.blockId, note.mark])).toEqual([
      [1, 'Rule 1', 'a', 'starts on 11/03/2026'],
      [2, 'A11yLabel', 'b', 'Parking'],
      [3, 'Rule 2', 'b', 'Employees must collect permits.'],
      [4, 'A11yLabel', 'b', 'click here']
    ]);
    expect(result.notes[0]).toMatchObject({ before: 'The move ', after: '.', note: 'Write dates as 2 October 2026.', location: 'Section 1 · The move starts on 11/03/2026.' });
    expect(result.notes[1]).toMatchObject({ before: 'Heading “', after: '”', highlight: false, noAI: true });
    expect(noteRange(result.notes.filter(note => note.blockId === 'b'))).toBe('2–4');
    expect(result.counts).toMatchObject({ findings: 2, a11y: 2 });
  });

  it('says which parts Copilot checked, up to the first one it did not answer, and marks the blocks after it', () => {
    const body = Array.from({ length: 30 }, (_v, index) => ({ controlType: 4, id: 'b' + index, position: at(index + 1),
      innerHTML: `<h2>Section ${index}</h2><p>${'A sentence of policy text. '.repeat(20)}</p>` }));
    const parts = pageParts(page(body));
    expect(parts.length).toBeGreaterThan(2);
    const decisions = [{ sourceId: 'p', chunkId: parts[0].chunkId, status: 'reviewed' as const }, { sourceId: 'p', chunkId: parts[2].chunkId, status: 'reviewed' as const }];
    const result = pageNotes({ sources: parts, findings: [], decisions, rules: [], labels: checkLabels(strings), strings, now: NOW });
    expect(result.partsChecked).toBe(2);
    expect(result.checkedChars).toBe(parts[0].text.length);
    expect(result.blocks[0].notChecked).toBe(false);
    const second = parts[1].part!;
    const inSecond = result.blocks.filter(block => block.start! >= second.offset && block.end! <= second.offset + parts[1].text.length);
    expect(inSecond.length).toBeGreaterThan(0);
    expect(inSecond.every(block => block.notChecked)).toBe(true);
  });

  it('adds passed dates and an old version as notes found without AI', () => {
    const source = page([{ controlType: 4, id: 'a', position: at(1), innerHTML: '<p>Register by 15 September 2026 by e-mail.</p>' }], '2025-08-01T00:00:00Z');
    const result = pageNotes({ sources: [source], findings: [], decisions: [], rules: [], labels: checkLabels(strings), strings, now: NOW });
    expect(result.notes.map(note => [note.label, note.mark, note.note])).toEqual([
      ['FreshnessLabel', 'LocationPage', 'Saved 14 months ago'],
      ['FreshnessLabel', '15 September 2026', 'FreshnessPassed']
    ]);
    expect(result.counts).toMatchObject({ dates: 1, stale: 14 });
    // Every note found without AI names the check it came from.
    expect(result.notes.map(note => note.check)).toEqual(['lastSaved', 'datesPassed']);
  });

  it('leaves out the notes of a check that was turned off', () => {
    const source = page([{ controlType: 4, id: 'a', position: at(1), innerHTML: '<h4>Deep</h4><p>Register by 15 September 2026 by e-mail.</p>' }], '2025-08-01T00:00:00Z');
    const all = pageNotes({ sources: [source], findings: [], decisions: [], rules: [], labels: checkLabels(strings), strings, now: NOW });
    expect(all.notes.map(note => note.kind)).toEqual(['freshness', 'a11y', 'freshness']);
    const some = pageNotes({ sources: [source], findings: [], decisions: [], rules: [], labels: checkLabels(strings), strings, now: NOW, groups: ['layout'] });
    expect(some.notes.map(note => note.kind)).toEqual([]);
    expect(some.counts).toMatchObject({ a11y: 0, dates: 0 });
    expect(some.counts.stale).toBeUndefined();
  });

  it('names the check of every accessibility, layout and news note', () => {
    const words = Array.from({ length: 130 }, (_v, index) => 'w' + index).join(' ');
    const source = page([{ controlType: 4, id: 'a', position: at(1), innerHTML: `<h4>Deep</h4><p>${words}</p><p><a href="/x">click here</a></p>` }], '2026-09-01T00:00:00Z');
    source.pageKind = 'news';
    source.page!.news = { description: false, banner: false };
    const result = pageNotes({ sources: [source], findings: [], decisions: [], rules: [], labels: checkLabels(strings), strings, now: NOW });
    expect(result.notes.filter(note => note.noAI).every(note => !!note.check)).toBe(true);
    expect(result.notes.map(note => note.check).sort()).toEqual(['headingOrder', 'linkText', 'longParagraph', 'newsFacts', 'newsFacts']);
  });

  it('marks a block that runs past the stored text as not checked, even when every part was answered', () => {
    const source = page([{ controlType: 4, id: 'a', position: at(1), innerHTML: '<p>Short.</p>' }]);
    source.page!.structure!.sections[0].columns[0][0].end = source.text.length + 5000;
    const result = pageNotes({ sources: [source], findings: [], decisions: [{ sourceId: 'p', chunkId: 'p:0', status: 'reviewed' }], rules: [],
      labels: checkLabels(strings), strings, now: NOW });
    expect(result.blocks[0].notChecked).toBe(true);
  });

  it('adds layout suggestions in their blocks and a news post\'s missing description and image for the whole page', () => {
    const long = Array.from({ length: 130 }, (_v, index) => 'word' + index).join(' ');
    const source = page([{ controlType: 4, id: 'a', position: at(1), innerHTML: `<p>${long}</p>` }]);
    source.pageKind = 'news';
    source.page!.news = { description: false, banner: true };
    const result = pageNotes({ sources: [source], findings: [], decisions: [], rules: [], labels: checkLabels(strings), strings, now: NOW });
    expect(result.notes.map(note => [note.kind, note.mark, note.blockId])).toEqual([
      ['layout', 'LayoutSubjectNewsDescription', undefined],
      ['layout', 'word0 word1 word2 word3 word4 word5…', 'a']
    ]);
    expect(result.counts.layout).toBe(2);
  });
});
