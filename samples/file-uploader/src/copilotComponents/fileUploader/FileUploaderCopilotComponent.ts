import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { ISPCopilotBridge } from '@microsoft/sp-copilot-component';

import {
  parseProperties,
  IFileUploaderCopilotComponentProperties
} from './FileUploaderCopilotComponentProperties';
import { FileUploaderApp, IAppProps, IHostProps } from './components/FileUploaderApp';
import { StoreUnavailableApp, IStoreUnavailableProps } from './components/StoreUnavailableApp';
import { StoreStartingApp, IStoreStartingProps } from './components/StoreStartingApp';
import { createSession, ISession } from './models/session';
import { PropertiesVersion } from './logic/propertiesVersion';
import { FilingController } from './logic/filingController';
import { RecentController } from './logic/recentController';
import { resolveDocumentStoreAsync } from './services/documentStoreFactory';
import type { IDocumentStoreService } from './services/IDocumentStoreService';

/** The outcome of starting the store: a ready store, or the reason there is none. */
interface IStartup {
  store?: IDocumentStoreService;
  error?: string;
}

/**
 * Resolves the store (the tenant decides mock or live — todo.md Decision 11) and
 * runs its one warm-up. Never rejects: a failure comes back as a message for the
 * store-unavailable view, so it can never leave an empty canvas (audit H1).
 */
async function startStoreAsync(context: unknown): Promise<IStartup> {
  try {
    const store: IDocumentStoreService = await resolveDocumentStoreAsync({ context });
    await store.initializeAsync();
    return { store };
  } catch (e) {
    return {
      error: e instanceof Error && e.message.trim() !== '' ? e.message : 'The records library could not be reached.'
    };
  }
}

/**
 * Entry point. Owns the five state classes (AGENTS.md §3) and keeps them
 * apart:
 *  1. host state          -> read from `this.hostContext` on every render
 *  2. invocation state    -> `parseProperties(this.properties)` + version token
 *  3. transient state     -> `this._session`, rebuilt only when the token changes
 *  4. session settings    -> (none yet)
 *  5. confirmed receipts  -> `this._session.filing.receipts`, written only by `confirm()`
 *
 * `render()` is idempotent: it derives everything from hostContext +
 * properties + the current session and hands it to React.
 */
export default class FileUploaderCopilotComponent extends BaseCopilotComponent<IFileUploaderCopilotComponentProperties> {
  /** False until `onInit()` has resolved the store or failed to (8.8 L2). */
  private _started: boolean = false;
  /** True once the host has rendered while `onInit()` was still running. */
  private _renderedBeforeStart: boolean = false;
  private _store: IDocumentStoreService | undefined;
  /** Why the store could not be started, when it could not (H1). Rendered, never swallowed. */
  private _startupError: string | undefined;
  private _retrying: boolean = false;
  private readonly _version: PropertiesVersion = new PropertiesVersion();
  private _session: ISession | undefined;
  private _controller: FilingController | undefined;
  private _recent: RecentController | undefined;
  /** The store the controllers were built on. Never allowed to differ from `_store` at render (8.8 L2). */
  private _controllerStore: IDocumentStoreService | undefined;
  /** Flips 0 -> 1 after the first commit, then stays stable (AGENTS.md §4 Theming). */
  private _remountKey: number = 0;

  /**
   * The store is resolved and warmed here, before the first render, so
   * `getKinds()` / `getDepartments()` can stay synchronous for the views (see
   * `IDocumentStoreService.initializeAsync`). Passing `this.context` lets the
   * tenant setting decide between the mock and the live store.
   *
   * **The host does not wait for this.** It can call `render()` while the
   * tenant read is still in flight (8.8 L2), so `render()` shows the starting
   * view until it settles — and nothing re-renders on our behalf afterwards, so
   * if the host rendered early, this does.
   */
  protected async onInit(): Promise<void> {
    this._applyStartup(await startStoreAsync(this.context));
    this._started = true;
    if (this._renderedBeforeStart) {
      this.render();
    }
  }

