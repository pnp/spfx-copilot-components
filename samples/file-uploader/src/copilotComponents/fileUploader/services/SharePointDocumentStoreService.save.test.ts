import type { SPFI } from '@pnp/sp';
import type { IFilingDraft } from '../models/filing';
import type { IFieldLink, IRecordListItem } from './SharePointDocumentStoreService';
import { SharePointDocumentStoreService } from './SharePointDocumentStoreService';
import { DocumentStoreUnavailableError } from './IDocumentStoreService';
import { contentTypeIdOf, SHAREPOINT_TENANT } from './__fixtures__/sharepointTenant';

/**
 * The live store's start-up and write path against a SharePoint fake
 * (todo.md Phase 8.1). No PnPjs is loaded: the store only *types* its SPFI
 * (AGENTS.md R36), so a plain object shaped like the calls it makes is enough.
 * What the fake *answers* at start-up — content types, field links, department
 * choices — is the captured tenant fixture (8.9 N4), not hand-typed values.
 *
 * What this proves is the store's own sequencing — every check before any
 * write, rollback newest first, errors that say what happened. How PnPjs and
 * SharePoint answer the write calls is loop 2's (`npm run test:tenant`), R22.
 *
 * Fixed clock, always (R35).
 */

const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);
const ORIGIN: string = 'https://tenant.example.org';
const ROOT: string = '/sites/records/Records';
const INVOICE_FOLDER: string = ROOT + '/Finance/Invoices/Finance/2026';
const EXPENSE_FOLDER: string = ROOT + '/Finance/Expense reports/Development/2026';
const INVOICE_ID: string = contentTypeIdOf('Invoice');

interface IFakeTenant {
  contentTypes: { Id: { StringValue: string }; Name: string }[];
  /** FilingDepartment's choices, in tenant order. */
  departmentChoices: string[];
  fieldLinks: { [contentTypeId: string]: IFieldLink[] };
  /** Login (lower-cased) -> site user Id. Anything else fails `ensureUser`. */
  users: { [login: string]: number };
  /** Server-relative URLs already in the library. */
  existingFiles: string[];
  /** File names whose metadata update is rejected. */
  failUpdateFor: string[];
  /** File names that cannot be recycled. */
  failRecycleFor: string[];
}

interface ICalls {
  folders: string[];
  uploads: string[];
  updates: { url: string; values: { [name: string]: unknown } }[];
  recycled: string[];
  ensureUser: string[];
  /** What `getRecent()` asked the items endpoint for. */
  itemsQuery: { select: string[]; expand: string[] };
}

/**
 * The library as the tenant returned it (todo.md 8.9 N4): content types, field
 * links and choices come from the captured fixture, fresh copies per test so a
 * test may mutate its own. Hand-typed links are how 8.8 L1 got through — the
 * fake had no FileLeafRef because nobody thought to type it.
 */
function tenant(): IFakeTenant {
  const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
  return {
    contentTypes: copy(SHAREPOINT_TENANT.library.contentTypes),
    fieldLinks: copy(SHAREPOINT_TENANT.library.fieldLinks),
    departmentChoices: copy(SHAREPOINT_TENANT.choices.FilingDepartment),
    users: { 'kim.okafor@example.org': 12 },
    existingFiles: [],
    failUpdateFor: [],
    failRecycleFor: []
  };
}

/** A PnPjs-style queryable: call it to read; `.select()` returns another one. */
interface IQueryable<T> {
  (): Promise<T>;
  select: (...fields: string[]) => IQueryable<T>;
}

function queryable<T>(read: () => T): IQueryable<T> {
  const q = ((): Promise<T> => Promise.resolve().then(read)) as IQueryable<T>;
  q.select = () => queryable(read);
  return q;
}

const nameOf = (url: string): string => url.substring(url.lastIndexOf('/') + 1);

/** The `items.select(...).expand(...).filter(...).orderBy(...).top(...)()` chain `getRecent()` builds. */
interface IItemsChain {
  expand: (...names: string[]) => IItemsChain;
  filter: (query: string) => IItemsChain;
  orderBy: (field: string, ascending?: boolean) => IItemsChain;
  top: (count: number) => () => Promise<IRecordListItem[]>;
}

