/**
 * Pure, deterministic business logic for turning raw governance findings into
 * the executive-level narrative shown by the dashboard (score, summary,
 * priority actions, tenant insights). Shared by every {@link IGovernanceService}
 * implementation so a future Graph-backed service tells the same story.
 */
import {
  GovernanceHealthBand,
  GovernanceRiskSeverity,
  GovernanceScoreTrend,
  IGovernanceRisk,
  IGovernanceTenantInsights,
  IGovernanceTopRisk
} from '../models/IGovernanceRisk';

const SEVERITY_WEIGHT: Record<GovernanceRiskSeverity, number> = {
  high: 8,
  medium: 4,
  low: 1
};

const TREND_THRESHOLD = 3;

type GovernanceGroupKey = 'missingOwner' | 'inactive' | 'expiring' | 'broadSharingAnonymous' | 'broadSharingGuest';

const HIGH_RISK_PHRASES: Record<GovernanceGroupKey, string> = {
  missingOwner: 'orphaned sites without owners',
  broadSharingAnonymous: 'unrestricted sharing configurations',
  broadSharingGuest: 'excessive external guest access',
  inactive: 'long-dormant, unmonitored sites',
  expiring: 'overdue lifecycle reviews'
};

const PRIORITY_ACTION_TEMPLATES: Record<GovernanceGroupKey, (count: number) => string> = {
  missingOwner: (count) => `Assign owners to ${count} orphaned site${count === 1 ? '' : 's'}`,
  broadSharingAnonymous: (count) => `Review anonymous sharing links on ${count} site${count === 1 ? '' : 's'}`,
  broadSharingGuest: (count) => `Validate external guest access on ${count} site${count === 1 ? '' : 's'}`,
  expiring: (count) => `Complete ${count} pending lifecycle review${count === 1 ? '' : 's'}`,
  inactive: (count) => `Confirm the status of ${count} inactive site${count === 1 ? '' : 's'}`
};

const TOP_RISK_TEMPLATES: Record<GovernanceGroupKey, (count: number) => string> = {
  missingOwner: (count) =>
    `${count} business-critical site${count === 1 ? '' : 's'} ${count === 1 ? 'has' : 'have'} no active owner and require${count === 1 ? 's' : ''} immediate remediation.`,
  broadSharingAnonymous: (count) =>
    `${count} site${count === 1 ? '' : 's'} ${count === 1 ? 'has' : 'have'} unrestricted, non-expiring sharing links exposed tenant-wide.`,
  broadSharingGuest: (count) =>
    `${count} site${count === 1 ? '' : 's'} ${count === 1 ? 'has' : 'have'} more external guests than internal members.`,
  inactive: (count) =>
    `${count} site${count === 1 ? '' : 's'} ${count === 1 ? 'has' : 'have'} had no activity in 180+ days and ${count === 1 ? 'is' : 'are'} accumulating stale access.`,
  expiring: (count) =>
    `${count} site${count === 1 ? '' : 's'} ${count === 1 ? 'has an' : 'have'} overdue lifecycle review${count === 1 ? '' : 's'} with no renewal submitted.`
};

function governanceGroupKey(risk: IGovernanceRisk): GovernanceGroupKey {
  if (risk.type === 'broadSharing') {
    return risk.externalGuestCount !== undefined ? 'broadSharingGuest' : 'broadSharingAnonymous';
  }
  return risk.type;
}

