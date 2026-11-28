import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import {catalog,json,root} from './host-model.mjs';
import {cases,collisions,neighbors,noCallTurns} from './routing.mjs';

const check=process.argv.includes('--check'),load=f=>readFileSync(path.resolve(root,f)),hash=b=>createHash('sha256').update(b).digest('hex');
function publish(file,content){
  if(check)assert(load(file).equals(Buffer.from(content)),`Stale release artifact: ${file}`);
  else{const dst=path.join(root,file);mkdirSync(path.dirname(dst),{recursive:true});writeFileSync(dst,content);}
}
const report=json('review/evidence/candidate.json'),matrix=json('review/evidence/visual-matrix.json'),compiled=json('review/evidence/compiled-host.json'),audit=json('release/host-package-audit.json');
const sp=report.packages[0],ver=json('config/package-solution.json').solution.version;
assert.equal(compiled.sha256,sp.sha256);assert.equal(compiled.uniqueComponents,64);assert.deepEqual(compiled.errors,[]);assert.deepEqual(matrix.errors,[]);
for(const p of report.packages){const b=load(p.file);assert.equal(b.length,p.bytes);assert.equal(hash(b),p.sha256,p.file);}
for(const image of report.screenshots)assert.equal(hash(load('review/evidence/'+image.image)),image.sha256,image.image);
const stamp=matrix.clock,starters=json('config/conversation-starters.json'),ids=starters.map(s=>s.entry);
assert.deepEqual(ids,[3,9,7,4,15,17,12,22,25,27,8,29]);assert.equal(new Set(starters.map(s=>s.text)).size,12);
assert.equal(new Set(catalog.flatMap(c=>[c.examplePrompt,cases.find(t=>t.id===c.id).alternate]).map(x=>x.toLowerCase())).size,60);
const num=id=>String(id).padStart(2,'0'),tool=id=>catalog.find(c=>c.id===id).tool;
const inlineCapture=id=>`task-${num(id)}-inline-760.png`;
const escape=s=>s.replace(/\|/g,'\\|');
const table=(heads,rows)=>[heads,heads.map(()=>'---'),...rows].map(r=>`| ${r.map(x=>escape(String(x))).join(' | ')} |`).join('\n');
const matrixDoc=`# Employee Hub demo prompts and intent mapping

## Inline component and prompt index

Pick a component, copy its example prompt into a fresh conversation, and compare the result with the linked inline screenshot. The last column names the **one** tool expected for that prompt. Entries #01-28 perform focused tasks; #29 explores the catalog without running a task, and #30 opens a workspace.

${table(['Inline component (screenshot)','Example prompt to copy','Expected tool'],catalog.map(c=>[
  `#${num(c.id)} [${c.title}](review/evidence/screens/${inlineCapture(c.id)})`,c.examplePrompt,`\`${c.tool}\``
]))}

## Scoped routing checks

Use the index prompt and the scoped paraphrase below in separate conversations. The properties shown apply to the **paraphrase**; do not invent IDs, dates, roles or confirmations for the shorter prompt. Expand keeps the current selection or draft and opens the destination shown. #30 opens the requested landing instead.

The [compiled-host checks](review/evidence/compiled-host.json) dispatched the packaged entries by ID. They did **not** ask a model to route language. For the signed-in test record the original prompt, selected tool and invocation count, extracted properties, actual inline view, Expand destination, and a fresh-prompt reset. Use fixture IDs only. For each collision run one fresh prompt from each side; a dual invocation fails even if the second view looks right.

${table(['# / expected tool','Scoped paraphrase','Scoped arguments','Inline result / Expand destination','Primary exclusion'],catalog.map(c=>{
  const t=cases.find(t=>t.id===c.id),r=matrix.routedExamples.find(x=>x.entry===c.id),route=c.id===30?`${t.inputs.landing}/home`:c.route;
  assert.deepEqual(r.inputs,t.inputs);assert.equal(r.route,route);assert.equal(r.nearest,t.nearest);
  return [`${num(c.id)} \`${c.tool}\``,t.alternate,'`'+JSON.stringify(t.inputs)+'`',`${c.description}<br>\`${route}\``,`${c.negative} See #${num(t.nearest)}.`];
}))}

## Bidirectional collisions

Each side's packaged tool description explicitly excludes the named counterpart. For example, an EMEA scorecard is #08, a country contribution map is #03, and a change between projected quarter-end cuts is #07. Asking *why* does not turn a booked figure into a forecast.

${table(['Owner','Separately owned neighboring intents'],catalog.map(c=>[`${num(c.id)} ${c.tool}`,neighbors(c.id).map(n=>`#${num(n.id)} ${n.tool}`).join('; ')]))}

