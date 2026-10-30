import { ENVIRONMENT_ID_PATTERN, normalizeEnvironmentId, requireEnvironmentId } from "./environmentId";

const TENANT_ID = "0a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d";

describe("normalizeEnvironmentId", () => {
  it("gives a GUID in lower case without braces", () => {
    expect(normalizeEnvironmentId(TENANT_ID.toUpperCase())).toBe(TENANT_ID);
    expect(normalizeEnvironmentId(` {${TENANT_ID}} `)).toBe(TENANT_ID);
  });

  it.each([
    `Default-${TENANT_ID}`,
    `default-${TENANT_ID.toUpperCase()}`,
    `DEFAULT-${TENANT_ID}`,
    `{Default-${TENANT_ID}}`,
  ])("gives Default-<tenant ID> for the default environment in %p", (value) => {
    expect(normalizeEnvironmentId(value)).toBe(`Default-${TENANT_ID}`);
  });

  it.each([
    "",
    "Default-",
    "Default-abc",
    "Contoso",
    `${TENANT_ID}-x`,
    `x${TENANT_ID}`,
    `Default-{${TENANT_ID}}`,
    `Default-${TENANT_ID}/agents`,
    42,
    undefined,
  ])("rejects %p", (value) => {
    expect(normalizeEnvironmentId(value)).toBeUndefined();
  });
});

describe("ENVIRONMENT_ID_PATTERN", () => {
  it("accepts a GUID and the ID of the default environment", () => {
    expect(ENVIRONMENT_ID_PATTERN.test(TENANT_ID)).toBe(true);
    expect(ENVIRONMENT_ID_PATTERN.test(`Default-${TENANT_ID}`)).toBe(true);
    expect(ENVIRONMENT_ID_PATTERN.test(`{${TENANT_ID}}`)).toBe(false);
  });
});

describe("requireEnvironmentId", () => {
  it("gives the ID in one form", () => {
    expect(requireEnvironmentId(`default-${TENANT_ID.toUpperCase()}`)).toBe(`Default-${TENANT_ID}`);
  });

  it("throws an INVALID_ID error for a value that is not valid", () => {
    expect(() => requireEnvironmentId("Contoso")).toThrow(expect.objectContaining({ code: "INVALID_ID" }));
  });
});
