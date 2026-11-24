import type { IFormSchema, IUnsupportedColumn, IWizardField } from '../models';
import { isValidInternalName, parseFieldList } from './siteUrl';
import { currencyLocaleIdOf, CURRENCY_FIELD_TYPE_KIND } from './currency';
import { URL_DISPLAY_FORMAT, URL_IMAGE_FORMAT } from './hyperlink';
import { YES_NO_CHOICES } from './yesNo';

/** Raw field as returned by /_api/web/lists/getbytitle('...')/fields with odata=nometadata. */
export interface IRawField {
  InternalName?: string;
  Title?: string;
  TypeAsString?: string;
  Required?: boolean;
  Hidden?: boolean;
  ReadOnlyField?: boolean;
  /** nometadata returns string[]; verbose returns { results: string[] }. */
  Choices?: string[] | { results?: string[] };
  /** DateTime: 0 = date only (DateOnly), 1 = date and time (DateTime). */
  DisplayFormat?: number;
  /** Choice/MultiChoice "can add values manually". Ignored: the wizard only offers the defined options. */
  FillInChoice?: boolean;
  RichText?: boolean;
  MaxLength?: number;
  Description?: string;
  /** Currency: Windows LCID that selects the column's currency. */
  CurrencyLocaleId?: number | string;
  /** SharePoint FieldTypeKind (10 = Currency). Used when TypeAsString is missing. */
  FieldTypeKind?: number;
  /** Column default. When set, SharePoint may fill the column even if the answer was left empty. */
  DefaultValue?: string;
}

export const NOTE_MAX_LENGTH = 63999;
export const TEXT_DEFAULT_MAX_LENGTH = 255;

/** System columns that are never shown or reported, even if SharePoint returns them as editable. */
const SYSTEM_COLUMNS: Record<string, true> = {
  ContentType: true,
  Attachments: true,
  FileLeafRef: true,
  LinkTitle: true,
  LinkTitleNoMenu: true,
  Edit: true,
  DocIcon: true,
  ComplianceAssetId: true,
  ItemChildCount: true,
  FolderChildCount: true,
  AppAuthor: true,
  AppEditor: true
};

const TYPE_LABELS: Record<string, string> = {
  User: 'Person or Group',
  UserMulti: 'Person or Group',
  Lookup: 'Lookup',
  LookupMulti: 'Lookup',
  TaxonomyFieldType: 'Managed metadata',
  TaxonomyFieldTypeMulti: 'Managed metadata',
  URL: 'Hyperlink or Picture',
  Location: 'Location',
  Thumbnail: 'Image',
  Geolocation: 'Location'
};

/** Types that are never fillable and never reported (computed or read-only by nature). */
const IGNORED_TYPES: Record<string, true> = { Computed: true, Calculated: true, Attachments: true, Counter: true, ContentTypeId: true, File: true };

export type ColumnMapping =
  | { kind: 'field'; field: IWizardField }
  | { kind: 'unsupported'; column: IUnsupportedColumn }
  | { kind: 'ignored' };

function readChoices(raw: IRawField['Choices']): string[] {
  const list = Array.isArray(raw) ? raw : raw && Array.isArray(raw.results) ? raw.results : [];
  return list.filter((c): c is string => typeof c === 'string' && c.trim().length > 0);
}

function dedupe(list: string[]): string[] {
  return list.filter((c, i) => list.indexOf(c) === i);
}

