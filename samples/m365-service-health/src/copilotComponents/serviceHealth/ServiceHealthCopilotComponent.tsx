import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

import ServiceHealth from './components/ServiceHealth';
import type { IServiceHealthProps } from './components/ServiceHealth';
import type { IServiceHealthCopilotComponentProperties } from './ServiceHealthCopilotComponentProperties';
import { ServiceHealthApi } from './services';

import * as strings from 'ServiceHealthCopilotComponentStrings';
import { buildFallbackMarkup } from './utils';

/**
 * SPFx Copilot Component that renders live Microsoft 365 service health.
 *
 * Data is read from Microsoft Graph (`/admin/serviceAnnouncement`) through the
 * SPFx Pairwise Broker, so no token handling is required here. The tenant must
 * grant `ServiceHealth.Read.All` (declared in `package-solution.json`).
 *
 * Lifecycle:
 *  1. `onInit()` — creates the Graph-backed service.
 *  2. `render()` — mounts the React tree into `this.context.domElement`.
 *     Re-invoked by the framework on host-context changes (theme, display mode).
 *  3. `onTeardown()` — unmounts React before the host tears down the iframe.
 */
export default class ServiceHealthCopilotComponent extends BaseCopilotComponent<IServiceHealthCopilotComponentProperties> {

  private serviceHealthApi: ServiceHealthApi | undefined;
    private _root: Root | undefined

  private readonly loadServiceHealth: IServiceHealthProps["loadServiceHealth"] = () => {
    if (!this.serviceHealthApi) {
      return Promise.reject(new Error('Service health is not initialized.'));
    }

    return this.serviceHealthApi.getServiceHealth(this.requestedService);
  };

  private readonly loadServiceIssues: IServiceHealthProps['loadServiceIssues'] = (serviceId: string) => {
    if (!this.serviceHealthApi) {
      return Promise.reject(new Error('Service health is not initialized.'));
    }

    return this.serviceHealthApi.getServiceIssues(serviceId);
  };

  private readonly onRequestDisplayMode: IServiceHealthProps['onRequestDisplayMode'] = async (mode: SPCopilotDisplayMode) => {
    await this.requestDisplayModeAsync(mode);
  };

  private get requestedService(): string {
    return this.properties.mode === 'specific' ? (this.properties.serviceName || 'all').trim() : 'all';
  }

  protected onInit(): Promise<void> {
    this.serviceHealthApi = new ServiceHealthApi(this.context.msGraphClientFactory);
    return Promise.resolve();
  }

  protected render(): void {
    const props: IServiceHealthProps = {
      serviceName: this.requestedService,
      hostContext: this.hostContext,
      onRequestDisplayMode: this.onRequestDisplayMode,
      loadServiceHealth: this.loadServiceHealth,
      loadServiceIssues: this.loadServiceIssues,
      targetDocument: this.context.domElement.ownerDocument,
      strings
    };

    const root = this.context.domElement;
    root.style.display = 'block';
    root.style.minHeight = '180px';
    root.style.padding = '0';

    try {
      if(!this._root) {
        this._root = createRoot(this.context.domElement);
      }
      this._root.render(React.createElement(ServiceHealth, props));
    } catch (renderError) {
      const message = renderError instanceof Error ? renderError.message : strings.ErrorUnknown;
      root.innerHTML = buildFallbackMarkup(this.requestedService, message, strings);
    }
  }

  protected onTeardown(): Promise<void> {
    this._root?.unmount();
    return Promise.resolve();
  }
}
