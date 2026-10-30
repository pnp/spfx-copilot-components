/**
 * Reads the SKILL.md of a zip-bundle skill. The Agent Review app downloads all the
 * files of each bundle, but the map reads only SKILL.md, so this downloads one file.
 * The selection, path, size, and text rules are the same as in the Agent Review app.
 */
import type { BotComponent } from "../copilot-studio/core/index.js";
import { guid, type DataverseClient } from "./dataverse";

const MAX_RESOURCE_BYTES = 4 * 1024 * 1024;
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const SKILL_RESOURCE_COMPONENT_TYPE = 14;

function sameIdentifier(left: string | undefined, right: string | undefined): boolean {
  const normalize = (value: string | undefined): string => (value ?? "").replace(/[{}]/g, "").toLowerCase();
  return !!left && !!right && normalize(left) === normalize(right);
}

/** Returns a safe relative path, or undefined for an absolute, rooted, or parent path. */
function normalizeSkillResourcePath(input: string): string | undefined {
  try {
    const decoded = decodeURIComponent(input).replace(/\\/g, "/").replace(/^\.\/+/, "");
    if (/^[a-zA-Z]:/.test(decoded) || decoded.startsWith("/") || decoded.includes("\0")) return undefined;
    const parts = decoded.split("/").filter(Boolean);
    if (parts.some((part) => part === "..")) return undefined;
    return parts.join("/");
  } catch {
    return undefined;
  }
}

/** The path is `name`. The `filedata_name` is used only when `name` is not safe. */
function resourcePath(component: BotComponent): string | undefined {
  const primary = normalizeSkillResourcePath(component.name ?? "");
  if (primary !== undefined) return primary;
  return component.filedata_name ? normalizeSkillResourcePath(component.filedata_name) : undefined;
}

function isBinary(text: string): boolean {
  if (text.includes("\0")) return true;
  const replacements = (text.match(/\uFFFD/g) ?? []).length;
  return text.length > 0 && replacements / text.length > 0.01;
}

function truncateToUtf8Limit(text: string, maxBytes: number): string {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length <= maxBytes) return text;
  let cut = maxBytes;
  // Do not cut a multi-byte character.
  while (cut > 0 && (bytes[cut] & 0xc0) === 0x80) cut -= 1;
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, cut));
}

/** Returns the skill resources: the rows of the skill, else all rows when the agent has only one zip-bundle skill. */
export function skillResources(
  skill: { componentId?: string; componentIdUnique?: string },
  components: readonly BotComponent[],
  zipSkillCount: number,
): BotComponent[] {
  const resources = components.filter((component) =>
    Number(component.componenttype) === SKILL_RESOURCE_COMPONENT_TYPE && Number(component.statecode ?? 0) === 0);
  const own = resources.filter((component) =>
    sameIdentifier(component.parentbotcomponentid, skill.componentId)
    || sameIdentifier(component.parentbotcomponentid, skill.componentIdUnique));
  return own.length === 0 && zipSkillCount === 1 ? resources : own;
}

/** Downloads the one SKILL.md of a bundle. Returns "" when there is not exactly one readable text file. */
export async function readSkillMarkdown(
  client: DataverseClient,
  resources: readonly BotComponent[],
): Promise<string> {
  const matches = resources.filter((component) => resourcePath(component)?.toLowerCase() === "skill.md");
  if (matches.length !== 1) return "";
  const bytes = await client.download(`botcomponents(${guid(matches[0].botcomponentid)})/filedata/$value`);
  if (bytes.byteLength > MAX_RESOURCE_BYTES) return "";
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (isBinary(text)) return "";
  return truncateToUtf8Limit(text, MAX_TEXT_BYTES);
}
