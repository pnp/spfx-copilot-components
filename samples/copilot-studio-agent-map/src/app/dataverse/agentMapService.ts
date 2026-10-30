/**
 * Read-only Dataverse source for the Agent Map. The queries and the checks are the
 * same as in the Agent Review app. The map needs only the agent configuration,
 * the agent components, and the SKILL.md of each zip-bundle skill.
 */
import { buildDeterministicAgentMap } from "../agent-map/builder.js";
import type { AgentMapGraph } from "../agent-map/types.js";
import {
  parseAgentsExperience,
  redactSecrets,
  sanitizeModelForPersistence,
  usesCopilotHarness,
  type BotComponent,
  type SkillReviewCorpusComponent,
} from "../copilot-studio/core/index.js";
import { DataverseClient, discoverEnvironments, escapeOData, guid, type DiscoveryEnvironment } from "./dataverse";
import { requireEnvironmentId } from "./environmentId";
import { AgentMapError, type Guid, type ReviewAgent, type ReviewEnvironment } from "./errors";
import { readSkillMarkdown, skillResources } from "./skillMarkdown";

interface BotRow {
  botid: string;
  name?: string;
  schemaname?: string;
  componentidunique?: string;
  configuration?: string;
  modifiedon?: string;
  iconbase64?: string;
}

interface ComponentRow extends Record<string, unknown> {
  botcomponentid: string;
  componentidunique?: string;
  name?: string;
  schemaname?: string;
  componenttype?: number;
  content?: string;
  data?: string;
  modifiedon?: string;
}

/** True for the agents that use the generative orchestration configuration. */
function modernConfiguration(configuration: string | undefined): boolean {
  if (!configuration) return false;
  try {
    const parsed = JSON.parse(configuration) as {
      settings?: { GenerativeActionsEnabled?: boolean };
      agentSettings?: unknown;
    };
    return (parsed.settings?.GenerativeActionsEnabled ?? false)
      || parsed.agentSettings !== undefined;
  } catch {
    return false;
  }
}

function mapComponent(row: ComponentRow, botId: Guid): BotComponent {
  return {
    botcomponentid: row.botcomponentid,
    botid: botId,
    name: String(row.name ?? ""),
    schemaname: String(row.schemaname ?? ""),
    componenttype: String(row.componenttype ?? ""),
    componentidunique: String(row.componentidunique ?? ""),
    content: typeof row.content === "string" ? row.content : "",
    data: typeof row.data === "string" ? row.data : "",
    description: typeof row.description === "string" ? row.description : undefined,
    parentbotid: botId,
    parentbotcomponentid: typeof row._parentbotcomponentid_value === "string" ? row._parentbotcomponentid_value : undefined,
    filedata_name: typeof row.filedata_name === "string" ? row.filedata_name : undefined,
    componentstate: typeof row.componentstate === "number" ? row.componentstate : undefined,
    statecode: typeof row.statecode === "number" ? row.statecode : undefined,
    statuscode: typeof row.statuscode === "number" ? row.statuscode : undefined,
    versionnumber: typeof row.versionnumber === "number" ? row.versionnumber : undefined,
    modifiedon: row.modifiedon ? new Date(row.modifiedon) : undefined,
  };
}

function mapAgents(rows: BotRow[], query = "", includeIcons = false): ReviewAgent[] {
  const needle = query.trim().toLocaleLowerCase();
  return rows
    .filter((row) => modernConfiguration(row.configuration))
    .filter((row) => !needle || String(row.name ?? "").toLocaleLowerCase().includes(needle))
    .map((row) => ({
      id: guid(row.botid),
      name: row.name?.trim() || "Unnamed agent",
      componentIdUnique: guid(row.componentidunique ?? ""),
      modifiedOn: row.modifiedon,
      ...(includeIcons ? { iconBase64: row.iconbase64?.trim() || undefined } : {}),
      harness: usesCopilotHarness(row.configuration) ? "copilot" as const : "standard" as const,
    }));
}

async function resolveEnvironment(id: string): Promise<DiscoveryEnvironment> {
  const environmentId = requireEnvironmentId(id);
  const environment = (await discoverEnvironments()).find((item) => item.id === environmentId);
  if (!environment) throw new AgentMapError("ENVIRONMENT_NOT_FOUND", "The selected environment is unavailable.");
  return environment;
}

export async function listEnvironments(): Promise<ReviewEnvironment[]> {
  return (await discoverEnvironments()).map(({ id, name, region }) => ({ id, name, region }));
}

export async function listAgents(environmentId: string, query = "", includeIcons = false): Promise<ReviewAgent[]> {
  const environment = await resolveEnvironment(environmentId);
  const rows = await new DataverseClient(environment.apiUrl).list<BotRow>(
    `bots?$select=botid,name,componentidunique,configuration,modifiedon${includeIcons ? ",iconbase64" : ""}&$filter=${encodeURIComponent("statecode eq 0")}&$orderby=name asc&$top=250`,
  );
  return mapAgents(rows, query, includeIcons);
}

