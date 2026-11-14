import * as React from 'react';
import {
  Button,
  Input,
  Select,
  Spinner,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens
} from '@fluentui/react-components';
import type { IAppProps } from './FileUploaderApp';
import type { IFilingDraft, IFilingReceipt } from '../models/filing';
import type { FieldKey, IDocumentKindDefinition } from '../models/sources';
import { ALL_STATUSES } from '../models/sources';
import { LIBRARY_NAME } from '../models/config';
import { FIELD_LABELS } from '../logic/validation';
import { describeDate, describeTimeAgo, formatDateWithRelative } from '../logic/dates';
import {
  fileBadge,
  formatBytes,
  formatMoney,
  SAMPLE_RECEIPT_BYLINE,
  SAMPLE_RECEIPT_HEADLINE,
  SAMPLE_RECEIPT_TITLE,
  STATUS_LABELS
} from '../logic/format';
import { Banner } from './blocks/Banner';
import { DestinationLine } from './blocks/DestinationLine';
import { FilePicker } from './blocks/FilePicker';
import { FieldShell } from './blocks/FieldShell';
import { FileRow } from './blocks/FileRow';
import { LinkOut } from './blocks/LinkOut';
import { ReadinessPill } from './blocks/StatusPill';
import { useSharedStyles } from './blocks/useSharedStyles';

const useStyles = makeStyles({
  fs: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    minHeight: '420px',
    // Reflow on the real available width too (e.g. 200% browser zoom), not only
    // on the host-reported width.
    '@media (max-width: 820px)': { gridTemplateColumns: '1fr' }
  },
  fsNarrow: { gridTemplateColumns: '1fr' },
  list: {
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
    display: 'flex',
    flexDirection: 'column'
  },
  listNarrow: {
    ...shorthands.borderRight('0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2)
  },
  listHead: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px', '14px'),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2)
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    width: '100%',
    ...shorthands.border('0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderLeft('3px', 'solid', tokens.colorTransparentStroke),
    ...shorthands.padding('10px', '14px', '10px', '11px'),
    backgroundColor: 'transparent',
    color: 'inherit',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    textAlign: 'left',
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground2Hover }
  },
  itemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    // Longhand, combined over the base via mergeClasses (cf. LinkOut's `statusFailed`).
    borderLeftColor: tokens.colorBrandStroke1
  },
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
  itemBody: { minWidth: 0, flexGrow: 1 },
  itemName: {
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.overflow('hidden'),
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  itemMeta: { display: 'block', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  listFoot: { ...shorthands.padding('12px', '14px'), marginTop: 'auto' },
  pane: { ...shorthands.padding('16px', '18px') },
  // A section rule, not a nested card (R27): border-bottom only, no fill, no radius.
  shared: {
    ...shorthands.padding(0, 0, '4px', 0),
    marginBottom: '16px',
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2)
  },
  fsButton: { minHeight: '38px' },
  sharedHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
    marginBottom: '10px'
  },
  sharedTitle: { fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightSemibold, ...shorthands.margin(0) },
  sharedNote: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('0', '16px'),
    '@media (max-width: 820px)': { gridTemplateColumns: '1fr' }
  },
  gridNarrow: { gridTemplateColumns: '1fr' },
  fileHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
    marginBottom: '8px'
  },
  fileHeadName: { fontSize: '16px', fontWeight: tokens.fontWeightSemibold, ...shorthands.margin(0) },
  fileHeadMeta: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  inheritedNote: {
    marginTop: '2px',
    marginBottom: '8px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  saving: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    ...shorthands.padding('32px', 0),
    color: tokens.colorNeutralForeground2
  },
  tableScroll: { overflowX: 'auto', marginTop: '4px' },
  table: { width: '100%', minWidth: '520px', borderCollapse: 'collapse', fontSize: tokens.fontSizeBase300 },
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
    verticalAlign: 'top'
  },
  tdRight: { textAlign: 'right' },
  remaining: {
    marginTop: '12px',
    ...shorthands.padding('10px', '12px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius('4px'),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('8px')
  }
});

/** Short field name for a readiness pill: "Needs amount", "Needs date". */
const SHORT_FIELD: Partial<Record<FieldKey, string>> = {
  documentKind: 'kind',
  documentDate: 'date',
  owner: 'owner'
};
const shortField = (f: FieldKey): string => SHORT_FIELD[f] || FIELD_LABELS[f].toLowerCase();

