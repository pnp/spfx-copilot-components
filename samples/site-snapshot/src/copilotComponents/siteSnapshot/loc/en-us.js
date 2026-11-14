define([], function () {
  return {
    // General
    Analysing: 'Analysing site...',
    HealthLabel: 'Health',
    Generated: 'Generated',
    ScanCapped: 'This site is large, so the scan stopped at its limit. The figures cover the files scanned, not the whole site.',
    FilesInLibraries: '{0} files in {1} libraries',

    // Actions
    ExportCsv: 'Export CSV',
    EmailMeThis: 'Email me this',
    OpenBreakdown: 'Open breakdown',

    // Messages
    SampleNotice: 'Showing sample data. Graph was unavailable, so approve the API permissions or run in a real site for live data.',
    EmailSent: 'Snapshot emailed.',
    EmailFailed: 'Could not send the email. If you are testing in the workbench, the Mail.Send permission is usually not approved yet - deploy the package and approve it in the SharePoint admin center.',

    // Health factors
    Storage: 'Storage',
    FactorStorage: 'Storage',
    FactorFreshness: 'Freshness',
    FactorSharing: 'Sharing',
    FactorActivity: 'Activity',
    FactorTidiness: 'Tidiness',
    HealthBreakdown: 'Health breakdown',
    HealthScore: 'Health score',

    // KPI labels (plain language)
    KpiTotalFiles: 'Files',
    KpiTotalSize: 'Total size',
    KpiLibraries: 'Libraries',
    KpiFolders: 'Folders',
    KpiLargest: 'Large files',
    KpiStorageUsed: 'Storage used',
    KpiStale: 'Old files',
    KpiExternal: 'Shared outside',
    KpiCritical: 'Risky shares',
    KpiDuplicates: 'Duplicate groups',
    KpiWasted: 'Wasted space',
    KpiEmpty: 'Empty files',

    // Tooltips
    TipScore: 'An overall health score from 0 to 100. Higher is better. It combines four factors: storage, freshness, sharing and activity.',
    TipStorage: 'How full the site storage is against its quota. A fuller site scores lower.',
    TipFreshness: 'How much of the content is up to date. A larger share of old, unchanged files scores lower.',
    TipSharing: 'How exposed the content is. External and "anyone with the link" shares score lower.',
    TipActivity: 'How recently anything changed. A site that has been idle for a long time scores lower.',
    TipTidiness: 'How clean the content is. Empty files and duplicate groups lower this score.',
    TipTotalFiles: 'Files found across the libraries that were scanned.',
    TipTotalSize: 'Total size of the files that were scanned.',
    TipLibraries: 'Document libraries scanned. System libraries are skipped.',
    TipFolders: 'Folders visited while scanning.',
    TipLargest: 'The size of the single largest file found.',
    TipStorageUsed: 'Percentage of the site storage quota in use.',
    TipStale: 'Files not changed within the chosen number of months.',
    TipExternal: 'Files shared with people outside your organisation.',
    TipCritical: 'The highest risk shares: an "anyone with the link" share on an old file.',
    TipDuplicates: 'Groups of files with identical content.',
    TipWasted: 'Storage taken up by the extra copies in duplicate groups.',
    TipEmpty: 'Files with no content (zero bytes).',
    TipLarge: 'Files at or above the size you chose (ask to change it, for example "large means 50 MB").',

    // Tabs
    TabTypes: 'By type',
    TabOwners: 'By owner',
    TabDuplicates: 'Duplicates',
    TabStale: 'Old files',
    TabExternal: 'Shared outside',
    TabEmpty: 'Empty',
    TabLargest: 'Large files',

    // Table columns
    ColFile: 'File',
    ColModified: 'Last changed',
    ColSize: 'Size',
    ColType: 'Type',
    ColFiles: 'Files',
    ColCopies: 'Copies',
    ColEach: 'Each',
    ColWasted: 'Wasted',
    ColLinkType: 'Link type',
    ColSharedWith: 'Shared with',
    ColCreatedBy: 'Created by',
    ColOwner: 'Owner',
    ColAction: 'Action',
    TotalRow: 'Total',
    TotalSize: 'Total size: {0}',
    PagePrev: 'Previous',
    PageNext: 'Next',
    PageStatus: '{0}-{1} of {2}',
    LinkAnyone: 'Anyone',
    LinkSpecific: 'Specific',
    BadgeCritical: 'Critical',
    AnyoneWithLink: 'Anyone with the link',
    ShowFiles: '{0} files',
    ShowAll: 'Show all',
    DupFilesTitle: 'Files in this group',

    // Empty states
    EmptyStale: 'Nothing old here. That is a good sign.',
    EmptyLargest: 'No large files found. Try a smaller size, for example "large means 25 MB".',
    EmptyTypes: 'No files found.',
    EmptyOwners: 'No files found.',
    EmptyDuplicates: 'No duplicates found. That is a good sign.',
    EmptyEmpty: 'No empty files found.',
    EmptyExternal: 'No external sharing found. That is a good sign.',


    // Inline score card highlights
    ScFiles: '{0} files',
    ScRisky: '{0} risky shares',
    ScExternal: '{0} shared outside',
    ScOld: '{0} old files',
    ScHealthy: 'Looks tidy'
  };
});
