import type { IWizardField } from '../models';

export function field(partial: Partial<IWizardField> & { internalName: string }): IWizardField {
  return {
    title: partial.internalName,
    kind: 'text',
    required: false,
    description: '',
    maxLength: 255,
    choices: [],
    richText: false,
    ...partial
  };
}

export const FIELDS: IWizardField[] = [
  field({ internalName: 'Title', title: 'What do you need?', required: true }),
  field({ internalName: 'Category', title: 'Category', kind: 'choice', required: true, choices: ['Hardware', 'Software'] }),
  field({ internalName: 'Details', title: 'Details', kind: 'note', maxLength: 63999 }),
  field({ internalName: 'NeededBy', title: 'Needed by', kind: 'date', maxLength: 10 })
];

/** v1.1: date + time and multi-choice steps. */
export const V11_FIELDS: IWizardField[] = [
  field({ internalName: 'Title', title: 'What went wrong?', required: true }),
  field({ internalName: 'Devices', title: 'Which devices are affected?', kind: 'multichoice', required: true, choices: ['Laptop', 'Phone', 'Monitor', 'Headset'] }),
  field({ internalName: 'StartedAt', title: 'When did it start?', kind: 'datetime', required: true, maxLength: 16 }),
  field({ internalName: 'Seen', title: 'Last seen', kind: 'datetime', maxLength: 16 }),
  field({ internalName: 'Extras', title: 'Extras', kind: 'multichoice', choices: ['Dock', 'Charger'] })
];
