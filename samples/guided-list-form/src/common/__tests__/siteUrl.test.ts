import { isSafeListFormUrl, isSharePointHost, isUsableSiteUrl, isValidInternalName, listApiUrl, odataString, parseFieldList, resolveAllowedSharePointOrigin, resolveListTitle, resolveSiteUrl } from '../logic/siteUrl';

const ORIGIN = 'https://fabrikam.sharepoint.com';
const WEB = 'https://fabrikam.sharepoint.com/sites/it';

describe('URL lock', () => {
  it('only accepts SharePoint Online hosts', () => {
    expect(isSharePointHost('fabrikam.sharepoint.com')).toBe(true);
    expect(isSharePointHost('fabrikam.sharepoint.us')).toBe(true);
    expect(isSharePointHost('sharepoint.com')).toBe(false);
    expect(isSharePointHost('fabrikam.sharepoint.com.evil.io')).toBe(false);
    expect(isSharePointHost('contoso.sharepoint.com')).toBe(false);
    expect(isSharePointHost('')).toBe(false);
  });

  it('derives the allowed origin from the current page, https only', () => {
    expect(resolveAllowedSharePointOrigin(WEB)).toBe(ORIGIN);
    expect(resolveAllowedSharePointOrigin('http://fabrikam.sharepoint.com/sites/it')).toBe('');
    expect(resolveAllowedSharePointOrigin('https://localhost:4321')).toBe('');
    expect(resolveAllowedSharePointOrigin(undefined)).toBe('');
  });

  it.each([
    ['https://fabrikam.sharepoint.com/sites/hr', true],
    ['https://FABRIKAM.sharepoint.com/sites/hr', true],
    ['http://fabrikam.sharepoint.com/sites/hr', false],
    ['https://other.sharepoint.com/sites/hr', false],
    ['https://user:pw@fabrikam.sharepoint.com/sites/hr', false],
    ['https://fabrikam.sharepoint.com:8443/sites/hr', false],
    ['https://fabrikam.sharepoint.com/sites/hr/_api/web', false],
    ['https://fabrikam.sharepoint.com/_layouts/15/start.aspx', false],
    // eslint-disable-next-line no-script-url
    ['javascript:alert(1)', false],
    ['//fabrikam.sharepoint.com/sites/hr', false],
    ['not a url', false]
  ])('isUsableSiteUrl(%s) is %s', (url, ok) => {
    expect(isUsableSiteUrl(url, ORIGIN)).toBe(ok);
  });

  it('rejects everything when there is no allowed origin (local/demo)', () => {
    expect(isUsableSiteUrl('https://fabrikam.sharepoint.com/sites/hr', '')).toBe(false);
  });

  it('normalises site URLs and falls back to the current site', () => {
    expect(resolveSiteUrl('', ORIGIN, WEB)).toEqual({ siteUrl: WEB, rejected: false });
    expect(resolveSiteUrl('https://fabrikam.sharepoint.com/sites/hr/', ORIGIN, WEB)).toEqual({ siteUrl: `${ORIGIN}/sites/hr`, rejected: false });
    expect(resolveSiteUrl('https://fabrikam.sharepoint.com/sites/hr/SitePages/Home.aspx?x=1#y', ORIGIN, WEB).siteUrl).toBe(`${ORIGIN}/sites/hr`);
    expect(resolveSiteUrl('https://fabrikam.sharepoint.com/sites/hr/Lists/Requests/AllItems.aspx', ORIGIN, WEB).siteUrl).toBe(`${ORIGIN}/sites/hr`);
    expect(resolveSiteUrl('https://evil.example.com/sites/hr', ORIGIN, WEB)).toEqual({ siteUrl: WEB, rejected: true });
  });
});

