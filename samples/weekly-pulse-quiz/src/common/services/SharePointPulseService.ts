import type { SpValue } from '../logic/spNull';
import type { IConfigRow } from '../logic/config';
import type { IFeedback } from '../logic/feedback';
import { cleanJustification } from '../logic/feedback';
import type { IIsoWeek } from '../logic/isoWeek';
import { buildResponsePayload } from '../logic/payloads';
import { odataString } from '../logic/siteUrl';
import type { IQuestionCandidate, IWeekSelection } from '../logic/weekSelection';
import { buildQuestionsFilter, QUESTIONS_ORDER_BY, selectQuestionForWeek } from '../logic/weekSelection';
import type { ChoiceKey, HostKind, IPulseSettings, IQuizQuestion, IStoredResponse } from '../models';
import { CHOICE_KEYS, DEFAULT_CONFIG_LIST } from '../models';
import type { IHttpClient, IHttpResponse } from './http';
import { JSON_HEADERS, readErrorMessage } from './http';
import type { IConfigSource, IPulseDataSource } from './IPulseDataSource';
import { PulseError } from './IPulseDataSource';

interface IQuestionItem {
  Id: number;
  Title?: SpValue<string>;
  QuizYear?: SpValue<number>;
  WeekNumber?: SpValue<number>;
  ChoiceA?: SpValue<string>;
  ChoiceB?: SpValue<string>;
  ChoiceC?: SpValue<string>;
  ChoiceD?: SpValue<string>;
  CorrectChoice?: SpValue<string>;
  Justification?: SpValue<string>;
  IsActive?: SpValue<boolean>;
}

interface IResponseItem {
  Id: number;
  QuestionId?: SpValue<number>;
  Choice?: SpValue<string>;
  IsCorrect?: SpValue<boolean>;
}

function asChoice(value: SpValue<string>): ChoiceKey | undefined {
  const v = (value || '').trim().toUpperCase();
  return (CHOICE_KEYS as string[]).indexOf(v) >= 0 ? (v as ChoiceKey) : undefined;
}

export function mapQuestionItem(item: IQuestionItem): IQuestionCandidate {
  const texts: { [key: string]: string } = {
    A: (item.ChoiceA || '').trim(),
    B: (item.ChoiceB || '').trim(),
    C: (item.ChoiceC || '').trim(),
    D: (item.ChoiceD || '').trim()
  };
  const choices = CHOICE_KEYS.filter((k) => !!texts[k]).map((k) => ({ key: k, text: texts[k] }));
  const correct = asChoice(item.CorrectChoice);
  return {
    id: item.Id,
    title: (item.Title || '').trim(),
    year: Number(item.QuizYear) || 0,
    week: Number(item.WeekNumber) || 0,
    choices,
    // A correct choice that points at an empty option is treated as a poll rather than an unwinnable quiz.
    correctChoice: correct && texts[correct] ? correct : undefined,
    justification: cleanJustification(item.Justification),
    isActive: item.IsActive !== false
  };
}

function listItemsUrl(siteUrl: string, listTitle: string): string {
  return `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(odataString(listTitle))}')/items`;
}

export function buildQuestionsUrl(siteUrl: string, listTitle: string, current: IIsoWeek): string {
  const select = 'Id,Title,QuizYear,WeekNumber,ChoiceA,ChoiceB,ChoiceC,ChoiceD,CorrectChoice,Justification,IsActive';
  return (
    `${listItemsUrl(siteUrl, listTitle)}?$select=${select}` +
    `&$filter=${encodeURIComponent(buildQuestionsFilter(current))}` +
    `&$orderby=${encodeURIComponent(QUESTIONS_ORDER_BY)}&$top=5`
  );
}

/** Questions that can never show: no QuizYear or no WeekNumber. Id only, at most 100. */
export const UNSCHEDULED_LIMIT = 100;
export function buildUnscheduledUrl(siteUrl: string, listTitle: string): string {
  const filter = '(QuizYear eq null) or (WeekNumber eq null)';
  return `${listItemsUrl(siteUrl, listTitle)}?$select=Id&$filter=${encodeURIComponent(filter)}&$top=${UNSCHEDULED_LIMIT}`;
}

