/**
 * Loop 2 — the store contract against a real tenant (todo.md 8.9 N3, N7).
 *
 * Every scenario here is phrased in terms of `IDocumentStoreService` and the
 * adapter's read-back probes, never in terms of SharePoint, so the same suite
 * proves a second store when one exists. The bracketed tags are the Stage B
 * items each test settles; todo.md ticks them from this output.
 *
 * The clock is real, unlike loop 1 (R35): the service filters recent filings
 * by the server's `Created` stamp, so a fixed clock would test the fixture.
 * Every file this suite writes carries the run id in its name and is recycled
 * in `afterAll`, pass or fail.
 */
import { readTenantConfig } from './config.mjs';
import { APP_MODE_WARNING } from './connection.mjs';
import { createAdapter, shipped } from './stores/sharepoint.mjs';

const config = readTenantConfig();
const adapter = await createAdapter(config);
const { isoDateFromSharePoint } = await shipped();

const RUN = process.env.TENANT_RUN_ID || `r${Date.now().toString(36)}`;
const NOW = new Date();
const pad = n => String(n).padStart(2, '0');
// The first of the month: a date read back a day early is then last month, which no one can miss (L4).
const DOCUMENT_DATE = `${NOW.getFullYear()}-${pad(NOW.getMonth() + 1)}-01`;

const written = new Set();
function fileName(label) {
  const name = `tenant-test-${RUN}-${label}.pdf`;
  written.add(name);
  return name;
}

function draft(kind, label, extra = {}) {
  const name = fileName(label);
  const blob = new Blob([`%PDF-1.4\n% Document Intake tenant test ${RUN} ${label}\n`], { type: 'application/pdf' });
  return {
    id: `${RUN}-${label}`,
    file: { name, sizeBytes: blob.size, contentType: 'application/pdf', blob },
    documentKind: kind,
    department: 'programs',
    documentDate: DOCUMENT_DATE,
    amount: 123.45,
    status: kind === 'invoice' ? 'received' : 'pendingReview',
    prefilled: [],
    ...(kind === 'invoice' ? { vendor: `Tenant test vendor ${RUN}` } : {}),
    ...extra
  };
}

let store;
let owner;

beforeAll(async () => {
  if (config.auth === 'app') console.warn(APP_MODE_WARNING);
  store = adapter.createStore();
  await store.initializeAsync();
  const me = await adapter.sp.web.currentUser.select('Email')();
  owner = config.filingUsers[0] || me.Email;
});

afterAll(async () => {
  const left = [];
  for (const name of written) {
    try {
      await adapter.recycleByFileName(name);
    } catch (e) {
      left.push(`${name} (${e.message})`);
    }
  }
  if (left.length > 0) console.error(`Could not recycle, remove by hand:\n  ${left.join('\n  ')}`);
});

describe(`store contract — ${adapter.name}, run ${RUN}`, () => {
  it('[L1] initialises and reads both kinds from the real content types, with no built-in required column', () => {
    const kinds = Object.fromEntries(store.getKinds().map(k => [k.key, k]));
    expect(Object.keys(kinds).sort()).toEqual(['expenseReport', 'invoice']);
    expect(kinds.invoice.requiredFields).toEqual(['documentKind', 'department', 'vendor', 'documentDate', 'amount', 'status']);
    expect(kinds.expenseReport.requiredFields).toEqual(['documentKind', 'department', 'owner', 'documentDate', 'amount', 'status']);
    expect(kinds.invoice.dateFieldLabel).toBe('Invoice date');
    expect(kinds.expenseReport.dateFieldLabel).toBe('Period end');
    expect(store.getDepartments().map(d => d.key).sort()).toEqual(['development', 'finance', 'operations', 'programs']);
    expect(store.isSampleData).toBe(false);
  });

  it('[L4][L8] files an invoice: F- + item id, content type Invoice, the date stored is the date written, and getRecent reads it back', async () => {
    const invoice = draft('invoice', 'invoice');
    const [receipt] = await store.save([invoice], NOW);
    const stored = await adapter.readBack(receipt);

    expect(receipt.receiptNumber).toMatch(/^F-\d+$/);
    expect(Number(receipt.receiptNumber.slice(2))).toBe(stored.id);
    expect(stored.receiptNumber).toBe(receipt.receiptNumber);
    expect(stored.kindLabel).toBe('Invoice');
    expect({ written: DOCUMENT_DATE, raw: stored.documentDateRaw, read: isoDateFromSharePoint(stored.documentDateRaw) })
      .toEqual({ written: DOCUMENT_DATE, raw: stored.documentDateRaw, read: DOCUMENT_DATE });

    const rows = await store.getRecent({ period: '7d', documentKind: 'invoice' }, new Date());
    const row = rows.find(r => r.receiptNumber === receipt.receiptNumber);
    expect(row).toBeDefined();
    console.log(
      `[L4] wrote ${DOCUMENT_DATE}; stored DocumentDate ${JSON.stringify(stored.documentDateRaw)}; ` +
        `getRecent read ${row.documentDate}, ${row.sizeBytes} bytes (uploaded ${invoice.file.sizeBytes})`
    );
    expect(row.documentDate).toBe(DOCUMENT_DATE);
    expect(row.fileName).toBe(receipt.fileName);
    // The size comes through File/Length since L8; 0 would mean the expand came back empty.
    expect(row.sizeBytes).toBe(invoice.file.sizeBytes);
  });

  it('[L5][L6] files an expense report: content type set in the one update, owner resolved from an email', async () => {
    const [receipt] = await store.save([draft('expenseReport', 'expense', { owner })], NOW);
    const stored = await adapter.readBack(receipt);

    expect(stored.kindLabel).toBe('Expense report');
    expect((stored.ownerEmail || '').toLowerCase()).toBe(owner.toLowerCase());
    expect(isoDateFromSharePoint(stored.documentDateRaw)).toBe(DOCUMENT_DATE);
  });

  it('[L6] refuses an owner who is not in the tenant, before anything uploads', async () => {
    const d = draft('expenseReport', 'stranger', { owner: `nobody.${RUN}@example.invalid` });
    await expect(store.save([d], NOW)).rejects.toThrow(/is not a person in this tenant/);
    expect(await adapter.findByFileName(d.file.name)).toHaveLength(0);
  });

  it('[L7] a batch whose second file collides recycles the first and names the collision', async () => {
    const existing = draft('invoice', 'collide');
    await store.save([existing], NOW);

    const first = draft('invoice', 'collide-first');
    const again = { ...draft('invoice', 'collide-again'), file: existing.file };
    await expect(store.save([first, again], NOW)).rejects.toThrow(
      new RegExp(`A file named "${existing.file.name}" is already in`)
    );
    expect(await adapter.findByFileName(first.file.name)).toHaveLength(0);
    expect(await adapter.findByFileName(existing.file.name)).toHaveLength(1);
  });

  it('[L7] a rollback that cannot recycle names the file it left behind', async () => {
    const existing = draft('invoice', 'orphan-existing');
    await store.save([existing], NOW);

    const refusing = adapter.createStore({ failRollback: true });
    await refusing.initializeAsync();
    const first = draft('invoice', 'orphan-first');
    const again = { ...draft('invoice', 'orphan-again'), file: existing.file };

    const error = await refusing.save([first, again], NOW).then(
      () => undefined,
      e => e
    );
    expect(error?.message).toMatch(/could not be removed/);
    expect(error.message).toContain(first.file.name);
    // It really is still there, which is what the message claims; afterAll recycles it.
    expect(await adapter.findByFileName(first.file.name)).toHaveLength(1);
  });
});
