import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';

/**
 * Below this width, in pixels, the fullscreen view stacks the detail
 * pane instead of placing it next to the card grid.
 */
export const NARROW_WIDTH: number = 720;

export interface IHostLayout {
  /** True when the host shows the component in fullscreen. */
  isFullscreen: boolean;
  /** True when the component can ask the host for fullscreen. */
  canExpand: boolean;
  /** Width of the component in pixels, when it is known. */
  width: number | undefined;
  /** True when there is no room for two regions side by side. */
  isNarrow: boolean;
  /** False when the device cannot hover. */
  canHover: boolean;
}

/**
 * Turns the host context into layout decisions. Every field of the
 * host context is optional, so every decision has a default.
 *
 * Call this on every render. Do not store the result.
 */
export function resolveHostLayout(
  hostContext: ICopilotComponentHostContext,
  measuredWidth: number | undefined
): IHostLayout {
  const isFullscreen: boolean = hostContext.displayMode === 'fullscreen';
  const canExpand: boolean =
    !isFullscreen && (hostContext.availableDisplayModes ?? []).indexOf('fullscreen') !== -1;

  // The measured width is the real width of the component. The width
  // the host reports is used for the first render, before a measure.
  const width: number | undefined = measuredWidth ?? hostContext.containerDimensions?.width;

  const isMobile: boolean = hostContext.platform === 'mobile';
  const isNarrow: boolean = isMobile || (width !== undefined && width < NARROW_WIDTH);
  const canHover: boolean = !isMobile && hostContext.deviceCapabilities?.hover !== false;

  return { isFullscreen, canExpand, width, isNarrow, canHover };
}
