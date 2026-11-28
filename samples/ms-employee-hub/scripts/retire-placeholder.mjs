import { resolve } from 'node:path';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import JSZip from 'jszip';
import assert from 'node:assert/strict';
import { root, entries, proof, json } from './host-model.mjs';

const placeholder = entries('copilotComponents').find(e => e.placeholder);
if (placeholder) {
  assert.equal(placeholder.manifest.id, 'fc0c6ec3-1d83-443a-a516-b8b20a07cf8e');
  const zip = await JSZip.loadAsync(readFileSync(resolve(root, 'sharepoint/solution/ms-employee-hub.sppkg')));
  const members = Object.keys(zip.files);
  for (const id of proof) {
    const source = entries('copilotComponents').find(e => e.row?.id === id);
    assert(source && members.some(file => file.endsWith(`/CopilotComponent_${source.manifest.id}.xml`)), `Missing packaged proof for ${id}`);
  }
  assert(members.includes('ClientSideAssets/employee-hub.zip'));
  const config = json('config/config.json');
  delete config.bundles['hello-world-copilot-component']; delete config.localizedResources.HelloWorldCopilotComponentStrings;
  writeFileSync(resolve(root, 'config/config.json'), JSON.stringify(config, null, 2) + '\n');
  rmSync(resolve(root, placeholder.folder), { recursive: true });
  const zipPath = resolve(root, 'teams/helloworld-agent.zip');
  if (existsSync(zipPath)) rmSync(zipPath);
  console.log('Removed the original scaffold after verifying the four real components in the actual SPPKG.');
}
