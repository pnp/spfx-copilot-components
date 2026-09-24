import { FilingController } from './filingController';
import { createSession, ISession } from '../models/session';
import { MockDocumentStoreService } from '../services/MockDocumentStoreService';
import type { IDroppedFile } from '../models/filing';
import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';

const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);
const PDF: IDroppedFile = { name: 'Riverside-Print-Co_INV-20417.pdf', sizeBytes: 421_888, contentType: 'application/pdf' };
const XLSX: IDroppedFile = { name: 'ER-Aug_Marin.xlsx', sizeBytes: 176_128, contentType: '' };

interface IHarness {
  controller: FilingController;
  session: ISession;
  store: MockDocumentStoreService;
  changes: () => number;
  saveCalls: () => number;
}

function harness(
  props: IFileUploaderCopilotComponentProperties = {},
  storeOptions: { failSave?: boolean } = {}
): IHarness {
  const session: ISession = createSession(props, 1);
  const store = new MockDocumentStoreService({ latencyMs: 0, ...storeOptions });
  let changes: number = 0;
  let saveCalls: number = 0;
  const realSave = store.save.bind(store);
  store.save = (drafts, now) => {
    saveCalls++;
    return realSave(drafts, now);
  };
  const controller = new FilingController(session, store, () => NOW, () => { changes++; }, props);
  return { controller, session, store, changes: () => changes, saveCalls: () => saveCalls };
}

