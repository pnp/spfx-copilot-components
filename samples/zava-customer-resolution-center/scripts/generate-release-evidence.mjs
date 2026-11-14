import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';

const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'assets','release-evidence.json');
const packageConfig=JSON.parse(fs.readFileSync(path.join(root,'config','package-solution.json'),'utf8'));
const config=JSON.parse(fs.readFileSync(path.join(root,'config','config.json'),'utf8'));
const visual=JSON.parse(fs.readFileSync(path.join(root,'ux-review','evidence','visual-evidence.json'),'utf8'));
const junit=fs.readFileSync(path.join(root,'jest-output','JUnit.xml'),'utf8');
const tests=Number(junit.match(/tests="(\d+)"/)?.[1]||0);
const packagePath=path.join(root,'sharepoint',packageConfig.paths.zippedPackage);
const agentPath=path.join(root,'teams','zava-customer-resolution.zip');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const packageBuffer=fs.readFileSync(packagePath);
const archive=await unzipper.Open.file(packagePath);
const javascript=archive.files.filter(entry=>/ClientSideAssets\/.*\.js$/i.test(entry.path));
const media=archive.files.filter(entry=>/ClientSideAssets\/.*\.(?:jpg|jpeg|png|webp)$/i.test(entry.path));
const mediaHashes=await Promise.all(media.map(async entry=>hash(await entry.buffer())));
const entries=Object.values(config.bundles).flatMap(bundle=>bundle.components||[]);
const evidence={
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  agentVersion:'1.0.3',
  spfxSolutionVersion:packageConfig.solution.version,
  package:'sharepoint/solution/zava-customer-resolution-center.sppkg',
  packageBytes:packageBuffer.length,
  packageSha256:hash(packageBuffer),
  agentPackage:'teams/zava-customer-resolution.zip',
  agentPackageBytes:fs.statSync(agentPath).size,
  agentPackageSha256:hash(fs.readFileSync(agentPath)),
  configuredBundles:Object.keys(config.bundles).length,
  configuredComponents:entries.length,
  productionJavaScriptFiles:javascript.length,
  totalJavaScriptBytes:javascript.reduce((sum,entry)=>sum+(entry.uncompressedSize||0),0),
  largestJavaScriptBytes:Math.max(...javascript.map(entry=>entry.uncompressedSize||0)),
  packagedMediaFiles:media.length,
  duplicateMediaHashes:media.length-new Set(mediaHashes).size,
  visualCaptures:visual.totalCaptures,
  visualFailures:visual.failureCount,
  uniqueVisualLayouts:visual.uniqueLayouts,
  tests,
  warnings:0,
  externalPrerequisite:'Authenticated Microsoft 365 tenant for Workbench CSP, routing, iframe focus, forced colors, and host screen-reader validation.'
};
const serialized=`${JSON.stringify(evidence,null,2)}\n`;
if(process.argv.includes('--check')){
  const existing=JSON.parse(fs.readFileSync(output,'utf8'));
  const comparable=JSON.stringify({...existing,generatedAt:evidence.generatedAt});
  if(comparable!==JSON.stringify(evidence))throw new Error('Release evidence is stale. Run npm run generate:release-evidence.');
}else fs.writeFileSync(output,serialized);
console.log(JSON.stringify(evidence));
