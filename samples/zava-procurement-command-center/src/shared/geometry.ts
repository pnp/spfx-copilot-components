import { scaleLinear, scaleSqrt } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import type { IValueStage, ISupplierBid, IWeights } from './domain';
import { normalizeScore } from './domain';

export interface ILandscapePoint {readonly id:string;readonly label:string;readonly x:number;readonly y:number;readonly radius:number;readonly score:number;readonly risk:number;}
export const buildLandscape=(bids:readonly ISupplierBid[],weights:IWeights,width=720,height=300):readonly ILandscapePoint[]=>{
  const x=scaleLinear().domain([Math.min(...bids.map(b=>b.price)),Math.max(...bids.map(b=>b.price))]).range([100,width-90]);
  const y=scaleLinear().domain([40,85]).range([height-55,35]);
  const r=scaleSqrt().domain([70,100]).range([12,27]);
  return bids.map((bid)=>({id:bid.id,label:bid.supplier,x:x(bid.price),y:y(normalizeScore(bid,weights)),radius:r(bid.confidence),score:normalizeScore(bid,weights),risk:bid.risk}));
};
export interface IRiverGeometry {readonly areaPath:string;readonly linePath:string;readonly points:readonly {readonly x:number;readonly y:number;readonly label:string;readonly value:number;}[];}
export const buildValueRiver=(stages:readonly IValueStage[],width=720,height=260):IRiverGeometry=>{
  const x=scaleLinear().domain([0,Math.max(1,stages.length-1)]).range([80,width-80]);
  const y=scaleLinear().domain([0,Math.max(...stages.map(s=>s.value))*1.1]).range([height-30,24]);
  const points=stages.map((stage,index)=>({x:x(index),y:y(stage.value),label:stage.stage,value:stage.value}));
  return {points,areaPath:area<typeof points[number]>().x(p=>p.x).y0(height-30).y1(p=>p.y).curve(curveMonotoneX)(points)||'',linePath:line<typeof points[number]>().x(p=>p.x).y(p=>p.y).curve(curveMonotoneX)(points)||''};
};