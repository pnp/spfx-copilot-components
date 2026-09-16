import * as React from 'react';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

import { createMcpClient } from '../services/mcpClient';

export interface IUseMcpClientResult {
  client: Client | undefined;
  error: string | undefined;
  isConnecting: boolean;
  reconnect: () => void;
}

export const useMcpClient = (
  getToken: () => Promise<string>
): IUseMcpClientResult => {
  const [client, setClient] = React.useState<Client | undefined>();
  const [error, setError] = React.useState<string | undefined>();
  const [isConnecting, setIsConnecting] = React.useState<boolean>(true);
  const [connectionVersion, setConnectionVersion] = React.useState<number>(0);

  React.useEffect(() => {
    let cancelled: boolean = false;
    let activeClient: Client | undefined;

    setClient(undefined);
    setError(undefined);
    setIsConnecting(true);

    createMcpClient(getToken)
      .then((connectedClient: Client) => {
        activeClient = connectedClient;

        if (cancelled) {
          connectedClient.close().catch(() => undefined);
          return;
        }

        setClient(connectedClient);
        setIsConnecting(false);
      })
      .catch((connectionError: unknown) => {
        if (cancelled) {
          return;
        }

        setError(
          connectionError instanceof Error
            ? connectionError.message
            : String(connectionError)
        );
        setIsConnecting(false);
      });

    return () => {
      cancelled = true;
      activeClient?.close().catch(() => undefined);
    };
  }, [connectionVersion, getToken]);

  const reconnect = React.useCallback((): void => {
    setConnectionVersion((current: number) => current + 1);
  }, []);

  return { client, error, isConnecting, reconnect };
};