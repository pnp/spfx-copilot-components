import type { IDroppedFile, IFilingDraft, IValidationResult } from '../models/filing';
import type { IFilingSession, ISession } from '../models/session';
import type { FieldKey } from '../models/sources';
import type { IDocumentStoreService } from '../services/IDocumentStoreService';
import { applyKind, draftFromProperties } from './prefill';
import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';
import { resolveLooseDate } from './dates';

/**
 * The banner message for a failed save. The store's own message wins: the live
 * store names what went wrong ("No file content for …", a rollback that left a
 * file behind), and the External gate depends on seeing it (audit M6). Only an
 * error with nothing to say falls back to the generic line.
 */
function saveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim() !== '') {
    return err.message;
  }
  return 'Something went wrong and nothing was saved.';
}

/**
 * Every transition of the filing flow lives here, so the views are thin and
 * the rules are testable without a DOM. Two rules this class exists to keep:
 *
 *  - **Only `confirm()` writes.** Choosing a file, editing a field, and
 *    reviewing never call `save()` (AGENTS.md R25).
 *  - **Validation never saves.** `reviewAndSave()` validates and either shows
 *    the errors or moves to review; it never reaches the store.
 */
export class FilingController {
  private readonly _session: ISession;
  private readonly _store: IDocumentStoreService;
  private readonly _now: () => Date;
  private readonly _onChange: () => void;
  private readonly _props: IFileUploaderCopilotComponentProperties;
  private _nextDraftId: number = 1;
  /** While set, `updateField` skips its own notify so a bulk apply is one re-render. */
  private _batching: boolean = false;

  public constructor(
    session: ISession,
    store: IDocumentStoreService,
    now: () => Date,
    onChange: () => void,
    props: IFileUploaderCopilotComponentProperties
  ) {
    this._session = session;
    this._store = store;
    this._now = now;
    this._onChange = onChange;
    this._props = props;
  }

  private get _filing(): IFilingSession {
    return this._session.filing;
  }

  public get selectedDraft(): IFilingDraft | undefined {
    const f: IFilingSession = this._filing;
    const id: string | undefined = f.selectedDraftId;
    return id ? f.drafts.filter(d => d.id === id)[0] : f.drafts[0];
  }

  /** Validation shown for a draft, or undefined before the first attempt. */
  public validationFor(draftId: string): IValidationResult | undefined {
    return this._filing.validation[draftId];
  }

  /** Files arrive from the file picker, never from the prompt. */
  public addFiles(files: IDroppedFile[]): void {
    if (files.length === 0) {
      return;
    }
    const f: IFilingSession = this._filing;
    const kinds = this._store.getKinds();
    const now: Date = this._now();
    for (const file of files) {
      const id: string = 'd' + this._nextDraftId++;
      // The prompt pre-fills every draft; the user confirms or corrects.
      f.drafts.push(draftFromProperties(this._props, file, kinds, now, id));
    }
    if (!f.selectedDraftId) {
      f.selectedDraftId = f.drafts[0].id;
    }
    f.stage = 'draft';
    this._onChange();
  }

  public removeDraft(draftId: string): void {
    const f: IFilingSession = this._filing;
    f.drafts = f.drafts.filter(d => d.id !== draftId);
    delete f.validation[draftId];
    if (f.selectedDraftId === draftId) {
      f.selectedDraftId = f.drafts.length > 0 ? f.drafts[0].id : undefined;
    }
    if (f.drafts.length === 0) {
      f.stage = 'empty';
    }
    this._onChange();
  }

  public selectDraft(draftId: string): void {
    this._filing.selectedDraftId = draftId;
    this._onChange();
  }

  /**
   * Edits a field on one draft. A field the user touches stops being
   * "pre-filled from your prompt". Re-validates in place only if this draft
   * has already been validated once, so errors clear as they are fixed but
   * never appear before the user has asked to save.
   */
  public updateField(draftId: string, field: FieldKey, value: string | number | undefined): void {
    const f: IFilingSession = this._filing;
    const draft: IFilingDraft | undefined = f.drafts.filter(d => d.id === draftId)[0];
    if (!draft) {
      return;
    }
    const next: IFilingDraft = { ...draft, prefilled: draft.prefilled.filter(p => p !== field) };

    switch (field) {
      case 'documentKind': {
        const kind = this._store.getKinds().filter(k => k.key === value)[0];
        if (kind) {
          Object.assign(next, applyKind(next, kind));
        } else {
          next.documentKind = undefined;
        }
        break;
      }
      case 'department':
        next.department = (value as IFilingDraft['department']) || undefined;
        break;
      case 'vendor':
        next.vendor = value === undefined ? undefined : String(value);
        break;
      case 'owner':
        next.owner = value === undefined ? undefined : String(value);
        break;
      case 'documentDate': {
        const text: string = value === undefined ? '' : String(value);
        next.documentDateText = text;
        next.documentDate = resolveLooseDate(text, this._now());
        break;
      }
      case 'amount': {
        // Keep the text as typed so "12." is still "12." after this re-render (H3);
        // only a finite number becomes the amount.
        const text: string = value === undefined ? '' : String(value);
        next.amountText = text;
        if (text.trim() === '') {
          next.amount = undefined;
        } else {
          const n: number = typeof value === 'number' ? value : Number(text.replace(/[$,\s]/g, ''));
          next.amount = Number.isFinite(n) ? n : undefined;
        }
        break;
      }
      case 'status':
        next.status = (value as IFilingDraft['status']) || undefined;
        break;
      default:
        break;
    }

    f.drafts = f.drafts.map(d => (d.id === draftId ? next : d));
    if (f.validation[draftId]) {
      f.validation[draftId] = this._store.validate(next);
      const anyInvalid: boolean = f.drafts.some(d => {
        const v = f.validation[d.id];
        return v !== undefined && !v.ok;
      });
      if (f.stage === 'validation' && !anyInvalid) {
        f.stage = 'draft';
      }
    }
    if (!this._batching) {
      this._onChange();
    }
  }

