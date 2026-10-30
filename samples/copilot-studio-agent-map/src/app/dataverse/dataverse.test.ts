import { configureHostRuntime } from "../host/runtime";
import { discoverEnvironments, GLOBAL_DISCOVERY_RESOURCE } from "./dataverse";

const TENANT_ID = "0a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d";
const ENVIRONMENT_ID = "00000000-0000-0000-0000-0000000000d1";

describe("discoverEnvironments", () => {
  it("lists the default environment and skips an ID that is not valid", async () => {
    const rows = [
      { ApiUrl: "https://kitdev.crm.dynamics.com", FriendlyName: "Copilot Studio Kit - Dev", EnvironmentId: ENVIRONMENT_ID, State: 0 },
      { ApiUrl: "https://contoso.crm.dynamics.com", FriendlyName: "Contoso (default)", EnvironmentId: `Default-${TENANT_ID.toUpperCase()}`, State: 0 },
      { ApiUrl: "https://other.crm.dynamics.com", FriendlyName: "Other", EnvironmentId: "other", State: 0 },
    ];
    const fetchMock = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ value: rows }) }) as unknown as Response);
    configureHostRuntime({ fetch: fetchMock });

    const environments = await discoverEnvironments();

    expect(environments.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: `Default-${TENANT_ID}`, name: "Contoso (default)" },
      { id: ENVIRONMENT_ID, name: "Copilot Studio Kit - Dev" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(GLOBAL_DISCOVERY_RESOURCE, expect.any(String), expect.any(Object));
  });
});
