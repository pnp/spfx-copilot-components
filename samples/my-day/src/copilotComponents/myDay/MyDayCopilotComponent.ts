import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent, createCopilotTextContent } from '@microsoft/sp-copilot-component';

import MyDayApp from './components/MyDayApp';
import type { IMyDayCopilotComponentProperties } from './MyDayCopilotComponentProperties';
import { resolveCurrentUser } from './services/CurrentUserService';
import type { IMyDayModelSnapshot } from './models/myDay';

export default class MyDayCopilotComponent extends BaseCopilotComponent<IMyDayCopilotComponentProperties> {
  private _root: Root | undefined;
  private _focus: string | undefined;
  private _invocation = 0;

  protected render(): void {
    const focus = this.properties.focus || 'summary';
    if (focus !== this._focus) {
      this._focus = focus;
      this._invocation += 1;
    }
    const element: React.ReactElement = React.createElement(MyDayApp, {
      key: this._invocation,
      focus,
      currentUser: resolveCurrentUser(this.context),
      theme: this.hostContext.theme,
      targetDocument: this.context.domElement.ownerDocument,
      displayMode: this.hostContext.displayMode,
      availableDisplayModes: this.hostContext.availableDisplayModes,
      onUpdateModelContext: this._updateModelContext,
      onRequestFullscreen: this.hostContext.displayMode !== 'fullscreen' &&
        (this.hostContext.availableDisplayModes || []).indexOf('fullscreen') >= 0
        ? this._handleRequestFullscreen : undefined
    });

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }
    this._root.render(element);

  }

  private _updateModelContext = async (snapshot: IMyDayModelSnapshot): Promise<void> => {
    await this.context.copilotBridge.updateModelContextAsync({
      content: [createCopilotTextContent(snapshot.summary)], structuredContent: snapshot
    });
  };

  protected onTeardown(reason: string | undefined): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
    return super.onTeardown(reason);
  }

  private _handleRequestFullscreen = (): void => {
    this.requestDisplayModeAsync('fullscreen').catch(() => {
      /* Host rejected or is unavailable; host context stays unchanged. */
    });
  };
}
