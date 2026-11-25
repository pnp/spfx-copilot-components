/**
 * Placement and typography for the ThemedSelect menu. The menu is portaled to document.body
 * (so the Copilot host cannot clip it), and therefore must not rely on Fluent CSS variables or
 * inherited body styles. Position uses viewport coordinates from getBoundingClientRect() with
 * position:fixed: never add scrollX/scrollY, which would double-count.
 * Font size matches the question-screen body and the rest of the picker.
 */

import { BODY_FONT_SIZE, BODY_LINE_HEIGHT, CARD_FONT_FAMILY } from './typeface';

export const MENU_FONT_FAMILY = CARD_FONT_FAMILY;
export const MENU_FONT_SIZE = BODY_FONT_SIZE;
export const MENU_LINE_HEIGHT = BODY_LINE_HEIGHT;
export const MENU_COLOR = '#ffffff';
export const MENU_OPTION_COLOR = '#f7f5f1';
export const MENU_GAP_PX = 4;
export const MENU_MIN_HEIGHT_PX = 96;
export const MENU_MAX_HEIGHT_PX = 240;
export const MENU_VIEWPORT_PAD_PX = 8;

export interface ITriggerRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

export interface IViewportRect {
  top: number;
  bottom: number;
}

export interface IMenuPlacement {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  flip: boolean;
}

export interface IMenuTypeStyle {
  boxSizing: 'border-box';
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  color: string;
}

/** Explicit type styles so a portaled menu does not inherit a host serif/Times face. */
export function menuTypeStyle(color: string = MENU_COLOR): IMenuTypeStyle {
  return {
    boxSizing: 'border-box',
    fontFamily: MENU_FONT_FAMILY,
    fontSize: MENU_FONT_SIZE,
    lineHeight: MENU_LINE_HEIGHT,
    color
  };
}

/**
 * Layout viewport used with position:fixed. Uses innerHeight only (not visualViewport.offsetTop
 * and not scrollY), so it stays in the same coordinate space as getBoundingClientRect().
 */
export function viewportFromWindow(view?: { innerHeight?: number }): IViewportRect {
  const height = view && typeof view.innerHeight === 'number' && view.innerHeight > 0 ? view.innerHeight : 600;
  return {
    top: MENU_VIEWPORT_PAD_PX,
    bottom: Math.max(MENU_VIEWPORT_PAD_PX + 1, height - MENU_VIEWPORT_PAD_PX)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Place the menu just below the trigger (4px gap) and the same width. Flip above only when
 * there is not enough room below for MENU_MIN_HEIGHT_PX and there is more room above.
 * `trigger` must be viewport coordinates (getBoundingClientRect), not offsetTop + scroll.
 */
export function planMenuPosition(trigger: ITriggerRect, viewport: IViewportRect): IMenuPlacement {
  const gap = MENU_GAP_PX;
  const spaceBelow = viewport.bottom - trigger.bottom - gap;
  const spaceAbove = trigger.top - viewport.top - gap;
  const flip = spaceBelow < MENU_MIN_HEIGHT_PX && spaceAbove > spaceBelow;
  const available = flip ? spaceAbove : spaceBelow;
  const maxHeight = clamp(available, Math.min(MENU_MIN_HEIGHT_PX, Math.max(0, available)), MENU_MAX_HEIGHT_PX);
  const top = flip ? trigger.top - gap - maxHeight : trigger.bottom + gap;
  return {
    top,
    left: trigger.left,
    width: Math.max(0, trigger.width),
    maxHeight,
    flip
  };
}
