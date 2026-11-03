import type { App, McpUiHostContext } from "../../host/bridge.js";

export interface McpBootstrapSnapshot {
  app: App;
  data: unknown;
  host: McpUiHostContext | undefined;
  metadata?: Record<string, unknown>;
  toolInput?: Record<string, unknown>;
}
export type AppView = "agent-map";

export interface McpBootstrap {
  getSnapshot: () => McpBootstrapSnapshot;
  replaceData: (data: unknown) => void;
  subscribe: (listener: () => void) => () => void;
  replaceMetadata?: (metadata: Record<string, unknown> | undefined) => void;
  readInitialResult?: (result: Awaited<ReturnType<App["callServerTool"]>>) => Promise<{
    data: unknown;
    metadata: Record<string, unknown> | undefined;
  }>;
  view?: AppView;
}
