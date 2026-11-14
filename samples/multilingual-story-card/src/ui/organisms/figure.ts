// Organism: a photo with its credit, or a loading skeleton, or nothing at all. Display only: the
// page decides which photo (search, fallbacks) and calls show(). The figure swaps its own children,
// so nothing around it is rebuilt when the photo arrives or fails.

import { h } from '../dom';
import { visuallyHidden } from '../atoms/visuallyHidden';

import styles from './Figure.module.scss';

export type FigureView =
  /** A quiet skeleton in the photo's place; `label` is read to screen readers ("Loading"). */
  | { status: 'loading'; label: string }
  /** No photo: the figure is hidden, the template closes the gap. */
  | { status: 'none' }
  | {
      status: 'image';
      src: string;
      alt: string;
      lang?: string;
      dir?: 'ltr' | 'rtl';
      /** Real size when known: the photo is scaled, never cropped. */
      width?: number;
      height?: number;
      /** Ask the template to crop (e.g. an image-led design that needs a horizontal band). */
      cropped?: boolean;
      /** The credit line (molecules/credit). */
      caption?: HTMLElement;
      /** The photo didn't load (blocked host, removed file). */
      onError?: () => void;
    };

export interface IFigure {
  element: HTMLElement;
  show(view: FigureView): void;
}

export function figure(): IFigure {
  const element: HTMLElement = h('figure', { className: styles.figure });

  const media = (view: FigureView): HTMLElement | undefined => {
    if (view.status === 'loading') {
      return h('div', { className: styles.placeholder, 'data-part': 'placeholder', 'aria-busy': 'true' }, visuallyHidden(view.label));
    }
    if (view.status !== 'image') {
      return undefined;
    }
    const img: HTMLImageElement = h('img', {
      className: styles.image,
      'data-part': 'image',
      src: view.src,
      alt: view.alt,
      lang: view.lang,
      dir: view.dir,
      // Size unknown (e.g. museum objects): no attributes, the browser takes the photo's own size.
      width: view.width || undefined,
      height: view.height || undefined,
      decoding: 'async',
      'data-crop': !!view.cropped,
      // Materialises once decoded (blur and scale settle into place) instead of popping in.
      'data-loading': true
    });
    const settle = (): void => img.removeAttribute('data-loading');
    img.addEventListener('load', () => {
      (typeof img.decode === 'function' ? img.decode() : Promise.resolve()).then(settle, settle);
    });
    const onError: (() => void) | undefined = view.onError;
    if (onError) {
      img.addEventListener('error', () => onError());
    }
    return img;
  };

  return {
    element,
    show(view: FigureView): void {
      element.hidden = view.status === 'none';
      element.replaceChildren(...(view.status === 'none' ? [] : [media(view) || '', (view.status === 'image' && view.caption) || '']));
    }
  };
}
