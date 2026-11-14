import * as React from 'react';
import {
  Badge, Button, Field, Input
} from '@fluentui/react-components';
import {
  ArrowMaximize24Regular, Beaker24Regular, Building24Regular,
  ClipboardTaskListLtr24Regular, CompassNorthwest24Regular, DataTrending24Regular,
  Lightbulb24Regular, Money24Regular, Person24Regular,
  ArrowReset20Regular, Search20Regular, Settings20Regular, ShieldCheckmark20Regular, Sparkle20Regular, TargetArrow24Regular,
  Trophy24Regular
} from '@fluentui/react-icons';

import { getIntent, INTENTS, LENS_LABELS } from './catalog';
import type { IInnovationProperties, IIntentDefinition, InnovationLens } from './catalog';
import { IDEAS, REGION_DATA, STAGE_COUNTS, TRENDS, money } from './domain';
import { PERSONA_MEDIA } from './media';
import { resetReceipts } from './sessionStore';
import { BusinessCase, Challenge, ExecutiveBrief, Experiment, Funding, IdeaSubmission, NoMatch, Recognition } from './InnovationExperiences';
import { currency } from './operations';
import { InnovationContext, useVisibleState, type IVisibleState } from './InnovationContext';
import ReviewDecisionCenter from './ReviewDecisionCenter';
import WorldInnovationMap from './WorldInnovationMap';
import styles from './PremiumInnovationApp.module.scss';

interface IProps { readonly definition:IIntentDefinition; readonly properties:IInnovationProperties; readonly currentUserName:string; readonly displayMode?:string; readonly onRequestFullscreen?:()=>void; readonly onVisibleState?:(state:IVisibleState)=>void; readonly hostError?:string; }

const profiles:Record<InnovationLens,{name:string;role:string;headline:string;metric:string;metricLabel:string}>={
  'my-innovation':{name:'Megan Bowen',role:'Senior Program Manager',headline:'Move your strongest ideas forward with evidence and visible momentum.',metric:'3',metricLabel:'ideas in motion'},
  'programs-pilots':{name:'Johanna Lorenz',role:'Product Director',headline:'Direct participation toward strategic challenges and turn pilots into learning.',metric:'4',metricLabel:'decisions this week'},
  'reviews-gates':{name:'Diego Siciliani',role:'Engineering Manager',headline:'Make fair, evidence-based gate decisions while the context is fresh.',metric:'4',metricLabel:'reviews waiting'},
  investment:{name:'Miriam Graham',role:'Finance Business Partner',headline:'Allocate innovation capital with portfolio consequences visible before commitment.',metric:'$800k',metricLabel:'available'},
  'enterprise-insights':{name:'Joni Sherman',role:'VP, Digital Strategy',headline:'See the complete innovation system from strategic demand to realized value.',metric:'$8.7m',metricLabel:'value realized'},
  education:{name:'Megan Bowen',role:'Senior Program Manager',headline:'Discover the right innovation experience for your business job.',metric:'16',metricLabel:'operational tools'}
};

const lensIcons:Record<InnovationLens,React.ReactElement>={
  'my-innovation':<Person24Regular/>, 'programs-pilots':<Beaker24Regular/>,
  'reviews-gates':<ClipboardTaskListLtr24Regular/>, investment:<Money24Regular/>,
  'enterprise-insights':<Building24Regular/>, education:<CompassNorthwest24Regular/>
};