async function readSource(client: DataverseClient, agentId: Guid): Promise<{
  agent: ReviewAgent;
  configuration: string;
  components: BotComponent[];
}> {
  const bots = await client.list<BotRow>(
    `bots?$select=botid,name,componentidunique,configuration,modifiedon,iconbase64&$filter=${encodeURIComponent(`statecode eq 0 and botid eq ${agentId}`)}&$top=1`,
  );
  const bot = bots[0];
  if (!bot || !modernConfiguration(bot.configuration)) {
    throw new AgentMapError(
      "UNSUPPORTED_AGENT",
      "The selected agent is not an active supported Copilot Studio agent.",
    );
  }
  const componentRows = await client.list<ComponentRow>(
    `botcomponents?$select=botcomponentid,name,description,componenttype,content,data,componentidunique,schemaname,modifiedon,_parentbotcomponentid_value,componentstate,statecode,statuscode,versionnumber,filedata_name&$filter=${encodeURIComponent(`_parentbotid_value eq ${agentId}`)}&$orderby=name asc`,
  );
  return {
    agent: {
      id: agentId,
      name: bot.name?.trim() || "Unnamed agent",
      componentIdUnique: guid(bot.componentidunique ?? ""),
      modifiedOn: bot.modifiedon,
      iconBase64: bot.iconbase64?.trim() || undefined,
      harness: usesCopilotHarness(bot.configuration) ? "copilot" : "standard",
    },
    configuration: bot.configuration ?? "",
    components: componentRows.map((row) => mapComponent(row, agentId)),
  };
}

export async function getAgentMap(
  environmentId: string,
  agentIdValue: string,
  componentIdUniqueValue: string,
): Promise<AgentMapGraph> {
  const environment = await resolveEnvironment(environmentId);
  const agentId = guid(agentIdValue);
  const componentIdUnique = guid(componentIdUniqueValue);
  const client = new DataverseClient(environment.apiUrl);
  const { agent, configuration, components } = await readSource(client, agentId);
  if (agent.componentIdUnique !== componentIdUnique) {
    throw new AgentMapError(
      "AGENT_CHANGED",
      "The selected agent changed. Refresh the agent list and try again.",
    );
  }

  const model = parseAgentsExperience(configuration, [...components]);
  const zipSkillCount = model.skills.filter((skill) => skill.source === "zip-bundle").length;
  // The skill text that the map reads for capability references. Secrets are removed first.
  const corpusComponents: SkillReviewCorpusComponent[] = await Promise.all(
    model.skills
      .filter((skill) => skill.componentId)
      .map(async (skill) => ({
        skillComponentId: skill.componentId,
        skillSchemaName: skill.schemaname,
        skill_markdown: redactSecrets(skill.source === "zip-bundle"
          ? await readSkillMarkdown(client, skillResources(skill, components, zipSkillCount))
          : skill.markdown),
      })),
  );

  const connectedSchemaNames = [...new Set(
    model.connectedAgents
      .map((connectedAgent) => connectedAgent.botSchemaName?.trim())
      .filter((schemaName): schemaName is string => Boolean(schemaName)),
  )];
  const connectedAgentIcons = connectedSchemaNames.length > 0
    ? await client.list<BotRow>(
        `bots?$select=schemaname,iconbase64&$filter=${encodeURIComponent(
          `statecode eq 0 and componentstate eq 0 and (${
            connectedSchemaNames
              .map((schemaName) => `schemaname eq '${escapeOData(schemaName)}'`)
              .join(" or ")
          })`,
        )}`,
      )
    : [];
  const agentIcons = Object.fromEntries(
    connectedAgentIcons.flatMap((connectedAgent) => {
      const schemaName = connectedAgent.schemaname?.trim().toLocaleLowerCase();
      const icon = connectedAgent.iconbase64?.trim();
      return schemaName && icon ? [[schemaName, icon]] : [];
    }),
  );

  return buildDeterministicAgentMap({
    agentId: agent.id,
    agentName: agent.name,
    agentIconBase64: agent.iconBase64,
    environmentId: environment.id,
    environmentName: environment.name,
    model: sanitizeModelForPersistence(model),
    corpusComponents,
    agentIcons,
  });
}

export async function getConnectedAgentMap(
  environmentId: string,
  targetSchemaName: string,
): Promise<AgentMapGraph> {
  const environment = await resolveEnvironment(environmentId);
  const schemaName = targetSchemaName.trim();
  if (!schemaName) {
    throw new AgentMapError(
      "CONNECTED_AGENT_SCHEMA_MISSING",
      "The connected agent does not declare a target schema.",
    );
  }
  const matches = await new DataverseClient(environment.apiUrl).list<BotRow>(
    `bots?$select=botid,name,componentidunique,configuration&$filter=${encodeURIComponent(
      `statecode eq 0 and componentstate eq 0 and schemaname eq '${escapeOData(schemaName)}'`,
    )}&$top=2`,
  );
  if (matches.length === 0) {
    throw new AgentMapError(
      "CONNECTED_AGENT_NOT_FOUND",
      `No active published agent matched schema "${schemaName}".`,
    );
  }
  if (matches.length > 1) {
    throw new AgentMapError(
      "CONNECTED_AGENT_AMBIGUOUS",
      `More than one active published agent matched schema "${schemaName}".`,
    );
  }
  const target = matches[0];
  return getAgentMap(
    environment.id,
    guid(target.botid),
    guid(target.componentidunique ?? ""),
  );
}
