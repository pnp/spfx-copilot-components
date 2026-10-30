/**
 * The Agent Map tool handlers of the Agent Review MCP server, without the MCP
 * transport. The result shapes are the same, so the map view is not changed.
 */
import type { CallToolResult } from "../host/bridge.js";
import * as agentMapService from "../dataverse/agentMapService";
import { AgentMapError, type ReviewAgent, type ReviewEnvironment } from "../dataverse/errors";
import {
  agentMapContextPayload,
  githubCopilotMapAgents,
  type AgentMapAgentRef,
} from "./agentMapContext.js";
import { matchByIdOrName, type NameMatch } from "./nameMatch.js";

type Structured = Record<string, unknown>;

interface ConversationSelection {
  environmentId?: string;
  environmentName?: string;
  agentId?: string;
  agentName?: string;
  componentIdUnique?: string;
}

function result(text: string, structuredContent: Structured): CallToolResult {
  return {
    content: [{ type: "text", text }],
    structuredContent,
  };
}

function failure(error: unknown): CallToolResult {
  const known = error instanceof AgentMapError;
  const diagnostics = known ? error.diagnostics : undefined;
  const message = [
    known ? error.message : "The Agent Map operation failed.",
    diagnostics?.dataverse
      ? `Request: ${diagnostics.dataverse.method} ${diagnostics.dataverse.url}.` : undefined,
  ].filter(Boolean).join(" ");
  console.error("Agent Map tool failed.", error);
  return {
    isError: true,
    content: [{ type: "text", text: message }],
    structuredContent: {
      state: "error",
      error: {
        code: known ? error.code : "INTERNAL_ERROR",
        message,
        retryable: known ? error.retryable : false,
        ...(diagnostics ? { diagnostics } : {}),
      },
    },
  };
}

function requireGitHubCopilotMapAgent<TAgent extends AgentMapAgentRef>(
  agents: TAgent[],
  agentId: string,
  componentIdUnique?: string,
): TAgent {
  const selected = agents.find((agent) =>
    agent.id === agentId
    && (!componentIdUnique || agent.componentIdUnique === componentIdUnique));
  if (!selected) {
    throw new AgentMapError(
      "AGENT_MAP_UNSUPPORTED",
      "Agent Map is available only for GitHub Copilot harness agents.",
    );
  }
  return selected;
}

interface ChoiceNotice {
  code: string;
  message: string;
}

/**
 * A selection result. The view shows the selectors, so the user can choose.
 * The notice tells the user why the view did not use the selection from the
 * conversation. It is not a failure, so the user can continue in the view.
 */
function selection(text: string, content: Structured, notice?: ChoiceNotice): CallToolResult {
  return result(notice?.message ?? text, {
    state: "mapSelecting",
    selectionId: crypto.randomUUID(),
    ...content,
    ...(notice ? { error: notice } : {}),
    features: { fullscreen: true, workflowFree: true },
  });
}

/** The name from the conversation in quotes, else its ID. */
function requested(id?: string, name?: string): string {
  const text = name?.trim();
  return text ? `"${text}"` : `ID ${id ?? ""}`;
}

function environmentNotice(
  match: NameMatch<ReviewEnvironment>,
  input: ConversationSelection,
): ChoiceNotice {
  const named = requested(input.environmentId, input.environmentName);
  return match.ambiguous
    ? {
      code: "ENVIRONMENT_AMBIGUOUS",
      message: `More than one environment matches ${named}. Choose an environment.`,
    }
    : {
      code: "ENVIRONMENT_NOT_FOUND",
      message: `No environment matches ${named}. Choose an environment.`,
    };
}

function agentNotice(
  match: NameMatch<ReviewAgent>,
  reviewableAgents: ReviewAgent[],
  environment: ReviewEnvironment,
  input: ConversationSelection,
): ChoiceNotice {
  const named = requested(input.agentId, input.agentName);
  if (match.ambiguous) {
    return {
      code: "AGENT_AMBIGUOUS",
      message: `More than one agent matches ${named} in ${environment.name}. Choose an agent.`,
    };
  }
  // The list has only GitHub Copilot harness agents. Tell the user when the name is a different agent.
  const other = matchByIdOrName(reviewableAgents, input.agentId, input.agentName);
  if (other.item || other.ambiguous) {
    return {
      code: "AGENT_MAP_UNSUPPORTED",
      message: `${other.ambiguous
        ? `The agents that match ${named} do not`
        : `The agent that matches ${named} does not`} use the GitHub Copilot harness. Choose a GitHub Copilot harness agent.`,
    };
  }
  return {
    code: "AGENT_NOT_FOUND",
    message: `No agent matches ${named} in ${environment.name}. Choose an agent.`,
  };
}

