/**
 * Copilot Chat's widget frame often starts at about 150–220 px and will stay
 * there if we copy the current offsetHeight back to the host, or if auto-resize
 * measures a short html/body. Plan an explicit pixel height, set it on the
 * component root and the document, and request that planned size.
 * Never echo the frame's current height.
 */

export interface IHostHeightInput {
  /** Fixed height from the Copilot host, in pixels. */
  containerHeight?: number;
  /** Maximum height the Copilot host will allow, in pixels. */
  containerMaxHeight?: number;
  /**
   * The host element's client height when that element is already a bounded box
   * taller than this component. This is not the browser window.
   */
  parentClientHeight?: number;
}

/** A positive finite pixel length, or undefined. */
export function positivePixels(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.max(1, Math.round(value));
}

/** The Copilot root asks for at least this much height, clamped to a real host maximum. */
export const PREFERRED_FILL = 600;

/**
 * Default widget frames land in this band (~150–220, sometimes a little more).
 * A containerMaxHeight in this band is treated as the current frame, not a real cap.
 */
export const FRAME_ECHO_MAX = 320;

/**
 * Fullscreen fill = tallest window measure minus Copilot chrome, as in the PnP Events
 * sample (useEventFeedScrollAreaHeight). Inside the Copilot widget renderer the
 * component frame is sized from the content height it reports, so its own
 * innerHeight or parent height is only the current (default 150px) allocation.
 */
export const FULLSCREEN_CHROME_OFFSET = 200;

export interface IWindowHeights {
  visualViewportHeight?: number;
  innerHeight?: number;
  /** Browser window outer height. Readable from a cross-origin iframe. */
  outerHeight?: number;
  screenAvailHeight?: number;
}

export interface IHostHeightPlanInput extends IHostHeightInput {
  /** Copilot display mode from the host context, for example "inline" or "fullscreen". */
  displayMode?: string;
  /** Window measures. Used only in fullscreen or other fill modes. */
  window?: IWindowHeights;
}

export interface IHostHeightPlan {
  /** Pixel height for the Copilot root. Always resolved. */
  height: number;
  /** Height to report with requestSizeChangeAsync. */
  request?: number;
  source: 'fullscreen-frame' | 'fullscreen-window' | 'host-max' | 'preferred';
}

/** Anything other than inline (fullscreen, or a future focus/panel mode) should fill the host. */
export function isFillDisplayMode(mode: string | undefined): boolean {
  return !!mode && mode !== 'inline';
}

/**
 * A maxHeight in the default widget band, especially when it matches the current
 * frame, is the allocation the host already gave — not a cap we must honour.
 */
export function isFrameEcho(maxHeight?: number, containerHeight?: number): boolean {
  const max = positivePixels(maxHeight);
  if (!max || max >= PREFERRED_FILL) {
    return false;
  }
  const current = positivePixels(containerHeight);
  if (max <= FRAME_ECHO_MAX) {
    return true;
  }
  return !!current && Math.abs(max - current) <= 24;
}

/** Read window measures from a real Window. Never pass the Window object itself as IWindowHeights. */
export function windowMeasures(view: { innerHeight?: number; outerHeight?: number; visualViewport?: { height: number }; screen?: { availHeight?: number } } | undefined): IWindowHeights | undefined {
  if (!view) {
    return undefined;
  }
  return {
    visualViewportHeight: view.visualViewport ? view.visualViewport.height : undefined,
    innerHeight: view.innerHeight,
    outerHeight: view.outerHeight,
    screenAvailHeight: view.screen ? view.screen.availHeight : undefined
  };
}

/** Events-style fullscreen estimate: tallest window measure minus the Copilot chrome. */
export function fullscreenWindowFill(heights: IWindowHeights | undefined): number | undefined {
  if (!heights) {
    return undefined;
  }
  const tallest = Math.max(
    finite(heights.visualViewportHeight),
    finite(heights.innerHeight),
    finite(heights.outerHeight),
    finite(heights.screenAvailHeight)
  );
  const fill = Math.round(tallest - FULLSCREEN_CHROME_OFFSET);
  return fill >= PREFERRED_FILL ? fill : undefined;
}

