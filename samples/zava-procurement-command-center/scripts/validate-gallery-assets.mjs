import crypto from 'node:crypto';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),assets=path.join(root,'assets');
const sample=JSON.parse(fs.readFileSync(path.join(assets,'sample.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(assets,'gallery-evidence.json'),'utf8'));
const failures=[];
if(!Array.isArray(sample)||sample.length!==1)failures.push('sample.json must contain one sample');
const item=sample[0]||{};
if(item.name!=='pnp-sp-dev-spfx-copilot-components-zava-procurement-command-center')failures.push('invalid sample name');
if(!Array.isArray(item.thumbnails)||item.thumbnails.length<8)failures.push('at least eight thumbnails required');
if(evidence.captureCount!==84||evidence.captures.length!==84)failures.push(`expected 84 captures, found ${evidence.captures.length}`);
const names=new Set(),layouts=new Set();
for(const capture of evidence.captures){const file=path.join(assets,capture.fileName);if(names.has(capture.fileName))failures.push(`duplicate capture ${capture.fileName}`);names.add(capture.fileName);layouts.add(capture.layout);if(!fs.existsSync(file)){failures.push(`missing ${capture.fileName}`);continue;}const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(hash!==capture.sha256)failures.push(`hash mismatch ${capture.fileName}`);if(capture.errors.length||capture.overflow||!capture.buttons||!capture.focus||!capture.inputsLabeled||capture.brokenImages||capture.experience!==capture.intent)failures.push(`failed evidence ${capture.fileName}`);}
for(const thumbnail of item.thumbnails||[]){if(!names.has(thumbnail.name))failures.push(`thumbnail lacks current evidence: ${thumbnail.name}`);if(!thumbnail.alt||thumbnail.alt.length<30)failures.push(`weak alt text: ${thumbnail.name}`);if(!thumbnail.url.endsWith(`/assets/${thumbnail.name}`))failures.push(`invalid thumbnail URL: ${thumbnail.name}`);}
for(const required of ['my-requests-command','sourcing-command','supplier-360-command','spend-command-command'])if(!layouts.has(required))failures.push(`missing workspace layout ${required}`);
if(failures.length)throw new Error(failures.join('; '));console.log(`Gallery validation passed: ${evidence.captureCount} hashed captures, ${item.thumbnails.length} publication thumbnails, four workspace layouts.`);