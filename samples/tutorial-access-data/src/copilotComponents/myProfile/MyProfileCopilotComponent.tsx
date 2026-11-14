import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

import MyProfile from './components/MyProfile';
import type { IMyProfileProps } from './components/IMyProfileProps';
import { GraphProfileService } from './services/GraphProfileService';
import type { IMyProfileCopilotComponentProperties } from './MyProfileCopilotComponentProperties';

import * as strings from 'MyProfileCopilotComponentStrings';

/**
 * SPFx Copilot Component that shows the signed-in user's profile with their
 * recent mail or their upcoming calendar events.
 *
 * - **Brokered SSO data calls** — Microsoft Graph (`/me`, `/me/messages`,
 *   `/me/calendarView`) with zero token code. The SPFx runtime provisions
 *   tokens for `MSGraphClientV3`. The Microsoft Graph permissions are
 *   requested in `config/package-solution.json`.
 *
 * - **Tool arguments** — reads the optional `view` argument from
 *   `this.properties`.
 *
 * Lifecycle:
 *  1. `onInit()` — creates the data service (runs once before first render).
 *  2. `render()` — mounts the React tree into `this.context.domElement`.
 *     Re-invoked by the framework on host-context changes. The React tree
 *     loads the data and shows a loading state while it waits.
 *  3. `onTeardown()` — unmounts React before the host tears down the iframe.
 */
export default class MyProfileCopilotComponent extends BaseCopilotComponent<IMyProfileCopilotComponentProperties> {
  private _service!: GraphProfileService;
  private _root: Root | undefined;

  protected async onInit(): Promise<void> {
    this._service = new GraphProfileService(this.context.msGraphClientFactory);
  }

  protected render(): void {
    const props: IMyProfileProps = {
      service: this._service,
      initialView: this.properties.view,
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

    this._root.render(React.createElement(MyProfile, props));
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
