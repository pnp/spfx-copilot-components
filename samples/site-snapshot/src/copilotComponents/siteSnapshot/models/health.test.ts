// Tests for the pure health scoring. Run with the project's test script
// (heft test). Arrange, Act, Assert - one behaviour per test.

import { computeHealthScore, SCORE_WEIGHTS } from './health';
import { ISnapshotMetrics } from './ISnapshot';

const healthy = (): ISnapshotMetrics => ({
  storageUsedBytes: 0,
  storageTotalBytes: 25 * 1024 ** 3,
  totalDocs: 100,
  staleDocs: 0,
  externalItemCount: 0,
  anyoneLinkCount: 0,
  daysSinceLastActivity: 1,
  emptyDocs: 0,
  duplicateSets: 0
});

describe('computeHealthScore', () => {
  it('returns 100 and Healthy for a pristine site', () => {
    const result = computeHealthScore(healthy());
    expect(result.score).toBe(100);
    expect(result.verdict).toBe('Healthy');
  });

  it('does not penalise storage below the 70% threshold', () => {
    const under = computeHealthScore({ ...healthy(), storageUsedBytes: 60, storageTotalBytes: 100 });
    const over = computeHealthScore({ ...healthy(), storageUsedBytes: 90, storageTotalBytes: 100 });
    expect(under.penalties.storage).toBe(0);
    expect(over.penalties.storage).toBeGreaterThan(0);
  });

  it('weighs one Anyone link the same as two external shares (double weight)', () => {
    const twoExternal = computeHealthScore({ ...healthy(), externalItemCount: 2 });
    const oneAnyone = computeHealthScore({ ...healthy(), anyoneLinkCount: 1 });
    expect(oneAnyone.penalties.exposure).toBe(twoExternal.penalties.exposure);
    const oneExternal = computeHealthScore({ ...healthy(), externalItemCount: 1 });
    expect(oneAnyone.penalties.exposure).toBeGreaterThan(oneExternal.penalties.exposure);
  });

  it('penalises clutter (empty files and duplicate groups) via tidiness', () => {
    const tidy = computeHealthScore(healthy());
    const messy = computeHealthScore({ ...healthy(), emptyDocs: 10, duplicateSets: 10 });
    expect(tidy.penalties.tidiness).toBe(0);
    expect(messy.penalties.tidiness).toBeGreaterThan(0);
  });

  it('never drops below zero when everything is wrong', () => {
    const result = computeHealthScore({
      storageUsedBytes: 100,
      storageTotalBytes: 100,
      totalDocs: 100,
      staleDocs: 100,
      externalItemCount: 50,
      anyoneLinkCount: 50,
      daysSinceLastActivity: 3650,
      emptyDocs: 100,
      duplicateSets: 100
    });
    expect(result.score).toBe(0);
    expect(result.verdict).toBe('At risk');
  });

  it('keeps each sub-score within its weight and weights sum to 100', () => {
    const result = computeHealthScore(healthy());
    expect(result.subScores.storage).toBeLessThanOrEqual(SCORE_WEIGHTS.storage);
    expect(result.subScores.tidiness).toBeLessThanOrEqual(SCORE_WEIGHTS.tidiness);
    const total =
      SCORE_WEIGHTS.storage + SCORE_WEIGHTS.stale + SCORE_WEIGHTS.exposure +
      SCORE_WEIGHTS.frecency + SCORE_WEIGHTS.tidiness;
    expect(total).toBe(100);
  });
});
