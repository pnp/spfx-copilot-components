import * as React from 'react';
import { catalog, isWorkspace, workspaceNames, workspaces } from './catalog';
import { newSession } from './mockData/session';
import type { HubInputs, HubSession, Workspace } from './types';
import { ScopeReporter, useHubVisibleScope, type HubVisibleScope } from '../hosts/VisibleScope';
import Explorer from './Explorer';
import styles from './Hub.module.scss';

const Company=React.lazy(()=>import(/* webpackChunkName: "hub-company" */ './company/Company'));
const HR=React.lazy(()=>import(/* webpackChunkName: "hub-hr" */ './hr/HR'));
const Tech=React.lazy(()=>import(/* webpackChunkName: "hub-tech" */ './tech/Tech'));
const Business=React.lazy(()=>import(/* webpackChunkName: "hub-business" */ './business/Business'));
const bodies={company:Company,hr:HR,tech:Tech,business:Business};
export interface HubAppProps {
  entry:number; mode:'inline'|'full'; inputs?:HubInputs; landing?:Workspace; fixed?:boolean;
  displayName?:string; onExpand?:()=>void; onDiscuss?:(summary:string)=>void;
  rehearsalSession?:HubSession;
}
interface Route {id:number;workspace:Workspace;inputs:HubInputs;selection?:string}
const defaultInputs:HubInputs={};
function Report({entry,stage,route}:{entry:number;stage:HubVisibleScope['stage'];route?:string}):React.ReactNode {
  useHubVisibleScope(React.useMemo(()=>({entry,stage,route}),[entry,stage,route]));
  return null;
}
function routeFor(id:number,inputs:HubInputs,home:Workspace):Route {
  const item=catalog.find(c=>c.id===id);
  return {id,workspace:item&&isWorkspace(item.workspace)&&id!==30?item.workspace:home,inputs};
}
function canOpen(id:number,workspace:Workspace,s:HubSession):boolean {
  const access=catalog.find(c=>c.id===id)?.access;
  if((workspace==='business'||access==='commercial'||access==='planner')&&!s.actor.commercial)return false;
  return access==='planner'?s.actor.planner:access==='reviewer'?s.actor.reviewer:true;
}
function Instance(p:HubAppProps&{session:HubSession}):React.ReactElement {
  const start=p.inputs||defaultInputs;
  const supplied=p.fixed?p.landing:start.landing??p.landing,invalidRoot=p.entry===30&&supplied!==undefined&&!isWorkspace(supplied);
  const first:Workspace=isWorkspace(supplied)?supplied:'company';
  const [stack,setStack]=React.useState<Route[]>(()=>[routeFor(p.entry,start,first)]);
  const [asOf,setAsOf]=React.useState(p.session.now);
  const scoped=React.useMemo(()=>({...p.session,now:asOf}),[p.session,asOf]);
  const [pending,setPending]=React.useState<(()=>void)|undefined>(); const [editRisk,setEditRisk]=React.useState(false);
  const outer=React.useContext(ScopeReporter),visible=React.useRef<HubVisibleScope>();
  const report=React.useCallback((next:HubVisibleScope)=>{visible.current=next;outer?.(next);},[outer]);
  const header=React.useRef<HTMLSpanElement>(null), region=React.useRef<HTMLElement>(null), previous=React.useRef<HTMLElement>();
  const keepDraft=React.useRef<HTMLButtonElement>(null), priorMode=React.useRef(p.mode), pendingOrigin=React.useRef<HTMLElement>();
  React.useLayoutEffect(()=>{
    if(priorMode.current!==p.mode){priorMode.current=p.mode;header.current?.focus();}
  },[p.mode]);
  React.useLayoutEffect(()=>{if(pending)keepDraft.current?.focus();},[pending]);
  const route=stack[stack.length-1], home=route.id===30 || route.id===0;
  React.useEffect(()=>{
    const clock=p.session.clock,doc=region.current?.ownerDocument;
    if(!clock||!doc||(!home&&route.id!==1&&route.id!==2))return;
    let timer:ReturnType<typeof setTimeout>;
    const tick=():void=>{
      const current=clock();
      if(doc.visibilityState!=='hidden')setAsOf(current);
      timer=setTimeout(tick,60000-current.getTime()%60000);
    };
    const visibleAgain=():void=>{if(doc.visibilityState==='visible'){clearTimeout(timer);tick();}};
    tick();doc.addEventListener('visibilitychange',visibleAgain);
    return ()=>{clearTimeout(timer);doc.removeEventListener('visibilitychange',visibleAgain);};
  },[p.session.clock,home,route.id]);
  const workspace=route.workspace, cap=catalog.find(c=>c.id===route.id);
  const activeElement=():HTMLElement|undefined=>{
    const doc=region.current?.ownerDocument,element=doc?.activeElement,ctor=doc?.defaultView?.HTMLElement;
    return ctor&&element instanceof ctor?element:undefined;
  };
  const focusHeading=():void=>{region.current?.ownerDocument.defaultView?.requestAnimationFrame(()=>header.current?.focus());};
  const change=(action:()=>void):void=>{
    if(editRisk&&['draft','review'].includes(visible.current?.stage||'')){
      pendingOrigin.current=activeElement();
      setPending(()=>action);return;
    }
    action();
  };
  const go=(id:number,inputs:HubInputs={},guard=true):void=>{
    const apply=():void=>{
      previous.current=activeElement();
      const dest=id===0||id===30?(isWorkspace(inputs.landing)?inputs.landing:workspace):workspace;
      const next=routeFor(id===0?30:id,inputs,dest);
      if(p.fixed && next.workspace!==first) return;
      const saved=visible.current;
      setStack(path=>{
        const last=path[path.length-1];
        // Restore only the public reporting cut/mark, never a private draft or its reveal state.
        const prior=(last.id===9||last.id===27)&&saved?.entry===last.id?{...last,inputs:{...last.inputs,...saved.filters},selection:saved.evidence?.selected}:last;
        return [...path.slice(0,-1),prior,next];
      });if(p.session.clock)setAsOf(p.session.clock());setEditRisk(false);focusHeading();
    };
    if(guard)change(apply);else apply();
  };
  const back=():void=>change(()=>{setStack(path=>path.slice(0,-1));setEditRisk(false);region.current?.ownerDocument.defaultView?.requestAnimationFrame(()=>{if(previous.current?.isConnected)previous.current.focus();else header.current?.focus();});});
  const denied=(!cap&&!home)||invalidRoot||!canOpen(route.id,workspace,p.session);
  const mode=p.mode, bodyKey=`${stack.length}:${route.id}:${workspace}`;
  const title=home?workspaceNames[workspace]:cap?.title||'Unavailable';
  const visibleWorkspaces=workspaces.filter(w=>canOpen(30,w,p.session));
  const destinations=catalog.filter(c=>c.workspace===workspace&&c.id<29&&canOpen(c.id,workspace,p.session));
  const Body=route.id===29?Explorer:bodies[workspace];
  const chooser=home&&!p.fixed&&p.entry===30&&!denied?<nav aria-label="Workspaces" className={styles.switcher}>{visibleWorkspaces.map(w=><button key={w} aria-current={w===workspace?'page':undefined} onClick={()=>{if(w!==workspace)go(30,{landing:w});}}>{workspaceNames[w]}</button>)}</nav>:null;
  const showHomeLink=mode==='full'&&!denied&&route.id!==29&&(!home||Boolean(route.inputs.section&&route.inputs.section!=='Today'));
  const discuss=!home&&!denied&&cap?.discussion==='visible-summary'&&p.onDiscuss?<button onClick={()=>p.onDiscuss?.(`Explain how to interpret the visible ${title} view. Do not start another task or perform an action.`)}>Discuss this view</button>:null;
  return <main className={styles.root} data-hub-mode={mode} data-workspace={workspace} data-route={home?`${workspace}/home`:cap?.route} ref={region}>
    <header className={styles.top}>
      <div className={styles.brand}>{mode==='full'&&<span className={styles.wordmark} role="img" aria-label="Microsoft"/>}<span ref={header} tabIndex={-1}>{showHomeLink?<button type="button" className={styles.mastLink} onClick={()=>go(30,{landing:workspace})}>{workspaceNames[workspace]}</button>:home&&mode==='inline'?'Employee Hub':title}</span></div>
      {mode==='full'&&chooser}
      <div className={styles.actions}>{stack.length>1&&<button onClick={back}>Back</button>}{discuss}{mode==='inline'&&p.onExpand&&!denied&&<button onClick={p.onExpand} aria-label={`Expand ${title}`}>Expand <span aria-hidden="true">↗</span></button>}</div>
    </header>
    {pending&&<aside className={styles.notice} aria-label="Unsaved edits"><strong>Leave this draft?</strong> Unsubmitted changes may be lost. <button ref={keepDraft} onClick={()=>{setPending(undefined);pendingOrigin.current?.focus();}}>Keep editing</button><button onClick={()=>{pending();setPending(undefined);setEditRisk(false);}}>Discard and continue</button></aside>}
    {denied?<section role="status" className={styles.notice}>{cap&&<Report entry={route.id} stage="denied"/>}<h3>{invalidRoot?'Unknown workspace':'This view is unavailable'}</h3><p>{invalidRoot?'Choose a known workspace in a new request.':'The destination does not exist or is outside this fixture actor’s scope. No records were loaded.'}</p></section>:<>
      {home&&mode==='inline'&&<Report entry={30} route={`${workspace}/home`} stage="selection"/>}
      {mode==='inline'&&chooser}
      {home&&mode==='inline'?<section className={styles.opener}><p className={styles.kicker}>WORKSPACE</p><h3>{workspaceNames[workspace]}</h3><p>{p.onExpand?'Expand to open this workspace.':'Open this workspace in a supported full-page host.'}</p></section>:<>
      {mode==='full'&&route.id!==29&&workspace==='business'&&<nav aria-label={`${workspaceNames[workspace]} destinations`} className={styles.localNav}><label>Operating review <select value={home?'':route.id} onChange={e=>go(Number(e.target.value))}><option value="">Overview</option>{destinations.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><div><button aria-current={home?'page':undefined} onClick={()=>{if(!home)go(30,{landing:workspace});}}>Overview</button>{destinations.map(c=><button key={c.id} aria-current={!home&&route.id===c.id?'page':undefined} onClick={()=>{if(home||route.id!==c.id)go(c.id);}}>{c.title}</button>)}</div></nav>}
      <div key={bodyKey} onChangeCapture={e=>{
        const ElementType=e.currentTarget.ownerDocument.defaultView?.Element;
        if(ElementType&&e.target instanceof ElementType&&e.target.closest('[data-workspace-navigation]'))return;
        if(cap?.operation==='prepare'||cap?.operation==='decide')setEditRisk(true);
      }}>
        <ScopeReporter.Provider value={report}><React.Suspense fallback={<p role="status">Opening {title}…</p>}><Body id={home?0:route.id} mode={mode} inputs={route.inputs} session={scoped} navigate={go} onExpand={mode==='inline'?p.onExpand:undefined} restoredSelection={route.selection} canSwitchWorkspaces={!p.fixed&&p.entry===30}/></React.Suspense></ScopeReporter.Provider>
      </div></>}
    </>}
  </main>;
}
export default function HubApp(p:HubAppProps):React.ReactElement {
  const [base]=React.useState<HubSession>(()=>p.rehearsalSession||{...newSession(),clock:()=>new Date()});
  const session=React.useMemo(()=>p.displayName?.trim()?{...base,actor:{...base.actor,displayName:p.displayName.trim()}}:base,[base,p.displayName]);
  // A mode/theme/width change reuses the body. A genuinely different invocation starts at its own route.
  const invocation=JSON.stringify([p.entry,p.landing,p.fixed,Object.entries(p.inputs||{}).sort(([a],[b])=>a.localeCompare(b))]);
  return <Instance {...p} key={invocation} session={session}/>;
}
