import type { IRecentFilingRow, IRecentFilter } from '../models/filing';
import type { IRecentSession, ISession } from '../models/session';
import type { IDocumentStoreService } from '../services/IDocumentStoreService';
import { DocumentStoreUnavailableError } from '../services/IDocumentStoreService';

/**
 * Recent filings: load, filter, select. Read-only by design — correcting a
 * filed record happens in SharePoint (README non-goal).
 *
 * **No fake waiting (AGENTS.md R16).** Only the first load shows a skeleton.
 * A filter change re-queries the store but keeps the current rows on screen
 * until the new ones arrive, so filtering never flashes a spinner.
 */
export class RecentController {
  private readonly _session: ISession;
  private readonly _store: IDocumentStoreService;
  private readonly _now: () => Date;
  private readonly _onChange: () => void;
  /** Guards against overlapping fetches: only the newest result is applied. */
  private _generation: number = 0;

  public constructor(session: ISession, store: IDocumentStoreService, now: () => Date, onChange: () => void) {
    this._session = session;
    this._store = store;
    this._now = now;
    this._onChange = onChange;
  }

  private get _recent(): IRecentSession {
    return this._session.recent;
  }

  public get rows(): IRecentFilingRow[] {
    return this._recent.rows;
  }

  public get filter(): IRecentFilter {
    return this._recent.filter;
  }

  /** True when any chip is narrowing the list — drives the "filtered" layout. */
  public get isFiltered(): boolean {
    const f: IRecentFilter = this._recent.filter;
    return Boolean(f.documentKind || f.department || f.status);
  }

  public selectedRow(): IRecentFilingRow | undefined {
    const id: string | undefined = this._recent.selectedRowId;
    return id ? this._recent.rows.filter(r => r.id === id)[0] : undefined;
  }

  /** First load only — this is the one place a skeleton is honest. */
  public async loadInitial(): Promise<void> {
    if (this._recent.state !== 'idle') {
      return;
    }
    this._recent.state = 'loading';
    this._onChange();
    await this._fetch();
  }

  /**
   * Applies a filter change and re-queries. The previous rows stay visible
   * throughout; `state` never returns to 'loading' after the first load.
   */
  public async setFilter(patch: Partial<IRecentFilter>): Promise<void> {
    this._recent.filter = { ...this._recent.filter, ...patch };
    // A row that is no longer in view must not stay selected.
    this._recent.selectedRowId = undefined;
    this._onChange();
    await this._fetch();
  }

  public clearFilters(): Promise<void> {
    return this.setFilter({ documentKind: undefined, department: undefined, status: undefined });
  }

  /** Selecting the open row closes it again. */
  public selectRow(rowId: string): void {
    this._recent.selectedRowId = this._recent.selectedRowId === rowId ? undefined : rowId;
    this._onChange();
  }

  public retry(): Promise<void> {
    return this._fetch();
  }

  private async _fetch(): Promise<void> {
    const generation: number = ++this._generation;
    try {
      const rows: IRecentFilingRow[] = await this._store.getRecent(this._recent.filter, this._now());
      if (generation !== this._generation) {
        return; // a newer filter change is already in flight
      }
      this._recent.rows = rows;
      this._recent.state = 'ready';
      this._recent.error = undefined;
    } catch (err) {
      if (generation !== this._generation) {
        return;
      }
      this._recent.state = 'error';
      this._recent.error =
        err instanceof DocumentStoreUnavailableError ? err.message : 'Recent filings could not be loaded.';
    }
    this._onChange();
  }
}
