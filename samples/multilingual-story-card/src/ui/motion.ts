// Spatial continuity for layout/design switches (Apple: "if something moves, show where it went").
// The View Transitions API morphs the photo, headline and text from their old to their new place;
// the elements carry view-transition-name in the card template. Without the API, when the user
// asked for reduced motion, or when the frame is too tall to snapshot safely, the change is applied
// instantly, as before.

interface IViewTransitionDocument {
  startViewTransition?: (update: () => void) => unknown;
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A view transition captures the whole viewport (and every named element) as GPU textures, twice.
 * In a host that sizes the iframe to its content, the viewport can be several screens tall; those
 * snapshots can exhaust GPU memory and crash the renderer (seen in Copilot: a tall Magazine card,
 * switched to Teaser). Anything beyond one screen is never seen animating anyway.
 */
function viewportTooTall(): boolean {
  const screenHeight: number = typeof window.screen !== 'undefined' && window.screen.height > 0 ? window.screen.height : 0;
  return screenHeight > 0 && window.innerHeight > screenHeight;
}

export function withViewTransition(update: () => void): void {
  const doc: IViewTransitionDocument = document as unknown as IViewTransitionDocument;
  if (typeof doc.startViewTransition !== 'function' || prefersReducedMotion() || viewportTooTall()) {
    update();
    return;
  }
  try {
    doc.startViewTransition.call(document, update);
  } catch {
    update();
  }
}
