import { ACCOUNTS, HERO_MILESTONES, OPPORTUNITIES, type IOpportunity } from './domain';
import { currency, resolveScope, scopedEvidence, type IBusinessRow } from './operations';
import { nextApproval, type DealRequest } from './dealWorkflow';
import type { RevenueIntentKey } from './catalog';
import type { IForecastMovement } from './visualizations/revenueGeometry';

export const DEMO_REVENUE_OWNER = 'Megan Bowen';
export const DEMO_BOOK_IDS = ['ZDR-2042', 'ZDR-2058', 'ZDR-2059', 'ZDR-2060', 'ZDR-2061', 'ZDR-2072', 'ZDR-2074', 'ZDR-2075'] as const;
export interface IRevenuePriority extends IBusinessRow {
  readonly accountId: string;
  readonly opportunityId?: string;
  readonly requestId?: string;
  readonly target: RevenueIntentKey;
  readonly actionLabel: string;
  readonly due: string;
  readonly rank: number;
}
export interface ICloseStatus { readonly label: string; readonly count: number; }

export function personalRevenueBrief(period: string, region: string, requests: readonly DealRequest[]): {
  readonly bookOwner: string;
  readonly opportunities: readonly IOpportunity[];
  readonly priorities: readonly IRevenuePriority[];
  readonly priorityCount: number;
  readonly closeStatus: readonly ICloseStatus[];
  readonly outlook: readonly IForecastMovement[];
  readonly metrics: { readonly open: number; readonly weighted: number; readonly commitStage: number; readonly pendingRequests: number; readonly approvedRequests: number; readonly completedMilestones: number; readonly milestoneCount: number };
} {
  const owned = new Set<string>(DEMO_BOOK_IDS);
  const opportunities = OPPORTUNITIES.filter(item => owned.has(item.id) &&
    (period === 'all' || period === 'current' && item.quarterOffset === 0 || period === 'next' && item.quarterOffset === 1) &&
    (region === 'all' || ACCOUNTS.find(account => account.id === item.accountId)?.region === region));
  const ownedRequests = requests.filter(item => item.draft.owner === DEMO_REVENUE_OWNER &&
    (region === 'all' || ACCOUNTS.find(account => account.id === item.draft.accountId)?.region === region));
  const priorities: IRevenuePriority[] = [];
  for (const opportunity of opportunities) {
    const evidence = scopedEvidence(resolveScope({ opportunityId: opportunity.id }));
    const add = (id: string, title: string, detail: string, target: RevenueIntentKey, actionLabel: string, rank: number, due: string, kind: string): void => {
      priorities.push({ id: `${opportunity.id}-${id}`, title, detail, target, actionLabel, rank, due, kind,
        accountId: opportunity.accountId, opportunityId: opportunity.id, source: 'Owned book / catalog facts and recorded evidence' });
    };
    if (opportunity.id === 'ZDR-2042') {
      const buyerGap = evidence.find(item => item.id === 'EV-03');
      if (buyerGap) add('buyers', 'Secure Contoso economic-buyer access', `${buyerGap.detail} ${currency(opportunity.value)} open value.`, 'MapBuyingCommittee', 'Map Contoso buyers in Copilot', 100, 'Before the next buyer interaction', 'contrary evidence');
      const security = HERO_MILESTONES.find(item => item.id === 'MS-02');
      if (security && security.status !== 'complete') add('security', 'Unblock the security-to-signature path', `${security.title}; owner ${security.owner}; ${security.status}; due +${security.dueOffsetDays} days in the close plan.`, 'BuildMutualActionPlan', 'Open the close plan in Copilot', 95, `Dependency +${security.dueOffsetDays}d`, 'at-risk milestone');
      add('meeting', 'Prepare the Contoso steering conversation', 'Use recorded attendees and evidence gaps to prepare questions; no meeting outcome is assumed.', 'PrepareCustomerMeeting', 'Prepare the meeting in Copilot', 90, 'Before the steering meeting', 'next action');
    } else if (opportunity.stage === 'Commit') {
      add('forecast', `Validate ${opportunity.name} commit evidence`, `${currency(opportunity.value)} catalog-stage value; seller probability is not buyer commitment. ${evidence.length} recorded evidence items.`, 'InspectForecastCommit', 'Review forecast evidence in Copilot', 85, 'Before the forecast review', 'buyer-proof gap');
    } else if (opportunity.stage === 'Qualify') {
      add('qualify', `Qualify ${opportunity.name}`, 'Confirm customer need, accountable discovery and independent buyer proof before advancing pursuit.', 'QualifyOpportunity', 'Open qualification in Copilot', 75, 'Next discovery checkpoint', 'next action');
    } else if (opportunity.stage === 'Propose') {
      add('commercial', `Shape ${opportunity.name} commercials`, `${currency(opportunity.value)} open value; model a proposed offer without treating it as an approved quote.`, 'SimulateCommercialOffer', 'Model the offer in Copilot', 70, 'Before commercial review', 'next action');
    } else {
      add('risk', `Inspect ${opportunity.name} exposure`, `${currency(opportunity.value * (1 - opportunity.probability))} seller-unweighted value, not predicted loss. ${evidence.length} recorded evidence items.`, 'GetDealRisk', 'Inspect deal risk in Copilot', opportunity.value >= 4000000 ? 80 : 65, 'Next deal review', 'evidence gap');
    }
  }
  for (const request of ownedRequests.filter(item => item.status === 'pending' || item.status === 'returned')) {
    priorities.push({
      id: `request-${request.id}`, title: `${request.id}: review the request evidence`,
      detail: `${request.draft.title}; ${request.status}; ${nextApproval(request) ? `next independent stage: ${nextApproval(request)}` : 'returned for changes'}. Opening the review does not approve your own request.`,
      accountId: request.draft.accountId, requestId: request.id, target: 'ReviewDealApproval',
      actionLabel: 'Inspect approval evidence in Copilot', due: 'Request / all submission periods',
      rank: request.status === 'returned' ? 97 : 92, source: 'Confirmed request ledger', kind: request.status
    });
  }
  priorities.sort((left, right) => right.rank - left.rank || left.id.localeCompare(right.id));
  const milestones = HERO_MILESTONES.filter(item => opportunities.some(opportunity => opportunity.id === item.opportunityId));
  const closeStatus = [
    { label: 'Complete', count: milestones.filter(item => item.status === 'complete').length },
    { label: 'On track', count: milestones.filter(item => item.status === 'on-track').length },
    { label: 'At risk', count: milestones.filter(item => item.status === 'at-risk').length },
    { label: 'Blocked', count: milestones.filter(item => item.status === 'blocked').length }
  ];
  const open = opportunities.reduce((sum, item) => sum + item.value, 0);
  const weighted = opportunities.reduce((sum, item) => sum + item.value * item.probability, 0);
  const outlook: IForecastMovement[] = [
    { label: 'Open', value: open / 1000000, kind: 'start' },
    ...['Qualify', 'Develop', 'Propose', 'Commit'].map(stage => ({
      label: stage, value: -opportunities.filter(item => item.stage === stage).reduce((sum, item) => sum + item.value * (1 - item.probability), 0) / 1000000,
      kind: 'decrease' as const
    })),
    { label: 'Weighted', value: weighted / 1000000, kind: 'end' }
  ];
  return {
    bookOwner: DEMO_REVENUE_OWNER, opportunities, priorities: priorities.slice(0, 6), priorityCount: priorities.length, closeStatus, outlook,
    metrics: {
      open, weighted, commitStage: opportunities.filter(item => item.stage === 'Commit').reduce((sum, item) => sum + item.value, 0),
      pendingRequests: ownedRequests.filter(item => item.status === 'pending').length,
      approvedRequests: ownedRequests.filter(item => item.status === 'approved').length,
      completedMilestones: closeStatus[0].count, milestoneCount: milestones.length
    }
  };
}
