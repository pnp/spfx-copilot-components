import { evaluateAnswer } from '../logic/feedback';
import { isoWeekOfDate } from '../logic/isoWeek';
import type { IPulseSettings, IQuizQuestion } from '../models';
import { DEFAULT_SETTINGS } from '../models';
import type { IHttpClient, IHttpResponse } from '../services/http';
import { PulseError } from '../services/IPulseDataSource';
import { buildMyResponseUrl, mapQuestionItem, SharePointPulseService } from '../services/SharePointPulseService';

function res(status: number, body: unknown): IHttpResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

class FakeHttpClient implements IHttpClient {
  public calls: { method: string; url: string; body?: string }[] = [];
  public constructor(private readonly _route: (method: string, url: string) => IHttpResponse) {}
  public async get(url: string): Promise<IHttpResponse> {
    this.calls.push({ method: 'GET', url });
    return this._route('GET', url);
  }
  public async post(url: string, _headers: Record<string, string>, body: string): Promise<IHttpResponse> {
    this.calls.push({ method: 'POST', url, body });
    return this._route('POST', url);
  }
}

const settings: IPulseSettings = {
  ...DEFAULT_SETTINGS,
  questionsSiteUrl: 'https://fabrikam.sharepoint.com/sites/intranet',
  responsesSiteUrl: 'https://fabrikam.sharepoint.com/sites/pulse'
};
const w44 = isoWeekOfDate({ year: 2026, month: 10, day: 29 });
const question: IQuizQuestion = {
  id: 12, title: 'Q', year: 2026, week: 44,
  choices: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }], correctChoice: 'B', justification: ''
};
const opts = { showCorrectAnswer: true, showJustification: true };

describe('mapQuestionItem', () => {
  it('maps SharePoint fields, skipping empty options', () => {
    const q = mapQuestionItem({ Id: 3, Title: ' Q ', QuizYear: 2026, WeekNumber: 44, ChoiceA: 'a', ChoiceB: 'b', ChoiceC: null, ChoiceD: '', CorrectChoice: 'b', Justification: null, IsActive: true });
    expect(q.choices.map((c) => c.key)).toEqual(['A', 'B']);
    expect(q.correctChoice).toBe('B');
    expect(q.title).toBe('Q');
    expect(q.justification).toBe('');
  });

  it('treats a correct choice that points at an empty option as a poll', () => {
    expect(mapQuestionItem({ Id: 3, Title: 'Q', ChoiceA: 'a', ChoiceB: 'b', CorrectChoice: 'D' }).correctChoice).toBeUndefined();
  });

  it('caps the justification at 500 characters', () => {
    expect(mapQuestionItem({ Id: 3, Title: 'Q', Justification: 'y'.repeat(900) }).justification.length).toBe(500);
  });
});

