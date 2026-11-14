// Domain types for Site Snapshot. Kept framework-free so the scoring and
// services stay easy to reason about and test.

export type Verdict = 'Healthy' | 'Watch' | 'At risk';

// The raw numbers the health score is computed from.
export interface ISnapshotMetrics {
  storageUsedBytes: number;
  storageTotalBytes: number;
  totalDocs: number;
  staleDocs: number;
  externalItemCount: number; // shared with external users (not "Anyone")
  anyoneLinkCount: number; // shared via an "Anyone" link
  daysSinceLastActivity: number;
  emptyDocs: number; // zero-byte files
  duplicateSets: number; // groups of identical files
}

// The computed score plus everything needed to explain it in the UI.
export interface ISnapshotScore {
  score: number; // 0..100
  verdict: Verdict;
  subScores: { storage: number; stale: number; exposure: number; frecency: number; tidiness: number };
  penalties: { storage: number; stale: number; exposure: number; frecency: number; tidiness: number };
}

// A single file row shown in the detail tables. One shape for every list so the
// columns (size, last changed, created by) are consistent.
export interface IFileRow {
  name: string;
  webUrl: string;
  sizeBytes: number;
  modifiedIso: string;
  createdBy: string;
}

export interface IExternalShare {
  name: string;
  webUrl: string;
  kind: 'anyone' | 'external';
  sharedWith: string;
  // True when an "Anyone" link sits on a stale document: highest cleanup priority.
  isCritical?: boolean;
}

// A file-type category bucket (Word, Excel, PDF, Images, Media, ...).
export interface ITypeBucket {
  category: string;
  count: number;
  sizeBytes: number;
}

// A per-creator bucket, so you can see who owns the most content and clutter.
export interface IOwnerBucket {
  owner: string;
  count: number;
  sizeBytes: number;
}

// A set of duplicate files (same content hash, or same name and size). The
// `files` are ordered newest first, so `name` is the most recent copy.
export interface IDuplicateSet {
  key: string;
  name: string;
  count: number;
  sizeBytes: number;
  wastedBytes: number;
  files: { name: string; webUrl: string; modifiedIso?: string }[];
}

export interface ISnapshotDetail {
  staleDocs: IFileRow[];
  largestFiles: IFileRow[];
  emptyFiles: IFileRow[];
  externalShares: IExternalShare[];
  typeBreakdown: ITypeBucket[];
  ownerBreakdown: IOwnerBucket[];
  duplicates: IDuplicateSet[];
  duplicateWastedBytes: number;
  totalScanned: number;
  foldersScanned: number;
  librariesScanned: number;
  truncated: boolean; // true when the item scan hit its cap
}

// The full result of analysing a site.
export interface ISiteSnapshot {
  siteName: string;
  siteUrl: string;
  storageUsedBytes: number;
  storageTotalBytes: number;
  generatedIso: string;
  score: ISnapshotScore;
  detail: ISnapshotDetail;
  isSample: boolean; // true when Graph was unavailable and sample data was used
}

// Arguments for an analysis (defaults applied by the component/Zod schema).
export interface IAnalyzeArgs {
  siteUrl?: string;
  staleMonths: number; // a file older than this (months) counts as "old"
  largeMb: number; // a file at least this many MB counts as "large"
}
