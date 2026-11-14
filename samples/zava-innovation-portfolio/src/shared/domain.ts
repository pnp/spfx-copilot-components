export interface IIdea { readonly id:string; readonly title:string; readonly owner:string; readonly theme:string; readonly stage:string; readonly gateApproved:boolean; readonly impact:number; readonly effort:number; readonly funding:number; readonly projected:number; readonly actual:number; readonly region:string; }
export interface ITrend { readonly label:string; readonly submissions:number; readonly conversion:number; readonly value:number; }
export interface IRegion { readonly name:string; readonly x:number; readonly y:number; readonly longitude:number; readonly latitude:number; readonly submissions:number; readonly conversion:number; }

const stages = ['Submitted','Screening','Business case','Funding','Pilot','Scale','Value'];
const themes = ['Customer experience','Operational efficiency','Sustainability','New revenue','Employee experience','AI & automation'];
const regions = ['AMER','EMEA','APAC','LATAM'];
export const PEOPLE = [
  ['Megan Bowen','Senior Program Manager','Megan-Bowen.jpeg'],['Johanna Lorenz','Product Director','Johanna-Lorenz.jpeg'],
  ['Diego Siciliani','Engineering Manager','Diego-Siciliani.jpeg'],['Miriam Graham','Finance Business Partner','Miriam-Graham.jpeg'],
  ['Joni Sherman','VP, Digital Strategy','Joni-Sherman.jpeg'],['Pradeep Gupta','AI Platform Lead','Pradeep-Gupta.jpeg'],
  ['Nestor Wilke','Responsible AI Lead','Nestor-Wilke.jpeg'],['Lee Gu','UX and Adoption Lead','Lee-Gu.jpeg'],
  ['Patti Fernandez','Change Lead','Patti-Fernandez.jpeg'],['Isaiah Langer','Data Engineering Lead','Isaiah-Langer.jpeg'],
  ['Grady Archie','Procurement Lead','Grady-Archie.jpeg']
] as const;

const namedIdeas:Readonly<Record<string,Partial<IIdea>>> = {
  'IDEA-001':{title:'Smart Onboarding Journey',owner:'Megan Bowen',theme:'Employee experience',stage:'Screening',funding:400000,projected:1600000,actual:1400000},
  'IDEA-014':{title:'Customer Signal Studio',owner:'Lee Gu',theme:'Customer experience',stage:'Screening',projected:920000},
  'IDEA-022':{title:'Supplier Carbon Twin',owner:'Grady Archie',theme:'Sustainability',stage:'Screening',projected:610000},
  'IDEA-026':{title:'Meeting Mood Scanner',owner:'Patti Fernandez',theme:'Employee experience',stage:'Screening',projected:180000},
  'IDEA-031':{title:'Knowledge Discovery Platform',owner:'Pradeep Gupta',theme:'AI & automation',stage:'Business case',gateApproved:false,funding:400000,projected:2200000,actual:1890000},
  'IDEA-044':{title:'Demand Forecasting Modernization',owner:'Isaiah Langer',theme:'Operational efficiency',stage:'Funding',gateApproved:true,projected:3600000,actual:1250000},
  'IDEA-057':{title:'Frontline Copilot Coach',owner:'Johanna Lorenz',theme:'Customer experience',stage:'Pilot',projected:1100000,actual:900000},
  'IDEA-063':{title:'Invoice Exception Automation',owner:'Miriam Graham',theme:'Operational efficiency',stage:'Scale',projected:1700000,actual:1700000}
};
export const IDEAS: readonly IIdea[] = Array.from({length:120},(_,index) => ({
  id:`IDEA-${(`00${index+1}`).slice(-3)}`,
  title:index===0?'Smart Onboarding Journey':`${themes[index%themes.length]} concept ${index+1}`,
  owner:index%5===0?'Megan Bowen':PEOPLE[index%PEOPLE.length][0], theme:themes[index%themes.length],
  stage:stages[Math.min(stages.length-1,Math.floor(Math.sqrt(index)/1.8))], impact:62+(index*7)%37,
  gateApproved:Math.floor(Math.sqrt(index)/1.8)>=3,
  effort:28+(index*11)%68, funding:25000+(index*37000)%450000, projected:90000+(index*61000)%1200000,
  actual:70000+(index*47000)%1050000, region:regions[index%regions.length]
})).map(idea=>({...idea,...namedIdeas[idea.id]}));

export const TRENDS: readonly ITrend[] = Array.from({length:12},(_,index)=>({label:`${index+1}/26`,submissions:18+index*3+(index%3)*5,conversion:31+(index*4)%23,value:240000+index*97000}));
export const REGION_DATA: readonly IRegion[] = [
  {name:'AMER',x:22,y:45,longitude:-102,latitude:43,submissions:42,conversion:48},{name:'EMEA',x:49,y:38,longitude:14,latitude:50,submissions:34,conversion:55},
  {name:'APAC',x:76,y:48,longitude:116,latitude:14,submissions:31,conversion:39},{name:'LATAM',x:31,y:72,longitude:-60,latitude:-17,submissions:13,conversion:44}
];
export const STAGE_COUNTS = stages.map((stage,index)=>({stage,count:[120,74,41,23,16,10,7][index]}));
export const money = (value:number):string => value >= 1000000
  ? `$${(value/1000000).toFixed(1)}m`
  : value >= 1000 ? `$${Math.round(value/1000)}k` : `$${Math.round(value)}`;