describe('SharePointPulseService', () => {
  it('queries the questions list with the week filter and picks the question', async () => {
    const http = new FakeHttpClient(() =>
      res(200, { value: [{ Id: 9, Title: 'This week', QuizYear: 2026, WeekNumber: 44, ChoiceA: 'a', ChoiceB: 'b', CorrectChoice: 'A', IsActive: true }] })
    );
    const selection = await new SharePointPulseService(http, settings, 'WebPart').loadQuestion(w44);
    expect(selection.question?.id).toBe(9);
    const url = decodeURIComponent(http.calls[0].url);
    expect(url).toContain("https://fabrikam.sharepoint.com/sites/intranet/_api/web/lists/getbytitle('Weekly Pulse Questions')/items");
    expect(url).toContain('QuizYear eq 2026 and WeekNumber le 44');
    expect(url).toContain('$top=5');
  });

  it('editor hint: counts questions with no QuizYear or WeekNumber (Id only, capped)', async () => {
    const http = new FakeHttpClient(() => res(200, { value: [{ Id: 3 }, { Id: 4 }] }));
    expect(await new SharePointPulseService(http, settings, 'WebPart').countUnscheduled()).toBe(2);
    const url = decodeURIComponent(http.calls[0].url);
    expect(url).toContain("/sites/intranet/_api/web/lists/getbytitle('Weekly Pulse Questions')/items?$select=Id&");
    expect(url).toContain('$filter=(QuizYear eq null) or (WeekNumber eq null)&$top=100');
    expect(http.calls.every((c) => c.method === 'GET')).toBe(true);
  });

  it('reports a missing questions list', async () => {
    const http = new FakeHttpClient(() => res(404, { 'odata.error': { message: { value: 'List does not exist.' } } }));
    await expect(new SharePointPulseService(http, settings, 'WebPart').loadQuestion(w44)).rejects.toMatchObject({ kind: 'questions-list-missing' });
  });

  it('reports access problems as forbidden', async () => {
    const http = new FakeHttpClient(() => res(403, {}));
    const error = await new SharePointPulseService(http, settings, 'WebPart').loadQuestion(w44).catch((e: PulseError) => e);
    expect(error).toBeInstanceOf(PulseError);
    expect((error as PulseError).kind).toBe('forbidden');
  });

  it('looks up my earlier answer on the Responses site by QuestionId and AuthorId', async () => {
    const http = new FakeHttpClient((_m, url) =>
      url.indexOf('/currentuser') > 0 ? res(200, { Id: 31 }) : res(200, { value: [{ Id: 5, QuestionId: 12, Choice: 'A', IsCorrect: false }] })
    );
    const mine = await new SharePointPulseService(http, settings, 'WebPart').getMyResponse(question);
    expect(mine).toEqual({ id: 5, questionId: 12, choice: 'A', isCorrect: false });
    expect(http.calls[0].url).toBe('https://fabrikam.sharepoint.com/sites/pulse/_api/web/currentuser?$select=Id');
    expect(decodeURIComponent(http.calls[1].url)).toContain('QuestionId eq 12 and AuthorId eq 31');
    expect(buildMyResponseUrl('https://x.sharepoint.com', 'R', 1.7, 2.2)).toContain(encodeURIComponent('QuestionId eq 1 and AuthorId eq 2'));
  });

  it('anonymous submit writes no identity and does not even read the user', async () => {
    const http = new FakeHttpClient(() => res(201, {}));
    await new SharePointPulseService(http, settings, 'Copilot').submitResponse(question, evaluateAnswer(question, 'B', opts));
    expect(http.calls).toHaveLength(1);
    expect(http.calls[0].url).toBe("https://fabrikam.sharepoint.com/sites/pulse/_api/web/lists/getbytitle('Weekly%20Pulse%20Responses')/items");
    expect(JSON.parse(http.calls[0].body || '{}')).toEqual({ Title: '2026-W44 #12', QuestionId: 12, WeekKey: '2026-W44', Choice: 'B', IsCorrect: true, Source: 'Copilot' });
  });

  it('named submit writes RespondentId', async () => {
    const http = new FakeHttpClient((_m, url) => (url.indexOf('/currentuser') > 0 ? res(200, { Id: 31 }) : res(201, {})));
    await new SharePointPulseService(http, { ...settings, anonymityMode: 'Named' }, 'WebPart').submitResponse(question, evaluateAnswer(question, 'A', opts));
    expect(JSON.parse(http.calls[1].body || '{}').RespondentId).toBe(31);
  });

  it('a failed save rejects so no feedback is shown', async () => {
    const http = new FakeHttpClient(() => res(500, { error: { message: 'Boom' } }));
    await expect(new SharePointPulseService(http, settings, 'WebPart').submitResponse(question, evaluateAnswer(question, 'A', opts))).rejects.toMatchObject({ kind: 'failed', message: 'Boom' });
  });

  it('reads the config row, and a missing config list means defaults', async () => {
    const ok = new FakeHttpClient(() => res(200, { value: [{ AnonymityMode: 'Named' }] }));
    expect(await new SharePointPulseService(ok, settings, 'Copilot').loadConfigRow(settings.questionsSiteUrl)).toEqual({ AnonymityMode: 'Named' });
    expect(ok.calls[0].url).toContain("getbytitle('Weekly%20Pulse%20Config')/items?$top=1");
    const missing = new FakeHttpClient(() => res(404, {}));
    expect(await new SharePointPulseService(missing, settings, 'Copilot').loadConfigRow(settings.questionsSiteUrl)).toBeUndefined();
  });
});
