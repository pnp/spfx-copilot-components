// Client-side CSV download, no external dependency.

export default class CsvExport {
  private static escape(value: unknown): string {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  // Build a CSV and download it as `filename`. `targetDocument` is the iframe
  // document the Copilot component renders into (falls back to global document).
  public static download(
    filename: string,
    headers: string[],
    rows: unknown[][],
    targetDocument?: Document
  ): void {
    const doc = targetDocument || document;
    const csv = [headers, ...rows].map((r) => r.map(CsvExport.escape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = doc.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    a.style.display = 'none';
    doc.body.appendChild(a);
    a.click();
    doc.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
