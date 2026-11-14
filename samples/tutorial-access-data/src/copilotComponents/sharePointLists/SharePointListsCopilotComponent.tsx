import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

import SharePointLists from './components/SharePointLists';
import type { ISharePointListsProps } from './components/ISharePointListsProps';
import { SharePointListsService } from './services/SharePointListsService';
import type { ISharePointListsCopilotComponentProperties } from './SharePointListsCopilotComponentProperties';

import * as strings from 'SharePointListsCopilotComponentStrings';

/**
 * SPFx Copilot Component that shows the lists on a SharePoint site and the
 * items in a selected list.
 *
 * - **Brokered SSO data calls** — SharePoint REST (`/_api/web/lists`) with
 *   zero token code. The SPFx runtime provisions tokens for `SPHttpClient`.
 *
 * - **Tool arguments** — reads the optional `siteUrl` argument from
 *   `this.properties`.
 *
 * Lifecycle:
 *  1. `onInit()` — creates the data service (runs once before first render).
 *  2. `render()` — mounts the React tree into `this.context.domElement`.
 *     Re-invoked by the framework on host-context changes. The React tree
 *     loads the data and shows a loading state while it waits.
 *  3. `onTeardown()` — unmounts React before the host tears down the iframe.
 */
export default class SharePointListsCopilotComponent extends BaseCopilotComponent<ISharePointListsCopilotComponentProperties> {
  private _service!: SharePointListsService;
  private _root: Root | undefined;

  protected async onInit(): Promise<void> {
    this._service = new SharePointListsService(this.context.spHttpClient);
  }

  protected render(): void {
    const props: ISharePointListsProps = {
      service: this._service,
      siteUrl: this.properties.siteUrl,
      fallbackSiteUrl: this.context.pageContext.web.absoluteUrl,
      locale: this.context.pageContext.cultureInfo.currentUICultureName,
      hostContext: this.hostContext,
      onRequestDisplayMode: async (mode: SPCopilotDisplayMode) => {
        await this.requestDisplayModeAsync(mode);
      },
      onContentResize: this._handleContentResize,
      targetDocument: this.context.domElement.ownerDocument,
      strings
    };

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }

    this._root.render(React.createElement(SharePointLists, props));
  }

  // The host sizes the frame at startup. Report later size changes, such
  // as when data loads, so the frame follows the content.
  private _handleContentResize = (width: number, height: number): void => {
    this.requestSizeChangeAsync(width, height).catch(() => undefined);
  };

  protected async onTeardown(): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
  }
}
