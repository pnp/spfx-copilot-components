import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import { createDOMRenderer, RendererProvider } from '@griffel/react';
import type { GriffelRenderer } from '@griffel/react';
import { FluentProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components';
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { getIntentDefinition } from '../intents/intentCatalog';
import type { IntentName } from '../intents/intentCatalog';
import { IntentCanvasApp } from '../ui/IntentCanvasApp';

function createPropertySignature(properties: object): string {
  return Object.keys(properties).sort().map((key) => `${key}:${JSON.stringify((properties as Record<string, unknown>)[key])}`).join('|');
}

export abstract class IntentCopilotComponent<TProperties extends object> extends BaseCopilotComponent<TProperties> {
  protected abstract readonly intentName: IntentName;
  private griffelRenderer: GriffelRenderer | undefined;
  private _root: Root | undefined;

  protected onInit(): Promise<void> {
    this.griffelRenderer = createDOMRenderer(this.context.domElement.ownerDocument);
    return Promise.resolve();
  }

  protected render(): void {
    const intent = getIntentDefinition(this.intentName);
    const isDarkTheme = this.hostContext.theme === 'dark';
    const isFullscreen = this.hostContext.displayMode === 'fullscreen';
    const targetDocument = this.context.domElement.ownerDocument;
    const renderer = this.griffelRenderer ?? createDOMRenderer(targetDocument);
    const app = React.createElement(IntentCanvasApp, {
      key: createPropertySignature(this.properties),
      intent,
      isDark: isDarkTheme,
      isFullscreen,
      ownerWindow: targetDocument.defaultView ?? undefined,
      properties: this.properties as Readonly<Record<string, unknown>>,
      userName: this.context.pageContext.user.displayName || 'Megan Bowen',
      onDisplayModeChange: this.handleDisplayModeChange
    });
    const fluentApp = React.createElement(FluentProvider, {
      applyStylesToPortals: true,
      targetDocument,
      theme: isDarkTheme ? webDarkTheme : webLightTheme
    }, app);
    const renderedApp = React.createElement(RendererProvider, { renderer, targetDocument, children: fluentApp });
    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }
    this._root.render(renderedApp);
  }

  protected async onTeardown(reason?: string): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
    await super.onTeardown(reason);
  }

  private handleDisplayModeChange = (mode: 'inline' | 'fullscreen'): void => {
    this.requestDisplayModeAsync(mode).catch(() => undefined);
  };
}