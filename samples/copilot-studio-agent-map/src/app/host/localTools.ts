/**
 * In-browser replacement for the MCP server tool registry. Each tool keeps the
 * input schema of the Agent Review MCP server and calls the same handler logic.
 * Only the tools that the Agent Map view calls are listed.
 */
import { z } from "zod";
import type { CallToolRequest, CallToolResult } from "./bridge.js";
import { ENVIRONMENT_ID_PATTERN } from "../dataverse/environmentId";
import { getAgentMap, getConnectedAgentMap, showAgentMap } from "../tools/agentMapTools";

type LocalTool = (args: unknown) => Promise<CallToolResult>;

const dataverseGuid = (): z.ZodString => z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Expected a Dataverse GUID",
);
/** A GUID, or Default-<tenant ID> for the default environment. */
const environmentIdentifier = (): z.ZodString => z.string().regex(
  ENVIRONMENT_ID_PATTERN,
  "Expected a Power Platform environment ID",
);
const displayName = (): z.ZodString => z.string().trim().min(1).max(200);

function define<S extends z.ZodTypeAny>(
  schema: S,
  handler: (input: z.output<S>) => Promise<CallToolResult>,
): LocalTool {
  return async (args) => handler(schema.parse(args ?? {}));
}

const tools: Record<string, LocalTool> = {
  show_agent_map: define(z.object({
    environmentId: environmentIdentifier().optional(),
    environmentName: displayName().optional(),
    agentId: dataverseGuid().optional(),
    agentName: displayName().optional(),
    componentIdUnique: dataverseGuid().optional(),
  }).strict(), showAgentMap),
  get_agent_map: define(z.object({
    environmentId: environmentIdentifier(),
    agentId: dataverseGuid(),
    componentIdUnique: dataverseGuid(),
  }).strict(), getAgentMap),
  get_connected_agent_map: define(z.object({
    environmentId: environmentIdentifier(),
    targetSchemaName: z.string().trim().min(1).max(200),
  }).strict(), getConnectedAgentMap),
};

function failure(code: string, message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: message }],
    structuredContent: { state: "error", error: { code, message, retryable: false } },
  };
}

export async function callLocalTool(request: CallToolRequest): Promise<CallToolResult> {
  const tool = Object.prototype.hasOwnProperty.call(tools, request.name) ? tools[request.name] : undefined;
  if (!tool) return failure("UNKNOWN_TOOL", `The tool ${request.name} is not available in this component.`);
  try {
    return await tool(request.arguments ?? {});
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure("INVALID_INPUT", error.issues
        .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`).join("; "));
    }
    console.error(`Local tool ${request.name} failed.`, error);
    return failure("INTERNAL_ERROR", error instanceof Error ? error.message : "The operation failed.");
  }
}
