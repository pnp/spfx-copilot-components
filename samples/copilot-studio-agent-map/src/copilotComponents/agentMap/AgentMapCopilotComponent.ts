import { BaseCopilotComponent, type ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';
import { AadHttpClient, type HttpClientResponse } from '@microsoft/sp-http';

import { normalizeEnvironmentId } from '../../app/dataverse/environmentId';
import type { McpUiHostContext } from '../../app/host/bridge';
import { createComponentApp } from '../../app/host/componentApp';
import { mountHostedApp } from '../../app/host/HostedApp';
import { configureHostRuntime } from '../../app/host/runtime';
import { AgentMapApp } from '../../app/widgets/agent-map/AgentMapApp';
import { createHostBootstrap, type HostBootstrap } from '../../app/widgets/shared/bootstrap';
import type { IAgentMapCopilotComponentProperties } from './AgentMapCopilotComponentProperties';
import { compact, guidValue, textValue } from './toolInput';

/**
 * The Agent Map of a Copilot Studio agent as a SharePoint Copilot UX component.
 *
 * The view is the Agent Map view of the Agent Review MCP App, without changes.
 * The MCP server is not necessary: the three map tools run in the browser and
 * read Dataverse with the signed-in user's delegated token from
 * `aadHttpClientFactory`. Inline mode shows only the map. Full-screen mode adds
 * the environment and agent selectors, search, filters, the list, and details.
 */
export default class AgentMapCopilotComponent extends BaseCopilotComponent<IAgentMapCopilotComponentProperties> {
  private _bootstrap: HostBootstrap | undefined;
  private _unmount: (() => void) | undefined;

  protected async onInit(): Promise<void> {
    const clients = new Map<string, Promise<AadHttpClient>>();
    const client = (resource: string): Promise<AadHttpClient> => {
      let pending = clients.get(resource);
      if (!pending) {
        pending = this.context.aadHttpClientFactory.getClient(resource);
        clients.set(resource, pending);
        pending.catch(() => clients.delete(resource));
      }
      return pending;
    };

    configureHostRuntime({
      fetch: async (resource, url, init) => {
        const aadClient = await client(resource);
        return toNativeResponse(await aadClient.fetch(url, AadHttpClient.configurations.v1, init));
      }
    });

    const app = createComponentApp({
      hostContext: () => this._hostSnapshot(),
      requestDisplayMode: async mode => (await this.requestDisplayModeAsync(mode)).mode,
      requestSize: (width, height) => this.requestSizeChangeAsync(width, height),
      openLink: url => this.context.copilotBridge.openLinkAsync(url)
    });
    this._bootstrap = createHostBootstrap({ app, view: 'agent-map', openTool: 'show_agent_map', host: this._hostSnapshot() });
  }

  protected render(): void {
    const bootstrap = this._bootstrap;
    if (!bootstrap) return;
    bootstrap.setHost(this._hostSnapshot());
    if (this._unmount) return;

    this._unmount = mountHostedApp({
      element: this.context.domElement,
      bootstrap,
      identifierPrefix: 'agent-map-',
      App: AgentMapApp,
      loadingLabel: 'Loading the agent map'
    });
    bootstrap.start(this._toolInput()).catch(error => console.error('Unable to start the Agent Map.', error));
  }

  protected async onTeardown(): Promise<void> {
    this._release();
  }

  protected onDispose(): void {
    this._release();
    super.onDispose();
  }

  /** The `show_agent_map` arguments from the Copilot tool properties. Values that are not valid are omitted. */
  private _toolInput(): Record<string, unknown> {
    const properties: Partial<IAgentMapCopilotComponentProperties> = this.properties ?? {};
    return compact({
      environmentId: normalizeEnvironmentId(properties.environmentId),
      environmentName: textValue(properties.environmentName, 200),
      agentId: guidValue(properties.agentId),
      agentName: textValue(properties.agentName, 200)
    });
  }

  private _release(): void {
    const unmount = this._unmount;
    this._unmount = undefined;
    unmount?.();
  }

  private _hostSnapshot(): McpUiHostContext {
    // `platform` is in the beta host context type only. The host can supply it at runtime.
    const { theme, displayMode, availableDisplayModes, containerDimensions, platform } =
      (this.hostContext ?? {}) as ICopilotComponentHostContext & Pick<McpUiHostContext, 'platform'>;
    return {
      theme,
      displayMode,
      availableDisplayModes: availableDisplayModes ? [...availableDisplayModes] : undefined,
      containerDimensions: containerDimensions ? { ...containerDimensions } : undefined,
      platform
    };
  }
}

/** The view code reads `Response.body` as a stream, so it needs the browser response object. */
async function toNativeResponse(response: HttpClientResponse): Promise<Response> {
  const native = (response as unknown as { nativeResponse?: Response }).nativeResponse;
  if (native && typeof native.arrayBuffer === 'function' && 'body' in native) return native;
  const noBody = response.status === 204 || response.status === 205 || response.status === 304;
  return new Response(noBody ? null : await response.arrayBuffer(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
