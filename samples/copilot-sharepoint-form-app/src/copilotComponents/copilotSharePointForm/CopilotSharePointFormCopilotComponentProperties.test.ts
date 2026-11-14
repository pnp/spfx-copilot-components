import propertiesSchema from "./CopilotSharePointFormCopilotComponentProperties";

const FORBIDDEN = ["minLength", "maxLength", "minimum", "maximum", "pattern", "default", "min", "max", "regex", "format"];

describe("OpenDocumentSubmissionForm properties", () => {
  const schema = propertiesSchema as {
    properties?: { [name: string]: { type?: string; description?: string } };
    required?: string[];
  };

  it("exposes only string arguments and does not accept a file", () => {
    expect(Object.keys(schema).sort()).toEqual(["properties", "type"]);
    expect(JSON.stringify(propertiesSchema)).not.toContain("$schema");
    expect(JSON.stringify(propertiesSchema)).not.toContain("additionalProperties");
    const properties = schema.properties || {};
    expect(Object.keys(properties).sort()).toEqual(["allowedExtensions", "libraryName", "libraryTitle", "maxFileSizeMb", "siteUrl"]);
    expect(properties.libraryName.type).toBe("string");
    expect(properties.siteUrl.type).toBe("string");
    expect(properties.libraryTitle.type).toBe("string");
    expect(properties.maxFileSizeMb.type).toBe("string");
    expect(properties.allowedExtensions.type).toBe("string");
    expect(schema.required || []).toEqual([]);
    expect(schema.required || []).not.toContain("siteUrl");
    expect(schema.required || []).not.toContain("libraryTitle");
    expect(schema.required || []).not.toContain("libraryName");
    expect(schema.required || []).not.toContain("maxFileSizeMb");
    expect(schema.required || []).not.toContain("allowedExtensions");

    const descriptions = [
      properties.siteUrl.description || "",
      properties.libraryTitle.description || "",
      properties.maxFileSizeMb.description || "",
      properties.allowedExtensions.description || ""
    ].join(" ");
    expect(descriptions).toContain("https://contoso.sharepoint.com/sites/policies");
    expect(descriptions).toContain("Documents");
    expect(descriptions).toContain("does not accept a file");
    expect(JSON.stringify(propertiesSchema)).not.toContain("\"file\"");
  });

  it("does not emit constraint keywords the Copilot tool schema rejects", () => {
    const found: string[] = [];
    walk(propertiesSchema, found);
    expect(found).toEqual([]);
  });
});

function walk(node: unknown, found: string[]): void {
  if (!node || typeof node !== "object") {
    return;
  }
  const record = node as { [key: string]: unknown };
  const keys = Object.keys(record);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (FORBIDDEN.indexOf(key) >= 0) {
      found.push(key);
    }
    walk(record[key], found);
  }
}
