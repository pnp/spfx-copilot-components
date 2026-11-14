import type {
  ICopilotComponentHostContext,
  SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';

import type { IGraphProfileService } from '../services/GraphProfileService';

export type ProfileView = 'mail' | 'calendar';

export interface IMyProfileStrings {
  ProfileTitle: string;
  ExpandButtonLabel: string;
  MailTabLabel: string;
  CalendarTabLabel: string;
  LoadingProfileLabel: string;
  LoadingMailLabel: string;
  LoadingCalendarLabel: string;
  NoMessagesMessage: string;
  NoEventsMessage: string;
  PermissionMessage: string;
  GenericErrorMessage: string;
}

export interface IMyProfileProps {
  /** Calls Microsoft Graph. */
  service: IGraphProfileService;
  /** The view passed as a tool argument from the Copilot host. */
  initialView: ProfileView | undefined;
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
  strings: IMyProfileStrings;
}
