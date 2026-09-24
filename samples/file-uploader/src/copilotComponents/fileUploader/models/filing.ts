import type {
  DepartmentKey,
  DocumentKindKey,
  FieldKey,
  FilingStatus
} from './sources';

/**
 * Canonical view models. Views render these and nothing else; a live data
 * service must return exactly these shapes (AGENTS.md R8).
 */

/**
 * What the component knows about a chosen file.
 *
 * `blob` is the browser's own `File`, kept only so the live store has something
 * to upload (todo.md, resolved 2026-09-10). It is **optional and additive**:
 * the mock ignores it entirely, so the sample is still offline by default (R10)
 * and still runs with no tenant. Nothing renders from it, no view reads it, and
 * it is never serialised into session state. The live `save()` throws a named
 * error when it is absent rather than filing metadata for a document that is
 * not there — which is also how we will find out whether the Copilot canvas
 * iframe hands over real `File` objects at all (External gate).
 */
export interface IDroppedFile {
  name: string;
  sizeBytes: number;
  /** MIME type as reported by the browser; may be empty. */
  contentType: string;
  /** The bytes, when the host gave us any. Mock-only sessions leave this undefined. */
  blob?: Blob;
}

/**
 * A filing in progress. `documentDate` is an ISO calendar date (YYYY-MM-DD)
 * once resolved; the loose text Copilot supplied is kept in `documentDateText`
 * until the user or the parser settles it.
 */
export interface IFilingDraft {
  id: string;
  file: IDroppedFile;
  documentKind?: DocumentKindKey;
  department?: DepartmentKey;
  vendor?: string;
  owner?: string;
  documentDate?: string;
  documentDateText?: string;
  amount?: number;
  /**
   * The amount exactly as typed, so a half-typed value ("12.") survives the
   * re-render its own keystroke causes. `amount` is the parsed number; the
   * inputs bind to this.
   */
  amountText?: string;
  status?: FilingStatus;
  /** Fields whose value came from the prompt rather than the user. */
  prefilled: FieldKey[];
}

export interface IValidationResult {
  ok: boolean;
  /** Human-readable message per invalid field. Empty when ok. */
  errors: Partial<Record<FieldKey, string>>;
  /** Required fields still missing, in display order. */
  missing: FieldKey[];
}

export interface IFilingReceipt {
  receiptNumber: string;
  fileName: string;
  documentKind: DocumentKindKey;
  documentKindLabel: string;
  department: DepartmentKey;
  departmentLabel: string;
  vendor?: string;
  owner?: string;
  documentDate: string;
  amount: number;
  status: FilingStatus;
  savedPath: string;
  /** Absolute URL of the stored file, when the store has a real one. The mock has none, so views show no link (H5). */
  webUrl?: string;
  /** Absolute URL of the folder it was saved into, when the store knows it. */
  folderUrl?: string;
  savedAt: Date;
  savedByName: string;
}

export interface IRecentFilingRow {
  id: string;
  fileName: string;
  sizeBytes: number;
  documentKind: DocumentKindKey;
  documentKindLabel: string;
  department: DepartmentKey;
  departmentLabel: string;
  vendor?: string;
  ownerName?: string;
  documentDate: string;
  amount: number;
  status: FilingStatus;
  filedAt: Date;
  filedByName: string;
  receiptNumber: string;
  savedPath: string;
  /** Absolute URL of the file, when the store has a real one (H5). */
  webUrl?: string;
}

export type RecentPeriod = '7d' | '30d' | '90d';

export interface IRecentFilter {
  documentKind?: DocumentKindKey;
  department?: DepartmentKey;
  status?: FilingStatus;
  period: RecentPeriod;
}

export const PERIOD_DAYS: Record<RecentPeriod, number> = { '7d': 7, '30d': 30, '90d': 90 };
