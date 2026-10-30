import type { IConfigRow } from '../logic/config';
import type { IFeedback } from '../logic/feedback';
import type { IIsoWeek } from '../logic/isoWeek';
import type { IWeekSelection } from '../logic/weekSelection';
import type { IQuizQuestion, IStoredResponse } from '../models';

export type PulseErrorKind = 'questions-list-missing' | 'responses-list-missing' | 'forbidden' | 'failed';

export class PulseError extends Error {
  public constructor(public readonly kind: PulseErrorKind, message: string) {
    super(message);
    this.name = 'PulseError';
    // Keep instanceof working when compiled to ES5.
    Object.setPrototypeOf(this, PulseError.prototype);
  }
}

export interface IPulseDataSource {
  /** True for the local workbench / preview: mock questions, nothing is saved. */
  readonly isDemo: boolean;
  loadQuestion(current: IIsoWeek): Promise<IWeekSelection>;
  getMyResponse(question: IQuizQuestion): Promise<IStoredResponse | undefined>;
  submitResponse(question: IQuizQuestion, feedback: IFeedback): Promise<void>;
  /**
   * Editor hint only: how many questions have no QuizYear or no WeekNumber (capped at 100).
   * Optional; the web part skips the hint if it is missing or fails.
   */
  countUnscheduled?(): Promise<number>;
}

export interface IConfigSource {
  loadConfigRow(siteUrl: string): Promise<IConfigRow | undefined>;
}
