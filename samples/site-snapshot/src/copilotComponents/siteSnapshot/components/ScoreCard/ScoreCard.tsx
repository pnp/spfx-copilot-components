import * as React from 'react';
import { Card, Text, Title3, Button, MessageBar, MessageBarBody, mergeClasses } from '@fluentui/react-components';
import { ArrowExpand24Regular } from '@fluentui/react-icons';
import * as strings from 'SiteSnapshotComponentStrings';

import type { IScoreCardProps } from './IScoreCardProps';
import { useScoreCardStyles } from './useScoreCardStyles';
import Formatters from '../../utils/Formatters';
import { Verdict } from '../../models';

// Compact, glanceable card shown inside the Copilot conversation. It leads with
// the health score (clearly labelled, like the dashboard) and shows the few
// numbers that matter most for governance - sharing risk and wasted space -
// rather than every metric. The full detail lives behind "Open breakdown".
export default function ScoreCard(props: IScoreCardProps): React.ReactElement {
  // Props
  const { snapshot, onOpen } = props;
  const styles = useScoreCardStyles();

  const { score, verdict } = snapshot.score;
  const d = snapshot.detail;
  const critical = d.externalShares.filter((x) => x.isCritical).length;
  const totalSize = d.typeBreakdown.reduce((sum, t) => sum + t.sizeBytes, 0);

  const badgeClass: Record<Verdict, string> = {
    Healthy: styles.healthy,
    Watch: styles.watch,
    'At risk': styles.atRisk
  };

  // The numbers you look at first when sizing up a site: how big it is, then how
  // exposed it is, then how much space is being wasted. "Shared outside" turns
  // red if any are risky (an "Anyone" link on an old file).
  const stats: { value: string | number; label: string; alert?: boolean }[] = [
    { value: Formatters.compact(d.totalScanned), label: strings.KpiTotalFiles },
    { value: Formatters.bytes(totalSize), label: strings.KpiTotalSize },
    { value: d.externalShares.length, label: strings.KpiExternal, alert: critical > 0 },
    { value: Formatters.bytes(d.duplicateWastedBytes), label: strings.KpiWasted }
  ];

  return (
    <Card>
      <div className={styles.root}>
        {/* Never let sample figures pass for a live site in the chat. */}
        {snapshot.isSample && <MessageBar intent="info"><MessageBarBody>{strings.SampleNotice}</MessageBarBody></MessageBar>}
        <div className={styles.head}>
          <div className={styles.badgeCol}>
            <div className={mergeClasses(styles.scoreBadge, badgeClass[verdict])}>{score}</div>
            <Text size={100} className={styles.scoreCaption}>{strings.HealthScore}</Text>
          </div>
          <div className={styles.headText}>
            {/* Verdict as a small kicker above the site name. */}
            <Text block size={100} className={styles.kicker}>{strings.HealthLabel} {verdict}</Text>
            <Title3 block>{snapshot.siteName}</Title3>
          </div>
        </div>

        <div className={styles.statRow}>
          {stats.map((s) => (
            <div className={styles.stat} key={s.label}>
              <Text className={mergeClasses(styles.statValue, s.alert ? styles.statAlert : undefined)}>{s.value}</Text>
              <Text size={200} className={styles.statLabel}>{s.label}</Text>
            </div>
          ))}
        </div>

        <Button appearance="primary" icon={<ArrowExpand24Regular />} onClick={onOpen}>
          {strings.OpenBreakdown}
        </Button>
      </div>
    </Card>
  );
}
