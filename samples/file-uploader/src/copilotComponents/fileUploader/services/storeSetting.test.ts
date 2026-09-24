import {
  SHAREPOINT_SITE_URL_KEY,
  STORE_KEY,
  sharePointSiteUrlFrom,
  storeNameFrom,
  tenantSettingReadFailure
} from './storeSetting';

describe('the setting keys (Decision 17)', () => {
  it('are the renamed pair, not the pre-17 key', () => {
    expect(STORE_KEY).toBe('DocumentIntake.Store');
    expect(SHAREPOINT_SITE_URL_KEY).toBe('DocumentIntake.SharePoint.SiteUrl');
  });
});

describe('storeNameFrom (Decisions 11 and 17)', () => {
  it('reads every empty form of the setting as sample data', () => {
    expect(storeNameFrom(undefined)).toBeUndefined();
    expect(storeNameFrom(null)).toBeUndefined();
    expect(storeNameFrom({ 'odata.null': true })).toBeUndefined();
    expect(storeNameFrom({ Value: null })).toBeUndefined();
    expect(storeNameFrom({ Value: '   ' })).toBeUndefined();
  });

  it('names the SharePoint store, whatever the case and whitespace', () => {
    expect(storeNameFrom({ Value: 'sharepoint' })).toBe('sharepoint');
    expect(storeNameFrom({ Value: ' SharePoint ' })).toBe('sharepoint');
  });

  it('reads a store it does not know as sample data, as ruled', () => {
    expect(storeNameFrom({ Value: 'dataverse' })).toBeUndefined();
    expect(storeNameFrom({ Value: 'sharepiont' })).toBeUndefined();
    expect(storeNameFrom({ Value: 'https://tenant.example.org/sites/records' })).toBeUndefined();
  });
});

describe('sharePointSiteUrlFrom (Decision 17)', () => {
  it('returns the site URL, trimmed and without a trailing slash', () => {
    expect(sharePointSiteUrlFrom({ Value: ' https://tenant.example.org/sites/records/ ' })).toBe(
      'https://tenant.example.org/sites/records'
    );
  });

  it('refuses a missing site once the store is SharePoint, rather than falling back to sample data', () => {
    expect(() => sharePointSiteUrlFrom(undefined)).toThrow(
      'The tenant setting DocumentIntake.Store is "sharepoint" but DocumentIntake.SharePoint.SiteUrl is not set.'
    );
    expect(() => sharePointSiteUrlFrom({ Value: '  ' })).toThrow(SHAREPOINT_SITE_URL_KEY);
  });

  it('refuses a value that is set but is not an absolute https URL', () => {
    expect(() => sharePointSiteUrlFrom({ Value: 'sites/records' })).toThrow(SHAREPOINT_SITE_URL_KEY);
    expect(() => sharePointSiteUrlFrom({ Value: 'http://tenant.example.org/sites/records' })).toThrow(/https/);
  });
});

describe('tenantSettingReadFailure (todo.md 8.5 E5)', () => {
  it('names the key and the web the read was addressed to', () => {
    const context: unknown = { pageContext: { web: { absoluteUrl: 'https://tenant.example.org/sites/hosting' } } };
    expect(tenantSettingReadFailure(STORE_KEY, context, new Error('Access denied.')).message).toBe(
      'The Document Intake tenant setting DocumentIntake.Store could not be read: Access denied. ' +
        '(asked https://tenant.example.org/sites/hosting)'
    );
  });

  it('says the web is unknown rather than guessing, whatever the context is missing', () => {
    const expected: string =
      'The Document Intake tenant setting DocumentIntake.Store could not be read: Access denied. (asked an unknown web)';
    expect(tenantSettingReadFailure(STORE_KEY, {}, new Error('Access denied.')).message).toBe(expected);
    expect(tenantSettingReadFailure(STORE_KEY, { pageContext: {} }, new Error('Access denied.')).message).toBe(
      expected
    );
    expect(tenantSettingReadFailure(STORE_KEY, undefined, new Error('Access denied.')).message).toBe(expected);
  });

  it('carries a non-Error rejection through as text', () => {
    expect(tenantSettingReadFailure(SHAREPOINT_SITE_URL_KEY, {}, 'timed out').message).toBe(
      'The Document Intake tenant setting DocumentIntake.SharePoint.SiteUrl could not be read: timed out ' +
        '(asked an unknown web)'
    );
  });
});
