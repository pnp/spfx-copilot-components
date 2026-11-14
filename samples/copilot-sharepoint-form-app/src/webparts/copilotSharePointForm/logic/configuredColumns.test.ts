import type { IEditableField } from "../models";
import { parseConfiguredColumns, resolveFormColumns } from "./configuredColumns";

const libraryFields: IEditableField[] = [
  { internalName: "Title", title: "Title", description: "", type: "Text", required: true, choices: [] },
  { internalName: "Description", title: "Description", description: "Longer note", type: "Note", required: false, choices: [] },
  { internalName: "Department", title: "Department", description: "", type: "Choice", required: false, choices: ["Legal", "Finance"] },
  { internalName: "Owner", title: "Owner", description: "", type: "User", required: false, choices: [] },
  { internalName: "Reviewers", title: "Reviewers", description: "", type: "User", required: true, choices: [] },
  { internalName: "EffectiveDate", title: "Effective Date", description: "", type: "DateTime", required: true, choices: [] }
];

describe("author-defined form columns", () => {
  it("auto-hydrates Text, Note, and Choice and drops Person columns", () => {
    const fields = resolveFormColumns([], libraryFields);
    expect(fields.map((field) => field.internalName)).toEqual(["Title", "Description", "Department"]);
    expect(fields.map((field) => field.type)).toEqual(["Text", "Note", "Choice"]);
    expect(fields.some((field) => field.type === "User")).toBe(false);
  });

  it("uses the author's label, type, required flag, and choice override", () => {
    const parsed = parseConfiguredColumns(JSON.stringify([
      { internalName: "Title", label: "Document Title", type: "Text", required: false },
      { internalName: "Description", label: "Summary", type: "Note", required: true },
      { internalName: "Department", label: "Team", type: "Choice", required: true, choices: ["People", "Legal"] },
      { internalName: "Owner", label: "Owner", type: "User", required: true }
    ]));
    expect(parsed.error).toBeUndefined();
    const fields = resolveFormColumns(parsed.columns, libraryFields);
    expect(fields.map((field) => field.title)).toEqual(["Document Title", "Summary", "Team"]);
    expect(fields[0].required).toBe(true);
    expect(fields[1].required).toBe(true);
    expect(fields[1].type).toBe("Note");
    expect(fields[2].choices).toEqual(["People", "Legal"]);
    expect(fields[2].required).toBe(true);
  });

  it("hydrates choice options from the library when the author does not override them", () => {
    const parsed = parseConfiguredColumns(JSON.stringify([
      { internalName: "Department", label: "Department", type: "Choice", required: false }
    ]));
    const fields = resolveFormColumns(parsed.columns, libraryFields);
    expect(fields[0].choices).toEqual(["Legal", "Finance"]);
  });

  it("reports invalid JSON instead of guessing columns", () => {
    expect(parseConfiguredColumns("{").error).toContain("valid JSON");
    expect(parseConfiguredColumns("").columns).toEqual([]);
  });
});
