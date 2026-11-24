import * as React from 'react';
import { mergeClasses, Spinner } from '@fluentui/react-components';
import { Checkmark16Filled } from '@fluentui/react-icons';
import { sanitizePlainText } from '../logic/config';
import { uniqueSites, type IPickedSite, type ISiteDirectory } from '../services/sites';
import type { ISiteList } from '../services/lists';
import { ThemedSelect } from './ThemedSelect';
import { ensureGlassScrollStyle, GLASS_SCROLL_CLASS, useWizardStyles } from './styles';

export interface ISiteListPickerProps {
  directory: ISiteDirectory;
  errorMessage?: string;
  /** Site to preselect (Change list). Falls back to the directory current site. */
  preferredSiteUrl?: string;
  onPick(siteUrl: string, listTitle: string): void;
}

function siteFromUrl(url: string, known?: IPickedSite): IPickedSite {
  const trimmed = (url || '').trim();
  if (known && known.url.toLowerCase() === trimmed.toLowerCase()) {
    return known;
  }
  let title = trimmed;
  try {
    const path = new URL(trimmed).pathname.replace(/\/+$/, '');
    const part = path.split('/').filter(Boolean).pop();
    if (part) {
      title = decodeURIComponent(part);
    }
  } catch {
    title = trimmed;
  }
  return { title, url: trimmed, source: 'current' };
}

function initialSite(directory: ISiteDirectory, preferredSiteUrl?: string): IPickedSite | undefined {
  const preferred = (preferredSiteUrl || '').trim();
  if (preferred) {
    return siteFromUrl(preferred, directory.currentSite);
  }
  return directory.currentSite;
}