export function buildMyResponseUrl(siteUrl: string, listTitle: string, questionId: number, userId: number): string {
  const filter = `QuestionId eq ${Math.floor(questionId)} and AuthorId eq ${Math.floor(userId)}`;
  return `${listItemsUrl(siteUrl, listTitle)}?$select=Id,QuestionId,Choice,IsCorrect&$filter=${encodeURIComponent(filter)}&$top=1`;
}

async function ensureOk(response: IHttpResponse, missingKind: 'questions-list-missing' | 'responses-list-missing', listTitle: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const message = await readErrorMessage(response);
  if (response.status === 404) {
    throw new PulseError(missingKind, `The list "${listTitle}" was not found. ${message}`);
  }
  if (response.status === 401 || response.status === 403) {
    throw new PulseError('forbidden', `You don't have access to "${listTitle}". ${message}`);
  }
  throw new PulseError('failed', message);
}

export class SharePointPulseService implements IPulseDataSource, IConfigSource {
  public readonly isDemo: boolean = false;
  private _userId: number | undefined;

  public constructor(
    private readonly _http: IHttpClient,
    private readonly _settings: IPulseSettings,
    private readonly _source: HostKind
  ) {}

  public async loadQuestion(current: IIsoWeek): Promise<IWeekSelection> {
    const s = this._settings;
    const response = await this._http.get(buildQuestionsUrl(s.questionsSiteUrl, s.questionsListTitle, current), JSON_HEADERS);
    await ensureOk(response, 'questions-list-missing', s.questionsListTitle);
    const body = (await response.json()) as { value?: IQuestionItem[] };
    const candidates = (body.value || []).map(mapQuestionItem).filter((q) => q.title && q.choices.length >= 2);
    return selectQuestionForWeek(candidates, current);
  }

  public async countUnscheduled(): Promise<number> {
    const s = this._settings;
    const response = await this._http.get(buildUnscheduledUrl(s.questionsSiteUrl, s.questionsListTitle), JSON_HEADERS);
    await ensureOk(response, 'questions-list-missing', s.questionsListTitle);
    const body = (await response.json()) as { value?: { Id: number }[] };
    return (body.value || []).length;
  }

  public async getMyResponse(question: IQuizQuestion): Promise<IStoredResponse | undefined> {
    const s = this._settings;
    const userId = await this._currentUserId();
    const response = await this._http.get(buildMyResponseUrl(s.responsesSiteUrl, s.responsesListTitle, question.id, userId), JSON_HEADERS);
    await ensureOk(response, 'responses-list-missing', s.responsesListTitle);
    const body = (await response.json()) as { value?: IResponseItem[] };
    const item = (body.value || [])[0];
    const choice = item ? asChoice(item.Choice) : undefined;
    if (!item || !choice) {
      return undefined;
    }
    return {
      id: item.Id,
      questionId: Number(item.QuestionId) || question.id,
      choice,
      isCorrect: typeof item.IsCorrect === 'boolean' ? item.IsCorrect : undefined
    };
  }

  public async submitResponse(question: IQuizQuestion, feedback: IFeedback): Promise<void> {
    const s = this._settings;
    const respondentId = s.anonymityMode === 'Named' ? await this._currentUserId() : undefined;
    const payload = buildResponsePayload(question, feedback, s.anonymityMode, this._source, respondentId);
    const response = await this._http.post(listItemsUrl(s.responsesSiteUrl, s.responsesListTitle), JSON_HEADERS, JSON.stringify(payload));
    await ensureOk(response, 'responses-list-missing', s.responsesListTitle);
  }

  public async loadConfigRow(siteUrl: string): Promise<IConfigRow | undefined> {
    try {
      const response = await this._http.get(`${listItemsUrl(siteUrl, DEFAULT_CONFIG_LIST)}?$top=1&$orderby=ID asc`, JSON_HEADERS);
      if (!response.ok) {
        return undefined; // Missing config list = built-in defaults.
      }
      const body = (await response.json()) as { value?: IConfigRow[] };
      return (body.value || [])[0];
    } catch {
      return undefined;
    }
  }

  /** The user id is per site collection, so it is read from the Responses site. */
  private async _currentUserId(): Promise<number> {
    if (this._userId === undefined) {
      const response = await this._http.get(`${this._settings.responsesSiteUrl}/_api/web/currentuser?$select=Id`, JSON_HEADERS);
      await ensureOk(response, 'responses-list-missing', 'current user');
      const body = (await response.json()) as { Id?: number };
      this._userId = Number(body.Id) || 0;
    }
    return this._userId;
  }
}
