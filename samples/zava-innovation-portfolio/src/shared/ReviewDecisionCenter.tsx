import * as React from 'react';
import { Badge, Button, Field, ProgressBar, Textarea } from '@fluentui/react-components';
import {
  ArrowLeft20Regular, CheckmarkCircle20Filled, Clock20Regular, DismissCircle20Regular,
  DocumentBulletList20Regular, PersonFeedback20Regular, ShieldCheckmark20Regular,
  TargetArrow20Regular
} from '@fluentui/react-icons';

import { PERSONA_MEDIA } from './media';
import { addReceipt } from './sessionStore';
import { NoMatch } from './InnovationExperiences';
import { useVisibleState } from './InnovationContext';
import styles from './PremiumInnovationApp.module.scss';

export type ReviewPhase = 'Screening' | 'Business case' | 'Pilot';
type ReviewStatus = 'pending' | 'approved' | 'declined' | 'sentBack';
type QueueFilter = 'pending' | 'approved' | 'declined' | 'sentBack' | 'all';
type ReviewStage = 'queue' | 'detail' | 'confirm' | 'receipt';
type Decision = 'approve' | 'decline' | 'sendBack';

export interface ISubmissionReview {
  readonly id: string;
  readonly title: string;
  readonly owner: string;
  readonly phase: ReviewPhase;
  readonly age: string;
  readonly evidence: number;
  readonly score: number;
  readonly strategicFit: number;
  readonly value: string;
  readonly summary: string;
  readonly strengths: readonly string[];
  readonly gaps: readonly string[];
  readonly nextPhase: string;
  readonly status: ReviewStatus;
  readonly storedRationale?: string;
}

export const REVIEW_SUBMISSIONS: readonly ISubmissionReview[] = [
  { id:'IDEA-001', title:'Smart Onboarding Journey', owner:'Megan Bowen', phase:'Screening', age:'2 days', evidence:86, score:84, strategicFit:91, value:'$1.4m', summary:'Personalized onboarding orchestration that reduces time-to-productivity for new employees.', strengths:['Clear employee outcome','Four evidence sources','Reusable across regions'], gaps:['Confirm APAC accessibility sample'], nextPhase:'Business case development', status:'pending' },
  { id:'IDEA-014', title:'Customer Signal Studio', owner:'Lee Gu', phase:'Screening', age:'4 days', evidence:72, score:78, strategicFit:88, value:'$920k', summary:'Combines service feedback and usage signals into prioritized experience opportunities.', strengths:['Strong customer evidence','Cross-product reuse'], gaps:['Name accountable data owner','Add privacy assessment'], nextPhase:'Business case development', status:'pending' },
  { id:'IDEA-022', title:'Supplier Carbon Twin', owner:'Grady Archie', phase:'Screening', age:'6 days', evidence:58, score:69, strategicFit:76, value:'$610k', summary:'Models supplier emissions and intervention scenarios for procurement decisions.', strengths:['Strategic sustainability fit'], gaps:['Validate source coverage','Quantify operating cost'], nextPhase:'Business case development', status:'sentBack', storedRationale:'Add source coverage and a cost estimate before resubmission.' },
  { id:'IDEA-026', title:'Meeting Mood Scanner', owner:'Patti Fernandez', phase:'Screening', age:'8 days', evidence:44, score:48, strategicFit:51, value:'$180k', summary:'Infers meeting sentiment to suggest facilitator interventions.', strengths:['Clear user group'], gaps:['No consent model','Limited strategic value','Existing capability overlap'], nextPhase:'Business case development', status:'declined', storedRationale:'Declined because consent risk and existing capability overlap outweigh the projected value.' },
  { id:'IDEA-031', title:'Knowledge Discovery Platform', owner:'Pradeep Gupta', phase:'Business case', age:'1 day', evidence:93, score:89, strategicFit:86, value:'$2.2m', summary:'Connects trusted internal knowledge to role-specific decision moments.', strengths:['Validated pilot demand','8-month payback','Responsible AI review complete'], gaps:[], nextPhase:'Funding committee', status:'pending' },
  { id:'IDEA-044', title:'Demand Forecasting Modernization', owner:'Isaiah Langer', phase:'Business case', age:'3 days', evidence:81, score:82, strategicFit:90, value:'$3.6m', summary:'Improves forecast accuracy using harmonized commercial and operational signals.', strengths:['High projected value','Named executive sponsor'], gaps:['Complete sensitivity range'], nextPhase:'Funding committee', status:'approved', storedRationale:'Advance with sensitivity range tracked as a funding condition.' },
  { id:'IDEA-057', title:'Frontline Copilot Coach', owner:'Johanna Lorenz', phase:'Pilot', age:'Today', evidence:88, score:87, strategicFit:83, value:'$1.1m', summary:'Tests in-the-flow coaching for frontline service and safety scenarios.', strengths:['Adoption above threshold','No safety incidents','Manager advocacy'], gaps:['Quality threshold missed by 2 points'], nextPhase:'Scale decision', status:'pending' },
  { id:'IDEA-063', title:'Invoice Exception Automation', owner:'Miriam Graham', phase:'Pilot', age:'5 days', evidence:96, score:92, strategicFit:89, value:'$1.7m', summary:'Automates low-risk invoice exceptions while routing ambiguity to finance specialists.', strengths:['31% cycle-time reduction','Controls validated','Value independently measured'], gaps:[], nextPhase:'Scale decision', status:'approved', storedRationale:'Scale to EMEA finance operations with monthly control review.' }
];

