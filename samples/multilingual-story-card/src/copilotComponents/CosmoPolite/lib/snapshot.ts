// Everything the diagnostics drawer shows, as plain data: what the agent sent, what the card told
// the model, the image search, sizes, state and the language decisions. Lives in the main bundle
// (cheap); the drawer itself is a lazy chunk.

import type { ICardLanguage } from './cardLanguage';
import { jsonSafe, type IFullHeightRequest } from './host';
import { contentDirection, textDirection } from './language';
import type { ICardInput } from './normalize';
import type { LanguageSource } from './strings';

export interface ISnapshotSources {
  properties: unknown;
  hostContext: unknown;
  input: ICardInput;
  language: ICardLanguage;
  modelContext: unknown;
  imageSearch: Record<string, unknown> | undefined;
  voices: Record<string, unknown> | undefined;
  mount: number;
  renders: number;
  root: HTMLElement | undefined;
  /** Mode and resolved look, when the card is built. */
  state: Record<string, unknown> | undefined;
  fullHeightRequest: IFullHeightRequest | undefined;
  htmlLangOwned: boolean;
  /** What the host had put on <html lang> (the user's setting) before the card claimed it. */
  hostLang: string | undefined;
}

/** What scrolls inside the iframe (should be nothing but the diagnostics JSON box). */
function scrollInfo(): Record<string, unknown> {
  const box = (el: Element): string => `${el.scrollHeight}/${el.clientHeight}`;
  const scrollers: string[] = [];
  document.querySelectorAll('*').forEach((el: Element) => {
    const overflow: string = getComputedStyle(el).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight + 1 && el.tagName !== 'PRE') {
      scrollers.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.split(' ')[0]}` : ''} ${box(el)}`);
    }
  });
  return {
    window: window.innerHeight,
    html: box(document.documentElement),
    body: `${box(document.body)} overflow-y:${getComputedStyle(document.body).overflowY}`,
    scrollers
  };
}

export function snapshot(s: ISnapshotSources): Record<string, unknown> {
  const p: Record<string, unknown> = (jsonSafe(s.properties) as Record<string, unknown>) || {};
  const lang: ICardLanguage = s.language;
  return {
    // What the agent sent this turn (raw tool arguments, before the card's checks).
    agent: {
      language: p.language,
      title: p.title,
      imageQuery: p.imageQuery,
      imageSource: p.imageSource,
      wikipediaTitle: p.wikipediaTitle,
      imageAlt: p.imageAlt,
      design: p.design,
      layout: p.layout,
      voice: p.voice
    },
    // What the card gave the model as context for the next turn.
    modelContext: s.modelContext,
    imageSearch: s.imageSearch,
    mount: s.mount,
    renders: s.renders,
    iframe: `${window.innerWidth}×${window.innerHeight}`,
    containerDimensions: jsonSafe((s.hostContext as Record<string, unknown> | undefined)?.containerDimensions),
    fullHeightRequest: s.fullHeightRequest ? { ...s.fullHeightRequest, now: window.innerHeight } : undefined,
    content: s.root ? `${s.root.offsetWidth}×${s.root.offsetHeight}` : undefined,
    // One scrollbar expected (Copilot's): anything listed under scrollers scrolls inside the iframe.
    scroll: scrollInfo(),
    state: s.state,
    language: {
      requested: lang.requested,
      content: lang.content,
      mismatch: lang.reconciled.mismatch,
      direction: {
        ui: textDirection(lang.ui.lang),
        title: contentDirection(s.input.title, lang.content),
        text: contentDirection(s.input.text, lang.content)
      },
      ui: lang.ui,
      uiTableReviewed: lang.reviewed,
      candidates: lang.candidates.map(([source, value]: [LanguageSource, unknown]) => ({ source, value }))
    },
    htmlLang: { value: document.documentElement.lang, setByComponent: s.htmlLangOwned, host: s.hostLang },
    voices: s.voices,
    input: s.input,
    properties: jsonSafe(s.properties),
    hostContext: jsonSafe(s.hostContext)
  };
}
