import type { IEditableField, IFieldValueMap } from "../models";
import { buildValidateUpdateListItemBody, displayFieldValue, summarizeMetadata, toSharePointDate } from "./metadataPayload";

const fields: IEditableField[] = [
  { internalName: "Title", title: "Document Title", description: "", type: "Text", required: true, choices: [] },
  { internalName: "Notes", title: "Notes", description: "", type: "Note", required: false, choices: [] },
  { internalName: "Department", title: "Department", description: "", type: "Choice", required: true, choices: ["Legal"] },
  { internalName: "Tags", title: "Tags", description: "", type: "MultiChoice", required: false, choices: ["Policy", "Report"] },
  { internalName: "Amount", title: "Amount", description: "", type: "Currency", required: false, choices: [] },
  { internalName: "Pages", title: "Pages", description: "", type: "Number", required: false, choices: [] },
  { internalName: "EffectiveDate", title: "Effective Date", description: "", type: "DateTime", required: true, choices: [] },
  { internalName: "Confidential", title: "Confidential", description: "", type: "Boolean", required: false, choices: [] },
  { internalName: "Link", title: "Link", description: "", type: "URL", required: false, choices: [] },
  { internalName: "Owner", title: "Owner", description: "", type: "User", required: false, choices: [] },
  { internalName: "Reviewer", title: "Reviewer", description: "", type: "User", required: false, choices: [] },
  { internalName: "OptionalText", title: "Optional text", description: "", type: "Text", required: false, choices: [] }
];

const values: IFieldValueMap = {
  Title: "FY26 Policy",
  Notes: "Line one\nLine two",
  Department: "Legal",
  Tags: ["Policy", "Report"],
  Amount: "1000.50",
  Pages: "12",
  EffectiveDate: "2026-10-28",
  Confidential: true,
  Link: "https://contoso.test/policy",
  Owner: "alex@contoso.com",
  Reviewer: "Alex Morgan",
  OptionalText: "   "
};

describe("ValidateUpdateListItem payload", () => {
  it("formats each supported column and omits empty optional text", () => {
    const body = buildValidateUpdateListItemBody(fields, values);
    expect(body.bNewDocumentUpdate).toBe(true);
    expect(body.formValues).toEqual([
      { FieldName: "Title", FieldValue: "FY26 Policy" },
      { FieldName: "Notes", FieldValue: "Line one\nLine two" },
      { FieldName: "Department", FieldValue: "Legal" },
      { FieldName: "Tags", FieldValue: "Policy;#Report" },
      { FieldName: "Amount", FieldValue: "1000.50" },
      { FieldName: "Pages", FieldValue: "12" },
      { FieldName: "EffectiveDate", FieldValue: "10/28/2026" },
      { FieldName: "Confidential", FieldValue: "1" },
      { FieldName: "Link", FieldValue: "https://contoso.test/policy, https://contoso.test/policy" },
      { FieldName: "Owner", FieldValue: "[{'Key':'i:0#.f|membership|alex@contoso.com'}]" },
      { FieldName: "Reviewer", FieldValue: "[{'Key':'Alex Morgan'}]" }
    ]);
  });

  it("sends an unchecked boolean as 0 and a date as M/D/YYYY", () => {
    const body = buildValidateUpdateListItemBody(
      [{ internalName: "Confidential", title: "Confidential", description: "", type: "Boolean", required: false, choices: [] }],
      { Confidential: false }
    );
    expect(body.formValues[0].FieldValue).toBe("0");
    expect(toSharePointDate("2026-01-05")).toBe("1/5/2026");
  });

  it("summarizes the values a person entered", () => {
    const summary = summarizeMetadata(fields, values);
    expect(summary.find((item) => item.internalName === "Confidential")).toEqual({
      internalName: "Confidential",
      title: "Confidential",
      value: "Yes"
    });
    expect(summary.find((item) => item.internalName === "Tags")?.value).toBe("Policy, Report");
    expect(summary.find((item) => item.internalName === "OptionalText")).toBeUndefined();
    expect(displayFieldValue(fields[7], false)).toBe("No");
  });
});
