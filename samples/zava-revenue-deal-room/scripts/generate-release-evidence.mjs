import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';

const root = path.resolve(import.meta.dirname, '..');
const outputPath = path.join(root, 'assets', 'release-evidence.json');
const packageConfig = JSON.parse(fs.readFileSync(path.join(root, 'config', 'package-solution.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(root, 'config', 'config.json'), 'utf8'));
const gallery = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'gallery-evidence.json'), 'utf8'));
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'business-matrix-evidence.json'), 'utf8'));
const journeys = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'zavamesh-journey-evidence.json'), 'utf8'));
const testReport = fs.readFileSync(path.join(root, 'jest-output', 'JUnit.xml'), 'utf8');
const testSummary = testReport.match(/<testsuites\b[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*errors="(\d+)"/);
if (!testSummary || Number(testSummary[1]) === 0 || Number(testSummary[2]) !== 0 || Number(testSummary[3]) !== 0) throw new Error('A passing current Jest report is required for release evidence.');
const packagePath = path.join(root, 'sharepoint', packageConfig.paths.zippedPackage);
const agentPath = path.join(root, 'teams', 'zavamesh-revenue-deal-room.zip');
const agentArchive = await unzipper.Open.file(agentPath);
const agentManifestEntry = agentArchive.files.find(entry => entry.path === 'manifest.json');
if (!agentManifestEntry) throw new Error('Packaged Teams manifest is missing');
const agentManifest = JSON.parse((await agentManifestEntry.buffer()).toString('utf8'));
const hash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const packageBytes = fs.readFileSync(packagePath);
const archive = await unzipper.Open.file(packagePath);
const javascript = archive.files.filter((entry) => /ClientSideAssets\/.*\.js$/i.test(entry.path));
const media = archive.files.filter((entry) => /ClientSideAssets\/.*\.(?:jpg|jpeg|png|webp)$/i.test(entry.path));
const mediaHashes = await Promise.all(media.map(async (entry) => hash(await entry.buffer())));
const entries = Object.values(config.bundles).flatMap((bundle) => bundle.components || []);
const evidence = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  package: 'sharepoint/solution/zava-revenue-deal-room.sppkg',
  packageBytes: packageBytes.length,
  packageSha256: hash(packageBytes),
  agentPackage: 'teams/zavamesh-revenue-deal-room.zip',
  agentPackageBytes: fs.statSync(agentPath).size,
  agentPackageSha256: hash(fs.readFileSync(agentPath)),
  configuredBundles: Object.keys(config.bundles).length,
  configuredComponents: entries.length,
  productionJavaScriptFiles: javascript.length,
  totalJavaScriptBytes: javascript.reduce((sum, entry) => sum + (entry.uncompressedSize || 0), 0),
  largestJavaScriptBytes: Math.max(...javascript.map((entry) => entry.uncompressedSize || 0)),
  packagedMediaFiles: media.length,
  duplicateMediaHashes: media.length - new Set(mediaHashes).size,
  visualCaptures: gallery.totalCaptures,
  visualFailures: gallery.failureCount,
  visualSourceSha256: matrix.sourceSha256,
  businessMatrixCaptures: matrix.totalCaptures,
  businessMatrixFailures: matrix.failureCount,
  connectedJourneyCaptures: journeys.captures.length,
  connectedJourneyFailures: journeys.failureCount,
  responsiveWorkspaceVariants: journeys.workspaceVariants,
  totalVisualCaptures: gallery.totalCaptures + matrix.totalCaptures + journeys.captures.length,
  businessMatrixInlineIntents: matrix.inlineMatrixCount / 3,
  measuredInlineStages: matrix.inlineProbes.length,
  desktopInlineHeightBudget: 650,
  narrowInlineHeightBudget: 800,
  maximumDesktopInlineHeight: Math.max(0, ...matrix.inlineProbes.filter(probe => probe.budget === 650).map(probe => probe.height)),
  maximumNarrowInlineHeight: Math.max(0, ...matrix.inlineProbes.filter(probe => probe.budget === 800).map(probe => probe.height)),
  workflowReviewCaptures: matrix.workflowReviewCount,
  workflowReceiptCaptures: matrix.workflowReceiptCount,
  testsPassed: Number(testSummary[1]),
  testsFailed: Number(testSummary[2]),
  solutionVersion: packageConfig.solution.version,
  agentAuthoredVersion: JSON.parse(fs.readFileSync(path.join(root, 'copilot', 'manifest.json'), 'utf8')).version,
  agentPackagedVersion: agentManifest.version,
  externalPrerequisite: 'Authenticated Microsoft 365 tenant for Workbench CSP, model routing, iframe focus, forced colors, and screen-reader host validation.'
};
const stable = (value) => JSON.stringify({ ...value, generatedAt: undefined }, null, 2);
if (process.argv.includes('--check')) {
  if (!fs.existsSync(outputPath)) throw new Error('Release evidence is missing. Run npm run generate:release-evidence.');
  const current = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  if (stable(current) !== stable(evidence)) throw new Error('Release evidence is stale. Run npm run generate:release-evidence.');
  console.log(JSON.stringify({ packageBytes: evidence.packageBytes, components: evidence.configuredComponents, media: evidence.packagedMediaFiles, captures: evidence.visualCaptures, current: true }));
} else {
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(`Generated release evidence for ${evidence.packageBytes} package bytes.`);
}
