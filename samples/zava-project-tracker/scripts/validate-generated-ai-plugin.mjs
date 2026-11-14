import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import appManifestPackage from '@microsoft/app-manifest';
import unzipper from 'unzipper';

const { AppManifestUtils } = appManifestPackage;
const root = path.resolve(import.meta.dirname, '..');
const agentZipPath = path.join(
  root,
  'sharepoint',
  'solution',
  'debug',
  'ClientSideAssets',
  'zava-ai-project-portfolio-agent.zip'
);
const STRING_LIMIT = 4000;
const METADATA_LIMITS = {
  name_for_human: 20,
  description_for_human: 100,
  description_for_model: 2048
};
const ALLOWED_PLACEHOLDERS = new Set(['{{TENANT_MCP_URL}}', '{{TENANT_ORIGIN}}']);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertString(value, label, maximum = STRING_LIMIT) {
  assert(typeof value === 'string' && value.trim().length > 0, `${label} must be a nonempty string.`);
  assert([...value].length <= maximum, `${label} exceeds the ${maximum}-character limit.`);
}

function assertOnlyKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    assert(allowed.has(key), `${label} contains unsupported keyword '${key}'.`);
  }
}

function assertPublishedStringLimits(value, label = 'plugin') {
  if (typeof value === 'string') {
    if (!ALLOWED_PLACEHOLDERS.has(value)) {
      assert([...value].length <= STRING_LIMIT, `${label} exceeds the ${STRING_LIMIT}-character plugin string limit.`);
      assert(!value.includes('{{') && !value.includes('}}'), `${label} contains an unsupported deployment placeholder.`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertPublishedStringLimits(item, `${label}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => assertPublishedStringLimits(item, `${label}.${key}`));
  }
}

assert(fs.existsSync(agentZipPath), `Generated agent package not found at ${agentZipPath}. Run a production build and package-solution first.`);
const archive = await unzipper.Open.file(agentZipPath);
const pluginEntry = archive.files.find((entry) => entry.path === 'ai-plugin.json');
assert(pluginEntry, `Generated agent package ${agentZipPath} does not contain ai-plugin.json.`);
const plugin = JSON.parse((await pluginEntry.buffer()).toString('utf8'));
assert(plugin.$schema === 'https://developer.microsoft.com/json-schemas/copilot/plugin/v2.4/schema.json', 'Generated API plugin must target the v2.4 schema.');
assert(plugin.schema_version === 'v2.4', 'Generated API plugin schema_version must be v2.4.');
for (const [key, limit] of Object.entries(METADATA_LIMITS)) {
  if (plugin[key] !== undefined) {
    assertString(plugin[key], key, limit);
  }
}
assert(/^[A-Za-z0-9-]+$/.test(plugin.namespace), 'Plugin namespace contains unsupported characters.');
assertPublishedStringLimits(plugin);

const pluginWithoutPreviewRuntime = structuredClone(plugin);
delete pluginWithoutPreviewRuntime.runtimes;
const schemaErrors = await AppManifestUtils.validateAgainstSchema(pluginWithoutPreviewRuntime);
assert(schemaErrors.length === 0, `Generated API plugin metadata/functions fail Microsoft v2.4 schema validation:\n${schemaErrors.join('\n')}`);

assert(Array.isArray(plugin.functions) && plugin.functions.length === 0, 'SPFx 1.24 GA dynamic discovery must not embed static functions.');

const remoteRuntimes = (plugin.runtimes || []).filter((runtime) => runtime.type === 'RemoteMCPServer');
assert(remoteRuntimes.length === 1, `Expected one RemoteMCPServer runtime, found ${remoteRuntimes.length}.`);
const runtime = remoteRuntimes[0];
assertOnlyKeys(runtime, new Set(['type', 'auth', 'run_for_functions', 'spec', 'output_template']), 'RemoteMCPServer runtime');
assert(runtime.auth?.type === 'None', 'Generated RemoteMCPServer runtime must use deployment-managed authentication type None.');
const runtimeUrl = runtime.spec?.url;
assert(runtimeUrl === '{{TENANT_MCP_URL}}' || URL.canParse(runtimeUrl), 'RemoteMCPServer URL must be the deployment placeholder or an absolute URL.');
assertOnlyKeys(runtime.spec, new Set(['url']), 'RemoteMCPServer dynamic discovery spec');
assert(Array.isArray(runtime.run_for_functions) && runtime.run_for_functions.length === 1 && runtime.run_for_functions[0] === '*', 'Dynamic discovery must route all discovered functions through the MCP runtime.');

console.log('Verified generated API plugin v2.4 dynamic MCP tool discovery and published string limits.');

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
