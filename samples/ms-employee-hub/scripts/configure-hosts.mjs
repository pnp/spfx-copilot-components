import { resolve } from 'node:path';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { root, catalog, proof, entries, fixed, supported, publisher as reviewPublisher, json } from './host-model.mjs';
import {targetFromArgs} from './pilot-target.mjs';
import { colors, webPartIcon } from './identity-art.mjs';
import {directions,toolDescription} from './routing.mjs';

const check = process.argv.includes('--check'), full = process.argv.includes('--all');
const publisher=targetFromArgs(process.argv.slice(2))?.publisher||reviewPublisher;
const list = catalog.filter(c => full || proof.includes(c.id));
const tools = entries('copilotComponents'), parts = entries('webparts');
const real = [...tools, ...parts].filter(e => !e.placeholder);
const failures = [];
const fail = msg => { throw Error(msg); };
const put = (path, text) => {
  const dest = resolve(root, path);
  if (check) {
    if (!existsSync(dest) || readFileSync(dest, 'utf8').replace(/\r\n/g, '\n') !== text) failures.push(path);
  } else writeFileSync(dest, text);
};
const obj = (file, value) => put(file, `${JSON.stringify(value, null, 2)}\n`);
const clean = path => {
  if (existsSync(resolve(root, path))) { if (check) failures.push(path); else rmSync(resolve(root, path), { recursive: true }); }
};
if (new Set(real.map(e => e.manifest.id)).size !== real.length) fail('Duplicate manifest ID.');
if (real.some(e => !list.some(row => row.id === e.row?.id))) fail('Uncataloged or out-of-wave generator entry.');
for (const row of list) {
  if (tools.filter(e => e.row?.id === row.id).length !== 1 || parts.filter(e => e.row?.id === row.id && !e.landing).length !== 1) fail(`Missing or duplicate generated pair: ${row.tool}`);
}
if (parts.filter(e => e.landing).length !== fixed.length) fail('Missing fixed workspace.');
for (const e of real) {
  const { row, folder, alias, manifest } = e;
  const rel = '../../hosts/';
  if (e.tool) {
    manifest.tools[0].name = row.tool;
    manifest.tools[0].description.default = toolDescription(row);
    put(`${folder}/${alias}.tsx`, `import { HubCopilotComponent } from '${rel}HubCopilotComponent';\n\nexport default class ${alias} extends HubCopilotComponent {\n  protected readonly entry = ${row.id};\n}\n`);
    put(`${folder}/${alias}Properties.ts`, `import { toolSchema } from '${rel}toolSchema.js';\n\nexport default toolSchema(${row.id}, ${JSON.stringify(row.fields)});\n`);
  } else {
    manifest.supportedHosts = supported(e);
    const preset = manifest.preconfiguredEntries[0];
    preset.title.default = e.landing?.title || row.title; preset.description.default = e.landing ? `Open the fixed ${e.landing.title} workspace.` : row.description;
    preset.group.default = 'Employee Hub'; preset.iconImageUrl = webPartIcon(e); delete preset.officeFabricIconFontName;
    preset.properties = {};
    put(`${folder}/${alias}.ts`, `import { HubWebPart } from '${rel}HubWebPart';\n\nexport default class ${alias} extends HubWebPart {\n  protected readonly entry = ${row.id};\n${e.landing ? `  protected readonly landing = '${e.landing.landing}' as const;\n` : ''}}\n`);
    clean(`${folder}/assets`);
    for (const variant of ['color', 'outline']) clean(`teams/${manifest.id}_${variant}.png`);
  }
  obj(e.path, manifest);
  clean(`${folder}/components`); clean(`${folder}/loc`);
}
const placeholder = tools.find(e => e.placeholder);
// Keep the original placeholder in its own bundle until the first REAL production proof passes.
const config = json('config/config.json');
const bundle = e => ({ entrypoint: `./${e.folder.replace(/^src\//, 'lib/')}/${e.alias}.js`, manifest: `./${e.path}` });
config.bundles = Object.fromEntries([
  ...(placeholder ? [['hello-world-copilot-component', { components: [bundle(placeholder)] }]] : []),
  ['employee-hub-copilot', { components: real.filter(e => e.tool).map(bundle) }],
  ['employee-hub-webparts', { components: parts.map(bundle) }]
]);
config.localizedResources = placeholder ? { HelloWorldCopilotComponentStrings: 'lib/copilotComponents/helloWorld/loc/{locale}.js' } : {};
obj('config/config.json', config);
const agent = json('config/copilot-agent.json');
const name = 'Employee Hub', description = 'Explore workplace news, HR services, technology support and commercial insights using synthetic records.';
agent.agents = [{ name: { default: name }, description: { default: description }, components: list.map(r => tools.find(e => e.row?.id === r.id).manifest.id), toolDiscovery: 'dynamic' }];
obj('config/copilot-agent.json', agent);
const manifest = json('copilot/manifest.json');
Object.assign(manifest, { developer: publisher, name: { short: name, full: 'Microsoft Employee Hub' }, description: { short: 'Your employee workspace for information, review and simulated actions.', full: description }, accentColor: colors.agent,
  copilotAgents: { declarativeAgents: [{ id: 'employeeHubAgent', file: 'declarativeAgent.json' }] } });
obj('copilot/manifest.json', manifest);
const ai = json('copilot/ai-plugin.json');
Object.assign(ai, { namespace: 'employeeHub', name_for_human: name, description_for_human: 'Workplace, HR, technology and commercial questions in one employee hub.',
  description_for_model: 'Use the most specific authorized Employee Hub tool for the request. Do not equate reports, drafts or selections with approvals or grants. Use only visible aggregate evidence for discussion. Private records stay in the app.' });
delete ai.contact_email;
obj('copilot/ai-plugin.json', ai);
const declarative = json('copilot/declarativeAgent.json');
Object.assign(declarative, { name, description, actions: [{ id: 'employeeHubAction', file: 'ai-plugin.json' }],
  conversation_starters: json('config/conversation-starters.json').filter(s => list.some(r => r.id === s.entry)).map(({ title, text }) => ({ title, text })) });
obj('copilot/declarativeAgent.json', declarative);
put('copilot/instruction.txt', `${directions} Never infer permission or reveal private notes, pay or identifiers in chat. All data are synthetic.\n\n${list.map(c => `${c.tool}: ${c.description} Not: ${c.negative}`).join('\n')}\n`);
const solution = json('config/package-solution.json');
solution.solution.developer = { ...publisher, mpnId: '' };
solution.solution.metadata.shortDescription.default = name;
solution.solution.metadata.longDescription.default = description;
solution.solution.features[0].title = 'Employee Hub';
solution.solution.features[0].description = 'Registers the Employee Hub components and page parts.';
obj('config/package-solution.json', solution);
const serve = json('config/serve.json');
serve.initialPage = 'https://{tenantDomain}/_layouts/CopilotWorkbench.aspx';
obj('config/serve.json', serve);
if (full && placeholder) failures.push('Remove the proven HelloWorld starter before release.');
if (failures.length) fail(`Host artifacts need attention: ${failures.join(', ')}`);
console.log(`${check ? 'Validated' : 'Configured'} ${list.length} tools / ${parts.length} SPFx parts${placeholder ? ' (preserving placeholder until proof succeeds)' : ''}.`);
