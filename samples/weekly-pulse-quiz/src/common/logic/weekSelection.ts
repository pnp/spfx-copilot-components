import type { IQuizQuestion } from '../models';
import type { IIsoWeek } from './isoWeek';
import { weekKey } from './isoWeek';

export interface IQuestionCandidate extends IQuizQuestion {
  isActive: boolean;
}

export interface IWeekSelection {
  question?: IQuizQuestion;
  /** True when the shown question was scheduled for an earlier week (no new one yet). */
  isCarryOver: boolean;
  /** How many active questions share the shown question's week (more than 1 is an editor mistake). */
  sameWeekCount: number;
}

/**
 * Show the active question with the largest (QuizYear, WeekNumber) that is not in the future.
 * Ties within a week: the newest item (highest ID) wins. Future weeks are never shown.
 */
export function selectQuestionForWeek(candidates: IQuestionCandidate[], current: IIsoWeek): IWeekSelection {
  const eligible = candidates
    .filter((c) => c.isActive && c.week >= 1 && c.week <= 53 && weekKey(c.year, c.week) <= current.key)
    .sort((a, b) => weekKey(b.year, b.week) - weekKey(a.year, a.week) || b.id - a.id);
  if (eligible.length === 0) {
    return { question: undefined, isCarryOver: false, sameWeekCount: 0 };
  }
  const top = eligible[0];
  const topKey = weekKey(top.year, top.week);
  const { isActive, ...question } = top; // eslint-disable-line @typescript-eslint/no-unused-vars
  return {
    question,
    isCarryOver: topKey < current.key,
    sameWeekCount: eligible.filter((c) => weekKey(c.year, c.week) === topKey).length
  };
}

/** Server-side OData filter that mirrors selectQuestionForWeek (uses the indexed QuizYear/WeekNumber columns). */
export function buildQuestionsFilter(current: IIsoWeek): string {
  return `IsActive eq 1 and (QuizYear lt ${current.year} or (QuizYear eq ${current.year} and WeekNumber le ${current.week}))`;
}

export const QUESTIONS_ORDER_BY = 'QuizYear desc,WeekNumber desc,ID desc';
