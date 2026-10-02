import * as React from 'react';
import {
  Card,
  Title3,
  Text,
  Badge,
  ProgressBar,
  Button,
  TabList,
  Tab,
  MessageBar,
  MessageBarBody,
  mergeClasses
} from '@fluentui/react-components';
import type { SelectTabData, SelectTabEvent } from '@fluentui/react-components';
import { ArrowDownloadRegular, MailRegular } from '@fluentui/react-icons';
import * as strings from 'SiteSnapshotComponentStrings';

import type { IDashboardProps } from './IDashboardProps';
import { useDashboardStyles } from './useDashboardStyles';
import DetailTable from '../DetailTable/DetailTable';
import InfoTip from '../InfoTip/InfoTip';
import Formatters from '../../utils/Formatters';
import { SCORE_WEIGHTS, Verdict } from '../../models';

type TabValue = 'types' | 'owners' | 'duplicates' | 'stale' | 'external' | 'empty' | 'largest';

// Valid focus values map 1:1 to a detail tab (chat can open one directly).
const FOCUS_TABS: TabValue[] = ['types', 'owners', 'duplicates', 'stale', 'external', 'empty', 'largest'];

interface IKpi {
  value: string | number;
  label: string;
  tip?: string; // only set where the number is not self-explanatory
  alert?: boolean;
}

