// Wikipedia lead images: the image of the article about the subject (the top pick: curated and on
// topic). Fair-use (non-free) files are never shown.

import { isAllowedImageUrl, isAllowedLinkUrl } from '../allowlist';
import { getJson, htmlToText, query } from '../fetch';
import { isSafeImage } from '../safety';
import { DISPLAY_WIDTH, type IImageResult } from '../types';
import type { IExtValue, IImageInfo } from './commons';

const WIKIPEDIA_API: string = 'https://en.wikipedia.org/w/api.php';

/** Lead images of the article `title` (exact) or of the articles found for `search`, in rank order. */
export function buildWikipediaUrl(target: { title?: string; search?: string }): string {
  const base: Record<string, string> = {
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    prop: 'pageimages',
    piprop: 'name',
    redirects: '1'
  };
  return `${WIKIPEDIA_API}?${query(
    target.title ? { ...base, titles: target.title } : { ...base, generator: 'search', gsrsearch: target.search || '', gsrlimit: '6' }
  )}`;
}

/** Credit, licence and a 960 px thumbnail for the given files; non-free files are dropped. */
export function buildFileInfoUrl(files: string[]): string {
  return `${WIKIPEDIA_API}?${query({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    titles: files.map((f: string) => `File:${f}`).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: String(DISPLAY_WIDTH),
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|NonFree|Categories'
  })}`;
}

const STOPWORDS: string[] = ['the', 'and', 'of', 'in', 'on', 'at', 'for', 'a', 'an', 'to', 'by', 'st'];

/** Lower-case words without accents, possessive 's and filler words ("St. Stephen's" → stephen). */
export function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]s\b/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w: string) => w.length > 0 && STOPWORDS.indexOf(w) === -1);
}

/**
 * Whether an article found by a keyword search is about what was searched. A search for
 * "Jeff Teper Microsoft" returns articles like "Joe Belfiore" or "Skype": their lead images show
 * something else entirely (for a person: somebody else). Kept when the title and the search share
 * a word and at least half of the title's or of the search's words. With `name` (the article the
 * agent named, which turned out not to exist), every word of the name must be in the title.
 */
export function isRelevantArticle(title: string, search: string, name?: string): boolean {
  const t: string[] = significantWords(title);
  if (name) {
    const n: string[] = significantWords(name);
    if (n.length > 0 && !n.every((w: string) => t.indexOf(w) !== -1)) {
      return false;
    }
  }
  const q: string[] = significantWords(search);
  const shared: number = t.filter((w: string) => q.indexOf(w) !== -1).length;
  return shared > 0 && (shared / t.length >= 0.5 || shared / q.length >= 0.5);
}

interface IWikiPage {
  index?: number;
  title?: string;
  pageimage?: string;
  missing?: boolean;
}

/**
 * Lead-image file names, best-ranked article first. A redirect into a *section* of another article
 * ("Greek coffee" → "Turkish coffee#Greece") yields nothing: that lead image shows another subject.
 */
export function pickLeadImageNames(response: unknown, accept?: (title: string) => boolean): string[] {
  const q = (response as { query?: { pages?: IWikiPage[]; redirects?: Array<{ tofragment?: string }> } })?.query;
  if ((q?.redirects || []).some((r: { tofragment?: string }) => !!r.tofragment)) {
    return [];
  }
  const pages: IWikiPage[] = (q?.pages || []).slice();
  pages.sort((a: IWikiPage, b: IWikiPage) => (a.index ?? 0) - (b.index ?? 0));
  const names: string[] = [];
  pages.forEach((p: IWikiPage) => {
    if (p.pageimage && names.indexOf(p.pageimage) === -1 && (!accept || accept(p.title || ''))) {
      names.push(p.pageimage);
    }
  });
  return names;
}

interface IFilePage {
  title?: string;
  imageinfo?: IImageInfo[];
}

/** File info → images, in the order of `names`; fair-use (non-free) files are never shown. */
export function pickFileImages(response: unknown, names: string[]): IImageResult[] {
  const pages: IFilePage[] = (response as { query?: { pages?: IFilePage[] } })?.query?.pages || [];
  const byName: Record<string, IFilePage> = {};
  pages.forEach((p: IFilePage) => {
    if (p.title) {
      byName[p.title.replace(/^File:/, '').replace(/ /g, '_')] = p;
    }
  });
  const out: IImageResult[] = [];
  names.forEach((name: string) => {
    const info = byName[name.replace(/ /g, '_')]?.imageinfo?.[0];
    const meta: Record<string, IExtValue | undefined> = info?.extmetadata || {};
    if (!info?.thumburl || !isAllowedImageUrl(info.thumburl) || !/^image\/(jpeg|png|webp)$/.test(info.mime || '')) {
      return;
    }
    if (/^true$/i.test(meta.NonFree?.value || '')) {
      return;
    }
    // Disturbing pictures are never shown (see safety.ts).
    if (!isSafeImage(name, htmlToText(meta.Categories?.value))) {
      return;
    }
    const licenseUrl: string | undefined = meta.LicenseUrl?.value;
    out.push({
      src: info.thumburl,
      width: info.thumbwidth || 0,
      height: info.thumbheight || 0,
      pageUrl: info.descriptionurl && isAllowedLinkUrl(info.descriptionurl) ? info.descriptionurl : undefined,
      artist: htmlToText(meta.Artist?.value),
      license: htmlToText(meta.LicenseShortName?.value),
      licenseUrl: licenseUrl && isAllowedLinkUrl(licenseUrl) ? licenseUrl : undefined,
      source: 'wikipedia',
      provider: 'Wikipedia'
    });
  });
  return out;
}

/**
 * Lead images of the named article (`title`), or of the articles a keyword `search` finds that are
 * about that search (see isRelevantArticle; `name` = the article the agent named, if any).
 */
export async function searchWikipedia(target: { title?: string; search?: string; name?: string }): Promise<IImageResult[]> {
  const search: string | undefined = target.title ? undefined : target.search;
  const accept: ((title: string) => boolean) | undefined = search ? (title: string) => isRelevantArticle(title, search, target.name) : undefined;
  const names: string[] = pickLeadImageNames(await getJson(buildWikipediaUrl(target), 'Wikipedia API'), accept);
  if (names.length === 0) {
    return [];
  }
  return pickFileImages(await getJson(buildFileInfoUrl(names), 'Wikipedia API'), names);
}
