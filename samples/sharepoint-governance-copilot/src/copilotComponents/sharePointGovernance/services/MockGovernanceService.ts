import { mockGovernanceRisks, mockPreviousGovernanceScore } from '../mockData/mockGovernanceData';
import {
  GovernanceRiskSeverity,
  IGovernanceResult,
  IGovernanceRisk
} from '../models/IGovernanceRisk';
import { ISharePointGovernanceCopilotComponentProperties } from '../SharePointGovernanceCopilotComponentProperties';
import { IGovernanceService } from './IGovernanceService';
import {
  buildExecutiveSummary,
  buildPriorityActions,
  buildTenantInsights,
  buildTopRisk,
  computeGovernanceHealthBand,
  computeGovernanceScore,
  computeScoreTrend,
  estimateRiskReductionPercent
} from './governanceInsights';

const severityWeight: Record<GovernanceRiskSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3
};

export class MockGovernanceService implements IGovernanceService {
  public async getGovernanceRisks(
    options: ISharePointGovernanceCopilotComponentProperties
  ): Promise<IGovernanceResult> {
    // Tenant-wide KPIs (score, executive summary, insights) always reflect the full
    // tenant, independent of the filters applied to the findings list below.
    const allRisks = mockGovernanceRisks;
    const governanceScore = computeGovernanceScore(allRisks);
    const governanceHealthBand = computeGovernanceHealthBand(governanceScore);
    const scoreTrend = computeScoreTrend(governanceScore, mockPreviousGovernanceScore);
    const scoreTrendDelta = governanceScore - mockPreviousGovernanceScore;
    const executiveSummary = buildExecutiveSummary(allRisks, governanceScore);
    const topRisk = buildTopRisk(allRisks);
    const priorityActions = buildPriorityActions(allRisks);
    const tenantInsights = buildTenantInsights(allRisks);
    const estimatedRiskReductionPercent = estimateRiskReductionPercent(allRisks);

    const minimum = severityWeight[options.minimumSeverity ?? 'low'];
    const maxResults = Math.min(Math.max(options.maxResults ?? 20, 1), 50);

    const filteredRisks: IGovernanceRisk[] = allRisks
      .filter((risk) => options.riskType === undefined || options.riskType === 'all' || risk.type === options.riskType)
      .filter((risk) => severityWeight[risk.severity] >= minimum);

    return {
      generatedAt: new Date().toISOString(),
      governanceScore,
      governanceHealthBand,
      scoreTrend,
      scoreTrendDelta,
      executiveSummary,
      topRisk,
      priorityActions,
      estimatedRiskReductionPercent,
      totalFindings: filteredRisks.length,
      summary: {
        missingOwner: filteredRisks.filter((risk) => risk.type === 'missingOwner').length,
        inactive: filteredRisks.filter((risk) => risk.type === 'inactive').length,
        broadSharing: filteredRisks.filter((risk) => risk.type === 'broadSharing').length,
        expiring: filteredRisks.filter((risk) => risk.type === 'expiring').length
      },
      severityCounts: {
        high: filteredRisks.filter((risk) => risk.severity === 'high').length,
        medium: filteredRisks.filter((risk) => risk.severity === 'medium').length,
        low: filteredRisks.filter((risk) => risk.severity === 'low').length
      },
      tenantInsights,
      risks: filteredRisks.slice(0, maxResults)
    };
  }
}
