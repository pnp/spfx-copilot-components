/**
 * Browser replacement for the Node seam of the original MCP server code. The
 * Copilot component configures the runtime in `onInit`. Each request uses the
 * signed-in user's delegated token for the resource that it names.
 */
export type HostFetch = (resource: string, url: string, init: RequestInit) => Promise<Response>;

export interface IHostRuntime {
  /** Sends an Entra ID authenticated request to the API that `resource` identifies. */
  fetch: HostFetch;
}

let current: IHostRuntime | undefined;

export function configureHostRuntime(runtime: IHostRuntime): void {
  current = runtime;
}

export function hostRuntime(): IHostRuntime {
  if (!current) throw new Error("The SharePoint host runtime is not configured.");
  return current;
}

export function hostFetch(resource: string, url: URL | string, init: RequestInit = {}): Promise<Response> {
  return hostRuntime().fetch(resource, typeof url === "string" ? url : url.href, init);
}
