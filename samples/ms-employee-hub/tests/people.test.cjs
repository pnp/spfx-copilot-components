const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const browser = new JSDOM('<!doctype html><body></body>', {url: 'https://local.invalid'});
global.window = browser.window;
global.document = browser.window.document;
global.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react');
const {createRoot} = require('react-dom/client');
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (mod, file) => {
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {fileName: file, compilerOptions: {
    jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true
  }});
  mod._compile(result.outputText, file);
};
require.extensions['.scss'] = mod => { mod.exports = {root: 'hr-test'}; };
const h = require('../src/shared/mockData/people.ts');
const HR = require('../src/shared/hr/HR.tsx').default;
const {ScopeReporter} = require('../src/hosts/VisibleScope.tsx');
const {newSession, employeeFixture, rehearsalLead} = require('../src/shared/mockData/session.ts');
const instant = '2026-03-03T19:00:00Z';
const session = (actor = employeeFixture, now = instant) => newSession(actor, new Date(now));
const as = (s, id, reviewer) => ({...s, actor: {...s.actor, id, displayName: `Person ${id}`, reviewer}});
const ok = result => { assert.equal(result.ok, true, result.message); return result.value; };
const no = (result, message) => { assert.equal(result.ok, false); assert.match(result.message, message); };
const range = (start, end = start, type = 'annual') => ({start, end, type});
function mount(id, s = session(), inputs = {}, mode = 'inline') {
  const el = document.createElement('div'); document.body.appendChild(el);
  const root = createRoot(el), scopes = [];
  const report = v => { scopes.push(v); };
  let props = {id, inputs, session: s, mode, navigate: (next, args = {}) => draw({id: next, inputs: args})};
  function draw(patch = {}) {
    props = {...props, ...patch};
    React.act(() => root.render(React.createElement(ScopeReporter.Provider, {value: report}, React.createElement(HR, props))));
  }
  function button(label) {
    const b = [...el.querySelectorAll('button')].find(x => x.textContent.trim() === label);
    assert.ok(b, `Missing button ${label}`); return b;
  }
  function field(label) {
    const f = [...el.querySelectorAll('label')].find(x => x.firstChild?.textContent === label)?.querySelector('input,select,textarea');
    assert.ok(f, `Missing field ${label}`); return f;
  }
  draw();
  return {el, scopes, draw, button, field, text: () => el.textContent, stage: () => scopes[scopes.length - 1]?.stage,
    click(label) { React.act(() => button(label).click()); },
    change(label, value) { const f = field(label); React.act(() => {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(f), 'value').set.call(f, value);
      f.dispatchEvent(new window.Event(f.tagName === 'SELECT' ? 'change' : 'input', {bubbles: true}));
    }); },
    close() { React.act(() => root.unmount()); el.remove(); }};
}

test('calendar, previous completed statements, deadlines and vesting follow two clocks, Pacific midnight and DST', () => {
  for (const [at, day, latest] of [
    ['2027-01-01T07:59:59Z','2026-12-31','2026-11'],
    ['2027-01-01T08:00:00Z','2027-01-01','2026-12'],
    ['2026-03-08T10:01:00Z','2026-03-08','2026-02'],
    ['2026-11-01T09:05:00Z','2026-11-01','2026-10']
  ]) {
    const s = session(employeeFixture, at);
    assert.equal(h.today(s), day);
    assert.equal(h.statements(s)[0].period, latest);
    assert.ok(h.statements(s).every(r => r.published <= r.end && r.end < day));
    const dates = h.assignments(s).map(c => c.due); assert.ok(dates[0] < day && dates[1] > day);
    assert.ok(ok(h.benefitWindow(s, 'current')).close > day);
    const stock = ok(h.vesting(s, 'growth', '180d'));
    assert.ok(stock.close <= day && stock.tranches.every(t => t.date > day));
    const leave = h.defaultRange(s); assert.ok(ok(h.quoteLeave(s, {...leave, type: 'annual'})).days.length > 0);
  }
  assert.equal(h.dayKind('2027-12-31'), 'holiday'); // Saturday, Jan 1 observed on the previous Friday
  assert.equal(h.validDay('2026-02-29'), false);
  assert.equal(h.validDay('2028-02-29'), true);
  assert.equal(h.referenceClose(new Date('2026-03-09T19:59:59Z')).date, '2026-03-06');
  assert.equal(h.referenceClose(new Date('2026-03-09T20:00:00Z')).date, '2026-03-09');
});

