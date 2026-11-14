import * as React from 'react';
import { Badge, Button, Field, Input, Textarea } from '@fluentui/react-components';
import { type IInnovationProperties, type InnovationIntentKey } from './catalog';
import { IDEAS, PEOPLE, type IIdea } from './domain';
import { addReceipt, type ISessionReceipt } from './sessionStore';
import { BUDGET, THEMES, businessCase, challengeDays, currency, experimentResult, findIdea, fundingPosition, hasText, validNumber } from './operations';
import { useVisibleState } from './InnovationContext';
import styles from './PremiumInnovationApp.module.scss';

type Phase='draft'|'review'|'confirm'|'receipt';
interface IFrameProps {
  readonly intent:InnovationIntentKey; readonly title:string; readonly operation:string; readonly actor:string;
  readonly valid:boolean; readonly errors:readonly string[]; readonly values:Readonly<Record<string,string|number>>;
  readonly consequence:string; readonly children:React.ReactNode; readonly evidence:React.ReactNode;
  readonly onReset:()=>void;
}
function Frame({intent,title,operation,actor,valid,errors,values,consequence,children,evidence,onReset}:IFrameProps):React.ReactElement{
  const [phase,setPhase]=React.useState<Phase>('draft');
  const [receipt,setReceipt]=React.useState<ISessionReceipt>();
  const summary=Object.keys(values).map(label=>`${label}: ${values[label]}`).join('; ');
  useVisibleState(intent,phase,phase==='draft'?'Editable draft; no action taken.':phase==='receipt'?`${receipt?.id}: ${receipt?.detail}`:`${summary}. ${consequence}`);
  const reset=():void=>{onReset();setReceipt(undefined);setPhase('draft');};
  const confirm=():void=>{
    if(!valid||phase!=='confirm')return;
    setReceipt(addReceipt(intent,actor,summary,operation,values));setPhase('receipt');
  };
  return <section className={styles.panel} data-layout={`${intent}-${phase}`}>
    <div className={styles.chartTitle}><h3>{title}</h3><Badge appearance="tint">{phase==='receipt'?'Session receipt':`${phase.charAt(0).toUpperCase()}${phase.slice(1)}`}</Badge></div>
    <ol className={styles.flowSteps}>{(['draft','review','confirm','receipt'] as const).map(step=><li key={step} aria-current={phase===step?'step':undefined}>{step}</li>)}</ol>
    {phase==='draft'?<>{children}{errors.length>0&&<div className={styles.validation} role="status"><b>Before review</b><ul>{errors.map(error=><li key={error}>{error}</li>)}</ul></div>}</>:phase==='receipt'?<div role="status" className={styles.receipt}><div><h3>{operation} recorded</h3><p>{receipt?.id} · {actor}</p><p>{receipt?.detail}</p><p>In-memory demo receipt only. No tenant write, notification, publication, capital transfer, or scale approval. Cleared on page reload or Reset demo data.</p></div></div>:<><h4>{phase==='review'?'Evidence and calculations':'Human confirmation required'}</h4>{evidence}<dl className={styles.snapshot}>{Object.keys(values).map(label=><div key={label}><dt>{label}</dt><dd>{values[label]}</dd></div>)}</dl><p className={styles.question}>{consequence}</p></>}
    <div className={styles.actions}>
      {phase==='draft'&&<Button appearance="primary" disabled={!valid} onClick={()=>setPhase('review')}>Review {title.toLowerCase()}</Button>}
      {phase==='review'&&<><Button onClick={()=>setPhase('draft')}>Edit draft</Button><Button appearance="primary" disabled={!valid} onClick={()=>setPhase('confirm')}>Continue to confirmation</Button></>}
      {phase==='confirm'&&<><Button onClick={()=>setPhase('review')}>Back to review</Button><Button appearance="primary" disabled={!valid} onClick={confirm}>Confirm {operation.toLowerCase()}</Button></>}
      <Button onClick={reset}>{phase==='receipt'?'Start a fresh draft':'Reset draft'}</Button>
    </div>
  </section>;
}
function Text({label,value,onChange,multiline=false,type='text'}:{label:string;value:string;onChange:(value:string)=>void;multiline?:boolean;type?:'text'|'number'|'date'}):React.ReactElement{
  return <Field label={label} required>{multiline?<Textarea value={value} onChange={(_,data)=>onChange(data.value)}/>:<Input type={type} value={value} onChange={(_,data)=>onChange(data.value)}/>}</Field>;
}
function Choice({label,value,options,onChange}:{label:string;value:string;options:readonly string[];onChange:(value:string)=>void}):React.ReactElement{
  return <label className={styles.choice}><span>{label}</span><select aria-label={label} value={value} onChange={event=>onChange(event.target.value)}>{options.map(option=><option key={option}>{option}</option>)}</select></label>;
}
export function NoMatch({intent,id}:{intent:string;id:string}):React.ReactElement{
  useVisibleState(intent,'no-match',`No matching record or filter: ${id}. No action available.`);
  return <section className={styles.panel} data-layout={`${intent}-no-match`} role="status"><h3>No matching record</h3><p>{id} is not in this offline catalog. No substitute was selected and no action can be confirmed. Start a fresh invocation with an exact catalog ID.</p></section>;
}
function RecordEvidence({idea}:{idea:IIdea}):React.ReactElement{
  return <div className={styles.question}><div><b>{idea.id} · {idea.title}</b><p>{idea.owner} · {idea.theme} · {idea.region} · {idea.stage}</p><p>Projected {currency(idea.projected)} · measured {currency(idea.actual)} · investment {currency(idea.funding)}</p></div></div>;
}
interface IExperienceProps {readonly properties:IInnovationProperties;readonly actor:string;}

