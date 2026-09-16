import * as React from 'react';
import {
  Button,
  FluentProvider,
  IdPrefixProvider,
  Spinner,
  Tooltip,
  tokens,
  webDarkTheme,
  webLightTheme
} from '@fluentui/react-components';
import { ArrowClockwise24Regular } from '@fluentui/react-icons';
import { EMessageType } from '@spteck/react-controls-v2/constants/EMessageTypes';
import { ShowMessage } from '@spteck/react-controls-v2/components/showMessage/ShowMessage';
import { StackV2 } from '@spteck/react-controls-v2/components/stackv2/StackV2';

import { useMcpClient } from '../hooks/useMcpClient';
import type { IM365MessagesMcpAppProps } from './IM365MessagesMcpAppProps';
import { McpToolUI } from './McpToolUI';

const DEFAULT_COMPONENT_HEIGHT: number = window.outerHeight - 200;

const M365MessagesMcpApp: React.FC<IM365MessagesMcpAppProps> = (props) => {
  const { client, error, isConnecting, reconnect } = useMcpClient(
    props.getToken
  );

  React.useEffect(() => {
    props.onClientChanged(client);

    return () => {
      props.onClientChanged(undefined);
    };
  }, [client, props.onClientChanged]);

  const containerHeight: number =
    props.hostContext.containerDimensions?.height ?? DEFAULT_COMPONENT_HEIGHT;
  const isFullscreen: boolean =
    props.hostContext.displayMode === 'fullscreen';
  const theme =
    props.hostContext.theme === 'dark' ? webDarkTheme : webLightTheme;

  return (
    <IdPrefixProvider value="m365-messages-mcp-app-">
      <FluentProvider
        theme={theme}
        targetDocument={props.targetDocument}
        style={{
          height: isFullscreen ? containerHeight : 'auto',
          backgroundColor: tokens.colorTransparentBackground
        }}
      >
        <StackV2
          direction="vertical"
          width="100%"
          height={isFullscreen ? '100%' : undefined}
          overflow="hidden"
        >
          {isConnecting && (
            <StackV2
              direction="vertical"
              justifyContent="center"
              alignItems="center"
              width="100%"
              height="100%"
            >
              <Spinner size="large" label="Connecting to M365 Messages..." />
            </StackV2>
          )}

          {error && (
            <StackV2
              direction="vertical"
              justifyContent="center"
              alignItems="center"
              gap="s"
              width="100%"
              height="100%"
            >
              <ShowMessage messageType={EMessageType.ERROR} message={error} />
              <Tooltip content="Reconnect to the MCP server" relationship="label">
                <Button
                  appearance="primary"
                  icon={<ArrowClockwise24Regular />}
                  onClick={reconnect}
                >
                  Retry
                </Button>
              </Tooltip>
            </StackV2>
          )}

          {client && !isConnecting && !error && (
            <McpToolUI
              assetBaseUrl={props.assetBaseUrl}
              bridge={props.bridge}
              client={client}
              hostContext={props.hostContext}
              locale={props.locale}
              onConnectionError={reconnect}
              onRequestDisplayMode={props.onRequestDisplayMode}
              targetDocument={props.targetDocument}
              toolInput={props.toolInput}
            />
          )}
        </StackV2>
      </FluentProvider>
    </IdPrefixProvider>
  );
};

export default M365MessagesMcpApp;
