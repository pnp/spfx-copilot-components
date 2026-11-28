import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {root} from './host-model.mjs';
const dir=await mkdtemp(path.join(os.tmpdir(),'hub-smoke-')),config=path.join(dir,'fixture.json'),out=path.join(dir,'result');
try{
  const fixture={sharePointOrigin:`https://offline-fixture-${randomUUID()}.sharepoint.com`,websiteUrl:'https://publisher.contoso.com',privacyUrl:'https://publisher.contoso.com/privacy',termsOfUseUrl:'https://publisher.contoso.com/terms'};
  await writeFile(config,JSON.stringify(fixture));
  const p=spawnSync(process.execPath,['scripts/package-pilot.mjs',config,out],{cwd:root,stdio:'inherit'});
  if(p.error)throw p.error;assert.equal(p.status,0,'Isolated pilot packaging failed.');
  const inventory=JSON.parse(await readFile(path.join(out,'package-inventory.json')));assert.equal(inventory.origin,fixture.sharePointOrigin);assert.equal(inventory.packages.length,8);
  for(const item of inventory.packages){const b=await readFile(path.join(out,item.file));assert.equal(createHash('sha256').update(b).digest('hex'),item.sha256);}
  console.log('Offline fixture: eight target-specific packages verified; no upload or sign-in. Discarding test packages.');
}finally{await rm(dir,{recursive:true,force:true});}
