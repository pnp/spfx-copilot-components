// Organism: the story, a headline and a paragraph of sentences. Two elements, because a template
// places them separately (e.g. the headline on the photo). One span per sentence, so a reader can
// mark the current sentence; the current word is marked with the CSS Custom Highlight API (no DOM
// changes while speaking). Engines without the API keep the sentence mark only.

import { h, type Child } from '../dom';

import styles from './Story.module.scss';

/** The name the stylesheet addresses with ::highlight(…). */
const WORD_HIGHLIGHT: string = 'cosmopolite-word';

export interface IStoryProps {
  /** Id of the headline, for aria-labelledby on the surrounding article. */
  id: string;
  title: string;
  sentences: string[];
  /** Language of the text (hyphenation, line breaking, screen reader voice). */
  lang: string;
  /** Direction per element: a headline in Latin letters inside an Arabic story stays left-to-right. */
  titleDir: 'ltr' | 'rtl';
  textDir: 'ltr' | 'rtl';
  /** Between sentences: a space, or nothing (Chinese and Japanese don't put spaces between sentences). */
  joiner: string;
}

export interface IStory {
  headline: HTMLElement;
  body: HTMLElement;
  /** In reading order: the headline (when there is one), then each sentence. */
  parts: HTMLElement[];
  /** Marks part `index` as being read (undefined: none). */
  setCurrent(index: number | undefined): void;
  /** Marks `length` characters from `start` in part `index` (no length: up to the next space or punctuation). */
  highlightWord(index: number, start: number, length: number): void;
  clearWord(): void;
}

interface IHighlightApi {
  highlights?: { set(name: string, highlight: unknown): void; delete(name: string): void };
}
type HighlightConstructor = new (...ranges: Range[]) => unknown;

function highlightRegistry(): IHighlightApi['highlights'] {
  return typeof CSS !== 'undefined' ? (CSS as unknown as IHighlightApi).highlights : undefined;
}

/**
 * A run of Latin-script text inside right-to-left text: words (with digits, apostrophes, + and the
 * like) joined by spaces, commas, & or /, plus symbols stuck to its front ("&Walsh", "#1").
 * Trailing sentence punctuation stays outside, so it ends up on the right-to-left side.
 */
const LATIN_RUN: RegExp =
  /[&@#+]*[A-Za-z\u00C0-\u024F][A-Za-z0-9\u00C0-\u024F'’+.\-]*(?:[\s,&+/]+[&@#+]*[A-Za-z0-9\u00C0-\u024F][A-Za-z0-9\u00C0-\u024F'’+.\-]*)*/g;

/**
 * Right-to-left text with names or terms in Latin script: each Latin run becomes its own
 * left-to-right island (dir="ltr" isolates it), so a symbol stuck to it stays on its side: "&Walsh",
 * not "Walsh&". The pieces concatenate to exactly the original text: character offsets (speech
 * boundaries, word highlight) stay valid. Left-to-right text is one plain text node.
 */
function bidiPieces(text: string, dir: 'ltr' | 'rtl'): Child[] {
  if (dir !== 'rtl') {
    return [text];
  }
  const pieces: Child[] = [];
  let last: number = 0;
  text.replace(LATIN_RUN, (match: string, offset: number) => {
    const run: string = match.replace(/[.'’\-]+$/, '');
    if (run) {
      if (offset > last) {
        pieces.push(text.slice(last, offset));
      }
      pieces.push(h('span', { dir: 'ltr' }, run));
      last = offset + run.length;
    }
    return match;
  });
  if (last < text.length) {
    pieces.push(text.slice(last));
  }
  return pieces;
}

/** The text node and offset inside it for a character offset into `el`'s whole text. */
function locate(el: HTMLElement, offset: number): { node: Text; at: number } | undefined {
  const walker: TreeWalker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let seen: number = 0;
  for (let node: Node | null = walker.nextNode(); node; node = walker.nextNode()) {
    const length: number = (node as Text).data.length;
    if (offset <= seen + length) {
      return { node: node as Text, at: offset - seen };
    }
    seen += length;
  }
  return undefined;
}

export function story(props: IStoryProps): IStory {
  const headline: HTMLElement = h(
    'h2',
    { id: props.id, className: styles.title, lang: props.lang, dir: props.titleDir },
    bidiPieces(props.title, props.titleDir)
  );
  const sentences: HTMLElement[] = props.sentences.map((s: string) => h('span', { className: styles.sentence }, bidiPieces(s, props.textDir)));
  const children: Child[] = [];
  sentences.forEach((el: HTMLElement, i: number) => {
    if (i > 0 && props.joiner) {
      children.push(props.joiner);
    }
    children.push(el);
  });
  const body: HTMLElement = h('p', { className: styles.text, lang: props.lang, dir: props.textDir }, children);
  const parts: HTMLElement[] = props.title ? [headline, ...sentences] : sentences;

  const clearWord = (): void => {
    highlightRegistry()?.delete(WORD_HIGHLIGHT);
  };

  return {
    headline,
    body,
    parts,
    setCurrent(index: number | undefined): void {
      parts.forEach((el: HTMLElement, i: number) => el.classList.toggle(styles.current, i === index));
    },
    highlightWord(index: number, start: number, length: number): void {
      const registry: IHighlightApi['highlights'] = highlightRegistry();
      const ctor: HighlightConstructor | undefined = (window as unknown as { Highlight?: HighlightConstructor }).Highlight;
      const part: HTMLElement | undefined = parts[index];
      if (!registry || !ctor || !part) {
        return;
      }
      // The part may consist of several text nodes (Latin islands in right-to-left text): offsets
      // count over its whole text.
      const text: string = part.textContent || '';
      let end: number = start + length;
      if (!length) {
        const match: RegExpExecArray | null = /^[^\s.,;:!?،。、۔]+/.exec(text.slice(start));
        end = start + (match ? match[0].length : 1);
      }
      const from: { node: Text; at: number } | undefined = locate(part, Math.min(start, text.length));
      const to: { node: Text; at: number } | undefined = locate(part, Math.min(end, text.length));
      if (!from || !to) {
        return;
      }
      try {
        const range: Range = document.createRange();
        range.setStart(from.node, from.at);
        range.setEnd(to.node, to.at);
        registry.set(WORD_HIGHLIGHT, new ctor(range));
      } catch {
        // Offsets from some voices don't match the text; ignore.
      }
    },
    clearWord
  };
}
