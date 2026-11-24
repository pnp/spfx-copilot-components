import type { PageOutlineItem, ReviewSource } from '../domain/contracts';
import type { PageNote } from './notes';
import { markFill, markInk, markLight, markRadius, markSource } from './markStyle';
import { savedBlockText } from './savedText';

// The saved text and the rendered text differ in whitespace only: the browser puts tabs between the cells of a table
// and line breaks between blocks. A block is the same block when its text without whitespace is the same.
const normalize = (text: string): string => text.replace(/\s+/g, '');

/**
 * The URL to embed for a source: its Site Pages document (.aspx) on the site's own https origin, without
 * credentials or port, and with query and hash removed. Any other URL gives undefined, so the card embeds
 * only a page of the selected site.
 */
export function livePageUrl(source: ReviewSource): string | undefined {
  try {
    const site = new URL(source.siteUrl);
    const url = new URL(source.sourceUrl || '');
    const sitePagesPath = site.pathname.replace(/\/$/, '').toLowerCase() + '/sitepages/';
    if (
      site.protocol !== 'https:' ||
      url.origin !== site.origin ||
      url.username ||
      url.password ||
      url.port ||
      !url.pathname.toLowerCase().startsWith(sitePagesPath) ||
      !/\.aspx$/i.test(url.pathname) ||
      Array.from(decodeURIComponent(url.pathname)).some(char => char === '\\' || char.charCodeAt(0) <= 32)
    ) {
      return undefined;
    }
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return undefined;
  }
}

/**
 * Finds each saved block on the live page by its saved control ID. A text block counts only when its rendered
 * text equals its complete saved text, so a block that changed since the check, or was saved only in part,
 * does not show the findings of the saved version.
 */
export function livePageAnchors(doc: Document, sources: ReviewSource[]): Map<string, HTMLElement> {
  const anchors = new Map<string, HTMLElement>();
  const structure = sources.find(source => source.page)?.page?.structure;
  const blocks = structure?.sections.reduce<PageOutlineItem[]>((all, section) => all.concat(...section.columns), []) || [];
  const elements = Array.from(doc.querySelectorAll<HTMLElement>('[data-sp-feature-instance-id]'));
  const canvasControls = Array.from(doc.querySelectorAll<HTMLElement>('[data-automation-id="CanvasControl"][id]'));
  for (const block of blocks) {
    const featureMatches = elements.filter(candidate => candidate.getAttribute('data-sp-feature-instance-id') === block.id);
    // Modern image web parts render as CanvasImg inside a CanvasControl, without a feature-instance attribute.
    // For a web part without a feature wrapper, the exact saved control ID finds the CanvasControl instead.
    const matches = featureMatches.length || block.kind === 'text'
      ? featureMatches
      : canvasControls.filter(control => control.id === block.id);
    if (matches.length !== 1) continue;
    const element = matches[0];
    if (block.kind === 'text') {
      const saved = savedBlockText(sources, block);
      if (!saved.complete || !saved.text.trim()) continue;
      if (normalize(element.innerText || element.textContent || '') !== normalize(saved.text)) continue;
    }
    anchors.set(block.id, element);
  }
  // The page header has its own saved location. This ID is the web part ID of the SharePoint title area.
  const headers = Array.from(doc.querySelectorAll<HTMLElement>('[data-sp-web-part-id]'))
    .filter(candidate => candidate.getAttribute('data-sp-web-part-id') === 'cbe7b0a9-3504-44dd-a3a3-0e5cacd07788');
  if (headers.length === 1) anchors.set('header', headers[0]);
  return anchors;
}

export interface LiveAdvisor {
  update(selected: string[], notes: PageNote[], selectedNote?: number, revealRequest?: number): string[];
  /** The scale at which the card shows the page. Marks keep their size on screen when the page is scaled down to fit. */
  setScale(pageScale: number): void;
  dispose(): void;
}

/**
 * A temporary overlay layer in the same-origin page. It adds only its own layer element, so saved SharePoint data
 * and the page text stay unchanged.
 * It frames every block that has a finding, marks the wording of every finding in the colour of its source,
 * and puts the number of the finding in the margin beside that wording. The selected finding is drawn stronger,
 * and a light runs twice around the frame of a newly selected block so that the eye finds it.
 */
