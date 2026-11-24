import type { IWizardField } from '../models';
import { builtInCheckHint, type AnswerCheck } from './answerCheck';
import { sanitizePlainText } from './config';
import { lookupMap } from './jsonProps';

export interface IFieldGuide {
  hint: string;
  example: string;
}

/** Hint from the SharePoint column description, or a built-in hint for a checked type; example from the optional map. Hidden when both are empty. */
export function fieldGuideFor(field: IWizardField, examples?: Record<string, string>, check?: AnswerCheck): IFieldGuide | undefined {
  const hint = sanitizePlainText(field.description, 500, true) || builtInCheckHint(check);
  const rawExample = lookupMap(examples, field);
  const example = sanitizePlainText(rawExample, 500, true);
  if (!hint && !example) {
    return undefined;
  }
  return { hint, example };
}
