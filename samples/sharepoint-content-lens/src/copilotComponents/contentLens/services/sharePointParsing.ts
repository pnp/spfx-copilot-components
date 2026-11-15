import type { AccessibilityIssue, LayoutIssue, PageOutlineSection, PageStructure } from '../domain/contracts';
import { layoutLimits, maxNotesPerGroup } from '../domain/checkCatalog';

/** Parsing of SharePoint REST responses. HTML is parsed in inert template elements, outside the host document. */
export function sharePointRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('SHAREPOINT_RESPONSE_INVALID');
  return value as Record<string, unknown>;
}

export function sharePointEntity(body: unknown): Record<string, unknown> {
  const outer = sharePointRecord(body);
  return outer.d ? sharePointRecord(outer.d) : outer;
}

export function sharePointCollection(body: unknown): { rows: Record<string, unknown>[]; next?: string } {
  const entity = sharePointEntity(body);
  const value = entity.value || entity.results;
  if (!Array.isArray(value)) throw new Error('SHAREPOINT_COLLECTION_INVALID');
  const next = entity['@odata.nextLink'] || entity['odata.nextLink'] || entity.__next;
  if (next !== undefined && typeof next !== 'string') throw new Error('SHAREPOINT_CONTINUATION_INVALID');
  return { rows: value.map(sharePointRecord), next: next as string | undefined };
}