export function attachLiveAdvisor(
  doc: Document,
  sources: ReviewSource[],
  onSelect: (id: string, noteNumber?: number) => void,
  onChange: (missing: string[]) => void,
  label: (n: number) => string
): LiveAdvisor {
  const win = doc.defaultView;
  if (!win || !doc.body) throw new Error('PAGE_FRAME_UNAVAILABLE');
  const layer = doc.createElement('div');
  layer.setAttribute('data-content-lens-advisor', '');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646;overflow:hidden;font:14px/1.4 "Segoe UI",sans-serif;color:#16324f';
  doc.body.appendChild(layer);
  let selected: string[] = [];
  let notes: PageNote[] = [];
  let lastScroll = '';
  let disposed = false;
  let selectedNote: number | undefined;
  let revealRequest: number | undefined;
  let lastRevealRequest = 0;
  let anchors = new Map<string, HTMLElement>();
  let frame = 0;
  // Sizes are in page pixels. One pixel on screen is screenPx page pixels at the current scale.
  let screenPx = 1;
  // The light animates an angle property, which the browser must be able to register.
  // It runs only with that support and when the user has not asked for reduced motion.
  const attentionMs = 1800;
  let attentionKey = '';
  let attentionAt = 0;
  let attentionTimer = 0;
  const registry = (win as unknown as { CSS?: { registerProperty?(definition: object): void } }).CSS;
  const canRunLight = !!registry?.registerProperty && !!win.matchMedia;
  if (canRunLight) {
    try {
      registry!.registerProperty!({ name: '--content-lens-turn', syntax: '<angle>', inherits: false, initialValue: '0deg' });
    } catch {
      // An earlier overlay registered it in this document.
    }
  }
  const draw = (): void => {
    frame = 0;
    if (disposed) return;
    anchors = livePageAnchors(doc, sources);
    const noteBlockIds = notes.reduce<string[]>((all, note) => note.blockId ? all.concat(note.blockId) : all, []);
    const ids = Array.from(new Set([...selected, ...noteBlockIds]));
    const missing = ids.filter(id => !anchors.has(id));
    layer.replaceChildren();
    // Frames are added first, then the wording, then the numbers, so that nothing covers a number.
    const wording: HTMLElement[] = [];
    const numbers: Array<{ id: string; note: PageNote; rect: DOMRect; areas: DOMRect[] }> = [];
    // The frame is drawn around the block with this padding, so its border leaves the first letters and the last line free.
    const pad = 4 * screenPx;
    for (const id of ids) {
      const element = anchors.get(id);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      const active = selected.indexOf(id) >= 0;
      if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > win.innerHeight) continue;
      const own = notes.filter(note => note.blockId === id);
      // The frame of the selected block takes the colour of the selected finding.
      const focus = active ? own.find(note => note.n === selectedNote) : undefined;
      let edge = '#8a8886';
      let tint = 'transparent';
      if (active) {
        edge = focus ? markInk[markSource(focus)] : '#323130';
        tint = `rgba(${focus ? markFill[markSource(focus)] : '50,49,48'},.08)`;
      }
      const box = doc.createElement('div');
      box.setAttribute('data-content-lens-block', id);
      box.setAttribute('data-selected', String(active));
      box.style.cssText = `position:absolute;left:${rect.left - pad}px;top:${rect.top - pad}px;width:${rect.width + 2 * pad}px;height:${rect.height + 2 * pad}px;box-sizing:border-box;border:${(active ? 3 : 1.5) * screenPx}px solid ${edge};border-radius:${4 * screenPx}px;background:${tint};box-shadow:${active ? `0 0 0 ${3 * screenPx}px #ffffffcc` : 'none'};pointer-events:none`;
      layer.appendChild(box);
      // Every redraw makes a new ring; the negative delay continues the run where it was.
      const elapsed = Date.now() - attentionAt;
      const withinLightRun = active && canRunLight && elapsed < attentionMs;
      if (withinLightRun && !win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const ring = doc.createElement('div');
        ring.setAttribute('data-content-lens-attention', '');
        ring.style.cssText = `position:absolute;inset:${-4 * screenPx}px;box-sizing:border-box;padding:${5 * screenPx}px;border-radius:${5 * screenPx}px;background:conic-gradient(from var(--content-lens-turn),transparent 0deg,transparent 200deg,${focus ? markLight[markSource(focus)] : '#ffffff'} 345deg,transparent 360deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none`;
        box.appendChild(ring);
        ring.animate?.(
          [
            { '--content-lens-turn': '0deg', opacity: 1 },
            { '--content-lens-turn': '576deg', opacity: 1, offset: 0.8 },
            { '--content-lens-turn': '720deg', opacity: 0 }
          ],
          { duration: attentionMs, delay: -elapsed, fill: 'forwards' }
        );
      }
      const text = own.some(note => note.mark) ? blockText(doc, element) : undefined;
      for (const note of own) {
        const source = markSource(note);
        const ink = markInk[source];
        const focused = selectedNote === note.n;
        const areas = text ? phraseRects(doc, text, note.mark) : [];
        for (const area of areas) {
          const mark = doc.createElement('div');
          mark.setAttribute('data-content-lens-phrase', String(note.n));
          mark.setAttribute('data-selected', String(focused));
          mark.style.cssText = `position:absolute;left:${area.left}px;top:${area.top}px;width:${area.width}px;height:${area.height}px;box-sizing:border-box;background:rgba(${markFill[source]},${focused ? 0.45 : 0.2});border-bottom:${(focused ? 2 : 1) * screenPx}px solid ${ink};pointer-events:none`;
          wording.push(mark);
        }
        numbers.push({ id, note, rect, areas });
      }
    }
    // The number sits in the left margin of its block, where it covers no text: beside the line where its wording
    // starts, or at the top of the block for a finding about the whole block. The numbers are placed in their own
    // order, whichever block is selected, and numbers that would meet are stacked.
    numbers.sort((a, b) => a.note.n - b.note.n);
    // A page scaled down to fit has a margin narrower than a full number. All numbers of the page then shrink to
    // the narrowest margin, down to 12 pixels on screen; one pixel stays free before the text and two at the page edge.
    const widest = (numbers.some(item => item.note.n > 9) ? 30 : 22) * screenPx;
    let fit = 1;
    if (numbers.length) {
      const narrowestMargin = Math.min(...numbers.map(item => item.rect.left)) - 3;
      fit = Math.min(1, Math.max(12 / 22, narrowestMargin / widest));
    }
    const size = 22 * screenPx * fit;
    const pitch = size + 2 * screenPx * fit;
    const placed: Array<{ left: number; top: number; width: number }> = [];
    const tags = numbers.map(({ id, note, rect, areas }) => {
      const source = markSource(note);
      const ink = markInk[source];
      const focused = selectedNote === note.n;
      // Beside the frame where the margin has room for it; in a narrow margin the number moves onto the frame's border.
      const width = (note.n > 9 ? 30 : 22) * screenPx * fit;
      const left = Math.max(2, rect.left - pad - 2 * screenPx * fit - width);
      let top = areas.length ? areas[0].top + (areas[0].height - size) / 2 : rect.top;
      // Each pass moves the number below one other number, so the passes are bounded; the margin of 0.01 absorbs rounding.
      for (let pass = 0; pass <= placed.length; pass++) {
        const other = placed.find(prior => prior.left < left + width && left < prior.left + prior.width
          && Math.abs(top - prior.top) < pitch - 0.01);
        if (!other) break;
        top = other.top + pitch;
      }
      placed.push({ left, top, width });
      const button = doc.createElement('button');
      button.type = 'button';
      button.textContent = String(note.n);
      button.setAttribute('aria-label', label(note.n));
      button.setAttribute('aria-pressed', String(focused));
      button.setAttribute('data-source', source);
      button.style.cssText = `position:absolute;left:${left}px;top:${top}px;box-sizing:border-box;min-width:${width}px;height:${size}px;margin:0;padding:0 ${3 * screenPx * fit}px;border:${1.5 * screenPx * Math.max(fit, 0.7)}px solid ${ink};border-radius:${markRadius(source, size)}px;background:${focused ? ink : 'white'};color:${focused ? 'white' : ink};box-shadow:0 0 0 ${1.5 * screenPx * fit}px #ffffffcc;font:${fit < 1 ? 700 : 600} ${fit < 1 ? size * 0.66 : 13 * screenPx}px/1 "Segoe UI",sans-serif;pointer-events:auto;cursor:pointer`;
      button.addEventListener('click', () => onSelect(id, note.n));
      return button;
    });
    wording.concat(tags).forEach(mark => layer.appendChild(mark));
    const scrollId = selected.join('|') + ':' + (selectedNote ?? '');
    const target = selected.map(id => anchors.get(id)).find(Boolean);
    // Without reveal requests the page scrolls to a new selection; with them, once for each new request.
    const reveal = revealRequest === undefined ? scrollId !== lastScroll : revealRequest !== lastRevealRequest;
    if (target && reveal) {
      lastScroll = scrollId;
      lastRevealRequest = revealRequest ?? 0;
      target.scrollIntoView?.({ block: 'center', behavior: 'auto' });
      if (!frame) frame = win.requestAnimationFrame(draw);
    }
    onChange(missing);
  };
  const schedule = (): void => {
    if (!frame && !disposed) frame = win.requestAnimationFrame(draw);
  };
  const observer = new MutationObserver(records => {
    if (records.some(record => !layer.contains(record.target))) schedule();
  });
  observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
  win.addEventListener('resize', schedule);
  doc.addEventListener('scroll', schedule, true);
  doc.addEventListener('load', schedule, true);
  // The embedded page is for review only. The guard cancels the page's own actions and navigation, and a click
  // on a matched block selects that block. Scrolling and text selection work as usual.
  const guard = (event: Event): void => {
    const target = event.target as Node | null;
    if (!target || layer.contains(target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === 'click') {
      const entry = Array.from(anchors).find(([, element]) => element.contains(target));
      if (entry) onSelect(entry[0]);
    }
  };
  const keyGuard = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'F2') guard(event);
  };
  const events = ['click', 'dblclick', 'auxclick', 'submit', 'beforeinput', 'drop'];
  events.forEach(event => doc.addEventListener(event, guard, true));
  doc.addEventListener('keydown', keyGuard, true);
  return {
    update(ids, nextNotes, nextSelectedNote, nextRevealRequest) {
      // A reveal request scrolls once, for the selection it came with. With nothing selected, or when the selection
      // changes under the same request number, the request counts as handled and the page keeps its scroll position.
      const sameRequest = nextRevealRequest === revealRequest;
      const selectionChanged = ids.join('|') !== selected.join('|');
      if (nextRevealRequest !== undefined && (!ids.length || (sameRequest && selectionChanged))) {
        lastRevealRequest = nextRevealRequest;
      }
      // The light starts when the selection changes, and a last redraw removes the ring after its run.
      const key = ids.join('|') + ':' + (nextSelectedNote ?? '');
      if (key !== attentionKey) {
        attentionKey = key;
        if (ids.length) {
          attentionAt = Date.now();
          win.clearTimeout(attentionTimer);
          attentionTimer = win.setTimeout(schedule, attentionMs + 50);
        }
      }
      selected = ids;
      notes = nextNotes;
      selectedNote = nextSelectedNote;
      revealRequest = nextRevealRequest;
      draw();
      return ids.filter(id => !anchors.has(id));
    },
    setScale(pageScale) {
      // A tag is 22 pixels on screen from a third of the page size up to 133%; beyond that it scales with the page.
      const inverseScale = 1 / (pageScale > 0 ? pageScale : 1);
      const next = Math.round(Math.min(3, Math.max(0.75, inverseScale)) * 100) / 100;
      if (next !== screenPx) {
        screenPx = next;
        draw();
      }
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      if (frame) win.cancelAnimationFrame(frame);
      win.clearTimeout(attentionTimer);
      win.removeEventListener('resize', schedule);
      doc.removeEventListener('scroll', schedule, true);
      doc.removeEventListener('load', schedule, true);
      events.forEach(event => doc.removeEventListener(event, guard, true));
      doc.removeEventListener('keydown', keyGuard, true);
      layer.remove();
    }
  };
}

