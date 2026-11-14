// The photo's controller: searches, picks a candidate (landscape for Magazine), falls through to the
// next candidate when one fails to load, and records what it did for the diagnostics drawer. The
// display is the shared figure organism (src/ui); this file decides what it shows.
// Without a photo there is no figure at all (hidden): no "no photo" box, the layouts close the gap.

import type { Child } from '../../../ui/dom';
import { credit } from '../../../ui/molecules/credit';
import { figure, type IFigure } from '../../../ui/organisms/figure';
import { isLandscape, queryVariants, searchImages, searchPlan, type IImageResult, type ImageKind, type ImageSource, type ISearchStep } from './images';
import { contentDirection } from './language';
import type { IUiStrings } from './strings/types';

export type ImageState =
  | { status: 'loading' }
  | { status: 'ok'; image: IImageResult; candidates: IImageResult[]; cropped: boolean; why: string }
  | { status: 'empty' }
  | { status: 'error'; reason: string; error: string };

export interface IImageFigureOptions {
  query: string | undefined;
  title: string;
  alt: string | undefined;
  /** The agent's analysis: which kind of picture fits (decides the source order). */
  kind?: ImageKind;
  /** Exact English Wikipedia article whose lead image fits best. */
  wikipediaTitle?: string;
  /** Language of the alt text (the user's language). */
  lang: string;
  strings: IUiStrings;
  /** A link-styled button that opens `url` through the Copilot bridge. */
  link(label: string, url: string): HTMLElement;
}

export class ImageFigure {
  public readonly element: HTMLElement;
  private readonly _opts: IImageFigureOptions;
  private readonly _view: IFigure;
  private _state: ImageState = { status: 'empty' };
  /** Image-led designs (Magazine) take the first landscape candidate instead of the best-ranked one. */
  private _preferLandscape: boolean = false;
  // For the diagnostics drawer: what was searched, in which order, and what came back.
  private _plan: ImageSource[] = [];
  private _queries: string[] = [];
  private _trace: ISearchStep[] = [];
  private _skipped: number = 0;

  public constructor(options: IImageFigureOptions) {
    this._opts = options;
    this._view = figure();
    this.element = this._view.element;
    this._render();
  }

  /** Starts the search; the figure updates itself when it settles. */
  public load(): void {
    const queries: string[] = queryVariants(this._opts.query, this._opts.title);
    if (queries.length === 0 && !this._opts.wikipediaTitle) {
      this._set({ status: 'error', reason: 'no-query', error: 'No image keywords' });
      return;
    }
    this._set({ status: 'loading' });
    this._plan = searchPlan(this._opts.kind);
    this._queries = queries;
    this._trace = [];
    searchImages(queries, { sources: this._plan, wikipediaTitle: this._opts.wikipediaTitle, trace: this._trace }).then(
      (candidates: IImageResult[]) => this._set(candidates.length > 0 ? this._choose(candidates) : { status: 'empty' }),
      (error: unknown) => {
        const reason: string = (error as { reason?: string })?.reason || 'network';
        this._set({ status: 'error', reason, error: error instanceof Error ? error.message : String(error) });
      }
    );
  }

  /**
   * Magazine needs a horizontal band: switch to the first landscape candidate (in place, no
   * rebuild). If every candidate is portrait, the photo is cropped to 3:2 for this design only.
   */
  public setPreferLandscape(prefer: boolean): void {
    if (prefer === this._preferLandscape) {
      return;
    }
    this._preferLandscape = prefer;
    const state: ImageState = this._state;
    if (state.status !== 'ok') {
      return;
    }
    const next: ImageState = this._choose(state.candidates);
    if (next.status === 'ok' && (next.image !== state.image || next.cropped !== state.cropped)) {
      this._set(next);
    }
  }

  private _skip(failed: IImageResult): void {
    const state: ImageState = this._state;
    if (state.status !== 'ok') {
      return;
    }
    const rest: IImageResult[] = state.candidates.filter((c: IImageResult) => c !== failed);
    this._skipped++;
    this._set(rest.length > 0 ? this._choose(rest) : { status: 'error', reason: 'image-load', error: 'no candidate image loaded' });
  }

  private _choose(candidates: IImageResult[]): ImageState {
    if (this._preferLandscape) {
      const landscape: IImageResult | undefined = candidates.find((c: IImageResult) => isLandscape(c));
      return landscape
        ? { status: 'ok', image: landscape, candidates, cropped: false, why: `first landscape hit (#${candidates.indexOf(landscape) + 1} of ${candidates.length}), Magazine needs one` }
        : { status: 'ok', image: candidates[0], candidates, cropped: true, why: `no landscape hit among ${candidates.length}: best one, cropped to 3:2 for Magazine` };
    }
    return { status: 'ok', image: candidates[0], candidates, cropped: false, why: `best-ranked hit (of ${candidates.length})` };
  }

  /** What the agent asked for, every search step, and which photo was picked and why. */
  public diagnostics(): Record<string, unknown> {
    const state: ImageState = this._state;
    return {
      status: state.status === 'error' ? `error: ${state.reason}` : state.status,
      kind: this._opts.kind || '(none: default order)',
      wikipediaTitle: this._opts.wikipediaTitle,
      plan: this._plan,
      queries: this._queries,
      steps: this._trace,
      picked:
        state.status === 'ok'
          ? {
              why: this._skipped > 0 ? `${state.why}; ${this._skipped} photo(s) before it failed to load` : state.why,
              source: state.image.source,
              provider: state.image.provider,
              artist: state.image.artist,
              license: state.image.license,
              size: state.image.width ? `${state.image.width}×${state.image.height}` : 'unknown until loaded',
              src: state.image.src,
              page: state.image.pageUrl
            }
          : undefined
    };
  }

  private _set(state: ImageState): void {
    this._state = state;
    this._render();
  }

  private _render(): void {
    const state: ImageState = this._state;
    this.element.setAttribute('data-image-status', state.status === 'error' ? state.reason : state.status);
    if (state.status === 'loading') {
      // Only while loading: a quiet skeleton in the photo's place.
      this._view.show({ status: 'loading', label: this._opts.strings.loading });
    } else if (state.status === 'ok') {
      const alt: string = this._opts.alt || this._opts.title;
      this._view.show({
        status: 'image',
        src: state.image.src,
        alt,
        lang: this._opts.lang,
        dir: contentDirection(alt, this._opts.lang),
        width: state.image.width,
        height: state.image.height,
        // Only for Magazine when no landscape photo exists: the template crops it to 3:2.
        cropped: state.cropped,
        caption: this._credit(state.image),
        // A photo that won't load (blocked host, removed file) gives way to the next candidate.
        onError: () => this._skip(state.image)
      });
    } else {
      this._view.show({ status: 'none' });
    }
  }

  private _credit(image: IImageResult): HTMLElement {
    const link = (label: string, url: string | undefined): Child => (url ? this._opts.link(label, url) : label);
    return credit(
      `${this._opts.strings.photo}: `,
      link(image.artist || image.provider || 'Wikimedia Commons', image.pageUrl),
      image.license ? [' · ', link(image.license, image.licenseUrl)] : null,
      // Name the collection too when it isn't obvious from the link (The Met, NASA).
      image.provider && image.artist && image.source !== 'commons' && image.source !== 'wikipedia' ? [' · ', image.provider] : null
    );
  }
}
