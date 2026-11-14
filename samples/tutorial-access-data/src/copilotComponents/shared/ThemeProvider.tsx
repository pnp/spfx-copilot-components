import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  webDarkTheme,
  webLightTheme,
  type Theme
} from '@fluentui/react-components';
import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

import { watchContentSize, type ContentSizeHandler } from './ContentSize';

export function resolveFluentTheme(theme: SPCopilotTheme | undefined): Theme {
  return theme === 'dark' ? webDarkTheme : webLightTheme;
}

export interface IThemeProviderProps {
  /** Color theme from the Copilot host (`hostContext.theme`). */
  theme: SPCopilotTheme | undefined;
  /**
   * Document the FluentProvider should inject its theme styles into. Pass
   * `domElement.ownerDocument` so Griffel writes CSS into the correct iframe
   * document rather than the top-level page.
   */
  targetDocument: Document | undefined;
  /**
   * Called with the content size each time it changes. Pass it on to
   * `requestSizeChangeAsync` so the host frame follows the content.
   */
  onContentResize?: ContentSizeHandler;
  children?: React.ReactNode;
}

export function ThemeProvider(props: IThemeProviderProps): React.ReactElement {
  const { onContentResize } = props;
  const contentRef: React.RefObject<HTMLDivElement> = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!onContentResize || !contentRef.current) {
      return undefined;
    }
    return watchContentSize(contentRef.current, onContentResize);
  }, [onContentResize]);

  return (
    <IdPrefixProvider value="copilot-component-">
      <FluentProvider
        theme={resolveFluentTheme(props.theme)}
        targetDocument={props.targetDocument}
        style={{ minHeight: '100%' }}
      >
        <div ref={contentRef}>{props.children}</div>
      </FluentProvider>
    </IdPrefixProvider>
  );
}
