const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://localhost' });
global.window = dom.window;
global.document = dom.window.document;
global.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = require('react-dom/client');
const { act } = React;
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  });
  module._compile(outputText, filename);
};
const c = require('../src/shared/mockData/commercial.ts');
const Business = require('../src/shared/business/Business.tsx').default;
const { leadGeometry } = require('../src/shared/business/LeadReview.tsx');
const { ScopeReporter } = require('../src/hosts/VisibleScope.tsx');
const { snapshot } = require('../src/hosts/bridge.ts');
const session = () => ({ now: new Date('2026-11-27T16:00:00Z'), actor: { id: 'alice', displayName: 'Alex', commercial: true, planner: true, reviewer: false }, memory: new Map() });
const receiptFor = (...args) => c.recordAction(...args).receipt;
const rows = (s, period = 'current-quarter') => c.commercialMarkets(s, c.fiscalCut(s.now, period));
function harness(initial) {
  const node = document.createElement('div'); document.body.appendChild(node);
  const root = createRoot(node); let visible;
  let props = { session: session(), mode: 'inline', id: 9, inputs: {}, ...initial, navigate(id, inputs = {}) { render({ id, inputs }); } };
  function render(next = {}) {
    props = { ...props, ...next };
    act(() => root.render(React.createElement(ScopeReporter.Provider, { value: x => { visible = x; } }, React.createElement(Business, props))));
  }
  render();
  const button = text => Array.from(node.querySelectorAll('button')).find(b => b.textContent.includes(text));
  const field = label => Array.from(node.querySelectorAll('label')).find(el => el.textContent.includes(label))?.querySelector('select,input');
  return { node, render, button, field, props: () => props, visible: () => visible,
    click(text) { const b = button(text); assert.ok(b, text); act(() => b.click()); },
    change(label, value) { const el = field(label); assert.ok(el, label); act(() => { el.value = value; el.dispatchEvent(new window.Event('change', { bubbles: true })); }); },
    end() { act(() => root.unmount()); node.remove(); } };
}
test('every positive ribbon has one count scale; both stage cuts conserve the selected cohort', () => {
  const s = session();
  for (const period of ['current-quarter', 'previous-quarter']) for (const m of rows(s, period)) for (const channel of ['all', 'partner', 'inbound']) {
    const flow = c.leadFlow(m, channel), size = c.sum(m.leads[0]) + c.sum(m.leads[1]), geometry = leadGeometry(flow, 320, size);
    for (const key of ['qualified', 'unqualified']) {
      assert.equal(c.sum(flow.links.filter(l => l.to === key).map(l => l.count)), flow.counts[key]);
      assert.equal(c.sum(flow.links.filter(l => l.from === key).map(l => l.count)), flow.counts[key]);
    }
    assert.equal(flow.counts.qualified + flow.counts.unqualified, flow.total);
    assert.equal(c.sum(['opportunity', 'open', 'nurture', 'screened'].map(n => flow.counts[n])), flow.total);
    for (const r of geometry.ribbons) {
      assert.ok(Math.abs(r.height / flow.links.find(l => l.id === r.id).count - 91 / size) < 1e-10);
      assert.ok(!r.path.includes('NaN'));
    }
  }
  assert.equal(c.rate(0, 0), 'N/A');
});
test('keynote proof: channel, market, window and selected link update exact marks and visible scope; expand keeps selection', () => {
  const h = harness({ inputs: { marketId: 'DE', period: 'current-quarter', channel: 'partner' } });
  try {
    const shape = () => h.node.querySelector('path[aria-pressed=true]').getAttribute('d');
    const check = (n, d) => { assert.equal(h.visible().evidence.numerator, n); assert.equal(h.visible().evidence.denominator, d); assert.match(h.node.querySelector('h2').textContent, new RegExp(`${n} of ${d}`)); assert.ok(h.node.querySelector('table').textContent.includes(`${n}/${d}`)); };
    check(8, 60); const before = shape(); h.change('Acquisition channel', 'inbound'); check(12, 40); assert.notEqual(shape(), before);
    h.change('Reporting market', 'JP'); check(8, 25); h.change('Fiscal window', 'previous-quarter'); check(6, 21);
    h.change('Reporting market', 'DE'); h.change('Fiscal window', 'current-quarter'); h.change('Acquisition channel', 'all'); check(20, 100);
    h.click('Qualified → Qualified, open'); const selected = h.node.querySelector('path[aria-pressed=true]').getAttribute('aria-label');
    h.render({ mode: 'full' }); assert.equal(h.node.querySelector('path[aria-pressed=true]').getAttribute('aria-label'), selected); assert.equal(h.visible().evidence.selected, 'qualified:open');
    assert.ok(h.node.textContent.includes('8/60 · 13.3%')); assert.ok(h.node.textContent.includes('12/40 · 30.0%'));
    assert.equal(h.node.querySelector('details').open, true);
    h.change('Acquisition channel', 'partner'); assert.deepEqual(snapshot(h.visible(), 'full').structuredContent.evidence,
      { numerator: 16, denominator: 60, selected: 'qualified:open', unit: 'leads', asOf: '2026-11-26' });
    h.render({ inputs: { channel: 'inbound', marketId: 'DE' } }); check(12, 40);
    h.render({ inputs: { channel: 'unknown' } }); assert.equal(h.visible().stage, 'unavailable'); assert.equal(h.node.querySelector('svg'), null);
  } finally { h.end(); }
});
test('direct action requires evidence, eligible owner, checkpoint, review and explicit confirmation; repeated click records once', () => {
  const h = harness({ id: 6, inputs: { workstream: 'qualification', dueDate: '2026-12-04' } });
  try {
    assert.equal(c.receipts(h.props().session).length, 0); assert.equal(h.field('Accountable role'), undefined);
    h.click('Use this evidence'); h.click('Review action'); assert.match(h.node.querySelector('[role=alert]').textContent, /eligible accountable/);
    h.change('Accountable role', 'Partner Sales lead'); h.change('Review checkpoint', 'Compare the next like-aged cohort'); h.click('Review action');
    assert.equal(h.button('Record session action').disabled, true); h.click('Edit action'); assert.equal(h.field('Accountable role').value, 'Partner Sales lead');
    h.click('Review action'); h.render({ mode: 'full' }); assert.equal(h.visible().stage, 'review');
    act(() => h.node.querySelector('[type=checkbox]').click()); const btn = h.button('Record session action'); act(() => { btn.click(); btn.click(); });
    const rs = c.receipts(h.props().session); assert.equal(rs.length, 1); assert.equal(h.visible().stage, 'receipt'); assert.match(rs[0].evidence.citation, /8\/60 \(13\.3%\)/);
    assert.ok(h.node.textContent.includes('Awaiting checkpoint')); assert.equal(rs[0].fields.due, '2026-12-04');
    h.render({ id: 9, inputs: { channel: 'partner' } }); h.click('Prepare an investigation'); assert.equal(h.visible().stage, 'receipt'); assert.equal(c.receipts(h.props().session).length, 1);
  } finally { h.end(); }
});
test('keynote display inputs normalize to exact wire values without defaulting invalid values', () => {
  const h = harness({ inputs: { marketId: 'DE', channel: 'Partner' } });
  try {
    assert.match(h.node.querySelector('h2').textContent, /8 of 60/);
    h.render({ inputs: { marketId: ' Germany ', period: 'this quarter', channel: ' Inbound ' } });
    assert.match(h.node.querySelector('h2').textContent, /12 of 40/);
    assert.deepEqual(h.visible().filters, { marketId: 'DE', period: 'current-quarter', channel: 'inbound' });
    h.render({ inputs: { marketId: 'Germany', channel: 'All' } }); assert.match(h.node.querySelector('h2').textContent, /20 of 100/);
    for (const inputs of [{ marketId: 'DE?', channel: 'Partner' }, { marketId: 'DE', channel: 'Partners from Berlin' }, { period: 'next quarter' }]) {
      h.render({ inputs }); assert.equal(h.visible().stage, 'unavailable'); assert.equal(h.node.querySelector('svg'), null);
    }
  } finally { h.end(); }
});
test('Back restores the selected authorized ribbon, never an unavailable source', () => {
  const h = harness({ inputs: { marketId: 'DE', channel: 'inbound' }, restoredSelection: 'unqualified:nurture' });
  try {
    assert.deepEqual(h.visible().evidence, { numerator: 16, denominator: 40, unit: 'leads', selected: 'unqualified:nurture', asOf: '2026-11-26' });
    h.render({ id: 0 }); h.render({ id: 9, restoredSelection: 'partner:qualified' });
    assert.equal(h.visible().evidence.selected, 'qualified:opportunity'); assert.equal(h.visible().evidence.numerator, 12);
  } finally { h.end(); }
});
test('handoff is actor/session scoped, stale and mismatched evidence cannot record, receipt never mutates its cut', () => {
  const s = session(), ref = c.captureEvidence(s, 'DE', 'current-quarter', { kind: 'qualification', channel: 'partner', link: c.opportunityLink });
  const f = { evidenceId: ref.id, workstream: 'qualification', owner: 'Partner Sales lead', checkpoint: 'Compare the next like-aged cohort', due: '2026-12-04' };
  const other = { ...s, actor: { ...s.actor, id: 'other' } }, denied = { ...s, actor: { ...s.actor, commercial: false } };
  assert.equal(c.resolveEvidence(s, ref.id, 'JP'), undefined); assert.equal(c.resolveEvidence(s, ref.id, 'DE', 'previous-quarter'), undefined);
  for (const no of [other, { ...s, memory: new Map() }, denied, { ...s, actor: { ...s.actor, planner: false } }]) {
    assert.equal(receiptFor(no, f, true), undefined); assert.equal(c.resolveEvidence(no, ref.id), undefined); assert.equal(c.receipts(no).length, 0);
  }
  for (const value of ['2026-11-27', '2026-11-28', '2027-02-30', 'nonsense']) assert.equal(receiptFor(s, { ...f, due: value }, true), undefined);
  assert.equal(receiptFor(s, f, false), undefined);
  const r = receiptFor(s, f, true); assert.equal(receiptFor(s, f, true), r);
  s.now = new Date('2026-12-01T10:00:00Z'); assert.equal(c.resolveEvidence(s, ref.id), undefined); assert.equal(receiptFor(s, f, true), undefined);
  assert.equal(c.receipts(s)[0].evidence.asOf, '2026-11-26'); assert.equal(rows(denied).length, 0);
});
test('confirmation samples the injected clock once; DST leaves a UTC cut intact, midnight expires it without a write', () => {
  for (const [live, shouldRecord] of [['2026-03-29T03:30:00+02:00', true], ['2026-03-30T00:01:00Z', false]]) {
    let reads = 0;
    const s = { ...session(), now: new Date('2026-03-29T01:30:00+01:00'), clock: () => { reads++; return new Date(live); } };
    const h = harness({ session: s, id: 6, inputs: { dueDate: '2026-03-30' } });
    try {
      h.click('Use this evidence'); h.change('Accountable role', 'Partner Sales lead'); h.change('Review checkpoint', 'Compare the next like-aged cohort');
      h.click('Review action'); h.render({ mode: 'full' }); assert.equal(reads, 0);
      act(() => h.node.querySelector('[type=checkbox]').click()); h.click('Record session action');
      assert.equal(reads, 1); assert.equal(c.receipts(s).length, shouldRecord ? 1 : 0);
      if (shouldRecord) assert.equal(c.receipts(s)[0].at, new Date(live).toISOString());
      else { assert.equal(h.visible().stage, 'unavailable'); h.click('Select fresh evidence'); assert.match(h.node.querySelector('.slt-citation').textContent, /2026-03-29/); }
    } finally { h.end(); }
  }
});
test('denied, immature and zero-volume cuts never masquerade as zero conversion', () => {
  const s = session(), h = harness({ session: { ...s, actor: { ...s.actor, commercial: false } }, id: 0 });
  try {
    assert.equal(h.visible().stage, 'denied'); assert.ok(!h.node.textContent.includes('$28.0m'));
    h.render({ id: 6, session: { ...s, actor: { ...s.actor, planner: false } } }); assert.equal(h.visible().stage, 'denied');
    h.render({ id: 9, session: s, inputs: { marketId: 'AU', period: 'previous-quarter', channel: 'partner' } });
    assert.match(h.node.textContent, /N\/A, not 0%/); assert.equal(h.visible().evidence, undefined);
    h.render({ session: { ...s, now: new Date('2027-01-02T00:01:00Z') } }); assert.match(h.node.textContent, /immature batch/);
    for (const t of ['2026-11-27', '2027-02-26']) {
      const cut = c.fiscalCut(new Date(t), 'current-quarter'); assert.ok(cut.asOf < t && cut.priorAsOf < cut.asOf);
      assert.ok(cut.mature); assert.ok(cut.hasClose);
    }
  } finally { h.end(); }
});
test('regional totals and market contribution reconcile; selected region and keyboard-selected market survive expansion and drilldown', () => {
  const all = rows(session()); assert.deepEqual(c.bookings(all), { booked: 280, plan: 290, gap: -10, attainment: '96.6%' });
  assert.deepEqual(c.bookings(all.filter(m => m.region === 'EMEA')), { booked: 70, plan: 88, gap: -18, attainment: '79.5%' });
  const h = harness({ id: 8, inputs: { region: 'EMEA' } });
  try {
    assert.match(h.node.querySelector('h2').textContent, /EMEA: 79.5%/); h.click('Open EMEA markets');
    assert.equal(h.props().id, 3); assert.equal(h.field('Reporting market').options.length, 2);
    assert.match(h.node.querySelector('h2').textContent, /Germany.*\$1.6m below/);
    const gb = h.node.querySelector('svg [aria-label^="United Kingdom"]');
    act(() => gb.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    assert.equal(h.field('Reporting market').value, 'GB'); h.render({ mode: 'full' }); assert.equal(h.field('Reporting market').value, 'GB');
    assert.equal(h.node.querySelector('table tr[data-selected=true] th').textContent, 'United Kingdom'); h.click('Inspect lead conversion');
    assert.deepEqual(h.props().inputs, { marketId: 'GB', period: 'current-quarter', channel: 'all' });
    h.render({ id: 3, inputs: { region: 'EMEA', marketId: 'JP' } }); assert.equal(h.visible().stage, 'unavailable');
  } finally { h.end(); }
});
test('signed forecast bridge reconciles to the current estimate, not the target; exact driver opens its own evidence', () => {
  const { bridgeSteps } = require('../src/shared/business/ForecastReview.tsx');
  const m = rows(session()).find(m => m.id === 'DE'), f = c.forecast(m);
  assert.deepEqual(bridgeSteps(f).map(s => s.end), [60, 66, 68, 58, 56, 56]); assert.equal(f.current - f.prior, -4); assert.equal(f.current - f.target, -8);
  const h = harness({ id: 7, inputs: { marketId: 'DE', driver: 'slippage' } });
  try {
    assert.match(h.node.textContent, /−\$0\.4m vs prior cut/); assert.match(h.node.textContent, /−\$0\.8m vs \$6\.4m/);
    h.click('Expansion'); h.render({ mode: 'full' }); assert.equal(h.field('Forecast driver').value, 'expansion');
    h.click('Prepare a forecast review'); assert.equal(h.props().id, 6);
    assert.match(h.node.textContent, /Expansion: \+\$0\.2m.*\$6\.0m prior → \$5\.6m current/); assert.ok(!h.field('Accountable role').textContent.includes('Partner Sales'));
    h.render({ id: 7, inputs: { marketId: 'BR', period: 'previous-quarter' } }); assert.match(h.node.textContent, /missing opening estimate is not zero/); assert.equal(h.node.querySelector('svg'), null);
  } finally { h.end(); }
});
test('direct SLT landing follows the active market across evidence and never resumes an old chart route', () => {
  const h = harness({ id: 0, mode: 'full' });
  try {
    assert.equal(h.visible().entry, 30); assert.equal(h.visible().route, 'business/home');
    assert.equal(snapshot(h.visible(), 'full').structuredContent.route, 'business/home');
    assert.match(h.node.querySelector('.slt-lede').textContent, /Germany accounts for \$1\.6m of EMEA’s \$1\.8m shortfall/);
    assert.equal(h.node.querySelectorAll('svg .slt-marker').length, 7);
    assert.match(h.node.textContent,/Partner: 8\/60 \(13.3%\) · Inbound: 12\/40 \(30.0%\)/);
    h.click('Japan'); assert.match(h.node.textContent, /Inside Japan/); h.change('Acquisition channel','partner'); h.click('Not qualified → In nurture'); h.click('Trace the lead cohort');
    assert.equal(h.props().inputs.marketId, 'JP'); assert.match(h.node.querySelector('h2').textContent, /10 of 45/);
    assert.equal(h.visible().evidence.selected,'unqualified:nurture');
    h.render({ id: 0, inputs: {} }); assert.match(h.node.textContent, /Inside Germany/);
  } finally { h.end(); }
});
test('the operating brief carries the selected ribbon, market and dated baseline into an unrecorded action', () => {
  const h = harness({ id: 0, mode: 'full' });
  try {
    h.change('Acquisition channel','inbound'); h.click('Not qualified → In nurture');
    assert.match(h.node.querySelector('.slt-action-band').textContent,/Not qualified → In nurture, 16\/40 at day 14/);
    h.click('Prepare cited follow-up'); assert.equal(h.props().id,6);
    assert.match(h.node.querySelector('.slt-citation').textContent,/Inbound · Not qualified → In nurture: 16\/40 \(40.0%\)/);
    assert.equal(c.receipts(h.props().session).length,0);
  } finally { h.end(); }
});
