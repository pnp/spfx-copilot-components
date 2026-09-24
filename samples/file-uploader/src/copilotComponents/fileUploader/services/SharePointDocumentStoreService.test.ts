import type { IDepartment, IDocumentKindDefinition } from '../models/sources';
import type { IRecentFilingRow } from '../models/filing';
import type { IFieldLink, ILiveKind, IRecordListItem, IRowLocation } from './SharePointDocumentStoreService';
import {
  absoluteUrlOf,
  dateFieldLabelFrom,
  displayPathOf,
  fileNameProblem,
  formatReceiptNumber,
  isoDateFromSharePoint,
  itemToRow,
  kindConfigFor,
  requiredFieldsFrom,
  serverRelativeUrlOf
} from './SharePointDocumentStoreService';
import { DEPARTMENT_BY_CHOICE, STATUS_BY_CHOICE } from './sharePointConfig';
import { contentTypeIdOf, SHAREPOINT_TENANT } from './__fixtures__/sharepointTenant';

/**
 * The live store's pure projections. Everything here runs with no tenant and no
 * network — the network paths around them are proven by the first real run
 * against the dev site (AGENTS.md R22).
 *
 * Fixed clock, always (R35). Nothing in this file constructs `new Date()`
 * without an argument.
 */

const INVOICE_CT_ID: string = '0x0101008A1B2C3D4E5F60718293A4B5C6D7E8';
const EXPENSE_CT_ID: string = '0x0101009F8E7D6C5B4A39281706F5E4D3C2B1';

const INVOICE_DEF: IDocumentKindDefinition = {
  key: 'invoice',
  label: 'Invoice',
  requiredFields: ['documentKind', 'department', 'vendor', 'documentDate', 'amount', 'status'],
  dateFieldLabel: 'Invoice date',
  folder: 'Invoices',
  defaultStatus: 'received',
  statuses: ['received', 'approved', 'paid', 'returned']
};

const EXPENSE_DEF: IDocumentKindDefinition = {
  key: 'expenseReport',
  label: 'Expense report',
  requiredFields: ['documentKind', 'department', 'owner', 'documentDate', 'amount', 'status'],
  dateFieldLabel: 'Period end',
  folder: 'Expense reports',
  defaultStatus: 'pendingReview',
  statuses: ['pendingReview', 'approved', 'paid', 'returned']
};

const KINDS: ILiveKind[] = [
  { definition: INVOICE_DEF, contentTypeId: INVOICE_CT_ID, contentTypeName: 'Invoice' },
  { definition: EXPENSE_DEF, contentTypeId: EXPENSE_CT_ID, contentTypeName: 'Expense report' }
];

const DEPARTMENTS: IDepartment[] = [
  { key: 'programs', label: 'Programs' },
  { key: 'development', label: 'Development' },
  { key: 'finance', label: 'Finance' },
  { key: 'operations', label: 'Operations' }
];

const LOCATION: IRowLocation = {
  libraryName: 'Records',
  libraryRootPath: '/sites/CopilotComponents/Records',
  origin: 'https://tenant.example.org'
};

function invoiceItem(overrides: Partial<IRecordListItem> = {}): IRecordListItem {
  return {
    Id: 42,
    // SharePoint appends a per-item suffix to the content type id; the match is
    // by prefix, which is what the real list returns.
    ContentTypeId: INVOICE_CT_ID + '0062A1B2C3',
    FileLeafRef: 'Riverside-Print-Co_INV-20417.pdf',
    FileRef: '/sites/CopilotComponents/Records/Finance/Invoices/Programs/2026/Riverside-Print-Co_INV-20417.pdf',
    File: { Length: '421888' },
    FilingDepartment: 'Programs',
    Vendor: 'Riverside Print Co.',
    DocumentDate: '2026-08-15T00:00:00Z',
    Amount: 1284.5,
    FilingStatus: 'Received',
    ReceiptNumber: 'F-00042',
    Created: '2026-08-18T09:00:00Z',
    Author: { Title: 'Dana Whitfield' },
    ...overrides
  };
}

describe('formatReceiptNumber', () => {
  it('pads to five digits so receipts sort as strings', () => {
    expect(formatReceiptNumber(1)).toBe('F-00001');
    expect(formatReceiptNumber(42)).toBe('F-00042');
    expect(formatReceiptNumber(10932)).toBe('F-10932');
  });

  it('does not truncate an id longer than the padding', () => {
    expect(formatReceiptNumber(1234567)).toBe('F-1234567');
  });
});

