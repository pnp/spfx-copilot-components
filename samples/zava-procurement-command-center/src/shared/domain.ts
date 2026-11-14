export interface ISupplierBid { readonly id:string; readonly supplier:string; readonly price:number; readonly lead:number; readonly quality:number; readonly risk:number; readonly sustainability:number; readonly confidence:number; }
export interface IWeights { readonly price:number; readonly delivery:number; readonly quality:number; readonly risk:number; readonly sustainability:number; }
export interface IValueStage { readonly stage:string; readonly value:number; readonly disputed?:number; }
export interface ISplitAward { readonly primaryPercent:number; readonly secondaryPercent:number; readonly cost:number; readonly risk:number; readonly onTime:number; }

export const INVOCATION_DATE = '2026-08-31';
export const CATEGORIES = ['IT hardware','Facilities','Logistics','Professional services','Marketing','Telecom','Office supplies','Travel','Maintenance','HR services','Legal','Training','Manufacturing','Energy'] as const;
export const REGIONS = ['EMEA','AMER','APAC','LATAM'] as const;
const padded=(value:number,width:number):string=>(`${'000000'}${value}`).slice(-width);
export const REQUESTERS = Array.from({length:220},(_,i)=>({id:`ZPC-USER-${padded(i+1,3)}`,name:i===0?'Megan Bowen':`Zava colleague ${i+1}`,region:REGIONS[i%4]}));
export const SUPPLIERS = Array.from({length:90},(_,i)=>({id:`ZPC-SUP-${padded(i+1,3)}`,name:['Fabrikam Devices','Northwind Rugged','Contoso Mobility','Adventure Works Tech'][i]||`Qualified supplier ${i+1}`,risk:24+(i*17)%70,region:REGIONS[i%4]}));
export const REQUESTS = Array.from({length:600},(_,i)=>({id:i===0?'ZPC-REQ-1001':`ZPC-REQ-${padded(1001+i,4)}`,requesterId:REQUESTERS[i%220].id,category:CATEGORIES[i%14],quantity:i===0?600:12+(i*37)%900,currency:['EUR','USD','GBP','JPY'][i%4],budget:i===0?1200000:8000+(i*7919)%480000,region:REGIONS[i%4]}));
export const EVENTS = Array.from({length:18},(_,i)=>({id:i===0?'ZPC-RFP-31':`ZPC-RFP-${32+i}`,category:CATEGORIES[i%14],status:['Evaluation','Open','Draft','Awarded'][i%4]}));

export const HERO_BIDS: readonly ISupplierBid[] = [
  {id:'fab',supplier:'Fabrikam Devices',price:1034000,lead:48,quality:91,risk:44,sustainability:78,confidence:96},
  {id:'north',supplier:'Northwind Rugged',price:972000,lead:57,quality:85,risk:76,sustainability:72,confidence:88},
  {id:'contoso',supplier:'Contoso Mobility',price:1098000,lead:39,quality:94,risk:31,sustainability:84,confidence:93},
  {id:'adventure',supplier:'Adventure Works Tech',price:1018000,lead:52,quality:88,risk:53,sustainability:91,confidence:81}
];
export const DEFAULT_WEIGHTS:IWeights={price:28,delivery:22,quality:20,risk:20,sustainability:10};
export const VALUE_STAGES:readonly IValueStage[]=[
  {stage:'Identified',value:286000},{stage:'Negotiated',value:231000},{stage:'Contracted',value:214000},{stage:'Realized',value:186000,disputed:15000}
];
export const POLICY_RULES=[
  {id:'POL-EMEA-17',state:'Pass',title:'Competitive event',detail:'Three qualified bids received',version:'4.2',owner:'Procurement governance'},
  {id:'POL-ESG-08',state:'Pass',title:'Sustainability evidence',detail:'Product carbon evidence dated 12 Aug 2026',version:'2.7',owner:'Responsible sourcing'},
  {id:'POL-RISK-11',state:'Warning',title:'Concentration threshold',detail:'Above 60% primary share requires concentration rationale; above 70% exceeds demo authority',version:'3.1',owner:'Supplier risk'}
] as const;

export const normalizeScore=(bid:ISupplierBid,weights:IWeights):number=>{
  const prices=HERO_BIDS.map((item)=>item.price), leads=HERO_BIDS.map((item)=>item.lead);
  const price=100-(bid.price-Math.min(...prices))/(Math.max(...prices)-Math.min(...prices))*100;
  const delivery=100-(bid.lead-Math.min(...leads))/(Math.max(...leads)-Math.min(...leads))*100;
  return (price*weights.price+delivery*weights.delivery+bid.quality*weights.quality+(100-bid.risk)*weights.risk+bid.sustainability*weights.sustainability)/100;
};
export const splitAward=(primaryPercent:number):ISplitAward=>({
  primaryPercent,secondaryPercent:100-primaryPercent,
  cost:Math.round(HERO_BIDS[0].price*primaryPercent/100+HERO_BIDS[2].price*(100-primaryPercent)/100),
  risk:Math.round(HERO_BIDS[0].risk*primaryPercent/100+HERO_BIDS[2].risk*(100-primaryPercent)/100),
  onTime:Math.round(91+(100-primaryPercent)*0.06)
});
export const invoiceVariance={po:1034000,receipt:1034000,invoice:1049000,freightVariance:15000,tolerance:5000};
export const money=(value:number,currency='EUR'):string=>new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:0}).format(value);