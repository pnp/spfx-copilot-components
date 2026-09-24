import { FILING_LAYOUTS } from './FilingInline';
import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';
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
const PDF = { name: 'Riverside-Print-Co_INV-20417.pdf', size: 421_888, type: 'application/pdf' };
const PDF2 = { name: 'Harborview-Catering_INV-0088.pdf', size: 302_080, type: 'application/pdf' };

const COMPLETE_PROMPT: IFileUploaderCopilotComponentProperties = {
  documentKind: 'invoice',
  department: 'programs',
  vendor: 'Riverside Print Co.',
  documentDate: 'last Friday',
  amount: 1284.5
};

function screen(
  props: IFileUploaderCopilotComponentProperties = {},
  options: { failSave?: boolean; width?: number; theme?: 'light' | 'dark' } = {}
): IScreen {
  return renderApp(props, { now: NOW, ...options });
}

describe('every stage has a distinct layout', () => {
  it('declares seven', () => {
    expect(FILING_LAYOUTS.length).toBe(7);
    expect(new Set(FILING_LAYOUTS).size).toBe(7);
  });
});

describe('empty', () => {
  it('renders the file picker and no form', () => {
    const s = screen();
    expect(layoutOf(s.container)).toBe('filing-empty');
    expect(query(s.container, '[data-file-picker]')).toBeDefined();
    expect(query(s.container, '[data-field="amount"]')).toBeUndefined();
    s.unmount();
  });

  it('carries the theme through to the view', () => {
    const s = screen({}, { theme: 'dark' });
    expect(query(s.container, '[data-layout]')!.getAttribute('data-theme')).toBe('dark');
    s.unmount();
  });

  it('names the library, not an organisation (M11)', () => {
    const s = screen();
    expect(s.container.textContent).toContain('Files go to the Records library.');
    expect(s.container.textContent).not.toContain('Brightwater');
    s.unmount();
  });
});

describe('sample data', () => {
  it('says so while the store is the mock', () => {
    const s = screen();
    expect(textOf(s.container, '[data-sample="true"]')).toBe('Sample data — nothing is stored');
    s.unmount();
  });

  it('says nothing once the store is real', () => {
    const s = screen();
    (s.store as unknown as { isSampleData: boolean }).isSampleData = false;
    s.repaint();
    expect(query(s.container, '[data-sample]')).toBeUndefined();
    s.unmount();
  });
});

describe('draft', () => {
  it('shows the file and the fields the kind requires, pre-filled and marked', () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);

    expect(layoutOf(s.container)).toBe('filing-draft');
    expect(textOf(s.container, '[data-file-row]')).toContain('Riverside-Print-Co_INV-20417.pdf');
    expect(query(s.container, '[data-field="vendor"]')).toBeDefined();
    expect(query(s.container, '[data-field="owner"]')).toBeUndefined(); // invoices have no owner field
    expect(query(s.container, '[data-prefilled="department"]')).toBeDefined();
    s.unmount();
  });

  it('swaps vendor for owner when the kind changes to an expense report', () => {
    const s = screen();
    chooseFiles(s.container, [PDF]);
    setInputValue(s.container, 'documentKind', 'expenseReport');

    expect(query(s.container, '[data-field="owner"]')).toBeDefined();
    expect(query(s.container, '[data-field="vendor"]')).toBeUndefined();
    s.unmount();
  });

  it('updates the destination line as kind and department change', () => {
    const s = screen();
    chooseFiles(s.container, [PDF]);
    expect(query(s.container, '[data-destination="pending"]')).toBeDefined();

    setInputValue(s.container, 'documentKind', 'invoice');
    setInputValue(s.container, 'department', 'finance');
    expect(textOf(s.container, '[data-destination="resolved"]')).toBe('Destination: Finance › Invoices › Finance');
    s.unmount();
  });

  it('keeps the decimal point while the amount is being typed (H3)', () => {
    const s = screen({ documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.' });
    chooseFiles(s.container, [PDF]);
    ['1', '12', '12.', '12.5'].forEach(text => {
      setInputValue(s.container, 'amount', text);
      expect((query(s.container, '[data-input="amount"]') as HTMLInputElement).value).toBe(text);
    });
    s.unmount();
  });

  it('does not save when the file is chosen', () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);
    expect(s.session.filing.receipts).toEqual([]);
    s.unmount();
  });
});

