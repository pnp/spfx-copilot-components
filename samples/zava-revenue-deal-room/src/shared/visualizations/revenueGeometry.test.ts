import {
  buildCommercialGeometry,
  buildForecastBridge,
  buildPipelineBars,
  buildRegionMarks,
  buildRelationshipMarks
} from './revenueGeometry';
import { calculateCommercialOffer } from '../domain';

describe('D3 revenue geometry', () => {
  it('changes commercial paths and selected coordinates with scenario inputs', () => {
    const base = buildCommercialGeometry({ quantity: 760, termMonths: 36, discount: 8, services: 150000, probability: .65 });
    const protectedMargin = buildCommercialGeometry({ quantity: 1040, termMonths: 24, discount: 20, services: 300000, probability: .7 });
    expect(base.linePath).not.toBe(protectedMargin.linePath);
    expect(base.areaPath).not.toBe(protectedMargin.areaPath);
    expect(base.selectedX).not.toBe(protectedMargin.selectedX);
    expect(base.selectedY).not.toBe(protectedMargin.selectedY);
  });
  it('keeps extreme but valid commercial scenarios within the plotted domain', () => {
    const geometry = buildCommercialGeometry({ quantity: 100000, termMonths: 120, discount: 100, services: 1000, probability: .5 });
    expect(geometry.selectedX).toBeLessThanOrEqual(494);
    expect(geometry.selectedX).toBeGreaterThanOrEqual(48);
    expect(geometry.selectedY).toBeLessThanOrEqual(154);
    expect(geometry.selectedY).toBeGreaterThanOrEqual(24);
    expect(geometry.linePath).not.toContain('NaN');
  });
  it('uses exact contract/ramp/service economics instead of an invented adoption or margin index', () => {
    const input = { quantity: 1000, termMonths: 30, discount: 8, services: 150000, probability: .65, ramp: [60, 80, 100] };
    const geometry = buildCommercialGeometry(input);
    expect(geometry.selectedPoint.margin).toBe(calculateCommercialOffer(input).grossMargin);
    expect(geometry.selectedPoint.contractValue).toBe(calculateCommercialOffer(input).contractValue);
    expect(geometry.selectedPoint).not.toHaveProperty('customerValue');
  });

  it('builds signed forecast bridge geometry', () => {
    const bars = buildForecastBridge([
      { label: 'Opening', value: 8.4, kind: 'start' },
      { label: 'Expansion', value: 1.3, kind: 'increase' },
      { label: 'Slip', value: -0.8, kind: 'decrease' },
      { label: 'Commit', value: 8.9, kind: 'end' }
    ]);
    expect(bars).toHaveLength(4);
    expect(bars[1].endValue).toBeGreaterThan(bars[1].startValue);
    expect(bars[2].endValue).toBeLessThan(bars[2].startValue);
    expect(bars.every((bar) => bar.height > 0 && bar.width > 0)).toBe(true);
  });

  it('scales pipeline, region, and relationship marks from data', () => {
    const pipeline = buildPipelineBars([
      { label: 'Qualify', value: 36, evidence: 55 },
      { label: 'Commit', value: 14, evidence: 82 }
    ]);
    const regions = buildRegionMarks([
      { id: 'na', label: 'North America', longitude: -100, latitude: 42, value: 42, risk: 18 },
      { id: 'apac', label: 'APAC', longitude: 120, latitude: 20, value: 18, risk: 39 }
    ]);
    const relationships = buildRelationshipMarks([
      { id: 'champion', influence: 92, authority: 72, angle: 205 },
      { id: 'buyer', influence: 88, authority: 95, angle: 325 }
    ]);
    expect(pipeline[0].height).toBeGreaterThan(pipeline[1].height);
    expect(regions[0].x).toBeLessThan(regions[1].x);
    expect(regions[0].radius).toBeGreaterThan(regions[1].radius);
    expect(relationships[0].x).not.toBe(relationships[1].x);
    expect(relationships[0].radius).not.toBe(relationships[1].radius);
  });

  it('keeps monetary map areas comparable across periods and hides zero-value bubbles', () => {
    const signal = { id: 'na', label: 'North America', longitude: -100, latitude: 42, risk: 18 };
    const current = buildRegionMarks([{ ...signal, value: 8 }], 10)[0];
    const next = buildRegionMarks([{ ...signal, value: 2 }], 10)[0];
    const empty = buildRegionMarks([{ ...signal, value: 0 }], 10)[0];
    expect(current.radius * current.radius / (next.radius * next.radius)).toBeCloseTo(4);
    expect(current.radius).toBeGreaterThan(next.radius);
    expect(empty.radius).toBe(0);
    expect(current.x).toBe(next.x);
    expect(current.y).toBe(next.y);
  });
});
