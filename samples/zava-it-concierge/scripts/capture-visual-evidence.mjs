import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { context as createBuildContext } from 'esbuild';
import { chromium } from 'playwright';

import { loadIntentCatalog } from './load-intent-catalog.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(projectRoot, 'scripts', 'visual-harness');
const outputDirectory = path.join(projectRoot, 'temp', 'visual-evidence');
const assetsDirectory = path.join(projectRoot, 'assets');
const evidencePath = path.join(assetsDirectory, 'visual-evidence.json');
const desktopViewport = { width: 1440, height: 1000 };
const inlineViewport = { width: 760, height: 1000 };
const mobileViewport = { width: 390, height: 844 };
const intents = await loadIntentCatalog(projectRoot);
const captureResults = [];
const responsiveResults = [];

function kebabCase(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readPngDimensions(filePath) {
  const bytes = await readFile(filePath);
  assert(bytes.length > 24 && bytes.subarray(1, 4).toString('ascii') === 'PNG', `${path.basename(filePath)} is not a PNG.`);
  return { bytes: bytes.length, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

await rm(outputDirectory, { force: true, recursive: true });
await mkdir(outputDirectory, { recursive: true });
await mkdir(assetsDirectory, { recursive: true });
await copyFile(path.join(sourceDirectory, 'index.html'), path.join(outputDirectory, 'index.html'));

const buildContext = await createBuildContext({
  bundle: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  entryNames: 'app',
  entryPoints: [path.join(sourceDirectory, 'index.tsx')],
  loader: { '.png': 'file', '.scss': 'local-css' },
  outdir: outputDirectory
});

const server = await buildContext.serve({ host: '127.0.0.1', port: 0, servedir: outputDirectory });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: desktopViewport });
let consoleErrors = [];
let pageErrors = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function settlePage() {
  await page.locator('.visual-harness').waitFor({ state: 'visible' });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((image) => image.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      })));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function capture(filename, query, viewport, variant, interact, publication = true) {
  consoleErrors = [];
  pageErrors = [];
  await page.setViewportSize(viewport);
  await page.goto(`http://127.0.0.1:${server.port}/?${query}`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ colorScheme: query.includes('theme=dark') ? 'dark' : 'light', reducedMotion: 'reduce' });
  await settlePage();
  if (interact) {
    await interact(page);
    await settlePage();
  }

  const runtime = await page.evaluate(() => ({
    brokenImages: Array.from(document.images).filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.alt || image.src),
    canvasCount: document.querySelectorAll('canvas').length,
    deprecatedChrome: Array.from(document.querySelectorAll('p')).map((element) => element.textContent?.trim()).filter((text) => text === 'Decision insight' || text === 'From your prompt'),
    engineCount: window.__ZAVA_VISUAL_REVIEW__?.engineCount() ?? -1,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    title: document.querySelector('h1, h2')?.textContent?.trim() ?? ''
  }));
  const filePath = path.join(publication ? assetsDirectory : outputDirectory, filename);
  await page.locator('.visual-harness').screenshot({ path: filePath, animations: 'disabled', scale: 'css' });
  const dimensions = await readPngDimensions(filePath);
  (publication ? captureResults : responsiveResults).push({
    filename,
    variant,
    viewport,
    ...dimensions,
    ...runtime,
    consoleErrors: [...consoleErrors],
    pageErrors: [...pageErrors]
  });
}

