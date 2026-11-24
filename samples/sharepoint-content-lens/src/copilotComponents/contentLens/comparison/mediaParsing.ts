import { canvasControls } from '../services/sharePointParsing';
import type { PageStructure } from '../domain/contracts';
import type { PageMedia, ImageUse } from './media';

const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const text = (v: unknown): string | undefined => typeof v === 'string' ? v.slice(0, 4096) : undefined;
const imageId = 'd1d91016-032f-456d-98a4-721247c305e8';
const heroId = 'c4bd7b2f-7b6e-4599-8485-16504575f590';
const quickId = 'c70391ea-0b10-4ee9-b2b4-006d3fcad0cd';

/**
 * Lists the images and links in the saved canvas properties. Saved HTML is parsed in an inert template,
 * so it is not rendered and its resources are not loaded.
 */
export function extractMedia(canvas: unknown, structure: PageStructure | undefined, doc: Document): PageMedia {
  const result: PageMedia = { images: [], links: [], omitted: [] };
  const controls = typeof canvas === 'string' ? canvasControls(canvas, doc) : undefined;
  if (!controls || !structure) return { ...result, omitted: ['Saved image and link locations unavailable.'] };
  controls.slice(0, 500).forEach(raw => {
    const control = record(raw);
    const id = text(control.id);
    let section = 0;
    let column = 0;
    structure.sections.forEach((pageSection, sectionIndex) => pageSection.columns.forEach((blocks, columnIndex) => {
      if (blocks.some(block => block.id === id)) {
        section = sectionIndex + 1;
        column = columnIndex + 1;
      }
    }));
    if (!id || !section) {
      result.omitted.push('A control without a recognized saved location was not inventoried.');
      return;
    }
    const at = { blockId: id.slice(0, 80), section, column };
    const image = (role: ImageUse['role'], url: unknown, alt?: unknown, decorative?: unknown): void => {
      if (result.images.length >= 120) return;
      result.images.push({
        ...at,
        id: 'image-' + result.images.length,
        role,
        url: text(url),
        alt: text(alt)?.slice(0, 1024),
        decorative: typeof decorative === 'boolean' ? decorative : undefined,
        state: text(url) ? 'configured' : 'unknown',
        metadata: 'unknown'
      });
    };
    const link = (url: unknown, name: unknown): void => {
      if (text(url) && result.links.length < 200) {
        result.links.push({ ...at, id: 'link-' + result.links.length, url: text(url)!, name: (text(name) || '').trim().slice(0, 1024) });
      }
    };
    if (typeof control.innerHTML === 'string') {
      const template = doc.createElement('template');
      template.innerHTML = control.innerHTML;
      template.content.querySelectorAll('img').forEach(img => image(
        'inline',
        img.getAttribute('src'),
        img.getAttribute('alt'),
        img.getAttribute('role') === 'presentation' ? true : undefined
      ));
      template.content.querySelectorAll('a[href]').forEach(anchor => link(
        anchor.getAttribute('href'),
        anchor.getAttribute('aria-label')?.trim() || anchor.textContent?.trim() || anchor.querySelector('img')?.getAttribute('alt')
      ));
      return;
    }
    const data = record(control.webPartData);
    const props = record(data.properties);
    const processed = record(data.serverProcessedContent);
    const images = record(processed.imageSources);
    const links = record(processed.links);
    const texts = record(processed.searchablePlainTexts);
    const type = String(control.webPartId || data.id || '').toLowerCase();
    if (type === imageId) {
      image('image', images.imageSource || props.imageSource, props.altText, props.isDecorative);
      link(links.link || props.linkUrl, props.altText);
    } else if (type === heroId && Array.isArray(props.content)) {
      props.content.slice(0, 20).forEach((rawTile, i) => {
        const tile = record(rawTile);
        const tileImage = record(tile.image);
        const prefix = `content[${i}]`;
        image(
          'hero',
          images[prefix + '.image.url'] || tileImage.url || tile.imageSrc,
          texts[prefix + '.alternateText'] ?? tile.alternateText,
          tile.isDecorative
        );
        link(links[prefix + '.link'] || tile.link, texts[prefix + '.title'] || tile.title);
      });
    } else if (type === quickId && Array.isArray(props.items)) {
      props.items.slice(0, 30).forEach((rawItem, i) => {
        const item = record(rawItem);
        const source = record(item.sourceItem);
        const prefix = `items[${i}]`;
        link(links[prefix + '.sourceItem.url'] || source.url, texts[prefix + '.title'] || item.title);
        const url = images[prefix + '.rawPreviewImageUrl'];
        if (url) image('quickLinks', url);
      });
      result.omitted.push('Quick links: only explicitly saved preview images are inventoried.');
    } else result.omitted.push((text(data.title) || 'Web part') + ': dynamic images and links not inventoried.');
  });
  if (result.images.length === 120 || result.links.length === 200 || controls.length > 500) {
    result.omitted.push('Image/link inventory limit reached.');
  }
  result.omitted = result.omitted.slice(0, 100).map(note => note.slice(0, 512));
  return result;
}

/**
 * Replaces the banner and thumbnail entries with the ones from the page header fields. The caller reads
 * these fields in a separate request and uses them only for the same saved page version.
 */
export function headerMedia(media: PageMedia, row: Record<string, unknown>, doc: Document): PageMedia {
  const result: PageMedia = {
    ...media,
    images: media.images.filter(image => image.role !== 'banner' && image.role !== 'thumbnail'),
    omitted: [...media.omitted]
  };
  const controls = typeof row.LayoutWebpartsContent === 'string' ? canvasControls(row.LayoutWebpartsContent, doc) : undefined;
  const data = record(record(controls?.[0]).webPartData);
  const props = record(data.properties);
  const images = record(record(data.serverProcessedContent).imageSources);
  const plain = props.layoutType === 'NoImage' || props.layoutType === 'Plain';
  const banner = text(images.imageSource || props.imageSource);
  const thumbnail = text(record(row.BannerImageUrl).Url || row.BannerImageUrl);
  const base = { section: 0, column: 0, metadata: 'unknown' as const };
  result.images.unshift(
    {
      ...base,
      blockId: 'header',
      id: 'banner',
      role: 'banner',
      url: plain ? undefined : banner,
      state: plain ? 'none' : banner ? 'configured' : 'unknown',
      alt: text(props.altText)?.slice(0, 1024)
    },
    { ...base, blockId: 'thumbnail', id: 'thumbnail', role: 'thumbnail', url: thumbnail, state: thumbnail ? 'configured' : 'unknown' }
  );
  if (!controls) result.omitted.push('Banner layout could not be read; thumbnail does not establish banner use.');
  result.images = result.images.slice(0, 120);
  result.omitted = result.omitted.slice(0, 100);
  return result;
}
