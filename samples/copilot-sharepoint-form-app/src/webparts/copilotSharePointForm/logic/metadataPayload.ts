import type { IEditableField, IFieldValueMap, IMetadataSummaryItem } from "../models";

export interface IValidateUpdateFormValue {
  FieldName: string;
  FieldValue: string;
}

export interface IValidateUpdateListItemBody {
  formValues: IValidateUpdateFormValue[];
  bNewDocumentUpdate: boolean;
}

export function buildValidateUpdateListItemBody(
  fields: IEditableField[],
  values: IFieldValueMap
): IValidateUpdateListItemBody {
  const formValues: IValidateUpdateFormValue[] = [];
  for (let index = 0; index < fields.length; index += 1) {
    const formatted = formatFieldValue(fields[index], values[fields[index].internalName]);
    if (formatted === undefined) {
      continue;
    }
    formValues.push({
      FieldName: fields[index].internalName,
      FieldValue: formatted
    });
  }
  return {
    formValues,
    bNewDocumentUpdate: true
  };
}

export function summarizeMetadata(fields: IEditableField[], values: IFieldValueMap): IMetadataSummaryItem[] {
  const items: IMetadataSummaryItem[] = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const display = displayFieldValue(field, values[field.internalName]);
    if (!display) {
      continue;
    }
    items.push({
      internalName: field.internalName,
      title: field.title,
      value: display
    });
  }
  return items;
}

/**
 * SharePoint ValidateUpdateListItem wants plain strings. Dates are M/D/YYYY,
 * multi-choice values use the ;# separator, and people fields use the classic Key array.
 */
export function formatFieldValue(field: IEditableField, value: IFieldValueMap[string] | undefined): string | undefined {
  if (field.type === "Boolean") {
    return value === true || value === "true" || value === "1" ? "1" : "0";
  }
  if (field.type === "MultiChoice") {
    const selected = Array.isArray(value) ? value : [];
    const cleaned: string[] = [];
    for (let index = 0; index < selected.length; index += 1) {
      const item = selected[index].trim();
      if (item) {
        cleaned.push(item);
      }
    }
    return cleaned.length > 0 ? cleaned.join(";#") : undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (field.type === "DateTime") {
    return toSharePointDate(trimmed);
  }
  if (field.type === "URL") {
    return `${trimmed}, ${trimmed}`;
  }
  if (field.type === "User") {
    return personFieldValue(trimmed);
  }
  return trimmed;
}

export function displayFieldValue(field: IEditableField, value: IFieldValueMap[string] | undefined): string | undefined {
  if (field.type === "Boolean") {
    return value === true || value === "true" || value === "1" ? "Yes" : "No";
  }
  if (field.type === "MultiChoice") {
    return Array.isArray(value) && value.length > 0 ? value.join(", ") : undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function toSharePointDate(value: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return value.trim() || undefined;
  }
  return `${Number(match[2])}/${Number(match[3])}/${match[1]}`;
}

function personFieldValue(value: string): string {
  const key = value.indexOf("@") >= 0 ? `i:0#.f|membership|${value}` : value;
  return `[{'Key':'${key.replace(/'/g, "''")}'}]`;
}
