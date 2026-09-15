import * as React from 'react';

import type {
  IContentSize,
  IUseInlineCopilotContentSizeOptions,
} from '../models';

function measureContent(element: HTMLElement): IContentSize | undefined {
  const bounds = element.getBoundingClientRect();
  const width = Math.ceil(bounds.width);
  const height = Math.ceil(Math.max(bounds.height, element.scrollHeight));

  if (width <= 0 || height <= 0) {
    return undefined;
  }

  return { height, width };
}

export function useInlineCopilotContentSize(
  options: IUseInlineCopilotContentSizeOptions
): React.RefObject<HTMLDivElement> {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const lastRequestedSizeRef = React.useRef<string>();

  React.useLayoutEffect(() => {
    if (!options.enabled || !options.targetDocument) {
      lastRequestedSizeRef.current = undefined;
      return undefined;
    }

    const element = contentRef.current;
    const targetWindow = options.targetDocument.defaultView;

    if (!element || !targetWindow) {
      return undefined;
    }

    let animationFrame: number | undefined;
    let disposed = false;

    const updateHostSize = (): void => {
      if (animationFrame !== undefined) {
        targetWindow.cancelAnimationFrame(animationFrame);
      }

      animationFrame = targetWindow.requestAnimationFrame(() => {
        animationFrame = undefined;
        const size = measureContent(element);

        if (!size || disposed) {
          return;
        }

        const sizeKey = `${size.width}x${size.height}`;
        if (lastRequestedSizeRef.current === sizeKey) {
          return;
        }

        lastRequestedSizeRef.current = sizeKey;
        options.onRequestSizeChange(size.width, size.height).catch((error: unknown) => {
          if (!disposed && lastRequestedSizeRef.current === sizeKey) {
            lastRequestedSizeRef.current = undefined;
          }

          console.error('[My projects] Failed to resize inline content:', error);
        });
      });
    };

    updateHostSize();

    const resizeObserver = targetWindow.ResizeObserver
      ? new targetWindow.ResizeObserver(updateHostSize)
      : undefined;
    resizeObserver?.observe(element);
    targetWindow.addEventListener('resize', updateHostSize);

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      targetWindow.removeEventListener('resize', updateHostSize);

      if (animationFrame !== undefined) {
        targetWindow.cancelAnimationFrame(animationFrame);
      }
    };
  }, [
    options.enabled,
    options.measurementKey,
    options.onRequestSizeChange,
    options.targetDocument,
  ]);

  return contentRef;
}