function finite(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function realMaxHeight(input: IHostHeightPlanInput): number | undefined {
  const max = positivePixels(input.containerMaxHeight);
  if (!max || isFrameEcho(max, input.containerHeight)) {
    return undefined;
  }
  return max;
}

/**
 * Height plan for the Copilot root. The Copilot widget frame grows to the height the
 * content reports (the framework's auto-resize measures html, and
 * requestSizeChangeAsync sends the same size-changed notification). So the root and
 * the document must carry an explicit height of their own. Never copy the frame's
 * current height back, or the frame stays at its 150–220px default.
 * - Fill modes (fullscreen, or any non-inline mode): a fixed host height of at least
 *   PREFERRED_FILL, else the real host maximum, else the window fill, else PREFERRED_FILL.
 * - Inline: the real host maximum, else PREFERRED_FILL or the fixed height when larger.
 * A maxHeight in the default widget band is ignored so a 220px "max" cannot block 600px.
 */
export function planHostHeight(input: IHostHeightPlanInput): IHostHeightPlan {
  const fixed = positivePixels(input.containerHeight);
  const max = realMaxHeight(input);
  const cap = (value: number): number => max ? Math.min(value, max) : value;
  const floor = max ? Math.min(PREFERRED_FILL, max) : PREFERRED_FILL;
  if (isFillDisplayMode(input.displayMode)) {
    if (fixed && fixed >= floor) {
      const height = cap(fixed);
      return { height, request: height, source: 'fullscreen-frame' };
    }
    if (max) {
      return { height: max, request: max, source: 'host-max' };
    }
    const fill = fullscreenWindowFill(input.window);
    const height = fill || floor;
    return { height, request: height, source: fill ? 'fullscreen-window' : 'preferred' };
  }
  const current = fixed || 0;
  if (max) {
    const height = Math.max(max, floor);
    return { height, request: height > current ? height : undefined, source: 'host-max' };
  }
  const height = Math.max(floor, current);
  return { height, request: height > current ? height : undefined, source: 'preferred' };
}

/**
 * Height for the Copilot root. Kept for callers that only need the number.
 * Same rules as planHostHeight, so the host maximum beats the compact allocation.
 */
export function hostContentHeight(input: IHostHeightPlanInput): number {
  return planHostHeight(input).height;
}

/** Ask the Copilot host to resize only when a real pixel height was resolved. */
export function sizeChangeRequest(width: number, height: number | undefined): { width: number; height: number } | undefined {
  if (!height || !Number.isFinite(width) || width < 1) {
    return undefined;
  }
  return { width: Math.round(width), height };
}

/**
 * Use the parent height only when the parent is a real box, not an element that
 * is growing to fit this component. A parent merely 24px taller is the blank
 * space under a short root. The planned height must never copy this value back
 * as the component size; it is only a bound detector.
 */
export function parentHeightIfBounded(parent: { clientHeight: number; heightStyle: string; maxHeightStyle: string }, selfOffsetHeight: number): number | undefined {
  const explicit = parent.heightStyle.slice(-2) === 'px' || parent.maxHeightStyle.slice(-2) === 'px';
  const slack = parent.clientHeight > selfOffsetHeight + 24;
  if (!explicit && !slack) {
    return undefined;
  }
  return positivePixels(parent.clientHeight);
}

/** Set an explicit pixel box on the Copilot root. Never pass measured offsetHeight. */
export function applyPlannedHeight(element: HTMLElement, plan: IHostHeightPlan, displayMode?: string): void {
  element.style.boxSizing = 'border-box';
  element.style.width = '100%';
  element.style.maxWidth = 'none';
  element.style.height = `${plan.height}px`;
  element.style.minHeight = `${plan.height}px`;
  // Do not set maxHeight: the host may later give more room (side panel / fullscreen).
  element.style.maxHeight = '';
  element.style.overflow = 'hidden';
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  element.setAttribute('data-host-height', `${displayMode || 'inline'}:${plan.source}:${plan.height}`);
}

const VIEWPORT_LOCK = 'data-wizard-host-height';

/**
 * Lock html and body to the planned height so the framework auto-resize observer
 * reports that size instead of the 150–220px iframe or a height:100% echo.
 */
export function lockDocumentHeight(doc: Document, height: number): void {
  if (!doc.head) {
    return;
  }
  let style = doc.head.querySelector(`style[${VIEWPORT_LOCK}]`) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement('style');
    style.setAttribute(VIEWPORT_LOCK, 'true');
    doc.head.appendChild(style);
  }
  style.textContent = `html, body { width: 100%; height: ${height}px !important; min-height: ${height}px !important; max-height: ${height}px !important; overflow: hidden !important; } body { margin: 0; }`;
}

export function unlockDocumentHeight(doc: Document | undefined): void {
  if (!doc || !doc.head) {
    return;
  }
  const style = doc.head.querySelector(`style[${VIEWPORT_LOCK}]`);
  if (style && style.parentNode) {
    style.parentNode.removeChild(style);
  }
}

/** Request again if the host is still shorter than the plan, even if we already asked for this size. */
export function shouldResendSizeRequest(input: { alreadyRequested?: string; width: number; planned: number; containerHeight?: number }): boolean {
  const size = sizeChangeRequest(input.width, input.planned);
  if (!size) {
    return false;
  }
  const key = `${size.width}x${size.height}`;
  const current = positivePixels(input.containerHeight) || 0;
  if (current >= size.height) {
    return false;
  }
  return input.alreadyRequested !== key || current < size.height;
}
