import type { IEditableField } from "../models";

export type SupportedColumnType = "Text" | "Note" | "Choice";

export interface IConfiguredColumn {
  internalName: string;
  label: string;
  type: SupportedColumnType;
  required: boolean;
  choices: string[];
}

const SUPPORTED: { [name: string]: SupportedColumnType } = {
  Text: "Text",
  Note: "Note",
  Choice: "Choice"
};

/** Person columns are out of scope and never rendered. */
export function isPersonField(type: string | undefined): boolean {
  return type === "User" || type === "UserMulti";
}

export function isSupportedColumnType(type: string | undefined): type is SupportedColumnType {
  return Boolean(type && SUPPORTED[type]);
}

export function parseConfiguredColumns(raw: string | undefined): { columns: IConfiguredColumn[]; error?: string } {
  const text = (raw || "").trim();
  if (!text) {
    return { columns: [] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { columns: [], error: "The column configuration isn't valid JSON." };
  }
  if (!Array.isArray(parsed)) {
    return { columns: [], error: "The column configuration must be a JSON array." };
  }
  const columns: IConfiguredColumn[] = [];
  for (let index = 0; index < parsed.length; index += 1) {
    const column = readColumn(parsed[index]);
    if (column) {
      columns.push(column);
    }
  }
  return { columns };
}

/**
 * Author columns win for label, type, and choice overrides.
 * A column is required when the author marks it required or the library column is required.
 * Person columns are dropped. An empty author list auto-hydrates Text, Note, and Choice columns.
 */
export function resolveFormColumns(configured: IConfiguredColumn[], libraryFields: IEditableField[]): IEditableField[] {
  const byName: { [name: string]: IEditableField } = {};
  for (let index = 0; index < libraryFields.length; index += 1) {
    const field = libraryFields[index];
    if (!isPersonField(field.type)) {
      byName[field.internalName] = field;
    }
  }
  if (configured.length === 0) {
    return libraryFields.filter((field) => isSupportedColumnType(field.type));
  }
  const resolved: IEditableField[] = [];
  for (let index = 0; index < configured.length; index += 1) {
    const column = configured[index];
    const libraryField = byName[column.internalName];
    const libraryChoices = libraryField && libraryField.type === "Choice" ? libraryField.choices : [];
    resolved.push({
      internalName: column.internalName,
      title: column.label,
      description: libraryField ? libraryField.description : "",
      type: column.type,
      required: column.required || Boolean(libraryField && libraryField.required),
      choices: column.type === "Choice"
        ? (column.choices.length > 0 ? column.choices : libraryChoices)
        : []
    });
  }
  return resolved;
}

function readColumn(value: unknown): IConfiguredColumn | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as { [key: string]: unknown };
  const typeName = typeof record.type === "string" ? record.type : "";
  if (isPersonField(typeName) || !isSupportedColumnType(typeName)) {
    return undefined;
  }
  const internalName = typeof record.internalName === "string" ? record.internalName.trim() : "";
  if (!internalName) {
    return undefined;
  }
  const label = typeof record.label === "string" && record.label.trim()
    ? record.label.trim()
    : internalName;
  return {
    internalName,
    label,
    type: typeName,
    required: record.required === true,
    choices: readChoices(record.choices)
  };
}

function readChoices(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const choices: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const choice = String(value[index]).trim();
    if (choice && choices.indexOf(choice) === -1) {
      choices.push(choice);
    }
  }
  return choices;
}
