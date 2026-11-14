import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import ts from 'typescript';
import { zavaCapabilityCatalog } from '../config/zava-capabilities.mjs';

const baseUrl = process.env.ZAVA_UX_REVIEW_URL || 'http://127.0.0.1:4322';
const output = resolve(process.env.ZAVA_RESPONSIVE_OUTPUT || 'temp/responsive');
mkdirSync(output, { recursive: true });
const widths = process.argv.includes('--quick') ? [320] : [320, 390, 560, 768, 1024, 1280, 1440, 1600];
if (process.argv.includes('--record') && process.argv.includes('--quick')) throw new Error('Only a full responsive run can record release evidence');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const records = [];
const configurationPath = new URL('../src/shared/catalog/webPartConfigurations.ts', import.meta.url);
const configurationSource = ts.transpileModule(readFileSync(configurationPath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { zavaWebPartConfigurations } = await import(`data:text/javascript;base64,${Buffer.from(configurationSource).toString('base64')}`);

async function measure(page, name, errors, checkBalance = false) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  await page.evaluate(() => Promise.all(document.getAnimations().filter((animation) =>
    animation.effect?.getTiming().iterations !== Infinity).map((animation) => animation.finished)));
  const problems = await page.evaluate(() => {
    const issues = [];
    if (document.documentElement.scrollWidth > innerWidth + 2) issues.push({ issue: 'document-overflow', width: document.documentElement.scrollWidth });
    for (const element of document.querySelectorAll('[data-layout] *')) {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (!rect.width || !rect.height || style.visibility === 'hidden' || element.closest('svg')) continue;
      // Spinner tails intentionally extend their box; drag live regions are visually clipped.
      if (element.matches('.fui-Spinner, .fui-Spinner__spinner') || style.clipPath === 'inset(100%)') continue;
      const scrollContainer = element.closest('[data-responsive-scroll]');
      if (scrollContainer && ['auto', 'scroll'].includes(getComputedStyle(scrollContainer).overflowX)) continue;
      const content = element.closest('[data-layout]').getBoundingClientRect();
      if (rect.left < content.left - 2 || rect.right > content.right + 2 ||
        (element.clientWidth && element.scrollWidth > element.clientWidth + 2 &&
          !['auto', 'scroll'].includes(style.overflowX) && style.textOverflow !== 'ellipsis')) {
        issues.push({ tag: element.tagName, text: element.textContent?.slice(0, 90), width: Math.round(rect.width),
          left: Math.round(rect.left), right: Math.round(rect.right), client: element.clientWidth, scroll: element.scrollWidth });
      }
    }
    return issues.slice(0, 30);
  });
  const brokenImages = await page.locator('img').evaluateAll((images) => images.filter((image) => !image.naturalWidth).length);
  const record = { name, viewportWidth: page.viewportSize().width,
    theme: await page.locator('body').getAttribute('data-theme'),
    contentWidth: Math.round((await page.locator('[data-layout]').first().boundingBox()).width),
    layout: await page.locator('[data-layout]').first().getAttribute('data-layout'),
    problems, runtimeErrors: [...errors], brokenImages };
  if (checkBalance && record.contentWidth >= 1280) {
    record.columnHeights = await page.locator('[data-portal-column]').evaluateAll((columns) =>
      columns.map((column) => Math.round(column.getBoundingClientRect().height)));
    const mean = record.columnHeights.reduce((total, height) => total + height, 0) / 3;
    record.columnSpread = (Math.max(...record.columnHeights) - Math.min(...record.columnHeights)) / mean;
    if (record.columnSpread > 0.2) problems.push({ issue: 'unbalanced-default-columns', heights: record.columnHeights });
  }
  records.push(record);
  if (problems.length || errors.length || brokenImages) {
    console.log(`FAIL ${name}: ${JSON.stringify(problems.slice(0, 4))}`);
    await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true, animations: 'disabled' });
  } else if (process.argv.includes('--screenshots')) {
    const receipt = page.locator('[data-submission-receipt]');
    if (await receipt.count()) {
      await receipt.screenshot({ path: resolve(output, `${name}.png`), animations: 'disabled' });
    } else if (/^(surveys-results|vacationApprovals-journey.*detail)/.test(name)) {
      await page.locator('[data-layout]').first().screenshot({ path: resolve(output, `${name}.png`), animations: 'disabled' });
    }
  }
}

async function assertPollResults(page) {
  const results = page.getByRole('list', { name: 'Poll result details' });
  if (await results.getByRole('listitem').count() !== 4) throw new Error('Poll results lost an answer');
  const chart = await page.getByRole('img', { name: /Aggregate results from/ }).boundingBox();
  const legend = await results.boundingBox();
  const content = await page.locator('[data-layout="company-daily-poll-results"]').boundingBox();
  if (content.width <= 620 && legend.y < chart.y + chart.height - 2) throw new Error('Narrow poll results did not stack');
}

