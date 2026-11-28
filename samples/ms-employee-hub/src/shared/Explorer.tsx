import * as React from 'react';
import { catalog, type Capability } from './catalog';
import type { SurfaceProps } from './types';
import { useHubVisibleScope } from '../hosts/VisibleScope';
import styles from './Hub.module.scss';

const groups:ReadonlyArray<{name:string;ids:number[]}>= [
  {name:'Company & workplace',ids:[1,2,4,5]}, {name:'Leadership business review',ids:[3,6,7,8,9]},
  {name:'Pay & benefits',ids:[11,12,13,18]}, {name:'Time & learning',ids:[10,14,15,16]},
  {name:'Tech support',ids:[19,20,21,22,23,24,28]}, {name:'Manager decisions',ids:[17,25,26,27]}
];
const pageSize = 7;
export default function Explorer(p:SurfaceProps):React.ReactElement {
  const [query,setQuery]=React.useState(String(p.inputs.query??'')),[category,setCategory]=React.useState(String(p.inputs.category??'All'));
  const [page,setPage]=React.useState(0),[selection,setSelection]=React.useState<number>();
  const [notice,setNotice]=React.useState('');
  const prefix=React.useId(), term=query.trim().toLowerCase();
  const filtered=catalog.filter(t=>t.id<=28 && (category==='All'||groups.find(g=>g.name.toLowerCase()===category.toLowerCase())?.ids.includes(t.id)) && `${t.title} ${t.description} ${t.examplePrompt}`.toLowerCase().includes(term));
  const start=page*pageSize,list=filtered.slice(start,start+pageSize),pick=list.find(t=>t.id===selection);
  const changePage=(next:number):void=>{setPage(next);setSelection(undefined);setNotice('');};
  const copyPrompt=async(clipboard:Clipboard|undefined,t:Capability):Promise<void>=>{
    const manual=`Select the example for ${t.title} and copy it manually.`;
    if(!clipboard){setNotice(`Clipboard unavailable. ${manual}`);return;}
    try { await clipboard.writeText(t.examplePrompt); }
    catch { setNotice(`Couldn't copy the prompt. ${manual}`);return; }
    setNotice(`Copied the prompt for ${t.title}.`);
  };
  useHubVisibleScope({entry:29,stage:pick?'selection':'information',filters:{category},page:{first:list.length?start+1:0,last:start+list.length,total:filtered.length,selected:pick?.id}});
  return <section data-layout={`explore-${p.mode}`} className={styles.explorer}>
    <p className={styles.kicker}>COPILOT / 28 COMPONENTS</p><h2>What can I ask?</h2>
    <p className={styles.guideLead}>Copy an example and ask it in Copilot. Browsing here won’t run a task.</p>
    <div className={styles.guideFilters}><label>Search components<input type="search" value={query} placeholder="Name or prompt" onChange={e=>{setQuery(e.target.value);changePage(0);}}/></label>
      <label>Category<select value={category} onChange={e=>{setCategory(e.target.value);changePage(0);}}>{Array.from(new Set(['All',...groups.map(g=>g.name),category])).map(s=><option key={s}>{s}</option>)}</select></label></div>
    <ol aria-label="Components and example prompts">{list.map(t=>{
      const expanded=pick?.id===t.id,detailId=`${prefix}-${t.id}`;
      return <li key={t.id}>
        <button type="button" className={styles.guideName} aria-expanded={expanded} aria-controls={detailId} onClick={()=>setSelection(expanded?undefined:t.id)}>{t.title} <span aria-hidden="true">{expanded?'−':'+'}</span></button>
        <q>{t.examplePrompt}</q>
        <button type="button" className={styles.copyPrompt} aria-label={`Copy prompt for ${t.title}`} onClick={e=>copyPrompt(e.currentTarget.ownerDocument.defaultView?.navigator.clipboard,t)}>Copy</button>
        <div id={detailId} hidden={!expanded} className={styles.guideDetail}><p>{t.description}</p><small>Optional inputs: {t.fields.join(', ')}. Preview only.</small></div>
      </li>;
    })}</ol>
    {list.length>0?<div className={styles.actions}><button type="button" disabled={!page} onClick={()=>changePage(page-1)}>Previous</button><span aria-live="polite">{start+1}–{start+list.length} of {filtered.length}</span><button type="button" disabled={start+list.length>=filtered.length} onClick={()=>changePage(page+1)}>Next</button></div>:<p role="status">No results. Try a broader term or another category.</p>}
    <p role="status" className={styles.copyStatus}>{notice}</p>
  </section>;
}
