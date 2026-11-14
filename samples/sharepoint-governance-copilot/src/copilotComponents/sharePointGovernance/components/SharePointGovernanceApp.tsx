import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  webLightTheme,
  webDarkTheme,
  Button,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { ArrowExpand24Regular } from '@fluentui/react-icons';

import { SharePointGovernanceDashboard } from './SharePointGovernanceDashboard';
import type { ISharePointGovernanceProps } from './ISharePointGovernanceProps';
import type { IGovernanceResult } from '../models/IGovernanceRisk';

import * as strings from 'SharePointGovernanceCopilotComponentStrings';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end'
  }
});

/**
 * Root React shell mounted by {@link SharePointGovernanceCopilotComponent}.
 *
 * - Applies the Fluent theme that matches `hostContext.theme`.
 * - Loads governance risk data from the injected {@link IGovernanceService}
 *   whenever the service or tool arguments (`options`) change.
 * - Offers a fullscreen expand action backed by the Copilot bridge, matching
 *   the `availableDisplayModes` declared in the component manifest.
 */
export default function SharePointGovernanceApp(props: ISharePointGovernanceProps): React.ReactElement {
  const { service, options, hostContext, bridge, onRequestDisplayMode, targetDocument } = props;
  const styles = useStyles();

  const [data, setData] = React.useState<IGovernanceResult>();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    let active = true;

    const loadRisks = async (): Promise<void> => {
      setLoading(true);
      setError(undefined);
      try {
        const result = await service.getGovernanceRisks(options);
        if (active) {
          setData(result);
        }
      } catch (reason) {
        if (active) {
          setError((reason as Error).message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadRisks();
    return () => {
      active = false;
    };
  }, [service, options]);

  const theme = hostContext.theme === 'dark' ? webDarkTheme : webLightTheme;

  // Only offer the expand action when we're not already in fullscreen mode.
  const handleExpand = React.useCallback(async (): Promise<void> => {
    await onRequestDisplayMode('fullscreen');
  }, [onRequestDisplayMode]);

  return (
    <IdPrefixProvider value="sharepoint-governance-">
      <FluentProvider theme={theme} targetDocument={targetDocument} style={{ minHeight: '100%' }}>
        <div className={styles.root}>
          {hostContext.displayMode !== 'fullscreen' && (
            <div className={styles.toolbar}>
              <Button appearance="secondary" icon={<ArrowExpand24Regular />} onClick={handleExpand}>
                {strings.ExpandButtonLabel}
              </Button>
            </div>
          )}
          <SharePointGovernanceDashboard data={data} loading={loading} error={error} bridge={bridge} />
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  );
}
