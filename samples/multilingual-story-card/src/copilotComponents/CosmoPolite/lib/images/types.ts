// Shared shapes of the image search: what a source returns, why a search failed, and the steps a
// search took (for the diagnostics drawer).

import { IMAGE_KINDS } from '../contract';

export type ImageSource = 'pnp' | 'wikipedia' | 'met' | 'nasa' | 'openverse' | 'commons';

/** What kind of picture the agent asked for (its analysis of the question). */
export type ImageKind = (typeof IMAGE_KINDS)[number];

/** Display width the card asks for (Commons thumbnail bucket). */
export const DISPLAY_WIDTH: number = 960;
/** Smaller originals look soft in a 900 px side panel: skipped. */
export const MIN_WIDTH: number = 640;

export interface IImageResult {
  src: string;
  width: number;
  height: number;
  /** File description page on Commons. */
  pageUrl: string | undefined;
  artist: string | undefined;
  license: string | undefined;
  licenseUrl: string | undefined;
  /** Where the search found it. */
  source?: ImageSource;
  /** Original collection when it differs from the search (e.g. "Wikimedia Commons" via Openverse). */
  provider?: string;
}

/** Why no image is shown: network covers CSP (connect-src), CORS and offline, which look identical to script. */
export type ImageFailure = 'no-query' | 'empty' | 'network' | `http-${number}` | 'bad-response';

export class ImageSearchError extends Error {
  public readonly reason: ImageFailure;
  public constructor(reason: ImageFailure, message: string) {
    super(message);
    this.reason = reason;
    // ES5 target: restore the prototype chain broken by extending Error.
    Object.setPrototypeOf(this, ImageSearchError.prototype);
  }
}

/** One step of an image search, for the diagnostics drawer ("what did it look for?"). */
export interface ISearchStep {
  source: ImageSource;
  /** "title" = the named Wikipedia article, "keywords" = a keyword search, "name" = a PnP team member's name. */
  kind: 'title' | 'keywords' | 'name';
  query: string;
  outcome: 'found' | 'empty' | 'failed' | 'skipped';
  count?: number;
  /** Why it failed (http-429, network, …) or was skipped. */
  reason?: string;
  ms?: number;
}

export interface ISearchOptions {
  /** Sources to try, in order (default: Wikipedia, Openverse, Commons). */
  sources?: ImageSource[];
  /** Exact English Wikipedia article: its lead image is tried before any keyword search. */
  wikipediaTitle?: string;
  /** Receives every step of the search, in order. */
  trace?: ISearchStep[];
}
