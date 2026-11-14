import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  RendererProvider,
  createDOMRenderer,
  webDarkTheme,
  webLightTheme,
  type Theme
} from '@fluentui/react-components';
import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

/** The host theme is optional. Use the light theme when it is missing. */
export function resolveFluentTheme(theme: SPCopilotTheme | undefined): Theme {
  return theme === 'dark' ? webDarkTheme : webLightTheme;
}

export interface IThemeProviderProps {
  /** Color theme from the Copilot host (`hostContext.theme`). */
  theme: SPCopilotTheme | undefined;
  /**
   * The document that owns the component element
   * (`this.context.domElement.ownerDocument`).
   */
  targetDocument: Document | undefined;
  children?: React.ReactNode;
}

/**
 * The component runs in an iframe. Fluent UI must insert the theme
 * and Griffel must insert the `makeStyles` rules into the document of
 * the iframe. Styles in the parent document do not reach the component.
 *
 * Call `makeStyles` hooks only in components rendered inside this
 * provider. A hook called outside it uses the default renderer.
 */
export function ThemeProvider(props: IThemeProviderProps): React.ReactElement {
  const renderer = React.useMemo(
    () => createDOMRenderer(props.targetDocument),
    [props.targetDocument]
  );

  return (
    <IdPrefixProvider value="copilot-component-">
      <RendererProvider renderer={renderer} targetDocument={props.targetDocument}>
        <FluentProvider
          theme={resolveFluentTheme(props.theme)}
          targetDocument={props.targetDocument}
          style={{ minHeight: '100%' }}
        >
          {props.children}
        </FluentProvider>
      </RendererProvider>
    </IdPrefixProvider>
  );
}
