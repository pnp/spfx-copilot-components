import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  BaseCopilotComponent,
  createCopilotTextContent
} from '@microsoft/sp-copilot-component';
import { ZavaOneApp } from '../components/ZavaOneApp';
import type { IZavaModelContextSnapshot, ZavaIntentKey } from '../models/zavaOne';

export abstract class ZavaOneCopilotComponentBase<TProperties> extends BaseCopilotComponent<TProperties> {
  protected abstract readonly intent: ZavaIntentKey;
  private _root: Root | undefined;

  protected render(): void {
    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }

    this._root.render(React.createElement(ZavaOneApp, {
      intent: this.intent,
      surface: 'copilotInline',
      displayMode: this.hostContext.displayMode,
      workspaceMode: 'combined',
      targetDocument: this.context.domElement.ownerDocument,
      theme: this.hostContext.theme === 'dark' ? 'dark' : 'light',
      currentUserName: this.context.pageContext.user.displayName || 'Megan Bowen',
      toolProperties: this.properties as unknown as Readonly<Record<string, unknown>>,
      requestFullscreen: async (): Promise<void> => {
        if ((this.hostContext.availableDisplayModes || []).indexOf('fullscreen') >= 0) {
          const result = await this.requestDisplayModeAsync('fullscreen');
          if (result.mode !== 'fullscreen') return;
        }
      },
      publishContext: async (snapshot: IZavaModelContextSnapshot): Promise<void> => {
        await this.context.copilotBridge.updateModelContextAsync({
          content: [createCopilotTextContent(snapshot.summary)],
          structuredContent: snapshot as unknown as Record<string, unknown>
        });
      },
      sendFollowUp: async (message: string): Promise<void> => {
        const result = await this.context.copilotBridge.sendFollowUpMessageAsync([
          createCopilotTextContent(message)
        ]);
        if (result.isError) {
          throw new Error('Copilot did not accept the follow-up message.');
        }
      }
    }));
  }

  protected async onTeardown(reason?: string): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
    await super.onTeardown(reason);
  }
}