test('financial lines reconcile in integer cents; periods, award and horizon are bounded', () => {
  const s = session(employeeFixture, '2027-01-11T18:00:00Z');
  for (const r of h.statements(s)) {
    const pay = ok(h.payLines(s, r.period));
    assert.equal(pay.gross, pay.earnings.reduce((n, [,c]) => n+c, 0));
    assert.equal(pay.net, pay.gross-pay.deductions.reduce((n, [,c]) => n+c, 0));
  }
  no(h.payLines(s, '2027-01'), /unavailable/);
  no(h.vesting(s, 'not-mine', '90d'), /available/);
  no(h.vesting(s, 'growth', '__proto__'), /available/);
  const quarter = ok(h.vesting(s, 'growth', '90d')), year = ok(h.vesting(s, 'growth', '1y'));
  assert.ok(quarter.tranches.length < year.tranches.length);
  assert.equal(year.unvested, year.tranches.reduce((n, v) => n + v.units, 0));
});

test('learning and benefits progress is scoped to the employee and window; due queue reacts to completing work', () => {
  const s = session(), other = as(s, 'other', false);
  const first = h.nextSteps(s)[0];
  assert.equal(first.id, 10); const id = first.inputs.courseId;
  assert.equal(h.recordChapter(s, id, 42), false);
  h.assignments(s).find(x => x.id === id).chapters.forEach((_, i) => assert.equal(h.recordChapter(s, id, i), true));
  assert.notEqual(h.nextSteps(s)[0].inputs.courseId, id);
  assert.equal(h.nextSteps(other)[0].inputs.courseId, id);
  h.benefitChecklist(s, 'health', 'current').forEach((_, i) => assert.equal(h.markBenefit(s, 'health', 'current', i, true), true));
  assert.ok(!h.nextSteps(s).some(x => x.id === 11));
  assert.deepEqual(h.benefitChecklist(s, 'health', 'next'), [false,false,false]);
  assert.deepEqual(h.benefitChecklist(other, 'health', 'current'), [false,false,false]);
  assert.equal(h.markBenefit(s, 'absent', 'current', 0, true), false);
});

test('leave projection excludes observed holidays and weekends, rejects malformed, past, oversized and overdrawn ranges', () => {
  const s = session(employeeFixture, '2026-06-25T18:00:00Z');
  const q = ok(h.quoteLeave(s, range('2026-07-02','2026-07-06')));
  assert.deepEqual(q.days, ['2026-07-02','2026-07-06']);
  assert.deepEqual(q.holidays, ['2026-07-03']); assert.equal(q.weekends, 2);
  assert.equal(q.after, q.ledger.available - 2);
  for (const [d, error] of [
    [range('2026-06-31'), /valid/], [range('2026-06-25'), /after today/], [range('2026-07-06','2026-07-01'), /end date/],
    [range('2026-07-03','2026-07-05'), /only weekends/], [range('2026-07-02','2026-08-03'), /31 calendar/],
    [range('2027-07-02'), /365/], [range('2026-12-31','2027-01-04'), /calendar year/],
    [range('2026-07-06','2026-07-13','personal'), /exceeds/], [range('2026-07-06', '2026-07-06','unknown'), /annual leave/]
  ]) no(h.quoteLeave(s, d), error);
  no(h.balance(s, 'unknown', 'next'), /type/); no(h.balance(s, 'annual', 'future'), /year/);
});

