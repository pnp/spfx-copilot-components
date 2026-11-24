import { FIELDS } from './helpers';
import { buildItemPayload } from '../logic/payload';
import {
  buildReconcileItemsUrl,
  currentUserUrl,
  matchReconciledItem,
  pickReconcileField,
  readCurrentUserId,
  reconcileCreatedFrom,
  RECONCILE_CREATED_SKEW_MS
} from '../logic/reconcileSubmit';

describe('reconcileSubmit', () => {
  it('prefers Title as the match field and builds a current-user plus Created query', () => {
    const payload = buildItemPayload(FIELDS, { Title: "Alex's laptop", Category: 'Hardware' });
    const field = pickReconcileField(FIELDS, payload);
    expect(field).toEqual({ name: 'Title', value: "Alex's laptop" });
    expect(currentUserUrl('https://fabrikam.sharepoint.com/sites/it/')).toBe(
      'https://fabrikam.sharepoint.com/sites/it/_api/web/currentuser?$select=Id'
    );
    const submittedAt = Date.parse('2026-11-24T18:00:00Z');
    expect(reconcileCreatedFrom(submittedAt)).toBe(submittedAt - RECONCILE_CREATED_SKEW_MS);
    const url = buildReconcileItemsUrl(
      "https://fabrikam.sharepoint.com/sites/it/_api/web/lists/getbytitle('IT%20Requests')",
      7,
      submittedAt,
      field
    );
    expect(url).toContain('/items?');
    expect(decodeURIComponent(url)).toContain('AuthorId eq 7');
    expect(decodeURIComponent(url)).toContain("Created ge datetime'2026-11-24T17:59:30Z'");
    expect(decodeURIComponent(url)).toContain("Title eq 'Alex''s laptop'");
    expect(url).not.toMatch(/__metadata|GUID|guid/i);
  });

  it('returns the newest matching item and ignores a later non-matching row', () => {
    const found = matchReconciledItem(
      {
        value: [
          { Id: 9, Title: 'Other', Created: '2026-11-24T18:02:00Z', AuthorId: 7 },
          { Id: 8, Title: 'Laptop', Created: '2026-11-24T18:01:00Z', AuthorId: 7 }
        ]
      },
      { name: 'Title', value: 'Laptop' },
      'https://fabrikam.sharepoint.com/sites/it/Lists/ITRequests'
    );
    expect(found).toEqual({
      id: 8,
      itemUrl: 'https://fabrikam.sharepoint.com/sites/it/Lists/ITRequests/DispForm.aspx?ID=8',
      demo: false
    });
    expect(matchReconciledItem({ value: [] }, { name: 'Title', value: 'Laptop' }, '')).toBeUndefined();
    expect(readCurrentUserId({ Id: 7 })).toBe(7);
  });
});
