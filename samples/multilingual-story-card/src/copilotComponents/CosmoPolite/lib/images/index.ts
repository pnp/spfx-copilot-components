// Image lookup by the agent's English keywords, in openly licensed sources that need no key
// (one file each in sources/):
//   - Wikipedia: the lead image of the article about the subject (top pick: curated, on topic);
//   - The Met (Open Access, public-domain artworks) for art topics;
//   - NASA Image Library (public domain) for space topics;
//   - Openverse (WordPress), Wikimedia Commons photos only (no Flickr); anonymous use is rate-limited;
//   - Wikimedia Commons directly, the last fallback.
// Before all of them: when the story is about a member of the Microsoft 365 & Power Platform
// community team, their portrait from pnp.github.io (a bundled name list, no request to look up).
// The agent analyses the question and names the kind of picture (imageSource); that source goes
// first, the others follow (see searchPlan). This file is the orchestration: plan, order, cache,
// fallbacks and the trace for diagnostics. Credit and licence are shown next to the image.

import { searchCommons } from './sources/commons';
import { searchMet } from './sources/met';
import { searchNasa } from './sources/nasa';
import { searchOpenverse } from './sources/openverse';
import { findPnpMember, pnpPortrait, searchPnp } from './sources/pnp';
import { searchWikipedia } from './sources/wikipedia';
import { ImageSearchError, type IImageResult, type ImageKind, type ImageSource, type ISearchOptions, type ISearchStep } from './types';

export * from './types';
export { isAllowedImageUrl, isAllowedLinkUrl } from './allowlist';
export { htmlToText } from './fetch';
export { buildSearchUrl, commonsThumb, pickImage, pickImages } from './sources/commons';
export { buildOpenverseUrl, licenseLabel, pickOpenverse } from './sources/openverse';
export { buildFileInfoUrl, buildWikipediaUrl, isRelevantArticle, pickFileImages, pickLeadImageNames, significantWords } from './sources/wikipedia';
export { buildMetSearchUrl, pickMetObject } from './sources/met';
export { buildNasaUrl, pickNasa } from './sources/nasa';
export { findPnpMember, nameKey, pnpPortrait } from './sources/pnp';

/** Clearly wider than tall (5:4 or wider): what an image-led layout like Magazine needs. */
export function isLandscape(image: IImageResult, minRatio: number = 1.25): boolean {
  return image.height > 0 && image.width / image.height >= minRatio;
}

const cache: Map<string, Promise<IImageResult[]>> = new Map();

/** `name`: the article the agent named (keyword results must then be about it, see isRelevantArticle). */
const SEARCH: Record<ImageSource, (q: string, name?: string) => Promise<IImageResult[]>> = {
  pnp: searchPnp,
  wikipedia: (q: string, name?: string) => searchWikipedia({ search: q, name }),
  met: searchMet,
  nasa: searchNasa,
  openverse: searchOpenverse,
  commons: searchCommons
};

