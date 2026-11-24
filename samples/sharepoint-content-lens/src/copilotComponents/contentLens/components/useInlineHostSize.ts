import * as React from 'react';

/**
 * The Copilot host keeps an inline card at the tallest height it has seen. The hook measures the component root,
 * because the document already has that tallest height, and asks the host to fit the card to it. The host may decline.
 */
export function useInlineHostSize(
  root: React.RefObject<HTMLElement>,
  targetDocument: Document,
  request: ((width: number, height: number) => Promise<boolean>) | undefined
): void {
  // The host callback may be recreated on every render; only enabling or disabling restarts observation.
  const latest = React.useRef(request);
  latest.current = request;
  const requested = React.useRef('');
  const enabled = !!request;
  React.useLayoutEffect(() => {
    const view = targetDocument.defaultView;
    const element = root.current;
    requested.current = '';
    if (!enabled || !view || !element) return undefined;
    let disposed = false;
    const update = (): void => {
      const send = latest.current;
      const bounds = element.getBoundingClientRect();
      const width = Math.ceil(bounds.width);
      const height = Math.ceil(Math.max(bounds.height, element.scrollHeight));
      const size = width + 'x' + height;
      if (disposed || !send || width <= 0 || height <= 0 || size === requested.current) return;
      requested.current = size;
      // A declined or failed request is retried on the next content change.
      const retry = (): void => {
        if (requested.current === size) requested.current = '';
      };
      send(width, height).then(accepted => {
        if (!accepted) retry();
      }, retry);
    };
    update();
    const observer = view.ResizeObserver ? new view.ResizeObserver(update) : undefined;
    observer?.observe(element);
    return () => {
      disposed = true;
      observer?.disconnect();
    };
  }, [root, targetDocument, enabled]);
}