/** Maps one SharePoint column to a wizard step, an unsupported column, or nothing. */
export function mapColumn(raw: IRawField): ColumnMapping {
  const internalName = typeof raw.InternalName === 'string' ? raw.InternalName : '';
  const type = typeof raw.TypeAsString === 'string' ? raw.TypeAsString : '';
  if (!internalName || !isValidInternalName(internalName) || raw.Hidden || raw.ReadOnlyField) {
    return { kind: 'ignored' };
  }
  if (SYSTEM_COLUMNS[internalName] || /^_/.test(internalName) || IGNORED_TYPES[type]) {
    return { kind: 'ignored' };
  }
  const title = (typeof raw.Title === 'string' && raw.Title.trim()) || internalName;
  const required = raw.Required === true;
  const description = typeof raw.Description === 'string' ? raw.Description.trim() : '';
  const hasDefault = typeof raw.DefaultValue === 'string' && raw.DefaultValue.trim() !== '';
  const base = { internalName, title, required, description, choices: [] as string[], richText: false, ...(hasDefault ? { hasDefault: true } : {}) };

  switch (type) {
    case 'Text': {
      const max = typeof raw.MaxLength === 'number' && raw.MaxLength > 0 ? Math.min(raw.MaxLength, TEXT_DEFAULT_MAX_LENGTH) : TEXT_DEFAULT_MAX_LENGTH;
      return { kind: 'field', field: { ...base, kind: 'text', maxLength: max } };
    }
    case 'Note':
      return { kind: 'field', field: { ...base, kind: 'note', maxLength: NOTE_MAX_LENGTH, richText: raw.RichText === true } };
    case 'Choice':
    case 'MultiChoice': {
      // Fill-in ("Can add values manually") columns are supported, but only the defined options are offered.
      const choices = dedupe(readChoices(raw.Choices));
      if (choices.length === 0) {
        return { kind: 'unsupported', column: { internalName, title, typeLabel: type === 'MultiChoice' ? 'Choice (multiple, no options)' : 'Choice (no options)', required } };
      }
      return { kind: 'field', field: { ...base, kind: type === 'MultiChoice' ? 'multichoice' : 'choice', maxLength: TEXT_DEFAULT_MAX_LENGTH, choices } };
    }
    case 'DateTime':
      // DisplayFormat 0 is DateOnly; anything else (1 = DateTime) asks for a date and a time.
      if (raw.DisplayFormat === 0) {
        return { kind: 'field', field: { ...base, kind: 'date', maxLength: 10 } };
      }
      return { kind: 'field', field: { ...base, kind: 'datetime', maxLength: 16 } };
    case 'Boolean':
      return { kind: 'field', field: { ...base, kind: 'yesno', maxLength: 3, choices: YES_NO_CHOICES } };
    case 'Number':
      return { kind: 'field', field: { ...base, kind: 'number', maxLength: 32 } };
    case 'Currency':
      return { kind: 'field', field: { ...base, kind: 'currency', maxLength: 32, currencyLocaleId: currencyLocaleIdOf(raw.CurrencyLocaleId) } };
    case 'URL':
      // DisplayFormat 0 is a hyperlink; 1 is a picture (unsupported). A missing format is treated as a hyperlink.
      if (raw.DisplayFormat === URL_IMAGE_FORMAT) {
        return { kind: 'unsupported', column: { internalName, title, typeLabel: 'Picture', required } };
      }
      if (raw.DisplayFormat === URL_DISPLAY_FORMAT || raw.DisplayFormat === undefined) {
        return { kind: 'field', field: { ...base, kind: 'hyperlink', maxLength: 255 } };
      }
      return { kind: 'unsupported', column: { internalName, title, typeLabel: 'Hyperlink or Picture', required } };
    default:
      if (raw.FieldTypeKind === CURRENCY_FIELD_TYPE_KIND) {
        return { kind: 'field', field: { ...base, kind: 'currency', maxLength: 32, currencyLocaleId: currencyLocaleIdOf(raw.CurrencyLocaleId) } };
      }

      return { kind: 'unsupported', column: { internalName, title, typeLabel: TYPE_LABELS[type] || type || 'Unknown', required } };
  }
}

/**
 * Builds the wizard schema. `fieldsParam` (comma-separated internal or display names) can reorder and
 * narrow the steps, but required columns are always kept (appended in list order).
 */
export function buildFormSchema(listTitle: string, listUrl: string, rawFields: IRawField[], fieldsParam?: string): IFormSchema {
  const fields: IWizardField[] = [];
  const skipped: IUnsupportedColumn[] = [];
  const blocking: IUnsupportedColumn[] = [];
  const seen: Record<string, true> = {};
  (rawFields || []).forEach((raw) => {
    const mapped = mapColumn(raw || {});
    const name = mapped.kind === 'field' ? mapped.field.internalName : mapped.kind === 'unsupported' ? mapped.column.internalName : '';
    if (!name || seen[name]) {
      return;
    }
    seen[name] = true;
    if (mapped.kind === 'field') {
      fields.push(mapped.field);
    } else if (mapped.kind === 'unsupported') {
      (mapped.column.required ? blocking : skipped).push(mapped.column);
    }
  });
  return { listTitle, listUrl, fields: orderFields(fields, fieldsParam), skipped, blocking };
}

export function orderFields(fields: IWizardField[], fieldsParam?: string): IWizardField[] {
  const wanted = parseFieldList(fieldsParam);
  if (wanted.length === 0) {
    return fields;
  }
  const picked: IWizardField[] = [];
  wanted.forEach((token) => {
    const lower = token.toLowerCase();
    const match =
      fields.filter((f) => f.internalName === token)[0] ||
      fields.filter((f) => f.internalName.toLowerCase() === lower)[0] ||
      fields.filter((f) => f.title.toLowerCase() === lower)[0];
    if (match && picked.indexOf(match) < 0) {
      picked.push(match);
    }
  });
  if (picked.length === 0) {
    return fields;
  }
  fields.forEach((f) => {
    if (f.required && picked.indexOf(f) < 0) {
      picked.push(f);
    }
  });
  return picked;
}

/** "Owner (Person or Group), Project (Lookup)" */
export function describeColumns(columns: IUnsupportedColumn[]): string {
  return columns.map((c) => `${c.title} (${c.typeLabel})`).join(', ');
}
