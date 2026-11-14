import * as React from 'react';
import {
  Badge,
  Button,
  Caption1,
  Card,
  CardHeader,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  ProgressBar,
  Skeleton,
  SkeletonItem,
  Subtitle1,
  Subtitle2,
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import {
  ArrowTrendingDownRegular,
  ArrowTrendingRegular,
  CalendarClockRegular,
  CheckmarkCircleRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  ClockRegular,
  ErrorCircleRegular,
  FlashRegular,
  OpenRegular,
  PeopleRegular,
  PersonAlertRegular,
  PersonQuestionMarkRegular,
  ShareRegular,
  ShieldErrorRegular,
  SubtractRegular,
  WarningRegular
} from '@fluentui/react-icons';
import { createCopilotTextContent } from '@microsoft/sp-copilot-component';
import type { ISPCopilotBridge } from '@microsoft/sp-copilot-component';
import * as strings from 'SharePointGovernanceCopilotComponentStrings';

import {
  GovernanceHealthBand,
  GovernanceRiskSeverity,
  GovernanceRiskType,
  GovernanceScoreTrend,
  IGovernanceResult,
  IGovernanceRisk,
  IGovernanceTenantInsights
} from '../models/IGovernanceRisk';

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  headerMeta: { color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap' },
  heroCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL
  },
  heroTop: {
    display: 'grid',
    width: '100%',
    maxWidth: '1100px',
    marginLeft: 'auto',
    marginRight: 'auto',
    gridTemplateColumns: '2fr 1fr',
    alignItems: 'stretch',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr'
    }
  },
  kpiPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusLarge
  },
  kpiPanelPrimary: { backgroundColor: tokens.colorNeutralBackground3 },
  kpiPanelSecondary: { backgroundColor: tokens.colorNeutralBackground2 },
  heroScoreValue: { fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800, fontWeight: tokens.fontWeightBold },
  heroBadges: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacingHorizontalS },
  heroProgress: { maxWidth: '280px' },
  heroReductionValue: { fontSize: tokens.fontSizeHero700, lineHeight: tokens.lineHeightHero700, fontWeight: tokens.fontWeightBold, color: tokens.colorPaletteMarigoldForeground1 },
  topRiskPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
    borderLeft: `4px solid ${tokens.colorPaletteRedBorderActive}`
  },
  heroActions: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  actionsList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  actionItem: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    alignItems: 'stretch',
    gap: tokens.spacingHorizontalS
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalS,
    height: '100%',
    minHeight: '148px',
    padding: tokens.spacingVerticalL,
    textAlign: 'center'
  },
  metricValue: {
    fontSize: tokens.fontSizeHero700,
    lineHeight: tokens.lineHeightHero700,
    fontWeight: tokens.fontWeightBold
  },
  metricLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground3
  },
  findingsHeader: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacingHorizontalS },
  list: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  row: { padding: tokens.spacingVerticalM },
  rowBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalXS
  },
  explainRow: { display: 'flex', gap: tokens.spacingHorizontalXS },
  explainLabel: { minWidth: '140px', flexShrink: 0, fontWeight: tokens.fontWeightSemibold },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3
  },
  actions: { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: tokens.spacingHorizontalS, marginTop: tokens.spacingVerticalS },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalXXL
  }
});

export interface ISharePointGovernanceDashboardProps {
  data?: IGovernanceResult;
  loading: boolean;
  error?: string;
  bridge: ISPCopilotBridge;
}

const riskTypeIcon: Record<GovernanceRiskType, React.ReactElement> = {
  missingOwner: <PersonQuestionMarkRegular />,
  inactive: <ClockRegular />,
  broadSharing: <ShareRegular />,
  expiring: <CalendarClockRegular />
};

const riskTypeLabel: Record<GovernanceRiskType, string> = {
  missingOwner: strings.RiskTypeMissingOwner,
  inactive: strings.RiskTypeInactive,
  broadSharing: strings.RiskTypeBroadSharing,
  expiring: strings.RiskTypeExpiring
};

const severityColor: Record<GovernanceRiskSeverity, 'danger' | 'warning' | 'informative'> = {
  high: 'danger',
  medium: 'warning',
  low: 'informative'
};

const severityLabel: Record<GovernanceRiskSeverity, string> = {
  high: strings.SeverityHigh,
  medium: strings.SeverityMedium,
  low: strings.SeverityLow
};

const severityRank: Record<GovernanceRiskSeverity, number> = { high: 0, medium: 1, low: 2 };

