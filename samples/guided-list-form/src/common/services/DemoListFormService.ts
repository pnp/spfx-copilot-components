import type { Answers, IFormSchema, ISubmitResult } from '../models';
import { buildFormSchema, type IRawField } from '../logic/fieldTypes';
import { buildItemPayload } from '../logic/payload';
import { pickReconcileField, valuesEqual } from '../logic/reconcileSubmit';
import { ListFormError, type IListFormService } from './IListFormService';

export type DemoScenario = 'request' | 'equipment' | 'blocked' | 'save-error' | 'library' | 'not-found' | 'milestones' | 'expenses';

export const DEMO_FIELDS: IRawField[] = [
  { InternalName: 'Title', Title: 'What do you need?', TypeAsString: 'Text', Required: true, MaxLength: 255, Description: 'A short summary, for example \u201cNew laptop\u201d.' },
  { InternalName: 'Category', Title: 'Category', TypeAsString: 'Choice', Required: true, Choices: ['Hardware', 'Software', 'Access and accounts', 'Something else'] },
  { InternalName: 'Details', Title: 'Tell us a bit more', TypeAsString: 'Note', Required: false, RichText: false, Description: 'Optional. Anything that helps us help you.' },
  { InternalName: 'NeededBy', Title: 'When do you need it by?', TypeAsString: 'DateTime', DisplayFormat: 0, Required: false },
  { InternalName: 'Owner', Title: 'Owner', TypeAsString: 'User', Required: false },
  { InternalName: 'ContentType', Title: 'Content Type', TypeAsString: 'Computed', Required: false }
];

/** v1.1 sample: an incident list with a date-and-time column and a multi-choice column. */
export const DEMO_EQUIPMENT_FIELDS: IRawField[] = [
  { InternalName: 'Title', Title: 'What went wrong?', TypeAsString: 'Text', Required: true, MaxLength: 255, Description: 'A short summary, for example \u201cScreen flickers\u201d.' },
  { InternalName: 'Devices', Title: 'Which devices are affected?', TypeAsString: 'MultiChoice', Required: true, Choices: ['Laptop', 'Phone', 'Monitor', 'Headset'], FillInChoice: true },
  { InternalName: 'StartedAt', Title: 'When did it start?', TypeAsString: 'DateTime', DisplayFormat: 1, Required: true, Description: 'Your best guess is fine.' },
  { InternalName: 'Urgency', Title: 'How urgent is it?', TypeAsString: 'Choice', Required: false, Choices: ['Low', 'Normal', 'High'] }
];

/** v1.4 sample: Yes/No, number and a due date, used by the milestones preview. */
export const DEMO_MILESTONE_FIELDS: IRawField[] = [
  { InternalName: 'Title', Title: 'Title', TypeAsString: 'Text', Required: true, MaxLength: 255, Description: 'A short name for the milestone.' },
  { InternalName: 'OnTrack', Title: 'Is this on track?', TypeAsString: 'Boolean', Required: true, Description: 'Yes if work is on schedule.' },
  { InternalName: 'EffortDays', Title: 'Estimated days', TypeAsString: 'Number', Required: false, Description: 'A rough number of days of work left.' },
  { InternalName: 'DueDate', Title: 'Due date', TypeAsString: 'DateTime', DisplayFormat: 0, Required: true, Description: 'When this should be done.' }
];

/** v1.4.1 sample: Currency and Hyperlink (URL format) columns. */
export const DEMO_EXPENSE_FIELDS: IRawField[] = [
  { InternalName: 'Title', Title: 'What is this for?', TypeAsString: 'Text', Required: true, MaxLength: 255, Description: 'A short name, for example “Travel to Malmö”.' },
  { InternalName: 'Amount', Title: 'Amount', TypeAsString: 'Currency', Required: true, CurrencyLocaleId: 1033, Description: 'The amount in this column’s currency.' },
  { InternalName: 'Receipt', Title: 'Link to the receipt', TypeAsString: 'URL', DisplayFormat: 0, Required: false, Description: 'An https link to the receipt or ticket.' }
];

