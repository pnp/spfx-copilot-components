import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {buildReview,reviewBrowserPath,serve,root} from './review.mjs';
import {rehearse} from './review-journeys.mjs';

const proof=process.argv.includes('--proof'), output=path.join(root,'review','evidence'), images=path.join(output,'screens');
const captureClock='2026-11-27T09:00:00Z';
const catalog=JSON.parse(await fs.readFile(path.join(root,'config','hub-catalog.json')));
const executablePath=await reviewBrowserPath();
await buildReview();await fs.mkdir(images,{recursive:true});
const server=await serve(),browser=await chromium.launch({executablePath,headless:true});
const results=[],errors=[],routedExamples=[],zoomChecks=[];let journeys=[];const page=await browser.newPage({reducedMotion:'reduce'});page.setDefaultTimeout(7500);page.on('pageerror',e=>errors.push(String(e)));
await page.route(/^https?:\/\//,r=>{if(new URL(r.request().url()).origin===new URL(server.url).origin)return r.continue();errors.push(`Unexpected off-origin request: ${new URL(r.request().url()).origin}`);return r.abort();});
async function show(params,width,theme,zoom=1){
  await page.setViewportSize({width,height:width<500?844:840});
  const search=new URLSearchParams({bare:'1',clock:captureClock,theme,...params});
  await page.goto(server.url+'?'+search);
  if(zoom!==1)await page.evaluate(z=>{document.body.style.zoom=String(z);},zoom);
  await page.locator('main[data-hub-mode]').waitFor();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('[role=status]')).some(e=>e.textContent.startsWith('Opening ')));
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  if(params.landing&&params.mode==='full'){
    const artwork=await page.locator('main').evaluate(async main=>{
      const byUrl=new Set();
      for(const el of main.querySelectorAll('*'))for(const pseudo of [null,'::before','::after']){
        const bg=getComputedStyle(el,pseudo).backgroundImage;
        if(bg.includes('url('))for(const m of bg.matchAll(/url\("(.*?)"\)/g))byUrl.add(m[1]);
      }
      await Promise.all([...byUrl].map(async src=>{const img=new Image();img.src=src;await img.decode();if(!img.naturalWidth)throw Error('Empty campaign image');}));
      const mark=main.querySelector('[aria-label="Microsoft"][role="img"]');
      return {images:byUrl.size,mark:!!mark&&getComputedStyle(mark).backgroundImage!=='none'};
    });
    if(!artwork.mark||artwork.images<(params.landing==='business'?1:2))errors.push(`Missing decoded brand or campaign art: ${params.landing}, ${width}, ${theme}`);
  }
  const metrics=await page.evaluate(()=>{
    const main=document.querySelector('main'),w=document.documentElement.clientWidth;
    const over=Array.from(main.querySelectorAll('*')).filter(e=>{if(!(e instanceof HTMLElement)||!e.offsetWidth)return false;const b=e.getBoundingClientRect();return b.right>w+2&&getComputedStyle(e).position!=='absolute';}).slice(0,5).map(e=>`${e.tagName}.${e.className}`);
    return {text:main.innerText.trim().length,height:Math.round(main.getBoundingClientRect().height),route:main.dataset.route,unexpectedUnavailable:/Selection unavailable\.|This view is unavailable|This workplace destination is unavailable|This HRweb task is unavailable|Unable to open this|This selection isn.t available/.test(main.innerText),overflow:Math.max(0,document.documentElement.scrollWidth-w),outside:over,brokenImages:Array.from(main.querySelectorAll('img')).filter(i=>!i.complete||!i.naturalWidth||!i.hasAttribute('alt')).length,unlabelled:Array.from(main.querySelectorAll('button,input,select,textarea')).filter(e=>e.getClientRects().length&&!(e.textContent?.trim()||e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.labels?.length||e.title)).length};
  });
  if(zoom!==1){
    await page.keyboard.press('Tab');
    const focus=await page.evaluate(()=>{const e=document.activeElement;return !!(e?.closest('main')&&e.matches(':focus-visible')&&e.getBoundingClientRect().width>0);});
    if(!focus)errors.push(`Keyboard focus did not enter ${metrics.route} at 200%`);
  }
  return metrics;
}
async function sample(params,width,theme,name){
  const r={...params,width,theme,...await show(params,width,theme)};if(name){r.image=`screens/${name}.png`;await page.screenshot({path:path.join(output,r.image),animations:'disabled'});}results.push(r);
}
async function sheet(name,title,tiles,columns=2){
  const cards=await Promise.all(tiles.map(async ([file,caption])=>`<figure><figcaption>${caption}</figcaption><img alt="" src="data:image/png;base64,${(await fs.readFile(path.join(images,file+'.png'))).toString('base64')}"></figure>`));
  await page.setViewportSize({width:1440,height:950});
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:24px 32px 32px;background:#ececf3;color:#20213b;font:16px/1.35 "Segoe UI",sans-serif}header{font-weight:600;letter-spacing:.14em;font-size:12px;color:#42458a}h1{font-size:36px;font-weight:580;letter-spacing:-.045em;margin:4px 0 16px}section{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{padding:10px 12px 12px;margin:0;background:white;border-radius:12px}figcaption{font-size:16px;font-weight:600;padding:1px 0 9px}img{width:100%;height:auto;display:block}</style><header>EMPLOYEE HUB · LOCAL REHEARSAL · SYNTHETIC DATA</header><h1>${title}</h1><section>${cards.join('')}</section>`);
  await page.locator('section').evaluate((node,n)=>node.style.gridTemplateColumns=`repeat(${n},minmax(0,1fr))`,columns);
  await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));
  await page.screenshot({path:path.join(output,name),fullPage:true,animations:'disabled'});
}
try{
  journeys=await rehearse(page,server.url,images);
  for(const w of ['company','hr','tech','business'])for(const width of (proof?[1280,390]:[320,390,760,1280,1920])){
    for(const theme of (proof?['light']:['light','dark']))await sample({entry:'30',landing:w,mode:'full',fixed:'1'},width,theme,[390,1280].includes(width)?`${w}-${width}${theme==='dark'?'-dark':''}`:undefined);
  }
  for(const c of (proof?catalog.filter(x=>[9,22,25,30].includes(x.id)):catalog)){
    const parameters=c.id===9?{marketId:'DE',channel:'Partner'}:{};
    for(const mode of ['inline','full'])for(const width of (proof?[390,1280]:[320,390,760,1280,1920])){
      const themes=proof?['light']:['light','dark'];
      for(const theme of themes)await sample({entry:String(c.id),mode,...parameters},width,theme,theme==='light'&&(width===760&&mode==='inline'||[9,22,25].includes(c.id)&&[390,1280].includes(width)||[1,2,4,15].includes(c.id)&&mode==='full'&&width===1280)?`task-${String(c.id).padStart(2,'0')}-${mode}-${width}`:undefined);
    }
  }
  const denied=await show({entry:'30',landing:'business',actor:'employee',mode:'full'},390,'dark');
  if(!(await page.getByText('This view is unavailable',{exact:true}).isVisible()))errors.push('Restricted Business workspace was not denied.');
  if(denied.text<20)errors.push('Denied route had no explanation.');
  if(!proof){
    for(const {id,nearest,inputs} of JSON.parse(await fs.readFile(path.join(root,'review','routing-cases.json')))){
      const r=await show({entry:String(id),mode:'inline',...inputs},760,'light');
      const expected=id===30?`${inputs.landing||'company'}/home`:catalog.find(c=>c.id===id).route;
      if(r.route!==expected)errors.push(`Example #${id}: expected ${expected}, rendered ${r.route}`);
      const stage=await page.locator('[data-review-stage]').getAttribute('data-review-stage');
      if(!['selection','information','draft','review'].includes(stage))errors.push(`Example #${id} did not open usable fixture data (${stage})`);
      routedExamples.push({entry:id,nearest,inputs,stage,...r});
    }
    for(const entry of catalog)for(const mode of ['inline','full'])zoomChecks.push({entry:entry.id,mode,zoom:2,...await show({entry:String(entry.id),mode},780,'light',2)});
    for(const landing of ['company','hr','tech','business'])zoomChecks.push({landing,mode:'full',zoom:2,...await show({entry:'30',landing,mode:'full',fixed:'1'},780,'light',2)});
    await sheet('workspace-contact.png','Four workspaces, four different front doors.',[['company-1280','Microsoft home · Workplace journal'],['hr-1280','HRweb · Working life'],['tech-1280','TechWeb · Employee technology'],['business-1280','Business · Quarterly operating review']]);
    await sheet('workspace-phone.png','Four workspaces on a phone.',[['company-390','Microsoft home'],['hr-390','HRweb'],['tech-390','TechWeb'],['business-390','Business']],4);
    await sheet('proof-contact.png','From a question to a recorded decision.',[['task-09-inline-1280','01 · Read the acquisition cohort inline'],['task-09-full-1280','02 · Expand into the operating review'],['keynote-receipt','03 · Confirm one cited session action'],['task-25-full-1280','04 · Separate employee service decision']]);
  }
  for(const row of [...results,...routedExamples,...zoomChecks])if(row.text<35||row.overflow>1||row.outside.length||row.unlabelled||row.brokenImages||row.unexpectedUnavailable)errors.push(`${row.route} ${row.mode} ${row.width||'zoom/rehearsal'}: ${JSON.stringify(row)}`);
}catch(e){errors.push(String(e));throw e;}finally{
  await browser.close();await server.close();
  await fs.writeFile(path.join(output,proof?'proof.json':'visual-matrix.json'),JSON.stringify({scope:'Offline shared React surfaces only; not a host verification. Zoom checks use 200% document zoom at a 780px viewport.',clock:captureClock,generated:new Date().toISOString(),journeys,results,routedExamples,zoomChecks,errors},null,2)+'\n');
}
console.log(`${results.length} renders; ${errors.length} failures`);if(errors.length){console.error(errors.slice(0,12).join('\n'));process.exitCode=1;}
