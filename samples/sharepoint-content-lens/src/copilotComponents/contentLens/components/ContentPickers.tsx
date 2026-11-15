import * as React from 'react';
import { Button, Combobox, Field, Option, Spinner, makeStyles, tokens } from '@fluentui/react-components';
import { Checkmark16Regular, Dismiss20Regular, Search20Regular } from '@fluentui/react-icons';
import type { DiscoveryResult, IContentLensDiscovery, PageChoice, SiteChoice } from '../services/discovery';

export interface ISitePickerProps {
  discovery?: IContentLensDiscovery;
  demoSites?: readonly SiteChoice[];
  value?: SiteChoice;
  initialQuery?: string;
  onSelect: (site: SiteChoice | undefined) => void;
  disabled?: boolean;
  strings: IContentLensStrings;
}

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 },
  siteRow: { display: 'flex', gap: '4px', alignItems: 'center', minWidth: 0 },
  combobox: { flexGrow: 1, flexShrink: 1, minWidth: 0, width: '100%', maxWidth: '100%' },
  siteInput: { minWidth: 0 },
  compactButton: { flexShrink: 0 },
  listbox: { maxHeight: '260px', maxWidth: 'calc(100vw - 32px)', minWidth: 0 },
  option: { whiteSpace: 'normal', overflowWrap: 'anywhere' },
  hint: { margin: 0, fontSize: '12px', lineHeight: '17px', color: tokens.colorNeutralForeground2, overflowWrap: 'anywhere' },
  error: { margin: 0, fontSize: '12px', lineHeight: '17px', color: tokens.colorPaletteRedForeground1 },
  choiceText: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, overflowWrap: 'anywhere' },
  selected: {
    display: 'flex',
    gap: '6px',
    alignItems: 'flex-start',
    color: tokens.colorNeutralForeground2,
    fontSize: '12px',
    lineHeight: '17px',
    overflowWrap: 'anywhere'
  }
});

function isLink(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function safeLocation(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname + decodeURI(parsed.pathname);
  } catch {
    return '';
  }
}

function errorMessage(error: unknown, s: IContentLensStrings): string {
  // Each known error code maps to a fixed localized message, and any other error to the generic one.
  // Server responses, pasted links, authentication details and exception text stay off the screen.
  const code = error instanceof Error ? error.message : '';
  if (code.indexOf('SHAREPOINT_THROTTLED') >= 0) return s.PickerThrottled;
  if (code.indexOf('SHAREPOINT_SITE_OUTSIDE_TENANT') >= 0) return s.PickerOutsideTenant;
  if (code.indexOf('SHAREPOINT_LINK_NOT_A_PAGE') >= 0) return s.PageLinkUnsupported;
  if (code.indexOf('SHAREPOINT_LINK_') >= 0) return s.PickerLinkUnsupported;
  if (code.indexOf('SHAREPOINT_READ_IN_PROGRESS') >= 0 || code.indexOf('SHAREPOINT_DISCOVERY_IN_PROGRESS') >= 0) {
    return s.PickerBusy;
  }
  if (code.indexOf('SHAREPOINT_HTTP_401') >= 0) return s.PickerSignIn;
  if (code.indexOf('SHAREPOINT_HTTP_403') >= 0) return s.PickerAccessDenied;
  if (code.indexOf('SHAREPOINT_HTTP_404') >= 0) return s.PickerNotFound;
  return s.PickerFailed;
}

