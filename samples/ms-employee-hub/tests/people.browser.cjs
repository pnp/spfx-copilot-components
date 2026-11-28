// Local HR body proof, not a hosted SPFx capture. Run: node tests/people.browser.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const sass = require('sass-embedded');
const postcss = require('postcss');
const cssModules = require('postcss-modules');
const {chromium} = require('playwright-core');
const root = path.resolve(__dirname, '..');
const out = path.join(__dirname, 'people-visual');
const profile = path.join(out, `.browser-${process.pid}`);
const styleFile = path.join(root, 'src', 'shared', 'hr', 'Hr.module.scss');
const camera = process.argv.includes('--screenshots');
const files = [
  'hosts/VisibleScope.tsx', 'shared/mockData/companyBrief.ts', 'shared/mockData/people.ts', 'shared/mockData/session.ts',
  ...fs.readdirSync(path.join(root, 'src','shared','hr')).filter(f => f.endsWith('.tsx')).map(f => `shared/hr/${f}`)
];
async function run() {
  let styleMap;
  const raw = (await postcss([cssModules({getJSON: (_, map) => { styleMap = map; }})]).process(sass.compile(styleFile).css, {from: 'Hr.module.css'})).css;
  const css = raw.replace(/url\(["']?\.\.\/media\/(hr-[\w-]+\.(?:jpg|png))["']?\)/g,(_,name)=>{
    const data=fs.readFileSync(path.join(root,'src','shared','media',name)).toString('base64');
    return `url("data:image/${name.endsWith('.jpg')?'jpeg':'png'};base64,${data}")`;
  });
  const modules = files.map(id => {
    const text = fs.readFileSync(path.join(root, 'src', ...id.split('/')), 'utf8');
    const js = ts.transpileModule(text, {fileName: id, compilerOptions: {target:ts.ScriptTarget.ES2020, module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.React, esModuleInterop:true}}).outputText;
    return `${JSON.stringify(id.replace(/\.tsx?$/, ''))}:function(require,module,exports){${js}\n}`;
  }).join(',');
  const bundle = `(()=>{const table={${modules}}, cache={};function load(id){
    if(id==='react')return React;if(id.endsWith('.scss'))return ${JSON.stringify(styleMap)};
    if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};
    if(!table[id])throw new Error('Missing local module: '+id);table[id](name=>{if(name==='react')return React;const parts=id.split('/');parts.pop();
      name.split('/').forEach(p=>{if(p==='..')parts.pop();else if(p!=='.')parts.push(p);});return load(parts.join('/'));},m,m.exports);return m.exports;
  }const HR=load('shared/hr/HR').default,svc=load('shared/mockData/session'),report=load('hosts/VisibleScope').ScopeReporter, r=ReactDOM.createRoot(document.querySelector('main'));
    let props={id:0,inputs:{},mode:'full',session:svc.newSession(svc.rehearsalLead,new Date('2026-03-03T19:00:00Z')),navigate:(id,inputs={})=>draw({id,inputs})};
    function draw(update){props={...props,...update};ReactDOM.flushSync(()=>r.render(React.createElement(report.Provider,{value:x=>{window.stage=x.stage;}},React.createElement(HR,props))))}
    window.draw=draw;draw({});
  })();`;
  fs.mkdirSync(profile, {recursive: true});
  const executablePath = [process.env.CHROME_PATH, process.env.EDGE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => p && fs.existsSync(p));
  const context = await chromium.launchPersistentContext(profile, {executablePath, headless: true, viewport: {width:1280,height:840},
    deviceScaleFactor:1, reducedMotion:'reduce', colorScheme:'light', args:['--disable-background-networking','--disable-component-update','--no-default-browser-check']});
  try {
    const page = await context.newPage(), net = [], errors = [];
    await context.route(/^https?:/, route => { net.push(route.request().url()); return route.abort(); });
    page.on('pageerror', e => errors.push(e.message));
    await page.setContent('<!doctype html><html lang="en"><title>HRweb local body proof</title><style>body{margin:0}main{max-width:1450px;padding:clamp(10px,2.4%,40px);margin:auto}*{box-sizing:border-box}@media(prefers-color-scheme:dark){body{background:#20212b}}</style><main></main></html>');
    await page.addStyleTag({content:css});
    for (const [pkg,file] of [['react','react.production.min.js'],['react-dom','react-dom.production.min.js']]) {
      await page.addScriptTag({path:path.join(path.dirname(require.resolve(pkg)), 'umd', file)});
    }
    await page.addScriptTag({content:bundle});
    assert.deepEqual(errors,[]);
    const draw = patch => page.evaluate(p => window.draw(p), patch);
    async function fit(label) {
      const box = await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]);
      assert.ok(box[1] <= box[0] + 1, `${label} overflows: ${box}`);
    }
    async function snap(name) { if (camera) await page.screenshot({path:path.join(out, `${name}.png`)}); }
    for (const width of [1280,390,320]) {
      await page.setViewportSize({width,height:width === 1280 ? 840 : 844});
      await draw({id:0,mode:'full',inputs:{}}); await fit(`Home ${width}`);
      assert.equal(await page.getByRole('img',{name:/Campaign photography/}).count(),1);
      assert.equal(await page.evaluate(async () => {
        const layers=['.hrw-campaign-cover','.hrw-campaign-inset','.hrw-campaign-flourish','.hrw-story-photo'];
        const widths=await Promise.all(layers.map(async sel=>{
          const value=getComputedStyle(document.querySelector(sel)).backgroundImage;
          if(!value.startsWith('url("data:image/'))return 0;
          const image=new Image(); image.src=value.slice(5,-2);await image.decode();return image.naturalWidth;
        }));
        return widths.every(w=>w>120);
      }),true);
      if(width !== 320) await snap(`home-${width}`);
      if(width === 1280) {
        await page.getByRole('tab',{name:'Home',exact:true}).focus(); await page.keyboard.press('End');
        assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Pay, stock, & rewards');
        await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
        assert.equal(await page.getByRole('heading',{name:'Plan your benefits review.'}).count(),1);
      } else {
        assert.equal(await page.getByLabel('HRweb section',{exact:true}).isVisible(),true);
      }
      for (let id=10;id<=18;id++) {
        await draw({id,mode:'full',inputs:{}}); await fit(`#${id} ${width}`);
        if(camera&&width===1280&&[10,12,16].includes(id))await snap(`detail-${id}-${width}`);
      }
      if(width===1280){
        await draw({id:15,mode:'full',inputs:{startDate:'2026-03-12',endDate:'2026-03-13'}});
        await page.getByRole('radio',{name:'Set start date: Mar 16, 2026',exact:true}).check();
        await page.getByRole('button',{name:'End date',exact:true}).click();
        await page.getByRole('radio',{name:/Set end date: Mar 16, 2026/}).focus();await page.keyboard.press('ArrowRight');
        assert.equal(await page.getByLabel('Start date',{exact:true}).inputValue(),'2026-03-16');
        assert.equal(await page.getByLabel('End date',{exact:true}).inputValue(),'2026-03-17');
        await page.getByRole('button',{name:'Next calendar month'}).click(); assert.equal(await page.getByRole('table',{name:'April 2026 working calendar'}).count(),1);
        await draw({id:15,mode:'full',inputs:{startDate:'9999-12-31',endDate:'9999-12-31'}});
        assert.equal(await page.getByRole('table',{name:'March 2026 working calendar'}).count(),1);
        assert.equal(await page.getByRole('button',{name:'Review request'}).isDisabled(),true);
      }
      await draw({id:15,mode:'inline',inputs:{startDate:'2026-03-12',endDate:'2026-03-12'}});
      await page.getByLabel('End date',{exact:true}).fill('2026-03-13'); await page.getByRole('button',{name:'Review request',exact:true}).click();
      assert.equal(await page.evaluate(()=>window.stage),'review');
      if(width === 390) await snap('leave-inline-390');
      await draw({mode:'full'}); await fit(`Leave expanded ${width}`);
      assert.equal(await page.getByRole('heading',{name:'Entitlement ledger'}).isVisible(),true);
      assert.equal(await page.getByRole('heading',{name:'2 eligible workdays'}).count(),1);
      if(width === 1280 || width === 390) await snap(`leave-expanded-${width}`);
    }
    await page.setViewportSize({width:390,height:844}); await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
    await draw({id:0, inputs:{}, mode:'full'}); await fit('Home dark');
    if(camera) await snap('home-dark-390');
    await draw({id:12,inputs:{}}); await page.getByRole('button',{name:'Reveal pay values'}).click();
    assert.equal(await page.getByRole('list',{name:'Share of gross pay'}).isVisible(),true);
    await page.getByRole('group',{name:'Completed pay period'}).getByRole('button').first().focus();
    assert.equal(await page.getByText('Net pay',{exact:true}).count(),0);
    await page.getByRole('button',{name:'Reveal pay values'}).click(); await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    assert.equal(await page.getByText('Net pay',{exact:true}).count(),0);
    await page.setViewportSize({width:640,height:420});
    await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
    for(let id=10;id<=18;id++){await draw({id,inputs:{},mode:'full'});await fit(`200% text #${id}`);}
    await draw({id:0,inputs:{}});await fit('200% text home');
    assert.deepEqual(errors,[]); assert.deepEqual(net,[]);
    console.log('HR browser proof passed: four local campaign images decoded; landing and nine tasks at 1280/390/320 px and 200% text; dark, reduced motion, keyboard date range, focus masking, retained leave review and no HTTP requests.');
  } finally { await context.close(); }
}
run().catch(e=>{ console.error(e); process.exitCode=1; }).finally(()=>{fs.rmSync(profile,{recursive:true,force:true});});