try {
  for (const intent of intents) {
    await capture(
      `inline-${kebabCase(intent.name)}.png`,
      `intent=${encodeURIComponent(intent.name)}&mode=inline&theme=light`,
      inlineViewport,
      'inline-default'
    );
  }

  await capture('fullscreen-personal.png', 'intent=MyDeviceStatus&mode=fullscreen&theme=light', desktopViewport, 'dashboard-personal');
  await capture('fullscreen-team.png', 'intent=GetApprovalQueue&mode=fullscreen&theme=light', desktopViewport, 'dashboard-team');
  await capture('fullscreen-portfolio.png', 'intent=GetFleetHealth&mode=fullscreen&theme=light', desktopViewport, 'dashboard-portfolio');
  await capture('fullscreen-personal-mobile.png', 'intent=MyDeviceStatus&mode=fullscreen&theme=light', mobileViewport, 'mobile');
  await capture('fullscreen-portfolio-dark.png', 'intent=GetFleetHealth&mode=fullscreen&theme=dark', desktopViewport, 'dark');

  await capture(
    'inline-approval-queue-detail.png',
    'intent=GetApprovalQueue&mode=inline&theme=light',
    inlineViewport,
    'detail',
    async (activePage) => activePage.getByRole('button', { name: /^Review / }).first().click()
  );
  await capture(
    'inline-review-device-approval-confirmation.png',
    'intent=ReviewDeviceApproval&mode=inline&theme=light',
    inlineViewport,
    'confirmation',
    async (activePage) => {
      await activePage.getByRole('textbox', { name: 'Decision rationale' }).fill('The request is within policy and protects customer workshop continuity.');
      await activePage.getByRole('button', { name: 'Approve request' }).click();
    }
  );
  await capture(
    'inline-configure-device-request-receipt.png',
    'intent=ConfigureDeviceRequest&mode=inline&theme=light',
    inlineViewport,
    'receipt',
    async (activePage) => {
      await activePage.getByRole('textbox', { name: 'Business rationale' }).fill('The configuration supports customer workshops and product analysis.');
      await activePage.getByRole('button', { name: 'Review configuration' }).click();
      await activePage.getByRole('button', { name: 'Submit request' }).click();
    }
  );

  for (const intent of intents) {
    await capture(`inline-${kebabCase(intent.name)}-narrow.png`, `intent=${encodeURIComponent(intent.name)}&mode=inline&theme=light`, { width: 340, height: 1000 }, 'narrow-light', undefined, false);
    await capture(`inline-${kebabCase(intent.name)}-dark.png`, `intent=${encodeURIComponent(intent.name)}&mode=inline&theme=dark`, inlineViewport, 'standard-dark', undefined, false);
  }
  const failed = (result) => result.horizontalOverflow || result.brokenImages.length > 0 ||
    result.deprecatedChrome.length > 0 || result.consoleErrors.length > 0 || result.pageErrors.length > 0;
  const responsiveFailures = responsiveResults.filter(failed);
  await writeFile(path.join(assetsDirectory, 'rc0-responsive-evidence.json'), `${JSON.stringify({
    generatedAt: new Date().toISOString(), intents: intents.length, publishedStates: captureResults.length,
    supplementalStates: responsiveResults.length, failureCount: responsiveFailures.length,
    captures: responsiveResults, screenshotLocation: 'Regenerable local temp/visual-evidence captures, not publication thumbnails.'
  }, null, 2)}\n`, 'utf8');
  assert(responsiveResults.length === intents.length * 2 && responsiveFailures.length === 0,
    `Narrow/dark matrix has ${responsiveFailures.length} failure(s): ${responsiveFailures.map(result => result.filename).join(', ')}`);
  const failures = captureResults.filter((result) => result.horizontalOverflow
    || result.brokenImages.length > 0
    || result.deprecatedChrome.length > 0
    || result.consoleErrors.length > 0
    || result.pageErrors.length > 0);
  const evidence = {
    schemaVersion: 1,
    captureTool: 'Playwright 1.62.1',
    source: 'scripts/visual-harness',
    totalCaptures: captureResults.length,
    inlineDefaults: captureResults.filter((result) => result.variant === 'inline-default').length,
    dashboardCaptures: captureResults.filter((result) => result.variant.startsWith('dashboard-')).length,
    representativeVariants: captureResults.filter((result) => !['inline-default', 'dashboard-personal', 'dashboard-team', 'dashboard-portfolio'].includes(result.variant)).length,
    failureCount: failures.length,
    captures: captureResults
  };
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  assert(captureResults.length === intents.length + 8, `Expected ${intents.length + 8} captures, found ${captureResults.length}.`);
  assert(failures.length === 0, `Visual evidence found ${failures.length} failing capture(s): ${failures.map((result) => result.filename).join(', ')}.`);
  console.log(`Captured ${captureResults.length} cropped publication screenshots and validated ${responsiveResults.length} supplemental narrow/dark states with zero runtime, media, or overflow failures.`);
} finally {
  await page.close();
  await browser.close();
  await buildContext.dispose();
}