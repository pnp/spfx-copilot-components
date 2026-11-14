// Design presets: five editorial type scales. The values live in
// src/ui/tokens/Presets.module.scss as [data-design="…"] blocks; the names come from lib/contract.ts, which the
// tool schema shares, so the model can only ask for presets that exist.

import { DESIGNS, LAYOUTS } from './contract';

export { DESIGNS, LAYOUTS };

export type Design = (typeof DESIGNS)[number];

export const DEFAULT_DESIGN: Design = 'dramatic';

export function isDesign(value: unknown): value is Design {
  return typeof value === 'string' && (DESIGNS as readonly string[]).indexOf(value) !== -1;
}

// News layouts: where the photo sits relative to headline and text. Pure CSS (grid areas on
// [data-layout="…"]); switching never rebuilds the DOM.
export type Layout = (typeof LAYOUTS)[number];

export const DEFAULT_LAYOUT: Layout = 'beside';

export function isLayout(value: unknown): value is Layout {
  return typeof value === 'string' && (LAYOUTS as readonly string[]).indexOf(value) !== -1;
}
