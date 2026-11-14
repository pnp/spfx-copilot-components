import manifest from "./CopilotSharePointFormWebPart.manifest.json";

describe("CopilotSharePointFormWebPart.manifest.json", () => {
  it("does not include SharePointFullPage", () => {
    const raw: string = JSON.stringify(manifest);
    expect(raw).not.toContain("SharePointFullPage");
    expect(manifest.supportedHosts).toEqual(["SharePointWebPart"]);
  });
});