export function SiteListPicker(props: ISiteListPickerProps): React.ReactElement {
  const styles = useWizardStyles();
  ensureGlassScrollStyle(typeof document !== 'undefined' ? document : undefined);
  const [query, setQuery] = React.useState('');
  const [sites, setSites] = React.useState<IPickedSite[]>([]);
  const [lists, setLists] = React.useState<ISiteList[]>([]);
  const [site, setSite] = React.useState<IPickedSite | undefined>(() => initialSite(props.directory, props.preferredSiteUrl));
  const [listTitle, setListTitle] = React.useState('');
  const [loadingSites, setLoadingSites] = React.useState(true);
  const [loadingLists, setLoadingLists] = React.useState(false);
  const [sitesMessage, setSitesMessage] = React.useState('');
  const [listsMessage, setListsMessage] = React.useState('');
  const directoryRef = React.useRef(props.directory);
  directoryRef.current = props.directory;
  const siteUrl = site ? site.url : '';

  const pendingListFocus = React.useRef(false);
  const [listReveal, setListReveal] = React.useState(0);

  const revealListStep = (): void => {
    const el = document.getElementById('wiz-list-select');
    if (!el) {
      return;
    }
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    if (!(el as HTMLSelectElement).disabled) {
      pendingListFocus.current = false;
      el.focus();
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    setLoadingSites(true);
    const load = async (): Promise<void> => {
      try {
        const text = query.trim();
        const directory = directoryRef.current;
        const found = text
          ? await directory.searchSites(text)
          : uniqueSites((await directory.followedSites()).concat(await directory.recentSites()));
        if (!cancelled) {
          const preferred = (props.preferredSiteUrl || '').trim();
          let rows = found;
          if (preferred) {
            const match = found.find((s) => s.url.toLowerCase() === preferred.toLowerCase());
            if (match) {
              setSite((prev) => (prev && prev.url.toLowerCase() === match.url.toLowerCase() ? match : prev));
            } else if (!text) {
              const stub = siteFromUrl(preferred, directory.currentSite);
              rows = uniqueSites([stub].concat(found));
            }
          }
          setSites(rows);
          setSite((prev) => {
            if (!prev) {
              return prev;
            }
            const match = rows.find((s) => s.url.toLowerCase() === prev.url.toLowerCase());
            return match && match.title !== prev.title ? match : prev;
          });
          setSitesMessage(rows.length === 0 ? (text ? 'No sites matched that search.' : 'No sites were found.') : '');
        }
      } catch {
        if (!cancelled) {
          const current = directoryRef.current.currentSite;
          setSites(current ? [current] : []);
          setSitesMessage('Sites couldn\u2019t be loaded. You can still use this site if it is listed.');
        }
      } finally {
        if (!cancelled) {
          setLoadingSites(false);
        }
      }
    };
    const timer = window.setTimeout(() => {
      load().catch(() => {
        if (!cancelled) {
          setLoadingSites(false);
        }
      });
    }, query ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, props.preferredSiteUrl]);

  React.useEffect(() => {
    if (!siteUrl) {
      setLists([]);
      setListTitle('');
      setLoadingLists(false);
      setListsMessage('');
      return undefined;
    }
    let cancelled = false;
    setLoadingLists(true);
    setLists([]);
    setListTitle('');
    directoryRef.current.listsFor(siteUrl).then(
      (rows) => {
        if (!cancelled) {
          setLists(rows);
          setListsMessage('');
          setLoadingLists(false);
        }
      },
      () => {
        if (!cancelled) {
          setLists([]);
          setLoadingLists(false);
          setListsMessage('The lists on that site couldn\u2019t be loaded.');
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [siteUrl]);

  React.useLayoutEffect(() => {
    if (!pendingListFocus.current) {
      return;
    }
    revealListStep();
  }, [listReveal, loadingLists, siteUrl]);

  const selectSite = (item: IPickedSite): void => {
    pendingListFocus.current = true;
    setSite(item);
    setListReveal((n) => n + 1);
  };

  return (
    <div className={styles.picker} data-testid="wiz-picker">
      <div className={styles.scrollArea} data-testid="wiz-scroll">
        {props.errorMessage ? <p className={styles.pickerIntro} data-testid="wiz-picker-note">{props.errorMessage}</p> : null}
        <div className={styles.pickerSections}>
          <h2 className={styles.pickerHeading}>
            Choose a site and list
          </h2>
          <div className={styles.pickerSection}>
            <label className={styles.pickerLabel} htmlFor="wiz-site-search">
              Search sites
            </label>
            <input
              id="wiz-site-search"
              className={styles.pickerSearch}
              value={query}
              placeholder="Search by site name"
              data-testid="wiz-site-search"
              onChange={(e) => setQuery(e.target.value)}
            />
            {loadingSites ? <Spinner size="small" appearance="inverted" label={'Loading sites\u2026'} data-testid="wiz-sites-spinner" /> : null}
          </div>
          <div className={styles.pickerSection}>
            <p className={styles.pickerLabel}>{query.trim() ? 'Search results' : 'Followed and recent'}</p>
            <ul className={mergeClasses(styles.pickerList, GLASS_SCROLL_CLASS)} data-testid="wiz-site-list">
              {sites.map((item) => {
                const selected = !!(site && site.url === item.url);
                return (
                  <li key={item.url}>
                    <button
                      type="button"
                      className={mergeClasses(styles.pickerItem, selected && styles.pickerItemOn)}
                      aria-selected={selected}
                      title={item.url}
                      aria-label={`${item.title}, ${item.url}`}
                      onClick={() => selectSite(item)}
                      data-testid="wiz-site-option"
                    >
                      <span className={styles.pickerItemBody}>
                        {item.title}
                      </span>
                      {selected ? <span className={styles.pickerCheck} data-testid="wiz-site-check" aria-hidden="true"><Checkmark16Filled /></span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {sitesMessage ? <p className={styles.hint}>{sanitizePlainText(sitesMessage, 200)}</p> : null}
          </div>
          {site ? (
            <div className={styles.pickerSection}>
              <label className={styles.pickerLabel} htmlFor="wiz-list-select">
                List on {site.title}
              </label>
              {loadingLists ? <Spinner size="small" appearance="inverted" label={'Loading lists\u2026'} data-testid="wiz-lists-spinner" /> : null}
              <ThemedSelect
                id="wiz-list-select"
                value={listTitle}
                data-testid="wiz-list-select"
                placeholder={loadingLists ? 'Loading lists\u2026' : lists.length === 0 ? 'No custom lists on this site' : 'Select a list'}
                options={lists.map((l) => ({ value: l.title, label: l.title }))}
                onChange={setListTitle}
              />
              {listsMessage ? <p className={styles.hint}>{sanitizePlainText(listsMessage, 200)}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
      {site ? (
        <div className={mergeClasses(styles.actions, styles.actionsFooter)} data-testid="wiz-footer">
          <button
            type="button"
            className={styles.pill}
            disabled={!listTitle}
            data-testid="wiz-use-list"
            onClick={() => listTitle && props.onPick(site.url, listTitle)}
          >
            Open the form
          </button>
        </div>
      ) : null}
    </div>
  );
}