export function IdeaSubmission({properties,actor}:IExperienceProps):React.ReactElement{
  const initial={title:properties.message||'',problem:'',audience:'',baseline:'',target:'',theme:properties.theme||'Employee experience',owner:actor,evidence:''};
  const [draft,setDraft]=React.useState(initial);
  const set=(key:keyof typeof draft):((value:string)=>void)=>(value:string):void=>setDraft(current=>({...current,[key]:value}));
  const errors=[
    ...(!hasText(draft.title)?['Describe the idea in at least 10 characters.']:[]),
    ...(!hasText(draft.problem)||!hasText(draft.audience)?['Name a specific problem and affected audience (10 characters each).']:[]),
    ...(!validNumber(draft.baseline,1,10000)||!validNumber(draft.target,0,10000)||Number(draft.target)>=Number(draft.baseline)?['Target days must be lower than baseline days (baseline 1–10,000).']:[]),
    ...(!draft.owner.trim()||!THEMES.some(theme=>theme===draft.theme)?['Name an owner and select a supported strategic theme.']:[]),
    ...(!hasText(draft.evidence)?['Provide an evidence source and observation (10 characters).']:[])
  ];
  const reduction=Number(draft.baseline)>0?(Number(draft.baseline)-Number(draft.target))/Number(draft.baseline)*100:0;
  const duplicates=IDEAS.filter(idea=>draft.title.trim().length>9&&idea.title.toLowerCase().includes(draft.title.trim().toLowerCase()));
  return <Frame intent="SubmitInnovationIdea" title="Idea canvas" operation="Idea submission" actor={actor} valid={errors.length===0} errors={errors}
    values={{Title:draft.title,Problem:draft.problem,Audience:draft.audience,Owner:draft.owner,Theme:draft.theme,'Baseline days':draft.baseline,'Target days':draft.target,'Reduction target':`${reduction.toFixed(1)}%`,Evidence:draft.evidence}}
    consequence="Creates one mock intake submission for screening, not a gate approval." onReset={()=>setDraft(initial)}
    evidence={<><p>Target reduction: <b>{reduction.toFixed(1)}%</b>. The source is user-supplied and not independently verified.</p><p>{duplicates.length?`Potential duplicate: ${duplicates.map(idea=>`${idea.id} ${idea.title}`).join(', ')}. Screening must resolve overlap.`:'No exact title overlap in the offline catalog. This is not a live duplicate check.'}</p></>}>
    <div className={styles.grid2}><div className={styles.form}>
      <Text label="Idea title" value={draft.title} onChange={set('title')}/><Choice label="Strategic theme" value={draft.theme} options={THEMES} onChange={set('theme')}/>
      <Text label="Problem to solve" value={draft.problem} onChange={set('problem')} multiline/><Text label="Affected audience" value={draft.audience} onChange={set('audience')}/>
      <Text label="Current onboarding / process days" value={draft.baseline} onChange={set('baseline')} type="number"/><Text label="Target process days" value={draft.target} onChange={set('target')} type="number"/>
      <Text label="Accountable owner" value={draft.owner} onChange={set('owner')}/><Text label="Evidence source and observation" value={draft.evidence} onChange={set('evidence')} multiline/>
    </div><aside><h3>Shape a testable opportunity</h3><p>Describe who loses time today and the measurable change. Evidence is mandatory; the agent does not invent research or approve ideas.</p><p>{duplicates.length} potential title overlap(s)</p></aside></div>
  </Frame>;
}