export function SitePicker(props: ISitePickerProps): React.ReactElement {
  const { strings: s } = props;
  const styles = useStyles();
  const id = React.useId();
  const input = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState(props.value?.title || props.initialQuery || '');
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState<{ query: string; data: DiscoveryResult<SiteChoice> }>();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [stopped, setStopped] = React.useState(false);
  const controller = React.useRef<AbortController>();
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const sequence = React.useRef(0);
  const composing = React.useRef(false);
  const initialLookup = React.useRef(false);
  const initialChoices = React.useRef<DiscoveryResult<SiteChoice>>();
  const selectedChoices = React.useRef<DiscoveryResult<SiteChoice>>();
  const demo = props.demoSites !== undefined;
  const available = demo || !!props.discovery;
  const disabled = props.disabled || !available;
  const selectedUrl = props.value?.url;
  const selectedTitle = props.value?.title;

  const cancel = React.useCallback((): void => {
    sequence.current++;
    initialLookup.current = false;
    controller.current?.abort();
    controller.current = undefined;
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  React.useEffect(() => cancel, [cancel]);
  React.useEffect(() => {
    initialLookup.current = false;
    initialChoices.current = undefined;
    selectedChoices.current = undefined;
  }, [demo, props.discovery]);
  React.useEffect(() => {
    cancel();
    setResult(undefined);
    setBusy(false);
    setError('');
    setStopped(false);
    setOpen(false);
  }, [cancel, demo, props.discovery, props.disabled]);
  React.useEffect(() => {
    // A site the owner selects shows its title. When the owner clears the selection, the typed query stays.
    if (selectedUrl !== undefined && selectedTitle !== undefined) {
      cancel();
      setQuery(selectedTitle);
      setResult(undefined);
      setBusy(false);
      setError('');
      setStopped(false);
      setOpen(false);
    }
  }, [cancel, selectedUrl, selectedTitle]);

  const showingSelection = props.value?.title === query;
  // The search for the current query, else the choices the selected site came from, else the browse result for an empty query.
  const visibleResult = result?.query === query.trim() ? result.data
    : showingSelection ? selectedChoices.current || initialChoices.current
    : !query.trim() ? initialChoices.current
    : undefined;

  function select(site: SiteChoice): void {
    selectedChoices.current = visibleResult || initialChoices.current;
    cancel();
    setQuery(site.title);
    setResult(undefined);
    setBusy(false);
    setError('');
    setStopped(false);
    setOpen(false);
    props.onSelect(site);
    input.current?.focus();
  }

  async function search(entered: string, browse: boolean = false): Promise<void> {
    if (disabled || demo || !props.discovery) return;
    const text = entered.trim();
    if (!isLink(text) && text.length < 2 && !(browse && text === '')) return;
    cancel();
    initialLookup.current = browse;
    const requestSequence = sequence.current;
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setResult(undefined);
    setError('');
    setStopped(false);
    try {
      if (isLink(text)) {
        const site = await props.discovery.resolveSite(text, request.signal);
        if (!request.signal.aborted && requestSequence === sequence.current) select(site);
      } else {
        const data = await props.discovery.searchSites(text, request.signal);
        if (!request.signal.aborted && requestSequence === sequence.current) {
          if (browse) initialChoices.current = data;
          setResult({ query: text, data });
        }
      }
    } catch (failure) {
      if (!request.signal.aborted && requestSequence === sequence.current) setError(errorMessage(failure, s));
    } finally {
      if (requestSequence === sequence.current) {
        initialLookup.current = false;
        controller.current = undefined;
        setBusy(false);
      }
    }
  }

  function changeQuery(value: string): void {
    cancel();
    setQuery(value);
    setResult(undefined);
    setError('');
    setStopped(false);
    setBusy(false);
    setOpen(!!value.trim() || demo || !!initialChoices.current);
    props.onSelect(undefined);
    // A typed name of two or more characters schedules a search after a pause. A link waits for Enter or Use this link.
    if (!disabled && !demo && !composing.current && !isLink(value) && value.trim().length >= 2) {
      timer.current = setTimeout(async () => {
        timer.current = undefined;
        await search(value);
      }, 350);
    }
  }

  const filter = props.value?.title === query ? '' : query.trim().toLocaleLowerCase();
  const demoMatches = props.demoSites?.filter(site => (site.title + ' ' + safeLocation(site.url)).toLocaleLowerCase().indexOf(filter) >= 0);
  const liveChoices = visibleResult?.items || [];
  // While the query shows the selected site, the list keeps the earlier choices and adds the selected site when they
  // lack it, for example a site resolved from a pasted link.
  const liveChoicesWithSelection = props.value && showingSelection && !liveChoices.some(site => site.url === props.value?.url)
    ? [props.value, ...liveChoices]
    : liveChoices;
  const choices = (demoMatches || liveChoicesWithSelection).slice(0, 20);
  const hasMore = !!visibleResult?.hasMore || (demoMatches?.length || 0) > 20;
  const noMatches = !busy && !error && !hasMore && choices.length === 0 &&
    (demoMatches !== undefined || visibleResult !== undefined);

  /** The one line of feedback: progress, an error, or a hint about the query. */
  function siteNotice(): string {
    if (busy) return s.PickerSearching;
    if (error) return error;
    if (stopped) return s.PickerStopped;
    if (hasMore) return s.PickerRefine;
    if (noMatches) return s.PickerNoMatches;
    if (choices.length === 0 && query.trim()) {
      if (isLink(query)) return s.PickerLinkHint;
      return query.trim().length < 2 ? s.PickerNameTooShort : '';
    }
    return '';
  }
  const notice = siteNotice();

  return <div className={styles.root} data-testid="site-picker">
    <Field label={s.SitePickerLabel} hint={demo ? s.SitePickerDemoHelp : s.SitePickerHelp}>
      <div className={styles.siteRow}>
        <Combobox ref={input} className={styles.combobox} input={{ className: styles.siteInput }}
          listbox={{ className: styles.listbox }} inlinePopup freeform
          aria-label={s.SitePickerLabel} aria-describedby={id + '-status'} placeholder={s.SitePickerPlaceholder}
          expandIcon={{ 'aria-label': s.PickerOpenSites }} disabled={disabled}
          value={query} selectedOptions={selectedUrl ? [selectedUrl] : []} open={open && !disabled}
          onOpenChange={async (_event, data) => {
            setOpen(data.open);
            // Opening an empty picker browses the sites once. A successful result is kept;
            // after a failed or stopped lookup, opening the list again retries.
            const opening = data.open && !open;
            const canBrowse = !disabled && !demo && !props.value && !query.trim() && !initialLookup.current && !initialChoices.current;
            if (opening && canBrowse) {
              await search('', true);
            }
          }}
          onChange={event => changeQuery(event.target.value)}
          onCompositionStart={() => {
            composing.current = true;
            cancel();
          }}
          onCompositionEnd={event => {
            composing.current = false;
            changeQuery(event.currentTarget.value);
          }}
          onOptionSelect={(_event, data) => {
            const choice = choices.find(site => site.url === data.optionValue);
            if (choice) select(choice);
          }}
          onKeyDown={async event => {
            if (event.key === 'Escape') {
              cancel();
              setBusy(false);
              setOpen(false);
            }
            if (event.key === 'Enter' && !event.nativeEvent.isComposing && isLink(query) && !demo) {
              event.preventDefault();
              if (!busy) await search(query);
            }
          }}>
          {choices.map(site => <Option className={styles.option} key={site.url} value={site.url} text={site.title}>
            <span className={styles.choiceText}>
              <span>{site.title}</span>
              <span className={styles.hint}>{safeLocation(site.url)}</span>
            </span>
          </Option>)}
          {notice && <Option className={styles.option} disabled text={notice}>
            <span role="status" aria-live="polite">{busy ? <Spinner size="tiny" label={notice} /> : notice}</span>
          </Option>}
        </Combobox>
        {query && <Button className={styles.compactButton} appearance="subtle" size="small" icon={<Dismiss20Regular />}
          aria-label={s.PickerClear} title={s.PickerClear} disabled={props.disabled}
          onClick={() => {
            changeQuery('');
            input.current?.focus();
          }} />}
        {!demo && isLink(query) && !busy && <Button className={styles.compactButton} disabled={disabled}
          onClick={async () => {
            await search(query);
          }}>{s.PickerUseLink}</Button>}
        {!demo && !isLink(query) && query.trim().length >= 2 && !busy && (error || stopped) &&
          <Button className={styles.compactButton} icon={<Search20Regular />} disabled={disabled}
            onClick={async () => {
              setOpen(true);
              await search(query);
            }}>{s.PickerSearch}</Button>}
        {busy && <Button className={styles.compactButton} disabled={props.disabled} onClick={() => {
          cancel();
          setBusy(false);
          setResult(undefined);
          setStopped(true);
          setOpen(true);
        }}>{s.PickerStop}</Button>}
      </div>
    </Field>
    {props.value && <div className={styles.selected} role="status">
      <Checkmark16Regular />
      <span className={styles.choiceText}>
        <span>{s.PickerSelected}: {props.value.title}</span>
        <span>{safeLocation(props.value.url)}</span>
      </span>
    </div>}
    <div id={id + '-status'} role="status" aria-live="polite">
      {!available
        ? <p className={styles.hint}>{s.PickerUnavailable}</p>
        : !open && notice && <p className={error ? styles.error : styles.hint}>{notice}</p>}
    </div>
  </div>;
}

export interface IPageComboboxProps {
  discovery?: IContentLensDiscovery;
  /** The example pages, filtered in the browser instead of searched. */
  demoPages?: readonly PageChoice[];
  site?: SiteChoice;
  pageKind?: 'page' | 'news' | 'both';
  value?: PageChoice;
  disabled?: boolean;
  strings: IContentLensStrings;
  /** A pasted link can name a page on another site; it then carries that site, and the owner switches to it. */
  onSelect(page: (PageChoice & { site?: SiteChoice }) | undefined): void;
}

/**
 * The page of the chosen site: open the list for its newest pages, type to search them, or paste a link to a page.
 * Pages come from the site's own list, so a draft saved minutes ago is there; a pasted link is read directly.
 */
export function PageCombobox(props: IPageComboboxProps): React.ReactElement {
  const { strings: s, discovery } = props;
  const styles = useStyles();
  const id = React.useId();
  const [query, setQuery] = React.useState(props.value?.title || '');
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState<{ key: string; data: DiscoveryResult<PageChoice> }>();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const controller = React.useRef<AbortController>();
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const sequence = React.useRef(0);
  const composing = React.useRef(false);
  const demo = props.demoPages !== undefined;
  const siteUrl = props.site?.url || '';
  const matchesKind = (page: PageChoice): boolean => !props.pageKind || props.pageKind === 'both' || page.pageKind === props.pageKind;
  const available = demo || !!discovery;
  const disabled = props.disabled || !available;
  const cancel = React.useCallback((): void => {
    sequence.current++;
    controller.current?.abort();
    controller.current = undefined;
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  React.useEffect(() => cancel, [cancel]);
  React.useEffect(() => {
    cancel();
    setResult(undefined);
    setError('');
    setBusy(false);
    setOpen(false);
    if (!props.value) setQuery('');
  }, [cancel, siteUrl, demo, props.pageKind]);
  React.useEffect(() => {
    if (props.value) {
      cancel();
      setQuery(props.value.title);
      setOpen(false);
      setBusy(false);
      setError('');
    }
  }, [cancel, props.value?.pageItemId, props.value?.sourceUrl]);

  function select(page: PageChoice & { site?: SiteChoice }): void {
    cancel();
    setBusy(false);
    setQuery(page.title);
    setOpen(false);
    setError('');
    props.onSelect(page);
  }

  async function search(text: string): Promise<void> {
    if (!discovery || props.disabled || demo) return;
    const entered = text.trim();
    if (!isLink(entered) && !siteUrl) return;
    cancel();
    const current = ++sequence.current;
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setError('');
    try {
      if (isLink(entered)) {
        if (!discovery.resolvePage) throw new Error('SHAREPOINT_LINK_UNSUPPORTED');
        const page = await discovery.resolvePage(entered, request.signal);
        if (current === sequence.current) {
          if (!matchesKind(page)) {
            setError(s.PagePickerKindMismatch);
            return;
          }
          select(page);
        }
      } else {
        const data = await discovery.searchPages(siteUrl, entered, request.signal);
        if (current !== sequence.current) return;
        setResult({ key: siteUrl + '|' + entered, data });
        setOpen(true);
      }
    } catch (failure) {
      if (!request.signal.aborted && current === sequence.current) setError(errorMessage(failure, s));
    } finally {
      if (current === sequence.current) {
        setBusy(false);
        controller.current = undefined;
      }
    }
  }

  function change(value: string): void {
    cancel();
    setQuery(value);
    setError('');
    setBusy(false);
    if (props.value) props.onSelect(undefined);
    setOpen(demo || (!!siteUrl && !isLink(value)));
    // Typing searches the site's pages after a pause; a link waits for Enter or Use this link.
    if (!demo && !composing.current && !isLink(value) && siteUrl) {
      timer.current = setTimeout(() => {
        timer.current = undefined;
        search(value).catch(() => undefined);
      }, 350);
    }
  }

  const filter = props.value?.title === query ? '' : query.trim().toLocaleLowerCase();
  const resultKey = siteUrl + '|' + (props.value?.title === query ? '' : query.trim());
  const liveChoices = result?.key === resultKey ? result.data.items : [];
  const candidates = demo ? props.demoPages!.filter(page => page.title.toLocaleLowerCase().indexOf(filter) >= 0) : liveChoices;
  const choices = candidates.filter(matchesKind).slice(0, 20);
  const hasMore = !demo && result?.key === resultKey && result.data.hasMore;
  const noMatches = !busy && !error && choices.length === 0 && (demo || result?.key === resultKey);
  const notice = busy ? s.PickerSearching : error || (hasMore ? s.PickerRefine : noMatches ? s.PickerNoPages : '');
  const hint = !available ? s.PickerUnavailable
    : demo ? s.PagePickerDemoHelp
    : siteUrl ? s.PagePickerHelp
    : s.PagePickerNoSite;

  return <div className={styles.root} data-testid="page-picker">
    <Field label={s.PagePickerLabel} hint={hint}>
      <div className={styles.siteRow}>
        <Combobox className={styles.combobox} input={{ className: styles.siteInput }}
          listbox={{ className: styles.listbox }} inlinePopup freeform
          aria-label={s.PagePickerLabel} aria-describedby={id + '-status'} placeholder={s.PagePickerPlaceholder}
          expandIcon={{ 'aria-label': s.PickerOpenPages }} disabled={disabled}
          value={query} selectedOptions={props.value ? [props.value.sourceUrl] : []} open={open && !disabled}
          onOpenChange={(_event, data) => {
            setOpen(data.open);
            // Opening the list shows the site's newest pages.
            if (data.open && !demo && siteUrl && result?.key !== resultKey && !busy) {
              search(props.value?.title === query ? '' : query).catch(() => undefined);
            }
          }}
          onChange={event => change(event.target.value)}
          onCompositionStart={() => {
            composing.current = true;
            cancel();
          }}
          onCompositionEnd={event => {
            composing.current = false;
            change(event.currentTarget.value);
          }}
          onOptionSelect={(_event, data) => {
            const choice = choices.find(page => page.sourceUrl === data.optionValue);
            if (choice) select(choice);
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              cancel();
              setBusy(false);
              setOpen(false);
            }
            if (event.key === 'Enter' && !event.nativeEvent.isComposing && isLink(query) && !demo) {
              event.preventDefault();
              if (!busy) search(query).catch(() => undefined);
            }
          }}>
          {choices.map(page => <Option className={styles.option} key={page.sourceUrl} value={page.sourceUrl} text={page.title}>
            <span className={styles.choiceText}>
              <span>{page.title}</span>
              <span className={styles.hint}>{page.pageKind === 'news' ? s.News : s.PageKindPage}</span>
            </span>
          </Option>)}
          {notice && <Option className={styles.option} disabled text={notice}>
            <span role="status" aria-live="polite">{busy ? <Spinner size="tiny" label={notice} /> : notice}</span>
          </Option>}
        </Combobox>
        {query && <Button className={styles.compactButton} appearance="subtle" size="small" icon={<Dismiss20Regular />}
          aria-label={s.PickerClear} title={s.PickerClear} disabled={props.disabled} onClick={() => change('')} />}
        {!demo && isLink(query) && !busy && <Button className={styles.compactButton} disabled={disabled}
          onClick={() => {
            search(query).catch(() => undefined);
          }}>{s.PickerUseLink}</Button>}
      </div>
    </Field>
    <div id={id + '-status'} role="status" aria-live="polite">
      {!open && (error || (busy && isLink(query))) &&
        <p className={error ? styles.error : styles.hint}>{error || s.PickerSearching}</p>}
    </div>
  </div>;
}
