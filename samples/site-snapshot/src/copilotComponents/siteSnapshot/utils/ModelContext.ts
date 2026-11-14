// Turns a snapshot into the context Copilot's model reads on the next user
// message (via copilotBridge.updateModelContextAsync). The model never sees the
// rendered card, so without this it cannot answer follow-ups such as "why is
// the score 75?" or "which files are stale?". Pure, so it is easy to test.

import { ISiteSnapshot, IFileRow, SCORE_WEIGHTS } from '../models';
import Formatters from './Formatters';

// Enough rows to answer follow-ups without flooding the model's context.
export const MAX_CONTEXT_ROWS = 10;

const fileLine = (f: IFileRow): string =>
  `- ${f.name} (${Formatters.bytes(f.sizeBytes)}, last changed ${f.modifiedIso.slice(0, 10)}, created by ${f.createdBy}) ${f.webUrl}`;

// Plain-text summary: headline first, then the sub-scores, then the top rows of
// each detail list. Lists longer than MAX_CONTEXT_ROWS say how many were left out.
export function buildModelContextText(s: ISiteSnapshot): string {
  const d = s.detail;
  const sub = s.score.subScores;
  const w = SCORE_WEIGHTS;
  const critical = d.externalShares.filter((x) => x.isCritical).length;

  const section = <T>(title: string, rows: T[], toLine: (row: T) => string): string[] => {
    if (!rows.length) return [`${title}: none`];
    const lines = rows.slice(0, MAX_CONTEXT_ROWS).map(toLine);
    const more = rows.length > MAX_CONTEXT_ROWS ? [`- ...and ${rows.length - MAX_CONTEXT_ROWS} more (see the dashboard)`] : [];
    return [`${title} (${rows.length}):`, ...lines, ...more];
  };

  return [
    `Site Snapshot results for "${s.siteName}" (${s.siteUrl}), generated ${s.generatedIso}.`,
    s.isSample ? 'IMPORTANT: these are SAMPLE figures, not live data. Microsoft Graph was unavailable.' : 'These are live figures for the site.',
    d.truncated ? 'The scan hit its limit, so figures cover only the files scanned, not the whole site.' : '',
    `Health score: ${s.score.score}/100, verdict: ${s.score.verdict}.`,
    `Sub-scores (points kept / maximum): storage ${sub.storage}/${w.storage}, freshness ${sub.stale}/${w.stale}, sharing exposure ${sub.exposure}/${w.exposure}, activity ${sub.frecency}/${w.frecency}, tidiness ${sub.tidiness}/${w.tidiness}.`,
    `Storage: ${Formatters.bytes(s.storageUsedBytes)} used of ${Formatters.bytes(s.storageTotalBytes)}.`,
    `Scanned ${d.totalScanned} files in ${d.foldersScanned} folders across ${d.librariesScanned} libraries.`,
    `Stale files: ${d.staleDocs.length}. Shared outside: ${d.externalShares.length} (${critical} critical). Duplicate sets: ${d.duplicates.length} wasting ${Formatters.bytes(d.duplicateWastedBytes)}. Empty files: ${d.emptyFiles.length}. Large files: ${d.largestFiles.length}.`,
    ...section('File types', d.typeBreakdown, (t) => `- ${t.category}: ${t.count} files, ${Formatters.bytes(t.sizeBytes)}`),
    ...section('Top owners', d.ownerBreakdown, (o) => `- ${o.owner}: ${o.count} files, ${Formatters.bytes(o.sizeBytes)}`),
    ...section('Shared outside', d.externalShares, (x) => `- ${x.name}: ${x.kind === 'anyone' ? 'Anyone link' : 'external users'} (${x.sharedWith})${x.isCritical ? ' CRITICAL' : ''} ${x.webUrl}`),
    ...section('Duplicate sets', d.duplicates, (x) => `- ${x.name}: ${x.count} copies, ${Formatters.bytes(x.wastedBytes)} wasted`),
    ...section('Stale files', d.staleDocs, fileLine),
    ...section('Largest files', d.largestFiles, fileLine),
    ...section('Empty files', d.emptyFiles, fileLine)
  ]
    .filter((line) => line !== '')
    .join('\n');
}

// Machine-readable headline numbers, sent alongside the text summary.
export function buildStructuredContext(s: ISiteSnapshot): Record<string, unknown> {
  const d = s.detail;
  return {
    siteName: s.siteName,
    siteUrl: s.siteUrl,
    isSample: s.isSample,
    truncated: d.truncated,
    score: s.score.score,
    verdict: s.score.verdict,
    subScores: s.score.subScores,
    maxSubScores: SCORE_WEIGHTS,
    storageUsedBytes: s.storageUsedBytes,
    storageTotalBytes: s.storageTotalBytes,
    totalFiles: d.totalScanned,
    staleFiles: d.staleDocs.length,
    externalShares: d.externalShares.length,
    criticalShares: d.externalShares.filter((x) => x.isCritical).length,
    duplicateSets: d.duplicates.length,
    duplicateWastedBytes: d.duplicateWastedBytes,
    emptyFiles: d.emptyFiles.length,
    largeFiles: d.largestFiles.length
  };
}
