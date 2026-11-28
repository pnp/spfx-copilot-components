import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {appMarks,appSvg,webPartIcon} from './identity-art.mjs';
import {entries,root} from './host-model.mjs';
import {reviewBrowserPath} from './review.mjs';

const names={agent:'Copilot agent',hub:'Employee Hub',company:'Microsoft home',hr:'HRweb',tech:'TechWeb',business:'Business',cowork:'Cowork plug-in'};
const png=(b)=>`data:image/png;base64,${b.toString('base64')}`;
const browser=await chromium.launch({executablePath:await reviewBrowserPath()});
try{
  const page=await browser.newPage({viewport:{width:1380,height:910},deviceScaleFactor:1});
  const apps=[];
  for(const key of Object.keys(appMarks)){
    const dir=path.join(root,...(key==='agent'?['copilot']:key==='cowork'?['employee-hub-plugin']:['teams',key]));
    await mkdir(dir,{recursive:true});
    const images=[];
    for(const outline of [false,true]){
      const svg=appSvg(key,outline);
      const bytes=await page.evaluate(async({svg,outline})=>{
        const img=new Image();img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;await img.decode();
        const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
        const {data}=ctx.getImageData(0,0,img.width,img.height);let visible=0,transparent=0;
        for(let i=0;i<data.length;i+=4){
          if(!data[i+3]){transparent++;continue;}
          if(outline&&Math.min(data[i],data[i+1],data[i+2])!==255)throw Error('Outline must be white on transparency');
          visible++;
        }
        if(!visible||(outline?!transparent:transparent))throw Error('Invalid app icon alpha');
        return canvas.toDataURL('image/png').split(',')[1];
      },{svg,outline});
      const b=Buffer.from(bytes,'base64');assert.equal(b.readUInt32BE(16),outline?32:192);
      await writeFile(path.join(dir,outline?'outline.png':'color.png'),b);images.push(png(b));
      if(key==='cowork'&&!outline)await writeFile(path.join(dir,'artwork.svg'),svg+'\n');
    }
    apps.push({name:names[key],color:images[0],outline:images[1]});
  }
  const parts=entries('webparts').sort((a,b)=>a.row.id-b.row.id).map(part=>({name:part.landing?.title||part.row.title,art:webPartIcon(part)}));
  assert.equal(new Set(parts.map(p=>p.art)).size,parts.length);
  await page.setContent(`<meta charset="utf-8"><style>*{box-sizing:border-box}body{padding:26px 34px;margin:0;color:#192637;background:#f1f4f8;font:16px/1.3 "Segoe UI",sans-serif}header{color:#315382;font-size:13px;font-weight:650;letter-spacing:.13em}h1{font-size:35px;margin:.25em 0}h2{font-size:20px;margin:20px 0 10px}.apps,.parts{display:grid;gap:8px}.apps{grid-template-columns:repeat(7,1fr)}.parts{grid-template-columns:repeat(6,1fr)}figure{margin:0;display:flex;align-items:center;gap:9px;padding:8px 10px;background:white;border-radius:8px}figure img{display:block;width:40px;height:40px;flex:none}.apps figure{flex-wrap:wrap;padding:12px}.apps img:first-child{width:53px;height:53px;border-radius:8px}.apps img:nth-child(2){background:#243148;border-radius:5px;width:40px;height:40px;padding:4px}.apps figcaption{width:100%;font-weight:600}.parts figcaption{font-size:14px}</style>
    <header>CONTOSO / EMPLOYEE HUB</header><h1>One family, distinct identities</h1><h2>Copilot, Teams and Cowork · color and outline</h2><section class="apps">${apps.map(a=>`<figure><img src="${a.color}"><img src="${a.outline}"><figcaption>${a.name}</figcaption></figure>`).join('')}</section>
    <h2>34 web-part icons · 29 focused parts, 4 workspaces and the all-up Teams shell</h2><section class="parts">${parts.map(p=>`<figure><img src="${p.art}"><figcaption>${p.name}</figcaption></figure>`).join('')}</section>`);
  await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(img=>img.decode())));
  const evidence=path.join(root,'review','evidence');await mkdir(evidence,{recursive:true});
  await page.locator('body').screenshot({path:path.join(evidence,'identity-sheet.png')});
  console.log(`Generated ${apps.length} color/outline pairs and a ${parts.length}-part picker sheet.`);
}finally{await browser.close();}