describe('validation', () => {
  it('marks the missing fields and refuses to move on', () => {
    const s = screen({ documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.' });
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');

    expect(layoutOf(s.container)).toBe('filing-validation');
    expect(textOf(s.container, '[data-banner="warning"]')).toContain('Nothing has been saved.');
    expect(textOf(s.container, '[data-banner="warning"]')).toContain('needs a date and an amount');
    expect(query(s.container, '[data-field="documentDate"]')!.getAttribute('data-invalid')).toBe('true');
    expect(query(s.container, '[data-field="amount"]')!.getAttribute('data-invalid')).toBe('true');
    expect(query(s.container, '[data-field="vendor"]')!.getAttribute('data-invalid')).toBe('false');
    s.unmount();
  });

  it('clears each error as the user fixes it', () => {
    const s = screen({ documentKind: 'invoice', department: 'programs', vendor: 'Riverside Print Co.' });
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');

    setInputValue(s.container, 'documentDate', '3 days ago');
    expect(query(s.container, '[data-field="documentDate"]')!.getAttribute('data-invalid')).toBe('false');
    expect(layoutOf(s.container)).toBe('filing-validation');

    setInputValue(s.container, 'amount', '1284.50');
    expect(layoutOf(s.container)).toBe('filing-draft');
    s.unmount();
  });
});

describe('review and confirm', () => {
  it('shows the record and the exact destination before anything is written', () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');

    expect(layoutOf(s.container)).toBe('filing-review');
    expect(textOf(s.container, '[data-summary-value="amount"]')).toBe('$1,284.50');
    // The calendar date leads, the relative label follows (8.7 G1).
    expect(textOf(s.container, '[data-summary-value="documentDate"]')).toBe('14 Aug 2026 (4 days ago)');
    expect(textOf(s.container, '[data-summary-value="destination"]')).toBe(
      'Records / Finance / Invoices / Programs / 2026 / Riverside-Print-Co_INV-20417.pdf'
    );
    expect(s.session.filing.receipts).toEqual([]);
    s.unmount();
  });

  it('back to edit returns to the form with the values intact', () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');
    clickButton(s.container, 'back-to-edit');

    expect(layoutOf(s.container)).toBe('filing-draft');
    expect((query(s.container, '[data-input="vendor"]') as HTMLInputElement).value).toBe('Riverside Print Co.');
    s.unmount();
  });

  it('confirm is what saves, and it produces the receipt', async () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');
    clickButton(s.container, 'confirm-save');
    await flush();

    expect(layoutOf(s.container)).toBe('filing-receipt');
    // Sample mode, so the headline says so (8.7 G2) — the receipt number is still the point of this test.
    expect(textOf(s.container, '[data-banner="success"]')).toContain('Sample receipt — nothing was filed');
    expect(textOf(s.container, '[data-banner="success"]')).toContain('F-10946');
    expect(textOf(s.container, '[data-summary-value="savedPath"]')).toContain('Records / Finance / Invoices / Programs');
    s.unmount();
  });

  describe('the link to the saved file (H5, 8.8 L9)', () => {
    const url: string = 'https://tenant.example.org/sites/records/Records/Finance/Invoices/Programs/2026/Riverside-Print-Co_INV-20417.pdf';

    async function receipt(options: { openLink?: (u: string) => Promise<boolean> } = {}): Promise<IScreen> {
      const s = renderApp(COMPLETE_PROMPT, { now: NOW, ...options });
      chooseFiles(s.container, [PDF]);
      clickButton(s.container, 'review-and-save');
      clickButton(s.container, 'confirm-save');
      await flush();
      return s;
    }
    const withUrl = (s: IScreen): void => {
      s.session.filing.receipts[0].webUrl = url;
      s.repaint();
    };

    it('is absent on sample data — the saved path is still shown as text', async () => {
      const s = await receipt();
      expect(query(s.container, '[data-link-out]')).toBeUndefined();
      expect(textOf(s.container, '[data-summary-value="savedPath"]')).toContain('Riverside-Print-Co_INV-20417.pdf');
      s.unmount();
    });

    it('shows the URL as text, and no anchor the host would swallow', async () => {
      const s = await receipt();
      withUrl(s);
      expect(textOf(s.container, '[data-link-url]')).toBe(url);
      expect(query(s.container, 'a[target="_blank"]')).toBeUndefined();
      expect(query(s.container, 'a[href="' + url + '"]')).toBeUndefined();
      // No host open-link call, so no Open button that could only fail.
      expect(query(s.container, '[data-action="open-in-sharepoint"]')).toBeUndefined();
      s.unmount();
    });

    it('offers no Copy link: the canvas never grants the clipboard (L10)', async () => {
      const s = await receipt({ openLink: () => Promise.resolve(true) });
      withUrl(s);
      expect(query(s.container, '[data-action="copy-link"]')).toBeUndefined();
      expect(s.container.textContent).not.toMatch(/copy link/i);
      // The URL is still there to select by hand.
      expect(textOf(s.container, '[data-link-url]')).toBe(url);
      s.unmount();
    });

    it('wraps the URL between path segments, not inside the file name (L10)', async () => {
      const s = await receipt();
      withUrl(s);
      const el = query(s.container, '[data-link-url]')!;
      // One break opportunity after each "/" past the host; none in "https://".
      expect(el.querySelectorAll('wbr').length).toBe(url.split('/').length - 3);
      expect(el.innerHTML).toContain('2026/<wbr>Riverside-Print-Co_INV-20417.pdf');
      expect(el.innerHTML).not.toContain('https:/<wbr>');
      s.unmount();
    });

    it('opens through the host when it offers a way, and says so when it refuses', async () => {
      const openLink = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      const s = await receipt({ openLink });
      withUrl(s);
      clickButton(s.container, 'open-in-sharepoint');
      await flush();
      expect(openLink).toHaveBeenCalledWith(url);
      expect(textOf(s.container, '[data-link-status]')).toBe('');
      clickButton(s.container, 'open-in-sharepoint');
      await flush();
      expect(textOf(s.container, '[data-link-status]')).toBe("Couldn't open the link here. Select it above to copy it.");
      expect(query(s.container, '[data-link-status]')!.getAttribute('aria-live')).toBe('polite');
      s.unmount();
    });
  });

  it('shows the calendar date being written, not just the phrase (8.7 G1)', async () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);

    // "last Friday" resolves to 14 Aug 2026 against the fixed clock. The field
    // helper, the review summary and the receipt must all name that date.
    expect(textOf(s.container, '[data-field="documentDate"]')).toContain('14 Aug 2026');

    clickButton(s.container, 'review-and-save');
    expect(textOf(s.container, '[data-summary-value="documentDate"]')).toBe('14 Aug 2026 (4 days ago)');

    clickButton(s.container, 'confirm-save');
    await flush();
    expect(layoutOf(s.container)).toBe('filing-receipt');
    expect(textOf(s.container, '[data-summary-value="documentDate"]')).toBe('14 Aug 2026 (4 days ago)');
    s.unmount();
  });

  it('the sample receipt does not read as a real filing (8.7 G2, R25/R37)', async () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');
    clickButton(s.container, 'confirm-save');
    await flush();

    expect(textOf(s.container, '[data-banner="success"]')).toContain('Sample receipt — nothing was filed');
    expect(textOf(s.container, '[data-banner="success"]')).not.toContain('is filed.');

    // The heading a screen reader announces first must not contradict the rest.
    expect(textOf(s.container, 'h1')).toBe('Sample receipt');

    // No person's name: a fictional one reads as provenance there is none of.
    const header: string = textOf(s.container, 'header');
    expect(header).toContain('Sample — not saved');
    expect(header).not.toContain('Dana');
    expect(header).not.toContain('Saved ');

    // Nothing reached SharePoint, so nothing can be corrected there.
    expect(s.container.textContent).not.toContain('Metadata can be corrected in SharePoint');

    // The receipt number still shows — it is how the record is identified.
    expect(textOf(s.container, '[data-banner="success"]')).toContain('F-10946');
    s.unmount();
  });

  it('live mode keeps the real receipt copy unchanged (8.7 G2)', async () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');
    clickButton(s.container, 'confirm-save');
    await flush();
    setLiveMode(s);

    expect(textOf(s.container, '[data-banner="success"]')).toContain('is filed.');
    expect(textOf(s.container, '[data-banner="success"]')).not.toContain('Sample receipt');
    expect(textOf(s.container, 'h1')).toBe('Filed');
    expect(textOf(s.container, 'header')).toContain('Saved ');
    expect(s.container.textContent).toContain('Metadata can be corrected in SharePoint');
    s.unmount();
  });

  it('file another resets to the empty state', async () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');
    clickButton(s.container, 'confirm-save');
    await flush();
    clickButton(s.container, 'file-another');

    expect(layoutOf(s.container)).toBe('filing-empty');
    expect(query(s.container, '[data-file-picker]')).toBeDefined();
    s.unmount();
  });
});

