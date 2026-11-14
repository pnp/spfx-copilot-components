import { parseAgentsExperience, type BotComponent } from "../copilot-studio/core";
import { buildDeterministicAgentMap } from "./builder";

const configuration = JSON.stringify({
  agentSettings: { instructions: "Help store teams plan displays." },
});

function component(name: string, data: string, schemaname: string): BotComponent {
  return {
    botcomponentid: `id-${name}`,
    botid: "bot-1",
    componenttype: "9",
    content: "",
    data,
    name,
    componentidunique: `unique-${name}`,
    schemaname,
  };
}

const workIq = (capability: string, access?: string): BotComponent =>
  component(
    capability,
    ["kind: IQCapability", `capability: ${capability}`, ...(access ? [`access: ${access}`] : [])].join("\r\n"),
    `contoso_agent.iqCapability.${capability}_Abc`,
  );

const connectorTool = component(
  "Photo Library",
  "kind: ConnectorTool\r\nconnectionReference: contoso_photos",
  "contoso_agent.action.PhotoLibrary",
);

function buildMap(components: BotComponent[]) {
  const model = parseAgentsExperience(configuration, components);
  const graph = buildDeterministicAgentMap({
    agentId: "agent-1",
    agentName: "Store Agent",
    environmentId: "env-1",
    environmentName: "Contoso",
    model,
    corpusComponents: [],
  });
  return { model, graph };
}

describe("Work IQ sources", () => {
  const sources = ["teams", "calendar", "mail", "files", "people", "sites"];

  it("parses each IQCapability component as a Work IQ source", () => {
    const { model } = buildMap(sources.map((source) => workIq(source, "Write")));

    expect(model.unknownKinds).toEqual([]);
    expect(model.workIq).toHaveLength(6);
    expect(model.workIq?.find((source) => source.capability === "mail")).toEqual({
      name: "mail",
      capability: "mail",
      access: "Write",
      schemaname: "contoso_agent.iqCapability.mail_Abc",
      componentId: "id-mail",
      componentIdUnique: "unique-mail",
    });
  });

  it("shows all sources as one Work IQ tool node", () => {
    const { graph } = buildMap([connectorTool, ...sources.map((source) => workIq(source, "Write"))]);

    const workIqNodes = graph.nodes.filter((node) => node.label === "Work IQ");
    expect(workIqNodes).toHaveLength(1);
    expect(workIqNodes[0]).toMatchObject({
      id: "tool:work-iq",
      category: "tool",
      parentId: "agent:agent-1",
      subtitle: "Work IQ tool, 6 sources",
    });
    expect(workIqNodes[0].details.Sources).toEqual([
      "calendar (Write)",
      "files (Write)",
      "mail (Write)",
      "people (Write)",
      "sites (Write)",
      "teams (Write)",
    ]);
    expect(graph.nodes.filter((node) => node.category === "unknown")).toEqual([]);
    expect(graph.summary.unresolvedCount).toBe(0);
    expect(graph.edges).toContainEqual(expect.objectContaining({
      source: "agent:agent-1",
      target: "tool:work-iq",
      relationship: "contains",
    }));

    const agent = graph.nodes.find((node) => node.category === "agent");
    expect(agent?.details.Tools).toBe(2);
    expect(agent?.details["Work IQ sources"]).toBe(6);
  });

  it("does not invent an access level", () => {
    const { graph } = buildMap([workIq("mail")]);

    const node = graph.nodes.find((candidate) => candidate.id === "tool:work-iq");
    expect(node?.subtitle).toBe("Work IQ tool, 1 source");
    expect(node?.details.Sources).toEqual(["mail (access not captured)"]);
  });

  it("adds no Work IQ node when the agent has no Work IQ sources", () => {
    const { graph } = buildMap([connectorTool]);

    expect(graph.nodes.some((node) => node.id === "tool:work-iq")).toBe(false);
    const agent = graph.nodes.find((node) => node.category === "agent");
    expect(agent?.details.Tools).toBe(1);
    expect(agent?.details).not.toHaveProperty("Work IQ sources");
  });
});
