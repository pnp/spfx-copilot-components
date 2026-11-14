import { ABSOLUTE_MAX_FILE_SIZE_MB, BYTES_PER_MB } from "../models";
import {
  acceptAttribute,
  effectiveAllowedExtensions,
  extensionOf,
  isSupportedExtension,
  maxFileSizeError,
  normalizeMaxFileSizeMb,
  parseAllowedExtensions,
  validateSelectedFile
} from "./fileValidation";

describe("file validation", () => {
  const rules = {
    maxFileSizeMb: 50,
    allowedExtensions: [".pdf", ".docx", ".xlsx", ".pptx", ".md", ".png", ".jpg"]
  };

  it("rejects an empty file", () => {
    const result = validateSelectedFile({ name: "empty.pdf", size: 0 }, rules);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("0 bytes");
  });

  it("accepts a file of exactly 50 MB and rejects one byte over", () => {
    const limit = ABSOLUTE_MAX_FILE_SIZE_MB * BYTES_PER_MB;
    expect(validateSelectedFile({ name: "policy.pdf", size: limit }, rules).ok).toBe(true);
    const over = validateSelectedFile({ name: "policy.pdf", size: limit + 1 }, rules);
    expect(over.ok).toBe(false);
    expect(over.message).toContain("over the 50 MB limit");
    expect(over.message).toContain("52,428,801");
  });

  it("rejects a disallowed extension and accepts an allowed one regardless of case", () => {
    const rejected = validateSelectedFile({ name: "virus.exe", size: 128 }, rules);
    expect(rejected.ok).toBe(false);
    expect(rejected.message).toContain(".exe");
    expect(rejected.message).toContain(".pdf");
    expect(validateSelectedFile({ name: "Report.PDF", size: 128 }, rules).ok).toBe(true);
    expect(extensionOf("Report.PDF")).toBe(".pdf");
  });

  it("enforces the default allowlist (.pdf,.docx,.xlsx,.pptx,.md,.png,.jpg) when the list is empty or contains unsupported extensions", () => {
    const emptyRules = { maxFileSizeMb: 50, allowedExtensions: [] };
    expect(validateSelectedFile({ name: "policy.pdf", size: 20 }, emptyRules).ok).toBe(true);
    expect(validateSelectedFile({ name: "report.docx", size: 20 }, emptyRules).ok).toBe(true);
    expect(validateSelectedFile({ name: "budget.xlsx", size: 20 }, emptyRules).ok).toBe(true);
    expect(validateSelectedFile({ name: "deck.pptx", size: 20 }, emptyRules).ok).toBe(true);
    expect(validateSelectedFile({ name: "readme.md", size: 20 }, emptyRules).ok).toBe(true);
    expect(validateSelectedFile({ name: "readme.markdown", size: 20 }, emptyRules).ok).toBe(true);
    expect(validateSelectedFile({ name: "diagram.png", size: 20 }, emptyRules).ok).toBe(true);
    expect(validateSelectedFile({ name: "photo.jpg", size: 20 }, emptyRules).ok).toBe(true);

    expect(validateSelectedFile({ name: "notes.txt", size: 20 }, emptyRules).ok).toBe(false);
    expect(validateSelectedFile({ name: "page.html", size: 20 }, emptyRules).ok).toBe(false);
    expect(validateSelectedFile({ name: "page.aspx", size: 20 }, emptyRules).ok).toBe(false);
    expect(validateSelectedFile({ name: "vector.svg", size: 20 }, emptyRules).ok).toBe(false);
    expect(validateSelectedFile({ name: "payload.exe", size: 20 }, emptyRules).ok).toBe(false);

    expect(isSupportedExtension(".pdf")).toBe(true);
    expect(isSupportedExtension("md")).toBe(true);
    expect(isSupportedExtension(".markdown")).toBe(true);
    expect(isSupportedExtension(".html")).toBe(false);
    expect(isSupportedExtension(".svg")).toBe(false);

    expect(parseAllowedExtensions(".html,.svg,.exe")).toEqual([
      ".pdf",
      ".docx",
      ".xlsx",
      ".pptx",
      ".md",
      ".png",
      ".jpg",
      ".markdown"
    ]);
    expect(parseAllowedExtensions(".pdf,.html,.docx,.svg")).toEqual([".pdf", ".docx"]);
    expect(effectiveAllowedExtensions([".html", ".aspx"])).toEqual([
      ".pdf",
      ".docx",
      ".xlsx",
      ".pptx",
      ".md",
      ".png",
      ".jpg",
      ".markdown"
    ]);
  });

  it("rejects a file name SharePoint cannot store", () => {
    const result = validateSelectedFile({ name: "bad|name.pdf", size: 20 }, rules);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("file name");
  });

  it("treats .md and .markdown as the same allowed type", () => {
    expect(parseAllowedExtensions(".md")).toEqual([".md", ".markdown"]);
    expect(parseAllowedExtensions("markdown")).toEqual([".markdown", ".md"]);
    expect(parseAllowedExtensions(".pdf, .md")).toEqual([".pdf", ".md", ".markdown"]);
    expect(parseAllowedExtensions(".markdown,.md")).toEqual([".markdown", ".md"]);

    const markdownOnly = { maxFileSizeMb: 50, allowedExtensions: [".markdown"] };
    expect(validateSelectedFile({ name: "guide.md", size: 32 }, markdownOnly).ok).toBe(true);
    expect(validateSelectedFile({ name: "NOTES.MARKDOWN", size: 32 }, markdownOnly).ok).toBe(true);

    const mdOnly = { maxFileSizeMb: 50, allowedExtensions: [".md"] };
    expect(validateSelectedFile({ name: "readme.markdown", size: 32 }, mdOnly).ok).toBe(true);
    expect(validateSelectedFile({ name: "readme.md", size: 32 }, mdOnly).ok).toBe(true);
    expect(validateSelectedFile({ name: "notes.txt", size: 32 }, mdOnly).ok).toBe(false);

    expect(acceptAttribute([".pdf", ".md"])).toBe(".pdf,.md,.markdown");
    expect(acceptAttribute([".markdown"])).toBe(".markdown,.md");
    expect(acceptAttribute([])).toBe(".pdf,.docx,.xlsx,.pptx,.md,.png,.jpg,.markdown");
  });

  it("parses extensions with or without a leading dot and defaults when blank", () => {
    expect(parseAllowedExtensions(" .PDF, docx;.xlsx \n.png")).toEqual([".pdf", ".docx", ".xlsx", ".png"]);
    expect(parseAllowedExtensions("")).toEqual([
      ".pdf",
      ".docx",
      ".xlsx",
      ".pptx",
      ".md",
      ".png",
      ".jpg",
      ".markdown"
    ]);
    expect(parseAllowedExtensions(undefined)).toEqual([
      ".pdf",
      ".docx",
      ".xlsx",
      ".pptx",
      ".md",
      ".png",
      ".jpg",
      ".markdown"
    ]);
  });

  it("clamps the property pane size to 1 through 50 MB", () => {
    expect(normalizeMaxFileSizeMb(undefined)).toBe(50);
    expect(normalizeMaxFileSizeMb("")).toBe(50);
    expect(normalizeMaxFileSizeMb("80")).toBe(50);
    expect(normalizeMaxFileSizeMb(0)).toBe(1);
    expect(normalizeMaxFileSizeMb("12.9")).toBe(12);
    expect(maxFileSizeError("50")).toBe("");
    expect(maxFileSizeError("51")).toContain("1 to 50");
    expect(maxFileSizeError("10.5")).toContain("1 to 50");
  });
});