test('confirmation rechecks actor, date, cumulative entitlement and overlap; retry once and never shift a receipt', () => {
  const s = session(), manager = as(s, h.peopleSource.reviewerId, true);
  const d = range('2026-03-09','2026-03-10'), q = ok(h.quoteLeave(s, d)), later = ok(h.quoteLeave(s, range('2026-03-12')));
  no(h.submitLeave(manager, q, 'wrong'), /different employee/);
  no(h.submitLeave({...s, now: new Date('2026-03-04T20:00:00Z')}, q, 'stale'), /changed/);
  const receipt = ok(h.submitLeave(s, q, 'confirm'));
  assert.equal(ok(h.submitLeave(s, q, 'confirm')), receipt);
  no(h.quoteLeave(s, range('2026-03-10','2026-03-11','personal')), /already/);
  no(h.submitLeave(s, later, 'changed-balance'), /balance has changed/);
  assert.equal(ok(h.balance(s, 'annual', 'current')).pending, 2);
  const differentYear = {...manager, now:new Date('2027-01-07T22:00:00Z')};
  assert.deepEqual(ok(h.reviewEvidence(differentYear, receipt)).row.days, q.days);
  assert.equal(ok(h.balance(session(), 'annual', 'current')).pending, 0);
});

test('team data and decisions require trusted identity plus role and exact assignment; self-review is blocked', () => {
  const mgr = session(rehearsalLead), employee = as(mgr, 'employee', false), impostor = as(mgr, 'someone', true), ops = as(mgr, 'operations-reviewer', true);
  for (const actor of [employee, impostor, as(mgr, h.peopleSource.reviewerId, false)]) {
    no(h.reviewQueue(actor, 'all'), /assigned/);
    no(h.coverage(actor, 'studio', 'next'), /scope/);
    no(h.decideLeave(actor, 'TA-101', 1, 'approved', 'Coverage checked.', 'x'), /unavailable/);
  }
  no(h.reviewEvidence(mgr, 'TA-103'), /unavailable/);
  no(h.reviewEvidence(ops, 'TA-101'), /unavailable/);
  no(h.coverage(mgr, 'operations', 'next'), /scope/);
  no(h.coverage(mgr, 'studio', '2020-03-10'), /next year/);
  const own = ok(h.submitLeave(mgr, ok(h.quoteLeave(mgr, range('2026-03-12'))), 'submit'));
  assert.ok(!ok(h.reviewQueue(mgr, 'all')).some(x => x.id === own));
  no(h.decideLeave(mgr, own, 1, 'approved', 'Approve my own time.', 'self'), /unavailable/);
  assert.equal(ok(h.reviewEvidence(ops, own)).row.employeeId, mgr.actor.id);
  const week = ok(h.coverage(mgr, 'studio', 'next'));
  assert.equal(week.length,5); assert.ok(week.some(d => d.band === 'Cover needed'));
  assert.doesNotMatch(JSON.stringify(week), /Maya|Theo|employeeId|reason/);
});

test('assigned decisions recheck revision and status, move pending days exactly once and separate receipts from history', () => {
  const s = session(rehearsalLead), person = as(s, 'maya', false);
  const before = ok(h.balance(person, 'annual', 'current'));
  no(h.decideLeave(s, 'TA-101', 1, 'anything', 'Scoped coverage check.', 'a'), /approve or decline/);
  no(h.decideLeave(s, 'TA-101', 1, 'approved', 'x', 'b'), /5–240/);
  no(h.decideLeave(s, 'TA-101', 2, 'approved', 'Reviewed capacity.', 'c'), /revision/);
  const receipt = ok(h.decideLeave(s, 'TA-101', 1, 'approved', 'Cover arranged.', 'yes'));
  assert.equal(ok(h.decideLeave(s, 'TA-101', 1, 'approved', 'Cover arranged.', 'yes')), receipt);
  no(h.decideLeave(s, 'TA-101', 1, 'declined', 'Check again.', 'd'), /revision/);
  no(h.decideLeave(s, 'TA-101', 2, 'declined', 'Check again.', 'd2'), /already/);
  const after = ok(h.balance(person, 'annual', 'current')); assert.equal(after.pending, before.pending-1); assert.equal(after.booked, before.booked+1); assert.equal(after.available,before.available);
  const late = session(rehearsalLead); ok(h.reviewEvidence(late, 'TA-101')); late.now = new Date('2026-04-04T19:00:00Z');
  no(h.decideLeave(late, 'TA-101',1,'approved','Check again.','late'), /no longer upcoming/);
  const declined = session(rehearsalLead); ok(h.decideLeave(declined,'TA-101',1,'declined','Additional coverage needed.','no'));
  assert.equal(ok(h.balance(as(declined,'maya',false),'annual','current')).available, before.available+1);
});