/** The value drafts agree on for a shared field, or '' when they differ. */
function sharedValue(drafts: IFilingDraft[], get: (d: IFilingDraft) => string | undefined): string {
  const first: string = get(drafts[0]) || '';
  return drafts.every(d => (get(d) || '') === first) ? first : '';
}

/** The folder every receipt was saved into, when they share one and the store knows its URL (H5). */
function sharedFolderUrl(receipts: IFilingReceipt[]): string | undefined {
  const first: string | undefined = receipts.length > 0 ? receipts[0].folderUrl : undefined;
  return first && receipts.every(r => r.folderUrl === first) ? first : undefined;
}

function pluralKind(receipts: { documentKind: string }[]): string {
  const kinds: string[] = receipts.map(r => r.documentKind);
  if (kinds.every(k => k === 'invoice')) {
    return receipts.length === 1 ? 'invoice' : 'invoices';
  }
  if (kinds.every(k => k === 'expenseReport')) {
    return receipts.length === 1 ? 'expense report' : 'expense reports';
  }
  return receipts.length === 1 ? 'document' : 'documents';
}

/**
 * Full-screen view — bulk filing (Phase 4). A separate component, not a branch
 * inside the inline view (AGENTS.md R7). Topology: isolated full screen — the
 * file list on the left, the selected file's metadata on the right, shared
 * fields applied across the set. There is no collapse control: inline ->
 * fullscreen is the only transition the component drives; the host owns the
 * way back (README, AGENTS.md §3 Display modes).
 */
