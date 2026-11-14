import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const assert=(value,message)=>{if(!value)throw new Error(message)};
const normalize=value=>value.toLowerCase().replace(/\s+/g,' ').trim();
const collisionConfig=JSON.parse(fs.readFileSync(path.join(root,'config','routing-collisions.json'),'utf8'));
const starters=JSON.parse(fs.readFileSync(path.join(root,'config','conversation-starters.json'),'utf8')).starters;
const manifests=fs.readdirSync(path.join(root,'src','copilotComponents'),{withFileTypes:true})
  .filter(item=>item.isDirectory())
  .flatMap(item=>{const folder=path.join(root,'src','copilotComponents',item.name);const file=fs.readdirSync(folder).find(name=>name.endsWith('CopilotComponent.manifest.json'));return file?[JSON.parse(fs.readFileSync(path.join(folder,file),'utf8'))]:[];});
const descriptions=new Map(manifests.map(manifest=>[manifest.tools[0].name,normalize(manifest.tools[0].description.default)]));
const tools=new Set(descriptions.keys());
const cases=collisionConfig.cases;
assert(cases.length>=16,`Expected at least 16 collision cases, received ${cases.length}.`);
assert(new Set(cases.map(item=>item.id)).size===cases.length,'Collision case IDs must be unique.');
assert(new Set(cases.map(item=>normalize(item.prompt))).size===cases.length,'Collision prompts must be unique after normalization.');
assert(new Set(starters.map(item=>normalize(item.text))).size===starters.length,'Conversation starter prompts must be unique.');
assert(new Set(starters.map(item=>item.tool)).size===starters.length,'Each conversation starter must target a different tool.');
for(const test of cases){
  assert(tools.has(test.expectedTool),`${test.id}: unknown expected tool ${test.expectedTool}.`);
  assert(test.excludedTools.length>0,`${test.id}: at least one nearest sibling is required.`);
  assert(!test.excludedTools.includes(test.expectedTool),`${test.id}: expected tool cannot be excluded.`);
  for(const sibling of test.excludedTools)assert(tools.has(sibling),`${test.id}: unknown excluded tool ${sibling}.`);
  const description=descriptions.get(test.expectedTool);
  const [positive,boundary='']=description.split('do not use ');
  for(const term of test.positiveTerms)assert(positive.includes(normalize(term)),`${test.id}: ${test.expectedTool} positive trigger is missing “${term}”.`);
  for(const term of test.boundaryTerms)assert(boundary.includes(normalize(term)),`${test.id}: ${test.expectedTool} negative boundary is missing “${term}”.`);
}
for(const starter of starters){
  const match=cases.find(item=>normalize(item.prompt)===normalize(starter.text));
  assert(match,`Starter “${starter.title}” has no collision case.`);
  assert(match.expectedTool===starter.tool,`Starter “${starter.title}” targets ${starter.tool}, but collision matrix expects ${match.expectedTool}.`);
}
const flagshipTools=new Set(starters.map(item=>item.tool));
assert(starters.length===6&&flagshipTools.size===6,'Expected six unique starter tools.');
assert(starters[5].tool==='ExploreAgentCapabilities','The sixth starter must own capability discovery.');
assert(starters.slice(0,5).every(item=>item.tool!=='ExploreAgentCapabilities'),'First five starters must own operational UX.');
console.log(JSON.stringify({collisionCases:cases.length,starters:starters.length,uniqueStarterTools:flagshipTools.size,descriptions:descriptions.size,configurationCollisions:0,hostRoutingPrerequisite:'Rehearse prompts in fresh Copilot conversations before public release.'}));
