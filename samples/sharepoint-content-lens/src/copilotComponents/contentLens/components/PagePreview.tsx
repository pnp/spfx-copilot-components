import * as React from 'react';
import { Button, Spinner, makeStyles, tokens, mergeClasses } from '@fluentui/react-components';
import { SavedPagePreview, type SavedPagePreviewProps } from './SavedPagePreview';
import { attachLiveAdvisor, livePageUrl, type LiveAdvisor } from './livePageDom';
import { markInk, markRadius, markSource } from './markStyle';
import { PreviewZoom, type PreviewZoomValue } from './PreviewZoom';
import { format } from './viewUtils';

const useStyles = makeStyles({
  root: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' },
  meta: { margin: 0, fontSize: '12px', lineHeight: '18px', color: tokens.colorNeutralForeground2 },
  title: { margin: 0, fontSize: '16px', lineHeight: '22px', fontWeight: 500 },
  viewport: {
    position: 'relative', overflow: 'auto', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '8px',
    backgroundColor: 'white', minWidth: 0
  },
  frame: { border: 0, display: 'block', transformOrigin: 'top left', backgroundColor: 'white' },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '20px', minWidth: 0, alignItems: 'start' },
  wide: { '@container (min-width: 900px)': { gridTemplateColumns: 'minmax(0,1fr) 300px' } },
  group: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detail: {
    padding: '14px', borderRadius: '8px', backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  choice: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 },
  choiceText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flexGrow: 1 },
  // The number looks as it does on the SharePoint page, on any button background and in both themes.
  chip: {
    flexShrink: 0, boxSizing: 'border-box', minWidth: '22px', height: '22px', padding: '0 3px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', lineHeight: 1, fontWeight: 600, backgroundColor: 'white'
  },
  chipCopilot: { color: markInk.copilot, border: `1.5px solid ${markInk.copilot}`, borderRadius: markRadius('copilot', 22) + 'px' },
  chipCheck: { color: markInk.check, border: `1.5px solid ${markInk.check}`, borderRadius: markRadius('check', 22) + 'px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 },
  finding: {
    display: 'flex', flexDirection: 'column', alignItems: 'stretch', textAlign: 'left', whiteSpace: 'normal', gap: '6px',
    padding: '8px 10px', fontWeight: 400, flexShrink: 0, borderRadius: '6px', border: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: '14px', lineHeight: '20px'
  }
});

/** The blocks to frame: the highlighted blocks, else the selected block. */
function framedBlocks(props: SavedPagePreviewProps): string[] {
  if (props.highlighted?.length) return props.highlighted;
  return props.selected ? [props.selected] : [];
}

/**
 * The page preview. Live data shows the SharePoint page in an iframe; prepared demo data has no real page and
 * shows the saved preview. With notes and a note handler, a findings sidebar sits beside the preview.
 */
