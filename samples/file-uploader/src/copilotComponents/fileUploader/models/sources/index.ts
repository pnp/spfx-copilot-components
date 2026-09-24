/**
 * Raw source types. These mirror the shape the live SharePoint document
 * library will expose (content types -> required fields; lookup columns for
 * departments and people). The mock seeds below and the future live service
 * both produce these; mappers project them into view models.
 */

export type DocumentKindKey = 'invoice' | 'expenseReport';
export type DepartmentKey = 'programs' | 'development' | 'finance' | 'operations';
export type FilingStatus = 'received' | 'pendingReview' | 'approved' | 'paid' | 'returned';

/** Every field a filing can carry. Which are required depends on the kind. */
export type FieldKey =
  | 'documentKind'
  | 'department'
  | 'vendor'
  | 'owner'
  | 'documentDate'
  | 'amount'
  | 'status';

export const ALL_DOCUMENT_KINDS: DocumentKindKey[] = ['invoice', 'expenseReport'];
export const ALL_DEPARTMENTS: DepartmentKey[] = ['programs', 'development', 'finance', 'operations'];
export const ALL_STATUSES: FilingStatus[] = ['received', 'pendingReview', 'approved', 'paid', 'returned'];

/** A content type in the records library. */
export interface IDocumentKindDefinition {
  key: DocumentKindKey;
  label: string;
  /** Fields that must be valid before a file of this kind may be saved. */
  requiredFields: FieldKey[];
  /** Label of the date field for this kind ("Invoice date", "Period end"). */
  dateFieldLabel: string;
  /** Folder segment under the department-owning library. */
  folder: string;
  /** Status a new filing of this kind starts in. */
  defaultStatus: FilingStatus;
  /** Statuses this kind can be in, in lifecycle order. */
  statuses: FilingStatus[];
}

export interface IDepartment {
  key: DepartmentKey;
  label: string;
}

export interface IPerson {
  id: string;
  displayName: string;
}

/**
 * A filing as seeded. Time is relative (AGENTS.md R9): `filedOffsetMin` is
 * minutes before "now" (positive = in the past); `documentDateOffsetDays` is
 * days before "now". Absolutes are resolved by the mapper at render time.
 */
export interface IFilingSeed {
  id: string;
  fileName: string;
  sizeBytes: number;
  kind: DocumentKindKey;
  department: DepartmentKey;
  filedById: string;
  filedOffsetMin: number;
  documentDateOffsetDays: number;
  amount: number;
  status: FilingStatus;
  vendor?: string;
  ownerId?: string;
  receiptNumber: string;
}