test('HR case validates content, category and recipient; receipt retains neither subject nor body', () => {
  const s = session(), draft = {category: 'benefits', channel: 'specialist', subject: 'Fictional subject', body: 'A fictional private question.'};
  for (const item of [{category: '__proto__'}, {channel:'foo'}, {subject:'x'}, {subject:'x'.repeat(101)}, {body:'short'}, {body:'x'.repeat(1201)}]) {
    no(h.submitCase(s, {...draft,...item}, 'invalid'), /Choose|Write/);
  }
  const first = ok(h.submitCase(s, draft, 'confirm'));
  assert.deepEqual(ok(h.submitCase(s, draft, 'confirm')), first);
  assert.doesNotMatch(JSON.stringify([...s.memory.values()]), /Fictional subject|fictional private question/);
  assert.notEqual(ok(h.submitCase(as(s, 'other', false), draft, 'confirm')).id, first.id);
});

test('personal home has accessible campaign photography, deadline ordering and masked financial landing; only scoped managers see the lens', () => {
  const a = mount(0, session(), {}, 'full');
  assert.equal(a.el.querySelectorAll('main').length, 0);
  assert.equal(a.el.querySelectorAll('[role=tab]').length, 5);
  assert.match(a.el.querySelector('.hrw-campaign [role=img]').getAttribute('aria-label'), /Campaign photography/);
  assert.doesNotMatch(a.text(), /\$\d|Assigned reviewer lens/);
  a.click('Open my next step →'); assert.match(a.text(), /Your learning path/); a.close();
  const m = mount(0, session(rehearsalLead), {}, 'full'); assert.match(m.text(), /Assigned reviewer lens/); m.close();
});

test('pay and awards are masked in DOM and scope, and re-mask on focus loss, mode switch, period change and re-entry', () => {
  const a = mount(12);
  const masked = () => { assert.match(a.text(), /Values hidden/); assert.doesNotMatch(a.text(), /\$\d|Net pay/); };
  masked(); a.click('Reveal pay values'); assert.match(a.text(), /Net pay/);
  React.act(() => window.dispatchEvent(new window.Event('blur'))); masked();
  a.click('Reveal pay values'); a.draw({mode: 'full'}); masked();
  a.click('Reveal pay values'); a.click('Jan 2026'); masked();
  a.click('Reveal pay values'); a.click('View vesting instead'); masked();
  a.click('Reveal award values'); assert.match(a.text(), /Unvested estimate/);
  a.click('One year'); masked();
  a.click('Reveal award values'); a.click('View pay statements'); masked();
  a.click('Reveal pay values'); a.draw({session:session()}); masked();
  assert.deepEqual(Object.keys(a.scopes[a.scopes.length - 1]).sort(), ['entry','stage']);
  assert.doesNotMatch(JSON.stringify(a.scopes), /560|40000|Earnings|award/i); a.close();
});

test('leave date edit and review survive expansion, confirmation changes the ledger, new input scope starts fresh', () => {
  const s = session(), a = mount(15, s, {startDate:'2026-03-12',endDate:'2026-03-12'});
  a.change('End date','2026-03-13'); assert.match(a.text(), /2 eligible workdays/);
  a.click('Review request'); assert.equal(a.stage(),'review'); assert.equal(ok(h.balance(s,'annual','current')).pending,0);
  a.draw({mode:'full'}); assert.equal(a.stage(),'review'); assert.match(a.text(), /Entitlement ledger/);
  a.click('Edit dates'); assert.equal(a.field('End date').value,'2026-03-13');
  a.click('Review request'); a.click('Confirm time-off request'); assert.equal(a.stage(),'receipt');
  a.click('See updated ledger'); assert.match(a.text(), /18 days available/);
  a.draw({id:15,inputs:{startDate:'2026-03-17',endDate:'2026-03-17'}});
  assert.equal(a.stage(),'draft'); assert.equal(a.field('Start date').value,'2026-03-17'); a.close();
});

