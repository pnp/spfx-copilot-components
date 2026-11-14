import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

import SharePointGovernanceApp from './components/SharePointGovernanceApp';
import type { ISharePointGovernanceProps } from './components/ISharePointGovernanceProps';
import type { ISharePointGovernanceCopilotComponentProperties } from './SharePointGovernanceCopilotComponentProperties';
import type { IGovernanceService } from './services/IGovernanceService';
import { MockGovernanceService } from './services/MockGovernanceService';

/**
 * SPFx Copilot Component that renders the SharePoint governance risk
 * dashboard, demonstrating the platform's headline capabilities:
 *
 * - **Host context & theming** — reads `hostContext.theme` and
 *   `hostContext.displayMode` to adapt to the Copilot host environment.
 *
 * - **Bridge actions** — uses `requestDisplayModeAsync` so the component can
 *   be expanded to fullscreen from the Copilot host.
 *
 * Lifecycle:
 *  1. `render()` — mounts the React tree into `this.context.domElement`.
 *     Re-invoked by the framework on host-context changes.
 *  2. `onTeardown()` — unmounts React before the host tears down the iframe.
 */
export default class SharePointGovernanceCopilotComponent extends BaseCopilotComponent<ISharePointGovernanceCopilotComponentProperties> {
  // TODO: swap for GraphGovernanceService once the governance Microsoft Graph APIs are approved and implemented.
  private _service: IGovernanceService = new MockGovernanceService();
  private _root: Root | undefined;

  protected render(): void {
    const props: ISharePointGovernanceProps = {
      service: this._service,
      options: this.properties,
      hostContext: this.hostContext,
      bridge: this.context.copilotBridge,
      onRequestDisplayMode: async (mode: SPCopilotDisplayMode) => {
        await this.requestDisplayModeAsync(mode);
      },
      targetDocument: this.context.domElement.ownerDocument
    };

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }

    this._root.render(React.createElement(SharePointGovernanceApp, props));
  }

  protected async onTeardown(): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
  }
}

