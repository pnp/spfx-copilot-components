import { max } from 'd3-array';
import { scaleBand, scaleLinear, scaleSqrt } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import { calculateCommercialOffer, type ICommercialInput } from '../domain';

export interface ICommercialPoint {
  readonly discount: number;
  readonly margin: number;
  readonly contractValue: number;
}

export interface ICommercialGeometry {
  readonly linePath: string;
  readonly areaPath: string;
  readonly selectedX: number;
  readonly selectedY: number;
  readonly selectedPoint: ICommercialPoint;
}

export interface IForecastMovement {
  readonly label: string;
  readonly value: number;
  readonly kind: 'start' | 'increase' | 'decrease' | 'end';
}

export interface IForecastBar extends IForecastMovement {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly startValue: number;
  readonly endValue: number;
}

export interface IPipelineStage {
  readonly label: string;
  readonly value: number;
  readonly evidence: number;
}

export interface IPipelineBar extends IPipelineStage {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface IRegionSignal {
  readonly id: string;
  readonly label: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly value: number;
  readonly risk: number;
}

export interface IRegionMark extends IRegionSignal {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface IRelationshipNode {
  readonly id: string;
  readonly influence: number;
  readonly authority: number;
  readonly angle: number;
}

export interface IRelationshipMark extends IRelationshipNode {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

const LEFT = 48;
const RIGHT = 494;
const TOP = 24;
const BOTTOM = 154;

export const buildCommercialGeometry = (input: ICommercialInput): ICommercialGeometry => {
  const maximumDiscount = Math.max(30, input.discount);
  const discounts = [0, 1, 2, 3, 4, 5, 6].map(index => index * maximumDiscount / 6);
  if (discounts.indexOf(input.discount) < 0) discounts.push(input.discount);
  discounts.sort((left, right) => left - right);
  const points: ICommercialPoint[] = discounts.map(discount => {
    const result = calculateCommercialOffer({ ...input, discount });
    if (![result.grossMargin, result.contractValue].every(Number.isFinite) || result.contractValue < 0) throw new Error('Commercial curve requires finite nonnegative scenario economics.');
    return { discount, margin: result.grossMargin, contractValue: result.contractValue };
  });
  const x = scaleLinear().domain([0, maximumDiscount]).range([LEFT, RIGHT]);
  const y = scaleLinear().domain([Math.min(45, ...points.map(point => point.margin)) - 2, Math.max(90, ...points.map(point => point.margin)) + 2]).range([BOTTOM, TOP]);
  const curve = line<ICommercialPoint>().x((point) => x(point.discount)).y((point) => y(point.margin)).curve(curveMonotoneX);
  const field = area<ICommercialPoint>().x((point) => x(point.discount)).y0(BOTTOM).y1((point) => y(point.margin)).curve(curveMonotoneX);
  const selected = calculateCommercialOffer(input);
  const selectedPoint = { discount: input.discount, margin: selected.grossMargin, contractValue: selected.contractValue };
  return {
    linePath: curve(points) || '',
    areaPath: field(points) || '',
    selectedX: x(input.discount),
    selectedY: y(selected.grossMargin),
    selectedPoint
  };
};

export const buildForecastBridge = (movements: readonly IForecastMovement[]): readonly IForecastBar[] => {
  const totals: number[] = [];
  let running = 0;
  for (const movement of movements) {
    running = movement.kind === 'start' || movement.kind === 'end' ? movement.value : running + movement.value;
    totals.push(running);
  }
  const maximum = Math.max(...totals, ...movements.map((movement) => Math.abs(movement.value)));
  const y = scaleLinear().domain([0, maximum * 1.12]).range([BOTTOM, TOP]);
  const slot = (RIGHT - LEFT) / movements.length;
  let current = 0;
  return movements.map((movement, index) => {
    const startValue = movement.kind === 'start' || movement.kind === 'end' ? 0 : current;
    const endValue = movement.kind === 'start' || movement.kind === 'end' ? movement.value : current + movement.value;
    current = endValue;
    const upper = Math.max(startValue, endValue);
    const lower = Math.min(startValue, endValue);
    return {
      ...movement,
      x: LEFT + index * slot + 8,
      y: y(upper),
      width: slot - 16,
      height: Math.max(3, y(lower) - y(upper)),
      startValue,
      endValue
    };
  });
};

export const buildPipelineBars = (stages: readonly IPipelineStage[]): readonly IPipelineBar[] => {
  const x = scaleBand().domain(stages.map((stage) => stage.label)).range([LEFT, RIGHT]).padding(0.28);
  const y = scaleLinear().domain([0, max(stages, (stage) => stage.value) || 1]).nice().range([BOTTOM, TOP]);
  return stages.map((stage) => ({
    ...stage,
    x: x(stage.label) || LEFT,
    y: y(stage.value),
    width: x.bandwidth(),
    height: BOTTOM - y(stage.value)
  }));
};

export const buildRegionMarks = (regions: readonly IRegionSignal[], valueDomainMaximum?: number): readonly IRegionMark[] => {
  const x = scaleLinear().domain([-180, 180]).range([LEFT, RIGHT]);
  const y = scaleLinear().domain([90, -60]).range([TOP, BOTTOM]);
  const maximum = Math.max(valueDomainMaximum ?? 0, max(regions, region => region.value) || 1);
  const radius = scaleSqrt().domain([0, maximum]).range([0, 22]);
  return regions.map((region) => ({ ...region, x: x(region.longitude), y: y(region.latitude), radius: radius(region.value) }));
};

export const buildRelationshipMarks = (nodes: readonly IRelationshipNode[]): readonly IRelationshipMark[] => {
  const distance = scaleLinear().domain([0, 100]).range([112, 52]);
  const radius = scaleSqrt().domain([0, 100]).range([24, 42]);
  return nodes.map((node) => {
    const radians = (node.angle * Math.PI) / 180;
    const orbit = distance(node.authority);
    return { ...node, x: 260 + Math.cos(radians) * orbit * 1.45, y: 135 + Math.sin(radians) * orbit, radius: radius(node.influence) };
  });
};
