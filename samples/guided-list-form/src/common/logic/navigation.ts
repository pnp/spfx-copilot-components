import type { AnswerValue, Answers, ISubmitResult, IWizardField } from '../models';
import type { AnswerCheck } from './answerCheck';
import { visibleFields, type ISkipRule } from './jsonProps';
import { answerCheckFor } from './answerCheck';
import { firstInvalidIndex, validateAll, validateValue } from './validation';

export type WizardPhase = 'intro' | 'step' | 'review' | 'done';
export type Direction = 'forward' | 'back';
export type SaveOutcome = 'none' | 'unknown' | 'checking' | 'retryable';

export interface IWizardState {
  phase: WizardPhase;
  index: number;
  direction: Direction;
  answers: Answers;
  errors: Record<string, string>;
  /** Set when a step was opened with Edit from the review step: Next returns to review. */
  returnToReview: boolean;
  submitting: boolean;
  submitError: string;
  /** unknown/checking: a save was sent but the outcome is not confirmed; retryable: checked and no item was found. */
  saveOutcome: SaveOutcome;
  /** Set when the last step's Next should submit straight away (review step turned off). */
  submitRequested: boolean;
  result: ISubmitResult | undefined;
}

export interface IWizardConfig {
  fields: IWizardField[];
  showReview: boolean;
  skipRules?: ISkipRule[];
  answerChecks?: Record<string, AnswerCheck>;
}

export type WizardAction =
  | { type: 'start' }
  | { type: 'setAnswer'; name: string; value: AnswerValue }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'edit'; index: number }
  | { type: 'submitStart' }
  | { type: 'submitSuccess'; result: ISubmitResult }
  | { type: 'submitFailure'; message: string }
  | { type: 'submitUnknown'; message: string }
  | { type: 'submitCheckStart' }
  | { type: 'submitCheckFailed'; message: string }
  | { type: 'submitRetryAllowed'; message: string }
  | { type: 'reset'; answers?: Answers }
  | { type: 'restore'; answers: Answers; phase: WizardPhase; index: number };

export function initialWizardState(answers?: Answers): IWizardState {
  return {
    phase: 'intro',
    index: 0,
    direction: 'forward',
    answers: { ...(answers || {}) },
    errors: {},
    returnToReview: false,
    submitting: false,
    submitError: '',
    saveOutcome: 'none',
    submitRequested: false,
    result: undefined
  };
}

export function visibleFor(config: IWizardConfig, answers: Answers): IWizardField[] {
  return visibleFields(config.fields, answers, config.skipRules);
}

function clampIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, total - 1));
}

