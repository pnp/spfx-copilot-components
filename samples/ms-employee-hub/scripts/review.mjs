import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath,pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import * as sass from 'sass-embedded';
import postcss from 'postcss';
import localByDefault from 'postcss-modules-local-by-default';

export const root=fileURLToPath(new URL('../',import.meta.url)), dir=path.join(root,'.review-build');
export async function reviewBrowserPath(){
  const paths=[process.env.BROWSER_PATH,process.env['ProgramFiles(x86)']&&path.join(process.env['ProgramFiles(x86)'],'Microsoft','Edge','Application','msedge.exe'),process.env.ProgramFiles&&path.join(process.env.ProgramFiles,'Google','Chrome','Application','chrome.exe')];
  for(const p of paths.filter(Boolean)){try{await fs.access(p);return p;}catch(e){if(e.code!=='ENOENT')throw e;}}
}
export async function buildReview(){
  const result=await esbuild.build({absWorkingDir:root,entryPoints:['review/index.tsx'],bundle:true,format:'iife',platform:'browser',target:'es2020',minify:true,define:{'process.env.NODE_ENV':'"production"'},outfile:'.review-build/app.js',write:false,loader:{'.svg':'dataurl','.jpg':'dataurl','.webp':'dataurl','.png':'dataurl'},plugins:[{name:'spfx-review-styles',setup(build){build.onLoad({filter:/\.s[ac]ss$/},async({path:p})=>{
    const {css}=await sass.compileAsync(p,{loadPaths:[path.join(root,'node_modules')],quietDeps:true}),global=p.includes('.global.');
    // Match css-loader: a bare :global in one selector must not leak into the next comma-separated selector.
    const contents=global?css:(await postcss([localByDefault({mode:'local'})]).process(css,{from:p})).css;
    return {contents,loader:global?'css':'global-css',resolveDir:path.dirname(p)};
  });}}]});
  const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script');
  const css=result.outputFiles.find(f=>f.path.endsWith('.css'))?.text||'';
  await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Employee Hub · Local review</title><style>html,body{margin:0}body{font:16px/1.5 "Segoe UI",sans-serif}.review-frame{min-height:100vh}.review-controls{padding:10px clamp(12px,3vw,48px);background:#292641;color:#faf8ff}.review-controls summary{cursor:pointer;font-weight:650}.review-controls small{font-size:.64rem;letter-spacing:.13em;margin-left:10px}.review-controls>div{display:flex;align-items:end;gap:12px;flex-wrap:wrap;padding:6px 0}.review-controls label{font-size:.74rem;display:grid;gap:2px}.review-controls button,.review-controls select{max-width:100%;padding:5px;border-radius:4px;border:0}.review-controls label:first-child{max-width:100%}${css}</style><div id="root"></div><script>${js}</script></html>`);
  return path.join(dir,'index.html');
}
export async function serve(port=0){
  const body=await fs.readFile(path.join(dir,'index.html'));
  const server=http.createServer((req,res)=>{if(new URL(req.url,'http://localhost').pathname!=='/'){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(body);});
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
  return {url:`http://127.0.0.1:${server.address().port}/`,close:()=>new Promise(resolve=>server.close(resolve))};
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){const file=await buildReview();console.log(file);if(!process.argv.includes('--build'))console.log((await serve(Number(process.env.PORT||4330))).url);}
