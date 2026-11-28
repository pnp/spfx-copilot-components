const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { JSDOM, VirtualConsole } = require('jsdom');
const virtualConsole = new VirtualConsole().sendTo(console);
const runtimeErrors=[];virtualConsole.on('jsdomError',e=>runtimeErrors.push(e.message));
const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://localhost', pretendToBeVisual: true, virtualConsole });
global.window = dom.window; global.document = dom.window.document; global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;global.Event=dom.window.Event;global.CustomEvent=dom.window.CustomEvent;
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react'), { createRoot } = require('react-dom/client');
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  fileName: f, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
}).outputText, f);
require.extensions['.scss'] = module => { module.exports = {}; };
const HostFrame = require('../src/hosts/HostFrame.tsx').default;
const button = (node, label) => [...node.querySelectorAll('button')].find(el => (el.getAttribute('aria-label') || el.textContent).startsWith(label));
async function mount(initial) {
  const frame = document.createElement('iframe'); document.body.appendChild(frame);
  const doc = frame.contentDocument, target = doc.createElement('div'); doc.body.appendChild(target);
  let props = { entry: 9, mode: 'inline', document: doc, prefix: 'frame-', dark: false, parsed: { ok: true, inputs: { marketId: 'DE', period: 'current-quarter', channel: 'partner' } }, ...initial };
  const root = createRoot(target);
  const render = async change => { props = { ...props, ...change }; await React.act(async () => root.render(React.createElement(HostFrame, props))); };
  await render({});
  return { target, doc, render, click: async label => { const b = button(target, label); assert(b, `Missing ${label}`); await React.act(async () => b.click()); },
    close: async () => { await React.act(async () => root.unmount()); frame.remove(); assert.deepEqual(runtimeErrors,[],'The host frame emitted an uncaught DOM error'); } };
}
test('Copilot waits for host mode, preserves selection across theme change, and does not send passive chat', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-27T16:00:00Z') });
  const seen = []; let expands = 0;
  const h = await mount({ port: { publish: async s => seen.push(['context', s]), send: async s => { seen.push(['chat', s]); return {}; } },
    expand: async () => { expands++; return false; } });
  try {
    assert.match(h.target.textContent, /8 of 60/);
    await h.click('Expand'); assert.equal(expands, 1); assert.equal(h.target.querySelector('main').dataset.hubMode, 'inline');
    const channel = [...h.target.querySelectorAll('select')].find(el => [...el.options].some(o => o.value === 'inbound'));
    await React.act(async () => { channel.value = 'inbound'; channel.dispatchEvent(new h.doc.defaultView.Event('change', { bubbles: true })); });
    await h.render({ dark: true, mode: 'full' });
    assert.match(h.target.textContent, /12 of 40/);
    assert(h.doc.head.querySelector('style[data-make-styles-bucket],style[id]'), 'Fluent styles must reach the iframe document');
    const committed = seen.filter(e => e[0] === 'context').at(-1)[1];
    assert.equal(committed.structuredContent.mode, 'full'); assert.equal(committed.structuredContent.evidence.denominator, 40);
    assert(!seen.some(e => e[0] === 'chat'));
    await h.click('Discuss'); assert.equal(seen.filter(e => e[0] === 'chat').length, 1);
  } finally { await h.close(); }
});
test('two authored SharePoint instances expand locally and independently without chat', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-27T16:00:00Z') });
  const a = await mount({}), b = await mount({ prefix: 'frame-b-', parsed: { ok: true, inputs: { marketId: 'DE', channel: 'inbound' } } });
  try {
    await a.click('Expand');
    assert.equal(a.target.querySelector('main').dataset.hubMode, 'full'); assert.equal(b.target.querySelector('main').dataset.hubMode, 'inline');
    assert.match(a.target.textContent, /8 of 60/); assert.match(b.target.textContent, /12 of 40/);
    assert(!button(a.target, 'Discuss') && !button(b.target, 'Discuss')); await a.click('Back to page view');
    assert.equal(a.target.querySelector('main').dataset.hubMode, 'inline');
  } finally { await a.close(); await b.close(); }
});
test('changing host inputs keeps confirmed state, not the draft, and a second host sees neither', async () => {
  const settings = inputs => ({parsed:{ok:true,inputs}});
  const h=await mount({entry:2,...settings({storyId:'ST-01'})});
  const other=await mount({entry:2,...settings({topic:'Saved'}),prefix:'other-'});
  try {
    await h.click('Save for later'); await h.render(settings({topic:'Saved'}));
    assert.equal(h.target.querySelectorAll('ul[aria-label="Published stories"] li').length,1);
    assert.match(other.target.textContent,/No stories in this edition/);
    await h.render({entry:22,...settings({category:'Hardware'})});
    const textarea=h.target.querySelector('textarea'); assert(textarea);
    await React.act(async()=>{Object.getOwnPropertyDescriptor(h.doc.defaultView.HTMLTextAreaElement.prototype,'value').set.call(textarea,'A fictional display flickers after waking.');textarea.dispatchEvent(new h.doc.defaultView.Event('input',{bubbles:true}));});
    await h.click('Review ticket'); await h.click('Submit IT ticket');
    const id=[...h.target.querySelectorAll('dd')].map(e=>e.textContent).find(v=>/^IT-\d+$/.test(v)); assert(id,h.target.textContent);
    await h.render({entry:23,...settings({ticketId:id})}); assert.match(h.target.textContent,/fictional display flickers/);
    await other.render({entry:23,...settings({ticketId:id})}); assert.doesNotMatch(other.target.textContent,/fictional display flickers/);
    await h.render({entry:22,...settings({category:'Network'})}); assert.equal(h.target.querySelector('textarea').value,'');
  } finally {await h.close();await other.close();}
});
test('ledger year and guide step update the published view without disclosing balances or sending chat', async () => {
  const seen=[],sent=[],port={publish:async v=>seen.push(v),send:async v=>{sent.push(v);return {};}};
  const h=await mount({port,entry:14,parsed:{ok:true,inputs:{}}});
  try {
    await h.click('Next year'); assert.deepEqual(seen.at(-1).structuredContent.filters,{period:'next'});
    assert.doesNotMatch(JSON.stringify(seen.at(-1)),/annual|sick|days available/i);
    await h.render({entry:21,parsed:{ok:true,inputs:{guideId:'display-link'}}});
    await h.click('Next step');assert.deepEqual(seen.at(-1).structuredContent.progress,{current:2,total:3});
    assert.equal(seen.at(-1).structuredContent.filters.guideId,'display-link');assert.deepEqual(sent,[]);
    await h.render({parsed:{ok:false,field:'unsupported setting'}});
    assert.equal(seen.at(-1).structuredContent.stage,'unavailable');assert.equal(seen.at(-1).structuredContent.progress,undefined);
    assert.doesNotMatch(JSON.stringify(seen.at(-1)),/display-link/);assert.deepEqual(sent,[]);
  } finally {await h.close();}
});