describe('requiredFieldsFrom', () => {
  it('maps required field links to field keys in display order', () => {
    const keys = requiredFieldsFrom(
      [
        { Name: 'FilingStatus', DisplayName: 'Status', Required: true, Hidden: false },
        { Name: 'Amount', DisplayName: 'Amount', Required: true, Hidden: false },
        { Name: 'DocumentDate', DisplayName: 'Invoice date', Required: true, Hidden: false },
        { Name: 'Vendor', DisplayName: 'Vendor', Required: true, Hidden: false },
        { Name: 'FilingDepartment', DisplayName: 'Department', Required: true, Hidden: false },
        { Name: 'ReceiptNumber', DisplayName: 'Receipt number', Required: false, Hidden: false }
      ],
      'Invoice'
    );
    // Same set and same order the mock's Invoice kind declares.
    expect(keys).toEqual(INVOICE_DEF.requiredFields);
  });

  it('produces the expense-report shape from the mirrored content type', () => {
    const keys = requiredFieldsFrom(
      [
        { Name: 'FilingDepartment', DisplayName: 'Department', Required: true, Hidden: false },
        { Name: 'ReportOwner', DisplayName: 'Report owner', Required: true, Hidden: false },
        { Name: 'DocumentDate', DisplayName: 'Period end', Required: true, Hidden: false },
        { Name: 'Amount', DisplayName: 'Amount', Required: true, Hidden: false },
        { Name: 'FilingStatus', DisplayName: 'Status', Required: true, Hidden: false }
      ],
      'Expense report'
    );
    expect(keys).toEqual(EXPENSE_DEF.requiredFields);
  });

  it('always includes documentKind, which is the content type and never a column', () => {
    const keys = requiredFieldsFrom([], 'Invoice');
    expect(keys).toEqual(['documentKind']);
  });

  it('ignores links that are not required, and hidden ones', () => {
    const keys = requiredFieldsFrom(
      [
        { Name: 'Vendor', DisplayName: 'Vendor', Required: false, Hidden: false },
        { Name: 'Amount', DisplayName: 'Amount', Required: true, Hidden: true }
      ],
      'Invoice'
    );
    expect(keys).toEqual(['documentKind']);
  });

  it('throws on a required column the component has never heard of', () => {
    expect(() =>
      requiredFieldsFrom(
        [{ Name: 'GrantCode', DisplayName: 'Grant code', Required: true, Hidden: false }],
        'Invoice'
      )
    ).toThrow(/GrantCode/);
  });

  it('ignores FileLeafRef, which every document library requires (8.8 L1)', () => {
    // The file Name arrives with the upload, never as a form field. Throwing on
    // it is what produced the H1 screen on the first live start.
    const withBuiltIn = requiredFieldsFrom(
      [
        { Name: 'FileLeafRef', DisplayName: 'Name', Required: true, Hidden: false },
        { Name: 'FilingStatus', DisplayName: 'Status', Required: true, Hidden: false },
        { Name: 'Amount', DisplayName: 'Amount', Required: true, Hidden: false },
        { Name: 'DocumentDate', DisplayName: 'Invoice date', Required: true, Hidden: false },
        { Name: 'Vendor', DisplayName: 'Vendor', Required: true, Hidden: false },
        { Name: 'FilingDepartment', DisplayName: 'Department', Required: true, Hidden: false }
      ],
      'Invoice'
    );
    expect(withBuiltIn).toEqual(INVOICE_DEF.requiredFields);
    expect(withBuiltIn.indexOf('documentKind')).toBe(0);
  });

  it('still throws on an unknown required column when a built-in is present too', () => {
    // Skipping the built-ins must not weaken the guard: the closed FieldKey
    // union is what stops a library growing a column the form cannot collect.
    expect(() =>
      requiredFieldsFrom(
        [
          { Name: 'FileLeafRef', DisplayName: 'Name', Required: true, Hidden: false },
          { Name: 'ProjectCode', DisplayName: 'Project code', Required: true, Hidden: false }
        ],
        'Invoice'
      )
    ).toThrow(/ProjectCode/);
  });
});