function joinWithOxfordComma(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function computeGovernanceScore(risks: IGovernanceRisk[]): number {
  const penalty = risks.reduce((total, risk) => total + SEVERITY_WEIGHT[risk.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function computeScoreTrend(currentScore: number, previousScore: number): GovernanceScoreTrend {
  if (currentScore - previousScore >= TREND_THRESHOLD) return 'improving';
  if (previousScore - currentScore >= TREND_THRESHOLD) return 'declining';
  return 'stable';
}

export function computeGovernanceHealthBand(score: number): GovernanceHealthBand {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
}

export function buildExecutiveSummary(risks: IGovernanceRisk[], score: number): string {
  const total = risks.length;
  const highRisks = risks.filter((risk) => risk.severity === 'high');

  const groupKeys: GovernanceGroupKey[] = [];
  highRisks.forEach((risk) => {
    const key = governanceGroupKey(risk);
    if (groupKeys.indexOf(key) === -1) {
      groupKeys.push(key);
    }
  });
  const phrases = groupKeys.slice(0, 3).map((key) => HIGH_RISK_PHRASES[key]);

  const sentences: string[] = [`We found ${total} governance finding${total === 1 ? '' : 's'} across the tenant.`];

  if (highRisks.length > 0) {
    sentences.push(`${highRisks.length} finding${highRisks.length === 1 ? ' requires' : 's require'} immediate remediation.`);
  }
  if (phrases.length > 0) {
    sentences.push(`The highest risks are ${joinWithOxfordComma(phrases)}.`);
  }
  sentences.push(
    score >= 80
      ? 'Overall tenant governance posture is healthy, with only minor exposure remaining.'
      : 'Addressing these issues would significantly reduce governance exposure.'
  );

  return sentences.join(' ');
}

export function buildPriorityActions(risks: IGovernanceRisk[]): string[] {
  const counts = new Map<GovernanceGroupKey, number>();
  const weights = new Map<GovernanceGroupKey, number>();

  risks.forEach((risk) => {
    const key = governanceGroupKey(risk);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    weights.set(key, (weights.get(key) ?? 0) + SEVERITY_WEIGHT[risk.severity]);
  });

  return Array.from(counts.keys())
    .sort((a, b) => (weights.get(b) ?? 0) - (weights.get(a) ?? 0))
    .slice(0, 5)
    .map((key) => PRIORITY_ACTION_TEMPLATES[key](counts.get(key) ?? 0));
}

export function buildTenantInsights(risks: IGovernanceRisk[]): IGovernanceTenantInsights {
  return {
    sitesWithoutOwners: risks.filter((risk) => risk.type === 'missingOwner').length,
    sitesInactive180Days: risks.filter((risk) => risk.type === 'inactive').length,
    sitesWithAnonymousSharing: risks.filter((risk) => governanceGroupKey(risk) === 'broadSharingAnonymous').length,
    sitesWithExcessiveGuestAccess: risks.filter((risk) => governanceGroupKey(risk) === 'broadSharingGuest').length,
    expiringReviews: risks.filter((risk) => risk.type === 'expiring').length
  };
}

export function estimateRiskReductionPercent(risks: IGovernanceRisk[], topCount: number = 3): number {
  const totalWeight = risks.reduce((total, risk) => total + SEVERITY_WEIGHT[risk.severity], 0);
  if (totalWeight === 0) return 0;

  const topWeight = risks
    .map((risk) => SEVERITY_WEIGHT[risk.severity])
    .sort((a, b) => b - a)
    .slice(0, topCount)
    .reduce((total, weight) => total + weight, 0);

  return Math.round((topWeight / totalWeight) * 100);
}

export function buildTopRisk(risks: IGovernanceRisk[]): IGovernanceTopRisk | undefined {
  if (risks.length === 0) return undefined;

  const counts = new Map<GovernanceGroupKey, number>();
  const weights = new Map<GovernanceGroupKey, number>();
  const topSeverity = new Map<GovernanceGroupKey, GovernanceRiskSeverity>();

  risks.forEach((risk) => {
    const key = governanceGroupKey(risk);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    weights.set(key, (weights.get(key) ?? 0) + SEVERITY_WEIGHT[risk.severity]);

    const currentTop = topSeverity.get(key);
    if (!currentTop || SEVERITY_WEIGHT[risk.severity] > SEVERITY_WEIGHT[currentTop]) {
      topSeverity.set(key, risk.severity);
    }
  });

  const [topKey] = Array.from(weights.keys()).sort((a, b) => (weights.get(b) ?? 0) - (weights.get(a) ?? 0));

  return {
    description: TOP_RISK_TEMPLATES[topKey](counts.get(topKey) ?? 0),
    severity: topSeverity.get(topKey) ?? 'low'
  };
}
