// Measures the real review entry, Fluent provider and HubApp header without writing the shared review bundle.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import * as esbuild from 'esbuild';
import * as sass from 'sass-embedded';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = await esbuild.build({absWorkingDir:root, entryPoints:['review/index.tsx'], bundle:true, format:'iife', platform:'browser',
  target:'es2020',minify:true,define:{'process.env.NODE_ENV':'"production"'},outfile:'tests/people-review.js',write:false,
  loader:{'.svg':'dataurl','.jpg':'dataurl','.webp':'dataurl','.png':'dataurl'},plugins:[{name:'review-styles',setup(build){
    build.onLoad({filter:/\.s[ac]ss$/},async({path:p})=>({contents:(await sass.compileAsync(p,{loadPaths:[path.join(root,'node_modules')],quietDeps:true})).css,
      loader:p.includes('.global.')?'css':'local-css',resolveDir:path.dirname(p)}));
  }}]});
const js = out.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script');
const css = out.outputFiles.find(f=>f.path.endsWith('.css')).text;
const body = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}body{font:16px/1.5 "Segoe UI",sans-serif}.review-frame{min-height:100vh}${css}</style><div id="root"></div><script>${js}</script></html>`;
const evidence = path.join(root,'tests','people-visual');
const profile = path.join(evidence,`.inline-browser-${process.pid}`);
const record = process.argv.includes('--record');
let context;
try {
  const paths = [process.env.BROWSER_PATH,process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'],'Microsoft','Edge','Application','msedge.exe'),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles,'Google','Chrome','Application','chrome.exe')].filter(Boolean);
  let executablePath;
  for(const p of paths) {try{await fs.access(p);executablePath=p;break;}catch(e){if(e.code!=='ENOENT')throw e;}}
  await fs.mkdir(profile,{recursive:true});
  context = await chromium.launchPersistentContext(profile,{executablePath,headless:true,reducedMotion:'reduce'});
  const page=await context.newPage(), errors=[], heights=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.request().url().startsWith('https://hr.local.invalid/?')?r.fulfill({contentType:'text/html',body}):r.abort());
  for(const width of [760,390]) {
    await page.setViewportSize({width,height:width===760?840:844});
    for(let id=10;id<=18;id++) for(const theme of ['light','dark']) {
      await page.goto(`https://hr.local.invalid/?bare=1&clock=2026-11-27T09%3A00%3A00Z&entry=${id}&mode=inline&theme=${theme}`);
      await page.locator(`main [data-layout^=hr-]`).waitFor();
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const height=await page.locator('main[data-hub-mode=inline]').evaluate(e=>Math.round(e.getBoundingClientRect().height));
      heights.push({id,width,theme,height});
      if(record && theme==='light' && (id===14 || id===16)) await page.locator('main').screenshot({path:path.join(evidence,`inline-${id}-${width}.png`)});
      assert.equal(await page.locator('main > header').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false);
      if(process.env.HR_INSPECT===String(id)) console.log(await page.locator('main').evaluate(e=>[...e.querySelectorAll('header,.hrw-task-title,.hrw-tools,.hrw-paper,.hrw-aside,.hrw-impact,.hrw-source,.hrw-private,details,summary')].map(n=>[n.tagName,n.className,Math.round(n.getBoundingClientRect().height)])));
      const disclosure=page.locator('main details > summary').first();
      if(await disclosure.count()) {
        await disclosure.focus(); await page.keyboard.press('Enter');
        assert.ok(await disclosure.evaluate(e=>e.parentElement.open));
        await page.keyboard.press('Enter'); assert.equal(await disclosure.evaluate(e=>e.parentElement.open),false);
      }
    }
  }
  const max=(id,width)=>Math.max(...heights.filter(r=>r.id===id&&r.width===width).map(r=>r.height));
  if(record) for(const [width,id,theme] of [[1280,0,'light'],[390,0,'light'],[1280,10,'light'],[1280,15,'light'],[1280,15,'dark']]) {
    await page.setViewportSize({width,height:width===1280?900:844});
    await page.goto(`https://hr.local.invalid/?bare=1&clock=2026-11-27T18%3A00%3A00Z&entry=${id||30}&landing=hr&mode=full&theme=${theme}`);
    await page.locator(`main [data-layout^=hr-]`).waitFor();
    if(!id) {
      await page.locator('.hrw-campaign').waitFor();
      assert.equal(await page.locator('.hrw-desk-heading').first().evaluate(e=>getComputedStyle(e).display),'flex');
      await page.evaluate(async () => {
        await Promise.all(['.hrw-campaign-cover','.hrw-campaign-inset','.hrw-campaign-flourish','.hrw-story-photo'].map(async s=>{
          const url=getComputedStyle(document.querySelector(s)).backgroundImage;
          if(!url.startsWith('url("data:image/'))throw Error(`Missing local campaign layer: ${s}`);
          const image=new Image();image.src=url.slice(5,-2);await image.decode();
        }));
      });
    }
    await page.screenshot({path:path.join(evidence,`studio-${id||'home'}-${theme}-${width}.png`)});
    if(!id&&width===1280)await page.locator('.hrw-feature-story').screenshot({path:path.join(evidence,'studio-home-learning.png')});
    if(id===15 && theme==='light'){
      await page.getByRole('button',{name:'Next calendar month'}).click();
      await page.getByRole('radio',{name:'Set start date: Dec 2, 2026',exact:true}).check();
      await page.getByRole('tab',{name:'Home',exact:true}).click();
      await page.getByRole('button',{name:'Keep editing'}).click();
      assert.equal(await page.getByLabel('Start date',{exact:true}).inputValue(),'2026-12-02');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false);
  }
  console.table(Array.from({length:9},(_,i)=>({id:i+10,at760:max(i+10,760),at390:max(i+10,390)})));
  assert.deepEqual(errors,[]);
  assert.deepEqual(heights.filter(r=>r.height>(r.width===760?650:800)),[],'Initial inline height budget');
  if(record) await fs.writeFile(path.join(evidence,'inline-heights.json'),JSON.stringify({
    scope:'Local review entry, complete HubApp main including the shell header, default parameters, initial inline stage; not an authenticated host.',
    clock:'2026-11-27T09:00:00Z',limits:{760:650,390:800},heights
  },null,2)+'\n');
} finally {
  await context?.close(); await fs.rm(profile,{recursive:true,force:true});
}
