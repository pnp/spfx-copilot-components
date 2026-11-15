import { attachLiveAdvisor, livePageAnchors, livePageUrl } from '../livePageDom';
import type { ReviewSource } from '../../domain/contracts';

const source: ReviewSource = { id: 'p', chunkId: 'p:0', siteUrl: 'https://tenant.sharepoint.com/sites/test',
  sourceUrl: 'https://tenant.sharepoint.com/sites/test/SitePages/Page.aspx?Mode=Edit#x', listId: '11111111-1111-1111-1111-111111111111',
  pageItemId: 1, pageKind: 'page', kind: 'page', pageTitle: 'Title', createdAt: '2026-10-18T10:00:00Z', text: 'Original text.',
  page: { version: '3.0', state: 'published', structure: { words: 2, textBlocks: 1, webParts: 0, issues: [],
    sections: [{ vertical: false, columns: [[{ id: 'saved-control', kind: 'text', label: 'Text', start: 0, end: 14 }]] }] } } };

describe('Real SharePoint page advisor', () => {
  beforeEach(() => { document.body.innerHTML = '<div data-sp-feature-instance-id="saved-control">Original text.</div>'; });
  afterEach(() => { document.body.innerHTML = ''; });
  it('loads only the chosen tenant page and strips edit mode and fragments', () => {
    expect(livePageUrl(source)).toBe('https://tenant.sharepoint.com/sites/test/SitePages/Page.aspx');
    ['https://elsewhere.example/SitePages/a.aspx', 'https://tenant.sharepoint.com/_api/web',
      'https://user:secret@tenant.sharepoint.com/sites/test/SitePages/a.aspx', 'https://tenant.sharepoint.com/sites/other/SitePages/a.aspx'].forEach(sourceUrl => {
      expect(livePageUrl({ ...source, sourceUrl })).toBeUndefined();
    });
  });
  it('matches actual control IDs and refuses changed, ambiguous or incomplete text', () => {
    expect(livePageAnchors(document, [source]).has('saved-control')).toBe(true);
    document.body.firstElementChild!.textContent = 'Newer text.';
    expect(livePageAnchors(document, [source]).size).toBe(0);
    document.body.firstElementChild!.textContent = 'Original text.';
    expect(livePageAnchors(document, [{ ...source, text: 'Original' }]).size).toBe(0);
    document.body.appendChild(document.body.firstElementChild!.cloneNode(true));
    expect(livePageAnchors(document, [source]).size).toBe(0);
  });
  it('matches a block with a table, whose cells the saved text and the rendered text separate differently', () => {
    document.body.innerHTML = '<div data-sp-feature-instance-id="saved-control"><p>Floors</p><table><tbody><tr><td>Floor 2</td><td>3 May</td></tr></tbody></table></div>';
    const table = { ...source, text: 'Floors\nFloor 2 3 May', page: { ...source.page!, structure: { ...source.page!.structure!, sections: [{ vertical: false,
      columns: [[{ id: 'saved-control', kind: 'text' as const, label: 'Text', start: 0, end: 20 }]] }] } } };
    expect(livePageAnchors(document, [table]).has('saved-control')).toBe(true);
    // Other wording is still another block.
    expect(livePageAnchors(document, [{ ...table, text: 'Floors\nFloor 2 4 May' }]).size).toBe(0);
  });
  it('matches an image CanvasControl by its saved ID without guessing from image URLs', () => {
    const imageSource = { ...source, page: { ...source.page!, structure: { ...source.page!.structure!, sections: [{ vertical: false,
      columns: [[{ id: 'saved-image', kind: 'webPart' as const, label: 'Image' }]] }] } } };
    document.body.innerHTML = '<div data-automation-id="CanvasControl" id="saved-image"><div data-automation-id="imageRead"><img src="/a.jpg"></div></div>';
    expect(livePageAnchors(document, [imageSource]).get('saved-image')).toBe(document.body.firstElementChild);
    document.body.appendChild(document.body.firstElementChild!.cloneNode(true));
    expect(livePageAnchors(document, [imageSource]).size).toBe(0);
    document.body.innerHTML = '<div id="saved-image"><img src="/a.jpg"></div>';
    expect(livePageAnchors(document, [imageSource]).size).toBe(0);
  });
  it('selects a finding from the real page, prevents source actions, and cleans up its listeners and overlay', () => {
    const select = jest.fn(), changes = jest.fn();
    const control = document.body.firstElementChild as HTMLElement;
    const advisor = attachLiveAdvisor(document, [source], select, changes, n => String(n));
    expect(advisor.update(['saved-control'], [])).toEqual([]);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    control.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true); expect(select).toHaveBeenCalledWith('saved-control');
    expect(advisor.update(['missing'], [])).toEqual(['missing']);
    advisor.dispose();
    expect(document.querySelector('[data-content-lens-advisor]')).toBeNull();
    const after = new MouseEvent('click', { bubbles: true, cancelable: true }); control.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });
  it('keeps other markers visible and selects the precise note when two notes share one block', () => {
    const control = document.body.firstElementChild as HTMLElement;
    jest.spyOn(control, 'getBoundingClientRect').mockReturnValue({ left: 20, top: 30, width: 400, height: 80, bottom: 110 } as DOMRect);
    const select = jest.fn(), advisor = attachLiveAdvisor(document, [source], select, () => undefined, n => String(n));
    const note = { n: 1, kind: 'finding' as const, before: '', mark: 'Original', after: '', highlight: true, label: 'Guideline', note: '', needsContext: false, noAI: false, blockId: 'saved-control', location: '' };
    advisor.update(['saved-control'], [note, { ...note, n: 2 }], 2);
    const buttons = document.querySelectorAll('[data-content-lens-advisor] button');
    expect(buttons).toHaveLength(2); expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    (buttons[0] as HTMLButtonElement).click(); expect(select).toHaveBeenCalledWith('saved-control', 1);
    expect((document.querySelector('[data-content-lens-block]') as HTMLElement).style.borderWidth).toBe('3px');
    advisor.update([], [note, { ...note, n: 2 }]);
    expect(document.querySelectorAll('[data-content-lens-advisor] button')).toHaveLength(2);
    advisor.dispose();
  });
  it('marks the wording of every finding, puts each number beside its wording, and tells Copilot from checks without AI', () => {
    const control = document.body.firstElementChild as HTMLElement;
    // The rendered text differs from the saved text in whitespace and is split over three text nodes.
    control.innerHTML = 'Original  <b>text</b>.';
    jest.spyOn(control, 'getBoundingClientRect').mockReturnValue({ left: 60, top: 30, width: 400, height: 80, bottom: 110 } as DOMRect);
    const ranges = Range.prototype as unknown as { getClientRects?: () => DOMRect[] };
    ranges.getClientRects = () => [{ left: 40, top: 50, width: 60, height: 16 } as DOMRect];
    const advisor = attachLiveAdvisor(document, [source], () => undefined, () => undefined, n => String(n));
    const finding = { n: 1, kind: 'finding' as const, before: '', mark: 'Original text.', after: '', highlight: true, label: 'Guideline', note: '', needsContext: false, noAI: false, blockId: 'saved-control', location: '' };
    const check = { ...finding, n: 2, kind: 'a11y' as const, mark: 'text', highlight: false, noAI: true };
    const wholeBlock = { ...check, n: 3, kind: 'layout' as const, mark: '' };
    advisor.update(['saved-control'], [finding, check, wholeBlock], 2);
    const wording = (n: number): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>(`[data-content-lens-phrase="${n}"]`));
    // One box for each text node of the finding; the wording of the unselected finding is marked as well.
    expect(wording(1).map(mark => mark.getAttribute('data-selected'))).toEqual(['false', 'false', 'false']);
    expect(wording(2).map(mark => mark.getAttribute('data-selected'))).toEqual(['true']);
    const tags = Array.from(document.querySelectorAll<HTMLElement>('[data-content-lens-advisor] button'));
    expect(tags.map(tag => tag.getAttribute('data-source'))).toEqual(['copilot', 'check', 'check']);
    // In the margin beside the line of the wording; numbers that would meet, and one without wording, are stacked below.
    expect(tags.map(tag => [tag.style.left, tag.style.top])).toEqual([['32px', '47px'], ['32px', '71px'], ['32px', '95px']]);
    // The frame is drawn around the block, so its border covers no text.
    const frame = document.querySelector('[data-content-lens-block]') as HTMLElement;
    expect([frame.style.left, frame.style.top, frame.style.width, frame.style.height]).toEqual(['56px', '26px', '408px', '88px']);
    // A page shown at half size gets marks of twice the size, so that they keep their size on screen.
    advisor.setScale(0.5);
    const scaled = document.querySelector<HTMLElement>('[data-content-lens-advisor] button')!;
    expect(scaled.style.height).toBe('44px');
    expect((document.querySelector('[data-content-lens-block]') as HTMLElement).style.borderWidth).toBe('6px');
    // A scale that gives fractional sizes still stacks the three numbers.
    advisor.setScale(0.67);
    expect(new Set(Array.from(document.querySelectorAll<HTMLElement>('[data-content-lens-advisor] button')).map(tag => tag.style.top)).size).toBe(3);
    advisor.dispose();
    delete ranges.getClientRects;
  });
  it('places the numbers in their own order whichever block is selected, and shrinks them to a narrow margin', () => {
    document.body.innerHTML = '<div data-sp-feature-instance-id="first">First.</div><div data-sp-feature-instance-id="second">Second.</div>';
    const [first, second] = Array.from(document.body.children) as HTMLElement[];
    const place = (left: number): void => {
      jest.spyOn(first, 'getBoundingClientRect').mockReturnValue({ left, top: 30, width: 400, height: 20, bottom: 50 } as DOMRect);
      jest.spyOn(second, 'getBoundingClientRect').mockReturnValue({ left, top: 40, width: 400, height: 20, bottom: 60 } as DOMRect);
    };
    place(60);
    const two = { ...source, text: 'First.\nSecond.', page: { ...source.page!, structure: { ...source.page!.structure!, sections: [{ vertical: false,
      columns: [[{ id: 'first', kind: 'text' as const, label: 'Text', start: 0, end: 6 }, { id: 'second', kind: 'text' as const, label: 'Text', start: 7, end: 14 }]] }] } } };
    const note = { n: 1, kind: 'finding' as const, before: '', mark: '', after: '', highlight: false, label: 'Insight', note: '', needsContext: false, noAI: false, blockId: 'first', location: '' };
    const advisor = attachLiveAdvisor(document, [two], () => undefined, () => undefined, n => String(n));
    // The second block is selected; the number of the first block still keeps its place, and the second number moves below it.
    advisor.update(['second'], [note, { ...note, n: 2, blockId: 'second' }], 2);
    const tags = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('[data-content-lens-advisor] button'));
    expect(tags().map(tag => [tag.textContent, tag.style.top])).toEqual([['1', '30px'], ['2', '54px']]);
    // A page at half size has numbers of 44 page pixels. A margin of 40 leaves room for 37: the numbers shrink and end before the text.
    place(40); advisor.setScale(0.5);
    for (const tag of tags()) {
      expect(parseFloat(tag.style.height)).toBeCloseTo(37, 5);
      expect(parseFloat(tag.style.left) + parseFloat(tag.style.minWidth)).toBeLessThan(40);
    }
    // In a margin too narrow for any number, they stay at 12 pixels on screen.
    place(10); advisor.setScale(0.4); advisor.setScale(0.5);
    expect(parseFloat(tags()[0].style.height)).toBeCloseTo(24, 5);
    advisor.dispose();
  });
  it('runs a light around the frame of a newly selected block, and not with reduced motion', () => {
    const control = document.body.firstElementChild as HTMLElement;
    jest.spyOn(control, 'getBoundingClientRect').mockReturnValue({ left: 60, top: 30, width: 400, height: 80, bottom: 110 } as DOMRect);
    const view = window as unknown as { CSS?: object; matchMedia?: unknown }, element = HTMLElement.prototype as unknown as { animate?: unknown };
    const animate = jest.fn(); let reduced = false;
    element.animate = animate; view.CSS = { registerProperty: jest.fn() }; view.matchMedia = () => ({ matches: reduced });
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const advisor = attachLiveAdvisor(document, [source], () => undefined, () => undefined, n => String(n));
    const rings = (): number => document.querySelectorAll('[data-content-lens-attention]').length;
    advisor.update(['saved-control'], []);
    expect(rings()).toBe(1); expect(animate.mock.calls[0][1]).toEqual({ duration: 1800, delay: -0, fill: 'forwards' });
    // A redraw, as on scroll, continues the same run instead of starting it again.
    clock.mockReturnValue(1600); advisor.update(['saved-control'], []);
    expect(rings()).toBe(1); expect(animate.mock.calls[1][1]).toEqual({ duration: 1800, delay: -600, fill: 'forwards' });
    clock.mockReturnValue(3000); advisor.update(['saved-control'], []);
    expect(rings()).toBe(0);
    reduced = true; advisor.update([], []); advisor.update(['saved-control'], []);
    expect(rings()).toBe(0);
    advisor.dispose(); clock.mockRestore();
    delete element.animate; delete view.CSS; delete view.matchMedia;
  });
  it('preserves iframe scroll when filtering and only scrolls for explicit selection requests', () => {
    const control = document.body.firstElementChild as HTMLElement;
    const scroll = jest.fn(); control.scrollIntoView = scroll;
    const advisor = attachLiveAdvisor(document, [source], () => undefined, () => undefined, n => String(n));
    advisor.update(['saved-control'], [], 1, 0); expect(scroll).not.toHaveBeenCalled();
    advisor.update(['saved-control'], [], 1, 1); expect(scroll).toHaveBeenCalledTimes(1);
    advisor.update([], [], undefined, 1);
    advisor.update(['saved-control'], [], 1, 1); expect(scroll).toHaveBeenCalledTimes(1);
    advisor.update(['saved-control'], [], 1, 2); expect(scroll).toHaveBeenCalledTimes(2);
    advisor.dispose();
  });
  it('scrolls to a selected anchor when SharePoint renders it after the metadata response', async () => {
    const control = document.body.firstElementChild as HTMLElement; control.remove();
    const scroll = jest.fn(); control.scrollIntoView = scroll;
    const advisor = attachLiveAdvisor(document, [source], () => undefined, () => undefined, n => String(n));
    advisor.update(['saved-control'], []);
    document.body.appendChild(control);
    await new Promise<void>(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
    expect(scroll).toHaveBeenCalledTimes(1);
    advisor.update(['saved-control'], []); expect(scroll).toHaveBeenCalledTimes(1);
    advisor.dispose();
  });

});
