/**
 * The fixture capture's own pipeline, offline (todo.md 8.9 N4). The capture
 * runs against a tenant once in a while; a scrubbing bug found then has
 * already been written to disk. These run with every `test:tenant` instead.
 */
import { spfi } from '@pnp/sp';
import { SPDefault } from '@pnp/nodejs';
import '@pnp/sp/webs/index.js';
import {
  Recorder,
  buildFixture,
  classify,
  driftBetween,
  leaksIn,
  pseudonymousContentTypeId
} from './fixtures.mjs';

const GUID_A = '1A2B3C4D5E6F708192A3B4C5D6E7F801';
const GUID_B = 'ABCDEF0123456789ABCDEF0123456789';
const INVOICE = `0x010100${GUID_A}00${GUID_B}`;
const EXPENSE = `0x010100${GUID_B}00${GUID_A}`;
const FOLDER = `0x012000${GUID_A}`;
const SITE = '/sites/RealTenantSite';

/** Answers every request with `body`, as SharePoint's JSON would arrive. */
function FakeSend(body) {
  return instance => {
    instance.on.send.replace(async () =>
      new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    return instance;
  };
}

const link = (Name, DisplayName = Name, Required = true) => ({ 'odata.type': 'SP.FieldLink', Name, DisplayName, Required, Hidden: false });
const item = (id, name, ct, extra) => ({
  'odata.id': `https://contoso.sharepoint.com${SITE}/_api/Web/Lists(guid'0b1c2d3e-0000-4000-8000-000000000001')/Items(${id})`,
  Id: id,
  ID: id,
  ContentTypeId: ct,
  FileLeafRef: name,
  FileRef: `${SITE}/Records/Finance/Invoices/Programs/2026/${name}`,
  'File@odata.navigationLinkUrl': `Web/Lists(guid'0b1c2d3e-0000-4000-8000-000000000001')/Items(${id})/File`,
  File: { 'odata.type': 'SP.File', Length: '44' },
  FilingDepartment: 'Programs',
  DocumentDate: '2026-07-31T23:00:00Z',
  Amount: 1284.5,
  FilingStatus: 'Received',
  ReceiptNumber: `F-${String(id).padStart(5, '0')}`,
  Created: '2026-09-22T14:03:27Z',
  'Author@odata.navigationLinkUrl': `Web/Lists(guid'0b1c2d3e-0000-4000-8000-000000000001')/Items(${id})/Author`,
  Author: { 'odata.type': 'SP.Data.UserInfoItem', Title: 'Real Person' },
  ...extra
});

function recordedLog() {
  const u = path => `https://contoso.sharepoint.com${SITE}/_api/web/${path}`;
  return [
    { url: u("lists/getByTitle('Records')/rootFolder?$select=ServerRelativeUrl"), result: { ServerRelativeUrl: `${SITE}/Records` } },
    { url: u('?$select=Url'), result: { Url: `https://contoso.sharepoint.com${SITE}` } },
    { url: u("lists/getByTitle('Records')/contentTypes?$select=Id,Name"), result: [
      { 'odata.type': 'SP.ContentType', Id: { StringValue: INVOICE }, Name: 'Invoice' },
      { Id: { StringValue: EXPENSE }, Name: 'Expense report' },
      { Id: { StringValue: FOLDER }, Name: 'Folder' }
    ] },
    { url: u(`lists/getByTitle('Records')/contentTypes('${INVOICE}')/fieldLinks?$select=Name`), result: [link('FileLeafRef', 'Name'), link('Vendor')] },
    { url: u(`lists/getByTitle('Records')/contentTypes('${EXPENSE}')/fieldLinks?$select=Name`), result: [link('FileLeafRef', 'Name'), link('ReportOwner', 'Report owner')] },
    { url: u("fields/getByInternalNameOrTitle('FilingDepartment')?$select=Choices"), result: { Choices: ['Programs', 'Finance'] } },
    { url: u("lists/getByTitle('Records')/items?$select=Id&$top=500"), result: [
      item(7, 'unrelated.pdf', INVOICE),
      item(88, 'capture-RUN-expense.pdf', EXPENSE, { ReportOwner: { Title: 'Real Owner' }, FilingStatus: 'Pending review' }),
      item(87, 'capture-RUN-invoice.pdf', INVOICE, { Vendor: 'Capture Vendor Ltd' })
    ] }
  ];
}

function built() {
  return buildFixture({
    recorded: classify(recordedLog()),
    statusChoices: ['Received', 'Pending review'],
    ownFiles: { 'capture-RUN-invoice.pdf': 'captured-invoice.pdf', 'capture-RUN-expense.pdf': 'captured-expense-report.pdf' },
    formatReceiptNumber: id => `F-${String(id).padStart(5, '0')}`,
    source: { capturedBy: 'test', capturedOn: '2026-09-22', pnpjs: '4.21.0' }
  });
}

describe('fixture capture (8.9 N4), offline', () => {
  it('records each parsed response through real PnPjs', async () => {
    const log = [];
    const sp = spfi('https://contoso.sharepoint.com/sites/x').using(SPDefault(), FakeSend({ Url: 'u' }), Recorder(log));
    await sp.web.select('Url')();
    expect(log).toHaveLength(1);
    expect(log[0].url).toMatch(/\/_api\/web/);
    expect(log[0].result).toMatchObject({ Url: 'u' });
  });

  it('keeps a content type id\'s grammar, drops its GUIDs, and is stable', () => {
    const pseudo = pseudonymousContentTypeId(INVOICE, 'Invoice');
    expect(pseudo).toMatch(/^0x010100[0-9A-F]{32}00[0-9A-F]{32}$/);
    expect(pseudo).not.toContain(GUID_A);
    expect(pseudo).not.toContain(GUID_B);
    expect(pseudonymousContentTypeId(INVOICE, 'Invoice')).toBe(pseudo);
    expect(pseudonymousContentTypeId(FOLDER, 'Folder')).toMatch(/^0x012000[0-9A-F]{32}$/);
  });

  it('keeps what the platform said and scrubs what names the tenant', () => {
    const fixture = built();
    const invoiceId = pseudonymousContentTypeId(INVOICE, 'Invoice');

    // Kept: the links as returned, FileLeafRef included (L1), and the raw date (L4).
    expect(fixture.library.fieldLinks[invoiceId].map(l => l.Name)).toEqual(['FileLeafRef', 'Vendor']);
    expect(fixture.recent.items.map(i => i.DocumentDate)).toEqual(['2026-07-31T23:00:00Z', '2026-07-31T23:00:00Z']);
    expect(fixture.choices).toEqual({ FilingDepartment: ['Programs', 'Finance'], FilingStatus: ['Received', 'Pending review'] });

    // Only this capture's two files, in the order given, with fixed ids, names and people.
    expect(fixture.recent.items.map(i => [i.Id, i.ID, i.ReceiptNumber, i.FileLeafRef])).toEqual([
      [101, 101, 'F-00101', 'captured-invoice.pdf'],
      [102, 102, 'F-00102', 'captured-expense-report.pdf']
    ]);
    expect(fixture.recent.items[0].FileRef).toBe('/sites/records/Records/Finance/Invoices/Programs/2026/captured-invoice.pdf');
    expect(fixture.recent.items[0].Created).toBe('2026-08-18T09:00:00Z');
    expect(fixture.recent.items[0].Author).toEqual({ Title: 'Filing User' });
    expect(fixture.recent.items[1].ReportOwner).toEqual({ Title: 'Report Owner' });
    expect(fixture.recent.items[0].ContentTypeId).toBe(invoiceId);

    expect(leaksIn(fixture, [['host', 'contoso.sharepoint.com'], ['site', SITE], ['person', 'Real Person'], ['owner', 'Real Owner'], ['run', 'RUN']])).toEqual([]);
    expect(JSON.stringify(fixture)).not.toMatch(/odata\.|GUID_A|1A2B3C4D5E6F708192A3B4C5D6E7F801/);
  });

  it('refuses a fixture that still carries a secret or a GUID', () => {
    const leaky = { ...built(), note: 'see https://contoso.sharepoint.com and 0b1c2d3e-0000-4000-8000-000000000001' };
    expect(leaksIn(leaky, [['the tenant host', 'contoso.sharepoint.com']])).toEqual([
      'the tenant host at note',
      'a GUID (0b1c2d3e-0000-4000-8000-000000000001) at note'
    ]);
  });

  it('names the JSON path of every leak, so the refusal says which field to scrub (N4a)', () => {
    // The shape of the first real refusal: a GUID the expansion added, unasked, deep in an item.
    const fixture = built();
    fixture.recent.items[1].File = { Length: '44', UniqueId: 'fc956084-1111-4222-8333-444455556666' };
    fixture.library.fieldLinks['9e9e9e9e-0000-4000-8000-000000000000'] = [];
    fixture.recent.items[0].Author = { Title: 'Filing User', EMail: 'Someone@Contoso.onmicrosoft.com' };

    expect(leaksIn(fixture, [['your email', 'someone@contoso.onmicrosoft.com'], ['unset', undefined]])).toEqual([
      'a GUID (9e9e9e9e-0000-4000-8000-000000000000) at library.fieldLinks.9e9e9e9e-0000-4000-8000-000000000000 (in the key)',
      'your email at recent.items[0].Author.EMail',
      'a GUID (fc956084-1111-4222-8333-444455556666) at recent.items[1].File.UniqueId'
    ]);
  });

  it('reports each place separately, and nothing for a clean fixture', () => {
    const fixture = built();
    expect(leaksIn(fixture, [['your name', 'Real Person']])).toEqual([]);
    fixture.recent.items[0].Vendor = 'Real Person';
    fixture.recent.items[1].Vendor = 'real person';
    expect(leaksIn(fixture, [['your name', 'Real Person']])).toEqual([
      'your name at recent.items[0].Vendor',
      'your name at recent.items[1].Vendor'
    ]);
  });

  it('names the call it could not find, rather than writing a thinner fixture', () => {
    expect(() => classify(recordedLog().filter(e => !/fieldLinks/.test(e.url)))).toThrow(/field links/);
  });

  it('reports drift by path and ignores when the capture was made', () => {
    const a = built();
    const b = JSON.parse(JSON.stringify(a));
    b.$source.capturedOn = '2027-01-01';
    expect(driftBetween(a, b)).toEqual([]);
    b.choices.FilingDepartment.push('Grants');
    expect(driftBetween(a, b)).toEqual(['.choices.FilingDepartment[2]: undefined -> "Grants"']);
  });
});
