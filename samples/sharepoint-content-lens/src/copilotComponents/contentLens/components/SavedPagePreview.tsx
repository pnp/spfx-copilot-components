import * as React from 'react';
import { Button, makeStyles, mergeClasses, tokens, useId } from '@fluentui/react-components';
import type { PageOutlineItem, ReviewSource } from '../domain/contracts';
import { httpsUrl, isDefaultThumbnail, type ImageUse } from '../comparison/media';
import { demoImage } from '../comparison/demoImage';
import { savedBlockText } from './savedText';
import { evidenceRange, highlightedEvidence } from './evidence';
import { format } from './viewUtils';
import { noteRange, type MapBlock, type PageNote } from './notes';

const useStyles = makeStyles({
  page: {
    containerType: 'inline-size', minWidth: 0, borderRadius: '8px', border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px'
  },
  title: { margin: 0, fontSize: '20px', fontWeight: 500, lineHeight: '1.3', overflowWrap: 'anywhere' },
  meta: { margin: 0, fontSize: '12px', lineHeight: '18px', color: tokens.colorNeutralForeground2 },
  section: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '16px', minWidth: 0 },
  columns: {
    display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '12px', minWidth: 0,
    '@container (min-width: 650px)': { gridTemplateColumns: 'var(--cl-preview-columns)' }
  },
  srOnly: { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)' },
  column: { display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 },
  block: {
    borderRadius: '6px', padding: '8px', minWidth: 0, border: '1px solid transparent', transition: 'background-color 120ms',
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
  },
  active: { backgroundColor: tokens.colorBrandBackground2, border: `1px solid ${tokens.colorBrandStroke2}` },
  control: {
    padding: '2px 0', minHeight: '28px', width: '100%', justifyContent: 'space-between', textAlign: 'left', whiteSpace: 'normal',
    fontSize: '13px', fontWeight: 500, color: tokens.colorNeutralForeground2
  },
  pin: {
    borderRadius: '12px', padding: '0 6px', flexShrink: 0, fontSize: '12px',
    backgroundColor: tokens.colorNeutralBackground3, color: tokens.colorNeutralForeground1
  },
  text: { margin: '6px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '14px', lineHeight: '1.65' },
  mark: {
    backgroundColor: tokens.colorBrandBackground2, color: 'inherit',
    borderBottom: `1px solid ${tokens.colorBrandStroke2}`, borderRadius: '2px',
    '@media (forced-colors: active)': { borderBottomColor: 'Mark' }
  },
  placeholder: {
    padding: '12px', borderRadius: '4px', border: `1px dashed ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2, fontSize: '12px', lineHeight: '18px'
  },
  figure: { margin: '8px 0 0', minWidth: 0 },
  image: { display: 'block', width: '100%', height: 'auto', maxHeight: '240px', objectFit: 'contain', borderRadius: '4px' },
  flow: { display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 },
  viewport: {
    maxHeight: '420px', overflowY: 'auto', overscrollBehaviorY: 'contain', scrollbarGutter: 'stable',
    ':focus-visible': { outline: `2px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' }
  },
  viewportFull: { maxHeight: '620px' },
});

export { savedBlockText } from './savedText';

/**
 * The URL of a saved image to show: a png, jpeg, gif or webp file on the site's own origin. An image on any other
 * host gives undefined, so saved page content cannot load a remote tracking image.
 */
export function previewImageUrl(image: ImageUse, siteUrl: string, demo: boolean): string | undefined {
  if (image.state !== 'configured' || !image.url || isDefaultThumbnail(image, siteUrl)) return undefined;
  if (demo) return demoImage;
  const safe = httpsUrl(image.url, siteUrl);
  const site = httpsUrl(siteUrl);
  if (!safe || !site || new URL(safe).origin !== new URL(site).origin) return undefined;
  return /\.(png|jpe?g|gif|webp)$/i.test(new URL(safe).pathname) ? safe : undefined;
}

