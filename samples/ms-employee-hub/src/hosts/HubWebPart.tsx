import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { PropertyPaneDropdown, PropertyPaneTextField, type IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import type { Workspace } from '../shared/types';
import { catalog } from '../shared/catalog';
import HostFrame from './HostFrame';
import { fieldSpec, normalizeInputs } from './fields';

export abstract class HubWebPart extends BaseClientSideWebPart<Record<string, string | number | boolean | undefined>> {
  protected abstract readonly entry: number;
  protected readonly landing?: Workspace;
  private root: Root | undefined;
  private dark = false;
  public render(): void {
    const row = catalog.find(c => c.id === this.entry)!;
    const raw: Record<string, unknown> = {};
    for (const key of row.fields) {
      const value = this.properties[key];
      if (value === '' || value === undefined || this.entry === 30) continue;
      const kind = fieldSpec(this.entry, key).kind;
      raw[key] = kind === 'number' && typeof value === 'string' && /^\d+$/.test(value) ? Number(value)
        : kind === 'boolean' && value === 'true' ? true : kind === 'boolean' && value === 'false' ? false : value;
    }
    const parsed = normalizeInputs(this.entry, row.fields, raw);
    if (!this.root) this.root = createRoot(this.domElement);
    this.root.render(<HostFrame key={this.context.pageContext.user?.loginName} entry={this.entry} parsed={parsed}
      document={this.domElement.ownerDocument} prefix={`hub-${this.instanceId}-`} dark={this.dark}
      mode={this.entry === 30 ? 'full' : 'inline'} landing={this.landing || (this.entry === 30 ? 'company' : undefined)}
      fixed={!!this.landing} displayName={this.context.pageContext.user?.displayName || 'Colleague'} />);
  }
  protected onThemeChanged(theme: IReadonlyTheme | undefined): void {
    this.dark = !!theme?.isInverted;
    if (this.root) this.render();
  }
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    if (this.entry === 30) return { pages: [] };
    const row = catalog.find(c => c.id === this.entry)!;
    return { pages: [{ header: { description: `${row.title} · page defaults` }, groups: [{
      groupName: 'Starting view', groupFields: row.fields.map(key => {
        const spec = fieldSpec(this.entry, key);
        const options = spec.choices || spec.numbers?.map(String) || (spec.kind === 'boolean' ? ['true', 'false'] : undefined);
        return options ? PropertyPaneDropdown(key, { label: spec.description, options: [{ key: '', text: 'Use default' }, ...options.map(v => ({ key: v, text: v }))] })
          : PropertyPaneTextField(key, { label: spec.description });
      })
    }] }] };
  }
  protected onDispose(): void { this.root?.unmount(); this.root = undefined; }
}
