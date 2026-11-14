import type {
  IFilingDraft,
  IFilingReceipt,
  IRecentFilingRow,
  IRecentFilter,
  IValidationResult
} from '../models/filing';
import type { IDepartment, IDocumentKindDefinition } from '../models/sources';
import type { IDestination } from '../logic/destination';

/**
 * The boundary between the component and wherever documents actually live.
 * The mock implements it against seeds; the live implementation implements it
 * against the SharePoint document library whose content types supply the kinds
 * and required fields. Views and mappers never change across that swap
 * (AGENTS.md R8). Every method takes `now` so nothing reads the clock (R35).
 */
export interface IDocumentStoreService {
  /**
   * True when nothing is really stored — the mock. Views show "Sample data —
   * nothing is stored" while it is true, because mock receipts look real and a
   * demo in a real tenant must never be mistaken for real filing (R25, R26).
   */
  readonly isSampleData: boolean;
  /**
   * Warm-up, awaited once from `onInit()` before the first render.
   *
   * `getKinds()` and `getDepartments()` are synchronous because every view
   * calls them during render, but the live store has to read the content types
   * and choice columns over the network first. This is where that happens; the
   * mock resolves immediately. Calling the synchronous methods before this
   * settles is a programming error, not a runtime state to render around.
   */
  initializeAsync(): Promise<void>;
  getKinds(): IDocumentKindDefinition[];
  getDepartments(): IDepartment[];
  /** Pure check of a draft against its kind's rules. Never persists. */
  validate(draft: IFilingDraft): IValidationResult;
  /** Where a draft would be saved, if kind and department are known. */
  resolveDestination(draft: IFilingDraft, now: Date): IDestination | undefined;
  /**
   * Persists validated drafts and returns one receipt per draft, in order.
   * Rejects (throws) when the store is unavailable; nothing is partially saved.
   *
   * SharePoint has no atomic "upload with metadata" call for a document
   * library, so the live implementation honours that second promise by rolling
   * back — recycling every file the call uploaded — before it throws
   * (todo.md Decision 7). A rollback that cannot complete throws an error
   * naming the files it left behind rather than implying a clean failure.
   */
  save(drafts: IFilingDraft[], now: Date): Promise<IFilingReceipt[]>;
  /** The current user's filings matching the filter, newest first. */
  getRecent(filter: IRecentFilter, now: Date): Promise<IRecentFilingRow[]>;
}

/** Thrown by `save`/`getRecent` when the store cannot be reached. Views render the error fallback. */
export class DocumentStoreUnavailableError extends Error {
  public readonly name: string = 'DocumentStoreUnavailableError';
  public constructor(message: string = 'The records library did not respond.') {
    super(message);
    Object.setPrototypeOf(this, DocumentStoreUnavailableError.prototype);
  }
}
