import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';
import { UI_EXTENSION_CAPABILITIES } from '@mcp-ui/client';

export const MCP_SERVER_URL: string = 'https://m365messages.spteckapps.com/mcp';
export const MCP_TOOL_NAME: string = 'list-service-announcement-messages';
export const MCP_OAUTH_RESOURCE: string = 'api://mcp-m365-services.messages';

const MAX_CONNECTION_ATTEMPTS: number = 3;
const INITIAL_RETRY_DELAY_MS: number = 1000;

const delay = (duration: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, duration));

const createCapabilities = (): ClientCapabilities => ({
  roots: { listChanged: true },
  extensions: UI_EXTENSION_CAPABILITIES
});

const createClient = (): Client =>
  new Client(
    { name: 'm365-messages-copilot-component', version: '1.0.0' },
    { capabilities: createCapabilities() }
  );

const createTransport = (
  getToken: () => Promise<string>
): StreamableHTTPClientTransport => {
  const authenticatedFetch = async (
    input: string | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const token: string = await getToken();
    const headers: Headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);

    return fetch(input, { ...init, headers });
  };

  return new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL), {
    fetch: authenticatedFetch
  });
};

export const createMcpClient = async (
  getToken: () => Promise<string>
): Promise<Client> => {
  let lastError: unknown;

  for (let attempt: number = 0; attempt < MAX_CONNECTION_ATTEMPTS; attempt++) {
    const client: Client = createClient();

    try {
      await client.connect(createTransport(getToken));
      return client;
    } catch (error: unknown) {
      lastError = error;
      await client.close().catch(() => undefined);

      if (attempt < MAX_CONNECTION_ATTEMPTS - 1) {
        await delay(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
};
