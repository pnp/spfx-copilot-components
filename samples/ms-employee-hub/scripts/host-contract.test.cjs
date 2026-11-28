const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const Module = require('node:module');
const path = require('node:path');
const source = buildSync({ stdin: { contents: "export * from './src/hosts/fields'; export * from './src/hosts/toolSchema'; export * from './src/hosts/bridge'; export * from './src/hosts/sizing'", resolveDir: path.resolve(__dirname,'..') },
  platform: 'node', bundle: true, format: 'cjs', write: false });
const suite = new Module(__filename);
suite._compile(source.outputFiles[0].text, __filename);
const { normalizeInputs, toolSchema, snapshot, BridgeQueue, watchSize } = suite.exports;
const catalog = require('../config/hub-catalog.json');

test('every advertised field produces a described optional portable schema', () => {
  for (const { id, fields } of catalog) {
    const schema = toolSchema(id, fields);
    assert.equal(schema.$schema, 'http://json-schema.org/draft-07/schema#');
    assert.deepEqual(Object.keys(schema.properties), fields);
    assert.equal(schema.required, undefined);
    assert.equal(schema.additionalProperties, false);
    for (const field of Object.values(schema.properties)) assert(field.description && field.type);
    assert.deepEqual(normalizeInputs(id, fields, {}), { ok: true, inputs: {} });
  }
});
test('scope preserves exact unknown IDs; invalid authority, dates, types and bounds are not defaults', () => {
  const parse = (id, data) => normalizeInputs(id, catalog.find(c => c.id === id).fields, data);
  assert.deepEqual(parse(9, { marketId: 'Germany', period: 'this quarter', channel: 'Partner' }).inputs, { marketId: 'DE', period: 'current-quarter', channel: 'partner' });
  assert.equal(parse(23, { ticketId: 'IT-9999' }).inputs.ticketId, 'IT-9999');
  assert.deepEqual(parse(15,{leaveType:'Sick'}).inputs,{leaveType:'sick'});
  for (const [id, input] of [[22, { deviceId: '' }], [25, { confirmed: true }], [4, { capacity: 25 }], [4, { durationMinutes: 17 }], [4, { accessible: 'false' }], [4, { date: '2028-02-31' }], [15, { startDate: '2027-01-08', endDate: '2027-01-03' }]]) assert.equal(parse(id, input).ok, false);
});
test('the 30 rehearsal invocations conform to the real host input contracts', () => {
  for (const {id, inputs} of require('../review/routing-cases.json')) {
    const row = catalog.find(c => c.id === id);
    assert.deepEqual(normalizeInputs(id, row.fields, inputs), { ok: true, inputs }, row.tool);
  }
});
test('privacy, exact count denominator, semantic dedupe and click ordering', async () => {
  const seen = []; const port = { publish: async v => seen.push(['context', v]), send: async text => { seen.push(['send', text]); return {}; } };
  const q = new BridgeQueue(port);
  const a = snapshot({ entry: 9, stage: 'information', filters: { channel: 'partner', marketId: 'DE', query: 'secret' }, evidence: { numerator: 8, denominator: 60, unit: 'leads' } }, 'inline');
  const b = snapshot({ entry: 9, stage: 'information', evidence: { numerator: 12, denominator: 40, unit: 'leads' } }, 'full');
  await q.passive(a); await q.passive(a); assert.equal(seen.length, 1);
  await Promise.all([q.discuss(a, 'secret'), q.passive(b), q.discuss(b, 'secret')]);
  assert.deepEqual(seen.map(x => x[0]), ['context', 'context', 'send', 'context']);
  assert.match(a.content[0].text, /8 of 60 leads/); assert.doesNotMatch(JSON.stringify(seen), /secret/);
  assert.doesNotMatch(JSON.stringify(snapshot({ entry: 12, stage: 'information', filters: { payPeriod: 'Private £4000' }, receipt: 'SECRET' }, 'full')), /Private|4000|SECRET/);
  assert.doesNotMatch(JSON.stringify(snapshot({entry:15,stage:'review',filters:{leaveType:'sick',startDate:'2026-11-30',note:'Private handoff'}},'inline')),/sick|2026-11-30|Private handoff/);
});
test('publication failure never sends; rejected vs unknown delivery and receipt scoping remain distinct', async () => {
  let sends = 0;
  const cut = snapshot({ entry: 22, stage: 'receipt', receipt: 'IT-2048' }, 'inline');
  const q = new BridgeQueue({ publish: async () => { throw Error('offline'); }, send: async () => { sends++; return {}; } });
  assert.equal(await q.discuss(cut, 'track-ticket'), 'not-published'); assert.equal(sends, 0);
  let unknown = false;
  const r = new BridgeQueue({ publish: async () => {}, send: async message => { assert.match(message, /TrackMyITTicket.*IT-2048/); if (unknown) throw Error(); return { isError: true }; } });
  assert.equal(await r.discuss(cut,'track-ticket'), 'rejected'); unknown = true;
  assert.equal(await r.discuss(cut,'track-ticket'), 'unknown'); r.dispose(); assert.equal(await r.discuss(cut,'track-ticket'), 'busy');
});
test('selected support flow and forecast keep their units, populations and privacy boundaries', () => {
  const cut = {priorUsd:5800000,currentUsd:5400000,movementUsd:-500000,priorCut:'2026-11-19',currentCut:'2026-11-26',privateText:'never serialize'};
  const forecast = snapshot({entry:7,stage:'selection',forecast:cut},'full').structuredContent.forecast;
  assert.equal(forecast.selectedDriverMovement,-500000);assert.equal(forecast.unit,'USD');assert(!('privateText' in forecast));
  assert.equal(snapshot({entry:12,stage:'information',forecast:cut},'inline').structuredContent.forecast,undefined);
  const e={numerator:6,denominator:24,sourceTotal:8,unit:'requests',selected:'procurement:Awaiting'};
  const flow=snapshot({entry:27,stage:'selection',evidence:e},'inline').structuredContent.evidence;
  assert.equal(flow.denominator,24);assert.equal(flow.sourceDenominator,8);
  assert.equal(snapshot({entry:27,stage:'denied',evidence:e},'full').structuredContent.evidence,undefined);
});
test('size reporter coalesces commits but reports growth, shrink, equal size, rejection/retry and teardown', async () => {
  const frames = new Map(), measured = []; let tick = 0, failure = 0, accept = true, height = 220, mutate;
  class MO { constructor(cb) { mutate = cb; } observe() {} disconnect() {} }
  const win = { MutationObserver: MO, requestAnimationFrame: cb => { frames.set(++tick, cb); return tick; }, cancelAnimationFrame: i => frames.delete(i), addEventListener() {}, removeEventListener() {} };
  const body = {getBoundingClientRect:()=>({width:350,height:height-50}),scrollWidth:350,get scrollHeight(){return height-50;}};
  const el = { ownerDocument: { defaultView: win }, querySelector() { return body; }, getBoundingClientRect: () => ({ width: 390, height }), scrollWidth: 390, get scrollHeight() { return height; }, addEventListener() {}, removeEventListener() {} };
  const observer = watchSize(el, async (w, h) => { assert.equal(w,390,'Sending the padded body width back to the host would progressively shrink the frame'); measured.push(h); return accept; }, () => { failure++; });
  const flush = async () => { for (const [n, cb] of [...frames]) { frames.delete(n); cb(); } await Promise.resolve(); };
  await flush(); height = 330; mutate(); mutate(); await flush(); height = 110; mutate(); await flush(); accept = false; mutate(); await flush(); accept = true; observer.schedule(); await flush(); observer.schedule(); observer.stop(); await flush();
  assert.deepEqual(measured, [220,330,110,110,110]); assert.equal(failure, 1);
});
test('only the authorized Business landing shares the selected market amounts and population',()=>{
  const data={bookings:{bookedUsd:3200000,planUsd:4800000,asOf:'2026-11-26'},filters:{marketId:'DE',channel:'partner'},evidence:{unit:'leads',numerator:8,denominator:60}};
  const home=(route,stage='information')=>snapshot({entry:30,stage,route,...data},'full').structuredContent;
  assert.deepEqual(home('business/home').bookings,{unit:'USD',asOf:'2026-11-26',booked:3200000,phasedPlan:4800000});
  assert.deepEqual(home('business/home').filters,data.filters);assert.deepEqual(home('business/home').evidence,data.evidence);
  for(const scope of [home('business/home','denied'),home('hr/home')]){assert.equal(scope.bookings,undefined);assert.equal(scope.evidence,undefined);}
});
