import type { ICopilotComponentHostContext, SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';
import type { ICommunityExplorerQuery } from '../VivaEngageExplorerCopilotComponentProperties';
import type { IVivaEngageService } from '../services/IVivaEngageService';

export interface IVivaEngageExplorerProps {
  query: ICommunityExplorerQuery | undefined;
  service: IVivaEngageService;
  hostContext: ICopilotComponentHostContext;
  onRequestDisplayMode: (mode: SPCopilotDisplayMode) => Promise<void>;
  targetDocument: Document;
  strings: IVivaEngageExplorerCopilotComponentStrings;
}