  /**
   * Bulk: apply one shared field to every draft at once (kind, department,
   * period end, status in the full-screen workspace). Per-file fields are still
   * edited one draft at a time with `updateField`.
   */
  public applyToAll(field: FieldKey, value: string | number | undefined): void {
    const ids: string[] = this._filing.drafts.map(d => d.id);
    this._batching = true;
    try {
      for (const id of ids) {
        this.updateField(id, field, value);
      }
    } finally {
      this._batching = false;
    }
    this._onChange();
  }

  /**
   * Validates. On success moves to review — which shows what *would* be saved
   * and asks for confirmation. Nothing is written here.
   */
  public reviewAndSave(): void {
    const f: IFilingSession = this._filing;
    let allOk: boolean = true;
    for (const d of f.drafts) {
      const result: IValidationResult = this._store.validate(d);
      f.validation[d.id] = result;
      if (!result.ok) {
        allOk = false;
      }
    }
    if (!allOk) {
      f.stage = 'validation';
      const firstInvalid: IFilingDraft | undefined = f.drafts.filter(d => !f.validation[d.id].ok)[0];
      if (firstInvalid) {
        f.selectedDraftId = firstInvalid.id;
      }
    } else {
      f.stage = 'review';
    }
    this._onChange();
  }

  /** Back from review to editing. */
  public backToEdit(): void {
    this._filing.stage = 'draft';
    this._onChange();
  }

  /** The only method that writes. A human has confirmed by the time it runs. */
  public async confirm(): Promise<void> {
    const f: IFilingSession = this._filing;
    if (f.stage === 'saving') {
      // A second click, or a retry racing the first save: one write per confirmation (R25, M4).
      return;
    }
    const ready: IFilingDraft[] = f.drafts.filter(d => this._store.validate(d).ok);
    if (ready.length === 0) {
      return;
    }
    f.stage = 'saving';
    f.error = undefined;
    this._onChange();
    try {
      const receipts = await this._store.save(ready, this._now());
      // Re-read the session after the await; drafts may have been edited meanwhile.
      const done: IFilingSession = this._filing;
      // By id, not identity: a draft edited while its save ran is a new object.
      const savedIds: string[] = ready.map(d => d.id);
      done.receipts = receipts;
      done.drafts = done.drafts.filter(d => savedIds.indexOf(d.id) < 0);
      savedIds.forEach(id => {
        delete done.validation[id];
      });
      if (done.selectedDraftId !== undefined && savedIds.indexOf(done.selectedDraftId) >= 0) {
        done.selectedDraftId = done.drafts.length > 0 ? done.drafts[0].id : undefined;
      }
      done.stage = 'receipt';
    } catch (err) {
      const failed: IFilingSession = this._filing;
      failed.stage = 'error';
      failed.error = saveErrorMessage(err);
      failed.lastAttemptAt = this._now();
    }
    this._onChange();
  }

  /** After an error: try the same drafts again. Nothing was lost. */
  public retry(): Promise<void> {
    return this.confirm();
  }

  /** Receipt -> reset. Returns to the empty state with nothing carried over. */
  public fileAnother(): void {
    const f: IFilingSession = this._filing;
    f.stage = 'empty';
    f.drafts = [];
    f.validation = {};
    f.receipts = [];
    f.error = undefined;
    f.selectedDraftId = undefined;
    this._onChange();
  }

  public cancel(): void {
    this.fileAnother();
  }

  /** The draft as JSON, so an error never strands the user's typing. */
  public draftsAsJson(): string {
    return JSON.stringify(
      this._filing.drafts.map(d => ({
        file: d.file.name,
        documentKind: d.documentKind,
        department: d.department,
        vendor: d.vendor,
        owner: d.owner,
        documentDate: d.documentDate,
        amount: d.amount,
        status: d.status
      })),
      undefined,
      2
    );
  }
}
