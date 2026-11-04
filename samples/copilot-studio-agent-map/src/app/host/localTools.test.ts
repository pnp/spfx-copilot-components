import type { CallToolResult } from "./bridge";

const result: CallToolResult = { content: [] };
const handlers = {
  showAgentMap: jest.fn(async () => result),
  getAgentMap: jest.fn(async () => result),
  getConnectedAgentMap: jest.fn(async () => result),
};

// The rig runs the compiled tests without a transform, so jest.mock is not hoisted.
// Register the mock first, then load the tools with a dynamic import.
jest.doMock("../tools/agentMapTools", () => handlers);

async function call(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
  // eslint-disable-next-line @rushstack/import-requires-chunk-name -- Jest loads this module; webpack does not bundle tests.
  const { callLocalTool } = await import("./localTools");
  return callLocalTool({ name, arguments: args });
}

const DEFAULT_ENVIRONMENT_ID = "Default-0a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d";
const AGENT_ID = "00000000-0000-0000-0000-0000000000a1";
const COMPONENT_ID = "00000000-0000-0000-0000-0000000000c1";

describe("callLocalTool", () => {
  it("accepts the ID of the default environment", async () => {
    const input = { environmentId: DEFAULT_ENVIRONMENT_ID, agentId: AGENT_ID, componentIdUnique: COMPONENT_ID };

    await expect(call("show_agent_map", { environmentId: DEFAULT_ENVIRONMENT_ID })).resolves.toBe(result);
    await expect(call("get_agent_map", input)).resolves.toBe(result);
    expect(handlers.showAgentMap).toHaveBeenCalledWith({ environmentId: DEFAULT_ENVIRONMENT_ID });
    expect(handlers.getAgentMap).toHaveBeenCalledWith(input);
  });

  it("rejects an environment ID that is not valid", async () => {
    const response = await call("get_connected_agent_map", { environmentId: "Contoso", targetSchemaName: "cr123_helper" });

    expect(response).toMatchObject({ isError: true, structuredContent: { error: { code: "INVALID_INPUT" } } });
    expect(handlers.getConnectedAgentMap).not.toHaveBeenCalled();
  });
});
