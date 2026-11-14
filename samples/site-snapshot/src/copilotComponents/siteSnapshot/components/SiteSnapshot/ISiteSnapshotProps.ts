import type { ISiteSnapshot } from '../../models';

// Props for the root component. Data and callbacks are supplied by the
// Copilot component class; this tree is presentation only.
export interface ISiteSnapshotProps {
  snapshot?: ISiteSnapshot;
  isFullscreen: boolean;
  theme: 'light' | 'dark' | string;
  // Which detail view to open first (set by the chat via the tool's focus arg).
  focus?: string;
  // The iframe document Griffel should inject styles into.
  targetDocument?: Document;
  // Ask the host to expand to fullscreen (the "open the app" action).
  onOpenFull: () => Promise<void>;
  // Download the current snapshot as CSV.
  onExport: () => void;
  // Email the snapshot to the current user. Resolves true on success.
  onEmail: () => Promise<boolean>;
}
