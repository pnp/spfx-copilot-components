import type {
  IDepartment,
  IDocumentKindDefinition,
  IFilingSeed,
  IPerson
} from './sources';

/**
 * Brightwater Community Foundation — a fictional non-profit. Every name,
 * vendor and amount here is invented (AGENTS.md §8 Security). All time is
 * relative to "now" (R9); nothing here is a calendar date.
 */

/**
 * Re-exported so the seeds' existing readers keep working. The constant itself
 * lives in `models/config.ts` now, so `logic/destination.ts` can reach it
 * without importing mock data (AGENTS.md R8) — the one place the mock boundary
 * was not clean, closed as part of the live swap.
 */
export { LIBRARY_NAME } from './config';

export const DOCUMENT_KINDS: IDocumentKindDefinition[] = [
  {
    key: 'invoice',
    label: 'Invoice',
    requiredFields: ['documentKind', 'department', 'vendor', 'documentDate', 'amount', 'status'],
    dateFieldLabel: 'Invoice date',
    folder: 'Invoices',
    defaultStatus: 'received',
    statuses: ['received', 'approved', 'paid', 'returned']
  },
  {
    key: 'expenseReport',
    label: 'Expense report',
    requiredFields: ['documentKind', 'department', 'owner', 'documentDate', 'amount', 'status'],
    dateFieldLabel: 'Period end',
    folder: 'Expense reports',
    defaultStatus: 'pendingReview',
    statuses: ['pendingReview', 'approved', 'paid', 'returned']
  }
];

export const DEPARTMENTS: IDepartment[] = [
  { key: 'programs', label: 'Programs' },
  { key: 'development', label: 'Development' },
  { key: 'finance', label: 'Finance' },
  { key: 'operations', label: 'Operations' }
];

export const PEOPLE: IPerson[] = [
  { id: 'p-dana', displayName: 'Dana Whitfield' },
  { id: 'p-kim', displayName: 'Kim Okafor' },
  { id: 'p-luis', displayName: 'Luis Marín' },
  { id: 'p-tom', displayName: 'Tom Sato' },
  { id: 'p-asha', displayName: 'Asha Bergström' },
  { id: 'p-rowan', displayName: 'Rowan Pike' }
];

/** The person acting as "you" in the mock — the records clerk filing documents. */
export const CURRENT_USER_ID: string = 'p-dana';

const MIN_PER_DAY: number = 24 * 60;

/**
 * 36 filings spanning ~88 days, all statuses represented, every department and
 * both kinds. The eight most recent match the rows drawn in
 * assets/design/recent-*.png; 14 fall inside the 30-day window and 36 inside
 * 90 days, so every period chip changes the result (AGENTS.md R23).
 */
