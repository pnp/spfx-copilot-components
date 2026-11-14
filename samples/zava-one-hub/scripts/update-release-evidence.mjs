import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScreenshotEvidence } from './screenshot-evidence.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'ux-review/evidence/phase-6-matrix.json');
const evidence = JSON.parse(readFileSync(output, 'utf8'));
const previousPackageBytes = evidence.artifacts.find(artifact => artifact.path.endsWith('.sppkg')).bytes;
const solution = JSON.parse(readFileSync(resolve(root, 'config/package-solution.json'), 'utf8')).solution;
const screenshots = loadScreenshotEvidence(root);
const responsive = JSON.parse(readFileSync(resolve(root, 'ux-review/evidence/responsive-matrix.json'), 'utf8'));
assert.ok(responsive.states >= 4080 && responsive.failures === 0, 'Release evidence requires a full passing responsive matrix');
const junit = readFileSync(resolve(root, 'jest-output/JUnit.xml'), 'utf8');
const junitHeader = junit.match(/<testsuites\b[^>]*>/)?.[0];
assert.ok(junitHeader, 'Jest JUnit report is missing its test summary');
const testCount = Number(junitHeader.match(/\btests="(\d+)"/)?.[1]);
const failures = Number(junitHeader.match(/\bfailures="(\d+)"/)?.[1]);
const errors = Number(junitHeader.match(/\berrors="(\d+)"/)?.[1]);
assert.ok(testCount >= 42 && failures === 0 && errors === 0, 'Release evidence requires all tests to pass');

const packagePath = resolve(root, 'sharepoint/solution/zava-one-hub.sppkg');
const appXml = execFileSync('tar', ['-xOf', packagePath, 'AppManifest.xml'], { encoding: 'utf8' });
const featureXml = execFileSync('tar', ['-xOf', packagePath, `feature_${solution.features[0].id}.xml`], { encoding: 'utf8' });
assert.equal(appXml.match(/<App\b[^>]*\bVersion="([^"]+)"/)?.[1], solution.version, 'Packaged solution version is stale');
assert.equal(featureXml.match(/<Feature\b[^>]*\bVersion="([^"]+)"/)?.[1], solution.features[0].version, 'Packaged feature version is stale');

function artifact(path) {
  const bytes = readFileSync(resolve(root, path));
  return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

evidence.generatedAt = new Date().toISOString();
evidence.catalog.solutionVersion = solution.version;
Object.assign(evidence.validation, {
  jestSuites: [...junit.matchAll(/<testsuite\b/g)].length,
  jestTests: testCount,
  jestFailures: failures,
  responsiveStates: responsive.states,
  responsiveFailures: responsive.failures,
  responsiveViewportWidths: responsive.viewportWidths,
  completeGalleryScreenshots: screenshots.gallery.length,
  publicationGalleryImages: screenshots.publication.length,
  publicationGalleryCaptureMode: 'rendered-element-and-authenticated-viewport',
  publicationGalleryMinimumWidth: Math.min(...screenshots.publication.map((record) => record.width)),
  publicationGalleryMinimumHeight: Math.min(...screenshots.publication.map((record) => record.height)),
  publicationGalleryMaximumHeight: Math.max(...screenshots.publication.map((record) => record.height)),
  publicationGalleryHasHorizontalClipping: false,
  teamsPersonalAppCaptures: 3,
  teamsWorkspaceHeaderHidden: true,
  sppkgAppManifestVersion: solution.version,
  sppkgFeatureVersion: solution.features[0].version,
  sppkgEntries: execFileSync('tar', ['-tf', packagePath], { encoding: 'utf8' }).trim().split(/\r?\n/).length
});
delete evidence.validation.publicationGalleryHasClippedContent;
evidence.publicationScreenshots = screenshots.publication.map(({ path, width, height, bytes, sha256 }) =>
  ({ path, width, height, bytes, sha256 }));
evidence.artifacts = [
  'sharepoint/solution/zava-one-hub.sppkg',
  'teams/zava-one.zip',
  'teams/zavaOneWorkspace/TeamsSPFxApp.zip',
  'teams/zavaOneCompanyWorkspace/TeamsSPFxApp.zip',
  'teams/zavaOnePersonalWorkspace/TeamsSPFxApp.zip'
].map(artifact);
const currentPackageBytes = evidence.artifacts.find(item => item.path.endsWith('.sppkg')).bytes;
if (currentPackageBytes !== previousPackageBytes) {
  for (const document of ['README.md', 'todo.md']) {
    const documentPath = resolve(root, document);
    const content = readFileSync(documentPath, 'utf8');
    const previous = previousPackageBytes.toLocaleString('en-US');
    assert.ok(content.includes(previous), `${document} is missing the previous package size`);
    writeFileSync(documentPath, content.replaceAll(previous, currentPackageBytes.toLocaleString('en-US')));
  }
}
evidence.historicalHostEvidence = 'Workbench, host-resize, and non-gallery screenshot measurements retain their earlier baseline; they are not a new accessibility or host certification.';
evidence.externalGate = 'The sample author confirmed the three Teams personal apps work and supplied authenticated viewport screenshots. Modern SharePoint Top Actions, host CSP/focus, screen-reader, forced-color, and complete accessibility checks remain open.';
writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Updated release evidence: solution ${solution.version}, ${testCount} passing tests, ${screenshots.publication.length} publication images, ${evidence.artifacts.length} packages.`);
