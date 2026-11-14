import { DOCUMENT_LIBRARY_BASE_TEMPLATE, classifyLibrary, resolveLibraryName } from "./libraryLookup";

describe("library name and existence lookup", () => {
  it("uses libraryName, then libraryTitle, then Documents", () => {
    expect(resolveLibraryName("Policies", "Documents", true)).toBe("Policies");
    expect(resolveLibraryName("  ", "Records", true)).toBe("Records");
    expect(resolveLibraryName("", "", true)).toBe("Documents");
    expect(resolveLibraryName("", "", false)).toBe("");
  });

  it("verifies a document library and rejects a missing or non-library list", () => {
    expect(classifyLibrary(true, DOCUMENT_LIBRARY_BASE_TEMPLATE)).toBe("verified");
    expect(classifyLibrary(false, undefined)).toBe("missing");
    expect(classifyLibrary(true, 100)).toBe("invalid");
    expect(classifyLibrary(true, undefined)).toBe("invalid");
  });
});
