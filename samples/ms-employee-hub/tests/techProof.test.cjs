const test = require('node:test');
const assert = require('node:assert/strict');
const { service: api, session, mount, scopes } = require('./techHarness.cjs');
const draft = { deviceId: 'work-laptop', category: 'Hardware', guideId: 'display-link', description: 'Private description of a display issue.', impact: 'One device' };
const byCode = code => e => e.code === code;

test('ticket validation, immutable review, idempotent confirmation and scoped exact followup', () => {
  const s = session(); const originalCount = api.myTickets(s).length;
  for (const patch of [{ deviceId: 'unknown' }, { guideId: 'unknown' }, { description: ' ' }, { impact: 'Urgent' }, { description: 'My password=example, please reset' }])
    assert.throws(() => api.prepareTicket(s, { ...draft, ...patch }));
  const d = { ...draft }; const confirm = api.prepareTicket(s, d); d.description = 'Later edit';
  assert.equal(api.myTickets(s).length, originalCount);
  assert.throws(() => confirm(session()), byCode('denied'));
  const t = confirm(s); assert.equal(confirm(s).id, t.id); assert.equal(api.myTickets(s).length, originalCount + 1);
  assert.equal(api.ticket(s, t.id).thread[0].body, draft.description);
  assert.throws(() => api.ticket(session('other-employee', false, s.memory), t.id), byCode('unavailable'));
  assert.throws(() => api.ticket(session(), t.id), byCode('unavailable'));
});

test('only assigned independent reviewers can decide once against the reviewed revision', () => {
  const s = session('alex', true);
  const no = session('alex', false, s.memory);
  assert.throws(() => api.eligibleOrders(no), byCode('denied'));
  const item = api.eligibleOrders(s)[0];
  assert.throws(() => api.reviewOrder(s, 'EQ-4098'), byCode('self'));
  assert.throws(() => api.reviewOrder(s, 'EQ-4110'), byCode('denied'));
  assert.throws(() => api.reviewOrder(s, 'EQ-no-match'), byCode('unavailable'));
  assert.throws(() => api.prepareDecision(s, item.id, 0, 'Approve', 'Policy checked'), byCode('stale'));
  assert.throws(() => api.prepareDecision(s, item.id, 1, 'Approve', ' '), byCode('invalid'));
  const confirm = api.prepareDecision(s, item.id, item.revision, 'Request changes', 'Please clarify the workstation need.');
  assert.throws(() => confirm(no), byCode('denied'));
  assert.throws(() => confirm(session('different-lead', true, s.memory)), byCode('denied'));
  assert.equal(api.reviewOrder(s, item.id).status, 'Pending');
  assert.equal(confirm(s).status, 'Changes requested');
  assert.throws(() => confirm(s), byCode('decided'));
  assert.ok(!api.eligibleOrders(s).some(o => o.id === item.id));
});

test('ticket edit–review–edit survives expansion, publishes no prose and opens only the receipt', () => {
  const s = session(); const ui = mount(22, s, { deviceId: 'work-laptop', guideId: 'display-link' });
  try {
    ui.click('Review ticket'); assert.match(ui.el.querySelector('[role=alert]').textContent, /Description/);
    ui.field('What happened?', draft.description); ui.click('Review ticket'); assert.match(ui.text(), /Nothing has been submitted/);
    ui.draw({ mode: 'full' }); assert.match(ui.text(), /Case context/); assert.match(ui.text(), /v2.1/);
    ui.click('Edit ticket'); assert.equal(ui.el.querySelector('textarea').value, draft.description);
    ui.click('Review ticket'); ui.click('Submit IT ticket');
    const id = api.myTickets(s)[0].id; assert.match(ui.text(), /Ticket received/);
    ui.click('Track this ticket'); assert.ok(ui.text().includes(id)); assert.ok(ui.text().includes(draft.description));
    ui.draw({ session: session() }); assert.match(ui.text(), /unavailable in this session/); assert.ok(!ui.text().includes('IT-2048'));
    assert.ok(!JSON.stringify(scopes).includes(draft.description));
  } finally { ui.close(); }
});

test('manager sees evidence and can edit before confirmation; employee landing contains no manager queue', () => {
  const s = session('alex', true); const ui = mount(25, s, { requestId: 'EQ-4102' });
  const privateNote = 'Check existing workstation allocation.';
  try {
    assert.match(ui.text(), /One external display/);
    ui.field('Decision note', privateNote); ui.click('Request changes'); ui.click('Review decision');
    ui.draw({ mode: 'full' }); assert.match(ui.text(), /Fulfillment estimate/);
    ui.click('Edit decision'); assert.equal(ui.el.querySelector('textarea').value, privateNote);
    ui.click('Review decision'); ui.click('Confirm decision'); assert.match(ui.text(), /Decision recorded/);
    ui.click('Back to decision queue'); assert.ok(!ui.text().includes('EQ-4102'));
    ui.draw({ id: 0, inputs: {}, session: session() }); assert.match(ui.text(), /Less friction/); assert.match(ui.text(), /Active conversations/); assert.ok(!ui.text().includes('Decisions & delivery'));
    assert.ok(!JSON.stringify(scopes).includes(privateNote));
    ui.draw({ id: 25, inputs: { requestId: 'EQ-4102', reviewer: true } }); assert.match(ui.text(), /Access denied/); assert.ok(!ui.text().includes('Robin Lake'));
  } finally { ui.close(); }
});