const trendIcon: Record<GovernanceScoreTrend, React.ReactElement> = {
  improving: <ArrowTrendingRegular />,
  stable: <SubtractRegular />,
  declining: <ArrowTrendingDownRegular />
};

const trendColor: Record<GovernanceScoreTrend, 'success' | 'subtle' | 'danger'> = {
  improving: 'success',
  stable: 'subtle',
  declining: 'danger'
};

const trendLabel: Record<GovernanceScoreTrend, string> = {
  improving: strings.TrendImproving,
  stable: strings.TrendStable,
  declining: strings.TrendDeclining
};

const healthBandIcon: Record<GovernanceHealthBand, React.ReactElement> = {
  excellent: <CheckmarkCircleRegular />,
  good: <CheckmarkCircleRegular />,
  fair: <WarningRegular />,
  poor: <WarningRegular />,
  critical: <ErrorCircleRegular />
};

const healthBandColor: Record<GovernanceHealthBand, 'success' | 'warning' | 'severe' | 'danger'> = {
  excellent: 'success',
  good: 'success',
  fair: 'warning',
  poor: 'severe',
  critical: 'danger'
};

const healthBandLabel: Record<GovernanceHealthBand, string> = {
  excellent: strings.HealthBandExcellent,
  good: strings.HealthBandGood,
  fair: strings.HealthBandFair,
  poor: strings.HealthBandPoor,
  critical: strings.HealthBandCritical
};

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

function scoreProgressColor(band: GovernanceHealthBand): 'success' | 'warning' | 'error' {
  if (band === 'excellent' || band === 'good') return 'success';
  if (band === 'fair') return 'warning';
  return 'error';
}

function formatTrendDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function riskReductionImpactLabel(percent: number): string {
  if (percent >= 50) return strings.RiskReductionImpactHigh;
  if (percent >= 25) return strings.RiskReductionImpactMedium;
  return strings.RiskReductionImpactLow;
}

function riskReductionImpactColor(percent: number): 'success' | 'warning' | 'informative' {
  if (percent >= 50) return 'success';
  if (percent >= 25) return 'warning';
  return 'informative';
}

const Metric: React.FC<{ label: string; value: number; color: string; icon: React.ReactElement }> = ({ label, value, color, icon }) => {
  const styles = useStyles();
  return (
    <Card className={styles.metric}>
      <Text size={600} style={{ color }}>{icon}</Text>
      <Text className={styles.metricValue}>{value}</Text>
      <Text className={styles.metricLabel}>{label}</Text>
    </Card>
  );
};

/**
 * Copilot-style executive hero: Governance Health score, executive summary, the
 * tenant's single top risk, priority actions, and the estimated risk reduction —
 * everything a leader needs before scanning individual findings, in one glance.
 */
