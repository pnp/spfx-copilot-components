import { answerCheckFor, checkAnswerFormat, defaultAnswerCheck, parseAnswerChecks } from '../logic/answerCheck';
import { field } from './helpers';

describe('answer checks', () => {
  const email = field({ internalName: 'ContactEmail', title: 'Work email' });
  const titled = field({ internalName: 'Notify', title: 'Notification Email' });
  const link = field({ internalName: 'Website', title: 'Website', kind: 'hyperlink' });
  const title = field({ internalName: 'Title', title: 'Title' });

  it('presets Email when the column name contains email, and Web link for Hyperlink columns', () => {
    expect(defaultAnswerCheck(email)).toBe('email');
    expect(defaultAnswerCheck(titled)).toBe('email');
    expect(defaultAnswerCheck(link)).toBe('url');
    expect(defaultAnswerCheck(title)).toBe('none');
    expect(answerCheckFor(email)).toBe('email');
    expect(answerCheckFor(email, { ContactEmail: 'none' })).toBe('none');
    expect(answerCheckFor(title, { Title: 'phone' })).toBe('phone');
  });

  it('parses a map and drops unknown types', () => {
    const parsed = parseAnswerChecks('{"Title":"phone","Bad":"fax","Website":"url"}');
    expect(parsed.value).toEqual({ Title: 'phone', Website: 'url' });
    expect(parsed.notice).toMatch(/ignored/);
  });

  it('validates email, web link and phone, and allows empty optional values', () => {
    expect(checkAnswerFormat('email', '')).toBeUndefined();
    expect(checkAnswerFormat('email', 'not-an-email')).toBe('Please enter a valid email address.');
    expect(checkAnswerFormat('email', 'name@example.com')).toBeUndefined();
    expect(checkAnswerFormat('url', 'https://contoso.com/path')).toBeUndefined();
    expect(checkAnswerFormat('url', 'http://contoso.com')).toBe('Please use an https:// link.');
    expect(checkAnswerFormat('phone', '+46 70 123 45 67')).toBeUndefined();
    expect(checkAnswerFormat('phone', 'abc')).toBe('Please enter a phone number.');
    expect(checkAnswerFormat('none', 'whatever')).toBeUndefined();
  });
});
