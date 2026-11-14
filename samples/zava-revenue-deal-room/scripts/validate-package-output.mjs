import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';

const root = path.resolve(import.meta.dirname, '..');
const packageConfig = JSON.parse(fs.readFileSync(path.join(root, 'config', 'package-solution.json'), 'utf8'));
const packagePath = path.join(root, 'sharepoint', packageConfig.paths.zippedPackage);
if (!fs.existsSync(packagePath)) throw new Error(`Package is missing: ${packagePath}`);
const bytes = fs.statSync(packagePath).size;
const archive = await unzipper.Open.file(packagePath);
const appManifest = archive.files.find(entry => entry.path === 'AppManifest.xml');
if (!appManifest) throw new Error('The deployment package is missing AppManifest.xml.');
const packagedSolutionVersion = (await appManifest.buffer()).toString('utf8').match(/<App\b[^>]*\bVersion="([^"]+)"/)?.[1];
if (packagedSolutionVersion !== packageConfig.solution.version) throw new Error(`Packaged solution version ${packagedSolutionVersion} does not match ${packageConfig.solution.version}.`);
for (const feature of packageConfig.solution.features) {
  const entry = archive.files.find(item => item.path.toLowerCase() === `feature_${feature.id}.xml`.toLowerCase());
  if (!entry) throw new Error(`The deployment package is missing feature ${feature.id}.`);
  const version = (await entry.buffer()).toString('utf8').match(/<Feature\b[^>]*\bVersion="([^"]+)"/)?.[1];
  if (version !== feature.version) throw new Error(`Packaged feature ${feature.id} version ${version} does not match ${feature.version}.`);
}
const javascript = archive.files.filter((entry) => /ClientSideAssets\/.*\.js$/i.test(entry.path));
const agentPackages = archive.files.filter((entry) => /ClientSideAssets\/.*\.zip$/i.test(entry.path));
const media = archive.files.filter((entry) => /ClientSideAssets\/.*\.(?:jpg|jpeg|png|webp)$/i.test(entry.path));
const stale = javascript.filter((entry) => /copilot-component\.js$/i.test(entry.path) || !/_[a-f0-9]{8,}\.js$/i.test(entry.path));
if (!javascript.length) throw new Error('No production JavaScript found in the package.');
if (stale.length) throw new Error(`Stale or unhashed JavaScript found: ${stale.map((entry) => entry.path).join(', ')}`);
if (agentPackages.length !== 1 || !agentPackages[0].path.endsWith('/zavamesh-revenue-deal-room.zip')) throw new Error(`Expected one current embedded agent ZIP, found: ${agentPackages.map((entry) => entry.path).join(', ')}`);
if (javascript.length !== 1) throw new Error(`Expected one shared production bundle, found ${javascript.length}`);
const releaseAssets = path.join(root, 'release', 'assets');
const releaseJavaScript = fs.readdirSync(releaseAssets).filter(file => file.endsWith('.js')).sort();
if (JSON.stringify(releaseJavaScript) !== JSON.stringify(javascript.map(entry => path.basename(entry.path)).sort())) throw new Error('Packaged JavaScript membership does not match the current release assets');
for (const entry of javascript) {
  if (!(await entry.buffer()).equals(fs.readFileSync(path.join(releaseAssets, path.basename(entry.path))))) throw new Error(`Packaged JavaScript bytes are stale: ${entry.path}`);
}
if (!(await agentPackages[0].buffer()).equals(fs.readFileSync(path.join(root, 'teams', 'zavamesh-revenue-deal-room.zip')))) throw new Error('Embedded and Teams agent ZIP bytes differ');
const agentArchive = await unzipper.Open.buffer(await agentPackages[0].buffer());
const agentManifest = agentArchive.files.find(entry => entry.path === 'manifest.json');
if (!agentManifest) throw new Error('The embedded agent archive is missing manifest.json.');
const packagedAgentVersion = JSON.parse((await agentManifest.buffer()).toString('utf8')).version;
const authoredAgentVersion = JSON.parse(fs.readFileSync(path.join(root, 'copilot', 'manifest.json'), 'utf8')).version;
if (packagedAgentVersion !== authoredAgentVersion && !packagedAgentVersion.startsWith(`${authoredAgentVersion}.`)) throw new Error(`Packaged agent version ${packagedAgentVersion} does not match authored version ${authoredAgentVersion}.`);
const brand = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'brand-provenance.json'), 'utf8').replace(/^\uFEFF/, ''));
const provenance = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'asset-provenance.json'), 'utf8'));
const expectedMediaHashes = new Set([...provenance.assets, ...brand.assets].map(asset => asset.sha256));
if (media.length !== expectedMediaHashes.size || media.some((entry) => !/_[a-f0-9]{8,}\.(?:jpg|jpeg|png|webp)$/i.test(entry.path))) throw new Error(`Expected ${expectedMediaHashes.size} hashed persona/brand assets, found: ${media.map((entry) => entry.path).join(', ')}`);
const mediaHashes = await Promise.all(media.map(async (entry) => crypto.createHash('sha256').update(await entry.buffer()).digest('hex')));
if (new Set(mediaHashes).size !== media.length) throw new Error('Duplicate substantial media binaries found in the package.');
if (!mediaHashes.every((hash) => expectedMediaHashes.has(hash))) throw new Error('Packaged persona/brand media does not match approved provenance.');
const sizes = javascript.map((entry) => entry.uncompressedSize || entry.compressedSize || 0);
const report = { packageBytes: bytes, solutionVersion: packagedSolutionVersion, agentVersion: packagedAgentVersion, productionJavaScriptFiles: javascript.length, productionJavaScriptBytes: sizes.reduce((sum, size) => sum + size, 0), largestJavaScriptBytes: Math.max(...sizes), staleJavaScript: stale.length, embeddedAgentPackages: agentPackages.length, packagedMedia: media.length, duplicateMedia: media.length - new Set(mediaHashes).size, sharedBundle: javascript.length === 1, exactReleaseJavaScriptBytes: true, matchingAgentArchives: true };
if (bytes > 10 * 1024 * 1024) report.packageInvestigation = true;
if (report.largestJavaScriptBytes > 1024 * 1024) report.javascriptInvestigation = true;
console.log(JSON.stringify(report));