import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Environment, EnvironmentType, Version } from "@microsoft/sp-core-library";
import { ThemeProvider, type IReadonlyTheme } from "@microsoft/sp-component-base";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { webLightTheme, type Theme } from "@fluentui/react-components";

import * as strings from "CopilotSharePointFormWebPartStrings";
import { CopilotSharePointFormErrorBoundary } from "./components/CopilotSharePointFormErrorBoundary";
import { CopilotSharePointFormHost } from "./components/CopilotSharePointFormHost";
import { maxFileSizeError } from "./logic/fileValidation";
import { DEFAULT_ALLOWED_EXTENSIONS } from "./models";
import { SpHttpAdapter } from "./services/spHttpAdapter";
import {
  SharePointFormSubmissionService,
  isUsableSiteUrl,
  type ISubmissionTarget
} from "./services/SharePointFormSubmissionService";
import type { IHttpClient } from "./services/http";
import { toFluentTheme } from "./theme";

export interface ICopilotSharePointFormWebPartProps {
  siteUrl: string;
  libraryName: string;
  libraryTitle: string;
  configuredColumns: string;
  maxFileSizeMb: string | number;
  allowedExtensions: string;
  overwriteExisting: boolean;
}

export default class CopilotSharePointFormWebPart extends BaseClientSideWebPart<ICopilotSharePointFormWebPartProps> {
  private _theme: Theme = webLightTheme;
  private _client: IHttpClient | undefined = undefined;
  private _service: SharePointFormSubmissionService | undefined = undefined;
  private _serviceKey: string = "";
  private _reactRoot: Root | undefined = undefined;
  private _recovery: number = 0;
  private _disposed: boolean = false;

  public render(): void {
    if (this._disposed) {
      return;
    }
    let root: HTMLElement;
    try {
      root = this.domElement;
    } catch (error) {
      console.error("[CopilotSharePointForm] Render failed.", error);
      return;
    }
    if (!root) {
      return;
    }
    try {
      const element: React.ReactElement = React.createElement(
        CopilotSharePointFormErrorBoundary,
        {
          recovery: this._recovery,
          onRetry: this._retryAfterRenderError
        },
        React.createElement(CopilotSharePointFormHost, {
          instanceId: this.context.instanceId,
          theme: this._theme,
          service: this._ensureService()
        })
      );
      if (!this._reactRoot) {
        this._reactRoot = createRoot(root);
      }
      this._reactRoot.render(element);
    } catch (error) {
      console.error("[CopilotSharePointForm] Render failed.", error);
      this._renderFallback(root, error);
    }
  }