const GovernanceHealthHero: React.FC<{ data: IGovernanceResult }> = ({ data }) => {
  const styles = useStyles();
  const band = data.governanceHealthBand;

  return (
    <Card className={styles.heroCard}>
      <div className={styles.heroTop}>
        <Card className={mergeClasses(styles.kpiPanel, styles.kpiPanelPrimary)} appearance="filled-alternative">
          <Caption1>{strings.GovernanceHealthTitle}</Caption1>
          <Text className={styles.heroScoreValue}>{data.governanceScore} / 100</Text>
          <div className={styles.heroBadges}>
            <Badge appearance="tint" color={healthBandColor[band]} icon={healthBandIcon[band]}>
              {healthBandLabel[band]}
            </Badge>
            <Badge appearance="tint" color={trendColor[data.scoreTrend]} icon={trendIcon[data.scoreTrend]}>
              {trendLabel[data.scoreTrend]} ({formatTrendDelta(data.scoreTrendDelta)})
            </Badge>
          </div>
          <div className={styles.heroProgress}>
            <ProgressBar value={data.governanceScore / 100} thickness="large" color={scoreProgressColor(band)} />
          </div>
          <Caption1>{strings.TotalFindingsLabel}: {data.totalFindings}</Caption1>
        </Card>

        {data.estimatedRiskReductionPercent > 0 && (
          <Card className={mergeClasses(styles.kpiPanel, styles.kpiPanelSecondary)} appearance="filled-alternative">
            <Caption1>{strings.PotentialRiskReductionTitle}</Caption1>
            <Text className={styles.heroReductionValue}>{data.estimatedRiskReductionPercent}%</Text>
            <Badge appearance="tint" color={riskReductionImpactColor(data.estimatedRiskReductionPercent)}>
              {riskReductionImpactLabel(data.estimatedRiskReductionPercent)}
            </Badge>
            <Caption1>{strings.EstimatedImprovementLabel}</Caption1>
          </Card>
        )}
      </div>

      <Text>{data.executiveSummary}</Text>

      {data.topRisk && (
        <Card className={styles.topRiskPanel} appearance="outline">
          <Subtitle2>{strings.TopRiskTitle}</Subtitle2>
          <Text>{data.topRisk.description}</Text>
          <Caption1>{strings.SeverityLabel}: {severityLabel[data.topRisk.severity]}</Caption1>
        </Card>
      )}

      {data.priorityActions.length > 0 && (
        <div className={styles.heroActions}>
          <Subtitle2>{strings.PriorityActionsTitle}</Subtitle2>
          <div className={styles.actionsList}>
            {data.priorityActions.map((action) => (
              <div key={action} className={styles.actionItem}>
                <CheckmarkCircleRegular fontSize={16} />
                <Text>{action}</Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

const TenantInsightsPanel: React.FC<{ insights: IGovernanceTenantInsights }> = ({ insights }) => {
  const styles = useStyles();
  return (
    <Card>
      <CardHeader header={<Subtitle2>{strings.TenantInsightsTitle}</Subtitle2>} />
      <div className={styles.insightsGrid}>
        <Metric
          label={strings.SummaryMissingOwner}
          value={insights.sitesWithoutOwners}
          color={tokens.colorPaletteRedForeground1}
          icon={<PersonQuestionMarkRegular fontSize={24} />}
        />
        <Metric
          label={strings.SummaryInactive}
          value={insights.sitesInactive180Days}
          color={tokens.colorPaletteMarigoldForeground1}
          icon={<ClockRegular fontSize={24} />}
        />
        <Metric
          label={strings.SummaryBroadSharing}
          value={insights.sitesWithAnonymousSharing}
          color={tokens.colorPaletteRedForeground1}
          icon={<ShareRegular fontSize={24} />}
        />
        <Metric
          label={strings.SummaryExcessiveGuestAccess}
          value={insights.sitesWithExcessiveGuestAccess}
          color={tokens.colorPaletteRedForeground1}
          icon={<PersonAlertRegular fontSize={24} />}
        />
        <Metric
          label={strings.SummaryExpiring}
          value={insights.expiringReviews}
          color={tokens.colorPaletteMarigoldForeground1}
          icon={<CalendarClockRegular fontSize={24} />}
        />
      </div>
    </Card>
  );
};

const RiskRow: React.FC<{ risk: IGovernanceRisk; bridge: ISPCopilotBridge }> = ({ risk, bridge }) => {
  const styles = useStyles();

  // Placeholder remediation action: asks Copilot to help, since no backend write API exists yet.
  const handleRemediate = React.useCallback(async (): Promise<void> => {
    await bridge.sendFollowUpMessageAsync([
      createCopilotTextContent(`${strings.AskCopilotPrefix} "${risk.siteName}": ${risk.recommendedAction}`)
    ]);
  }, [bridge, risk.recommendedAction, risk.siteName]);

  return (
    <Card className={styles.row}>
      <CardHeader
        header={<Text weight="semibold">{risk.siteName}</Text>}
        description={
          <Badge appearance="outline" icon={riskTypeIcon[risk.type]}>
            {riskTypeLabel[risk.type]}
          </Badge>
        }
        action={
          <Badge appearance="filled" color={severityColor[risk.severity]}>
            {severityLabel[risk.severity]}
          </Badge>
        }
      />

      <div className={styles.rowBody}>
        <div className={styles.explainRow}>
          <Text className={styles.explainLabel}>{strings.RiskLabel}:</Text>
          <Text>{risk.reason}</Text>
        </div>
        <div className={styles.explainRow}>
          <Text className={styles.explainLabel}>{strings.ImpactLabel}:</Text>
          <Text className={styles.metaItem}>{risk.impact}</Text>
        </div>
        <div className={styles.explainRow}>
          <Text className={styles.explainLabel}>{strings.WhyItMattersLabel}:</Text>
          <Text>{risk.whyItMatters}</Text>
        </div>
        <div className={styles.explainRow}>
          <Text className={styles.explainLabel}>{strings.RecommendedActionLabel}:</Text>
          <Text weight="semibold">{risk.recommendedAction}</Text>
        </div>

        <div className={styles.meta}>
          {risk.ownerCount !== undefined && (
            <span className={styles.metaItem}>
              <PeopleRegular fontSize={16} />
              <Caption1>{risk.ownerCount} {strings.OwnerCountLabel}</Caption1>
            </span>
          )}
          {risk.lastActivityDate && (
            <span className={styles.metaItem}>
              <ClockRegular fontSize={16} />
              <Caption1>{strings.LastActivityLabel}: {formatDate(risk.lastActivityDate)}</Caption1>
            </span>
          )}
          {risk.expirationDate && (
            <span className={styles.metaItem}>
              <CalendarClockRegular fontSize={16} />
              <Caption1>{strings.ReviewDueLabel}: {formatDate(risk.expirationDate)}</Caption1>
            </span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button appearance="primary" icon={<FlashRegular />} onClick={handleRemediate}>
          {risk.ctaLabel}
        </Button>
        <Button as="a" href={risk.siteUrl} target="_blank" rel="noreferrer" appearance="secondary" icon={<OpenRegular />}>
          {strings.OpenSiteButtonLabel}
        </Button>
      </div>
    </Card>
  );
};

const FindingsList: React.FC<{ risks: IGovernanceRisk[]; bridge: ISPCopilotBridge }> = ({ risks, bridge }) => {
  const styles = useStyles();
  const [showLowPriority, setShowLowPriority] = React.useState<boolean>(false);

  if (risks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <CheckmarkCircleRegular fontSize={32} style={{ color: tokens.colorPaletteGreenForeground1 }} />
        <Subtitle2>{strings.EmptyStateTitle}</Subtitle2>
        <Caption1>{strings.EmptyStateDescription}</Caption1>
      </div>
    );
  }

  const sorted = [...risks].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  const priorityRisks = sorted.filter((risk) => risk.severity !== 'low');
  const lowPriorityRisks = sorted.filter((risk) => risk.severity === 'low');

  return (
    <div className={styles.list}>
      <div className={styles.findingsHeader}>
        <Caption1>
          {strings.ShowingFindingsLabel} {priorityRisks.length} {strings.PriorityFindingsSuffix}.{' '}
          {lowPriorityRisks.length} {strings.HiddenFindingsSuffix}.
        </Caption1>
        {lowPriorityRisks.length > 0 && (
          <Button
            appearance="transparent"
            size="small"
            icon={showLowPriority ? <ChevronUpRegular /> : <ChevronDownRegular />}
            onClick={() => setShowLowPriority((previous) => !previous)}
          >
            {showLowPriority ? strings.HideLowPriorityButtonLabel : strings.ShowLowPriorityButtonLabel}
          </Button>
        )}
      </div>

      {priorityRisks.map((risk) => <RiskRow key={risk.id} risk={risk} bridge={bridge} />)}
      {showLowPriority && lowPriorityRisks.map((risk) => <RiskRow key={risk.id} risk={risk} bridge={bridge} />)}
    </div>
  );
};

export const SharePointGovernanceDashboard: React.FC<ISharePointGovernanceDashboardProps> = ({ data, loading, error, bridge }) => {
  const styles = useStyles();

  if (loading) {
    return (
      <div className={styles.root} role="status" aria-label={strings.LoadingLabel}>
        <Skeleton><SkeletonItem shape="rectangle" style={{ height: 72 }} /></Skeleton>
        <Skeleton><SkeletonItem shape="rectangle" style={{ height: 96 }} /></Skeleton>
        <div className={styles.insightsGrid}>
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key}><SkeletonItem shape="rectangle" style={{ height: 64 }} /></Skeleton>
          ))}
        </div>
        <Skeleton><SkeletonItem shape="rectangle" style={{ height: 96 }} /></Skeleton>
        <Skeleton><SkeletonItem shape="rectangle" style={{ height: 96 }} /></Skeleton>
      </div>
    );
  }

  if (error) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>
          <MessageBarTitle>{strings.ErrorStateTitle}</MessageBarTitle>
          {error}
        </MessageBarBody>
      </MessageBar>
    );
  }

  if (!data) {
    return <></>;
  }

  return (
    <section className={styles.root} aria-label={strings.DashboardTitle}>
      <Card>
        <CardHeader
          image={<ShieldErrorRegular fontSize={28} />}
          header={<Subtitle1>{strings.DashboardTitle}</Subtitle1>}
          description={<Text>{strings.DashboardSubtitle}</Text>}
          action={
            <Tooltip content={new Date(data.generatedAt).toLocaleString()} relationship="label">
              <Caption1 className={styles.headerMeta}>{strings.GeneratedAtLabel} {formatDate(data.generatedAt)}</Caption1>
            </Tooltip>
          }
        />
      </Card>

      <GovernanceHealthHero data={data} />

      <Divider />

      <TenantInsightsPanel insights={data.tenantInsights} />

      <Divider />

      <FindingsList risks={data.risks} bridge={bridge} />
    </section>
  );
};