describe('dateFieldLabelFrom', () => {
  it('reads the per-content-type display-name override', () => {
    expect(
      dateFieldLabelFrom(
        [{ Name: 'DocumentDate', DisplayName: 'Invoice date', Required: true, Hidden: false }],
        'Invoice'
      )
    ).toBe('Invoice date');
    expect(
      dateFieldLabelFrom(
        [{ Name: 'DocumentDate', DisplayName: 'Period end', Required: true, Hidden: false }],
        'Expense report'
      )
    ).toBe('Period end');
  });

  it('throws rather than returning an empty label', () => {
    // CSOM returns DisplayName empty unless explicitly requested; a silent ''
    // here is exactly the failure that produced a verifier which passed for the
    // wrong reason (docs/GOTCHAS.md).
    expect(() =>
      dateFieldLabelFrom(
        [{ Name: 'DocumentDate', DisplayName: '', Required: true, Hidden: false }],
        'Invoice'
      )
    ).toThrow(/display name/i);
    expect(() => dateFieldLabelFrom([], 'Invoice')).toThrow(/display name/i);
  });
});

describe('isoDateFromSharePoint', () => {
  it('keeps the calendar date SharePoint stored, whatever the runner timezone', () => {
    // The regression this function exists for: toIsoDate() reads LOCAL parts, so
    // UTC midnight becomes the previous day anywhere west of Greenwich.
    expect(isoDateFromSharePoint('2026-08-15T00:00:00Z')).toBe('2026-08-15');
    expect(isoDateFromSharePoint('2026-01-01T00:00:00Z')).toBe('2026-01-01');
    expect(isoDateFromSharePoint('2026-12-31T00:00:00Z')).toBe('2026-12-31');
  });

  it('accepts a bare date', () => {
    expect(isoDateFromSharePoint('2026-08-15')).toBe('2026-08-15');
  });

  it('falls back to UTC parts, never local ones, for a non-ISO value', () => {
    expect(isoDateFromSharePoint('Sat, 15 Aug 2026 00:00:00 GMT')).toBe('2026-08-15');
  });

  it('returns empty for missing or unparseable input', () => {
    expect(isoDateFromSharePoint(undefined)).toBe('');
    expect(isoDateFromSharePoint('')).toBe('');
    expect(isoDateFromSharePoint('not a date')).toBe('');
  });
});

describe('serverRelativeUrlOf', () => {
  it('accepts the v4 shape', () => {
    expect(serverRelativeUrlOf({ ServerRelativeUrl: '/sites/x/Records/a.pdf' })).toBe(
      '/sites/x/Records/a.pdf'
    );
  });

  it('accepts the v3 wrapped shape', () => {
    expect(serverRelativeUrlOf({ data: { ServerRelativeUrl: '/sites/x/Records/a.pdf' } })).toBe(
      '/sites/x/Records/a.pdf'
    );
  });

  it('returns undefined for anything else, so the caller can fail loudly', () => {
    expect(serverRelativeUrlOf(undefined)).toBeUndefined();
    expect(serverRelativeUrlOf({})).toBeUndefined();
    expect(serverRelativeUrlOf({ data: {} })).toBeUndefined();
  });
});

