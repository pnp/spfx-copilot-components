import * as React from 'react';

import { FluentProvider } from '@fluentui/react-provider';
import {
  createDOMRenderer,
  makeStyles,
  RendererProvider
} from '@griffel/react';
import {
  tokens,
  webDarkTheme,
  webLightTheme
} from '@fluentui/react-theme';
import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

const useStyles = makeStyles({
  provider: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    backgroundColor: tokens.colorNeutralBackground2
  }
});

export interface IHomeThemeProviderProps {
  children?: React.ReactNode;
  theme?: SPCopilotTheme;
  targetDocument?: Document;
}

const HomeThemeProvider: React.FunctionComponent<IHomeThemeProviderProps> = (props) => {
  const styles = useStyles();
  const { children, targetDocument, theme } = props;
  const renderer = React.useMemo(
    () => createDOMRenderer(targetDocument),
    [targetDocument]
  );
  // The Copilot iframe document may not accept Griffel styles on the initial
  // commit. Remount the provider exactly once after that document is ready;
  // subsequent theme changes update tokens without changing this key.
  const [mountGeneration, setMountGeneration] = React.useState(0);

  React.useEffect(() => {
    setMountGeneration(1);
  }, []);

  return (
    <RendererProvider renderer={renderer} targetDocument={targetDocument}>
      <FluentProvider
        key={mountGeneration}
        theme={theme === 'dark' ? webDarkTheme : webLightTheme}
        targetDocument={targetDocument}
        className={styles.provider}
      >
        {children}
      </FluentProvider>
    </RendererProvider>
  );
};

export default HomeThemeProvider;