import { build } from 'esbuild';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'temp','ux-review');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(path.join(root,'ux-review','index.html'),path.join(out,'index.html'));
await build({entryPoints:[path.join(root,'ux-review','entry.tsx')],outfile:path.join(out,'bundle.js'),bundle:true,platform:'browser',format:'iife',target:['chrome100'],sourcemap:false,minify:false,loader:{'.png':'dataurl','.jpg':'dataurl'}});
console.log(`Visual harness built at ${out}`);