/** Records the query and answers with the captured items (8.9 N4), in the platform's own shape. */
function itemsEndpoint(calls: ICalls): { select: (...fields: string[]) => IItemsChain } {
  return {
    select: (...fields: string[]): IItemsChain => {
      calls.itemsQuery.select = fields;
      const chain: IItemsChain = {
        expand: (...names: string[]) => {
          calls.itemsQuery.expand = names;
          return chain;
        },
        filter: () => chain,
        orderBy: () => chain,
        top: () => () => Promise.resolve(JSON.parse(JSON.stringify(SHAREPOINT_TENANT.recent.items)))
      };
      return chain;
    }
  };
}

function emptyCalls(): ICalls {
  return {
    folders: [],
    uploads: [],
    updates: [],
    recycled: [],
    ensureUser: [],
    itemsQuery: { select: [], expand: [] }
  };
}

function fakeSp(t: IFakeTenant, calls: ICalls): SPFI {
  let nextItemId: number = 41;
  const itemIds: { [url: string]: number } = {};

  const list = {
    rootFolder: queryable(() => ({ ServerRelativeUrl: ROOT })),
    contentTypes: Object.assign(
      queryable(() => t.contentTypes),
      { getById: (id: string) => ({ fieldLinks: queryable(() => t.fieldLinks[id] || []) }) }
    ),
    items: itemsEndpoint(calls)
  };

  const web = Object.assign(queryable(() => ({ Url: ORIGIN + '/sites/records' })), {
    lists: { getByTitle: () => list },
    currentUser: queryable(() => ({ Id: 7, Title: 'Dana Whitfield' })),
    fields: {
      getByInternalNameOrTitle: () =>
        queryable(() => ({ Choices: t.departmentChoices }))
    },
    folders: {
      addUsingPath: (path: string) => {
        calls.folders.push(path);
        return Promise.resolve({});
      }
    },
    getFolderByServerRelativePath: (path: string) => ({
      select: () => queryable(() => ({ Exists: true })),
      files: {
        getByUrl: (name: string) => ({
          exists: () => Promise.resolve(t.existingFiles.indexOf(path + '/' + name) >= 0)
        }),
        addUsingPath: (name: string) => {
          const url: string = path + '/' + name;
          calls.uploads.push(url);
          itemIds[url] = ++nextItemId;
          return Promise.resolve({ ServerRelativeUrl: url });
        }
      }
    }),
    getFileByServerRelativePath: (url: string) => ({
      getItem: () =>
        Promise.resolve({
          Id: itemIds[url],
          update: (values: { [name: string]: unknown }) => {
            calls.updates.push({ url, values });
            return t.failUpdateFor.indexOf(nameOf(url)) >= 0
              ? Promise.reject(new Error('Column validation failed.'))
              : Promise.resolve({});
          }
        }),
      recycle: () => {
        if (t.failRecycleFor.indexOf(nameOf(url)) >= 0) {
          return Promise.reject(new Error('Access denied.'));
        }
        calls.recycled.push(url);
        return Promise.resolve('recycle-bin-item');
      }
    }),
    ensureUser: (login: string) => {
      calls.ensureUser.push(login);
      const id: number | undefined = t.users[login.toLowerCase()];
      return id === undefined
        ? Promise.reject(new Error('The specified user could not be found.'))
        : Promise.resolve({ Id: id });
    }
  });

  return { web } as unknown as SPFI;
}

function invoice(id: string, name: string): IFilingDraft {
  return {
    id,
    file: { name, sizeBytes: 3, contentType: 'application/pdf', blob: new Blob(['pdf']) },
    documentKind: 'invoice',
    department: 'finance',
    vendor: 'Northgate Supplies',
    documentDate: '2026-08-17',
    amount: 512.4,
    status: 'received',
    prefilled: []
  };
}

