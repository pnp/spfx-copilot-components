import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BaseCopilotComponent, createCopilotTextContent } from '@microsoft/sp-copilot-component';
import RevenueApp, { type IModelContextSnapshot } from './RevenueApp';
import RevenueThemeProvider from './RevenueThemeProvider';
import { getIntent, type IRevenueProperties, type RevenueIntentKey } from './catalog';
import { createModelContext } from './modelContext';

abstract class RevenueCopilotComponentBase<TProperties extends IRevenueProperties> extends BaseCopilotComponent<TProperties> {
  protected abstract intentKey: RevenueIntentKey;
  private _root: Root | undefined;
  private _mutationObserver: MutationObserver | undefined;
  private _resizeObserver: ResizeObserver | undefined;
  private _resizeWindow: Window | undefined;
  private _resizeFrame: number | undefined;
  private _observedContent: HTMLElement | undefined;
  private _bridgeQueue: Promise<unknown> = Promise.resolve();

  protected render(): void {
    const definition = getIntent(this.intentKey);
    const availableModes = this.hostContext.availableDisplayModes || [];
    const canExpand = this.hostContext.displayMode !== 'fullscreen' && availableModes.indexOf('fullscreen') >= 0;
    const currentUserName = this.context.pageContext.user.displayName || definition.role;

    const element = (
      <RevenueThemeProvider theme={this.hostContext.theme} targetDocument={this.context.domElement.ownerDocument}>
        <RevenueApp
          definition={definition}
          properties={this.properties}
          currentUserName={currentUserName}
          displayMode={this.hostContext.displayMode}
          onRequestFullscreen={canExpand ? this._requestFullscreen : undefined}
          onUpdateModelContext={this._updateModelContext}
          onSendFollowUp={this._sendFollowUp}
        />
      </RevenueThemeProvider>
    );

    if (!this._root) {
      const view = this.context.domElement.ownerDocument.defaultView;
      if (!view) throw new Error('The Copilot component requires an owning browser window to report its size.');
      this._root = createRoot(this.context.domElement);
      this._resizeWindow = view;
      this._mutationObserver = new view.MutationObserver(this._scheduleSizeChange);
      this._mutationObserver.observe(this.context.domElement, { childList: true, subtree: true, characterData: true, attributes: true });
      if (view.ResizeObserver) this._resizeObserver = new view.ResizeObserver(this._scheduleSizeChange);
    }
    this._root.render(element);
    this._scheduleSizeChange();
  }

  protected async onTeardown(reason?: string): Promise<void> {
    this._disposeRender();
    await super.onTeardown(reason);
  }

  protected onDispose(): void {
    this._disposeRender();
    super.onDispose();
  }

  private _disposeRender(): void {
    this._mutationObserver?.disconnect();
    this._mutationObserver = undefined;
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    this._observedContent = undefined;
    if (this._resizeFrame !== undefined) this._resizeWindow?.cancelAnimationFrame(this._resizeFrame);
    this._resizeFrame = undefined;
    this._resizeWindow = undefined;
    this._root?.unmount();
    this._root = undefined;
  }

  private _scheduleSizeChange = (): void => {
    if (!this._root || !this._resizeWindow || this._resizeFrame !== undefined) return;
    this._resizeFrame = this._resizeWindow.requestAnimationFrame(() => {
      this._resizeFrame = undefined;
      if (!this._root) return;
      const mode = this.hostContext.displayMode === 'fullscreen' ? 'fullscreen' : 'inline';
      const content = this.context.domElement.querySelector<HTMLElement>(`[data-layout="${this.intentKey}-${mode}"]`);
      if (!content) return;
      if (this._observedContent !== content) {
        this._resizeObserver?.disconnect();
        this._resizeObserver?.observe(content);
        this._observedContent = content;
      }
      const bounds = content.getBoundingClientRect();
      const width = Math.ceil(Math.max(bounds.width, content.scrollWidth));
      const height = Math.ceil(Math.max(bounds.height, content.scrollHeight));
      if (width <= 0 || height <= 0) return;
      this.requestSizeChangeAsync(width, height).catch((error: unknown) => {
        console.error('The Copilot component size could not be reported.', error);
      });
    });
  };

  private _requestFullscreen = async (): Promise<void> => {
    await this.requestDisplayModeAsync('fullscreen');
  };

  private _enqueueBridgeOperation<T>(operation: () => Promise<T>): Promise<T> {
    const result = this._bridgeQueue.then(operation, operation);
    this._bridgeQueue = result;
    return result;
  }

  private _updateModelContext = (snapshot: IModelContextSnapshot): Promise<void> => {
    return this._enqueueBridgeOperation(() => this.context.copilotBridge.updateModelContextAsync(createModelContext(snapshot)));
  };

  private _sendFollowUp = (message: string, snapshot: IModelContextSnapshot): Promise<boolean> => {
    return this._enqueueBridgeOperation(async () => {
      await this.context.copilotBridge.updateModelContextAsync(createModelContext(snapshot));
      const result = await this.context.copilotBridge.sendFollowUpMessageAsync([createCopilotTextContent(message)]);
      return !result.isError;
    });
  };
}

export default RevenueCopilotComponentBase;