import { asList, asText, isEmptyAnswer, sameAnswer, toggleOption } from '../logic/answers';

const CHOICES = ['Laptop', 'Phone', 'Monitor'];

describe('answer helpers', () => {
  it('reads lists and text safely', () => {
    expect(asList(['a', 'b'])).toEqual(['a', 'b']);
    expect(asList('a')).toEqual(['a']);
    expect(asList(' ')).toEqual([]);
    expect(asList(undefined)).toEqual([]);
    expect(asList([1 as unknown as string, 'x'])).toEqual(['x']);
    expect(asText('a')).toBe('a');
    expect(asText(['a'])).toBe('');
  });

  it('knows when an answer is empty', () => {
    expect(isEmptyAnswer([])).toBe(true);
    expect(isEmptyAnswer(['a'])).toBe(false);
    expect(isEmptyAnswer('  ')).toBe(true);
    expect(isEmptyAnswer(undefined)).toBe(true);
    expect(isEmptyAnswer({ url: '', description: 'Only a title' })).toBe(true);
    expect(isEmptyAnswer({ url: 'https://contoso.com', description: '' })).toBe(false);
  });

  it('compares answers by value', () => {
    expect(sameAnswer(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(sameAnswer(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(sameAnswer(['a'], 'a')).toBe(false);
    expect(sameAnswer('a', 'a')).toBe(true);
    expect(sameAnswer({ url: 'https://a', description: 'A' }, { url: 'https://a', description: 'A' })).toBe(true);
    expect(sameAnswer({ url: 'https://a', description: 'A' }, { url: 'https://a', description: 'B' })).toBe(false);
  });

  it('toggles options in column order without duplicates', () => {
    expect(toggleOption([], 'Monitor', CHOICES)).toEqual(['Monitor']);
    expect(toggleOption(['Monitor'], 'Laptop', CHOICES)).toEqual(['Laptop', 'Monitor']);
    expect(toggleOption(['Laptop', 'Monitor'], 'Laptop', CHOICES)).toEqual(['Monitor']);
    expect(toggleOption(['Laptop', 'Laptop'], 'Phone', CHOICES)).toEqual(['Laptop', 'Phone']);
    expect(toggleOption(['Fill-in'], 'Phone', CHOICES)).toEqual(['Phone']);
    expect(toggleOption(undefined, 'Nope', CHOICES)).toEqual([]);
  });
});
