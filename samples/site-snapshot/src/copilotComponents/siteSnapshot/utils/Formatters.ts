// Shared formatters. Defined once, imported everywhere.

export default class Formatters {
  // "9 Mar 2026"
  public static date(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // "4.20 GB" or "12.0 MB"
  public static bytes(bytes: number): string {
    if (!bytes || bytes < 0) return '0 GB';
    const gb = bytes / 1024 ** 3;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }

  public static number(n: number): string {
    return n.toLocaleString();
  }

  // Short form for big counts so they fit in tight spaces: 950 -> "950",
  // 1_200 -> "1.2K", 1_000_000 -> "1M".
  public static compact(n: number): string {
    const trim = (x: number): string => x.toFixed(1).replace(/\.0$/, '');
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${trim(n / 1000)}K`;
    if (n < 1_000_000_000) return `${trim(n / 1_000_000)}M`;
    return `${trim(n / 1_000_000_000)}B`;
  }

  public static usedPercent(used: number, total: number): number {
    return total > 0 ? Math.round((used / total) * 100) : 0;
  }

  // Replace {0}, {1}, ... in a localized template with the given values.
  public static fill(template: string, ...values: (string | number)[]): string {
    return template.replace(/\{(\d+)\}/g, (m, i) => {
      const v = values[Number(i)];
      return v === undefined ? m : String(v);
    });
  }
}