export async function showAgentMap(input: ConversationSelection): Promise<CallToolResult> {
  try {
    const environments = await agentMapService.listEnvironments();
    const namesEnvironment = Boolean(input.environmentId || input.environmentName);
    const namesAgent = Boolean(input.agentId || input.agentName);
    const environmentMatch = matchByIdOrName(
      environments,
      input.environmentId,
      input.environmentName,
    );
    // When the user names only an agent, the MCP server uses its configured home
    // environment. This sample has no home environment, so it uses the only
    // environment, else it lets the user choose.
    const environment = environmentMatch.item
      ?? (!namesEnvironment && namesAgent && environments.length === 1
        ? environments[0]
        : undefined);
    if (!environment) {
      return selection(
        "Choose an environment and agent to build its deterministic Agent Map.",
        { environments, agents: [] },
        namesEnvironment ? environmentNotice(environmentMatch, input) : undefined,
      );
    }
    const environmentId = environment.id;
    const reviewableAgents = await agentMapService.listAgents(environmentId);
    const agents = githubCopilotMapAgents(reviewableAgents);
    const agentMatch = matchByIdOrName(agents, input.agentId, input.agentName);
    if (!agentMatch.item) {
      return selection(
        "Choose an agent to build its deterministic Agent Map.",
        { environments, environment, environmentId, agents },
        namesAgent ? agentNotice(agentMatch, reviewableAgents, environment, input) : undefined,
      );
    }
    const selectedAgent = requireGitHubCopilotMapAgent(
      agents,
      agentMatch.item.id,
      input.componentIdUnique ?? agentMatch.item.componentIdUnique,
    );
    const graph = await agentMapService.getAgentMap(
      environmentId,
      selectedAgent.id,
      selectedAgent.componentIdUnique,
    );
    return result(`Built a deterministic Agent Map for ${graph.agent.name}.`, agentMapContextPayload({
      environments,
      environment,
      environmentId,
      agents,
      agentId: selectedAgent.id,
      componentIdUnique: selectedAgent.componentIdUnique,
      graph,
    }));
  } catch (error) {
    return failure(error);
  }
}

export async function getAgentMap(input: {
  environmentId: string;
  agentId: string;
  componentIdUnique: string;
}): Promise<CallToolResult> {
  try {
    // Read-only context, so that a remounted view can restore its selectors from one call.
    const [environments, reviewableAgents] = await Promise.all([
      agentMapService.listEnvironments(),
      agentMapService.listAgents(input.environmentId),
    ]);
    const agents = githubCopilotMapAgents(reviewableAgents);
    const selectedAgent = requireGitHubCopilotMapAgent(
      agents,
      input.agentId,
      input.componentIdUnique,
    );
    const graph = await agentMapService.getAgentMap(
      input.environmentId,
      selectedAgent.id,
      selectedAgent.componentIdUnique,
    );
    return result(`Built a deterministic Agent Map for ${graph.agent.name}.`, agentMapContextPayload({
      environments,
      environmentId: input.environmentId,
      agents,
      agentId: selectedAgent.id,
      componentIdUnique: selectedAgent.componentIdUnique,
      graph,
    }));
  } catch (error) {
    return failure(error);
  }
}

export async function getConnectedAgentMap(input: {
  environmentId: string;
  targetSchemaName: string;
}): Promise<CallToolResult> {
  try {
    const graph = await agentMapService.getConnectedAgentMap(
      input.environmentId,
      input.targetSchemaName,
    );
    return result(`Loaded current components for connected agent ${graph.agent.name}.`, {
      state: "connectedAgentMap",
      targetSchemaName: input.targetSchemaName,
      graph,
      features: { workflowFree: true },
    });
  } catch (error) {
    return failure(error);
  }
}
