import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {FluentProvider,webDarkTheme,webLightTheme} from '@fluentui/react-components';
import HubApp from '../src/shared/HubApp';
import {catalog,isWorkspace,workspaceNames,workspaces} from '../src/shared/catalog';
import {newSession,employeeFixture,rehearsalLead} from '../src/shared/mockData/session';
import type {HubInputs} from '../src/shared/types';
import {ScopeReporter,type HubVisibleScope} from '../src/hosts/VisibleScope';
import {snapshot,conversation} from '../src/hosts/bridge';

const query=new URLSearchParams(location.search);
const entry=Number(query.get('entry')||30), land=query.get('landing')||'company';
const initial=entry===30&&isWorkspace(land)?`home:${land}`:String(entry);
const clock=query.get('clock'), fixtureNow=clock?new Date(clock):new Date();
if(!Number.isFinite(fixtureNow.valueOf()))throw new Error('Review clock must be an ISO timestamp.');
const canvasWidths=['fluid','320','390','760','1280'];
const setup=(k:string):HubInputs=>{const out:Record<string,string>={};const cap=catalog.find(c=>c.id===Number(k));for(const key of cap?.fields||[])if(query.has(key))out[key]=query.get(key)!;return out;};
function Review():React.ReactElement {
  const [selected,setSelected]=React.useState(initial),[mode,setMode]=React.useState<'inline'|'full'>(query.get('mode')==='inline'?'inline':'full'),[night,setNight]=React.useState(query.get('theme')==='dark'),[limited,setLimited]=React.useState(query.get('actor')==='employee'),[reset,setReset]=React.useState(0),[summary,setSummary]=React.useState('');
  const [width,setWidth]=React.useState(()=>canvasWidths.find(w=>w===query.get('width'))||'fluid');
  const s=React.useMemo(()=>({...newSession(limited?employeeFixture:rehearsalLead,clock?fixtureNow:new Date()),clock:clock?undefined:()=>new Date()}),[reset,limited]);
  const home=selected.startsWith('home:'), w=home?selected.slice(5):undefined;
  const [inputs,setInputs]=React.useState<HubInputs>(()=>setup(initial));
  const scope=React.useRef<HubVisibleScope>();const [stage,setStage]=React.useState('');
  const report=React.useCallback((next:HubVisibleScope)=>{snapshot(next,mode);scope.current=next;setStage(next.stage);},[mode]);
  const choose=(v:string):void=>{setSelected(v);setInputs({});setMode(v.startsWith('home:')?'full':'inline');setSummary('');};
  return <FluentProvider theme={night?webDarkTheme:webLightTheme}><div className="review-frame" data-hub-theme={night?'dark':'light'}>
    {query.get('bare')!=='1'&&<details className="review-controls"><summary>Employee Hub studio <small>LOCAL REVIEW · SYNTHETIC DATA</small></summary><div>
      <label>Destination<select value={selected} onChange={e=>choose(e.target.value)}><optgroup label="Full-page workspaces">{workspaces.map(k=><option key={k} value={`home:${k}`}>{workspaceNames[k]}</option>)}</optgroup><optgroup label="Copilot entries">{catalog.map(c=><option key={c.id} value={String(c.id)}>{String(c.id).padStart(2,'0')} · {c.title}</option>)}</optgroup></select></label>
      <label>Surface<select value={mode} onChange={e=>setMode(e.target.value==='inline'?'inline':'full')}><option value="inline">Inline</option><option value="full">Full screen</option></select></label>
      <label>Canvas<select value={width} onChange={e=>setWidth(e.target.value)}>{canvasWidths.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Fixture<select value={limited?'employee':'lead'} onChange={e=>setLimited(e.target.value==='employee')}><option value="lead">Review lead</option><option value="employee">Employee only</option></select></label>
      <button onClick={()=>setNight(!night)}>{night?'Light':'Dark'} theme</button><button onClick={()=>{setReset(n=>n+1);setSummary('');}}>Reset session</button></div></details>}
    <div data-review-stage={stage} style={{maxWidth:width==='fluid'?undefined:Number(width),margin:'0 auto'}}><ScopeReporter.Provider value={report}><HubApp key={`${reset}:${limited}`} entry={home?30:Number(selected)} landing={isWorkspace(w)?w:undefined} mode={mode} inputs={inputs} fixed={query.get('fixed')==='1'} rehearsalSession={s} onExpand={mode==='inline'?()=>setMode('full'):undefined} onDiscuss={text=>{if(scope.current){const s=snapshot(scope.current,mode);setSummary(`${s.content[0].text} ${conversation(s,text)}`);}}}/></ScopeReporter.Provider></div>
    {summary&&<aside role="status" className="review-controls"><b>Local bridge transcript · not sent</b><p>{summary}</p></aside>}
  </div></FluentProvider>;
}
createRoot(document.getElementById('root')!).render(<Review/>);