function Avatar({name,large=false}:{name:string;large?:boolean}):React.ReactElement{
  const media=PERSONA_MEDIA[name];
  return media?<img className={large?styles.avatarLarge:styles.avatar} src={media.src} alt={media.alt}/>:<span className={large?styles.avatarLarge:styles.avatar}>{name.split(' ').map(p=>p[0]).join('')}</span>;
}
function Kpis({items}:{items:readonly {label:string;value:string;detail?:string}[]}):React.ReactElement{
  return <div className={styles.kpis}>{items.map(item=><div className={styles.kpi} key={item.label}><strong>{item.value}</strong><span>{item.label}{item.detail?` · ${item.detail}`:''}</span></div>)}</div>;
}
function Bars({items}:{items:readonly {label:string;value:number}[]}):React.ReactElement{
  return <div className={styles.bars}>{items.map(item=><div className={styles.bar} key={item.label}><span>{item.label}</span><div className={styles.track}><div className={styles.fill} style={{width:`${item.value}%`}}/></div><b>{item.value}%</b></div>)}</div>;
}
function Funnel({compact=false}:{compact?:boolean}):React.ReactElement{
  return <svg className={compact?styles.chartSmall:styles.chart} viewBox="0 0 680 220" role="img" aria-label="Living stage-gate funnel with exact idea counts"><title>Living stage-gate funnel</title>{STAGE_COUNTS.map((item,index)=>{const width=620-index*72;const x=(680-width)/2;return <g key={item.stage}><rect x={x} y={index*29+4} width={width} height="24" rx="4" fill={index===3?'#c49a00':`hsl(${283-index*7},${43+index*4}%,${31+index*6}%)`}/><text x="340" y={index*29+21} textAnchor="middle" fill={index>3?'#201f1e':'white'} fontSize="12">{item.stage} · {item.count}</text></g>;})}</svg>;
}
function PortfolioStageGate():React.ReactElement{
  const stages=[{name:'Ideation',count:120,conversion:'100%',color:'#efa900'},{name:'Validation',count:74,conversion:'62%',color:'#e57b26'},{name:'Business case',count:41,conversion:'55%',color:'#bd4a72'},{name:'Funded pilot',count:23,conversion:'56%',color:'#873b91'},{name:'Scale & value',count:7,conversion:'30%',color:'#4b2aa1'}];
  return <svg className={styles.stageGateChart} viewBox="0 0 1000 230" role="img" aria-label="Horizontal stage-gate funnel from 120 ideas to 7 scaled outcomes"><title>Portfolio stage-gate funnel</title><defs><filter id="gateShadow" x="-10%" y="-20%" width="120%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity=".18"/></filter></defs>{stages.map((stage,index)=>{const x=20+index*190;const top=28+index*7;const bottom=155-index*7;const points=index===stages.length-1?`${x},${top} ${x+158},${top+8} ${x+188},${(top+bottom)/2} ${x+158},${bottom-8} ${x},${bottom} ${x+27},${(top+bottom)/2}`:`${x},${top} ${x+160},${top} ${x+188},${(top+bottom)/2} ${x+160},${bottom} ${x},${bottom} ${x+28},${(top+bottom)/2}`;return <g key={stage.name} filter="url(#gateShadow)"><polygon points={points} fill={stage.color}/><text x={x+100} y={top+20} textAnchor="middle" fill="white" fontSize="13" fontWeight="700">0{index+1} · {stage.name}</text><text x={x+100} y={top+51} textAnchor="middle" fill="white" fontSize="30" fontWeight="700">{stage.count}</text><text x={x+100} y={top+70} textAnchor="middle" fill="white" fontSize="11" opacity=".86">{stage.conversion} conversion</text><circle cx={x+100} cy="187" r="20" fill="white" stroke={stage.color} strokeWidth="2"/><text x={x+100} y="192" textAnchor="middle" fill={stage.color} fontSize="15" fontWeight="700">{index+1}</text></g>;})}</svg>;
}
function Trend({metric='submissions'}:{metric?:'submissions'|'conversion'|'value'}):React.ReactElement{
  const values=TRENDS.map(item=>metric==='submissions'?item.submissions:metric==='conversion'?item.conversion:item.value/25000);
  const max=Math.max(...values); const points=values.map((value,index)=>`${28+index*55},${185-value/max*145}`).join(' ');
  return <svg className={styles.chart} viewBox="0 0 680 220" role="img" aria-label={`Twelve-month innovation ${metric} trend`}><title>Innovation {metric} trend</title><defs><linearGradient id={`area-${metric}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7d3f8c" stopOpacity=".35"/><stop offset="1" stopColor="#7d3f8c" stopOpacity="0"/></linearGradient></defs><path d={`M ${points} L 633 190 L 28 190 Z`} fill={`url(#area-${metric})`}/><polyline points={points} fill="none" stroke="#542568" strokeWidth="5"/>{values.map((value,index)=><g key={TRENDS[index].label}><circle cx={28+index*55} cy={185-value/max*145} r="5" fill="#c49a00"/><text x={28+index*55} y="210" textAnchor="middle" fontSize="9">{TRENDS[index].label}</text></g>)}</svg>;
}
function Bubble():React.ReactElement{
  const items=IDEAS.slice(0,18);
  return <svg className={styles.chart} viewBox="0 0 680 220" role="img" aria-label="Impact versus effort for eighteen active ideas"><title>Impact versus effort</title><line x1="340" y1="15" x2="340" y2="195" stroke="#aaa" strokeDasharray="4 4"/><line x1="30" y1="105" x2="650" y2="105" stroke="#aaa" strokeDasharray="4 4"/><text x="45" y="28" fontSize="10">High impact / lower effort</text><text x="520" y="188" fontSize="10">Validate carefully</text>{items.map((item,index)=><circle key={item.id} cx={40+item.effort*6} cy={195-item.impact*1.8} r={7+item.funding/85000} fill={index===0?'#c49a00':'#7d3f8c'} opacity=".72"><title>{item.title}: impact {item.impact}, effort {item.effort}, {money(item.funding)}</title></circle>)}</svg>;
}
function Waterfall():React.ReactElement{
  const items=[{label:'Allocated',value:4.8,start:0,tone:'#542568'},{label:'Committed',value:2.6,start:2.2,tone:'#b14672'},{label:'Spent',value:.9,start:1.3,tone:'#c49a00'},{label:'Forecast',value:.5,start:.8,tone:'#087e8b'},{label:'Available',value:.8,start:0,tone:'#2e7d5b'}];
  return <svg className={styles.chart} viewBox="0 0 680 220" role="img" aria-label="Innovation budget allocation waterfall"><title>Innovation budget bridge</title>{items.map((item,index)=><g key={item.label}><rect x={35+index*125} y={190-(item.start+item.value)*34} width="82" height={item.value*34} fill={item.tone}/><text x={76+index*125} y="210" textAnchor="middle" fontSize="11">{item.label}</text><text x={76+index*125} y={184-(item.start+item.value)*34} textAnchor="middle" fontSize="11">${item.value}m</text></g>)}</svg>;
}
function Donut():React.ReactElement{return <div className={styles.donutWrap} role="img" aria-label="Investment mix: 52 percent core, 29 percent adjacent, 19 percent transformational"><div className={styles.donut}/><div className={styles.legend}><span><i style={{background:'#542568'}}/>Core 52%</span><span><i style={{background:'#c49a00'}}/>Adjacent 29%</span><span><i style={{background:'#087e8b'}}/>Transform 19%</span></div></div>;}

const TOP_IDEAS=[
  {rank:1,title:'Invoice Exception Automation',person:'Miriam Graham',theme:'Operational efficiency',value:'$1.7m',roi:'257%',phase:'Scale',badge:'Value creator'},
  {rank:2,title:'Smart Onboarding Journey',person:'Megan Bowen',theme:'Employee experience',value:'$1.4m',roi:'245%',phase:'Value realized',badge:'People impact'},
  {rank:3,title:'Demand Forecasting Modernization',person:'Isaiah Langer',theme:'AI & automation',value:'$1.25m',roi:'210%',phase:'Scale',badge:'Scale catalyst'},
  {rank:4,title:'Knowledge Discovery Platform',person:'Pradeep Gupta',theme:'Digital products',value:'$1.1m',roi:'196%',phase:'Pilot',badge:'Evidence leader'},
  {rank:5,title:'Frontline Copilot Coach',person:'Johanna Lorenz',theme:'Customer experience',value:'$900k',roi:'178%',phase:'Pilot',badge:'Learning leader'}
] as const;

function TopIdeas():React.ReactElement{
  return <section className={`${styles.panel} ${styles.wide} ${styles.topIdeas}`}><div className={styles.chartTitle}><div><span>Illustrative showcase ranking</span><h3>Top performing ideas · by value realized</h3></div><Badge appearance="tint">Offline examples</Badge></div><div className={styles.topIdeaHeader}><span>Rank & idea</span><span>Contributor</span><span>Value / ROI</span><span>Phase</span><span>Recognition</span></div><div className={styles.topIdeaList}>{TOP_IDEAS.map(item=><article className={styles.topIdeaRow} key={item.title}><div className={styles.rank}><strong>{item.rank}</strong><Trophy24Regular/></div><div><b>{item.title}</b><small>{item.theme}</small></div><div className={styles.person}><Avatar name={item.person}/><span><b>{item.person}</b><small>{item.badge}</small></span></div><div><b>{item.value}</b><small>{item.roi} ROI</small></div><Badge appearance="tint" color={item.phase==='Value realized'?'success':item.phase==='Scale'?'informative':'warning'}>{item.phase}</Badge><span>{item.badge}</span></article>)}</div><div className={styles.gamificationNote}><ShieldCheckmark20Regular/><span><b>Recognition requires human evidence</b><small>Use Celebrate impact to name a contribution and source, review the message, and explicitly confirm. This information view creates no receipts.</small></span></div></section>;
}


function MyInnovation({properties,actor}:{properties:IInnovationProperties;actor:string}):React.ReactElement{
  const ideas=IDEAS.filter(idea=>idea.owner===actor&&(!properties.ideaId||idea.id===properties.ideaId)&&(!properties.theme||idea.theme===properties.theme));
  useVisibleState('GetMyInnovation',ideas.length?'information':'no-match',`${actor}: ${ideas.map(idea=>`${idea.id} ${idea.title} ${idea.stage}`).join('; ')||'No matching personal ideas'}`);
  return <div data-layout="GetMyInnovation-personal"><div className={styles.ideaHero}><Avatar name={actor} large/><div><h3>{actor} · personal ideas</h3><p className={styles.summary}>{ideas.length} matching ideas. Status is from the deterministic catalog, not inferred progress.</p></div></div>{ideas.length?<div className={styles.grid3}>{ideas.slice(0,12).map(idea=><div className={styles.panel} key={idea.id}><div className={styles.chartTitle}><h3>{idea.title}</h3><Badge>{idea.stage}</Badge></div><p className={styles.meta}>{idea.id} · {idea.theme}</p><Bars items={[{label:'Impact',value:idea.impact},{label:'Effort',value:idea.effort}]}/><p>Next: {idea.stage==='Screening'?'Resolve reviewer evidence gaps':idea.stage==='Funding'?'Prepare capital committee conditions':'Check milestone evidence with the owner'}.</p></div>)}</div>:<p role="status">No matching personal ideas for {actor}{properties.ideaId?` / ${properties.ideaId}`:''}{properties.theme?` / ${properties.theme}`:''}.</p>}</div>;
}
function Queue({gate=false,ideaId}:{gate?:boolean;ideaId?:string}):React.ReactElement{return <ReviewDecisionCenter startInDetail={gate} allowDecision={gate} initialSubmissionId={ideaId}/>;}
function Value({properties}:{properties:IInnovationProperties}):React.ReactElement{
  const ideas=IDEAS.filter(idea=>(!properties.ideaId||idea.id===properties.ideaId)&&(!properties.theme||idea.theme===properties.theme));
  const projected=ideas.reduce((sum,idea)=>sum+idea.projected,0),actual=ideas.reduce((sum,idea)=>sum+idea.actual,0);
  useVisibleState('TrackInnovationValue',ideas.length?'information':'no-match',ideas.length?`${ideas.length} ideas; projected ${currency(projected)}, measured ${currency(actual)}, variance ${currency(actual-projected)}`:`No matching idea/theme: ${properties.ideaId||properties.theme}`);
  return <div data-layout="TrackInnovationValue-realization">{ideas.length?<><Kpis items={[{label:'Scope ideas',value:String(ideas.length)},{label:'Projected',value:money(projected)},{label:'Measured',value:money(actual)},{label:'Variance',value:money(actual-projected)}]}/><div className={styles.grid2}><section className={styles.panel}><h3>Program value trend · Jan–Dec 2026</h3><Trend metric="value"/><p className={styles.meta}>Trend is the overall program series; record comparison below uses your selected scope.</p></section><aside className={styles.panel}><h3>Selected outcome ledger</h3>{ideas.slice(0,8).map(idea=><div className={styles.row} key={idea.id}><span><b>{idea.title}</b><br/>{idea.id} · {idea.owner}<br/>Projected {currency(idea.projected)} · measured {currency(idea.actual)}</span><span className={idea.actual<idea.projected?styles.warn:styles.good}>{currency(idea.actual-idea.projected)}</span></div>)}<p className={styles.meta}>Showing {Math.min(8,ideas.length)} of {ideas.length}. Aggregate includes all matching records.</p></aside></div></>:<p role="status">No matching outcome for {properties.ideaId||properties.theme}. No healthy default was substituted.</p>}</div>;
}
function Growth():React.ReactElement{
  const [metric,setMetric]=React.useState<'submissions'|'conversion'|'value'>('submissions');
  const first=TRENDS[0],last=TRENDS[TRENDS.length-1];
  const change=metric==='conversion'?`${last.conversion-first.conversion} percentage points`:`${(((last[metric]-first[metric])/first[metric])*100).toFixed(1)}%`;
  useVisibleState('GetInnovationGrowth','information',`${metric}; Jan–Dec 2026; change ${change}`);
  return <div data-layout="GetInnovationGrowth-trend"><div className={styles.toolbar}><div className={styles.segmented}>{(['submissions','conversion','value'] as const).map(item=><button className={styles.segment} data-active={metric===item} onClick={()=>setMetric(item)} key={item}>{item}</button>)}</div><Badge appearance="tint">Jan–Dec 2026</Badge></div><Trend metric={metric}/><div className={styles.question}><DataTrending24Regular/>{metric}: {change} from first to final month in this mock series.</div></div>;
}
function Global({properties}:{properties:IInnovationProperties}):React.ReactElement{
  const [selectedName,setSelectedName]=React.useState(properties.region||'APAC');
  const selected=REGION_DATA.find(item=>item.name===selectedName);
  useVisibleState('ExploreGlobalInnovation',selected?'information':'no-match',selected?`${selected.name}: ${selected.submissions} submissions; ${selected.conversion}% conversion`:`Unknown region ${selectedName}`);
  if(!selected)return <NoMatch intent="ExploreGlobalInnovation" id={selectedName}/>;
  const best=Math.max(...REGION_DATA.map(item=>item.conversion));
  return <div data-layout="ExploreGlobalInnovation-map" className={styles.grid2}><section><WorldInnovationMap regions={REGION_DATA} selectedName={selected.name} onSelect={setSelectedName}/></section><aside className={styles.panel}><div className={styles.chartTitle}><div><span>Selected reporting region</span><h3>{selected.name}</h3></div><Badge appearance="tint" color={selected.conversion>=50?'success':selected.conversion>=44?'informative':'warning'}>{selected.conversion}% conversion</Badge></div><div className={styles.grid2}><div><b>{selected.submissions}</b><div className={styles.meta}>Submissions</div></div><div><b>{selected.conversion}%</b><div className={styles.meta}>Stage conversion</div></div></div><h3>Regional comparison</h3><Bars items={REGION_DATA.map(item=>({label:item.name,value:item.conversion}))}/><p className={styles.question}>{selected.name} trails the best reporting region by {best-selected.conversion} conversion points.</p></aside></div>;
}
function BudgetView():React.ReactElement{return <div data-layout="TrackInnovationBudget-finance" className={styles.grid2}><section className={styles.panel}><h3>Budget to forecast bridge</h3><Waterfall/></section><aside className={styles.panel}><h3>Horizon allocation</h3><Donut/><p className={styles.question}>Transformational investment is 6 points below target.</p></aside></div>;}
function PortfolioHealth():React.ReactElement{return <div data-layout="GetInnovationPortfolioHealth-scorecard" className={styles.analyticsGrid}><section className={styles.panel}><h3>Funnel velocity</h3><Funnel compact/></section><section className={styles.panel}><h3>Health dimensions</h3><Bars items={[{label:'Velocity',value:78},{label:'Balance',value:66},{label:'Alignment',value:88},{label:'Value',value:81}]}/></section><section className={styles.panel}><h3>Investment mix</h3><Donut/></section><section className={styles.panel}><h3>Leadership exceptions</h3><div className={styles.list}><div className={styles.row}><span>Transform horizon below target</span><Badge color="warning">Watch</Badge></div><div className={styles.row}><span>APAC conversion gap</span><Badge color="warning">16 pts</Badge></div><div className={styles.row}><span>Value realization</span><Badge color="success">+9%</Badge></div></div></section></div>;}
function Portfolio():React.ReactElement{return <div data-layout="ExploreInnovationPortfolio-command" className={styles.analyticsGrid}><section className={`${styles.panel} ${styles.wide} ${styles.stageGatePanel}`}><div className={styles.chartTitle}><div><span>Portfolio progression</span><h3>Stage-gate funnel</h3></div><span>120 ideas · 7 scaled outcomes</span></div><PortfolioStageGate/></section><section className={styles.panel}><h3>Impact vs. effort</h3><Bubble/></section><section className={styles.panel}><h3>Horizon balance</h3><Donut/><p className={styles.meta}>Target: 50% core / 30% adjacent / 20% transform</p></section><section className={styles.panel}><h3>Program momentum</h3><Trend metric="conversion"/></section><section className={styles.panel}><h3>Strategic themes</h3><Bars items={[{label:'AI & automation',value:82},{label:'Customer',value:68},{label:'Efficiency',value:61},{label:'Sustainability',value:47}]}/><p className={styles.question}>Employee experience has the strongest value conversion this quarter.</p></section><TopIdeas/></div>;}
const OPERATIONAL_LENSES:readonly InnovationLens[]=['my-innovation','programs-pilots','reviews-gates','investment','enterprise-insights'];
function Explorer({properties={}}:{properties?:IInnovationProperties}):React.ReactElement{
  const [query,setQuery]=React.useState(properties.query||'');
  const [selected,setSelected]=React.useState<IIntentDefinition>();
  const normalizedQuery=query.trim().toLowerCase();
  const results=INTENTS.filter(item=>item.operation!=='education'&&`${item.title} ${item.role} ${item.outcome} ${item.decisionQuestion} ${LENS_LABELS[item.lens]}`.toLowerCase().includes(normalizedQuery));
  useVisibleState('ExploreAgentCapabilities',results.length?'capability-preview':'no-match',selected?`${selected.key}: ${selected.outcome}. Preview only; no tool was invoked.`:`${results.length} capabilities matching "${query}"; no action taken.`);
  return <div data-layout="ExploreAgentCapabilities-gallery" className={styles.capabilityExplorer}>
    <section className={styles.capabilityCatalog} aria-label="Available agent capabilities">
      <div className={styles.capabilityHeading}><div><span>Agent capability catalog</span><h3>16 ways to move innovation forward</h3></div><Badge appearance="tint" color="informative">{results.length} shown</Badge></div>
      <Field label="What are you trying to accomplish?"><Input contentBefore={<Search20Regular/>} value={query} onChange={(_,data)=>{setQuery(data.value);setSelected(undefined);}} placeholder="Search ideas, reviews, funding, programs, or insights"/></Field>
      <div className={styles.capabilityGroups}>{OPERATIONAL_LENSES.map(lens=>{
        const items=results.filter(item=>item.lens===lens);
        if(items.length===0)return null;
        return <section className={styles.capabilityGroup} data-lens={lens} key={lens}>
          <header><span className={styles.capabilityIcon}>{lensIcons[lens]}</span><span><b>{LENS_LABELS[lens]}</b><small>{items.length} {items.length===1?'capability':'capabilities'}</small></span></header>
          <div className={styles.capabilityCards}>{items.map(item=><button className={styles.capabilityCard} aria-pressed={selected?.key===item.key} key={item.key} onClick={()=>setSelected(item)}><span><b>{item.title}</b><small>{item.decisionQuestion}</small></span><TargetArrow24Regular/></button>)}</div>
        </section>;
      })}</div>
      {results.length===0&&<div className={styles.capabilityEmpty}><Search20Regular/><span><b>No matching capability</b><small>Try a business outcome such as funding, review, growth, or value.</small></span></div>}
    </section>
    <aside className={`${styles.panel} ${styles.capabilityPreview}`} aria-live="polite"><Sparkle20Regular/><span>Safe scenario preview</span><h3>{selected?.title||'Choose a capability'}</h3><p>{selected?.outcome||'Select any capability to see its business result and a prompt you can use.'}</p><div className={styles.question}>{selected?.positivePrompts[0]||'Previewing does not apply an action.'}</div>{selected&&<Badge appearance="tint">{LENS_LABELS[selected.lens]} · {selected.role}</Badge>}<small>No action is applied from this preview.</small></aside>
  </div>;
}

function IntentBody({definition,properties,actor}:{definition:IIntentDefinition;properties:IInnovationProperties;actor:string}):React.ReactElement{
  switch(definition.key){
    case 'SubmitInnovationIdea':return <IdeaSubmission properties={properties} actor={actor}/>;
    case 'GetMyInnovation':return <MyInnovation properties={properties} actor={actor}/>;
    case 'BuildIdeaBusinessCase':return <BusinessCase properties={properties} actor={actor}/>;
    case 'CelebrateInnovationImpact':return <Recognition properties={properties} actor={actor}/>;
    case 'GetInnovationReviewQueue':return <Queue/>;
    case 'ReviewIdeaGate':return <Queue gate ideaId={properties.ideaId}/>;
    case 'ReviewInnovationFunding':return <Funding properties={properties} actor={actor}/>;
    case 'ExploreInnovationPortfolio':return <StaticContext intent={definition.key} detail="Illustrative portfolio funnel: 120 ideas, 7 scaled outcomes. Investment mix 52% core, 29% adjacent, 19% transform. No action taken."><Portfolio/></StaticContext>;
    case 'TrackInnovationValue':return <Value properties={properties}/>;
    case 'GenerateInnovationBrief':return <ExecutiveBrief properties={properties} actor={actor}/>;
    case 'GetInnovationGrowth':return <Growth/>;
    case 'ExploreGlobalInnovation':return <Global properties={properties}/>;
    case 'TrackInnovationBudget':return <StaticContext intent={definition.key} detail="Mock budget: allocated $4.8m minus committed $2.6m, spent $900k, forecast $500k equals available $800k."><BudgetView/></StaticContext>;
    case 'GetInnovationPortfolioHealth':return <StaticContext intent={definition.key} detail="Illustrative health: velocity 78, balance 66, alignment 88, value 81. Exceptions: transform horizon, APAC conversion gap."><PortfolioHealth/></StaticContext>;
    case 'LaunchInnovationChallenge':return <Challenge properties={properties} actor={actor}/>;
    case 'ManageInnovationExperiment':return <Experiment properties={properties} actor={actor}/>;
    case 'ExploreAgentCapabilities':return <Explorer properties={properties}/>;
  }
}
function StaticContext({intent,detail,children}:{intent:string;detail:string;children:React.ReactNode}):React.ReactElement{
  useVisibleState(intent,'information',detail);return <>{children}</>;
}
function lensKpis(lens:InnovationLens):readonly {label:string;value:string;detail?:string}[]{
  if(lens==='my-innovation')return [{label:'Ideas in motion',value:'3'},{label:'Next action',value:'1'},{label:'Supporters',value:'42'},{label:'Recognized value',value:'$1.4m'}];
  if(lens==='programs-pilots')return [{label:'Active challenges',value:'8'},{label:'Submissions',value:'120'},{label:'Pilots',value:'15'},{label:'Conversion',value:'42%'}];
  if(lens==='reviews-gates')return [{label:'Waiting',value:'4'},{label:'Due today',value:'2'},{label:'Evidence ready',value:'3'},{label:'Median age',value:'3.2d'}];
  if(lens==='investment')return [{label:'Allocated',value:'$4.8m'},{label:'Committed',value:'$2.6m'},{label:'Available',value:'$800k'},{label:'Expected value',value:'$12.4m'}];
  return [{label:'Ideas',value:'120'},{label:'Portfolio health',value:'78'},{label:'Value realized',value:'$8.7m'},{label:'Conversion',value:'42%'}];
}
const DEFAULT_TOOLS:Record<InnovationLens,Parameters<typeof getIntent>[0]>={'my-innovation':'GetMyInnovation','programs-pilots':'GetInnovationGrowth','reviews-gates':'GetInnovationReviewQueue',investment:'TrackInnovationBudget','enterprise-insights':'ExploreInnovationPortfolio',education:'ExploreAgentCapabilities'};
export default function PremiumInnovationApp(props:IProps):React.ReactElement{
  const invocation=JSON.stringify([props.definition.key,props.properties,props.currentUserName]);
  return <Invocation key={invocation} {...props}/>;
}
function Invocation({definition,properties,currentUserName,displayMode,onRequestFullscreen,onVisibleState,hostError}:IProps):React.ReactElement{
  const fullscreen=displayMode==='fullscreen'&&definition.lens!=='education';
  const [lens,setLens]=React.useState(definition.lens);
  const [compact,setCompact]=React.useState(false);
  const [resetVersion,setResetVersion]=React.useState(0);
  const [primaryNoMatch,setPrimaryNoMatch]=React.useState(false);
  const tabs:InnovationLens[]=(Object.keys(LENS_LABELS) as InnovationLens[]).filter(item=>item!=='education');
  const navRef=React.useRef<HTMLDivElement>(null);
  const active=fullscreen&&lens!==definition.lens?getIntent(DEFAULT_TOOLS[lens]):definition;
  const activeProperties=active.key===definition.key?properties:{};
  const profile=profiles[lens];
  const visiblePrimary=React.useRef(true);
  const primaryState=React.useRef<IVisibleState>();
  visiblePrimary.current=active.key===definition.key;
  const publishPrimary=React.useCallback((state:IVisibleState):void=>{primaryState.current=state;setPrimaryNoMatch(state.state==='no-match');if(visiblePrimary.current)onVisibleState?.(state);},[onVisibleState]);
  const publish=React.useCallback((state:IVisibleState):void=>{onVisibleState?.(state);},[onVisibleState]);
  React.useEffect(()=>{if(active.key===definition.key&&primaryState.current)onVisibleState?.(primaryState.current);},[active.key,definition.key,onVisibleState]);
  const reset=():void=>{resetReceipts();setResetVersion(value=>value+1);};
  const onKeys=(event:React.KeyboardEvent<HTMLDivElement>):void=>{
    if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
    event.preventDefault();
    const next=(tabs.indexOf(lens)+(event.key==='ArrowDown'?1:-1)+tabs.length)%tabs.length;
    setLens(tabs[next]);navRef.current?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus();
  };
  return <InnovationContext.Provider value={publish}><section className={`${styles.root} ${fullscreen?styles.shell:styles.inline} ${compact?styles.compact:''}`} data-intent={definition.key}>
    <nav key="nav" hidden={!fullscreen} className={styles.nav} aria-label="Innovation work areas">
      <div className={styles.navBrand}><span className={styles.brandMark}><Lightbulb24Regular/></span><span>Zava Innovation</span></div>
      <div className={styles.navList} role="tablist" aria-orientation="vertical" ref={navRef} onKeyDown={onKeys}>{tabs.map(item=><button id={`lens-${item}`} role="tab" aria-selected={lens===item} aria-controls={`dashboard-${item}`} tabIndex={lens===item?0:-1} className={styles.navTab} data-selected={lens===item} key={item} onClick={()=>setLens(item)}>{lensIcons[item]}<span>{LENS_LABELS[item]}</span></button>)}</div>
      <div className={styles.navMeta}>Offline showcase<br/>Deterministic mock data<br/>No tenant writes</div>
    </nav>
    <main key="main" className={fullscreen?styles.main:styles.canvas} role={fullscreen?'tabpanel':undefined} id={`dashboard-${lens}`} aria-labelledby={fullscreen?`lens-${lens}`:undefined}>
      <div hidden={!fullscreen} className={styles.topbar}><div className={styles.toptools}><Button icon={<Settings20Regular/>} aria-pressed={compact} onClick={()=>setCompact(value=>!value)}>{compact?'Comfortable':'Compact'}</Button><Button icon={<ArrowReset20Regular/>} onClick={reset}>Reset demo data</Button><Badge appearance="tint">Mock operating picture</Badge></div><div className={styles.profile}><Avatar name={profile.name}/><span><b>{profile.name}</b><br/>{profile.role}</span></div></div>
      <section hidden={!fullscreen} className={styles.hero}><Avatar name={profile.name} large/><div><span className={styles.meta}>{profile.role}</span><h1>{LENS_LABELS[lens]}</h1><p>{primaryNoMatch&&active.key===definition.key?'The requested selection has no matching offline record. No substitute or healthy assessment is shown.':profile.headline}</p></div><div className={styles.heroMetric}><strong>{primaryNoMatch&&active.key===definition.key?'No match':profile.metric}</strong><span>{primaryNoMatch&&active.key===definition.key?'Selection unresolved':profile.metricLabel}</span></div></section>
      <header className={styles.header}><div><div className={styles.brand}>Zava Innovation Hub · {LENS_LABELS[active.lens]}</div><h2 className={styles.title}>{active.title}</h2><p className={styles.summary}>{active.summary}</p></div>{!fullscreen&&onRequestFullscreen&&<Button className={styles.expand} appearance="subtle" icon={<ArrowMaximize24Regular/>} onClick={onRequestFullscreen} aria-label="View in full screen"><span className={styles.expandLabel}>Expand</span></Button>}</header>
      <div hidden={!fullscreen||(primaryNoMatch&&active.key===definition.key)}><Kpis items={lensKpis(lens)}/><p className={styles.meta}>Illustrative workspace-wide KPIs, not a selected-record assessment.</p></div>
      {hostError&&<p role="alert" className={styles.validation}>Host operation failed: {hostError}. No success has been assumed.</p>}
      <div key={`primary-${resetVersion}`} hidden={active.key!==definition.key}><InnovationContext.Provider value={publishPrimary}><IntentBody definition={definition} properties={properties} actor={currentUserName}/></InnovationContext.Provider></div>
      {active.key!==definition.key&&<div key={`${active.key}-${resetVersion}`}><IntentBody definition={active} properties={activeProperties} actor={profiles[active.lens].name}/></div>}
      <div className={styles.question}>{lensIcons[active.lens]}<span>{active.decisionQuestion}</span></div>
      <p className={styles.meta}>Offline deterministic showcase · no tenant writes · {fullscreen?'Use the host control to return inline.':'Expand retains your current draft.'}</p>
    </main>
  </section></InnovationContext.Provider>;
}
