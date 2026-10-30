import type { AnonymityMode, ChoiceKey, HostKind, IQuizQuestion } from '../models';
import { formatWeekLabel } from './isoWeek';
import type { IFeedback } from './feedback';

export interface IResponsePayload {
  Title: string;
  QuestionId: number;
  WeekKey: string;
  Choice: ChoiceKey;
  /** Left empty for polls. */
  IsCorrect?: boolean;
  Source: HostKind;
  RespondentId?: number;
}

/**
 * Item body for the Responses list. In Anonymous mode no identity column is ever written
 * (Created By still records the author; item-level security hides it from colleagues).
 * In Named mode the respondent is written to the Respondent person column.
 */
export function buildResponsePayload(
  question: IQuizQuestion,
  feedback: IFeedback,
  mode: AnonymityMode,
  source: HostKind,
  respondentId?: number
): IResponsePayload {
  const label = formatWeekLabel(question.year, question.week);
  const payload: IResponsePayload = {
    Title: `${label} #${question.id}`,
    QuestionId: question.id,
    WeekKey: label,
    Choice: feedback.chosen,
    Source: source
  };
  if (feedback.outcome !== 'poll') {
    payload.IsCorrect = feedback.outcome === 'correct';
  }
  if (mode === 'Named' && typeof respondentId === 'number' && respondentId > 0) {
    payload.RespondentId = respondentId;
  }
  return payload;
}
