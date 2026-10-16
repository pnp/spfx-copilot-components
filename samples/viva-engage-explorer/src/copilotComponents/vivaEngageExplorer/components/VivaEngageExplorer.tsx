import * as React from 'react';
import {
  Body1, Button, Card, Field, FluentProvider, IdPrefixProvider, Input,
  MessageBar, MessageBarBody, Select, Spinner, Subtitle1, Title1, Title3,
  webDarkTheme, webLightTheme
} from '@fluentui/react-components';
import {
  ArrowCollapseAll24Regular, ArrowExpand24Regular, ArrowClockwise20Regular, Search20Regular
} from '@fluentui/react-icons';
import type { IVivaEngageExplorerProps } from './IVivaEngageExplorerProps';
import type { ICommunity, ICommunitySnapshot } from '../models/ICommunity';
import type { ICommunityExplorerQuery } from '../VivaEngageExplorerCopilotComponentProperties';
import { classifyError, type CommunityServiceError } from '../services/GraphVivaEngageService';
import { filterCommunities } from '../utils/communityFilters';
import { CommunityCard } from './CommunityCard';
import { CommunityDetails } from './CommunityDetails';
import { ServiceError } from './ServiceError';
import { useExplorerStyles } from './explorerStyles';

function ExplorerContent(props: IVivaEngageExplorerProps): React.ReactElement {
  const { strings, service } = props;
  const styles = useExplorerStyles();
  const fullscreen = props.hostContext.displayMode === 'fullscreen';
  const queryKey = JSON.stringify(props.query);
  const initialQuery = React.useMemo<ICommunityExplorerQuery>(() => props.query ?? {}, [queryKey]);
  const [query, setQuery] = React.useState(initialQuery);
  const [search, setSearch] = React.useState(initialQuery.searchText ?? '');
  const [snapshot, setSnapshot] = React.useState<ICommunitySnapshot>(() => service.getSnapshot());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<CommunityServiceError>();
  const [hostError, setHostError] = React.useState(false);
  const [switchingMode, setSwitchingMode] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string>();
  const [community, setCommunity] = React.useState<ICommunity>();
  const [detailError, setDetailError] = React.useState<CommunityServiceError>();
  const [detailAttempt, setDetailAttempt] = React.useState(0);
  const [loadAttempt, setLoadAttempt] = React.useState(0);
  const [limit, setLimit] = React.useState(24);
  const forceRefresh = React.useRef(false);
  const selectionApplied = React.useRef(false);

  React.useEffect(() => {
    setQuery(initialQuery);
    setSearch(initialQuery.searchText ?? '');
    setSelectedId(initialQuery.action === 'details' ? initialQuery.communityId : undefined);
    selectionApplied.current = false;
  }, [initialQuery]);

  React.useEffect(() => {
    const timer = setTimeout(() => setQuery(current => ({ ...current, searchText: search })), 250);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    if (!props.query) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(undefined);
    const id = query.communityId;
    const request = id
      ? service.getCommunityById(id, forceRefresh.current).then(result => [result])
      : forceRefresh.current ? service.refresh() : service.getCommunities();
    forceRefresh.current = false;
    setSnapshot(id ? { communities: [], complete: false } : service.getSnapshot());
    request.then(results => {
      if (active) setSnapshot(id ? { communities: results, complete: true } : service.getSnapshot());
    }).catch((failure: unknown) => {
      if (active) {
        setSnapshot(id ? { communities: [], complete: false } : service.getSnapshot());
        setError(classifyError(failure));
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [service, loadAttempt, !!props.query, query.communityId]);

  React.useEffect(() => {
    if (loading || selectionApplied.current || initialQuery.action !== 'details' ||
      initialQuery.communityId || !initialQuery.searchText?.trim()) return;
    const matches = filterCommunities(snapshot.communities, initialQuery);
    const exact = matches.filter(item =>
      item.displayName?.toLocaleLowerCase() === initialQuery.searchText?.trim().toLocaleLowerCase());
    const match = exact.length === 1 ? exact[0] : matches.length === 1 ? matches[0] : undefined;
    if (match) setSelectedId(match.id);
    selectionApplied.current = true;
  }, [snapshot, initialQuery, loading]);

  React.useEffect(() => {
    setCommunity(undefined);
    setDetailError(undefined);
    if (!selectedId) return;
    let active = true;
    service.getCommunityById(selectedId).then(result => {
      if (active) setCommunity(result);
    }).catch((failure: unknown) => {
      if (active) setDetailError(classifyError(failure));
    });
    return () => { active = false; };
  }, [service, selectedId, detailAttempt]);

  const filtered = React.useMemo(() => filterCommunities(snapshot.communities, query), [snapshot, query]);
  const counts = React.useMemo(() => ({
    public: snapshot.communities.filter(item => item.privacy === 'public').length,
    private: snapshot.communities.filter(item => item.privacy === 'private').length
  }), [snapshot]);

  React.useEffect(() => setLimit(24), [query.searchText, query.searchIn, query.privacy, query.sortBy]);

  const openDetails = React.useCallback((id: string): void => setSelectedId(id), []);
  const retryList = (): void => { setLoadAttempt(value => value + 1); };
  const refresh = (): void => {
    forceRefresh.current = true;
    selectionApplied.current = true;
    setSelectedId(undefined);
    retryList();
  };
  const clear = (): void => {
    selectionApplied.current = true;
    setSearch('');
    setQuery({ privacy: 'all', sortBy: 'nameAsc', searchText: '', searchIn: 'all' });
    setSelectedId(undefined);
  };
  const changeMode = async (): Promise<void> => {
    setSwitchingMode(true);
    setHostError(false);
    try {
      await props.onRequestDisplayMode(fullscreen ? 'inline' : 'fullscreen');
    } catch {
      setHostError(true);
    } finally {
      setSwitchingMode(false);
    }
  };
  const shown = filtered.slice(0, fullscreen ? limit : 4);
  const summaries = [
    { label: strings.Retrieved, value: snapshot.communities.length },
    { label: strings.Public, value: counts.public },
    { label: strings.Private, value: counts.private }
  ];

  if (!props.query) return <MessageBar intent="error"><MessageBarBody>{strings.InvalidQuery}</MessageBarBody></MessageBar>;

  return (
    <main className={styles.root} aria-label={strings.Title}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>{strings.Eyebrow}</span>
        {fullscreen ? <Title1 as="h1">{strings.Title}</Title1> : <Title3 as="h1">{strings.Title}</Title3>}
        <Body1 className={styles.muted}>{strings.Subtitle}</Body1>
        <div className={styles.actions}>
          {(!props.hostContext.availableDisplayModes ||
            props.hostContext.availableDisplayModes.includes(fullscreen ? 'inline' : 'fullscreen')) && (
            <Button appearance="primary" disabled={switchingMode}
              icon={fullscreen ? <ArrowCollapseAll24Regular /> : <ArrowExpand24Regular />}
              onClick={() => { changeMode().catch(() => setHostError(true)); }}>
              {fullscreen ? strings.Collapse : strings.Expand}
            </Button>
          )}
          <Button icon={<ArrowClockwise20Regular />} disabled={loading}
            onClick={refresh}>{strings.Refresh}</Button>
        </div>
      </header>
 
      {hostError && <MessageBar intent="error"><MessageBarBody>{strings.HostError}</MessageBarBody></MessageBar>}
      {error && <ServiceError error={error} strings={strings} onRetry={retryList} />}

      <section aria-label={strings.Retrieved} className={styles.summaries}>
        {summaries.map(item => (
          <Card key={item.label} className={styles.summary}>
            <span className={styles.count}>{loading ? '-' : item.value.toLocaleString()}</span>
            <Body1 className={styles.muted}>{item.label}</Body1>
          </Card>
        ))}
      </section>

      <section aria-label={strings.Search} className={styles.filters}>
        <Field label={strings.Search} className={styles.search}>
          <Input value={search} contentBefore={<Search20Regular />} placeholder={strings.SearchPlaceholder}
            onChange={(_event, data) => setSearch(data.value)} type="search" />
        </Field>
        <Field label={strings.SearchIn} className={styles.filter}>
          <Select value={query.searchIn ?? 'all'} onChange={(_event, data) => {
            const value = data.value;
            if (value === 'all' || value === 'name' || value === 'description') setQuery(current => ({ ...current, searchIn: value }));
          }}>
            <option value="all">{strings.AllFields}</option><option value="name">{strings.Name}</option>
            <option value="description">{strings.Description}</option>
          </Select>
        </Field>
        <Field label={strings.Privacy} className={styles.filter}>
          <Select value={query.privacy ?? 'all'} onChange={(_event, data) => {
            const value = data.value;
            if (value === 'all' || value === 'public' || value === 'private') setQuery(current => ({ ...current, privacy: value }));
          }}>
            <option value="all">{strings.AllPrivacy}</option><option value="public">{strings.Public}</option>
            <option value="private">{strings.Private}</option>
          </Select>
        </Field>
        <Field label={strings.Sort} className={styles.filter}>
          <Select value={query.sortBy ?? 'nameAsc'} onChange={(_event, data) => {
            const value = data.value;
            if (value === 'nameAsc' || value === 'nameDesc') setQuery(current => ({ ...current, sortBy: value }));
          }}>
            <option value="nameAsc">{strings.Ascending}</option><option value="nameDesc">{strings.Descending}</option>
          </Select>
        </Field>
        <Button onClick={clear}>{strings.Clear}</Button>
      </section>

      {loading ? <Spinner label={strings.Loading} /> : (
        <section className={styles.section} aria-label={strings.Directory}>
          <div className={styles.header}>
            <Subtitle1 as="h2">{strings.Directory}</Subtitle1>
            <Body1 aria-live="polite">{strings.Results.replace('{0}', filtered.length.toLocaleString())}</Body1>
          </div>
          <Body1 className={styles.muted}>{query.communityId ? strings.SingleCommunityScope :
            snapshot.complete ? strings.LoadedScope : strings.PartialScope}</Body1>
          {initialQuery.action === 'details' && !selectedId && filtered.length > 1 &&
            <MessageBar><MessageBarBody>{strings.AmbiguousDetails}</MessageBarBody></MessageBar>}
          {shown.length ? <div className={styles.gallery}>{shown.map(item => (
            <CommunityCard key={item.id} community={item} strings={strings} onDetails={openDetails} />
          ))}</div> : snapshot.complete || snapshot.communities.length > 0 ? (
            <div className={styles.empty}>{snapshot.communities.length ? strings.NoMatches : strings.NoCommunities}</div>
          ) : undefined}
          {shown.length > 0 && <Body1 className={styles.muted}>
            {strings.Showing.replace('{0}', shown.length.toLocaleString()).replace('{1}', filtered.length.toLocaleString())}
          </Body1>}
          {filtered.length > shown.length && (fullscreen ?
            <Button onClick={() => setLimit(value => value + 24)}>{strings.ShowMore}</Button> :
            <Body1 className={styles.muted}>{strings.InlineLimit}</Body1>)}
        </section>
      )}
      <CommunityDetails open={!!selectedId} community={community} error={detailError} strings={strings}
        onClose={() => setSelectedId(undefined)} onRetry={() => setDetailAttempt(value => value + 1)} />
    </main>
  );
}

export default function VivaEngageExplorer(props: IVivaEngageExplorerProps): React.ReactElement {
  // Fluent UI uses this prefix in CSS selectors; React IDs contain unescaped colons.
  const prefix = React.useId().replace(/:/g, '');
  return (
    <IdPrefixProvider value={`engage-${prefix}-`}>
      <FluentProvider theme={props.hostContext.theme === 'dark' ? webDarkTheme : webLightTheme}
        targetDocument={props.targetDocument} style={{ minHeight: '100%' }}>
        <ExplorerContent {...props} />
      </FluentProvider>
    </IdPrefixProvider>
  );
}
