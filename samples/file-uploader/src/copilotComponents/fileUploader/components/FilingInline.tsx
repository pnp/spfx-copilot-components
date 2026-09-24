import * as React from 'react';
import { Button, Input, Select, Spinner, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import type { IViewProps } from './FileUploaderApp';
import type { IFilingDraft } from '../models/filing';
import type { FieldKey, IDocumentKindDefinition } from '../models/sources';
import { FilingController } from '../logic/filingController';
import { describeMissing, FIELD_LABELS, validateDraft } from '../logic/validation';
import { describeTimeAgo, formatDateWithRelative } from '../logic/dates';
import {
  formatMoney,
  SAMPLE_RECEIPT_BYLINE,
  SAMPLE_RECEIPT_HEADLINE,
  SAMPLE_RECEIPT_TITLE,
  STATUS_LABELS
} from '../logic/format';
import { LIBRARY_NAME } from '../models/config';
import { Banner } from './blocks/Banner';
import { DestinationLine } from './blocks/DestinationLine';
import { FilePicker } from './blocks/FilePicker';
import { FieldShell } from './blocks/FieldShell';
import { FileRow } from './blocks/FileRow';
import { LinkOut } from './blocks/LinkOut';
import { StatusPill } from './blocks/StatusPill';
import { SummaryList, ISummaryItem } from './blocks/SummaryList';
import { isNarrow, useSharedStyles } from './blocks/useSharedStyles';

const useStyles = makeStyles({
  saving: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    ...shorthands.padding('24px', 0),
    color: tokens.colorNeutralForeground2
  },
  narrowActions: {
    '> button': { flexGrow: 1 }
  },
  receiptNote: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }
});

export interface IFilingInlineProps extends IViewProps {
  controller: FilingController;
}

