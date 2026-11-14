import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const componentsRoot = path.join(root, 'src', 'copilotComponents');
const manifests = [];

for (const entry of fs.readdirSync(componentsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'shared' || entry.name === 'projectTracker') {
    continue;
  }
  const folder = path.join(componentsRoot, entry.name);
  const manifestName = fs.readdirSync(folder).find((file) => file.endsWith('CopilotComponent.manifest.json'));
  const propertiesName = fs.readdirSync(folder).find((file) => file.endsWith('CopilotComponentProperties.ts'));
  if (!manifestName || !propertiesName) {
    throw new Error(`Incomplete generated component in ${entry.name}.`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, manifestName), 'utf8'));
  const properties = fs.readFileSync(path.join(folder, propertiesName), 'utf8');
  const tools = Array.isArray(manifest.tools) ? manifest.tools : [];
  const displayModes = manifest.capabilities?.availableDisplayModes || [];
  if (tools.length !== 1) {
    throw new Error(`${entry.name} must expose exactly one tool.`);
  }
  if (displayModes.length !== 2 || !displayModes.includes('inline') || !displayModes.includes('fullscreen')) {
    throw new Error(`${entry.name} must expose exactly inline and fullscreen display modes.`);
  }
  const fields = [...properties.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*):/gm)].map((match) => match[1]);
  if (fields.some((field) => !new RegExp(`\\b${field}:.*\\.optional\\(\\)`).test(properties))) {
    throw new Error(`${entry.name} contains a non-optional prompt property.`);
  }
  if (fields.includes('message')) {
    throw new Error(`${entry.name} still contains the scaffold message property.`);
  }
  manifests.push({
    id: manifest.id,
    tool: tools[0].name,
    description: tools[0].description.default,
    fields
  });
}

const config = JSON.parse(fs.readFileSync(path.join(root, 'config', 'config.json'), 'utf8'));
const agent = JSON.parse(fs.readFileSync(path.join(root, 'config', 'copilot-agent.json'), 'utf8'));
const declarativeAgent = JSON.parse(fs.readFileSync(path.join(root, 'copilot', 'declarativeAgent.json'), 'utf8'));
const instructions = fs.readFileSync(path.join(root, 'copilot', 'instruction.txt'), 'utf8');
const starters = declarativeAgent.conversation_starters || [];
const bundleEntries = Object.values(config.bundles).flatMap((bundle) => bundle.components || []);
const bundledManifestNames = bundleEntries.map((entry) => path.basename(entry.manifest));
const sourceManifestNames = fs.readdirSync(componentsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'shared' && entry.name !== 'projectTracker')
  .flatMap((entry) => fs.readdirSync(path.join(componentsRoot, entry.name)).filter((file) => file.endsWith('CopilotComponent.manifest.json')));

const assertions = [
  [manifests.length === 31, `Expected 31 manifests, found ${manifests.length}.`],
  [new Set(manifests.map((item) => item.id)).size === 31, 'Manifest GUIDs are not unique.'],
  [new Set(manifests.map((item) => item.tool)).size === 31, 'Tool names are not unique.'],
  [new Set(manifests.map((item) => item.description)).size === 31, 'Tool descriptions are not unique.'],
  [manifests.every((item) => item.description.length >= 40 && !/ description$/i.test(item.description)), 'A tool still has placeholder or weak description text.'],
  [Object.keys(config.bundles).length === 1, 'All Copilot Components must share one production bundle.'],
  [bundleEntries.length === 31, `Expected 31 bundled component entries, found ${bundleEntries.length}.`],
  [new Set(bundledManifestNames).size === 31, 'A component manifest is duplicated in the shared bundle.'],
  [sourceManifestNames.every((name) => bundledManifestNames.includes(name)), 'A component manifest is missing from the shared bundle.'],
  [Object.keys(config.localizedResources).length === 31, 'Localized-resource count does not match the catalog.'],
  [agent.agents[0].components.length === 31, 'Agent registration count does not match the catalog.'],
  [new Set(agent.agents[0].components).size === 31, 'Agent registrations are not unique.'],
  [manifests.every((item) => agent.agents[0].components.includes(item.id)), 'A manifest GUID is missing from the agent registration.'],
  [starters.length === 6, `Expected exactly 6 conversation starters, found ${starters.length}.`],
  [starters[5]?.title === 'Explore what this agent can do', 'The final conversation starter must open capability exploration.'],
  [starters[5]?.text === 'Show me the project and portfolio scenarios you can help with.', 'The final capability starter prompt is incorrect.'],
  [instructions.includes('ExploreAgentCapabilities'), 'Agent instructions do not route capability prompts to ExploreAgentCapabilities.']
];

for (const [passed, message] of assertions) {
  if (!passed) {
    throw new Error(message);
  }
}

console.log(`Verified ${manifests.length} unique intent components and ${manifests.reduce((count, item) => count + item.fields.length, 0)} optional prompt fields.`);
