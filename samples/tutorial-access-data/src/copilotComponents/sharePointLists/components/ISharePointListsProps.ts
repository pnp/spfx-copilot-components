import type {
  ICopilotComponentHostContext,
  SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';

import type { ISharePointListsService } from '../services/SharePointListsService';

export interface ISharePointListsStrings {
  ListsTitle: string;
  ExpandButtonLabel: string;
  BackButtonLabel: string;
  LoadingListsLabel: string;
  LoadingItemsLabel: string;
  NoListsMessage: string;
  NoItemsMessage: string;
  ItemCountLabel: string;
  SingleItemCountLabel: string;
  GenericErrorMessage: string;
}

export interface ISharePointListsProps {
  /** Calls the SharePoint REST API. */
  service: ISharePointListsService;
  /** The site URL passed as a tool argument from the Copilot host. */
  siteUrl: string | undefined;
  /** Absolute URL of the current SharePoint site, used when no site URL is passed. */
  fallbackSiteUrl: string;
  /** Culture name used to format dates, for example `en-US`. */
  locale: string;
  /** Host context (theme, display mode) from the Copilot host. */
  hostContext: ICopilotComponentHostContext;
  /** Request the host to change display mode (e.g. 'fullscreen'). */
  onRequestDisplayMode: (mode: SPCopilotDisplayMode) => Promise<void>;
  /** Report the content size to the host (`requestSizeChangeAsync`). */
  onContentResize: (width: number, height: number) => void;
  /**
   * Document the FluentProvider should inject its theme styles into. Pass
   * `domElement.ownerDocument` so Griffel writes CSS into the correct iframe
   * document rather than the top-level page.
   */
  targetDocument: Document | undefined;
  /** Localized strings for UI labels. */
  strings: ISharePointListsStrings;
}