describe('error fallback', () => {
  it('keeps the file and the values, and offers retry', async () => {
    const s = screen(COMPLETE_PROMPT, { failSave: true });
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');
    clickButton(s.container, 'confirm-save');
    await flush();

    expect(layoutOf(s.container)).toBe('filing-error');
    expect(textOf(s.container, '[data-banner="error"]')).toContain('Nothing was saved.');
    expect(textOf(s.container, '[data-file-row]')).toContain('kept in this card');
    expect(textOf(s.container, '[data-summary-value="amount"]')).toBe('$1,284.50');
    expect(query(s.container, '[data-action="retry"]')).toBeDefined();
    expect(query(s.container, '[data-action="download-details"]')).toBeDefined();
    s.unmount();
  });

  it('announces the failure to assistive technology', async () => {
    const s = screen(COMPLETE_PROMPT, { failSave: true });
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');
    clickButton(s.container, 'confirm-save');
    await flush();

    expect(query(s.container, '[data-banner="error"]')!.getAttribute('role')).toBe('alert');
    s.unmount();
  });
});

describe('several files hand off to the full-screen workspace', () => {
  it('asks the host for full screen when two or more files are chosen', () => {
    const calls: number[] = [];
    const s = renderApp(
      {},
      { now: NOW, onRequestFullscreen: () => { calls.push(1); return Promise.resolve(); } }
    );
    chooseFiles(s.container, [PDF, PDF2]);
    expect(calls.length).toBe(1);
    s.unmount();
  });

  it('does not ask for full screen for a single file', () => {
    const calls: number[] = [];
    const s = renderApp(
      {},
      { now: NOW, onRequestFullscreen: () => { calls.push(1); return Promise.resolve(); } }
    );
    chooseFiles(s.container, [PDF]);
    expect(calls.length).toBe(0);
    expect(layoutOf(s.container)).toBe('filing-draft');
    s.unmount();
  });

  it('shows the file set and a way into the workspace rather than editing one file', () => {
    const s = screen();
    chooseFiles(s.container, [PDF, PDF2]);

    expect(layoutOf(s.container)).toBe('filing-draft');
    expect(textOf(s.container, 'header')).toContain('File 2 documents');
    expect(queryAll(s.container, '[data-file-row]').length).toBe(2);
    expect(query(s.container, '[data-field="amount"]')).toBeUndefined();
    expect(query(s.container, '[data-action="open-fullscreen"]')).toBeDefined();
    s.unmount();
  });
});

describe('accessibility and anti-patterns', () => {
  it('never renders a prompt echo or a second prompt box (R24)', () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);
    const text: string = (s.container.textContent || '').toLowerCase();
    expect(text).not.toContain('from your prompt:');
    expect(text).not.toContain('prompt context');
    expect(queryAll(s.container, 'textarea').length).toBe(0);
    s.unmount();
  });

  it('spells out every status rather than relying on colour', async () => {
    const s = screen(COMPLETE_PROMPT);
    chooseFiles(s.container, [PDF]);
    clickButton(s.container, 'review-and-save');

    const pill = query(s.container, '[data-status]')!;
    expect(pill.getAttribute('data-status')).toBe('received');
    expect((pill.textContent || '').trim()).toBe('Received');
    s.unmount();
  });

  it('labels the file input', () => {
    const s = screen();
    expect(query(s.container, '[data-file-input]')!.getAttribute('aria-label')).toBeTruthy();
    s.unmount();
  });
});