/** Map a picked list title to the local demo schema (unknown titles look like a missing list). */
export function demoScenarioFromListTitle(title: string): DemoScenario {
  const t = (title || '').trim().toLowerCase();
  if (t === 'equipment issues') {
    return 'equipment';
  }
  if (t === 'lumen milestones' || t === 'project milestones') {
    return 'milestones';
  }
  if (t === 'expense reports' || t === 'expenses') {
    return 'expenses';
  }
  if (!t || t === 'it requests') {
    return 'request';
  }
  return 'not-found';
}

/** Local preview, workbench and tests: sample IT request list, nothing leaves the browser. */
const DEMO_SITE_URL = 'https://fabrikam.sharepoint.com/sites/it';
const demoListUrl = (listTitle: string): string =>
  `${DEMO_SITE_URL}/Lists/${listTitle.replace(/ /g, '')}`;

export class DemoListFormService implements IListFormService {
  public readonly demo: boolean = true;
  public submitted: Answers[] = [];

  public constructor(private readonly _scenario: DemoScenario = 'request', private readonly _delayMs: number = 0, private readonly _fieldsParam?: string, private readonly _itemUrl: string = '') {}

  private _wait(): Promise<void> {
    return this._delayMs > 0 ? new Promise((resolve) => setTimeout(resolve, this._delayMs)) : Promise.resolve();
  }

  public async loadSchema(): Promise<IFormSchema> {
    await this._wait();
    if (this._scenario === 'library') {
      throw new ListFormError('notAList', 'This form works with SharePoint lists, not document libraries or other list types.');
    }
    if (this._scenario === 'not-found') {
      throw new ListFormError('notFound', 'The list wasn\u2019t found on this site.');
    }
    if (this._scenario === 'equipment') {
      return buildFormSchema('Equipment Issues', demoListUrl('Equipment Issues'), DEMO_EQUIPMENT_FIELDS, this._fieldsParam);
    }
    if (this._scenario === 'milestones') {
      return buildFormSchema('Lumen milestones', demoListUrl('Lumen milestones'), DEMO_MILESTONE_FIELDS, this._fieldsParam);
    }
    if (this._scenario === 'expenses') {
      return buildFormSchema('Expense reports', demoListUrl('Expense reports'), DEMO_EXPENSE_FIELDS, this._fieldsParam);
    }
    const fields = this._scenario === 'blocked'
      ? DEMO_FIELDS.concat([{ InternalName: 'Approver', Title: 'Approver', TypeAsString: 'User', Required: true }])
      : DEMO_FIELDS;
    return buildFormSchema('IT Requests', demoListUrl('IT Requests'), fields, this._fieldsParam);
  }

  public async submit(_schema: IFormSchema, answers: Answers): Promise<ISubmitResult> {
    await this._wait();
    if (this._scenario === 'save-error') {
      throw new ListFormError('accessDenied', 'You don\u2019t have access to this list.');
    }
    this.submitted.push(JSON.parse(JSON.stringify(answers)) as Answers);
    return { id: this.submitted.length, itemUrl: this._itemUrl, demo: true };
  }

  public async findSubmittedItem(schema: IFormSchema, answers: Answers, _submittedAt: number): Promise<ISubmitResult | undefined> {
    const wanted = buildItemPayload(schema.fields, answers);
    const field = pickReconcileField(schema.fields, wanted);
    if (!field) {
      return undefined;
    }
    for (let i = this.submitted.length - 1; i >= 0; i--) {
      const got = buildItemPayload(schema.fields, this.submitted[i]);
      if (valuesEqual(field.value, got[field.name])) {
        return { id: i + 1, itemUrl: this._itemUrl, demo: true };
      }
    }
    return undefined;
  }
}
