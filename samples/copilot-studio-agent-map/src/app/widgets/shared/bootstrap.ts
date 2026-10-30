/**
 * In-process replacement for the MCP Apps iframe bootstrap. The Copilot component
 * owns the host context and calls the local tools, so this store only keeps the
 * snapshot that the view reads, and it calls the open tool one time.
 */
import type { App, CallToolResult, McpUiHostContext } from "../../host/bridge.js";
import type { AppView, McpBootstrap, McpBootstrapSnapshot } from "./bootstrap-contract";

export interface HostBootstrapSnapshot extends McpBootstrapSnapshot {
  /**
   * False until the open tool returns. An MCP App host runs the tool before it
   * opens the view. This component runs the tool after it mounts, so the host
   * shows a loading state until this is true.
   */
  opened: boolean;
}

export interface HostBootstrap extends McpBootstrap {
  getSnapshot: () => HostBootstrapSnapshot;
  setHost: (host: McpUiHostContext | undefined) => void;
  start: (input: Record<string, unknown>) => Promise<void>;
}

function openFailure(message: string): Record<string, unknown> {
  return { state: "error", error: { code: "OPEN_FAILED", message } };
}

/** The view reads the structured content of the open tool, as in the MCP App. */
function initialData(result: CallToolResult): unknown {
  if (result.structuredContent) return result.structuredContent;
  if (!result.isError) return null;
  const text = result.content.find((block) => block.type === "text");
  return openFailure(text && text.type === "text" && text.text ? text.text : "The app could not open.");
}

export function createHostBootstrap(options: {
  app: App;
  view: AppView;
  openTool: string;
  host?: McpUiHostContext;
}): HostBootstrap {
  const { app, view, openTool } = options;
  const listeners = new Set<() => void>();
  let snapshot: HostBootstrapSnapshot = { app, data: null, host: options.host, opened: false };
  let started = false;

  const update = (next: Partial<HostBootstrapSnapshot>): void => {
    snapshot = { ...snapshot, ...next };
    for (const listener of listeners) listener();
  };

  return {
    view,
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    replaceData: (data) => update({ data }),
    replaceMetadata: (metadata) => update({ metadata }),
    setHost: (host) => update({ host }),
    start: async (input) => {
      if (started) return;
      started = true;
      update({ toolInput: input });
      try {
        const result = await app.callServerTool({ name: openTool, arguments: input });
        update({ data: initialData(result), opened: true });
      } catch (error) {
        console.error("Unable to open the app.", error);
        update({
          data: openFailure(error instanceof Error ? error.message : "The app could not open."),
          opened: true,
        });
      }
    },
  };
}
