/**
 * The MCP App object that the ported views use. Tool calls run in this browser
 * through the local dispatcher; display, size, and link requests go to the
 * SharePoint Copilot component bridge.
 */
import type { App, DisplayMode, McpUiHostContext } from "./bridge.js";
import { callLocalTool } from "./localTools.js";

export interface ComponentHost {
  hostContext(): McpUiHostContext | undefined;
  requestDisplayMode(mode: "inline" | "fullscreen"): Promise<DisplayMode>;
  requestSize(width: number, height: number): Promise<boolean>;
  openLink(url: string): Promise<{ isError?: boolean }>;
}

export function createComponentApp(host: ComponentHost): App {
  return {
    callServerTool: request => callLocalTool(request),
    requestDisplayMode: async ({ mode }) => ({
      mode: await host.requestDisplayMode(mode === "fullscreen" ? "fullscreen" : "inline"),
    }),
    sendSizeChanged: async ({ width, height }) => {
      if (typeof width === "number" && typeof height === "number") await host.requestSize(width, height);
    },
    // The shim does not give downloadFile. Without this capability, the views offer copy instead.
    getHostCapabilities: () => ({ openLinks: {} }),
    getHostContext: () => host.hostContext(),
    downloadFile: async () => ({ isError: true }),
    openLink: ({ url }) => host.openLink(url),
  };
}
