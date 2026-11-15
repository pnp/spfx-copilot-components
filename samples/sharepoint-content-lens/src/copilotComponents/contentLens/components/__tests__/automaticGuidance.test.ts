import { accessibilityKinds, layoutKinds, type ReviewSource } from '../../domain/contracts';
import { pageNotes } from '../notes';
import { sharePointPageContent } from '../../services/sharePointParsing';
import { checkLabels } from '../viewUtils';

const { readFileSync } = jest.requireActual<{ readFileSync(path: string, encoding: 'utf8'): string }>('fs');
const { resolve } = jest.requireActual<{ resolve(...paths: string[]): string }>('path');
function localized(locale: string): IContentLensStrings {
  let result: IContentLensStrings;
  // Load the shipped AMD resource, not a mock that could hide missing templates.
  // eslint-disable-next-line no-new-func
  new Function('define', readFileSync(resolve(__dirname, '../../loc/' + locale + '.js'), 'utf8'))(
    (_deps: unknown, factory: () => IContentLensStrings) => { result = factory(); });
  return result!;
}
const now = Date.parse('2026-11-08T12:00:00Z');
function source(): ReviewSource {
  const content = sharePointPageContent(JSON.stringify([
    { controlType: 4, id: 'intro', position: { zoneIndex: 1, sectionIndex: 1, controlIndex: 1 }, innerHTML: '<h2>Your move</h2><p>Prepare for the move.</p>' },
    { controlType: 4, id: 'ready', position: { zoneIndex: 1, sectionIndex: 1, controlIndex: 2 }, innerHTML: '<h4>Getting ready</h4><p>Register by 15 September 2026.</p>' }
  ]), document, 'Move notice');
  return { id: 'p', chunkId: 'p', kind: 'page', siteUrl: 'https://tenant.sharepoint.com', listId: 'l', pageItemId: 1,
    pageKind: 'page', pageTitle: 'Move notice', text: content.text, createdAt: '2025-01-01T00:00:00Z',
    page: { version: '1.0', state: 'published', modified: '2025-01-01T00:00:00Z', structure: content.structure } };
}

describe.each(['en-us', 'de-de'])('Publisher guidance (%s)', locale => {
  const strings = localized(locale);
  const notes = (page: ReviewSource): ReturnType<typeof pageNotes> => pageNotes({ sources: [page], findings: [], decisions: [], rules: [], labels: checkLabels(strings), strings, now });
  it('explains the observed heading jump and preserves its page anchor', () => {
    const page = source();
    const note = notes(page).notes.find(n => n.check === 'headingOrder')!;
    expect(note.note).toContain('Getting ready');
    for (const level of ['2', '4', '3']) expect(note.note).toContain(level);
    expect(note.blockId).toBe('ready');
    expect(note.mark).toBe('Getting ready');
    expect(note.noAI).toBe(true);
    expect(note.title).toBeTruthy();
    delete page.page!.structure!.issues[0].from;
    delete page.page!.structure!.issues[0].to;
    const unknown = notes(page).notes.find(n => n.check === 'headingOrder')!;
    expect(unknown.note).toBe(strings.A11yNoteHeadingSkip);
    expect(unknown.note).not.toMatch(/\{\d+\}/);
  });
  it('provides localized guidance for every automatic finding without inventing AI results', () => {
    const page = source();
    const structure = page.page!.structure!;
    structure.issues = accessibilityKinds.map(kind => ({ kind, where: 'Getting ready', blockId: 'ready', text: 'Example', from: 2, to: 4 }));
    structure.layout = layoutKinds.map(kind => ({ kind, where: 'Getting ready', blockId: 'ready', words: 129, count: 4, section: 1 }));
    page.pageKind = 'news'; page.page!.news = { description: false, banner: false };
    const result = notes(page);
    const kinds = [...accessibilityKinds, ...layoutKinds, 'newsDescription', 'newsBanner', 'datePassed', 'stale'];
    expect(Object.keys(strings.AutomaticTitles).sort()).toEqual([...kinds].sort());
    expect(result.notes).toHaveLength(kinds.length);
    expect(result.counts.findings).toBe(0);
    expect(result.partsChecked).toBe(0);
    for (const note of result.notes) {
      expect(note.title!.length).toBeGreaterThan(10);
      expect(note.title!.length).toBeLessThan(85);
      expect(note.note.length).toBeGreaterThan(note.title!.length);
      expect(note.note).not.toMatch(/\{\d+\}|undefined/);
      expect(note.noAI).toBe(true);
    }
    const paragraph = result.notes.find(n => n.title === strings.AutomaticTitles.longParagraph)!;
    expect(paragraph.note).toContain('129');
  });
});
