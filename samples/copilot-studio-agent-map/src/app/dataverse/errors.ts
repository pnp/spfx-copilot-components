export type Guid = string;

/** A GUID, or `Default-<tenant ID>` for the default environment of the tenant. */
export type EnvironmentId = string;

export interface ReviewEnvironment {
  id: EnvironmentId;
  name: string;
  region: string;
}

export interface ReviewAgent {
  id: Guid;
  name: string;
  componentIdUnique: Guid;
  modifiedOn?: string;
  iconBase64?: string;
  harness: "standard" | "copilot";
}

export interface AgentMapErrorDiagnostics {
  dataverse?: {
    method: string;
    url: string;
    status: number;
    requestId?: string;
  };
}

/** An expected failure. Its message is safe to show to the user. */
export class AgentMapError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable = false,
    public diagnostics?: AgentMapErrorDiagnostics,
  ) {
    super(message);
    this.name = "AgentMapError";
  }
}