async function journey(page, intent, prefix, errors) {
  const click = async (name) => {
    await page.getByRole('button', { name, exact: true }).click();
    await measure(page, `${prefix}-${name.replace(/\W+/g, '-')}`, errors);
  };
  switch (intent) {
    case 'recognition':
      await click('Send praise');
      await click('Continue to review');
      await click('Publish recognition');
      await click('Back to recognition');
      break;
    case 'vacationApprovals':
      await click('Reset demo data');
      await page.getByRole('button', { name: /Johanna Lorenz/ }).click();
      await measure(page, `${prefix}-detail`, errors);
      await click('Review decision');
      await click('Approve vacation request');
      await click('Back to updated list');
      break;
    case 'approvals':
      await page.getByRole('button', { name: /Project Aurora budget change/ }).click();
      await measure(page, `${prefix}-detail`, errors);
      await click('Decline');
      await page.getByRole('textbox', { name: 'Reason', exact: true }).fill('Additional accessibility evidence required.');
      await click('Confirm decline');
      await click('Back to approvals');
      break;
    case 'timeOff':
      await click('Request new time off');
      await page.getByLabel('Start date').fill('2026-10-19');
      await page.getByLabel('End date').fill('2026-10-23');
      await page.getByRole('textbox', { name: /Reason/ }).fill('Family vacation with agreed team coverage.');
      await click('Review request');
      await click('Submit time-off request');
      await click('View submitted requests');
      break;
    case 'expensesTravel':
      await click('Create expense report');
      await page.getByRole('checkbox').first().check();
      await click('Review expense report');
      await click('Submit expense report');
      await click('Back to open expenses');
      break;
    case 'workplaceSpace':
      await click('Search available rooms');
      await page.locator('[data-layout="personal-workplace-results"]').waitFor();
      await measure(page, `${prefix}-rooms`, errors);
      await page.getByRole('button', { name: /Available/ }).first().click();
      await click('Review booking');
      await click('Confirm room booking');
      await click('Book another room');
      break;
    case 'itHelp':
      await click('Submit new issue');
      await page.getByLabel('Summary').fill('External display is not detected');
      await page.getByLabel('Description').fill('The external display remains blank after connecting the approved docking station.');
      await click('Review IT issue');
      await click('Submit IT issue');
      await click('View my issues');
      break;
    case 'learning':
      await page.getByRole('button', { name: 'Open details', exact: true }).first().click();
      await measure(page, `${prefix}-detail`, errors);
      break;
    case 'importantMail':
      await page.getByRole('button', { name: /Town hall narrative ready/ }).click();
      await measure(page, `${prefix}-detail`, errors);
      break;
    case 'workFiles':
      await page.getByRole('button', { name: 'Open', exact: true }).first().click();
      await measure(page, `${prefix}-detail`, errors);
      break;
    case 'people':
      await page.getByRole('button', { name: /Johanna Lorenz/ }).click();
      await measure(page, `${prefix}-detail`, errors);
      break;
    case 'securityReporting':
      await click('Continue securely');
      await page.getByRole('textbox', { name: /What happened/ }).fill('An unexpected sign-in notification appeared for the demo account.');
      await page.getByRole('textbox', { name: /Office, device, or service/ }).fill('Helsinki laptop');
      await page.getByRole('checkbox').uncheck();
      await click('Review report');
      await click('Submit security report');
      await click('Start another report');
      break;
    case 'workplaceHelp':
      await page.getByRole('button', { name: /Draft \/ Explicit confirmation required/ }).first().click();
      await measure(page, `${prefix}-review`, errors);
      await page.getByRole('textbox', { name: /Request details|Decision note/ }).fill('Please review this session-only demo request.');
      await click('Confirm demo update');
      await click('Reset experience');
      break;
  }
}

