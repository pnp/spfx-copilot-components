import type { Answers, IWizardField } from '../models';
import { defaultAnswerCheck, type AnswerCheck } from './answerCheck';
import { findField, type ISkipRule } from './jsonProps';
import { sanitizePlainText } from './config';
import { YES_NO_CHOICES } from './yesNo';

export type ConditionOp = 'is' | 'any' | 'not' | 'answered';

export interface IQuestionCondition {
  when: string;
  op: ConditionOp;
  values: string[];
}

export interface IQuestionDraft {
  internalName: string;
  title: string;
  kind: IWizardField['kind'];
  choices: string[];
  questionText: string;
  example: string;
  conditions: IQuestionCondition[];
  answerCheck: AnswerCheck;
}

export function choicesFor(field: IWizardField): string[] {
  if (field.kind === 'yesno') {
    return YES_NO_CHOICES.slice();
  }
  return (field.choices || []).slice();
}

/** Skip logic can only test earlier Choice, MultiChoice or Yes/No columns that have options. */
export function isSkipWhenField(field: IWizardField | undefined): field is IWizardField {
  return !!field && (field.kind === 'choice' || field.kind === 'multichoice' || field.kind === 'yesno') && choicesFor(field).length > 0;
}

/** Earlier questions that can appear in the "Show only when" dropdown. */
export function whenFieldsBefore(fields: IWizardField[], currentName: string): IWizardField[] {
  return earlierFields(fields, currentName).filter(isSkipWhenField);
}

/**
 * A condition that has a usable "when" column and at least one of that column's options.
 * Incomplete or invalid conditions are dropped (empty values, text columns, unknown options).
 */
export function usableCondition(condition: IQuestionCondition, fields: IWizardField[]): IQuestionCondition | undefined {
  const when = findField(fields, condition.when);
  if (!isSkipWhenField(when)) {
    return undefined;
  }
  const allowed = choicesFor(when);
  const values = (condition.values || []).map((v) => sanitizePlainText(v, 255)).filter((v) => !!v && allowed.indexOf(v) >= 0);
  if (condition.op === 'answered') {
    return { when: when.internalName, op: 'answered', values: [] };
  }
  if (condition.op === 'any') {
    return values.length > 0 ? { when: when.internalName, op: 'any', values } : undefined;
  }
  if (condition.op === 'not') {
    return values[0] ? { when: when.internalName, op: 'not', values: [values[0]] } : undefined;
  }
  return values[0] ? { when: when.internalName, op: 'is', values: [values[0]] } : undefined;
}

function conditionFromRule(r: ISkipRule): IQuestionCondition {
  if (r.answered) {
    return { when: r.when, op: 'answered', values: [] };
  }
  if (r.notEquals) {
    return { when: r.when, op: 'not', values: [r.notEquals] };
  }
  if (r.in && r.in.length > 0) {
    return { when: r.when, op: 'any', values: r.in.slice() };
  }
  return { when: r.when, op: 'is', values: r.equals ? [r.equals] : [] };
}

export function draftsFromConfig(
  fields: IWizardField[],
  questionTexts?: Record<string, string>,
  fieldExamples?: Record<string, string>,
  skipRules?: ISkipRule[],
  answerChecks?: Record<string, AnswerCheck>
): IQuestionDraft[] {
  const rules = skipRules || [];
  return fields.map((field) => {
    const mine = rules.filter((r) => {
      const target = findField(fields, r.show);
      return !!target && target.internalName === field.internalName;
    });
    const conditions: IQuestionCondition[] = mine
      .map(conditionFromRule)
      .map((c) => usableCondition(c, fields))
      .filter((c): c is IQuestionCondition => !!c);
    const stored = (answerChecks && (answerChecks[field.internalName] || answerChecks[field.title])) || undefined;
    return {
      internalName: field.internalName,
      title: field.title,
      kind: field.kind,
      choices: choicesFor(field),
      questionText: (questionTexts && questionTexts[field.internalName]) || (questionTexts && questionTexts[field.title]) || field.title,
      example: (fieldExamples && fieldExamples[field.internalName]) || (fieldExamples && fieldExamples[field.title]) || '',
      conditions,
      answerCheck: stored || defaultAnswerCheck(field)
    };
  });
}

export function draftsToConfig(drafts: IQuestionDraft[], fields: IWizardField[]): {
  questionTexts: Record<string, string>;
  fieldExamples: Record<string, string>;
  skipLogic: ISkipRule[];
  answerChecks: Record<string, AnswerCheck>;
} {
  const questionTexts: Record<string, string> = {};
  const fieldExamples: Record<string, string> = {};
  const skipLogic: ISkipRule[] = [];
  const answerChecks: Record<string, AnswerCheck> = {};
  drafts.forEach((draft) => {
    const field = findField(fields, draft.internalName);
    if (!field) {
      return;
    }
    const question = sanitizePlainText(draft.questionText, 500);
    if (question && question !== field.title) {
      questionTexts[field.internalName] = question;
    }
    const example = sanitizePlainText(draft.example, 500);
    if (example) {
      fieldExamples[field.internalName] = example;
    }
    const check = draft.answerCheck || 'none';
    if (check !== defaultAnswerCheck(field)) {
      answerChecks[field.internalName] = check;
    }
    draft.conditions.forEach((c) => {
      const usable = usableCondition(c, fields);
      if (!usable) {
        return;
      }
      if (usable.op === 'any') {
        skipLogic.push({ show: field.internalName, when: usable.when, in: usable.values });
        return;
      }
      if (usable.op === 'not') {
        skipLogic.push({ show: field.internalName, when: usable.when, notEquals: usable.values[0] });
        return;
      }
      if (usable.op === 'answered') {
        skipLogic.push({ show: field.internalName, when: usable.when, answered: true });
        return;
      }
      skipLogic.push({ show: field.internalName, when: usable.when, equals: usable.values[0] });
    });
  });
  return { questionTexts, fieldExamples, skipLogic, answerChecks };
}

export function earlierFields(fields: IWizardField[], currentName: string): IWizardField[] {
  const index = fields.findIndex((f) => f.internalName === currentName);
  return index <= 0 ? [] : fields.slice(0, index);
}

export function sampleAnswers(fields: IWizardField[]): Answers {
  const answers: Answers = {};
  fields.forEach((field, i) => {
    if (field.kind === 'multichoice' && field.choices[0]) {
      answers[field.internalName] = [field.choices[0]];
      return;
    }
    if (field.choices[0]) {
      answers[field.internalName] = field.choices[0];
      return;
    }
    if (field.kind === 'date' || field.kind === 'datetime') {
      answers[field.internalName] = field.kind === 'datetime' ? '2026-11-16T14:30' : '2026-11-16';
      return;
    }
    if (field.kind === 'number' || field.kind === 'currency') {
      answers[field.internalName] = field.kind === 'currency' ? '25.50' : '3';
      return;
    }
    if (field.kind === 'hyperlink') {
      answers[field.internalName] = { url: 'https://example.com', description: 'Example' };
      return;
    }
    if (i === 0) {
      answers[field.internalName] = 'Monitor flickers';
      return;
    }
    answers[field.internalName] = field.title;
  });
  return answers;
}
