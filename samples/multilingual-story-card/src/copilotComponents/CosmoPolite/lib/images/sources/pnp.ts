// The Microsoft 365 & Power Platform community team (https://pnp.github.io/#team): when the story is
// about one of them, their own portrait from the team page beats any search, which may find someone
// else of the same name (or a namesake's fan art). The names are a bundled snapshot
// (pnpTeam.data.ts, npm run update-pnp-team), so no lookup leaves the browser; only a match loads
// the portrait from pnp.github.io.

import { isAllowedImageUrl } from '../allowlist';
import type { IImageResult } from '../types';
import { PNP_TEAM } from './pnpTeam.data';

const IMAGE_BASE: string = 'https://pnp.github.io/images/team/';
const TEAM_PAGE: string = 'https://pnp.github.io/#team';
/** The team page's portraits are square. */
const PORTRAIT_SIZE: number = 400;

/** Lower case, accents dropped, words only: "Adam Wójcik" and "adam wojcik" compare equal. */
export function nameKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * The team member a text names: the whole name, as words ("Vesa Juvonen PnP" matches, "Vesa"
 * alone or "Juvonenberg" does not). The first text that names someone wins; within a text the
 * longest name, so a longer name isn't shadowed by a shorter one it contains.
 */
export function findPnpMember(texts: Array<string | undefined>): { name: string; file: string } | undefined {
  for (const text of texts) {
    const haystack: string = ` ${nameKey(text || '')} `;
    if (haystack.trim() === '') {
      continue;
    }
    let best: readonly [string, string] | undefined;
    PNP_TEAM.forEach((member: readonly [string, string]) => {
      if (haystack.indexOf(` ${nameKey(member[0])} `) !== -1 && (!best || member[0].length > best[0].length)) {
        best = member;
      }
    });
    if (best) {
      return { name: best[0], file: best[1] };
    }
  }
  return undefined;
}

/** The member's portrait as a search result, credited to the team page. */
export function pnpPortrait(member: { name: string; file: string }): IImageResult | undefined {
  const src: string = IMAGE_BASE + member.file;
  if (!isAllowedImageUrl(src)) {
    return undefined;
  }
  return {
    src,
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    pageUrl: TEAM_PAGE,
    artist: undefined,
    license: undefined,
    licenseUrl: undefined,
    source: 'pnp',
    provider: 'pnp.github.io'
  };
}

/** For the search plan: a match in the query, else nothing (never a network request). */
export function searchPnp(q: string): Promise<IImageResult[]> {
  const member: { name: string; file: string } | undefined = findPnpMember([q]);
  const portrait: IImageResult | undefined = member ? pnpPortrait(member) : undefined;
  return Promise.resolve(portrait ? [portrait] : []);
}
