import {execFileSync} from 'node:child_process';
import {copyFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {targetFromArgs} from './pilot-target.mjs';

const args=process.argv.slice(2);
if(!(args.length===1&&args[0]==='--review'||args.length===2&&args[0]==='--pilot'))throw Error('Use --review or --pilot <approved-config.json>.');
const target=targetFromArgs(args),root=fileURLToPath(new URL('../',import.meta.url));
const dir=path.join(root,'employee-hub-plugin'),release=path.join(root,'release','cowork');
await mkdir(release,{recursive:true});
const flags=target?['-TenantUrl',target.origin,'-WebsiteUrl',target.publisher.websiteUrl,'-PrivacyUrl',target.publisher.privacyUrl,'-TermsOfUseUrl',target.publisher.termsOfUseUrl,'-OutputPath',path.join(release,'employee-hub-pilot.zip')]:['-Review'];
execFileSync(process.platform==='win32'?'powershell.exe':'pwsh',['-NoProfile','-NonInteractive','-File',path.join(dir,'Package-Plugin.ps1'),...flags],{stdio:'inherit'});
if(!target)await copyFile(path.join(dir,'employee-hub-local-review.zip'),path.join(release,'employee-hub-local-review.zip'));
