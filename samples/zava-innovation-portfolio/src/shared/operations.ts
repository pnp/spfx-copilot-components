import { IDEAS, type IIdea } from './domain';

export const findIdea = (id?:string):IIdea|undefined => IDEAS.find(idea=>idea.id===(id||'IDEA-001'));
export const currency = (value:number):string => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
export const validNumber = (value:string,min=0,max=100000000):boolean => value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=min&&Number(value)<=max;
export const hasText = (value:string):boolean => value.trim().length>=10;
export const THEMES = ['Customer experience','Operational efficiency','Sustainability','New revenue','Employee experience','AI & automation'] as const;
export const BUDGET = {allocated:4800000,committed:2600000,spent:900000,forecast:500000,available:800000} as const;

export function businessCase(investment:number,annualBenefit:number,annualCost:number,confidence:number):{net:number;adjusted:number;roi:number;payback:number|undefined}{
  const net=annualBenefit-annualCost;
  const adjusted=annualBenefit*confidence/100-annualCost;
  return {net,adjusted,roi:investment>0?(net-investment)/investment*100:0,payback:adjusted>0?investment/adjusted*12:undefined};
}
export function fundingPosition(amount:number):{remaining:number;overBudget:boolean}{
  return {remaining:BUDGET.available-amount,overBudget:amount>BUDGET.available};
}
export function experimentResult(sample:number,minimum:number,baseline:number,observed:number,target:number,incidents:number):{improvement:number;recommendation:'Go'|'Pivot'|'Stop';reason:string}{
  const improvement=baseline>0?(baseline-observed)/baseline*100:0;
  if(incidents>0)return {improvement,recommendation:'Stop',reason:'Safety incident recorded. Resolve controls before any new pilot.'};
  if(sample<minimum)return {improvement,recommendation:'Pivot',reason:'Sample is below the predeclared minimum; collect more evidence.'};
  if(improvement<target)return {improvement,recommendation:'Pivot',reason:'Measured reduction missed the success threshold.'};
  return {improvement,recommendation:'Go',reason:'Sample, reduction threshold, and safety guardrail met. This is learning only, not scale approval.'};
}
export function challengeDays(start:string,end:string):number{
  return Math.round((Date.parse(end)-Date.parse(start))/86400000);
}