  protected onInit(): Promise<void> {
    console.info("[CopilotSharePointForm] onInit started.");
    this._applyHostTheme();
    try {
      this._client = new SpHttpAdapter(this.context.spHttpClient);
    } catch (error) {
      console.error("[CopilotSharePointForm] Couldn't create the SharePoint client.", error);
    }
    return Promise.resolve();
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }
    try {
      this._theme = toFluentTheme(currentTheme);
    } catch (error) {
      console.error("[CopilotSharePointForm] Couldn't apply the page theme.", error);
      return;
    }
    if (this.renderedOnce) {
      this.render();
    }
  }

  protected onDispose(): void {
    this._disposed = true;
    const reactRoot = this._reactRoot;
    this._reactRoot = undefined;
    if (reactRoot) {
      reactRoot.unmount();
    }
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.SettingsGroupName,
              groupFields: [
                PropertyPaneTextField("siteUrl", {
                  label: strings.SiteUrlLabel,
                  description: strings.SiteUrlDescription,
                  placeholder: "https://contoso.sharepoint.com/sites/hr",
                  deferredValidationTime: 300,
                  onGetErrorMessage: (value: string): string => {
                    const trimmed = (value || "").trim();
                    if (!trimmed) {
                      return "";
                    }
                    if (!isUsableSiteUrl(trimmed, this._webAbsoluteUrl())) {
                      return strings.SiteUrlError;
                    }
                    return "";
                  }
                }),
                PropertyPaneTextField("libraryName", {
                  label: strings.LibraryNameLabel,
                  description: strings.LibraryNameDescription,
                  placeholder: "Documents",
                  deferredValidationTime: 300
                }),
                PropertyPaneTextField("configuredColumns", {
                  label: strings.ConfiguredColumnsLabel,
                  description: strings.ConfiguredColumnsDescription,
                  multiline: true,
                  rows: 6
                }),
                PropertyPaneTextField("maxFileSizeMb", {
                  label: strings.MaxFileSizeLabel,
                  description: strings.MaxFileSizeDescription,
                  deferredValidationTime: 300,
                  onGetErrorMessage: (value: string): string => maxFileSizeError(value || "")
                }),
                PropertyPaneTextField("allowedExtensions", {
                  label: strings.AllowedExtensionsLabel,
                  description: strings.AllowedExtensionsDescription,
                  placeholder: ".pdf,.docx,.xlsx,.pptx,.md,.png,.jpg"
                }),
                PropertyPaneToggle("overwriteExisting", {
                  label: strings.OverwriteLabel,
                  onText: "On",
                  offText: "Off"
                })
              ]
            }
          ]
        }
      ]
    };
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
    if (this.renderedOnce) {
      this.render();
    }
  }

  private _ensureService(): SharePointFormSubmissionService {
    const key = this._targetKey();
    if (!this._service || this._serviceKey !== key) {
      const client = this._client || failingClient();
      this._service = new SharePointFormSubmissionService(client, this._target());
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
      configuredColumns: properties && properties.configuredColumns ? properties.configuredColumns : "",
      maxFileSizeMb: properties ? properties.maxFileSizeMb : undefined,
      allowedExtensions: properties && properties.allowedExtensions ? properties.allowedExtensions : DEFAULT_ALLOWED_EXTENSIONS,
      overwriteExisting: !properties || properties.overwriteExisting !== false,
      localEnvironment: Environment.type === EnvironmentType.Local || Environment.type === EnvironmentType.Test,
      pageHref: this._href(),
      currentWebUrl: this._webAbsoluteUrl(),
      useCurrentWebWhenSiteUrlBlank: true,
      defaultLibraryTitleWhenBlank: true
    };
  }

  private _targetKey(): string {
    const target = this._target();
    return [
      target.siteUrl,
      target.libraryName,
      target.libraryTitle,
      target.configuredColumns,
      String(target.maxFileSizeMb),
      target.allowedExtensions || "",
      target.overwriteExisting ? "1" : "0",
      target.currentWebUrl,
      target.localEnvironment ? "local" : "hosted"
    ].join("|");
  }

  private _webAbsoluteUrl(): string {
    try {
      const web = this.context.pageContext.web;
      return web && web.absoluteUrl ? web.absoluteUrl.replace(/\/+$/, "") : "";
    } catch (error) {
      console.error("[CopilotSharePointForm] Couldn't read the site address.", error);
      return "";
    }
  }

  private _href(): string {
    try {
      return window.location.href;
    } catch (error) {
      console.error("[CopilotSharePointForm] Couldn't read the page address.", error);
      return "";
    }
  }

  private readonly _retryAfterRenderError = (): void => {
    this._recovery += 1;
    this._service = undefined;
    this._serviceKey = "";
    this.render();
  };

  private _applyHostTheme(): void {
    try {
      const provider: ThemeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
      const theme = provider.tryGetTheme();
      if (theme) {
        this._theme = toFluentTheme(theme);
      }
    } catch (error) {
      console.error("[CopilotSharePointForm] Couldn't read the page theme.", error);
    }
  }

  private _renderFallback(root: HTMLElement, error: unknown): void {
    const message = error instanceof Error && error.message ? error.message : "The form couldn't be displayed.";
    try {
      const section = document.createElement("section");
      section.setAttribute("role", "alert");
      section.setAttribute("aria-label", "Submit a document");
      section.style.boxSizing = "border-box";
      section.style.width = "100%";
      section.style.maxWidth = "640px";
      section.style.padding = "12px 16px";
      section.style.fontFamily = "Segoe UI, sans-serif";
      section.style.color = "#323130";
      section.style.backgroundColor = "#fde7e9";
      section.style.border = "1px solid #d13438";
      const paragraph = document.createElement("p");
      paragraph.style.margin = "0";
      paragraph.textContent = `The document form hit a problem and could not be displayed. ${message}`;
      section.appendChild(paragraph);
      while (root.firstChild) {
        root.removeChild(root.firstChild);
      }
      root.appendChild(section);
    } catch (fallbackError) {
      console.error("[CopilotSharePointForm] Render failed.", fallbackError);
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