describe('adding files', () => {
  it('moves from empty to draft and pre-fills from the prompt', () => {
    const h = harness({ documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.', documentDate: 'last Friday' });
    expect(h.session.filing.stage).toBe('empty');
    h.controller.addFiles([PDF]);

    expect(h.session.filing.stage).toBe('draft');
    const draft = h.controller.selectedDraft!;
    expect(draft.file.name).toBe(PDF.name);
    expect(draft.documentKind).toBe('invoice');
    expect(draft.documentDate).toBe('2026-08-14');
    expect(draft.prefilled).toContain('department');
    expect(h.changes()).toBe(1);
  });

  it('ignores an empty file list', () => {
    const h = harness();
    h.controller.addFiles([]);
    expect(h.session.filing.stage).toBe('empty');
    expect(h.changes()).toBe(0);
  });

  it('never saves just because a file arrived', () => {
    const h = harness({ documentKind: 'invoice', department: 'finance', vendor: 'X', amount: 5, documentDate: 'today' });
    h.controller.addFiles([PDF]);
    expect(h.saveCalls()).toBe(0);
  });

  it('returns to empty when the only draft is removed', () => {
    const h = harness();
    h.controller.addFiles([PDF]);
    h.controller.removeDraft(h.controller.selectedDraft!.id);
    expect(h.session.filing.stage).toBe('empty');
    expect(h.session.filing.drafts).toEqual([]);
  });
});

describe('editing fields', () => {
  it('clears the pre-filled marker on the field the user touches, and only that one', () => {
    const h = harness({ documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.' });
    h.controller.addFiles([PDF]);
    const id = h.controller.selectedDraft!.id;
    h.controller.updateField(id, 'vendor', 'Northgate Supplies');

    const draft = h.controller.selectedDraft!;
    expect(draft.vendor).toBe('Northgate Supplies');
    expect(draft.prefilled).not.toContain('vendor');
    expect(draft.prefilled).toContain('department');
  });

  it('parses loose date text as the user types', () => {
    const h = harness();
    h.controller.addFiles([PDF]);
    const id = h.controller.selectedDraft!.id;
    h.controller.updateField(id, 'documentDate', 'yesterday');
    expect(h.controller.selectedDraft!.documentDate).toBe('2026-08-17');

    h.controller.updateField(id, 'documentDate', 'nonsense');
    expect(h.controller.selectedDraft!.documentDate).toBeUndefined();
    expect(h.controller.selectedDraft!.documentDateText).toBe('nonsense');
  });

  it('accepts money typed with symbols and separators', () => {
    const h = harness();
    h.controller.addFiles([PDF]);
    const id = h.controller.selectedDraft!.id;
    h.controller.updateField(id, 'amount', '$1,284.50');
    expect(h.controller.selectedDraft!.amount).toBe(1284.5);
    h.controller.updateField(id, 'amount', '');
    expect(h.controller.selectedDraft!.amount).toBeUndefined();
  });

  it('keeps a half-typed amount so the decimal point survives each keystroke (H3)', () => {
    const h = harness();
    h.controller.addFiles([PDF]);
    const id = h.controller.selectedDraft!.id;
    ['1', '12', '12.', '12.5'].forEach(text => {
      h.controller.updateField(id, 'amount', text);
      expect(h.controller.selectedDraft!.amountText).toBe(text);
    });
    expect(h.controller.selectedDraft!.amount).toBe(12.5);
  });

  it('never turns an infinite amount into a number (M2)', () => {
    const h = harness();
    h.controller.addFiles([PDF]);
    const id = h.controller.selectedDraft!.id;
    h.controller.updateField(id, 'amount', '1e999');
    expect(h.controller.selectedDraft!.amount).toBeUndefined();
    expect(h.controller.selectedDraft!.amountText).toBe('1e999');
  });

  it('resets the status when the kind changes to one that does not allow it', () => {
    const h = harness();
    h.controller.addFiles([PDF]);
    const id = h.controller.selectedDraft!.id;
    h.controller.updateField(id, 'documentKind', 'invoice');
    expect(h.controller.selectedDraft!.status).toBe('received');
    h.controller.updateField(id, 'documentKind', 'expenseReport');
    expect(h.controller.selectedDraft!.status).toBe('pendingReview');
  });

  it('shows no errors before the user has asked to save', () => {
    const h = harness();
    h.controller.addFiles([PDF]);
    const id = h.controller.selectedDraft!.id;
    h.controller.updateField(id, 'amount', '');
    expect(h.controller.validationFor(id)).toBeUndefined();
  });
});

describe('review and validation', () => {
  it('holds at validation when required fields are missing, and saves nothing', () => {
    const h = harness({ documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.' });
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();

    expect(h.session.filing.stage).toBe('validation');
    const v = h.controller.validationFor(h.controller.selectedDraft!.id)!;
    expect(v.missing).toEqual(['documentDate', 'amount']);
    expect(h.saveCalls()).toBe(0);
  });

  it('clears errors as they are fixed and returns to draft', () => {
    const h = harness({ documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.' });
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();
    const id = h.controller.selectedDraft!.id;

    h.controller.updateField(id, 'documentDate', '3 days ago');
    expect(h.session.filing.stage).toBe('validation'); // amount still missing
    h.controller.updateField(id, 'amount', '1284.50');
    expect(h.session.filing.stage).toBe('draft');
    expect(h.controller.validationFor(id)!.ok).toBe(true);
  });

  it('moves to review — not to saving — when everything is valid', () => {
    const h = harness({ documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.', documentDate: 'last Friday', amount: 1284.5 });
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();
    expect(h.session.filing.stage).toBe('review');
    expect(h.saveCalls()).toBe(0);
  });

  it('says a typed date was not understood instead of calling it missing (M3)', () => {
    const h = harness({ documentKind: 'invoice', department: 'programs', vendor: 'V', amount: 10 });
    h.controller.addFiles([PDF]);
    const id = h.controller.selectedDraft!.id;
    h.controller.updateField(id, 'documentDate', '14/8/2026');
    h.controller.reviewAndSave();
    expect(h.controller.validationFor(id)!.errors.documentDate).toBe('Enter a valid date');
  });

  it('goes back to editing from review without saving', () => {
    const h = harness({ documentKind: 'invoice', department: 'programs', vendor: 'V', documentDate: 'today', amount: 1 });
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();
    h.controller.backToEdit();
    expect(h.session.filing.stage).toBe('draft');
    expect(h.saveCalls()).toBe(0);
  });
});

describe('confirm — the only write', () => {
  const complete: IFileUploaderCopilotComponentProperties = {
    documentKind: 'invoice',
    department: 'programs',
    vendor: 'Riverside Print Co.',
    documentDate: 'last Friday',
    amount: 1284.5
  };

  it('saves exactly once and produces a receipt', async () => {
    const h = harness(complete);
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();
    await h.controller.confirm();

    expect(h.saveCalls()).toBe(1);
    expect(h.session.filing.stage).toBe('receipt');
    expect(h.session.filing.receipts.length).toBe(1);
    expect(h.session.filing.receipts[0].receiptNumber).toBe('F-10946');
    expect(h.session.filing.receipts[0].savedPath).toContain('Riverside-Print-Co_INV-20417.pdf');
  });

  it('the receipt is visible in recent filings afterwards', async () => {
    const h = harness(complete);
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();
    await h.controller.confirm();

    const rows = await h.store.getRecent({ period: '7d' }, NOW);
    expect(rows[0].receiptNumber).toBe('F-10946');
  });

  it('writes once when confirm runs twice while the first save is in flight (M4)', async () => {
    const h = harness(complete);
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();
    await Promise.all([h.controller.confirm(), h.controller.confirm()]);

    expect(h.saveCalls()).toBe(1);
    expect(h.session.filing.receipts.length).toBe(1);
  });

  it('removes a draft that was edited while its save was running (M4)', async () => {
    const h = harness(complete);
    h.controller.addFiles([PDF]);
    const id = h.controller.selectedDraft!.id;
    const pending: Promise<void> = h.controller.confirm();
    h.controller.updateField(id, 'vendor', 'Edited during the save');
    await pending;

    expect(h.session.filing.stage).toBe('receipt');
    expect(h.session.filing.drafts).toEqual([]);
  });

  it('moves the selection and validation off the drafts it saved (M4)', async () => {
    const h = harness(complete);
    h.controller.addFiles([PDF, XLSX]);
    const first = h.session.filing.drafts[0];
    const second = h.session.filing.drafts[1];
    h.controller.updateField(second.id, 'amount', '');
    h.controller.reviewAndSave();
    h.controller.selectDraft(first.id);
    await h.controller.confirm();

    expect(h.session.filing.drafts.map(d => d.id)).toEqual([second.id]);
    expect(h.session.filing.selectedDraftId).toBe(second.id);
    expect(h.controller.validationFor(first.id)).toBeUndefined();
  });

  it('does nothing when no draft is valid', async () => {
    const h = harness();
    h.controller.addFiles([PDF]);
    await h.controller.confirm();
    expect(h.saveCalls()).toBe(0);
    expect(h.session.filing.stage).toBe('draft');
  });

  it('resets to empty on "file another"', async () => {
    const h = harness(complete);
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();
    await h.controller.confirm();
    h.controller.fileAnother();

    expect(h.session.filing.stage).toBe('empty');
    expect(h.session.filing.drafts).toEqual([]);
    expect(h.session.filing.receipts).toEqual([]);
  });
});

describe('error fallback', () => {
  const complete: IFileUploaderCopilotComponentProperties = {
    documentKind: 'invoice',
    department: 'programs',
    vendor: 'Riverside Print Co.',
    documentDate: 'last Friday',
    amount: 1284.5
  };

  it('keeps the file and the typed values when the store is unavailable', async () => {
    const h = harness(complete, { failSave: true });
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();
    await h.controller.confirm();

    expect(h.session.filing.stage).toBe('error');
    expect(h.session.filing.error).toContain('did not respond');
    expect(h.session.filing.drafts.length).toBe(1);
    expect(h.controller.selectedDraft!.amount).toBe(1284.5);
    expect(h.session.filing.lastAttemptAt).toBe(NOW);
    expect(h.session.filing.receipts).toEqual([]);
  });

  it('shows the store\'s own message when a save fails for a named reason (M6)', async () => {
    const h = harness(complete);
    h.store.save = () => Promise.reject(new Error('No file content for Riverside-Print-Co_INV-20417.pdf.'));
    h.controller.addFiles([PDF]);
    await h.controller.confirm();

    expect(h.session.filing.stage).toBe('error');
    expect(h.session.filing.error).toBe('No file content for Riverside-Print-Co_INV-20417.pdf.');
  });

  it('falls back to the generic line when the error says nothing', async () => {
    const h = harness(complete);
    h.store.save = () => Promise.reject(new Error(''));
    h.controller.addFiles([PDF]);
    await h.controller.confirm();

    expect(h.session.filing.error).toBe('Something went wrong and nothing was saved.');
  });

  it('offers the draft as JSON so nothing the user typed is stranded', async () => {
    const h = harness(complete, { failSave: true });
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();
    await h.controller.confirm();

    const parsed = JSON.parse(h.controller.draftsAsJson());
    expect(parsed[0]).toMatchObject({
      file: 'Riverside-Print-Co_INV-20417.pdf',
      documentKind: 'invoice',
      department: 'programs',
      amount: 1284.5
    });
  });

  it('retry goes through the same path and succeeds once the store recovers', async () => {
    const h = harness(complete, { failSave: true });
    h.controller.addFiles([PDF]);
    h.controller.reviewAndSave();
    await h.controller.confirm();
    expect(h.session.filing.stage).toBe('error');

    (h.store as unknown as { _options: { failSave: boolean } })._options.failSave = false;
    await h.controller.retry();
    expect(h.session.filing.stage).toBe('receipt');
    expect(h.saveCalls()).toBe(2);
  });
});

describe('several files', () => {
  it('keeps one draft per file and selects the first', () => {
    const h = harness();
    h.controller.addFiles([PDF, XLSX]);
    expect(h.session.filing.drafts.length).toBe(2);
    expect(h.controller.selectedDraft!.file.name).toBe(PDF.name);

    h.controller.selectDraft(h.session.filing.drafts[1].id);
    expect(h.controller.selectedDraft!.file.name).toBe(XLSX.name);
  });

  it('selects the first invalid draft when validation fails', () => {
    const h = harness({ documentKind: 'invoice', department: 'programs', vendor: 'V', documentDate: 'today', amount: 10 });
    h.controller.addFiles([PDF, XLSX]);
    const second = h.session.filing.drafts[1];
    h.controller.updateField(second.id, 'amount', '');
    h.controller.reviewAndSave();

    expect(h.session.filing.stage).toBe('validation');
    expect(h.session.filing.selectedDraftId).toBe(second.id);
  });
});
