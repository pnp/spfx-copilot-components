import * as React from 'react';
import type { ISession } from '../models/session';
import type { IDocumentStoreService } from '../services/IDocumentStoreService';
import type { FilingController } from '../logic/filingController';
import type { RecentController } from '../logic/recentController';
import { AppProviders } from './AppProviders';
import { FileUploaderInline } from './FileUploaderInline';
import { FileUploaderFullscreen } from './FileUploaderFullscreen';
import { SampleDataNote } from './blocks/SampleDataNote';

/** Host state (AGENTS.md §3, class 1) — read from hostContext on every render, passed down as props. */
export interface IHostProps {
  theme: 'light' | 'dark';
  displayMode: 'inline' | 'fullscreen';
  canFullscreen: boolean;
  /** Container width in px when the host reports it; drives narrow layout. */
  width?: number;
}

/** Everything a view needs. Views never reach back into the component instance. */
export interface IViewProps {
  host: IHostProps;
  session: ISession;
  store: IDocumentStoreService;
  now: () => Date;
  refresh: () => void;
  requestFullscreen: () => Promise<void>;
  /**
   * Opens a URL through the host (`copilotBridge.openLinkAsync`); resolves
   * false when the host refused. Absent when the host offers no such call —
   * links then show as selectable text only. There is no Copy link: the
   * canvas never grants clipboard write (8.8 L9, L10).
   */
  openLink?: (url: string) => Promise<boolean>;
}

export interface IAppProps extends IViewProps {
  controller: FilingController;
  recent: RecentController;
  /** The document the component renders into — the Workbench may iframe us. */
  targetDocument?: Document;
  /** Remount key: flips 0 -> 1 after first commit, then stays stable. */
  remountKey?: number;
}

/**
 * Thin root: selects the view on displayMode ONLY (AGENTS.md R7). Intent
 * routing happens inside each view, never here. The providers live in
 * `AppProviders`, shared with the store-unavailable fallback. The sample-data
 * line is rendered here, once, because it describes the store rather than any
 * view.
 */
export const FileUploaderApp: React.FC<IAppProps> = props => {
  const view =
    props.host.displayMode === 'fullscreen' ? (
      <FileUploaderFullscreen {...props} />
    ) : (
      <FileUploaderInline {...props} />
    );

  return (
    <AppProviders theme={props.host.theme} targetDocument={props.targetDocument} remountKey={props.remountKey}>
      {props.store.isSampleData ? <SampleDataNote /> : undefined}
      {view}
    </AppProviders>
  );
};