export function sharePointText(html: string, targetDocument: Document): string {
  // A template's content is inert: its scripts do not run and its resources do not load.
  const template = targetDocument.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script,style,iframe,object,embed').forEach(node => node.remove());
  template.content.querySelectorAll('br').forEach(node => node.replaceWith(targetDocument.createTextNode('\n')));
  // A space after each table cell keeps the last word of one cell apart from the first word of the next.
  template.content.querySelectorAll('td,th').forEach(node => node.appendChild(targetDocument.createTextNode(' ')));
  template.content.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,tr')
    .forEach(node => node.appendChild(targetDocument.createTextNode('\n')));
  return (template.content.textContent || '').replace(/\u00a0/g, ' ').replace(/[\t ]+/g, ' ')
    .replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function sharePointCommentText(row: Record<string, unknown>, targetDocument: Document): string {
  if (typeof row.text !== 'string') throw new Error('COMMENT_TEXT_MISSING');
  let text = sharePointText(row.text, targetDocument);
  // The mentions are an array, or an object with a `results` array (verbose OData).
  const rawMentions = row.mentions;
  let mentions: unknown[] = [];
  if (Array.isArray(rawMentions)) {
    mentions = rawMentions;
  } else if (rawMentions && typeof rawMentions === 'object' && Array.isArray((rawMentions as Record<string, unknown>).results)) {
    mentions = (rawMentions as { results: unknown[] }).results;
  }
  // The text marks a mention as @mention{n}, where n indexes the mentions array.
  text = text.replace(/@mention\{(\d+)\}/g, (original: string, index: string) => {
    const mention = mentions[Number(index)];
    if (!mention || typeof mention !== 'object') return original;
    const name = (mention as Record<string, unknown>).name;
    return typeof name === 'string' ? `@${name}` : original;
  });
  return text;
}

function containsUnsafeUrlCharacters(value: string): boolean {
  return Array.from(value).some(character => character === '\\' || character.charCodeAt(0) <= 32);
}

export function validateSharePointSiteUrl(siteUrl: string, tenantUrl: string): string {
  if (!tenantUrl) throw new Error('SHAREPOINT_TENANT_SCOPE_UNAVAILABLE');
  let site: URL;
  let tenant: URL;
  try {
    site = new URL(siteUrl);
    tenant = new URL(tenantUrl);
  } catch {
    throw new Error('SHAREPOINT_SITE_URL_INVALID');
  }
  const decoded = decodeURIComponent(siteUrl);
  if (site.protocol !== 'https:' || tenant.protocol !== 'https:' || site.origin !== tenant.origin) {
    throw new Error('SHAREPOINT_SITE_URL_INVALID');
  }
  if (site.port || site.username || site.password || site.search || site.hash || containsUnsafeUrlCharacters(decoded)) {
    throw new Error('SHAREPOINT_SITE_URL_INVALID');
  }
  // A site URL has no dot segments and does not point into the API, a layouts page or a page file.
  if (/(?:^|\/)\.{1,2}(?:\/|$)/.test(decoded) || /\/_api(?:\/|$)|\/_layouts(?:\/|$)|\.aspx(?:\/|$)/i.test(site.pathname)) {
    throw new Error('SHAREPOINT_SITE_URL_INVALID');
  }
  return `${site.origin}${site.pathname.replace(/\/+$/, '')}`;
}

export function validateSharePointPageUrl(fileRef: unknown, siteUrl: string): string {
  if (typeof fileRef !== 'string' || !fileRef) throw new Error('SHAREPOINT_PAGE_URL_OUT_OF_SCOPE');
  const page = new URL(fileRef, siteUrl);
  const site = new URL(siteUrl);
  const sitePath = `${site.pathname.replace(/\/$/, '')}/`.toLowerCase();
  if (page.origin !== site.origin || page.username || page.password || page.search || page.hash || page.port ||
    !page.pathname.toLowerCase().startsWith(sitePath)) {
    throw new Error('SHAREPOINT_PAGE_URL_OUT_OF_SCOPE');
  }
  return page.toString();
}

/**
 * Resolves a next link. The link must stay on the same endpoint of the same site and keep the
 * request's $select, $expand, $orderby and $filter values.
 */
export function sharePointContinuation(next: string, currentUrl: string, siteUrl: string): string {
  const current = new URL(currentUrl);
  const resolved = new URL(next, currentUrl);
  const site = new URL(siteUrl);
  if (resolved.origin !== site.origin || resolved.username || resolved.password || resolved.hash || resolved.port) {
    throw new Error('SHAREPOINT_CONTINUATION_OUT_OF_SCOPE');
  }
  if (decodeURIComponent(resolved.pathname).toLowerCase() !== decodeURIComponent(current.pathname).toLowerCase()) {
    throw new Error('SHAREPOINT_CONTINUATION_OUT_OF_SCOPE');
  }
  const apiRoot = `${site.pathname.replace(/\/$/, '')}/_api/`.toLowerCase();
  if (!resolved.pathname.toLowerCase().startsWith(apiRoot) || containsUnsafeUrlCharacters(decodeURIComponent(resolved.pathname))) {
    throw new Error('SHAREPOINT_CONTINUATION_OUT_OF_SCOPE');
  }
  for (const name of ['$select', '$expand', '$orderby', '$filter']) {
    const expected = current.searchParams.get(name);
    const actual = resolved.searchParams.get(name);
    if (expected !== null && actual !== expected) throw new Error('SHAREPOINT_CONTINUATION_QUERY_CHANGED');
  }
  return resolved.toString();
}

const genericLinkText = ['click here', 'here', 'more', 'read more', 'learn more', 'link', 'this link', 'details',
  'hier', 'hier klicken', 'mehr', 'weiterlesen', 'mehr erfahren', 'mehr lesen', 'details anzeigen'];
/** The Image web part; its alternative text is a plain property. */
const imageWebPartId = 'd1d91016-032f-456d-98a4-721247c305e8';
/** The Hero web part; each of its tiles can carry an image with alternative text. */
const heroWebPartId = 'c4bd7b2f-7b6e-4599-8485-16504575f590';
/** Web parts that are meant to repeat: by component id (Image, Divider), else by title. */
const repeatableWebPartIds = [imageWebPartId, '2161a1c6-db61-4731-b97c-3cdb303f7cbb'];
const repeatableWebParts = /^(divider|spacer|trennlinie|abstandhalter|text|image|bild)$/i;

/**
 * Hero tiles that show an image whose alternative text is saved and empty, as 1-based tile numbers. Tiles
 * are read from the known places only, `properties.content[i]` and the flattened `serverProcessedContent`
 * keys, and each tile counts once.
 */
function heroTilesWithoutAlt(data: Record<string, unknown>): number[] {
  const record = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const properties = record(data.properties);
  const processed = record(data.serverProcessedContent);
  const texts = record(processed.searchablePlainTexts);
  const images = record(processed.imageSources);
  const tiles = Array.isArray(properties.content) ? properties.content.slice(0, 20) : [];
  const missing: number[] = [];
  tiles.forEach((raw, index) => {
    const tile = record(raw);
    const image = record(tile.image);
    const hasImage = [images[`content[${index}].image.url`], image.url, tile.imageSrc]
      .some(value => typeof value === 'string' && !!value.trim());
    const alts = [tile.alternateText, texts[`content[${index}].alternateText`]]
      .filter((value): value is string => typeof value === 'string');
    if (hasImage && tile.isDecorative !== true && alts.length && alts.every(alt => !alt.trim())) missing.push(index + 1);
  });
  return missing;
}
const maxSections = 50;
const maxItemsPerColumn = 50;
const clip = (text: string, length: number): string =>
  text.length > length ? text.slice(0, length - 1).replace(/\s+$/, '') + '…' : text;
/** A short block name: whole words up to about 30 characters, then an ellipsis. */
const clipWords = (text: string, length: number): string => {
  if (text.length <= length) return text;
  const cut = text.slice(0, length + 1).replace(/\s+\S*$/, '');
  return (cut.length >= length / 2 ? cut : text.slice(0, length)).replace(/[\s,.;:–-]+$/, '') + '…';
};
const plainText = (value: string | undefined): string => (value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

interface PlacedControl {
  control: Record<string, unknown>;
  index: number;
  layout: number;
  zone: number;
  column: number;
  order: number;
  factor?: number;
}

/** The canvas controls in visual order. The stored array can be in any order. */
function placedControls(controls: unknown[]): PlacedControl[] {
  const numberOr = (value: unknown, fallback: number): number => typeof value === 'number' && isFinite(value) ? value : fallback;
  return controls.map((raw, index) => {
    const control = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    const position = control.position && typeof control.position === 'object' ? control.position as Record<string, unknown> : {};
    // The column width in twelfths, when the canvas saves one.
    const factor = typeof position.sectionFactor === 'number' && position.sectionFactor >= 1 && position.sectionFactor <= 12
      ? Math.round(position.sectionFactor)
      : undefined;
    return {
      control,
      index,
      layout: numberOr(position.layoutIndex, 1),
      zone: numberOr(position.zoneIndex, 1),
      column: numberOr(position.sectionIndex, 1),
      order: numberOr(position.controlIndex, index),
      factor
    };
  }).sort((a, b) => a.layout - b.layout || a.zone - b.zone || a.column - b.column || a.order - b.order || a.index - b.index);
}

function webPartTitle(control: Record<string, unknown>): string {
  const data = control.webPartData && typeof control.webPartData === 'object' ? control.webPartData as Record<string, unknown> : {};
  return typeof data.title === 'string' ? data.title.trim() : '';
}

export interface IPageContent {
  text: string;
  omittedParts: string[];
  structure?: PageStructure;
}

/**
 * The canvas controls of a page, in either stored form. A list item's `CanvasContent1` is HTML: one
 * `data-sp-canvascontrol` element per control, its settings in `data-sp-controldata` (JSON), a text
 * block's HTML inside `data-sp-rte`, a web part's data in `data-sp-webpartdata` (JSON). The page API
 * returns the same controls as a JSON array. Returns undefined for older HTML without canvas controls,
 * and when a control's settings cannot be read or some text sits outside a text control: the caller
 * then reads the text alone and leaves the layout unchecked.
 */
export function canvasControls(canvas: string, targetDocument: Document): unknown[] | undefined {
  const trimmed = canvas.trim();
  if (trimmed.startsWith('[')) {
    const parsed: unknown = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : undefined;
  }
  const template = targetDocument.createElement('template');
  template.innerHTML = canvas;
  const nodes = Array.from(template.content.querySelectorAll('[data-sp-canvascontrol]'));
  if (!nodes.length) return undefined;
  const record = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
  const json = (value: string | null): Record<string, unknown> | undefined => {
    try {
      return record(JSON.parse(value || ''));
    } catch {
      return undefined;
    }
  };
  // An element belongs to the nearest control around it, so a nested control keeps its own parts.
  const own = (node: Element, selector: string): Element | undefined =>
    Array.from(node.querySelectorAll(selector)).find(element => element.closest('[data-sp-canvascontrol]') === node);
  const controls: unknown[] = [];
  let textElements = 0;
  for (const node of nodes) {
    const data = json(node.getAttribute('data-sp-controldata'));
    // Settings that cannot be read: the text-only reading keeps every text block, and the layout stays unchecked.
    if (!data) return undefined;
    if (data.controlType === 4) {
      // Older pages also keep the text block's HTML in its settings; the `data-sp-rte` element is what renders.
      const rte = own(node, '[data-sp-rte]');
      let innerHTML = '';
      if (rte) {
        textElements++;
        innerHTML = rte.innerHTML;
      } else if (typeof data.innerHTML === 'string') {
        innerHTML = data.innerHTML;
      }
      controls.push({ ...data, innerHTML });
      continue;
    }
    const part = own(node, '[data-sp-webpartdata]');
    if (!part) {
      controls.push(data);
      continue;
    }
    // Stored HTML keeps a web part's searchable texts, HTML, links and images in `data-sp-htmlproperties`,
    // not in its JSON; they are put back into `serverProcessedContent`, where the page API returns them.
    const webPartData = json(part.getAttribute('data-sp-webpartdata')) || {};
    const processed = record(webPartData.serverProcessedContent) || {};
    const texts = { ...record(processed.searchablePlainTexts) };
    const htmlStrings = { ...record(processed.htmlStrings) };
    const links = { ...record(processed.links) };
    const imageSources = { ...record(processed.imageSources) };
    const holder = own(node, '[data-sp-htmlproperties]');
    Array.from(holder ? holder.children : []).forEach(child => {
      const name = child.getAttribute('data-sp-prop-name');
      if (!name) return;
      if (child.tagName === 'A') links[name] = child.getAttribute('href') || '';
      else if (child.tagName === 'IMG') imageSources[name] = child.getAttribute('src') || '';
      else if (child.getAttribute('data-sp-searchableplaintext') === 'true') texts[name] = child.textContent || '';
      else htmlStrings[name] = child.innerHTML;
    });
    controls.push({
      ...data,
      webPartData: {
        ...webPartData,
        serverProcessedContent: { ...processed, searchablePlainTexts: texts, htmlStrings, links, imageSources }
      }
    });
  }
  // Page text outside the text controls is read only by the text-only reading, so return undefined then.
  // Text in web part properties is not page text.
  const pageText = Array.from(template.content.querySelectorAll('[data-sp-rte]'))
    .filter(element => !element.closest('[data-sp-webpart]'));
  return pageText.length === textElements ? controls : undefined;
}

/**
 * The page's text in reading order, what was left out, and its layout and accessibility basics.
 * The text is the title, then each text block, separated by blank lines; every text block in the
 * structure carries its offsets in that text. Structure is best effort: an unexpected shape leaves
 * it undefined, and the text stays the same. Only text-block HTML and the alternative texts of the
 * Image and Hero web parts are inspected; other web parts are counted, not checked.
 */
export function sharePointPageContent(canvas: unknown, targetDocument: Document, title: string): IPageContent {
  if (typeof canvas !== 'string') throw new Error('PAGE_EDITORIAL_TEXT_UNAVAILABLE');
  let text = title;
  const append = (part: string): number => {
    const start = text ? text.length + 2 : 0;
    text = text ? text + '\n\n' + part : part;
    return start;
  };
  const omittedParts: string[] = [];
  if (!canvas.trim()) return { text, omittedParts };
  const controls = canvasControls(canvas, targetDocument);
  if (!controls) {
    const template = targetDocument.createElement('template');
    template.innerHTML = canvas;
    const textControls = template.content.querySelectorAll('[data-sp-rte]');
    textControls.forEach(node => {
      const part = sharePointText(node.innerHTML, targetDocument);
      if (part) append(part);
    });
    template.content.querySelectorAll('[data-sp-webpart]')
      .forEach((_node, index) => omittedParts.push(`Dynamic or custom web part ${index + 1}`));
    template.content.querySelectorAll('img,video,iframe')
      .forEach((_node, index) => omittedParts.push(`Embedded media ${index + 1}`));
    if (!textControls.length && !omittedParts.length) throw new Error('PAGE_CANVAS_FORMAT_UNSUPPORTED');
    return { text, omittedParts };
  }
  const placed = placedControls(controls);
  const sections: PageOutlineSection[] = [];
  const sectionKeys: string[] = [];
  const factors: Array<Array<number | undefined>> = [];
  const issues: AccessibilityIssue[] = [];
  const linkTargets = new Map<string, Set<string>>();
  const ambiguous = new Set<string>();
  const ids = new Set<string>();
  const issue = (value: AccessibilityIssue): void => {
    if (issues.length < maxNotesPerGroup) issues.push(value);
  };
  const layoutNotes: LayoutIssue[] = [];
  const note = (value: LayoutIssue): void => {
    if (layoutNotes.length < maxNotesPerGroup) layoutNotes.push(value);
  };
  // Web parts by type (the component id, else the title), and the columns the canvas actually defines.
  const webPartTypes = new Map<string, { title: string; count: number }>();
  const explicit: boolean[][] = [];
  const headingOnly = new Set<string>();
  let structureFailed = false;
  let words = 0;
  let textBlocks = 0;
  let webParts = 0;
  let headingLevel = 1;
  for (const { control, index, layout, zone, column, factor } of placed) {
    const isText = control.controlType === 4 && typeof control.innerHTML === 'string';
    // Control type 14 holds section backgrounds, not content.
    const isWebPart = !isText && control.controlType !== undefined && control.controlType !== 0 && control.controlType !== 14;
    if (!isText && isWebPart) {
      const title = webPartTitle(control);
      omittedParts.push(title ? `Web part “${title.slice(0, 80)}”` : `Web part ${index + 1}`);
    }
    const blockText = isText ? sharePointText(control.innerHTML as string, targetDocument) : '';
    const start = blockText ? append(blockText) : undefined;
    if (isText) {
      const template = targetDocument.createElement('template');
      template.innerHTML = control.innerHTML as string;
      template.content.querySelectorAll('img,video,iframe,object,embed').forEach((_node, mediaIndex) =>
        omittedParts.push(`Embedded media ${mediaIndex + 1} in text control ${index + 1}`));
    }
    if (structureFailed) continue;
    // Page settings, section backgrounds and other unplaced controls are not part of the layout.
    if (control.pageSettingsSlice || control.controlType === 14 || (!isText && !isWebPart && !control.position)) continue;
    try {
      const key = `${layout}|${zone}`;
      let sectionIndex = sectionKeys.indexOf(key);
      if (sectionIndex < 0) {
        if (sections.length >= maxSections) continue;
        sectionKeys.push(key);
        sections.push({ vertical: layout === 2, columns: [] });
        factors.push([]);
        explicit.push([]);
        sectionIndex = sections.length - 1;
      }
      const columns = sections[sectionIndex].columns;
      const columnIndex = Math.max(0, Math.min(9, Math.round(column) - 1));
      while (columns.length <= columnIndex) columns.push([]);
      if (control.position && typeof control.position === 'object') explicit[sectionIndex][columnIndex] = true;
      const columnKey = sectionIndex + '|' + columnIndex;
      if (factor !== undefined && factors[sectionIndex][columnIndex] === undefined) {
        factors[sectionIndex][columnIndex] = factor;
      }
      const items = columns[columnIndex];
      const rawId = typeof control.id === 'string' && control.id.trim() ? control.id.trim().slice(0, 64) : 'b' + index;
      const id = ids.has(rawId) ? rawId.slice(0, 56) + '-' + index : rawId;
      if (isText) {
        const blockWords = (blockText.match(/\S+/g) || []).length;
        words += blockWords;
        textBlocks++;
        ids.add(id);
        const where = clip(blockText.replace(/\s+/g, ' '), 40);
        // An offset in the page text, for ordering notes; falls back to the start of the block.
        const at = (subject: string): number | undefined =>
          start === undefined ? undefined : start + Math.max(0, subject ? blockText.indexOf(subject) : 0);
        const template = targetDocument.createElement('template');
        template.innerHTML = control.innerHTML as string;
        let firstHeading = '';
        template.content.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(node => {
          const level = Number(node.tagName.slice(1));
          const label = clip(plainText(node.textContent || undefined), 120);
          if (!firstHeading) firstHeading = label;
          if (!label) {
            issue({ kind: 'headingEmpty', where, blockId: id, at: at('') });
          } else if (level === 1) {
            issue({ kind: 'headingTitleLevel', where, text: label, blockId: id, at: at(label) });
          } else if (level > headingLevel + 1) {
            issue({ kind: 'headingSkip', where, text: label, from: headingLevel, to: level, blockId: id, at: at(label) });
          }
          headingLevel = Math.max(1, level);
        });
        template.content.querySelectorAll('a').forEach(node => {
          const label = plainText(node.textContent || undefined);
          const plain = label.toLowerCase().replace(/[\s:.!›»>]+$/, '');
          const href = node.getAttribute('href') || '';
          if (genericLinkText.indexOf(plain) >= 0) {
            issue({ kind: 'linkText', where, text: clip(label, 120), blockId: id, at: at(label) });
          } else if (/^(https?:\/\/|www\.)/i.test(label)) {
            issue({ kind: 'linkUrl', where, text: clip(label, 120), blockId: id, at: at(label) });
          }
          // The same link text that leads to different targets is reported once.
          if (plain && href) {
            const targets = linkTargets.get(plain) || new Set<string>();
            targets.add(href);
            linkTargets.set(plain, targets);
            if (targets.size > 1 && !ambiguous.has(plain)) {
              ambiguous.add(plain);
              issue({ kind: 'linkAmbiguous', where, text: clip(label, 120), blockId: id, at: at(label) });
            }
          }
        });
        template.content.querySelectorAll('img').forEach(node => {
          if (!node.hasAttribute('alt')) issue({ kind: 'imageAlt', where, blockId: id, at: at('') });
        });
        // A table needs a header row so screen readers can name its columns.
        template.content.querySelectorAll('table').forEach(node => {
          if (!node.querySelector('th')) {
            issue({ kind: 'tableHeader', where, blockId: id, at: at(plainText(node.querySelector('td')?.textContent || undefined)) });
          }
        });
        // A link needs a name a screen reader can say: its text, a label, a title or an image's alternative text.
        template.content.querySelectorAll('a[href]').forEach(node => {
          // aria-labelledby names a link only through elements that exist and have text.
          const referencedText = (ref: string): string => plainText(
            template.content.getElementById?.(ref)?.textContent ||
            template.content.querySelector(`[id="${ref.replace(/"/g, '')}"]`)?.textContent ||
            undefined);
          const labelledBy = (node.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
            .map(ref => referencedText(ref)).join('');
          const named = !!plainText(node.textContent || undefined) ||
            !!(node.getAttribute('aria-label') || '').trim() ||
            !!labelledBy ||
            !!(node.getAttribute('title') || '').trim() ||
            Array.from(node.querySelectorAll('img')).some(image => !!(image.getAttribute('alt') || '').trim());
          if (!named) issue({ kind: 'linkEmpty', where, blockId: id, at: at('') });
        });
        // Layout: a long block needs headings, a long paragraph needs breaking up.
        // A short block with a heading, just above in the same column, counts as the heading of this block.
        const hasHeading = !!template.content.querySelector('h1,h2,h3,h4,h5,h6');
        if (blockWords > layoutLimits.blockWords && !hasHeading && !headingOnly.has(columnKey)) {
          note({ kind: 'longBlock', where, blockId: id, at: at(''), words: blockWords });
        }
        if (hasHeading && blockWords <= layoutLimits.headingBlockWords) headingOnly.add(columnKey);
        else headingOnly.delete(columnKey);
        template.content.querySelectorAll('p,li').forEach(node => {
          // A list item counts its own words: its paragraphs and nested lists are counted on their own.
          const ownContent = node.cloneNode(true) as Element;
          if (node.tagName === 'LI') ownContent.querySelectorAll('ul,ol,p').forEach(child => child.remove());
          const paragraph = plainText(ownContent.textContent || undefined);
          const count = (paragraph.match(/\S+/g) || []).length;
          if (count > layoutLimits.paragraphWords) {
            note({ kind: 'longParagraph', where: clipWords(paragraph, 40), blockId: id, at: at(paragraph.slice(0, 30)), words: count });
          }
        });
        if (items.length < maxItemsPerColumn) {
          items.push({
            kind: 'text', label: firstHeading || clipWords(blockText.replace(/\s+/g, ' '), 30), words: blockWords, id,
            ...(start !== undefined ? { start, end: start + blockText.length } : {})
          });
        }
      } else if (isWebPart) {
        webParts++;
        ids.add(id);
        const label = webPartTitle(control) ? clip(webPartTitle(control), 120) : '';
        const data = control.webPartData && typeof control.webPartData === 'object' ? control.webPartData as Record<string, unknown> : {};
        const properties = data.properties && typeof data.properties === 'object' ? data.properties as Record<string, unknown> : {};
        const type = String(data.id || control.webPartId || '').toLowerCase();
        headingOnly.delete(columnKey);
        // Only a present, empty alternative text is reported. A missing property is not reported.
        if (type === imageWebPartId) {
          const processed = data.serverProcessedContent && typeof data.serverProcessedContent === 'object'
            ? data.serverProcessedContent as Record<string, unknown>
            : {};
          const texts = processed.searchablePlainTexts && typeof processed.searchablePlainTexts === 'object'
            ? processed.searchablePlainTexts as Record<string, unknown>
            : {};
          const alts = [properties.altText, texts.altText].filter((value): value is string => typeof value === 'string');
          if (properties.isDecorative !== true && alts.length && alts.every(alt => !alt.trim())) {
            issue({ kind: 'imageWebPartAlt', where: label || 'Image', blockId: id });
          }
        }
        if (type === heroWebPartId) {
          heroTilesWithoutAlt(data)
            .forEach(tile => issue({ kind: 'heroImageAlt', where: label || 'Hero', text: String(tile), blockId: id }));
        }
        if (label && repeatableWebPartIds.indexOf(type) < 0 && !repeatableWebParts.test(label)) {
          const group = webPartTypes.get(type || label) || { title: label, count: 0 };
          webPartTypes.set(type || label, { title: group.title, count: group.count + 1 });
        }
        if (items.length < maxItemsPerColumn) items.push({ kind: 'webPart', label, id });
      }
    } catch {
      structureFailed = true;
    }
  }
  if (structureFailed) return { text, omittedParts };
  // Empty space on the page: a section without content, or a column left empty next to content.
  // Only columns the canvas defines count; a gap in the column numbers is not an empty column.
  sections.forEach((section, index) => {
    const defined = section.columns.map((_column, column) => !!explicit[index]?.[column]);
    const empty = section.columns.map((column, columnIndex) => defined[columnIndex] && column.length === 0);
    const allDefinedEmpty = section.columns.every((column, columnIndex) => !defined[columnIndex] || column.length === 0);
    if (defined.some(Boolean) && allDefinedEmpty) {
      note({ kind: 'emptySection', where: '', section: index + 1 });
    } else if (empty.some(Boolean)) {
      note({ kind: 'emptyColumn', where: '', section: index + 1, count: empty.filter(Boolean).length });
    }
  });
  webPartTypes.forEach(group => {
    if (group.count >= layoutLimits.repeatedWebParts) note({ kind: 'repeatedWebParts', where: group.title, count: group.count });
  });
  // Column widths in twelfths; a section without them shows equal columns.
  sections.forEach((section, index) => {
    const known = factors[index];
    if (section.columns.length > 1 && known.some(value => value !== undefined)) {
      const equalWidth = Math.max(1, Math.round(12 / section.columns.length));
      section.factors = section.columns.map((_column, columnIndex) => known[columnIndex] || equalWidth);
    }
  });
  return { text, omittedParts, structure: { words, textBlocks, webParts, sections, issues, layout: layoutNotes } };
}
