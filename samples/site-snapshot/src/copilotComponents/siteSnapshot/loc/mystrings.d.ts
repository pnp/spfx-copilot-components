// All user-facing text for the component lives here (typings) and in en-us.js
// (values). Import as: import * as strings from 'SiteSnapshotComponentStrings'.

declare interface ISiteSnapshotStrings {
  // General
  Analysing: string;
  HealthLabel: string;
  Generated: string;
  ScanCapped: string;
  FilesInLibraries: string; // "{0} files in {1} libraries"

  // Actions
  ExportCsv: string;
  EmailMeThis: string;
  OpenBreakdown: string;

  // Messages
  SampleNotice: string;
  EmailSent: string;
  EmailFailed: string;

  // Health factors
  Storage: string;
  FactorStorage: string;
  FactorFreshness: string;
  FactorSharing: string;
  FactorActivity: string;
  FactorTidiness: string;
  HealthBreakdown: string;
  HealthScore: string;

  // KPI labels
  KpiTotalFiles: string;
  KpiTotalSize: string;
  KpiLibraries: string;
  KpiFolders: string;
  KpiLargest: string;
  KpiStorageUsed: string;
  KpiStale: string;
  KpiExternal: string;
  KpiCritical: string;
  KpiDuplicates: string;
  KpiWasted: string;
  KpiEmpty: string;

  // Tooltips (the "what does this mean" explanations)
  TipScore: string;
  TipStorage: string;
  TipFreshness: string;
  TipSharing: string;
  TipActivity: string;
  TipTidiness: string;
  TipTotalFiles: string;
  TipTotalSize: string;
  TipLibraries: string;
  TipFolders: string;
  TipLargest: string;
  TipStorageUsed: string;
  TipStale: string;
  TipExternal: string;
  TipCritical: string;
  TipDuplicates: string;
  TipWasted: string;
  TipEmpty: string;
  TipLarge: string;

  // Tabs
  TabTypes: string;
  TabOwners: string;
  TabDuplicates: string;
  TabStale: string;
  TabExternal: string;
  TabEmpty: string;
  TabLargest: string;

  // Table columns
  ColFile: string;
  ColModified: string;
  ColSize: string;
  ColType: string;
  ColFiles: string;
  ColCopies: string;
  ColEach: string;
  ColWasted: string;
  ColLinkType: string;
  ColSharedWith: string;
  ColCreatedBy: string;
  ColOwner: string;
  ColAction: string;
  TotalRow: string; // "Total"
  TotalSize: string; // "Total size: {0}"
  PagePrev: string;
  PageNext: string;
  PageStatus: string; // "{0}-{1} of {2}"
  LinkAnyone: string;
  LinkSpecific: string;
  BadgeCritical: string;
  AnyoneWithLink: string;
  ShowFiles: string; // "{0} files"
  ShowAll: string; // "Show all"
  DupFilesTitle: string; // "Files in this group"

  // Empty states
  EmptyStale: string;
  EmptyLargest: string;
  EmptyTypes: string;
  EmptyOwners: string;
  EmptyDuplicates: string;
  EmptyEmpty: string;
  EmptyExternal: string;


  // Inline score card highlights
  ScFiles: string; // "{0} files"
  ScRisky: string; // "{0} risky shares"
  ScExternal: string; // "{0} shared outside"
  ScOld: string; // "{0} old files"
  ScHealthy: string; // "Looks tidy"
}

declare module 'SiteSnapshotComponentStrings' {
  const strings: ISiteSnapshotStrings;
  export = strings;
}