describe('list title sanitising and escaping', () => {
  it.each([
    ['IT Requests', 'IT Requests'],
    ['  IT   Requests ', 'IT Requests'],
    ["Alex's list", "Alex's list"],
    ['Förfrågningar (2026)', 'Förfrågningar (2026)'],
    ["x') or 1 eq 1 or ('", "x') or 1 eq 1 or ('"],
    ['Requests/../../_api', ''],
    ['<script>', ''],
    ['a?b', ''],
    ['', ''],
    ['x'.repeat(101), '']
  ])('resolveListTitle(%j) -> %j', (input, expected) => {
    expect(resolveListTitle(input)).toBe(expected);
  });

  it('doubles single quotes and URL-encodes the title inside getbytitle()', () => {
    expect(odataString("Alex's")).toBe("Alex''s");
    expect(listApiUrl(`${ORIGIN}/sites/it/`, "Alex's list")).toBe(`${ORIGIN}/sites/it/_api/web/lists/getbytitle('Alex''s%20list')`);
    // Quotes and parentheses are legal in list titles; escaping keeps them inside the string literal.
    expect(listApiUrl(ORIGIN, "x') or 1 eq 1 or ('")).toBe(`${ORIGIN}/_api/web/lists/getbytitle('x'')%20or%201%20eq%201%20or%20(''')`);
    expect(listApiUrl(ORIGIN, 'R&D (EU)')).toBe(`${ORIGIN}/_api/web/lists/getbytitle('R%26D%20(EU)')`);
  });
});

describe('column names', () => {
  it('accepts SharePoint internal names only', () => {
    expect(isValidInternalName('Title')).toBe(true);
    expect(isValidInternalName('_x0020_Due')).toBe(true);
    expect(isValidInternalName('Due Date')).toBe(false);
    expect(isValidInternalName('__proto__')).toBe(false);
    expect(isValidInternalName('constructor')).toBe(false);
    expect(isValidInternalName('1abc')).toBe(false);
  });

  it('parses the fields list: separators, dedupe, unsafe tokens dropped, max 50', () => {
    expect(parseFieldList('Title, Category; Details\nNeededBy')).toEqual(['Title', 'Category', 'Details', 'NeededBy']);
    expect(parseFieldList('Title,title, ,Category')).toEqual(['Title', 'Category']);
    expect(parseFieldList("Title,<img src=x>,Cat'egory")).toEqual(['Title', "Cat'egory"]);
    expect(parseFieldList(undefined)).toEqual([]);
    expect(parseFieldList(Array.from({ length: 60 }, (_v, i) => `F${i}`).join(','))).toHaveLength(50);
  });
});

describe('safe item links', () => {
  it('accepts a same-tenant display form and rejects everything else', () => {
    const origin = 'https://fabrikam.sharepoint.com';
    expect(isSafeListFormUrl('https://fabrikam.sharepoint.com/sites/it/Lists/IT/DispForm.aspx?ID=12', origin)).toBe(
      'https://fabrikam.sharepoint.com/sites/it/Lists/IT/DispForm.aspx?ID=12'
    );
    expect(isSafeListFormUrl('https://fabrikam.sharepoint.com/sites/it/Lists/IT/NewForm.aspx', origin)).toContain('NewForm.aspx');
    expect(isSafeListFormUrl('https://other.sharepoint.com/sites/it/Lists/IT/DispForm.aspx?ID=12', origin)).toBe('');
    expect(isSafeListFormUrl('https://user:pw@fabrikam.sharepoint.com/sites/it/Lists/IT/DispForm.aspx?ID=1', origin)).toBe('');
    expect(isSafeListFormUrl('https://fabrikam.sharepoint.com/sites/it/Lists/IT/AllItems.aspx', origin)).toBe('');
    // eslint-disable-next-line no-script-url
    expect(isSafeListFormUrl('javascript:alert(1)', origin)).toBe('');
    expect(isSafeListFormUrl('https://fabrikam.sharepoint.com/sites/it/Lists/IT/DispForm.aspx?ID=1#steal', origin)).not.toContain('#');
  });
});
