import { evaluateAnswer } from '../logic/feedback';
import { buildResponsePayload } from '../logic/payloads';
import type { IQuizQuestion } from '../models';

const question: IQuizQuestion = {
  id: 42,
  title: 'Q',
  year: 2027,
  week: 1,
  choices: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }],
  correctChoice: 'B',
  justification: ''
};
const opts = { showCorrectAnswer: true, showJustification: true };

describe('buildResponsePayload', () => {
  it('anonymous mode never writes an identity column', () => {
    const p = buildResponsePayload(question, evaluateAnswer(question, 'B', opts), 'Anonymous', 'WebPart', 17);
    expect(p).toEqual({ Title: '2027-W01 #42', QuestionId: 42, WeekKey: '2027-W01', Choice: 'B', IsCorrect: true, Source: 'WebPart' });
    expect(JSON.stringify(p)).not.toMatch(/Respondent/);
  });

  it('named mode writes the Respondent person column', () => {
    const p = buildResponsePayload(question, evaluateAnswer(question, 'A', opts), 'Named', 'Copilot', 17);
    expect(p.RespondentId).toBe(17);
    expect(p.IsCorrect).toBe(false);
    expect(p.Source).toBe('Copilot');
  });

  it('named mode without a valid user id writes no identity', () => {
    expect(buildResponsePayload(question, evaluateAnswer(question, 'A', opts), 'Named', 'WebPart', 0).RespondentId).toBeUndefined();
  });

  it('polls leave IsCorrect empty', () => {
    const poll = { ...question, correctChoice: undefined };
    const p = buildResponsePayload(poll, evaluateAnswer(poll, 'A', opts), 'Anonymous', 'WebPart');
    expect(p).not.toHaveProperty('IsCorrect');
    expect(p.WeekKey).toBe('2027-W01');
  });
});
