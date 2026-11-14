import type {
  FieldType,
  FieldValue,
  IEditableField,
  IFieldErrorMap,
  IFieldGroups,
  IFieldValueMap
} from "../models";

/**
 * Columns the file name or SharePoint itself owns. They are not collected on the form
 * even when a library marks them editable.
 */
const EXCLUDED_INTERNAL_NAMES: { [name: string]: true } = {
  FileLeafRef: true,
  FileDirRef: true,
  ContentType: true,
  ContentTypeId: true,
  Attachments: true,
  Order: true,
  DocIcon: true,
  Edit: true,
  LinkFilename: true,
  LinkFilenameNoMenu: true,
  LinkFilename2: true,
  LinkTitle: true,
  LinkTitleNoMenu: true,
  LinkTitle2: true,
  _UIVersionString: true,
  ComplianceAssetId: true,
  AppAuthor: true,
  AppEditor: true,
  FolderChildCount: true,
  ItemChildCount: true,
  FSObjType: true,
  MetaInfo: true,
  CheckoutUser: true,
  FileSizeDisplay: true,
  EncodedAbsUrl: true,
  BaseName: true,
  ServerUrl: true,
  GUID: true,
  UniqueId: true,
  SortBehavior: true,
  OriginatorId: true,
  NoExecute: true,
  ContentVersion: true,
  ParentLeafName: true,
  ParentVersionString: true,
  Combine: true,
  RepairDocument: true,
  TemplateUrl: true,
  xd_ProgID: true,
  xd_Signature: true,
  SharedWithUsers: true,
  SharedWithDetails: true,
  SelectTitle: true,
  SelectFilename: true,
  PermMask: true,
  InstanceID: true,
  WorkflowVersion: true,
  WorkflowInstanceID: true,
  Restricted: true,
  PrincipalCount: true,
  CheckedOutUserId: true,
  CheckedOutTitle: true,
  SMTotalSize: true,
  SMLastModifiedDate: true,
  SMTotalFileStreamSize: true,
  SMTotalFileCount: true,
  Preview: true,
  Thumbnail: true,
  MediaServiceMetadata: true,
  MediaServiceFastMetadata: true,
  owshiddenversion: true
};

const SUPPORTED_TYPES: { [name: string]: FieldType } = {
  Text: "Text",
  Note: "Note",
  Choice: "Choice",
  MultiChoice: "MultiChoice",
  Number: "Number",
  Currency: "Currency",
  DateTime: "DateTime",
  Boolean: "Boolean",
  URL: "URL",
  User: "User",
  UserMulti: "User"
};

export interface IRawSharePointField {
  InternalName?: string;
  Title?: string;
  TypeAsString?: string;
  Required?: boolean;
  Hidden?: boolean;
  ReadOnlyField?: boolean;
  Description?: string;
  Choices?: string[] | { results?: string[] };
}

export function parseFieldPayload(payload: unknown): IFieldGroups {
  return groupFields(mapEditableFields(readFieldArray(payload)));
}

export function mapEditableFields(rawFields: IRawSharePointField[]): IEditableField[] {
  const fields: IEditableField[] = [];
  for (let index = 0; index < rawFields.length; index += 1) {
    const mapped = mapField(rawFields[index]);
    if (mapped) {
      fields.push(mapped);
    }
  }
  return fields;
}

export function groupFields(fields: IEditableField[]): IFieldGroups {
  const required: IEditableField[] = [];
  const optional: IEditableField[] = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (field.required) {
      required.push(field);
    } else {
      optional.push(field);
    }
  }
  return { required, optional };
}

export function emptyValues(fields: IEditableField[]): IFieldValueMap {
  const values: IFieldValueMap = {};
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (field.type === "Boolean") {
      values[field.internalName] = false;
    } else if (field.type === "MultiChoice") {
      values[field.internalName] = [];
    } else {
      values[field.internalName] = "";
    }
  }
  return values;
}

export function validateFormValues(fields: IEditableField[], values: IFieldValueMap): IFieldErrorMap {
  const errors: IFieldErrorMap = {};
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const message = fieldError(field, values[field.internalName]);
    if (message) {
      errors[field.internalName] = message;
    }
  }
  return errors;
}

export function hasFieldErrors(errors: IFieldErrorMap): boolean {
  return Object.keys(errors).length > 0;
}

function fieldError(field: IEditableField, value: FieldValue | undefined): string | undefined {
  if (field.type === "Boolean") {
    return undefined;
  }
  if (!fieldHasValue(field, value)) {
    return field.required ? `${field.title} is required.` : undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if ((field.type === "Number" || field.type === "Currency") && !isFiniteNumber(trimmed)) {
    return `${field.title} must be a number.`;
  }
  if (field.type === "DateTime" && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${field.title} must be a date.`;
  }
  if (field.type === "URL" && !/^https?:\/\/\S+$/i.test(trimmed)) {
    return `${field.title} must start with http:// or https://.`;
  }
  return undefined;
}

function fieldHasValue(field: IEditableField, value: FieldValue | undefined): boolean {
  if (field.type === "Boolean") {
    return true;
  }
  if (field.type === "MultiChoice") {
    return Array.isArray(value) && value.length > 0;
  }
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: string): boolean {
  if (!/^-?\d+(\.\d+)?$/.test(value)) {
    return false;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric);
}

function mapField(raw: IRawSharePointField): IEditableField | undefined {
  const internalName = (raw.InternalName || "").trim();
  if (!internalName || EXCLUDED_INTERNAL_NAMES[internalName] || internalName.charAt(0) === "_") {
    return undefined;
  }
  if (raw.Hidden === true || raw.ReadOnlyField === true) {
    return undefined;
  }
  const type = raw.TypeAsString ? SUPPORTED_TYPES[raw.TypeAsString] : undefined;
  if (!type) {
    return undefined;
  }
  return {
    internalName,
    title: (raw.Title || internalName).trim() || internalName,
    description: (raw.Description || "").trim(),
    type,
    required: raw.Required === true,
    choices: type === "Choice" || type === "MultiChoice" ? readChoices(raw.Choices) : []
  };
}

function readChoices(choices: IRawSharePointField["Choices"]): string[] {
  const source = Array.isArray(choices) ? choices : choices && choices.results ? choices.results : [];
  const result: string[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const choice = String(source[index]).trim();
    if (choice && result.indexOf(choice) === -1) {
      result.push(choice);
    }
  }
  return result;
}

function readFieldArray(payload: unknown): IRawSharePointField[] {
  const rows = unwrapCollection(payload);
  const fields: IRawSharePointField[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row && typeof row === "object") {
      fields.push(row as IRawSharePointField);
    }
  }
  return fields;
}

function unwrapCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const record = payload as { [key: string]: unknown };
  if (Array.isArray(record.value)) {
    return record.value;
  }
  const data = record.d;
  if (!data || typeof data !== "object") {
    return [];
  }
  const inner = data as { [key: string]: unknown };
  if (Array.isArray(inner.results)) {
    return inner.results;
  }
  return [];
}
