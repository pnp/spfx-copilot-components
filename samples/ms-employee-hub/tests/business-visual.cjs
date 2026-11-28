// Optional real-browser review, using the existing studio and installed dev tools.
// BROWSER_PATH=<Chrome/Edge executable> node tests/business-visual.cjs [--capture]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { build } = require('esbuild');
const sass = require('sass-embedded');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const out = path.join(__dirname, 'business-visual');
const capture = process.argv.includes('--capture');

async function run() {
  const bundle = await build({ absWorkingDir: root, entryPoints: ['review/index.tsx'], bundle: true, minify: true,
    format: 'iife', target: 'es2020', write: false, outfile: 'business-review.js', define: { 'process.env.NODE_ENV': '"production"' },
    loader: { '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl' },
    plugins: [{ name: 'review-styles', setup(b) { b.onLoad({ filter: /\.s[ac]ss$/ }, async a => ({
      contents: (await sass.compileAsync(a.path, { quietDeps: true, loadPaths: [path.join(root, 'node_modules')] })).css,
      loader: a.path.includes('.global.') ? 'css' : 'local-css', resolveDir: path.dirname(a.path)
    })); } }] });
  const js = bundle.outputFiles.find(f => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
  const css = bundle.outputFiles.find(f => f.path.endsWith('.css'))?.text || '';
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0}body{font:16px/1.5 "Segoe UI",sans-serif}${css}</style><div id="root"></div><script>${js}</script>`;
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, channel: process.env.BROWSER_PATH ? undefined : 'chrome', headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => route.request().resourceType() === 'document' && route.request().url().startsWith('http://127.0.0.1:4371/') ?
      route.fulfill({ contentType: 'text/html', body: html }) : route.abort());
    const open = async (q, width) => {
      await page.setViewportSize({ width, height: 840 });
      await page.goto(`http://127.0.0.1:4371/?bare=1&clock=2026-11-27T15:00:00Z&${q}`);
      await page.locator('.slt-body h2').waitFor();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    const viewport = async (name, budget, screenshot = true, fullPage = false) => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}: horizontal overflow`);
      const box = await page.locator('main').boundingBox();
      if (capture && (screenshot || (budget && box.height > budget))) { fs.mkdirSync(out, { recursive: true }); await page.evaluate(() => window.scrollTo(0,0)); await page.screenshot({ path: path.join(out, `${name}.png`), fullPage }); }
      if (budget && box.height > budget) errors.push(`${name}: inline height ${Math.round(box.height)} > ${budget}`);
      console.log(`${name}: ${Math.round(box.width)} × ${Math.round(box.height)}; no overflow`);
    };
    for (const w of [760, 390, 320]) {
      await open('entry=9&mode=inline&marketId=Germany&channel=Partner&period=this%20quarter', w);
      assert.match(await page.locator('.slt-heading h2').innerText(), /8 of 60/);
      await viewport(`lead-inline-${w}`, w === 760 ? 650 : 800);
      await page.getByLabel('Acquisition channel').selectOption('inbound');
      assert.match(await page.locator('.slt-heading h2').innerText(), /12 of 40/);
      const ribbon = page.getByRole('button', { name: 'Not qualified → In nurture: 16 of 40' });
      await ribbon.focus(); await page.keyboard.press('Enter'); assert.equal(await ribbon.getAttribute('aria-pressed'), 'true');
      await page.getByRole('button', { name: /Expand Lead conversion/ }).click();
      assert.equal(await page.getByLabel('Acquisition channel').inputValue(), 'inbound');
      assert.equal(await ribbon.getAttribute('aria-pressed'), 'true'); assert.match(await page.locator('.slt-readout').innerText(), /16\/40/);
      if (w === 390) await viewport('lead-full-390',undefined,true,true);
      if (w === 760) {
        await page.getByRole('button', { name: /Prepare an investigation/ }).click();
        await page.getByLabel('Accountable role').waitFor();
        await page.getByRole('button', { name: 'Back', exact: true }).click();
        assert.equal(await page.getByLabel('Acquisition channel').inputValue(), 'inbound');
        assert.equal(await ribbon.getAttribute('aria-pressed'), 'true');
      }
    }
    await open('entry=9&marketId=DE&channel=Partner&mode=full',1280); await viewport('lead-full-1280',undefined,true,true);
    await page.getByRole('button', { name: /Prepare an investigation/ }).click();
    await page.getByLabel('Accountable role').selectOption('Partner Sales lead');
    await page.getByLabel('Review checkpoint').selectOption('Compare the next like-aged cohort');
    await viewport('action-draft-1280',undefined,true,true); await page.getByRole('button', { name: /Review action/ }).click(); await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Record session action' }).click();
    assert.match(await page.locator('.slt-action').innerText(), /8\/60 \(13.3%\)/); await viewport('action-receipt-1280',undefined,true,true);
    await open('entry=30&landing=business&mode=full&fixed=1',1280); await viewport('landing-1280',undefined,true,true);
    await open('entry=30&landing=business&mode=full&fixed=1',390); await viewport('landing-390',undefined,true,true);
    for (const selector of ['.slt-pace strong','.slt-stages span:nth-child(2)']) {
      assert.equal(await page.locator(selector).evaluate(node => {
        const range = node.ownerDocument.createRange(); range.selectNodeContents(node); return range.getClientRects().length;
      }),1,`${selector}: the narrow folio must not split a percentage or stage name`);
    }
    await open('entry=30&landing=business&mode=full&fixed=1&theme=dark',1280); await viewport('landing-dark-1280',undefined,true,true);
    for (const w of [390,760]) {
      await open('entry=6&mode=inline&theme=dark',w);
      await viewport(`action-inline-${w}`,w === 390 ? 800 : 650,false);
      await page.getByRole('button', { name: /Use this evidence/ }).click();
      await page.getByLabel('Accountable role').selectOption('Partner Sales lead');
      await page.getByLabel('Review checkpoint').selectOption('Compare the next like-aged cohort');
      await viewport(`action-inline-draft-${w}`,w === 390 ? 800 : 650,false);
      await page.getByRole('button', { name:/Review action/ }).click();
      assert.equal(await page.getByRole('checkbox').isChecked(),false);
      await viewport(`action-inline-review-${w}`,w === 390 ? 800 : 650,false);
      await page.getByRole('checkbox').check(); await page.getByRole('button',{name:'Record session action'}).click();
      await viewport(`action-inline-receipt-${w}`,w === 390 ? 800 : 650,w === 390);
      if (w === 390) {
        await open('entry=6&mode=inline&theme=dark',w);
        await page.getByRole('button', { name:/Use this evidence/ }).click();
        await page.getByRole('button', { name:/Expand/ }).click();
        await page.getByLabel('Accountable role').selectOption('Partner Sales lead');
        await page.getByLabel('Review checkpoint').selectOption('Compare the next like-aged cohort');
        await page.getByRole('button', { name:/Review action/ }).click();
        assert.equal(await page.getByRole('checkbox').isChecked(),false);
        await viewport('action-review-dark-390',undefined,true,true);
      }
    }
    for (const w of [320,390,760,1280]) {
      for (const entry of [3,7,8]) {
        await open(`entry=${entry}&mode=inline&theme=${w === 390 ? 'dark' : 'light'}`,w);
        const name = `task-${entry}-inline-${w}`;
        assert.ok(await page.locator('.slt-details summary').isVisible(), `${name}: no exact table`);
        await viewport(name, w === 760 ? 650 : w <= 390 ? 800 : undefined, false);
        await page.locator('.slt-details summary').focus(); await page.keyboard.press('Enter');
        await page.locator('.slt-details [aria-pressed=false]').first().focus(); await page.keyboard.press('Enter');
        assert.equal(await page.locator('.slt-details [aria-pressed=true]').count(),1);
        if (w === 390 && entry === 7) { await page.locator('.slt-details summary').click(); await viewport('forecast-dark-390'); }
      }
    }
    assert.deepEqual(errors, [], 'Browser rendering errors');
  } finally { await browser.close(); }
}
run().catch(e => { console.error(e); process.exitCode = 1; });
