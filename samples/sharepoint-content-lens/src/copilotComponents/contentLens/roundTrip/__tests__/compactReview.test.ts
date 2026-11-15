import { reviewAnswerSchema, type ReviewAnswer } from '../answerSchema';
import type { AnalysisSource } from '../contracts';
import { categoryCodes, categoryIds, flagPattern, isRuleId, type CategoryId } from '../checks';
import { analysisInput, maxSegmentsPerRequest, nextRequestSources, prepareAnalysis, reviewChars, reviewRowChars } from '../packing';
import { evidencePassages } from '../passages';
import { decodeCompactAnalysis } from '../compactReview';

const { TextEncoder } = jest.requireActual<{ TextEncoder: typeof globalThis.TextEncoder }>('util');
const requestId = '00000000-0000-4000-8000-000000000001';
function source(id: string, text: string = 'Only an idiot would approve this policy.'): AnalysisSource {
  return { id, chunkId: 'c' + id.slice(1), text };
}
function envelope(review: string = 's1:r:i@1', note1: string = 'Personal insult.', note2: string = ''): ReviewAnswer {
  return { requestId, review, note1, note2 };
}

describe('The compact review and the request packing', () => {
  beforeAll(() => { Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true }); });

  it('supports every check and rule on both sources without truncating decisions', () => {
    const flags = categoryIds.map(category => categoryCodes[category] + '?@1').join(',');
    const value = envelope(`s1:r:${flags};s2:r:${flags}`, 'Several wording issues.', 'Several wording issues.');
    expect(reviewAnswerSchema.safeParse(value).success).toBe(true);
    const decoded = decodeCompactAnalysis(value, [source('s1'), source('s2')], categoryIds.slice());
    expect(decoded.invalid).toBe(false);
    expect(decoded.findings).toHaveLength(2 * categoryIds.length);
    expect(decoded.findings.filter(finding => finding.categoryId === 'rule5')).toHaveLength(2);
    expect(decoded.findings.every(finding => finding.needsContext)).toBe(true);
    expect(decoded.decisions.every(decision => decision.status === 'reviewed')).toBe(true);
  });

  it('marks every place a rule names, with each place where it starts in the text', () => {
    const text = 'Write dates as 2 October.\n\nThe move starts 11/03.\n\nFloors open first.\n\nParking opens 4/11.\n\nDesks from 1.10.';
    const passages = evidencePassages(text);
    expect(passages.length).toBeGreaterThanOrEqual(5);
    const decoded = decodeCompactAnalysis(envelope('s1:r:v@2.4.5,a@3', '', ''), [source('s1', text)], ['aggressive', 'rule1']);
    expect(decoded.invalid).toBe(false);
    const rule = decoded.findings.filter(finding => finding.categoryId === 'rule1');
    expect(rule.map(finding => finding.excerpt)).toEqual([passages[1].text, passages[3].text, passages[4].text]);
    rule.forEach(finding => expect(text.slice(finding.offset, finding.offset! + finding.excerpt.length)).toBe(finding.excerpt));
    expect(decoded.findings.find(finding => finding.categoryId === 'aggressive')).toMatchObject({ excerpt: passages[2].text, offset: text.indexOf(passages[2].text) });
  });

  it('keeps segment wording notes off every writing-rule finding on both sources', () => {
    const flags = categoryIds.map(category => categoryCodes[category] + '@1').join(',');
    const decoded = decodeCompactAnalysis(envelope(`s1:r:${flags};s2:r:${flags}`, 'Blaming wording creates an aggressive tone.', 'Personal attack.'),
      [source('s1'), source('s2')], categoryIds.slice());
    expect(decoded.invalid).toBe(false);
    expect(decoded.decisions.every(decision => decision.status === 'reviewed')).toBe(true);
    for (const finding of decoded.findings) {
      expect(finding.explanation).toBe(isRuleId(finding.categoryId) ? '' : finding.sourceId === 's1'
        ? 'Blaming wording creates an aggressive tone.' : 'Personal attack.');
      expect(finding.excerpt).toBe(source(finding.sourceId).text);
      expect(finding.offset).toBe(0);
    }
  });

  it('rejects more places for a check, places out of order, repeated or more than four', () => {
    const text = 'One. Two. Three. Four. Five. Six.';
    const decode = (review: string): boolean => decodeCompactAnalysis(envelope(review, '', ''), [source('s1', text)], ['insult', 'rule1']).invalid;
    expect(evidencePassages(text).length).toBe(1);
    const long = 'Alpha sentence here. '.repeat(40);
    const decodeLong = (review: string): boolean => decodeCompactAnalysis(envelope(review, '', ''), [source('s1', long)], ['insult', 'rule1']).invalid;
    expect(decodeLong('s1:r:v@1-2.4.5.6')).toBe(false);
    expect(decodeLong('s1:r:i@1.3')).toBe(true);
    expect(decodeLong('s1:r:v@3.2')).toBe(true);
    expect(decodeLong('s1:r:v@1.1')).toBe(true);
    expect(decodeLong('s1:r:v@1-3.2')).toBe(true);
    expect(decodeLong('s1:r:v@1.2.3.4.5')).toBe(true);
    expect(decode('s1:r:v@1.9')).toBe(true);
  });

  it('accepts exactly the codes of the check table', () => {
    const codes = categoryIds.map(id => categoryCodes[id]);
    for (const code of 'abcdefghijklmnopqrstuvwxyz') expect(flagPattern.test(code + '@1')).toBe(codes.indexOf(code) >= 0);
  });

  it('rejects the retired custom code and a rule code whose rule is not selected', () => {
    const custom = envelope('s1:r:c@1', '', '');
    expect(decodeCompactAnalysis(custom, [source('s1')], ['insult']).invalid).toBe(true);
    expect(decodeCompactAnalysis(envelope('s1:r:v@1', '', ''), [source('s1')], ['insult']).invalid).toBe(true);
    expect(decodeCompactAnalysis(envelope('s1:r:v@1', '', ''), [source('s1')], ['insult', 'rule1']).findings[0].categoryId).toBe('rule1');
  });

  it('reconstructs exact original evidence, never generated quotations or offsets', () => {
    const original = source('s1', ('A sentence with emoji 🧭 and whitespace.\n').repeat(12));
    const passages = evidencePassages(original.text);
    const expected = passages.slice(1, 3).map(passage => passage.text).join('');
    const decoded = decodeCompactAnalysis(envelope('s1:r:i?@2-3'), [original], ['insult']);
    expect(decoded.invalid).toBe(false);
    expect(decoded.findings[0]).toMatchObject({ excerpt: expected, needsContext: true, explanation: 'Personal insult.' });
    expect(original.text.includes(expected)).toBe(true);
    expect(passages.map(passage => passage.text).join('')).toBe(original.text);
    expect(evidencePassages('🧭'.repeat(160)).every(passage => passage.text === '🧭'.repeat(passage.text.length / 2))).toBe(true);
  });

  it('keeps explicit no-issues and not-reviewed verdicts distinct', () => {
    const decoded = decodeCompactAnalysis(envelope('s1:r:-;s2:n:-', ''), [source('s1'), source('s2')], ['insult']);
    expect(decoded.invalid).toBe(false);
    expect(decoded.findings).toEqual([]);
    expect(decoded.decisions.map(decision => decision.status)).toEqual(['reviewed', 'notReviewed']);
  });

  it.each([
    's1:r:i@99', 's1:r:i@2-1', 's1:r:i@0', 's1:r:i@1,i@1', 's1:r:h@1',
    's2:r:i@1', 's1:n:i@1', 's1:r:i@1;s1:r:-', 's1:r:i@1;s2:r:-', 'refusal'
  ])('fails closed for invalid identity, category, evidence or verdict: %s', review => {
    const decoded = decodeCompactAnalysis(envelope(review), [source('s1')], ['insult']);
    expect(decoded.invalid).toBe(true);
    expect(decoded.findings).toEqual([]);
    expect(decoded.decisions[0].status).toBe('notReviewed');
  });

  it('treats notes as explanations only: a missing or surplus note never changes a verdict', () => {
    const missing = decodeCompactAnalysis(envelope('s1:r:i@1', ''), [source('s1')], ['insult']);
    expect(missing.invalid).toBe(false);
    expect(missing.findings[0]).toMatchObject({ categoryId: 'insult', explanation: '' });
    const surplus = decodeCompactAnalysis(envelope('s1:r:-', 'Personal insult.', 'Unsolicited text'), [source('s1')], ['insult']);
    expect(surplus.invalid).toBe(false);
    expect(surplus.findings).toEqual([]);
    expect(surplus.decisions[0].status).toBe('reviewed');
  });

  it('decodes up to eight segments; only s1 and s2 carry notes', () => {
    const sources = Array.from({ length: 8 }, (_v, index) => source('s' + (index + 1)));
    const review = sources.map((_item, index) => 's' + (index + 1) + (index % 2 ? ':r:-' : ':r:i@1')).join(';');
    const decoded = decodeCompactAnalysis(envelope(review, 'Personal insult.', 'Ignored: s2 is clean.'), sources, ['insult']);
    expect(decoded.invalid).toBe(false);
    expect(decoded.findings.map(finding => [finding.sourceId, finding.explanation])).toEqual([
      ['s1', 'Personal insult.'], ['s3', ''], ['s5', ''], ['s7', '']]);
    expect(decoded.decisions.every(decision => decision.status === 'reviewed')).toBe(true);
    const nine = [...sources, source('s9')];
    expect(decodeCompactAnalysis(envelope(review + ';s9:r:-'), nine, ['insult']).invalid).toBe(true);
  });

  it('packs a request only while its worst-case review fits the review field', () => {
    const long = 'This sentence is long enough to become its own passage in the review input. '.repeat(6);
    const sources = Array.from({ length: 20 }, (_v, index) => source('s' + index, index % 3 ? 'Short comment ' + index + '.' : long));
    const checkSets: CategoryId[][] = [['insult'], ['insult', 'aggressive'], categoryIds.slice()];
    for (const checks of checkSets) {
      const { batches } = prepareAnalysis(sources, checks);
      expect(batches.reduce((count, batch) => count + batch.length, 0)).toBe(20);
      for (const batch of batches) {
        expect(batch.length).toBeLessThanOrEqual(maxSegmentsPerRequest);
        // Every check flagged, uncertain, citing a range with the widest passage numbers.
        const review = batch.map((segment, index) => {
          const count = evidencePassages(segment.source.text).length;
          const reference = count > 1 ? 10 ** (String(count).length - 1) + '-' + count : '1';
          const places = Array.from({ length: 3 }, () => '.' + count).join('');
          return 's' + (index + 1) + ':r:' + checks.map(check => categoryCodes[check] + '?@' + reference + (isRuleId(check) ? places : '')).join(',');
        }).join(';');
        expect(review.length).toBeLessThanOrEqual(reviewChars);
        expect(reviewAnswerSchema.safeParse(envelope(review)).success).toBe(true);
      }
    }
    expect(prepareAnalysis(sources.slice(1, 3).concat(sources.slice(4, 6), sources.slice(7, 9), sources.slice(10, 12)), ['insult', 'aggressive']).batches.map(batch => batch.length)).toEqual([8]);
  });

  it('fits the worst answer for one page segment with every check and rule, each rule citing four places', () => {
    const passages = 99;
    const ref = '10-99';
    const flags = categoryIds.map(check => categoryCodes[check] + '?@' + ref + (isRuleId(check) ? '.97.98.99' : '')).join(',');
    const review = 's1:r:' + flags;
    expect(review.length).toBe(reviewRowChars(1, passages, categoryIds.slice()) - 1);
    expect(review.length).toBeLessThanOrEqual(reviewChars);
    expect(reviewAnswerSchema.safeParse(envelope(review)).success).toBe(true);
  });

  it('selects the next sources that one request reviews completely', () => {
    const short = Array.from({ length: 11 }, (_v, index) => source('s' + index, 'Short comment ' + index + '.'));
    expect(nextRequestSources(short, ['insult', 'aggressive'])).toEqual(short.slice(0, 8));
    expect(nextRequestSources(short.slice(8), ['insult'])).toEqual(short.slice(8));
    // A source longer than one request is still sent alone; its remainder stays not reviewed.
    const page = source('s99', 'Long page text. '.repeat(1200));
    expect(prepareAnalysis([page], ['insult']).batches.length).toBeGreaterThan(1);
    expect(nextRequestSources([page], ['insult'])).toEqual([page]);
    expect(nextRequestSources([], ['insult'])).toEqual([]);
  });

  it('bounds serialized passage inputs, preserves all admitted text and caps local evidence IDs', () => {
    const original = source('s1', 'word 🧭 " \\ \n'.repeat(1600));
    const prepared = prepareAnalysis([original], ['insult']);
    const parts = prepared.batches.reduce((all, batch) => all.concat(batch), [] as typeof prepared.batches[number]);
    expect(parts.map(part => part.source.text).join('')).toBe(original.text);
    for (const batch of prepared.batches) {
      expect(batch.length).toBeLessThanOrEqual(maxSegmentsPerRequest);
      expect(new TextEncoder().encode(JSON.stringify(batch.map(analysisInput))).length).toBeLessThanOrEqual(8192);
      for (const part of batch) expect(evidencePassages(part.source.text).length).toBeLessThanOrEqual(99);
    }
  });
});
