// Fallback snapshot used when Graph is unavailable (for example in the
// workbench, or before API permissions are approved). It lets the whole UI
// render and be demoed with no tenant data.

import { computeHealthScore, ISiteSnapshot, ISnapshotMetrics, IFileRow } from '../models';

const MB = 1024 ** 2;

export function buildSampleSnapshot(siteUrl: string, generatedIso: string): ISiteSnapshot {
  const staleDocs: IFileRow[] = [
    { name: 'Q1-plan-2023.docx', webUrl: '#', sizeBytes: 0.4 * MB, modifiedIso: '2023-02-11T09:00:00Z', createdBy: 'Priya Shah' },
    { name: 'old-brand-guide.pdf', webUrl: '#', sizeBytes: 8 * MB, modifiedIso: '2022-11-03T09:00:00Z', createdBy: 'Tom Lee' },
    { name: 'archived-notes.txt', webUrl: '#', sizeBytes: 0.01 * MB, modifiedIso: '2023-05-20T09:00:00Z', createdBy: 'Priya Shah' }
  ];
  const largestFiles: IFileRow[] = [
    { name: 'launch-video.mp4', webUrl: '#', sizeBytes: 820 * MB, modifiedIso: '2026-01-14T09:00:00Z', createdBy: 'Media Team' },
    { name: 'design-assets.zip', webUrl: '#', sizeBytes: 410 * MB, modifiedIso: '2025-09-02T09:00:00Z', createdBy: 'Tom Lee' },
    { name: 'budget-2026.xlsx', webUrl: '#', sizeBytes: 12 * MB, modifiedIso: '2026-08-30T09:00:00Z', createdBy: 'Ana Ruiz' }
  ];
  const emptyFiles: IFileRow[] = [
    { name: 'placeholder.docx', webUrl: '#', sizeBytes: 0, modifiedIso: '2026-03-01T09:00:00Z', createdBy: 'Tom Lee' },
    { name: 'new-folder-readme.txt', webUrl: '#', sizeBytes: 0, modifiedIso: '2026-02-11T09:00:00Z', createdBy: 'Priya Shah' }
  ];
  const externalShares = [
    { name: 'Q4-plan.docx', webUrl: '#', kind: 'anyone' as const, sharedWith: 'Anyone with the link', isCritical: true },
    { name: 'budget-2026.xlsx', webUrl: '#', kind: 'external' as const, sharedWith: 'ext@acme.com' }
  ];
  const typeBreakdown = [
    { category: 'Word', count: 48, sizeBytes: 0.6 * 1024 ** 3 },
    { category: 'Excel', count: 22, sizeBytes: 0.3 * 1024 ** 3 },
    { category: 'PowerPoint', count: 14, sizeBytes: 0.5 * 1024 ** 3 },
    { category: 'PDF', count: 19, sizeBytes: 0.4 * 1024 ** 3 },
    { category: 'Images', count: 18, sizeBytes: 0.5 * 1024 ** 3 },
    { category: 'Media', count: 6, sizeBytes: 1.4 * 1024 ** 3 },
    { category: 'Archives', count: 4, sizeBytes: 0.4 * 1024 ** 3 },
    { category: 'Other', count: 6, sizeBytes: 0.1 * 1024 ** 3 }
  ];
  const duplicates = [
    {
      key: 'sample-hash-1',
      name: 'budget-2026.xlsx',
      count: 3,
      sizeBytes: 12 * MB,
      wastedBytes: 24 * MB,
      files: [
        { name: 'budget-2026.xlsx', webUrl: '#' },
        { name: 'budget-2026 (1).xlsx', webUrl: '#' },
        { name: 'budget-2026-copy.xlsx', webUrl: '#' }
      ]
    },
    {
      key: 'sample-hash-2',
      name: 'logo.png',
      count: 2,
      sizeBytes: 2 * MB,
      wastedBytes: 2 * MB,
      files: [
        { name: 'logo.png', webUrl: '#' },
        { name: 'logo-final.png', webUrl: '#' }
      ]
    }
  ];
  const ownerBreakdown = [
    { owner: 'Tom Lee', count: 61, sizeBytes: 1.9 * 1024 ** 3 },
    { owner: 'Priya Shah', count: 44, sizeBytes: 0.9 * 1024 ** 3 },
    { owner: 'Ana Ruiz', count: 20, sizeBytes: 0.6 * 1024 ** 3 },
    { owner: 'Media Team', count: 12, sizeBytes: 0.8 * 1024 ** 3 }
  ];
  const duplicateWastedBytes = duplicates.reduce((sum, d) => sum + d.wastedBytes, 0);

  const metrics: ISnapshotMetrics = {
    storageUsedBytes: 4.2 * 1024 ** 3,
    storageTotalBytes: 25 * 1024 ** 3,
    totalDocs: 137,
    staleDocs: staleDocs.length,
    externalItemCount: 1,
    anyoneLinkCount: 1,
    daysSinceLastActivity: 11,
    emptyDocs: emptyFiles.length,
    duplicateSets: duplicates.length
  };

  return {
    siteName: 'Project Aurora (sample)',
    siteUrl,
    storageUsedBytes: metrics.storageUsedBytes,
    storageTotalBytes: metrics.storageTotalBytes,
    generatedIso,
    score: computeHealthScore(metrics),
    detail: {
      staleDocs,
      largestFiles,
      emptyFiles,
      externalShares,
      typeBreakdown,
      ownerBreakdown,
      duplicates,
      duplicateWastedBytes,
      totalScanned: 137,
      foldersScanned: 12,
      librariesScanned: 3,
      truncated: false
    },
    isSample: true
  };
}
