import * as React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Link,
  Text,
  Badge,
  Button,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { DocumentRegular, ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons';
import * as strings from 'SiteSnapshotComponentStrings';

import type { IDetailTableProps } from './IDetailTableProps';
import type { IExternalShare, IFileRow, ITypeBucket, IOwnerBucket, IDuplicateSet } from '../../models';
import Formatters from '../../utils/Formatters';

// Rows per page. Keeps long lists (hundreds of files) readable.
const PAGE = 12;

// A column definition for the generic table below. `sortValue` makes the column
// sortable; omit it for action-only columns.
interface IColumn<T> {
  key: string;
  label: string;
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
}

type SortState = { key: string; dir: 'asc' | 'desc' } | undefined;

const useStyles = makeStyles({
  criticalBadge: { marginLeft: tokens.spacingHorizontalXS },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: tokens.spacingVerticalS
  },
  pager: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, color: tokens.colorNeutralForeground3 },
  totalRow: { backgroundColor: tokens.colorNeutralBackground2 },
  totalLabel: { fontWeight: tokens.fontWeightSemibold },
  // Popover content listing every file in a duplicate group with its path.
  popList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS, maxWidth: '420px' },
  popTitle: { fontWeight: tokens.fontWeightSemibold, marginBottom: tokens.spacingVerticalXS }
});

