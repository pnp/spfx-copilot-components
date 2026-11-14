// Template: a news card. It places five parts (meta, title, figure, text, footer) and owns
// everything that depends on the card's state, which lives in data-* attributes on the root:
//   data-mode    inline | fullscreen     → which parts exist (data-show), text clamping, full height
//   data-layout  lead | teaser | beside  → where the photo sits (grid areas / float)
//   data-design  presets                 → type scale (tokens/Presets); magazine overlays the headline
//   data-theme   light | dark            → colours (tokens/Tokens)
// The DOM is built once; changing state is changing attributes, so focus, scroll position and
// anything playing survive a switch.

import { h } from '../dom';

import tokens from '../tokens/Tokens.module.scss';
import presets from '../tokens/Presets.module.scss';
import styles from './Card.module.scss';

export type CardMode = 'inline' | 'fullscreen';

export interface ICardParts {
  meta: HTMLElement;
  title: HTMLElement;
  figure?: HTMLElement;
  text: HTMLElement;
  footer: HTMLElement;
}

export interface ICardProps {
  /** Language and direction of the chrome (the parts may carry their own). */
  lang: string;
  dir: 'ltr' | 'rtl';
  /** Id of the headline: the card is announced by its title. */
  labelledBy: string;
  /**
   * Direction of the story (headline and text), when it can differ from the chrome's: an Urdu or
   * Persian story with English labels. The photo then follows the story, not the labels.
   */
  contentDir?: 'ltr' | 'rtl';
  parts: ICardParts;
}

export interface ICardState {
  mode: CardMode;
  theme: 'light' | 'dark';
  design: string;
  layout: string;
}

export interface ICard {
  /** The outer element (size container); insert this into the page. */
  shell: HTMLElement;
  /** The card itself (carries the state attributes and the tokens). */
  root: HTMLElement;
  setState(state: ICardState): void;
  dispose(): void;
}

/**
 * An empty card frame (same tokens, padding, background and full-height behaviour) around a
 * placeholder, e.g. a skeleton while the page is still preparing the real parts.
 */
export function cardFrame(state: Pick<ICardState, 'mode' | 'theme'>, content: HTMLElement): HTMLElement {
  return h(
    'div',
    { className: styles.shell },
    h('div', { className: `${tokens.tokens} ${presets.presets} ${styles.card}`, 'data-mode': state.mode, 'data-theme': state.theme }, content)
  );
}

export function card(props: ICardProps): ICard {
  const { meta, title, figure, text, footer } = props.parts;
  // The template names the parts; its stylesheet addresses them only by these names.
  meta.setAttribute('data-part', 'meta');
  title.setAttribute('data-part', 'title');
  figure?.setAttribute('data-part', 'figure');
  text.setAttribute('data-part', 'text');
  footer.setAttribute('data-part', 'footer');

  const root: HTMLElement = h(
    'article',
    {
      className: `${tokens.tokens} ${presets.presets} ${styles.card}`,
      lang: props.lang,
      dir: props.dir,
      'aria-labelledby': props.labelledBy,
      'data-mixed-dir': !!props.contentDir && props.contentDir !== props.dir
    },
    // News order: meta → headline → photo (+ credit) → text → controls.
    meta,
    title,
    figure,
    text,
    footer
  );
  const shell: HTMLElement = h('div', { className: styles.shell }, root);

  // Line length in "beside": the paragraph's box also holds the floated photo, so its width is the
  // measure plus the photo column. The column depends on the photo, so it is tracked here.
  let observer: ResizeObserver | undefined;
  if (figure && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => {
      root.style.setProperty('--figure-inline', `${figure.hidden ? 0 : Math.ceil(figure.getBoundingClientRect().width)}px`);
    });
    observer.observe(figure);
  }

  return {
    shell,
    root,
    setState(state: ICardState): void {
      root.setAttribute('data-mode', state.mode);
      root.setAttribute('data-theme', state.theme);
      root.setAttribute('data-design', state.design);
      root.setAttribute('data-layout', state.layout);
    },
    dispose(): void {
      observer?.disconnect();
    }
  };
}
