import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';

const root=path.resolve(import.meta.dirname,'..');
const zip=path.join(root,'teams','zava-customer-resolution.zip');
if(!fs.existsSync(zip))throw new Error('Generated agent ZIP is missing.');
const archive=await unzipper.Open.file(zip);
const entry=archive.files.find(item=>item.path==='ai-plugin.json');
if(!entry)throw new Error('Generated ai-plugin.json is missing.');
const plugin=JSON.parse((await entry.buffer()).toString('utf8'));
const manifestEntry=archive.files.find(item=>item.path==='manifest.json');
if(!manifestEntry)throw new Error('Generated Teams manifest is missing.');
const manifest=JSON.parse((await manifestEntry.buffer()).toString('utf8'));
const functions=plugin.functions||[];
const assert=(value,message)=>{if(!value)throw new Error(message)};
assert(plugin.schema_version==='v2.4','Generated plugin must use v2.4.');
assert(manifest.version==='1.0.3',`Expected agent version 1.0.3, received ${manifest.version}.`);
assert(plugin.name_for_human.length<=20,'name_for_human exceeds 20 characters.');
assert(plugin.description_for_human.length<=100,'description_for_human exceeds 100 characters.');
assert(plugin.description_for_model.length<=2048,'description_for_model exceeds 2,048 characters.');
assert(Array.isArray(plugin.functions)&&functions.length===0,'GA must use dynamic discovery, not static functions.');
assert(plugin.runtimes?.length===1&&plugin.runtimes[0].type==='RemoteMCPServer','Expected one RemoteMCPServer runtime.');
assert(JSON.stringify(plugin.runtimes[0].run_for_functions)==='["*"]','Dynamic discovery must route all tools.');
assert(JSON.stringify(Object.keys(plugin.runtimes[0].spec))==='["url"]','Dynamic discovery spec must contain only the URL.');
assert(plugin.runtimes[0].spec.url==='{{TENANT_MCP_URL}}'&&plugin.runtimes[0].auth.type==='None','Unexpected deployment-managed MCP endpoint/authentication.');
assert(archive.files.some(item=>item.path==='declarativeAgent.json'),'Generated declarative agent is missing.');
console.log(JSON.stringify({schema:plugin.schema_version,agentVersion:manifest.version,functions:0,dynamicDiscovery:true,nameLength:plugin.name_for_human.length,agentFiles:archive.files.length}));

function collectStarterToolNames(directory, names = new Set()) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collectStarterToolNames(file, names);
    else if (entry.name.endsWith('CopilotComponent.manifest.json')) {
      const parsed = ts.parseConfigFileTextToJson(file, fs.readFileSync(file, 'utf8'));
      assert(!parsed.error, `Invalid source manifest: ${file}`);
      for (const tool of parsed.config.tools || []) {
        assert(!names.has(tool.name), `Duplicate source tool: ${tool.name}`);
        names.add(tool.name);
      }
    }
  }
  return names;
}
const canonicalStarters = JSON.parse(fs.readFileSync(path.join(root, 'config', 'conversation-starters.json'), 'utf8')).starters;
const sourceAgent = JSON.parse(fs.readFileSync(path.join(root, 'copilot', 'declarativeAgent.json'), 'utf8'));
const expectedStarters = canonicalStarters.map(({ title, text }) => ({ title, text }));
assert(JSON.stringify(sourceAgent.conversation_starters) === JSON.stringify(expectedStarters), 'Source starters differ from canonical targets.');
const declaredStarterTools = collectStarterToolNames(path.join(root, 'src', 'copilotComponents'));
const starterTargets = canonicalStarters.map(starter => starter.tool || starter.targetName);
assert(canonicalStarters.length === 6, 'Exactly six conversation starters are required.');
const explorerTargets = [...declaredStarterTools].filter(name => /^ExploreAgentCapabilities(?:Tool)?$/.test(name));
assert(explorerTargets.length === 1, 'Exactly one dedicated capability-explorer tool must be registered.');
assert(starterTargets[5] === explorerTargets[0], 'Starter 6 must target the dedicated feature explorer.');
assert(starterTargets.slice(0, 5).every(target => target !== explorerTargets[0]), 'Starters 1-5 must target operational components.');
assert(new Set(canonicalStarters.map(starter => starter.title.trim().toLowerCase())).size === 6, 'Starter titles must be distinct.');
assert(new Set(starterTargets).size === starterTargets.length, 'Starter targets must be distinct.');
assert(new Set(canonicalStarters.map(starter => starter.text.toLowerCase().replace(/\s+/g, ' ').trim())).size === canonicalStarters.length, 'Starter prompts must be distinct.');
const sourceInstructions = fs.readFileSync(path.join(root, 'copilot', 'instruction.txt'), 'utf8').replace(/\r\n/g, '\n').trim();
for (const target of starterTargets) {
  assert(declaredStarterTools.has(target), `Unknown starter target: ${target}`);
  assert(sourceInstructions.includes(target), `Agent instructions do not name starter target: ${target}`);
}
const generatedAgentEntry = archive.files.find(entry => entry.path === 'declarativeAgent.json');
assert(generatedAgentEntry, 'Generated declarative agent is missing.');
const generatedAgent = JSON.parse((await generatedAgentEntry.buffer()).toString('utf8'));
assert(JSON.stringify(generatedAgent.conversation_starters) === JSON.stringify(expectedStarters), 'Packaged starter prompts are stale.');
assert(generatedAgent.instructions.replace(/\r\n/g, '\n').includes(sourceInstructions), 'Packaged instructions are stale.');
console.log('Canonical starter ownership verified against source and packaged agent.');
