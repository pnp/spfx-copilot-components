import { isSharePointHost, isUsableSiteUrl, odataString, resolveAllowedSharePointOrigin, resolveListTitle, resolveSiteUrl } from '../logic/siteUrl';

const origin = 'https://fabrikam.sharepoint.com';

describe('URL lock', () => {
  it('recognises SharePoint Online hosts only', () => {
    expect(isSharePointHost('fabrikam.sharepoint.com')).toBe(true);
    expect(isSharePointHost('fabrikam.sharepoint.us')).toBe(true);
    expect(isSharePointHost('contoso.sharepoint.com')).toBe(false);
    expect(isSharePointHost('sharepoint.com')).toBe(false);
    expect(isSharePointHost('fabrikam.sharepoint.com.evil.net')).toBe(false);
    expect(isSharePointHost('localhost')).toBe(false);
  });

  it('derives the allowed origin from the page', () => {
    expect(resolveAllowedSharePointOrigin('https://Fabrikam.sharepoint.com/sites/intranet/SitePages/Home.aspx')).toBe(origin);
    expect(resolveAllowedSharePointOrigin('https://localhost:4321/temp/workbench.html')).toBe('');
    expect(resolveAllowedSharePointOrigin('http://fabrikam.sharepoint.com')).toBe('');
    expect(resolveAllowedSharePointOrigin(undefined)).toBe('');
  });

  it('accepts only https URLs on the same tenant', () => {
    expect(isUsableSiteUrl('https://fabrikam.sharepoint.com/sites/hr', origin)).toBe(true);
    expect(isUsableSiteUrl('https://other.sharepoint.com/sites/hr', origin)).toBe(false);
    expect(isUsableSiteUrl('https://fabrikam-my.sharepoint.com/personal/x', origin)).toBe(false);
    expect(isUsableSiteUrl('http://fabrikam.sharepoint.com/sites/hr', origin)).toBe(false);
    expect(isUsableSiteUrl('https://user:pw@fabrikam.sharepoint.com/sites/hr', origin)).toBe(false);
    expect(isUsableSiteUrl('https://fabrikam.sharepoint.com:8443/sites/hr', origin)).toBe(false);
    expect(isUsableSiteUrl('https://fabrikam.sharepoint.com/sites/hr/_api/web', origin)).toBe(false);
    expect(isUsableSiteUrl(['javascript', 'alert(1)'].join(':'), origin)).toBe(false);
    expect(isUsableSiteUrl('https://fabrikam.sharepoint.com/sites/hr', '')).toBe(false);
  });

  it('normalises usable URLs and falls back to the tenant root', () => {
    expect(resolveSiteUrl('https://fabrikam.sharepoint.com/sites/hr/', origin)).toBe('https://fabrikam.sharepoint.com/sites/hr');
    expect(resolveSiteUrl('https://fabrikam.sharepoint.com/sites/hr/SitePages/Home.aspx?x=1#y', origin)).toBe('https://fabrikam.sharepoint.com/sites/hr');
    expect(resolveSiteUrl('https://fabrikam.sharepoint.com/sites/hr/Lists/Weekly%20Pulse%20Responses/AllItems.aspx', origin)).toBe('https://fabrikam.sharepoint.com/sites/hr');
    expect(resolveSiteUrl('https://evil.example.com', origin)).toBe(origin);
    expect(resolveSiteUrl('', origin)).toBe(origin);
  });

  it('accepts plain list titles only', () => {
    expect(resolveListTitle('Veckans fråga', 'x')).toBe('Veckans fråga');
    expect(resolveListTitle("Bad') or 1 eq 1", 'Weekly Pulse Questions')).toBe('Weekly Pulse Questions');
    expect(resolveListTitle('../../x', 'fallback')).toBe('fallback');
    expect(resolveListTitle('', 'fallback')).toBe('fallback');
  });

  it('escapes OData string literals', () => {
    expect(odataString("O'Brien")).toBe("O''Brien");
  });
});
