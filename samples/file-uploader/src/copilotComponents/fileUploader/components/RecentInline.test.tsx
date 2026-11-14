import { act } from 'react-dom/test-utils';
import { RECENT_LAYOUTS } from './RecentInline';
import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';
import { clickButton, flush, IScreen, layoutOf, query, queryAll, renderApp, textOf } from './testHelpers';

const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);

const RECENT: IFileUploaderCopilotComponentProperties = { intent: 'recent' };

async function screen(
  props: IFileUploaderCopilotComponentProperties = RECENT,
  options: { failRecent?: boolean; width?: number; theme?: 'light' | 'dark'; openLink?: (url: string) => Promise<boolean> } = {}
): Promise<IScreen> {
  const s = renderApp(props, { now: NOW, ...options });
  await flush(); // the effect fires the first load
  return s;
}

/** Chips are native selects; the period chips are toggle buttons. */
function setChip(s: IScreen, name: string, value: string): void {
  const el = query(s.container, '[data-chip="' + name + '"]') as HTMLSelectElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  if (setter && setter.set) {
    setter.set.call(el, value);
  }
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('layouts', () => {
  it('declares five distinct states', () => {
    expect(RECENT_LAYOUTS.length).toBe(5);
    expect(new Set(RECENT_LAYOUTS).size).toBe(5);
  });
});

describe('default', () => {
  it('lists the filings with their metadata', async () => {
    const s = await screen();
    expect(layoutOf(s.container)).toBe('recent-default');
    expect(query(s.container, '[data-rows]')!.getAttribute('data-rows')).toBe('14');
    expect(queryAll(s.container, '[data-row]').length).toBe(8); // the eight the design draws
    expect(textOf(s.container, '[data-row] td')).toContain('Riverside-Print-Co_INV-20417.pdf');
    s.unmount();
  });

  it('says how many there are and how many are shown', async () => {
    const s = await screen();
    expect(textOf(s.container, 'header')).toContain('14 filings in the last 30 days');
    expect(textOf(s.container, 'header')).toContain('showing the 8 most recent');
    s.unmount();
  });

  it('shows a skeleton before the first rows arrive, then the rows', async () => {
    const s = renderApp(RECENT, { now: NOW });
    expect(layoutOf(s.container)).toBe('recent-loading');
    expect(query(s.container, '[aria-busy="true"]')).toBeDefined();
    await flush();
    expect(layoutOf(s.container)).toBe('recent-default');
    s.unmount();
  });
});

describe('filtering', () => {
  it('narrows the rows and switches to the filtered layout', async () => {
    const s = await screen();
    setChip(s, 'department', 'finance');
    await flush();

    expect(layoutOf(s.container)).toBe('recent-filtered');
    expect(query(s.container, '[data-chip="department"]')!.getAttribute('data-active')).toBe('true');
    expect(queryAll(s.container, '[data-row]').length).toBeLessThan(8);
    s.unmount();
  });

  it('never flashes a skeleton when a filter changes (R16)', async () => {
    const s = await screen();
    setChip(s, 'documentKind', 'invoice');
    expect(layoutOf(s.container)).not.toBe('recent-loading');
    await flush();
    expect(layoutOf(s.container)).not.toBe('recent-loading');
    s.unmount();
  });

  it('marks exactly one period as pressed', async () => {
    const s = await screen();
    const pressed: string[] = queryAll(s.container, '[data-chip^="period-"]')
      .filter(c => c.getAttribute('aria-pressed') === 'true')
      .map(c => c.getAttribute('data-chip') || '');
    expect(pressed).toEqual(['period-30d']);
    s.unmount();
  });

  it('every period chip returns a different set', async () => {
    const s = await screen();
    const counts: number[] = [];
    for (const period of ['7d', '30d', '90d']) {
      const chip = query(s.container, '[data-chip="period-' + period + '"]')!;
      chip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flush();
      counts.push(Number(query(s.container, '[data-rows]')!.getAttribute('data-rows')));
      expect(chip.getAttribute('aria-pressed')).toBe('true');
    }
    expect(counts).toEqual([8, 14, 36]);
    s.unmount();
  });
});

describe('selected detail', () => {
  it('expands the record in place and offers only a safe read-only link', async () => {
    const s = await screen();
    const rowId: string = query(s.container, '[data-row]')!.getAttribute('data-row')!;
    query(s.container, '[data-row-button="' + rowId + '"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();

    expect(query(s.container, '[data-row="' + rowId + '"]')!.getAttribute('data-selected')).toBe('true');
    expect(query(s.container, '[data-row-button="' + rowId + '"]')!.getAttribute('aria-expanded')).toBe('true');

    const detail = query(s.container, '[data-detail="' + rowId + '"]')!;
    expect(detail.textContent).toContain('Riverside Print Co.');
    expect(detail.textContent).toContain('#F-10932');
    expect(detail.textContent).toContain('Records / Finance / Invoices / Programs');

    // Sample data has no real file to open, so no link — never a dead one (H5).
    expect(query(s.container, '[data-action="open-row-in-sharepoint"]')).toBeUndefined();
    s.unmount();
  });

  it('links a real file from its expanded row as text and a host open, no Copy link (H5, L9, L10)', async () => {
    const openLink = jest.fn().mockResolvedValue(true);
    const s = await screen(RECENT, { openLink });
    const realGetRecent = s.store.getRecent.bind(s.store);
    s.store.getRecent = async (filter, now) =>
      (await realGetRecent(filter, now)).map(r => ({ ...r, webUrl: 'https://tenant.example.org/files/' + r.fileName }));
    await act(async () => {
      await s.recent.setFilter({ period: '90d' });
    });

    const button = query(s.container, '[data-row-button]')!;
    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const url: string = 'https://tenant.example.org/files/Riverside-Print-Co_INV-20417.pdf';
    expect(textOf(s.container, '[data-link-url]')).toBe(url);
    expect(query(s.container, 'a[target="_blank"]')).toBeUndefined();

    clickButton(s.container, 'open-row-in-sharepoint');
    await flush();
    expect(openLink).toHaveBeenCalledWith(url);

    expect(query(s.container, '[data-action="copy-link"]')).toBeUndefined();
    s.unmount();
  });

  it('offers no way to edit a filed record', async () => {
    const s = await screen();
    const rowId: string = query(s.container, '[data-row]')!.getAttribute('data-row')!;
    query(s.container, '[data-row-button="' + rowId + '"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();

    const detail = query(s.container, '[data-detail="' + rowId + '"]')!;
    expect(detail.querySelectorAll('input, textarea').length).toBe(0);
    expect(detail.textContent).toContain('To correct metadata, open the file in SharePoint.');
    s.unmount();
  });

  it('closes again when the same row is chosen', async () => {
    const s = await screen();
    const rowId: string = query(s.container, '[data-row]')!.getAttribute('data-row')!;
    const click = (): void => {
      query(s.container, '[data-row-button="' + rowId + '"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    };
    click();
    await flush();
    click();
    await flush();
    expect(query(s.container, '[data-detail="' + rowId + '"]')).toBeUndefined();
    s.unmount();
  });
});

describe('no match', () => {
  it('is positive and offers a way out', async () => {
    const s = await screen();
    setChip(s, 'department', 'finance');
    await flush();
    setChip(s, 'status', 'returned');
    await flush();

    expect(layoutOf(s.container)).toBe('recent-no-match');
    const text: string = s.container.textContent || '';
    expect(text).toContain('Every Finance filing');
    expect(text).toContain('went through cleanly');
    expect(text.toLowerCase()).not.toContain('no data');
    expect(text.toLowerCase()).not.toContain('no results');
    expect(query(s.container, '[data-action="clear-filters"]')).toBeDefined();
    s.unmount();
  });

  it('clearing the filters brings the rows back', async () => {
    const s = await screen();
    setChip(s, 'department', 'finance');
    await flush();
    setChip(s, 'status', 'returned');
    await flush();
    clickButton(s.container, 'clear-filters');
    await flush();

    expect(layoutOf(s.container)).toBe('recent-default');
    expect(queryAll(s.container, '[data-row]').length).toBe(8);
    s.unmount();
  });
});

describe('error', () => {
  it('is honest and retryable', async () => {
    const s = await screen(RECENT, { failRecent: true });
    expect(layoutOf(s.container)).toBe('recent-error');
    expect(textOf(s.container, '[data-banner="error"]')).toContain('did not respond');
    expect(textOf(s.container, '[data-banner="error"]')).toContain('your filings are safe');
    expect(query(s.container, '[data-banner="error"]')!.getAttribute('role')).toBe('alert');
    expect(query(s.container, '[data-action="retry-recent"]')).toBeDefined();
    s.unmount();
  });
});

describe('narrow layout', () => {
  it('drops the department and filed columns into the document row', async () => {
    const s = await screen(RECENT, { width: 340 });
    expect(queryAll(s.container, 'th').length).toBe(3);
    expect(textOf(s.container, '[data-row] td')).toContain('Programs · 12 min ago');
    s.unmount();
  });

  it('shortens the longest status label so it does not clip', async () => {
    const s = await screen(RECENT, { width: 340 });
    const pending = queryAll(s.container, '[data-status="pendingReview"]')[0];
    expect((pending.textContent || '').trim()).toBe('Pending');
    s.unmount();
  });

  it('keeps all five columns at standard width', async () => {
    const s = await screen(RECENT, { width: 760 });
    expect(queryAll(s.container, 'th').length).toBe(5);
    s.unmount();
  });
});
