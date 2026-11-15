// Inspect the shipped artifacts. No tenant, credentials or network access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
// Reuse the SPFx packaging tool's declared dependency; no new app dependency.
const JSZip = createRequire(require.resolve('@microsoft/spfx-heft-plugins/package.json'))('jszip');
const root = path.resolve(__dirname, '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
// The tool names come from the component manifest, so a copy of this sample with other names passes unchanged.
const names = readJson('src/copilotComponents/contentLens/ContentLensCopilotComponent.manifest.json').tools.map(tool => tool.name);
const spfxName = /(?:^|\/)@microsoft\/(?:sp-[^/]+|spfx-[^/]+|eslint-(?:config|plugin)-spfx)$/;

async function verify() {
  const pkg = readJson('package.json');
  const lock = readJson('package-lock.json');
  const solution = readJson('config/package-solution.json').solution;
  const authoredAgent = readJson('copilot/manifest.json');
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.equal(authoredAgent.version, pkg.version);
  assert.equal(solution.version, pkg.version + '.0');
  for (const feature of solution.features) assert.equal(feature.version, solution.version);
  // Catch accidental product-version replacements inside transitive dependencies.
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (!name || !entry.version || !fs.existsSync(path.join(root, name, 'package.json'))) continue;
    assert.equal(readJson(`${name}/package.json`).version, entry.version, `${name} installed versus locked`);
  }
  // SharePoint uses four version parts; Teams uses three. A SharePoint-only
  // revision bump can therefore have a separately incremented Teams patch.
  assert.match(solution.version, /^\d+\.\d+\.\d+\.\d+$/);
  assert.match(authoredAgent.version, /^\d+\.\d+\.\d+$/);
  assert.equal(readJson('config/copilot-agent.json').agents[0].toolDiscovery, 'static');
  // Every SPFx package, declared, locked and installed, must be the same release; which release is not pinned here.
  const direct = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }).filter(([name]) => spfxName.test(name));
  assert(direct.length > 0, 'SPFx dependencies are required');
  const sdkVersion = direct[0][1];
  for (const [name, version] of direct) assert.equal(version, sdkVersion, name);
  const spfx = Object.entries(lock.packages).filter(([name]) => spfxName.test(name));
  assert(spfx.length >= direct.length, 'SPFx packages must be in the lockfile');
  for (const [name, entry] of spfx) {
    assert.equal(entry.version, sdkVersion, name);
    assert.equal(readJson(`${name}/package.json`).version, sdkVersion, `${name} installed`);
  }

  const zipBytes = fs.readFileSync(path.join(root, 'teams/sharepoint-content-lens.zip'));
  const agentZip = await JSZip.loadAsync(zipBytes);
  const plugin = JSON.parse(await agentZip.file('ai-plugin.json').async('string'));
  const manifest = JSON.parse(await agentZip.file('manifest.json').async('string'));
  const agent = JSON.parse(await agentZip.file('declarativeAgent.json').async('string'));
  // The agent instructions are packaged unchanged and stay within the platform limit of 8,000 characters.
  assert.equal(agent.instructions, fs.readFileSync(path.join(root, 'copilot/instruction.txt'), 'utf8'));
  assert(agent.instructions.length <= 8000, `agent instructions have ${agent.instructions.length} characters; the limit is 8,000`);
  // The same developer in the SharePoint solution and the Teams manifest, whoever that is.
  assert(solution.developer.name, 'package-solution.json must name the developer');
  assert.equal(manifest.developer.name, solution.developer.name);
  for (const [kind, size] of [['color', 192], ['outline', 32]]) {
    const file = manifest.icons[kind];
    const bytes = await agentZip.file(file).async('nodebuffer');
    assert.deepEqual(bytes, fs.readFileSync(path.join(root, 'copilot', file)), `${kind} icon must match the authored asset`);
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
  assert.match(manifest.version, new RegExp(`^${authoredAgent.version.replace(/\./g, '\\.')}($|\\.\\d+$)`));
  assert.equal(agent.version, 'v1.8');
  assert.deepEqual(plugin.functions.map(tool => tool.name), names);
  assert.equal(plugin.runtimes.length, 1);
  const runtime = plugin.runtimes[0];
  assert.equal(runtime.type, 'RemoteMCPServer');
  assert.equal(runtime.spec.url, '{{TENANT_MCP_URL}}');
  assert.deepEqual(runtime.run_for_functions, names);
  const tools = runtime.spec.mcp_tool_description.tools;
  assert.deepEqual(tools.map(tool => tool.name), names);
  // The launcher is the only tool: reviews and comparisons run inside the component.
  assert.equal(tools.length, 1);
  for (const tool of tools) {
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
    assert.equal(tool._meta['openai/outputTemplate'], 'ui://spfx/component.html');
  }

  const solutionZip = await JSZip.loadAsync(fs.readFileSync(path.join(root, 'sharepoint/solution/sharepoint-content-lens.sppkg')));
  assert.deepEqual(await solutionZip.file('ClientSideAssets/sharepoint-content-lens.zip').async('nodebuffer'), zipBytes);
  const appXml = await solutionZip.file('AppManifest.xml').async('string');
  assert(appXml.includes(`Version="${solution.version}"`));
  const permissions = [...appXml.matchAll(/<WebApiPermissionRequest\s+([^>]+)>/g)].map(match => ({
    resource: /ResourceId="([^"]+)"/.exec(match[1])?.[1], scope: /Scope="([^"]+)"/.exec(match[1])?.[1]
  }));
  // Chat requires this exact documented delegated set; page reads use SPHttpClient.
  const expectedScopes = ["Sites.Read.All", "Mail.Read", "People.Read.All", "OnlineMeetingTranscript.Read.All", "Chat.Read", "ChannelMessage.Read.All", "ExternalItem.Read.All"];
  assert.deepEqual(permissions.map(p => p.scope).sort(), expectedScopes.sort());
  assert(permissions.every(p => p.resource === 'Microsoft Graph'));
  assert.deepEqual(solution.webApiPermissionRequests.map(p => p.scope).sort(), expectedScopes);
  const components = Object.keys(solutionZip.files).filter(name => /\/CopilotComponent_[^/]+\.xml$/.test(name));
  assert.equal(components.length, 1);
  const componentXml = await solutionZip.file(components[0]).async('string');
  const encoded = /ComponentManifest="([^"]+)"/.exec(componentXml)?.[1];
  assert(encoded, 'Packaged component manifest is required');
  const entities = { quot: '"', apos: "'", lt: '<', gt: '>', amp: '&' };
  const component = JSON.parse(encoded.replace(/&(quot|apos|lt|gt|amp);/g, (_match, entity) => entities[entity]));
  assert.equal(component.version, pkg.version);
  assert.deepEqual(component.tools.map(tool => tool.name), names);
  for (const tool of tools) assert.deepEqual(tool.inputSchema, component.tools.find(item => item.name === tool.name).propertiesSchema);
  console.log(`Package verification passed: ${direct.length} direct / ${spfx.length} installed SPFx ${sdkVersion} dependencies; static ${names.length}-tool catalog; read-only annotations; exact seven Chat API permissions; embedded agent ZIP matches; agent instructions ${agent.instructions.length}/8,000 characters. Teams ${manifest.version}; SPFx ${solution.version}.`);
}

verify().catch(error => { console.error(error); process.exitCode = 1; });
