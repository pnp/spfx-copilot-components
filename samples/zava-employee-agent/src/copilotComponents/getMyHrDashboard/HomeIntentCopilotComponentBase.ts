import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';

import type { IZavaUser } from '../shared/models/zavaEmployee';
import { MockZavaEmployeeDataService } from '../shared/services/MockZavaEmployeeDataService';
import { resolveCurrentUser } from '../shared/services/CurrentUserService';
import HomeApp from './components/HomeApp';
import { getHomePropertiesSignature } from './normalizeHomeProperties';
import type { IResolvedHomeIntent } from './homeIntentTypes';

const fallbackUser: IZavaUser = new MockZavaEmployeeDataService().getEmployeeExperience().user;

abstract class HomeIntentCopilotComponentBase<TProperties> extends BaseCopilotComponent<TProperties> {
  private _propertiesSignature?: string;
  private _propertiesVersion = 0;
  private _root: Root | undefined;

  protected abstract resolveIntent(properties: unknown): IResolvedHomeIntent;

  protected render(): void {
    const intent = this.resolveIntent(this.properties);
    const signature = `${getHomePropertiesSignature(intent.properties)}|${JSON.stringify(intent.params)}`;
    if (signature !== this._propertiesSignature) {
      this._propertiesSignature = signature;
      this._propertiesVersion += 1;
    }

    const targetDocument = this.context.domElement.ownerDocument;
    const element: React.ReactElement = React.createElement(HomeApp, {
      properties: intent.properties,
      propertiesVersion: this._propertiesVersion,
      currentUser: resolveCurrentUser(this.context, fallbackUser, targetDocument.location.href),
      theme: this.hostContext.theme,
      displayMode: this.hostContext.displayMode,
      availableDisplayModes: this.hostContext.availableDisplayModes,
      containerDimensions: this.hostContext.containerDimensions,
      targetDocument,
      fixedView: intent.view,
      initialFamily: 'home',
      initialRoute: intent.route,
      initialParams: intent.params,
      onRequestFullscreen: this._handleRequestFullscreen
    });

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }
    this._root.render(element);
  }

  protected onTeardown(reason: string | undefined): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
    return super.onTeardown(reason);
  }

  private _handleRequestFullscreen = (): void => {
    this.requestDisplayModeAsync('fullscreen').catch(() => {
      // The host remains authoritative when fullscreen is unavailable or rejected.
    });
  };
}

export default HomeIntentCopilotComponentBase;