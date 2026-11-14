import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { zavaCapabilityCatalog } from '../config/zava-capabilities.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evidence = JSON.parse(readFileSync(resolve(root, 'ux-review/evidence/phase-6-matrix.json'), 'utf8'));
const packageSolution = JSON.parse(readFileSync(resolve(root, 'config/package-solution.json'), 'utf8'));
const errors = [];

for (const artifact of evidence.artifacts || []) {
  const path = resolve(root, artifact.path);
  if (!existsSync(path)) {
    errors.push(`Missing release artifact: ${artifact.path}.`);
    continue;
  }
  const bytes = readFileSync(path);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (statSync(path).size !== artifact.bytes || sha256 !== artifact.sha256) errors.push(`Release artifact evidence is stale: ${artifact.path}.`);
}

function manifestFiles(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) return manifestFiles(child);
    return entry.name.endsWith('.manifest.json') ? [child] : [];
  });
}

function parseJsonc(path) {
  const parsed = ts.parseConfigFileTextToJson(path, readFileSync(path, 'utf8'));
  if (parsed.error) throw new Error(`Invalid JSONC manifest: ${path}.`);
  return parsed.config;
}

const manifests = manifestFiles(resolve(root, 'src'));
const manifestRecords = manifests.map((path) => ({ path, manifest: parseJsonc(path) }));
const ids = manifestRecords.map((record) => record.manifest.id);
const webParts = manifestRecords.filter((record) => record.path.includes(`${resolve(root, 'src', 'webparts')}`));
const teamsEnabled = webParts.filter((record) => (record.manifest.supportedHosts || []).some((host) => host.startsWith('Teams')));
const fullPage = webParts.filter((record) => (record.manifest.supportedHosts || []).includes('SharePointFullPage'));

if (zavaCapabilityCatalog.length !== 35) errors.push(`Expected 35 capabilities, found ${zavaCapabilityCatalog.length}.`);
if (manifestRecords.length !== evidence.catalog.totalSpfxComponents) errors.push(`Manifest count ${manifestRecords.length} differs from evidence ${evidence.catalog.totalSpfxComponents}.`);
if (new Set(ids).size !== manifestRecords.length) errors.push('SPFx manifest GUIDs must be unique.');
if (teamsEnabled.length !== 3) errors.push(`Expected 3 Teams-enabled web parts, found ${teamsEnabled.length}.`);
if (fullPage.length !== 3) errors.push(`Expected 3 SharePoint full-page web parts, found ${fullPage.length}.`);
if (teamsEnabled.some((record) => !record.manifest.alias?.includes('Workspace'))) errors.push('A feature web part is unexpectedly Teams-enabled.');
if ((evidence.publicationScreenshots || []).length !== evidence.validation.publicationGalleryImages) errors.push('Publication screenshot evidence count is inconsistent.');
if (evidence.validation.jestTests < 42 || evidence.validation.jestFailures !== 0) errors.push('Jest release evidence must include Teams header, receipt, and default/saved-layout regressions with no failures.');
const responsive = JSON.parse(readFileSync(resolve(root, 'ux-review/evidence/responsive-matrix.json'), 'utf8'));
if (responsive.states < 4080 || responsive.failures !== 0 || responsive.capabilities !== 35 ||
  JSON.stringify(responsive.viewportWidths) !== JSON.stringify([320, 390, 560, 768, 1024, 1280, 1440, 1600]) ||
  JSON.stringify(responsive.desktopColumnWidths) !== JSON.stringify([320, 390, 560, 768]) ||
  JSON.stringify(responsive.darkViewportWidths) !== JSON.stringify([320, 768, 1440]) ||
  responsive.defaultColumns.length !== 32 || responsive.defaultColumns.some((record) => record.spread > 0.2)) {
  errors.push('Responsive release evidence is incomplete or has failures.');
}
if (evidence.validation.responsiveStates !== responsive.states || evidence.validation.responsiveFailures !== responsive.failures ||
  JSON.stringify(evidence.validation.responsiveViewportWidths) !== JSON.stringify(responsive.viewportWidths)) {
  errors.push('Release and responsive evidence are inconsistent.');
}

const expectedPackageBytes = evidence.artifacts?.find((artifact) => artifact.path.endsWith('.sppkg'))?.bytes;
const sppkgPath = resolve(root, 'sharepoint/solution/zava-one-hub.sppkg');
const appManifest = execFileSync('tar', ['-xOf', sppkgPath, 'AppManifest.xml'], { encoding: 'utf8' });
const featurePath = `feature_${packageSolution.solution.features[0].id}.xml`;
const featureManifest = execFileSync('tar', ['-xOf', sppkgPath, featurePath], { encoding: 'utf8' });
const embeddedSolutionVersion = appManifest.match(/<App\b[^>]*\bVersion="([^"]+)"/)?.[1];
const embeddedFeatureVersion = featureManifest.match(/<Feature\b[^>]*\bVersion="([^"]+)"/)?.[1];
if (packageSolution.solution.version !== evidence.catalog.solutionVersion) errors.push('Source and evidence solution versions differ.');
if (embeddedSolutionVersion !== packageSolution.solution.version) errors.push(`Embedded solution version ${embeddedSolutionVersion} differs from source ${packageSolution.solution.version}.`);
if (embeddedFeatureVersion !== packageSolution.solution.features[0].version) errors.push(`Embedded feature version ${embeddedFeatureVersion} differs from source ${packageSolution.solution.features[0].version}.`);
if (evidence.validation.sppkgAppManifestVersion !== embeddedSolutionVersion || evidence.validation.sppkgFeatureVersion !== embeddedFeatureVersion) errors.push('Embedded SPPKG version evidence is stale.');
const formattedPackageBytes = Number(expectedPackageBytes).toLocaleString('en-US');
for (const path of ['README.md', 'todo.md']) {
  const content = readFileSync(resolve(root, path), 'utf8');
  if (!content.includes(formattedPackageBytes)) errors.push(`${path} does not contain the current SPPKG size ${formattedPackageBytes}.`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated release evidence for ${manifestRecords.length} SPFx manifests, ${zavaCapabilityCatalog.length} capabilities, ${teamsEnabled.length} Teams workspaces, and ${evidence.artifacts.length} artifacts.`);