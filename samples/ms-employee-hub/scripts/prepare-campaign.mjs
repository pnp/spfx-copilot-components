import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import JSZip from 'jszip';
import {chromium} from 'playwright-core';
import {root,reviewBrowserPath} from './review.mjs';

const [source,logoSource]=process.argv.slice(2);if(![source,logoSource].every(p=>p&&path.isAbsolute(p)))throw Error('Provide the absolute paths to the supplied Microsoft campaign and logo folders.');
const photos=[
  ['company-cover.jpg','Humans/CLO24-Portraits-008.jpg',1440],['company-inset.jpg','Humans/CLO24-Portraits-088.jpg',460],
  ['company-edition.jpg','Humans/CLO24-Portraits-089.jpg',960],['company-perspective.jpg','Humans/CLO24-Portraits-086.jpg',820],['hr-cover.jpg','Humans/CLO24-Portraits-046.jpg',1260],
  ['hr-inset.jpg','Humans/CLO24-Portraits-001.jpg',460],['hr-learning.jpg','Humans/CLO24-Portraits-075.jpg',1000],
  ['tech-cover.jpg','Humans/CLO25-SCI-Lifestyle-057.jpg',1300],['tech-craft.jpg','Humans/CLO25-SCI-Lifestyle-019.jpg',960],
  ['hr-flourish.png','Flourish_Customized.png',560],['prism.png','Prism_Customized.png',500],
  ['campaign-ring.png','FY26 EVP Social Templates/FY26 EVP_ Employee Testimonial Template.pptx',440,'ppt/media/image8.png'],
  ['microsoft-logo.png','MSFT_logo_rgb_C-Gray.png',360],['microsoft-logo-dark.png','MSFT_logo_rgb_C-Wht.png',360]
];
const dir=path.join(root,'src','shared','media'),manifest=[];
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:await reviewBrowserPath()});
try{
  const page=await browser.newPage();
  for(const [file,original,width,entry] of photos){
    const logo=file.startsWith('microsoft-logo'),master=await readFile(path.join(logo?logoSource:source,original));
    const bytes=entry?await (await JSZip.loadAsync(master)).file(entry).async('nodebuffer'):master;
    await page.route('http://127.0.0.1/master',route=>route.fulfill({body:bytes,contentType:file.endsWith('png')?'image/png':'image/jpeg',headers:{'Access-Control-Allow-Origin':'*'}}));
    const url=await page.evaluate(async({width,file})=>{
      const img=new Image();img.crossOrigin='anonymous';img.src='http://127.0.0.1/master';await img.decode();
      const c=document.createElement('canvas');c.width=Math.min(width,img.naturalWidth);c.height=Math.round(img.naturalHeight*c.width/img.naturalWidth);
      const ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,c.width,c.height);
      return c.toDataURL(file.endsWith('png')?'image/png':'image/jpeg',.84);
    },{width,file});
    const built=Buffer.from(url.split(',')[1],'base64');await writeFile(path.join(dir,file),built);
    manifest.push({file,collection:logo?'Logos - Microsoft':'microsoft',original,...(entry?{entry}:{}),bytes:built.length,sha256:createHash('sha256').update(built).digest('hex')});
    await page.unroute('http://127.0.0.1/master');
  }
}finally{await browser.close();}
await writeFile(path.join(dir,'sources.json'),JSON.stringify({scope:'Contributor-confirmed rights on 2026-11-28 to use and redistribute the supplied assets with this sample, including source, packages, screenshots and recordings. No assertion about depicted identities. Publisher verification and tenant deployment approval remain separate.',transform:'Browser-oriented proportional resize and metadata-free re-encoding.',assets:manifest},null,2)+'\n');
console.log(`Prepared ${manifest.length} campaign derivatives, ${manifest.reduce((n,x)=>n+x.bytes,0)} bytes.`);
