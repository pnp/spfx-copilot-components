/**
 * The Weekly Pulse list schema, mirrored 1:1 from provisioning/Provision-WeeklyPulse.ps1
 * (same internal names, field XML, indexes, view and permissions). Keep the two in sync.
 */

/**
 * Settings that a re-run brings up to date on a column that already exists.
 * Never touches items.
 */
export interface IFieldUpgrade {
  /** Display name (Title). The internal name never changes. */
  title?: string;
  /** Attributes on the <Field> element, for example Commas='FALSE'. */
  attributes?: { [name: string]: string };
  /** Calculated default value: the <DefaultFormula> element. */
  defaultFormula?: string;
}

export interface IFieldDefinition {
  internalName: string;
  xml: string;
  indexed: boolean;
  upgrade?: IFieldUpgrade;
}

export function textXml(name: string, display: string, required: boolean = false, max: number = 255): string {
  return `<Field Type='Text' Name='${name}' StaticName='${name}' DisplayName='${display}' Required='${required ? 'TRUE' : 'FALSE'}' MaxLength='${max}' />`;
}

/** Whole number without a thousands separator (2026, not 2,026). Optional calculated default. */
export function numberXml(name: string, display: string, min: number, max: number, defaultFormula: string = ''): string {
  const open = `<Field Type='Number' Name='${name}' StaticName='${name}' DisplayName='${display}' Required='TRUE' Min='${min}' Max='${max}' Decimals='0' Commas='FALSE'`;
  return defaultFormula ? `${open}><DefaultFormula>${defaultFormula}</DefaultFormula></Field>` : `${open} />`;
}

/** New items get the current year. SharePoint calculated default (DefaultFormula), evaluated when the item is created. */
export const QUIZ_YEAR_DEFAULT_FORMULA = '=YEAR(Today)';
export const WEEK_LABEL_TITLE = 'Week label';

export function yesNoXml(name: string, display: string, defaultValue: string): string {
  const def = defaultValue !== '' ? `<Default>${defaultValue}</Default>` : '';
  return `<Field Type='Boolean' Name='${name}' StaticName='${name}' DisplayName='${display}'>${def}</Field>`;
}

export function choiceXml(name: string, display: string, choices: string[], defaultValue: string = ''): string {
  const c = choices.map((x) => `<CHOICE>${x}</CHOICE>`).join('');
  const def = defaultValue ? `<Default>${defaultValue}</Default>` : '';
  return `<Field Type='Choice' Name='${name}' StaticName='${name}' DisplayName='${display}' Format='Dropdown' FillInChoice='FALSE'>${def}<CHOICES>${c}</CHOICES></Field>`;
}

const f = (internalName: string, xml: string, indexed: boolean = false, upgrade?: IFieldUpgrade): IFieldDefinition =>
  upgrade ? { internalName, xml, indexed, upgrade } : { internalName, xml, indexed };

export const QUESTIONS_LIST_DESCRIPTION = 'Weekly Pulse questions. One active item per ISO week.';
export const CONFIG_LIST_DESCRIPTION = 'Weekly Pulse settings for the Copilot component. Keep exactly one item.';
export const RESPONSES_LIST_DESCRIPTION = 'Weekly Pulse answers. People see and edit only their own items.';

export const QUESTIONS_FIELDS: IFieldDefinition[] = [
  f('QuizYear', numberXml('QuizYear', 'QuizYear', 2020, 2100, QUIZ_YEAR_DEFAULT_FORMULA), true, {
    attributes: { Commas: 'FALSE', Decimals: '0' },
    defaultFormula: QUIZ_YEAR_DEFAULT_FORMULA
  }),
  f('WeekNumber', numberXml('WeekNumber', 'WeekNumber', 1, 53), true, { attributes: { Commas: 'FALSE', Decimals: '0' } }),
  f('ChoiceA', textXml('ChoiceA', 'ChoiceA', true)),
  f('ChoiceB', textXml('ChoiceB', 'ChoiceB', true)),
  f('ChoiceC', textXml('ChoiceC', 'ChoiceC')),
  f('ChoiceD', textXml('ChoiceD', 'ChoiceD')),
  f('CorrectChoice', choiceXml('CorrectChoice', 'CorrectChoice', ['A', 'B', 'C', 'D'])),
  f(
    'Justification',
    "<Field Type='Note' Name='Justification' StaticName='Justification' DisplayName='Justification' NumLines='6' RichText='FALSE' UnlimitedLengthInDocumentLibrary='FALSE' Description='Why the right answer is right. Up to 500 characters; longer text is cut.' />"
  ),
  f('IsActive', yesNoXml('IsActive', 'IsActive', '1'), true),
  // Monday of the ISO week (week 1 contains 4 January). Used only by the "Upcoming weeks" view.
  f(
    'WeekStart',
    "<Field Type='Calculated' Name='WeekStart' StaticName='WeekStart' DisplayName='Week starts' ResultType='DateTime' Format='DateOnly' ReadOnly='TRUE'>" +
      '<Formula>=DATE(QuizYear,1,4)-MOD(WEEKDAY(DATE(QuizYear,1,4))+5,7)+(WeekNumber-1)*7</Formula>' +
      "<FieldRefs><FieldRef Name='QuizYear' /><FieldRef Name='WeekNumber' /></FieldRefs></Field>"
  ),
  // Read-only label such as 2026-W44. Set QuizYear and WeekNumber; this one follows.
  f(
    'WeekLabel',
    `<Field Type='Calculated' Name='WeekLabel' StaticName='WeekLabel' DisplayName='${WEEK_LABEL_TITLE}' ResultType='Text' ReadOnly='TRUE'>` +
      '<Formula>=QuizYear&amp;"-W"&amp;TEXT(WeekNumber,"00")</Formula>' +
      "<FieldRefs><FieldRef Name='QuizYear' /><FieldRef Name='WeekNumber' /></FieldRefs></Field>",
    false,
    { title: WEEK_LABEL_TITLE }
  )
];

