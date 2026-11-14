// The Met (Open Access): public-domain artworks, for art topics.

import { isAllowedImageUrl, isAllowedLinkUrl } from '../allowlist';
import { getJson, query } from '../fetch';
import type { IImageResult } from '../types';

const MET_API: string = 'https://collectionapi.metmuseum.org/public/collection';

export function buildMetSearchUrl(q: string): string {
  // v1/search was retired on 2026-10-01; v1.1 is the replacement (objects stay on v1).
  return `${MET_API}/v1.1/search?${query({ hasImages: 'true', q })}`;
}

interface IMetObject {
  isPublicDomain?: boolean;
  primaryImageSmall?: string;
  title?: string;
  artistDisplayName?: string;
  objectURL?: string;
}

/** Only public-domain objects with an image; size is unknown until the image loads. */
export function pickMetObject(o: IMetObject): IImageResult | undefined {
  if (!o?.isPublicDomain || !o.primaryImageSmall || !isAllowedImageUrl(o.primaryImageSmall)) {
    return undefined;
  }
  return {
    src: o.primaryImageSmall,
    width: 0,
    height: 0,
    pageUrl: o.objectURL && isAllowedLinkUrl(o.objectURL) ? o.objectURL : undefined,
    artist: o.artistDisplayName || o.title,
    license: 'Public domain',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'met',
    provider: 'The Met'
  };
}

export async function searchMet(q: string): Promise<IImageResult[]> {
  const ids: number[] = ((await getJson(buildMetSearchUrl(q), 'Met API')) as { objectIDs?: number[] })?.objectIDs || [];
  const objects: Array<IMetObject | undefined> = await Promise.all(
    ids.slice(0, 8).map((id: number) =>
      getJson(`${MET_API}/v1/objects/${id}`, 'Met API').then(
        (o: unknown) => o as IMetObject,
        () => undefined
      )
    )
  );
  return objects.map((o: IMetObject | undefined) => (o ? pickMetObject(o) : undefined)).filter((x): x is IImageResult => !!x);
}
