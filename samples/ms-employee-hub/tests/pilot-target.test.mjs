import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readTarget} from '../scripts/pilot-target.mjs';

test('pilot packaging rejects review placeholders, credentials and non-root tenant URLs',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'hub-config-')),file=path.join(dir,'target.json');
  const good={sharePointOrigin:'https://synthetic-offline-fixture.sharepoint.com',websiteUrl:'https://publisher.contoso.com',privacyUrl:'https://publisher.contoso.com/privacy',termsOfUseUrl:'https://publisher.contoso.com/terms'};
  try{
    await writeFile(file,JSON.stringify(good));assert.equal(readTarget(file).origin,good.sharePointOrigin);
    for(const override of [{privacyUrl:'https://example.invalid/privacy'},{websiteUrl:'https://127.0.0.1'},{websiteUrl:'https://machine.local'},{websiteUrl:'https://user:pass@publisher.contoso.com'},{websiteUrl:'http://publisher.contoso.com'},{sharePointOrigin:good.sharePointOrigin+'/sites/pilot'},{sharePointOrigin:'https://sim-admin.sharepoint.com'},{sharePointOrigin:'https://spfx-review.invalid'},{secret:'never'}]){
      await writeFile(file,JSON.stringify({...good,...override}));assert.throws(()=>readTarget(file));
    }
  }finally{await rm(file,{force:true});await rm(dir,{recursive:true});}
});
