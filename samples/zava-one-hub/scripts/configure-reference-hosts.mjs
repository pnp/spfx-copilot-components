import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { EOL } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zavaCapabilityCatalog } from '../config/zava-capabilities.mjs';
import { normalizeNewlines } from './generated-text.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const fluentIcons = require('@fluentui/react-icons');

const capabilityIconNames = {
  myDay: 'WeatherSunny24Regular', agenda: 'CalendarAgenda24Regular', importantMail: 'MailAlert24Regular', tasks: 'ClipboardTaskListLtr24Regular', approvals: 'ApprovalsApp24Regular',
  companyNews: 'News24Regular', announcements: 'Alert24Regular', knowledge: 'BookInformation24Regular', employeeServices: 'Apps24Regular', companyEvents: 'Calendar24Regular', people: 'People24Regular',
  onboarding: 'Rocket24Regular', learning: 'LearningApp24Regular', recognition: 'Star24Regular', surveys: 'Poll24Regular', timeOff: 'CalendarCheckmark24Regular', payDocuments: 'Document24Regular',
  benefits: 'HeartPulse24Regular', equity: 'Money24Regular', expensesTravel: 'ReceiptMoney24Regular', campusMenu: 'Food24Regular', workplaceSpace: 'Building24Regular', itHelp: 'Desktop24Regular',
  workplaceHelp: 'Wrench24Regular', shifts: 'Clock24Regular', projectHealth: 'Target24Regular', salesPerformance: 'ChartMultiple24Regular', goalsScorecards: 'Target24Regular', workFiles: 'DocumentSearch24Regular',
  teamAvailability: 'PeopleTeam24Regular', companyStock: 'DataTrending24Regular', glossary: 'BookLetter24Regular', securityReporting: 'ShieldLock24Regular', officeDetails: 'Globe24Regular', vacationApprovals: 'ApprovalsApp24Regular'
};

const categoryIconColors = {
  Company: '#075fce', 'My work': '#0f6cbd', Growth: '#6b3f91', Services: '#107c41', Help: '#d83b01', Business: '#b32687'
};

function createZavaIconDataUrl(iconName, iconColor = '#11364f') {
  const Icon = fluentIcons[iconName] || fluentIcons.Apps24Regular;
  const markup = renderToStaticMarkup(React.createElement(Icon));
  const glyph = markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="1" y="1" width="62" height="62" rx="12" fill="#fff" stroke="#d1d1d1" stroke-width="2"/><path d="M40 1h11c6.6 0 12 5.4 12 12v11L40 1Z" fill="#075fce"/><path d="M49 8h8l-8 8h8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(11 13) scale(1.75)" color="${iconColor}" fill="${iconColor}">${glyph}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function withWebPartIcon(content, iconDataUrl) {
  if (/"iconImageUrl":\s*"[^"]*"/.test(content)) {
    return content.replace(/"iconImageUrl":\s*"[^"]*"/, `"iconImageUrl": "${iconDataUrl}"`);
  }
  return content.replace(/"officeFabricIconFontName":\s*"[^"]*"/, `"iconImageUrl": "${iconDataUrl}"`);
}