export const UPCOMING_VIEW_TITLE = 'Upcoming weeks';
/** QuizYear and WeekNumber right after Title, so they can be set in the grid. Week label last (read-only). */
export const UPCOMING_VIEW_FIELDS = ['LinkTitle', 'QuizYear', 'WeekNumber', 'ChoiceA', 'ChoiceB', 'ChoiceC', 'ChoiceD', 'CorrectChoice', 'Justification', 'IsActive', 'WeekLabel'];
/** Columns the default (All Items) view of Questions should have. Missing ones are added; nothing is removed. */
export const QUESTIONS_DEFAULT_VIEW_FIELDS = UPCOMING_VIEW_FIELDS;
/** These must come right after Title in both views. */
export const QUESTIONS_WEEK_FIELDS = ['QuizYear', 'WeekNumber'];
export const UPCOMING_VIEW_QUERY =
  "<Where><Geq><FieldRef Name='WeekStart' /><Value Type='DateTime'><Today OffsetDays='-6' /></Value></Geq></Where>" +
  "<OrderBy><FieldRef Name='QuizYear' Ascending='TRUE' /><FieldRef Name='WeekNumber' Ascending='TRUE' /></OrderBy>";
export const UPCOMING_VIEW_ROW_LIMIT = 100;

export const CONFIG_FIELDS: IFieldDefinition[] = [
  f('AnonymityMode', choiceXml('AnonymityMode', 'AnonymityMode', ['Anonymous', 'Named'], 'Anonymous')),
  f('ShowCorrectAnswer', yesNoXml('ShowCorrectAnswer', 'ShowCorrectAnswer', '1')),
  f('ShowJustification', yesNoXml('ShowJustification', 'ShowJustification', '1')),
  f('Animations', yesNoXml('Animations', 'Animations', '1')),
  f('ResponsesSiteUrl', textXml('ResponsesSiteUrl', 'ResponsesSiteUrl')),
  f('ResponsesListTitle', textXml('ResponsesListTitle', 'ResponsesListTitle')),
  f('QuestionsListTitle', textXml('QuestionsListTitle', 'QuestionsListTitle')),
  f('BannerTitle', textXml('BannerTitle', 'BannerTitle', false, 80)),
  f('IntroText', textXml('IntroText', 'IntroText')),
  f('NoQuizText', textXml('NoQuizText', 'NoQuizText'))
];

export const RESPONSES_FIELDS: IFieldDefinition[] = [
  f('QuestionId', "<Field Type='Number' Name='QuestionId' StaticName='QuestionId' DisplayName='QuestionId' Required='TRUE' Decimals='0' Min='1' />", true),
  f('WeekKey', textXml('WeekKey', 'WeekKey', false, 10), true),
  f('Choice', choiceXml('Choice', 'Choice', ['A', 'B', 'C', 'D'])),
  f('IsCorrect', yesNoXml('IsCorrect', 'IsCorrect', '')),
  f('Source', choiceXml('Source', 'Source', ['WebPart', 'Copilot'])),
  f('Respondent', "<Field Type='User' Name='Respondent' StaticName='Respondent' DisplayName='Respondent' UserSelectionMode='PeopleOnly' Description='Written only in Named mode.' />")
];

/** Default view of the Responses list: answer columns only, no Created By / Modified By. */
export const RESPONSES_VIEW_FIELDS = ['LinkTitle', 'WeekKey', 'QuestionId', 'Choice', 'IsCorrect', 'Source'];

