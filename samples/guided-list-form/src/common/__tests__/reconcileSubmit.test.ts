import { FIELDS, V11_FIELDS, field } from './helpers';
import {
  buildReconcileItemsUrl,
  currentUserUrl,
  matchReconciledItems,
  normalizeNoteText,
  pickReconcileField,
  readCurrentUserId,
  reconcileCreatedFrom,
  RECONCILE_CREATED_SKEW_MS,
  RECONCILE_ITEM_TOP,
  SAVE_CHECK_AGAIN_MESSAGE,
  SAVE_INCONCLUSIVE_MESSAGE,
  SAVE_MULTIPLE_MESSAGE,
  SAVE_NOT_FOUND_MESSAGE,
  SAVE_NOT_FOUND_YET_MESSAGE,
  SAVE_UNCONFIRMED_SETTLED_MESSAGE
} from '../logic/reconcileSubmit';
import { buildItemPayload } from '../logic/payload';
import { DemoListFormService } from '../services/DemoListFormService';

const LIST_API = "https://fabrikam.sharepoint.com/sites/it/_api/web/lists/getbytitle('IT%20Requests')";
const LIST_URL = 'https://fabrikam.sharepoint.com/sites/it/Lists/ITRequests';
const SUBMITTED_AT = Date.parse('2026-11-24T18:00:00Z');
const OPTIONS = { authorId: 7, createdFrom: reconcileCreatedFrom(SUBMITTED_AT), listUrl: LIST_URL };
const ANSWERS = { Title: 'Laptop', Category: 'Hardware', Details: 'Needs a dock', NeededBy: '2026-12-01' };

function row(id: number, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    Id: id,
    AuthorId: 7,
    Created: '2026-11-24T18:00:05Z',
    Title: 'Laptop',
    Category: 'Hardware',
    Details: 'Needs a dock',
    NeededBy: '2026-12-01T12:00:00Z',
    ...extra
  };
}

