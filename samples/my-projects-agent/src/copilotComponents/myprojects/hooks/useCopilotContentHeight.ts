import * as React from 'react';

const PLANNER_COPILOT_CHROME_OFFSET = 200;

function getVisibleDocumentHeight(targetDocument: Document): number {
  const targetWindow = targetDocument.defaultView;

  if (!targetWindow) {
    return 0;
  }

  return Math.max(
    targetWindow.visualViewport?.height ?? 0,
    targetDocument.documentElement.clientHeight,
    targetWindow.innerHeight,
    targetWindow.outerHeight,
    targetWindow.screen.availHeight
  );
}

export function useCopilotContentHeight(
  targetDocument: Document | undefined,
  enabled: boolean
): string | undefined {
  const [height, setHeight] = React.useState<number | undefined>(() => {
    if (!enabled || !targetDocument) {
      return undefined;
    }

    return Math.max(
      getVisibleDocumentHeight(targetDocument) -
        PLANNER_COPILOT_CHROME_OFFSET,
      1
    );
  });

  React.useLayoutEffect(() => {
    if (!enabled || !targetDocument) {
      setHeight(undefined);
      return undefined;
    }

    const targetWindow = targetDocument.defaultView;
    if (!targetWindow) {
      return undefined;
    }

    const updateHeight = (): void => {
      setHeight(
        Math.max(
          getVisibleDocumentHeight(targetDocument),
          PLANNER_COPILOT_CHROME_OFFSET + 1
        ) - PLANNER_COPILOT_CHROME_OFFSET
      );
    };

    updateHeight();
    targetWindow.addEventListener('resize', updateHeight);
    targetWindow.visualViewport?.addEventListener('resize', updateHeight);

    return () => {
      targetWindow.removeEventListener('resize', updateHeight);
      targetWindow.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, [enabled, targetDocument]);

  return enabled && height !== undefined ? `${height}px` : undefined;
}
