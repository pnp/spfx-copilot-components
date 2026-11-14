import * as React from 'react';
import {
  Button,
  Caption1,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';

import { ComponentHeader } from '../../shared/ComponentHeader';
import { LoadStatus, toErrorMessage, type LoadState } from '../../shared/LoadState';
import { ThemeProvider } from '../../shared/ThemeProvider';
import {
  resolveSiteUrl,
  type ISharePointList,
  type ISharePointListItem
} from '../services/SharePointListsService';
import type { ISharePointListsProps } from './ISharePointListsProps';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    boxSizing: 'border-box',
    minWidth: 0
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    listStyleType: 'none',
    margin: 0,
    padding: 0
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM
  },
  listButton: {
    justifyContent: 'flex-start',
    flexGrow: 1,
    minWidth: 0
  },
  back: {
    alignSelf: 'flex-start'
  },
  muted: {
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap'
  }
});

interface IResolvedSite {
  url: string;
  error: string;
}

interface ISelection {
  list: ISharePointList;
  siteUrl: string;
}

/**
 * Shows the lists on a SharePoint site. When the user selects a list, shows
 * the items in that list.
 *
 * The component renders at once with a loading state and loads the data in
 * effects, so the Copilot host never shows an empty frame while it waits.
 */
export default function SharePointLists(props: ISharePointListsProps): React.ReactElement {
  const { service, hostContext, onRequestDisplayMode, strings } = props;
  const styles = useStyles();

  // The site URL is a tool argument. Validate it before it is used in a request.
  const site: IResolvedSite = React.useMemo(() => {
    try {
      return { url: resolveSiteUrl(props.siteUrl, props.fallbackSiteUrl), error: '' };
    } catch (error) {
      return { url: '', error: toErrorMessage(error, strings.GenericErrorMessage) };
    }
  }, [props.siteUrl, props.fallbackSiteUrl, strings]);

  const [lists, setLists] = React.useState<LoadState<ISharePointList[]>>({ status: 'loading' });
  const [selection, setSelection] = React.useState<ISelection | undefined>(undefined);
  const [items, setItems] = React.useState<LoadState<ISharePointListItem[]>>({ status: 'loading' });

  // A selection belongs to one site. When the site changes, the old selection
  // stops applying in the same render.
  const selectedList: ISharePointList | undefined =
    selection !== undefined && selection.siteUrl === site.url ? selection.list : undefined;

  // Load the lists when the component starts and when the site changes.
  React.useEffect(() => {
    let cancelled: boolean = false;
    setSelection(undefined);

    if (site.error.length > 0) {
      setLists({ status: 'error', message: site.error });
      return undefined;
    }

    setLists({ status: 'loading' });
    service.getLists(site.url).then(
      (data: ISharePointList[]) => {
        if (!cancelled) {
          setLists({ status: 'ready', data });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setLists({ status: 'error', message: toErrorMessage(error, strings.GenericErrorMessage) });
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [service, site, strings]);

  // Load the items when the user selects a list.
  React.useEffect(() => {
    if (selectedList === undefined) {
      return undefined;
    }

    let cancelled: boolean = false;
    setItems({ status: 'loading' });
    service.getItems(site.url, selectedList.id).then(
      (data: ISharePointListItem[]) => {
        if (!cancelled) {
          setItems({ status: 'ready', data });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setItems({ status: 'error', message: toErrorMessage(error, strings.GenericErrorMessage) });
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [service, site, selectedList, strings]);

  const handleSelect = React.useCallback(
    (event: React.MouseEvent<HTMLElement>): void => {
      const listId: string | undefined = event.currentTarget.dataset.listId;
      if (lists.status !== 'ready') {
        return;
      }
      const list: ISharePointList | undefined = lists.data.find(
        (candidate: ISharePointList) => candidate.id === listId
      );
      setSelection(list === undefined ? undefined : { list, siteUrl: site.url });
    },
    [lists, site]
  );

  const handleBack = React.useCallback((): void => {
    setSelection(undefined);
  }, []);

  // Request the Copilot host to switch this component to fullscreen mode.
  // The host decides. The next render reads the real display mode.
  const handleExpand = React.useCallback((): void => {
    onRequestDisplayMode('fullscreen').catch(() => undefined);
  }, [onRequestDisplayMode]);

  const canExpand: boolean =
    hostContext.displayMode !== 'fullscreen' &&
    (hostContext.availableDisplayModes ?? []).indexOf('fullscreen') !== -1;

  return (
    <ThemeProvider
      theme={hostContext.theme}
      targetDocument={props.targetDocument}
      onContentResize={props.onContentResize}
    >
      <div className={styles.root}>
        <ComponentHeader
          title={selectedList === undefined ? strings.ListsTitle : selectedList.title}
          subtitle={site.url.length > 0 ? site.url : undefined}
          canExpand={canExpand}
          expandLabel={strings.ExpandButtonLabel}
          onRequestFullscreen={handleExpand}
        />

        {selectedList === undefined ? (
          <>
            <LoadStatus state={lists} loadingLabel={strings.LoadingListsLabel} />
            {lists.status === 'ready' && lists.data.length === 0 && (
              <Text>{strings.NoListsMessage}</Text>
            )}
            {lists.status === 'ready' && lists.data.length > 0 && (
              <ul className={styles.rows}>
                {lists.data.map((list: ISharePointList) => (
                  <li key={list.id} className={styles.row}>
                    <Button
                      appearance="subtle"
                      className={styles.listButton}
                      data-list-id={list.id}
                      onClick={handleSelect}
                    >
                      {list.title}
                    </Button>
                    <Caption1 className={styles.muted}>
                      {list.itemCount === 1
                        ? strings.SingleItemCountLabel
                        : strings.ItemCountLabel.replace('{0}', String(list.itemCount))}
                    </Caption1>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <Button
              appearance="subtle"
              className={styles.back}
              icon={<ArrowLeft24Regular />}
              data-action="back"
              onClick={handleBack}
            >
              {strings.BackButtonLabel}
            </Button>
            <LoadStatus state={items} loadingLabel={strings.LoadingItemsLabel} />
            {items.status === 'ready' && items.data.length === 0 && (
              <Text>{strings.NoItemsMessage}</Text>
            )}
            {items.status === 'ready' && items.data.length > 0 && (
              <ul className={styles.rows}>
                {items.data.map((item: ISharePointListItem) => (
                  <li key={item.id} className={styles.row}>
                    <Text>{item.title}</Text>
                    <Caption1 className={styles.muted}>
                      {new Date(item.modified).toLocaleDateString(props.locale)}
                    </Caption1>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </ThemeProvider>
  );
}
