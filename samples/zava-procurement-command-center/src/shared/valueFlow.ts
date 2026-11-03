import { scaleLinear } from 'd3-scale';
import { linkHorizontal } from 'd3-shape';
import type { leakageOpportunities } from './operations';

export type IValueEvidence = typeof leakageOpportunities[number];
export interface IValueFlowNode {
  readonly id: string;
  readonly label: string;
  readonly column: number;
  readonly value: number;
  readonly state?: 'verified' | 'contracted' | 'negotiated' | 'identified';
}
export interface IValueFlowLink {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly value: number;
  readonly opportunityId: string;
}
export interface IValueFlow {
  readonly nodes: readonly IValueFlowNode[];
  readonly links: readonly IValueFlowLink[];
  readonly records: readonly IValueEvidence[];
  readonly total: number;
  readonly verified: number;
  readonly disputed: number;
}
const states = [
  { id: 'verified', label: 'Verified value' },
  { id: 'contracted', label: 'Contracted / unverified' },
  { id: 'negotiated', label: 'Negotiated / uncontracted' },
  { id: 'identified', label: 'Identified / unnegotiated' }
] as const;

export function valueEvidence(records: readonly IValueEvidence[], period = 'Current period'): readonly IValueEvidence[] {
  if (period !== 'Current period' && period !== 'Previous period') throw new Error(`Unsupported value evidence period: ${period}`);
  const factor = period === 'Previous period' ? 0.8 : 1;
  return records.map(record => ({
    ...record, identified: Math.round(record.identified * factor), negotiated: Math.round(record.negotiated * factor),
    contracted: Math.round(record.contracted * factor), realized: Math.round(record.realized * factor), disputed: Math.round(record.disputed * factor)
  }));
}

export function buildValueFlow(records: readonly IValueEvidence[]): IValueFlow {
  const nodes: IValueFlowNode[] = [];
  const links: IValueFlowLink[] = [];
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate value intervention: ${record.id}`);
    ids.add(record.id);
    if (![record.identified, record.negotiated, record.contracted, record.realized, record.disputed].every(value => Number.isFinite(value) && value >= 0) ||
      record.identified < record.negotiated || record.negotiated < record.contracted || record.contracted < record.realized ||
      record.disputed > record.contracted - record.realized) throw new Error(`Value evidence does not reconcile: ${record.id}`);
  }
  for (const region of Array.from(new Set(records.map(record => record.region)))) {
    const value = records.filter(record => record.region === region).reduce((sum, record) => sum + record.identified, 0);
    if (value > 0) nodes.push({ id: `region:${region}`, label: region, column: 0, value });
  }
  for (const record of records.filter(item => item.identified > 0)) {
    const id = `opportunity:${record.id}`;
    nodes.push({ id, label: record.label, column: 1, value: record.identified });
    links.push({ id: `${record.id}:scope`, source: `region:${record.region}`, target: id, value: record.identified, opportunityId: record.id });
    const amounts = [record.realized, record.contracted - record.realized, record.negotiated - record.contracted, record.identified - record.negotiated];
    states.forEach((state, index) => {
      if (amounts[index] > 0) links.push({ id: `${record.id}:${state.id}`, source: id, target: `state:${state.id}`, value: amounts[index], opportunityId: record.id });
    });
  }
  for (const state of states) {
    const value = links.filter(link => link.target === `state:${state.id}`).reduce((sum, link) => sum + link.value, 0);
    if (value > 0) nodes.push({ id: `state:${state.id}`, label: state.label, column: 2, value, state: state.id });
  }
  return {
    nodes, links, records, total: records.reduce((sum, record) => sum + record.identified, 0),
    verified: records.reduce((sum, record) => sum + record.realized, 0),
    disputed: records.reduce((sum, record) => sum + record.disputed, 0)
  };
}

export function valueFlowSelection(flow: IValueFlow, id: string): {
  readonly label: string; readonly value: number; readonly opportunityId?: string;
} | undefined {
  const node = flow.nodes.find(item => item.id === id);
  if (node) return { label: node.label, value: node.value, opportunityId: node.column === 1 ? node.id.slice('opportunity:'.length) : undefined };
  const link = flow.links.find(item => item.id === id);
  if (!link) return undefined;
  return {
    label: `${flow.nodes.find(item => item.id === link.source)?.label} -> ${flow.nodes.find(item => item.id === link.target)?.label}`,
    value: link.value, opportunityId: link.opportunityId
  };
}

export function valueFlowGeometry(flow: IValueFlow, width = 900, height = 360): {
  readonly nodes: readonly (IValueFlowNode & { readonly x: number; readonly y: number; readonly height: number })[];
  readonly links: readonly (IValueFlowLink & { readonly path: string; readonly width: number })[];
} {
  if (flow.total <= 0 || !flow.nodes.length) return { nodes: [], links: [] };
  if (!Number.isFinite(width) || width < 500 || !Number.isFinite(height) || height < 240) throw new Error('Value flow needs a usable chart extent.');
  const gap = 22;
  const top = 38;
  const available = height - top - 24;
  const columns = [0, 1, 2].map(column => flow.nodes.filter(node => node.column === column));
  const maximumNodes = Math.max(...columns.map(column => column.length));
  const scale = scaleLinear().domain([0, flow.total]).range([0, available - (maximumNodes - 1) * gap]);
  const x = scaleLinear().domain([0, 2]).range([10, width - 22]);
  const nodes = columns.reduce<(IValueFlowNode & { x: number; y: number; height: number })[]>((result, column) => {
    const used = column.reduce((sum, node) => sum + scale(node.value), 0) + (column.length - 1) * gap;
    let y = top + (available - used) / 2;
    for (const node of column) {
      result.push({ ...node, x: x(node.column), y, height: scale(node.value) });
      y += scale(node.value) + gap;
    }
    return result;
  }, []);
  const offsets = new Map<string, number>();
  const shape = linkHorizontal();
  const links = flow.links.map(link => {
    const source = nodes.find(node => node.id === link.source);
    const target = nodes.find(node => node.id === link.target);
    if (!source || !target) throw new Error(`Unresolved value-flow connection: ${link.id}`);
    const sourceKey = `out:${source.id}`;
    const targetKey = `in:${target.id}`;
    const thickness = scale(link.value);
    const sy = source.y + (offsets.get(sourceKey) || 0) + thickness / 2;
    const ty = target.y + (offsets.get(targetKey) || 0) + thickness / 2;
    offsets.set(sourceKey, (offsets.get(sourceKey) || 0) + thickness);
    offsets.set(targetKey, (offsets.get(targetKey) || 0) + thickness);
    const path = shape({ source: [source.x + 12, sy], target: [target.x, ty] });
    if (!path || /NaN|Infinity/.test(path) || thickness <= 0) throw new Error(`Invalid value-flow geometry: ${link.id}`);
    return { ...link, path, width: thickness };
  });
  return { nodes, links };
}
