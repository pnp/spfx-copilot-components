// Transparent health scoring: five weighted penalties off 100. The weights are
// named constants so the number is explainable and tunable, and the sub-scores
// are always surfaced in the UI.

import { ISnapshotMetrics, ISnapshotScore } from './ISnapshot';

// Max points each factor can remove. They sum to 100.
export const SCORE_WEIGHTS = { storage: 15, stale: 25, exposure: 30, frecency: 10, tidiness: 20 };

// Where each penalty begins and saturates.
export const SCORE_THRESHOLDS = {
  storageStartPct: 70,
  storageFullPct: 100,
  staleFullPct: 50,
  exposureFullCount: 20,
  frecencyStartDays: 90,
  frecencyFullDays: 365,
  anyoneLinkWeight: 2, // "Anyone" links count double toward exposure
  tidinessFullPct: 20 // (empty + duplicate sets) as a share of files that saturates tidiness
};

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

// Linear ramp from 0 at `start` to 1 at `full`.
const ramp = (value: number, start: number, full: number): number => {
  if (full === start) return value >= full ? 1 : 0;
  return clamp((value - start) / (full - start), 0, 1);
};

const round1 = (n: number): number => Math.round(n * 10) / 10;

// Pure: same input, same output.
export function computeHealthScore(m: ISnapshotMetrics): ISnapshotScore {
  const t = SCORE_THRESHOLDS;
  const w = SCORE_WEIGHTS;

  // Storage pressure
  const usedPct = m.storageTotalBytes > 0 ? (m.storageUsedBytes / m.storageTotalBytes) * 100 : 0;
  const storagePenalty = ramp(usedPct, t.storageStartPct, t.storageFullPct) * w.storage;

  // Staleness
  const stalePct = m.totalDocs > 0 ? (m.staleDocs / m.totalDocs) * 100 : 0;
  const stalePenalty = ramp(stalePct, 0, t.staleFullPct) * w.stale;

  // External exposure ("Anyone" links weigh double)
  const weightedExposure = m.externalItemCount + m.anyoneLinkCount * t.anyoneLinkWeight;
  const exposurePenalty = ramp(weightedExposure, 0, t.exposureFullCount) * w.exposure;

  // Frecency (idle time)
  const frecencyPenalty = ramp(m.daysSinceLastActivity, t.frecencyStartDays, t.frecencyFullDays) * w.frecency;

  // Tidiness (clutter: empty files + duplicate groups relative to the library)
  const clutterPct = m.totalDocs > 0 ? ((m.emptyDocs + m.duplicateSets) / m.totalDocs) * 100 : 0;
  const tidinessPenalty = ramp(clutterPct, 0, t.tidinessFullPct) * w.tidiness;

  const score = clamp(
    Math.round(100 - storagePenalty - stalePenalty - exposurePenalty - frecencyPenalty - tidinessPenalty),
    0,
    100
  );

  return {
    score,
    verdict: score >= 80 ? 'Healthy' : score >= 55 ? 'Watch' : 'At risk',
    subScores: {
      storage: round1(w.storage - storagePenalty),
      stale: round1(w.stale - stalePenalty),
      exposure: round1(w.exposure - exposurePenalty),
      frecency: round1(w.frecency - frecencyPenalty),
      tidiness: round1(w.tidiness - tidinessPenalty)
    },
    penalties: {
      storage: round1(storagePenalty),
      stale: round1(stalePenalty),
      exposure: round1(exposurePenalty),
      frecency: round1(frecencyPenalty),
      tidiness: round1(tidinessPenalty)
    }
  };
}
