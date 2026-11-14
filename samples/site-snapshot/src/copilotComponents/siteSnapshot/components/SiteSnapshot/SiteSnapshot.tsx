import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  createLightTheme,
  createDarkTheme,
  Spinner,
  type BrandVariants,
  type Theme
} from '@fluentui/react-components';
import * as strings from 'SiteSnapshotComponentStrings';

import type { ISiteSnapshotProps } from './ISiteSnapshotProps';
import { useSiteSnapshotStyles } from './useSiteSnapshotStyles';
import ScoreCard from '../ScoreCard/ScoreCard';
import Dashboard from '../Dashboard/Dashboard';

// A SharePoint-blue brand ramp, so the component matches Microsoft 365 rather
// than the generic web theme. Built once at module scope.
const brand: BrandVariants = {
  10: '#020305', 20: '#111723', 30: '#16263D', 40: '#193253', 50: '#1B3F6A',
  60: '#1B4C82', 70: '#18599B', 80: '#0F6CBD', 90: '#2D7BC7', 100: '#4589CF',
  110: '#5B97D7', 120: '#71A5DE', 130: '#88B3E5', 140: '#9FC2EC', 150: '#B7D0F2',
  160: '#CFDFF8'
};
const lightBrand: Theme = createLightTheme(brand);
const darkBrand: Theme = createDarkTheme(brand);

// Root UI. Wraps the tree in a FluentProvider themed from the host, and shows
// the compact card inline or the full dashboard in fullscreen.
export default function SiteSnapshot(props: ISiteSnapshotProps): React.ReactElement {
  // Props
  const { snapshot, isFullscreen, theme, focus, targetDocument, onOpenFull, onExport, onEmail } = props;
  const styles = useSiteSnapshotStyles();

  const fluentTheme = theme === 'dark' ? darkBrand : lightBrand;

  return (
    <IdPrefixProvider value="site-snapshot-">
      <FluentProvider theme={fluentTheme} targetDocument={targetDocument} style={{ minHeight: '100%' }}>
        {!snapshot ? (
          <div className={styles.center}>
            <Spinner label={strings.Analysing} />
          </div>
        ) : isFullscreen ? (
          <div className={styles.fullRoot}>
            <Dashboard snapshot={snapshot} focus={focus} onExport={onExport} onEmail={onEmail} />
          </div>
        ) : (
          <div className={styles.inlineRoot}>
            <ScoreCard snapshot={snapshot} onOpen={onOpenFull} />
          </div>
        )}
      </FluentProvider>
    </IdPrefixProvider>
  );
}
