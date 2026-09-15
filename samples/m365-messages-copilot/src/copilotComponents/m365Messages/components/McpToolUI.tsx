import * as React from 'react';
import {
  makeStyles,
  mergeClasses,
  Spinner
} from '@fluentui/react-components';
import {
  AppBridge,
  AppFrame,
  type AppRendererProps
} from '@mcp-ui/client';
import {
  type McpUiRequestDisplayModeRequest,
  type McpUiRequestDisplayModeResult
} from '@modelcontextprotocol/ext-apps/app-bridge';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  CallToolResultSchema,
  type CallToolResult
} from '@modelcontextprotocol/sdk/types.js';
import {
  createCopilotTextContent,
  type ICopilotComponentHostContext,
  type ISPCopilotBridge,
  type ISPRequestDisplayModeResult,
  type SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';
import { EMessageType } from '@spteck/react-controls-v2/constants/EMessageTypes';
import { ShowMessage } from '@spteck/react-controls-v2/components/showMessage/ShowMessage';
import { StackV2 } from '@spteck/react-controls-v2/components/stackv2/StackV2';

import { MCP_TOOL_NAME } from '../services/mcpClient';

const TOOL_CALL_MAX_ATTEMPTS: number = 3;
const TOOL_CALL_RETRY_DELAY_MS: number = 1500;
const SANDBOX_PERMISSIONS: string = 'allow-scripts allow-forms';
const MCP_APP_MIME_TYPE: string = 'text/html;profile=mcp-app';

const useStyles = makeStyles({
  frame: {
    position: 'relative',
    '& iframe': {
      width: '100% !important',
      maxWidth: '100%',
      border: '0',
      backgroundColor: 'transparent'
    },
    '& > div': {
      width: '100%'
    }
  },
  fullscreenFrame: {
    '& > div': {
      height: '100%'
    },
    '& iframe': {
      width: '100% !important',
      height: '100% !important'
    }
  }
});

export interface IMcpToolUIProps {
  assetBaseUrl: string;
  bridge: ISPCopilotBridge;
  client: Client;
  hostContext: ICopilotComponentHostContext;
  locale: string | undefined;
  onConnectionError: () => void;
  onRequestDisplayMode: (
    mode: SPCopilotDisplayMode
  ) => Promise<ISPRequestDisplayModeResult>;
  targetDocument: Document | undefined;
  toolInput: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const getMcpAppResourceUri = (
  metadata: Record<string, unknown> | undefined
): string | undefined => {
  if (!metadata) {
    return undefined;
  }

  const uiMetadata: unknown = metadata.ui;
  const nestedResourceUri: unknown = isRecord(uiMetadata)
    ? uiMetadata.resourceUri
    : undefined;
  const resourceUri: unknown =
    nestedResourceUri ?? metadata['ui/resourceUri'];

  if (resourceUri === undefined) {
    return undefined;
  }

  if (typeof resourceUri !== 'string' || !resourceUri.startsWith('ui://')) {
    throw new Error(`Tool ${MCP_TOOL_NAME} has an invalid MCP App resource URI.`);
  }

  return resourceUri;
};

const escapeHtmlAttribute = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const getPageNonce = (targetDocument: Document): string => {
  const scripts: HTMLCollectionOf<HTMLScriptElement> =
    targetDocument.getElementsByTagName('script');

  for (let index: number = 0; index < scripts.length; index++) {
    const script: HTMLScriptElement | null = scripts.item(index);
    if (script?.nonce) {
      return script.nonce;
    }
  }

  return '';
};

const useSandboxUrl = (
  assetBaseUrl: string,
  targetDocument: Document | undefined
): URL | undefined => {
  const [sandboxUrl, setSandboxUrl] = React.useState<URL | undefined>();

  React.useEffect(() => {
    if (!targetDocument) {
      return undefined;
    }

    const normalizedBaseUrl: string = assetBaseUrl.endsWith('/')
      ? assetBaseUrl
      : `${assetBaseUrl}/`;
    const scriptUrl: string = new URL(
      'sandbox_proxy.js',
      normalizedBaseUrl
    ).toString();
    const nonce: string = getPageNonce(targetDocument);
    const escapedNonce: string = escapeHtmlAttribute(nonce);
    const nonceAttributes: string = nonce
      ? ` nonce="${escapedNonce}" data-nonce="${escapedNonce}"`
      : '';
    const html: string =
      '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
      '<title>MCP App Sandbox</title></head><body>' +
      `<script src="${escapeHtmlAttribute(scriptUrl)}"${nonceAttributes}></script>` +
      '</body></html>';
    const blobUrl: string = URL.createObjectURL(
      new Blob([html], { type: 'text/html' })
    );

    setSandboxUrl(new URL(blobUrl));

    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, [assetBaseUrl, targetDocument]);

  return sandboxUrl;
};

const loadMcpAppHtml = async (client: Client): Promise<string> => {
  let cursor: string | undefined;

  do {
    const toolsResult = await client.listTools({ cursor });
    const tool = toolsResult.tools.find(({ name }) => name === MCP_TOOL_NAME);

    if (tool) {
      const resourceUri: string | undefined = getMcpAppResourceUri(tool._meta);
      if (!resourceUri) {
        throw new Error(`Tool ${MCP_TOOL_NAME} has no MCP App resource.`);
      }

      const resourceResult = await client.readResource({ uri: resourceUri });
      if (resourceResult.contents.length !== 1) {
        throw new Error('The MCP App resource must contain exactly one item.');
      }

      const resource = resourceResult.contents[0];
      if (resource.mimeType !== MCP_APP_MIME_TYPE) {
        throw new Error(`Unsupported MCP App resource type: ${resource.mimeType}`);
      }

      if ('text' in resource && typeof resource.text === 'string') {
        return resource.text;
      }

      if ('blob' in resource && typeof resource.blob === 'string') {
        return atob(resource.blob);
      }

      throw new Error('The MCP App resource has no HTML content.');
    }

    cursor = toolsResult.nextCursor;
  } while (cursor);

  throw new Error(`Tool ${MCP_TOOL_NAME} was not found.`);
};

export const McpToolUI: React.FC<IMcpToolUIProps> = ({
  assetBaseUrl,
  bridge,
  client,
  hostContext,
  locale,
  onConnectionError,
  onRequestDisplayMode,
  targetDocument,
  toolInput
}) => {
  const styles = useStyles();
  const sandboxUrl: URL | undefined = useSandboxUrl(
    assetBaseUrl,
    targetDocument
  );
  const [appHtml, setAppHtml] = React.useState<string | undefined>();
  const [toolResult, setToolResult] = React.useState<CallToolResult | undefined>();
  const [error, setError] = React.useState<string | undefined>();

  React.useEffect(() => {
    let cancelled: boolean = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    setToolResult(undefined);
    setError(undefined);

    const callTool = (attempt: number): void => {
      client
        .callTool({ name: MCP_TOOL_NAME, arguments: toolInput })
        .then((result) => {
          const parsedResult = CallToolResultSchema.safeParse(result);
          if (!parsedResult.success) {
            throw new Error('The MCP server returned an asynchronous task.');
          }

          if (!cancelled) {
            setToolResult(parsedResult.data);
          }
        })
        .catch(() => {
          if (cancelled) {
            return;
          }

          if (attempt < TOOL_CALL_MAX_ATTEMPTS - 1) {
            retryTimer = setTimeout(
              () => callTool(attempt + 1),
              TOOL_CALL_RETRY_DELAY_MS * Math.pow(2, attempt)
            );
            return;
          }

          onConnectionError();
        });
    };

    callTool(0);

    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [client, onConnectionError, toolInput]);

  React.useEffect(() => {
    let cancelled: boolean = false;

    setAppHtml(undefined);
    loadMcpAppHtml(client)
      .then((html: string) => {
        if (!cancelled) {
          setAppHtml(html);
        }
      })
      .catch((resourceError: unknown) => {
        if (!cancelled) {
          setError(
            resourceError instanceof Error
              ? resourceError.message
              : String(resourceError)
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client]);

  const appHostContext = React.useMemo<
    NonNullable<AppRendererProps['hostContext']>
  >(
    () => ({
      theme: hostContext.theme,
      displayMode: hostContext.displayMode,
      availableDisplayModes: hostContext.availableDisplayModes,
      containerDimensions: hostContext.containerDimensions,
      locale,
      platform: hostContext.platform,
      deviceCapabilities: hostContext.deviceCapabilities,
      userAgent: 'Microsoft 365 Copilot SPFx Component'
    }),
    [hostContext, locale]
  );

  const handleOpenLink = React.useCallback<
    NonNullable<AppRendererProps['onOpenLink']>
  >(
    async ({ url }) => {
      const result = await bridge.openLinkAsync(url);
      return { isError: result.isError };
    },
    [bridge]
  );

  const handleMessage = React.useCallback<
    NonNullable<AppRendererProps['onMessage']>
  >(
    async ({ content }) => {
      type McpMessageBlock = typeof content[number];
      const messageContent: ReturnType<typeof createCopilotTextContent>[] = [];

      content.forEach((block: McpMessageBlock) => {
        if (block.type === 'text') {
          messageContent.push(createCopilotTextContent(block.text));
        }
      });

      if (messageContent.length === 0) {
        return { isError: true };
      }

      const result = await bridge.sendFollowUpMessageAsync(messageContent);
      return { isError: result.isError };
    },
    [bridge]
  );

  const handleRequestDisplayMode = React.useCallback(
    async (
      { mode }: McpUiRequestDisplayModeRequest['params']
    ): Promise<McpUiRequestDisplayModeResult> => {
      if (mode !== 'inline' && mode !== 'fullscreen') {
        return { mode: hostContext.displayMode ?? 'inline' };
      }

      const result: ISPRequestDisplayModeResult =
        await onRequestDisplayMode(mode);
      return { mode: result.mode };
    },
    [hostContext.displayMode, onRequestDisplayMode]
  );

  const handleRendererError = React.useCallback((rendererError: Error): void => {
    setError(rendererError.message);
  }, []);

  const appBridge = React.useMemo(() => {
    const serverCapabilities = client.getServerCapabilities();

    return new AppBridge(
      client,
      { name: 'Microsoft 365 Copilot SPFx Component', version: '1.0.0' },
      {
        openLinks: {},
        serverTools: serverCapabilities?.tools,
        serverResources: serverCapabilities?.resources
      }
    );
  }, [client]);

  React.useEffect(() => {
    appBridge.onmessage = handleMessage;
    appBridge.onopenlink = handleOpenLink;
    appBridge.onrequestdisplaymode = handleRequestDisplayMode;
  }, [appBridge, handleMessage, handleOpenLink, handleRequestDisplayMode]);

  React.useEffect(() => {
    appBridge.setHostContext(appHostContext);
  }, [appBridge, appHostContext]);

  React.useEffect(
    () => () => {
      appBridge.teardownResource({}).catch(() => undefined);
      appBridge.close().catch(() => undefined);
    },
    [appBridge]
  );

  if (error) {
    return <ShowMessage messageType={EMessageType.ERROR} message={error} />;
  }

  if (!appHtml || !toolResult || !sandboxUrl) {
    return (
      <StackV2
        direction="vertical"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <Spinner size="large" label="Loading service messages..." />
      </StackV2>
    );
  }

  return (
    <StackV2
      className={mergeClasses(
        styles.frame,
        hostContext.displayMode === 'fullscreen'
          ? styles.fullscreenFrame
          : undefined
      )}
      width="100%"
      height={hostContext.displayMode === 'fullscreen' ? '100%' : undefined}
      overflow="hidden"
    >
      <AppFrame
        appBridge={appBridge}
        html={appHtml}
        sandbox={{
          url: sandboxUrl,
          permissions: SANDBOX_PERMISSIONS
        }}
        toolInput={toolInput}
        toolResult={toolResult}
        onError={handleRendererError}
      />
    </StackV2>
  );
};
