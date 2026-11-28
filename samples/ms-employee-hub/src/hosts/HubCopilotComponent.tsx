import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BaseCopilotComponent, createCopilotTextContent } from '@microsoft/sp-copilot-component';
import HostFrame from './HostFrame';
import type { BridgePort } from './bridge';
import { normalizeInputs } from './fields';
import { catalog } from '../shared/catalog';

export abstract class HubCopilotComponent extends BaseCopilotComponent<Record<string, string | number | boolean>> {
  protected abstract readonly entry: number;
  private root: Root | undefined;
  private readonly port: BridgePort = {
    publish: value => this.context.copilotBridge.updateModelContextAsync({ content: value.content.map(c => createCopilotTextContent(c.text)), structuredContent: value.structuredContent }),
    send: text => this.context.copilotBridge.sendFollowUpMessageAsync([createCopilotTextContent(text)])
  };
  private readonly expand = async (): Promise<boolean> => (await this.requestDisplayModeAsync('fullscreen')).mode === 'fullscreen';
  private readonly resize = (width: number, height: number): Promise<boolean> => this.requestSizeChangeAsync(width, height);
  protected render(): void {
    const container = this.context.domElement;
    const row = catalog.find(c => c.id === this.entry)!;
    const parsed = normalizeInputs(this.entry, row.fields, this.properties || {});
    if (!this.root) this.root = createRoot(container);
    this.root.render(<HostFrame key={this.context.pageContext.user?.loginName} entry={this.entry} document={container.ownerDocument}
      prefix={`hub-${this.context.instanceId}-`} parsed={parsed} dark={this.hostContext.theme === 'dark'}
      displayName={this.context.pageContext.user?.displayName || 'Colleague'} mode={this.hostContext.displayMode === 'fullscreen' ? 'full' : 'inline'}
      port={this.port} resize={this.resize} expand={this.hostContext.availableDisplayModes?.some(m => m === 'fullscreen') ? this.expand : undefined} />);
  }
  protected async onTeardown(): Promise<void> { this.release(); }
  protected onDispose(): void { this.release(); }
  private release(): void { this.root?.unmount(); this.root = undefined; }
}
