import {mkdir,mkdtemp,rmdir,stat} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {chromium} from 'playwright-core';
import {buildReview,reviewBrowserPath,root,serve} from './review.mjs';
import {rehearse} from './review-journeys.mjs';

const executablePath=await reviewBrowserPath();
await buildReview();
const output=path.join(root,'review','evidence'),file=path.join(output,'commercial-rehearsal.webm');
await mkdir(output,{recursive:true});
const tmp=await mkdtemp(path.join(os.tmpdir(),'employee-hub-film-')),server=await serve();
try {
  const browser=await chromium.launch({executablePath});
  try {
    const context=await browser.newContext({viewport:{width:1280,height:960},recordVideo:{dir:tmp,size:{width:1280,height:960}},reducedMotion:'reduce'});
    await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
    const page=await context.newPage(),video=page.video();
    const cue=async(title,note)=>{
      await page.evaluate(([t,n])=>{
        let panel=document.querySelector('[data-film-captions]');
        if(!panel){panel=document.createElement('aside');panel.setAttribute('data-film-captions','');panel.style.cssText='position:fixed;inset:auto 0 0;background:#111b34;color:white;padding:13px 28px 17px;font:18px/1.45 "Segoe UI",sans-serif;z-index:20;border-top:3px solid #8ccfca';document.body.appendChild(panel);}
        const label=document.createElement('div');label.style.cssText='font-size:13px;font-weight:650;letter-spacing:.08em;color:#b5eee5';label.textContent=`LOCAL STUDIO · SYNTHETIC DATA · ${t.toUpperCase()}`;
        const body=document.createElement('div');body.textContent=n;panel.replaceChildren(label,body);
      },[title,note]);
      await new Promise(resolve=>setTimeout(resolve,4800));
    };
    try {
      try { await rehearse(page,server.url,output,cue); } finally { await context.close(); }
      await video.saveAs(file);
    } finally {await video.delete();}
  } finally {await browser.close();}
} finally {await server.close();await rmdir(tmp);}
console.log(`Captioned local UI recording: ${file} (${(await stat(file)).size} bytes)`);
