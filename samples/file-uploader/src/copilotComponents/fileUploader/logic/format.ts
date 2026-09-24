import type { FilingStatus } from '../models/sources';

/**
 * Receipt copy for sample mode (todo.md 8.7 G2, and R25 / R37's second half).
 *
 * A sample receipt said "<file> is filed.", "Saved just now by Dana
 * Whitfield" and offered to let you correct the metadata in SharePoint. All
 * three describe something that did not happen, and only the small
 * "Sample data — nothing is stored" line said otherwise. The headline is
 * where a person looks first, so that is where the truth belongs — the
 * quiet note underneath was never going to carry it alone.
 *
 * The byline carries no name: a fictional person's name reads as provenance,
 * and there is no provenance to report. Live-mode copy is unchanged.
 *
 * The title replaces "Filed" / "Filed 3 expense reports" (Kurt, 2026-09-22),
 * so the heading a screen reader announces first does not contradict every
 * line under it. The count is dropped rather than kept — "Sample receipt —
 * 3 expense reports" reads as three things having been filed, and the count
 * is already in the banner and the table.
 */
export const SAMPLE_RECEIPT_TITLE: string = 'Sample receipt';
export const SAMPLE_RECEIPT_HEADLINE: string = 'Sample receipt — nothing was filed';
export const SAMPLE_RECEIPT_BYLINE: string = 'Sample — not saved';

/** "$1,284.50" — two decimals, thousands separators, no locale dependence. */
export function formatMoney(amount: number): string {
  const negative: boolean = amount < 0;
  const fixed: string = Math.abs(amount).toFixed(2);
  const parts: string[] = fixed.split('.');
  const intPart: string = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (negative ? '-' : '') + '$' + intPart + '.' + parts[1];
}

/** "412 KB", "1.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' B';
  }
  const kb: number = bytes / 1024;
  if (kb < 1024) {
    return Math.round(kb) + ' KB';
  }
  const mb: number = kb / 1024;
  return (Math.round(mb * 10) / 10) + ' MB';
}

/** File-type badge text from a file name: "PDF", "XLSX", "DOCX", "FILE". */
export function fileBadge(fileName: string): string {
  const m: RegExpMatchArray | null = /\.([a-z0-9]{1,5})$/i.exec(fileName);
  return m ? m[1].toUpperCase() : 'FILE';
}

export const STATUS_LABELS: Record<FilingStatus, string> = {
  received: 'Received',
  pendingReview: 'Pending review',
  approved: 'Approved',
  paid: 'Paid',
  returned: 'Returned'
};

/** Status label, shortened for narrow layouts where "Pending review" would clip. */
export function statusLabel(status: FilingStatus, short: boolean = false): string {
  return short && status === 'pendingReview' ? 'Pending' : STATUS_LABELS[status];
}

/** Semantic tone for a status — the only place status maps to colour meaning. */
export type StatusTone = 'amber' | 'green' | 'red';

export const STATUS_TONES: Record<FilingStatus, StatusTone> = {
  received: 'amber',
  pendingReview: 'amber',
  approved: 'green',
  paid: 'green',
  returned: 'red'
};
