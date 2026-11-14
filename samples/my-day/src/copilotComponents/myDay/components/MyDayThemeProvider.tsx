import * as React from 'react';

import { FluentProvider } from '@fluentui/react-provider';
import { webDarkTheme, webLightTheme, tokens } from '@fluentui/react-theme';
import { createDOMRenderer, makeStyles, RendererProvider } from '@griffel/react';
import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

const useStyles = makeStyles({
  provider: {
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    // Paint a theme-aware surface on the primary container. The Copilot host
    // renders the component over its own (often white) surface, so a transparent
    // provider lets that surface bleed through — in dark mode the child controls
    // resolve dark tokens correctly but the root stays white. Using a themed
    // neutral background makes the root div follow the host theme.
    backgroundColor: tokens.colorNeutralBackground1
  }
});

export interface IMyDayThemeProviderProps {
  children?: React.ReactNode;
  /** Color theme advertised by the Copilot host. */
  theme?: SPCopilotTheme;
  /** Document that owns the Copilot component's host element. */
  targetDocument?: Document;
}

interface IMyDayFluentProviderProps extends IMyDayThemeProviderProps {
  mountGeneration: number;
}

const MyDayFluentProvider: React.FunctionComponent<IMyDayFluentProviderProps> = (props) => {
  const styles = useStyles();
  const fluentTheme = props.theme === 'dark' ? webDarkTheme : webLightTheme;

  return (
    <FluentProvider
      key={props.mountGeneration}
      theme={fluentTheme}
      targetDocument={props.targetDocument}
      className={styles.provider}
    >
      {props.children}
    </FluentProvider>
  );
};

/**
 * Sets up Fluent UI v9 theming for the component.
 *
 * The Copilot host renders the component inside an iframe whose document is not
 * always ready when the tree first mounts, so Fluent's theme `<style>` insertion
 * on the initial mount can be lost (the symptom: unstyled until the user toggles
 * display modes, which used to remount the provider and re-insert the styles).
 * To make styling apply on first load without any interaction, the FluentProvider
 * is remounted exactly once right after the initial commit via a changing `key`,
 * which re-runs Fluent's style insertion once the host document is ready.
 */
const MyDayThemeProvider: React.FunctionComponent<IMyDayThemeProviderProps> = (props) => {
  const renderer = React.useMemo(
    () => createDOMRenderer(props.targetDocument),
    [props.targetDocument]
  );

  const [mountGeneration, setMountGeneration] = React.useState(0);
  React.useEffect(() => {
    // Force a single remount of the provider after the host document is ready so
    // Fluent (re)inserts its theme styles. Runs only once.
    setMountGeneration(1);
  }, []);

  return (
    <RendererProvider renderer={renderer} targetDocument={props.targetDocument}>
      <MyDayFluentProvider
        mountGeneration={mountGeneration}
        theme={props.theme}
        targetDocument={props.targetDocument}
      >
        {props.children}
      </MyDayFluentProvider>
    </RendererProvider>
  );
};

export default MyDayThemeProvider;
