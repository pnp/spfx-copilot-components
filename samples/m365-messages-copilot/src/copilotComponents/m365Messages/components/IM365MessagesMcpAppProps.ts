import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type {
  ICopilotComponentHostContext,
  ISPCopilotBridge,
  ISPRequestDisplayModeResult,
  SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';

export interface IM365MessagesMcpAppProps {
  assetBaseUrl: string;
  bridge: ISPCopilotBridge;
  getToken: () => Promise<string>;
  hostContext: ICopilotComponentHostContext;
  locale: string | undefined;
  onClientChanged: (client: Client | undefined) => void;
  onRequestDisplayMode: (
    mode: SPCopilotDisplayMode
  ) => Promise<ISPRequestDisplayModeResult>;
  targetDocument: Document | undefined;
  toolInput: Record<string, unknown>;
}