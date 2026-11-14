import type {
  ICopilotComponentHostContext,
  SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';

import type { IHostLayout } from '../hostLayout';
import type { IProject, ProjectStatus } from '../mockData';

export interface IDesignShowcaseStrings {
  Title: string;
  ExpandButtonLabel: string;
  ViewAllLabel: string;
  DetailsTitle: string;
  NoSelectionMessage: string;
  OwnerLabel: string;
  DueLabel: string;
  StatusOnTrack: string;
  StatusAtRisk: string;
  StatusBlocked: string;
  StatusDone: string;
}

export interface IDesignShowcaseProps {
  /** The records to show. */
  projects: ReadonlyArray<IProject>;
  /** Culture name used to format dates, for example `en-US`. */
  locale: string | undefined;
  /** Host context (theme, display mode, size, device) from the Copilot host. */
  hostContext: ICopilotComponentHostContext;
  /** Request the host to change display mode (e.g. 'fullscreen'). */
  onRequestDisplayMode: (mode: SPCopilotDisplayMode) => Promise<void>;
  /**
   * Document that owns the component element. Fluent UI and Griffel
   * insert their styles into this document.
   */
  targetDocument: Document | undefined;
  /** Localized strings for UI labels. */
  strings: IDesignShowcaseStrings;
}

/** Props that the inline view and the fullscreen view share. */
export interface IShowcaseViewProps {
  projects: ReadonlyArray<IProject>;
  selectedId: string | undefined;
  onSelect: (projectId: string) => void;
  layout: IHostLayout;
  locale: string | undefined;
  strings: IDesignShowcaseStrings;
  statusLabels: Record<ProjectStatus, string>;
}

export interface IInlineViewProps extends IShowcaseViewProps {
  /** Ask the host for fullscreen. */
  onExpand: () => void;
}
