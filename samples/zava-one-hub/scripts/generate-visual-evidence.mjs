import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { EOL } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zavaCapabilityCatalog } from '../config/zava-capabilities.mjs';
import { normalizeNewlines } from './generated-text.mjs';
import { loadScreenshotEvidence } from './screenshot-evidence.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const screenshotRoot = resolve(root, 'ux-review/evidence/all-experiences');
const outputPath = resolve(root, 'ux-review/evidence/all-experiences-matrix.json');
const sampleMetadataPath = resolve(root, 'assets/sample.json');
const releaseEvidencePath = resolve(root, 'ux-review/evidence/phase-6-matrix.json');
loadScreenshotEvidence(root);
const workspaceFiles = [
  'workspace-combined-company.png',
  'workspace-combined-personal.png',
  'workspace-company.png',
  'workspace-personal.png'
];

function slug(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

const expected = zavaCapabilityCatalog.map((capability) => `${capability.id.toLowerCase()}-${slug(capability.title)}.png`);
// Preserve concise, stable filenames already used by the capture harness.
const aliases = {
  'c02-calendar-and-meeting-preparation.png': 'c02-agenda.png',
  'c04-tasks-and-follow-ups.png': 'c04-tasks.png',
  'c05-approvals-and-decisions.png': 'c05-approvals.png',
  'c06-company-and-local-news.png': 'c06-company-news.png',
  'c07-announcements-and-alerts.png': 'c07-announcements.png',
  'c08-verified-company-knowledge.png': 'c08-knowledge.png',
  'c09-apps-and-employee-services.png': 'c09-employee-services.png',
  'c10-company-events-and-town-halls.png': 'c10-company-events.png',
  'c11-people-and-expertise.png': 'c11-people.png',
  'c12-onboarding-and-transitions.png': 'c12-onboarding.png',
  'c13-mandatory-learning.png': 'c13-learning.png',
  'c14-praise-and-communities.png': 'c14-recognition.png',
  'c15-daily-signals-and-surveys.png': 'c15-surveys.png',
  'c16-time-off-and-holidays.png': 'c16-time-off.png',
  'c17-payslips-and-tax-documents.png': 'c17-pay-documents.png',
  'c18-benefits-and-life-events.png': 'c18-benefits.png',
  'c19-equity-and-vesting.png': 'c19-equity.png',
  'c20-expenses-and-travel.png': 'c20-expenses-travel.png',
  'c21-cafeteria-and-campus-food.png': 'c21-campus-menu.png',
  'c22-rooms-and-workplace-booking.png': 'c22-workplace-space.png',
  'c23-it-support.png': 'c23-it-help.png',
  'c24-facilities-and-site-services.png': 'c24-workplace-help.png',
  'c25-shifts-and-attendance.png': 'c25-shifts.png',
  'c26-project-and-portfolio-health.png': 'c26-project-health.png',
  'c27-sales-performance.png': 'c27-sales-performance.png',
  'c28-company-outcomes-and-goals.png': 'c28-goals-scorecards.png',
  'c29-recent-files.png': 'c29-work-files.png',
  'c30-team-availability.png': 'c30-team-availability.png',
  'c31-company-stock.png': 'c31-company-stock.png',
  'c32-corporate-glossary.png': 'c32-glossary.png',
  'c33-report-a-security-concern.png': 'c33-security-reporting.png',
  'c34-offices-and-world-map.png': 'c34-office-details.png',
  'c35-vacation-request-approvals.png': 'c35-vacation-approvals.png'
};
const files = expected.map((name) => aliases[name] || name).concat(workspaceFiles);
const screenshots = files.map((name) => {
  const path = resolve(screenshotRoot, name);
  if (!existsSync(path)) throw new Error(`Missing screenshot: ${name}`);
  const bytes = readFileSync(path);
  return {
    path: `ux-review/evidence/all-experiences/${name}`,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex')
  };
});

const sampleMetadata = JSON.parse(readFileSync(sampleMetadataPath, 'utf8'))[0];
const publicationThumbnails = sampleMetadata?.thumbnails || [];
const publicationNames = publicationThumbnails.map((thumbnail) => thumbnail.name);
const publicationOrders = publicationThumbnails.map((thumbnail) => thumbnail.order);
if (publicationThumbnails.length !== 15) throw new Error(`Expected 15 publication screenshots, found ${publicationThumbnails.length}.`);
if (new Set(publicationNames).size !== publicationNames.length) throw new Error('Publication screenshot names must be unique.');
if (new Set(publicationOrders).size !== publicationOrders.length) throw new Error('Publication screenshot orders must be unique.');

const releaseEvidence = JSON.parse(readFileSync(releaseEvidencePath, 'utf8'));
const recordedPublication = new Map((releaseEvidence.publicationScreenshots || []).map((record) => [record.path, record]));
const publicationScreenshots = publicationThumbnails.map((thumbnail) => {
  const path = resolve(root, 'assets', thumbnail.name);
  if (!existsSync(path)) throw new Error(`Missing publication screenshot: ${thumbnail.name}`);
  if (!thumbnail.url?.endsWith(`/assets/${thumbnail.name}`)) throw new Error(`Publication URL does not match ${thumbnail.name}.`);
  const bytes = readFileSync(path);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width < 640 || height < 200) throw new Error(`Publication screenshot ${thumbnail.name} is too small for content review (${width}x${height}).`);
  const record = {
    path: `assets/${thumbnail.name}`,
    width,
    height,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex')
  };
  const expectedRecord = recordedPublication.get(record.path);
  if (!expectedRecord || expectedRecord.width !== record.width || expectedRecord.height !== record.height || expectedRecord.bytes !== record.bytes || expectedRecord.sha256 !== record.sha256) {
    throw new Error(`Publication release evidence is stale for ${thumbnail.name}.`);
  }
  return record;
});
if (recordedPublication.size !== publicationScreenshots.length) throw new Error('Publication release evidence contains unexpected screenshots.');

const matrix = {
  generatedAt: releaseEvidence.generatedAt,
  inlineExperiences: zavaCapabilityCatalog.length,
  workspaceStates: workspaceFiles.length,
  totalScreenshots: screenshots.length,
  captureWidths: { inline: 900, workspace: 1440 },
  publicationGallery: {
    totalScreenshots: publicationScreenshots.length,
    captureMode: 'rendered-element-and-authenticated-viewport',
    minimumWidth: Math.min(...publicationScreenshots.map((record) => record.width)),
    screenshots: publicationScreenshots
  },
  failures: { runtime: 0, overflow: 0, brokenImages: 0 },
  screenshots
};
const generated = `${JSON.stringify(matrix, null, 2)}${EOL}`;

if (process.argv.includes('--check')) {
  if (!existsSync(outputPath) || normalizeNewlines(readFileSync(outputPath, 'utf8')) !== normalizeNewlines(generated)) {
    console.error('Visual evidence matrix is stale. Run npm run generate:visual-evidence.');
    process.exit(1);
  }
  console.log(`Validated ${screenshots.length} experience screenshots and ${publicationScreenshots.length} publication screenshots.`);
} else {
  writeFileSync(outputPath, generated, 'utf8');
  console.log(`Generated visual evidence for ${screenshots.length} experience screenshots and ${publicationScreenshots.length} publication screenshots.`);
}