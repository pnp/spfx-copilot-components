import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { captureIntentVisuals } from './capture-intent-visuals.mjs';

const root=path.resolve(import.meta.dirname,'..');
const harness=path.join(root,'temp','visual-harness');
const assets=path.join(root,'assets');
const sharedRoot=path.join(root,'src','shared');
const sourceFiles=[...fs.readdirSync(sharedRoot).filter(file=>/\.(?:ts|tsx|scss)$/.test(file)&&!file.endsWith('.test.ts')&&!file.endsWith('.test.tsx')).map(file=>`src/shared/${file}`).sort(),'package-lock.json'];
const captures=[
  {name:'ux-inline-SubmitInnovationIdea.png',intent:'SubmitInnovationIdea',width:760,height:900,alt:'Inline innovation idea canvas with controlled problem, audience, baseline, target, strategic theme, owner, evidence, and validation'},
  {name:'ux-inline-GetInnovationReviewQueue.png',intent:'GetInnovationReviewQueue',width:900,height:900,alt:'Inline innovation review queue with phase buckets, status filters, evidence signals, and pending decisions'},
  {name:'ux-inline-ExploreGlobalInnovation.png',intent:'ExploreGlobalInnovation',width:760,height:900,alt:'Inline global innovation view with a Natural Earth world map, regional participation markers, and conversion comparison'},
  {name:'ux-inline-ExploreAgentCapabilities.png',intent:'ExploreAgentCapabilities',width:760,height:900,alt:'Inline searchable catalog of Zava Innovation Hub operational scenarios and safe prompt previews'},
  {name:'ux-fullscreen-my.png',intent:'GetMyInnovation',mode:'fullscreen',width:1440,height:950,alt:'Full-screen My Innovation workspace with signed-in personal idea stages, impact, effort, and next actions'},
  {name:'ux-fullscreen-programs.png',intent:'GetInnovationGrowth',mode:'fullscreen',width:1440,height:950,alt:'Full-screen Programs and Pilots workspace with innovation growth, participation, and conversion evidence'},
  {name:'ux-fullscreen-reviews.png',intent:'GetInnovationReviewQueue',mode:'fullscreen',width:1440,height:950,alt:'Full-screen Reviews and Gates workspace with prioritized submissions and evidence-backed decision controls'},
  {name:'ux-fullscreen-investment.png',intent:'TrackInnovationBudget',mode:'fullscreen',width:1440,height:950,alt:'Full-screen Investment workspace with budget stewardship, funding position, and portfolio allocation evidence'},
  {name:'ux-fullscreen-enterprise.png',intent:'ExploreInnovationPortfolio',mode:'fullscreen',width:1440,height:950,alt:'Full-screen Enterprise Insights command center with stage-gate funnel, portfolio charts, themes, and realized value'},
  {name:'ux-fullscreen-enterprise-mobile.png',intent:'ExploreInnovationPortfolio',mode:'fullscreen',width:390,height:844,alt:'Enterprise Insights command center adapted to a narrow mobile viewport with accessible icon navigation'},
  {name:'ux-enterprise-dark.png',intent:'ExploreInnovationPortfolio',mode:'fullscreen',theme:'dark',width:1440,height:950,alt:'Enterprise Insights command center in dark theme with readable analytical charts and semantic status colors'}
];
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const sourceHash=hash(Buffer.concat(sourceFiles.map(file=>fs.readFileSync(path.join(root,file)))));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://localhost').pathname;
  const requested=pathname==='/'?'index.html':pathname.slice(1);
  const file=path.resolve(harness,requested);
  if(!file.startsWith(harness)||!fs.existsSync(file)){response.writeHead(404);response.end('Not found');return;}
  response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  response.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
const evidence=[];
try{
  for(const capture of captures){
    const page=await browser.newPage({viewport:{width:capture.width,height:capture.height},colorScheme:capture.theme==='dark'?'dark':'light',reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    const query=new URLSearchParams({intent:capture.intent});
    if(capture.mode)query.set('mode',capture.mode);
    if(capture.theme)query.set('theme',capture.theme);
    await page.goto(`http://127.0.0.1:${port}/?${query}`,{waitUntil:'networkidle'});
    await page.locator('[data-layout]').first().waitFor();
    const metrics=await page.evaluate(()=>({width:document.documentElement.clientWidth,contentWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,layouts:[...document.querySelectorAll('[data-layout]')].map(element=>element.getAttribute('data-layout')),brokenImages:[...document.images].filter(image=>!image.complete||image.naturalWidth===0).length}));
    if(metrics.contentWidth>metrics.width)errors.push(`Horizontal overflow: ${metrics.contentWidth} > ${metrics.width}`);
    if(metrics.brokenImages)errors.push(`${metrics.brokenImages} broken image(s)`);
    if(errors.length)throw new Error(`${capture.name}: ${errors.join('; ')}`);
    const output=path.join(assets,capture.name);
    await page.screenshot({path:output,fullPage:true,animations:'disabled'});
    const bytes=fs.readFileSync(output);
    evidence.push({...capture,capturedWidth:bytes.readUInt32BE(16),capturedHeight:bytes.readUInt32BE(20),bytes:bytes.length,sha256:hash(bytes),layouts:metrics.layouts});
    await page.close();
  }
  await captureIntentVisuals(browser,`http://127.0.0.1:${port}`,root,sourceFiles,sourceHash);
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
const report={schemaVersion:1,capturedAt:new Date().toISOString(),sourceFiles,sourceSha256:sourceHash,totalCaptures:evidence.length,failureCount:0,captures:evidence};
fs.writeFileSync(path.join(assets,'gallery-evidence.json'),`${JSON.stringify(report,null,2)}\n`,'utf8');
console.log(`Captured ${evidence.length} current implementation visuals with zero runtime or overflow failures.`);