function BusinessCaseDraft({idea,properties,actor}:IExperienceProps&{readonly idea:IIdea}):React.ReactElement{
  const initial={investment:String(properties.amount??idea.funding),benefit:String(idea.projected),cost:'30000',confidence:'70',assumption:'',owner:idea.owner};
  const [draft,setDraft]=React.useState(initial);
  const set=(key:keyof typeof draft):((value:string)=>void)=>(value:string):void=>setDraft(current=>({...current,[key]:value}));
  const errors=[...(!validNumber(draft.investment,1)||!validNumber(draft.benefit)||!validNumber(draft.cost)||!validNumber(draft.confidence,1,100)?['Enter valid investment (>0), annual benefit/cost (0–100m), and confidence (1–100%).']:[]),...(!hasText(draft.assumption)||!draft.owner.trim()?['Name the case owner and a quantified benefit assumption (10 characters).']:[])];
  const model=businessCase(Number(draft.investment),Number(draft.benefit),Number(draft.cost),Number(draft.confidence));
  return <Frame intent="BuildIdeaBusinessCase" title="Financial business case" operation="Business case saved" actor={actor} errors={errors} valid={!errors.length} onReset={()=>setDraft(initial)}
    values={{Idea:`${idea.id} · ${idea.title}`,Owner:draft.owner,Investment:currency(Number(draft.investment)),'Annual gross benefit':currency(Number(draft.benefit)),'Annual operating cost':currency(Number(draft.cost)),Confidence:`${draft.confidence}%`,'Risk-adjusted net benefit':currency(model.adjusted),'First-year ROI':`${model.roi.toFixed(1)}%`,'Risk-adjusted payback':model.payback?`${model.payback.toFixed(1)} months`:'No positive payback',Assumption:draft.assumption}}
    consequence="Saves a modeled case for human financial review. Does not approve funding or validate the assumption."
    evidence={<div className={styles.grid3}><p>Annual net<br/><b>{currency(model.net)}</b></p><p>Confidence-adjusted net<br/><b>{currency(model.adjusted)}</b></p><p>Payback<br/><b>{model.payback?`${model.payback.toFixed(1)} months`:'Not achievable'}</b></p></div>}>
    <RecordEvidence idea={idea}/><div className={styles.form}><Text label="One-time investment ($)" value={draft.investment} type="number" onChange={set('investment')}/><Text label="Annual gross benefit ($)" value={draft.benefit} type="number" onChange={set('benefit')}/><Text label="Annual operating cost ($)" value={draft.cost} type="number" onChange={set('cost')}/><Text label="Benefit confidence (%)" value={draft.confidence} type="number" onChange={set('confidence')}/><Text label="Case owner" value={draft.owner} onChange={set('owner')}/><Text label="Benefit assumption and source" value={draft.assumption} onChange={set('assumption')} multiline/></div>
    <p className={styles.meta}>Net = benefit − annual cost. Adjusted = benefit × confidence − cost. ROI = (net − investment) ÷ investment. Payback uses adjusted monthly net. Negative returns remain visible.</p>
  </Frame>;
}
export function BusinessCase(props:IExperienceProps):React.ReactElement{
  const idea=findIdea(props.properties.ideaId);
  return idea?<BusinessCaseDraft {...props} idea={idea}/>:<NoMatch intent="BuildIdeaBusinessCase" id={props.properties.ideaId||''}/>;
}

