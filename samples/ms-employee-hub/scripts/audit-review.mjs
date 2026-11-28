import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {collisions} from './routing.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFile(path.join(root,p)),json=async p=>JSON.parse(await read(p));
const catalog=await json('config/hub-catalog.json'), cases=await json('review/routing-cases.json'), starters=await json('config/conversation-starters.json');
assert.equal(cases.length,30);assert.equal(new Set(cases.map(c=>c.id)).size,30);
for(const {id,alternate,nearest,inputs} of cases){
  const c=catalog.find(c=>c.id===id);assert(c?.examplePrompt&&alternate&&c.examplePrompt!==alternate&&nearest!==id&&catalog.some(c=>c.id===nearest));
  assert(Object.keys(inputs).every(key=>c.fields.includes(key)),`Unadvertised input for ${c.tool}`);
}
assert.equal(starters.length,12);assert.equal(new Set(starters.map(s=>s.entry)).size,12);assert.equal(starters.at(-1).entry,29);
const matrix=await json('review/evidence/visual-matrix.json');assert.deepEqual(matrix.errors,[]);
const widths=[320,390,760,1280,1920],themes=['light','dark'],workspaces=['company','hr','tech','business'];
for(const c of catalog)for(const mode of ['inline','full'])for(const width of widths)for(const theme of themes){
  assert(matrix.results.some(r=>r.entry===String(c.id)&&r.mode===mode&&r.width===width&&r.theme===theme&&!r.landing),`Missing render: ${c.tool}, ${mode}, ${width}, ${theme}`);
}
for(const landing of workspaces)for(const width of widths)for(const theme of themes){
  assert(matrix.results.some(r=>r.entry==='30'&&r.landing===landing&&r.route===`${landing}/home`&&r.fixed==='1'&&r.mode==='full'&&r.width===width&&r.theme===theme),`Missing fixed workspace: ${landing}, ${width}, ${theme}`);
}
assert.equal(matrix.routedExamples?.length,30,'Missing parameterized browser rehearsals');
assert.equal(matrix.zoomChecks?.length,64,'Missing 200% zoom checks');
const additional=new Map([[2,[['Open story','news-story-open.png']]],[4,[['Search results','room-search-results.png'],['Review','room-review.png'],['Receipt','room-receipt.png']]],[10,[['Lesson in progress','learning-in-progress.png']]],[11,[['Open checklist','benefits-checklist.png']]],[12,[['Revealed synthetic pay split','pay-split-revealed.png']]],[15,[['Review time off','time-off-review.png'],['Submitted requests','time-off-submitted.png']]],[17,[['Request detail','leave-decision-detail.png'],['Updated decision','leave-decision-updated.png']]],[19,[['Headset passport','device-headset.png'],['Dark phone view','device-passport-phone.png']]]]);
const imageFiles=[...new Set([...matrix.results.map(r=>r.image).filter(Boolean),...[...additional.values()].flat().map(([,file])=>`screens/${file}`),'screens/keynote-receipt.png','workspace-contact.png','workspace-phone.png','proof-contact.png','identity-sheet.png'])].sort();
const items=await Promise.all(imageFiles.map(async image=>{const b=await read(`review/evidence/${image}`);assert.equal(b.readUInt32BE(0),0x89504e47);
  return {image,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex')};}));
const mediaSources=await json('src/shared/media/sources.json');
const media=[
  ['src/shared/media/sources.json',mediaSources.scope],
  ['src/shared/business/worldLand.json','Natural Earth public-domain map geometry; see source metadata'],
  ['employee-hub-plugin/artwork.svg','Employee Hub identity family; Fluent UI System Icons, MIT']
];
const assets=await Promise.all(media.map(async([source,provenance])=>({source,provenance,sha256:createHash('sha256').update(await read(source)).digest('hex')})));
const files=['sharepoint/solution/ms-employee-hub.sppkg','teams/employee-hub.zip',...['hub','company','hr','tech','business'].map(k=>`release/teams/employee-hub-${k}.zip`),'release/cowork/employee-hub-local-review.zip'];
const packages=await Promise.all(files.map(async file=>{const content=await read(file);return {file,bytes:content.length,sha256:createHash('sha256').update(content).digest('hex')};}));
const production=await JSZip.loadAsync(await read(files[0]));
const packedArt=new Map(await Promise.all(Object.values(production.files).filter(f=>!f.dir&&/^ClientSideAssets\/.*\.(jpg|png)$/i.test(f.name)).map(async f=>[createHash('sha256').update(await f.async('nodebuffer')).digest('hex'),f.name])));
for(const a of mediaSources.assets){
  const source=`src/shared/media/${a.file}`,digest=createHash('sha256').update(await read(source)).digest('hex');
  assert.equal(digest,a.sha256,`Stale campaign derivative: ${a.file}`);assert(packedArt.has(digest),`Artwork missing from the SPPKG: ${a.file}`);
  assets.push({source,provenance:`${a.collection}/${a.original}${a.entry?'#'+a.entry:''} (sample asset)`,sha256:digest,packageMember:packedArt.get(digest)});
}
const hostAudit=await json('release/host-package-audit.json');
assert.equal(hostAudit.tools,30);assert.equal(hostAudit.webParts,34);assert.equal(new Set(hostAudit.manifests.map(m=>m.id)).size,64);
assert.equal(packages[0].sha256,hostAudit.sppkg.sha256,'Candidate differs from the full double-ZIP host audit');
assert.equal(packages[1].sha256,hostAudit.embedded.sha256,'Loose agent is not the embedded agent');
for(const p of packages.slice(2,7))assert.equal(p.sha256,hostAudit.teams.find(t=>t.file===path.basename(p.file))?.sha256,`Stale Teams bytes for ${p.file}`);
const cowork=await JSZip.loadAsync(await read(files.at(-1)));assert.deepEqual(Object.keys(cowork.files).sort(),['ai-plugin.json','color.png','declarativeAgent.json','manifest.json','outline.png']);
for(const image of ['color','outline']){const b=await cowork.file(`${image}.png`).async('nodebuffer');assert.equal(b.readUInt32BE(16),image==='color'?192:32);}
const base=JSON.parse(await cowork.file('manifest.json').async('string')),action=JSON.parse(await cowork.file('ai-plugin.json').async('string'));
assert.equal(action.runtimes[0].spec.url,base.agentConnectors[0].toolSource.remoteMcpServer.mcpServerUrl);
assert.equal(new URL(action.runtimes[0].spec.url).hostname,'spfx-review.invalid');
const exceptions=matrix.results.filter(r=>r.mode==='inline'&&(r.width===760&&r.height>650||r.width===390&&r.height>800)).map(({route,width,height,theme})=>({route,width,height,theme}));
const report={scope:'Local synthetic review evidence. Source and package evidence are not authenticated host or tenant acceptance.',generated:new Date().toISOString(),catalog:catalog.length,webParts:hostAudit.webParts,largestRawJs:hostAudit.largestJs,offlineStudioSha256:createHash('sha256').update(await read('.review-build/index.html')).digest('hex'),negativeRoutingPairs:collisions.length,parameterizedExamples:matrix.routedExamples.length,zoomChecks:matrix.zoomChecks.length,renderCount:matrix.results.length,journeys:matrix.journeys,inlineHeightExceptions:exceptions,assets,packages,screenshots:items};
await mkdir(path.join(root,'review','evidence'),{recursive:true});await writeFile(path.join(root,'review','evidence','candidate.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Audited ${packages.length} local packages, ${items.length} images and ${report.renderCount} renders; ${exceptions.length} inline height exceptions.`);
assert.deepEqual(exceptions,[],'An initial inline view exceeds the review height budget');

const escape=value=>String(value).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
assert(Number.isFinite(Date.parse(matrix.clock)),'Gallery links need the clock used for the captures');
const groups={company:'Microsoft home',hr:'HRweb',tech:'TechWeb',business:'Business',hub:'Hub tools'};
const sections=Object.entries(groups).map(([key,title])=>{
  const cards=catalog.filter(c=>(c.id>=29?'hub':c.workspace)===key).map(c=>{
    const r=matrix.results.find(r=>r.entry===String(c.id)&&r.mode==='inline'&&r.width===760&&r.theme==='light'&&!r.landing);
    assert(r?.image&&items.some(i=>i.image===r.image),`Missing inline screenshot for #${c.id}`);
    const query=new URLSearchParams({entry:r.entry,mode:r.mode,width:String(r.width),theme:r.theme,clock:matrix.clock});
    for(const field of c.fields)if(r[field]!==undefined)query.set(field,r[field]);
    const name=escape(c.title),image=escape(r.image);
    return `<article><h3><small>${String(c.id).padStart(2,'0')}</small> ${name}</h3>
<a href="${image}" aria-label="View screenshot: ${name}" class="preview" style="aspect-ratio:${r.width}/${r.height}"><img width="${r.width}" src="${image}" alt="Screenshot of ${name} in inline mode"></a>
<div style="margin-top:12px"><strong>Example prompt:</strong> ${escape(c.examplePrompt)}</div>
<p><a href="../../.review-build/index.html?${escape(query)}" aria-label="Try inline: ${name}">Try inline &rarr;</a> <a href="${image}">Full-size PNG</a> ${(additional.get(c.id)??[]).map(([label,file])=>`<a href="screens/${file}">${escape(label)}</a>`).join(' ')}</p></article>`;
  });
  return `<section id="${key}"><h2>${title}</h2><div class="grid">${cards.join('\n')}</div></section>`;
});
await writeFile(path.join(root,'review','evidence','inline-gallery.html'),`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inline component gallery | Employee Hub</title>
<style>*{box-sizing:border-box}body{margin:0 auto;max-width:1480px;padding:clamp(16px,3vw,48px);background:#f5f6fa;color:#17233a;font:16px/1.5 "Segoe UI",sans-serif}h1{font-size:clamp(32px,5vw,56px);line-height:1.1;margin:.3em 0}h2{border-top:1px solid #c8cfda;padding-top:1em}h3{margin:0 0 .7em;font-size:1.1rem}a{color:#164ca4}a:focus-visible{outline:3px solid #004ca3;outline-offset:3px}nav,p{display:flex;flex-wrap:wrap;gap:8px 20px}small{color:#475569}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:16px}article{display:flex;flex-direction:column;align-items:stretch;background:white;border:1px solid #d5dbe5;border-radius:12px;padding:16px}article p{margin:auto 0 0;padding-top:12px}.preview{display:block;overflow:hidden;border:1px solid #e1e4eb}.preview img{display:block;width:100%;height:auto}</style>
<main><header><small>EMPLOYEE HUB / LOCAL STUDIO</small><h1>Inline component gallery</h1><p>${catalog.length} inline components with their example prompts. Try the local view or open its screenshot. The studio shows the component directly; it does not route prompts through a live model.</p></header>
<nav aria-label="Component groups">${Object.entries(groups).map(([k,t])=>`<a href="#${k}">${t}</a>`).join(' ')}</nav>${sections.join('\n')}</main></html>\n`);
