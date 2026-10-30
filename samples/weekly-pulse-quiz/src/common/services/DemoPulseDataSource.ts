import type { IFeedback } from '../logic/feedback';
import type { IIsoWeek } from '../logic/isoWeek';
import type { IWeekSelection } from '../logic/weekSelection';
import { selectQuestionForWeek } from '../logic/weekSelection';
import type { IQuizQuestion, IStoredResponse } from '../models';
import type { IDemoSetupState } from '../setup/DemoListSetup';
import type { IPulseDataSource } from './IPulseDataSource';
import { PulseError } from './IPulseDataSource';
import { getDemoQuestions } from './demoQuestions';

export type DemoScenario = 'quiz' | 'no-justification' | 'poll' | 'no-quiz' | 'answered' | 'save-error' | 'not-set-up';

/** Local workbench and preview data. Nothing leaves the browser. */
export class DemoPulseDataSource implements IPulseDataSource {
  public readonly isDemo: boolean = true;
  private _answer: IStoredResponse | undefined;

  public constructor(
    private readonly _scenario: DemoScenario = 'quiz',
    private readonly _latencyMs: number = 150,
    /** 'not-set-up': the lists are missing until DemoListSetup sets `ready`. */
    private readonly _setupState: IDemoSetupState = { ready: false }
  ) {}

  public async loadQuestion(current: IIsoWeek): Promise<IWeekSelection> {
    await this._wait();
    if (this._scenario === 'not-set-up' && !this._setupState.ready) {
      throw new PulseError('questions-list-missing', 'Demo: the Questions list does not exist yet.');
    }
    if (this._scenario === 'no-quiz') {
      return { question: undefined, isCarryOver: false, sameWeekCount: 0 };
    }
    const all = getDemoQuestions(current);
    const pick = this._scenario === 'poll' ? all.poll : this._scenario === 'no-justification' ? all.noJustification : all.quiz;
    return selectQuestionForWeek([{ ...pick, isActive: true }], current);
  }

  /** Demo: in the no-quiz scenario, two questions were added in the grid without a week. */
  public async countUnscheduled(): Promise<number> {
    await this._wait();
    return this._scenario === 'no-quiz' ? 2 : 0;
  }

  public async getMyResponse(question: IQuizQuestion): Promise<IStoredResponse | undefined> {
    await this._wait();
    if (this._scenario === 'answered' && !this._answer) {
      return { id: 1, questionId: question.id, choice: 'B', isCorrect: question.correctChoice === 'B' };
    }
    return this._answer;
  }

  public async submitResponse(question: IQuizQuestion, feedback: IFeedback): Promise<void> {
    await this._wait();
    if (this._scenario === 'save-error') {
      throw new Error('Demo: the Responses list could not be reached.');
    }
    this._answer = { id: 1, questionId: question.id, choice: feedback.chosen, isCorrect: feedback.outcome === 'poll' ? undefined : feedback.outcome === 'correct' };
  }

  private _wait(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this._latencyMs));
  }
}