function expenseReport(id: string, name: string, owner: string): IFilingDraft {
  return {
    id,
    file: { name, sizeBytes: 3, contentType: '', blob: new Blob(['xlsx']) },
    documentKind: 'expenseReport',
    department: 'development',
    owner,
    documentDate: '2026-07-31',
    amount: 218.75,
    status: 'pendingReview',
    prefilled: []
  };
}

async function started(t: IFakeTenant = tenant()): Promise<{ store: SharePointDocumentStoreService; calls: ICalls }> {
  const calls: ICalls = emptyCalls();
  const store = new SharePointDocumentStoreService(fakeSp(t, calls));
  await store.initializeAsync();
  return { store, calls };
}

describe('starting the live store', () => {
  it('reads both kinds and ignores SharePoint\'s Folder type', async () => {
    const { store } = await started();
    expect(store.getKinds().map(k => k.key)).toEqual(['invoice', 'expenseReport']);
    expect(store.getKinds()[0].dateFieldLabel).toBe('Invoice date');
    expect(store.isSampleData).toBe(false);
  });

  it('refuses to start on a content type it does not know, naming it (Decision 6)', async () => {
    const t: IFakeTenant = tenant();
    t.contentTypes.push({ Id: { StringValue: '0x0101' }, Name: 'Document' });
    const store = new SharePointDocumentStoreService(fakeSp(t, emptyCalls()));
    await expect(store.initializeAsync()).rejects.toThrow(/"Document"/);
  });
});

describe('save — the happy path', () => {
  it('files each document and returns receipts with their links', async () => {
    const { store, calls } = await started();
    const receipts = await store.save([invoice('d1', 'INV-1.pdf'), invoice('d2', 'INV-2.pdf')], NOW);

    expect(receipts.map(r => r.receiptNumber)).toEqual(['F-00042', 'F-00043']);
    expect(calls.uploads).toEqual([INVOICE_FOLDER + '/INV-1.pdf', INVOICE_FOLDER + '/INV-2.pdf']);
    expect(receipts[0].webUrl).toBe(ORIGIN + INVOICE_FOLDER + '/INV-1.pdf');
    expect(receipts[0].folderUrl).toBe(ORIGIN + INVOICE_FOLDER);
    expect(calls.updates[0].values).toMatchObject({
      ContentTypeId: INVOICE_ID,
      FilingDepartment: 'Finance',
      Vendor: 'Northgate Supplies',
      DocumentDate: '2026-08-17',
      Amount: 512.4,
      FilingStatus: 'Received',
      ReceiptNumber: 'F-00042'
    });
    expect(calls.recycled).toEqual([]);
  });

  it('writes the resolved report owner and encodes the folder link', async () => {
    const { store, calls } = await started();
    const receipts = await store.save([expenseReport('d1', 'ER-1.xlsx', ' Kim.Okafor@example.org ')], NOW);

    expect(calls.ensureUser).toEqual(['Kim.Okafor@example.org']);
    expect(calls.updates[0].values.ReportOwnerId).toBe(12);
    expect(receipts[0].folderUrl).toBe(ORIGIN + '/sites/records/Records/Finance/Expense%20reports/Development/2026');
  });
});

describe('save — nothing is written until every check passes', () => {
  it('fails on an owner SharePoint cannot resolve before uploading anything (M7)', async () => {
    const { store, calls } = await started();
    const attempt = store.save([invoice('d1', 'INV-1.pdf'), expenseReport('d2', 'ER-1.xlsx', 'nobody@example.org')], NOW);

    await expect(attempt).rejects.toThrow(/Report owner "nobody@example.org"/);
    expect(calls.folders).toEqual([]);
    expect(calls.uploads).toEqual([]);
  });

  it('fails on a file with no content', async () => {
    const { store, calls } = await started();
    const draft: IFilingDraft = invoice('d1', 'INV-1.pdf');
    const attempt = store.save([{ ...draft, file: { ...draft.file, blob: undefined } }], NOW);

    await expect(attempt).rejects.toThrow(/No file content/);
    expect(calls.uploads).toEqual([]);
  });

  it('fails on a name SharePoint would refuse (M10)', async () => {
    const { store, calls } = await started();
    await expect(store.save([invoice('d1', 'INV:1.pdf')], NOW)).rejects.toThrow(/character :/);
    expect(calls.uploads).toEqual([]);
  });

  it('fails when two files in one save would land on the same name (M10)', async () => {
    const { store, calls } = await started();
    const attempt = store.save([invoice('d1', 'INV-1.pdf'), invoice('d2', 'inv-1.PDF')], NOW);

    await expect(attempt).rejects.toThrow(/Two files named "inv-1.PDF"/);
    expect(calls.uploads).toEqual([]);
  });
});