export const FilingInline: React.FC<IFilingInlineProps> = props => {
  const s = useSharedStyles();
  const styles = useStyles();
  const { controller, session, store, host } = props;
  const filing = session.filing;
  const narrow: boolean = isNarrow(host.width);
  const now: Date = props.now();
  const kinds: IDocumentKindDefinition[] = store.getKinds();
  const draft: IFilingDraft | undefined = controller.selectedDraft;
  const kind: IDocumentKindDefinition | undefined = draft
    ? kinds.filter(k => k.key === draft.documentKind)[0]
    : undefined;
  const validation = draft ? controller.validationFor(draft.id) : undefined;
  const destination = draft ? store.resolveDestination(draft, now) : undefined;

  const errorFor = (field: FieldKey): string | undefined =>
    filing.stage === 'validation' && validation ? validation.errors[field] : undefined;

  const summaryItems = (d: IFilingDraft, k: IDocumentKindDefinition): ISummaryItem[] => {
    const items: ISummaryItem[] = [
      { key: 'documentKind', label: 'Document kind', value: k.label },
      {
        key: 'department',
        label: 'Department',
        value: (store.getDepartments().filter(x => x.key === d.department)[0] || { label: '' }).label
      }
    ];
    if (k.requiredFields.indexOf('vendor') >= 0) {
      items.push({ key: 'vendor', label: 'Vendor', value: d.vendor });
    }
    if (k.requiredFields.indexOf('owner') >= 0) {
      items.push({ key: 'owner', label: 'Report owner', value: d.owner });
    }
    items.push({
      key: 'documentDate',
      label: k.dateFieldLabel,
      value: <span className={s.tabular}>{d.documentDate ? formatDateWithRelative(d.documentDate, now) : ''}</span>
    });
    items.push({
      key: 'amount',
      label: 'Amount',
      value: <span className={s.tabular}>{d.amount === undefined ? '' : formatMoney(d.amount)}</span>
    });
    items.push({
      key: 'status',
      label: 'Status',
      value: d.status ? <StatusPill status={d.status} /> : ''
    });
    return items;
  };

  // ---- receipt ----------------------------------------------------------
  if (filing.stage === 'receipt') {
    const receipt = filing.receipts[0];
    return (
      <section data-layout="filing-receipt" data-theme={host.theme} data-display-mode="inline" className={s.root}>
        <header className={s.header}>
          <div>
            <h1 className={s.title}>{store.isSampleData ? SAMPLE_RECEIPT_TITLE : 'Filed'}</h1>
            <div className={s.subtitle}>
              {store.isSampleData
                ? SAMPLE_RECEIPT_BYLINE
                : 'Saved ' + describeTimeAgo(receipt.savedAt, now) + ' by ' + receipt.savedByName}
            </div>
          </div>
        </header>
        <div className={s.body}>
          <Banner
            tone="success"
            title={store.isSampleData ? SAMPLE_RECEIPT_HEADLINE : receipt.fileName + ' is filed.'}
            detail={'Receipt #' + receipt.receiptNumber}
          />
          <SummaryList
            narrow={narrow}
            items={[
              { key: 'documentKind', label: 'Document kind', value: receipt.documentKindLabel },
              { key: 'department', label: 'Department', value: receipt.departmentLabel },
              ...(receipt.vendor ? [{ key: 'vendor', label: 'Vendor', value: receipt.vendor }] : []),
              ...(receipt.owner ? [{ key: 'owner', label: 'Report owner', value: receipt.owner }] : []),
              {
                key: 'documentDate',
                label: 'Date',
                value: <span className={s.tabular}>{formatDateWithRelative(receipt.documentDate, now)}</span>
              },
              { key: 'amount', label: 'Amount', value: <span className={s.tabular}>{formatMoney(receipt.amount)}</span> },
              { key: 'status', label: 'Status', value: <StatusPill status={receipt.status} /> },
              {
                key: 'savedPath',
                label: 'Saved to',
                value: <span className={s.path}>{receipt.savedPath}</span>
              }
            ]}
          />
          {/* Only a real file gets a link — sample data has none, and a dead link is worse than none (H5).
              Never an anchor: the host's iframe swallows it (8.8 L9). */}
          {receipt.webUrl ? (
            <LinkOut
              url={receipt.webUrl}
              openLabel="Open in SharePoint"
              openAction="open-in-sharepoint"
              openLink={props.openLink}
              narrow={narrow}
              buttonClassName={s.actionButton}
            />
          ) : undefined}
          <div className={mergeClasses(s.actions, narrow && styles.narrowActions)}>
            {/* Nothing reached SharePoint, so there is nothing to correct there (8.7 G2). */}
            {store.isSampleData ? undefined : (
              <span className={s.actionsNote}>Metadata can be corrected in SharePoint.</span>
            )}
            <Button
              appearance="primary"
              className={s.actionButton}
              data-action="file-another"
              onClick={() => controller.fileAnother()}
            >
              File another
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // ---- empty ------------------------------------------------------------
  if (filing.stage === 'empty' || !draft) {
    return (
      <section data-layout="filing-empty" data-theme={host.theme} data-display-mode="inline" className={s.root}>
        <header className={s.header}>
          <div>
            <h1 className={s.title}>File a document</h1>
            <div className={s.subtitle}>Choose a file and I&apos;ll ask only for what this record needs.</div>
          </div>
        </header>
        <div className={s.body}>
          <FilePicker
            multiple
            primary
            buttonLabel="Choose a file"
            hint="PDF, Word, Excel or image · up to 250 MB"
            onFiles={files => {
              controller.addFiles(files);
              // Several files need per-file metadata — that is the full-screen
              // workspace. Collapsing back is the host's call, never ours.
              if (files.length >= 2 && host.canFullscreen) {
                props.requestFullscreen().catch(() => undefined);
              }
            }}
          />
          <div className={styles.receiptNote}>
            Files go to the {LIBRARY_NAME} library. The destination folder is set from the document kind and
            department.
          </div>
        </div>
      </section>
    );
  }

  // ---- saving -----------------------------------------------------------
  if (filing.stage === 'saving') {
    const savingName: string = draft ? draft.file.name : filing.drafts.map(d => d.file.name).join(', ');
    return (
      <section data-layout="filing-saving" data-theme={host.theme} data-display-mode="inline" className={s.root}>
        <header className={s.header}>
          <div>
            <h1 className={s.title}>Filing…</h1>
            <div className={s.subtitle}>{savingName}</div>
          </div>
        </header>
        <div className={s.body}>
          <div className={styles.saving}>
            <Spinner size="tiny" label="Saving to the records library" />
          </div>
        </div>
      </section>
    );
  }

  // ---- error ------------------------------------------------------------
  if (filing.stage === 'error') {
    return (
      <section data-layout="filing-error" data-theme={host.theme} data-display-mode="inline" className={s.root}>
        <header className={s.header}>
          <div>
            <h1 className={s.title}>File a document</h1>
            <div className={s.subtitle}>
              {filing.drafts.length} file{filing.drafts.length === 1 ? '' : 's'} · not saved
            </div>
          </div>
        </header>
        <div className={s.body}>
          <Banner
            tone="error"
            title={filing.error || 'The records library did not respond.'}
            detail="Your file and the details you entered are still here. Nothing was saved."
          />
          <FileRow name={draft.file.name} sizeBytes={draft.file.sizeBytes} note="kept in this card" />
          <div className={s.divider} />
          {kind ? <SummaryList narrow={narrow} items={summaryItems(draft, kind)} /> : undefined}
          <div className={mergeClasses(s.actions, narrow && styles.narrowActions)}>
            <span className={s.actionsNote}>
              {filing.lastAttemptAt ? 'Tried ' + describeTimeAgo(filing.lastAttemptAt, now) : ''}
            </span>
            <Button
              appearance="secondary"
              className={s.actionButton}
              as="a"
              data-action="download-details"
              download="filing-draft.json"
              href={'data:application/json;charset=utf-8,' + encodeURIComponent(controller.draftsAsJson())}
            >
              Download details
            </Button>
            <Button
              appearance="primary"
              className={s.actionButton}
              data-action="retry"
              onClick={() => { controller.retry().catch(() => undefined); }}
            >
              Try again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // ---- several files: hand off to the full-screen workspace ------------
  if ((filing.stage === 'draft' || filing.stage === 'validation') && filing.drafts.length >= 2) {
    return (
      <section data-layout="filing-draft" data-theme={host.theme} data-display-mode="inline" className={s.root}>
        <header className={s.header}>
          <div>
            <h1 className={s.title}>File {filing.drafts.length} documents</h1>
            <div className={s.subtitle}>
              Set the shared details once, then adjust each file in the full-screen workspace.
            </div>
          </div>
        </header>
        <div className={s.body}>
          {filing.drafts.map(d => (
            <FileRow key={d.id} name={d.file.name} sizeBytes={d.file.sizeBytes} />
          ))}
          <div className={mergeClasses(s.actions, narrow && styles.narrowActions)}>
            <span className={s.actionsNote}>
              {host.canFullscreen ? '' : "Full screen isn't available here — open Copilot full screen to continue."}
            </span>
            <Button
              appearance="secondary"
              className={s.actionButton}
              data-action="cancel"
              onClick={() => controller.cancel()}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              className={s.actionButton}
              data-action="open-fullscreen"
              disabled={!host.canFullscreen}
              onClick={() => props.requestFullscreen().catch(() => undefined)}
            >
              Open the full-screen workspace
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // ---- review -----------------------------------------------------------
  if (filing.stage === 'review' && kind) {
    return (
      <section data-layout="filing-review" data-theme={host.theme} data-display-mode="inline" className={s.root}>
        <header className={s.header}>
          <div>
            <h1 className={s.title}>Confirm filing</h1>
            <div className={s.subtitle}>
              Check the record before it is saved. Nothing is stored until you confirm.
            </div>
          </div>
        </header>
        <div className={s.body}>
          <FileRow name={draft.file.name} sizeBytes={draft.file.sizeBytes} />
          <div className={s.divider} />
          <SummaryList
            narrow={narrow}
            items={[
              ...summaryItems(draft, kind),
              {
                key: 'destination',
                label: 'Will be saved to',
                value: <DestinationLine destination={destination} variant="full" fileName={draft.file.name} />
              }
            ]}
          />
          <div className={mergeClasses(s.actions, narrow && styles.narrowActions)}>
            <Button
              appearance="secondary"
              className={s.actionButton}
              data-action="back-to-edit"
              onClick={() => controller.backToEdit()}
            >
              Back to edit
            </Button>
            <Button
              appearance="primary"
              className={s.actionButton}
              data-action="confirm-save"
              onClick={() => { controller.confirm().catch(() => undefined); }}
            >
              Confirm and save
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // ---- draft / validation ----------------------------------------------
  const showErrors: boolean = filing.stage === 'validation';
  const layout: string = showErrors ? 'filing-validation' : 'filing-draft';
  const subtitle: string = showErrors
    ? (validation ? validation.missing.length : 0) + ' field' +
      ((validation ? validation.missing.length : 0) === 1 ? '' : 's') + ' need attention'
    : '1 file · ' + (kind ? kind.label : 'not classified') + ' · not saved yet';

  return (
    <section data-layout={layout} data-theme={host.theme} data-display-mode="inline" className={s.root}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>File a document</h1>
          <div className={s.subtitle}>{subtitle}</div>
        </div>
      </header>
      <div className={s.body}>
        {showErrors && validation && kind ? (
          <Banner tone="warning" title="Nothing has been saved." detail={describeMissing(validation, kind)} />
        ) : undefined}

        <FileRow
          name={draft.file.name}
          sizeBytes={draft.file.sizeBytes}
          action={
            <Button
              appearance="transparent"
              size="small"
              data-action="replace-file"
              onClick={() => controller.removeDraft(draft.id)}
            >
              Replace
            </Button>
          }
        />
        <div className={s.divider} />

        <FieldShell
          name="documentKind"
          label="Document kind"
          required
          error={errorFor('documentKind')}
          prefilled={draft.prefilled.indexOf('documentKind') >= 0}
        >
          <Select
            data-input="documentKind"
            value={draft.documentKind || ''}
            onChange={(_e, d) => controller.updateField(draft.id, 'documentKind', d.value)}
          >
            <option value="">Choose a kind</option>
            {kinds.map(k => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </Select>
        </FieldShell>

        <FieldShell
          name="department"
          label="Department"
          required
          error={errorFor('department')}
          prefilled={draft.prefilled.indexOf('department') >= 0}
        >
          <Select
            data-input="department"
            value={draft.department || ''}
            onChange={(_e, d) => controller.updateField(draft.id, 'department', d.value)}
          >
            <option value="">Choose a department</option>
            {store.getDepartments().map(dep => (
              <option key={dep.key} value={dep.key}>
                {dep.label}
              </option>
            ))}
          </Select>
        </FieldShell>

        {kind && kind.requiredFields.indexOf('vendor') >= 0 ? (
          <FieldShell
            name="vendor"
            label={FIELD_LABELS.vendor}
            required
            error={errorFor('vendor')}
            prefilled={draft.prefilled.indexOf('vendor') >= 0}
          >
            <Input
              data-input="vendor"
              value={draft.vendor || ''}
              onChange={(_e, d) => controller.updateField(draft.id, 'vendor', d.value)}
            />
          </FieldShell>
        ) : undefined}

        {kind && kind.requiredFields.indexOf('owner') >= 0 ? (
          <FieldShell
            name="owner"
            label={FIELD_LABELS.owner}
            required
            error={errorFor('owner')}
            prefilled={draft.prefilled.indexOf('owner') >= 0}
          >
            <Input
              data-input="owner"
              value={draft.owner || ''}
              onChange={(_e, d) => controller.updateField(draft.id, 'owner', d.value)}
            />
          </FieldShell>
        ) : undefined}

        <FieldShell
          name="documentDate"
          label={kind ? kind.dateFieldLabel : 'Date'}
          required
          error={errorFor('documentDate')}
          hint={draft.documentDate ? formatDateWithRelative(draft.documentDate, now) : undefined}
          prefilled={draft.prefilled.indexOf('documentDate') >= 0}
        >
          <Input
            data-input="documentDate"
            type="text"
            placeholder="Select a date"
            value={draft.documentDateText || draft.documentDate || ''}
            onChange={(_e, d) => controller.updateField(draft.id, 'documentDate', d.value)}
          />
        </FieldShell>

        <FieldShell
          name="amount"
          label={FIELD_LABELS.amount}
          required
          error={errorFor('amount')}
          prefilled={draft.prefilled.indexOf('amount') >= 0}
        >
          <Input
            data-input="amount"
            placeholder="0.00"
            value={draft.amountText || (draft.amount === undefined ? '' : String(draft.amount))}
            onChange={(_e, d) => controller.updateField(draft.id, 'amount', d.value)}
          />
        </FieldShell>

        <FieldShell name="status" label="Status" required error={errorFor('status')}>
          <Select
            data-input="status"
            value={draft.status || ''}
            onChange={(_e, d) => controller.updateField(draft.id, 'status', d.value)}
          >
            {(kind ? kind.statuses : []).map(st => (
              <option key={st} value={st}>
                {STATUS_LABELS[st]}
              </option>
            ))}
          </Select>
        </FieldShell>

        <div className={mergeClasses(s.actions, narrow && styles.narrowActions)}>
          <DestinationLine
            className={s.actionsNote}
            destination={destination}
            pendingLabel="Destination set from kind and department"
          />
          <Button
            appearance="secondary"
            className={s.actionButton}
            data-action="cancel"
            onClick={() => controller.cancel()}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            className={s.actionButton}
            data-action="review-and-save"
            onClick={() => controller.reviewAndSave()}
          >
            Review and save
          </Button>
        </div>
      </div>
    </section>
  );
};

/** Exported for the tests that assert every stage has a distinct layout. */
export const FILING_LAYOUTS: string[] = [
  'filing-empty',
  'filing-draft',
  'filing-validation',
  'filing-review',
  'filing-saving',
  'filing-receipt',
  'filing-error'
];

export { validateDraft };
