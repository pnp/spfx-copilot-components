import type { CallToolResult } from "../host/bridge.js";
import type { ReviewAgent, ReviewEnvironment } from "../dataverse/errors";

const environments: ReviewEnvironment[] = [
  { id: "00000000-0000-0000-0000-0000000000d1", name: "Copilot Studio Kit - Dev", region: "unitedstates" },
  { id: "00000000-0000-0000-0000-0000000000d2", name: "Copilot Studio Kit - Test", region: "unitedstates" },
];

function agent(id: string, name: string, harness: ReviewAgent["harness"]): ReviewAgent {
  return { id, name, componentIdUnique: `component-${id}`, harness };
}

const agents: ReviewAgent[] = [
  agent("a1", "ZAVA Visual Merchandizer", "copilot"),
  agent("a2", "Contoso Sales Bot", "copilot"),
  agent("a3", "Contoso Sale Bots", "copilot"),
  agent("a4", "Classic Helpdesk", "standard"),
];

const service = {
  listEnvironments: jest.fn(async () => environments),
  listAgents: jest.fn(async (_environmentId: string) => agents),
  getAgentMap: jest.fn(async (_environmentId: string, agentId: string, _componentIdUnique: string) => ({
    agent: { id: agentId, name: agents.find((item) => item.id === agentId)?.name ?? "" },
  })),
  getConnectedAgentMap: jest.fn(),
};

// The rig runs the compiled tests without a transform, so jest.mock is not hoisted.
// Register the mock first, then load the tools with a dynamic import.
jest.doMock("../dataverse/agentMapService", () => service);

async function show(input: Record<string, string>): Promise<CallToolResult> {
  // eslint-disable-next-line @rushstack/import-requires-chunk-name -- Jest loads this module; webpack does not bundle tests.
  const { showAgentMap } = await import("./agentMapTools");
  return showAgentMap(input);
}

describe("showAgentMap", () => {
  it("builds the map when the names have small differences", async () => {
    const result = await show({
      environmentName: "Copilot Studio Kit – dev.",
      agentName: "Zava visual merchandiser",
    });

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({
      state: "map",
      environmentId: environments[0].id,
      agentId: "a1",
      componentIdUnique: "component-a1",
    });
    expect(service.getAgentMap).toHaveBeenCalledWith(environments[0].id, "a1", "component-a1");
  });

  it("lets the user choose when no environment matches", async () => {
    const result = await show({ environmentName: "Production", agentName: "Contoso Sales Bot" });

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({
      state: "mapSelecting",
      environments,
      agents: [],
      error: {
        code: "ENVIRONMENT_NOT_FOUND",
        message: "No environment matches \"Production\". Choose an environment.",
      },
    });
    expect(service.listAgents).not.toHaveBeenCalled();
  });

  it("lets the user choose when more than one environment matches", async () => {
    service.listEnvironments.mockResolvedValueOnce([
      ...environments,
      { id: "00000000-0000-0000-0000-0000000000d3", name: "copilot studio kit - dev", region: "europe" },
    ]);

    const result = await show({ environmentName: "Copilot Studio Kit - Dev" });

    expect(result.structuredContent).toMatchObject({
      state: "mapSelecting",
      agents: [],
      error: {
        code: "ENVIRONMENT_AMBIGUOUS",
        message: "More than one environment matches \"Copilot Studio Kit - Dev\". Choose an environment.",
      },
    });
    expect(service.listAgents).not.toHaveBeenCalled();
  });

  it("uses the only environment when the conversation names only an agent", async () => {
    service.listEnvironments.mockResolvedValueOnce([environments[0]]);

    const result = await show({ agentName: "Contoso Sales Bot" });

    expect(result.structuredContent).toMatchObject({
      state: "map",
      environmentId: environments[0].id,
      agentId: "a2",
    });
  });

  it("finds the default environment by its name without \"(default)\"", async () => {
    const contoso: ReviewEnvironment = {
      id: "Default-00000000-0000-0000-0000-0000000000aa",
      name: "Contoso (default)",
      region: "unitedstates",
    };
    service.listEnvironments.mockResolvedValueOnce([...environments, contoso]);

    const result = await show({ environmentName: "Contoso", agentName: "ZAVA Visual Merchandizer" });

    expect(result.structuredContent).toMatchObject({ state: "map", environmentId: contoso.id, agentId: "a1" });
    expect(service.listAgents).toHaveBeenCalledWith(contoso.id);
    expect(service.getAgentMap).toHaveBeenCalledWith(contoso.id, "a1", "component-a1");
  });

  it("prefers a GitHub Copilot harness agent to a standard agent with the same name", async () => {
    service.listAgents.mockResolvedValueOnce([agent("a5", "Zava Visual Merchandiser", "standard"), ...agents]);

    const result = await show({
      environmentName: "Copilot Studio Kit - Dev",
      agentName: "Zava Visual Merchandiser",
    });

    expect(result.structuredContent).toMatchObject({ state: "map", agentId: "a1" });
  });

  it("lets the user choose when no agent matches", async () => {
    const result = await show({ environmentName: "Copilot Studio Kit - Dev", agentName: "Fabrikam" });

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({
      state: "mapSelecting",
      environmentId: environments[0].id,
      environment: environments[0],
      agents: agents.filter((item) => item.harness === "copilot"),
      error: {
        code: "AGENT_NOT_FOUND",
        message: "No agent matches \"Fabrikam\" in Copilot Studio Kit - Dev. Choose an agent.",
      },
    });
    expect(service.getAgentMap).not.toHaveBeenCalled();
  });

  it("lets the user choose when more than one agent matches", async () => {
    const result = await show({ environmentName: "Copilot Studio Kit - Dev", agentName: "Contoso Sales Bots" });

    expect(result.structuredContent).toMatchObject({
      state: "mapSelecting",
      error: { code: "AGENT_AMBIGUOUS" },
    });
  });

  it("tells the user when the agent does not use the GitHub Copilot harness", async () => {
    const result = await show({ environmentName: "Copilot Studio Kit - Dev", agentName: "Classic Helpdesk" });

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({
      state: "mapSelecting",
      error: {
        code: "AGENT_MAP_UNSUPPORTED",
        message: "The agent that matches \"Classic Helpdesk\" does not use the GitHub Copilot harness. "
          + "Choose a GitHub Copilot harness agent.",
      },
    });
  });

  it("asks for an agent without a message when the conversation names none", async () => {
    const result = await show({ environmentId: environments[1].id });

    expect(result.structuredContent).toMatchObject({
      state: "mapSelecting",
      environmentId: environments[1].id,
    });
    expect(result.structuredContent).not.toHaveProperty("error");
  });
});
