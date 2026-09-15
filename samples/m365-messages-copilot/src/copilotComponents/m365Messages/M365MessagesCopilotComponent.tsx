import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type {
  ISPRequestDisplayModeResult,
  SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

import M365MessagesMcpApp from './components/M365MessagesMcpApp';
import type { IM365MessagesMcpAppProps } from './components/IM365MessagesMcpAppProps';
import type { IM365MessagesCopilotComponentProperties } from './M365MessagesCopilotComponentProperties';
import { MCP_OAUTH_RESOURCE } from './services/mcpClient';

export default class M365MessagesCopilotComponent extends BaseCopilotComponent<IM365MessagesCopilotComponentProperties> {
  private _activeClient: Client | undefined;
  private _root: Root | undefined;
  private _toolInput: Record<string, unknown> = {};

  private readonly _getToken = async (): Promise<string> => {
    const tokenProvider =
      await this.context.aadTokenProviderFactory.getTokenProvider();
    return tokenProvider.getToken(MCP_OAUTH_RESOURCE);
  };

  private readonly _handleClientChanged = (
    client: Client | undefined
  ): void => {
    this._activeClient = client;
  };

  protected async onInit(): Promise<void> {
    this._toolInput = {
      top: this.properties.top ?? 25,
      ...(this.properties.search ? { search: this.properties.search } : {}),
      ...(this.properties.filter ? { filter: this.properties.filter } : {})
    };
  }

  protected render(): void {
    const props: IM365MessagesMcpAppProps = {
      assetBaseUrl:
        this.context.manifest.loaderConfig.internalModuleBaseUrls[0],
      bridge: this.context.copilotBridge,
      getToken: this._getToken,
      hostContext: this.hostContext,
      locale: this.context.pageContext.cultureInfo.currentUICultureName,
      onClientChanged: this._handleClientChanged,
      onRequestDisplayMode: async (
        mode: SPCopilotDisplayMode
      ): Promise<ISPRequestDisplayModeResult> =>
        this.requestDisplayModeAsync(mode),
      targetDocument: this.context.domElement.ownerDocument,
      toolInput: this._toolInput
    };

    this._root ??= createRoot(this.context.domElement);
    this._root.render(React.createElement(M365MessagesMcpApp, props));
  }

  protected async onTeardown(_reason: string | undefined): Promise<void> {
    const activeClient: Client | undefined = this._activeClient;
    this._root?.unmount();
    this._root = undefined;
    this._activeClient = undefined;
    await activeClient?.close().catch(() => undefined);
  }
}
