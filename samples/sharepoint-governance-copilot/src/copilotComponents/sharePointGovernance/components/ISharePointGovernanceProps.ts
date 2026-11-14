import type {
  ICopilotComponentHostContext,
  ISPCopilotBridge,
  SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';

import type { IGovernanceService } from '../services/IGovernanceService';
import type { ISharePointGovernanceCopilotComponentProperties } from '../SharePointGovernanceCopilotComponentProperties';

export interface ISharePointGovernanceProps {
  /** Service used to fetch governance risk data (mock or Microsoft Graph backed). */
  service: IGovernanceService;
  /** Tool arguments passed from the Copilot host (filters, limits, message). */
  options: ISharePointGovernanceCopilotComponentProperties;
  /** Host context (theme, display mode) from the Copilot host. */
  hostContext: ICopilotComponentHostContext;
  /** Bridge to communicate with the Copilot host (public API surface). */
  bridge: ISPCopilotBridge;
  /** Request the host to change display mode (e.g. 'fullscreen'). */
  onRequestDisplayMode: (mode: SPCopilotDisplayMode) => Promise<void>;
  /**
   * Document the FluentProvider should inject its theme styles into. Pass
   * `domElement.ownerDocument` so Griffel writes CSS into the correct iframe
   * document rather than the top-level page.
   */
  targetDocument: Document | undefined;
}
