import {readFileSync} from 'node:fs';
import {isIP} from 'node:net';

export function readTarget(file) {
  const config=JSON.parse(readFileSync(file,'utf8'));
  const keys=['sharePointOrigin','websiteUrl','privacyUrl','termsOfUseUrl'];
  if(!config||typeof config!=='object'||Object.keys(config).length!==keys.length||keys.some(k=>typeof config[k]!=='string'))throw Error(`Expected exactly: ${keys.join(', ')} (no credentials).`);
  const urls=Object.fromEntries(keys.map(k=>{
    const u=new URL(config[k]);
    if(u.protocol!=='https:'||u.port||u.username||u.password||u.search||u.hash||isIP(u.hostname)||!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/.test(u.hostname)||/(?:^|\.)(?:invalid|localhost|local|internal|home\.arpa|test|example|example\.(?:org|net|com))$/i.test(u.hostname))throw Error(`Supply an approved public HTTPS URL for ${k}.`);
    return [k,u];
  }));
  const {sharePointOrigin:u}=urls;
  if(u.pathname!=='/'||!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.sharepoint\.com$/.test(u.hostname)||/-(?:my|admin)\./.test(u.hostname))throw Error('Use the commercial SharePoint tenant root, not an admin, personal or site URL.');
  return {origin:u.origin,publisher:{name:'Contoso',...Object.fromEntries(keys.slice(1).map(k=>[k,urls[k].href]))}};
}
export function targetFromArgs(args) {
  if(!args.includes('--pilot'))return undefined;
  const file=args[args.indexOf('--pilot')+1];
  if(!file||file.startsWith('--'))throw Error('Missing --pilot configuration path.');
  return readTarget(file);
}