/** SP.List settings for the Responses list (Set-PnPList in the script). */
export const RESPONSES_LIST_SETTINGS = {
  ReadSecurity: 2, // AllUsersReadAccessOnItemsTheyCreate
  WriteSecurity: 2, // WriteOnlyMyItems
  EnableVersioning: false,
  EnableAttachments: false,
  NoCrawl: true
};

/** SP.AddFieldOptions.AddFieldInternalNameHint, as PnP's Add-PnPFieldFromXml uses (keeps Name as the internal name). */
export const ADD_FIELD_INTERNAL_NAME_HINT = 8;
/** SP.RoleType: Contributor (Contribute) and Administrator (Full Control). Looked up by type so it works in any site language. */
export const ROLE_TYPE_CONTRIBUTOR = 3;
export const ROLE_TYPE_ADMINISTRATOR = 5;
export const GENERIC_LIST_TEMPLATE = 100;

/** "Everyone except external users" claim, as in the script. */
export function everyoneExceptExternalClaim(tenantId: string): string {
  return `c:0-.f|rolemanager|spo-grid-all-users/${tenantId}`;
}

// ------------------------------------------------------------------ permissions

/** SP.PermissionKind values used for gating. */
export const PermissionKind = {
  ManageLists: 12,
  ManagePermissions: 25,
  ManageWeb: 31
} as const;

export interface IBasePermissions {
  High: number | string;
  Low: number | string;
}

/** Same bit test as SP.BasePermissions.has(): kinds 1-32 live in Low, 33-64 in High. */
export function hasPermission(perms: IBasePermissions | undefined, kind: number): boolean {
  if (!perms || kind < 1 || kind > 64) {
    return false;
  }
  const bit = kind - 1;
  const word = bit < 32 ? Number(perms.Low) : Number(perms.High);
  if (!isFinite(word)) {
    return false;
  }
  // Values above 2^31 come back as strings ("4294967295"); >>> 0 keeps the unsigned 32-bit pattern.
  return ((word >>> 0) & (1 << (bit % 32))) !== 0;
}

// ------------------------------------------------------------------ field upgrade (SchemaXml)

const ATTRIBUTE = /\s([\w:.-]+)=(["'])(.*?)\2/g;

/** Replaces (or appends) one attribute on an opening tag. No dynamic RegExp. */
function setAttribute(tag: string, name: string, value: string): { tag: string; changed: boolean } {
  ATTRIBUTE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTRIBUTE.exec(tag))) {
    if (m[1] === name) {
      if (m[3] === value) {
        return { tag, changed: false };
      }
      return { tag: tag.slice(0, m.index) + ` ${name}="${escapeXml(value)}"` + tag.slice(m.index + m[0].length), changed: true };
    }
  }
  const end = /\s*\/?>$/.exec(tag)!;
  return { tag: `${tag.slice(0, end.index)} ${name}="${escapeXml(value)}"${end[0].trim() === '/>' ? ' />' : '>'}`, changed: true };
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Returns the SchemaXml with the wanted attributes and DefaultFormula, or undefined when it already matches.
 * Only the root <Field> element's attributes and its <DefaultFormula> child are touched.
 */
export function upgradeFieldSchemaXml(schemaXml: string, upgrade: IFieldUpgrade): string | undefined {
  const open = /^\s*<Field\b[^>]*?(\/?)>/.exec(schemaXml);
  if (!open) {
    return undefined;
  }
  let tag = open[0];
  const selfClosing = open[1] === '/';
  let changed = false;
  const attrs = upgrade.attributes || {};
  Object.keys(attrs).forEach((name) => {
    const r = setAttribute(tag, name, attrs[name]);
    tag = r.tag;
    changed = changed || r.changed;
  });
  let rest = schemaXml.slice(open.index + open[0].length);
  if (upgrade.defaultFormula) {
    const element = `<DefaultFormula>${escapeXml(upgrade.defaultFormula)}</DefaultFormula>`;
    const existing = /<DefaultFormula>([\s\S]*?)<\/DefaultFormula>/.exec(selfClosing ? '' : rest);
    if (existing) {
      if (existing[1].replace(/&amp;/g, '&') !== upgrade.defaultFormula) {
        rest = rest.replace(existing[0], element);
        changed = true;
      }
    } else if (selfClosing) {
      tag = tag.replace(/\s*\/>$/, '>');
      rest = `${element}</Field>${rest}`;
      changed = true;
    } else {
      rest = `${element}${rest}`;
      changed = true;
    }
  }
  return changed ? schemaXml.slice(0, open.index) + tag + rest : undefined;
}
