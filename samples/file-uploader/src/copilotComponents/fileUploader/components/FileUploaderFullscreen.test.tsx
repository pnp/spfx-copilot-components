import { act } from 'react-dom/test-utils';
import { FULLSCREEN_LAYOUTS } from './FileUploaderFullscreen';
import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';
import type { IDroppedFile } from '../models/filing';
import {
  clickButton,
  chooseFiles,
  flush,
  IScreen,
  layoutOf,
  query,
  queryAll,
  renderApp,
  setInputValue,
  setLiveMode,
  textOf
} from './testHelpers';

const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);

const ER_PROMPT: IFileUploaderCopilotComponentProperties = {
  intent: 'file',
  documentKind: 'expenseReport',
  department: 'development'
};

const file = (name: string, size: number = 180_000): IDroppedFile => ({ name, sizeBytes: size, contentType: '' });

const FOUR: IDroppedFile[] = [
  file('ER-Aug_Okafor.xlsx'),
  file('ER-Aug_Marin.xlsx'),
  file('ER-Aug_Whitfield.xlsx'),
  file('ER-Aug_Sato.xlsx')
];

function bulk(props: IFileUploaderCopilotComponentProperties = ER_PROMPT, dropped: IDroppedFile[] = FOUR, options: { failSave?: boolean; width?: number } = {}): IScreen {
  const s = renderApp(props, { now: NOW, displayMode: 'fullscreen', ...options });
  if (dropped.length > 0) {
    act(() => {
      s.controller.addFiles(dropped);
    });
  }
  return s;
}

/** Fills the per-file fields on one draft so it becomes "ready". */
function fill(s: IScreen, index: number): void {
  const id: string = s.session.filing.drafts[index].id;
  act(() => {
    s.controller.updateField(id, 'owner', 'owner' + (index + 1) + '@example.org');
    s.controller.updateField(id, 'documentDate', '2026-08-01');
    s.controller.updateField(id, 'amount', '120.50');
  });
}

