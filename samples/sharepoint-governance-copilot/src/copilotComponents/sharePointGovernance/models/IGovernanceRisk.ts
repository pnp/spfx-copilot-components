export type GovernanceRiskType =
  | 'missingOwner'
  | 'inactive'
  | 'broadSharing'
  | 'expiring';

export type GovernanceRiskSeverity = 'high' | 'medium' | 'low';

export type GovernanceScoreTrend = 'improving' | 'stable' | 'declining';

export type GovernanceHealthBand = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface IGovernanceRisk {
  id: string;
  siteName: string;
  siteUrl: string;
  type: GovernanceRiskType;
  severity: GovernanceRiskSeverity;
  /** Short, factual description of what was detected. */
  reason: string;
  /** Business impact of leaving this finding unresolved. */
  impact: string;
  /** Why this finding matters to governance, compliance, or risk posture. */
  whyItMatters: string;
  /** The concrete next step a site owner or admin should take. */
  recommendedAction: string;
  /** Label for the primary remediation call-to-action button. */
  ctaLabel: string;
  ownerCount?: number;
  /** Number of external guests, set when guest access is the driver of the finding. */
  externalGuestCount?: number;
  lastActivityDate?: string;
  expirationDate?: string;
}

export interface IGovernanceSummary {
  missingOwner: number;
  inactive: number;
  broadSharing: number;
  expiring: number;
}

export interface IGovernanceSeverityCounts {
  high: number;
  medium: number;
  low: number;
}

export interface IGovernanceTenantInsights {
  sitesWithoutOwners: number;
  sitesInactive180Days: number;
  sitesWithAnonymousSharing: number;
  sitesWithExcessiveGuestAccess: number;
  expiringReviews: number;
}

export interface IGovernanceTopRisk {
  /** Single-sentence, business-oriented description of the tenant's single biggest risk. */
  description: string;
  severity: GovernanceRiskSeverity;
}

export interface IGovernanceResult {
  generatedAt: string;
  /** Overall tenant governance health, 0 (critical) to 100 (excellent). */
  governanceScore: number;
  /** Qualitative band derived from `governanceScore` (Excellent, Good, Fair, Poor, Critical). */
  governanceHealthBand: GovernanceHealthBand;
  scoreTrend: GovernanceScoreTrend;
  /** Point change in `governanceScore` versus the previous reporting period. */
  scoreTrendDelta: number;
  /** AI-style narrative summarizing the tenant's governance posture. */
  executiveSummary: string;
  /** The tenant's single biggest risk, highlighted ahead of the full findings list. */
  topRisk?: IGovernanceTopRisk;
  /** Top 3-5 remediation actions, ordered by severity-weighted impact. */
  priorityActions: string[];
  /** Estimated percentage reduction in tenant governance risk from resolving the top findings. */
  estimatedRiskReductionPercent: number;
  /** Total findings across the tenant that match the requested filters, before pagination. */
  totalFindings: number;
  summary: IGovernanceSummary;
  severityCounts: IGovernanceSeverityCounts;
  tenantInsights: IGovernanceTenantInsights;
  /** Findings to display, already paginated to `maxResults`. */
  risks: IGovernanceRisk[];
}
