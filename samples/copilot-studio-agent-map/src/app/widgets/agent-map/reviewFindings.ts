/**
 * The finding fields that the Agent Map inspector and the node badges read.
 * In the Agent Review MCP App, a saved review gives its findings to the map.
 * This standalone map does not load review findings, so it gives no findings,
 * and the inspector does not show the findings section.
 */
export type Severity = "error" | "warning" | "info";

export interface FindingView {
  id: string;
  sev: Severity;
  title: string;
  sub: string;
  fact: string;
  componentIdUnique?: string;
  actionPath?: string;
}

const FINDING_ROW_FOCUS_PREFIX = "row-key:";

/** Create a cross-tab locator for one stable finding row key. */
export function createFindingRowFocus(rowKey: string): string {
  return `${FINDING_ROW_FOCUS_PREFIX}${rowKey}`;
}
