import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  makeStyles,
  tokens,
  webDarkTheme,
  webLightTheme
} from '@fluentui/react-components';
import { createDOMRenderer, RendererProvider } from '@griffel/react';
import type { ZavaThemeName } from '../models/zavaOne';

const useStyles = makeStyles({
  provider: {
    minHeight: '100%',
    width: '100%',
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground2,
    fontFamily: tokens.fontFamilyBase
  }
});

export interface IZavaThemeProviderProps {
  children: React.ReactNode;
  targetDocument: Document;
  theme?: ZavaThemeName;
}

export function ZavaThemeProvider(props: IZavaThemeProviderProps): React.ReactElement {
  const styles = useStyles();
  const renderer = React.useMemo(
    () => createDOMRenderer(props.targetDocument),
    [props.targetDocument]
  );
  const [generation, setGeneration] = React.useState<number>(0);

  React.useEffect(() => setGeneration(1), []);

  return (
    <RendererProvider renderer={renderer} targetDocument={props.targetDocument}>
      <IdPrefixProvider value="zava-one-">
        <FluentProvider
          key={generation}
          className={styles.provider}
          targetDocument={props.targetDocument}
          theme={props.theme === 'dark' ? webDarkTheme : webLightTheme}
        >
          {props.children}
        </FluentProvider>
      </IdPrefixProvider>
    </RendererProvider>
  );
}