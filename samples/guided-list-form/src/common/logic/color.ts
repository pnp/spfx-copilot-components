/** Accepts #RGB or #RRGGBB only and returns lower-case #rrggbb, or '' for anything else. */
export function normalizeHex(value: string | undefined): string {
  const v = (value || '').trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(v);
  if (short) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  }
  return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : '';
}

function channel(hex: string, i: number): number {
  return parseInt(hex.substr(1 + i * 2, 2), 16);
}

export function relativeLuminance(hex: string): number {
  const lin = [0, 1, 2].map((i) => {
    const c = channel(hex, i) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** White or near-black text, whichever reads better on the given fill. */
export function readableTextOn(hex: string): string {
  return contrastRatio(hex, '#ffffff') >= contrastRatio(hex, '#1a1a1a') ? '#ffffff' : '#1a1a1a';
}

/** Darken (amount < 0) or lighten (amount > 0) by mixing with black or white. */
export function shade(hex: string, amount: number): string {
  const target = amount < 0 ? 0 : 255;
  const t = Math.min(1, Math.abs(amount));
  const parts = [0, 1, 2].map((i) => {
    const c = Math.round(channel(hex, i) + (target - channel(hex, i)) * t);
    return (c < 16 ? '0' : '') + c.toString(16);
  });
  return `#${parts.join('')}`;
}
