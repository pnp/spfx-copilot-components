import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright-core';
import * as esbuild from 'esbuild';
import * as sass from 'sass-embedded';
import { reviewBrowserPath, root } from '../scripts/review.mjs';
import { checkTechLayouts } from './techLayoutCheck.mjs';

// Run in memory so local TechWeb review never replaces the studio's current build.
const bundle = await esbuild.build({
  absWorkingDir: root, entryPoints:['review/index.tsx'], outfile:'tests/tech-memory.js', write:false, bundle:true,
  platform:'browser', format:'iife', minify:true, target:'es2020', define:{'process.env.NODE_ENV':'"production"'},
  loader:{'.jpg':'dataurl','.webp':'dataurl','.png':'dataurl','.svg':'dataurl'},
  plugins:[{name:'tech-local-styles',setup(build){
    build.onLoad({filter:/\.s[ac]ss$/},async({path:p})=>({contents:(await sass.compileAsync(p,{quietDeps:true,loadPaths:[path.join(root,'node_modules')]})).css,loader:p.includes('.global.')?'css':'local-css',resolveDir:path.dirname(p)}));
  }}]
});
const files = Object.fromEntries(bundle.outputFiles.map(f => [path.extname(f.path), f.text]));
const home = 'http://tech.localhost/';
const browser = await chromium.launch({executablePath: await reviewBrowserPath()});
try {
  const page = await browser.newPage({reducedMotion:'reduce'}); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(`${home}**`, route => {
    const ext = path.extname(new URL(route.request().url()).pathname);
    return route.fulfill(ext === '.css' ? {contentType:'text/css',body:files['.css']} : ext === '.js' ? {contentType:'text/javascript',body:files['.js']} : {
      contentType:'text/html', body:'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:16px/1.5 "Segoe UI",sans-serif}</style><link rel="stylesheet" href="tech.css"><div id="root"></div><script src="tech.js"></script></html>'
    });
  });
  const open = async (id, width, extra = {}) => {
    await page.setViewportSize({width,height:900});
    const q = new URLSearchParams({bare:'1',clock:'2026-11-27T09:00:00Z',entry:String(id),mode:'full',landing:'tech',fixed:id===30?'1':'0',...extra});
    await page.goto(`${home}?${q}`);
    await page.locator('[data-tech-mode="full"]').waitFor(); await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `#${id} overflows at ${width}`);
  };
  const verifyPhoto = async selector => {
    assert.ok(await page.locator(selector).evaluate(async el => {
      const url = /url\("?(data:image\/[^")]+)"?\)/.exec(getComputedStyle(el).backgroundImage);
      if (!url || !el.getBoundingClientRect().height) return false;
      const img = new Image(); img.src=url[1]; await img.decode(); return img.naturalWidth >= 600;
    }), `${selector}: bundled photograph must decode and occupy rendered space`);
  };
  for (const width of [1280,390,320]) {
    await open(30,width); await verifyPhoto('.tw-coverphoto'); await verifyPhoto('.tw-craftphoto');
    assert.equal(await page.getByRole('img',{name:'Microsoft',exact:true}).count(),1);
    const mast = page.getByRole('navigation',{name:'TechWeb sections'});
    if (width < 400) {
      const menu = mast.getByRole('button',{name:/Explore TechWeb/}); await menu.focus(); await page.keyboard.press('Enter');
      assert.equal(await menu.getAttribute('aria-expanded'),'true');
    }
    const manager = mast.getByRole('button',{name:'Manager view',exact:true}); await manager.focus(); await page.keyboard.press('Enter');
    await page.locator('.tw-scoreboard').waitFor();
    assert.match(await page.locator('.tw-scoreboard').innerText(),/16 of 17 responses/);
    assert.match(await page.locator('.tw-ratio').innerText(),/68\.8%/);
    const flow = page.getByRole('button',{name:'Request flow',exact:true}); await flow.click();
    assert.match(await page.locator('.tw-selection').innerText(), /6 of 24/);
    await open(30,width,{actor:'employee',theme:'dark'});
    assert.equal(await page.locator('.tw-navlinks').getByRole('button',{name:'Manager view',includeHidden:true}).count(),0);
    const input=page.getByRole('searchbox'); await input.fill('IT-2048'); await input.press('Enter');
    const results=page.getByRole('region',{name:'Search results'}); const hit=results.getByRole('button',{name:/My conversation.*IT-2048/});
    await hit.focus(); await page.keyboard.press('Enter'); await page.locator('.tw-thread').waitFor();
    assert.match(await page.locator('.tw-heading').innerText(),/IT-2048/);
    await input.fill('EQ-4102'); await input.press('Enter'); assert.match(await results.innerText(),/No matches/);
    for (const id of [19,20,21,22,23,24,25,26,27,28]) {
      await open(id,width);
      if ([26,27].includes(id)) {
        await page.locator('.tw-data summary').focus(); await page.keyboard.press('Enter');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1), `#${id} exact table overflows at ${width}`);
      }
    }
  }
  const sizes = await checkTechLayouts(page, home);
  console.table([760,390].map(width=>({width,maxInlineHeight:Math.max(...sizes.filter(r=>r.mode==='inline'&&r.width===width).map(r=>r.height))})));
  assert.deepEqual(errors,[]);
  console.log('TechWeb: photos, scoped navigation/search, responsive full pages, manager facts and compact keyboard regression checks passed.');
  if (process.argv.includes('--capture')) for (const [name,id,width,height] of [['home',30,1280,830],['manager',26,1280,900],['mobile',30,390,860],['ticket',22,1280,820]]) {
    await open(id,width); await page.setViewportSize({width,height}); await page.screenshot({fullPage:true,path:path.join(root,'tests',`techStudio-${name}-local.png`)});
  }
} finally { await browser.close(); }
