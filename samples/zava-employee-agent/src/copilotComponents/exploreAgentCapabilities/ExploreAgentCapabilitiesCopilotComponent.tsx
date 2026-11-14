import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BaseCopilotComponent, createCopilotTextContent } from '@microsoft/sp-copilot-component';
import HomeThemeProvider from '../getMyHrDashboard/components/HomeThemeProvider';
import EmployeeCapabilityExplorer, { type IEmployeeExplorerSnapshot } from './components/EmployeeCapabilityExplorer';
import type { IExploreAgentCapabilitiesCopilotComponentProperties } from './ExploreAgentCapabilitiesCopilotComponentProperties';

export default class ExploreAgentCapabilitiesCopilotComponent extends BaseCopilotComponent<IExploreAgentCapabilitiesCopilotComponentProperties> {
  private _root: Root | undefined;
  protected render(): void {
    if (!this._root) this._root = createRoot(this.context.domElement);
    const signature = JSON.stringify([this.properties.query || '', this.properties.category || 'all']);
    const canExpand = this.hostContext.displayMode !== 'fullscreen' && (this.hostContext.availableDisplayModes || []).indexOf('fullscreen') >= 0;
    this._root.render(<HomeThemeProvider theme={this.hostContext.theme} targetDocument={this.context.domElement.ownerDocument}>
      <EmployeeCapabilityExplorer key={signature} {...this.properties}
        onSendPrompt={this._sendPrompt} onUpdateContext={this._updateContext}
        onRequestFullscreen={canExpand ? this._expand : undefined} />
    </HomeThemeProvider>);
  }
  protected async onTeardown(reason?: string): Promise<void> {
    this._root?.unmount(); this._root = undefined;
    await super.onTeardown(reason);
  }
  private _sendPrompt = async (prompt: string): Promise<void> => {
    const result = await this.context.copilotBridge.sendFollowUpMessageAsync([createCopilotTextContent(prompt)]);
    if (result.isError) throw new Error('The Copilot host rejected the scenario prompt.');
  };
  private _updateContext = async (snapshot: IEmployeeExplorerSnapshot): Promise<void> => {
    await this.context.copilotBridge.updateModelContextAsync({ content: [createCopilotTextContent(snapshot.summary)], structuredContent: snapshot });
  };
  private _expand = async (): Promise<void> => { await this.requestDisplayModeAsync('fullscreen'); };
}