function SavedImage(
  { image, source, demo, strings: s }: { image: ImageUse; source: ReviewSource; demo: boolean; strings: IContentLensStrings }
): React.ReactElement {
  const styles = useStyles();
  const url = previewImageUrl(image, source.siteUrl, demo);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [url]);
  const alt = image.decorative ? '' : image.alt || s.Comparison.imagePreview;
  return <figure className={styles.figure}>
    {url && !failed
      ? <img className={styles.image} src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      : <div className={styles.placeholder}>{s.Preview.imageUnavailable}</div>}
    <figcaption className={styles.meta}>{s.Comparison[image.role]}{demo ? ' · ' + s.Comparison.prepared : ''}</figcaption>
  </figure>;
}

export interface SavedPagePreviewProps {
  sources: ReviewSource[];
  strings: IContentLensStrings;
  demo: boolean;
  width: number;
  blocks?: MapBlock[];
  notes?: PageNote[];
  selected?: string;
  highlighted?: string[];
  onSelect(id: string): void;
  selectedNote?: number;
  onSelectNote?(note: PageNote): void;
  zoom?: 'fit' | number;
  hideZoom?: boolean;
  hideScope?: boolean;
  hideTitle?: boolean;
  renderFinding?(note: PageNote): React.ReactNode;
  hideFindingNavigation?: boolean;
  /**
   * Incremented for each deliberate finding selection, which scrolls to the finding.
   * Other changes, such as a filter, keep the scroll position.
   */
  revealRequest?: number;
  /** Notes are placed beside their saved section; narrow cards stack them below it. */
  renderNotes?(blockId: string): React.ReactNode;
  full?: boolean;
  bounded?: boolean;
  label?: string;
  heading?: React.ReactNode;
}

/**
 * The page as saved, drawn from its stored text, layout and images as escaped React content. It shows the version
 * that was checked; the live SharePoint page appears in the iframe preview.
 */
