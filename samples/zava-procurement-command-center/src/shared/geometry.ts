import { scaleLinear, scaleSqrt } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import type { IValueStage, ISupplierBid, IWeights } from './domain';
import { normalizeScore } from './domain';

export interface ILandscapePoint {readonly id:string;readonly label:string;readonly x:number;readonly y:number;readonly radius:number;readonly score:number;readonly risk:number;}
export const buildLandscape=(bids:readonly ISupplierBid[],weights:IWeights,width=720,height=300):readonly ILandscapePoint[]=>{
  const x=scaleLinear().domain([Math.min(...bids.map(b=>b.price)),Math.max(...bids.map(b=>b.price))]).range([100,width-90]);
  const y=scaleLinear().domain([0,100]).range([height-55,35]);
  const r=scaleSqrt().domain([0,100]).range([0,27]);
  return bids.map((bid)=>({id:bid.id,label:bid.supplier,x:x(bid.price),y:y(normalizeScore(bid,weights)),radius:r(bid.confidence),score:normalizeScore(bid,weights),risk:bid.risk}));
};
export interface IRiverGeometry {readonly areaPath:string;readonly linePath:string;readonly points:readonly {readonly x:number;readonly y:number;readonly label:string;readonly value:number;}[];}
export const buildValueRiver=(stages:readonly IValueStage[],width=720,height=260):IRiverGeometry=>{
  const x=scaleLinear().domain([0,Math.max(1,stages.length-1)]).range([80,width-80]);
  const y=scaleLinear().domain([0,Math.max(...stages.map(s=>s.value))*1.1]).range([height-30,24]);
  const points=stages.map((stage,index)=>({x:x(index),y:y(stage.value),label:stage.stage,value:stage.value}));
  return {points,areaPath:area<typeof points[number]>().x(p=>p.x).y0(height-30).y1(p=>p.y).curve(curveMonotoneX)(points)||'',linePath:line<typeof points[number]>().x(p=>p.x).y(p=>p.y).curve(curveMonotoneX)(points)||''};
};
export function buildDependencyPathway(supplier: string, region: string, scenario: string, exposure: number): readonly {
  readonly id: string; readonly label: string; readonly detail: string; readonly score: number; readonly x: number; readonly y: number;
}[] {
  const x = scaleLinear().domain([0, 3]).range([65, 655]);
  return [
    { id: 'components', label: 'Component supply', detail: 'Battery and component availability requires independent sub-tier evidence.', score: Math.max(0, exposure - 8) },
    { id: 'assembly', label: 'Supplier assembly', detail: `${supplier} / bid lead-time evidence is separate from corridor assumptions.`, score: exposure },
    { id: 'corridor', label: `${region} corridor`, detail: `${scenario} / ${scenario === 'Port disruption' ? '+22 scenario adjustment' : scenario === 'Dual-source buffer' ? '-14 scenario adjustment' : 'no scenario adjustment'}${region === 'APAC' ? '; APAC handling +8' : ''}.`, score: exposure },
    { id: 'launch', label: 'Field readiness', detail: 'Launch exposure is modeled; accepted delivery and available inventory still require proof.', score: exposure }
  ].map((node, index) => ({ ...node, x: x(index), y: 120 }));
}