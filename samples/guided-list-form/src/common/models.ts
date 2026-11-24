/**
 * The SharePoint column types the wizard can fill. Everything else is skipped or blocks the form.
 * v1.0: text, note, choice, date. v1.1: datetime, multichoice. v1.4: yesno (Boolean), number.
 * v1.4.1: currency, hyperlink (URL format).
 */
export type FieldKind = 'text' | 'note' | 'choice' | 'multichoice' | 'date' | 'datetime' | 'yesno' | 'number' | 'currency' | 'hyperlink';

export type HostKind = 'WebPart' | 'Copilot';

export interface IWizardField {
  internalName: string;
  title: string;
  kind: FieldKind;
  required: boolean;
  description: string;
  /** Text: SharePoint MaxLength (default 255). Note: 63,999. */
  maxLength: number;
  /** Choice and multichoice: the allowed values, in list order. Fill-in values are never offered. Yes/No: Yes, No. */
  choices: string[];
  /** Note: the column is rich text (values are HTML-escaped before writing). */
  richText: boolean;
  /** Currency: the list column's CurrencyLocaleId. Omitted on other kinds. */
  currencyLocaleId?: number;
  /** The column has a default value, so an empty answer may still be stored as that default. */
  hasDefault?: boolean;
}

export interface IUnsupportedColumn {
  internalName: string;
  title: string;
  /** Friendly type name, e.g. "Person or Group". */
  typeLabel: string;
  required: boolean;
}

export interface IFormSchema {
  listTitle: string;
  /** Absolute URL of the list root folder (for DispForm/NewForm links). Empty in demo mode. */
  listUrl: string;
  fields: IWizardField[];
  /** Optional unsupported columns that are left empty. */
  skipped: IUnsupportedColumn[];
  /** Required unsupported columns: the form can't be submitted. */
  blocking: IUnsupportedColumn[];
}

/**
 * One step's raw control value:
 * - text, note, choice: the string
 * - date: YYYY-MM-DD
 * - datetime: YYYY-MM-DDTHH:mm as a wall-clock time in the person's own time zone (either half may be empty while typing)
 * - multichoice: the picked options (string[])
 * - yesno: "Yes" or "No"
 * - number, currency: the typed decimal as a string (parsed when saving)
 * - hyperlink: { url, description }
 */
export interface IHyperlinkAnswer {
  url: string;
  description: string;
}

export type AnswerValue = string | string[] | IHyperlinkAnswer;

/** Answers keyed by column internal name. */
export type Answers = Record<string, AnswerValue>;

export interface ISubmitResult {
  id: number;
  /** Absolute link to the new item's display form. Empty in demo mode. */
  itemUrl: string;
  demo: boolean;
}

export interface IWizardTexts {
  formTitle: string;
  introText: string;
  thankYouText: string;
}

export const DEFAULT_TEXTS: IWizardTexts = {
  formTitle: '',
  introText: '',
  thankYouText: 'Thanks, your answers were submitted.'
};
