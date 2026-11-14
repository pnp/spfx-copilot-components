#!/usr/bin/env node
/**
 * One source, one identity (AGENTS.md R14).
 *
 * `agent.source.json` (component root — kept out of `copilot/` so it is never
 * staged into the agent package) is the single source for the declarative
 * agent's name, description, contact and conversation starters. This script:
 *
 *   - regenerates `copilot/declarativeAgent.json` from it (fully derived), and
 *   - checks that `copilot/ai-plugin.json`, `copilot/manifest.json`,
 *     `config/copilot-agent.json` and the catalog metadata in
 *     `config/package-solution.json` still carry the same name / description /
 *     contact / developer. Those files hold other hand-authored fields, so the
 *     script does not rewrite them — it fails and tells you what to fix.
 *
 * Usage:
 *   node scripts/gen-copilot-assets.mjs           # write declarativeAgent.json, then verify the rest
 *   node scripts/gen-copilot-assets.mjs --check   # verify everything, write nothing (first step of `npm run build`)
 *   node scripts/gen-copilot-assets.mjs --inline  # instruction update only (todo.md L11 B): inline instruction.txt
 *   node scripts/gen-copilot-assets.mjs --check --inline   # ... and verify that form (`npm run build:instruction-update`)
 *
 * `instructions` is `$[file('instruction.txt')]` by default and always should
 * be (R34, D17). `--inline` writes the text itself, for the one package whose
 * Add to Teams updates the agent record's instructions; that package unbinds
 * the tool, and the next deploy must be a default (placeholder) build. The
 * inlined file stays on disk after that build, because it is what was
 * packaged; a plain `--check` then fails until `npm run gen:copilot-assets`
 * restores the placeholder, which is the guard against shipping it twice.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ALLOWED_PROHIBITION, findDragWording, jsonStrings } from './no-drag-wording.mjs';
import { INLINED_MESSAGE, INSTRUCTIONS_PLACEHOLDER, MAX_INSTRUCTIONS, inlineInstructions } from './agent-instructions.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const INLINE = process.argv.includes('--inline');

const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const stringify = obj => JSON.stringify(obj, undefined, 2) + '\n';

const src = read('agent.source.json');
const instructionText = readFileSync(join(ROOT, 'copilot/instruction.txt'), 'utf8');

// ---- the fully-derived file -------------------------------------------------

const declarativeAgent = {
  $schema: 'https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.8/schema.json',
  version: 'v1.8',
  name: src.name,
  description: src.description,
  instructions: INLINE ? inlineInstructions(instructionText) : INSTRUCTIONS_PLACEHOLDER,
  conversation_starters: src.conversationStarters.map(s => ({ title: s.title, text: s.text })),
  actions: [{ id: 'fileUploaderAction', file: 'ai-plugin.json' }]
};

const errors = [];
const want = (rel, path, actual, expected) => {
  if (actual !== expected) {
    errors.push(`${rel}: ${path} is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
};

// ---- declarativeAgent.json -------------------------------------------------

const declPath = 'copilot/declarativeAgent.json';
const declOnDisk = stringify(read(declPath));
const declGenerated = stringify(declarativeAgent);
if (declOnDisk !== declGenerated) {
  if (CHECK) {
    errors.push(`${declPath} is stale — run \`npm run gen:copilot-assets\``);
  } else {
    writeFileSync(join(ROOT, declPath), declGenerated);
    console.log(`wrote ${declPath}`);
  }
}
// Named on its own, not only as "stale": inlining the text is the one edit here
// that silently unbinds the tool (R34, D17 — todo.md 8.9 N2e). The packaged ZIP
// gets the same check after package-solution (validate-agent-package.mjs).
if (CHECK && !INLINE && read(declPath).instructions !== INSTRUCTIONS_PLACEHOLDER) {
  errors.push(`${declPath}: ${INLINED_MESSAGE} After an instruction update, restore it with \`npm run gen:copilot-assets\`.`);
}
if (INLINE) {
  if (instructionText.length > MAX_INSTRUCTIONS) {
    errors.push(`copilot/instruction.txt is ${instructionText.length} characters; a declarative agent allows ${MAX_INSTRUCTIONS}`);
  }
  console.warn(
    `${declPath}: instructions INLINED for an instruction update (todo.md L11 B). This package unbinds the tool until ` +
      'the next placeholder deploy. Restore with `npm run gen:copilot-assets` before the next normal build.'
  );
}

// ---- the hand-authored files must agree ----------------------------------

const plugin = read('copilot/ai-plugin.json');
want('copilot/ai-plugin.json', 'name_for_human', plugin.name_for_human, src.name);
want('copilot/ai-plugin.json', 'description_for_human', plugin.description_for_human, src.description);
want('copilot/ai-plugin.json', 'description_for_model', plugin.description_for_model, src.description);
want('copilot/ai-plugin.json', 'contact_email', plugin.contact_email, src.contactEmail);

const manifest = read('copilot/manifest.json');
want('copilot/manifest.json', 'name.short', manifest.name?.short, src.name);
want('copilot/manifest.json', 'name.full', manifest.name?.full, src.name);
want('copilot/manifest.json', 'description.short', manifest.description?.short, src.shortDescription);
want('copilot/manifest.json', 'description.full', manifest.description?.full, src.description);
want('copilot/manifest.json', 'developer.name', manifest.developer?.name, src.developer.name);
want('copilot/manifest.json', 'developer.websiteUrl', manifest.developer?.websiteUrl, src.developer.websiteUrl);
want('copilot/manifest.json', 'developer.privacyUrl', manifest.developer?.privacyUrl, src.developer.privacyUrl);
want('copilot/manifest.json', 'developer.termsOfUseUrl', manifest.developer?.termsOfUseUrl, src.developer.termsOfUseUrl);
want('copilot/manifest.json', 'accentColor', manifest.accentColor, src.accentColor);

const agentConfig = read('config/copilot-agent.json');
want('config/copilot-agent.json', 'agents[0].name.default', agentConfig.agents?.[0]?.name?.default, src.name);
want('config/copilot-agent.json', 'agents[0].description.default', agentConfig.agents?.[0]?.description?.default, src.description);

// The test-only starter catalog must ship the same starter text (@types/node
// isn't on the SPFx test tsconfig, so this drift guard lives here, not in a spec).
const catalogSrc = readFileSync(
  join(ROOT, 'src/copilotComponents/fileUploader/logic/conversationStarters.ts'),
  'utf8'
);
const catalogTexts = [...catalogSrc.matchAll(/\btext:\s*(['"])(.+?)\1/g)].map(m => m[2]);
const sourceTexts = src.conversationStarters.map(s => s.text);
if (JSON.stringify(catalogTexts) !== JSON.stringify(sourceTexts)) {
  errors.push(
    `logic/conversationStarters.ts starter text is out of sync:\n      catalog: ${JSON.stringify(catalogTexts)}\n      source:  ${JSON.stringify(sourceTexts)}`
  );
}

// The app catalog shows package-solution.json's metadata, so it must say what
// agent.source.json says (todo.md Phase 8.2, M21). GUIDs and versions are not
// compared — R12 and R13 govern those. PACKAGE_SOLUTION overrides the path so
// this check can be shown to fail against a doctored copy.
const solutionPath = process.env.PACKAGE_SOLUTION || join(ROOT, 'config/package-solution.json');
const solution = JSON.parse(readFileSync(solutionPath, 'utf8')).solution || {};
const solutionRel = 'config/package-solution.json';
want(solutionRel, 'solution.developer.name', solution.developer?.name, src.developer.name);
want(solutionRel, 'solution.developer.websiteUrl', solution.developer?.websiteUrl, src.developer.websiteUrl);
want(solutionRel, 'solution.developer.privacyUrl', solution.developer?.privacyUrl, src.developer.privacyUrl);
want(solutionRel, 'solution.developer.termsOfUseUrl', solution.developer?.termsOfUseUrl, src.developer.termsOfUseUrl);
want(solutionRel, 'solution.metadata.shortDescription.default', solution.metadata?.shortDescription?.default, src.shortDescription);
want(solutionRel, 'solution.features[0].title', solution.features?.[0]?.title, src.name);
const longDescription = solution.metadata?.longDescription?.default || '';
if (!longDescription.startsWith(src.description)) {
  errors.push(`${solutionRel}: solution.metadata.longDescription.default must start with the agent description ${JSON.stringify(src.description)}`);
}

// Mock data stays behind the mock (AGENTS.md R8, todo.md Phase 8.1 M11). Only
// the mock store and tests may import models/seeds. A regex over the source, for
// the same no-@types/node reason as the starter check above.
const SRC = join(ROOT, 'src');
const seedImport = /(?:from\s+|require\(\s*)['"][^'"]*\/seeds['"]/;
for (const entry of readdirSync(SRC, { recursive: true })) {
  const rel = String(entry).replace(/\\/g, '/');
  const exempt = /\.test\.tsx?$/.test(rel) || /(^|\/)services\/MockDocumentStoreService\.ts$/.test(rel);
  if (!/\.tsx?$/.test(rel) || exempt) {
    continue;
  }
  if (seedImport.test(readFileSync(join(SRC, entry), 'utf8'))) {
    errors.push(`src/${rel} imports models/seeds — only MockDocumentStoreService and tests may reach mock data`);
  }
}

// No drag or drop in what the model reads (todo.md 8.8 L10 review, R39): the
// tool description in the component manifest is what Copilot reads to decide
// the call and what it paraphrases back; after L10 cleaned every screen it
// still said "The user drops the file". The built ZIP gets the same check in
// validate-agent-package.mjs; the rendered views in NoDragWording.test.tsx.
const MANIFEST_REL = 'src/copilotComponents/fileUploader/FileUploaderCopilotComponent.manifest.json';
const wordingSources = [
  [MANIFEST_REL, jsonStrings(read(MANIFEST_REL)), []],
  ['agent.source.json', jsonStrings(src), []],
  ['copilot/instruction.txt', instructionText, [ALLOWED_PROHIBITION]]
];
for (const [rel, text, allow] of wordingSources) {
  const hit = findDragWording(text, allow);
  if (hit) {
    errors.push(`${rel} says drag or drop: ${hit} — in Copilot a dragged file attaches to the chat; say "choose" (todo.md L10)`);
  }
}

if (errors.length > 0) {
  console.error('check:copilot-assets failed (agent identity, catalog metadata, mock boundary or drag/drop wording):\n  - ' + errors.join('\n  - '));
  process.exit(1);
}
console.log(CHECK ? 'copilot assets: in sync' : 'copilot assets: declarativeAgent.json generated, the rest verified');