function RecognitionDraft({idea,properties,actor}:IExperienceProps&{readonly idea:IIdea}):React.ReactElement{
  const initial={contributor:idea.owner,contribution:'',source:'',message:properties.message||'',channel:'Team spotlight'};
  const [draft,setDraft]=React.useState(initial);
  const set=(key:keyof typeof draft):((value:string)=>void)=>(value:string):void=>setDraft(current=>({...current,[key]:value}));
  const errors=[...(!draft.contributor.trim()||!hasText(draft.contribution)?['Name a contributor and their specific contribution.']:[]),...(!hasText(draft.source)||!hasText(draft.message)?['Supply a measurement source and recognition message (10 characters each).']:[]),...(idea.actual<=0?['Measured impact is required before recognition.']:[])];
  return <Frame intent="CelebrateInnovationImpact" title="Impact recognition" operation="Recognition prepared" actor={actor} errors={errors} valid={!errors.length} onReset={()=>setDraft(initial)}
    values={{Idea:`${idea.id} · ${idea.title}`,Contributor:draft.contributor,Contribution:draft.contribution,'Measured value':currency(idea.actual),'Measurement source':draft.source,Channel:draft.channel,Message:draft.message}}
    consequence={`Prepares a ${draft.channel.toLowerCase()} story for ${draft.contributor}; it is not posted or sent.`}
    evidence={<><RecordEvidence idea={idea}/><blockquote>{draft.message} — celebrating {draft.contributor} for {draft.contribution}. Measured outcome: {currency(idea.actual)}. Source: {draft.source}.</blockquote></>}>
    <div className={styles.grid2}><div className={styles.form}><Choice label="Contributor" value={draft.contributor} options={PEOPLE.map(person=>person[0])} onChange={set('contributor')}/><Choice label="Recognition channel" value={draft.channel} options={['Team spotlight','Leadership note','Innovation showcase']} onChange={set('channel')}/><Text label="Specific contribution" value={draft.contribution} onChange={set('contribution')} multiline/><Text label="Measurement source" value={draft.source} onChange={set('source')}/><Text label="Recognition message" value={draft.message} onChange={set('message')} multiline/></div><aside><h3>Impact, not popularity</h3><RecordEvidence idea={idea}/><p>Credit named work. The mock catalog contains measured financial outcomes; the human must name the source and contribution before preparing praise.</p></aside></div>
  </Frame>;
}
export function Recognition(props:IExperienceProps):React.ReactElement{
  const idea=findIdea(props.properties.ideaId);
  return idea?<RecognitionDraft {...props} idea={idea}/>:<NoMatch intent="CelebrateInnovationImpact" id={props.properties.ideaId||''}/>;
}

function FundingDraft({idea,properties,actor}:IExperienceProps&{readonly idea:IIdea}):React.ReactElement{
  const initial={amount:String(properties.amount??idea.funding),decision:'Approve',owner:idea.owner,condition:properties.message||''};
  const [draft,setDraft]=React.useState(initial);
  const set=(key:keyof typeof draft):((value:string)=>void)=>(value:string):void=>setDraft(current=>({...current,[key]:value}));
  const allocating=draft.decision==='Approve'||draft.decision==='Adjust';
  const position=fundingPosition(allocating?Number(draft.amount):0);
  const eligible=idea.gateApproved&&['Funding','Pilot','Scale','Value'].indexOf(idea.stage)>=0;
  const errors=[...(!validNumber(draft.amount,1)?['Requested amount must be between $1 and $100m.']:[]),...(!hasText(draft.condition)||!draft.owner.trim()?['Name the accountable owner and funding conditions or reason.']:[]),...(allocating&&!eligible?['This idea is not gate-approved for capital. Defer or decline, or complete gate review first.']:[]),...(allocating&&position.overBudget?['Proposed commitment exceeds the $800,000 available envelope. Adjust the amount or defer.']:[])];
  return <Frame intent="ReviewInnovationFunding" title="Capital committee decision" operation="Funding decision" actor={actor} valid={!errors.length} errors={errors} onReset={()=>setDraft(initial)}
    values={{Idea:`${idea.id} · ${idea.title}`,Decision:draft.decision,Owner:draft.owner,'Requested amount':currency(Number(draft.amount)),'New commitment':currency(allocating?Number(draft.amount):0),'Remaining envelope':currency(position.remaining),'Conditions / rationale':draft.condition}}
    consequence={allocating?'Records a conditional mock commitment. No capital is transferred and no gate is advanced.':'Records no new commitment. Existing allocations remain unchanged.'}
    evidence={<><RecordEvidence idea={idea}/><p>Gate eligibility: <b>{eligible?'Passed to capital or later':'Not passed to capital'}</b></p><div className={styles.grid3}><p>Available before<br/><b>{currency(BUDGET.available)}</b></p><p>New commitment<br/><b>{currency(allocating?Number(draft.amount):0)}</b></p><p>Available after<br/><b>{currency(position.remaining)}</b></p></div></>}>
    <RecordEvidence idea={idea}/><div className={styles.form}><Choice label="Funding decision" value={draft.decision} options={['Approve','Adjust','Defer','Decline']} onChange={set('decision')}/><Text label="Proposed capital ($)" value={draft.amount} type="number" onChange={set('amount')}/><Text label="Funding accountable owner" value={draft.owner} onChange={set('owner')}/><Text label="Conditions or decision rationale" value={draft.condition} onChange={set('condition')} multiline/></div><p className={styles.question}>Available envelope: {currency(BUDGET.available)} · selected stage: {idea.stage}. Funding cannot bypass gate eligibility or the envelope.</p>
  </Frame>;
}
export function Funding(props:IExperienceProps):React.ReactElement{
  const idea=findIdea(props.properties.ideaId||'IDEA-044');
  return idea?<FundingDraft {...props} idea={idea}/>:<NoMatch intent="ReviewInnovationFunding" id={props.properties.ideaId||''}/>;
}