describe('itemToRow', () => {
  it('projects an invoice item into the same shape the mock returns', () => {
    const row = itemToRow(invoiceItem(), KINDS, DEPARTMENTS, LOCATION) as IRecentFilingRow;
    expect(row).toBeDefined();
    expect(row.id).toBe('42');
    expect(row.fileName).toBe('Riverside-Print-Co_INV-20417.pdf');
    expect(row.sizeBytes).toBe(421888);
    expect(row.documentKind).toBe('invoice');
    expect(row.documentKindLabel).toBe('Invoice');
    expect(row.department).toBe('programs');
    expect(row.departmentLabel).toBe('Programs');
    expect(row.vendor).toBe('Riverside Print Co.');
    expect(row.ownerName).toBeUndefined();
    expect(row.documentDate).toBe('2026-08-15');
    expect(row.amount).toBe(1284.5);
    expect(row.status).toBe('received');
    expect(row.filedAt.getTime()).toBe(new Date('2026-08-18T09:00:00Z').getTime());
    expect(row.filedByName).toBe('Dana Whitfield');
    expect(row.receiptNumber).toBe('F-00042');
    // Displayed exactly like a mock row (R8), linked by absolute URL (H5).
    expect(row.savedPath).toBe('Records / Finance / Invoices / Programs / 2026 / Riverside-Print-Co_INV-20417.pdf');
    expect(row.webUrl).toBe(
      'https://tenant.example.org/sites/CopilotComponents/Records/Finance/Invoices/Programs/2026/Riverside-Print-Co_INV-20417.pdf'
    );
  });

  it('matches the content type by prefix, not by equality', () => {
    const row = itemToRow(
      invoiceItem({ ContentTypeId: INVOICE_CT_ID + '00FFFFFFFF' }),
      KINDS,
      DEPARTMENTS,
      LOCATION
    );
    expect(row && row.documentKind).toBe('invoice');
  });

  it('reads the report owner for an expense report', () => {
    const row = itemToRow(
      invoiceItem({
        ContentTypeId: EXPENSE_CT_ID + '0062A1B2C3',
        FileLeafRef: 'ER-Aug_Okafor.xlsx',
        Vendor: undefined,
        ReportOwner: { Title: 'Kim Okafor' },
        FilingStatus: 'Pending review'
      }),
      KINDS,
      DEPARTMENTS,
      LOCATION
    ) as IRecentFilingRow;
    expect(row.documentKind).toBe('expenseReport');
    expect(row.documentKindLabel).toBe('Expense report');
    expect(row.ownerName).toBe('Kim Okafor');
    expect(row.vendor).toBeUndefined();
    expect(row.status).toBe('pendingReview');
  });

  it('maps every provisioned status choice to its key', () => {
    const pairs: [string, string][] = [
      ['Received', 'received'],
      ['Pending review', 'pendingReview'],
      ['Approved', 'approved'],
      ['Paid', 'paid'],
      ['Returned', 'returned']
    ];
    for (const pair of pairs) {
      const row = itemToRow(invoiceItem({ FilingStatus: pair[0] }), KINDS, DEPARTMENTS, LOCATION);
      expect(row && row.status).toBe(pair[1]);
    }
  });

  it('maps every provisioned department choice to its key', () => {
    const pairs: [string, string][] = [
      ['Programs', 'programs'],
      ['Development', 'development'],
      ['Finance', 'finance'],
      ['Operations', 'operations']
    ];
    for (const pair of pairs) {
      const row = itemToRow(invoiceItem({ FilingDepartment: pair[0] }), KINDS, DEPARTMENTS, LOCATION);
      expect(row && row.department).toBe(pair[1]);
    }
  });

  it('skips a row of an unknown content type rather than blanking the view', () => {
    expect(itemToRow(invoiceItem({ ContentTypeId: '0x0101DEADBEEF' }), KINDS, DEPARTMENTS, LOCATION)).toBeUndefined();
  });

  it('skips a row whose choice values are not in the config', () => {
    expect(itemToRow(invoiceItem({ FilingDepartment: 'Legacy' }), KINDS, DEPARTMENTS, LOCATION)).toBeUndefined();
    expect(itemToRow(invoiceItem({ FilingStatus: 'Archived' }), KINDS, DEPARTMENTS, LOCATION)).toBeUndefined();
  });

  it('falls back to an id-derived receipt when the column is empty', () => {
    const row = itemToRow(invoiceItem({ ReceiptNumber: undefined }), KINDS, DEPARTMENTS, LOCATION);
    expect(row && row.receiptNumber).toBe('F-00042');
  });

  it('survives an item with no size, amount or author', () => {
    const row = itemToRow(
      invoiceItem({ File: undefined, Amount: undefined, Author: undefined }),
      KINDS,
      DEPARTMENTS,
      LOCATION
    ) as IRecentFilingRow;
    expect(row.sizeBytes).toBe(0);
    expect(row.amount).toBe(0);
    expect(row.filedByName).toBe('');
  });

  it('produces no link when the origin is unknown', () => {
    const row = itemToRow(invoiceItem(), KINDS, DEPARTMENTS, { ...LOCATION, origin: '' }) as IRecentFilingRow;
    expect(row.webUrl).toBeUndefined();
  });
});

describe('displayPathOf', () => {
  it('keeps the raw path for a file outside the library root', () => {
    expect(displayPathOf('/sites/other/Shared Documents/a.pdf', '/sites/CopilotComponents/Records', 'Records')).toBe(
      '/sites/other/Shared Documents/a.pdf'
    );
  });

  it('does not mistake a sibling library with the same prefix for the root', () => {
    expect(displayPathOf('/sites/x/RecordsArchive/a.pdf', '/sites/x/Records', 'Records')).toBe(
      '/sites/x/RecordsArchive/a.pdf'
    );
  });
});

describe('absoluteUrlOf', () => {
  it('encodes each path segment and keeps the slashes', () => {
    expect(absoluteUrlOf('https://tenant.example.org/', '/sites/x/Records/Expense reports/Q3 #1 100%.xlsx')).toBe(
      'https://tenant.example.org/sites/x/Records/Expense%20reports/Q3%20%231%20100%25.xlsx'
    );
  });
});

