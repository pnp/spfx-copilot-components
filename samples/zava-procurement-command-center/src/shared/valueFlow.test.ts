import { leakageOpportunities } from './operations';
import { buildValueFlow, valueEvidence, valueFlowGeometry, valueFlowSelection } from './valueFlow';
import { investmentMapValue } from './InvestmentCharts';
import { INVESTMENTS } from './portfolio';

describe('conserved procurement value evidence', () => {
  test('reconciles all three Sankey columns without adding disputed value twice', () => {
    const flow = buildValueFlow(leakageOpportunities);
    expect(flow.total).toBe(286000);
    expect(flow.verified).toBe(186000);
    expect(flow.disputed).toBe(15000);
    for (const column of [0, 1, 2]) expect(flow.nodes.filter(node => node.column === column).reduce((sum, node) => sum + node.value, 0)).toBe(flow.total);
    expect(flow.nodes.filter(node => node.column === 2).map(node => node.value)).toEqual([186000, 28000, 17000, 55000]);
    for (const node of flow.nodes) {
      if (node.column > 0) expect(flow.links.filter(link => link.target === node.id).reduce((sum, link) => sum + link.value, 0)).toBe(node.value);
      if (node.column < 2) expect(flow.links.filter(link => link.source === node.id).reduce((sum, link) => sum + link.value, 0)).toBe(node.value);
    }
  });
  test('changes records, values and geometry for a scoped or previous-period analysis', () => {
    const global = buildValueFlow(leakageOpportunities);
    const devices = buildValueFlow(valueEvidence(leakageOpportunities.filter(record => record.category === 'IT hardware'), 'Previous period'));
    expect(devices.total).toBe(116800);
    expect(devices.verified).toBe(79200);
    expect(devices.disputed).toBe(12000);
    expect(devices.nodes.some(node => node.id === 'region:AMER')).toBe(false);
    expect(valueFlowGeometry(global).links[0].path).not.toBe(valueFlowGeometry(devices).links[0].path);
    expect(valueFlowGeometry(global)).toEqual(valueFlowGeometry(global));
    expect(valueFlowGeometry(global, 1200).links[0].path).not.toBe(valueFlowGeometry(global).links[0].path);
  });
  test('resolves a selected ribbon to its own intervention, not an aggregate acceptance amount', () => {
    const flow = buildValueFlow(leakageOpportunities);
    expect(valueFlowSelection(flow, 'ZPC-LEAK-01:contracted')).toMatchObject({ opportunityId: 'ZPC-LEAK-01', value: 17000 });
    expect(valueFlowSelection(flow, 'state:verified')).toMatchObject({ value: 186000 });
    expect(valueFlowSelection(flow, 'state:verified')?.opportunityId).toBeUndefined();
    expect(valueFlowSelection(flow, 'missing')).toBeUndefined();
  });
  test('handles empty evidence without fabricating a healthy flow', () => {
    const flow = buildValueFlow([]);
    expect(flow.total).toBe(0);
    expect(valueFlowGeometry(flow)).toEqual({ nodes: [], links: [] });
  });
  test('rejects duplicate, nonfinite, reversed or double-counted evidence', () => {
    const record = leakageOpportunities[0];
    expect(() => buildValueFlow([record, record])).toThrow('Duplicate');
    expect(() => buildValueFlow([{ ...record, contracted: 100 }])).toThrow('does not reconcile');
    expect(() => buildValueFlow([{ ...record, disputed: 18000 }])).toThrow('does not reconcile');
    expect(() => buildValueFlow([{ ...record, realized: NaN }])).toThrow('does not reconcile');
    expect(() => valueEvidence([record], 'Unknown quarter')).toThrow('Unsupported');
    expect(() => valueFlowGeometry(buildValueFlow([record]), 100)).toThrow('extent');
  });
  test('map measures use real monetary differences, including zero commitments', () => {
    expect(investmentMapValue(INVESTMENTS[0], 'budget')).toBe(1200000);
    expect(investmentMapValue(INVESTMENTS[0], 'committed')).toBe(0);
    expect(investmentMapValue(INVESTMENTS[1], 'uncommitted')).toBe(330000);
  });
});
