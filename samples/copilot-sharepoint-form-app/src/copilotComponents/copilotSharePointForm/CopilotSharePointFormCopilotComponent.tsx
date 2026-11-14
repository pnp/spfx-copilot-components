import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { webLightTheme, type Theme } from "@fluentui/react-components";
import { Environment, EnvironmentType } from "@microsoft/sp-core-library";
import { ThemeProvider, type IReadonlyTheme } from "@microsoft/sp-component-base";
import { BaseCopilotComponent, createCopilotTextContent, type SPCopilotDisplayMode } from "@microsoft/sp-copilot-component";

import { CopilotSharePointFormErrorBoundary } from "../../webparts/copilotSharePointForm/components/CopilotSharePointFormErrorBoundary";
import { CopilotSharePointFormHost } from "../../webparts/copilotSharePointForm/components/CopilotSharePointFormHost";
import { DEFAULT_ALLOWED_EXTENSIONS, type ISubmissionResult } from "../../webparts/copilotSharePointForm/models";
import { SpHttpAdapter } from "../../webparts/copilotSharePointForm/services/spHttpAdapter";
import {
  SharePointFormSubmissionService,
  isSharePointHost,
  type ISubmissionTarget
} from "../../webparts/copilotSharePointForm/services/SharePointFormSubmissionService";
import type { IHttpClient } from "../../webparts/copilotSharePointForm/services/http";
import { toFluentTheme } from "../../webparts/copilotSharePointForm/theme";
import type { ICopilotSharePointFormCopilotComponentProperties } from "./CopilotSharePointFormCopilotComponentProperties";

/**
 * OpenDocumentSubmissionForm renders the same document form used by the web part.
 * Copilot only supplies the site and library. The file picker stays in the form.
 */
export default class CopilotSharePointFormCopilotComponent extends BaseCopilotComponent<ICopilotSharePointFormCopilotComponentProperties> {
  private _root: Root | undefined;
  private _client: IHttpClient | undefined;
  private _service: SharePointFormSubmissionService | undefined;
  private _serviceKey: string = "";
  private _theme: Theme = webLightTheme;
  private _recovery: number = 0;

  protected async onInit(): Promise<void> {
    this._applyHostTheme();
    try {
      this._client = new SpHttpAdapter(this.context.spHttpClient);
    } catch (error) {
      console.error("[CopilotSharePointForm] Couldn't create the SharePoint client.", error);
    }
  }

  protected render(): void {
    const mode = this._displayMode();
    const element: React.ReactElement = React.createElement(
      CopilotSharePointFormErrorBoundary,
      {
        recovery: this._recovery,
        onRetry: this._retry
      },
      React.createElement(CopilotSharePointFormHost, {
        instanceId: this.context.instanceId,
        theme: this._theme,
        service: this._ensureService(),
        displayMode: mode,
        onExpand: mode === "fullscreen" ? undefined : this._expand,
        onSubmitted: this._handleSubmitted,
        onMeasured: this._handleContentSize
      })
    );
    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }
    this._root.render(element);
  }

  protected async onTeardown(): Promise<void> {
    if (this._root) {
      this._root.unmount();
      this._root = undefined;
    }
  }

  private _ensureService(): SharePointFormSubmissionService {
    const target = this._target();
    const key = [target.siteUrl, target.libraryName, target.libraryTitle, String(target.maxFileSizeMb), target.allowedExtensions || ""].join("|");
    if (!this._service || this._serviceKey !== key) {
      const client = this._client || failingClient();
      this._service = new SharePointFormSubmissionService(client, target);
      this._serviceKey = key;
    }
    return this._service;
  }

  private _target(): ISubmissionTarget {
    const properties = this.properties;
    return {
      siteUrl: properties && properties.siteUrl ? properties.siteUrl : "",
      libraryName: properties && properties.libraryName ? properties.libraryName : "",
      libraryTitle: properties && properties.libraryTitle ? properties.libraryTitle : "",
      configuredColumns: "",
      maxFileSizeMb: properties ? properties.maxFileSizeMb : undefined,
      allowedExtensions: properties && properties.allowedExtensions ? properties.allowedExtensions : DEFAULT_ALLOWED_EXTENSIONS,
      overwriteExisting: true,
      localEnvironment: Environment.type === EnvironmentType.Local || Environment.type === EnvironmentType.Test,
      pageHref: this._href(),
      currentWebUrl: this._currentWebUrl(),
      useCurrentWebWhenSiteUrlBlank: true,
      defaultLibraryTitleWhenBlank: true
    };
  }

  private _displayMode(): "inline" | "fullscreen" {
    const host = this.hostContext;
    if (host && host.displayMode === "fullscreen") {
      return "fullscreen";
    }
    return "inline";
  }

  private readonly _expand = async (): Promise<void> => {
    await this.requestDisplayModeAsync("fullscreen" as SPCopilotDisplayMode);
  };

  private readonly _handleContentSize = (width: number, height: number): void => {
    const safeWidth = width > 0 ? width : 360;
    const safeHeight = height > 0 ? height : 640;
    this.requestSizeChangeAsync(safeWidth, safeHeight).catch((error: unknown) => {
      console.error("[CopilotSharePointForm] Couldn't resize the Copilot canvas.", error);
    });
  };

  private readonly _handleSubmitted = async (result: ISubmissionResult): Promise<void> => {
    if (result.demo || !this.context.copilotBridge) {
      return;
    }
    await this.context.copilotBridge.sendFollowUpMessageAsync([
      createCopilotTextContent(
        `Submitted ${result.fileName} to ${result.libraryTitle}. The file was uploaded by the form, not attached to this chat.`
      )
    ]);
  };

  private readonly _retry = (): void => {
    this._recovery += 1;
    this._service = undefined;
    this._serviceKey = "";
    this.render();
  };

  private _applyHostTheme(): void {
    try {
      const provider: ThemeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
      const theme: IReadonlyTheme | undefined = provider.tryGetTheme();
      if (theme) {
        this._theme = toFluentTheme(theme);
      }
    } catch (error) {
      console.error("[CopilotSharePointForm] Couldn't read the host theme.", error);
    }
  }

  private _currentWebUrl(): string {
    try {
      const page = this.context.pageContext;
      const absolute = page && page.web && page.web.absoluteUrl ? page.web.absoluteUrl.trim() : "";
      if (absolute) {
        return absolute.replace(/\/+$/, "");
      }
    } catch (error) {
      console.error("[CopilotSharePointForm] Couldn't read the site address.", error);
    }
    try {
      const host = window.location.hostname || "";
      if (isSharePointHost(host) && window.location.origin) {
        return window.location.origin;
      }
    } catch (error) {
      console.error("[CopilotSharePointForm] Couldn't read the page origin.", error);
    }
    return "";
  }

  private _href(): string {
    try {
      return window.location.href;
    } catch (error) {
      console.error("[CopilotSharePointForm] Couldn't read the page address.", error);
      return "";
    }
  }
}

function failingClient(): IHttpClient {
  const fail = (): Promise<never> => Promise.reject(new Error("SharePoint isn't available in this session."));
  return {
    get: (): Promise<never> => fail(),
    post: (): Promise<never> => fail()
  };
}