function selectFile(s: IScreen, index: number): void {
  const id: string = s.session.filing.drafts[index].id;
  const el = query(s.container, '[data-bulk-file="' + id + '"]')!;
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('bulk layouts', () => {
  it('declares two distinct states', () => {
    expect(FULLSCREEN_LAYOUTS.length).toBe(2);
    expect(new Set(FULLSCREEN_LAYOUTS).size).toBe(2);
  });
});

describe('the workspace', () => {
  it('is a file list on the left and the selected file on the right', () => {
    const s = bulk();
    expect(layoutOf(s.container)).toBe('filing-bulk');
    expect(s.container.querySelector('[data-display-mode]')!.getAttribute('data-display-mode')).toBe('fullscreen');
    expect(queryAll(s.container, '[data-bulk-file]').length).toBe(4);
    expect(textOf(s.container, '[data-list-summary]')).toContain('4 files');
    expect(query(s.container, '[data-shared-fields]')).toBeDefined();
    expect(textOf(s.container, '[data-bulk-pane] h2')).toBe('ER-Aug_Okafor.xlsx');
    // No organisation name baked into the view — it would show the fictional one against a live library (M11).
    expect(s.container.textContent).toContain('Records library');
    expect(s.container.textContent).not.toContain('Brightwater');
    s.unmount();
  });

  it('carries no collapse control — leaving full screen is the host\'s job', () => {
    const s = bulk();
    expect(query(s.container, '[data-action="collapse"]')).toBeUndefined();
    expect((s.container.textContent || '').toLowerCase()).not.toMatch(/collapse|exit full screen|back to inline/);
    s.unmount();
  });

  it('opens on a positive empty state when nothing was chosen', () => {
    const s = renderApp(ER_PROMPT, { now: NOW, displayMode: 'fullscreen' });
    expect(layoutOf(s.container)).toBe('filing-bulk');
    expect(query(s.container, '[data-file-picker]')).toBeDefined();
    s.unmount();
  });

  it('never echoes the prompt or opens a second prompt box (R24)', () => {
    const s = bulk();
    const text: string = (s.container.textContent || '').toLowerCase();
    expect(text).not.toContain('from your prompt:');
    expect(text).not.toContain('prompt context');
    expect(queryAll(s.container, 'textarea').length).toBe(0);
    s.unmount();
  });

  it('names each file button for a screen reader with its readiness', () => {
    const s = bulk();
    const btn = query(s.container, '[data-bulk-file]')!;
    expect(btn.getAttribute('aria-label')).toBe('ER-Aug_Okafor.xlsx — needs owner');
    s.unmount();
  });
});

describe('readiness', () => {
  it('shows a pill per file and names the first missing field', () => {
    const s = bulk();
    const pills = queryAll(s.container, '[data-bulk-file] [data-readiness]');
    expect(pills.length).toBe(4);
    expect(pills.every(p => p.getAttribute('data-readiness') === 'incomplete')).toBe(true);
    expect((pills[0].textContent || '')).toContain('Needs');
    s.unmount();
  });

  it('counts the ready files and gates the save button on them', () => {
    const s = bulk();
    expect(query(s.container, '[data-action="save-ready"]')!.hasAttribute('disabled')).toBe(true);
    expect(textOf(s.container, '[data-action="save-ready"]')).toContain('0 ready files');

    fill(s, 0);
    fill(s, 1);
    fill(s, 2);

    expect(textOf(s.container, '[data-action="save-ready"]')).toBe('Save 3 ready files');
    // The button saves; there is no review step behind it, so it must not promise one (Decision 10).
    expect(textOf(s.container, '[data-action="save-ready"]')).not.toMatch(/review/i);
    expect(query(s.container, '[data-action="save-ready"]')!.hasAttribute('disabled')).toBe(false);
    expect(textOf(s.container, '[data-list-summary]')).toContain('3 ready · 1 needs input');
    s.unmount();
  });
});

describe('shared fields', () => {
  it('apply to every draft at once', () => {
    const s = bulk();
    setInputValue(s.container, 'shared-department', 'finance');
    expect(s.session.filing.drafts.every(d => d.department === 'finance')).toBe(true);

    setInputValue(s.container, 'shared-status', 'approved');
    expect(s.session.filing.drafts.every(d => d.status === 'approved')).toBe(true);
    s.unmount();
  });

  it('are shown back to the selected file as context text, not disabled controls (R23)', () => {
    const s = bulk();
    setInputValue(s.container, 'shared-department', 'finance');
    const note = query(s.container, '[data-inherited="summary"]')!;
    expect(note.textContent).toContain('Department (Finance)');
    expect(note.textContent).toContain('come from the shared fields above');
    // no disabled form control carrying the inherited value
    expect(query(s.container, '[data-inherited="department"]')).toBeUndefined();
    expect(queryAll(s.container, '[data-bulk-pane] input:disabled').length).toBe(0);
    s.unmount();
  });
});

describe('per-file overrides', () => {
  it('stay independent between files', () => {
    const s = bulk();
    selectFile(s, 0);
    setInputValue(s.container, 'owner', 'kim.okafor@example.org');
    expect(s.session.filing.drafts[0].owner).toBe('kim.okafor@example.org');

    selectFile(s, 1);
    expect((query(s.container, '[data-input="owner"]') as HTMLInputElement).value).toBe('');
    expect(s.session.filing.drafts[1].owner).toBeUndefined();
    s.unmount();
  });
});

describe('review and save', () => {
  it('saves only the ready subset and leaves the rest in the list', async () => {
    const s = bulk();
    fill(s, 0);
    fill(s, 1);
    fill(s, 2);
    clickButton(s.container, 'save-ready');
    await flush();

    expect(layoutOf(s.container)).toBe('filing-bulk-receipt');
    expect(queryAll(s.container, '[data-receipt-row]').length).toBe(3);
    expect(s.session.filing.drafts.length).toBe(1);
    expect(query(s.container, '[data-remaining]')).toBeDefined();
    expect(textOf(s.container, '[data-remaining]')).toContain('1 file still needs input');
    expect(query(s.container, '[data-action="resume-remaining"]')).toBeDefined();
    s.unmount();
  });

  it('the bulk receipt lists document, owner, amount, saved path and receipt number', async () => {
    const s = bulk();
    fill(s, 0);
    fill(s, 1);
    fill(s, 2);
    clickButton(s.container, 'save-ready');
    await flush();

    const headings: string[] = queryAll(s.container, '[data-bulk-receipt] th').map(th => (th.textContent || '').trim());
    expect(headings).toEqual(['Document', 'Owner', 'Amount', 'Saved to', 'Receipt']);

    const firstRow = query(s.container, '[data-receipt-row]')!;
    expect(firstRow.textContent).toContain('owner1@example.org');
    expect(firstRow.textContent).toContain('$120.50');
    expect(firstRow.textContent).toContain('#F-10946');
    expect(firstRow.textContent).toContain('Records / Finance / Expense reports / Development');
    s.unmount();
  });

  it('the bulk sample receipt does not read as a real filing either (8.7 G2)', async () => {
    const s = bulk();
    fill(s, 0);
    fill(s, 1);
    clickButton(s.container, 'save-ready');
    await flush();

    const banner: string = textOf(s.container, '[data-banner="success"]');
    expect(textOf(s.container, 'h1')).toBe('Sample receipt');
    expect(textOf(s.container, 'h1')).not.toContain('Filed');
    expect(banner).toContain('Sample receipt — nothing was filed');
    expect(banner).not.toContain('are filed.');
    expect(banner).toContain('Sample — not saved');
    expect(banner).not.toContain('Dana');
    // The receipt range still identifies the records.
    expect(banner).toContain('#F-10946');
    expect(s.container.textContent).not.toContain('Metadata can be corrected in SharePoint');
    s.unmount();
  });

  it('live mode keeps the real bulk receipt copy unchanged (8.7 G2)', async () => {
    const s = bulk();
    fill(s, 0);
    fill(s, 1);
    clickButton(s.container, 'save-ready');
    await flush();
    setLiveMode(s);

    const banner: string = textOf(s.container, '[data-banner="success"]');
    expect(banner).toContain('are filed.');
    expect(banner).toContain('saved ');
    expect(textOf(s.container, 'h1')).toBe('Filed 2 expense reports');
    expect(banner).not.toContain('Sample receipt');
    expect(s.container.textContent).toContain('Metadata can be corrected in SharePoint');
    s.unmount();
  });

  it('the shared date field names the calendar date it resolved to (8.7 G1)', () => {
    const s = bulk();
    act(() => {
      s.controller.applyToAll('documentDate', 'yesterday');
    });

    expect(textOf(s.container, '[data-field="shared-documentDate"]')).toContain('17 Aug 2026 (yesterday)');
    s.unmount();
  });

  it('file more clears the workspace back to the file picker', async () => {
    const s = bulk();
    fill(s, 0);
    fill(s, 1);
    fill(s, 2);
    fill(s, 3);
    clickButton(s.container, 'save-ready');
    await flush();

    expect(queryAll(s.container, '[data-receipt-row]').length).toBe(4);
    expect(query(s.container, '[data-remaining]')).toBeUndefined();

    clickButton(s.container, 'file-more');
    expect(layoutOf(s.container)).toBe('filing-bulk');
    expect(query(s.container, '[data-file-picker]')).toBeDefined();
    expect(s.session.filing.drafts.length).toBe(0);
    s.unmount();
  });

  it('links to the saved folder only when every receipt shares a real one (H5)', async () => {
    const s = bulk();
    fill(s, 0);
    fill(s, 1);
    clickButton(s.container, 'save-ready');
    await flush();

    // Sample data: no folder URL, so no link.
    expect(query(s.container, '[data-link-out]')).toBeUndefined();

    const folder: string = 'https://tenant.example.org/sites/records/Records/Finance/Expense%20reports/Development/2026';
    s.session.filing.receipts.forEach(r => {
      r.folderUrl = folder;
    });
    s.repaint();
    // As text with Copy link, never an anchor the host would swallow (8.8 L9).
    expect(textOf(s.container, '[data-link-url]')).toBe(folder);
    expect(query(s.container, 'a[target="_blank"]')).toBeUndefined();
    expect(query(s.container, '[data-action="copy-link"]')).toBeUndefined();

    // Two different folders: no single place to open, so no link.
    s.session.filing.receipts[1].folderUrl = folder + '/elsewhere';
    s.repaint();
    expect(query(s.container, '[data-link-out]')).toBeUndefined();
    s.unmount();
  });
});

describe('adding more files', () => {
  it('appends to the set without resetting entered values', () => {
    const s = bulk();
    fill(s, 0);
    const amount0 = s.session.filing.drafts[0].amount;

    chooseFiles(s.container, [{ name: 'ER-Aug_Pike.xlsx', size: 170_000 }]);

    expect(s.session.filing.drafts.length).toBe(5);
    expect(s.session.filing.drafts[0].amount).toBe(amount0);
    s.unmount();
  });
});

describe('error fallback', () => {
  it('keeps the files and offers a retry', async () => {
    const s = bulk(ER_PROMPT, FOUR, { failSave: true });
    fill(s, 0);
    fill(s, 1);
    clickButton(s.container, 'save-ready');
    await flush();

    expect(layoutOf(s.container)).toBe('filing-bulk');
    expect(query(s.container, '[data-banner="error"]')).toBeDefined();
    expect(query(s.container, '[data-banner="error"]')!.getAttribute('role')).toBe('alert');
    expect(query(s.container, '[data-action="retry-bulk"]')).toBeDefined();
    expect(s.session.filing.drafts.length).toBe(4);
    s.unmount();
  });
});