try {
  for (const { width, host, theme } of [...widths.map((width) => ({ width, host: 'viewport', theme: 'light' })),
    ...(process.argv.includes('--quick') ? [320] : [320, 390, 560, 768]).map((width) => ({ width, host: 'desktop-column', theme: 'light' })),
    ...(process.argv.includes('--quick') ? [] : [320, 768, 1440]).map((width) => ({ width, host: 'viewport', theme: 'dark' }))]) {
    const context = await browser.newContext({ viewport: { width: host === 'viewport' ? width : 1440, height: 900 }, deviceScaleFactor: 1,
      colorScheme: theme, reducedMotion: 'reduce', isMobile: host === 'viewport' && width <= 560, hasTouch: host === 'viewport' && width <= 560 });
    const page = await context.newPage();
    let errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-02T09:00:00Z'));
    for (const surface of ['copilotInline', 'webPart']) {
      for (const capability of zavaCapabilityCatalog) {
        errors = [];
        await page.goto(`${baseUrl}/?intent=${capability.intentKey}&surface=${surface}&theme=${theme}`, { waitUntil: 'load' });
        await page.locator('[data-layout]').first().waitFor();
        if (host === 'desktop-column') await page.locator('#root').evaluate((element, width) => { element.style.width = `${width}px`; }, width);
        await measure(page, `${capability.intentKey}-${surface}-${host}-${width}-${theme}`, errors);
        if (capability.intentKey === 'surveys') {
          await page.getByRole('radio').first().check();
          await page.getByRole('button', { name: 'Submit anonymous vote', exact: true }).click();
          await measure(page, `surveys-results-${surface}-${host}-${width}-${theme}`, errors);
          await assertPollResults(page);
          await page.getByRole('button', { name: 'Change my vote', exact: true }).click();
          if (!await page.getByRole('radio').first().isChecked()) throw new Error('Changing a poll vote lost the selected answer');
          await measure(page, `surveys-change-${surface}-${host}-${width}-${theme}`, errors);
        }
        await journey(page, capability.intentKey, `${capability.intentKey}-journey-${surface}-${host}-${width}-${theme}`, errors);
        if (surface === 'webPart') {
          const views = zavaWebPartConfigurations[capability.intentKey]?.topActions.find((action) => action.property === 'primaryView')?.options || [];
          for (const view of views) {
            errors = [];
            await page.goto(`${baseUrl}/?intent=${capability.intentKey}&surface=webPart&primaryView=${view.key}&theme=${theme}`, { waitUntil: 'load' });
            await page.locator('[data-layout]').first().waitFor();
            if (host === 'desktop-column') await page.locator('#root').evaluate((element, width) => { element.style.width = `${width}px`; }, width);
            await measure(page, `${capability.intentKey}-${view.key}-${host}-${width}-${theme}`, errors);
          }
        }
      }
    }
    for (const [mode, view] of [['combined', 'company'], ['combined', 'personal'], ['company', 'company'], ['personal', 'personal']]) {
      for (const teams of [false, true]) {
        errors = [];
        await page.goto(`${baseUrl}/?intent=workspace&mode=${mode}&primaryView=${view}&hideWorkspaceHeader=${teams}&theme=${theme}`, { waitUntil: 'load' });
        await page.locator('[data-layout]').first().waitFor();
        if (host === 'desktop-column') await page.locator('#root').evaluate((element, width) => { element.style.width = `${width}px`; }, width);
        await measure(page, `workspace-${mode}-${view}-${teams ? 'teams' : 'sharepoint'}-${host}-${width}-${theme}`, errors, true);
        if (view === 'company') {
          await page.getByRole('radio').first().check();
          await page.getByRole('button', { name: 'Submit anonymous vote', exact: true }).click();
          await measure(page, `workspace-poll-results-${mode}-${teams}-${host}-${width}-${theme}`, errors);
          await assertPollResults(page);
        }
        await page.getByRole('button', { name: `Edit ${view === 'company' ? 'Company' : 'Personal'} workspace layout`, exact: true }).click();
        await measure(page, `workspace-edit-${mode}-${view}-${teams}-${host}-${width}-${theme}`, errors);
        await page.getByRole('button', { name: `Personalize ${view === 'company' ? 'Company' : 'Personal'} workspace`, exact: true }).click();
        await measure(page, `workspace-settings-${mode}-${view}-${teams}-${host}-${width}-${theme}`, errors);
        await page.getByRole('button', { name: 'Close panel', exact: true }).click();
      }
    }
    await context.close();
    console.log(`Completed ${theme} ${host} width ${width}`);
  }
} finally {
  await browser.close();
  writeFileSync(resolve(output, 'results.json'), `${JSON.stringify({ widths, records }, null, 2)}\n`);
}
const failures = records.filter((record) => record.problems.length || record.runtimeErrors.length || record.brokenImages);
console.log(`${records.length} responsive states measured; ${failures.length} failed. Evidence: ${output}`);
if (failures.length) process.exitCode = 1;
else if (process.argv.includes('--record')) {
  const evidencePath = new URL('../ux-review/evidence/responsive-matrix.json', import.meta.url);
  writeFileSync(evidencePath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    browser: 'Microsoft Edge / Playwright',
    capabilities: zavaCapabilityCatalog.length,
    states: records.length,
    viewportWidths: widths,
    desktopColumnWidths: [320, 390, 560, 768],
    darkViewportWidths: [320, 768, 1440],
    failures: failures.length,
    assertions: ['document and component bounds', 'internal clipping', 'runtime errors', 'loaded images',
      'poll answers and stacked results', 'poll selection retained', 'workflow submissions and return actions',
      'workspace edit and settings states', 'default desktop column spread <= 20%'],
    defaultColumns: records.filter((record) => record.columnHeights).map(({ name, columnHeights, columnSpread }) =>
      ({ name, heights: columnHeights, spread: Number(columnSpread.toFixed(4)) }))
  }, null, 2)}\n`);
}
