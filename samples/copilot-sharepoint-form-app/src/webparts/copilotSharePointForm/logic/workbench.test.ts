import { isLocalWorkbench } from "./workbench";

describe("workbench detection", () => {
  it("treats the local workbench and a missing site as demo mode", () => {
    expect(isLocalWorkbench({
      href: "https://localhost:4321/temp/workbench.html",
      webAbsoluteUrl: "",
      localEnvironment: true
    })).toBe(true);
    expect(isLocalWorkbench({
      href: "https://contoso.sharepoint.com/_layouts/15/workbench.aspx",
      webAbsoluteUrl: "",
      localEnvironment: false
    })).toBe(true);
  });

  it("keeps a hosted workbench on a real site in live mode", () => {
    expect(isLocalWorkbench({
      href: "https://contoso.sharepoint.com/sites/hr/_layouts/15/workbench.aspx",
      webAbsoluteUrl: "https://contoso.sharepoint.com/sites/hr",
      localEnvironment: false
    })).toBe(false);
  });
});
