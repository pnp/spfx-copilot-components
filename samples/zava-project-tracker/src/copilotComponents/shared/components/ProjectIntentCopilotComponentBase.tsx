import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';

import ProjectIntentApp from './ProjectIntentApp';
import ProjectThemeProvider from './ProjectThemeProvider';
import { getIntentDefinition } from '../mockData/intentCatalog';
import { resolveIntentInvocation, type IIntentTransientState } from '../models/intentInvocation';
import type { IProjectIntentProperties } from '../models/projectPortfolio';
import { resolveCurrentUser } from '../services/CurrentUserService';

abstract class ProjectIntentCopilotComponentBase<TProperties extends IProjectIntentProperties>
  extends BaseCopilotComponent<TProperties> {
  protected abstract intentKey: string;
  private _root: Root | undefined;
  private _propertiesSignature?: string;
  private _propertiesVersion = 0;
  private _transientState: IIntentTransientState = {};

  protected render(): void {
    const canExpand = this.hostContext.displayMode !== 'fullscreen' &&
      (this.hostContext.availableDisplayModes || []).indexOf('fullscreen') >= 0;
    const currentUser = resolveCurrentUser(this.context);
    const definition = getIntentDefinition(this.intentKey);
    const invocation = resolveIntentInvocation(
      definition,
      this.properties,
      this._propertiesSignature,
      this._propertiesVersion
    );
    if (invocation.signature !== this._propertiesSignature) {
      this._propertiesSignature = invocation.signature;
      this._propertiesVersion = invocation.version;
      this._transientState = {};
    }
    const targetDocument = this.context.domElement.ownerDocument;

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }

    this._root.render(
      React.createElement(
        ProjectThemeProvider,
        { theme: this.hostContext.theme, targetDocument },
        React.createElement(ProjectIntentApp, {
          definition: invocation.definition,
          properties: invocation.properties,
          propertiesVersion: invocation.version,
          transientState: this._transientState,
          onTransientStateChange: this._handleTransientStateChange,
          currentUserName: currentUser.displayName,
          currentUserImageUrl: currentUser.photoUrl,
          containerWidth: this.hostContext.containerDimensions?.width || this.hostContext.containerDimensions?.maxWidth,
          displayMode: this.hostContext.displayMode,
          onRequestFullscreen: canExpand ? this._handleRequestFullscreen : undefined
        })
      )
    );
  }

  protected onTeardown(reason: string | undefined): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
    return super.onTeardown(reason);
  }

  private _handleRequestFullscreen = (): void => {
    this.requestDisplayModeAsync('fullscreen').catch(() => undefined);
  };

  private _handleTransientStateChange = (state: IIntentTransientState): void => {
    this._transientState = state;
  };
}

export default ProjectIntentCopilotComponentBase;