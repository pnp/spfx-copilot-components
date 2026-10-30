import { isoWeekOfDate } from '../logic/isoWeek';
import type { IQuestionCandidate } from '../logic/weekSelection';
import { buildQuestionsFilter, selectQuestionForWeek } from '../logic/weekSelection';

function q(id: number, year: number, week: number, isActive: boolean = true): IQuestionCandidate {
  return { id, title: `Q${id}`, year, week, isActive, choices: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }], correctChoice: 'A', justification: '' };
}

const w43 = isoWeekOfDate({ year: 2026, month: 10, day: 21 });
const w44 = isoWeekOfDate({ year: 2026, month: 10, day: 28 });

describe('selectQuestionForWeek', () => {
  it("shows this week's question", () => {
    const result = selectQuestionForWeek([q(1, 2026, 42), q(2, 2026, 43), q(3, 2026, 44)], w43);
    expect(result.question?.id).toBe(2);
    expect(result.isCarryOver).toBe(false);
    expect(result.sameWeekCount).toBe(1);
  });

  it('never shows a future week', () => {
    expect(selectQuestionForWeek([q(3, 2026, 44), q(4, 2027, 1)], w43).question).toBeUndefined();
  });

  it("carries last week's question over when this week has none", () => {
    const result = selectQuestionForWeek([q(1, 2026, 42), q(2, 2026, 43)], w44);
    expect(result.question?.id).toBe(2);
    expect(result.isCarryOver).toBe(true);
  });

  it('carries a W53 question over into the next ISO year', () => {
    const w01 = isoWeekOfDate({ year: 2027, month: 1, day: 5 });
    const result = selectQuestionForWeek([q(1, 2026, 52), q(2, 2026, 53)], w01);
    expect(result.question?.id).toBe(2);
    expect(result.isCarryOver).toBe(true);
  });

  it('prefers the new year over an older higher week number', () => {
    const w02 = isoWeekOfDate({ year: 2027, month: 1, day: 12 });
    expect(selectQuestionForWeek([q(1, 2026, 53), q(2, 2027, 1)], w02).question?.id).toBe(2);
  });

  it('newest item wins a tie within the same week and reports the duplicate', () => {
    const result = selectQuestionForWeek([q(5, 2026, 43), q(9, 2026, 43), q(7, 2026, 43)], w43);
    expect(result.question?.id).toBe(9);
    expect(result.sameWeekCount).toBe(3);
  });

  it('ignores inactive items and invalid week numbers', () => {
    expect(selectQuestionForWeek([q(1, 2026, 43, false), q(2, 2026, 0), q(3, 2026, 54)], w43).question).toBeUndefined();
    expect(selectQuestionForWeek([q(1, 2026, 43, false), q(2, 2026, 41)], w43).question?.id).toBe(2);
  });

  it('strips the isActive flag from the returned question', () => {
    expect(selectQuestionForWeek([q(2, 2026, 43)], w43).question).not.toHaveProperty('isActive');
  });

  it('returns nothing for an empty list', () => {
    expect(selectQuestionForWeek([], w43)).toEqual({ question: undefined, isCarryOver: false, sameWeekCount: 0 });
  });
});

describe('buildQuestionsFilter', () => {
  it('mirrors the selection rule on the indexed columns', () => {
    expect(buildQuestionsFilter(w43)).toBe('IsActive eq 1 and (QuizYear lt 2026 or (QuizYear eq 2026 and WeekNumber le 43))');
  });
});
