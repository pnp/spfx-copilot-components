import {
  ABSOLUTE_MAX_FILE_SIZE_MB,
  BYTES_PER_MB,
  DEFAULT_ALLOWED_EXTENSION_LIST,
  DEFAULT_MAX_FILE_SIZE_MB,
  SUPPORTED_EXTENSIONS,
  type IFileRules,
  type IFileValidation,
  type INamedFile
} from "../models";
import { formatByteCount, formatBytes } from "./format";

const ILLEGAL_NAME = /["#%*:<>?/\\|]/;
const MARKDOWN_EXTENSIONS = [".md", ".markdown"];

export function normalizeMaxFileSizeMb(value: string | number | undefined): number {
  if (value === undefined || value === "") {
    return DEFAULT_MAX_FILE_SIZE_MB;
  }
  const numeric = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(numeric)) {
    return DEFAULT_MAX_FILE_SIZE_MB;
  }
  const whole = Math.floor(numeric);
  if (whole < 1) {
    return 1;
  }
  if (whole > ABSOLUTE_MAX_FILE_SIZE_MB) {
    return ABSOLUTE_MAX_FILE_SIZE_MB;
  }
  return whole;
}

export function maxFileSizeError(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Enter a whole number of megabytes from 1 to 50.";
  }
  if (!/^\d+$/.test(trimmed)) {
    return "Enter a whole number of megabytes from 1 to 50.";
  }
  const numeric = Number(trimmed);
  if (numeric < 1 || numeric > ABSOLUTE_MAX_FILE_SIZE_MB) {
    return "Enter a whole number of megabytes from 1 to 50.";
  }
  return "";
}

export function isSupportedExtension(extension: string): boolean {
  const trimmed = extension.trim().toLowerCase();
  if (!trimmed) {
    return false;
  }
  const withDot = trimmed.charAt(0) === "." ? trimmed : `.${trimmed}`;
  return SUPPORTED_EXTENSIONS.indexOf(withDot) !== -1;
}

/**
 * Parses a comma/semicolon/whitespace-separated extension list and restricts entries
 * to the supported allowlist (.pdf, .docx, .xlsx, .pptx, .md/.markdown, .png, .jpg).
 * Blank or unsupported-only input falls back to the default allowlist.
 */
export function parseAllowedExtensions(value: string | undefined): string[] {
  if (!value) {
    return expandMarkdownAliases(DEFAULT_ALLOWED_EXTENSION_LIST);
  }
  const result: string[] = [];
  const parts = value.split(/[,;\s]+/);
  for (let index = 0; index < parts.length; index += 1) {
    const trimmed = parts[index].trim().toLowerCase();
    if (!trimmed) {
      continue;
    }
    const withDot = trimmed.charAt(0) === "." ? trimmed : `.${trimmed}`;
    if (!isSupportedExtension(withDot)) {
      continue;
    }
    if (result.indexOf(withDot) === -1) {
      result.push(withDot);
    }
  }
  if (result.length === 0) {
    return expandMarkdownAliases(DEFAULT_ALLOWED_EXTENSION_LIST);
  }
  return expandMarkdownAliases(result);
}

export function effectiveAllowedExtensions(extensions: readonly string[] | undefined): string[] {
  const expanded = expandMarkdownAliases(extensions || []);
  if (expanded.length === 0) {
    return expandMarkdownAliases(DEFAULT_ALLOWED_EXTENSION_LIST);
  }
  return expanded;
}

export function extensionOf(fileName: string): string {
  const base = baseFileName(fileName).toLowerCase();
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) {
    return "";
  }
  return base.slice(dot);
}

export function baseFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const parts = trimmed.split(/[/\\]/);
  const leaf = parts[parts.length - 1];
  return leaf || trimmed;
}

export function validateSelectedFile(file: INamedFile, rules: IFileRules): IFileValidation {
  const name = baseFileName(file.name);
  if (!name) {
    return { ok: false, message: "Choose a file with a name." };
  }
  if (file.size <= 0) {
    return { ok: false, message: "This file is empty (0 bytes). Choose a file that has content." };
  }
  const maxMb = normalizeMaxFileSizeMb(rules.maxFileSizeMb);
  const maxBytes = maxMb * BYTES_PER_MB;
  if (file.size > maxBytes) {
    return {
      ok: false,
      message: `This file is ${formatBytes(file.size)} (${formatByteCount(file.size)} bytes), which is over the ${maxMb} MB limit of ${formatByteCount(maxBytes)} bytes.`
    };
  }
  const allowed = effectiveAllowedExtensions(rules.allowedExtensions);
  const extension = extensionOf(name);
  if (allowed.indexOf(extension) === -1) {
    const shown = extension || "(no extension)";
    return {
      ok: false,
      message: `Files of type ${shown} are not allowed. Allowed types: ${allowed.join(", ")}.`
    };
  }
  if (ILLEGAL_NAME.test(name) || hasControlCharacter(name)) {
    return {
      ok: false,
      message: "The file name contains a character SharePoint does not allow. Rename the file and try again."
    };
  }
  if (name.length > 400) {
    return {
      ok: false,
      message: "The file name is too long. Rename the file to 400 characters or fewer and try again."
    };
  }
  return { ok: true };
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) <= 31) {
      return true;
    }
  }
  return false;
}

export function acceptAttribute(extensions: string[]): string | undefined {
  const allowed = effectiveAllowedExtensions(extensions);
  return allowed.join(",");
}

/** `.md` and `.markdown` are one Markdown type. Either entry allows both. Only supported extensions are retained. */
export function expandMarkdownAliases(extensions: readonly string[]): string[] {
  const result: string[] = [];
  let markdown = false;
  for (let index = 0; index < extensions.length; index += 1) {
    const trimmed = extensions[index].trim().toLowerCase();
    if (!trimmed) {
      continue;
    }
    const withDot = trimmed.charAt(0) === "." ? trimmed : `.${trimmed}`;
    if (!isSupportedExtension(withDot)) {
      continue;
    }
    if (result.indexOf(withDot) === -1) {
      result.push(withDot);
    }
    if (withDot === ".md" || withDot === ".markdown") {
      markdown = true;
    }
  }
  if (markdown) {
    for (let index = 0; index < MARKDOWN_EXTENSIONS.length; index += 1) {
      if (result.indexOf(MARKDOWN_EXTENSIONS[index]) === -1) {
        result.push(MARKDOWN_EXTENSIONS[index]);
      }
    }
  }
  return result;
}
