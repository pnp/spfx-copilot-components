import { hostFetch } from "../host/runtime";
import { requireEnvironmentId } from "./environmentId";
import { AgentMapError, type EnvironmentId, type Guid } from "./errors";

/** The Dataverse Global Discovery Service (commercial cloud). It uses the Dataverse permission. */
export const GLOBAL_DISCOVERY_RESOURCE = "https://globaldisco.crm.dynamics.com";
const GLOBAL_DISCOVERY_INSTANCES_URL =
  `${GLOBAL_DISCOVERY_RESOURCE}/api/discovery/v2.0/Instances?$select=ApiUrl,FriendlyName,EnvironmentId,State,Region`;
const DISCOVERY_CACHE_MS = 60_000;
const DISCOVERY_RETRY_DELAY_MS = 250;

export interface DiscoveryEnvironment {
  id: EnvironmentId;
  name: string;
  region: string;
  apiUrl: URL;
}

interface ODataPage<T> {
  value?: T[];
  "@odata.nextLink"?: string;
}

type DiscoveryFetch = (url: URL, init: RequestInit) => Promise<Response>;
type Delay = (milliseconds: number) => Promise<void>;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Sends the discovery request, and tries again one time after a throttle, a server error, or a network error. */
export async function fetchDiscoveryResponse(
  url: URL,
  init: RequestInit,
  fetcher: DiscoveryFetch,
  wait: Delay = delay,
): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetcher(url, init);
      const retryableStatus = response.status === 429 || response.status >= 500;
      if (!retryableStatus || attempt === 1) return response;
    } catch {
      if (attempt === 1) {
        throw new AgentMapError(
          "DISCOVERY_UNAVAILABLE",
          "Environment discovery is temporarily unavailable. Try again.",
          true,
        );
      }
    }
    await wait(DISCOVERY_RETRY_DELAY_MS);
  }
  throw new AgentMapError(
    "DISCOVERY_UNAVAILABLE",
    "Environment discovery is temporarily unavailable. Try again.",
    true,
  );
}

export function guid(value: string): Guid {
  const normalized = value.replace(/[{}]/g, "").toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)) {
    throw new AgentMapError("INVALID_ID", "A valid identifier is required.");
  }
  return normalized;
}

export function escapeOData(value: string): string {
  return value.replace(/'/g, "''");
}

/** A read-only Dataverse Web API client. Each request uses the delegated token of the signed-in user. */
export class DataverseClient {
  constructor(readonly origin: URL) {
    if (origin.protocol !== "https:") throw new AgentMapError("UNTRUSTED_ENVIRONMENT", "The environment is not trusted.");
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const target = new URL(path, `${this.origin.origin}/api/data/v9.2/`);
    if (target.origin !== this.origin.origin || !target.pathname.startsWith("/api/data/v9.2/")) {
      throw new AgentMapError("UNTRUSTED_ENVIRONMENT", "The environment request was rejected.");
    }
    const response = await hostFetch(this.origin.origin, target, {
      ...init,
      headers: {
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        ...init.headers,
      },
    });
    if (!response.ok) {
      const requestId = response.headers.get("x-ms-service-request-id");
      const retryable = response.status === 429 || response.status >= 500;
      const message = response.status === 401 || response.status === 403
        ? "You do not have access to this environment."
        : `Dataverse request failed (${response.status})${requestId ? ` [${requestId}]` : ""}.`;
      throw new AgentMapError(response.status === 404 ? "NOT_FOUND" : "DATAVERSE_ERROR", message, retryable, {
        dataverse: {
          method: init.method ?? "GET",
          url: `${target.origin}${target.pathname}`,
          status: response.status,
          ...(requestId ? { requestId } : {}),
        },
      });
    }
    return response;
  }

  async list<T>(path: string): Promise<T[]> {
    const items: T[] = [];
    let next: string | undefined = path;
    while (next) {
      const response = await this.request(next);
      const page = await response.json() as ODataPage<T>;
      items.push(...(page.value ?? []));
      const candidate = page["@odata.nextLink"];
      if (!candidate) break;
      const url = new URL(candidate);
      if (url.origin !== this.origin.origin || !url.pathname.startsWith("/api/data/v9.2/")) {
        throw new AgentMapError("UNTRUSTED_PAGING", "Dataverse returned an untrusted paging link.");
      }
      next = `${url.pathname}${url.search}`;
    }
    return items;
  }

  async get<T>(path: string): Promise<T> {
    return this.request(path).then((response) => response.json() as Promise<T>);
  }

  async download(path: string): Promise<Uint8Array> {
    const response = await this.request(path);
    return new Uint8Array(await response.arrayBuffer());
  }
}

interface DiscoveryInstance {
  ApiUrl?: string;
  FriendlyName?: string;
  EnvironmentId?: string;
  State?: number | string;
  Region?: string;
}

let discoveryCache: { expires: number; environments: Promise<DiscoveryEnvironment[]> } | undefined;

async function readEnvironments(): Promise<DiscoveryEnvironment[]> {
  const response = await fetchDiscoveryResponse(
    new URL(GLOBAL_DISCOVERY_INSTANCES_URL),
    { headers: { Accept: "application/json" } },
    (url, init) => hostFetch(GLOBAL_DISCOVERY_RESOURCE, url, init),
  );
  if (!response.ok) throw new AgentMapError("DISCOVERY_FAILED", "Environment discovery failed.", response.status >= 500);
  const data = await response.json() as { value?: DiscoveryInstance[] };
  return (data.value ?? []).flatMap((row) => {
    const api = row.ApiUrl ?? "";
    const state = String(row.State ?? "");
    const enabled = !state || state === "0" || /enabled|ready/i.test(state);
    if (!api.startsWith("https://") || !enabled) return [];
    try {
      return [{
        // The default environment has the ID Default-<tenant ID>. Other IDs that are not GUIDs are skipped.
        id: requireEnvironmentId(row.EnvironmentId ?? ""),
        name: row.FriendlyName?.trim() || "Environment",
        region: row.Region ?? "",
        apiUrl: new URL(api),
      }];
    } catch {
      return [];
    }
  }).sort((left, right) => left.name.localeCompare(right.name));
}

/** Lists the Dataverse environments of the signed-in user through the Dataverse Global Discovery Service. */
export async function discoverEnvironments(): Promise<DiscoveryEnvironment[]> {
  const now = Date.now();
  if (!discoveryCache || discoveryCache.expires <= now) {
    const environments = readEnvironments();
    const entry = { expires: now + DISCOVERY_CACHE_MS, environments };
    discoveryCache = entry;
    environments.catch(() => {
      if (discoveryCache === entry) discoveryCache = undefined;
    });
  }
  return discoveryCache.environments;
}
