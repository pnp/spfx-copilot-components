import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import VivaEngageExplorer from './components/VivaEngageExplorer';
import { GraphVivaEngageService } from './services/GraphVivaEngageService';
import {
  propertiesSchema,
  type IVivaEngageExplorerCopilotComponentProperties
} from './VivaEngageExplorerCopilotComponentProperties';
import * as strings from 'VivaEngageExplorerCopilotComponentStrings';

class ExplorerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | undefined }
> {
  public state: { error: Error | undefined } = { error: undefined };

  public static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  public render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    // Keep the failure view independent of Fluent UI and its providers.
    return (
      <section role="alert" style={{ padding: 24, fontFamily: 'Segoe UI, sans-serif' }}>
        <h1>{strings.Title}</h1>
        <p>{strings.RenderError}</p>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {this.state.error.name}: {this.state.error.message}
        </pre>
        <button type="button" onClick={() => this.setState({ error: undefined })}>{strings.Retry}</button>
      </section>
    );
  }
}

export default class VivaEngageCommunityExplorer extends BaseCopilotComponent<IVivaEngageExplorerCopilotComponentProperties> {
  private _service!: GraphVivaEngageService;
  private _root: Root | undefined;

  protected async onInit(): Promise<void> {
    this._service = new GraphVivaEngageService(this.context.aadHttpClientFactory);
  }

  protected render(): void {
    if (!this._root) this._root = createRoot(this.context.domElement);
    const query = propertiesSchema.safeParse(this.properties);
    const explorer = React.createElement(VivaEngageExplorer, {
      query: query.success ? query.data : undefined,
      service: this._service,
      hostContext: this.hostContext,
      targetDocument: this.context.domElement.ownerDocument,
      strings,
      onRequestDisplayMode: async mode => {
        const result = await this.requestDisplayModeAsync(mode);
        if (result.mode !== mode) throw new Error('Display mode request declined');
      }
    });
    // The host's render lifecycle is synchronous, including its ready/size notification.
    flushSync(() => {
      this._root!.render(React.createElement(ExplorerErrorBoundary, undefined, explorer));
    });
  }

  protected async onTeardown(): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
    this._service.dispose();
  }

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
    this._service.dispose();
  }
}