## No component should run

${table(['Turn','Expected response (zero tools)'],noCallTurns)}

## Conversation starters (both agents)

${table(['Order','Starter','Exact utterance','Expected owner'],starters.map((s,i)=>[i+1,s.title,s.text,`#${num(s.entry)} ${tool(s.entry)}`]))}

**Discovery:** #29 groups the 28 operational tools by Company & workplace, Leadership business review, Pay & benefits, Time & learning, Tech support and Manager decisions. Seven entries appear per unfiltered page. Expanding a preview reads metadata; Copy copies the example, not an instruction to execute. The last starter opens the directory. Edit the [catalog](config/hub-catalog.json) to change a title, description or example without changing the UI; when extending scope, update category membership, the [host contract](src/hosts/fields.ts) and collision coverage together. Neither the directory nor a new plug-in tool list owns those tasks. Full simulation remains in scope; live HRIS, payroll, CRM, ticketing and grants are not future features silently enabled by setup.
`;
publish('Employee-Hub-Demo-Prompts.md',matrixDoc);
const z=await JSZip.loadAsync(load(sp.file)),inner=await JSZip.loadAsync(load('teams/employee-hub.zip'));
const files=Object.values(z.files).filter(f=>!f.dir);
const media=await Promise.all(files.filter(f=>/^ClientSideAssets\/.*\.(jpg|jpeg|png|svg|webp|gif)$/i.test(f.name)).map(async f=>({file:f.name,sha256:hash(await f.async('nodebuffer'))})));
assert.equal(media.length,new Set(media.map(f=>f.sha256)).size,'Duplicate packaged media payloads');
const bundles=json('config/config.json').bundles,localFile='assets/release-evidence.json';
const evidence={scope:'Offline synthetic release candidate; no authenticated host, real model, publisher verification or deployment. Asset rights are recorded in src/shared/media/sources.json.',version:ver,solutionId:json('config/package-solution.json').solution.id,agentVersion:JSON.parse(await inner.file('manifest.json').async('string')).version,packages:report.packages,toolCount:catalog.length,webPartCount:audit.webParts,configuredBundles:Object.entries(bundles).map(([name,value])=>({name,exports:value.components.length})),largestRawJavaScript:audit.largestJs,media,duplicateMediaCount:0,starterCount:ids.length,scopedPrompts:cases.length,uniqueBidirectionalPairs:collisions.length,noCallCases:noCallTurns.length,compiledActivations:compiled.completed,unknownRecordCases:compiled.unknownReferences.length,visual:{fixtureClock:stamp,renders:report.renderCount,zoomChecks:report.zoomChecks,images:report.screenshots.length,inlineHeightExceptions:report.inlineHeightExceptions},evidenceHashes:Object.fromEntries(['review/evidence/candidate.json','review/evidence/compiled-host.json','review/evidence/visual-matrix.json','release/host-package-audit.json','Employee-Hub-Demo-Prompts.md'].map(f=>[f,hash(load(f))]))};
publish(localFile,JSON.stringify(evidence,null,2)+'\n');
const fingerprint=`SPFx **${ver}**, ${sp.bytes.toLocaleString('en-US')} bytes; SHA-256 \`${sp.sha256}\`. ${catalog.length} Copilot tools, ${audit.webParts} web parts, five personal Teams apps and one separate Cowork plug-in. [Package fingerprints and evidence](assets/release-evidence.json).`;
const featured=[
  [4,'room-booking.png','Inline room search set to London for six people with step-free access'],
  [10,'required-learning.png','Inline mandatory learning list with due dates, durations and progress for three assignments'],
  [19,'device-passport.png','Inline device passport showing the assigned laptop, update status, last check-in and refresh window'],
  [9,'lead-conversion.png','Inline Germany partner acquisition flow with the opportunity count and cohort size']
].map(([id,asset,alt])=>({component:catalog.find(c=>c.id===id),asset,alt}));
const exampleTable=pair=>table(pair.map(({component:c})=>`#${num(c.id)} ${c.title}`),[
  pair.map(({component:c})=>`${c.examplePrompt}<br>\`${c.tool}\``),
  pair.map(({asset,alt})=>`![${alt}](assets/${asset})`)
]);
function replaceSection(src,name,content){
  const re=new RegExp(`<!-- ${name} -->[\\s\\S]*?<!-- /${name} -->`,'g');
  assert.equal([...src.matchAll(re)].length,1,`Expected one ${name} slot`);
  return src.replace(re,()=>`<!-- ${name} -->\n${content}\n<!-- /${name} -->`);
}
for(const file of ['README.md','todo.md']){
  let doc=replaceSection(load(file).toString('utf8'),'release-fingerprint',fingerprint);
  if(file==='README.md')doc=replaceSection(doc,'inline-examples',[exampleTable(featured.slice(0,2)),exampleTable(featured.slice(2))].join('\n\n'));
  publish(file,doc);
}
const base='https://github.com/pnp/spfx-copilot-components',sample='samples/ms-employee-hub',gallery=[
  ['preview.png','task-29-inline-760.png','Seven employee experiences with copyable prompts in the read-only local explorer'],
  ['business.png','business-1280.png','Local Business operating review with a market map and ranked variance to plan'],
  ['company-phone.png','company-390.png','Microsoft home journal at phone width in the local studio'],
  ...featured.map(({component,asset,alt})=>[asset,inlineCapture(component.id),alt]),
  ['leave-decision.png','leave-decision-detail.png','Synthetic assigned leave request with the requester portrait and the decision review']
];
const thumbnails=gallery.map(([name,source,alt],i)=>{
  const b=load('review/evidence/screens/'+source);assert.equal(b.readUInt32BE(0),0x89504e47);assert(b.readUInt32BE(16)>=320&&b.readUInt32BE(20)>=160&&alt.length>24);publish('assets/'+name,b);
  return {name,type:'image',order:100+i,url:`${base}/raw/main/${sample}/assets/${name}`,alt};
});
const sourceUrl=`${base}/tree/main/${sample}`;
const listing=[{name:'pnp-sp-dev-spfx-copilot-apps-ms-employee-hub',source:'pnp',title:'Microsoft Employee Hub',shortDescription:'Four employee workspaces and 30 intent-specific Copilot components over synthetic workplace, HR, IT and business records.',url:sourceUrl,downloadUrl:`https://pnp.github.io/download-partial/?url=${sourceUrl}`,longDescription:['Browse published stories, plan leave, track technology help and compare actual bookings with forecast movements. Focused tasks retain context on expansion.','Try an inline component: '+featured.map(({component:c})=>`${c.title}: "${c.examplePrompt}"`).join(' '),'The sample developer is Contoso. Five Teams personal apps and a separate Cowork connector accompany the SPFx solution. These local fixture captures are not authenticated host evidence.'],creationDateTime:'2026-11-28',updateDateTime:'2026-11-28',products:['SharePoint','Copilot','Teams'],metadata:[{key:'SAMPLE-TYPE',value:'SPFx-CopilotComponent'},{key:'CLIENT-SIDE-DEV',value:'React'},{key:'SPFX-VERSION',value:'1.24.2'}],thumbnails,authors:[{gitHubAccount:'VesaJuvonen',pictureUrl:'https://github.com/VesaJuvonen.png',name:'Vesa Juvonen'}],references:[{name:'Inline component and prompt index',description:'All 30 components, with a copyable example prompt, expected tool and inline screenshot for each.',url:`${base}/blob/main/${sample}/Employee-Hub-Demo-Prompts.md#inline-component-and-prompt-index`},{name:'SharePoint Framework overview',description:'The SPFx host model used by this sample.',url:'https://learn.microsoft.com/sharepoint/dev/spfx/sharepoint-framework-overview'}]}];
publish('assets/sample.json',JSON.stringify(listing,null,2)+'\n');
assert.deepEqual(readdirSync(path.join(root,'assets')).filter(n=>n.endsWith('.png')).sort(),thumbnails.map(t=>t.name).sort());
const docs=['README.md','todo.md','Employee-Hub-Demo-Prompts.md','Employee-Hub-3-Minute-Demo.md','Employee-Hub-10-Minute-Demo.md','Employee-Hub-5-Minute-Tech-Demo.md','docs/designer-rehearsal.md','docs/pilot-install.md','employee-hub-plugin/README.md','teams/README.md'];
for(const file of docs)for(const m of load(file).toString().matchAll(/\]\(([^) \n]+)\)/g)){
  if(/^(?:https?:|file:|#)/.test(m[1]))continue;
  const dst=path.resolve(root,path.dirname(file),decodeURIComponent(m[1].split('#')[0]));
  assert(existsSync(dst)&&!!statSync(dst),`${file}: broken local link ${m[1]}`);
}
console.log(`${check?'Verified':'Generated'} ${catalog.length} component/prompt mappings, ${cases.length} scoped prompts, ${collisions.length} bidirectional pairs and ${noCallTurns.length} no-call cases; ${featured.length} featured inline examples, ${thumbnails.length} gallery thumbnails and ${report.packages.length} byte-checked packages.`);