// One reusable, sortable, paginated table for every detail list. Click a column
// header to sort by it; the duplicates list adds a trailing "Show all" action
// column. The total-size row sits under the Size column.
export default function DetailTable(props: IDetailTableProps): React.ReactElement {
  // Props
  const { kind, detail } = props;
  const styles = useStyles();

  // States (all declared before any early return - avoids the React #300 error)
  const [page, setPage] = React.useState<number>(0);
  const [sort, setSort] = React.useState<SortState>(undefined);

  // Reset paging and sorting whenever the tab changes.
  React.useEffect(() => {
    setPage(0);
    setSort(undefined);
  }, [kind]);

  // Toggle sort on a column: first click ascending, second descending.
  const onSort = (key: string): void =>
    setSort((prev) => (prev && prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  // Icon + link cell shared by every table.
  const fileCell = (name: string, webUrl: string): React.ReactElement => (
    <TableCellLayout media={<DocumentRegular />} truncate>
      <Link href={webUrl} target="_blank">{name}</Link>
    </TableCellLayout>
  );

  // Pager row under a table when there is more than one page.
  const pager = (count: number): React.ReactElement | null => {
    const pages = Math.ceil(count / PAGE);
    if (pages <= 1) return null;
    const from = count === 0 ? 0 : page * PAGE + 1;
    const to = Math.min(count, (page + 1) * PAGE);
    return (
      <div className={styles.footer}>
        <div className={styles.pager}>
          <Button size="small" appearance="subtle" icon={<ChevronLeftRegular />} disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label={strings.PagePrev} />
          <Text size={200}>{Formatters.fill(strings.PageStatus, from, to, count)}</Text>
          <Button size="small" appearance="subtle" icon={<ChevronRightRegular />} disabled={to >= count} onClick={() => setPage((p) => p + 1)} aria-label={strings.PageNext} />
        </div>
      </div>
    );
  };

  // The generic renderer: sort, page, render cells, optional total row + pager.
  function renderTable<T>(ariaLabel: string, columns: IColumn<T>[], rows: T[], totalCells?: React.ReactNode[]): React.ReactElement {
    let ordered = rows;
    if (sort) {
      const col = columns.filter((c) => c.key === sort.key)[0];
      if (col && col.sortValue) {
        const dir = sort.dir === 'asc' ? 1 : -1;
        ordered = [...rows].sort((a, b) => {
          const av = col.sortValue as (r: T) => string | number;
          const x = av(a);
          const y = av(b);
          return x < y ? -dir : x > y ? dir : 0;
        });
      }
    }
    const pageRows = ordered.slice(page * PAGE, page * PAGE + PAGE);
    return (
      <>
        <Table aria-label={ariaLabel} size="small">
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHeaderCell
                  key={c.key}
                  onClick={c.sortValue ? () => onSort(c.key) : undefined}
                  sortDirection={sort && sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {c.label}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((r, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.key}>{c.render(r)}</TableCell>
                ))}
              </TableRow>
            ))}
            {totalCells && (
              <TableRow className={styles.totalRow}>
                {totalCells.map((cell, i) => (
                  <TableCell key={i} className={styles.totalLabel}>{cell}</TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
        {pager(rows.length)}
      </>
    );
  }

  // --- Column definitions per kind ----------------------------------------

  // File lists (old / large / empty): File, Size, Last changed, Created by.
  const fileColumns: IColumn<IFileRow>[] = [
    { key: 'name', label: strings.ColFile, sortValue: (r) => r.name.toLowerCase(), render: (r) => fileCell(r.name, r.webUrl) },
    { key: 'size', label: strings.ColSize, sortValue: (r) => r.sizeBytes, render: (r) => Formatters.bytes(r.sizeBytes) },
    { key: 'modified', label: strings.ColModified, sortValue: (r) => Date.parse(r.modifiedIso) || 0, render: (r) => Formatters.date(r.modifiedIso) },
    { key: 'creator', label: strings.ColCreatedBy, sortValue: (r) => r.createdBy.toLowerCase(), render: (r) => r.createdBy }
  ];
  const fileTotal = (rows: IFileRow[]): React.ReactNode[] => [
    strings.TotalRow,
    Formatters.bytes(rows.reduce((s, r) => s + r.sizeBytes, 0)),
    '',
    ''
  ];

  if (kind === 'stale')
    return detail.staleDocs.length ? renderTable(strings.TabStale, fileColumns, detail.staleDocs, fileTotal(detail.staleDocs)) : <Text>{strings.EmptyStale}</Text>;
  if (kind === 'largest')
    return detail.largestFiles.length ? renderTable(strings.TabLargest, fileColumns, detail.largestFiles, fileTotal(detail.largestFiles)) : <Text>{strings.EmptyLargest}</Text>;
  if (kind === 'empty')
    return detail.emptyFiles.length ? renderTable(strings.TabEmpty, fileColumns, detail.emptyFiles, fileTotal(detail.emptyFiles)) : <Text>{strings.EmptyEmpty}</Text>;

  if (kind === 'types') {
    if (!detail.typeBreakdown.length) return <Text>{strings.EmptyTypes}</Text>;
    const columns: IColumn<ITypeBucket>[] = [
      { key: 'type', label: strings.ColType, sortValue: (t) => t.category, render: (t) => t.category },
      { key: 'files', label: strings.ColFiles, sortValue: (t) => t.count, render: (t) => Formatters.compact(t.count) },
      { key: 'size', label: strings.ColSize, sortValue: (t) => t.sizeBytes, render: (t) => Formatters.bytes(t.sizeBytes) }
    ];
    const total: React.ReactNode[] = [
      strings.TotalRow,
      Formatters.compact(detail.typeBreakdown.reduce((s, t) => s + t.count, 0)),
      Formatters.bytes(detail.typeBreakdown.reduce((s, t) => s + t.sizeBytes, 0))
    ];
    return renderTable(strings.TabTypes, columns, detail.typeBreakdown, total);
  }

  if (kind === 'owners') {
    if (!detail.ownerBreakdown.length) return <Text>{strings.EmptyOwners}</Text>;
    const columns: IColumn<IOwnerBucket>[] = [
      { key: 'owner', label: strings.ColOwner, sortValue: (o) => o.owner.toLowerCase(), render: (o) => o.owner },
      { key: 'files', label: strings.ColFiles, sortValue: (o) => o.count, render: (o) => Formatters.compact(o.count) },
      { key: 'size', label: strings.ColSize, sortValue: (o) => o.sizeBytes, render: (o) => Formatters.bytes(o.sizeBytes) }
    ];
    const total: React.ReactNode[] = [
      strings.TotalRow,
      Formatters.compact(detail.ownerBreakdown.reduce((s, o) => s + o.count, 0)),
      Formatters.bytes(detail.ownerBreakdown.reduce((s, o) => s + o.sizeBytes, 0))
    ];
    return renderTable(strings.TabOwners, columns, detail.ownerBreakdown, total);
  }

  if (kind === 'duplicates') {
    if (!detail.duplicates.length) return <Text>{strings.EmptyDuplicates}</Text>;
    const columns: IColumn<IDuplicateSet>[] = [
      // Lead with the latest copy's name (the Copies column already gives the count).
      { key: 'name', label: strings.ColFile, sortValue: (x) => x.name.toLowerCase(), render: (x) => fileCell(x.name, x.files[0] ? x.files[0].webUrl : '#') },
      { key: 'copies', label: strings.ColCopies, sortValue: (x) => x.count, render: (x) => x.count },
      { key: 'each', label: strings.ColEach, sortValue: (x) => x.sizeBytes, render: (x) => Formatters.bytes(x.sizeBytes) },
      { key: 'wasted', label: strings.ColWasted, sortValue: (x) => x.wastedBytes, render: (x) => <Badge appearance="tint" color="warning">{Formatters.bytes(x.wastedBytes)}</Badge> },
      // Trailing action column: reveal every copy and its path.
      {
        key: 'action',
        label: '',
        render: (x) => (
          <Popover withArrow>
            <PopoverTrigger disableButtonEnhancement>
              <Button appearance="subtle" size="small">{strings.ShowAll}</Button>
            </PopoverTrigger>
            <PopoverSurface>
              <div className={styles.popList}>
                <Text className={styles.popTitle}>{strings.DupFilesTitle}</Text>
                {x.files.map((f, j) => (
                  <Link key={j} href={f.webUrl} target="_blank">{f.name}</Link>
                ))}
              </div>
            </PopoverSurface>
          </Popover>
        )
      }
    ];
    const total: React.ReactNode[] = [strings.TotalRow, '', '', Formatters.bytes(detail.duplicateWastedBytes), ''];
    return renderTable(strings.TabDuplicates, columns, detail.duplicates, total);
  }

  // external
  const shares = detail.externalShares;
  if (!shares.length) return <Text>{strings.EmptyExternal}</Text>;
  const externalColumns: IColumn<IExternalShare>[] = [
    { key: 'name', label: strings.ColFile, sortValue: (x) => x.name.toLowerCase(), render: (x) => fileCell(x.name, x.webUrl) },
    {
      key: 'kind',
      label: strings.ColLinkType,
      sortValue: (x) => (x.isCritical ? 0 : x.kind === 'anyone' ? 1 : 2),
      render: (x) => (
        <>
          <Badge appearance="tint" color={x.kind === 'anyone' ? 'danger' : 'warning'}>
            {x.kind === 'anyone' ? strings.LinkAnyone : strings.LinkSpecific}
          </Badge>
          {x.isCritical && <Badge appearance="filled" color="danger" className={styles.criticalBadge}>{strings.BadgeCritical}</Badge>}
        </>
      )
    },
    { key: 'sharedWith', label: strings.ColSharedWith, sortValue: (x) => x.sharedWith.toLowerCase(), render: (x) => x.sharedWith }
  ];

  return renderTable(strings.TabExternal, externalColumns, shares);
}
