import * as React from 'react';
import { Button, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import type { IAppProps } from './FileUploaderApp';
import type { IRecentFilingRow, RecentPeriod } from '../models/filing';
import { ALL_STATUSES } from '../models/sources';
import { RecentController } from '../logic/recentController';
import { describeTimeAgo, formatDateWithRelative } from '../logic/dates';
import { fileBadge, formatMoney, STATUS_LABELS } from '../logic/format';
import { Banner } from './blocks/Banner';
import { ChipRow, ChipSelect, ChipToggle } from './blocks/FilterChip';
import { LinkOut } from './blocks/LinkOut';
import { StatusPill } from './blocks/StatusPill';
import { SummaryList } from './blocks/SummaryList';
import { useReducedMotion } from './blocks/motion';
import { isNarrow, useSharedStyles } from './blocks/useSharedStyles';

const useStyles = makeStyles({
  // Wide content scrolls inside its own container; the component never scrolls sideways.
  tableScroll: { overflowX: 'auto' },
  table: { width: '100%', minWidth: '300px', borderCollapse: 'collapse', fontSize: tokens.fontSizeBase300 },
  th: {
    fontSize: tokens.fontSizeBase200,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    color: tokens.colorNeutralForeground3,
    textAlign: 'left',
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding('8px', '8px', '6px', 0),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2)
  },
  thRight: { textAlign: 'right' },
  td: {
    ...shorthands.padding('9px', '8px', '9px', 0),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    verticalAlign: 'middle',
    height: '56px'
  },
  tdRight: { textAlign: 'right' },
  rowButton: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    ...shorthands.border('0'),
    ...shorthands.padding(0),
    backgroundColor: 'transparent',
    color: 'inherit',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    textAlign: 'left',
    width: '100%',
    cursor: 'pointer'
  },
  selected: { backgroundColor: tokens.colorBrandBackground2 },
  badge: {
    width: '28px',
    height: '32px',
    flexShrink: 0,
    ...shorthands.borderRadius('4px'),
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    fontSize: '9px',
    fontWeight: tokens.fontWeightBold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  // A nowrap cell sizes an auto-layout table to the longest name, so at 340 px
  // the expanded row's link and buttons slid out of view (8.8 L9). max-width 0
  // lets the column take what is left and the ellipsis actually apply.
  nameCellNarrow: { maxWidth: 0, width: '100%' },
  nameWrap: { minWidth: 0 },
  name: {
    display: 'block',
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.overflow('hidden'),
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  sub: { display: 'block', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  detail: {
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('12px')
  },
  detailCell: { ...shorthands.padding(0), height: 'auto' },
  empty: { ...shorthands.padding('26px', '16px'), textAlign: 'center', color: tokens.colorNeutralForeground2 },
  emptyTitle: {
    display: 'block',
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    marginBottom: '2px'
  },
  footNote: { marginTop: '10px', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  // Skeleton -> content cross-fade, honest only on the very first load (R16).
  skeletonRow: {
    height: '56px',
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px')
  },
  shimmer: {
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius('4px'),
    height: '12px',
    animationName: {
      '0%': { opacity: 0.5 },
      '50%': { opacity: 1 },
      '100%': { opacity: 0.5 }
    },
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
      animationDuration: '0s',
      opacity: 1
    }
  },
  shimmerBadge: { width: '28px', height: '32px', flexShrink: 0 },
  shimmerWide: { flexGrow: 1, maxWidth: '320px' },
  shimmerNarrow: { width: '80px', flexShrink: 0 },
  fadeIn: {
    animationName: { from: { opacity: 0 }, to: { opacity: 1 } },
    animationDuration: '220ms',
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none', animationDuration: '0s', opacity: 1 }
  }
});

const PERIOD_LABELS: Record<RecentPeriod, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days'
};

const PERIOD_ORDER: RecentPeriod[] = ['7d', '30d', '90d'];

export interface IRecentInlineProps extends IAppProps {
  recent: RecentController;
}

export const RecentInline: React.FC<IRecentInlineProps> = props => {
  const s = useSharedStyles();
  const styles = useStyles();
  const { recent, session, store, host } = props;
  const state = session.recent;
  const narrow: boolean = isNarrow(host.width);
  const now: Date = props.now();
  const reducedMotion: boolean = useReducedMotion();

  // First load only. A filter change never returns here (R16).
  React.useEffect(() => {
    if (state.state === 'idle') {
      recent.loadInitial().catch(() => undefined);
    }
  }, [state.state, recent]);

  const header = (subtitle: string): React.ReactElement => (
    <header className={s.header}>
      <div>
        <h1 className={s.title}>Recent filings</h1>
        <div className={s.subtitle}>{subtitle}</div>
      </div>
    </header>
  );

  const chips = (
    <ChipRow>
      <ChipSelect
        name="documentKind"
        allLabel="All kinds"
        value={state.filter.documentKind}
        options={store.getKinds().map(k => ({ value: k.key, label: k.label }))}
        onChange={v => {
          recent.setFilter({ documentKind: v as never }).catch(() => undefined);
        }}
      />
      <ChipSelect
        name="department"
        allLabel="All departments"
        value={state.filter.department}
        options={store.getDepartments().map(d => ({ value: d.key, label: d.label }))}
        onChange={v => {
          recent.setFilter({ department: v as never }).catch(() => undefined);
        }}
      />
      <ChipSelect
        name="status"
        allLabel="Any status"
        value={state.filter.status}
        options={ALL_STATUSES.map(st => ({ value: st, label: STATUS_LABELS[st] }))}
        onChange={v => {
          recent.setFilter({ status: v as never }).catch(() => undefined);
        }}
      />
      {PERIOD_ORDER.map(p => (
        <ChipToggle
          key={p}
          name={'period-' + p}
          label={PERIOD_LABELS[p]}
          pressed={state.filter.period === p}
          onClick={() => {
            recent.setFilter({ period: p }).catch(() => undefined);
          }}
        />
      ))}
    </ChipRow>
  );

  // ---- error ------------------------------------------------------------
  if (state.state === 'error') {
    return (
      <section data-layout="recent-error" data-theme={host.theme} data-display-mode="inline" className={s.root}>
        {header('Could not be loaded')}
        <div className={s.body}>
          <Banner
            tone="error"
            title={state.error || 'Recent filings could not be loaded.'}
            detail="Nothing has changed — your filings are safe in the library."
          />
          <div className={s.actions}>
            <Button
              appearance="primary"
              className={s.actionButton}
              data-action="retry-recent"
              onClick={() => {
                recent.retry().catch(() => undefined);
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // ---- first load: skeleton --------------------------------------------
  if (state.state === 'idle' || state.state === 'loading') {
    return (
      <section data-layout="recent-loading" data-theme={host.theme} data-display-mode="inline" className={s.root}>
        {header('Looking up your filings…')}
        <div className={s.body} aria-busy="true">
          {[0, 1, 2, 3].map(i => (
            <div className={styles.skeletonRow} key={i}>
              <span className={mergeClasses(styles.shimmer, styles.shimmerBadge)} aria-hidden="true" />
              <span className={mergeClasses(styles.shimmer, styles.shimmerWide)} aria-hidden="true" />
              <span className={mergeClasses(styles.shimmer, styles.shimmerNarrow)} aria-hidden="true" />
            </div>
          ))}
          <span className={s.visuallyHidden}>Loading recent filings</span>
        </div>
      </section>
    );
  }

  const rows: IRecentFilingRow[] = state.rows;
  const filtered: boolean = recent.isFiltered;

  // ---- no match ---------------------------------------------------------
  if (rows.length === 0) {
    const departmentLabel: string = state.filter.department
      ? (store.getDepartments().filter(d => d.key === state.filter.department)[0] || { label: '' }).label
      : '';
    const scope: string = departmentLabel ? 'Every ' + departmentLabel + ' filing' : 'Everything you filed';
    const statusPart: string =
      state.filter.status === 'returned'
        ? ' went through cleanly.'
        : ' is accounted for.';
    return (
      <section data-layout="recent-no-match" data-theme={host.theme} data-display-mode="inline" className={s.root}>
        {header(describeFilter(state.filter.period, filtered))}
        <div className={s.body}>
          {chips}
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>You&apos;re all caught up.</span>
            {scope + ' in the ' + PERIOD_LABELS[state.filter.period].toLowerCase().replace('last ', 'last ') + statusPart}
            <div className={s.actions}>
              <Button
                appearance="secondary"
                className={s.actionButton}
                data-action="clear-filters"
                onClick={() => {
                  recent.clearFilters().catch(() => undefined);
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const selected = recent.selectedRow();
  const shown: IRecentFilingRow[] = rows.slice(0, 8);

  return (
    <section
      data-layout={filtered ? 'recent-filtered' : 'recent-default'}
      data-theme={host.theme}
      data-display-mode="inline"
      className={s.root}
    >
      {header(
        rows.length +
          ' filing' +
          (rows.length === 1 ? '' : 's') +
          ' in the ' +
          PERIOD_LABELS[state.filter.period].toLowerCase() +
          (rows.length > shown.length ? ' · showing the ' + shown.length + ' most recent' : '')
      )}
      <div className={s.body}>
        {chips}
        <div className={styles.tableScroll}>
        <table className={mergeClasses(styles.table, !reducedMotion && styles.fadeIn)} data-rows={rows.length}>
          <thead>
            <tr>
              <th className={styles.th}>Document</th>
              {narrow ? undefined : <th className={styles.th}>Department</th>}
              <th className={mergeClasses(styles.th, styles.thRight)}>Amount</th>
              <th className={styles.th}>Status</th>
              {narrow ? undefined : <th className={styles.th}>Filed</th>}
            </tr>
          </thead>
          <tbody>
            {shown.map(row => {
              const isSelected: boolean = Boolean(selected && selected.id === row.id);
              return (
                <React.Fragment key={row.id}>
                  <tr data-row={row.id} data-selected={isSelected ? 'true' : 'false'}>
                    <td className={mergeClasses(styles.td, narrow && styles.nameCellNarrow, isSelected && styles.selected)}>
                      <button
                        type="button"
                        className={styles.rowButton}
                        data-row-button={row.id}
                        aria-expanded={isSelected}
                        onClick={() => recent.selectRow(row.id)}
                      >
                        <span className={styles.badge} aria-hidden="true">
                          {fileBadge(row.fileName)}
                        </span>
                        <span className={styles.nameWrap}>
                          <span className={styles.name}>{row.fileName}</span>
                          <span className={styles.sub}>
                            {narrow
                              ? row.departmentLabel + ' · ' + describeTimeAgo(row.filedAt, now)
                              : row.documentKindLabel}
                          </span>
                        </span>
                      </button>
                    </td>
                    {narrow ? undefined : (
                      <td className={mergeClasses(styles.td, isSelected && styles.selected)}>{row.departmentLabel}</td>
                    )}
                    <td className={mergeClasses(styles.td, styles.tdRight, s.tabular, isSelected && styles.selected)}>
                      {formatMoney(row.amount)}
                    </td>
                    <td className={mergeClasses(styles.td, isSelected && styles.selected)}>
                      <StatusPill status={row.status} short={narrow} />
                    </td>
                    {narrow ? undefined : (
                      <td className={mergeClasses(styles.td, isSelected && styles.selected)}>
                        <span className={styles.sub}>{describeTimeAgo(row.filedAt, now)}</span>
                      </td>
                    )}
                  </tr>
                  {isSelected ? (
                    <tr>
                      <td className={mergeClasses(styles.td, styles.detailCell)} colSpan={narrow ? 3 : 5}>
                        <div className={styles.detail} data-detail={row.id}>
                          <SummaryList
                            narrow={narrow}
                            items={[
                              ...(row.vendor ? [{ key: 'vendor', label: 'Vendor', value: row.vendor }] : []),
                              ...(row.ownerName ? [{ key: 'owner', label: 'Report owner', value: row.ownerName }] : []),
                              {
                                key: 'documentDate',
                                label: 'Document date',
                                // The calendar date, as on the receipt: a record needs the date, not only "today" (L10).
                                value: <span className={s.tabular}>{formatDateWithRelative(row.documentDate, now)}</span>
                              },
                              {
                                key: 'filedBy',
                                label: 'Filed by',
                                value: row.filedByName + ' · ' + describeTimeAgo(row.filedAt, now)
                              },
                              { key: 'receipt', label: 'Receipt', value: <span className={s.tabular}>#{row.receiptNumber}</span> },
                              { key: 'location', label: 'Location', value: <span className={s.path}>{row.savedPath}</span> }
                            ]}
                          />
                          <div className={s.actions}>
                            <span className={s.actionsNote}>To correct metadata, open the file in SharePoint.</span>
                          </div>
                          {/* Never an anchor: the host's iframe swallows it (8.8 L9). */}
                          {row.webUrl ? (
                            <LinkOut
                              url={row.webUrl}
                              openLabel="Open in SharePoint"
                              openAction="open-row-in-sharepoint"
                              openLink={props.openLink}
                              narrow={narrow}
                              buttonClassName={s.actionButton}
                            />
                          ) : undefined}
                        </div>
                      </td>
                    </tr>
                  ) : undefined}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
        <div className={styles.footNote}>
          {rows.length > shown.length
            ? 'Showing the ' + shown.length + ' most recent. Select a row for the full record.'
            : 'Select a row for the full record.'}
        </div>
      </div>
    </section>
  );
};

function describeFilter(period: RecentPeriod, filtered: boolean): string {
  return (filtered ? 'Filtered · ' : '') + PERIOD_LABELS[period].toLowerCase();
}

export const RECENT_LAYOUTS: string[] = [
  'recent-loading',
  'recent-default',
  'recent-filtered',
  'recent-no-match',
  'recent-error'
];
