export type ContentSizeHandler = (width: number, height: number) => void;

/**
 * Calls `onSize` with the rounded size of `element` each time it changes.
 * Returns a function that stops watching.
 *
 * The Copilot host sizes the component frame from the size reported at
 * startup. Content that loads later, such as list items, doesn't resize
 * the frame by itself, so the component reports its new size.
 */
export function watchContentSize(element: HTMLElement, onSize: ContentSizeHandler): () => void {
  const view: (Window & typeof globalThis) | null = element.ownerDocument.defaultView;
  if (!view || typeof view.ResizeObserver !== 'function') {
    return () => undefined;
  }

  let lastWidth: number = -1;
  let lastHeight: number = -1;
  const observer: ResizeObserver = new view.ResizeObserver(() => {
    const rect: DOMRect = element.getBoundingClientRect();
    const width: number = Math.ceil(rect.width);
    const height: number = Math.ceil(rect.height);
    if (width !== lastWidth || height !== lastHeight) {
      lastWidth = width;
      lastHeight = height;
      onSize(width, height);
    }
  });

  observer.observe(element);
  return () => observer.disconnect();
}
