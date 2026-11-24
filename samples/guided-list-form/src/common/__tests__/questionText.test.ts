import { mergeAdjacentText, parseTemplateSegments, removeTokenBeforeIndex, serializeTemplateSegments } from '../logic/questionText';
import { firstNameFromDisplayName, greetingText, questionParts, resolveQuestionTemplate } from '../logic/questionText';
import { field } from './helpers';

const fields = [
  field({ internalName: 'Title', title: 'Title', required: true }),
  field({ internalName: 'Impact', title: 'Impact', required: true })
];

describe('greeting and question recall', () => {
  it('takes the first word of a display name and strips control characters', () => {
    expect(firstNameFromDisplayName('Alex Rivera')).toBe('Alex');
    expect(firstNameFromDisplayName('  <script> Hi')).toBe('<script>');
    expect(firstNameFromDisplayName('Alex\u0000')).toBe('Alex');
    expect(firstNameFromDisplayName('')).toBe('');
    expect(firstNameFromDisplayName(5)).toBe('');
  });

  it('builds an optional greeting', () => {
    expect(greetingText(true, 'Alex')).toBe('Hi, Alex');
    expect(greetingText(true, '')).toBe('');
    expect(greetingText(false, 'Alex')).toBe('');
  });

  it('substitutes tokens as plain text and italicises recalled answers, never HTML', () => {
    const parts = questionParts(
      'Thanks, {{firstName}}. What is the impact of {{Title}}?',
      fields[1],
      fields,
      { Title: '<b>Monitor flickers</b>' },
      'Alex'
    );
    expect(parts).toEqual([
      { text: 'Thanks, Alex. What is the impact of ' },
      { text: '<b>Monitor flickers</b>', emphasize: true },
      { text: '?' }
    ]);
    expect(parts.some((p) => p.text.indexOf('<em>') >= 0)).toBe(false);
  });

  it('leaves unknown tokens in place and falls back to the column title', () => {
    expect(questionParts('See {{Missing}}', fields[0], fields, {}, '')).toEqual([{ text: 'See {{Missing}}' }]);
    expect(resolveQuestionTemplate(fields[1], { Impact: 'How did it feel?' })).toBe('How did it feel?');
    expect(resolveQuestionTemplate(fields[1], {})).toBe('Impact');
  });
});

describe('question editor segments', () => {
  it('removes the pill before the caret on backspace and joins the text around it', () => {
    const parts = parseTemplateSegments("Thanks, {{firstName}}. What's the impact of {{Title}}?");
    // Caret at the start of ". What's the impact of " (index 2), pill before it is First name.
    const next = removeTokenBeforeIndex(parts, 2);
    expect(next && serializeTemplateSegments(next)).toBe("Thanks, . What's the impact of {{Title}}?");
    expect(next && next.filter((p) => p.type === 'text').length).toBe(2);
  });

  it('does nothing when there is text, not a pill, before the caret', () => {
    expect(removeTokenBeforeIndex(parseTemplateSegments('Hello world'), 0)).toBeUndefined();
  });

  it('merges neighbouring text segments', () => {
    expect(mergeAdjacentText([{ type: 'text', text: 'a ' }, { type: 'text', text: 'b' }, { type: 'token', name: 'Title' }])).toEqual([
      { type: 'text', text: 'a b' },
      { type: 'token', name: 'Title' }
    ]);
  });
});