/** The text of a block without its whitespace, and the text node and offset of every character kept. */
interface BlockText { text: string; nodes: Text[]; at: Array<[number, number]> }

function blockText(doc: Document, element: HTMLElement): BlockText {
  // 4 is NodeFilter.SHOW_TEXT: the walker visits text nodes only.
  const walker = doc.createTreeWalker(element, 4);
  const nodes: Text[] = [];
  const at: Array<[number, number]> = [];
  let text = '';
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const data = (node as Text).data;
    for (let i = 0; i < data.length; i++) {
      if (/\s/.test(data[i])) continue;
      text += data[i];
      at.push([nodes.length, i]);
    }
    nodes.push(node as Text);
  }
  return { text, nodes, at };
}

/**
 * The line boxes of a phrase that occurs exactly once in the block. The boxes come from DOM ranges, so SharePoint's
 * text nodes stay as they are. Whitespace is ignored: the saved text and the rendered text differ in line breaks and spaces.
 */
function phraseRects(doc: Document, block: BlockText, phrase: string): DOMRect[] {
  const wanted = phrase.replace(/\s+/g, '');
  const start = wanted ? block.text.indexOf(wanted) : -1;
  if (start < 0 || block.text.indexOf(wanted, start + 1) >= 0) return [];
  const [firstNode, firstOffset] = block.at[start];
  const [lastNode, lastOffset] = block.at[start + wanted.length - 1];
  const rects: DOMRect[] = [];
  // One range for each text node gives the boxes of the text lines only, not of the elements between them.
  for (let i = firstNode; i <= lastNode; i++) {
    const range = doc.createRange();
    range.setStart(block.nodes[i], i === firstNode ? firstOffset : 0);
    range.setEnd(block.nodes[i], i === lastNode ? lastOffset + 1 : block.nodes[i].length);
    if (range.getClientRects) {
      Array.from(range.getClientRects()).forEach(rect => {
        if (rect.width > 0 && rect.height > 0) rects.push(rect);
      });
    }
  }
  return rects;
}