  protected render(): void {
    if (!this._started) {
      // Mock or live is the tenant's call and has not been read yet. Inventing a
      // mock here is what filed into nothing on 2026-09-22: the views later drew
      // live copy while controllers built on this mock took the save (8.8 L2).
      this._renderedBeforeStart = true;
      this._renderStarting();
      return;
    }
    if (this._startupError !== undefined || !this._store) {
      this._renderUnavailable(this._startupError || 'The records library could not be reached.');
      return;
    }

    const props: IFileUploaderCopilotComponentProperties = parseProperties(this.properties);
    const { version, changed } = this._version.next(props);
    const store: IDocumentStoreService = this._store;

    if (changed || !this._session || !this._controller || !this._recent || this._controllerStore !== store) {
      // A genuinely new prompt, or a different store (Try again after a failed
      // start): start over, so the controllers always save into the store the
      // views describe. A passive re-render never reaches here, so a theme flip
      // or a resize keeps the user's in-progress edits.
      this._controllerStore = store;
      this._session = createSession(props, version);
      this._controller = new FilingController(
        this._session,
        store,
        () => new Date(),
        () => this.render(),
        props
      );
      this._recent = new RecentController(this._session, store, () => new Date(), () => this.render());
    }

    const viewProps: IAppProps = {
      host: this._hostProps(),
      session: this._session,
      store,
      controller: this._controller,
      recent: this._recent,
      now: () => new Date(),
      refresh: () => this.render(),
      requestFullscreen: () => this._requestFullscreen(),
      openLink: this._openLink(),
      targetDocument: this.context.domElement.ownerDocument || undefined,
      remountKey: this._remountKey
    };

    this._mount(React.createElement(FileUploaderApp, viewProps));
  }

  protected onDispose(): void {
    ReactDOM.unmountComponentAtNode(this.context.domElement);
    super.onDispose();
  }

  private _applyStartup(startup: IStartup): void {
    this._store = startup.store;
    this._startupError = startup.error;
  }

  /** "Try again" on the store-unavailable view: one attempt at a time, then re-render either way. */
  private _retryStartup(): void {
    if (this._retrying) {
      return;
    }
    this._retrying = true;
    this.render();
    startStoreAsync(this.context)
      .then(startup => {
        this._retrying = false;
        this._applyStartup(startup);
        this.render();
      })
      .catch(() => undefined);
  }

  private _renderStarting(): void {
    const props: IStoreStartingProps = {
      host: this._hostProps(),
      targetDocument: this.context.domElement.ownerDocument || undefined,
      remountKey: this._remountKey
    };
    this._mount(React.createElement(StoreStartingApp, props));
  }

  private _renderUnavailable(message: string): void {
    const props: IStoreUnavailableProps = {
      host: this._hostProps(),
      message,
      retrying: this._retrying,
      onRetry: () => this._retryStartup(),
      targetDocument: this.context.domElement.ownerDocument || undefined,
      remountKey: this._remountKey
    };
    this._mount(React.createElement(StoreUnavailableApp, props));
  }

  /**
   * The only `ReactDOM.render` call, for either root, so it stays paired with the
   * one `unmountComponentAtNode` in `onDispose` (lint
   * `@rushstack/pair-react-dom-render-unmount`, `docs/GOTCHAS.md`).
   */
  private _mount(element: React.ReactElement): void {
    ReactDOM.render(element, this.context.domElement);
    if (this._remountKey === 0) {
      this._remountKey = 1;
    }
  }

  /** Host state, projected. Never stored — recomputed each render. */
  private _hostProps(): IHostProps {
    const modes: string[] = (this.hostContext.availableDisplayModes || []) as string[];
    const dims = this.hostContext.containerDimensions as { width?: number } | undefined;
    return {
      theme: this.hostContext.theme === 'dark' ? 'dark' : 'light',
      displayMode: this.hostContext.displayMode === 'fullscreen' ? 'fullscreen' : 'inline',
      canFullscreen: modes.indexOf('fullscreen') >= 0,
      width: dims && typeof dims.width === 'number' ? dims.width : undefined
    };
  }

  /** Inline -> fullscreen is the only transition the component may request; collapse is host-owned. */
  private async _requestFullscreen(): Promise<void> {
    if (!this._hostProps().canFullscreen) {
      return;
    }
    await this.requestDisplayModeAsync('fullscreen');
  }

  /**
   * The host's way out of the canvas, feature-detected: the iframe sandbox
   * swallows a plain `target="_blank"` (8.8 L9). `openLinkAsync` is `@beta`
   * and the host may deny it (`isError`) or throw; both resolve false, so the
   * view can say so instead of claiming the link opened (R25, R26).
   */
  private _openLink(): ((url: string) => Promise<boolean>) | undefined {
    const bridge: Partial<ISPCopilotBridge> | undefined = this.context.copilotBridge;
    if (!bridge || typeof bridge.openLinkAsync !== 'function') {
      return undefined;
    }
    const openLinkAsync: ISPCopilotBridge['openLinkAsync'] = bridge.openLinkAsync.bind(bridge);
    return async (url: string): Promise<boolean> => {
      try {
        const result = await openLinkAsync(url);
        return !(result && result.isError);
      } catch {
        return false;
      }
    };
  }
}