function lowerFirst(value) {
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

const featureWebParts = zavaCapabilityCatalog.map((capability) => ({
  folder: lowerFirst(capability.webPartName),
  name: capability.webPartName,
  intent: capability.intentKey,
  title: capability.title,
  description: capability.outcome
}));

const workspaceWebParts = [
  { folder: 'zavaOneWorkspace', name: 'ZavaOneWorkspace', mode: 'combined' },
  { folder: 'zavaOneCompanyWorkspace', name: 'ZavaOneCompanyWorkspace', mode: 'company' },
  { folder: 'zavaOnePersonalWorkspace', name: 'ZavaOnePersonalWorkspace', mode: 'personal' }
];

const specialFields = {
  companyNews: [
    `  topic: z.string().optional().describe('Optional news topic such as leadership, accessibility, or customer impact.'),`,
    `  region: z.string().optional().describe('Optional Zava region or office used to filter company news.')`
  ],
  learning: [
    `  assignmentId: z.string().optional().describe('Optional stable learning assignment ID to open.'),`,
    `  status: z.string().optional().describe('Optional learning status filter such as required or completed.')`
  ],
  recognition: [
    `  recipientName: z.string().optional().describe('Optional colleague display name used to prefill the praise draft.'),`,
    `  message: z.string().optional().describe('Optional praise message used only to prefill an editable draft.'),`,
    `  audience: z.string().optional().describe('Optional permitted community or direct audience label.')`
  ],
  vacationApprovals: [
    `  requestId: z.string().optional().describe('Optional stable vacation request ID to open for review.'),`,
    `  employeeName: z.string().optional().describe('Optional employee name used to filter the vacation request queue.'),`,
    `  status: z.string().optional().describe('Optional request status filter such as pending, approved, or declined.')`
  ],
  approvals: [
    `  approvalType: z.enum(['budget', 'publication', 'supplier', 'all']).optional().describe('Optional approval queue type requested by the user.'),`,
    `  approvalId: z.string().optional().describe('Optional stable approval ID to open directly.')`
  ],
  timeOff: [
    `  leaveType: z.enum(['vacation', 'sick', 'personal']).optional().describe('Optional leave type used to prefill a new request.'),`,
    `  startDate: z.string().optional().describe('Optional start date in YYYY-MM-DD format.'),`,
    `  endDate: z.string().optional().describe('Optional end date in YYYY-MM-DD format.'),`,
    `  reason: z.string().optional().describe('Optional editable reason used to prefill the request.')`
  ],
  equity: [
    `  year: z.number().int().min(2020).max(2100).optional().describe('Optional equity plan year.'),`,
    `  currency: z.enum(['EUR', 'USD', 'GBP']).optional().describe('Optional display currency.')`
  ],
  expensesTravel: [
    `  reportName: z.string().optional().describe('Optional editable expense report name.'),`,
    `  trip: z.string().optional().describe('Optional trip or business-purpose label.')`
  ],
  workplaceSpace: [
    `  office: z.enum(['Helsinki', 'Redmond', 'Singapore']).optional().describe('Optional office for the room search.'),`,
    `  date: z.string().optional().describe('Optional booking date in YYYY-MM-DD format.'),`,
    `  time: z.string().optional().describe('Optional local start time in HH:mm format.'),`,
    `  durationMinutes: z.number().int().min(30).max(240).optional().describe('Optional meeting duration.'),`,
    `  capacity: z.number().int().min(1).max(20).optional().describe('Optional minimum room capacity.')`
  ],
  itHelp: [
    `  category: z.enum(['Access', 'Device', 'Network', 'Software', 'Other']).optional().describe('Optional IT issue category.'),`,
    `  impact: z.enum(['Low', 'Medium', 'High']).optional().describe('Optional user impact.'),`,
    `  summary: z.string().optional().describe('Optional editable issue summary.'),`,
    `  description: z.string().optional().describe('Optional editable issue description.')`
  ],
  workFiles: [
    `  query: z.string().optional().describe('Optional file-name or keyword search text.')`
  ]
};

const copilotComponents = zavaCapabilityCatalog.map((capability) => ({
  folder: lowerFirst(capability.copilotName),
  name: capability.copilotName,
  toolName: capability.toolName || capability.copilotName,
  intent: capability.intentKey,
  description: `Use when ${capability.useWhen}. Do not use when ${capability.doNotUse}.`,
  fields: specialFields[capability.intentKey] || [
    `  scope: z.string().optional().describe('Optional business scope, record label, date, or location from the user request.'),`,
    `  query: z.string().optional().describe('Optional search or filter text used to focus the initial experience.')`
  ]
})).concat([
  {
    folder: 'openZavaWorkspace', name: 'OpenZavaWorkspace', intent: 'workspace',
    description: 'Use when the user asks to open Zava One broadly. Do not use when a specific capability answers directly.',
    fields: [`  tab: z.string().optional().describe('Optional workspace tab: company or personal. This does not save a preference.')`]
  },
  {
    folder: 'exploreAgentCapabilities', name: 'ExploreAgentCapabilities', intent: 'capabilities',
    description: 'Use when the user asks what Zava One can do. Do not use when the user has a known specific business task.',
    fields: [
      `  category: z.string().optional().describe('Optional business capability category to show first.'),`,
      `  query: z.string().optional().describe('Optional business-language search text for capability discovery.')`
    ]
  }
]);

const outputs = [];

for (const component of featureWebParts) {
  const manifestPath = resolve(root, `src/webparts/${component.folder}/${component.name}WebPart.manifest.json`);
  if (!existsSync(manifestPath)) continue;
  const content = [
    `import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';`,
    '',
    `export interface I${component.name}WebPartProps extends IZavaOneWebPartProperties {}`,
    '',
    `export default class ${component.name}WebPart extends ZavaOneWebPartBase<I${component.name}WebPartProps> {`,
    `  protected readonly intent = '${component.intent}' as const;`,
    '}',
    ''
  ].join(EOL);
  outputs.push({ path: `src/webparts/${component.folder}/${component.name}WebPart.ts`, content });
}

for (const component of workspaceWebParts) {
  const content = [
    `import { ZavaOneWorkspaceWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';`,
    '',
    `export interface I${component.name}WebPartProps extends IZavaOneWebPartProperties {}`,
    '',
    `export default class ${component.name}WebPart extends ZavaOneWorkspaceWebPartBase<I${component.name}WebPartProps> {`,
    `  protected readonly workspaceMode = '${component.mode}' as const;`,
    '}',
    ''
  ].join(EOL);
  outputs.push({ path: `src/webparts/${component.folder}/${component.name}WebPart.ts`, content });
}

for (const component of copilotComponents) {
  const manifestPath = resolve(root, `src/copilotComponents/${component.folder}/${component.name}CopilotComponent.manifest.json`);
  if (!existsSync(manifestPath)) continue;
  const content = [
    `import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';`,
    `import type { I${component.name}CopilotComponentProperties } from './${component.name}CopilotComponentProperties';`,
    '',
    `export default class ${component.name}CopilotComponent extends ZavaOneCopilotComponentBase<I${component.name}CopilotComponentProperties> {`,
    `  protected readonly intent = '${component.intent}' as const;`,
    '}',
    ''
  ].join(EOL);
  outputs.push({ path: `src/copilotComponents/${component.folder}/${component.name}CopilotComponent.tsx`, content });

  const propertiesContent = [
    `import { z } from 'zod';`,
    `import zodToJsonSchema from 'zod-to-json-schema';`,
    '',
    'const propertiesSchema = z.object({',
    ...component.fields,
    '});',
    '',
    `export type I${component.name}CopilotComponentProperties = z.infer<typeof propertiesSchema>;`,
    '',
    'export default zodToJsonSchema(propertiesSchema);',
    ''
  ].join(EOL);
  outputs.push({ path: `src/copilotComponents/${component.folder}/${component.name}CopilotComponentProperties.ts`, content: propertiesContent });
}

for (const component of copilotComponents) {
  const path = `src/copilotComponents/${component.folder}/${component.name}CopilotComponent.manifest.json`;
  if (!existsSync(resolve(root, path))) continue;
  const manifest = JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  manifest.capabilities = manifest.capabilities || {};
  manifest.capabilities.availableDisplayModes = ['inline', 'fullscreen'];
  manifest.tools[0].name = component.toolName || component.name;
  manifest.tools[0].description.default = component.description;
  outputs.push({ path, content: `${JSON.stringify(manifest, null, 2)}${EOL}` });
}

for (const component of featureWebParts) {
  const path = `src/webparts/${component.folder}/${component.name}WebPart.manifest.json`;
  if (!existsSync(resolve(root, path))) continue;
  const source = readFileSync(resolve(root, path), 'utf8');
  const capability = zavaCapabilityCatalog.find((item) => item.intentKey === component.intent);
  const normalized = source
    .replace(/"supportedHosts":\s*\[[^\]]+\]/, '"supportedHosts": ["SharePointWebPart"]')
    .replace(/"group":\s*\{\s*"default":\s*"[^"]*"\s*\}/, '"group": { "default": "Zava One" }')
    .replace(/"title":\s*\{\s*"default":\s*"[^"]*"\s*\}/, `"title": { "default": "Zava One: ${component.title}" }`)
    .replace(/"description":\s*\{\s*"default":\s*"[^"]*"\s*\}/, `"description": { "default": "${component.description}" }`);
  const content = withWebPartIcon(normalized, createZavaIconDataUrl(capabilityIconNames[component.intent], categoryIconColors[capability?.category]));
  outputs.push({ path, content });
}

for (const component of workspaceWebParts) {
  const path = `src/webparts/${component.folder}/${component.name}WebPart.manifest.json`;
  const source = readFileSync(resolve(root, path), 'utf8');
  const workspaceTitle = component.mode === 'combined' ? 'Zava One workspace' : component.mode === 'company' ? 'Zava One company workspace' : 'Zava One personal workspace';
  const workspaceDescription = component.mode === 'combined'
    ? 'Company and personal employee experiences in one composed workspace.'
    : `${workspaceTitle} opens a focused composed workspace without a tab switcher.`;
  const normalized = source
    .replace(/"supportedHosts":\s*\[[^\]]+\]/, '"supportedHosts": ["SharePointWebPart", "SharePointFullPage", "TeamsPersonalApp", "TeamsTab"]')
    .replace(/"group":\s*\{\s*"default":\s*"[^"]*"\s*\}/, '"group": { "default": "Zava One" }')
    .replace(/"title":\s*\{\s*"default":\s*"[^"]*"\s*\}/, `"title": { "default": "${workspaceTitle}" }`)
    .replace(/"description":\s*\{\s*"default":\s*"[^"]*"\s*\}/, `"description": { "default": "${workspaceDescription}" }`);
  const iconName = component.mode === 'combined' ? 'Grid24Regular' : component.mode === 'company' ? 'BuildingMultiple24Regular' : 'PersonHome24Regular';
  const iconColor = component.mode === 'personal' ? '#6b3f91' : component.mode === 'company' ? '#107c41' : '#11364f';
  const content = withWebPartIcon(normalized, createZavaIconDataUrl(iconName, iconColor));
  outputs.push({ path, content });
}

const packagePath = 'package.json';
const packageJson = JSON.parse(readFileSync(resolve(root, packagePath), 'utf8'));
packageJson.dependencies['@fluentui/react-components'] = '9.74.9';
packageJson.dependencies['@fluentui/react-icons'] = '2.0.314';
packageJson.dependencies['@griffel/react'] = '1.7.8';
packageJson.dependencies['@microsoft/sp-top-actions'] = '1.24.0';
delete packageJson.dependencies['@fluentui/react'];
outputs.push({ path: packagePath, content: `${JSON.stringify(packageJson, null, 2)}${EOL}` });

const configPath = 'config/config.json';
const config = JSON.parse(readFileSync(resolve(root, configPath), 'utf8'));
const bundledComponents = Object.keys(config.bundles).reduce(
  (all, key) => all.concat(config.bundles[key].components),
  []
).filter((component) => !component.manifest.includes('/baseline/'));
config.bundles = {
  'zava-one-webparts': { components: bundledComponents.filter((component) => component.manifest.includes('/webparts/')) },
  'zava-one-copilot-components': { components: bundledComponents.filter((component) => component.manifest.includes('/copilotComponents/')) }
};
config.localizedResources = {};
outputs.push({ path: configPath, content: `${JSON.stringify(config, null, 2)}${EOL}` });

const runtimeCatalogPath = 'src/shared/catalog/generatedCapabilities.ts';
const runtimeCatalog = [
  '// AUTO-GENERATED by scripts/configure-reference-hosts.mjs. Do not edit by hand.',
  `export const generatedCapabilities = ${JSON.stringify(zavaCapabilityCatalog, null, 2)} as const;`,
  ''
].join(EOL);
outputs.push({ path: runtimeCatalogPath, content: runtimeCatalog });

const agentConfigPath = 'config/copilot-agent.json';
const agentConfig = JSON.parse(readFileSync(resolve(root, agentConfigPath), 'utf8'));
agentConfig.agents[0].name.default = 'Zava One';
agentConfig.agents[0].description.default = 'Company news, personal work, services, and decisions in one employee experience.';
agentConfig.agents[0].components = copilotComponents.filter((component) => {
  const manifestPath = resolve(root, `src/copilotComponents/${component.folder}/${component.name}CopilotComponent.manifest.json`);
  return existsSync(manifestPath);
}).map((component) => {
  const manifestPath = resolve(root, `src/copilotComponents/${component.folder}/${component.name}CopilotComponent.manifest.json`);
  return JSON.parse(readFileSync(manifestPath, 'utf8')).id;
});
outputs.push({ path: agentConfigPath, content: `${JSON.stringify(agentConfig, null, 2)}${EOL}` });

const stale = [];
for (const output of outputs) {
  const outputPath = resolve(root, output.path);
  if (checkOnly) {
    if (!existsSync(outputPath) || normalizeNewlines(readFileSync(outputPath, 'utf8')) !== normalizeNewlines(output.content)) stale.push(output.path);
  } else {
    writeFileSync(outputPath, output.content, 'utf8');
  }
}

const cleanupDirectories = [
  ...featureWebParts.flatMap((component) => [
    `src/webparts/${component.folder}/components`,
    `src/webparts/${component.folder}/assets`,
    `src/webparts/${component.folder}/loc`
  ]),
  ...workspaceWebParts.flatMap((component) => [
    `src/webparts/${component.folder}/components`,
    `src/webparts/${component.folder}/assets`,
    `src/webparts/${component.folder}/loc`
  ]),
  ...copilotComponents.flatMap((component) => [
    `src/copilotComponents/${component.folder}/components`,
    `src/copilotComponents/${component.folder}/loc`
  ])
];

for (const cleanupPath of cleanupDirectories) {
  const absolutePath = resolve(root, cleanupPath);
  if (checkOnly) {
    if (existsSync(absolutePath)) stale.push(cleanupPath);
  } else if (existsSync(absolutePath)) {
    rmSync(absolutePath, { recursive: true, force: true });
  }
}

if (stale.length) {
  console.error(`Reference host artifacts are stale:\n${stale.join('\n')}`);
  process.exit(1);
}

console.log(`${checkOnly ? 'Validated' : 'Configured'} ${outputs.length} reference host artifacts.`);