describe('reconcileSubmit', () => {
  it('builds a current-user, Created and Title query that selects every submitted column', () => {
    const payload = buildItemPayload(FIELDS, { Title: "Alex's laptop", Category: 'Hardware' });
    expect(pickReconcileField(FIELDS, payload)).toEqual({ name: 'Title', value: "Alex's laptop" });
    expect(currentUserUrl('https://fabrikam.sharepoint.com/sites/it/')).toBe('https://fabrikam.sharepoint.com/sites/it/_api/web/currentuser?$select=Id');
    expect(reconcileCreatedFrom(SUBMITTED_AT)).toBe(SUBMITTED_AT - RECONCILE_CREATED_SKEW_MS);
    const url = buildReconcileItemsUrl(LIST_API, FIELDS, 7, SUBMITTED_AT, { Title: "Alex's laptop", Category: 'Hardware' });
    const decoded = decodeURIComponent(url);
    expect(url).toContain('/items?$select=Id,Created,AuthorId,Title,Category,Details,NeededBy&');
    expect(decoded).toContain('AuthorId eq 7');
    expect(decoded).toContain("Created ge datetime'2026-11-24T17:59:30Z'");
    expect(decoded).toContain("Title eq 'Alex''s laptop'");
    expect(decoded).toContain(`$top=${RECONCILE_ITEM_TOP}`);
    expect(url).not.toMatch(/__metadata|GUID|guid/i);
  });

  it('confirms exactly one item that matches every submitted value', () => {
    expect(matchReconciledItems({ value: [row(8)] }, FIELDS, ANSWERS, OPTIONS)).toEqual({
      status: 'found',
      result: { id: 8, itemUrl: `${LIST_URL}/DispForm.aspx?ID=8`, demo: false }
    });
    expect(matchReconciledItems({ value: [] }, FIELDS, ANSWERS, OPTIONS)).toEqual({ status: 'none' });
    expect(readCurrentUserId({ Id: 7 })).toBe(7);
  });

  it('rejects an item whose Title matches but another answer differs', () => {
    expect(matchReconciledItems({ value: [row(9, { Category: 'Software' })] }, FIELDS, ANSWERS, OPTIONS)).toEqual({ status: 'none' });
    expect(matchReconciledItems({ value: [row(9, { Details: 'Needs a charger' })] }, FIELDS, ANSWERS, OPTIONS)).toEqual({ status: 'none' });
    expect(matchReconciledItems({ value: [row(9, { NeededBy: '2026-12-02T12:00:00Z' })] }, FIELDS, ANSWERS, OPTIONS)).toEqual({ status: 'none' });
    // A column left empty in this save must be empty on the item too.
    const noDetails = { Title: 'Laptop', Category: 'Hardware' };
    expect(matchReconciledItems({ value: [row(9, { NeededBy: null })] }, FIELDS, noDetails, OPTIONS)).toEqual({ status: 'none' });
    expect(matchReconciledItems({ value: [row(9, { Details: null, NeededBy: null })] }, FIELDS, noDetails, OPTIONS).status).toBe('found');
  });

  it('rejects another author or an item created before the submit window', () => {
    expect(matchReconciledItems({ value: [row(9, { AuthorId: 8 })] }, FIELDS, ANSWERS, OPTIONS)).toEqual({ status: 'none' });
    expect(matchReconciledItems({ value: [row(9, { Created: '2026-11-24T17:59:00Z' })] }, FIELDS, ANSWERS, OPTIONS)).toEqual({ status: 'none' });
  });

  it('never picks one of several full matches', () => {
    expect(matchReconciledItems({ value: [row(10), row(11)] }, FIELDS, ANSWERS, OPTIONS)).toEqual({ status: 'multiple', count: 2 });
  });

  it('treats a full page of rows as inconclusive', () => {
    const rows = [];
    for (let i = 1; i <= RECONCILE_ITEM_TOP; i++) {
      rows.push(row(i, { Title: `Other ${i}` }));
    }
    expect(matchReconciledItems({ value: rows }, FIELDS, ANSWERS, OPTIONS)).toEqual({ status: 'inconclusive' });
  });

  it('normalises multi-choice sets, date and time, Yes/No, numbers, links and rich text', () => {
    const fields = V11_FIELDS.concat([
      field({ internalName: 'OnTrack', kind: 'yesno', choices: ['Yes', 'No'] }),
      field({ internalName: 'Days', kind: 'number' }),
      field({ internalName: 'Link', kind: 'hyperlink' }),
      field({ internalName: 'Notes', kind: 'note', richText: true, maxLength: 63999 }),
      field({ internalName: 'Size', kind: 'choice', choices: ['S', 'M'], hasDefault: true })
    ]);
    const answers = {
      Title: 'Flicker',
      Devices: ['Monitor', 'Laptop'],
      StartedAt: '2026-11-24T19:05',
      OnTrack: 'Yes',
      Days: '2.5',
      Link: { url: 'https://contoso.example/r/1', description: '' },
      Notes: 'Line one\nA & B'
    };
    const started = buildItemPayload(fields, answers).StartedAt as string;
    const stored = {
      Id: 20,
      AuthorId: 7,
      Created: '2026-11-24T18:00:10Z',
      Title: 'Flicker ',
      Devices: ['Laptop', 'Monitor'],
      StartedAt: started.replace(':00Z', ':00.000Z'),
      Seen: null,
      Extras: [],
      OnTrack: true,
      Days: 2.5,
      Link: { Url: 'https://contoso.example/r/1', Description: 'https://contoso.example/r/1' },
      Notes: '<div class="ExternalClass1"><p>Line one<br>A &amp; B</p></div>',
      Size: 'M'
    };
    expect(matchReconciledItems({ value: [stored] }, fields, answers, OPTIONS).status).toBe('found');
    expect(matchReconciledItems({ value: [{ ...stored, Devices: ['Laptop'] }] }, fields, answers, OPTIONS).status).toBe('none');
    expect(matchReconciledItems({ value: [{ ...stored, OnTrack: false }] }, fields, answers, OPTIONS).status).toBe('none');
    expect(matchReconciledItems({ value: [{ ...stored, Days: 3 }] }, fields, answers, OPTIONS).status).toBe('none');
    expect(matchReconciledItems({ value: [{ ...stored, Extras: ['Dock'] }] }, fields, answers, OPTIONS).status).toBe('none');
    expect(normalizeNoteText('<p>A&nbsp;&#38;&#x42;</p>')).toBe('A &B');
  });

  it('uses the same full match in the demo service', async () => {
    const svc = new DemoListFormService();
    const schema = await svc.loadSchema();
    const at = Date.now();
    await svc.submit(schema, { Title: 'Laptop', Category: 'Hardware' });
    expect((await svc.findSubmittedItem(schema, { Title: 'Laptop', Category: 'Hardware' }, at)).status).toBe('found');
    expect((await svc.findSubmittedItem(schema, { Title: 'Laptop', Category: 'Software' }, at)).status).toBe('none');
    await svc.submit(schema, { Title: 'Laptop', Category: 'Hardware' });
    expect(await svc.findSubmittedItem(schema, { Title: 'Laptop', Category: 'Hardware' }, at)).toEqual({ status: 'multiple', count: 2 });
  });

  it('keeps every reconcile message plain, with no long dashes or host-specific wording', () => {
    [SAVE_NOT_FOUND_YET_MESSAGE, SAVE_NOT_FOUND_MESSAGE, SAVE_UNCONFIRMED_SETTLED_MESSAGE, SAVE_CHECK_AGAIN_MESSAGE, SAVE_MULTIPLE_MESSAGE, SAVE_INCONCLUSIVE_MESSAGE].forEach((message) => {
      expect(message).not.toMatch(/\u2013|\u2014|\bfree\b|This site/);
    });
  });
});
