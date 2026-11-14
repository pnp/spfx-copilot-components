// Tests for the model context builder. Arrange, Act, Assert - one behaviour per test.

import { buildModelContextText, buildStructuredContext, MAX_CONTEXT_ROWS } from './ModelContext';
import { buildSampleSnapshot } from '../services/sampleData';
import { ISiteSnapshot, IFileRow } from '../models';

const live = (): ISiteSnapshot => ({
  ...buildSampleSnapshot('https://contoso.sharepoint.com/sites/Marketing', '2026-10-02T00:00:00.000Z'),
  isSample: false
});

const row = (i: number): IFileRow => ({
  name: `file-${i}.docx`,
  webUrl: `https://contoso.sharepoint.com/f${i}`,
  sizeBytes: 1024,
  modifiedIso: '2025-01-01T00:00:00.000Z',
  createdBy: 'Adele Vance'
});

describe('buildModelContextText', () => {
  it('leads with the site, score and verdict the card shows', () => {
    const s = live();

    const text = buildModelContextText(s);

    expect(text).toContain(s.siteName);
    expect(text).toContain(`Health score: ${s.score.score}/100, verdict: ${s.score.verdict}.`);
    expect(text).toContain('These are live figures');
  });

  it('flags sample data so the model never reports it as live', () => {
    const s = { ...live(), isSample: true };

    const text = buildModelContextText(s);

    expect(text).toContain('SAMPLE figures');
  });

  it('caps each list and says how many rows were left out', () => {
    const s = live();
    const staleDocs = Array.from({ length: MAX_CONTEXT_ROWS + 5 }, (_, i) => row(i));
    const big = { ...s, detail: { ...s.detail, staleDocs } };

    const text = buildModelContextText(big);

    expect(text).toContain(`Stale files (${MAX_CONTEXT_ROWS + 5}):`);
    expect(text).toContain('file-0.docx');
    expect(text).not.toContain(`file-${MAX_CONTEXT_ROWS}.docx`);
    expect(text).toContain('...and 5 more');
  });
});

describe('buildStructuredContext', () => {
  it('mirrors the headline numbers', () => {
    const s = live();

    const ctx = buildStructuredContext(s);

    expect(ctx.score).toBe(s.score.score);
    expect(ctx.totalFiles).toBe(s.detail.totalScanned);
    expect(ctx.isSample).toBe(false);
  });
});