const PHASES: readonly ReviewPhase[]=['Screening','Business case','Pilot'];
const FILTERS: readonly {key:QueueFilter;label:string}[]=[{key:'pending',label:'Action items'},{key:'approved',label:'Approved'},{key:'declined',label:'Declined'},{key:'sentBack',label:'Sent back'},{key:'all',label:'All'}];

function avatar(name:string):string{return PERSONA_MEDIA[name]?.src||'';}
function statusLabel(status:ReviewStatus):string{return status==='approved'?'Approved':status==='declined'?'Declined':status==='sentBack'?'Sent back':'Awaiting review';}

export interface IReviewDecisionCenterProps {
  readonly initialSubmissionId?: string;
  readonly startInDetail?: boolean;
  readonly compact?: boolean;
  readonly allowDecision?: boolean;
}

export default function ReviewDecisionCenter(props:IReviewDecisionCenterProps):React.ReactElement{
  if(props.initialSubmissionId&&!REVIEW_SUBMISSIONS.some(item=>item.id===props.initialSubmissionId))return <NoMatch intent={props.allowDecision?'ReviewIdeaGate':'GetInnovationReviewQueue'} id={props.initialSubmissionId}/>;
  return <DecisionWorkspace {...props}/>;
}
function DecisionWorkspace({initialSubmissionId,startInDetail=false,compact=false,allowDecision=false}:IReviewDecisionCenterProps):React.ReactElement{
  const initial=REVIEW_SUBMISSIONS.find(item=>item.id===initialSubmissionId)??REVIEW_SUBMISSIONS[0];
  const [phase,setPhase]=React.useState<ReviewPhase>(initial.phase);
  const [filter,setFilter]=React.useState<QueueFilter>('pending');
  const [selectedId,setSelectedId]=React.useState(initial.id);
  const [stage,setStage]=React.useState<ReviewStage>(startInDetail?'detail':'queue');
  const [decision,setDecision]=React.useState<Decision>('approve');
  const [rationale,setRationale]=React.useState('');
  const [overrides,setOverrides]=React.useState<Readonly<Record<string,{status:ReviewStatus;rationale:string}>>>({});

  const withStatus=React.useCallback((item:ISubmissionReview):ISubmissionReview=>{
    const override=overrides[item.id];
    return override?{...item,status:override.status,storedRationale:override.rationale}:item;
  },[overrides]);
  const records=REVIEW_SUBMISSIONS.map(withStatus);
  const selected=records.find(item=>item.id===selectedId)??records[0];
  const visible=records.filter(item=>item.phase===phase&&(filter==='all'||item.status===filter));
  const count=(status:QueueFilter):number=>status==='all'?records.length:records.filter(item=>item.status===status).length;
  const phaseStatusCount=(status:QueueFilter):number=>status==='all'?records.filter(item=>item.phase===phase).length:records.filter(item=>item.phase===phase&&item.status===status).length;
  const phaseCount=(item:ReviewPhase):number=>records.filter(record=>record.phase===item&&record.status==='pending').length;
  useVisibleState(allowDecision?'ReviewIdeaGate':'GetInnovationReviewQueue',stage,stage==='queue'?`${phase}; ${filter}; visible: ${visible.map(item=>item.id).join(', ')}`:`${selected.id}: ${selected.title}; ${selected.status}; evidence ${selected.evidence}%; gaps: ${selected.gaps.join(', ')}${stage==='receipt'?`; recorded ${decision}: ${rationale}`:''}`);
  const choose=(item:ISubmissionReview):void=>{setSelectedId(item.id);setDecision('approve');setRationale('');setStage('detail');};
  const begin=(next:Decision):void=>{setDecision(next);if(next!=='approve')setRationale('');setStage('confirm');};
  const confirm=():void=>{if(!allowDecision||rationale.trim().length<10||selected.status!=='pending')return;const status:ReviewStatus=decision==='approve'?'approved':decision==='decline'?'declined':'sentBack';setOverrides(current=>({...current,[selected.id]:{status,rationale}}));addReceipt('ReviewIdeaGate','Diego Siciliani',`${selected.id}: ${status} - ${rationale}`,'Gate decision',{ideaId:selected.id,title:selected.title,decision:status,rationale});setStage('receipt');};
  const returnToQueue=():void=>{setFilter('pending');setStage('queue');};

  const QueueView=():React.ReactElement=><div className={styles.reviewWorkspace} data-layout="review-decision-queue">
    <section className={styles.reviewQueuePanel}>
      <div className={styles.reviewHeading}><div><span>Decision center</span><h3>Incoming submissions</h3></div><Badge appearance="tint" color="warning">{count('pending')} need action</Badge></div>
      <div className={styles.phaseBuckets} role="tablist" aria-label="Review phase">
        {PHASES.map(item=><button role="tab" aria-selected={phase===item} className={styles.phaseBucket} data-selected={phase===item} key={item} onClick={()=>setPhase(item)}><span>{item}</span><strong>{phaseCount(item)}</strong><small>{item==='Screening'?'Validate opportunity':item==='Business case'?'Test value and feasibility':'Evaluate pilot evidence'}</small></button>)}
      </div>
      <div className={styles.statusFilters} aria-label="Submission status filters">{FILTERS.map(item=><button aria-pressed={filter===item.key} key={item.key} onClick={()=>setFilter(item.key)}>{item.label}<strong>{phaseStatusCount(item.key)}</strong></button>)}</div>
      <div className={styles.submissionList}>{visible.length===0?<div className={styles.reviewEmpty}><CheckmarkCircle20Filled/><b>No {filter==='pending'?'action items':filter} in {phase}</b><span>Choose another phase or status.</span></div>:visible.map(item=><article className={styles.submissionRow} data-status={item.status} key={item.id}><div className={styles.person}><img className={styles.avatar} src={avatar(item.owner)} alt={item.owner}/><span><b>{item.title}</b><small>{item.owner} · {item.id}</small></span></div><div className={styles.submissionSignals}><span><Clock20Regular/>{item.age}</span><span><DocumentBulletList20Regular/>{item.evidence}% evidence</span><span><TargetArrow20Regular/>{item.score} score</span></div><Badge appearance="tint" color={item.status==='approved'?'success':item.status==='sentBack'?'danger':'warning'}>{statusLabel(item.status)}</Badge><Button appearance={item.status==='pending'?'primary':'secondary'} onClick={()=>choose(item)}>{item.status==='pending'?'Review':'View outcome'}</Button></article>)}</div>
    </section>
    {!compact&&<aside className={styles.reviewGuide}><div className={styles.reviewHeading}><div><span>Phase guide</span><h3>{phase}</h3></div><ShieldCheckmark20Regular/></div><div className={styles.criteriaList}>{(phase==='Screening'?['Problem is material','No active duplicate','Strategic theme identified','Owner and outcome named']:phase==='Business case'?['Benefits quantified','Cost and payback tested','Sponsor confirmed','Risks and dependencies visible']:['Hypothesis measured','Thresholds evaluated','Learning documented','Scale conditions explicit']).map((criterion,index)=><div key={criterion}><CheckmarkCircle20Filled className={index<3?styles.good:styles.warn}/><span>{criterion}</span></div>)}</div><div className={styles.reviewInsight}><PersonFeedback20Regular/><span><b>Evaluate more</b><small>{phase==='Screening'?'Supplier Carbon Twin needs source and cost evidence.':phase==='Business case'?'Demand Forecasting needs a sensitivity range.':'Frontline Copilot Coach missed quality by 2 points.'}</small></span></div></aside>}
  </div>;

  const DetailView=():React.ReactElement=><div className={styles.reviewDetail} data-layout="review-decision-detail">
    <div className={styles.detailToolbar}><Button appearance="subtle" icon={<ArrowLeft20Regular/>} onClick={returnToQueue}>Back to submissions</Button><Badge appearance="tint" color={selected.status==='approved'?'success':selected.status==='sentBack'?'danger':'warning'}>{statusLabel(selected.status)}</Badge></div>
    <section className={styles.submissionHero}><div className={styles.person}><img className={styles.avatarLarge} src={avatar(selected.owner)} alt={selected.owner}/><span><small>{selected.phase} · {selected.id}</small><h2>{selected.title}</h2><p>{selected.summary}</p><b>{selected.owner}</b></span></div><div className={styles.reviewScore}><strong>{selected.score}</strong><span>decision score</span></div></section>
    <div className={styles.evidenceGrid}><div className={styles.panel}><h3>Gate evidence</h3><div className={styles.evidenceMetric}><span>Evidence complete</span><b>{selected.evidence}%</b></div><ProgressBar value={selected.evidence/100}/><div className={styles.evidenceMetric}><span>Strategic fit</span><b>{selected.strategicFit}%</b></div><ProgressBar value={selected.strategicFit/100}/><div className={styles.evidenceMetric}><span>Expected value</span><b>{selected.value}</b></div></div><div className={styles.panel}><h3>What is strong</h3><ul className={styles.evidenceList}>{selected.strengths.map(item=><li key={item}><CheckmarkCircle20Filled className={styles.good}/>{item}</li>)}</ul></div><div className={styles.panel}><h3>Needs evaluation</h3>{selected.gaps.length?<ul className={styles.evidenceList}>{selected.gaps.map(item=><li key={item}><PersonFeedback20Regular className={styles.warn}/>{item}</li>)}</ul>:<p className={styles.receipt}><CheckmarkCircle20Filled/>No blocking evidence gaps.</p>}</div></div>
    {selected.status==='pending'?(allowDecision?<section className={styles.decisionPanel}><div><span>Human decision</span><h3>Move this submission forward?</h3><p>Approve advances to <b>{selected.nextPhase}</b>. Send back requests evidence. Decline closes the submission. Named gaps must be addressed in your rationale.</p></div><Field label="Decision rationale" required hint="Write at least 10 characters; include conditions for any evidence gaps."><Textarea value={rationale} onChange={(_,data)=>setRationale(data.value)}/></Field><div className={styles.decisionActions}><Button appearance="primary" icon={<CheckmarkCircle20Filled/>} onClick={()=>begin('approve')}>Approve and advance</Button><Button icon={<PersonFeedback20Regular/>} onClick={()=>begin('sendBack')}>Send back for evaluation</Button><Button icon={<DismissCircle20Regular/>} onClick={()=>begin('decline')}>Decline submission</Button></div></section>:<p className={styles.question}>Inspection only. Invoke ReviewIdeaGate with {selected.id} to make a human decision.</p>):<section className={styles.outcomePanel}><div>{selected.status==='approved'?<CheckmarkCircle20Filled/>:<DismissCircle20Regular/>}<span><b>{statusLabel(selected.status)}</b><small>{selected.storedRationale}</small></span></div></section>}
  </div>;

  const ConfirmView=():React.ReactElement=><div className={styles.reviewConfirm} data-layout="review-decision-confirm"><span>Confirm human decision</span><h2>{decision==='approve'?'Approve and advance':decision==='decline'?'Decline submission':'Send back for further evaluation'}</h2><p><b>{selected.id} · {selected.title}</b> · {selected.owner}</p><div className={styles.confirmConsequence}><TargetArrow20Regular/><span>{decision==='approve'?`Mock advance from ${selected.phase} to ${selected.nextPhase}.`:decision==='decline'?'Mock closure with recorded rationale.':`Mock evidence request; remains in ${selected.phase}.`} No notification or tenant write.</span></div><p>Evidence gaps: {selected.gaps.join('; ')||'None recorded'}</p><Field label="Recorded rationale" validationMessage={rationale.trim().length<10?'At least 10 characters required.':undefined}><Textarea value={rationale} onChange={(_,data)=>setRationale(data.value)}/></Field><div className={styles.actions}><Button onClick={()=>setStage('detail')}>Back</Button><Button appearance="primary" disabled={rationale.trim().length<10} onClick={confirm}>{decision==='approve'?'Confirm approval':decision==='decline'?'Confirm decline':'Confirm send back'}</Button></div></div>;

  const ReceiptView=():React.ReactElement=><div className={styles.reviewReceipt} data-layout="review-decision-receipt">{decision==='approve'?<CheckmarkCircle20Filled/>:<DismissCircle20Regular/>}<span>Decision recorded for this demo session</span><h2>{selected.title}</h2><Badge appearance="tint" color={decision==='approve'?'success':'danger'}>{decision==='approve'?'Approved':decision==='decline'?'Declined':'Sent back'}</Badge><p>{rationale}</p><div className={styles.receiptFacts}><div><span>Submission</span><b>{selected.id}</b></div><div><span>Decision maker</span><b>Diego Siciliani</b></div><div><span>Next step</span><b>{decision==='approve'?selected.nextPhase:decision==='decline'?'Submission closed':`Owner updates ${selected.phase} evidence`}</b></div></div><div className={styles.actions}><Button appearance="primary" onClick={returnToQueue}>Review next submission</Button><Button onClick={()=>setStage('detail')}>View decision</Button></div></div>;

  return stage==='queue'?QueueView():stage==='detail'?DetailView():stage==='confirm'?ConfirmView():ReceiptView();
}
