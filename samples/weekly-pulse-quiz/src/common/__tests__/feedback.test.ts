import {
  cleanJustification,
  evaluateAnswer,
  isMotionEnabled,
  justificationPresentation,
  prefersReducedMotion,
  previewJustification
} from '../logic/feedback';
import type { IQuizQuestion } from '../models';

const question: IQuizQuestion = {
  id: 7,
  title: 'How often is the newsletter sent?',
  year: 2026,
  week: 44,
  choices: [
    { key: 'A', text: 'Every Monday' },
    { key: 'B', text: 'Every other week' },
    { key: 'C', text: 'Every Thursday' },
    { key: 'D', text: 'Once a month' }
  ],
  correctChoice: 'C',
  justification: 'It goes out on Thursdays.'
};
const on = { showCorrectAnswer: true, showJustification: true };

describe('evaluateAnswer', () => {
  it('correct answer: check, highlight the chosen option, offer the justification', () => {
    const f = evaluateAnswer(question, 'C', on);
    expect(f.outcome).toBe('correct');
    expect(f.revealChoice).toBe('C');
    expect(f.revealText).toBeUndefined();
    expect(f.justification).toBe('It goes out on Thursdays.');
    expect(f.justificationTitle).toBe('Why C is right');
    expect(f.announcement).toBe('Correct. C. Every Thursday.');
  });

  it('wrong answer: reveal "Correct answer: C. ..." and offer the justification', () => {
    const f = evaluateAnswer(question, 'A', on);
    expect(f.outcome).toBe('incorrect');
    expect(f.chosen).toBe('A');
    expect(f.revealChoice).toBe('C');
    expect(f.revealText).toBe('Correct answer: C. Every Thursday');
    expect(f.announcement).toBe('Not quite. Correct answer: C. Every Thursday.');
    expect(f.justification).not.toBe('');
  });

  it('wrong answer with reveal off: no correct option and no justification (it would give the answer away)', () => {
    const f = evaluateAnswer(question, 'A', { showCorrectAnswer: false, showJustification: true });
    expect(f.revealChoice).toBeUndefined();
    expect(f.revealText).toBeUndefined();
    expect(f.justification).toBe('');
    expect(f.announcement).toBe('Not quite. Your answer was saved.');
  });

  it('justification setting off: no pop-up for right or wrong answers', () => {
    const opts = { showCorrectAnswer: true, showJustification: false };
    expect(evaluateAnswer(question, 'C', opts).justification).toBe('');
    expect(evaluateAnswer(question, 'A', opts).justification).toBe('');
  });

  it('empty justification: no pop-up', () => {
    expect(evaluateAnswer({ ...question, justification: '   ' }, 'C', on).justification).toBe('');
  });

  it('poll (no CorrectChoice): thanks, no reveal, no pop-up', () => {
    const f = evaluateAnswer({ ...question, correctChoice: undefined }, 'B', on);
    expect(f.outcome).toBe('poll');
    expect(f.revealChoice).toBeUndefined();
    expect(f.justification).toBe('');
    expect(f.announcement).toBe('Thanks, your answer was saved.');
  });
});

describe('justification length', () => {
  it('caps at 500 characters', () => {
    const long = 'x'.repeat(700);
    const cleaned = cleanJustification(long);
    expect(cleaned.length).toBe(500);
    expect(cleaned.endsWith('\u2026')).toBe(true);
    expect(cleanJustification('a'.repeat(500))).toBe('a'.repeat(500));
    expect(cleanJustification(undefined)).toBe('');
  });

  it('short text needs no Read more', () => {
    const p = previewJustification('Short reason.');
    expect(p.isLong).toBe(false);
    expect(p.preview).toBe('Short reason.');
  });

  it('long text is cut on a word boundary near 200 characters with Read more', () => {
    const text = 'The newsletter is sent every Thursday morning so that it reaches everyone before Friday team meetings. '.repeat(4);
    const p = previewJustification(text);
    expect(p.isLong).toBe(true);
    expect(p.preview.length).toBeLessThanOrEqual(201);
    expect(p.preview.endsWith('\u2026')).toBe(true);
    expect(p.preview).not.toMatch(/ \u2026$/);
    expect(p.full).toBe(text.trim());
  });

  it('more than three lines is collapsed even when short', () => {
    const p = previewJustification('one\ntwo\nthree\nfour');
    expect(p.isLong).toBe(true);
    expect(p.preview).toBe('one\ntwo\nthree\u2026');
  });
});

describe('justification presentation and motion', () => {
  it('dialog on pages, inline panel in Copilot, nothing without text', () => {
    const f = evaluateAnswer(question, 'C', on);
    expect(justificationPresentation(f, 'WebPart')).toBe('dialog');
    expect(justificationPresentation(f, 'Copilot')).toBe('inline');
    expect(justificationPresentation({ ...f, justification: '' }, 'WebPart')).toBe('none');
    expect(justificationPresentation(undefined, 'WebPart')).toBe('none');
  });

  it('motion needs the Animations toggle on and no reduced-motion preference', () => {
    expect(isMotionEnabled(true, false)).toBe(true);
    expect(isMotionEnabled(false, false)).toBe(false);
    expect(isMotionEnabled(true, true)).toBe(false);
  });

  it('reads prefers-reduced-motion safely', () => {
    const win = { matchMedia: (q: string) => ({ matches: q.indexOf('reduce') >= 0 }) } as unknown as Window;
    expect(prefersReducedMotion(win)).toBe(true);
    expect(prefersReducedMotion(undefined)).toBe(false);
    expect(prefersReducedMotion({} as Window)).toBe(false);
  });
});
