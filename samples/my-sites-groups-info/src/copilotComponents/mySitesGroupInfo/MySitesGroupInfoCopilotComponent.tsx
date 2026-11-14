import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent, SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

import MySitesGroupInfo from './components/MySitesGroupInfo';
import type { IMySitesGroupInfoProps } from './components/IMySitesGroupInfoProps';
import type { IMySitesGroupInfoCopilotComponentProperties } from './MySitesGroupInfoCopilotComponentProperties';

import { SitesGroupInfoService } from './services/SitesGroupInfoService';

/**
 * SPFx Copilot Component that renders a React-based UI demonstrating the
 * platform's headline capabilities:
 *
 * - **Brokered SSO data calls** — Microsoft Graph (`/me`) and SharePoint REST
 *   (`/_api/web`) with zero token code. The SPFx runtime's Pairwise Broker
 *   automatically provisions tokens for `SPHttpClient` and `MSGraphClientV3`.
 *
 * - **Host context & theming** — reads `hostContext.theme` and
 *   `hostContext.displayMode` to adapt to the Copilot host environment.
 *
 * - **Bridge actions** — demonstrates `requestDisplayModeAsync`,
 *   `openLinkAsync`, `sendFollowUpMessageAsync`, and `requestSizeChangeAsync`.
 *
 * Lifecycle:
 *  1. `onInit()` — fetches user and site data (runs once before first render).
 *  2. `render()` — mounts the React tree into `this.context.domElement`.
 *     Re-invoked by the framework on host-context changes.
 *  3. `onTeardown()` — unmounts React before the host tears down the iframe.
 */
export default class MySitesGroupInfoCopilotComponent extends BaseCopilotComponent<IMySitesGroupInfoCopilotComponentProperties> {
  private _service!: SitesGroupInfoService;
  private _root!: Root;
  protected async onInit(): Promise<void> {
    this._service = new SitesGroupInfoService(this.context);
  }

  private readonly _onRequestDisplayModeChange = async (newMode:SPCopilotDisplayMode): Promise<void> => {
    await this.requestDisplayModeAsync(newMode);
  }

  private readonly _onRequestSizeChange = async (width: number, height: number): Promise<boolean> => {
    return this.requestSizeChangeAsync(width, height);
  }

  protected render(): void {
    const props: IMySitesGroupInfoProps = {
      context: this.context,
      service: this._service,
      target: this.properties.target,
      top: this.properties.top,
      query: this.properties.query,
      targetDocument: this.context.domElement.ownerDocument,
      onRequestDisplayModeChange:this._onRequestDisplayModeChange,
      onRequestSizeChange: this._onRequestSizeChange,
      hostContext: this.hostContext
    };
    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }
  
    this._root.render(React.createElement(MySitesGroupInfo, props));
  }

  protected async onTeardown(): Promise<void> {
    this._root.unmount();
  }
}
