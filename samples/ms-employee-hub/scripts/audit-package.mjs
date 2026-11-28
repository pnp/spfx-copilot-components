import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { root, entries, json, catalog, proof, supported, publisher as reviewPublisher } from './host-model.mjs';
import {cases,collisions,neighbors,toolDescription} from './routing.mjs';
import {targetFromArgs} from './pilot-target.mjs';

const require = createRequire(import.meta.url), full = process.argv.includes('--all');
const rows = full ? catalog : catalog.filter(r => proof.includes(r.id));
const target=targetFromArgs(process.argv.slice(2)),publisher=target?.publisher||reviewPublisher;
const parts = entries('webparts'), tools = entries('copilotComponents').filter(e => !e.placeholder);
const solution = json('config/package-solution.json'), agentSource = json('config/copilot-agent.json').agents[0];
assert.equal(solution.solution.id, 'b847948b-8a9b-4483-b335-a6343eeb1760');
assert.equal(solution.solution.features[0].id, 'e9e76297-7307-45fc-b93d-5a2e3089bcba');
assert.equal(tools.length, rows.length); assert.equal(parts.length, rows.length + 4);
assert.equal(agentSource.toolDiscovery, 'dynamic');
const path = resolve(root, 'sharepoint/solution/ms-employee-hub.sppkg'), bytes = readFileSync(path);
assert(bytes.length < 10 * 1024 * 1024, `SPPKG exceeds 10MiB (${bytes.length} bytes). Investigate before release.`);
const packageZip = await JSZip.loadAsync(bytes), files = Object.values(packageZip.files).filter(f => !f.dir);
if (full) assert(!files.some(f => /hello.?world/i.test(f.name)), 'Stale HelloWorld package entry');
const pkgAgents = files.filter(f => /\.zip$/i.test(f.name));
assert.equal(pkgAgents.length, 1, 'Expected exactly one embedded agent ZIP, not the Teams workspaces.');
const agentBuffer = await pkgAgents[0].async('nodebuffer');
const agent = await JSZip.loadAsync(agentBuffer);
const read = async file => JSON.parse(await agent.file(file).async('string'));
const manifest = await read('manifest.json'), decl = await read('declarativeAgent.json'), plugin = await read('ai-plugin.json');
assert.deepEqual(manifest.name, json('copilot/manifest.json').name);
assert.equal(manifest.id, json('copilot/manifest.json').id);
assert.equal(json('package.json').author,'Contoso');
const xml=await packageZip.file('AppManifest.xml').async('string');
const screenshotPaths=solution.solution.metadata.screenshotPaths;
assert.equal(screenshotPaths.length,5,'Expected four workspace screenshots and one inline experience.');
assert.deepEqual([...xml.matchAll(/<Screenshot>\s*<Filename>([^<]+)<\/Filename>\s*<\/Screenshot>/g)].map(m=>m[1]),screenshotPaths.map(p=>basename(p)));
for(const p of screenshotPaths){
  const screenshot=await packageZip.file(`ClientSideAssets/${basename(p)}`).async('nodebuffer');
  assert(screenshot.equals(readFileSync(resolve(root,'sharepoint',p))),`Stale packaged screenshot: ${p}`);
}
assert(!files.some(f=>/^ClientSideAssets\/(?:[^/]+\/(?:manifest\.json|color\.png|outline\.png)|.*\.(?:md|ps1))$/i.test(f.name)),'Personal app authoring files leaked into the solution.');
const spDeveloper=JSON.parse(xml.match(/<DeveloperProperties>([^<]+)<\/DeveloperProperties>/)[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
for(const [k,v] of Object.entries(publisher))assert.equal(spDeveloper[k],v,`Packaged solution publisher: ${k}`);
assert.deepEqual(decl.conversation_starters, json('copilot/declarativeAgent.json').conversation_starters);
assert.deepEqual(decl.conversation_starters, json('config/conversation-starters.json').filter(s => rows.some(c => c.id === s.entry)).map(({ title, text }) => ({ title, text })));
assert.deepEqual(plugin.functions, []); assert.equal(plugin.schema_version, 'v2.4');
assert.equal(plugin.runtimes.length, 1);
const runtime = plugin.runtimes[0];
assert.equal(runtime.type, 'RemoteMCPServer'); assert.deepEqual(runtime.run_for_functions, ['*']);
assert.deepEqual(runtime.spec, { url: '{{TENANT_MCP_URL}}' }); assert.equal(runtime.auth.type, 'None');
for (const [key, max] of Object.entries({ name_for_human: 20, description_for_human: 100, description_for_model: 2048 })) assert(plugin[key]?.length > 0 && plugin[key].length <= max, `Invalid ${key}`);
assert(decl.instructions.length <= 8000, 'Agent instructions exceed 8,000 characters');
const {developer,...appIdentity}=manifest;
assert.equal(developer.name,'Contoso');
assert(!/HelloWorld|Contoso|Zava/i.test(JSON.stringify([appIdentity, decl, plugin])), 'Stale agent identity outside publisher metadata');
const pickerIcons=new Set();
const builtTools=new Map(),exportsByBundle=new Set();
assert.deepEqual([...agentSource.components].sort(),tools.map(e=>e.manifest.id).sort());
assert.equal(files.filter(f=>/\/(?:WebPart|CopilotComponent)_[\da-f-]+\.xml$/i.test(f.name)).length,parts.length+tools.length);
for (const e of [...parts, ...tools]) {
  const member = packageZip.file(`${solution.solution.features[0].id}/${e.manifest.componentType}_${e.manifest.id}.xml`);
  assert(member, `Actual SPPKG does not include ${e.alias}`);
  const encoded = (await member.async('string')).match(/ComponentManifest="([^"]+)"/)?.[1];
  assert(encoded, `${member.name} has no manifest`);
  const built = JSON.parse(encoded.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
  assert.equal(built.id, e.manifest.id);
  const entry = built.loaderConfig.scriptResources[built.loaderConfig.entryModuleId];
  assert(packageZip.file(`ClientSideAssets/${entry.path}`), `Missing runtime JS for ${built.alias}`);
  const namedExport=`${entry.path}:${built.loaderConfig.exportName}`;
  assert(built.loaderConfig.exportName&&!exportsByBundle.has(namedExport),`Missing or duplicated JS export: ${built.alias}`);exportsByBundle.add(namedExport);
  if (!e.tool) {
    assert.deepEqual(built.supportedHosts, supported(e));
    const preset=built.preconfiguredEntries[0],icon=preset.iconImageUrl;
    assert.equal(icon,e.manifest.preconfiguredEntries[0].iconImageUrl);
    assert.match(icon,/^data:image\/svg\+xml;base64,/);assert(!preset.officeFabricIconFontName);
    assert(!pickerIcons.has(icon),`Repeated picker icon: ${e.alias}`);pickerIcons.add(icon);continue;
  }
  assert.equal(built.tools.length,1);assert.equal(built.tools[0].name, e.row.tool);
  const description=built.tools[0].description.default;
  assert.equal(description,toolDescription(e.row));assert(!builtTools.has(e.row.id));builtTools.set(e.row.id,description);
  assert(agentSource.components.includes(built.id));
  const schema = require(resolve(root, e.folder.replace(/^src\//,'lib-commonjs/'), `${e.alias}Properties.js`)).default;
  assert.deepEqual(built.tools[0].propertiesSchema, schema, `Compiled portable schema does not match packaged ${e.row.tool}`);
  assert.deepEqual(Object.keys(schema.properties), e.row.fields);
  assert(decl.instructions.includes(e.row.tool), `Missing route ${e.row.tool}`);
}
if(full){
  for(const [a,b] of collisions)for(const [owner,excluded] of [[a,b],[b,a]]){
    const sibling=catalog.find(c=>c.id===excluded);
    assert(builtTools.get(owner).split('Related but separate tools: ')[1].replace(/\.$/,'').split(', ').includes(sibling.tool),`Packaged #${owner} missing boundary against #${excluded}`);
  }
  assert.equal(cases.length,30);assert(rows.every(c=>neighbors(c.id).length>0));
}
const hash = data => createHash('sha256').update(data).digest('hex');
const iconHashes={color:new Set(),outline:new Set()};
async function checkAppIcons(zip,app,sourceFolder){
  assert.deepEqual(app.developer,publisher);
  for(const [kind,size] of [['color',192],['outline',32]]){
    const member=app.icons[kind],b=await zip.file(member).async('nodebuffer');
    assert(b.equals(readFileSync(resolve(root,sourceFolder,member))),`Wrong ${kind} icon in ${app.name.short}`);
    assert.equal(b.readUInt32BE(0),0x89504e47);assert.equal(b.readUInt32BE(16),size);assert.equal(b.readUInt32BE(20),size);
    const digest=hash(b);assert(!iconHashes[kind].has(digest),`Shared ${kind} icon in ${app.name.short}`);iconHashes[kind].add(digest);
  }
}
await checkAppIcons(agent,manifest,'copilot');
let largest = { name: '', bytes: 0 };
for (const file of files.filter(x => /\.js$/i.test(x.name))) {
  const len = (await file.async('nodebuffer')).length;
  if (len > largest.bytes) largest = { name: file.name, bytes: len };
}
assert(largest.bytes > 0);
const personal = [];
for (const p of parts.filter(p => p.row.id === 30)) {
  const folder = p.landing?.landing || 'hub', name = `employee-hub-${folder}.zip`;
  const zip = readFileSync(resolve(root, 'release', 'teams', name));
  const archive=await JSZip.loadAsync(zip),tab=JSON.parse(await archive.file('manifest.json').async('string'));
  await checkAppIcons(archive,tab,`teams/${folder}`);
  assert.equal(tab.staticTabs[0].entityId, p.manifest.id); assert.deepEqual(tab.staticTabs[0].scopes, ['personal']);
  assert(!tab.configurableTabs && tab.id !== manifest.id); personal.push({ file: name, bytes: zip.length, sha256: hash(zip) });
}
assert.equal(new Set(parts.filter(p => p.row.id === 30).map(p => p.manifest.id)).size, 5);
if(full)assert.equal(pickerIcons.size,34);
if(process.argv.includes('--cowork')){
  const zipBytes=readFileSync(resolve(root,`release/cowork/employee-hub-${target?'pilot':'local-review'}.zip`));
  if(!target)assert(zipBytes.equals(readFileSync(resolve(root,'employee-hub-plugin/employee-hub-local-review.zip'))),'Stale Cowork distribution copy.');
  const cowork=await JSZip.loadAsync(zipBytes,{checkCRC32:true});
  assert.deepEqual(Object.keys(cowork.files).sort(),['ai-plugin.json','color.png','declarativeAgent.json','manifest.json','outline.png']);
  if(!target)for(const member of Object.values(cowork.files))assert((await member.async('nodebuffer')).equals(readFileSync(resolve(root,'employee-hub-plugin',member.name))),`Review ZIP differs from authored ${member.name}`);
  const app=JSON.parse(await cowork.file('manifest.json').async('string'));await checkAppIcons(cowork,app,'employee-hub-plugin');
  const action=JSON.parse(await cowork.file('ai-plugin.json').async('string')),spec=app.agentConnectors[0].toolSource.remoteMcpServer;
  const endpoint=`${target?.origin||'https://spfx-review.invalid'}/_api/mcp/spfx?solutionId=${solution.solution.id}`;
  assert.equal(spec.mcpServerUrl,endpoint);assert.deepEqual(action.runtimes[0].spec,{url:endpoint});assert.deepEqual(action.functions,[]);assert(!('mcpToolDescription' in spec));
  assert.equal(new Set([app.id,manifest.id,...parts.filter(p=>p.row.id===30).map(p=>p.manifest.id)]).size,7);
  const included=JSON.parse(await cowork.file('declarativeAgent.json').async('string'));
  assert.deepEqual(included.conversation_starters,decl.conversation_starters);assert.deepEqual(included,json('employee-hub-plugin/declarativeAgent.json'));
  assert.equal(iconHashes.color.size,7);assert.equal(iconHashes.outline.size,7);
}
assert(readFileSync(resolve(root,'teams/employee-hub.zip')).equals(agentBuffer),'Loose agent differs from the embedded agent.');
const inventory = { tools: tools.length, webParts: parts.length, sppkg: { bytes: bytes.length, sha256: hash(bytes) }, embedded: { file: pkgAgents[0].name, bytes: agentBuffer.length, sha256: hash(agentBuffer) }, largestJs: largest, teams: personal };
console.log(JSON.stringify(inventory, null, 2));
if (largest.bytes > 1048576) throw Error(`Investigate oversized raw JavaScript: ${largest.name} (${largest.bytes} bytes).`);
writeFileSync(resolve(root, 'release/host-package-audit.json'), JSON.stringify({ ...inventory,
  manifests: [...tools, ...parts].map(e => ({ id: e.manifest.id, alias: e.alias, entry: e.row.id,
    ...(e.tool ? { tool: e.row.tool } : { supportedHosts: supported(e) }), ...(e.landing ? { landing: e.landing.landing } : {}) }))
}, null, 2) + '\n');
