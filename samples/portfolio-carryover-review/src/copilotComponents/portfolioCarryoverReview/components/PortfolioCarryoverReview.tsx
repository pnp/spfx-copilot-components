import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  webLightTheme,
  webDarkTheme,
  Title2,
  Body1,
  Caption1,
  Badge,
  Card,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';

import type { IPortfolioCarryoverReviewProps } from './IPortfolioCarryoverReviewProps';

interface IInitiative {
  id: number;
  name: string;
  owner: string;
  status: 'Continue' | 'Deferred' | 'On Hold' | 'Cancelled';
  reason: string;
  reviewDate: string;
}

const initiatives: IInitiative[] = [
  {
    id: 1,
    name: 'SAP S/4HANA Implementation',
    owner: 'Alex Stardust',
    status: 'Continue',
    reason: 'Core implementation activities completed; remaining modules are in progress.',
    reviewDate: 'Nov 15, 2026'
  },
  {
    id: 2,
    name: 'Cloud Migration Program',
    owner: 'Morgan Silver',
    status: 'Deferred',
    reason: 'Implementation postponed due to a change in technology priorities.',
    reviewDate: 'Dec 10, 2026'
  },
  {
    id: 3,
    name: 'Cybersecurity Enhancement',
    owner: 'Riley Moon',
    status: 'On Hold',
    reason: 'Pending architecture review and resource availability.',
    reviewDate: 'Jan 15, 2027'
  },
  {
    id: 4,
    name: 'HR Platform Modernization',
    owner: 'Jordan West',
    status: 'Cancelled',
    reason: 'The initiative was discontinued following a portfolio review.',
    reviewDate: 'N/A'
  },
  {
    id: 5,
    name: 'Enterprise Data Warehouse',
    owner: 'Taylor Nova',
    status: 'Continue',
    reason: 'Initial implementation completed; additional data sources remain to be integrated.',
    reviewDate: 'Nov 30, 2026'
  }
];

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalL,
    width: '100%',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  summaryCard: {
    padding: tokens.spacingHorizontalM
  },
  summaryValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 600
  },
  tableContainer: {
    width: '100%',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeader: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    fontWeight: 600,
    padding: '12px 10px'
  },
  tableCell: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '14px 10px',
    verticalAlign: 'top',
    fontSize: tokens.fontSizeBase300
  },
  initiativeName: {
    fontWeight: 600
  }
});

function getStatusColor(
  status: IInitiative['status']
): 'success' | 'warning' | 'danger' | 'informative' {
  switch (status) {
    case 'Continue':
      return 'success';
    case 'Deferred':
      return 'warning';
    case 'On Hold':
      return 'informative';
    case 'Cancelled':
      return 'danger';
  }
}

export default function PortfolioCarryoverReview(
  props: IPortfolioCarryoverReviewProps
): React.ReactElement {
  const styles = useStyles();

  const theme = props.hostContext.theme === 'dark'
    ? webDarkTheme
    : webLightTheme;

  const continueCount = initiatives.filter(item => item.status === 'Continue').length;
  const deferredCount = initiatives.filter(item => item.status === 'Deferred').length;
  const onHoldCount = initiatives.filter(item => item.status === 'On Hold').length;
  const cancelledCount = initiatives.filter(item => item.status === 'Cancelled').length;

  return (
    <IdPrefixProvider value="copilot-component-">
      <FluentProvider
        theme={theme}
        targetDocument={props.targetDocument}
        style={{ minHeight: '100%' }}
      >
        <div className={styles.root}>
          <div className={styles.header}>
            <Title2>Portfolio Carryover Review</Title2>
            <Body1>
              Review initiatives carried over from FY2026 to FY2027.
            </Body1>
            <Caption1>
              Portfolio planning cycle: FY2027
            </Caption1>
          </div>

          <div className={styles.summary}>
            <Card className={styles.summaryCard}>
              <Caption1>Total initiatives</Caption1>
              <Text className={styles.summaryValue}>
                {initiatives.length}
              </Text>
            </Card>

            <Card className={styles.summaryCard}>
              <Caption1>Continue</Caption1>
              <Text className={styles.summaryValue}>
                {continueCount}
              </Text>
            </Card>

            <Card className={styles.summaryCard}>
              <Caption1>Deferred</Caption1>
              <Text className={styles.summaryValue}>
                {deferredCount}
              </Text>
            </Card>

            <Card className={styles.summaryCard}>
              <Caption1>On Hold</Caption1>
              <Text className={styles.summaryValue}>
                {onHoldCount}
              </Text>
            </Card>

            <Card className={styles.summaryCard}>
              <Caption1>Cancelled</Caption1>
              <Text className={styles.summaryValue}>
                {cancelledCount}
              </Text>
            </Card>
          </div>

          <Card>
            <div style={{ padding: '16px' }}>
              <Title2>Carried-over initiatives</Title2>
              <Caption1>
                Initiatives from previous fiscal years requiring review.
              </Caption1>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>Initiative</th>
                    <th className={styles.tableHeader}>Owner</th>
                    <th className={styles.tableHeader}>Status</th>
                    <th className={styles.tableHeader}>Carryover reason</th>
                    <th className={styles.tableHeader}>Next review</th>
                  </tr>
                </thead>
                <tbody>
                  {initiatives.map(item => (
                    <tr key={item.id}>
                      <td className={styles.tableCell}>
                        <Text className={styles.initiativeName}>
                          {item.name}
                        </Text>
                      </td>
                      <td className={styles.tableCell}>
                        {item.owner}
                      </td>
                      <td className={styles.tableCell}>
                        <Badge
                          appearance="tint"
                          color={getStatusColor(item.status)}
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className={styles.tableCell}>
                        {item.reason}
                      </td>
                      <td className={styles.tableCell}>
                        {item.reviewDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  );
}
