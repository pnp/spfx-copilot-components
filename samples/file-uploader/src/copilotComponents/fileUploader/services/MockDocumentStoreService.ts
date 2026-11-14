import type {
  IFilingDraft,
  IFilingReceipt,
  IRecentFilingRow,
  IRecentFilter
} from '../models/filing';
import { PERIOD_DAYS } from '../models/filing';
import type { IDepartment, IDocumentKindDefinition, IFilingSeed, IPerson } from '../models/sources';
import {
  CURRENT_USER_ID,
  DEPARTMENTS,
  DOCUMENT_KINDS,
  FILING_SEEDS,
  NEXT_RECEIPT_SEQUENCE,
  PEOPLE
} from '../models/seeds';
import { validateDraft } from '../logic/validation';
import { resolveDestination, IDestination } from '../logic/destination';
import { DocumentStoreUnavailableError, IDocumentStoreService } from './IDocumentStoreService';
import { draftToReceipt, ILookups, receiptToRow, seedToRow } from './mappers';

export interface IMockDocumentStoreOptions {
  /** When true, `save` rejects with DocumentStoreUnavailableError (drives the error fallback). */
  failSave?: boolean;
  /** When true, `getRecent` rejects with DocumentStoreUnavailableError. */
  failRecent?: boolean;
  /** Simulated latency in ms; 0 in tests. */
  latencyMs?: number;
  /** Override seeds (tests). */
  seeds?: IFilingSeed[];
  kinds?: IDocumentKindDefinition[];
  departments?: IDepartment[];
  people?: IPerson[];
}

/**
 * Offline store (AGENTS.md R10). Seeds are resolved against `now` on every
 * call so the demo never goes stale; saves are kept in memory for the session
 * so a receipt shows up in Recent immediately. The baseline seeds are never
 * mutated — `save` appends to a separate list.
 */
export class MockDocumentStoreService implements IDocumentStoreService {
  /** Seeds and an in-memory session list — nothing reaches a library. */
  public readonly isSampleData: boolean = true;
  private readonly _options: IMockDocumentStoreOptions;
  private readonly _lookups: ILookups;
  private readonly _seeds: IFilingSeed[];
  private readonly _saved: { row: IRecentFilingRow }[] = [];
  private _nextReceipt: number = NEXT_RECEIPT_SEQUENCE;
  private _nextId: number = 1;

  public constructor(options: IMockDocumentStoreOptions = {}) {
    this._options = options;
    this._lookups = {
      kinds: options.kinds || DOCUMENT_KINDS,
      departments: options.departments || DEPARTMENTS,
      people: options.people || PEOPLE
    };
    this._seeds = options.seeds || FILING_SEEDS;
  }

  /** Nothing to warm up — the seeds are already in memory. */
  public initializeAsync(): Promise<void> {
    return Promise.resolve();
  }

  public getKinds(): IDocumentKindDefinition[] {
    return this._lookups.kinds;
  }

  public getDepartments(): IDepartment[] {
    return this._lookups.departments;
  }

  public validate(draft: IFilingDraft): ReturnType<IDocumentStoreService['validate']> {
    return validateDraft(draft, this._lookups.kinds);
  }

  public resolveDestination(draft: IFilingDraft, now: Date): IDestination | undefined {
    return resolveDestination(draft, this._lookups.kinds, this._lookups.departments, now);
  }

  public async save(drafts: IFilingDraft[], now: Date): Promise<IFilingReceipt[]> {
    await this._delay();
    if (this._options.failSave) {
      throw new DocumentStoreUnavailableError();
    }
    // All-or-nothing: validate everything before issuing any receipt.
    for (const d of drafts) {
      const v = this.validate(d);
      if (!v.ok) {
        throw new Error('Draft ' + d.id + ' is not valid: ' + v.missing.join(', '));
      }
    }
    const me: IPerson = this._lookups.people.filter(p => p.id === CURRENT_USER_ID)[0];
    const receipts: IFilingReceipt[] = [];
    for (const d of drafts) {
      const number: string = 'F-' + this._nextReceipt++;
      const receipt: IFilingReceipt = draftToReceipt(d, this._lookups, number, now, me.displayName);
      receipts.push(receipt);
      this._saved.push({ row: receiptToRow(receipt, 's-' + this._nextId++, d.file.sizeBytes) });
    }
    return receipts;
  }

  public async getRecent(filter: IRecentFilter, now: Date): Promise<IRecentFilingRow[]> {
    await this._delay();
    if (this._options.failRecent) {
      throw new DocumentStoreUnavailableError();
    }
    const cutoff: number = now.getTime() - PERIOD_DAYS[filter.period] * 24 * 60 * 60 * 1000;
    const seeded: IRecentFilingRow[] = this._seeds
      .filter(s => s.filedById === CURRENT_USER_ID)
      .map(s => seedToRow(s, this._lookups, now));
    const all: IRecentFilingRow[] = this._saved.map(s => s.row).concat(seeded);
    return all
      .filter(r => r.filedAt.getTime() >= cutoff)
      .filter(r => !filter.documentKind || r.documentKind === filter.documentKind)
      .filter(r => !filter.department || r.department === filter.department)
      .filter(r => !filter.status || r.status === filter.status)
      .sort((a, b) => b.filedAt.getTime() - a.filedAt.getTime());
  }

  private _delay(): Promise<void> {
    const ms: number = this._options.latencyMs || 0;
    return ms > 0 ? new Promise<void>(resolve => setTimeout(resolve, ms)) : Promise.resolve();
  }
}