export const FileUploaderFullscreen: React.FC<IAppProps> = props => {
  const s = useSharedStyles();
  const styles = useStyles();
  const { controller, session, store, host } = props;
  const filing = session.filing;
  const now: Date = props.now();
  const narrow: boolean = Boolean(host.width && host.width <= 720);
  const drafts: IFilingDraft[] = filing.drafts;
  const kinds: IDocumentKindDefinition[] = store.getKinds();
  const departments = store.getDepartments();

  const shell = (layout: string, saving: boolean, children: React.ReactNode): React.ReactElement => (
    <section
      data-layout={layout}
      data-theme={host.theme}
      data-display-mode="fullscreen"
      data-saving={saving ? 'true' : undefined}
      className={s.root}
    >
      <header className={s.header}>
        <div>
          <h1 className={s.title}>
            {layout === 'filing-bulk-receipt'
              ? store.isSampleData
                ? SAMPLE_RECEIPT_TITLE
                : 'Filed ' + filing.receipts.length + ' ' + pluralKind(filing.receipts)
              : drafts.length > 0
              ? 'File ' + drafts.length + (drafts.length === 1 ? ' document' : ' documents')
              : 'File documents'}
          </h1>
          <div className={s.subtitle}>{LIBRARY_NAME} library</div>
        </div>
      </header>
      {children}
    </section>
  );

  // ---- receipt --------------------------------------------------------------
  if (filing.stage === 'receipt' && filing.receipts.length > 0) {
    const receipts = filing.receipts;
    const first: string = receipts[0].receiptNumber;
    const last: string = receipts[receipts.length - 1].receiptNumber;
    const range: string =
      receipts.length === 1 ? 'Receipt #' + first : 'Receipts #' + first + ' to #' + last;
    const leftover: number = drafts.length;
    const folderUrl: string | undefined = sharedFolderUrl(receipts);
    return shell('filing-bulk-receipt', false, (
      <div className={s.body}>
        {/* The same claim as the inline receipt, so the same correction (8.7 G2). */}
        <Banner
          tone="success"
          title={
            store.isSampleData
              ? SAMPLE_RECEIPT_HEADLINE
              : receipts.length + ' ' + pluralKind(receipts) + (receipts.length === 1 ? ' is' : ' are') + ' filed.'
          }
          detail={
            range +
            ' · ' +
            (store.isSampleData
              ? SAMPLE_RECEIPT_BYLINE
              : 'saved ' + describeTimeAgo(receipts[0].savedAt, now) + ' by ' + receipts[0].savedByName)
          }
        />
        <div className={styles.tableScroll}>
        <table className={styles.table} data-bulk-receipt="true">
          <thead>
            <tr>
              <th className={styles.th}>Document</th>
              <th className={styles.th}>Owner</th>
              <th className={mergeClasses(styles.th, styles.thRight)}>Amount</th>
              <th className={styles.th}>Saved to</th>
              <th className={styles.th}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.receiptNumber} data-receipt-row={r.receiptNumber}>
                <td className={styles.td}>{r.fileName}</td>
                <td className={styles.td}>{r.owner || r.vendor || '—'}</td>
                <td className={mergeClasses(styles.td, styles.tdRight, s.tabular)}>{formatMoney(r.amount)}</td>
                <td className={styles.td}>
                  <span className={s.path}>{r.savedPath}</span>
                </td>
                <td className={mergeClasses(styles.td, s.tabular)}>#{r.receiptNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {leftover > 0 ? (
          <div className={styles.remaining} data-remaining={String(leftover)}>
            <span>
              {leftover} file{leftover === 1 ? '' : 's'} still need{leftover === 1 ? 's' : ''} input — nothing was
              saved for {leftover === 1 ? 'it' : 'them'}.
            </span>
            <Button
              appearance="secondary"
              className={styles.fsButton}
              data-action="resume-remaining"
              onClick={() => controller.backToEdit()}
            >
              Finish the remaining
            </Button>
          </div>
        ) : undefined}
        {/* One folder, known to the store, or no link at all — never a dead one (H5).
            Never an anchor: the host's iframe swallows it (8.8 L9). */}
        {folderUrl ? (
          <LinkOut
            url={folderUrl}
            openLabel="Open folder in SharePoint"
            openAction="open-folder"
            openLink={props.openLink}
            narrow={narrow}
            buttonClassName={styles.fsButton}
          />
        ) : undefined}
        <div className={s.actions}>
          {store.isSampleData ? undefined : (
            <span className={s.actionsNote}>Metadata can be corrected in SharePoint.</span>
          )}
          <Button
            appearance="primary"
            className={styles.fsButton}
            data-action="file-more"
            onClick={() => controller.fileAnother()}
          >
            File more
          </Button>
        </div>
      </div>
    ));
  }

  // ---- no files yet -------------------------------------------------------
  if (drafts.length === 0) {
    return shell('filing-bulk', false, (
      <div className={s.body}>
        <FilePicker
          multiple
          primary
          buttonLabel="Choose files"
          hint="Several at once — PDF, Word, Excel or image"
          onFiles={files => controller.addFiles(files)}
        />
        <div className={s.divider} />
        <div className={s.subtitle}>
          Shared details are set once and applied to every file; each file keeps its own vendor, owner and amount.
        </div>
      </div>
    ));
  }

  // ---- saving -----------------------------------------------------------
  if (filing.stage === 'saving') {
    return shell('filing-bulk', true, (
      <div className={s.body}>
        <div className={styles.saving}>
          <Spinner size="tiny" label={'Saving ' + drafts.length + ' files to the records library'} />
        </div>
      </div>
    ));
  }

  // ---- error ----------------------------------------------------------------
  if (filing.stage === 'error') {
    return shell('filing-bulk', false, (
      <div className={s.body}>
        <Banner
          tone="error"
          title={filing.error || 'The records library did not respond.'}
          detail="Your files and the details you entered are still here. Nothing was saved."
        />
        {drafts.map(d => (
          <FileRow key={d.id} name={d.file.name} sizeBytes={d.file.sizeBytes} note="kept in this workspace" />
        ))}
        <div className={s.actions}>
          <Button
            appearance="secondary"
            className={styles.fsButton}
            as="a"
            data-action="download-details"
            download="filing-drafts.json"
            href={'data:application/json;charset=utf-8,' + encodeURIComponent(controller.draftsAsJson())}
          >
            Download details
          </Button>
          <Button
            appearance="primary"
            className={styles.fsButton}
            data-action="retry-bulk"
            onClick={() => { controller.retry().catch(() => undefined); }}
          >
            Try again
          </Button>
        </div>
      </div>
    ));
  }

  // ---- editing ------------------------------------------------------------
  const selected: IFilingDraft = controller.selectedDraft || drafts[0];
  const selectedIndex: number = drafts.map(d => d.id).indexOf(selected.id);
  const selectedKind: IDocumentKindDefinition | undefined = selected.documentKind
    ? kinds.filter(k => k.key === selected.documentKind)[0]
    : undefined;
  const selectedValidation = store.validate(selected);
  const readyCount: number = drafts.filter(d => store.validate(d).ok).length;
  const statusOptions = (selectedKind ? selectedKind.statuses : ALL_STATUSES);
  const dateLabel: string = selectedKind ? selectedKind.dateFieldLabel : 'Date';
  const inheritedDeptLabel: string = (departments.filter(x => x.key === selected.department)[0] || { label: '—' }).label;
  const destination = store.resolveDestination(selected, now);

  const sharedKind: string = sharedValue(drafts, d => d.documentKind);
  const sharedDept: string = sharedValue(drafts, d => d.department);
  const sharedDate: string = sharedValue(drafts, d => d.documentDateText || d.documentDate);
  // The input shows what was typed; the helper line shows what it resolved to,
  // which is the date that will be stored (8.7 G1). Inline already worked this way.
  const sharedResolvedDate: string = sharedValue(drafts, d => d.documentDate);
  const sharedStatus: string = sharedValue(drafts, d => d.status);

  const errorFor = (field: FieldKey): string | undefined =>
    selectedValidation.ok ? undefined : selectedValidation.errors[field];

  return shell('filing-bulk', false, (
    <div className={mergeClasses(styles.fs, narrow && styles.fsNarrow)}>
      <div className={mergeClasses(styles.list, narrow && styles.listNarrow)} data-bulk-list="true">
        <div className={styles.listHead} data-list-summary="true">
          <span>
            {drafts.length} file{drafts.length === 1 ? '' : 's'}
          </span>
          <span>
            {readyCount === drafts.length
              ? readyCount + ' ready'
              : readyCount + ' ready · ' + (drafts.length - readyCount) + ' needs input'}
          </span>
        </div>
        {drafts.map(d => {
          const v = store.validate(d);
          const isSelected: boolean = d.id === selected.id;
          const readiness: string = v.ok ? 'ready' : 'needs ' + shortField(v.missing[0]);
          return (
            <button
              type="button"
              key={d.id}
              className={mergeClasses(styles.item, isSelected && styles.itemSelected)}
              data-bulk-file={d.id}
              data-selected={isSelected ? 'true' : 'false'}
              aria-pressed={isSelected}
              aria-label={d.file.name + ' — ' + readiness}
              onClick={() => controller.selectDraft(d.id)}
            >
              <span className={styles.badge} aria-hidden="true">
                {fileBadge(d.file.name)}
              </span>
              <span className={styles.itemBody}>
                <span className={styles.itemName}>{d.file.name}</span>
                <span className={styles.itemMeta}>
                  {(d.vendor || d.owner || 'No owner yet') + ' · '}
                  <span className={s.tabular}>{d.amount === undefined ? '—' : formatMoney(d.amount)}</span>
                </span>
              </span>
              <ReadinessPill ready={v.ok} label={v.ok ? 'Ready' : 'Needs ' + shortField(v.missing[0])} />
            </button>
          );
        })}
        <div className={styles.listFoot}>
          <FilePicker
            multiple
            buttonLabel="+ Add more files"
            hint="Appended to this set — entered values are kept"
            onFiles={files => controller.addFiles(files)}
          />
        </div>
      </div>

      <div className={styles.pane} data-bulk-pane="true">
        <div className={styles.shared} data-shared-fields="true">
          <div className={styles.sharedHead}>
            <h3 className={styles.sharedTitle}>Applies to all {drafts.length} files</h3>
            <span className={styles.sharedNote}>Change here, override per file below</span>
          </div>
          <div className={mergeClasses(styles.grid, narrow && styles.gridNarrow)}>
            <FieldShell name="shared-documentKind" label="Document kind" required>
              <Select
                data-input="shared-documentKind"
                value={sharedKind}
                onChange={(_e, d) => controller.applyToAll('documentKind', d.value)}
              >
                <option value="">Choose a kind</option>
                {kinds.map(k => (
                  <option key={k.key} value={k.key}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </FieldShell>
            <FieldShell name="shared-department" label="Department" required>
              <Select
                data-input="shared-department"
                value={sharedDept}
                onChange={(_e, d) => controller.applyToAll('department', d.value)}
              >
                <option value="">Choose a department</option>
                {departments.map(dep => (
                  <option key={dep.key} value={dep.key}>
                    {dep.label}
                  </option>
                ))}
              </Select>
            </FieldShell>
            <FieldShell
              name="shared-documentDate"
              label={dateLabel}
              required
              hint={sharedResolvedDate ? formatDateWithRelative(sharedResolvedDate, now) : undefined}
            >
              <Input
                data-input="shared-documentDate"
                placeholder="Select a date"
                value={sharedDate}
                onChange={(_e, d) => controller.applyToAll('documentDate', d.value)}
              />
            </FieldShell>
            <FieldShell name="shared-status" label="Status" required>
              <Select
                data-input="shared-status"
                value={sharedStatus}
                onChange={(_e, d) => controller.applyToAll('status', d.value)}
              >
                <option value="">Choose a status</option>
                {statusOptions.map(st => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st]}
                  </option>
                ))}
              </Select>
            </FieldShell>
          </div>
        </div>

        <div className={styles.fileHead}>
          <h2 className={styles.fileHeadName}>{selected.file.name}</h2>
          <span className={styles.fileHeadMeta}>
            {selectedIndex + 1} of {drafts.length} · {formatBytes(selected.file.sizeBytes)}
          </span>
        </div>

        <div className={mergeClasses(styles.grid, narrow && styles.gridNarrow)}>
          {selectedKind && selectedKind.requiredFields.indexOf('vendor') >= 0 ? (
            <FieldShell name="vendor" label={FIELD_LABELS.vendor} required error={errorFor('vendor')}>
              <Input
                data-input="vendor"
                value={selected.vendor || ''}
                onChange={(_e, d) => controller.updateField(selected.id, 'vendor', d.value)}
              />
            </FieldShell>
          ) : undefined}
          {selectedKind && selectedKind.requiredFields.indexOf('owner') >= 0 ? (
            <FieldShell name="owner" label={FIELD_LABELS.owner} required error={errorFor('owner')}>
              <Input
                data-input="owner"
                value={selected.owner || ''}
                onChange={(_e, d) => controller.updateField(selected.id, 'owner', d.value)}
              />
            </FieldShell>
          ) : undefined}
          <FieldShell name="amount" label={FIELD_LABELS.amount} required error={errorFor('amount')}>
            <Input
              data-input="amount"
              placeholder="0.00"
              value={selected.amountText || (selected.amount === undefined ? '' : String(selected.amount))}
              onChange={(_e, d) => controller.updateField(selected.id, 'amount', d.value)}
            />
          </FieldShell>
        </div>
        {/* Inherited values are context, not controls (R23) — a line of text, not disabled fields. */}
        <div className={styles.inheritedNote} data-inherited="summary">
          {'Department (' + inheritedDeptLabel + ') and ' + dateLabel.toLowerCase() +
            (selected.documentDate ? ' (' + describeDate(selected.documentDate, now) + ')' : '') +
            ' come from the shared fields above.'}
        </div>

        <div className={s.actions}>
          <span className={s.actionsNote}>
            {selectedIndex + 1} of {drafts.length}
          </span>
          <Button
            appearance="secondary"
            className={styles.fsButton}
            data-action="prev-file"
            disabled={selectedIndex <= 0}
            onClick={() => controller.selectDraft(drafts[selectedIndex - 1].id)}
          >
            ← Previous
          </Button>
          <Button
            appearance="secondary"
            className={styles.fsButton}
            data-action="next-file"
            disabled={selectedIndex >= drafts.length - 1}
            onClick={() => controller.selectDraft(drafts[selectedIndex + 1].id)}
          >
            Next →
          </Button>
        </div>

        <div className={s.divider} />

        <div className={s.actions}>
          <DestinationLine
            className={s.actionsNote}
            destination={destination}
            note={readyCount + ' of ' + drafts.length + ' ready'}
            pendingLabel="Destination set from kind and department"
          />
          <Button
            appearance="secondary"
            className={styles.fsButton}
            data-action="cancel-bulk"
            onClick={() => controller.cancel()}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            className={styles.fsButton}
            data-action="save-ready"
            disabled={readyCount === 0}
            onClick={() => { controller.confirm().catch(() => undefined); }}
          >
            Save {readyCount} ready file{readyCount === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </div>
  ));
};

/** Exported for the test that asserts the two bulk layouts are distinct. */
export const FULLSCREEN_LAYOUTS: string[] = ['filing-bulk', 'filing-bulk-receipt'];
