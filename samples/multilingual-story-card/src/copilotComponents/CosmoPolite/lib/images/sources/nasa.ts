// NASA Image Library (public domain), for space topics.

import { isAllowedImageUrl } from '../allowlist';
import { getJson, query } from '../fetch';
import { MIN_WIDTH, type IImageResult } from '../types';

export function buildNasaUrl(q: string): string {
  return `https://images-api.nasa.gov/search?${query({ q, media_type: 'image', page_size: '20' })}`;
}

interface INasaLink {
  href?: string;
  render?: string;
  width?: number;
  height?: number;
  size?: number;
}

interface INasaItem {
  data?: Array<{ title?: string; nasa_id?: string; center?: string; secondary_creator?: string; photographer?: string }>;
  links?: INasaLink[];
}

/** Public-domain NASA images: the smallest rendition at least ~900 px wide (or the largest below). */
export function pickNasa(response: unknown): IImageResult[] {
  const items: INasaItem[] = (response as { collection?: { items?: INasaItem[] } })?.collection?.items || [];
  const out: IImageResult[] = [];
  items.forEach((item: INasaItem) => {
    const meta = item.data?.[0];
    const links: INasaLink[] = (item.links || []).filter(
      (l: INasaLink) => l.render === 'image' && !!l.href && !!l.width && !!l.height && isAllowedImageUrl(l.href) && (l.size || 0) < 4000000
    );
    if (!meta?.nasa_id || links.length === 0) {
      return;
    }
    links.sort((a: INasaLink, b: INasaLink) => (a.width || 0) - (b.width || 0));
    const pick: INasaLink = links.find((l: INasaLink) => (l.width || 0) >= 900) || links[links.length - 1];
    if ((pick.width || 0) < MIN_WIDTH) {
      return;
    }
    out.push({
      src: pick.href as string,
      width: pick.width || 0,
      height: pick.height || 0,
      pageUrl: `https://images.nasa.gov/details/${encodeURIComponent(meta.nasa_id)}`,
      artist: meta.photographer || meta.secondary_creator || (meta.center ? `NASA/${meta.center}` : 'NASA'),
      license: 'Public domain',
      licenseUrl: undefined,
      source: 'nasa',
      provider: 'NASA'
    });
  });
  return out;
}

export function searchNasa(q: string): Promise<IImageResult[]> {
  return getJson(buildNasaUrl(q), 'NASA API').then(pickNasa);
}
