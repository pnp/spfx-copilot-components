import { sankey, sankeyJustify, sankeyLinkHorizontal } from 'd3-sankey';
import type { IRevenueFlow, IRevenueFlowNode } from '../flows';

export interface IFlowNodeGeometry {
  readonly node: IRevenueFlowNode;
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
  readonly value: number;
}
export interface IFlowRibbonGeometry {
  readonly id: string;
  readonly source: IRevenueFlowNode;
  readonly target: IRevenueFlowNode;
  readonly path: string;
  readonly width: number;
  readonly value: number;
  readonly centerX: number;
  readonly centerY: number;
}
export function sankeyGeometry(flow: IRevenueFlow, width: number, height: number): {
  readonly nodes: readonly IFlowNodeGeometry[];
  readonly links: readonly IFlowRibbonGeometry[];
} {
  if (flow.errors.length || !flow.nodes.length || !Number.isFinite(width) || width < 240 || !Number.isFinite(height) || height < 160) {
    throw new Error('Sankey layout requires a valid nonempty flow and a usable chart extent.');
  }
  const graph = sankey<IRevenueFlowNode, { readonly id: string }>()
    .nodeId(item => item.id).nodeAlign(sankeyJustify).nodeSort(null).linkSort(null)
    .nodeWidth(12).nodePadding(18).extent([[4, 16], [width - 4, height - 18]])({
      nodes: flow.nodes.map(item => ({ ...item })),
      links: flow.links.map(item => ({ ...item }))
    });
  const nodes = graph.nodes.map(item => {
    const { x0, x1, y0, y1, value } = item;
    if (typeof x0 !== 'number' || typeof x1 !== 'number' || typeof y0 !== 'number' || typeof y1 !== 'number' || typeof value !== 'number' ||
      ![x0, x1, y0, y1, value].every(Number.isFinite) || x1 <= x0 || y1 < y0 || value <= 0) throw new Error(`Invalid Sankey node geometry: ${item.id}`);
    const original = flow.nodes.find(node => node.id === item.id);
    if (!original) throw new Error(`Unknown Sankey layout node: ${item.id}`);
    return { node: original, x0, x1, y0, y1, value };
  });
  const path = sankeyLinkHorizontal<IRevenueFlowNode, { readonly id: string }>();
  const links = graph.links.map(item => {
    const ribbon = path(item);
    if (typeof item.source !== 'object' || typeof item.target !== 'object' || typeof item.width !== 'number' || !Number.isFinite(item.width) ||
      typeof item.source.x1 !== 'number' || typeof item.target.x0 !== 'number' || typeof item.y0 !== 'number' || typeof item.y1 !== 'number' ||
      ![item.source.x1, item.target.x0, item.y0, item.y1].every(Number.isFinite) ||
      item.width <= 0 || !ribbon || /NaN|Infinity/.test(ribbon)) throw new Error(`Invalid Sankey ribbon geometry: ${item.id}`);
    const source = flow.nodes.find(node => typeof item.source === 'object' && node.id === item.source.id);
    const target = flow.nodes.find(node => typeof item.target === 'object' && node.id === item.target.id);
    if (!source || !target) throw new Error(`Unknown Sankey ribbon endpoint: ${item.id}`);
    return { id: item.id, source, target, path: ribbon, width: item.width, value: item.value, centerX: (item.source.x1 + item.target.x0) / 2, centerY: (item.y0 + item.y1) / 2 };
  });
  return { nodes, links };
}
