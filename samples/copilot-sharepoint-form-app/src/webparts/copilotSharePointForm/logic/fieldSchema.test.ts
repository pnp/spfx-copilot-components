import { groupFields, parseFieldPayload, validateFormValues } from "./fieldSchema";
import type { IRawSharePointField } from "./fieldSchema";

const rawFields: IRawSharePointField[] = [
  { InternalName: "FileLeafRef", Title: "Name", TypeAsString: "File", Required: true, Hidden: false, ReadOnlyField: false },
  { InternalName: "ContentType", Title: "Content Type", TypeAsString: "Computed", Required: false, Hidden: false, ReadOnlyField: false },
  { InternalName: "Attachments", Title: "Attachments", TypeAsString: "Attachments", Required: false, Hidden: false, ReadOnlyField: false },
  { InternalName: "Order", Title: "Order", TypeAsString: "Number", Required: false, Hidden: false, ReadOnlyField: false },
  { InternalName: "Editor", Title: "Modified By", TypeAsString: "User", Required: false, Hidden: false, ReadOnlyField: true },
  { InternalName: "Secret", Title: "Secret", TypeAsString: "Text", Required: true, Hidden: true, ReadOnlyField: false },
  { InternalName: "_ComplianceFlags", Title: "Label flags", TypeAsString: "Text", Required: false, Hidden: false, ReadOnlyField: false },
  { InternalName: "CategoryLookup", Title: "Category lookup", TypeAsString: "Lookup", Required: false, Hidden: false, ReadOnlyField: false },
  { InternalName: "Title", Title: "Document Title", TypeAsString: "Text", Required: true, Description: "Visible name" },
  { InternalName: "Department", Title: "Department", TypeAsString: "Choice", Required: true, Choices: ["Legal", "Finance"] },
  { InternalName: "Tags", Title: "Tags", TypeAsString: "MultiChoice", Required: false, Choices: { results: ["Policy", "Report"] } },
  { InternalName: "Amount", Title: "Amount", TypeAsString: "Currency", Required: false },
  { InternalName: "Pages", Title: "Pages", TypeAsString: "Number", Required: false },
  { InternalName: "EffectiveDate", Title: "Effective Date", TypeAsString: "DateTime", Required: true },
  { InternalName: "Confidential", Title: "Confidential", TypeAsString: "Boolean", Required: false },
  { InternalName: "Link", Title: "Link", TypeAsString: "URL", Required: false },
  { InternalName: "Owner", Title: "Owner", TypeAsString: "User", Required: false },
  { InternalName: "Notes", Title: "Notes", TypeAsString: "Note", Required: false }
];

describe("field schema", () => {
  it("drops system columns and splits the rest into required and optional", () => {
    const groups = parseFieldPayload({ value: rawFields });
    expect(groups.required.map((field) => field.internalName)).toEqual(["Title", "Department", "EffectiveDate"]);
    expect(groups.optional.map((field) => field.internalName)).toEqual([
      "Tags",
      "Amount",
      "Pages",
      "Confidential",
      "Link",
      "Owner",
      "Notes"
    ]);
    expect(groups.required[0].description).toBe("Visible name");
    expect(groups.required[1].choices).toEqual(["Legal", "Finance"]);
    expect(groups.optional[0].choices).toEqual(["Policy", "Report"]);
    expect(groups.required.every((field) => field.required)).toBe(true);
    expect(groups.optional.every((field) => !field.required)).toBe(true);
  });

  it("reads the verbose OData results shape", () => {
    const groups = parseFieldPayload({
      d: {
        results: [
          { InternalName: "Title", Title: "Title", TypeAsString: "Text", Required: false }
        ]
      }
    });
    expect(groupFields(groups.required.concat(groups.optional)).optional[0].internalName).toBe("Title");
  });

  it("requires a value for required columns and a real number, date, or URL when one is entered", () => {
    const fields = parseFieldPayload({ value: rawFields });
    const all = fields.required.concat(fields.optional);
    const missing = validateFormValues(all, { Confidential: false });
    expect(missing.Title).toBe("Document Title is required.");
    expect(missing.Department).toBe("Department is required.");
    expect(missing.EffectiveDate).toBe("Effective Date is required.");
    expect(missing.Confidential).toBeUndefined();
    expect(missing.Notes).toBeUndefined();

    const invalid = validateFormValues(all, {
      Title: "Policy",
      Department: "Legal",
      EffectiveDate: "October",
      Pages: "many",
      Link: "contoso.sharepoint.com",
      Confidential: false
    });
    expect(invalid.EffectiveDate).toContain("must be a date");
    expect(invalid.Pages).toContain("must be a number");
    expect(invalid.Link).toContain("https://");
  });
});
