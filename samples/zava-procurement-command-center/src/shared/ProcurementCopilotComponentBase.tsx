import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BaseCopilotComponent, createCopilotTextContent } from '@microsoft/sp-copilot-component';
import ProcurementApp, { type IModelContextSnapshot } from './ProcurementApp';
import ProcurementThemeProvider from './ProcurementThemeProvider';
import { getIntent, type IProcurementProperties, type ProcurementIntentKey } from './catalog';
import { createModelContext } from './modelContext';

abstract class ProcurementCopilotComponentBase<T extends IProcurementProperties> extends BaseCopilotComponent<T> {
  protected abstract intentKey: ProcurementIntentKey;
  private root: Root | undefined;
  private mutationObserver: MutationObserver | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private resizeWindow: Window | undefined;
  private resizeFrame: number | undefined;
  private observedContent: HTMLElement | undefined;
  private acceptedSize: string | undefined;
  private resizeInFlight = false;
  private resizeQueued = false;
  private generation = 0;
  private bridgeQueue: Promise<unknown> = Promise.resolve();

  protected render(): void {
    const definition = getIntent(this.intentKey);
    const canExpand = this.hostContext.displayMode !== 'fullscreen' && (this.hostContext.availableDisplayModes || []).indexOf('fullscreen') >= 0;
    const app = <ProcurementThemeProvider theme={String(this.hostContext.theme || '')} targetDocument={this.context.domElement.ownerDocument}>
      <ProcurementApp definition={definition} properties={this.properties}
        currentUserName={this.context.pageContext.user.displayName || definition.role} displayMode={this.hostContext.displayMode}
        onRequestFullscreen={canExpand ? this.expand : undefined} onUpdateModelContext={this.updateContext} onSendFollowUp={this.sendFollowUp} />
    </ProcurementThemeProvider>;
    if (!this.root) {
      const view = this.context.domElement.ownerDocument.defaultView;
      if (!view) throw new Error('The procurement component needs an owning browser window to report its content size.');
      this.root = createRoot(this.context.domElement);
      this.resizeWindow = view;
      this.mutationObserver = new view.MutationObserver(this.scheduleSizeChange);
      this.mutationObserver.observe(this.context.domElement, { childList: true, subtree: true, attributes: true, characterData: true });
      if (view.ResizeObserver) this.resizeObserver = new view.ResizeObserver(this.scheduleSizeChange);
    }
    this.root.render(app);
    this.scheduleSizeChange();
  }

  protected async onTeardown(reason?: string): Promise<void> {
    this.disposeRender();
    await super.onTeardown(reason);
  }
  protected onDispose(): void { this.disposeRender(); super.onDispose(); }
  private disposeRender(): void {
    this.generation++;
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.mutationObserver = undefined;
    this.resizeObserver = undefined;
    if (this.resizeFrame !== undefined) this.resizeWindow?.cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = undefined;
    this.resizeWindow = undefined;
    this.observedContent = undefined;
    this.acceptedSize = undefined;
    this.resizeInFlight = false;
    this.resizeQueued = false;
    this.root?.unmount();
    this.root = undefined;
  }
  private scheduleSizeChange = (): void => {
    if (!this.root || !this.resizeWindow || this.resizeFrame !== undefined) return;
    this.resizeFrame = this.resizeWindow.requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      const content = this.context.domElement.querySelector<HTMLElement>('[data-procurement-content]');
      if (!this.root || !content) return;
      if (this.observedContent !== content) {
        this.resizeObserver?.disconnect();
        this.resizeObserver?.observe(content);
        this.observedContent = content;
      }
      const bounds = content.getBoundingClientRect();
      const width = Math.ceil(Math.max(bounds.width, content.scrollWidth));
      const height = Math.ceil(Math.max(bounds.height, content.scrollHeight));
      const signature = `${this.hostContext.displayMode}:${width}:${height}`;
      if (width <= 0 || height <= 0 || signature === this.acceptedSize) return;
      if (this.resizeInFlight) { this.resizeQueued = true; return; }
      this.resizeInFlight = true;
      const generation = this.generation;
      const finish = (): void => {
        if (generation !== this.generation) return;
        this.resizeInFlight = false;
        if (this.resizeQueued) { this.resizeQueued = false; this.scheduleSizeChange(); }
      };
      this.requestSizeChangeAsync(width, height).then(accepted => {
        if (generation !== this.generation) return;
        if (accepted) this.acceptedSize = signature;
        else console.warn('Copilot declined the procurement content size. A later layout change will retry.');
        finish();
      }, (reason: unknown) => {
        if (generation === this.generation) console.error('Procurement content size could not be reported to Copilot.', reason);
        finish();
      });
    });
  };
  private expand = async (): Promise<void> => { await this.requestDisplayModeAsync('fullscreen'); };
  private enqueue<TValue>(operation: () => Promise<TValue>): Promise<TValue> {
    const generation = this.generation;
    const execute = (): Promise<TValue> => generation === this.generation ? operation() :
      Promise.reject(new Error('The procurement experience closed before this Copilot operation could be sent.'));
    const result = this.bridgeQueue.then(execute, execute);
    this.bridgeQueue = result;
    return result;
  }
  private updateContext = (value: IModelContextSnapshot): Promise<void> =>
    this.enqueue(() => this.context.copilotBridge.updateModelContextAsync(createModelContext(value)));
  private sendFollowUp = (message: string, snapshot: IModelContextSnapshot): Promise<boolean> => {
    const generation = this.generation;
    return this.enqueue(async () => {
      await this.context.copilotBridge.updateModelContextAsync(createModelContext(snapshot));
      if (generation !== this.generation) throw new Error('The procurement experience closed before the question could be sent.');
      const result = await this.context.copilotBridge.sendFollowUpMessageAsync([createCopilotTextContent(message)]);
      return !result.isError;
    });
  };
}
export default ProcurementCopilotComponentBase;