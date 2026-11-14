// Openverse (WordPress), asked for Wikimedia Commons photos only: its other big collection,
// Flickr, brought too many low-quality snapshots. Anonymous use is rate-limited
// (20/min, 200/day per IP).

import { isAllowedImageUrl, isAllowedLinkUrl } from '../allowlist';
import { getJson, htmlToText, query } from '../fetch';
import { isSafeImage } from '../safety';
import { DISPLAY_WIDTH, MIN_WIDTH, type IImageResult } from '../types';
import { commonsThumb } from './commons';

const OPENVERSE_API: string = 'https://api.openverse.org/v1/images/';

export function buildOpenverseUrl(q: string): string {
  // No category filter: Openverse only categorises Flickr images as "photograph", so with it the
  // search returned Flickr photos only, and with source=wikimedia nothing at all.
  return `${OPENVERSE_API}?${query({ q, page_size: '20', mature: 'false', source: 'wikimedia' })}`;
}

/** "by-sa" + "2.0" → "CC BY-SA 2.0"; CC0 and the public-domain mark get their own names. */
export function licenseLabel(license: string | undefined, version: string | undefined): string | undefined {
  if (!license) {
    return undefined;
  }
  const l: string = license.toLowerCase();
  if (l === 'cc0') {
    return 'CC0';
  }
  if (l === 'pdm') {
    return 'Public domain';
  }
  return `CC ${l.toUpperCase()}${version ? ` ${version}` : ''}`;
}

interface IOpenverseResult {
  url?: string;
  title?: string;
  tags?: Array<{ name?: string }>;
  width?: number;
  height?: number;
  creator?: string;
  license?: string;
  license_version?: string;
  license_url?: string;
  foreign_landing_url?: string;
  provider?: string;
  // eslint-disable-next-line @rushstack/no-new-null -- the Openverse JSON sends null
  filetype?: string | null;
}

const PROVIDER_NAMES: Record<string, string> = { wikimedia: 'Wikimedia Commons' };

/** Usable Openverse photos: Wikimedia Commons only (no Flickr), large enough. */
export function pickOpenverse(response: unknown): IImageResult[] {
  const results: IOpenverseResult[] = (response as { results?: IOpenverseResult[] })?.results || [];
  const out: IImageResult[] = [];
  results.forEach((r: IOpenverseResult) => {
    const width: number = r.width || 0;
    const height: number = r.height || 0;
    if (!r.url || width < MIN_WIDTH || height <= 0 || (r.filetype && !/^(jpe?g|png|webp)$/i.test(r.filetype))) {
      return;
    }
    // mature=false only drops what Openverse flagged; disturbing pictures are checked here too.
    if (!isSafeImage(r.title, (r.tags || []).map((t: { name?: string }) => t.name || ''))) {
      return;
    }
    let src: string | undefined;
    let shownWidth: number = width;
    if (r.provider === 'wikimedia') {
      src = commonsThumb(r.url, width);
      shownWidth = Math.min(width, DISPLAY_WIDTH);
    }
    if (!src || !isAllowedImageUrl(src)) {
      return;
    }
    out.push({
      src,
      width: shownWidth,
      height: Math.round((shownWidth * height) / width),
      pageUrl: r.foreign_landing_url && isAllowedLinkUrl(r.foreign_landing_url) ? r.foreign_landing_url : undefined,
      artist: r.creator ? htmlToText(r.creator) : undefined,
      license: licenseLabel(r.license, r.license_version),
      licenseUrl: r.license_url && isAllowedLinkUrl(r.license_url) ? r.license_url : undefined,
      source: 'openverse',
      provider: r.provider ? PROVIDER_NAMES[r.provider] : undefined
    });
  });
  return out;
}

export function searchOpenverse(q: string): Promise<IImageResult[]> {
  return getJson(buildOpenverseUrl(q), 'Openverse').then(pickOpenverse);
}
