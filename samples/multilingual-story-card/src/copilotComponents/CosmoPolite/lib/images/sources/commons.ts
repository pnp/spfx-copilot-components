// Wikimedia Commons, searched directly (CORS with origin=*): the last fallback of every plan.

import { isAllowedImageUrl, isAllowedLinkUrl } from '../allowlist';
import { getJson, htmlToText, query } from '../fetch';
import { isSafeImage } from '../safety';
import { DISPLAY_WIDTH, type IImageResult } from '../types';

const COMMONS_API: string = 'https://commons.wikimedia.org/w/api.php';

export interface IExtValue {
  value?: string;
}

/** imageinfo as both Commons and Wikipedia return it. */
export interface IImageInfo {
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  descriptionurl?: string;
  mime?: string;
  extmetadata?: Record<string, IExtValue | undefined>;
}

export function buildSearchUrl(q: string, width: number = 800): string {
  return `${COMMONS_API}?${query({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    // Enough hits that a landscape photo is usually among them (Magazine needs one).
    gsrlimit: '10',
    gsrsearch: `${q} filetype:bitmap`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: String(width),
    // Categories: for the safety check (Commons has no safe search).
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|Categories'
  })}`;
}

interface ICommonsPage {
  index?: number;
  title?: string;
  imageinfo?: IImageInfo[];
}

/** All usable bitmap results with allowed thumbnail URLs, best-ranked first. */
export function pickImages(response: unknown): IImageResult[] {
  const pages: ICommonsPage[] = ((response as { query?: { pages?: ICommonsPage[] } })?.query?.pages || []).slice();
  pages.sort((a: ICommonsPage, b: ICommonsPage) => (a.index ?? 0) - (b.index ?? 0));
  const results: IImageResult[] = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || !isAllowedImageUrl(info.thumburl) || !/^image\/(jpeg|png|webp)$/.test(info.mime || '')) {
      continue;
    }
    const meta: Record<string, IExtValue | undefined> = info.extmetadata || {};
    // Wounds, special-effects make-up, nudity and the like are never shown (see safety.ts).
    if (!isSafeImage(page.title, htmlToText(meta.Categories?.value))) {
      continue;
    }
    const licenseUrl: string | undefined = meta.LicenseUrl?.value;
    results.push({
      src: info.thumburl,
      width: info.thumbwidth || 800,
      height: info.thumbheight || 450,
      pageUrl: info.descriptionurl && isAllowedLinkUrl(info.descriptionurl) ? info.descriptionurl : undefined,
      artist: htmlToText(meta.Artist?.value),
      license: htmlToText(meta.LicenseShortName?.value),
      licenseUrl: licenseUrl && isAllowedLinkUrl(licenseUrl) ? licenseUrl : undefined,
      source: 'commons'
    });
  }
  return results;
}

/** The best-ranked usable result. */
export function pickImage(response: unknown): IImageResult | undefined {
  return pickImages(response)[0];
}

/**
 * A Commons original (upload.wikimedia.org/wikipedia/commons/a/ab/Name.jpg) as its 960 px thumbnail
 * on thumb.wikimedia.org; small originals are used as they are.
 */
export function commonsThumb(original: string, width: number): string | undefined {
  const m: RegExpExecArray | null = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)$/.exec(original);
  if (!m) {
    return undefined;
  }
  if (width <= DISPLAY_WIDTH) {
    return original;
  }
  return `https://thumb.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${m[3]}/${DISPLAY_WIDTH}px-${m[3]}`;
}

export function searchCommons(q: string): Promise<IImageResult[]> {
  return getJson(buildSearchUrl(q), 'Commons API').then(pickImages);
}