function cached(key: string, run: () => Promise<IImageResult[]>): Promise<IImageResult[]> {
  let pending: Promise<IImageResult[]> | undefined = cache.get(key);
  if (!pending) {
    pending = run();
    pending.catch(() => cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}

function searchOnce(source: ImageSource, q: string, name?: string): Promise<IImageResult[]> {
  const scope: string = source === 'wikipedia' && name ? `|${name.toLowerCase()}` : '';
  return cached(`${source}:${q.toLowerCase()}${scope}`, () => SEARCH[source](q, name));
}

/**
 * Source order for the agent's hint. Wikipedia is the top pick by default; museum and space go to
 * their specialist collections first; "photo" prefers Openverse's Commons search. Commons is always last.
 */
export function searchPlan(kind: ImageKind | undefined): ImageSource[] {
  switch (kind) {
    case 'museum':
      return ['met', 'wikipedia', 'openverse', 'commons'];
    case 'space':
      return ['nasa', 'wikipedia', 'openverse', 'commons'];
    case 'photo':
      return ['openverse', 'wikipedia', 'commons'];
    default:
      return ['wikipedia', 'openverse', 'commons'];
  }
}

/** The default order (no hint from the agent). */
export const IMAGE_SOURCES: ImageSource[] = searchPlan(undefined);

/** Full query, then its first two keywords, then the fallback (e.g. the title). Deduplicated, non-empty. */
export function queryVariants(query: string | undefined, fallback?: string): string[] {
  const variants: string[] = [];
  const add = (q: string | undefined): void => {
    const v: string = (q || '').trim();
    if (v && variants.indexOf(v) === -1) {
      variants.push(v);
    }
  };
  add(query);
  add((query || '').split(/\s+/).slice(0, 2).join(' '));
  add(fallback);
  return variants;
}

/**
 * Tries the named Wikipedia article first (when given), then each query (full keywords, then fewer,
 * then the title) in each source of the plan, until one finds usable images; resolves all of them,
 * best first, or [] when none does. A source that fails (rate limit, network, CSP) is skipped for
 * the rest of the search; only when every source failed does it reject, with the first error.
 */
export async function searchImages(queries: string[], options: ISearchOptions | ImageSource[] = {}): Promise<IImageResult[]> {
  const opts: ISearchOptions = Array.isArray(options) ? { sources: options } : options;
  const sources: ImageSource[] = opts.sources || IMAGE_SOURCES;
  if (queries.length === 0 && !opts.wikipediaTitle) {
    throw new ImageSearchError('no-query', 'No image keywords');
  }
  const failed: ImageSource[] = [];
  let firstError: unknown;
  const trace: ISearchStep[] | undefined = opts.trace;
  const attempt = async (source: ImageSource, kind: 'title' | 'keywords', q: string, run: () => Promise<IImageResult[]>): Promise<IImageResult[]> => {
    if (failed.indexOf(source) !== -1) {
      trace?.push({ source, kind, query: q, outcome: 'skipped', reason: 'failed earlier in this search' });
      return [];
    }
    const started: number = Date.now();
    try {
      const results: IImageResult[] = await run();
      trace?.push({ source, kind, query: q, outcome: results.length > 0 ? 'found' : 'empty', count: results.length, ms: Date.now() - started });
      return results;
    } catch (error) {
      failed.push(source);
      firstError = firstError || error;
      trace?.push({
        source,
        kind,
        query: q,
        outcome: 'failed',
        reason: (error as { reason?: string })?.reason || (error instanceof Error ? error.message : String(error)),
        ms: Date.now() - started
      });
      return [];
    }
  };

  // A community team member's own portrait beats any search: a search by name can find a namesake.
  const member: { name: string; file: string } | undefined = findPnpMember([opts.wikipediaTitle, ...queries]);
  if (member) {
    const portrait: IImageResult | undefined = pnpPortrait(member);
    trace?.push({ source: 'pnp', kind: 'name', query: member.name, outcome: portrait ? 'found' : 'empty', count: portrait ? 1 : 0, ms: 0 });
    if (portrait) {
      return [portrait];
    }
  }

  // A named article answers the question best, whatever the hint: for an artwork its lead image is
  // the artwork itself, for a mission the mission's own picture.
  const title: string | undefined = opts.wikipediaTitle;
  if (title && sources.indexOf('wikipedia') !== -1) {
    const lead: IImageResult[] = await attempt('wikipedia', 'title', title, () =>
      cached(`wikipedia-title:${title.toLowerCase()}`, () => searchWikipedia({ title }))
    );
    if (lead.length > 0) {
      return lead;
    }
  }
  for (const q of queries) {
    for (const source of sources) {
      const results: IImageResult[] = await attempt(source, 'keywords', q, () => searchOnce(source, q, title));
      if (results.length > 0) {
        return results;
      }
    }
  }
  if (failed.length === sources.length) {
    throw firstError;
  }
  return [];
}

/** The best single image (see searchImages). */
export async function searchImage(queries: string[]): Promise<IImageResult | undefined> {
  return (await searchImages(queries))[0];
}