// The full-screen dashboard: one compact summary card (score, storage and
// sub-scores with explanations), two rows of KPI tiles, and the detail tabs.
export default function Dashboard(props: IDashboardProps): React.ReactElement {
  // Props
  const { snapshot, focus, onExport, onEmail } = props;
  const styles = useDashboardStyles();

  // States - open straight to the focused tab if the chat asked for one.
  const initialTab = (focus && FOCUS_TABS.indexOf(focus as TabValue) >= 0 ? focus : 'types') as TabValue;
  const [tab, setTab] = React.useState<TabValue>(initialTab);
  const [emailState, setEmailState] = React.useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const d = snapshot.detail;
  const s = snapshot.score;
  const usedPct = Formatters.usedPercent(snapshot.storageUsedBytes, snapshot.storageTotalBytes);
  const criticalShares = d.externalShares.filter((x) => x.isCritical).length;
  const totalSize = d.typeBreakdown.reduce((sum, t) => sum + t.sizeBytes, 0);

  const badgeClass: Record<Verdict, string> = {
    Healthy: styles.healthy,
    Watch: styles.watch,
    'At risk': styles.atRisk
  };
  const badgeColor: Record<Verdict, 'success' | 'warning' | 'danger'> = {
    Healthy: 'success',
    Watch: 'warning',
    'At risk': 'danger'
  };

  const bars = [
    { label: strings.FactorStorage, retained: s.subScores.storage, weight: SCORE_WEIGHTS.storage, tip: strings.TipStorage },
    { label: strings.FactorFreshness, retained: s.subScores.stale, weight: SCORE_WEIGHTS.stale, tip: strings.TipFreshness },
    { label: strings.FactorSharing, retained: s.subScores.exposure, weight: SCORE_WEIGHTS.exposure, tip: strings.TipSharing },
    { label: strings.FactorActivity, retained: s.subScores.frecency, weight: SCORE_WEIGHTS.frecency, tip: strings.TipActivity },
    { label: strings.FactorTidiness, retained: s.subScores.tidiness, weight: SCORE_WEIGHTS.tidiness, tip: strings.TipTidiness }
  ];

  // Two rows of six tiles: overview first, then the things to act on. Only the
  // governance-specific numbers carry an info tip; obvious ones do not.
  const kpis: IKpi[] = [
    { value: Formatters.compact(d.totalScanned), label: strings.KpiTotalFiles },
    { value: Formatters.bytes(totalSize), label: strings.KpiTotalSize },
    { value: d.librariesScanned, label: strings.KpiLibraries },
    { value: d.foldersScanned, label: strings.KpiFolders },
    { value: d.largestFiles.length, label: strings.KpiLargest, tip: strings.TipLarge },
    { value: `${usedPct}%`, label: strings.KpiStorageUsed },
    { value: d.staleDocs.length, label: strings.KpiStale, tip: strings.TipStale },
    { value: d.externalShares.length, label: strings.KpiExternal, tip: strings.TipExternal },
    { value: criticalShares, label: strings.KpiCritical, tip: strings.TipCritical, alert: criticalShares > 0 },
    { value: d.duplicates.length, label: strings.KpiDuplicates, tip: strings.TipDuplicates },
    { value: Formatters.bytes(d.duplicateWastedBytes), label: strings.KpiWasted, tip: strings.TipWasted },
    { value: d.emptyFiles.length, label: strings.KpiEmpty }
  ];

  const onEmailClick = React.useCallback(async (): Promise<void> => {
    setEmailState('sending');
    const ok = await onEmail();
    setEmailState(ok ? 'sent' : 'failed');
  }, [onEmail]);

  const onTabSelect = (_e: SelectTabEvent, data: SelectTabData): void => setTab(data.value as TabValue);

  return (
    <div className={styles.root}>
      {/* Summary */}
      <Card className={styles.summaryCard}>
        <span className={styles.cardCorner}><InfoTip content={strings.TipScore} /></span>
        <div className={styles.topRow}>
          <div className={styles.identity}>
            <div className={styles.badgeCol}>
              <div className={mergeClasses(styles.scoreBadge, badgeClass[s.verdict])}>{s.score}</div>
              <Text size={100} className={styles.scoreCaption}>{strings.HealthScore}</Text>
            </div>
            <div className={styles.meta}>
              <Title3>{snapshot.siteName}</Title3>
              <div className={styles.metaLine}>
                <Badge appearance="filled" color={badgeColor[s.verdict]}>{s.verdict}</Badge>
              </div>
            </div>
          </div>
          <div className={styles.actions}>
            <Button appearance="primary" icon={<ArrowDownloadRegular />} onClick={onExport}>{strings.ExportCsv}</Button>
            <Button appearance="secondary" icon={<MailRegular />} onClick={onEmailClick} disabled={emailState === 'sending'}>
              {strings.EmailMeThis}
            </Button>
          </div>
        </div>

        {/* Storage */}
        <div className={styles.scoreRow}>
          <div className={styles.rowHead}>
            <Text weight="semibold" size={300}>{strings.Storage}</Text>
            <Text size={200} className={styles.caption}>
              {Formatters.bytes(snapshot.storageUsedBytes)} of {Formatters.bytes(snapshot.storageTotalBytes)} ({usedPct}%)
            </Text>
          </div>
          <ProgressBar value={usedPct / 100} thickness="large" />
        </div>

        {/* Sub-scores */}
        <div className={styles.subGrid}>
          {bars.map((b) => (
            <div className={styles.scoreRow} key={b.label}>
              <div className={styles.rowHead}>
                <span className={styles.labelRow}>
                  <Text size={200} className={styles.caption}>{b.label}</Text>
                  <InfoTip content={b.tip} />
                </span>
                <Text size={200} className={styles.caption}>{b.retained} / {b.weight}</Text>
              </div>
              <ProgressBar value={b.weight > 0 ? b.retained / b.weight : 0} />
            </div>
          ))}
        </div>
      </Card>

      {snapshot.isSample && <MessageBar intent="info"><MessageBarBody>{strings.SampleNotice}</MessageBarBody></MessageBar>}
      {d.truncated && <MessageBar intent="warning"><MessageBarBody>{strings.ScanCapped}</MessageBarBody></MessageBar>}
      {emailState === 'sent' && <MessageBar intent="success"><MessageBarBody>{strings.EmailSent}</MessageBarBody></MessageBar>}
      {emailState === 'failed' && <MessageBar intent="error"><MessageBarBody>{strings.EmailFailed}</MessageBarBody></MessageBar>}

      {/* KPI tiles - two rows of six, each with a corner info icon */}
      <div className={styles.kpiGrid}>
        {kpis.map((k) => (
          <div className={mergeClasses(styles.kpiCard, k.alert ? styles.kpiAlertCard : undefined)} key={k.label}>
            {k.tip && <span className={styles.kpiCorner}><InfoTip content={k.tip} /></span>}
            <Text className={mergeClasses(styles.kpiValue, k.alert ? styles.kpiAlert : undefined)}>{k.value}</Text>
            <Text size={200} className={styles.kpiLabel}>{k.label}</Text>
          </div>
        ))}
      </div>

      {/* Detail tabs */}
      <Card className={styles.tabsCard}>
        <TabList selectedValue={tab} onTabSelect={onTabSelect}>
          <Tab value="types">{strings.TabTypes} ({d.typeBreakdown.length})</Tab>
          <Tab value="owners">{strings.TabOwners} ({d.ownerBreakdown.length})</Tab>
          <Tab value="duplicates">{strings.TabDuplicates} ({d.duplicates.length})</Tab>
          <Tab value="stale">{strings.TabStale} ({d.staleDocs.length})</Tab>
          <Tab value="external">{strings.TabExternal} ({d.externalShares.length})</Tab>
          <Tab value="empty">{strings.TabEmpty} ({d.emptyFiles.length})</Tab>
          <Tab value="largest">{strings.TabLargest} ({d.largestFiles.length})</Tab>
        </TabList>
        <div className={styles.tabPanel}>
          <DetailTable kind={tab} detail={d} />
        </div>
      </Card>
    </div>
  );
}