describe('save — rollback', () => {
  it('stops at a file already in the library and recycles what it had uploaded (M10)', async () => {
    const t: IFakeTenant = tenant();
    t.existingFiles = [INVOICE_FOLDER + '/INV-2.pdf'];
    const { store, calls } = await started(t);
    const attempt = store.save([invoice('d1', 'INV-1.pdf'), invoice('d2', 'INV-2.pdf')], NOW);

    await expect(attempt).rejects.toBeInstanceOf(DocumentStoreUnavailableError);
    await expect(attempt).rejects.toThrow(/already in Records \/ Finance \/ Invoices \/ Finance \/ 2026/);
    expect(calls.uploads).toEqual([INVOICE_FOLDER + '/INV-1.pdf']);
    expect(calls.recycled).toEqual([INVOICE_FOLDER + '/INV-1.pdf']);
  });

  it('recycles every uploaded file, newest first, when metadata cannot be set', async () => {
    const t: IFakeTenant = tenant();
    t.failUpdateFor = ['INV-2.pdf'];
    const { store, calls } = await started(t);
    const attempt = store.save([invoice('d1', 'INV-1.pdf'), invoice('d2', 'INV-2.pdf')], NOW);

    await expect(attempt).rejects.toThrow(/Nothing was filed: Column validation failed/);
    expect(calls.recycled).toEqual([INVOICE_FOLDER + '/INV-2.pdf', INVOICE_FOLDER + '/INV-1.pdf']);
  });

  it('names the file it could not remove when the rollback itself fails', async () => {
    const t: IFakeTenant = tenant();
    t.failUpdateFor = ['INV-2.pdf'];
    t.failRecycleFor = ['INV-1.pdf'];
    const { store, calls } = await started(t);
    const attempt = store.save([invoice('d1', 'INV-1.pdf'), invoice('d2', 'INV-2.pdf')], NOW);

    await expect(attempt).rejects.toThrow(/could not be removed[\s\S]*INV-1\.pdf/);
    expect(calls.recycled).toEqual([INVOICE_FOLDER + '/INV-2.pdf']);
  });
});

describe('expense-report folder', () => {
  it('uploads into the kind and department folder the destination names', async () => {
    const { store, calls } = await started();
    await store.save([expenseReport('d1', 'ER-1.xlsx', 'kim.okafor@example.org')], NOW);
    expect(calls.uploads).toEqual([EXPENSE_FOLDER + '/ER-1.xlsx']);
  });
});

describe('recent filings (8.8 L8)', () => {
  it('asks for the size through File/Length, never the File_x0020_Size column the platform refuses', async () => {
    const { store, calls } = await started();
    await store.getRecent({ period: '30d' }, NOW);
    expect(calls.itemsQuery.select).toContain('File/Length');
    expect(calls.itemsQuery.expand).toContain('File');
    expect(calls.itemsQuery.select).not.toContain('File_x0020_Size');
  });

  it('reads the captured items back with their size and the date they were written', async () => {
    const { store } = await started();
    const rows = await store.getRecent({ period: '30d' }, NOW);
    expect(rows.map(r => r.documentKind).sort()).toEqual(['expenseReport', 'invoice']);
    for (const row of rows) {
      const captured: IRecordListItem = SHAREPOINT_TENANT.recent.items.filter(i => i.FileLeafRef === row.fileName)[0];
      expect(row.sizeBytes).toBe(Number(captured.File && captured.File.Length));
      expect(row.sizeBytes).toBeGreaterThan(0);
      expect(row.documentDate).toBe(SHAREPOINT_TENANT.recent.documentDateWritten);
    }
  });
});
