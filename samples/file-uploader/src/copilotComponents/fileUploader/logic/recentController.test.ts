import { RecentController } from './recentController';
import { createSession, ISession } from '../models/session';
import { MockDocumentStoreService } from '../services/MockDocumentStoreService';
import type { IRecentFilingRow } from '../models/filing';

const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);

interface IHarness {
  recent: RecentController;
  session: ISession;
  store: MockDocumentStoreService;
  fetches: () => number;
}

function harness(options: { failRecent?: boolean } = {}, props = {}): IHarness {
  const session: ISession = createSession(props, 1);
  const store = new MockDocumentStoreService({ latencyMs: 0, ...options });
  let fetches: number = 0;
  const realGet = store.getRecent.bind(store);
  store.getRecent = (filter, now) => {
    fetches++;
    return realGet(filter, now);
  };
  const recent = new RecentController(session, store, () => NOW, () => undefined);
  return { recent, session, store, fetches: () => fetches };
}

describe('initial load', () => {
  it('goes idle -> loading -> ready and fills the rows', async () => {
    const h = harness();
    expect(h.session.recent.state).toBe('idle');
    await h.recent.loadInitial();
    expect(h.session.recent.state).toBe('ready');
    expect(h.recent.rows.length).toBe(14); // 30-day default window
    expect(h.recent.rows[0].fileName).toBe('Riverside-Print-Co_INV-20417.pdf');
  });

  it('loads only once, however often it is called', async () => {
    const h = harness();
    await h.recent.loadInitial();
    await h.recent.loadInitial();
    await h.recent.loadInitial();
    expect(h.fetches()).toBe(1);
  });

  it('opens on the filter the prompt asked for', async () => {
    const h = harness({}, { department: 'finance', status: 'pendingReview', period: '30d' });
    await h.recent.loadInitial();
    expect(h.recent.filter.department).toBe('finance');
    expect(h.recent.rows.length).toBe(1);
    expect(h.recent.rows[0].fileName).toBe('ER-Aug_Marin.xlsx');
    expect(h.recent.isFiltered).toBe(true);
  });
});

describe('filtering', () => {
  it('never returns to a loading state — no fake waiting (R16)', async () => {
    const session: ISession = createSession({}, 1);
    const store = new MockDocumentStoreService({ latencyMs: 0 });
    const seen: string[] = [];
    // Record the state at every notification, not only after the awaits: a filter
    // change that flashed 'loading' and then settled would otherwise pass (audit M23).
    const recent = new RecentController(session, store, () => NOW, () => {
      seen.push(session.recent.state);
    });
    await recent.loadInitial();
    seen.length = 0;

    await recent.setFilter({ department: 'finance' });
    await recent.setFilter({ status: 'paid' });
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.filter(state => state === 'loading')).toEqual([]);
  });

  it('re-queries the store on every change, so each chip changes the result (R23)', async () => {
    const h = harness();
    await h.recent.loadInitial();
    const all: number = h.recent.rows.length;

    await h.recent.setFilter({ documentKind: 'invoice' });
    const invoices: number = h.recent.rows.length;
    expect(invoices).toBeLessThan(all);
    expect(h.recent.rows.every(r => r.documentKind === 'invoice')).toBe(true);

    await h.recent.setFilter({ period: '90d' });
    expect(h.recent.rows.length).toBeGreaterThan(invoices);
    expect(h.fetches()).toBe(3);
  });

  it('reports whether anything is narrowing the list, ignoring the period', async () => {
    const h = harness();
    await h.recent.loadInitial();
    expect(h.recent.isFiltered).toBe(false);
    await h.recent.setFilter({ period: '7d' });
    expect(h.recent.isFiltered).toBe(false); // a period is always set; it is not a narrowing filter
    await h.recent.setFilter({ status: 'paid' });
    expect(h.recent.isFiltered).toBe(true);
  });

  it('clears the narrowing filters but keeps the period', async () => {
    const h = harness();
    await h.recent.loadInitial();
    await h.recent.setFilter({ department: 'finance', status: 'returned', period: '7d' });
    await h.recent.clearFilters();
    expect(h.recent.filter).toEqual({ documentKind: undefined, department: undefined, status: undefined, period: '7d' });
    expect(h.recent.isFiltered).toBe(false);
  });

  it('yields nothing for the no-match case from the designs', async () => {
    const h = harness();
    await h.recent.loadInitial();
    await h.recent.setFilter({ department: 'finance', status: 'returned' });
    expect(h.recent.rows).toEqual([]);
    expect(h.session.recent.state).toBe('ready'); // empty is a result, not an error
  });

  it('applies only the newest result when changes overlap', async () => {
    const h = harness();
    await h.recent.loadInitial();
    const source = new MockDocumentStoreService({ latencyMs: 0 });
    let releaseSlow: () => void = () => undefined;
    // The first query answers last. Without the generation guard its invoice rows
    // would overwrite the newer expense-report rows (audit M23).
    h.store.getRecent = (filter, now) => {
      const rows: Promise<IRecentFilingRow[]> = source.getRecent(filter, now);
      if (filter.documentKind !== 'invoice') {
        return rows;
      }
      return new Promise<IRecentFilingRow[]>(resolve => {
        releaseSlow = () => resolve(rows);
      });
    };

    const slow = h.recent.setFilter({ documentKind: 'invoice' });
    const fast = h.recent.setFilter({ documentKind: 'expenseReport' });
    await fast;
    releaseSlow();
    await slow;

    expect(h.recent.rows.length).toBeGreaterThan(0);
    expect(h.recent.rows.every(r => r.documentKind === 'expenseReport')).toBe(true);
  });
});

describe('selection', () => {
  it('opens a row, and selecting it again closes it', async () => {
    const h = harness();
    await h.recent.loadInitial();
    const id: string = h.recent.rows[0].id;

    h.recent.selectRow(id);
    expect(h.recent.selectedRow()!.id).toBe(id);
    h.recent.selectRow(id);
    expect(h.recent.selectedRow()).toBeUndefined();
  });

  it('drops the selection when a filter would hide the row', async () => {
    const h = harness();
    await h.recent.loadInitial();
    h.recent.selectRow(h.recent.rows[0].id);
    await h.recent.setFilter({ documentKind: 'expenseReport' });
    expect(h.recent.selectedRow()).toBeUndefined();
  });
});

describe('failure', () => {
  it('reports an error rather than an empty list', async () => {
    const h = harness({ failRecent: true });
    await h.recent.loadInitial();
    expect(h.session.recent.state).toBe('error');
    expect(h.session.recent.error).toContain('did not respond');
    expect(h.recent.rows).toEqual([]);
  });

  it('recovers on retry', async () => {
    const h = harness({ failRecent: true });
    await h.recent.loadInitial();
    (h.store as unknown as { _options: { failRecent: boolean } })._options.failRecent = false;
    await h.recent.retry();
    expect(h.session.recent.state).toBe('ready');
    expect(h.recent.rows.length).toBe(14);
  });
});