function BriefDraft({idea,properties,actor}:IExperienceProps&{readonly idea?:IIdea}):React.ReactElement{
  const records=idea?[idea]:IDEAS;
  const projected=records.reduce((sum,record)=>sum+record.projected,0);
  const actual=records.reduce((sum,record)=>sum+record.actual,0);
  const initial={audience:'Executive committee',headline:idea?`${idea.title}: value and next decision`:'Innovation portfolio: value and next decisions',decision:'',narrative:`${records.length} catalog ideas project ${currency(projected)} with ${currency(actual)} measured. Variance is ${currency(actual-projected)}.`,owner:actor};
  const [draft,setDraft]=React.useState(initial);
  const set=(key:keyof typeof draft):((value:string)=>void)=>(value:string):void=>setDraft(current=>({...current,[key]:value}));
  const errors=[...(!hasText(draft.headline)||!hasText(draft.narrative)||!hasText(draft.decision)||!draft.owner.trim()?['Provide a headline, evidence-grounded narrative, decision ask (10 characters each), and brief owner.']:[])];
  return <Frame intent="GenerateInnovationBrief" title="Executive narrative" operation="Executive brief prepared" actor={actor} valid={!errors.length} errors={errors} onReset={()=>setDraft(initial)}
    values={{Scope:idea?`${idea.id} · ${idea.title}`:'Complete 120-idea catalog',Audience:draft.audience,Owner:draft.owner,Headline:draft.headline,Narrative:draft.narrative,'Decision ask':draft.decision,'Projected value':currency(projected),'Measured value':currency(actual)}}
    consequence="Prepares an editable leadership brief. It is not emailed, published, or an approval."
    evidence={<article><h3>{draft.headline}</h3><p>For {draft.audience} · prepared by {draft.owner}</p><p>{draft.narrative}</p><p><b>Leadership decision requested:</b> {draft.decision}</p><p>Source: deterministic catalog, {records.length} record(s); no live reporting period or independent verification.</p></article>}>
    <div className={styles.grid2}><div className={styles.form}><Choice label="Brief audience" value={draft.audience} options={['Executive committee','Finance committee','Program sponsors']} onChange={set('audience')}/><Text label="Brief owner" value={draft.owner} onChange={set('owner')}/><Text label="Brief headline" value={draft.headline} onChange={set('headline')}/><Text label="Leadership decision ask" value={draft.decision} onChange={set('decision')} multiline/><Text label="Editable evidence narrative" value={draft.narrative} onChange={set('narrative')} multiline/></div><aside><h3>Source ledger</h3><p>{records.length} idea(s)</p><p>Projected: {currency(projected)}</p><p>Measured: {currency(actual)}</p><p>Variance: {currency(actual-projected)}</p><p className={styles.meta}>All amounts derive from the selected scope. Narrative edits do not rewrite the source ledger.</p></aside></div>
  </Frame>;
}
export function ExecutiveBrief(props:IExperienceProps):React.ReactElement{
  const idea=props.properties.ideaId?findIdea(props.properties.ideaId):undefined;
  return props.properties.ideaId&&!idea?<NoMatch intent="GenerateInnovationBrief" id={props.properties.ideaId}/>:<BriefDraft {...props} idea={idea}/>;
}

