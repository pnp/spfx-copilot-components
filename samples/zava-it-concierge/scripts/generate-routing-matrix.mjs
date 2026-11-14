import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { loadIntentCatalog } from './load-intent-catalog.mjs';

const root = path.resolve(import.meta.dirname, '..');
const outputPath = path.join(root, 'Zava-IT-Concierge-Prompt-Matrix.md');
const intents = await loadIntentCatalog(root);
const declarativeAgent = JSON.parse(await readFile(path.join(root, 'copilot', 'declarativeAgent.json'), 'utf8'));
const starterTargets = JSON.parse(await readFile(path.join(root, 'config', 'conversation-starters.json'), 'utf8')).starters;
if (JSON.stringify(declarativeAgent.conversation_starters) !== JSON.stringify(starterTargets.map(({ title, text }) => ({ title, text })))) {
  throw new Error('Declarative starters differ from canonical targets.');
}

function escapeCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function propertySummary(intent) {
  if (intent.properties.length === 0) return 'None';
  return intent.properties.map((property) => {
    const preview = JSON.stringify(intent.previewProperties[property.name]);
    return `${property.name}: ${property.type} = ${preview}`;
  }).join('; ');
}

function collisionBoundary(description) {
  const boundary = description.split('Do not use')[1];
  return boundary ? `Do not use${boundary}` : 'No negative boundary authored.';
}

const lines = [
  '# Zava IT Concierge prompt and routing matrix',
  '',
  'Use these copy/paste prompts for routing rehearsal. Each row is generated from the canonical intent catalog and must resolve to exactly one tool. Prompt-derived properties prefill or filter the component; they never execute a consequential action.',
  '',
  '| # | Expected tool | Operation | Lens | Copy/paste prompt | Optional property preview | Full-screen route | Collision boundary |',
  '| ---: | --- | --- | --- | --- | --- | --- | --- |',
  ...intents.map((intent, index) => `| ${index + 1} | \`${intent.name}\` | ${intent.operation} | ${intent.lens} | ${escapeCell(intent.education.samplePrompt)} | \`${escapeCell(propertySummary(intent))}\` | \`${intent.route}\` | ${escapeCell(collisionBoundary(intent.description))} |`),
  '',
  '## Conversation starters',
  '',
  'The agent exposes six deliberately non-overlapping starters. The final starter always opens capability exploration.',
  '',
  '| # | Title | Prompt | Expected tool |',
  '| ---: | --- | --- | --- |',
  ...declarativeAgent.conversation_starters.map((starter, index) => {
    return `| ${index + 1} | ${escapeCell(starter.title)} | ${escapeCell(starter.text)} | \`${starterTargets[index].tool}\` |`;
  }),
  '',
  '## Rehearsal result',
  '',
  '- Record tenant prompt-routing results separately from the deterministic local catalog check.',
  '- A passing local check proves catalog, schemas, generated manifests, starters, and this matrix agree; it does not claim authenticated model routing.',
  ''
];
const expected = lines.join('\n');

if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== expected) {
    console.error('Routing matrix is missing or stale. Run npm run generate:routing-matrix.');
    process.exitCode = 1;
  } else {
    console.log(`Routing matrix is current: ${intents.length} tools and ${declarativeAgent.conversation_starters.length} starters.`);
  }
} else {
  await writeFile(outputPath, expected, 'utf8');
  console.log(`Generated routing matrix for ${intents.length} tools.`);
}