import { evidencePassages } from '../passages';
import { decodeCompactAnalysis } from '../compactReview';
import type { AnalysisSource } from '../contracts';

const intro = 'This is a fictional expense-process test, not an actual company policy. The proposed process asks for the same receipt twice. ' +
  'That requirement is poorly justified; please explain what benefit it provides and consider removing the duplicate step.';
const flagged = 'Stop wasting everyone’s time with these ridiculous questions. Just follow the instructions instead of asking for clarification.';
const promise = 'We promise every expense request will be approved quickly and that every problem will be resolved. You will always receive the best possible outcome.';

function joined(text: string): string { return evidencePassages(text).map(passage => passage.text).join(''); }
function page(text: string): AnalysisSource { return { id: 's1', chunkId: 'c1', text }; }

describe('sentence-aligned evidence passages', () => {
  it.each(['\n', '\n\n'])('keeps the flagged page paragraph as its own passage (separator %j)', separator => {
    const text = [intro, flagged, promise].join(separator);
    const passages = evidencePassages(text);
    expect(joined(text)).toBe(text);
    expect(passages.map(passage => passage.text.trim())).toContain(flagged);
    // The highlight for the flagged wording must not run into the next paragraph.
    expect(passages.find(passage => passage.text.trim() === flagged)!.text).not.toContain('We promise');
  });

  it('resolves a passage reference to exactly the flagged sentences', () => {
    const source = page([intro, flagged, promise].join('\n\n'));
    const id = evidencePassages(source.text).findIndex(passage => passage.text.trim() === flagged) + 1;
    const decoded = decodeCompactAnalysis({ requestId: '00000000-0000-4000-8000-000000000001', review: `s1:r:i@${id}`, note1: 'Dismissive wording.', note2: '' }, [source], ['insult']);
    expect(decoded.invalid).toBe(false);
    expect(decoded.findings[0].excerpt.trim()).toBe(flagged);
    expect(source.text.includes(decoded.findings[0].excerpt)).toBe(true);
  });

  it('packs short lines instead of producing one passage per line', () => {
    const text = Array.from({ length: 150 }, (_value, index) => 'word' + index).join('\n');
    const passages = evidencePassages(text);
    expect(joined(text)).toBe(text);
    expect(passages.length).toBeLessThanOrEqual(99);
    expect(passages.every(passage => passage.text.length <= 160)).toBe(true);
  });

  it('splits German text at sentence ends', () => {
    const text = 'Diese Regel ist schlecht begründet und niemand hat die Gründe erklärt. Bitte erklärt die Entscheidung, bevor sie verbindlich wird! ' +
      'Wer hat das überhaupt so beschlossen? Ich möchte die Unterlagen sehen.';
    const passages = evidencePassages(text);
    expect(joined(text)).toBe(text);
    expect(passages.length).toBe(2);
    expect(passages[1].text.startsWith('Wer hat das')).toBe(true);
  });

  it('cuts a long run without punctuation at word boundaries', () => {
    const text = 'word '.repeat(400).trim();
    const passages = evidencePassages(text);
    expect(joined(text)).toBe(text);
    expect(passages.every(passage => passage.text.length <= 160)).toBe(true);
    expect(passages.slice(0, -1).every(passage => /\s$/.test(passage.text))).toBe(true);
  });
});
