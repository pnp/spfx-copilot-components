/**
 * The subset of the MCP Apps contract that the ported views use. The SharePoint
 * Copilot component implements it locally, so the views keep their original code.
 */
export interface TextContentBlock {
  type: "text";
  text: string;
}

export interface ResourceContentBlock {
  type: "resource";
  resource: { uri: string; mimeType?: string; text?: string; blob?: string };
}

export interface ImageContentBlock {
  type: "image";
  data: string;
  mimeType: string;
}

export type ContentBlock = TextContentBlock | ResourceContentBlock | ImageContentBlock;

export interface CallToolResult {
  content: ContentBlock[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

export interface CallToolRequest {
  name: string;
  arguments?: Record<string, unknown>;
}

export type DisplayMode = "inline" | "fullscreen" | "pip";

export interface ContainerDimensions {
  height?: number;
  maxHeight?: number;
  width?: number;
  maxWidth?: number;
}

export interface McpUiHostContext {
  theme?: "light" | "dark";
  displayMode?: DisplayMode;
  availableDisplayModes?: DisplayMode[];
  containerDimensions?: ContainerDimensions;
  toolInfo?: { id?: string | number };
  platform?: "web" | "desktop" | "mobile";
}

export interface HostCapabilities {
  downloadFile?: Record<string, never>;
  openLinks?: Record<string, never>;
}

export interface DownloadFileRequest {
  contents: Array<{
    type: "resource";
    resource: { uri: string; mimeType?: string; text: string };
  }>;
}

export interface App {
  callServerTool(request: CallToolRequest): Promise<CallToolResult>;
  requestDisplayMode(request: { mode: DisplayMode }): Promise<{ mode: DisplayMode }>;
  sendSizeChanged(size: { width?: number; height?: number }): Promise<void>;
  getHostCapabilities(): HostCapabilities | undefined;
  getHostContext(): McpUiHostContext | undefined;
  downloadFile(request: DownloadFileRequest): Promise<{ isError?: boolean }>;
  openLink(request: { url: string }): Promise<{ isError?: boolean }>;
}