export const FILING_SEEDS: IFilingSeed[] = [
  { id: 'f-001', fileName: 'Riverside-Print-Co_INV-20417.pdf', sizeBytes: 421_888, kind: 'invoice', department: 'programs', filedById: 'p-dana', filedOffsetMin: 12, documentDateOffsetDays: 3, amount: 1284.5, status: 'received', vendor: 'Riverside Print Co.', receiptNumber: 'F-10932' },
  { id: 'f-002', fileName: 'ER-Aug_Okafor.xlsx', sizeBytes: 188_416, kind: 'expenseReport', department: 'development', filedById: 'p-dana', filedOffsetMin: 2 * 60, documentDateOffsetDays: 9, amount: 642.1, status: 'approved', ownerId: 'p-kim', receiptNumber: 'F-10931' },
  { id: 'f-003', fileName: 'Harborview-Catering_INV-0088.pdf', sizeBytes: 302_080, kind: 'invoice', department: 'operations', filedById: 'p-dana', filedOffsetMin: 1 * MIN_PER_DAY + 3 * 60, documentDateOffsetDays: 6, amount: 3910, status: 'received', vendor: 'Harborview Catering', receiptNumber: 'F-10930' },
  { id: 'f-004', fileName: 'ER-Aug_Marin.xlsx', sizeBytes: 176_128, kind: 'expenseReport', department: 'finance', filedById: 'p-dana', filedOffsetMin: 1 * MIN_PER_DAY + 5 * 60, documentDateOffsetDays: 9, amount: 218.75, status: 'pendingReview', ownerId: 'p-luis', receiptNumber: 'F-10929' },
  { id: 'f-005', fileName: 'Northgate-Supplies_INV-5521.pdf', sizeBytes: 250_880, kind: 'invoice', department: 'finance', filedById: 'p-dana', filedOffsetMin: 2 * MIN_PER_DAY + 60, documentDateOffsetDays: 12, amount: 486.2, status: 'paid', vendor: 'Northgate Supplies', receiptNumber: 'F-10928' },
  { id: 'f-006', fileName: 'ER-Jul_Whitfield.xlsx', sizeBytes: 190_464, kind: 'expenseReport', department: 'programs', filedById: 'p-dana', filedOffsetMin: 3 * MIN_PER_DAY + 2 * 60, documentDateOffsetDays: 40, amount: 1020, status: 'approved', ownerId: 'p-dana', receiptNumber: 'F-10927' },
  { id: 'f-007', fileName: 'Lantern-Media_INV-2210.pdf', sizeBytes: 512_000, kind: 'invoice', department: 'development', filedById: 'p-dana', filedOffsetMin: 4 * MIN_PER_DAY + 4 * 60, documentDateOffsetDays: 15, amount: 2400, status: 'returned', vendor: 'Lantern Media', receiptNumber: 'F-10926' },
  { id: 'f-008', fileName: 'ER-Jul_Sato.xlsx', sizeBytes: 160_768, kind: 'expenseReport', department: 'operations', filedById: 'p-dana', filedOffsetMin: 5 * MIN_PER_DAY + 60, documentDateOffsetDays: 40, amount: 77.4, status: 'paid', ownerId: 'p-tom', receiptNumber: 'F-10925' },
  { id: 'f-031', fileName: 'Fairhaven-Cleaning_INV-4410.pdf', sizeBytes: 265_000, kind: 'invoice', department: 'operations', filedById: 'p-dana', filedOffsetMin: 9 * MIN_PER_DAY + 2 * 60, documentDateOffsetDays: 14, amount: 1150, status: 'approved', vendor: 'Fairhaven Cleaning', receiptNumber: 'F-10940' },
  { id: 'f-032', fileName: 'ER-Aug_Bergstrom.xlsx', sizeBytes: 183_000, kind: 'expenseReport', department: 'programs', filedById: 'p-dana', filedOffsetMin: 12 * MIN_PER_DAY + 60, documentDateOffsetDays: 16, amount: 288.4, status: 'pendingReview', ownerId: 'p-asha', receiptNumber: 'F-10941' },
  { id: 'f-033', fileName: 'Thornbury-Books_INV-0912.pdf', sizeBytes: 231_000, kind: 'invoice', department: 'programs', filedById: 'p-dana', filedOffsetMin: 16 * MIN_PER_DAY + 3 * 60, documentDateOffsetDays: 19, amount: 402, status: 'received', vendor: 'Thornbury Books', receiptNumber: 'F-10942' },
  { id: 'f-034', fileName: 'ER-Aug_Pike.xlsx', sizeBytes: 177_000, kind: 'expenseReport', department: 'development', filedById: 'p-dana', filedOffsetMin: 20 * MIN_PER_DAY + 60, documentDateOffsetDays: 21, amount: 512.05, status: 'approved', ownerId: 'p-rowan', receiptNumber: 'F-10943' },
  { id: 'f-035', fileName: 'Westgate-Utilities_INV-6607.pdf', sizeBytes: 199_000, kind: 'invoice', department: 'operations', filedById: 'p-dana', filedOffsetMin: 24 * MIN_PER_DAY + 4 * 60, documentDateOffsetDays: 26, amount: 874.3, status: 'returned', vendor: 'Westgate Utilities', receiptNumber: 'F-10944' },
  { id: 'f-036', fileName: 'ER-Aug_Sato.xlsx', sizeBytes: 165_000, kind: 'expenseReport', department: 'operations', filedById: 'p-dana', filedOffsetMin: 28 * MIN_PER_DAY + 2 * 60, documentDateOffsetDays: 28, amount: 96.8, status: 'paid', ownerId: 'p-tom', receiptNumber: 'F-10945' },
  { id: 'f-009', fileName: 'Copperfield-Facilities_INV-3302.pdf', sizeBytes: 388_096, kind: 'invoice', department: 'operations', filedById: 'p-dana', filedOffsetMin: 32 * MIN_PER_DAY, documentDateOffsetDays: 18, amount: 5600, status: 'approved', vendor: 'Copperfield Facilities', receiptNumber: 'F-10924' },
  { id: 'f-010', fileName: 'ER-Jul_Bergstrom.xlsx', sizeBytes: 172_032, kind: 'expenseReport', department: 'programs', filedById: 'p-dana', filedOffsetMin: 34 * MIN_PER_DAY, documentDateOffsetDays: 40, amount: 311.6, status: 'paid', ownerId: 'p-asha', receiptNumber: 'F-10923' },
  { id: 'f-011', fileName: 'Silverline-Insurance_INV-77104.pdf', sizeBytes: 640_000, kind: 'invoice', department: 'finance', filedById: 'p-dana', filedOffsetMin: 36 * MIN_PER_DAY, documentDateOffsetDays: 20, amount: 12450, status: 'paid', vendor: 'Silverline Insurance', receiptNumber: 'F-10922' },
  { id: 'f-012', fileName: 'ER-Jul_Pike.xlsx', sizeBytes: 168_960, kind: 'expenseReport', department: 'development', filedById: 'p-dana', filedOffsetMin: 38 * MIN_PER_DAY, documentDateOffsetDays: 40, amount: 890.25, status: 'returned', ownerId: 'p-rowan', receiptNumber: 'F-10921' },
  { id: 'f-013', fileName: 'Meadowbrook-Print_INV-1187.pdf', sizeBytes: 298_000, kind: 'invoice', department: 'programs', filedById: 'p-dana', filedOffsetMin: 41 * MIN_PER_DAY, documentDateOffsetDays: 22, amount: 745, status: 'paid', vendor: 'Meadowbrook Print', receiptNumber: 'F-10920' },
  { id: 'f-014', fileName: 'Brightline-Telecom_INV-90021.pdf', sizeBytes: 210_000, kind: 'invoice', department: 'operations', filedById: 'p-dana', filedOffsetMin: 43 * MIN_PER_DAY, documentDateOffsetDays: 24, amount: 389.99, status: 'paid', vendor: 'Brightline Telecom', receiptNumber: 'F-10919' },
  { id: 'f-015', fileName: 'ER-Jul_Okafor.xlsx', sizeBytes: 181_000, kind: 'expenseReport', department: 'development', filedById: 'p-dana', filedOffsetMin: 46 * MIN_PER_DAY, documentDateOffsetDays: 40, amount: 455.3, status: 'paid', ownerId: 'p-kim', receiptNumber: 'F-10918' },
  { id: 'f-016', fileName: 'Oakridge-Legal_INV-2026-118.pdf', sizeBytes: 455_000, kind: 'invoice', department: 'finance', filedById: 'p-dana', filedOffsetMin: 48 * MIN_PER_DAY, documentDateOffsetDays: 28, amount: 3200, status: 'approved', vendor: 'Oakridge Legal', receiptNumber: 'F-10917' },
  { id: 'f-017', fileName: 'ER-Jun_Marin.xlsx', sizeBytes: 174_000, kind: 'expenseReport', department: 'finance', filedById: 'p-dana', filedOffsetMin: 51 * MIN_PER_DAY, documentDateOffsetDays: 70, amount: 129.9, status: 'paid', ownerId: 'p-luis', receiptNumber: 'F-10916' },
  { id: 'f-018', fileName: 'Riverside-Print-Co_INV-20388.pdf', sizeBytes: 401_000, kind: 'invoice', department: 'programs', filedById: 'p-dana', filedOffsetMin: 53 * MIN_PER_DAY, documentDateOffsetDays: 33, amount: 980, status: 'paid', vendor: 'Riverside Print Co.', receiptNumber: 'F-10915' },
  { id: 'f-019', fileName: 'ER-Jun_Sato.xlsx', sizeBytes: 158_000, kind: 'expenseReport', department: 'operations', filedById: 'p-dana', filedOffsetMin: 56 * MIN_PER_DAY, documentDateOffsetDays: 70, amount: 64.2, status: 'paid', ownerId: 'p-tom', receiptNumber: 'F-10914' },
  { id: 'f-020', fileName: 'Harborview-Catering_INV-0071.pdf', sizeBytes: 295_000, kind: 'invoice', department: 'development', filedById: 'p-dana', filedOffsetMin: 58 * MIN_PER_DAY, documentDateOffsetDays: 36, amount: 2150, status: 'paid', vendor: 'Harborview Catering', receiptNumber: 'F-10913' },
  { id: 'f-021', fileName: 'ER-Jun_Whitfield.xlsx', sizeBytes: 187_000, kind: 'expenseReport', department: 'programs', filedById: 'p-dana', filedOffsetMin: 61 * MIN_PER_DAY, documentDateOffsetDays: 70, amount: 610, status: 'paid', ownerId: 'p-dana', receiptNumber: 'F-10912' },
  { id: 'f-022', fileName: 'Northgate-Supplies_INV-5490.pdf', sizeBytes: 244_000, kind: 'invoice', department: 'finance', filedById: 'p-dana', filedOffsetMin: 63 * MIN_PER_DAY, documentDateOffsetDays: 40, amount: 512.4, status: 'paid', vendor: 'Northgate Supplies', receiptNumber: 'F-10911' },
  { id: 'f-023', fileName: 'Copperfield-Facilities_INV-3288.pdf', sizeBytes: 377_000, kind: 'invoice', department: 'operations', filedById: 'p-dana', filedOffsetMin: 66 * MIN_PER_DAY, documentDateOffsetDays: 45, amount: 5600, status: 'paid', vendor: 'Copperfield Facilities', receiptNumber: 'F-10910' },
  { id: 'f-024', fileName: 'ER-Jun_Bergstrom.xlsx', sizeBytes: 169_000, kind: 'expenseReport', department: 'programs', filedById: 'p-dana', filedOffsetMin: 68 * MIN_PER_DAY, documentDateOffsetDays: 70, amount: 274.15, status: 'paid', ownerId: 'p-asha', receiptNumber: 'F-10909' },
  { id: 'f-025', fileName: 'Lantern-Media_INV-2188.pdf', sizeBytes: 498_000, kind: 'invoice', department: 'development', filedById: 'p-dana', filedOffsetMin: 71 * MIN_PER_DAY, documentDateOffsetDays: 50, amount: 2400, status: 'paid', vendor: 'Lantern Media', receiptNumber: 'F-10908' },
  { id: 'f-026', fileName: 'ER-May_Pike.xlsx', sizeBytes: 166_000, kind: 'expenseReport', department: 'development', filedById: 'p-dana', filedOffsetMin: 74 * MIN_PER_DAY, documentDateOffsetDays: 100, amount: 733.8, status: 'paid', ownerId: 'p-rowan', receiptNumber: 'F-10907' },
  { id: 'f-027', fileName: 'Silverline-Insurance_INV-76990.pdf', sizeBytes: 628_000, kind: 'invoice', department: 'finance', filedById: 'p-dana', filedOffsetMin: 77 * MIN_PER_DAY, documentDateOffsetDays: 65, amount: 12450, status: 'paid', vendor: 'Silverline Insurance', receiptNumber: 'F-10906' },
  { id: 'f-028', fileName: 'ER-May_Okafor.xlsx', sizeBytes: 179_000, kind: 'expenseReport', department: 'development', filedById: 'p-dana', filedOffsetMin: 80 * MIN_PER_DAY, documentDateOffsetDays: 100, amount: 402.6, status: 'paid', ownerId: 'p-kim', receiptNumber: 'F-10905' },
  { id: 'f-029', fileName: 'Meadowbrook-Print_INV-1150.pdf', sizeBytes: 290_000, kind: 'invoice', department: 'programs', filedById: 'p-dana', filedOffsetMin: 84 * MIN_PER_DAY, documentDateOffsetDays: 80, amount: 690, status: 'paid', vendor: 'Meadowbrook Print', receiptNumber: 'F-10904' },
  { id: 'f-030', fileName: 'ER-May_Marin.xlsx', sizeBytes: 171_000, kind: 'expenseReport', department: 'finance', filedById: 'p-dana', filedOffsetMin: 88 * MIN_PER_DAY, documentDateOffsetDays: 100, amount: 156.45, status: 'paid', ownerId: 'p-luis', receiptNumber: 'F-10903' }
];

/**
 * Next receipt number the mock store will issue — one past the highest seeded
 * receipt (F-10945), so a saved filing never shares a number with a seeded one
 * (audit M1).
 */
export const NEXT_RECEIPT_SEQUENCE: number = 10946;