export function PagePreview(props: SavedPagePreviewProps): React.ReactElement {
  const styles = useStyles();
  const s = props.strings;
  const inspected = props.notes?.find(note => note.n === props.selectedNote);
  const hasInspector = !props.hideFindingNavigation && !!props.onSelectNote && !!props.notes?.length;
  const childProps = hasInspector ? { ...props, bounded: true, hideFindingNavigation: true, renderNotes: undefined } : props;
  const preview = props.demo ? <SavedPagePreview {...childProps} /> : <LivePagePreview {...childProps} />;
  if (!hasInspector) return preview;
  let detail: React.ReactNode;
  if (inspected && props.renderFinding) {
    detail = props.renderFinding(inspected);
  } else if (inspected) {
    detail = <>
      <h3 className={styles.title}>{inspected.label}</h3>
      <p>{inspected.note}</p>
      {inspected.mark && <blockquote>{inspected.mark}</blockquote>}
      {!inspected.blockId && <p className={styles.meta}>{s.Preview.unanchored}</p>}
    </>;
  } else if (props.selected && props.renderNotes) {
    detail = props.renderNotes(props.selected);
  } else {
    detail = <p className={styles.meta}>{s.Comparison.chooseFinding}</p>;
  }
  return <div className={mergeClasses(styles.layout, styles.wide)} data-testid="page-review-layout">
    {preview}
    <aside className={styles.sidebar} aria-label={s.Preview.findings} data-testid="findings-sidebar">
      <h2 className={styles.title}>{s.Preview.findings} · {props.notes!.length}</h2>
      {[false, true].map(noAI => {
        const notes = props.notes!.filter(note => note.noAI === noAI);
        // The Copilot group is always listed; the group of checks without AI only when it has notes.
        const shown = notes.length || !noAI;
        if (!shown) return null;
        return <div className={styles.group} key={String(noAI)} data-testid={noAI ? 'automatic-findings' : 'copilot-findings'}>
          <h3 className={styles.title}>{noAI ? s.AutomaticChecksLabel : s.CopilotReviewLabel} · {notes.length}</h3>
          {props.demo && <p className={styles.meta}>{s.Comparison.prepared}</p>}
          {!notes.length && <p className={styles.meta}>{s.NoCopilotFindings}</p>}
          {notes.map(note => {
            const noteTitle = note.title || note.note || note.label;
            const pressed = inspected?.n === note.n;
            const chipClass = mergeClasses(styles.chip, note.noAI ? styles.chipCheck : styles.chipCopilot);
            return <Button key={note.n} className={styles.finding} appearance={pressed ? 'primary' : 'subtle'}
              title={noteTitle} aria-label={format(s.Preview.locate, note.n) + ': ' + noteTitle} aria-pressed={pressed}
              onClick={() => props.onSelectNote!(note)}>
              <span className={styles.choice}>
                <span className={chipClass} data-source={markSource(note)} aria-hidden="true">{note.n}</span>
                <span className={styles.choiceText}>{noteTitle}</span>
              </span>
            </Button>;
          })}
        </div>;
      })}
      <div className={styles.detail} data-testid="block-notes" aria-live="polite">
        {detail}
      </div>
    </aside>
  </div>;
}

