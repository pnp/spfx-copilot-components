import * as React from 'react';
import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import { SPHttpClient } from '@microsoft/sp-http';
import { RetryHandlerOptions } from '@microsoft/microsoft-graph-client';
import { createComparisonCache } from './comparison/cache';
import { CopilotReviewClient } from './services/copilotReview';
import { createReviewCache, type IReviewCache } from './services/reviewCache';
import { ComparisonChat, type IChatTransport } from './comparison/chat';
import { propertiesSchema, type IContentLensProperties } from './ContentLensCopilotComponentProperties';
import { standardCheckIds } from './domain/contracts';
import ContentLens from './components/ContentLens';
import { ResultErrorBoundary } from './components/ResultErrorBoundary';
import * as strings from 'ContentLensStrings';
import { createLiveContentLensServices, type IContentLensServices } from './services/live';
import { createRulesStore } from './services/rulesStore';
import type { ReviewSession } from './services/reviewSession';
import { SharePointContentService } from './services/sharePoint';
import { claimComponentSurface, releaseComponentSurface } from './roundTrip/componentSurface';

/** One tool opens the component. Reviews and comparisons run inside it and call the Copilot Chat API directly. */
export default class ContentLensCopilotComponent extends BaseCopilotComponent<IContentLensProperties> {
  private _services: IContentLensServices | undefined;
  private _review: CopilotReviewClient | undefined;
  private _reviewCache: IReviewCache | undefined;
  private _initial: IContentLensProperties = {};
  /** The completed review of this card, kept for the tab. The host can tear a card down and open it again, for example for full screen. */
  private _restored: ReviewSession | undefined;
  private _released = false;
  /** Stable across renders, so the view does not restart size observation on every update. */
  private readonly _requestSize = (width: number, height: number): Promise<boolean> => this.requestSizeChangeAsync(width, height);

  private sessionStorage(): Storage {
    const view = this.context.domElement.ownerDocument.defaultView;
    if (!view) throw new Error('Browser session storage is unavailable.');
    return view.sessionStorage;
  }

  protected onInit(): Promise<void> {
    // The launcher can prefill check IDs that this component does not know. Drop those IDs and keep the other properties.
    const raw = this.properties as { categoryIds?: unknown };
    const parsed = propertiesSchema.safeParse(Array.isArray(raw.categoryIds)
      ? { ...this.properties, categoryIds: raw.categoryIds.filter(id => (standardCheckIds as readonly unknown[]).indexOf(id) >= 0) }
      : this.properties);
    if (parsed.success) this._initial = parsed.data;
    // The cache scope is the host's component instance ID, so a card restores only its own review.
    // If the host assigns a new ID when it opens the card again, the card starts without a restored review.
    this._reviewCache = createReviewCache({
      tenantUrl: this.context.pageContext.site.absoluteUrl,
      userId: this.context.pageContext.user.loginName,
      scope: this.context.instanceId || '',
      storage: () => this.sessionStorage()
    });
    this._restored = this._reviewCache.get();
    return Promise.resolve();
  }

  private release = (): void => {
    if (this._released) return;
    this._released = true;
    // Detach the pending request before React cleanup aborts its signal.
    this._review?.dispose();
    this._services?.content.stop();
  };

  protected render(): void {
    if (this._released) return;
    const root = claimComponentSurface(this, this.context.domElement, this.release);
    if (!root) return;
    if (!this._services) {
      const transport: IChatTransport = {
        post: async (path, body, signal) => {
          const graph = await this.context.msGraphClientFactory.getClient('3');
          if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
          // A chat POST that fails can still have reached Copilot. Retries are off, so a message is not sent twice.
          return graph.api(path).version('beta').middlewareOptions([new RetryHandlerOptions(0, 0, () => false)])
            .option('signal', signal).post(body);
        }
      };

      this._review = new CopilotReviewClient(transport);
      this._services = createLiveContentLensServices({
        tenantUrl: this.context.pageContext.site.absoluteUrl,
        targetDocument: this.context.domElement.ownerDocument,
        analysis: this._review,
        chat: new ComparisonChat(transport),
        // SPHttpClient calls SharePoint with the signed-in user's own access, so no API permission is requested.
        get: (url, init) => this.context.spHttpClient.get(url, SPHttpClient.configurations.v1, { ...init, redirect: 'error' })
      });
      this._services.reviewCache = {
        get: () => this._reviewCache?.get(),
        clear: () => this._reviewCache?.clear(),
        save: state => {
          try {
            this._reviewCache?.save({ ...state, scan: (this._services!.content as SharePointContentService).exportSession() });
          } catch {
            this._reviewCache?.save(state);
          }
        }
      };
      if (this._restored?.scan) {
        // If the scan session cannot be restored, the review is still shown, but the scan cannot continue from it.
        try {
          (this._services.content as SharePointContentService).restoreSession(this._restored.scan);
        } catch {
          // Keep the restored review.
        }
      }
      this._services.rules = createRulesStore({
        tenantUrl: this.context.pageContext.site.absoluteUrl,
        userId: this.context.pageContext.user.loginName,
        storage: () => {
          const view = this.context.domElement.ownerDocument.defaultView;
          if (!view) throw new Error('Browser storage is unavailable.');
          return view.localStorage;
        }
      });
      this._services.comparisonCache = createComparisonCache({
        tenantUrl: this.context.pageContext.site.absoluteUrl,
        userId: this.context.pageContext.user.loginName,
        scope: this.context.instanceId || '',
        storage: () => this.sessionStorage()
      });
    }
    root.render(React.createElement(
      ResultErrorBoundary,
      { message: strings.ResultRenderFailed },
      React.createElement(ContentLens, {
        initial: this._initial,
        restored: this._restored,
        suggestedSiteUrl: this.context.pageContext.web.absoluteUrl,
        hostContext: this.hostContext,
        targetDocument: this.context.domElement.ownerDocument,
        strings,
        services: this._services,
        onRequestDisplayMode: async mode => {
          await this.requestDisplayModeAsync(mode);
        },
        onRequestSizeChange: this._requestSize,
        onOpenLink: async url => {
          const parsed = new URL(url);
          if (parsed.protocol !== 'https:') throw new Error('Only HTTPS source links are supported.');
          const result = await this.context.copilotBridge.openLinkAsync(url);
          if (result.isError) throw new Error('Host denied opening the source link.');
        }
      })
    ));
  }

  protected async onTeardown(): Promise<void> {
    this.release();
    releaseComponentSurface(this, this.context.domElement);
  }

  protected onDispose(): void {
    this.release();
    releaseComponentSurface(this, this.context.domElement);
  }
}
