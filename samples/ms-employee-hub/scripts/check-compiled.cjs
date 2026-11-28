const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {createRequire} = require('node:module');
const assert = require('node:assert/strict');
const r = createRequire(path.join(process.cwd(), 'package.json'));
const {chromium} = r('playwright-core');
const JSZip = r('jszip');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const hash = b => createHash('sha256').update(b).digest('hex');
const decode = s => s.replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const unique = (list, key) => assert.equal(new Set(list.map(key)).size, list.length);
const stamp = '2026-11-27T09:00:00Z';
const sessionOutput = path.resolve('review/evidence/compiled-host.json');

(async () => {
  const {toolDescription}=await import('./routing.mjs');
  const {reviewBrowserPath}=await import('./review.mjs');
  const rows = read('config/hub-catalog.json'), cases = read('review/routing-cases.json'), starters = read('config/conversation-starters.json');
  const bytes = fs.readFileSync('sharepoint/solution/ms-employee-hub.sppkg'), zip = await JSZip.loadAsync(bytes);
  const members = Object.values(zip.files).filter(f => !f.dir);
  const manifests = await Promise.all(members.filter(f => /\/(?:CopilotComponent|WebPart)_[\da-f-]+\.xml$/i.test(f.name)).map(async f => {
    const raw = await f.async('string');
    return JSON.parse(decode(raw.match(/ComponentManifest="([^"]+)"/)[1]));
  }));
  const tools = manifests.filter(m => m.componentType === 'CopilotComponent'), webParts=manifests.filter(m => m.componentType === 'WebPart');
  assert.equal(tools.length,30); assert.equal(webParts.length,34); unique(manifests,m=>m.id); unique(tools,m=>m.loaderConfig.exportName); unique(webParts,m=>m.loaderConfig.exportName);
  assert.equal(read('config/copilot-agent.json').agents.length,1);
  assert.deepEqual(read('config/copilot-agent.json').agents[0].components.toSorted(),tools.map(m=>m.id).toSorted());
  unique(rows,c=>c.tool); unique(rows,c=>c.route); unique(rows,c=>c.examplePrompt.toLowerCase()); unique(rows,c=>c.description.toLowerCase()); unique(cases,c=>c.alternate.toLowerCase());
  assert.equal(new Set(rows.flatMap(c=>{const alt=cases.find(x=>x.id===c.id);return [c.examplePrompt.toLowerCase(),alt.alternate.toLowerCase()]})).size,60);
  const agentBytes = await members.find(f=>f.name.endsWith('.zip')).async('nodebuffer'), a = await JSZip.loadAsync(agentBytes);
  const decl = JSON.parse(await a.file('declarativeAgent.json').async('string'));
  const expectedStarters=[3,9,7,4,15,17,12,22,25,27,8,29];
  assert.deepEqual(starters.map(s=>s.entry),expectedStarters); assert.deepEqual(decl.conversation_starters,starters.map(({title,text})=>({title,text})));
  const homes={MicrosoftHomeWorkspaceWebPart:'company',HRwebWorkspaceWebPart:'hr',TechWebWorkspaceWebPart:'tech',BusinessSltWorkspaceWebPart:'business'};
  for(const tool of tools) {
    assert.equal(tool.tools.length,1);
    const t=tool.tools[0], row=rows.find(c=>c.tool===t.name); assert(row, t.name);
    assert.equal(t.description.default,toolDescription(row));
    assert.deepEqual(Object.keys(t.propertiesSchema.properties),row.fields); assert.deepEqual(t.propertiesSchema.required||[],[]); assert.equal(t.propertiesSchema.additionalProperties,false);
    assert(!row.fields.some(k=>/^(?:actor|viewer|userId|confirm|approved|decision|role|grant)$/i.test(k)));
  }
  const matrix=read('review/evidence/visual-matrix.json'); assert.deepEqual(matrix.errors,[]);
  for(const row of rows) {
    const m=matrix.routedExamples.filter(e=>e.entry===row.id);
    assert.equal(m.length,1); assert.equal(m[0].route,row.id===30?`${m[0].inputs.landing}/home`:row.route); assert.deepEqual(m[0].inputs,cases.find(c=>c.id===row.id).inputs);
  }
  const scriptBytes = new Map(await Promise.all(members.filter(f=>f.name.startsWith('ClientSideAssets/') && !/\.(?:zip|txt)$/.test(f.name)).map(async f=>['/'+f.name,await f.async('nodebuffer')])));
  const sdk = `<script>
    const hub={}; window.hub=hub; hub.snapshots=[]; hub.messages=[]; hub.modules={};
    window.define=(deps,factory)=>{
      const modules={
        react:React,'react-dom/client':ReactDOM,
        '@microsoft/sp-copilot-component':{BaseCopilotComponent:function(){},createCopilotTextContent:text=>({type:'text',text})},
        '@microsoft/sp-webpart-base':{BaseClientSideWebPart:function(){}},
        '@microsoft/sp-property-pane':{PropertyPaneDropdown:(...args)=>args,PropertyPaneTextField:(...args)=>args}
      };hub.modules[document.currentScript.src.split('/').pop()]=factory(...deps.map(n=>{if(!modules[n])throw Error(n);return modules[n]}));
    };
    hub.start=({file,exportName,kind,properties,mode})=>{
      if(hub.active)hub.active.onDispose();
      const el=document.getElementById('host');
      hub.snapshots=[];hub.messages=[];hub.active=undefined;
      const mod=hub.modules[file][exportName], clazz=mod.default||mod, obj=new clazz();
      const instanceId=crypto.randomUUID();
      Object.assign(obj,{properties,instanceId,domElement:el,hostContext:{theme:'light',displayMode:mode==='full'?'fullscreen':'inline',availableDisplayModes:['inline','fullscreen']},
        context:{pageContext:{user:{displayName:'Test colleague',loginName:'fixture-a'}},instanceId,domElement:el,copilotBridge:{
          updateModelContextAsync:async arg=>hub.snapshots.push(arg),sendFollowUpMessageAsync:async arg=>{hub.messages.push(arg);return {isError:false}}}},
        requestSizeChangeAsync:async()=>true,requestDisplayModeAsync:async()=>({mode:'fullscreen'})});
      hub.active=obj;obj.render();return {entry:obj.entry,landing:obj.landing};
    };
  </script>`;
  const rb=fs.readFileSync('node_modules/react/umd/react.production.min.js'), db=fs.readFileSync('node_modules/react-dom/umd/react-dom.production.min.js');
  const base='http://localhost:41335', errors=[], visited=[], snapshots=[], unknownReferences=[], stateProbes=[];
  const browser=await chromium.launch({executablePath:await reviewBrowserPath(),headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1024,height:900},reducedMotion:'reduce'});page.setDefaultTimeout(7500);
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('**/*',async request=>{
      const u=new URL(request.request().url()), p=u.pathname;
      if(u.origin!==base){errors.push('Unexpected off-origin request: '+u.origin);return request.abort();}
      if(p==='/')return request.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><div id="host"></div><script src="/react.js"></script><script src="/dom.js"></script>${sdk}`});
      const b=p==='/react.js'?rb:p==='/dom.js'?db:scriptBytes.get(p);
      if(!b){errors.push('Unknown package member: '+p);return request.fulfill({status:404,body:''});}
      return request.fulfill({contentType:p.endsWith('.js')?'application/javascript':p.endsWith('.png')?'image/png':p.endsWith('.svg')?'image/svg+xml':'image/jpeg',body:b});
    });
    await page.clock.setFixedTime(new Date(stamp));
    for (const [kind,list] of [['CopilotComponent',tools],['WebPart',webParts]]){
      await page.goto(base);
      const first=list[0].loaderConfig;
      const file=first.scriptResources[first.entryModuleId].path;
      await page.addScriptTag({url:base+'/ClientSideAssets/'+file});
      for (const m of list){
        const c=kind==='CopilotComponent'?rows.find(c=>c.tool===m.tools[0].name):rows.find(c=>(c.part+'WebPart').toLowerCase()===m.alias.toLowerCase())||rows.find(c=>c.id===30&&homes[m.alias]);
        assert(c,`No matching entry for packaged alias ${m.alias}`);
        const fix=homes[m.alias], isC=kind==='CopilotComponent', inputs=cases.find(x=>x.id===c.id).inputs;
        const check=async(properties,mode)=>{
          const route=c.id===30?(fix||(isC?properties.landing:undefined)||'company')+'/home':c.route;
          const config=m.loaderConfig;assert.equal(config.scriptResources[config.entryModuleId].path,file);
          const active=await page.evaluate(a=>hub.start(a),{file,exportName:config.exportName,kind,properties,mode});assert.equal(active.entry,c.id); assert.equal(active.landing,fix);
          await page.locator(`main[data-route="${route}"][data-hub-mode="${!isC&&c.id===30?'full':mode}"]`).waitFor();
          await page.waitForFunction(()=>!Array.from(document.querySelectorAll('[role=status]')).some(e=>e.innerText.startsWith('Opening ')) && document.querySelectorAll('main h2,main h3,main h1').length);
          await page.evaluate(()=>new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res))));
          const result=await page.evaluate(()=>({mains:document.querySelectorAll('main').length, route:document.querySelector('main').dataset.route,layout:document.querySelector('main [data-layout]')?.dataset.layout,
            headings:[...document.querySelectorAll('main h1,main h2,main h3')].filter(e=>e.checkVisibility()).map(e=>e.innerText).slice(0,3),
            last:hub.snapshots.at(-1)?.structuredContent, passiveMessages:hub.messages.length, switcher:!!document.querySelector('nav[aria-label="Workspaces"]')}));
          assert.equal(result.mains,1);assert.equal(result.passiveMessages,0);assert(result.headings.length);
          if(isC){assert.equal(result.last?.tool,c.tool,`${m.alias} reported ${result.last?.tool}`);assert.equal(result.last.route,route);assert(!['denied','unavailable','receipt'].includes(result.last.stage),`${m.alias}: ${result.last.stage}`);}
          else{assert.equal(result.last,undefined);if(c.id===30)assert.equal(result.switcher,!fix);}
          visited.push({kind,id:c.id,alias:m.alias,guid:m.id,mode,route:result.route,parameters:Object.keys(properties).length>0,headings:result.headings,layout:result.layout});
        };
        if(isC) {await check({},'inline');await check(inputs,'inline');await check(inputs,'full');}
        else await check(c.id===30?{}:inputs,c.id===30?'full':'inline');
        if(isC&&c.id===2){
          const instance=await page.evaluate(()=>hub.active.instanceId);
          await page.getByRole('button',{name:'Save for later',exact:true}).click();
          await page.getByRole('button',{name:'Remove bookmark',exact:true}).waitFor();
          await page.evaluate(()=>{hub.active.hostContext.theme='dark';hub.active.render();});
          await page.locator('[data-hub-theme="dark"]').waitFor(); await page.getByRole('button',{name:'Remove bookmark',exact:true}).waitFor();
          await page.evaluate(()=>{hub.active.properties={topic:'Saved'};hub.active.render();});
          await page.getByRole('heading',{name:'Saved stories'}).waitFor();
          await page.evaluate(()=>new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res))));
          assert.equal(await page.evaluate(()=>hub.active.instanceId),instance);
          await page.getByRole('button',{name:'Remove bookmark',exact:true}).waitFor();
          await page.evaluate(()=>{hub.active.context.pageContext.user.loginName='fixture-b';hub.active.render();});
          await page.getByText('No stories in this edition.',{exact:true}).waitFor();
          stateProbes.push({id:2,sameInstance:true,bookmarkSurvivedTheme:true,retainedInSavedFilter:true,isolatedOnIdentityChange:true});
        }
        if(isC && [14,21].includes(c.id)){
          await check({},'inline'); const name=c.id===14?'Next year':'Next step';
          const before=await page.evaluate(()=>({msg:JSON.stringify(hub.snapshots.at(-1)),ui:document.querySelector('main').innerText}));
          await page.getByRole('button',{name,exact:true}).click();
          await page.waitForFunction(txt=>document.querySelector('main').innerText!==txt,before.ui);
          await page.evaluate(()=>new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res))));
          const current=await page.evaluate(()=>hub.snapshots.at(-1));assert.notEqual(before.msg,JSON.stringify(current));
          if(c.id===14)assert.equal(current.structuredContent.filters.period,'next');else assert.equal(current.structuredContent.progress.current,2);
          assert.equal(await page.evaluate(()=>hub.messages.length),0);
          snapshots.push({id:c.id,control:name,visibleUiChanged:true,publishedContextChanged:true});
        }
        if(isC&&c.id===30){
          for(const landing of ['company','hr','tech','business'])await check({landing},'full');
          const cut=await page.evaluate(()=>hub.snapshots.at(-1).structuredContent);
          assert.equal(cut.filters.marketId,'DE');assert.equal(cut.bookings.booked,3200000);assert.equal(cut.bookings.phasedPlan,4800000);
        }
        if(isC){
          const activate=properties=>page.evaluate(a=>hub.start(a),{file,exportName:m.loaderConfig.exportName,kind,properties,mode:'inline'});
          await activate({confirm:true});
          await page.getByRole('alert').filter({hasText:'input is not supported'}).waitFor();
          assert.equal(await page.locator('main').count(),0);
          await page.waitForFunction(()=>hub.snapshots.at(-1)?.structuredContent.stage==='unavailable');
          const k={1:'eventId',2:'storyId',3:'marketId',4:'officeId',5:'resourceId',6:'evidenceId',7:'marketId',9:'marketId',10:'courseId',13:'awardId',16:'teamId',17:'requestId',19:'deviceId',20:'serviceId',21:'guideId',22:'deviceId',23:'ticketId',24:'itemId',25:'requestId',26:'teamId',27:'queueId',28:'appId'}[c.id];
          if(k){await activate({[k]:'ZZ-UNKNOWN-98765'});await page.locator('main').waitFor();
            await page.waitForFunction(()=>!Array.from(document.querySelectorAll('[role=status]')).some(e=>e.innerText.startsWith('Opening ')) && document.querySelectorAll('main h2,main h3,main h1').length);
            await page.evaluate(()=>new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res))));
            const details=await page.evaluate(()=>({stage:hub.snapshots.at(-1)?.structuredContent.stage,feedback:document.querySelector('main').innerText.slice(0,480),passiveMessages:hub.messages.length}));
            assert.equal(details.passiveMessages,0);
            if(c.id===4){assert.equal(details.stage,'draft');assert.equal(await page.getByRole('button',{name:'Search available rooms'}).isEnabled(),false);}
            else if(c.id===22){assert.equal(details.stage,'draft');assert.match(details.feedback,/unavailable|not assigned|not available|unknown/i);}
            else assert(['unavailable','denied'].includes(details.stage),`#${c.id} silently accepted an unknown ${k}`);
            unknownReferences.push({id:c.id,key:k,stage:details.stage});}
        }
      }
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
  const summary={sha256:hash(bytes),bytes:bytes.length,simulation:'Packaged JS with local synthetic SPFx/bridge callbacks; no authenticated host or model',uniqueComponents:new Set(visited.map(x=>x.guid)).size,completed:visited.length,semanticProbes:snapshots,stateProbes,unknownReferences,errors,visited};
  assert.equal(summary.uniqueComponents,64);assert.equal(unknownReferences.length,22);
  fs.writeFileSync(sessionOutput,JSON.stringify(summary,null,2)+'\n');console.log(`Proved ${summary.uniqueComponents} compiled exports in ${visited.length} activations, ${unknownReferences.length} unknown records and per-identity isolation.`);
})().catch(err=>{console.error(err);process.exitCode=1;});
