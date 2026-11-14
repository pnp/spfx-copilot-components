// The component owns the whole iframe document, so a few things are set on <html> and <body>
// rather than on the card: the colour scheme and background (no host-coloured gaps around the
// card) and, for WCAG 3.1.1, the document language when the host left it empty. CSSOM, never
// style attributes: allowed under a strict style-src CSP.

import { textDirection } from './language';

/** Colours the iframe document like the card. `background` is the card's resolved background colour. */
export function applyDocumentTheme(theme: 'light' | 'dark', background: string): void {
  const html: HTMLElement = document.documentElement;
  html.style.colorScheme = theme;
  // Ease light ↔ dark instead of an abrupt brightness jump (none under reduced motion).
  const reduced: boolean = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.style.transition = document.body.style.transition = reduced ? '' : 'background-color 200ms ease';
  if (background) {
    html.style.backgroundColor = background;
    document.body.style.backgroundColor = background;
  }
  document.body.style.margin = '0';
}

const BOOT_STYLE_ID: string = 'cosmo-boot';

/** Width changes smaller than this (a scrollbar appearing or going) leave the fluid sizes alone. */
const FLUID_WIDTH_STEP: number = 24;

/**
 * The presets' fluid type and spacing follow the frame width through --card-vw (1 % of it). Set
 * here instead of using vw directly, so that a scrollbar in Copilot's widget frame (15 px) does not
 * shrink every size a little: the card got 1 px shorter when narrower, the scrollbar went away, the
 * card grew again, and Copilot and the card resized each other endlessly. Real width changes (a
 * wider panel, fullscreen) still scale the sizes. Once per document.
 */
export function stabilizeFluidWidth(): void {
  if (typeof window === 'undefined' || document.documentElement.style.getPropertyValue('--card-vw')) {
    return;
  }
  let applied: number = 0;
  const update = (): void => {
    const width: number = window.innerWidth;
    if (width > 0 && Math.abs(width - applied) > FLUID_WIDTH_STEP) {
      applied = width;
      document.documentElement.style.setProperty('--card-vw', `${width / 100}px`);
    }
  };
  update();
  window.addEventListener('resize', update);
}

/** Inline or fullscreen on <html>, for the boot style's mode rules (the inline scrollbar). */
export function applyDocumentMode(mode: 'inline' | 'fullscreen'): void {
  document.documentElement.setAttribute('data-cosmo-mode', mode);
}

/**
 * Prepares SharePoint's page shell in the iframe for the card, as soon as this bundle runs.
 * - SharePoint draws a generic grey skeleton (an SVG of <rect id="SPPortableComponentApplication_N">
 *   bars) until a component renders. It ignores the theme and looks nothing like the card: hidden;
 *   the card shows its own skeleton instead. Selected by the stable id prefix (its classes are hashed
 *   per SharePoint build).
 * - The shell makes <body> a 100%-high scroll container (html,body{height:100%},
 *   body{height:100vh;overflow-y:auto}) inside full-height flex wrappers. A card taller than the
 *   iframe then scrolls inside the iframe while Copilot scrolls the iframe too: two scrollbars. Here
 *   the document is exactly as tall as the card instead, so the host's auto-resize sees the real
 *   height and Copilot's panel is the only scroller.
 * - No min-height:100% anywhere: the document would never measure less than the frame it sits in,
 *   so any brief growth (a portrait photo before Magazine swaps in a landscape one, a fullscreen
 *   round trip) would stick as empty space below the card. No !important on height either: a host
 *   that measures by setting html.style.height must still be able to. Colours fill the frame anyway
 *   (applyDocumentTheme), and in fullscreen the card itself is 100dvh tall.
 * Once per document.
 */
export function prepareHostDocument(): void {
  if (typeof document === 'undefined' || document.getElementById(BOOT_STYLE_ID)) {
    return;
  }
  const style: HTMLStyleElement = document.createElement('style');
  style.id = BOOT_STYLE_ID;
  style.textContent =
    'svg:has(> rect[id^="SPPortableComponentApplication"]){display:none!important}' +
    // Engines without :has(): at least the bars go.
    'rect[id^="SPPortableComponentApplication"]{display:none}' +
    // One scroller, sized by the card: :root outranks SharePoint's html,body / body rules without
    // !important, so an inline style set by a measuring host still wins.
    ':root,:root>body{height:auto;overflow-y:visible}' +
    ':root>body{overflow-x:hidden}' +
    // Inline, the frame grows to fit the card, but a step behind it: for a moment the card is taller
    // than the frame. A scrollbar then would take width, rewrap the text, change the height and
    // vanish again (flicker). Inline never needs one, so it takes no space; scrolling still works.
    ':root[data-cosmo-mode="inline"]{scrollbar-width:none}' +
    ':root[data-cosmo-mode="inline"]::-webkit-scrollbar{display:none}' +
    ':root .SPPageChrome,:root .spAppAndPropertyPanelContainer,:root .SPPageChrome-app{height:auto}';
  (document.head || document.documentElement).appendChild(style);
  stabilizeFluidWidth();
}

/**
 * <html lang/dir> follows the card (WCAG 3.1.1). SharePoint fills them from the user's setting
 * (PortableComponent.aspx?culture=en-US → <html lang="en-US" dir="ltr">), not from what the page
 * shows; the frame holds nothing but this card, so its language is the card's. The host's values are
 * remembered and put back on release.
 */
export class DocumentLang {
  private _owned: boolean = false;
  private _hostLang: string | undefined;
  private _hostDir: string | undefined;

  public get owned(): boolean {
    return this._owned;
  }

  /** What the host had set before the card claimed the document (diagnostics). */
  public get hostLang(): string | undefined {
    return this._hostLang;
  }

  public claim(lang: string): void {
    const html: HTMLElement = document.documentElement;
    if (!this._owned) {
      this._hostLang = html.getAttribute('lang') ?? undefined;
      this._hostDir = html.getAttribute('dir') ?? undefined;
      this._owned = true;
    }
    html.lang = lang;
    html.dir = textDirection(lang);
  }

  public release(): void {
    if (!this._owned) {
      return;
    }
    const html: HTMLElement = document.documentElement;
    const restore = (name: string, value: string | undefined): void => (value === undefined ? html.removeAttribute(name) : html.setAttribute(name, value));
    restore('lang', this._hostLang);
    restore('dir', this._hostDir);
    this._owned = false;
  }
}