export function Challenge({properties,actor}:IExperienceProps):React.ReactElement{
  const initial={title:properties.message||'',theme:properties.theme||'Employee experience',region:properties.region||'All regions',audience:'',start:'2026-11-01',end:'2026-11-30',target:'20',impact:'50',feasibility:'30',inclusion:'20',owner:actor,criteria:''};
  const [draft,setDraft]=React.useState(initial);
  const set=(key:keyof typeof draft):((value:string)=>void)=>(value:string):void=>setDraft(current=>({...current,[key]:value}));
  const days=challengeDays(draft.start,draft.end);
  const weights=Number(draft.impact)+Number(draft.feasibility)+Number(draft.inclusion);
  const errors=[...(!hasText(draft.title)||!hasText(draft.audience)||!hasText(draft.criteria)||!draft.owner.trim()?['Name the challenge, audience, measurable success criteria (10 characters each), and owner.']:[]),...(!Number.isFinite(days)||days<7||days>90?['Challenge window must be 7–90 days.']:[]),...(!validNumber(draft.target,1,1000)||!Number.isInteger(Number(draft.target))?['Target qualified submissions must be a whole number from 1 to 1,000.']:[]),...(![draft.impact,draft.feasibility,draft.inclusion].every(value=>validNumber(value,0,100))||weights!==100?['Impact, feasibility, and inclusion rubric weights must total 100%.']:[]),...(!THEMES.some(theme=>theme===draft.theme)||['All regions','AMER','EMEA','APAC','LATAM'].indexOf(draft.region)<0?['Select a supported theme and region.']:[])];
  return <Frame intent="LaunchInnovationChallenge" title="Challenge launch plan" operation="Challenge launch staged" actor={actor} valid={!errors.length} errors={errors} onReset={()=>setDraft(initial)}
    values={{Challenge:draft.title,Theme:draft.theme,Region:draft.region,Audience:draft.audience,Owner:draft.owner,Opens:draft.start,Closes:draft.end,'Window days':days,'Qualified submission target':draft.target,'Impact / feasibility / inclusion':`${draft.impact}% / ${draft.feasibility}% / ${draft.inclusion}%`,'Success criteria':draft.criteria}}
    consequence="Stages a mock challenge launch. Does not notify entrants, open a real campaign, or submit an idea."
    evidence={<><p>Recruitment window: <b>{days} days</b> for {draft.region}. Target {draft.target} qualified submissions.</p><p>Scoring rubric: impact {draft.impact}%, feasibility {draft.feasibility}%, inclusion {draft.inclusion}% (total {weights}%).</p><p>Success is judged against: {draft.criteria}</p></>}>
    <div className={styles.form}><Text label="Challenge title" value={draft.title} onChange={set('title')}/><Choice label="Challenge theme" value={draft.theme} options={THEMES} onChange={set('theme')}/><Choice label="Recruitment region" value={draft.region} options={['All regions','AMER','EMEA','APAC','LATAM']} onChange={set('region')}/><Text label="Target audience" value={draft.audience} onChange={set('audience')}/><Text label="Opening date" value={draft.start} type="date" onChange={set('start')}/><Text label="Closing date" value={draft.end} type="date" onChange={set('end')}/><Text label="Qualified submission target" value={draft.target} type="number" onChange={set('target')}/><Text label="Challenge owner" value={draft.owner} onChange={set('owner')}/><Text label="Impact weight (%)" value={draft.impact} type="number" onChange={set('impact')}/><Text label="Feasibility weight (%)" value={draft.feasibility} type="number" onChange={set('feasibility')}/><Text label="Inclusion weight (%)" value={draft.inclusion} type="number" onChange={set('inclusion')}/><Text label="Measurable challenge success criteria" value={draft.criteria} onChange={set('criteria')} multiline/></div>
  </Frame>;
}

