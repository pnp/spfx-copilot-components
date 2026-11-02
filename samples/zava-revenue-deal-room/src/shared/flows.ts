import { getIntent } from './catalog';

export type RevenueFlowKind = 'pipeline' | 'approval';
export interface IRevenueFlowNode {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly column: number;
  readonly color: string;
  readonly meaning: string;
}
export interface IRevenueFlowLink {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly value: number;
}
export interface IRevenueFlow {
  readonly kind: RevenueFlowKind;
  readonly title: string;
  readonly columns: readonly string[];
  readonly nodes: readonly IRevenueFlowNode[];
  readonly links: readonly IRevenueFlowLink[];
  readonly total: number;
  readonly period: string;
  readonly region: string;
  readonly semantics: string;
  readonly allocationAssumptions: Readonly<Record<string, string | number>>;
  readonly workflowBoundary: string;
  readonly approvalRequestId?: string;
  readonly errors: readonly string[];
}
const node = (id: string, label: string, shortLabel: string, column: number, color: string, meaning: string): IRevenueFlowNode =>
  ({ id, label, shortLabel, column, color, meaning });
const pipelineNodes = [
  node('na', 'North America', 'N. America', 0, '#16863c', 'Regional opportunity allocation in the selected planning scope.'),
  node('emea', 'EMEA', 'EMEA', 0, '#008c95', 'Regional opportunity allocation in the selected planning scope.'),
  node('apac', 'Asia Pacific', 'Asia Pacific', 0, '#4178d4', 'Regional opportunity allocation in the selected planning scope.'),
  node('latam', 'Latin America', 'Lat. America', 0, '#8854b8', 'Regional opportunity allocation in the selected planning scope.'),
  node('ready', 'Buyer proof ready', 'Proof ready', 1, '#16863c', 'An assumed planning bucket, not verified buyer evidence or forecast commit.'),
  node('gap', 'Buyer access / proof gap', 'Proof gap', 1, '#d29b00', 'Value allocated to opportunities needing buyer access or proof.'),
  node('stale', 'Evidence needs refresh', 'Stale proof', 1, '#c35f35', 'An assumed refresh requirement; no actual evidence record is reclassified.'),
  node('buyer', 'Create economic-buyer access', 'Buyer access', 2, '#8854b8', 'A proposed intervention, not an introduction or customer commitment.'),
  node('refresh', 'Refresh customer proof', 'Refresh proof', 2, '#008c95', 'A proposed validation step, not proof that the customer agreed.'),
  node('terms', 'Explore commercial terms', 'Review terms', 2, '#16863c', 'A scenario discussion, not pricing authority or approved terms.')
];
const approvalNodes = [
  node('standard', 'Standard-terms intake', 'Standard', 0, '#16863c', 'Submitted value allocated to the standard review route.'),
  node('commercial', 'Commercial-exception intake', 'Commercial', 0, '#008c95', 'Intake requiring a commercial stage after Sales manager review.'),
  node('executive', 'Executive-exception intake', 'Executive', 0, '#8854b8', 'Intake requiring executive review after preceding independent stages.'),
  node('manager', 'Current stage: Sales manager', 'Sales manager', 1, '#4178d4', 'Current-stage allocation. Requests at later stages are assumed to have passed earlier independent reviews.'),
  node('director', 'Current stage: Commercial director', 'Commercial dir.', 1, '#008c95', 'Current commercial review after the required independent preceding stage.'),
  node('committee', 'Current stage: Executive committee', 'Executive', 1, '#8854b8', 'Current executive review after the required preceding reviews.'),
  node('pending', 'Awaiting a stage decision', 'Pending', 2, '#d29b00', 'No decision is implied; an assigned independent reviewer must still act.'),
  node('passed', 'Stage approved; further stages may remain', 'Stage passed', 2, '#16863c', 'Stage completion may still require further independent review before final approval.'),
  node('returned', 'Returned for evidence or corrections', 'Returned', 2, '#c35f35', 'Changes are required; a revised submission still needs independent review.'),
  node('rejected', 'Rejected at this stage', 'Rejected', 2, '#bd4260', 'A stage-outcome allocation; request decisions retain their own audit trail.')
];
const regions: Readonly<Record<string, string>> = { 'North America': 'na', EMEA: 'emea', 'Asia Pacific': 'apac', 'Latin America': 'latam' };
const pipelineIntake: readonly (readonly [string, string, number])[] = [
  ['na', 'ready', 4800000], ['na', 'gap', 5000000], ['na', 'stale', 2600000],
  ['emea', 'ready', 3100000], ['emea', 'gap', 3400000], ['emea', 'stale', 1700000],
  ['apac', 'ready', 2000000], ['apac', 'gap', 2800000], ['apac', 'stale', 1300000],
  ['latam', 'ready', 900000], ['latam', 'gap', 1200000], ['latam', 'stale', 600000]
];
const allocation: Readonly<Record<string, readonly number[]>> = { ready: [2200000, 1800000, 6800000], gap: [8100000, 2700000, 1600000], stale: [800000, 5000000, 400000] };
const approvalLinks: readonly (readonly [string, string, number])[] = [
  ['standard', 'manager', 9200000], ['commercial', 'manager', 4100000], ['commercial', 'director', 8200000],
  ['executive', 'manager', 1700000], ['executive', 'director', 2600000], ['executive', 'committee', 4200000],
  ['manager', 'pending', 6400000], ['manager', 'passed', 4800000], ['manager', 'returned', 2600000], ['manager', 'rejected', 1200000],
  ['director', 'pending', 4600000], ['director', 'passed', 3700000], ['director', 'returned', 1800000], ['director', 'rejected', 700000],
  ['committee', 'pending', 2200000], ['committee', 'passed', 1200000], ['committee', 'returned', 500000], ['committee', 'rejected', 300000]
];
export function revenueFlow(kind: RevenueFlowKind, period: string, region: string): IRevenueFlow {
  const errors = [
    ...(['current', 'next', 'all'].indexOf(period) < 0 ? [`Unknown planning period: ${period}.`] : []),
    ...(region !== 'all' && !Object.prototype.hasOwnProperty.call(regions, region) ? [`Unknown planning region: ${region}.`] : []),
    ...(kind === 'approval' && region !== 'all' ? ['Approval planning batches do not have a regional attribution.'] : [])
  ];
  const semantics = kind === 'pipeline'
    ? 'Offline USD planning allocations, distinct from catalog totals, verified buyer proof, seller probability and forecast commit. Ribbons conserve value; they do not predict conversion.'
    : 'Offline USD intake/current-stage allocations, separate from request-level records. Stage completion is not final approval; required independent reviews are never bypassed. Viewing the flow submits or decides no request.';
  const base = {
    kind, title: getIntent(kind === 'pipeline' ? 'ExplorePipelineFlow' : 'ExploreApprovalFlow').title,
    columns: kind === 'pipeline' ? ['Region', 'Buyer readiness', 'Next action'] : ['Intake route', 'Current reviewer', 'Stage outcome'],
    period, region, semantics, errors,
    allocationAssumptions: { nextScenarioMultiplier: 1.2, bothScenariosMultiplier: 2.2, allocationRule: 'Planning weights conserve integer USD; they are not observed conversion.' },
    workflowBoundary: kind === 'approval' ? 'Request review uses the selected request values, evidence and decision trail. Aggregate flow values are not attributed to an individual request.' : 'This graph is separate from catalog pipeline metrics; opening attention keeps the planning filters but does not substitute a deal.',
    approvalRequestId: kind === 'approval' ? 'ZM-1001' : undefined
  };
  if (errors.length) return { ...base, nodes: [], links: [], total: 0 };
  const factor = period === 'current' ? 1 : period === 'next' ? 1.2 : 2.2;
  const makeLink = (source: string, target: string, value: number): IRevenueFlowLink => ({ id: `${kind}:${source}:${target}`, source, target, value });
  let links: IRevenueFlowLink[];
  if (kind === 'pipeline') {
    links = pipelineIntake.filter(item => region === 'all' || item[0] === regions[region]).map(item => makeLink(item[0], item[1], Math.round(item[2] * factor)));
    ['ready', 'gap', 'stale'].forEach(id => {
      const total = links.filter(item => item.target === id).reduce((sum, item) => sum + item.value, 0);
      const weights = allocation[id];
      const denominator = weights.reduce((sum, value) => sum + value, 0);
      const buyer = Math.round(total * weights[0] / denominator);
      const refresh = Math.round(total * weights[1] / denominator);
      links.push(makeLink(id, 'buyer', buyer), makeLink(id, 'refresh', refresh), makeLink(id, 'terms', total - buyer - refresh));
    });
  } else links = approvalLinks.map(item => makeLink(item[0], item[1], Math.round(item[2] * factor)));
  const nodes = (kind === 'pipeline' ? pipelineNodes : approvalNodes).filter(item => links.some(link => link.source === item.id || link.target === item.id));
  const total = links.filter(item => nodes.some(source => source.id === item.source && source.column === 0)).reduce((sum, item) => sum + item.value, 0);
  for (const item of nodes) {
    const incoming = links.filter(link => link.target === item.id).reduce((sum, link) => sum + link.value, 0);
    const outgoing = links.filter(link => link.source === item.id).reduce((sum, link) => sum + link.value, 0);
    if (item.column === 1 && incoming !== outgoing) throw new Error(`Unbalanced fictional flow node: ${item.id}`);
  }
  return { ...base, nodes, links, total };
}
export const flowNodeValue = (flow: IRevenueFlow, id: string): number =>
  Math.max(flow.links.filter(item => item.source === id).reduce((sum, item) => sum + item.value, 0), flow.links.filter(item => item.target === id).reduce((sum, item) => sum + item.value, 0));
