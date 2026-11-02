import { flowNodeValue, revenueFlow, type RevenueFlowKind } from './flows';
import { sankeyGeometry } from './visualizations/sankeyGeometry';
import { getIntent } from './catalog';

describe('fictional conserved revenue Sankey models', () => {
  test('flow titles come from the same business catalog as headers and Copilot continuations', () => {
    expect(revenueFlow('pipeline', 'current', 'all').title).toBe(getIntent('ExplorePipelineFlow').title);
    expect(revenueFlow('approval', 'current', 'all').title).toBe(getIntent('ExploreApprovalFlow').title);
  });
  test.each(['current', 'next', 'all'])('pipeline %s conserves value across every filtered region and action allocation', period => {
    for (const region of ['all', 'North America', 'EMEA', 'Asia Pacific', 'Latin America']) {
      const flow = revenueFlow('pipeline', period, region);
      expect(flow.errors).toEqual([]);
      expect(new Set(flow.nodes.map(item => item.id)).size).toBe(flow.nodes.length);
      expect(new Set(flow.links.map(item => item.id)).size).toBe(flow.links.length);
      expect(flow.links.every(item => Number.isInteger(item.value) && item.value > 0)).toBe(true);
      for (const node of flow.nodes.filter(item => item.column === 1)) {
        expect(flow.links.filter(item => item.target === node.id).reduce((sum, item) => sum + item.value, 0))
          .toBe(flow.links.filter(item => item.source === node.id).reduce((sum, item) => sum + item.value, 0));
      }
      expect(flow.nodes.filter(item => item.column === 2).reduce((sum, item) => sum + flowNodeValue(flow, item.id), 0)).toBe(flow.total);
    }
  });
  test('base scenarios have exact volumes and distinguish stage decisions from final approval', () => {
    expect(revenueFlow('pipeline', 'current', 'all').total).toBe(29400000);
    const approval = revenueFlow('approval', 'current', 'all');
    expect(approval.total).toBe(30000000);
    expect(flowNodeValue(approval, 'pending')).toBe(13200000);
    expect(flowNodeValue(approval, 'passed')).toBe(9700000);
    expect(approval.nodes.find(item => item.id === 'passed')?.meaning).toContain('not overall final');
    expect(approval.semantics).toContain('not the stored demo approval queue');
  });
  test.each(['pipeline', 'approval'] satisfies RevenueFlowKind[])('%s rejects unsupported planning scopes without replacing them with a default', kind => {
    for (const [period, region] of [['yesterday', 'all'], ['current', 'Africa'], ['current', 'constructor']]) {
      const flow = revenueFlow(kind, period, region);
      expect(flow.errors.length).toBeGreaterThan(0);
      expect(flow.period).toBe(period);
      expect(flow.region).toBe(region);
      expect(flow.nodes).toHaveLength(0);
      expect(flow.links).toHaveLength(0);
    }
    expect(revenueFlow('approval', 'current', 'EMEA').errors).toContain('Approval planning batches do not have a regional attribution.');
  });
  test.each(['pipeline', 'approval'] satisfies RevenueFlowKind[])('%s D3 layout is finite, width-proportional, serializable and leaves source data immutable', kind => {
    const flow = revenueFlow(kind, 'current', 'all');
    const original = JSON.stringify(flow);
    for (const width of [300, 680]) {
      const graph = sankeyGeometry(flow, width, 236);
      expect(graph.nodes).toHaveLength(10);
      expect(graph.links).toHaveLength(flow.links.length);
      expect(graph.links.every(item => item.width > 0 && !/NaN|Infinity/.test(item.path))).toBe(true);
      expect(() => JSON.stringify(graph)).not.toThrow();
      for (const link of graph.links) expect(link.width / link.value).toBeCloseTo(graph.links[0].width / graph.links[0].value, 10);
    }
    expect(JSON.stringify(flow)).toBe(original);
  });
});
