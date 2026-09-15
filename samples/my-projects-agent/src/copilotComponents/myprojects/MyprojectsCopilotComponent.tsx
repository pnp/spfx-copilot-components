import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';

import { MyprojectsExperience } from './components/MyprojectsExperience/MyprojectsExperience';
import type { IMyprojectsHostProps, IMyprojectsToolProperties } from './models';
import * as strings from 'MyprojectsCopilotComponentStrings';

export default class MyprojectsCopilotComponent extends BaseCopilotComponent<IMyprojectsToolProperties> {
  private _root: Root | undefined;

  private readonly _requestDisplayMode: IMyprojectsHostProps['onRequestDisplayMode'] =
    async (mode) => {
      await this.requestDisplayModeAsync(mode);
    };

  private readonly _requestSizeChange: IMyprojectsHostProps['onRequestSizeChange'] =
    async (width, height) => {
      await this.requestSizeChangeAsync(width, height);
    };

  protected render(): void {
    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }

    this._root.render(
      React.createElement(MyprojectsExperience, {
        context: this.context,
        dateLocale:
          this.context.pageContext.cultureInfo.currentCultureName ?? 'en-US',
        graphClientFactory: this.context.msGraphClientFactory,
        hostContext: this.hostContext,
        onRequestDisplayMode: this._requestDisplayMode,
        onRequestSizeChange: this._requestSizeChange,
        properties: this.properties,
        strings,
        targetDocument: this.context.domElement.ownerDocument,
      })
    );
  }

  protected async onTeardown(): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
  }
}