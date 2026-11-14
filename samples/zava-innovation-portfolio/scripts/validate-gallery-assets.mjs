import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const assets=path.join(root,'assets');
const sample=JSON.parse(fs.readFileSync(path.join(assets,'sample.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(assets,'gallery-evidence.json'),'utf8'));
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
assert(Array.isArray(sample)&&sample.length===1,'sample.json must contain exactly one sample.');
const entry=sample[0];
for(const key of ['name','source','title','shortDescription','url','downloadUrl','creationDateTime','updateDateTime'])assert(typeof entry[key]==='string'&&entry[key].trim(),`sample.json ${key} is required.`);
assert(entry.source==='pnp','sample.json source must be pnp.');
assert(Array.isArray(entry.longDescription)&&entry.longDescription.length>=3,'sample.json requires three long-description paragraphs.');
assert(entry.products?.includes('SharePoint')&&entry.products?.includes('Copilot'),'Products must include SharePoint and Copilot.');
assert(entry.authors?.length>0&&entry.references?.length>0,'Authors and references are required.');
const metadata=new Map((entry.metadata||[]).map(item=>[item.key,item.value]));
assert(metadata.get('SAMPLE-TYPE')==='SPFx-CopilotComponent','SAMPLE-TYPE metadata is invalid.');
assert(metadata.get('CLIENT-SIDE-DEV')==='React','CLIENT-SIDE-DEV metadata is invalid.');
assert(metadata.get('SPFX-VERSION')==='1.24.0','SPFX-VERSION metadata is invalid.');
assert(evidence.schemaVersion===1&&evidence.failureCount===0,'Gallery evidence is invalid or contains failures.');
const currentSourceHash=hash(Buffer.concat(evidence.sourceFiles.map(file=>fs.readFileSync(path.join(root,file)))));
assert(currentSourceHash===evidence.sourceSha256,'Gallery screenshots are stale relative to current UX source. Run npm run capture:visual.');
const evidenceByName=new Map(evidence.captures.map(capture=>[capture.name,capture]));
const thumbnails=entry.thumbnails||[];
assert(thumbnails.length===evidence.totalCaptures,`Expected ${evidence.totalCaptures} thumbnails, found ${thumbnails.length}.`);
assert(new Set(thumbnails.map(item=>item.name)).size===thumbnails.length,'Thumbnail names must be unique.');
assert(new Set(thumbnails.map(item=>item.order)).size===thumbnails.length,'Thumbnail orders must be unique.');
for(const thumbnail of thumbnails){
  assert(thumbnail.type==='image',`${thumbnail.name} must use type image.`);
  assert(typeof thumbnail.alt==='string'&&thumbnail.alt.length>=30,`${thumbnail.name} needs descriptive alt text.`);
  const capture=evidenceByName.get(thumbnail.name);
  assert(capture,`${thumbnail.name} is absent from gallery evidence.`);
  const file=path.join(assets,thumbnail.name);
  assert(fs.existsSync(file),`Gallery image is missing: ${thumbnail.name}.`);
  const bytes=fs.readFileSync(file);
  assert(bytes.length>24&&bytes.subarray(1,4).toString('ascii')==='PNG',`${thumbnail.name} is not a valid PNG.`);
  assert(bytes.readUInt32BE(16)===capture.capturedWidth&&bytes.readUInt32BE(20)===capture.capturedHeight,`${thumbnail.name} dimensions drifted from evidence.`);
  assert(hash(bytes)===capture.sha256,`${thumbnail.name} bytes drifted from evidence.`);
  assert(thumbnail.url===`https://github.com/VesaJuvonen/spfx-copilot-components/raw/main/samples/zava-innovation-portfolio/assets/${thumbnail.name}`,`${thumbnail.name} raw URL is invalid.`);
}
assert([...evidenceByName.keys()].every(name=>thumbnails.some(item=>item.name===name)),'Gallery evidence contains an unlisted publication capture.');
const intentEvidence=JSON.parse(fs.readFileSync(path.join(assets,'intent-evidence.json'),'utf8'));
assert(intentEvidence.failureCount===0&&intentEvidence.runtimeErrors.length===0,'Intent evidence contains runtime failures.');
assert(intentEvidence.sourceSha256===currentSourceHash,'Supplementary intent visuals are stale. Run npm run capture:visual.');
assert(hash(Buffer.concat(intentEvidence.sourceFiles.map(file=>fs.readFileSync(path.join(root,file)))))===currentSourceHash,'Intent evidence source list differs from the curated gallery.');
const tools=fs.readdirSync(path.join(root,'src','copilotComponents')).map(folder=>{
  const file=fs.readdirSync(path.join(root,'src','copilotComponents',folder)).find(name=>name.endsWith('.manifest.json'));
  return JSON.parse(fs.readFileSync(path.join(root,'src','copilotComponents',folder,file),'utf8')).tools[0].name;
});
const flows=['SubmitInnovationIdea','BuildIdeaBusinessCase','CelebrateInnovationImpact','ReviewInnovationFunding','GenerateInnovationBrief','LaunchInnovationChallenge','ManageInnovationExperiment'];
for(const tool of tools)for(const variant of ['standard','narrow','dark']){
  assert(intentEvidence.captures.some(capture=>capture.intent===tool&&capture.state==='initial'&&capture.variant===variant),`Missing ${tool} ${variant} initial visual.`);
  if(flows.includes(tool))for(const state of ['review','receipt'])assert(intentEvidence.captures.some(capture=>capture.intent===tool&&capture.state===state&&capture.variant===variant),`Missing ${tool} ${variant} ${state} visual.`);
}
for(const capture of intentEvidence.captures){
  const bytes=fs.readFileSync(path.join(assets,capture.name));
  assert(hash(bytes)===capture.sha256&&bytes.length===capture.bytes,`Supplementary image drift: ${capture.name}`);
}
console.log(`Verified PnP gallery metadata and ${thumbnails.length} current-source implementation screenshots.`);
console.log(`Verified ${intentEvidence.totalCaptures} supplementary screenshots for all ${tools.length} tools.`);