function ExperimentDraft({idea,properties,actor}:IExperienceProps&{readonly idea:IIdea}):React.ReactElement{
  const initial={hypothesis:properties.message||'',sample:'',minimum:'30',baseline:'10',observed:'',target:'20',incidents:'0',source:'',decision:'Pivot',reason:'',owner:idea.owner};
  const [draft,setDraft]=React.useState(initial);
  const set=(key:keyof typeof draft):((value:string)=>void)=>(value:string):void=>setDraft(current=>({...current,[key]:value}));
  const result=experimentResult(Number(draft.sample),Number(draft.minimum),Number(draft.baseline),Number(draft.observed),Number(draft.target),Number(draft.incidents));
  const funded=['Pilot','Scale','Value'].indexOf(idea.stage)>=0;
  const errors=[...(!funded?['Select a funded pilot or later-stage idea; this operation cannot authorize a pilot.']:[]),...(!hasText(draft.hypothesis)||!hasText(draft.source)||!hasText(draft.reason)||!draft.owner.trim()?['Provide a hypothesis, observation source, human decision rationale (10 characters each), and owner.']:[]),...(!validNumber(draft.sample,1,100000)||!validNumber(draft.minimum,10,100000)||![draft.sample,draft.minimum,draft.incidents].every(value=>Number.isInteger(Number(value)))||!validNumber(draft.baseline,1,10000)||!validNumber(draft.observed,0,10000)||!validNumber(draft.target,1,100)||!validNumber(draft.incidents,0,1000)?['Enter whole sample/minimum/incident counts and valid process days / reduction target. Minimum sample is at least 10.']:[]),...(draft.decision==='Go'&&result.recommendation!=='Go'?['Go is blocked until sample, reduction, and safety thresholds all pass.']:[]),...(Number(draft.incidents)>0&&draft.decision!=='Stop'?['Safety incidents require Stop; do not bypass the guardrail.']:[])];
  return <Frame intent="ManageInnovationExperiment" title="Pilot learning assessment" operation="Experiment learning recorded" actor={actor} valid={!errors.length} errors={errors} onReset={()=>setDraft(initial)}
    values={{Idea:`${idea.id} · ${idea.title}`,Owner:draft.owner,Hypothesis:draft.hypothesis,'Minimum / observed sample':`${draft.minimum} / ${draft.sample}`,'Baseline / observed days':`${draft.baseline} / ${draft.observed}`,'Reduction target':`${draft.target}%`,'Measured reduction':`${result.improvement.toFixed(1)}%`,'Safety incidents':draft.incidents,'Observation source':draft.source,'Rule recommendation':result.recommendation,'Human learning decision':draft.decision,Rationale:draft.reason}}
    consequence="Records a bounded pilot learning decision, not funding, gate progression, or permission to scale."
    evidence={<><RecordEvidence idea={idea}/><p>Measured reduction: <b>{result.improvement.toFixed(1)}%</b> vs {draft.target}% threshold.</p><p>Rule recommendation: <b>{result.recommendation}</b> — {result.reason}</p><p>The human chose <b>{draft.decision}</b>: {draft.reason}</p></>}>
    <RecordEvidence idea={idea}/><div className={styles.form}><Text label="Testable pilot hypothesis" value={draft.hypothesis} onChange={set('hypothesis')} multiline/><Text label="Pilot owner" value={draft.owner} onChange={set('owner')}/><Text label="Predeclared minimum sample" value={draft.minimum} type="number" onChange={set('minimum')}/><Text label="Observed sample size" value={draft.sample} type="number" onChange={set('sample')}/><Text label="Baseline process days" value={draft.baseline} type="number" onChange={set('baseline')}/><Text label="Observed process days" value={draft.observed} type="number" onChange={set('observed')}/><Text label="Required reduction (%)" value={draft.target} type="number" onChange={set('target')}/><Text label="Safety incident count" value={draft.incidents} type="number" onChange={set('incidents')}/><Text label="Observation source" value={draft.source} onChange={set('source')}/><Choice label="Human learning decision" value={draft.decision} options={['Go','Pivot','Stop']} onChange={set('decision')}/><Text label="Human decision rationale" value={draft.reason} onChange={set('reason')} multiline/></div><p className={styles.meta}>Predeclare thresholds before collecting observations. Offline controls are editable for scenario testing; they do not establish a live trial protocol.</p>
  </Frame>;
}
export function Experiment(props:IExperienceProps):React.ReactElement{
  const idea=findIdea(props.properties.ideaId||'IDEA-057');
  return idea?<ExperimentDraft {...props} idea={idea}/>:<NoMatch intent="ManageInnovationExperiment" id={props.properties.ideaId||''}/>;
}