test('time off starts with personal history and only confirmed requests reach the employee and assigned reviewer', () => {
  const s=session(), a=mount(15,s), list=()=>a.el.querySelector('ul[aria-label="Your submitted time-off requests"]');
  assert.equal(list().children.length,3); assert.doesNotMatch(list().textContent,/TA-101|TA-104/);
  a.click('Request new time off'); a.click('Sick leave'); a.change('Start date','2026-03-11'); a.change('End date','2026-03-11');
  a.change('Note for your manager (optional)','Shift handoff arranged.'); a.click('Review request'); assert.match(a.text(),/Alex · People manager/);
  a.draw({mode:'full'}); a.click('Edit dates'); assert.equal(a.field('Note for your manager (optional)').value,'Shift handoff arranged.');
  a.click('Review request'); a.click('Confirm time-off request'); const id=h.myTimeAway(s)[0].id; a.click('View submitted requests');
  assert.match(list().firstChild.textContent,new RegExp(id)); assert.match(list().firstChild.textContent,/Sick leave.*Pending approval/);
  assert.doesNotMatch(list().textContent+JSON.stringify(a.scopes),/Shift handoff/); assert.equal(h.myTimeAway(as(s,'other',false)).length,0);
  const mgr=as(s,h.peopleSource.reviewerId,true); assert.equal(ok(h.reviewEvidence(mgr,id)).note,'Shift handoff arranged.');
  assert.doesNotMatch(JSON.stringify(ok(h.reviewQueue(mgr,'all'))),/Shift handoff/);no(h.reviewEvidence(as(s,'other',true),id),/unavailable/);
  a.click('Request new time off');assert.equal(a.field('Note for your manager (optional)').value,'');a.close();
});

test('live Pacific midnight returns a leave review to its unchanged dates; only a fresh review can confirm', () => {
  const s = session(employeeFixture,'2026-03-08T07:59:59Z');
  let now = s.now; s.clock=()=>now;
  const a = mount(15,s,{startDate:'2026-03-12',endDate:'2026-03-13'});
  a.click('Review request'); assert.equal(a.stage(),'review');
  now=new Date('2026-03-08T08:00:00Z'); // Mar 7 → Mar 8 in the Pacific fixture
  a.click('Confirm time-off request');
  assert.equal(a.stage(),'draft'); assert.match(a.text(), /Pacific work date has changed.*review the updated calculation/);
  assert.equal(a.field('Start date').value,'2026-03-12');assert.equal(a.field('End date').value,'2026-03-13');
  assert.equal(ok(h.balance(s,'annual','current')).pending,0); assert.equal(h.today(s),'2026-03-07');
  a.click('Review request'); a.click('Confirm time-off request');assert.equal(a.stage(),'receipt');
  assert.equal(ok(h.balance(s,'annual','current')).pending,2);a.close();

  const z = session(employeeFixture,'2026-03-10T06:59:59Z'), q=ok(h.quoteLeave(z,range('2026-03-10')));
  z.clock=()=>new Date('2026-03-10T07:00:00Z');
  no(h.submitLeave(z,q,'expired'),/after today.*Edit your dates and review again/);
  assert.equal(ok(h.balance(z,'annual','current')).pending,0);
});

test('learning chapters, benefits checklist, coverage day and decision stages are operable', () => {
  const s = session(rehearsalLead), a = mount(10,s,{courseId:'data-care',dueBand:'next7'});
  a.click('Mark section reviewed'); assert.match(a.text(),/1 of 2 sections reviewed/);
  a.click('Next section'); a.draw({mode:'full'}); assert.match(a.text(),/The approved|Use the approved/);
  a.draw({id:11,inputs:{topic:'future',window:'next'}}); const checkbox = a.el.querySelector('input[type=checkbox]');
  React.act(() => checkbox.click()); assert.match(a.text(),/1 of 3 prepared/);
  a.draw({id:16,inputs:{teamId:'studio',week:'next'}}); assert.match(a.text(),/Cover needed/); assert.equal(a.el.querySelectorAll('tbody tr').length,5);
  a.click('Open assigned decisions'); assert.equal(a.stage(),'selection');
  const row=()=>[...a.el.querySelectorAll('.hrw-review-row')].find(b=>b.textContent.includes('TA-101'));
  assert.match(row().textContent,/Maya Reed.*Pending/); assert.ok(row().querySelector('[data-photo=true]'));
  React.act(()=>row().click());a.click('Review decision'); assert.match(a.text(), /Choose approve or decline/);
  a.click('Decline'); a.change('Decision note','Coverage is short on Tuesday.'); a.click('Review decision'); assert.equal(a.stage(),'review');
  assert.equal(ok(h.reviewEvidence(s,'TA-101')).row.status,'pending');
  a.click('Confirm decision'); assert.equal(a.stage(),'receipt');
  assert.equal(ok(h.reviewEvidence(s,'TA-101')).row.status,'declined');
  assert.doesNotMatch(JSON.stringify(a.scopes), /Coverage is short|Maya/);
  assert.match(row().textContent,/Maya Reed.*Declined/);a.click('Pending (2)');assert.equal(row(),undefined);assert.match(a.text(),/Jo Ellis/);a.close();
});