describe('kindConfigFor (Decision 6, amended)', () => {
  it('maps the two provisioned content types', () => {
    expect(kindConfigFor(INVOICE_CT_ID, 'Invoice', 'Records')!.key).toBe('invoice');
    expect(kindConfigFor(EXPENSE_CT_ID, 'Expense report', 'Records')!.key).toBe('expenseReport');
  });

  it('skips SharePoint\'s Folder type', () => {
    expect(kindConfigFor('0x012000A1B2C3D4', 'Folder', 'Records')).toBeUndefined();
  });

  it('throws on any other type the config does not know, naming it', () => {
    expect(() => kindConfigFor('0x0101', 'Document', 'Records')).toThrow(/"Document"/);
    // Not fooled by names that exist on every object's prototype.
    expect(() => kindConfigFor('0x0101009999', 'constructor', 'Records')).toThrow(/"constructor"/);
  });
});

describe('fileNameProblem (audit M10)', () => {
  it('accepts ordinary names, including # and %', () => {
    expect(fileNameProblem('Riverside-Print-Co_INV-20417.pdf')).toBeUndefined();
    expect(fileNameProblem('Q3 #1 100%.xlsx')).toBeUndefined();
  });

  it('names what SharePoint would refuse', () => {
    expect(fileNameProblem('Invoice: March.pdf')).toMatch(/character :/);
    expect(fileNameProblem('report.pdf.')).toMatch(/period/);
    expect(fileNameProblem(' report.pdf')).toMatch(/space/);
    expect(fileNameProblem('~$budget.xlsx')).toMatch(/~\$/);
    expect(fileNameProblem('a_vti_b.pdf')).toMatch(/_vti_/);
    expect(fileNameProblem('con')).toMatch(/reserves/);
    expect(fileNameProblem('   ')).toMatch(/empty/);
  });
});

/**
 * The pure projections against what the tenant actually returned (todo.md 8.9
 * N4) rather than values typed to match them. Each of these is a class of miss
 * that has already cost a deploy cycle: a built-in required column (8.8 L1), a
 * choice renamed in the tenant, a date that comes back a day early (L4).
 */
describe('against the captured tenant fixture (8.9 N4)', () => {
  const linksOf = (name: string): IFieldLink[] => SHAREPOINT_TENANT.library.fieldLinks[contentTypeIdOf(name)];
  const capturedKinds: ILiveKind[] = [
    { definition: INVOICE_DEF, contentTypeId: contentTypeIdOf('Invoice'), contentTypeName: 'Invoice' },
    { definition: EXPENSE_DEF, contentTypeId: contentTypeIdOf('Expense report'), contentTypeName: 'Expense report' }
  ];
  const location: IRowLocation = { libraryName: 'Records', libraryRootPath: '/sites/records/Records', origin: '' };

  it('reads each kind\'s required fields and date label from the captured field links', () => {
    expect(requiredFieldsFrom(linksOf('Invoice'), 'Invoice')).toEqual(INVOICE_DEF.requiredFields);
    expect(requiredFieldsFrom(linksOf('Expense report'), 'Expense report')).toEqual(EXPENSE_DEF.requiredFields);
    expect(dateFieldLabelFrom(linksOf('Invoice'), 'Invoice')).toBe('Invoice date');
    expect(dateFieldLabelFrom(linksOf('Expense report'), 'Expense report')).toBe('Period end');
  });

  it('knows every department and status choice the tenant offers', () => {
    expect(SHAREPOINT_TENANT.choices.FilingDepartment.filter(c => !DEPARTMENT_BY_CHOICE[c])).toEqual([]);
    expect(SHAREPOINT_TENANT.choices.FilingStatus.filter(c => !STATUS_BY_CHOICE[c])).toEqual([]);
  });

  it('projects each captured item, with the date it was written (L4)', () => {
    const rows = SHAREPOINT_TENANT.recent.items.map(item => itemToRow(item, capturedKinds, DEPARTMENTS, location));
    expect(rows.map(r => r && r.documentKind)).toEqual(['invoice', 'expenseReport']);
    for (const row of rows as IRecentFilingRow[]) {
      expect(row.documentDate).toBe(SHAREPOINT_TENANT.recent.documentDateWritten);
      expect(row.department).toBe('programs');
      expect(row.sizeBytes).toBeGreaterThan(0);
      expect(row.receiptNumber).toMatch(/^F-\d{5}$/);
    }
    expect((rows[1] as IRecentFilingRow).ownerName).toBe('Report Owner');
    expect((rows[0] as IRecentFilingRow).vendor).toBe('Capture Vendor Ltd');
  });
});
