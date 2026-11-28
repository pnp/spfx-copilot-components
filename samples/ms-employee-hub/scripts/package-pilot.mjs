import {copyFile,cp,mkdir,mkdtemp,readFile,rm,rmdir,symlink,unlink,writeFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {json,root} from './host-model.mjs';
import {readTarget} from './pilot-target.mjs';

const [file,destination,...extra]=process.argv.slice(2);
if(!file||!destination||extra.length)throw Error('Usage: npm run package:pilot -- <approved-target.json> <new-output-directory>');
const config=path.resolve(file),target=readTarget(config),out=path.resolve(destination);
const work=await mkdtemp(path.join(os.tmpdir(),'hub-build-')),modules=path.join(work,'node_modules');
let linked=false,createdOutput=false,complete=false;
const written=[];
try{
  const screenshots=json('config/package-solution.json').solution.metadata.screenshotPaths.map(p=>path.join('sharepoint',p));
  const teamsInputs=['hub','company','hr','tech','business'].flatMap(key=>['color.png','outline.png'].map(f=>`teams/${key}/${f}`));
  for(const name of ['src','config','copilot','scripts',...['Package-Plugin.ps1','manifest.json','declarativeAgent.json','ai-plugin.json','color.png','outline.png'].map(f=>`employee-hub-plugin/${f}`),...teamsInputs,...screenshots,'review/routing-cases.json','tsconfig.json','heft-plugin.json','package.json','package-lock.json','eslint.config.js','.yo-rc.json']){
    const dst=path.join(work,name);await mkdir(path.dirname(dst),{recursive:true});await cp(path.join(root,name),dst,{recursive:true});
  }
  await symlink(path.join(root,'node_modules'),modules,process.platform==='win32'?'junction':'dir');linked=true;
  const run=args=>{
    const p=spawnSync(process.execPath,args,{cwd:work,stdio:'inherit'});
    if(p.error)throw p.error;if(p.status!==0)throw Error(`${args[0]} failed (${p.status??p.signal})`);
  };
  const pilot=['--pilot',config],heft=path.join(modules,'@rushstack','heft','bin','heft');
  run(['scripts/configure-hosts.mjs','--all',...pilot]);run([heft,'test','--clean','--production']);run([heft,'package-solution','--production']);
  run(['scripts/package-teams.mjs',...pilot]);run(['scripts/package-teams.mjs','--check',...pilot]);run(['scripts/package-cowork.mjs',...pilot]);run(['scripts/audit-package.mjs','--all','--cowork',...pilot]);
  // Create the destination only after verification. An existing directory is never overwritten.
  await mkdir(out);createdOutput=true;
  const inventory=[];
  for(const name of ['sharepoint/solution/ms-employee-hub.sppkg','teams/employee-hub.zip',...['hub','company','hr','tech','business'].map(k=>`release/teams/employee-hub-${k}.zip`),'release/cowork/employee-hub-pilot.zip']){
    const from=path.join(work,name),data=await readFile(from),file=path.basename(name);
    const dst=path.join(out,file);await copyFile(from,dst,constants.COPYFILE_EXCL);written.push(dst);inventory.push({file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
  }
  await writeFile(path.join(out,'package-inventory.json'),JSON.stringify({scope:'Configured local build only; not installed or host-accepted.',origin:target.origin,publisher:target.publisher,packages:inventory},null,2)+'\n',{flag:'wx'});
  complete=true;console.log(`Built and audited ${inventory.length} artifacts in ${out}. Nothing was uploaded.`);
}finally{
  if(linked)await unlink(modules);
  await rm(work,{recursive:true,force:true});
  if(createdOutput&&!complete){for(const dst of written)await rm(dst,{force:true});await rmdir(out);}
}
