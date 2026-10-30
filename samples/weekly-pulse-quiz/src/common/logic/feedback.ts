import type { SpValue } from './spNull';
import type { ChoiceKey, IQuizQuestion } from '../models';
import { JUSTIFICATION_MAX_LENGTH, JUSTIFICATION_PREVIEW_LENGTH } from '../models';

export type AnswerOutcome = 'correct' | 'incorrect' | 'poll';

export interface IFeedbackOptions {
  showCorrectAnswer: boolean;
  showJustification: boolean;
}

export interface IFeedback {
  outcome: AnswerOutcome;
  chosen: ChoiceKey;
  /** The option to highlight as right (correct answers, or wrong answers when reveal is on). */
  revealChoice?: ChoiceKey;
  /** "Correct answer: C. Every Thursday" (wrong answers with reveal on). */
  revealText?: string;
  /** Justification to offer (dialog on pages, inline "Why?" panel in Copilot). Empty = none. */
  justification: string;
  /** Dialog / panel title, e.g. "Why C is right". */
  justificationTitle: string;
  headline: string;
  /** Text for the aria-live region. */
  announcement: string;
}

/** Delay before the justification dialog opens, so the result is seen (and announced) first. */
export const JUSTIFICATION_DELAY_MS = 900;

export function cleanJustification(raw: SpValue<string>): string {
  const text = (raw || '').replace(/\r\n/g, '\n').trim();
  if (text.length <= JUSTIFICATION_MAX_LENGTH) {
    return text;
  }
  return `${text.slice(0, JUSTIFICATION_MAX_LENGTH - 1).replace(/\s+$/, '')}\u2026`;
}

export interface IJustificationPreview {
  /** Text shown while collapsed (ends with an ellipsis when cut). */
  preview: string;
  full: string;
  /** True when the text is long enough to need "Read more" / "Show less". */
  isLong: boolean;
}

/** Collapsed preview of a justification, cut on a word boundary near the preview length. */
export function previewJustification(text: string, limit: number = JUSTIFICATION_PREVIEW_LENGTH): IJustificationPreview {
  const full = cleanJustification(text);
  const lines = full.split('\n');
  if (full.length <= limit && lines.length <= 3) {
    return { preview: full, full, isLong: false };
  }
  let cut = lines.slice(0, 3).join('\n');
  if (cut.length > limit) {
    cut = cut.slice(0, limit);
    const space = cut.lastIndexOf(' ');
    if (space > limit * 0.6) {
      cut = cut.slice(0, space);
    }
  }
  return { preview: `${cut.replace(/[\s.,;:]+$/, '')}\u2026`, full, isLong: true };
}

export function choiceText(question: IQuizQuestion, key: ChoiceKey | undefined): string {
  const match = question.choices.filter((c) => c.key === key)[0];
  return match ? match.text : '';
}

export function isPoll(question: IQuizQuestion): boolean {
  return !question.correctChoice;
}

export function evaluateAnswer(question: IQuizQuestion, chosen: ChoiceKey, options: IFeedbackOptions): IFeedback {
  const correct = question.correctChoice;
  if (!correct) {
    return {
      outcome: 'poll',
      chosen,
      justification: '',
      justificationTitle: '',
      headline: 'Thanks for answering',
      announcement: 'Thanks, your answer was saved.'
    };
  }

  const isRight = chosen === correct;
  const reveal = isRight || options.showCorrectAnswer;
  const correctLabel = `${correct}. ${choiceText(question, correct)}`;
  // The justification explains the right answer, so it is only offered when the answer may be revealed.
  const justification = options.showJustification && reveal ? cleanJustification(question.justification) : '';

  if (isRight) {
    return {
      outcome: 'correct',
      chosen,
      revealChoice: correct,
      justification,
      justificationTitle: `Why ${correct} is right`,
      headline: 'Correct',
      announcement: `Correct. ${correctLabel}.`
    };
  }

  return {
    outcome: 'incorrect',
    chosen,
    revealChoice: reveal ? correct : undefined,
    revealText: reveal ? `Correct answer: ${correctLabel}` : undefined,
    justification,
    justificationTitle: `Why ${correct} is right`,
    headline: 'Not quite',
    announcement: reveal ? `Not quite. Correct answer: ${correctLabel}.` : 'Not quite. Your answer was saved.'
  };
}

/** Motion runs only when the Animations setting is on and the OS does not ask for reduced motion. */
export function isMotionEnabled(animationsSetting: boolean, prefersReducedMotion: boolean): boolean {
  return animationsSetting && !prefersReducedMotion;
}

export function prefersReducedMotion(win: Window | undefined): boolean {
  try {
    return !!win && typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export type JustificationPresentation = 'dialog' | 'inline' | 'none';

/** Pages get a dialog after a short delay; Copilot (small iframe) gets an inline "Why?" panel. */
export function justificationPresentation(feedback: IFeedback | undefined, host: 'WebPart' | 'Copilot'): JustificationPresentation {
  if (!feedback || !feedback.justification) {
    return 'none';
  }
  return host === 'Copilot' ? 'inline' : 'dialog';
}
