import * as React from "react"
import { createRoot, type Root } from "react-dom/client"

import { BaseCopilotComponent } from "@microsoft/sp-copilot-component"
import type { DeepReadonly, SPCopilotDisplayMode } from "@microsoft/sp-copilot-component"
import type { MSGraphClientV3 } from "@microsoft/sp-http"
import { SPHttpClient, type SPHttpClientResponse } from "@microsoft/sp-http"

import Cafeteria from "./components/Cafeteria"
import type { ICafeteriaProps, ICafeteriaStrings } from "./components/ICafeteriaProps"
import type { CafeteriaView } from "./hooks/useCafeteriaNavigation"
import type { IListCafeteriasFilter, ISearchMenuItemsFilter } from "./models"

export interface ICafeteriaInitialNavState {
  view: CafeteriaView
  listFilter: IListCafeteriasFilter
  searchFilter: ISearchMenuItemsFilter
}

/**
 * Shared lifecycle for every per-tool cafeteria Copilot Component: fetches
 * the user's display name and site title once on init, then mounts the
 * shared `Cafeteria` UI. Each tool's own component only needs to say which
 * view it opens and with what filters (`buildInitialNavState`) — the tool
 * invocation itself is what tells us which view to show, so there's no
 * shape-based inference here.
 */
export abstract class CafeteriaCopilotComponentBase<
  TProperties,
> extends BaseCopilotComponent<TProperties> {
  protected abstract readonly strings: ICafeteriaStrings

  protected abstract buildInitialNavState(
    properties: DeepReadonly<TProperties>,
  ): ICafeteriaInitialNavState

  private _userDisplayName: string = ""
  private _siteTitle: string = ""
  private _siteUrl: string = ""
  private _root: Root | undefined

  protected async onInit(): Promise<void> {
    this._siteUrl = this.context.pageContext.web.absoluteUrl

    try {
      const graphClient: MSGraphClientV3 =
        await this.context.msGraphClientFactory.getClient("3")
      const me: { displayName?: string } = await graphClient
        .api("/me")
        .select("displayName")
        .get()
      this._userDisplayName = me.displayName || "User"
    } catch {
      this._userDisplayName =
        this.context.pageContext.user?.displayName || "User"
    }

    // Fetch site info from SharePoint REST API (brokered SSO).
    try {
      const response: SPHttpClientResponse =
        await this.context.spHttpClient.get(
          `${this._siteUrl}/_api/web?$select=Title`,
          SPHttpClient.configurations.v1,
        )
      const webInfo: { Title?: string } = await response.json()
      this._siteTitle = webInfo.Title || "SharePoint Site"
    } catch {
      this._siteTitle = "SharePoint Site"
    }
  }

  protected render(): void {
    const { view, listFilter, searchFilter } = this.buildInitialNavState(this.properties)

    const props: ICafeteriaProps = {
      initialView: view,
      initialListFilter: listFilter,
      initialSearchFilter: searchFilter,
      userDisplayName: this._userDisplayName,
      siteTitle: this._siteTitle,
      siteUrl: this._siteUrl,
      hostContext: this.hostContext,
      bridge: this.context.copilotBridge,
      onRequestDisplayMode: async (mode: SPCopilotDisplayMode) => {
        await this.requestDisplayModeAsync(mode)
      },
      onRequestSizeChange: async (width: number, height: number) => {
        await this.requestSizeChangeAsync(width, height)
      },
      targetDocument: this.context.domElement.ownerDocument,
      strings: this.strings,
    }

    if (!this._root) {
      this._root = createRoot(this.context.domElement)
    }

    this._root.render(React.createElement(Cafeteria, props))
  }

  protected async onTeardown(): Promise<void> {
    this._root?.unmount()
    this._root = undefined
  }
}