function LivePagePreview(props: SavedPagePreviewProps): React.ReactElement {
  const styles = useStyles();
  const s = props.strings;
  const previewStrings = s.Preview;
  const source = props.sources.find(part => part.page) || props.sources[0];
  const url = source && livePageUrl(source);
  const iframe = React.useRef<HTMLIFrameElement>(null);
  const viewport = React.useRef<HTMLDivElement>(null);
  const advisor = React.useRef<LiveAdvisor>();
  const request = React.useRef<AbortController>();
  // The props of the latest render, for callbacks that run after the page loads.
  const latestProps = React.useRef(props);
  latestProps.current = props;
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'blocked' | 'changed' | 'unverified'>('loading');
  const [missing, setMissing] = React.useState<string[]>([]);
  const [width, setWidth] = React.useState(Math.max(280, props.width - 32));
  const [localZoom, setLocalZoom] = React.useState<PreviewZoomValue>('fit');
  const [attempt, setAttempt] = React.useState(0);
  const zoom = props.zoom ?? localZoom;
  const pageWidth = Math.max(1100, width);
  const scale = zoom === 'fit' ? width / pageWidth : zoom / 100;
  const height = props.full ? 680 : 500;
  const shownScale = React.useRef(scale);
  shownScale.current = scale;
  const selected = framedBlocks(props);
  const selectedKey = selected.join('|');
  const updateMissing = React.useCallback((next: string[]): void => {
    setMissing(old => old.join('|') === next.join('|') ? old : next);
  }, []);
  React.useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const resize = (): void => {
      if (element.clientWidth) setWidth(element.clientWidth);
    };
    resize();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const frameKey = (url || '') + ':' + (source?.page?.version || '') + ':' + attempt;
  React.useEffect(() => {
    setStatus('loading');
    setMissing([]);
    const timeout = setTimeout(() => setStatus(old => old === 'loading' ? 'blocked' : old), 30000);
    return () => {
      clearTimeout(timeout);
      request.current?.abort();
      advisor.current?.dispose();
      advisor.current = undefined;
    };
  }, [frameKey]);
  React.useEffect(() => {
    advisor.current?.update(selected, props.notes || [], props.selectedNote, props.revealRequest);
  }, [selectedKey, props.notes, props.selectedNote, props.revealRequest]);
  React.useEffect(() => {
    advisor.current?.setScale(scale);
  }, [scale]);

  async function loaded(): Promise<void> {
    request.current?.abort();
    advisor.current?.dispose();
    advisor.current = undefined;
    const controller = new AbortController();
    request.current = controller;
    let visible = false;
    const locateLabel = (n: number): string => format(previewStrings.locate, n);
    try {
      const frame = iframe.current;
      const doc = frame?.contentDocument;
      if (!source || !url || !doc || !doc.body || doc.URL !== url) throw new Error('PAGE_FRAME_UNAVAILABLE');
      visible = true;
      advisor.current = attachLiveAdvisor(doc, [], () => undefined, () => undefined, locateLabel);
      // The iframe shows the current SharePoint page, while the advice belongs to the saved version.
      // The advice is drawn only when the live version number matches the saved one.
      if (!source.page || !/^[0-9a-f-]{36}$/i.test(source.listId)) {
        setStatus('unverified');
        return;
      }
      const endpoint = `${source.siteUrl}/_api/web/lists(guid'${source.listId}')/items(${source.pageItemId})?$select=OData__UIVersionString`;
      const response = await fetch(endpoint, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json;odata=nometadata' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error('PAGE_VERSION_UNAVAILABLE');
      const body = await response.json();
      if (controller.signal.aborted) return;
      const version = (body.d || body).OData__UIVersionString;
      if (typeof version !== 'string') {
        setStatus('unverified');
        return;
      }
      if (version !== source.page.version) {
        setStatus('changed');
        return;
      }
      advisor.current?.dispose();
      // A click on the page selects the clicked finding when it has one, else the clicked block.
      const selectFromPage = (id: string, noteNumber?: number): void => {
        const note = latestProps.current.notes?.find(item => item.n === noteNumber);
        if (note && latestProps.current.onSelectNote) latestProps.current.onSelectNote(note);
        else latestProps.current.onSelect(id);
      };
      advisor.current = attachLiveAdvisor(doc, latestProps.current.sources, selectFromPage, updateMissing, locateLabel);
      advisor.current.setScale(shownScale.current);
      const latest = latestProps.current;
      advisor.current.update(framedBlocks(latest), latest.notes || [], latest.selectedNote, latest.revealRequest);
      setStatus('ready');
    } catch {
      if (!controller.signal.aborted) setStatus(visible ? 'unverified' : 'blocked');
    }
  }

  const findingsUnmatched = status === 'ready' && missing.some(id => props.notes?.some(note => note.blockId === id));
  return <section className={styles.root} data-testid="live-page-preview" aria-label={source?.pageTitle}>
    <div className={styles.toolbar}>
      <div>
        <p className={styles.meta}>{props.label && props.label + ' · '}{previewStrings.live}</p>
        {!props.hideTitle && <h2 className={styles.title}>{props.heading || source?.pageTitle}</h2>}
      </div>
      {!props.hideZoom && <PreviewZoom value={zoom} onChange={setLocalZoom} strings={s} />}
    </div>
    <div role="status" aria-live="polite">
      {status === 'loading' && <Spinner size="tiny" label={previewStrings.loadingLive} />}
      {status === 'changed' && <p className={styles.meta}>{previewStrings.changedLive}</p>}
      {status === 'unverified' && <p className={styles.meta}>{previewStrings.unverifiedLive}</p>}
      {findingsUnmatched && <p className={styles.meta}>{previewStrings.unmatchedLive}</p>}
      {(!url || status === 'blocked') && <p className={styles.meta}>{previewStrings.blockedLive}</p>}
    </div>
    <div className={styles.layout}>
      <div ref={viewport} className={styles.viewport} style={{ height }}>
        {url && <div style={{ width: Math.max(width, pageWidth * scale), height, position: 'relative', overflow: 'hidden' }}>
          <iframe key={frameKey} ref={iframe} src={url} className={styles.frame}
            title={format(previewStrings.frameTitle, source.pageTitle)} sandbox="allow-scripts allow-same-origin"
            style={{ width: pageWidth, height: height / scale, transform: `scale(${scale})` }}
            onLoad={() => {
              loaded().catch(() => setStatus('blocked'));
            }}
            onError={() => setStatus('blocked')} />
        </div>}
      </div>
    </div>
    {(status === 'blocked' || status === 'unverified') && <Button size="small" onClick={() => setAttempt(attempt + 1)}>
      {previewStrings.retryLive}
    </Button>}
    {!props.hideScope && <p className={styles.meta}>{format(previewStrings.liveScope, source?.page?.version || '—')}</p>}
  </section>;
}