/** Pure wizard navigation. Next only advances when the current step is valid. Hidden fields are skipped. */
export function wizardReducer(state: IWizardState, action: WizardAction, config: IWizardConfig): IWizardState {
  const all = config.fields;
  if (state.submitting && action.type !== 'submitSuccess' && action.type !== 'submitFailure' && action.type !== 'submitUnknown') {
    return state;
  }
  switch (action.type) {
    case 'start': {
      if (state.phase !== 'intro' || all.length === 0) {
        return state;
      }
      const visible = visibleFor(config, state.answers);
      if (visible.length === 0) {
        return config.showReview
          ? { ...state, phase: 'review', direction: 'forward' }
          : { ...state, submitRequested: true };
      }
      return { ...state, phase: 'step', index: 0, direction: 'forward' };
    }

    case 'setAnswer': {
      const errors = { ...state.errors };
      delete errors[action.name];
      const answers = { ...state.answers, [action.name]: action.value };
      if (state.phase !== 'step') {
        return { ...state, answers, errors, submitError: '' };
      }
      const before = visibleFor(config, state.answers);
      const current = before[state.index];
      const after = visibleFor(config, answers);
      let index = current ? after.findIndex((f) => f.internalName === current.internalName) : state.index;
      if (index < 0) {
        index = clampIndex(state.index, after.length);
      }
      return { ...state, answers, errors, submitError: '', index };
    }

    case 'next': {
      if (state.phase === 'intro') {
        return wizardReducer(state, { type: 'start' }, config);
      }
      if (state.phase !== 'step') {
        return state;
      }
      const visible = visibleFor(config, state.answers);
      const field = visible[state.index];
      const error = field ? validateValue(field, state.answers[field.internalName], answerCheckFor(field, config.answerChecks)) : undefined;
      if (field && error) {
        return { ...state, errors: { ...state.errors, [field.internalName]: error } };
      }
      if (state.returnToReview && config.showReview) {
        return { ...state, phase: 'review', direction: 'forward', returnToReview: false };
      }
      if (state.index < visible.length - 1) {
        return { ...state, index: state.index + 1, direction: 'forward' };
      }
      if (config.showReview) {
        return { ...state, phase: 'review', direction: 'forward' };
      }
      const invalid = firstInvalidIndex(visible, state.answers, config.answerChecks);
      if (invalid >= 0) {
        return { ...state, index: invalid, direction: 'back', errors: validateAll(visible, state.answers, config.answerChecks) };
      }
      return { ...state, submitRequested: true };
    }

    case 'back': {
      const visible = visibleFor(config, state.answers);
      if (state.phase === 'review') {
        return { ...state, phase: 'step', index: Math.max(0, visible.length - 1), direction: 'back', returnToReview: false };
      }
      if (state.phase === 'step') {
        if (state.index > 0) {
          return { ...state, index: state.index - 1, direction: 'back' };
        }
        return { ...state, phase: 'intro', direction: 'back', returnToReview: false };
      }
      return state;
    }

    case 'edit': {
      const visible = visibleFor(config, state.answers);
      if (state.phase !== 'review' || action.index < 0 || action.index >= visible.length) {
        return state;
      }
      return { ...state, phase: 'step', index: action.index, direction: 'back', returnToReview: true };
    }

    case 'submitStart': {
      if (state.saveOutcome === 'unknown' || state.saveOutcome === 'checking') {
        return state;
      }
      if (state.phase !== 'review' && !state.submitRequested) {
        return state;
      }
      const visible = visibleFor(config, state.answers);
      const errors = validateAll(visible, state.answers, config.answerChecks);
      if (Object.keys(errors).length > 0) {
        return { ...state, phase: 'step', index: firstInvalidIndex(visible, state.answers, config.answerChecks), direction: 'back', errors, submitRequested: false, returnToReview: config.showReview, saveOutcome: 'none' };
      }
      return { ...state, submitting: true, submitError: '', submitRequested: false, saveOutcome: 'none' };
    }

    case 'submitSuccess':
      return { ...state, submitting: false, saveOutcome: 'none', submitError: '', phase: 'done', direction: 'forward', result: action.result };

    case 'submitFailure':
      return { ...state, submitting: false, saveOutcome: 'none', submitError: action.message || 'Something went wrong. Please try again.' };

    case 'submitUnknown':
      if (!state.submitting) {
        return state;
      }
      return { ...state, submitting: false, saveOutcome: 'unknown', submitError: action.message };

    case 'submitCheckStart':
      if (state.saveOutcome !== 'unknown' || state.submitting) {
        return state;
      }
      return { ...state, saveOutcome: 'checking' };

    case 'submitCheckFailed':
      if (state.saveOutcome !== 'checking') {
        return state;
      }
      return { ...state, saveOutcome: 'unknown', submitError: action.message };

    case 'submitRetryAllowed':
      if (state.saveOutcome !== 'checking' && state.saveOutcome !== 'unknown') {
        return state;
      }
      return { ...state, saveOutcome: 'retryable', submitError: action.message };

    case 'reset':
      return initialWizardState(action.answers);

    case 'restore': {
      const answers = { ...(action.answers || {}) };
      const visible = visibleFor(config, answers);
      const phase = action.phase === 'done' ? 'intro' : action.phase;
      const index = phase === 'step' ? clampIndex(action.index, visible.length) : 0;
      return {
        ...initialWizardState(answers),
        phase: visible.length === 0 && phase === 'step' ? (config.showReview ? 'review' : 'intro') : phase,
        index,
        direction: 'forward'
      };
    }

    default:
      return state;
  }
}

/** Position for the progress bar: 0 on the intro, n/N on step n+1, 1 on review and done. */
export function progressValue(state: IWizardState, total: number): number {
  if (total <= 0 || state.phase === 'intro') {
    return 0;
  }
  if (state.phase === 'step') {
    return Math.min(1, state.index / total);
  }
  return 1;
}

/** A stable key for the visible screen (drives transitions and focus). */
export function screenKey(state: IWizardState): string {
  return state.phase === 'step' ? `step-${state.index}` : state.phase;
}

export function canRetrySave(state: IWizardState): boolean {
  return !state.submitting && state.saveOutcome !== 'unknown' && state.saveOutcome !== 'checking';
}

export function isSaveUnconfirmed(state: IWizardState): boolean {
  return state.saveOutcome === 'unknown' || state.saveOutcome === 'checking';
}
