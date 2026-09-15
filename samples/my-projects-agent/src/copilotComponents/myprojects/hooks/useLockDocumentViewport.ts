import * as React from 'react';

const LOCK_DOCUMENT_VIEWPORT_STYLES = `
  html,
  body {
    width: 100%;
    overflow: hidden !important;
  }

  body {
    margin: 0;
  }
`;

export function useLockDocumentViewport(
  targetDocument: Document | undefined,
  enabled: boolean
): void {
  React.useLayoutEffect(() => {
    if (!enabled || !targetDocument?.head) {
      return undefined;
    }

    const styleElement = targetDocument.createElement('style');
    styleElement.setAttribute(
      'data-my-projects-scroll-owner',
      'planner-board'
    );
    styleElement.textContent = LOCK_DOCUMENT_VIEWPORT_STYLES;
    targetDocument.head.appendChild(styleElement);

    return () => styleElement.remove();
  }, [enabled, targetDocument]);
}
