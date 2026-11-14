// Adapter for the Copilot host context. In sp-copilot-component 1.24.0-rc.0 some fields the desktop
// host sends (locale, containerDimensions) are missing from the typings, and others behave in ways
// the component must work around. All of that knowledge lives here, so the component reads plain
// values and the casts disappear when the typings catch up.

import type { ICopilotComponentHostContext, SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

type HostContext = ICopilotComponentHostContext | undefined;

function untyped(ctx: HostContext): Record<string, unknown> {
  return (ctx as unknown as Record<string, unknown> | undefined) || {};
}

/** hostContext.locale: the Microsoft 365 UI language ("en-us"), untyped in rc.0. */
export function hostLocale(ctx: HostContext): string | undefined {
  const value: unknown = untyped(ctx).locale;
  return typeof value === 'string' ? value : undefined;
}

export interface IContainerHeight {
  height: number;
  source: 'containerDimensions' | 'screen';
}

/**
 * The height the card may ask for in fullscreen: the container's height if the host reports it
 * (containerDimensions is untyped and often absent), otherwise the screen's available height (the
 * host caps it at its panel).
 */
export function containerHeight(ctx: HostContext): IContainerHeight | undefined {
  const dims: Record<string, unknown> = (untyped(ctx).containerDimensions as Record<string, unknown> | undefined) || {};
  const pick = (key: string): number | undefined => (typeof dims[key] === 'number' ? (dims[key] as number) : undefined);
  const fromHost: number | undefined = pick('maxHeight') || pick('height');
  if (fromHost) {
    return { height: Math.floor(fromHost), source: 'containerDimensions' };
  }
  const screen: number = typeof window !== 'undefined' && window.screen ? window.screen.availHeight : 0;
  return screen ? { height: Math.floor(screen), source: 'screen' } : undefined;
}

export interface IFullHeightRequest {
  target: number;
  source: string;
  before: number;
}

/**
 * In fullscreen Copilot sizes the iframe to the content height the card reports (auto-resize), so
 * a short story leaves the rest of the side panel empty. Ask for the full height once; when the
 * iframe is taller, the card's min-height of 100dvh makes auto-resize report that same height, so
 * it stays. Fire-and-forget: the host may ignore it. Asks again when the host has settled (it may
 * still be animating into fullscreen). Only for cards shorter than the target. `onRequest` receives
 * what was asked (diagnostics).
 */
export function requestFullHeight(
  ctx: HostContext,
  stillFullscreen: () => boolean,
  request: (width: number, height: number) => Promise<unknown>,
  onRequest: (asked: IFullHeightRequest) => void
): void {
  const target: IContainerHeight | undefined = containerHeight(ctx);
  const ask = (): void => {
    if (!stillFullscreen() || !target || window.innerHeight >= target.height) {
      return;
    }
    // A card at least that tall needs no request: auto-resize already reports its height, and
    // asking for more would only give the host empty space to scroll.
    if (document.documentElement.scrollHeight >= target.height) {
      return;
    }
    onRequest({ target: target.height, source: target.source, before: window.innerHeight });
    request(window.innerWidth, target.height).catch(() => undefined);
  };
  ask();
  window.setTimeout(ask, 400);
}

/** Whether the host offers a display mode; an absent list means "all". */
export function canUseMode(ctx: HostContext, mode: SPCopilotDisplayMode): boolean {
  const available: SPCopilotDisplayMode[] | undefined = ctx?.availableDisplayModes;
  return !available || available.indexOf(mode) !== -1;
}

/** Plain-data copy for diagnostics; functions and cycles become a string. */
export function jsonSafe(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value ?? null));
  } catch {
    return String(value);
  }
}
