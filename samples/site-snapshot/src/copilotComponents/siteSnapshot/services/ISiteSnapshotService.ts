// Service contract. The component depends on this interface, not on Graph, so
// the data source can be swapped or mocked without touching the UI.

import { IAnalyzeArgs, ISiteSnapshot } from '../models';

export interface ISiteSnapshotService {
  // Analyse a site and return a full snapshot. Falls back to sample data if
  // Graph is unavailable (never throws to the UI).
  getSnapshot(args: IAnalyzeArgs, currentSiteUrl: string, nowMs: number): Promise<ISiteSnapshot>;

  // Email a snapshot summary. Returns true on success, false on failure.
  emailSnapshot(snapshot: ISiteSnapshot, recipient: string): Promise<boolean>;
}
