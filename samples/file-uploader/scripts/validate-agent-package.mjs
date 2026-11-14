#!/usr/bin/env node
/**
 * Post-`package-solution` gate on the two deployable artefacts — AGENTS.md R21,
 * R33, R34. Runs last in `npm run build`.
 *
 * The generated agent package (`teams/document-intake.zip`):
 *   1. the only `{{…}}` placeholders in ai-plugin.json are {{TENANT_MCP_URL}} and
 *      {{TENANT_ORIGIN}};
 *   2. every runtime is a RemoteMCPServer whose spec.url is exactly
 *      {{TENANT_MCP_URL}} — a hard-coded URL passes (1) and still breaks (R33);
 *   3. for every function, not just the first: an MCP tool of the same name, a
 *      runtime whose run_for_functions covers it, and parameters / inputSchema
 *      that describe the same properties with the same types and enums. That set
 *      must be the one the compiled Zod schema emits (lib-commonjs), not a list
 *      kept by hand. Neither copy may carry anything beyond `type` and
 *      `properties`: the build strips `additionalProperties` and `$schema` from
 *      both, and a tool definition Copilot will not accept is dropped silently
 *      (todo.md 8.6 F4);
 *   4. function and tool names match the component manifest's tools;
 *   5. declarativeAgent.json `instructions` is exactly
 *      `$[file('instruction.txt')]`, and instruction.txt ships beside it, equal
 *      to copilot/instruction.txt and within the 8,000-character limit. The
 *      placeholder is load-bearing: SharePoint resolves it when it registers the
 *      agent, and a package that inlines the text registers a plugin with no
 *      functions, silently (R34, D17 — todo.md 8.9 N2e). Not the generator stub.
 *      With `--allow-inline` (the first deploy of an instruction update,
 *      todo.md L11 B; `deploy.ps1 -InstructionUpdate` passes it), inlined
 *      instructions are accepted too, if they equal instruction.txt verbatim.
 *      Never in `npm run build`. The rule is scripts/agent-instructions.mjs;
 *      the success line names the form found, which -InstructionUpdate reads.
 *
 * The solution package (`sharepoint/solution/file-uploader.sppkg`) — R21:
 *   6. exactly one hashed `file-uploader-copilot-component_<hash>.js`, and no
 *      plain or otherwise unexpected bundle beside it;
 *   7. no source maps and no hot-update files;
 *   8. exactly one agent ZIP inside it, `document-intake.zip`, identical to
 *      `teams/document-intake.zip` entry by entry. Whole-file hashes differ
 *      between builds even when every entry matches (docs/GOTCHAS.md);
 *   9. no stale agent ZIP beside the current one in `teams/`.
 *  10. nothing the model reads in the agent package says drag or drop:
 *      ai-plugin.json (function and MCP tool descriptions, parameters),
 *      declarativeAgent.json, and instruction.txt except its one prohibition
 *      sentence (todo.md 8.8 L10 review; the rule is scripts/no-drag-wording.mjs).
 * Sizes over the investigation thresholds (1 MiB bundle, 10 MiB package) are
 * reported, not failed: AGENTS.md §6 calls them thresholds, not verdicts.
 *
 * `AGENT_ZIP`, `SPPKG` and `INSTRUCTION_FILE` override the three inputs, so each
 * check can be shown to fail against a doctored copy.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ALLOWED_PROHIBITION, findDragWording, jsonStrings } from './no-drag-wording.mjs';
import { checkInstructions, INSTRUCTION_FILE_NAME } from './agent-instructions.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// The generator slugifies the ZIP name from config/copilot-agent.json agents[0].name.
const AGENT_ZIP_NAME = 'document-intake.zip';
const AGENT_ZIP = process.env.AGENT_ZIP || join(ROOT, 'teams', AGENT_ZIP_NAME);
const SPPKG = process.env.SPPKG || join(ROOT, 'sharepoint', 'solution', 'file-uploader.sppkg');
const INSTRUCTION_FILE = process.env.INSTRUCTION_FILE || join(ROOT, 'copilot', 'instruction.txt');
const PROPERTIES_JS = join(ROOT, 'lib-commonjs', 'copilotComponents', 'fileUploader', 'FileUploaderCopilotComponentProperties.js');
const MANIFEST = join(ROOT, 'src', 'copilotComponents', 'fileUploader', 'FileUploaderCopilotComponent.manifest.json');
const BUNDLE_PREFIX = 'file-uploader-copilot-component';

const ALLOWED_PLACEHOLDERS = new Set(['TENANT_MCP_URL', 'TENANT_ORIGIN']);
const ALLOW_INLINE = process.argv.includes('--allow-inline');
const MIB = 1024 * 1024;

// ---- minimal zip reader (central directory + raw inflate) ----------------

function readZip(buf, label) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error(`${label}: not a zip archive`);
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error(`${label}: corrupt central directory`);
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    if (!name.endsWith('/')) {
      const start = localOff + 30 + buf.readUInt16LE(localOff + 26) + buf.readUInt16LE(localOff + 28);
      const raw = buf.subarray(start, start + compSize);
      files[name] = method === 0 ? raw : inflateRawSync(raw);
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const errors = [];
const notes = [];
const fail = m => errors.push(m);
const sameSet = (a, b) => a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');
const sha256 = b => createHash('sha256').update(b).digest('hex');

function load(label, path) {
  try {
    return readZip(readFileSync(path), label);
  } catch (e) {
    console.error(`${label}: cannot read ${path} — run \`heft package-solution\` first.\n${e.message}`);
    process.exit(1);
  }
}

// ---- the inputs Copilot fills, from the compiled Zod schema --------------

let expectedProps;
try {
  const require = createRequire(import.meta.url);
  expectedProps = Object.keys(require(PROPERTIES_JS).default.properties || {});
} catch (e) {
  console.error(`cannot load the compiled tool schema ${PROPERTIES_JS} — build first.\n${e.message}`);
  process.exit(1);
}
if (expectedProps.length === 0) {
  fail(`${PROPERTIES_JS}: the compiled schema declares no properties`);
}

// ---- agent package ---------------------------------------------------------

const agent = load('agent package', AGENT_ZIP);
let functionCount = 0;

const pluginText = agent['ai-plugin.json'] && agent['ai-plugin.json'].toString('utf8');
if (!pluginText) {
  fail('ai-plugin.json is missing from the agent package');
} else {
  for (const m of pluginText.matchAll(/\{\{\s*([^}\s]+)\s*\}\}/g)) {
    if (!ALLOWED_PLACEHOLDERS.has(m[1])) {
      fail(`unresolved placeholder {{${m[1]}}} in ai-plugin.json — only {{TENANT_MCP_URL}} and {{TENANT_ORIGIN}} are allowed (R34)`);
    }
  }

  const plugin = JSON.parse(pluginText);
  const functions = plugin.functions || [];
  const runtimes = plugin.runtimes || [];
  functionCount = functions.length;
  if (functions.length === 0) fail('ai-plugin.json has no functions[]');
  if (runtimes.length === 0) fail('ai-plugin.json has no runtimes[]');

  runtimes.forEach((r, i) => {
    if (r.type !== 'RemoteMCPServer') {
      fail(`runtimes[${i}].type is ${JSON.stringify(r.type)}, expected "RemoteMCPServer" (R33)`);
    }
    if (!r.spec || r.spec.url !== '{{TENANT_MCP_URL}}') {
      fail(`runtimes[${i}].spec.url is ${JSON.stringify(r.spec && r.spec.url)}, expected "{{TENANT_MCP_URL}}" — SharePoint resolves it at deployment (R33)`);
    }
  });

  const tools = runtimes.flatMap(r => (r.spec && r.spec.mcp_tool_description && r.spec.mcp_tool_description.tools) || []);
  const manifestTools = (JSON.parse(readFileSync(MANIFEST, 'utf8')).tools || []).map(t => t.name);
  if (!sameSet(functions.map(f => f.name), manifestTools)) {
    fail(`functions ${JSON.stringify(functions.map(f => f.name))} != manifest tools ${JSON.stringify(manifestTools)}`);
  }
  if (!sameSet(tools.map(t => t.name), manifestTools)) {
    fail(`MCP tools ${JSON.stringify(tools.map(t => t.name))} != manifest tools ${JSON.stringify(manifestTools)}`);
  }

  for (const fn of functions) {
    const tool = tools.find(t => t.name === fn.name);
    if (!tool) {
      fail(`function "${fn.name}" has no MCP tool of the same name`);
      continue;
    }
    if (!runtimes.some(r => (r.run_for_functions || []).includes(fn.name))) {
      fail(`no runtime's run_for_functions covers "${fn.name}"`);
    }
    const fnProps = (fn.parameters && fn.parameters.properties) || {};
    const mcpProps = (tool.inputSchema && tool.inputSchema.properties) || {};
    if (!sameSet(Object.keys(fnProps), expectedProps)) {
      fail(`${fn.name}: functions[] parameters ${JSON.stringify(Object.keys(fnProps).sort())} != the compiled Zod inputs ${JSON.stringify([...expectedProps].sort())}`);
    }
    if (!sameSet(Object.keys(mcpProps), expectedProps)) {
      fail(`${fn.name}: MCP inputSchema ${JSON.stringify(Object.keys(mcpProps).sort())} != the compiled Zod inputs ${JSON.stringify([...expectedProps].sort())}`);
    }
    const extraKeys = Object.keys(tool.inputSchema || {}).filter(k => k !== 'type' && k !== 'properties');
    if (extraKeys.length > 0) {
      fail(
        `${fn.name}: MCP inputSchema carries ${JSON.stringify(extraKeys.sort())} beyond type and properties — ` +
          'Copilot drops a tool definition it will not accept, with no error anywhere (todo.md 8.6 F4)'
      );
    }
    for (const key of expectedProps) {
      const a = fnProps[key] || {};
      const b = mcpProps[key] || {};
      if (!a.type && !a.enum) {
        fail(`${fn.name}.${key}: no type or enum in functions[] — Copilot cannot tell what to send`);
      }
      if (a.type !== b.type) {
        fail(`${fn.name}.${key}: type disagrees — functions "${a.type}" vs MCP "${b.type}"`);
      }
      if (JSON.stringify(a.enum || null) !== JSON.stringify(b.enum || null)) {
        fail(`${fn.name}.${key}: enum disagrees between functions[] and the MCP inputSchema`);
      }
    }
  }
}

let instructionsForm = 'invalid';
const daText = agent['declarativeAgent.json'] && agent['declarativeAgent.json'].toString('utf8');
if (!daText) {
  fail('declarativeAgent.json is missing from the agent package');
} else {
  const da = JSON.parse(daText);
  const shipped = agent[INSTRUCTION_FILE_NAME];
  const result = checkInstructions({
    instructions: da.instructions,
    shipped: shipped ? shipped.toString('utf8') : undefined,
    authored: readFileSync(INSTRUCTION_FILE, 'utf8'),
    allowInline: ALLOW_INLINE
  });
  result.errors.forEach(fail);
  instructionsForm = result.form;
  if (!da.name || da.name === 'FileUploader Agent') {
    fail(`declarativeAgent.json name is ${JSON.stringify(da.name)} — the generator stub was not replaced`);
  }
}

// ---- no drag or drop in what the model reads (L10) -------------------------

// Inlined instructions carry the one allowed sentence into declarativeAgent.json too.
for (const [name, allow] of [['ai-plugin.json', []], ['declarativeAgent.json', [ALLOWED_PROHIBITION]], ['instruction.txt', [ALLOWED_PROHIBITION]]]) {
  if (!agent[name]) continue;
  const text = agent[name].toString('utf8');
  const hit = findDragWording(name.endsWith('.json') ? jsonStrings(JSON.parse(text)) : text, allow);
  if (hit) {
    fail(`${name} in the agent package says drag or drop: ${hit} — Copilot reads this; in Copilot a dragged file attaches to the chat (todo.md L10)`);
  }
}

// ---- solution package (R21) -----------------------------------------------

const pkg = load('solution package', SPPKG);
const names = Object.keys(pkg);
const assets = names.filter(n => n.startsWith('ClientSideAssets/'));
const bundleName = new RegExp(`^ClientSideAssets/${BUNDLE_PREFIX}_[0-9a-f]{8,}\\.js$`);
const bundles = assets.filter(n => n.slice('ClientSideAssets/'.length).startsWith(BUNDLE_PREFIX) && n.endsWith('.js'));
const hashed = bundles.filter(n => bundleName.test(n));
if (hashed.length !== 1) {
  fail(`expected exactly one hashed ${BUNDLE_PREFIX}_<hash>.js in the .sppkg, found ${hashed.length} (R21)`);
}
const unexpected = bundles.filter(n => !bundleName.test(n));
if (unexpected.length > 0) {
  fail(`bundle(s) beside the hashed one: ${unexpected.join(', ')} — stale files from sharepoint/solution/debug (R21)`);
}
const debris = names.filter(n => /\.map$/.test(n) || /\.hot-update\.(js|json)$/.test(n));
if (debris.length > 0) {
  fail(`source maps or hot-update files in the .sppkg: ${debris.join(', ')} (R21)`);
}

const zips = assets.filter(n => /\.zip$/i.test(n));
if (zips.length !== 1 || zips[0] !== `ClientSideAssets/${AGENT_ZIP_NAME}`) {
  fail(`expected exactly one agent ZIP, ClientSideAssets/${AGENT_ZIP_NAME}, in the .sppkg; found ${JSON.stringify(zips)} (R21)`);
} else {
  const embedded = readZip(pkg[zips[0]], 'agent package inside the .sppkg');
  const inside = Object.keys(embedded).sort();
  const beside = Object.keys(agent).sort();
  if (inside.join(',') !== beside.join(',')) {
    fail(`the .sppkg's agent ZIP holds ${JSON.stringify(inside)} but ${AGENT_ZIP} holds ${JSON.stringify(beside)} (R21)`);
  } else {
    for (const n of inside) {
      if (sha256(embedded[n]) !== sha256(agent[n])) {
        fail(`${n} differs between the .sppkg's agent ZIP and ${AGENT_ZIP} — they were not packaged by the same build (R21)`);
      }
    }
  }
}

if (!process.env.AGENT_ZIP && existsSync(join(ROOT, 'teams'))) {
  const stale = readdirSync(join(ROOT, 'teams')).filter(f => /\.zip$/i.test(f) && f !== AGENT_ZIP_NAME);
  if (stale.length > 0) {
    fail(`stale agent package(s) in teams/: ${stale.join(', ')} — delete them (R21)`);
  }
}

for (const n of hashed) {
  if (pkg[n].length > MIB) {
    notes.push(`${n} is ${(pkg[n].length / MIB).toFixed(2)} MiB — over the 1 MiB investigation threshold (AGENTS.md §6)`);
  }
}
const packageBytes = statSync(SPPKG).size;
if (packageBytes > 10 * MIB) {
  notes.push(`the .sppkg is ${(packageBytes / MIB).toFixed(2)} MiB — over the 10 MiB investigation threshold (AGENTS.md §6)`);
}

// ---- report --------------------------------------------------------------

for (const n of notes) console.warn('investigate: ' + n);
if (errors.length > 0) {
  console.error('Deployable artefacts failed validation (R21, R33, R34):\n  - ' + errors.join('\n  - '));
  process.exit(1);
}
const bundleKb = hashed.length === 1 ? Math.round(pkg[hashed[0]].length / 1024) : 0;
console.log(
  `agent package and .sppkg verified: ${functionCount} function(s), ${expectedProps.length} inputs from the compiled schema, ` +
    `RemoteMCPServer at {{TENANT_MCP_URL}}, tool inputSchema is type+properties only, ` +
    (instructionsForm === 'inlined'
      ? 'instructions INLINED for an instruction update (--allow-inline; the tool unbinds until the next placeholder deploy), '
      : "instructions are $[file('instruction.txt')] and match instruction.txt, ") +
    `no drag or drop wording, one hashed bundle (${bundleKb} KB), ` +
    'agent ZIP identical to teams/ entry by entry'
);
