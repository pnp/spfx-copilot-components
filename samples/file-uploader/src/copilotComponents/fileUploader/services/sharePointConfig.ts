import type {
  DepartmentKey,
  DocumentKindKey,
  FieldKey,
  FilingStatus
} from '../models/sources';
import { LIBRARY_NAME } from '../models/config';

/**
 * The config half of the live store (todo.md Decision 6, resolved 2026-09-10).
 *
 * `getKinds()` is part-read, part-config. SharePoint owns two of the six
 * properties on `IDocumentKindDefinition` — `requiredFields` (the per-content-type
 * Required flag) and `dateFieldLabel` (the per-content-type display-name override
 * on `DocumentDate`). The other four cannot be expressed by a content type and
 * live here.
 *
 * **Keyed on content type NAME, not ID.** `provision-records-library.ps1` calls
 * `Add-PnPContentType` without `-ContentTypeId`, so SharePoint mints a random ID
 * per tenant; an ID-keyed map would be correct on the dev tenant and wrong in
 * every other one, which would stop the component being deployable from the
 * `.sppkg` alone (R20). A rename breaks this map — and is caught loudly by
 * `verify-records-library.ps1`, which asserts both names on every run.
 *
 * Column internal names are load-bearing: `FilingDepartment` and `FilingStatus`
 * dodge real built-in collisions in the tenant (`Department` is the Outlook
 * contact text field, `Status` a Core Document Columns choice). See
 * `docs/TENANT-SETUP.md`.
 */

export { LIBRARY_NAME };

/** Column internal names in the records library. Changing one is a tenant migration. */
export const COLUMN: {
  department: string;
  vendor: string;
  reportOwner: string;
  documentDate: string;
  amount: string;
  status: string;
  receiptNumber: string;
} = {
  department: 'FilingDepartment',
  vendor: 'Vendor',
  reportOwner: 'ReportOwner',
  documentDate: 'DocumentDate',
  amount: 'Amount',
  status: 'FilingStatus',
  receiptNumber: 'ReceiptNumber'
};

/** What a content type cannot tell us about a document kind. */
export interface IKindConfig {
  key: DocumentKindKey;
  /** Folder segment under the department-owning library. */
  folder: string;
  defaultStatus: FilingStatus;
  /** Statuses this kind can be in, in lifecycle order. */
  statuses: FilingStatus[];
}

/**
 * Content type name -> the config half. A content type on the library that is
 * absent from this map is an error, not something to skip: `validation.ts`
 * switches on a closed `FieldKey` union, so the mapping is content type ->
 * *known* keys and never open-ended discovery.
 */
export const KIND_CONFIG_BY_CONTENT_TYPE_NAME: { [contentTypeName: string]: IKindConfig } = {
  Invoice: {
    key: 'invoice',
    folder: 'Invoices',
    defaultStatus: 'received',
    statuses: ['received', 'approved', 'paid', 'returned']
  },
  'Expense report': {
    key: 'expenseReport',
    folder: 'Expense reports',
    defaultStatus: 'pendingReview',
    statuses: ['pendingReview', 'approved', 'paid', 'returned']
  }
};

/**
 * Column internal name -> the `FieldKey` the component knows it by. Only the
 * columns that can be Required on a content type appear here; a Required field
 * link whose name is not in this map is an error (the library has grown a column
 * the component has never heard of).
 */
export const FIELD_BY_COLUMN: { [internalName: string]: FieldKey } = {
  FilingDepartment: 'department',
  Vendor: 'vendor',
  ReportOwner: 'owner',
  DocumentDate: 'documentDate',
  Amount: 'amount',
  FilingStatus: 'status'
};

/**
 * Required columns the form does not collect, and must not be asked to.
 *
 * `FIELD_BY_COLUMN` above is the closed set of columns a *person* fills in, and
 * `requiredFieldsFrom()` throws on anything Required it does not recognise —
 * deliberately, because `validation.ts` switches on a closed `FieldKey` union
 * and a new required column needs a code change rather than a silent skip.
 *
 * But a document library's content type also carries required columns that are
 * part of being a file at all. **Every** document library marks `FileLeafRef` —
 * the file **Name** — required, and the component supplies that through the
 * upload path (`addUsingPath`), never as a form field. It is not a form
 * requirement, so throwing on it was wrong: on 2026-09-22 the first live start
 * against the records site showed the H1 error screen and nothing else
 * (todo.md 8.8 L1).
 *
 * These are skipped *before* the unknown-column check. The guard itself stays
 * exactly as it was for every other column.
 *
 * **Only add a name here once a real library has been seen marking it
 * required.** The list is short on purpose — a speculative entry (`Title`,
 * `_dlc_*`) would silently swallow the next genuine mismatch, which is the one
 * failure this guard exists to make loud.
 */
export const IGNORED_REQUIRED_COLUMNS: string[] = ['FileLeafRef'];

/**
 * Choice label <-> key, both directions. SharePoint stores the label; the code's
 * unions are camelCase keys (`docs/TENANT-SETUP.md` §1). Kept here rather than in
 * `mappers.ts` so the mock never has to know about choice labels at all.
 */
export const DEPARTMENT_BY_CHOICE: { [choice: string]: DepartmentKey } = {
  Programs: 'programs',
  Development: 'development',
  Finance: 'finance',
  Operations: 'operations'
};

export const CHOICE_BY_DEPARTMENT: { [key: string]: string } = {
  programs: 'Programs',
  development: 'Development',
  finance: 'Finance',
  operations: 'Operations'
};

export const STATUS_BY_CHOICE: { [choice: string]: FilingStatus } = {
  Received: 'received',
  'Pending review': 'pendingReview',
  Approved: 'approved',
  Paid: 'paid',
  Returned: 'returned'
};

export const CHOICE_BY_STATUS: { [key: string]: string } = {
  received: 'Received',
  pendingReview: 'Pending review',
  approved: 'Approved',
  paid: 'Paid',
  returned: 'Returned'
};
