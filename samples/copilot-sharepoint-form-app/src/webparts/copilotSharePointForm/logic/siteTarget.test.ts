import { normalizeDestination } from "./siteTarget";

describe("normalizeDestination", () => {
  it("moves a library segment on the root site into the library name", () => {
    expect(normalizeDestination("https://contoso.sharepoint.com/Files", "Files")).toEqual({
      siteUrl: "https://contoso.sharepoint.com",
      libraryName: "Files"
    });
    expect(normalizeDestination("https://contoso.sharepoint.com/Files", "")).toEqual({
      siteUrl: "https://contoso.sharepoint.com",
      libraryName: "Files"
    });
  });

  it("keeps a site collection and lifts the library path after it", () => {
    expect(normalizeDestination("https://contoso.sharepoint.com/sites/hr/Documents/", "Documents")).toEqual({
      siteUrl: "https://contoso.sharepoint.com/sites/hr",
      libraryName: "Documents"
    });
    expect(normalizeDestination("https://contoso.sharepoint.com/sites/Finance", "Documents")).toEqual({
      siteUrl: "https://contoso.sharepoint.com/sites/Finance",
      libraryName: "Documents"
    });
    expect(normalizeDestination("https://contoso.sharepoint.com/personal/ada_contoso_com/Shared%20Documents", "")).toEqual({
      siteUrl: "https://contoso.sharepoint.com/personal/ada_contoso_com",
      libraryName: "Shared Documents"
    });
  });

  it("drops a page path and keeps an explicit library name", () => {
    expect(normalizeDestination(
      "https://contoso.sharepoint.com/sites/hr/SitePages/Home.aspx",
      "Policies"
    )).toEqual({
      siteUrl: "https://contoso.sharepoint.com/sites/hr",
      libraryName: "Policies"
    });
  });
});
