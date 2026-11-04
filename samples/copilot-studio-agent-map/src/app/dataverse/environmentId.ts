import { AgentMapError, type EnvironmentId } from "./errors";

/**
 * A Power Platform environment ID: a GUID, or `Default-<tenant ID>` for the
 * default environment of the tenant. The case of the letters is not important.
 */
export const ENVIRONMENT_ID_PATTERN = /^(default-)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/**
 * Gives the environment ID in one form: the GUID in lower case, with the prefix
 * `Default-` for the default environment. Braces around the ID are removed.
 * A value that is not valid gives undefined.
 */
export function normalizeEnvironmentId(value: unknown): EnvironmentId | undefined {
  if (typeof value !== "string") return undefined;
  const match = ENVIRONMENT_ID_PATTERN.exec(value.trim().replace(/^\{(.*)\}$/, "$1"));
  if (!match) return undefined;
  const id = match[2].toLowerCase();
  return match[1] ? `Default-${id}` : id;
}

/** Gives the environment ID in one form (see normalizeEnvironmentId), or throws an INVALID_ID error. */
export function requireEnvironmentId(value: string): EnvironmentId {
  const normalized = normalizeEnvironmentId(value);
  if (!normalized) throw new AgentMapError("INVALID_ID", "A valid environment ID is required.");
  return normalized;
}
