import { findField, lookupMap, parseSkipRules, parseStringMap, ruleMatches, visibleFields } from '../logic/jsonProps';
import { field } from './helpers';

const fields = [
  field({ internalName: 'Title', title: 'What went wrong?', required: true }),
  field({ internalName: 'Category', title: 'Category', kind: 'choice', required: true, choices: ['Incident', 'Request', 'Question'] }),
  field({ internalName: 'Urgency', title: 'Urgency', kind: 'choice', required: true, choices: ['Low', 'High'] }),
  field({ internalName: 'Devices', title: 'Devices', kind: 'multichoice', choices: ['Laptop', 'Phone'] })
];

describe('parseStringMap', () => {
  it('returns an empty map for blank input', () => {
    expect(parseStringMap('').value).toEqual({});
    expect(parseStringMap('').error).toBe('');
  });

  it('parses a plain object and ignores prototype keys', () => {
    const parsed = parseStringMap('{"Title":"A short summary","__proto__":"x","constructor":"y","Impact":"How it feels"}');
    expect(parsed.error).toBe('');
    expect(parsed.value).toEqual({ Title: 'A short summary', Impact: 'How it feels' });
    expect(parsed.notice).toMatch(/ignored/);
    expect(Object.prototype.hasOwnProperty.call(parsed.value, '__proto__')).toBe(false);
  });

  it('accepts an already-parsed object (Copilot)', () => {
    expect(parseStringMap({ Title: 'Hello' }).value).toEqual({ Title: 'Hello' });
  });

  it('rejects invalid or oversize JSON', () => {
    expect(parseStringMap('{nope').error).toMatch(/valid JSON/);
    expect(parseStringMap('[]').error).toMatch(/JSON object/);
    expect(parseStringMap(`{"a":"${'x'.repeat(9000)}"`).error).toMatch(/too long|valid JSON/);
    expect(parseStringMap('x'.repeat(8001)).error).toMatch(/too long/);
  });
});

describe('parseSkipRules and visibility', () => {
  it('parses equals and in rules, dropping incomplete and reserved keys', () => {
    const parsed = parseSkipRules(
      '[{"show":"Urgency","when":"Category","equals":"Incident"},{"show":"Devices","when":"Category","in":["Incident","Request"]},{"show":"X"},{"__proto__":"no"}]'
    );
    expect(parsed.error).toBe('');
    expect(parsed.value).toEqual([
      { show: 'Urgency', when: 'Category', equals: 'Incident' },
      { show: 'Devices', when: 'Category', in: ['Incident', 'Request'] }
    ]);
    expect(parsed.notice).toMatch(/ignored/);
  });

  it('rejects a non-array or invalid JSON', () => {
    expect(parseSkipRules('{"show":"Urgency"}').error).toMatch(/array/);
    expect(parseSkipRules('[').error).toMatch(/valid JSON/);
  });

  it('shows a ruled field only when the condition matches, otherwise always', () => {
    const rules = parseSkipRules('[{"show":"Urgency","when":"Category","equals":"Incident"}]').value;
    expect(visibleFields(fields, {}, rules).map((f) => f.internalName)).toEqual(['Title', 'Category', 'Devices']);
    expect(visibleFields(fields, { Category: 'Request' }, rules).map((f) => f.internalName)).toEqual(['Title', 'Category', 'Devices']);
    expect(visibleFields(fields, { Category: 'Incident' }, rules).map((f) => f.internalName)).toEqual(['Title', 'Category', 'Urgency', 'Devices']);
  });

  it('matches multi-choice answers with in and equals', () => {
    const equals = parseSkipRules('[{"show":"Urgency","when":"Devices","equals":"Laptop"}]').value[0];
    const inn = parseSkipRules('[{"show":"Urgency","when":"Devices","in":["Phone","Headset"]}]').value[0];
    expect(ruleMatches(equals, fields, { Devices: ['Laptop'] })).toBe(true);
    expect(ruleMatches(equals, fields, { Devices: ['Phone'] })).toBe(false);
    expect(ruleMatches(inn, fields, { Devices: ['Phone'] })).toBe(true);
    expect(ruleMatches(inn, fields, { Devices: ['Laptop'] })).toBe(false);
  });

  it('parses is-not and is-answered rules and requires every condition to match', () => {
    const parsed = parseSkipRules(
      '[{"show":"Urgency","when":"Category","notEquals":"Question"},{"show":"Urgency","when":"Category","answered":true}]'
    );
    expect(parsed.error).toBe('');
    expect(parsed.value).toEqual([
      { show: 'Urgency', when: 'Category', notEquals: 'Question' },
      { show: 'Urgency', when: 'Category', answered: true }
    ]);
    expect(ruleMatches(parsed.value[0], fields, { Category: 'Incident' })).toBe(true);
    expect(ruleMatches(parsed.value[0], fields, { Category: 'Question' })).toBe(false);
    expect(ruleMatches(parsed.value[1], fields, {})).toBe(false);
    expect(ruleMatches(parsed.value[1], fields, { Category: 'Incident' })).toBe(true);
    // All conditions on Urgency must match: answered and not Question.
    expect(visibleFields(fields, { Category: 'Incident' }, parsed.value).map((f) => f.internalName)).toContain('Urgency');
    expect(visibleFields(fields, { Category: 'Question' }, parsed.value).map((f) => f.internalName)).not.toContain('Urgency');
    expect(visibleFields(fields, {}, parsed.value).map((f) => f.internalName)).not.toContain('Urgency');
  });

  it('looks up maps and fields by internal or display name', () => {
    expect(findField(fields, 'What went wrong?')?.internalName).toBe('Title');
    expect(lookupMap({ title: 'Hello', Urgency: 'How soon?' }, fields[0])).toBe('Hello');
    expect(lookupMap({ __proto__: 'no' }, fields[0])).toBe('');
  });
});
