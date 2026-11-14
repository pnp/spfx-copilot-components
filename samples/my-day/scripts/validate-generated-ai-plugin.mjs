import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import unzipper from 'unzipper';

const root = path.resolve(import.meta.dirname, '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const folder = path.join(root, 'sharepoint', 'solution', 'debug', 'ClientSideAssets');
const zipFiles = fs.readdirSync(folder).filter(name => name.endsWith('.zip'));
assert.equal(zipFiles.length, 1, 'Expected one generated agent ZIP.');
const archive = await unzipper.Open.file(path.join(folder, zipFiles[0]));
async function entry(name) {
  const file = archive.files.find(item => item.path === name);
  assert(file, `Missing generated ${name}`);
  return JSON.parse((await file.buffer()).toString('utf8'));
}
const plugin = await entry('ai-plugin.json');
assert.equal(plugin.$schema, 'https://developer.microsoft.com/json-schemas/copilot/plugin/v2.4/schema.json');
assert.equal(plugin.schema_version, 'v2.4');
assert.deepEqual(plugin.functions, []);
assert.equal(plugin.runtimes.length, 1);
const runtime = plugin.runtimes[0];
assert.equal(runtime.type, 'RemoteMCPServer');
assert.deepEqual(runtime.run_for_functions, ['*']);
assert.deepEqual(runtime.spec, { url: '{{TENANT_MCP_URL}}' });
assert.equal(runtime.auth.type, 'None');
for (const [name, maximum] of [['name_for_human', 20], ['description_for_human', 100], ['description_for_model', 2048]]) {
  assert(typeof plugin[name] === 'string' && plugin[name].trim() && [...plugin[name]].length <= maximum, `Invalid ${name}`);
}
const agent = await entry('declarativeAgent.json');
const canonical = read(path.join('config', 'conversation-starters.json')).starters;
const prompts = canonical.map(({ title, text }) => ({ title, text }));
assert.deepEqual(agent.conversation_starters, prompts);
assert.deepEqual(read(path.join('copilot', 'declarativeAgent.json')).conversation_starters, prompts);
assert.equal(new Set(canonical.map(starter => starter.text)).size, canonical.length);
const require = createRequire(path.join(root, 'package.json'));
const schema = require(path.join(root, 'lib-commonjs', 'copilotComponents', 'myDay', 'MyDayCopilotComponentProperties.js')).default;
assert(!schema.required?.length, 'My Day must accept a useful empty invocation.');
assert(!schema.properties.message, 'Unused message input must not be advertised.');
assert(schema.properties.focus.description, 'Focus needs a meaningful extraction description.');
const manifest = read(path.join('src', 'copilotComponents', 'myDay', 'MyDayCopilotComponent.manifest.json'));
assert.equal(manifest.tools[0].name, 'MyDayTool');
assert.deepEqual(read(path.join('config', 'copilot-agent.json')).agents[0].components, [manifest.id]);
for (const starter of canonical) {
  assert.equal(starter.tool, 'MyDayTool');
  assert(schema.properties.focus.enum.includes(starter.properties.focus), 'Starter has an unsupported focus.');
}
assert.equal(new Set(canonical.map(starter => starter.properties.focus)).size, canonical.length, 'Single-tool starter focuses must be distinct.');
const instructions = fs.readFileSync(path.join(root, 'copilot', 'instruction.txt'), 'utf8').replace(/\r\n/g, '\n').trim();
assert(instructions.includes('MyDayTool'));
assert(agent.instructions.replace(/\r\n/g, '\n').includes(instructions), 'Packaged instructions are stale.');
console.log('Verified GA dynamic MCP discovery and four distinct visible starter focuses owned by MyDayTool.');