export function SavedPagePreview(props: SavedPagePreviewProps): React.ReactElement {
  const { strings: s } = props;
  const styles = useStyles();
  const id = useId('saved-preview');
  const viewport = React.useRef<HTMLDivElement>(null);
  const bounded = props.bounded ?? !props.full;
  const lastReveal = React.useRef(0);
  const targets = props.highlighted?.length ? props.highlighted : props.selected ? [props.selected] : [];
  const highlightKey = targets.join('|');
  React.useEffect(() => {
    if (props.revealRequest !== undefined && props.revealRequest === lastReveal.current) return;
    const pane = viewport.current;
    if (!pane || !bounded || !targets.length) return;
    const candidates = Array.from(pane.querySelectorAll<HTMLElement>('[data-preview-block]'));
    const target = candidates.find(element => targets.indexOf(element.getAttribute('data-preview-block') || '') >= 0);
    if (!target) return;
    lastReveal.current = props.revealRequest ?? 0;
    const area = pane.getBoundingClientRect();
    const block = target.getBoundingClientRect();
    if (block.top < area.top || block.bottom > area.bottom) pane.scrollTop += block.top - area.top - 8;
  }, [highlightKey, bounded, props.full, props.width, props.revealRequest, props.selectedNote]);
  const source = props.sources.find(part => part.page) || props.sources[0];
  const structure = source?.page?.structure;
  const notes = props.notes || [];
  const images = source?.page?.media?.images || [];
  const renderBlock = (block: PageOutlineItem): React.ReactNode => {
    const own = notes.filter(note => note.blockId === block.id);
    const data = savedBlockText(props.sources, block);
    const active = props.selected === block.id || (props.highlighted || []).indexOf(block.id) >= 0;
    const blockImages = images.filter(image => image.blockId === block.id && image.role !== 'thumbnail' && image.state === 'configured');
    const label = block.label || (block.kind === 'webPart' ? s.OutlineWebPart : s.OutlineTextBlock);
    const lines = data.text.split(/\n+/).filter(Boolean);
    const ranges = own
      .filter(note => note.highlight)
      .map(note => evidenceRange(data.text, note.mark))
      .filter((range): range is { start: number; end: number } => !!range);
    // The marked parts of each line. The lines are found in the block text in order, so a repeated line maps to its own place.
    let lineCursor = 0;
    const lineMarks = lines.map(line => {
      const start = data.text.indexOf(line, lineCursor);
      const end = start + line.length;
      lineCursor = end;
      return ranges
        .filter(range => range.start < end && range.end > start)
        .map(range => data.text.slice(Math.max(start, range.start), Math.min(end, range.end)));
    });
    const headingInText = block.kind === 'text' && lines[0] === label;
    const bodyLines = headingInText ? lines.slice(1) : lines;
    const firstBodyLine = headingInText ? 1 : 0;
    let ariaLabel: string;
    if (block.kind === 'webPart') ariaLabel = format(s.BlockWebPart, label);
    else if (own.length) ariaLabel = format(s.BlockNotes, label, own.length);
    else ariaLabel = format(s.BlockNoNotes, label);
    const panelId = id + '-' + block.id;
    const labelClass = block.kind === 'text' && !headingInText ? styles.srOnly : undefined;
    const labelText = headingInText ? highlightedEvidence(label, lineMarks[0], false, styles.mark) : label;
    const notChecked = props.blocks?.find(mapBlock => mapBlock.id === block.id)?.notChecked;
    return <div key={block.id} className={mergeClasses(styles.block, active && styles.active)}
      data-preview-block={block.id} data-highlighted={!!active}>
      <Button appearance="transparent" className={styles.control} data-testid="map-block" aria-label={ariaLabel}
        aria-pressed={!!active} aria-controls={panelId} onClick={() => props.onSelect(block.id)}>
        <span className={labelClass}>{labelText}</span>
        {own.length > 0 && <span className={styles.pin}>{noteRange(own)}</span>}
      </Button>
      <div id={panelId}>
        {block.kind === 'text' && bodyLines.map((line, i) => <p key={i} className={styles.text}>
          {highlightedEvidence(line, lineMarks[i + firstBodyLine], false, styles.mark)}
        </p>)}
        {blockImages.map(image => <SavedImage key={image.id} image={image} source={source} demo={props.demo} strings={s} />)}
        {block.kind === 'webPart' && !blockImages.length && <div className={styles.placeholder}>{s.Preview.webPart}</div>}
        {block.kind === 'text' && !data.complete && <p className={styles.meta}>{s.Preview.incomplete}</p>}
        {notChecked && <p className={styles.meta}>{s.NotCheckedByCopilot}</p>}
      </div>
    </div>;
  };
  const savedState = source?.page
    && ' · ' + (source.page.state === 'draft' ? s.Comparison.draft : s.Comparison.published) + ' ' + source.page.version;
  const headerHighlighted = (props.highlighted || []).indexOf('header') >= 0;
  const banners = images.filter(image => image.role === 'banner' && image.state === 'configured');
  return <article className={styles.page} data-testid="saved-page-preview" aria-label={source?.pageTitle}>
    <header>
      <p className={styles.meta}>{props.label && props.label + ' · '}{s.Preview.saved}{savedState}</p>
      {!props.hideTitle && <h2 className={styles.title}>{props.heading || source?.pageTitle}</h2>}
    </header>
    <div ref={viewport}
      className={mergeClasses(styles.flow, bounded && styles.viewport, bounded && props.full && styles.viewportFull)}
      tabIndex={bounded ? 0 : undefined} role={bounded ? 'region' : undefined}
      aria-label={bounded ? s.Preview.saved + ' · ' + source?.pageTitle : undefined}>
      {banners.map(image => <div key={image.id} data-preview-block="header" data-highlighted={headerHighlighted}
        className={mergeClasses(styles.block, headerHighlighted && styles.active)}>
        <SavedImage image={image} source={source} demo={props.demo} strings={s} />
      </div>)}
      {structure ? structure.sections.map((section, index) => {
        const columnTemplate = section.columns.map((_column, i) => `minmax(0,${section.factors?.[i] || 1}fr)`).join(' ');
        return <section key={index} aria-label={format(s.OutlineSection, index + 1)} className={styles.section}>
          <div className={styles.columns} style={{ '--cl-preview-columns': columnTemplate } as React.CSSProperties}>
            {section.columns.map((column, i) => <div className={styles.column} key={i}>{column.map(renderBlock)}</div>)}
          </div>
        </section>;
      }) : <>
        <p className={styles.meta}>{s.NoLayout}</p>
        <p className={styles.text}>{props.sources.map(part => part.text).join('')}</p>
      </>}
    </div>
    {!props.hideScope && <p className={styles.meta}>{s.Preview.scope}</p>}
  </article>;
}
