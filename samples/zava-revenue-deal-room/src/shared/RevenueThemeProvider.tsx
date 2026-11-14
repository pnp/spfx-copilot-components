import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  createLightTheme,
  createDarkTheme,
  type BrandVariants,
  type Theme
} from '@fluentui/react-components';
import { createDOMRenderer, makeStyles, RendererProvider } from '@griffel/react';

const revenueBrand: BrandVariants = {
  10: '#071509', 20: '#102A13', 30: '#163B19', 40: '#1C4C1C', 50: '#205D1C',
  60: '#23701A', 70: '#2C821D', 80: '#379C21', 90: '#53AA30', 100: '#72B741',
  110: '#91C454', 120: '#ADD26F', 130: '#C6DF91', 140: '#DEEBB7', 150: '#EDF4D8', 160: '#F7FAED'
};

const lightTheme: Theme = {
  ...createLightTheme(revenueBrand),
  colorBrandBackground: '#23701A',
  colorBrandForeground1: '#205D1C',
  colorNeutralBackground1: '#FFFFFF',
  colorNeutralBackground2: '#F4F7F0',
  colorNeutralBackground3: '#E1E9DB',
  colorNeutralForeground1: '#172D20',
  colorNeutralForeground2: '#4C6053'
};
const darkTheme: Theme = {
  ...createDarkTheme(revenueBrand),
  colorBrandForeground1: '#ADD26F',
  colorNeutralBackground1: '#111F17',
  colorNeutralBackground2: '#1A2C20',
  colorNeutralForeground1: '#F0F5EA',
  colorNeutralForeground2: '#C1CFBE'
};

const useStyles = makeStyles({
  provider: { width: '100%', minWidth: 0, minHeight: '100%', backgroundColor: 'transparent' }
});

export interface IRevenueThemeProviderProps {
  readonly theme?: string;
  readonly targetDocument: Document;
  readonly children?: React.ReactNode;
}

function RevenueThemeSurface(props: IRevenueThemeProviderProps): React.ReactElement {
  const styles = useStyles();
  return (
      <IdPrefixProvider value="zdr-">
        <FluentProvider
          theme={props.theme === 'dark' ? darkTheme : lightTheme}
          targetDocument={props.targetDocument}
          className={styles.provider}
        >
          {props.children}
        </FluentProvider>
      </IdPrefixProvider>
  );
}

export default function RevenueThemeProvider(props: IRevenueThemeProviderProps): React.ReactElement {
  const renderer = React.useMemo(() => createDOMRenderer(props.targetDocument), [props.targetDocument]);
  return <RendererProvider renderer={renderer} targetDocument={props.targetDocument}><RevenueThemeSurface {...props} /></RendererProvider>;
}