test('private question retains edits through expansion, requires review and confirm, and never reaches scope or persistent storage', () => {
  const a = mount(18, session(), {category:'pay'});
  a.click('Review recipient & message'); assert.match(a.text(), /5–100/);
  a.change('Subject','Fictional subject'); a.change('Private question','My fictional question about timing.');
  a.draw({mode:'full'}); assert.equal(a.field('Private question').value,'My fictional question about timing.');
  a.click('Review recipient & message'); assert.equal(a.stage(),'review'); assert.match(a.text(),/People adviser/);
  a.click('Edit message'); assert.equal(a.field('Subject').value,'Fictional subject');
  a.click('Review recipient & message'); a.click('Confirm private case'); assert.equal(a.stage(),'receipt');
  assert.doesNotMatch(a.text()+JSON.stringify(a.scopes),/Fictional subject|fictional question about timing/);
  assert.equal(window.localStorage.length+window.sessionStorage.length,0); a.close();
});

test('a concurrent decision cannot overwrite the current revision; the reviewer can reopen the updated record', () => {
  const s = session(rehearsalLead), a = mount(17,s,{requestId:'TA-101'});
  a.click('Approve'); a.change('Decision note','Independent cover checked.'); a.click('Review decision');
  ok(h.decideLeave(s, 'TA-101', 1, 'declined', 'Cover is not available.', 'other-view'));
  a.click('Confirm decision');
  assert.match(a.text(), /revision has changed/); assert.equal(ok(h.reviewEvidence(s,'TA-101')).row.status,'declined');
  a.click('Reopen current revision'); assert.equal(a.stage(),'selection'); assert.match(a.text(), /Revision 2 · declined/);
  a.close();
});

test('a live reviewer must reconsider the same request after Pacific midnight, without losing the decision note', () => {
  const s = session(rehearsalLead,'2026-03-08T07:59:59Z'); let now=s.now; s.clock=()=>now;
  const a=mount(17,s,{requestId:'TA-101'});
  a.click('Approve');a.change('Decision note','Cover remains available.');a.click('Review decision');
  now=new Date('2026-03-08T08:00:00Z');a.click('Confirm decision');
  assert.match(a.text(),/Pacific work date has changed/);assert.equal(a.field('Decision note').value,'Cover remains available.');
  assert.equal(ok(h.reviewEvidence(s,'TA-101')).row.revision,1);
  a.click('Review decision');a.click('Confirm decision');assert.equal(a.stage(),'receipt');
  assert.equal(ok(h.reviewEvidence(s,'TA-101')).row.revision,2);a.close();
});

test('invalid input or unassigned review shows a recoverable empty/denied state, not another employee’s data', () => {
  for (const [id, args, expected] of [[10,{courseId:'absent'},/No matching assignment/],[11,{topic:'absent'},/No matching preparation/],
    [12,{payPeriod:'not-real'},/not available/],[13,{awardId:'absent'},/available award/],[14,{period:'not-real'},/calendar year/],
    [16,{teamId:'operations'},/not in your assigned scope/],[17,{requestId:'TA-103'},/No matching request/]]) {
    const a=mount(id, session(rehearsalLead), args); assert.match(a.text(),expected); assert.doesNotMatch(a.text(),/Ren Park/); a.close();
  }
  const denied=mount(17,session(),{requestId:'TA-101',reviewer:true});
  assert.equal(denied.stage(),'denied'); assert.doesNotMatch(denied.text(),/Maya|TA-101/); denied.close();
});
