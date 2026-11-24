import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PagePreview } from '../PagePreview';
import type { CategoryId, ReviewFinding, ReviewSource } from '../../domain/contracts';
import { pageNotes } from '../notes';

const act = (React as typeof React & { act: typeof import('react-dom/test-utils').act }).act;
const labels = new Proxy({}, { get: (_target, key) => String(key) });
const strings = new Proxy({}, { get: (_target, key) => key === 'Preview' || key === 'Comparison' ? labels : String(key) }) as IContentLensStrings;
const url = 'https://tenant.sharepoint.com/sites/test/SitePages/Test.aspx';
const source: ReviewSource = { id: 'p', chunkId: 'p:0', siteUrl: 'https://tenant.sharepoint.com/sites/test', sourceUrl: url,
  listId: '11111111-1111-1111-1111-111111111111', pageItemId: 1, pageKind: 'page', kind: 'page', pageTitle: 'Test',
  createdAt: '2026-10-18T10:00:00Z', text: 'Test', page: { version: '3.0', state: 'published' } };

describe('Production page iframe', () => {
  let root: Root, container: HTMLDivElement, doc: Document;
  const originalFetch = globalThis.fetch;
  beforeAll(() => {
    Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: class { observe(): void {} disconnect(): void {} } });
  });
  beforeEach(() => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    const fixture = document.createElement('iframe'); document.body.appendChild(fixture); doc = fixture.contentDocument!;
    Object.defineProperty(doc, 'URL', { configurable: true, value: url });
    doc.body.innerHTML = '<p>Actual SharePoint content</p>';
    globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ OData__UIVersionString: '3.0' }) } as Response));
  });
  afterEach(async () => { await act(async () => root.unmount()); document.body.replaceChildren(); globalThis.fetch = originalFetch; });
  async function load(extra: Partial<React.ComponentProps<typeof PagePreview>> = {}): Promise<HTMLIFrameElement> {
    await act(async () => root.render(<PagePreview sources={[source]} strings={strings} demo={false} width={640} onSelect={() => undefined} {...extra} />));
    const frame = container.querySelector('iframe')!;
    Object.defineProperty(frame, 'contentDocument', { configurable: true, value: doc });
    await act(async () => frame.dispatchEvent(new Event('load')));
    return frame;
  }
  it('renders the actual page URL, verifies the version, attaches the advisor and never falls back to reconstructed text', async () => {
    const frame = await load();
    expect(frame.src).toBe(url);
    expect(frame.sandbox?.value || frame.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('OData__UIVersionString'), expect.objectContaining({ credentials: 'same-origin' }));
    expect(doc.querySelector('[data-content-lens-advisor]')).not.toBeNull();
    expect(container.querySelector('[data-testid="saved-page-preview"]')).toBeNull();
    expect(container.textContent).not.toContain('unverifiedLive');
    await act(async () => root.unmount());
    expect(doc.querySelector('[data-content-lens-advisor]')).toBeNull();
    root = createRoot(container);
  });
  it.each([false, true])('only warns about a missing area when a finding references it, finding=%s', async hasFinding => {
    const note = { n: 1, kind: 'finding' as const, before: '', mark: 'Test', after: '', highlight: true, label: 'Guideline', note: 'Check this wording', needsContext: false, noAI: false, blockId: 'missing', location: '' };
    await load({ selected: 'missing', notes: hasFinding ? [note] : [] });
    expect(container.textContent!.includes('unmatchedLive')).toBe(hasFinding);
  });
  it('keeps source actions disabled and reports a changed page without applying old highlights', async () => {
    globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ OData__UIVersionString: '4.0' }) } as Response));
    await load();
    expect(container.textContent).toContain('changedLive');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true }); doc.body.firstElementChild!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
  it('reports inaccessible version metadata without losing the actual page', async () => {
    globalThis.fetch = jest.fn(async () => ({ ok: false } as Response));
    await load();
    expect(container.textContent).toContain('unverifiedLive'); expect(container.querySelector('iframe')?.src).toBe(url);
  });
  it('keeps demo content separate from a single selected finding and preserves paragraph highlights', async () => {
    const text = 'Parking\nFirst paragraph.\nSecond paragraph.';
    const saved: ReviewSource = { ...source, text, page: { ...source.page!, structure: { words: 5, textBlocks: 1, webParts: 0, issues: [],
      sections: [{ vertical: false, columns: [[{ id: 'parking', kind: 'text', label: 'Parking', start: 0, end: text.length }]] }] } } };
    const notes = [
      { n: 1, kind: 'finding' as const, before: '', mark: 'Parking\nFirst paragraph.\nSecond paragraph.', after: '', highlight: true, label: 'Guideline', note: 'Explain the parking process.', needsContext: false, noAI: false, blockId: 'parking', location: '' },
      { n: 2, kind: 'a11y' as const, before: '', mark: '', after: '', highlight: false, label: 'Heading', title: 'Use the right heading level', note: 'Review the heading level.', needsContext: false, noAI: true, blockId: 'parking', location: '' }
    ];
    function Review(): React.ReactElement {
      const [selected, setSelected] = React.useState(1);
      return <PagePreview sources={[saved]} strings={strings} demo width={1200} full notes={notes} selected="parking" selectedNote={selected}
        onSelect={() => undefined} onSelectNote={note => setSelected(note.n)} renderFinding={note => <p data-testid="selected-explanation">{note.note}</p>} />;
    }
    await act(async () => root.render(<Review />));
    const preview = container.querySelector('[data-testid="saved-page-preview"]')!;
    const block = preview.querySelector('[data-preview-block="parking"]')!;
    expect(block.textContent?.match(/Parking/g)).toHaveLength(1);
    expect(block.querySelectorAll('p')).toHaveLength(2);
    expect(Array.from(block.querySelectorAll('mark')).map(mark => mark.textContent)).toEqual(['Parking', 'First paragraph.', 'Second paragraph.']);
    const sidebar = container.querySelector('[data-testid="findings-sidebar"]')!;
    expect(sidebar.textContent).toContain('prepared');
    expect(sidebar.querySelector('[data-testid="copilot-findings"]')?.textContent).toContain('CopilotReviewLabel · 1');
    expect(sidebar.querySelector('[data-testid="automatic-findings"]')?.textContent).toContain('AutomaticChecksLabel · 1');
    // The number of a finding carries the look of its source, as on the page.
    expect(sidebar.querySelector('[data-testid="copilot-findings"] [data-source]')?.getAttribute('data-source')).toBe('copilot');
    expect(sidebar.querySelector('[data-testid="automatic-findings"] [data-source]')?.getAttribute('data-source')).toBe('check');
    expect(sidebar.querySelectorAll('button')[1].textContent).toContain('Use the right heading level');
    expect(sidebar.querySelectorAll('button')[1].textContent).not.toContain('Review the heading level.');
    expect(preview.textContent).not.toContain('Explain the parking process.');
    expect(container.querySelectorAll('[data-testid="selected-explanation"]')).toHaveLength(1);
    await act(async () => (sidebar.querySelectorAll('button')[1] as HTMLButtonElement).click());
    expect(container.querySelector('[data-testid="selected-explanation"]')?.textContent).toBe('Review the heading level.');
    expect(container.querySelector('[data-testid="saved-page-preview"]')).toBe(preview);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('lists findings beside the full iframe and selects individual notes without reloading it', async () => {
    const select = jest.fn();
    const note = { n: 1, kind: 'finding' as const, before: '', mark: 'Test', after: '', highlight: true, label: 'Guideline', note: 'Check this wording', needsContext: false, noAI: false, blockId: 'text', location: '' };
    await act(async () => root.render(<PagePreview sources={[source]} strings={strings} demo={false} width={1200} full notes={[note, { ...note, n: 2 }]}
      selected="text" selectedNote={1} onSelect={() => undefined} onSelectNote={select} />));
    const frame = container.querySelector('iframe');
    const buttons = container.querySelectorAll('[data-testid="findings-sidebar"] button');
    expect(buttons).toHaveLength(2); expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    await act(async () => (buttons[1] as HTMLButtonElement).click()); expect(select).toHaveBeenCalledWith(expect.objectContaining({ n: 2 }));
    const zoom = container.querySelector('select')!;
    await act(async () => { zoom.value = '75'; zoom.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('iframe')).toBe(frame); expect(frame?.style.transform).toBe('scale(0.75)');
  });

  it('shows each saved guideline instead of a repeated segment note and keeps its selected page highlight', async () => {
    const passages = ['The move starts on 11/03/2026.', 'You clearly have not followed the instructions.', 'Every issue will be resolved immediately.'];
    const saved = { ...source, text: passages.join('\n\n') };
    const rules = ['Use unambiguous written dates, such as 3 November 2026.', 'Avoid unsupported absolute service promises.'];
    const categories: CategoryId[] = ['rule1', 'aggressive', 'rule2'];
    // A stored result can carry the same segment note on all three findings.
    const findings: ReviewFinding[] = passages.map((excerpt, index) => ({ id: 'f' + index, sourceId: saved.id, chunkId: saved.chunkId,
      categoryId: categories[index], excerpt, explanation: 'Blaming wording creates an aggressive tone.',
      needsContext: false, offset: saved.text.indexOf(excerpt) }));
    const result = pageNotes({ sources: [saved], findings, decisions: [], rules, groups: [], strings,
      labels: { rule1: 'Guideline', rule2: 'Guideline', aggressive: 'Aggressive tone' } as Record<CategoryId, string>, now: Date.now() });
    expect(result.notes.map(note => note.note)).toEqual([rules[0], findings[1].explanation, rules[1]]);
    expect(result.notes.map(note => note.mark)).toEqual(passages);
    doc.body.innerHTML = passages.map(text => '<p>' + text + '</p>').join('');
    function Review(): React.ReactElement {
      const [selected, setSelected] = React.useState(1);
      return <PagePreview sources={[saved]} strings={strings} demo={false} width={1200} full notes={result.notes} selectedNote={selected}
        onSelect={() => undefined} onSelectNote={note => setSelected(note.n)} renderFinding={note => <p data-testid="selected-explanation">{note.note}</p>} />;
    }
    await act(async () => root.render(<Review />));
    const frame = container.querySelector('iframe')!;
    Object.defineProperty(frame, 'contentDocument', { configurable: true, value: doc });
    await act(async () => frame.dispatchEvent(new Event('load')));
    const buttons = container.querySelectorAll('[data-testid="findings-sidebar"] button');
    expect(Array.from(buttons).map(button => button.textContent)).toEqual([
      '1' + rules[0], '2' + findings[1].explanation, '3' + rules[1]
    ]);
    await act(async () => (buttons[2] as HTMLButtonElement).click());
    expect(container.querySelector('[data-testid="selected-explanation"]')?.textContent).toBe(rules[1]);
    expect(container.querySelector('iframe')).toBe(frame);
    expect(doc.querySelector('[data-content-lens-advisor]')).not.toBeNull();
    // Missing rule text must not revive an unrelated note from an old result.
    expect(pageNotes({ sources: [saved], findings: [findings[0]], decisions: [], rules: [], groups: [], strings,
      labels: {} as Record<CategoryId, string>, now: Date.now() }).notes[0].note).toBe('');
  });

});
